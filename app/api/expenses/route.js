import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Expense from "@/models/Expense";

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
  if (dateFilter === "today") return { date: todayStr };

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
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    return { date: { $gte: startOfMonth, $lte: todayStr } };
  }

  return {};
}

export async function GET(req) {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: true, count: 0, totalAmount: 0, expenses: [] });
    }

    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("dateFilter");
    const specificDate = searchParams.get("date");
    const category = searchParams.get("category");

    const query = resolveDateFilter(dateFilter, specificDate);
    if (category && category !== "all") {
      query.category = category;
    }

    const records = await Expense.find(query).sort({ date: -1, createdAt: -1 }).lean();

    const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // Category breakdown
    const categoryTotals = {};
    for (const r of records) {
      const cat = r.category || "Miscellaneous";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(r.amount) || 0);
    }

    const formatted = records.map((r) => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      title: r.title,
      category: r.category,
      amount: r.amount,
      date: r.date,
      time: r.time,
      paidTo: r.paidTo || "",
      paymentMode: r.paymentMode || "Cash",
      notes: r.notes || "",
      recordedBy: r.recordedBy || "Admin",
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      totalAmount,
      categoryTotals,
      expenses: formatted,
    });
  } catch (error) {
    console.error("GET Expenses Error:", error);
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

    const { title, category, amount, date, paidTo, paymentMode, notes } = data;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Expense title is required" }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Expense amount must be greater than 0" },
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

    const newExpense = await Expense.create({
      title: title.trim(),
      category: category || "Miscellaneous",
      amount: numAmount,
      date: todayStr,
      time: timeStr,
      paidTo: paidTo?.trim() || "",
      paymentMode: paymentMode || "Cash",
      notes: notes?.trim() || "",
      recordedBy: "Admin",
    });

    return NextResponse.json({
      success: true,
      message: `Recorded expense: ${title} (Rs. ${numAmount.toLocaleString()})`,
      expense: {
        id: newExpense._id.toString(),
        _id: newExpense._id.toString(),
        title: newExpense.title,
        category: newExpense.category,
        amount: newExpense.amount,
        date: newExpense.date,
        time: newExpense.time,
        paidTo: newExpense.paidTo,
        paymentMode: newExpense.paymentMode,
        notes: newExpense.notes,
      },
    });
  } catch (error) {
    console.error("POST Expense Error:", error);
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
      return NextResponse.json({ success: false, error: "Expense ID is required" }, { status: 400 });
    }

    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Expense record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Expense record deleted successfully" });
  } catch (error) {
    console.error("DELETE Expense Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
