"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  Calendar,
  CreditCard,
  User,
  FileText,
  Loader2,
  CheckCircle2,
  Fuel,
  Users,
  Box,
  Home,
  Zap,
  Wrench,
  Coffee,
  HelpCircle,
  AlertTriangle
} from "lucide-react";

const CATEGORIES = [
  { label: "Fuel & Transport", icon: Fuel, color: "text-amber-700 bg-amber-100" },
  { label: "Labor & Wages", icon: Users, color: "text-blue-700 bg-blue-100" },
  { label: "Packaging & Trays", icon: Box, color: "text-purple-700 bg-purple-100" },
  { label: "Rent & Godam", icon: Home, color: "text-teal-700 bg-teal-100" },
  { label: "Utilities & Electricity", icon: Zap, color: "text-yellow-700 bg-yellow-100" },
  { label: "Vehicle Maintenance", icon: Wrench, color: "text-orange-700 bg-orange-100" },
  { label: "Refreshments & Tea", icon: Coffee, color: "text-rose-700 bg-rose-100" },
  { label: "Miscellaneous", icon: HelpCircle, color: "text-slate-700 bg-slate-100" },
];

export default function NewExpenseModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Fuel & Transport");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setCategory("Fuel & Transport");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setPaidTo("");
      setPaymentMode("Cash");
      setNotes("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title or expense description.");
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid expense amount in Rupees.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        amount: numAmount,
        date: date || new Date().toISOString().split("T")[0],
        paidTo: paidTo.trim(),
        paymentMode,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to record expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Record Warehouse Expense (Kharcha)
              </h3>
              <p className="text-xs text-rose-300">
                Directly deducted from business Net Profit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Category Chips */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Expense Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-amber-400" : "text-slate-500"}`} />
                    <span className="truncate max-w-full text-center">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expense Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Expense Description / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Loader Bike Petrol, Daily Labor Wages, Plastic Trays"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Amount (Rs) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 1500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm font-black text-rose-600 bg-white border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  PKR
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Paid To & Payment Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Paid To / Person (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Driver Ali, Petrol Pump"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2"
              >
                <option value="Cash">Cash in Hand</option>
                <option value="Online / JazzCash">Online / EasyPaisa / JazzCash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit / Due">Credit / Due</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 5 Liters for Route 2 delivery bike"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>

          {/* Impact Notice */}
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 flex items-center justify-between">
            <span className="font-bold">Net Profit Impact:</span>
            <span className="font-black text-rose-700 text-sm">
              - Rs. {Number(amount || 0).toLocaleString()}
            </span>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
