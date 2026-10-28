"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  X,
  Store,
  User,
  Phone,
  MapPin,
  DollarSign,
  Truck,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function NewCustomerModal({ isOpen, onClose, customerToEdit = null }) {
  const { addCustomer, updateCustomer, salesmen, fetchCustomers } = useApp();

  const [form, setForm] = useState({
    shopName: "",
    shopkeeperName: "",
    phone: "",
    area: "",
    openingBalance: "0",
    salesmanId: "",
    salesmanName: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (customerToEdit) {
      setForm({
        shopName: customerToEdit.shopName || "",
        shopkeeperName: customerToEdit.shopkeeperName || "",
        phone: customerToEdit.phone || "",
        area: customerToEdit.area || "",
        openingBalance: String(customerToEdit.openingBalance || "0"),
        salesmanId: customerToEdit.salesmanId || "",
        salesmanName: customerToEdit.salesmanName || "",
        notes: customerToEdit.notes || "",
      });
    } else {
      setForm({
        shopName: "",
        shopkeeperName: "",
        phone: "",
        area: "",
        openingBalance: "0",
        salesmanId: "",
        salesmanName: "",
        notes: "",
      });
    }
    setErrorMsg("");
    setSuccessMsg("");
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSalesmanChange = (e) => {
    const sId = e.target.value;
    const matched = salesmen.find((s) => s.id === sId || s._id === sId);
    setForm((prev) => ({
      ...prev,
      salesmanId: sId,
      salesmanName: matched ? matched.name : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.shopName.trim()) {
      setErrorMsg("Please enter the Shop Name (Dukan ka Naam).");
      return;
    }
    if (!form.phone.trim()) {
      setErrorMsg("Please enter Customer WhatsApp/Phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        shopName: form.shopName.trim(),
        shopkeeperName: form.shopkeeperName.trim() || "Customer",
        phone: form.phone.trim(),
        area: form.area.trim() || "Market Route",
        openingBalance: Number(form.openingBalance) || 0,
        salesmanId: form.salesmanId || null,
        salesmanName: form.salesmanName || "",
        notes: form.notes.trim(),
      };

      if (customerToEdit) {
        payload.id = customerToEdit.id || customerToEdit._id;
        const res = await updateCustomer(payload);
        if (!res.success) {
          setErrorMsg(res.error || "Failed to update customer.");
          setIsSubmitting(false);
          return;
        }
        setSuccessMsg("Customer details updated successfully!");
      } else {
        const res = await addCustomer(payload);
        if (!res.success) {
          setErrorMsg(res.error || "Failed to create customer.");
          setIsSubmitting(false);
          return;
        }
        setSuccessMsg("Direct customer registered successfully!");
      }

      await fetchCustomers();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Save Customer Error:", err);
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {customerToEdit ? "Edit Customer Details" : "Add Direct Customer"}
              </h3>
              <p className="text-xs text-amber-300/90">
                Direct shop registration & previous udhaar khata setup
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Shop Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-500" />
              <span>Shop Name (Dukan ka Naam) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Al-Madina Super Store"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Customer / Owner Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Customer / Owner Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Haji Abdul Rehman"
                value={form.shopkeeperName}
                onChange={(e) => setForm({ ...form, shopkeeperName: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp / Phone *</span>
              </label>
              <input
                type="tel"
                required
                placeholder="03001234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Area / Market Route */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Area / Shop Address</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Shop # 14, Main Market"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
              />
            </div>

            {/* Opening Balance / Previous Udhaar */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-red-500" />
                <span>Opening Udhaar / Baqaya (Rs.)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.openingBalance}
                onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white text-red-600"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Peechla khata balance jo pehle se baqi tha
              </p>
            </div>
          </div>

          {/* Assigned Salesman */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-teal-700" />
              <span>Assigned Salesman / Route (Optional)</span>
            </label>
            <select
              value={form.salesmanId}
              onChange={handleSalesmanChange}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-slate-800"
            >
              <option value="">-- Any / Unassigned --</option>
              {salesmen.map((sm) => (
                <option key={sm.id || sm._id} value={sm.id || sm._id}>
                  {sm.name} ({sm.route || "City Route"})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes / Specific Instructions (Optional)</span>
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Only delivers on Tuesday/Friday, prefers 2 petis per delivery..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Customer...</span>
                </>
              ) : (
                <span>{customerToEdit ? "Save Changes" : "+ Register Customer"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
