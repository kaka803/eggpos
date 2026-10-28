"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  User,
  Phone,
  Calendar,
  FileText,
  Loader2,
  CheckCircle2,
  ShoppingBag
} from "lucide-react";

export default function BrokenEggActionModal({
  isOpen,
  onClose,
  initialType = "sale", // 'sale' | 'loss' | 'warehouse_breakage'
  availableStock = 0,
  onSubmit,
}) {
  const [actionType, setActionType] = useState(initialType);
  const [quantityEggs, setQuantityEggs] = useState("");
  const [ratePerEgg, setRatePerEgg] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [lossReason, setLossReason] = useState("Rotten / Leaked");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActionType(initialType);
      setQuantityEggs("");
      setRatePerEgg(initialType === "sale" ? "12" : "");
      setTotalAmount("");
      setBuyerName("");
      setBuyerPhone("");
      setPaymentMode("Cash");
      setLossReason("Rotten / Leaked");
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setError("");
    }
  }, [isOpen, initialType]);

  // Recalculate total amount when quantity or rate changes for sale
  const handleQuantityChange = (val) => {
    setQuantityEggs(val);
    const q = Number(val) || 0;
    if (actionType === "sale") {
      const r = Number(ratePerEgg) || 0;
      if (r > 0) {
        setTotalAmount(String(Math.round(q * r)));
      }
    }
  };

  const handleRateChange = (val) => {
    setRatePerEgg(val);
    const r = Number(val) || 0;
    const q = Number(quantityEggs) || 0;
    if (q > 0) {
      setTotalAmount(String(Math.round(q * r)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const q = Number(quantityEggs);
    if (!q || q <= 0) {
      setError("Please enter a valid quantity of eggs.");
      return;
    }

    if (actionType === "sale" || actionType === "loss") {
      if (q > availableStock) {
        setError(
          `Cannot ${actionType === "sale" ? "sell" : "write-off"} ${q} eggs. Currently available broken stock is only ${availableStock} eggs.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        actionType,
        quantityEggs: q,
        ratePerEgg: Number(ratePerEgg) || 0,
        totalAmount: Number(totalAmount) || 0,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        paymentMode,
        lossReason,
        date: date || new Date().toISOString().split("T")[0],
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to record broken egg action.");
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
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                actionType === "sale"
                  ? "bg-emerald-500 text-slate-950"
                  : actionType === "loss"
                  ? "bg-red-500 text-white"
                  : "bg-amber-400 text-slate-950"
              }`}
            >
              {actionType === "sale" ? (
                <TrendingUp className="w-5 h-5" />
              ) : actionType === "loss" ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Package className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {actionType === "sale"
                  ? "Sell Broken Eggs (Add to Profit)"
                  : actionType === "loss"
                  ? "Write-off Broken Eggs (Mark Loss)"
                  : "Record Warehouse Breakage"}
              </h3>
              <p className="text-xs text-slate-400">
                Available Broken Stock:{" "}
                <strong className="text-amber-300">{availableStock.toLocaleString()} Eggs</strong>
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

        {/* Action Type Toggle */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActionType("sale")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              actionType === "sale"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Sell (Profit)</span>
          </button>

          <button
            type="button"
            onClick={() => setActionType("loss")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              actionType === "loss"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Mark Loss (Waste)</span>
          </button>

          <button
            type="button"
            onClick={() => setActionType("warehouse_breakage")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              actionType === "warehouse_breakage"
                ? "bg-slate-900 text-amber-300 shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Godam Damage</span>
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

          {/* Quantity & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Quantity of Eggs *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 50, 100"
                value={quantityEggs}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full text-sm font-black text-slate-900 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {Number(quantityEggs) > 0 &&
                  `≈ ${(Number(quantityEggs) / 360).toFixed(1)} Petis (${(Number(quantityEggs) / 30).toFixed(1)} Trays)`}
              </span>
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

          {/* SALE FIELDS */}
          {actionType === "sale" && (
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                Broken Egg Sale Details (Direct Profit Income)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Rate per Egg (Rs)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder="e.g. 12"
                    value={ratePerEgg}
                    onChange={(e) => handleRateChange(e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Total Sale Cash (Rs) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 600"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full text-xs font-black text-emerald-700 bg-white border border-emerald-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Buyer Name / Shop
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Madina Bakery"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Buyer Phone
                  </label>
                  <input
                    type="text"
                    placeholder="03XXXXXXXXX"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-100/70 rounded-xl text-emerald-950 text-xs font-bold flex items-center justify-between">
                <span>Profit Added to Business:</span>
                <span className="text-sm font-black text-emerald-700">
                  + Rs. {Number(totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* LOSS / DISCARD FIELDS */}
          {actionType === "loss" && (
            <div className="p-4 bg-red-50/70 rounded-2xl border border-red-200 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-800 block">
                Total Waste / Discard Reason
              </span>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason for Disposal
                </label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2"
                >
                  <option value="Rotten / Leaked">Rotten / Smelly / Leaked (Unusable)</option>
                  <option value="Completely Smashed">Completely Smashed in Warehouse</option>
                  <option value="Spoiled / Expired">Spoiled / Old Stock Discarded</option>
                  <option value="Other Waste">Other Wastage</option>
                </select>
              </div>

              <div className="p-2.5 bg-red-100/70 rounded-xl text-red-950 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  These eggs will be removed from available broken stock and recorded as business loss.
                </span>
              </div>
            </div>
          )}

          {/* WAREHOUSE DAMAGE FIELDS */}
          {actionType === "warehouse_breakage" && (
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-bold block">Internal Warehouse Damage</span>
              <p className="text-[11px] text-amber-800">
                Eggs broken during warehouse unloading, sorting, or stacking will be added to the broken egg pool so you can sell or track them.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Notes / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sold in plastic bucket to bakery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
              className={`px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                actionType === "sale"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                  : actionType === "loss"
                  ? "bg-red-600 hover:bg-red-500 shadow-red-500/20"
                  : "bg-slate-900 hover:bg-slate-800 shadow-slate-900/20"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {actionType === "sale"
                      ? "Record Sale & Add Profit"
                      : actionType === "loss"
                      ? "Confirm Loss Write-Off"
                      : "Save Warehouse Damage"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
