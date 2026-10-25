import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StockInward from "@/models/StockInward";

const EGGS_PER_PETI = 360;

export async function GET() {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: true, stockInwards: [] });
    }

    const records = await StockInward.find().sort({ createdAt: -1 }).lean();

    const formatted = records.map((r) => ({
      id: r.batchId || r._id.toString(),
      _id: r._id.toString(),
      supplier: r.supplier,
      phone: r.phone,
      petis: r.petis,
      grossEggs: r.grossEggs,
      brokenEggs: r.brokenEggs || 0,
      netEggs: r.netEggs,
      eggsCount: r.netEggs,
      ratePerPeti: r.ratePerPeti,
      brokenDeduction: r.brokenDeduction || 0,
      totalCost: r.totalCost,
      vehicleNo: r.vehicleNo,
      grade: r.grade,
      date: r.date,
      time: r.time,
      status: "Received in Warehouse",
    }));

    return NextResponse.json({ success: true, stockInwards: formatted });
  } catch (error) {
    console.error("GET Stock Inward Error:", error);
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

    const count = await StockInward.countDocuments();
    const batchId = `STK-${String(count + 1).padStart(4, "0")}`;

    const petis = Number(data.petis) || 0;
    const ratePerPeti = Number(data.ratePerPeti) || 0;
    const grossEggs = petis * EGGS_PER_PETI;
    const brokenEggs = Math.min(grossEggs, Number(data.brokenEggs) || 0);
    const netEggs = grossEggs - brokenEggs;
    const singleEggRate = ratePerPeti / EGGS_PER_PETI;
    const brokenDeduction = Math.round(brokenEggs * singleEggRate);
    const totalCost = Math.max(0, petis * ratePerPeti - brokenDeduction);

    const newRecord = await StockInward.create({
      batchId,
      supplier: data.supplier,
      phone: data.phone || "0300-1122334",
      petis,
      grossEggs,
      brokenEggs,
      netEggs,
      ratePerPeti,
      brokenDeduction,
      totalCost,
      vehicleNo: data.vehicleNo || "TK-Commercial",
      grade: data.grade || "Grade-A White (Large)",
      date: data.date || new Date().toISOString().split("T")[0],
      time: data.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });

    return NextResponse.json({
      success: true,
      stockInward: {
        id: newRecord.batchId,
        _id: newRecord._id.toString(),
        supplier: newRecord.supplier,
        phone: newRecord.phone,
        petis: newRecord.petis,
        grossEggs: newRecord.grossEggs,
        brokenEggs: newRecord.brokenEggs,
        netEggs: newRecord.netEggs,
        eggsCount: newRecord.netEggs,
        ratePerPeti: newRecord.ratePerPeti,
        brokenDeduction: newRecord.brokenDeduction,
        totalCost: newRecord.totalCost,
        vehicleNo: newRecord.vehicleNo,
        grade: newRecord.grade,
        date: newRecord.date,
        time: newRecord.time,
        status: "Received in Warehouse",
      },
    });
  } catch (error) {
    console.error("POST Stock Inward Error:", error);
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

    const petis = Number(data.petis) || 0;
    const ratePerPeti = Number(data.ratePerPeti) || 0;
    const grossEggs = petis * EGGS_PER_PETI;
    const brokenEggs = Math.min(grossEggs, Number(data.brokenEggs) || 0);
    const netEggs = grossEggs - brokenEggs;
    const singleEggRate = ratePerPeti / EGGS_PER_PETI;
    const brokenDeduction = Math.round(brokenEggs * singleEggRate);
    const totalCost = Math.max(0, petis * ratePerPeti - brokenDeduction);

    const query = data._id ? { _id: data._id } : { batchId: data.id };

    const updated = await StockInward.findOneAndUpdate(
      query,
      {
        supplier: data.supplier,
        phone: data.phone,
        petis,
        grossEggs,
        brokenEggs,
        netEggs,
        ratePerPeti,
        brokenDeduction,
        totalCost,
        vehicleNo: data.vehicleNo,
        grade: data.grade,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Stock record not found to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      stockInward: {
        id: updated.batchId,
        _id: updated._id.toString(),
        supplier: updated.supplier,
        phone: updated.phone,
        petis: updated.petis,
        grossEggs: updated.grossEggs,
        brokenEggs: updated.brokenEggs,
        netEggs: updated.netEggs,
        eggsCount: updated.netEggs,
        ratePerPeti: updated.ratePerPeti,
        brokenDeduction: updated.brokenDeduction,
        totalCost: updated.totalCost,
        vehicleNo: updated.vehicleNo,
        grade: updated.grade,
        date: updated.date,
        time: updated.time,
        status: "Received in Warehouse",
      },
    });
  } catch (error) {
    console.error("PUT Stock Inward Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
