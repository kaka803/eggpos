import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

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

    let filter = {};

    // 1. Date Range Filtering
    const dateCondition = resolveDateFilter(dateFilter, startDate, endDate, specificDate);
    if (dateCondition) {
      filter = { ...filter, ...dateCondition };
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
      looseEggs: o.looseEggs || 0,
      grossEggs: o.grossEggs || o.petis * EGGS_PER_PETI + (o.looseEggs || 0),
      brokenEggs: o.brokenEggs || 0,
      netEggs: o.netEggs || (o.petis * EGGS_PER_PETI + (o.looseEggs || 0) - (o.brokenEggs || 0)),
      totalEggs: o.netEggs || (o.petis * EGGS_PER_PETI + (o.looseEggs || 0) - (o.brokenEggs || 0)),
      ratePerPeti: o.ratePerPeti,
      ratePerEgg: o.ratePerEgg || (o.ratePerPeti ? (o.ratePerPeti / EGGS_PER_PETI).toFixed(2) : "0"),
      brokenDeduction: o.brokenDeduction || 0,
      totalAmount: o.totalAmount,
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
    const invoiceNo = `INV-${9000 + count + 1}`;

    const petis = Number(data.petis) || 0;
    const looseEggs = Number(data.looseEggs) || 0;
    const ratePerPeti = Number(data.ratePerPeti) || 0;
    const singleEggRate = ratePerPeti / EGGS_PER_PETI;

    const grossEggs = petis * EGGS_PER_PETI + looseEggs;
    const brokenEggs = Math.min(grossEggs, Number(data.brokenEggs) || 0);
    const netEggs = Math.max(0, grossEggs - brokenEggs);

    const grossBill = petis * ratePerPeti + Math.round(looseEggs * singleEggRate);
    const brokenDeduction = Math.round(brokenEggs * singleEggRate);
    const totalAmount = Math.max(0, grossBill - brokenDeduction);

    const paidAmount = Number(data.paidAmount) || 0;
    const remainingBalance = Math.max(0, totalAmount - paidAmount);

    const paymentStatus =
      remainingBalance <= 0 ? "Full Paid" : paidAmount === 0 ? "Credit / Unpaid" : "Partial";

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
      looseEggs,
      grossEggs,
      brokenEggs,
      netEggs,
      ratePerPeti,
      ratePerEgg: Number(singleEggRate.toFixed(2)),
      brokenDeduction,
      totalAmount,
      paidAmount,
      remainingBalance,
      paymentStatus,
      paymentMode: data.paymentMode || "Cash",
      date: data.date || new Date().toISOString().split("T")[0],
      time: data.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });

    return NextResponse.json({
      success: true,
      order: {
        id: newOrder.invoiceNo,
        _id: newOrder._id.toString(),
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
        paidAmount: newOrder.paidAmount,
        remainingBalance: newOrder.remainingBalance,
        paymentStatus: newOrder.paymentStatus,
        paymentMode: newOrder.paymentMode,
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
