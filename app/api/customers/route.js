import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: true, count: 0, customers: [] });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || searchParams.get("query");
    const phone = searchParams.get("phone");
    const salesmanId = searchParams.get("salesmanId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let filter = { isActive: { $ne: false } };

    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const digitsToMatch = cleanPhone.length >= 7 ? cleanPhone.slice(-7) : cleanPhone;
      const regexPattern = digitsToMatch.split("").join("[\\s\\-\\.]*");
      filter.phone = new RegExp(regexPattern, "i");
    } else if (search && search.trim() !== "") {
      const q = search.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const reg = new RegExp(escaped, "i");

      // Also clean digits if user entered phone digits
      const digits = q.replace(/[^0-9]/g, "");
      const phoneCond =
        digits.length >= 3
          ? [{ phone: new RegExp(digits.split("").join("[\\s\\-\\.]*"), "i") }]
          : [{ phone: reg }];

      filter.$or = [
        { shopName: reg },
        { shopkeeperName: reg },
        { area: reg },
        ...phoneCond,
      ];
    }

    if (salesmanId && salesmanId !== "All") {
      filter.salesmanId = salesmanId;
    }

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Enrich each customer with their real-time pending udhaar from Orders & openingBalance
    const enriched = await Promise.all(
      customers.map(async (c) => {
        const rawDigits = (c.phone || "").replace(/[^0-9]/g, "");
        const digitsToMatch = rawDigits.length >= 7 ? rawDigits.slice(-7) : rawDigits;
        const phoneRegex = digitsToMatch
          ? new RegExp(digitsToMatch.split("").join("[\\s\\-\\.]*"), "i")
          : null;

        let pendingOrdersTotal = 0;
        let pendingOrdersCount = 0;

        if (phoneRegex) {
          const pendingOrders = await Order.find({
            phone: phoneRegex,
            remainingBalance: { $gt: 0 },
            $or: [
              { settledInOrder: null },
              { settledInOrder: { $exists: false } },
              { settledInOrder: "" },
            ],
          })
            .select("remainingBalance invoiceNo date")
            .lean();

          pendingOrdersTotal = pendingOrders.reduce(
            (sum, o) => sum + (Number(o.remainingBalance) || 0),
            0
          );
          pendingOrdersCount = pendingOrders.length;
        }

        const openingBal = Number(c.openingBalance) || 0;
        const totalPendingUdhaar = pendingOrdersTotal + openingBal;

        return {
          id: c._id.toString(),
          _id: c._id.toString(),
          shopName: c.shopName,
          shopkeeperName: c.shopkeeperName || "Customer",
          phone: c.phone,
          area: c.area || "",
          openingBalance: openingBal,
          salesmanId: c.salesmanId ? c.salesmanId.toString() : null,
          salesmanName: c.salesmanName || "",
          notes: c.notes || "",
          pendingUdhaar: totalPendingUdhaar,
          pendingOrdersTotal,
          pendingOrdersCount,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: enriched.length,
      customers: enriched,
    });
  } catch (error) {
    console.error("GET Customers Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const conn = await connectDB();

    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected. Please check MONGODB_URI." },
        { status: 503 }
      );
    }

    if (!data.shopName || !data.shopName.trim()) {
      return NextResponse.json(
        { success: false, error: "Shop Name (Dukan ka Naam) is required." },
        { status: 400 }
      );
    }

    if (!data.phone || !data.phone.trim()) {
      return NextResponse.json(
        { success: false, error: "Phone number is required." },
        { status: 400 }
      );
    }

    const cleanPhone = data.phone.trim();

    // Check if customer with this exact phone already exists
    const existing = await Customer.findOne({ phone: cleanPhone, isActive: { $ne: false } });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Customer with phone ${cleanPhone} already exists (${existing.shopName}).`,
        },
        { status: 400 }
      );
    }

    const newCustomer = await Customer.create({
      shopName: data.shopName.trim(),
      shopkeeperName: data.shopkeeperName?.trim() || "Customer",
      phone: cleanPhone,
      area: data.area?.trim() || "Market Route",
      openingBalance: Number(data.openingBalance) || 0,
      salesmanId: data.salesmanId && mongoose.Types.ObjectId.isValid(data.salesmanId) ? data.salesmanId : null,
      salesmanName: data.salesmanName?.trim() || "",
      notes: data.notes?.trim() || "",
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: newCustomer._id.toString(),
        _id: newCustomer._id.toString(),
        shopName: newCustomer.shopName,
        shopkeeperName: newCustomer.shopkeeperName,
        phone: newCustomer.phone,
        area: newCustomer.area,
        openingBalance: newCustomer.openingBalance,
        salesmanId: newCustomer.salesmanId ? newCustomer.salesmanId.toString() : null,
        salesmanName: newCustomer.salesmanName,
        notes: newCustomer.notes,
        pendingUdhaar: newCustomer.openingBalance,
        pendingOrdersCount: 0,
      },
    });
  } catch (error) {
    console.error("POST Customer Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const data = await req.json();
    const conn = await connectDB();

    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const id = data.id || data._id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid Customer ID." }, { status: 400 });
    }

    const updateFields = {};
    if (data.shopName !== undefined) updateFields.shopName = data.shopName.trim();
    if (data.shopkeeperName !== undefined) updateFields.shopkeeperName = data.shopkeeperName.trim();
    if (data.phone !== undefined) updateFields.phone = data.phone.trim();
    if (data.area !== undefined) updateFields.area = data.area.trim();
    if (data.openingBalance !== undefined) updateFields.openingBalance = Number(data.openingBalance) || 0;
    if (data.salesmanId !== undefined) {
      updateFields.salesmanId = data.salesmanId && mongoose.Types.ObjectId.isValid(data.salesmanId) ? data.salesmanId : null;
    }
    if (data.salesmanName !== undefined) updateFields.salesmanName = data.salesmanName.trim();
    if (data.notes !== undefined) updateFields.notes = data.notes;
    if (data.isActive !== undefined) updateFields.isActive = data.isActive;

    const updated = await Customer.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: updated._id.toString(),
        _id: updated._id.toString(),
        shopName: updated.shopName,
        shopkeeperName: updated.shopkeeperName,
        phone: updated.phone,
        area: updated.area,
        openingBalance: updated.openingBalance,
        salesmanId: updated.salesmanId ? updated.salesmanId.toString() : null,
        salesmanName: updated.salesmanName,
        notes: updated.notes,
      },
    });
  } catch (error) {
    console.error("PUT Customer Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid Customer ID." }, { status: 400 });
    }

    await Customer.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Customer removed successfully." });
  } catch (error) {
    console.error("DELETE Customer Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
