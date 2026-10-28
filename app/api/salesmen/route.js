import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";

import { healSettledOrders } from "@/lib/settlementHealer";

export async function GET() {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: true, salesmen: [] });
    }

    // Auto-heal historical orders that were settled but had stale remaining balance
    await healSettledOrders();

    const salesmen = await User.find({ role: "salesman", isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const todayDate = new Date().toISOString().split("T")[0];

    // Compute today's performance for each salesman
    const enriched = await Promise.all(
      salesmen.map(async (sm) => {
        const todayOrders = await Order.find({
          $or: [{ salesmanId: sm._id }, { salesmanName: sm.name }],
          date: todayDate,
        }).lean();

        const todaySoldPetis = todayOrders.reduce((acc, o) => acc + (Number(o.petis) || 0), 0);
        const todaySoldEggs = todayOrders.reduce(
          (acc, o) => acc + (Number(o.netEggs) || Number(o.totalEggs) || 0),
          0
        );
        const cashCollected = todayOrders.reduce(
          (acc, o) => acc + (Number(o.paidAmount) || 0),
          0
        );

        // Only count ACTIVE unsettled orders for pending udhaar
        const activeUnsettled = todayOrders.filter(
          (o) =>
            (!o.settledInOrder || o.settledInOrder === "") &&
            Number(o.remainingBalance) > 0
        );
        const pendingUdhaar = activeUnsettled.reduce(
          (acc, o) => acc + (Number(o.remainingBalance) || 0),
          0
        );

        return {
          id: sm._id.toString(),
          code: sm.code || sm.name.slice(0, 2).toUpperCase(),
          name: sm.name,
          phone: sm.phone,
          username: sm.username,
          password: sm.password,
          route: sm.route,
          vehicle: sm.vehicle,
          dailyTargetPetis: sm.dailyTargetPetis || 30,
          todaySoldPetis,
          todaySoldEggs,
          cashCollected,
          pendingUdhaar,
          status: todayOrders.length > 0 ? "On Route" : "Active",
        };
      })
    );

    return NextResponse.json({ success: true, salesmen: enriched });
  } catch (error) {
    console.error("GET Salesmen Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
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

    const cleanUsername = data.username.toLowerCase().trim();

    // Check duplicate username
    const exists = await User.findOne({ username: cleanUsername });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "Username already taken. Please choose another username." },
        { status: 400 }
      );
    }

    const initialCode =
      (data.name ? data.name.slice(0, 1).toUpperCase() : "S") +
      Math.floor(10 + Math.random() * 90);

    const newUser = await User.create({
      name: data.name,
      code: initialCode,
      phone: data.phone || "0300-0000000",
      username: cleanUsername,
      password: data.password || "egg12345",
      role: "salesman",
      route: data.route || "Local City Route",
      vehicle: data.vehicle || "Bike Loader",
      dailyTargetPetis: Number(data.dailyTargetPetis) || 30,
    });

    return NextResponse.json({
      success: true,
      salesman: {
        id: newUser._id.toString(),
        code: newUser.code,
        name: newUser.name,
        phone: newUser.phone,
        username: newUser.username,
        password: newUser.password,
        route: newUser.route,
        vehicle: newUser.vehicle,
        dailyTargetPetis: newUser.dailyTargetPetis,
        todaySoldPetis: 0,
        todaySoldEggs: 0,
        cashCollected: 0,
        pendingUdhaar: 0,
        status: "Active",
      },
    });
  } catch (error) {
    console.error("POST Salesman Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
