"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  X,
  Store,
  User,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserPlus
} from "lucide-react";

export default function SalesmanNewCustomerModal({
  isOpen,
  onClose,
  activeSalesman,
  prefill = {},
  onCustomerAdded,
}) {
  const { addCustomer, fetchCustomers } = useApp();

  const [form, setForm] = useState({
    shopName: prefill.shopName || "",
    shopkeeperName: prefill.shopkeeperName || "",
    phone: prefill.phone || "",
    area: prefill.area || activeSalesman?.route || "",
    openingBalance: "0",
    notes: "",
  });

  // Keep prefill in sync when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setForm({
        shopName: prefill.shopName || "",
        shopkeeperName: prefill.shopkeeperName || "",
        phone: prefill.phone || "",
        area: prefill.area || activeSalesman?.route || "",
        openingBalance: "0",
        notes: "",
      });
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, prefill, activeSalesman?.route]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.shopName.trim()) {
      setErrorMsg("Dukan ka Naam (Shop Name) likhna zaroori hai.");
      return;
    }
    if (!form.phone.trim()) {
      setErrorMsg("Customer ka Phone / WhatsApp number likhna zaroori hai.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        shopName: form.shopName.trim(),
        shopkeeperName: form.shopkeeperName.trim() || "Customer",
        phone: form.phone.trim(),
        area: form.area.trim() || activeSalesman?.route || "Market Route",
        openingBalance: Number(form.openingBalance) || 0,
        salesmanId: activeSalesman?.id || activeSalesman?._id || null,
        salesmanName: activeSalesman?.name || "Salesman",
        notes: form.notes.trim() || "",
      };

      const result = await addCustomer(payload);
      if (result.success && result.customer) {
        setSuccessMsg(`✓ Customer "${result.customer.shopName}" kamyabi se add hogaya!`);
        // Refresh customer list for suggestions
        if (typeof fetchCustomers === "function") {
          fetchCustomers();
        }
        setTimeout(() => {
          if (onCustomerAdded) {
            onCustomerAdded(result.customer);
          }
          onClose();
        }, 600);
      } else {
        setErrorMsg(result.error || "Customer add karne mai masla aya. Dobara check karein.");
      }
    } catch (err) {
      console.error("Salesman add customer error:", err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#044E45] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white leading-tight">
                Naya Customer Add Karein
              </h3>
              <p className="text-[11px] text-teal-200">
                {activeSalesman ? `Salesman: ${activeSalesman.name}` : "Add Shop Profile"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Dukan Ka Naam */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <Store className="w-3.5 h-3.5 text-teal-700" />
              <span>Dukan Ka Naam (Shop Name) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Al-Madina Egg Store"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          {/* Shopkeeper Name */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-teal-700" />
              <span>Dukandar Ka Naam (Shopkeeper Name)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Haji Muhammad Aslam"
              value={form.shopkeeperName}
              onChange={(e) => setForm({ ...form, shopkeeperName: e.target.value })}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          {/* Phone / WhatsApp */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-teal-700" />
              <span>WhatsApp / Phone Number *</span>
            </label>
            <input
              type="tel"
              required
              placeholder="03001234567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Customer suggestions aur billing mai ye number search hoga.
            </p>
          </div>

          {/* Area / Market Route */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-teal-700" />
              <span>Area / Market Route</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Circular Road, Block 4"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          {/* Opening Udhaar (Purana Udhaar) */}
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-1.5">
            <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-800" />
              <span>Purana Udhaar / Opening Baqaya (Rs)</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.openingBalance}
              onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
              className="w-full text-xs font-mono font-bold bg-white border border-amber-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-[10px] text-amber-800 block">
              Agar is customer ka pehle se koi udhaar baqi hai to yahan likhein (Warna 0 chor dein).
            </span>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Notes / Tafseel (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Subah 9 baje delivery mangta hai"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Customer...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Save & Add Customer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
