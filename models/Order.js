import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      default: "SP",
    },
    salesmanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    salesmanName: {
      type: String,
      required: true,
    },
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    shopkeeperName: {
      type: String,
      default: "Customer",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      default: "Market Route",
    },
    hasPhoto: {
      type: Boolean,
      default: false,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    petis: {
      type: Number,
      required: true,
      default: 0,
    },
    looseEggs: {
      type: Number,
      default: 0,
    },
    grossEggs: {
      type: Number,
      required: true,
    },
    brokenEggs: {
      type: Number,
      default: 0,
    },
    netEggs: {
      type: Number,
      required: true,
    },
    ratePerPeti: {
      type: Number,
      required: true,
    },
    ratePerEgg: {
      type: Number,
      required: true,
    },
    brokenDeduction: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    remainingBalance: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Full Paid", "Partial", "Credit / Unpaid"],
      default: "Full Paid",
    },
    paymentMode: {
      type: String,
      default: "Cash",
    },
    orderStatus: {
      type: String,
      default: "Completed",
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ date: -1, createdAt: -1 });
OrderSchema.index({ salesmanId: 1, date: -1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ invoiceNo: 1 });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
