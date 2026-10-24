import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req) {
  try {
    const body = await req.json();
    const { image, folder } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image data provided" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(image, folder || "andagodam/shops");

    return NextResponse.json({
      success: true,
      url: result.url,
      public_id: result.public_id,
      isLocal: result.isLocal || false,
    });
  } catch (error) {
    console.error("Image Upload Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
