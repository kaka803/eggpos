import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import Customer from "@/models/Customer";
import mongoose from "mongoose";

const EGGS_PER_PETI = 360;

function resolveDateFilter(dateFilter, startDate, endDate, specificDate) {
  if (specificDate) {
    return { date: specificDate };
  }

  if (!dateFilter || dateFilter === "all") {
    return null;
  }

  const now = new Date();
  const formatYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYMD(now);

  if (dateFilter === "today") {
    return { date: todayStr };
  }

  if (dateFilter === "yesterday") {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    return { date: formatYMD(yest) };
  }

  if (dateFilter === "this_week" || dateFilter === "week" || dateFilter === "last_7_days") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);
    return { date: { $gte: formatYMD(weekAgo), $lte: todayStr } };
  }

  if (dateFilter === "this_month" || dateFilter === "month") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { date: { $gte: formatYMD(firstDay), $lte: todayStr } };
  }

  if (dateFilter === "custom" && startDate) {
    if (endDate) {
      return { date: { $gte: startDate, $lte: endDate } };
    }
    return { date: startDate };
  }

  return null;
}

export async function GET(req) {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: true, count: 0, orders: [] });
    }

    const { searchParams } = new URL(req.url);
    const salesmanId = searchParams.get("salesmanId");
    const status = searchParams.get("status");
    const query = searchParams.get("search");
    const dateFilter = searchParams.get("dateFilter"); // 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom' | 'all'
    const specificDate = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");
    const summary = searchParams.get("summary") === "true";

    // Support phone-based lookup for previous pending udhaar
    const pendingPhone = searchParams.get("pendingUdhaarPhone");
    if (pendingPhone) {
      const rawDigits = pendingPhone.replace(/[^0-9]/g, "");
      const digitsToMatch = rawDigits.length >= 7 ? rawDigits.slice(-7) : rawDigits;
      const regexPattern = digitsToMatch.split("").join("[\\s\\-\\.]*");
      const phoneRegex = new RegExp(regexPattern, "i");

      // Check registered Customer profile
      let registeredCust = null;
      try {
        registeredCust = await Customer.findOne({
          phone: phoneRegex,
          isActive: { $ne: false },
        }).lean();
      } catch (err) {
        console.warn("Customer lookup error:", err);
      }

      const pendingOrders = await Order.find({
        phone: phoneRegex,
        remainingBalance: { $gt: 0 },
        $or: [
          { settledInOrder: null },
          { settledInOrder: { $exists: false } },
          { settledInOrder: "" },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();

      const ordersPendingTotal = pendingOrders.reduce(
        (sum, o) => sum + (Number(o.remainingBalance) || 0),
        0
      );

      const openingBal = registeredCust ? Number(registeredCust.openingBalance) || 0 : 0;
      const totalPendingUdhaar = ordersPendingTotal + openingBal;

      const latestOrder = await Order.findOne({ phone: phoneRegex })
        .sort({ createdAt: -1 })
        .lean();

      const mappedOrders = pendingOrders.map((o) => ({
        id: o.invoiceNo || o._id.toString(),
        invoiceNo: o.invoiceNo,
        date: o.date,
        time: o.time,
        shopName: o.shopName,
        shopkeeperName: o.shopkeeperName,
        petis: o.petis,
        netEggs: o.netEggs || o.grossEggs,
        currentSaleAmount: o.currentSaleAmount || (o.totalAmount - (o.previousBalance || 0)),
        totalAmount: o.totalAmount,
        paidAmount: o.paidAmount,
        remainingBalance: o.remainingBalance,
        paymentStatus: o.paymentStatus,
      }));

      // If customer has an initial opening udhaar balance, prepend it as an invoice item
      if (openingBal > 0) {
        mappedOrders.unshift({
          id: "OPENING",
          invoiceNo: "OPENING",
          date: registeredCust.createdAt
            ? new Date(registeredCust.createdAt).toISOString().split("T")[0]
            : "Opening",
          time: "Baqaya",
          shopName: registeredCust.shopName,
          shopkeeperName: registeredCust.shopkeeperName,
          petis: 0,
          netEggs: 0,
          currentSaleAmount: openingBal,
          totalAmount: openingBal,
          paidAmount: 0,
          remainingBalance: openingBal,
          paymentStatus: "Credit / Unpaid",
        });
      }

      const customerDetails = registeredCust
        ? {
            shopName: registeredCust.shopName,
            shopkeeperName: registeredCust.shopkeeperName,
            phone: registeredCust.phone,
            area: registeredCust.area,
            openingBalance: openingBal,
          }
        : latestOrder
        ? {
            shopName: latestOrder.shopName,
            shopkeeperName: latestOrder.shopkeeperName,
            phone: latestOrder.phone,
            area: latestOrder.area,
            openingBalance: 0,
          }
        : null;

      return NextResponse.json({
        success: true,
        hasPendingUdhaar: totalPendingUdhaar > 0,
        totalPendingUdhaar,
        pendingOrders: mappedOrders,
        customerDetails,
      });
    }

    let filter = {};

    // 1. Date Range Filtering
    const dateCondition = resolveDateFilter(dateFilter, startDate, endDate, specificDate);
    if (dateCondition) {
      filter = { ...filter, ...dateCondition };
    }

    // Customer Phone Filter for Khata Ledger
    const customerPhone = searchParams.get("customerPhone");
    if (customerPhone) {
      const clean = customerPhone.replace(/[^0-9]/g, "");
      const digits = clean.length >= 7 ? clean.slice(-7) : clean;
      const reg = new RegExp(digits.split("").join("[\\s\\-\\.]*"), "i");
      filter.phone = reg;
    }

    // 2. Salesman Filter
    if (salesmanId && salesmanId !== "All") {
      filter.$or = [{ salesmanId: salesmanId }, { salesmanName: salesmanId }];
    }

    // 3. Status Filter
    if (status && status !== "All") {
      if (status === "Completed") {
        filter.paymentStatus = "Full Paid";
      } else if (status === "On Process") {
        filter.paymentStatus = { $ne: "Full Paid" };
      } else {
        filter.paymentStatus = status;
      }
    }

    // 4. Text Search
    if (query && query.trim() !== "") {
      const regex = new RegExp(query.trim(), "i");
      const searchOr = [
        { shopName: regex },
        { shopkeeperName: regex },
        { salesmanName: regex },
        { invoiceNo: regex },
        { phone: regex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    // Projection for summary table view (leaves heavy photo/notes off for lightning fast payload)
    let queryBuilder = Order.find(filter).sort({ createdAt: -1 });

    if (summary) {
      queryBuilder = queryBuilder.select("-photoUrl -notes");
    }

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        queryBuilder = queryBuilder.limit(parsedLimit);
      }
    }

    const orders = await queryBuilder.lean();

    const formatted = orders.map((o) => ({
      id: o.invoiceNo || o._id.toString(),
      _id: o._id.toString(),
      code: o.code || (o.shopName ? o.shopName.slice(0, 2).toUpperCase() : "SP"),
      salesmanId: o.salesmanId?.toString() || "",
      salesmanName: o.salesmanName,
      shopName: o.shopName,
      shopkeeperName: o.shopkeeperName,
      phone: o.phone,
      area: o.area,
      hasPhoto: o.hasPhoto,
      photoUrl: o.photoUrl || null,
      petis: o.petis,
      trays: o.trays || (o.looseEggs ? Math.floor(o.looseEggs / 30) : 0),
      looseEggs: o.looseEggs || 0,
      grossEggs: o.grossEggs || o.petis * EGGS_PER_PETI + (o.looseEggs || 0),
      brokenEggs: o.brokenEggs || 0,
      netEggs: o.netEggs || (o.petis * EGGS_PER_PETI + (o.looseEggs || 0) - (o.brokenEggs || 0)),
      totalEggs: o.netEggs || (o.petis * EGGS_PER_PETI + (o.looseEggs || 0) - (o.brokenEggs || 0)),
      ratePerPeti: o.ratePerPeti,
      ratePerEgg: o.ratePerEgg || (o.ratePerPeti ? (o.ratePerPeti / EGGS_PER_PETI).toFixed(2) : "0"),
      brokenDeduction: o.brokenDeduction || 0,
      currentSaleAmount: o.currentSaleAmount || (o.totalAmount - (o.previousBalance || 0)),
      totalAmount: o.totalAmount,
      previousBalance: o.previousBalance || 0,
      grandTotal: o.grandTotal || o.totalAmount,
      previousOrdersUdhaar: o.previousOrdersUdhaar || [],
      settledInOrder: o.settledInOrder || null,
      paidAmount: o.paidAmount,
      remainingBalance: o.remainingBalance,
      paymentStatus: o.paymentStatus,
      paymentMode: o.paymentMode,
      orderStatus: o.orderStatus || "Completed",
      date: o.date,
      time: o.time,
      notes: o.notes || "",
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      dateFilter: dateFilter || "all",
      orders: formatted,
    });
  } catch (error) {
    console.error("GET Orders Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const conn = await connectDB();

    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected. Please set MONGODB_URI in .env.local" },
        { status: 503 }
      );
    }

    const count = await Order.countDocuments();
    // Invoice serial numbers start from 0001 formatted with 4-digit zero padding
    const invoiceNo = String(count + 1).padStart(4, "0");

    const EGGS_PER_TRAY = 30;
    const petis = Number(data.petis) || 0;
    const trays = Number(data.trays) || (data.looseEggs ? Math.floor(Number(data.looseEggs) / EGGS_PER_TRAY) : 0);
    const looseEggs = Number(data.looseEggs) || trays * EGGS_PER_TRAY;
    const ratePerPeti = Number(data.ratePerPeti) || 0;
    const singleEggRate = ratePerPeti / EGGS_PER_PETI;

    const grossEggs = petis * EGGS_PER_PETI + looseEggs;
    const brokenEggs = Math.min(grossEggs, Number(data.brokenEggs) || 0);
    const netEggs = Math.max(0, grossEggs - brokenEggs);

    // 1 Peti = 12 Trays = 360 eggs. Rate per tray = ratePerPeti / 12
    const traysAmount = Math.round(trays * (ratePerPeti / 12));
    const grossBill = petis * ratePerPeti + traysAmount;
    // Per business rule: broken eggs are tracked for warehouse pool, but NOT deducted from customer bill
    const brokenDeduction = 0;
    const currentSaleAmount = grossBill;

    // Previous udhaar & grand total payable (Total Bill includes previous balance)
    const previousBalance = Math.max(0, Number(data.previousBalance) || 0);
    const grandTotal = currentSaleAmount + previousBalance;
    const totalAmount = grandTotal;

    const paidAmount = Number(data.paidAmount) || 0;
    const remainingBalance = Math.max(0, grandTotal - paidAmount);

    const paymentStatus =
      remainingBalance <= 0 ? "Full Paid" : paidAmount === 0 ? "Credit / Unpaid" : "Partial";

    // If previous pending orders are being settled/rolled forward, mark them and ZERO OUT their remainingBalance
    if (Array.isArray(data.pendingOrderInvoices) && data.pendingOrderInvoices.length > 0) {
      await Order.updateMany(
        {
          invoiceNo: { $in: data.pendingOrderInvoices },
        },
        {
          $set: {
            settledInOrder: invoiceNo,
            remainingBalance: 0,
            paymentStatus: "Full Paid",
          },
        }
      );

      // If customer had an opening balance, zero it out since it was rolled forward/settled
      if (data.phone) {
        try {
          const raw = String(data.phone).replace(/[^0-9]/g, "");
          const last7 = raw.length >= 7 ? raw.slice(-7) : raw;
          const reg = new RegExp(last7.split("").join("[\\s\\-\\.]*"), "i");
          await Customer.updateMany({ phone: reg }, { $set: { openingBalance: 0 } });
        } catch (e) {
          console.warn("Error zeroing customer opening balance:", e);
        }
      }
    }

    const newOrder = await Order.create({
      invoiceNo,
      code: (data.shopName ? data.shopName.slice(0, 2) : "SP").toUpperCase(),
      salesmanId: data.salesmanId,
      salesmanName: data.salesmanName || "Salesman",
      shopName: data.shopName,
      shopkeeperName: data.shopkeeperName || "Shopkeeper",
      phone: data.phone || "0300-0000000",
      area: data.area || "City Route",
      hasPhoto: !!data.photoUrl,
      photoUrl: data.photoUrl || null,
      petis,
      trays,
      looseEggs,
      grossEggs,
      brokenEggs,
      netEggs,
      ratePerPeti,
      ratePerEgg: Number(singleEggRate.toFixed(2)),
      brokenDeduction,
      currentSaleAmount,
      previousBalance,
      grandTotal,
      totalAmount,
      previousOrdersUdhaar: data.previousOrdersUdhaar || [],
      paidAmount,
      remainingBalance,
      paymentStatus,
      paymentMode: data.paymentMode || "Cash",
      notes: data.notes || "",
      date: data.date || new Date().toISOString().split("T")[0],
      time: data.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });

    // Auto-sync customer to Customer directory if not already created
    if (newOrder.phone) {
      try {
        const cleanPhone = newOrder.phone.trim();
        const existingCust = await Customer.findOne({ phone: cleanPhone });
        if (!existingCust) {
          await Customer.create({
            shopName: newOrder.shopName || "Customer Shop",
            shopkeeperName: newOrder.shopkeeperName || "Customer",
            phone: cleanPhone,
            area: newOrder.area || "Market Route",
            salesmanId: newOrder.salesmanId || null,
            salesmanName: newOrder.salesmanName || "",
            openingBalance: 0,
            isActive: true,
          });
        }
      } catch (custSyncErr) {
        // Non-blocking: ensure order returns even if customer sync encounters duplicate
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: newOrder.invoiceNo,
        _id: newOrder._id.toString(),
        invoiceNo: newOrder.invoiceNo,
        code: newOrder.code,
        salesmanId: newOrder.salesmanId?.toString(),
        salesmanName: newOrder.salesmanName,
        shopName: newOrder.shopName,
        shopkeeperName: newOrder.shopkeeperName,
        phone: newOrder.phone,
        area: newOrder.area,
        hasPhoto: newOrder.hasPhoto,
        photoUrl: newOrder.photoUrl,
        petis: newOrder.petis,
        looseEggs: newOrder.looseEggs,
        grossEggs: newOrder.grossEggs,
        brokenEggs: newOrder.brokenEggs,
        netEggs: newOrder.netEggs,
        totalEggs: newOrder.netEggs,
        ratePerPeti: newOrder.ratePerPeti,
        ratePerEgg: newOrder.ratePerEgg,
        brokenDeduction: newOrder.brokenDeduction,
        totalAmount: newOrder.totalAmount,
        previousBalance: newOrder.previousBalance || 0,
        grandTotal: newOrder.grandTotal || newOrder.totalAmount,
        previousOrdersUdhaar: newOrder.previousOrdersUdhaar || [],
        paidAmount: newOrder.paidAmount,
        remainingBalance: newOrder.remainingBalance,
        paymentStatus: newOrder.paymentStatus,
        paymentMode: newOrder.paymentMode,
        notes: newOrder.notes || "",
        date: newOrder.date,
        time: newOrder.time,
        orderStatus: "Completed",
      },
    });
  } catch (error) {
    console.error("POST Order Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const data = await req.json();
    const conn = await connectDB();

    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected. Please set MONGODB_URI in .env.local" },
        { status: 503 }
      );
    }

    const orderId = data._id || data.id || data.invoiceNo;
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order ID" }, { status: 400 });
    }

    const orConditions = [{ invoiceNo: orderId }];
    if (typeof orderId === "string" && orderId.startsWith("INV-")) {
      orConditions.push({ invoiceNo: orderId.replace("INV-", "") });
    } else if (typeof orderId === "string") {
      orConditions.push({ invoiceNo: `INV-${orderId}` });
    }
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      orConditions.push({ _id: orderId });
    }

    const existing = await Order.findOne({ $or: orConditions });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const petis = Number(data.petis ?? existing.petis) || 0;
    const looseEggs = Number(data.looseEggs ?? existing.looseEggs) || 0;
    const ratePerPeti = Number(data.ratePerPeti ?? existing.ratePerPeti) || 0;
    const singleEggRate = ratePerPeti / EGGS_PER_PETI;

    const grossEggs = petis * EGGS_PER_PETI + looseEggs;
    const brokenEggs = Math.min(grossEggs, Number(data.brokenEggs ?? existing.brokenEggs) || 0);
    const netEggs = Math.max(0, grossEggs - brokenEggs);

    const grossBill = petis * ratePerPeti + Math.round(looseEggs * singleEggRate);
    const brokenDeduction = Math.round(brokenEggs * singleEggRate);
    const totalAmount = Math.max(0, grossBill - brokenDeduction);

    const previousBalance = Math.max(0, Number(data.previousBalance ?? existing.previousBalance) || 0);
    const grandTotal = totalAmount + previousBalance;

    const paidAmount = Number(data.paidAmount ?? existing.paidAmount) || 0;
    const remainingBalance = Math.max(0, grandTotal - paidAmount);

    const paymentStatus =
      remainingBalance <= 0 ? "Full Paid" : paidAmount === 0 ? "Credit / Unpaid" : "Partial";

    const updated = await Order.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: {
          shopName: data.shopName ?? existing.shopName,
          shopkeeperName: data.shopkeeperName ?? existing.shopkeeperName,
          phone: data.phone ?? existing.phone,
          area: data.area ?? existing.area,
          petis,
          looseEggs,
          grossEggs,
          brokenEggs,
          netEggs,
          ratePerPeti,
          ratePerEgg: Number(singleEggRate.toFixed(2)),
          brokenDeduction,
          totalAmount,
          previousBalance,
          grandTotal,
          paidAmount,
          remainingBalance,
          paymentStatus,
          paymentMode: data.paymentMode ?? existing.paymentMode,
          notes: data.notes ?? existing.notes,
          date: data.date ?? existing.date,
        },
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      order: {
        id: updated.invoiceNo,
        _id: updated._id.toString(),
        invoiceNo: updated.invoiceNo,
        code: updated.code,
        salesmanId: updated.salesmanId?.toString(),
        salesmanName: updated.salesmanName,
        shopName: updated.shopName,
        shopkeeperName: updated.shopkeeperName,
        phone: updated.phone,
        area: updated.area,
        hasPhoto: updated.hasPhoto,
        photoUrl: updated.photoUrl,
        petis: updated.petis,
        looseEggs: updated.looseEggs,
        grossEggs: updated.grossEggs,
        brokenEggs: updated.brokenEggs,
        netEggs: updated.netEggs,
        totalEggs: updated.netEggs,
        ratePerPeti: updated.ratePerPeti,
        ratePerEgg: updated.ratePerEgg,
        brokenDeduction: updated.brokenDeduction,
        totalAmount: updated.totalAmount,
        previousBalance: updated.previousBalance || 0,
        grandTotal: updated.grandTotal || updated.totalAmount,
        previousOrdersUdhaar: updated.previousOrdersUdhaar || [],
        paidAmount: updated.paidAmount,
        remainingBalance: updated.remainingBalance,
        paymentStatus: updated.paymentStatus,
        paymentMode: updated.paymentMode,
        notes: updated.notes || "",
        date: updated.date,
        time: updated.time,
        orderStatus: updated.orderStatus || "Completed",
      },
    });
  } catch (error) {
    console.error("PUT Order Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
