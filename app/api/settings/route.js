import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// GET: Fetch current admin profile / godam config
export async function GET(req) {
  try {
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: true, settings: null });
    }
    const admin = await User.findOne({ role: "admin" }).lean();
    if (!admin) {
      return NextResponse.json({ success: true, settings: null });
    }
    return NextResponse.json({
      success: true,
      settings: {
        id: admin._id.toString(),
        name: admin.name,
        username: admin.username,
        phone: admin.phone || "",
        code: admin.code || "AD",
        route: admin.route || "",
        // Godam details stored in User record
        godamName: admin.godamName || "AL-BARKAT EGG WHOLESALE WAREHOUSE",
        godamAddress: admin.godamAddress || "",
        godamPhone: admin.godamPhone || "",
        godamCity: admin.godamCity || "",
        eggsPetiSize: admin.eggsPetiSize || 360,
      },
    });
  } catch (err) {
    console.error("GET Settings Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Update admin profile + optional password change + godam details
export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      currentPassword,
      newPassword,
      name,
      phone,
      godamName,
      godamAddress,
      godamPhone,
      godamCity,
      eggsPetiSize,
    } = body;

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 503 });
    }

    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return NextResponse.json({ success: false, error: "Admin not found" }, { status: 404 });
    }

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }
      if (admin.password !== currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 401 }
        );
      }
      if (newPassword.length < 4) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 4 characters" },
          { status: 400 }
        );
      }
      admin.password = newPassword;
    }

    // Update profile fields
    if (name) admin.name = name.trim();
    if (phone !== undefined) admin.phone = phone.trim();

    // Godam details (stored as extra fields on admin User doc)
    if (godamName !== undefined) admin.godamName = godamName.trim();
    if (godamAddress !== undefined) admin.godamAddress = godamAddress.trim();
    if (godamPhone !== undefined) admin.godamPhone = godamPhone.trim();
    if (godamCity !== undefined) admin.godamCity = godamCity.trim();
    if (eggsPetiSize !== undefined) admin.eggsPetiSize = Number(eggsPetiSize) || 360;

    await admin.save();

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: {
        id: admin._id.toString(),
        name: admin.name,
        username: admin.username,
        phone: admin.phone || "",
        godamName: admin.godamName || "AL-BARKAT EGG WHOLESALE WAREHOUSE",
        godamAddress: admin.godamAddress || "",
        godamPhone: admin.godamPhone || "",
        godamCity: admin.godamCity || "",
        eggsPetiSize: admin.eggsPetiSize || 360,
      },
    });
  } catch (err) {
    console.error("PUT Settings Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
