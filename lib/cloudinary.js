import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload an image buffer or base64 data to Cloudinary.
 * @param {string|Buffer} fileData - Base64 string or file buffer
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<{ url: string, public_id: string }>}
 */
export async function uploadToCloudinary(fileData, folder = "andagodam/shops") {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.warn("⚠️ Cloudinary credentials missing in .env.local. Returning original data.");
    return {
      url: typeof fileData === "string" ? fileData : "",
      public_id: "local_temp",
      isLocal: true,
    };
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileData,
      {
        folder,
        resource_type: "image",
        quality: "auto:good",
        fetch_format: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
  });
}

export default cloudinary;
