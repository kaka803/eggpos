import mongoose from "mongoose";
import dns from "dns";

// Ensure SRV DNS resolution succeeds on Windows/Node environments
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in case environment restricts custom DNS
}

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global cache across hot reloads in Next.js development.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI is not set in environment variables. Falling back to in-memory mode.");
    return null;
  }

  // Ensure SRV DNS resolution succeeds on Windows/Node environments
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {}

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log("✅ MongoDB connected successfully to database.");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", e.message);
    throw e;
  }

  return cached.conn;
}
