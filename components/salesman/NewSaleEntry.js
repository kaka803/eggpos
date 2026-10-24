"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Store,
  Camera,
  Package,
  DollarSign,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Sparkles,
  HelpCircle,
  FileCheck
} from "lucide-react";

export default function NewSaleEntry({ activeSalesman }) {
  const { addSaleOrder, openReceipt, salesOrders, uploadShopImage, EGGS_PER_PETI } = useApp();

  const [isUploading, setIsUploading] = useState(false);
  const [paymentPreset, setPaymentPreset] = useState("full"); // 'full' | 'credit' | 'custom'

  const [form, setForm] = useState({
    entryMode: "manual", // 'manual' | 'photo'
    shopName: "",
    shopkeeperName: "",
    phone: "",
    area: "",
    photoUrl: null,
    petis: 1,
    looseEggs: 0,
    brokenEggs: 0, // Toote hue anday
    ratePerPeti: 7300,
    paymentMode: "Cash",
    paidAmount: 7300,
  });

  // Egg and Price Math with Broken Eggs calculation
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
  const totalBill = Math.max(0, grossBill - brokenDeduction);

  const paid = paymentPreset === "full" ? totalBill : paymentPreset === "credit" ? 0 : Number(form.paidAmount) || 0;
  const remainingBalance = Math.max(0, totalBill - paid);

  // Recalculate bill whenever petis or rate changes
  const updatePetis = (newPetis) => {
    const validPetis = Math.max(0, newPetis);
    const newGross = validPetis * EGGS_PER_PETI + looseCount;
    const newBroken = Math.min(newGross, Number(form.brokenEggs) || 0);
    const newGrossBill = validPetis * petiRate + looseAmount;
    const newDeduction = Math.round(newBroken * singleEggRate);
    const newTotal = Math.max(0, newGrossBill - newDeduction);

    setForm((prev) => ({
      ...prev,
      petis: validPetis,
      paidAmount: paymentPreset === "full" ? newTotal : paymentPreset === "credit" ? 0 : prev.paidAmount,
    }));
  };

  const handlePresetSelect = (preset) => {
    setPaymentPreset(preset);
    if (preset === "full") {
      setForm((prev) => ({ ...prev, paidAmount: totalBill, paymentMode: "Cash" }));
    } else if (preset === "credit") {
      setForm((prev) => ({ ...prev, paidAmount: 0, paymentMode: "Credit / Khata" }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        const uploadedUrl = await uploadShopImage(base64);
        setForm((prev) => ({
          ...prev,
          photoUrl: uploadedUrl,
          shopName: prev.shopName || "Photo Shop Entry",
        }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.shopName && !form.photoUrl) {
      alert("Please enter Shop Name OR snap a shop signboard photo!");
      return;
    }

    if (petisCount === 0 && looseCount === 0) {
      alert("Please enter at least 1 Peti or loose eggs.");
      return;
    }

    const orderId = `INV-${9000 + salesOrders.length + 1}`;
    const code = (form.shopName ? form.shopName.slice(0, 2) : "SP").toUpperCase();
    const status = remainingBalance <= 0 ? "Full Paid" : paid === 0 ? "Credit / Unpaid" : "Partial";

    const newOrder = {
      id: orderId,
      code: code,
      salesmanId: activeSalesman?.id || "SM-1",
      salesmanName: activeSalesman?.name || "Muhammad Usman",
      shopName: form.shopName || "Shop Board Snap Entry",
      shopkeeperName: form.shopkeeperName || "Shopkeeper",
      phone: form.phone || "03001234567",
      area: form.area || activeSalesman?.route || "Market Route",
      hasPhoto: !!form.photoUrl,
      photoUrl: form.photoUrl,
      petis: petisCount,
      looseEggs: looseCount,
      grossEggs: grossEggs,
      brokenEggs: brokenCount, // Toote hue anday
      netEggs: netEggs,
      totalEggs: netEggs, // Billable net eggs
      ratePerPeti: petiRate,
      ratePerEgg: singleEggRate.toFixed(2),
      brokenDeduction: brokenDeduction,
      totalAmount: totalBill,
      paidAmount: paid,
      remainingBalance: remainingBalance,
      paymentStatus: status,
      paymentMode: form.paymentMode,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      orderStatus: "Completed",
    };

    addSaleOrder(newOrder);
    openReceipt(newOrder);

    // Reset Form for next sale
    setForm({
      entryMode: "manual",
      shopName: "",
      shopkeeperName: "",
      phone: "",
      area: "",
      photoUrl: null,
      petis: 1,
      looseEggs: 0,
      brokenEggs: 0,
      ratePerPeti: 7300,
      paymentMode: "Cash",
      paidAmount: 7300,
    });
    setPaymentPreset("full");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* =========================================================================
          STEP 1: SHOP & CUSTOMER INFORMATION
          ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="font-extrabold text-sm text-slate-900">
              Shop & Customer Details
            </h3>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setForm({ ...form, entryMode: "manual" })}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                form.entryMode === "manual"
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Type Details
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, entryMode: "photo" })}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-all ${
                form.entryMode === "photo"
                  ? "bg-teal-800 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Snap</span>
            </button>
          </div>
        </div>

        {form.entryMode === "manual" ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Shop Name (Dukan ka Naam) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Al-Madina Super Store"
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Customer / Owner Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Haji Abdul"
                  value={form.shopkeeperName}
                  onChange={(e) => setForm({ ...form, shopkeeperName: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  WhatsApp / Phone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="03001234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Area / Shop Address
              </label>
              <input
                type="text"
                placeholder="e.g. Shop # 12, Main Bazar"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>
          </div>
        ) : (
          /* Camera Signboard Upload */
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-teal-300 text-center">
              {form.photoUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden max-h-40 w-full bg-slate-900 shadow-inner">
                    <img
                      src={form.photoUrl}
                      alt="Captured Shop Board"
                      className="w-full h-40 object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-slate-900/90 text-amber-300 text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Signboard Photo Attached
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, photoUrl: null })}
                    className="text-xs text-red-600 font-bold hover:underline"
                  >
                    Remove & Re-take Photo
                  </button>
                </div>
              ) : (
                <div className="py-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Snap Shop Signboard Photo
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Fast logging option for field salesmen on bike/van
                  </p>

                  <label className="mt-3 px-4 py-2.5 rounded-xl bg-teal-800 text-white text-xs font-bold shadow-md hover:bg-teal-900 cursor-pointer inline-flex items-center gap-2 transition-all">
                    <Camera className="w-4 h-4" />
                    <span>{isUploading ? "Uploading to Cloudinary..." : "Open Camera / Take Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      disabled={isUploading}
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Shopkeeper WhatsApp Number (for receipt) *
              </label>
              <input
                type="tel"
                required
                placeholder="03001234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          STEP 2: EGG QUANTITY & BREAKAGE (TOOTE ANDAY)
          ========================================================================= */}
      <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="font-extrabold text-sm text-slate-900">
              Quantity & Breakage
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
            1 Peti = {EGGS_PER_PETI} Eggs
          </span>
        </div>

        {/* Petis Touch Stepper */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="font-bold text-slate-800">Boxes (Petis) Quantity:</span>
            <span className="font-extrabold text-amber-800">
              {petisCount * EGGS_PER_PETI} Eggs Gross
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updatePetis(form.petis - 1)}
              className="w-14 h-12 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-2xl font-black text-slate-700 flex items-center justify-center active:scale-95 transition-all shadow-xs"
            >
              -
            </button>

            <div className="flex-1 relative">
              <input
                type="number"
                min="0"
                value={form.petis}
                onChange={(e) => updatePetis(Number(e.target.value))}
                className="w-full text-center font-black text-2xl bg-white border border-amber-400 rounded-xl h-12 text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                Petis
              </span>
            </div>

            <button
              type="button"
              onClick={() => updatePetis(form.petis + 1)}
              className="w-14 h-12 rounded-xl bg-amber-400 hover:bg-amber-500 text-2xl font-black text-slate-950 flex items-center justify-center active:scale-95 transition-all shadow-xs"
            >
              +
            </button>
          </div>

          {/* Quick Peti Preset Chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
            {[1, 2, 3, 5, 8, 10, 15].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => updatePetis(num)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition-all shrink-0 ${
                  form.petis === num
                    ? "bg-slate-900 text-amber-300 border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {num} Peti
              </button>
            ))}
          </div>
        </div>

        {/* Loose Eggs & Rate per Peti */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Loose Eggs (Khulay Anday)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.looseEggs || ""}
              onChange={(e) => setForm({ ...form, looseEggs: Number(e.target.value) })}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Rate per Peti (Rs) *
            </label>
            <input
              type="number"
              required
              value={form.ratePerPeti}
              onChange={(e) => setForm({ ...form, ratePerPeti: Number(e.target.value) })}
              className="w-full text-xs font-extrabold text-slate-900 bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <span className="text-[10px] text-slate-500 block mt-0.5">
              ≈ Rs. {singleEggRate.toFixed(2)} / egg
            </span>
          </div>
        </div>

        {/* TOOTE HUE ANDAY (BROKEN DAMAGE DEDUCTION) */}
        <div className="bg-red-50 p-3 rounded-xl border border-red-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-red-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>Toote Hue Anday (Broken Eggs)</span>
            </label>
            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
              Deducted Automatically
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="0 (e.g. 5, 10 toote anday)"
              value={form.brokenEggs || ""}
              onChange={(e) =>
                setForm({ ...form, brokenEggs: Math.max(0, Number(e.target.value)) })
              }
              className="w-full text-xs font-black text-red-700 bg-white border border-red-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {brokenCount > 0 && (
              <span className="text-xs font-black text-red-700 whitespace-nowrap px-2.5 py-1 rounded-lg bg-red-100 border border-red-300 shrink-0">
                - Rs. {brokenDeduction.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Live Calculation Preview Strip */}
        <div className="bg-white p-3 rounded-xl border border-amber-300 text-xs space-y-1.5 shadow-xs">
          <div className="flex justify-between text-slate-600">
            <span>Gross Eggs:</span>
            <strong className="text-slate-900">{grossEggs.toLocaleString()} Eggs</strong>
          </div>
          {brokenCount > 0 && (
            <div className="flex justify-between text-red-600 font-bold">
              <span>Less Broken Eggs:</span>
              <span>- {brokenCount} Eggs (- Rs. {brokenDeduction.toLocaleString()})</span>
            </div>
          )}
          <div className="flex justify-between text-teal-800 font-extrabold pt-1 border-t border-slate-100">
            <span>Net Billable Eggs:</span>
            <span>{netEggs.toLocaleString()} Eggs</span>
          </div>
          <div className="flex items-baseline justify-between pt-1 border-t border-amber-200">
            <span className="font-extrabold text-slate-900">Total Net Bill:</span>
            <strong className="text-base font-black text-slate-950">
              Rs. {totalBill.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* =========================================================================
          STEP 3: PAYMENT & KHATA (UDHAAR)
          ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
            3
          </span>
          <h3 className="font-extrabold text-sm text-slate-900">
            Payment & Udhaar (Khata)
          </h3>
        </div>

        {/* 3 Quick-Tap Shortcut Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handlePresetSelect("full")}
            className={`py-2 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1 border transition-all ${
              paymentPreset === "full"
                ? "bg-teal-800 text-white border-teal-800 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>Full Cash</span>
            <span className="text-[10px] font-bold text-teal-200">Rs. {totalBill.toLocaleString()}</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect("credit")}
            className={`py-2 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1 border transition-all ${
              paymentPreset === "credit"
                ? "bg-red-700 text-white border-red-700 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>Full Udhaar</span>
            <span className="text-[10px] font-bold text-red-200">Rs. 0 Paid</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect("custom")}
            className={`py-2 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1 border transition-all ${
              paymentPreset === "custom"
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>Partial Pay</span>
            <span className="text-[10px] font-bold text-slate-600">Custom Amount</span>
          </button>
        </div>

        {/* Custom Payment Amount Input (visible when Partial Pay is selected) */}
        {paymentPreset === "custom" && (
          <div className="space-y-1.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <label className="text-xs font-bold text-slate-700 block">
              Enter Cash Amount Received (Rs)
            </label>
            <input
              type="number"
              min="0"
              max={totalBill}
              value={form.paidAmount}
              onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })}
              className="w-full text-sm font-black text-slate-900 bg-white border border-amber-400 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}

        {/* Live Balance / Udhaar Status Card */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block font-semibold">
              Remaining Udhaar (Baqaya):
            </span>
            <strong
              className={`text-base font-black ${
                remainingBalance > 0 ? "text-red-600" : "text-emerald-700"
              }`}
            >
              Rs. {remainingBalance.toLocaleString()}
            </strong>
          </div>

          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full ${
              remainingBalance <= 0
                ? "bg-emerald-100 text-emerald-800"
                : paid === 0
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {remainingBalance <= 0 ? "✓ Full Paid" : paid === 0 ? "⚠️ Full Udhaar" : "Partial Paid"}
          </span>
        </div>
      </div>

      {/* =========================================================================
          BIG SUBMIT BUTTON
          ========================================================================= */}
      <button
        type="submit"
        className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 active:scale-[0.99] text-slate-950 font-black text-base shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Receipt className="w-5 h-5 text-slate-950" />
        <span>Save Sale & View Thermal Receipt</span>
      </button>
    </form>
  );
}
