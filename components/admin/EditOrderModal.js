"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  X,
  Edit3,
  Store,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  FileText,
  Loader2,
  ShieldCheck
} from "lucide-react";

export default function EditOrderModal({ order, isOpen, onClose, onOrderUpdated }) {
  const { updateSaleOrder, EGGS_PER_PETI, currentUser } = useApp();

  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize form state whenever order opens
  useEffect(() => {
    if (!isOpen || !order) {
      setForm(null);
      setErrorMessage("");
      setSuccessMessage("");
      return;
    }

    setForm({
      id: order.id || order.invoiceNo || order._id,
      _id: order._id,
      invoiceNo: order.invoiceNo || order.id,
      shopName: order.shopName || "",
      shopkeeperName: order.shopkeeperName || "",
      phone: order.phone || "",
      area: order.area || "",
      petis: String(order.petis ?? 1),
      looseEggs: String(order.looseEggs ?? 0),
      brokenEggs: String(order.brokenEggs ?? 0),
      ratePerPeti: String(order.ratePerPeti ?? 7300),
      previousBalance: String(order.previousBalance ?? 0),
      paidAmount: String(order.paidAmount ?? 0),
      paymentMode: order.paymentMode || "Cash",
      date: order.date || new Date().toISOString().split("T")[0],
      notes: order.notes || "",
    });
    setErrorMessage("");
    setSuccessMessage("");
  }, [isOpen, order]);

  if (!isOpen || !form) return null;

  // Security check: Only Admin can edit sales
  if (currentUser?.role !== "admin") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl border border-red-200">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Access Denied</h3>
          <p className="text-xs text-slate-600">
            Only system administrators have permission to modify past sales orders and financial records.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Live Math calculations
  const petisCount = Number(form.petis) || 0;
  const looseCount = Number(form.looseEggs) || 0;
  const grossEggs = petisCount * EGGS_PER_PETI + looseCount;
  const brokenCount = Math.min(grossEggs, Number(form.brokenEggs) || 0);
  const netEggs = Math.max(0, grossEggs - brokenCount);

  const petiRate = Number(form.ratePerPeti) || 0;
  const singleEggRate = petiRate > 0 ? petiRate / EGGS_PER_PETI : 0;
  const looseAmount = Math.round(looseCount * singleEggRate);
  const grossBill = petisCount * petiRate + looseAmount;
  const brokenDeduction = Math.round(brokenCount * singleEggRate);
  const currentTotalAmount = Math.max(0, grossBill - brokenDeduction);

  const prevBalance = Math.max(0, Number(form.previousBalance) || 0);
  const grandTotal = currentTotalAmount + prevBalance;

  const paid = Math.max(0, Number(form.paidAmount) || 0);
  const remainingBalance = Math.max(0, grandTotal - paid);

  const paymentStatus =
    remainingBalance <= 0 ? "Full Paid" : paid === 0 ? "Credit / Unpaid" : "Partial";

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.shopName.trim()) {
      setErrorMessage("Please enter Shop Name.");
      return;
    }
    if (petisCount === 0 && looseCount === 0) {
      setErrorMessage("Please enter at least 1 Peti or loose eggs.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      const payload = {
        _id: form._id,
        id: form.id,
        invoiceNo: form.invoiceNo,
        shopName: form.shopName.trim(),
        shopkeeperName: form.shopkeeperName.trim(),
        phone: form.phone.trim(),
        area: form.area.trim(),
        petis: petisCount,
        looseEggs: looseCount,
        grossEggs: grossEggs,
        brokenEggs: brokenCount,
        netEggs: netEggs,
        totalEggs: netEggs,
        ratePerPeti: petiRate,
        ratePerEgg: singleEggRate.toFixed(2),
        brokenDeduction: brokenDeduction,
        totalAmount: currentTotalAmount,
        previousBalance: prevBalance,
        grandTotal: grandTotal,
        paidAmount: paid,
        remainingBalance: remainingBalance,
        paymentStatus: paymentStatus,
        paymentMode: form.paymentMode,
        date: form.date,
        notes: form.notes.trim(),
      };

      const result = await updateSaleOrder(payload);
      if (result.success) {
        setSuccessMessage("Sale order updated successfully!");
        if (onOrderUpdated) {
          onOrderUpdated(result.order);
        }
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMessage(result.error || "Failed to update order");
      }
    } catch (err) {
      console.error("Save edit order error:", err);
      setErrorMessage("Error saving changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Edit Sale Order</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  #{form.invoiceNo || form.id}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Modify quantities, pricing, customer details, and payment collection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section 1: Shop & Customer Information */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-teal-700" />
              Shop & Customer Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.shopName}
                  onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Customer / Owner Name
                </label>
                <input
                  type="text"
                  value={form.shopkeeperName}
                  onChange={(e) => setForm({ ...form, shopkeeperName: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Area / Route Address
                </label>
                <input
                  type="text"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Eggs Quantity & Breakage Calculation */}
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-700" />
                Egg Quantity & Pricing
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                1 Peti = {EGGS_PER_PETI} Eggs
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Petis (Boxes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.petis}
                  onChange={(e) => setForm({ ...form, petis: e.target.value })}
                  className="w-full text-xs font-black bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-center"
                />
                <span className="text-[10px] text-slate-500 block text-center mt-0.5">
                  {(petisCount * EGGS_PER_PETI).toLocaleString()} Eggs
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Khulay (Loose)
                </label>
                <input
                  type="number"
                  min="0"
                  max={EGGS_PER_PETI - 1}
                  value={form.looseEggs}
                  onChange={(e) => setForm({ ...form, looseEggs: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-center"
                />
                <span className="text-[10px] text-slate-500 block text-center mt-0.5">
                  + Rs. {looseAmount.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-red-700 block mb-1">
                  Toote (Broken)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.brokenEggs}
                  onChange={(e) => setForm({ ...form, brokenEggs: e.target.value })}
                  className="w-full text-xs font-black text-red-700 bg-white border border-red-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 text-center"
                />
                <span className="text-[10px] text-red-600 block text-center mt-0.5">
                  - Rs. {brokenDeduction.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Rate / Peti (Rs)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.ratePerPeti}
                  onChange={(e) => setForm({ ...form, ratePerPeti: e.target.value })}
                  className="w-full text-xs font-black bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-center"
                />
                <span className="text-[10px] text-slate-500 block text-center mt-0.5">
                  ≈ Rs. {singleEggRate.toFixed(2)}/egg
                </span>
              </div>
            </div>

            {/* Calculations Summary Strip */}
            <div className="bg-white p-3 rounded-xl border border-amber-300 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Net Eggs (Usable):</span>
                <strong className="text-slate-900">{netEggs.toLocaleString()} Eggs</strong>
              </div>
              <div className="flex justify-between text-slate-900 font-bold">
                <span>Current Sale Bill:</span>
                <strong className="text-sm font-black text-slate-950">
                  Rs. {currentTotalAmount.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          {/* Section 3: Financials & Payments */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Financial & Payment Adjustment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Previous Udhaar (Peechla)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.previousBalance}
                  onChange={(e) => setForm({ ...form, previousBalance: e.target.value })}
                  className="w-full text-xs font-black text-red-700 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Cash Paid / Wasool (Rs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.paidAmount}
                  onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                  className="w-full text-xs font-black text-emerald-700 bg-white border border-emerald-400 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Payment Mode
                </label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online / Bank">Online / Bank</option>
                  <option value="Credit / Khata">Credit / Khata</option>
                </select>
              </div>
            </div>

            {/* Live Balance Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Kul Wasooli (Grand Total):</span>
                  <strong className="text-slate-900 font-black">
                    Rs. {grandTotal.toLocaleString()}
                  </strong>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <strong
                    className={`font-black ${
                      remainingBalance > 0 ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    Rs. {remainingBalance.toLocaleString()}
                  </strong>
                </div>
              </div>

              <span
                className={`text-[11px] font-extrabold px-3 py-1 rounded-full ${
                  paymentStatus === "Full Paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : paymentStatus === "Credit / Unpaid"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {paymentStatus}
              </span>
            </div>

            {/* Date and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Sale Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Admin Edit Note / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corrected egg rate / cash adjustment"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 active:scale-98 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Save Order Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
