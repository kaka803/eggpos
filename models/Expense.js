import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Fuel & Transport",
        "Labor & Wages",
        "Packaging & Trays",
        "Rent & Godam",
        "Utilities & Electricity",
        "Vehicle Maintenance",
        "Refreshments & Tea",
        "Miscellaneous",
      ],
      default: "Miscellaneous",
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
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
    paidTo: {
      type: String,
      trim: true,
      default: "",
    },
    paymentMode: {
      type: String,
      enum: ["Cash", "Online / JazzCash", "Bank Transfer", "Credit / Due"],
      default: "Cash",
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

export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
