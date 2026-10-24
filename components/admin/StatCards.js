"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Package,
  TrendingUp,
  CheckCircle2,
  Clock,
  Calendar,
  Loader2
} from "lucide-react";

export default function StatCards() {
  const { stats, fetchStats, EGGS_PER_PETI } = useApp();
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFilterChange = async (e) => {
    const val = e.target.value;
    setSelectedFilter(val);
    setIsUpdating(true);
    try {
      await fetchStats(val);
    } finally {
      setIsUpdating(false);
    }
  };

  const totalStockInPetis = stats?.totalStockInPetis || 0;
  const totalStockInEggs = stats?.totalStockInEggs || 0;
  const totalSoldPetis = stats?.todaySoldPetis || stats?.periodSoldPetis || 0;
  const totalSoldEggs = stats?.todaySoldEggs || stats?.periodSoldEggs || 0;
  const totalCashCollected = stats?.cashCollected || 0;
  const totalUdhaarPending = stats?.pendingUdhaar || 0;

  // Dynamic Card Titles based on selected date filter
  const getPeriodLabel = () => {
    switch (selectedFilter) {
      case "yesterday":
        return "Yesterday";
      case "this_week":
        return "Last 7 Days";
      case "this_month":
        return "This Month";
      case "all":
        return "All Time";
      default:
        return "Today";
    }
  };

  const periodLabel = getPeriodLabel();

  return (
    <div className="space-y-3">
      {/* Top Filter Bar for Dashboard KPIs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Godam Performance Overview
          </span>
          {isUpdating && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
              <span>Updating...</span>
            </span>
          )}
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-slate-500">Filter:</span>
          <select
            value={selectedFilter}
            onChange={handleFilterChange}
            disabled={isUpdating}
            className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="today">Today (Aaj)</option>
            <option value="yesterday">Yesterday (Kal)</option>
            <option value="this_week">Last 7 Days (Pichlay 7 Din)</option>
            <option value="this_month">This Month (Is Mahinay)</option>
            <option value="all">All Time (Total History)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* 1. Total Warehouse Stock (Live Current Balance) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current Stock in Godam
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Package className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalStockInPetis.toLocaleString()}
            </h3>
            <span className="text-xs sm:text-sm font-bold text-amber-600">Petis</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>≈ {totalStockInEggs.toLocaleString()} Total Eggs</span>
            <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-semibold">
              {EGGS_PER_PETI}/peti
            </span>
          </p>
        </div>

        {/* 2. Outward Sales for Selected Period */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {periodLabel}'s Outward (Sales)
            </span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalSoldPetis.toLocaleString()}
            </h3>
            <span className="text-xs sm:text-sm font-bold text-teal-700">Petis</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {totalSoldEggs.toLocaleString()} Total Eggs Delivered
          </p>
        </div>

        {/* 3. Cash Collected for Selected Period */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cash Collected ({periodLabel})
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              Rs. {totalCashCollected.toLocaleString()}
            </h3>
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            Received in full
          </p>
        </div>

        {/* 4. Pending Credit / Balance for Selected Period */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receivable Credit ({periodLabel})
            </span>
            <span className="p-2 rounded-xl bg-red-50 text-red-600">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-red-600">
              Rs. {totalUdhaarPending.toLocaleString()}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Market Credit / Udhaar
          </p>
        </div>
      </div>
    </div>
  );
}
