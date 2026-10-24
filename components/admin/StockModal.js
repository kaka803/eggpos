"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { X, PlusCircle, Edit3, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function StockModal({ isOpen, onClose, editRecord }) {
  const { addStockInward, updateStockInward, stockInwards, EGGS_PER_PETI } = useApp();

  const isEditing = !!editRecord;

  const [form, setForm] = useState({
    supplier: "",
    phone: "",
    petis: "",
    ratePerPeti: 7100,
    brokenEggs: 0,
    vehicleNo: "",
    grade: "Grade-A White (Large)"
  });

  // When editRecord changes, prefill the form
  useEffect(() => {
    if (editRecord) {
      setForm({
        supplier: editRecord.supplier || "",
        phone: editRecord.phone || "",
        petis: editRecord.petis || "",
        ratePerPeti: editRecord.ratePerPeti || 7100,
        brokenEggs: editRecord.brokenEggs || 0,
        vehicleNo: editRecord.vehicleNo || "",
        grade: editRecord.grade || "Grade-A White (Large)"
      });
    } else {
      setForm({
        supplier: "",
        phone: "",
        petis: "",
        ratePerPeti: 7100,
        brokenEggs: 0,
        vehicleNo: "",
        grade: "Grade-A White (Large)"
      });
    }
  }, [editRecord, isOpen]);

  if (!isOpen) return null;

  // Calculation math with Broken Eggs (Damage / Toot Phoot)
  const petisCount = Number(form.petis) || 0;
  const petiRate = Number(form.ratePerPeti) || 0;
  const singleEggRate = petiRate / EGGS_PER_PETI;
  const grossEggs = petisCount * EGGS_PER_PETI;
  const brokenCount = Math.min(grossEggs, Number(form.brokenEggs) || 0);
  const netEggs = Math.max(0, grossEggs - brokenCount);
  const grossCost = petisCount * petiRate;
  const brokenDeduction = Math.round(brokenCount * singleEggRate);
  const finalCost = Math.max(0, grossCost - brokenDeduction);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.supplier || !form.petis) return;

    if (isEditing) {
      const updated = {
        ...editRecord,
        supplier: form.supplier,
        phone: form.phone || "0300-1122334",
        petis: petisCount,
        grossEggs: grossEggs,
        brokenEggs: brokenCount,
        netEggs: netEggs,
        eggsCount: netEggs,
        ratePerPeti: petiRate,
        brokenDeduction: brokenDeduction,
        totalCost: finalCost,
        vehicleNo: form.vehicleNo || "TK-Commercial",
        grade: form.grade
      };
      updateStockInward(updated);
    } else {
      const newId = `STK-${1000 + stockInwards.length + 1}`;
      const record = {
        id: newId,
        supplier: form.supplier,
        phone: form.phone || "0300-1122334",
        petis: petisCount,
        grossEggs: grossEggs,
        brokenEggs: brokenCount,
        netEggs: netEggs,
        eggsCount: netEggs,
        ratePerPeti: petiRate,
        brokenDeduction: brokenDeduction,
        totalCost: finalCost,
        vehicleNo: form.vehicleNo || "TK-Commercial",
        grade: form.grade,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "Received in Warehouse"
      };
      addStockInward(record);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
        {/* Modal Header */}
        <div className="bg-[#044E45] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isEditing ? (
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Edit3 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
                <PlusCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-base">
                {isEditing ? `Edit Stock Inward (${editRecord.id})` : "Add Incoming Stock (Stock In)"}
              </h3>
              <p className="text-xs text-teal-200">
                Purchases from Poultry Farms with damage & breakage deduction
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Poultry Farm / Supplier Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Al-Madina Poultry Farms"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Supplier Phone</label>
              <input
                type="tel"
                placeholder="0300-1234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Vehicle / Truck #</label>
              <input
                type="text"
                placeholder="TKX-4821"
                value={form.vehicleNo}
                onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Petis, Rate & Broken Eggs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Petis (Boxes) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="150"
                value={form.petis}
                onChange={(e) => setForm({ ...form, petis: e.target.value })}
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 text-sm"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {petisCount * EGGS_PER_PETI} Eggs Gross
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Rate / Peti (Rs) *
              </label>
              <input
                type="number"
                required
                value={form.ratePerPeti}
                onChange={(e) => setForm({ ...form, ratePerPeti: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 text-sm"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Rs. {singleEggRate.toFixed(2)}/egg
              </span>
            </div>

            {/* BROKEN EGGS INPUT (TOOTE ANDAY / DAMAGE) */}
            <div className="bg-red-50/70 p-1.5 rounded-xl border border-red-200">
              <label className="font-bold text-red-800 block text-[11px] mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                <span>Toote Anday (Broken)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.brokenEggs}
                onChange={(e) => setForm({ ...form, brokenEggs: Number(e.target.value) })}
                className="w-full bg-white border border-red-300 rounded-lg px-2.5 py-1.5 font-black text-red-600 focus:ring-2 focus:ring-red-400 text-sm"
              />
              <span className="text-[10px] text-red-700 mt-0.5 block font-semibold">
                -Rs. {brokenDeduction.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Real-time Calculation Summary Card */}
          {form.petis && (
            <div className="p-3.5 bg-teal-50/80 rounded-2xl border border-teal-200 text-teal-950 space-y-1.5 text-xs">
              <div className="flex justify-between font-medium">
                <span>Gross Eggs Received:</span>
                <span className="font-bold">{grossEggs.toLocaleString()} Eggs ({petisCount} Petis × 360)</span>
              </div>
              {brokenCount > 0 && (
                <div className="flex justify-between text-red-700 font-bold">
                  <span>Damaged / Broken Eggs (Toot Phoot):</span>
                  <span>- {brokenCount} Eggs (- Rs. {brokenDeduction.toLocaleString()})</span>
                </div>
              )}
              <div className="flex justify-between text-teal-900 pt-1 border-t border-teal-200 font-black text-xs">
                <span>Net Usable Godam Stock Added:</span>
                <span>{netEggs.toLocaleString()} Usable Eggs</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-teal-300">
                <span className="font-bold text-slate-800">Final Net Purchase Bill:</span>
                <strong className="text-slate-950 font-black text-base">
                  Rs. {finalCost.toLocaleString()}
                </strong>
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Egg Quality / Grade</label>
            <select
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400"
            >
              <option value="Grade-A White (Large)">Grade-A White (Large)</option>
              <option value="Grade-A White (Medium)">Grade-A White (Medium)</option>
              <option value="Golden Desi Eggs">Golden Desi Eggs</option>
              <option value="Broiler Layer Fresh">Broiler Layer Fresh</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#044E45] hover:bg-[#033c35] text-white font-bold shadow-md shadow-teal-900/20 flex items-center gap-1.5"
            >
              {isEditing ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>{isEditing ? "Update Stock Inward" : "Save Stock Inward"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
