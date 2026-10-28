import mongoose from "mongoose";

const BrokenEggActionSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: ["sale", "loss", "warehouse_breakage"],
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    time: {
      type: String, // HH:MM AM/PM
      default: () =>
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
    },
    quantityEggs: {
      type: Number,
      required: true,
      min: 1,
    },
    // If actionType === 'sale'
    ratePerEgg: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number, // Cash earned from selling broken eggs
      default: 0,
    },
    buyerName: {
      type: String,
      trim: true,
      default: "",
    },
    buyerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    paymentMode: {
      type: String,
      default: "Cash",
    },
    // If actionType === 'loss'
    lossReason: {
      type: String,
      trim: true,
      default: "Rotten / Leaked",
    },
    estimatedLossAmount: {
      type: Number, // Cost impact of destroyed eggs
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    recordedBy: {
      type: String,
      default: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.BrokenEggAction ||
  mongoose.model("BrokenEggAction", BrokenEggActionSchema);
