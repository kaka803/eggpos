import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    shopkeeperName: {
      type: String,
      trim: true,
      default: "Customer",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
      default: "Market Route",
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    salesmanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    salesmanName: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      default: "",
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

CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ shopName: 1 });
CustomerSchema.index({ shopkeeperName: 1 });
CustomerSchema.index({ createdAt: -1 });

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
