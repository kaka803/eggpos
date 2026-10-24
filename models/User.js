import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "salesman"],
      default: "salesman",
    },
    route: {
      type: String,
      trim: true,
      default: "Local City Route",
    },
    vehicle: {
      type: String,
      trim: true,
      default: "Bike Loader",
    },
    dailyTargetPetis: {
      type: Number,
      default: 30,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in Next.js hot reload
export default mongoose.models.User || mongoose.model("User", UserSchema);
