import mongoose from "mongoose";

const StockInwardSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    petis: {
      type: Number,
      required: true,
      min: 1,
    },
    grossEggs: {
      type: Number,
      required: true,
    },
    brokenEggs: {
      type: Number,
      default: 0,
      min: 0,
    },
    netEggs: {
      type: Number,
      required: true,
    },
    ratePerPeti: {
      type: Number,
      required: true,
    },
    brokenDeduction: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      required: true,
    },
    vehicleNo: {
      type: String,
      trim: true,
      default: "Commercial",
    },
    grade: {
      type: String,
      default: "Grade-A White (Large)",
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

export default mongoose.models.StockInward || mongoose.model("StockInward", StockInwardSchema);
