"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Package,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Calendar,
  Loader2,
  DollarSign,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Percent,
  HelpCircle,
  Truck,
  ArrowRight
} from "lucide-react";

export default function StatCards() {
  const { stats, fetchStats, EGGS_PER_PETI } = useApp();
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [specificDate, setSpecificDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMathBreakdown, setShowMathBreakdown] = useState(false);

  // Handle Preset Filter Dropdown
  const handleFilterChange = async (e) => {
    const val = e.target.value;
    setSelectedFilter(val);
    if (val === "specific") {
      // Trigger fetch with current specificDate
      setIsUpdating(true);
      try {
        await fetchStats("specific", specificDate);
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    setIsUpdating(true);
    try {
      await fetchStats(val);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Specific Date Picker Change
  const handleSpecificDateChange = async (e) => {
    const pickedDate = e.target.value;
    setSpecificDate(pickedDate);
    setSelectedFilter("specific");
    if (!pickedDate) return;

    setIsUpdating(true);
    try {
      await fetchStats("specific", pickedDate);
    } finally {
      setIsUpdating(false);
    }
  };

  // Warehouse Live Stock
  const totalStockInPetis = stats?.totalStockInPetis || 0;
  const totalStockInEggs = stats?.totalStockInEggs || 0;

  // Period / Specific Day Sales
  const totalSoldPetis = stats?.periodSoldPetis ?? stats?.todaySoldPetis ?? 0;
  const totalSoldEggs = stats?.periodSoldEggs ?? stats?.todaySoldEggs ?? 0;
  const totalGrossRevenue = stats?.grossRevenue ?? 0;
  const totalSaleRevenue = stats?.totalSaleRevenue ?? totalGrossRevenue;
  const totalCashCollected = stats?.cashCollected || 0;
  const totalUdhaarPending = stats?.pendingUdhaar || 0;
  const orderCount = stats?.orderCount || 0;

  // Cost & Profit Analysis
  const costOfSoldEggs = stats?.costOfSoldEggs ?? 0;
  const grossProfit = stats?.grossProfit ?? 0;
  const netProfit = stats?.netProfit ?? 0;
  const profitMargin = stats?.profitMargin ?? 0;
  const isNetLoss = stats?.isNetLoss || netProfit < 0;

  // Loss Analysis
  const totalLossAmount = stats?.totalLossAmount ?? 0;
  const totalBrokenEggs = stats?.totalBrokenEggs ?? 0;
  const brokenSalesEggs = stats?.brokenSalesEggs ?? 0;
  const brokenSalesLoss = stats?.brokenSalesLoss ?? 0;
  const brokenPurchaseEggs = stats?.brokenPurchaseEggs ?? 0;
  const brokenPurchaseLoss = stats?.brokenPurchaseLoss ?? 0;
  const brokenEggSaleRevenue = stats?.brokenEggSaleRevenue ?? 0;
  const brokenEggSoldEggs = stats?.brokenEggSoldEggs ?? 0;
  const brokenEggLossAmount = stats?.brokenEggLossAmount ?? 0;
  const brokenEggDiscardedEggs = stats?.brokenEggDiscardedEggs ?? 0;
  const totalExpenses = stats?.totalExpenses ?? 0;

  // Rates
  const avgSaleRatePerPeti = stats?.avgSaleRatePerPeti || 7300;
  const avgPurchaseCostPerPeti = stats?.avgPurchaseCostPerPeti || 6800;

  // Dynamic Label
  const getPeriodLabel = () => {
    if (selectedFilter === "specific") {
      if (!specificDate) return "Specific Day";
      try {
        const parts = specificDate.split("-");
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      } catch (e) {
        return specificDate;
      }
    }
    switch (selectedFilter) {
      case "yesterday":
        return "Yesterday (Kal)";
      case "this_week":
        return "Last 7 Days (Pichlay 7 Din)";
      case "this_month":
        return "This Month (Is Mahinay)";
      case "all":
        return "All Time (Total History)";
      default:
        return "Today (Aaj)";
    }
  };

  const periodLabel = getPeriodLabel();

  return (
    <div className="space-y-4">
      {/* =========================================================================
          TOP FILTER & SPECIFIC DAY SELECTOR BAR
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Godam Stats & Profit/Loss Overview
              </span>
              {isUpdating && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                  <span>Updating stats...</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Showing figures for: <strong className="text-slate-800 font-bold">{periodLabel}</strong>
            </p>
          </div>
        </div>

        {/* Filter Controls: Presets Dropdown + Specific Day Date Picker */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Period Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Period:</span>
            <select
              value={selectedFilter}
              onChange={handleFilterChange}
              disabled={isUpdating}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="today">Today (Aaj)</option>
              <option value="yesterday">Yesterday (Kal)</option>
              <option value="this_week">Last 7 Days</option>
              <option value="this_month">This Month</option>
              <option value="all">All Time History</option>
              <option value="specific">📅 Specific Day (Kisi Khas Din)</option>
            </select>
          </div>

          {/* Specific Day Date Picker (Always accessible or active on specific day) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Day:</span>
            <input
              type="date"
              value={specificDate}
              onChange={handleSpecificDateChange}
              disabled={isUpdating}
              title="Pick any specific day to view total sales, profit, and loss"
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 1: CORE SALES & WAREHOUSE INVENTORY
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Live Godam Stock */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Current Godam Stock
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalStockInPetis.toLocaleString()}
            </h3>
            <span className="text-xs sm:text-sm font-bold text-amber-600">Petis</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>≈ {totalStockInEggs.toLocaleString()} Eggs</span>
            <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded font-bold">
              {EGGS_PER_PETI}/peti
            </span>
          </p>
        </div>

        {/* 2. Outward Sales for Selected Period/Day */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {selectedFilter === "specific" ? "Day Sales" : "Sales Outward"}
            </span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalSoldPetis.toLocaleString()}
            </h3>
            <span className="text-xs sm:text-sm font-bold text-teal-700">Petis</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>{totalSoldEggs.toLocaleString()} Eggs Net</span>
            {orderCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                {orderCount} Orders
              </span>
            )}
          </div>
        </div>

        {/* 3. Total Sales Revenue (Kul Bikri) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-slate-400 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Sales (Kul Bikri)
            </span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-800">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Rs. {totalSaleRevenue.toLocaleString()}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gross Billed: Rs. {totalGrossRevenue.toLocaleString()}
          </p>
        </div>

        {/* 4. Cash Collected (Wasoori) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Cash Wasoori (Paid)
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-700">
              Rs. {totalCashCollected.toLocaleString()}
            </h3>
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            Cash in hand received
          </p>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: PROFIT, LOSS & RECEIVABLES (THE NEW PROFIT/LOSS METRICS)
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 5. Gross Profit (Kul Munafa: Bikri - Khareed Laagat) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Total Profit (Gross)</span>
            </span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800 font-bold">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-900">
              Rs. {grossProfit.toLocaleString()}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            Laagat: Rs. {costOfSoldEggs.toLocaleString()}
            {brokenEggSaleRevenue > 0 && (
              <span className="text-emerald-700 font-bold ml-1">
                • Broken Sales: +Rs. {brokenEggSaleRevenue.toLocaleString()}
              </span>
            )}
          </p>
        </div>

        {/* 6. Total Loss (Toota / Broken Eggs & Deductions) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-red-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>Total Loss (Toota)</span>
            </span>
            <span className="p-2 rounded-xl bg-red-50 text-red-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl sm:text-3xl font-black text-red-600">
              Rs. {totalLossAmount.toLocaleString()}
            </h3>
          </div>
          <p className="text-[11px] text-red-500 font-semibold mt-1">
            {totalBrokenEggs.toLocaleString()} Broken Eggs (Nuqsan)
          </p>
        </div>

        {/* 7. Net Profit (Khaalis Munafa = Gross Profit - Broken Loss) */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border shadow-xs relative overflow-hidden transition-all ${
            isNetLoss
              ? "bg-red-50/60 border-red-300 hover:border-red-400"
              : "bg-emerald-50/70 border-emerald-300 hover:border-emerald-400"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${
                isNetLoss ? "text-red-700" : "text-emerald-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isNetLoss ? "Net Loss (Khaalis Nuqsan)" : "Net Profit (Khaalis Munafa)"}</span>
            </span>
            <span
              className={`p-2 rounded-xl text-xs font-black ${
                isNetLoss ? "bg-red-200 text-red-900" : "bg-emerald-200 text-emerald-950"
              }`}
            >
              {profitMargin}%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <h3
              className={`text-2xl sm:text-3xl font-black ${
                isNetLoss ? "text-red-700" : "text-emerald-900"
              }`}
            >
              Rs. {netProfit.toLocaleString()}
            </h3>
          </div>
          <p
            className={`text-[11px] font-bold mt-1 ${
              isNetLoss ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {isNetLoss ? "Net loss after deductions" : "Net profit (After losses & expenses)"}
            {totalExpenses > 0 && ` • Kharchay: Rs. ${totalExpenses.toLocaleString()}`}
          </p>
        </div>

        {/* 8. Pending Market Udhaar (Receivable Credit) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Market Udhaar (Credit)</span>
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-800">
              Rs. {totalUdhaarPending.toLocaleString()}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pending market receivables
          </p>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE ACCORDION: PROFIT & LOSS MATHEMATICAL BREAKDOWN (HISAB KITAB)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMathBreakdown((prev) => !prev)}
          className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Profit & Loss Formula Breakdown (Hisab Kitab Formula)</span>
            <span className="text-[10px] text-slate-500 font-semibold hidden sm:inline">
              Tap to see exact math & benchmark rates
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
            <span>{showMathBreakdown ? "Hide Formula" : "Show Details"}</span>
            {showMathBreakdown ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </button>

        {showMathBreakdown && (
          <div className="p-4 bg-white border-t border-slate-100 space-y-4 text-xs animate-in fade-in duration-150">
            {/* Step by Step Math Equation */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  1. Gross Revenue (Bikri)
                </span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">
                  Rs. {totalGrossRevenue.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  {totalSoldPetis} Petis @ Avg Rs. {avgSaleRatePerPeti.toLocaleString()}/peti
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  2. (-) Khareed Laagat (Cost)
                </span>
                <span className="text-base font-black text-slate-700 mt-0.5 block">
                  - Rs. {costOfSoldEggs.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  Avg Purchase Cost @ Rs. {avgPurchaseCostPerPeti.toLocaleString()}/peti
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">
                  3. (=) Gross Profit (Munafa)
                </span>
                <span className="text-base font-black text-amber-900 mt-0.5 block">
                  Rs. {grossProfit.toLocaleString()}
                </span>
                <p className="text-[10px] text-amber-800 mt-1">
                  Kul Munafa before broken deductions
                </p>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isNetLoss ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase block ${
                    isNetLoss ? "text-red-800" : "text-emerald-800"
                  }`}
                >
                  4. (=) Net Profit (Khaalis)
                </span>
                <span
                  className={`text-base font-black mt-0.5 block ${
                    isNetLoss ? "text-red-700" : "text-emerald-900"
                  }`}
                >
                  Rs. {netProfit.toLocaleString()}
                </span>
                <p
                  className={`text-[10px] font-semibold mt-1 ${
                    isNetLoss ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  After Rs. {totalLossAmount.toLocaleString()} toota & Rs. {totalExpenses.toLocaleString()} kharchay ({profitMargin}%)
                </p>
              </div>
            </div>

            {/* Broken Eggs Detail Table */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 block">
                  Broken Eggs (Toote Hue Anday) Breakdown:
                </span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Farm Inward: {brokenPurchaseEggs} eggs (Rs. {brokenPurchaseLoss.toLocaleString()}) • Field Return: {brokenSalesEggs} eggs
                  {brokenEggSoldEggs > 0 && ` • Sold for Profit: ${brokenEggSoldEggs} eggs (+Rs. ${brokenEggSaleRevenue.toLocaleString()})`}
                  {brokenEggDiscardedEggs > 0 && ` • Discarded Waste: ${brokenEggDiscardedEggs} eggs (-Rs. ${brokenEggLossAmount.toLocaleString()})`}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 font-black text-[11px] shrink-0">
                Total Nuqsan: Rs. {totalLossAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
