import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StockInward from "@/models/StockInward";
import Order from "@/models/Order";
import User from "@/models/User";

const EGGS_PER_PETI = 360;

function resolveDateFilter(dateFilter, specificDate) {
  if (specificDate) {
    return { date: specificDate };
  }
  if (!dateFilter || dateFilter === "all") {
    return {};
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

  return {};
}

export async function GET(req) {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({
        success: true,
        stats: {
          totalStockInEggs: 0,
          totalStockInPetis: 0,
          todaySoldPetis: 0,
          todaySoldEggs: 0,
          periodSoldPetis: 0,
          periodSoldEggs: 0,
          cashCollected: 0,
          pendingUdhaar: 0,
          dateFilter: "today",
          totalBrokenPurchase: 0,
          totalBrokenSales: 0,
          activeSalesmenCount: 0,
        },
      });
    }

    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("dateFilter") || "today";
    const specificDate = searchParams.get("date");
    const dateCondition = resolveDateFilter(dateFilter, specificDate);

    // Compute total inward purchases
    const stockAgg = await StockInward.aggregate([
      {
        $group: {
          _id: null,
          totalNetEggs: { $sum: "$netEggs" },
          totalBroken: { $sum: "$brokenEggs" },
        },
      },
    ]);

    // Compute total outward sales (all time for stock calculation)
    const orderAllAgg = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalGrossEggs: { $sum: "$grossEggs" },
          totalBroken: { $sum: "$brokenEggs" },
        },
      },
    ]);

    // Period specific orders aggregation based on date filter (Today, Yesterday, Week, Month, All)
    const matchPipeline = Object.keys(dateCondition).length > 0 ? [{ $match: dateCondition }] : [];
    const periodOrderAgg = await Order.aggregate([
      ...matchPipeline,
      {
        $group: {
          _id: null,
          periodPetis: { $sum: "$petis" },
          periodEggs: { $sum: "$netEggs" },
          cashPaid: { $sum: "$paidAmount" },
          balanceDue: { $sum: "$remainingBalance" },
        },
      },
    ]);

    const totalInwardEggs = stockAgg[0]?.totalNetEggs || 0;
    const totalOutwardEggs = orderAllAgg[0]?.totalGrossEggs || 0;
    const availableEggs = Math.max(0, totalInwardEggs - totalOutwardEggs);
    const availablePetis = Math.floor(availableEggs / EGGS_PER_PETI);

    const activeSalesmenCount = await User.countDocuments({ role: "salesman", isActive: true });

    const periodPetis = periodOrderAgg[0]?.periodPetis || 0;
    const periodEggs = periodOrderAgg[0]?.periodEggs || 0;
    const cashPaid = periodOrderAgg[0]?.cashPaid || 0;
    const balanceDue = periodOrderAgg[0]?.balanceDue || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalStockInEggs: availableEggs,
        totalStockInPetis: availablePetis,
        todaySoldPetis: periodPetis,
        todaySoldEggs: periodEggs,
        periodSoldPetis: periodPetis,
        periodSoldEggs: periodEggs,
        cashCollected: cashPaid,
        pendingUdhaar: balanceDue,
        dateFilter,
        totalBrokenPurchase: stockAgg[0]?.totalBroken || 0,
        totalBrokenSales: orderAllAgg[0]?.totalBroken || 0,
        activeSalesmenCount,
      },
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
