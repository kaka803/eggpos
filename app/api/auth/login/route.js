import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { username, password, role } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const conn = await connectDB();

    // If MongoDB is connected, authenticate against database
    if (conn) {
      // Auto-seed default admin if database is empty of admins
      const adminExists = await User.findOne({ role: "admin" });
      if (!adminExists) {
        await User.create({
          name: "Godam Admin",
          code: "AD",
          phone: "0300-1234567",
          username: "admin",
          password: "admin123", // Can be updated anytime
          role: "admin",
          route: "Central Warehouse",
        });
        console.log("🌱 Default admin account created: admin / admin123");
      }

      // Search user
      const user = await User.findOne({
        username: username.toLowerCase().trim(),
        role: role || { $in: ["admin", "salesman"] },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found with this username" },
          { status: 404 }
        );
      }

      if (user.password !== password) {
        return NextResponse.json(
          { success: false, error: "Incorrect password" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role,
          code: user.code || user.name.slice(0, 2).toUpperCase(),
          route: user.route,
          vehicle: user.vehicle,
          dailyTargetPetis: user.dailyTargetPetis,
        },
      });
    }

    // Fallback if MONGODB_URI is not yet configured by user
    if (username === "admin" && password === "admin123") {
      return NextResponse.json({
        success: true,
        user: {
          id: "ADMIN-01",
          name: "Godam Admin",
          username: "admin",
          role: "admin",
          code: "AD",
          route: "Central Warehouse",
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid credentials. Please set MONGODB_URI in .env.local to access database." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
