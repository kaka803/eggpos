import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import mongoose from "mongoose";

const EGGS_PER_PETI = 360;

export async function GET(req, { params }) {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 503 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing order ID" }, { status: 400 });
    }

    const orConditions = [{ invoiceNo: id }];
    if (typeof id === "string" && id.startsWith("INV-")) {
      orConditions.push({ invoiceNo: id.replace("INV-", "") });
    } else if (typeof id === "string") {
      orConditions.push({ invoiceNo: `INV-${id}` });
    }
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConditions.push({ _id: id });
    }

    const order = await Order.findOne({ $or: orConditions }).lean();

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const grossEggs = order.grossEggs || order.petis * EGGS_PER_PETI + (order.looseEggs || 0);
    const brokenEggs = order.brokenEggs || 0;
    const netEggs = order.netEggs || grossEggs - brokenEggs;

    const formatted = {
      id: order.invoiceNo || order._id.toString(),
      _id: order._id.toString(),
      invoiceNo: order.invoiceNo,
      code: order.code || (order.shopName ? order.shopName.slice(0, 2).toUpperCase() : "SP"),
      salesmanId: order.salesmanId?.toString() || "",
      salesmanName: order.salesmanName,
      shopName: order.shopName,
      shopkeeperName: order.shopkeeperName,
      phone: order.phone,
      area: order.area,
      hasPhoto: order.hasPhoto,
      photoUrl: order.photoUrl || null,
      petis: order.petis,
      looseEggs: order.looseEggs || 0,
      grossEggs,
      brokenEggs,
      netEggs,
      totalEggs: netEggs,
      ratePerPeti: order.ratePerPeti,
      ratePerEgg: order.ratePerEgg || (order.ratePerPeti ? (order.ratePerPeti / EGGS_PER_PETI).toFixed(2) : "0"),
      brokenDeduction: order.brokenDeduction || 0,
      totalAmount: order.totalAmount,
      previousBalance: order.previousBalance || 0,
      grandTotal: order.grandTotal || (order.totalAmount + (order.previousBalance || 0)),
      previousOrdersUdhaar: order.previousOrdersUdhaar || [],
      settledInOrder: order.settledInOrder || null,
      paidAmount: order.paidAmount,
      remainingBalance: order.remainingBalance,
      paymentStatus: order.paymentStatus,
      paymentMode: order.paymentMode,
      orderStatus: order.orderStatus || "Completed",
      date: order.date,
      time: order.time,
      notes: order.notes || "",
      createdAt: order.createdAt,
    };

    return NextResponse.json({ success: true, order: formatted });
  } catch (error) {
    console.error("GET Single Order Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
