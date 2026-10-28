import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StockInward from "@/models/StockInward";
import Order from "@/models/Order";
import BrokenEggAction from "@/models/BrokenEggAction";

const EGGS_PER_PETI = 360;

export async function GET(req) {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({
        success: true,
        summary: {
          totalInwardBroken: 0,
          totalSalesReturnBroken: 0,
          totalWarehouseBroken: 0,
          totalBrokenInflow: 0,
          totalSoldEggs: 0,
          totalSoldRevenue: 0,
          totalLossEggs: 0,
          totalLossAmount: 0,
          availableBrokenEggs: 0,
          availableBrokenPetis: 0,
          availableBrokenLoose: 0,
        },
        actions: [],
        inwardRecords: [],
        salesReturnRecords: [],
      });
    }

    // 1. Inward broken eggs from farm purchases
    const inwardRecords = await StockInward.find({ brokenEggs: { $gt: 0 } })
      .select("batchId supplier date time petis grossEggs brokenEggs ratePerPeti brokenDeduction")
      .sort({ createdAt: -1 })
      .lean();

    const totalInwardBroken = inwardRecords.reduce(
      (sum, r) => sum + (Number(r.brokenEggs) || 0),
      0
    );

    // 2. Sales return broken eggs from field deliveries
    const salesReturnRecords = await Order.find({ brokenEggs: { $gt: 0 } })
      .select("invoiceNo date time salesmanName shopName petis brokenEggs grossEggs")
      .sort({ createdAt: -1 })
      .lean();

    const totalSalesReturnBroken = salesReturnRecords.reduce(
      (sum, r) => sum + (Number(r.brokenEggs) || 0),
      0
    );

    // 3. Broken eggs actions (sales, losses, warehouse breakages)
    const actions = await BrokenEggAction.find().sort({ createdAt: -1 }).lean();

    let totalWarehouseBroken = 0;
    let totalSoldEggs = 0;
    let totalSoldRevenue = 0;
    let totalLossEggs = 0;
    let totalLossAmount = 0;

    for (const a of actions) {
      const qty = Number(a.quantityEggs) || 0;
      if (a.actionType === "warehouse_breakage") {
        totalWarehouseBroken += qty;
      } else if (a.actionType === "sale") {
        totalSoldEggs += qty;
        totalSoldRevenue += Number(a.totalAmount) || 0;
      } else if (a.actionType === "loss") {
        totalLossEggs += qty;
        totalLossAmount += Number(a.estimatedLossAmount) || 0;
      }
    }

    const totalBrokenInflow = totalInwardBroken + totalSalesReturnBroken + totalWarehouseBroken;
    const totalDisposed = totalSoldEggs + totalLossEggs;
    const availableBrokenEggs = Math.max(0, totalBrokenInflow - totalDisposed);
    const availableBrokenPetis = Math.floor(availableBrokenEggs / EGGS_PER_PETI);
    const availableBrokenLoose = availableBrokenEggs % EGGS_PER_PETI;

    const formattedActions = actions.map((a) => ({
      id: a._id.toString(),
      _id: a._id.toString(),
      actionType: a.actionType,
      date: a.date,
      time: a.time,
      quantityEggs: a.quantityEggs,
      ratePerEgg: a.ratePerEgg || 0,
      totalAmount: a.totalAmount || 0,
      buyerName: a.buyerName || "",
      buyerPhone: a.buyerPhone || "",
      paymentMode: a.paymentMode || "Cash",
      lossReason: a.lossReason || "",
      estimatedLossAmount: a.estimatedLossAmount || 0,
      notes: a.notes || "",
      recordedBy: a.recordedBy || "Admin",
      createdAt: a.createdAt,
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalInwardBroken,
        totalSalesReturnBroken,
        totalWarehouseBroken,
        totalBrokenInflow,
        totalSoldEggs,
        totalSoldRevenue,
        totalLossEggs,
        totalLossAmount,
        availableBrokenEggs,
        availableBrokenPetis,
        availableBrokenLoose,
      },
      actions: formattedActions,
      inwardRecords: inwardRecords.map((r) => ({
        id: r.batchId || r._id.toString(),
        batchId: r.batchId,
        supplier: r.supplier,
        date: r.date,
        time: r.time,
        brokenEggs: r.brokenEggs,
      })),
      salesReturnRecords: salesReturnRecords.map((r) => ({
        id: r.invoiceNo || r._id.toString(),
        invoiceNo: r.invoiceNo,
        shopName: r.shopName,
        salesmanName: r.salesmanName,
        date: r.date,
        time: r.time,
        brokenEggs: r.brokenEggs,
      })),
    });
  } catch (error) {
    console.error("GET Broken Eggs Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 503 });
    }

    const {
      actionType,
      quantityEggs,
      ratePerEgg,
      totalAmount,
      buyerName,
      buyerPhone,
      paymentMode,
      lossReason,
      estimatedLossAmount,
      date,
      notes,
    } = data;

    if (!actionType || !["sale", "loss", "warehouse_breakage"].includes(actionType)) {
      return NextResponse.json(
        { success: false, error: "Invalid action type. Must be 'sale', 'loss', or 'warehouse_breakage'" },
        { status: 400 }
      );
    }

    const qty = Number(quantityEggs) || 0;
    if (qty <= 0) {
      return NextResponse.json(
        { success: false, error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayStr = date || now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    let computedAmount = Number(totalAmount) || 0;
    let computedRate = Number(ratePerEgg) || 0;

    if (actionType === "sale") {
      if (computedRate > 0 && computedAmount === 0) {
        computedAmount = Math.round(qty * computedRate);
      } else if (computedAmount > 0 && computedRate === 0) {
        computedRate = Number((computedAmount / qty).toFixed(2));
      }
    }

    let computedLossAmount = Number(estimatedLossAmount) || 0;
    if (actionType === "loss" && computedLossAmount === 0) {
      // Find average inward cost per egg
      const latestInward = await StockInward.findOne().sort({ createdAt: -1 }).lean();
      const costPerEgg =
        latestInward && latestInward.ratePerPeti
          ? latestInward.ratePerPeti / EGGS_PER_PETI
          : 20.28;
      computedLossAmount = Math.round(qty * costPerEgg);
    }

    const newAction = await BrokenEggAction.create({
      actionType,
      date: todayStr,
      time: timeStr,
      quantityEggs: qty,
      ratePerEgg: computedRate,
      totalAmount: computedAmount,
      buyerName: buyerName?.trim() || "",
      buyerPhone: buyerPhone?.trim() || "",
      paymentMode: paymentMode || "Cash",
      lossReason: lossReason?.trim() || (actionType === "loss" ? "Rotten / Leaked" : ""),
      estimatedLossAmount: computedLossAmount,
      notes: notes?.trim() || "",
      recordedBy: "Admin",
    });

    return NextResponse.json({
      success: true,
      message:
        actionType === "sale"
          ? `Successfully recorded sale of ${qty} broken eggs for Rs. ${computedAmount.toLocaleString()}`
          : actionType === "loss"
          ? `Successfully recorded loss write-off of ${qty} broken eggs`
          : `Successfully recorded warehouse breakage of ${qty} eggs`,
      action: newAction,
    });
  } catch (error) {
    console.error("POST Broken Egg Action Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Action ID is required" }, { status: 400 });
    }

    const deleted = await BrokenEggAction.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    console.error("DELETE Broken Egg Action Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
