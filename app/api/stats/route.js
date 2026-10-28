import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StockInward from "@/models/StockInward";
import Order from "@/models/Order";
import User from "@/models/User";
import BrokenEggAction from "@/models/BrokenEggAction";
import Expense from "@/models/Expense";
import { healSettledOrders } from "@/lib/settlementHealer";

const EGGS_PER_PETI = 360;

function resolveDateFilter(dateFilter, specificDate) {
  if (specificDate) {
    return { date: specificDate };
  }
  if (dateFilter && /^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
    return { date: dateFilter };
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
          periodGrossEggs: 0,
          grossRevenue: 0,
          totalSaleRevenue: 0,
          cashCollected: 0,
          pendingUdhaar: 0,
          costOfSoldEggs: 0,
          grossProfit: 0,
          netProfit: 0,
          profitMargin: 0,
          isNetLoss: false,
          totalLossAmount: 0,
          totalBrokenEggs: 0,
          brokenSalesEggs: 0,
          brokenSalesLoss: 0,
          brokenPurchaseEggs: 0,
          brokenPurchaseLoss: 0,
          avgSaleRatePerPeti: 0,
          avgPurchaseCostPerPeti: 0,
          orderCount: 0,
          activeSalesmenCount: 0,
          dateFilter: "today",
        },
      });
    }

    // Auto-heal historical orders that were settled
    await healSettledOrders();

    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("dateFilter") || "today";
    const specificDate = searchParams.get("date");
    const dateCondition = resolveDateFilter(dateFilter, specificDate);

    // 1. Overall Stock Inwards (All time for live inventory & average purchase cost calculation)
    const stockAllAgg = await StockInward.aggregate([
      {
        $group: {
          _id: null,
          totalNetEggs: { $sum: "$netEggs" },
          totalGrossEggs: { $sum: "$grossEggs" },
          totalCost: { $sum: "$totalCost" },
          totalPetis: { $sum: "$petis" },
          totalBroken: { $sum: "$brokenEggs" },
          totalBrokenDeduction: { $sum: "$brokenDeduction" },
        },
      },
    ]);

    // 2. Outward Sales (All time for live inventory balance calculation)
    const orderAllAgg = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalGrossEggs: { $sum: "$grossEggs" },
          totalNetEggs: { $sum: "$netEggs" },
          totalBroken: { $sum: "$brokenEggs" },
        },
      },
    ]);

    // Compute live warehouse inventory
    const totalInwardEggs = stockAllAgg[0]?.totalNetEggs || 0;
    const totalOutwardEggs = orderAllAgg[0]?.totalGrossEggs || 0;
    const availableEggs = Math.max(0, totalInwardEggs - totalOutwardEggs);
    const availablePetis = Math.floor(availableEggs / EGGS_PER_PETI);

    // Compute average purchase cost per egg from all inward records
    const allInwardCost = stockAllAgg[0]?.totalCost || 0;
    const allInwardEggs = stockAllAgg[0]?.totalGrossEggs || stockAllAgg[0]?.totalNetEggs || 0;
    let avgCostPerEgg = allInwardEggs > 0 ? allInwardCost / allInwardEggs : 0;

    // 3. Filtered Orders for the specific day / date range
    const periodOrders = await Order.find(dateCondition).lean();

    let periodSoldPetis = 0;
    let periodSoldEggs = 0;
    let periodGrossEggs = 0;
    let periodGrossRevenue = 0;
    let periodSalesRevenue = 0;
    let periodCashCollected = 0;
    let periodPendingUdhaar = 0;
    let periodBrokenSalesEggs = 0;
    let periodBrokenSalesDeduction = 0;
    let totalSellingRatesSum = 0;
    let sellingRatesCount = 0;

    for (const o of periodOrders) {
      const petis = Number(o.petis) || 0;
      const looseEggs = Number(o.looseEggs) || 0;
      const ratePerPeti = Number(o.ratePerPeti) || 0;
      const singleEggRate = ratePerPeti > 0 ? ratePerPeti / EGGS_PER_PETI : Number(o.ratePerEgg) || 0;

      const grossEggs = Number(o.grossEggs) || petis * EGGS_PER_PETI + looseEggs;
      const brokenEggs = Number(o.brokenEggs) || 0;
      const netEggs = Number(o.netEggs) || Math.max(0, grossEggs - brokenEggs);

      const grossBill = petis * ratePerPeti + Math.round(looseEggs * singleEggRate);
      const brokenDeduction = Number(o.brokenDeduction) || Math.round(brokenEggs * singleEggRate);

      // Current sale amount without previous udhaar
      const saleAmount =
        Number(o.currentSaleAmount) ||
        Math.max(0, Number(o.totalAmount || 0) - Number(o.previousBalance || 0)) ||
        Math.max(0, grossBill - brokenDeduction);

      periodSoldPetis += petis;
      periodGrossEggs += grossEggs;
      periodSoldEggs += netEggs;
      periodGrossRevenue += grossBill;
      periodSalesRevenue += saleAmount;
      periodCashCollected += Number(o.paidAmount) || 0;
      if (!o.settledInOrder || o.settledInOrder === "") {
        periodPendingUdhaar += Number(o.remainingBalance) || 0;
      }
      periodBrokenSalesEggs += brokenEggs;
      periodBrokenSalesDeduction += brokenDeduction;

      if (ratePerPeti > 0) {
        totalSellingRatesSum += ratePerPeti;
        sellingRatesCount++;
      }
    }

    const avgSaleRatePerPeti =
      sellingRatesCount > 0 ? totalSellingRatesSum / sellingRatesCount : 7300;

    // Fallback purchase cost per egg if no StockInward was recorded yet
    if (avgCostPerEgg === 0) {
      // Standard commercial wholesale margin: purchase rate ~93% of sale rate
      avgCostPerEgg = (avgSaleRatePerPeti * 0.93) / EGGS_PER_PETI;
    }
    const avgCostPerPeti = avgCostPerEgg * EGGS_PER_PETI;

    // 4. Inward stock purchases in this specific period (for inward transit broken egg loss)
    const periodInwards = await StockInward.find(dateCondition).lean();
    let periodBrokenPurchaseEggs = 0;
    let periodBrokenPurchaseLoss = 0;
    for (const inv of periodInwards) {
      const bEggs = Number(inv.brokenEggs) || 0;
      const bDed = Number(inv.brokenDeduction) || Math.round(bEggs * avgCostPerEgg);
      periodBrokenPurchaseEggs += bEggs;
      periodBrokenPurchaseLoss += bDed;
    }

    // 5. Broken Egg Actions in this period (Sales of broken eggs & Discarded waste losses)
    let periodBrokenEggActions = [];
    try {
      periodBrokenEggActions = await BrokenEggAction.find(dateCondition).lean();
    } catch (e) {
      console.warn("BrokenEggAction query error:", e);
    }

    let brokenEggSaleRevenue = 0;
    let brokenEggSoldEggs = 0;
    let brokenEggLossAmount = 0;
    let brokenEggDiscardedEggs = 0;

    for (const act of periodBrokenEggActions) {
      const q = Number(act.quantityEggs) || 0;
      if (act.actionType === "sale") {
        brokenEggSoldEggs += q;
        brokenEggSaleRevenue += Number(act.totalAmount) || 0;
      } else if (act.actionType === "loss") {
        brokenEggDiscardedEggs += q;
        brokenEggLossAmount += Number(act.estimatedLossAmount) || 0;
      }
    }

    // Add broken egg sales revenue into period cash & total sales
    periodSalesRevenue += brokenEggSaleRevenue;
    periodCashCollected += brokenEggSaleRevenue;

    // 6. Expenses in this period (Warehouse overheads, fuel, wages, packaging, etc.)
    let periodExpenses = 0;
    try {
      const expenses = await Expense.find(dateCondition).lean();
      periodExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    } catch (e) {
      console.warn("Expense query error:", e);
    }

    // Cost of goods sold for all gross eggs dispatched during this period
    const costOfSoldEggs = Math.round(periodGrossEggs * avgCostPerEgg);

    // Total Loss = Inward transit broken losses + Written-off/Discarded waste losses + Delivery broken deductions
    const totalLossAmount = Math.round(
      periodBrokenSalesDeduction + periodBrokenPurchaseLoss + brokenEggLossAmount
    );
    const totalBrokenEggs =
      periodBrokenSalesEggs + periodBrokenPurchaseEggs + brokenEggDiscardedEggs;

    // Gross Profit = Total Gross Sales Billed + Broken Eggs Sale Revenue - Cost of Dispatched Eggs
    const grossProfit = Math.round(
      periodGrossRevenue + brokenEggSaleRevenue - costOfSoldEggs
    );

    // Net Profit = Gross Profit - Total Broken Egg Loss - Total Operational Expenses
    const netProfit = Math.round(grossProfit - totalLossAmount - periodExpenses);

    const effectiveTotalRevenue = periodGrossRevenue + brokenEggSaleRevenue;
    const profitMargin =
      effectiveTotalRevenue > 0 ? (netProfit / effectiveTotalRevenue) * 100 : 0;

    const activeSalesmenCount = await User.countDocuments({ role: "salesman", isActive: true });

    return NextResponse.json({
      success: true,
      stats: {
        // Warehouse inventory
        totalStockInEggs: availableEggs,
        totalStockInPetis: availablePetis,
        totalInwardEggs,
        totalOutwardEggs,

        // Period sales
        periodSoldPetis,
        periodSoldEggs,
        periodGrossEggs,
        todaySoldPetis: periodSoldPetis,
        todaySoldEggs: periodSoldEggs,
        orderCount: periodOrders.length,

        // Revenue & Payments
        grossRevenue: periodGrossRevenue,
        totalSaleRevenue: periodSalesRevenue,
        cashCollected: periodCashCollected,
        pendingUdhaar: periodPendingUdhaar,

        // Cost & Profit Analysis
        costOfSoldEggs,
        grossProfit,
        netProfit,
        profitMargin: Number(profitMargin.toFixed(1)),
        isNetLoss: netProfit < 0,
        totalExpenses: periodExpenses,

        // Loss Analysis
        totalLossAmount,
        totalBrokenEggs,
        brokenSalesEggs: periodBrokenSalesEggs,
        brokenSalesLoss: periodBrokenSalesDeduction,
        brokenPurchaseEggs: periodBrokenPurchaseEggs,
        brokenPurchaseLoss: periodBrokenPurchaseLoss,

        // Broken Egg Actions
        brokenEggSaleRevenue,
        brokenEggSoldEggs,
        brokenEggLossAmount,
        brokenEggDiscardedEggs,

        // Benchmark Rates
        avgSaleRatePerPeti: Math.round(avgSaleRatePerPeti),
        avgPurchaseCostPerPeti: Math.round(avgCostPerPeti),

        // Metadata
        activeSalesmenCount,
        dateFilter,
        selectedDate: specificDate || (dateCondition?.date || null),
      },
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
