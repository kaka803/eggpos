"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import BrokenEggActionModal from "./BrokenEggActionModal";
import NewExpenseModal from "./NewExpenseModal";
import {
  PlusCircle,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Package,
  Loader2,
  TrendingUp,
  ShoppingBag,
  Trash2,
  Calendar,
  Clock,
  Layers,
  ArrowDownLeft,
  Truck,
  Store,
  DollarSign,
  Fuel,
  Users,
  Box,
  Receipt,
  FileText,
  Filter,
  Plus
} from "lucide-react";

export default function StockInwardView({ onOpenAddStock, onEditStock }) {
  const {
    stockInwards,
    totalBrokenEggsPurchase,
    isStockLoading,
    EGGS_PER_PETI,
    brokenEggsData,
    isBrokenEggsLoading,
    fetchBrokenEggs,
    addBrokenEggAction,
    deleteBrokenEggAction,
    expenses,
    isExpensesLoading,
    fetchExpenses,
    addExpense,
    deleteExpense,
  } = useApp();

  // Sub-tabs: 'batches' | 'broken' | 'expenses'
  const [subTab, setSubTab] = useState("batches");

  // Broken tab filters: 'all' | 'sales' | 'loss' | 'sources'
  const [brokenFilter, setBrokenFilter] = useState("all");

  // Expenses tab filters: category & date
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [expenseDateFilter, setExpenseDateFilter] = useState("all");

  // Modal States
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalType, setActionModalType] = useState("sale");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // Fetch broken eggs & expenses on mount
  useEffect(() => {
    fetchBrokenEggs();
    fetchExpenses("all");
  }, [fetchBrokenEggs, fetchExpenses]);

  // Broken Eggs Summary & Filtered Data
  const brokenSummary = brokenEggsData?.summary || {
    totalInwardBroken: 0,
    totalSalesReturnBroken: 0,
    totalWarehouseBroken: 0,
    totalBrokenInflow: 0,
    totalSoldEggs: 0,
    totalSoldRevenue: 0,
    totalLossEggs: 0,
    totalLossAmount: 0,
    availableBrokenEggs: 0,
    availableBrokenPetis: 0,
    availableBrokenLoose: 0,
  };

  const brokenActions = brokenEggsData?.actions || [];
  const inwardRecords = brokenEggsData?.inwardRecords || [];
  const salesReturnRecords = brokenEggsData?.salesReturnRecords || [];

  const filteredBrokenActions = useMemo(() => {
    if (brokenFilter === "sales") return brokenActions.filter((a) => a.actionType === "sale");
    if (brokenFilter === "loss") return brokenActions.filter((a) => a.actionType === "loss");
    if (brokenFilter === "breakage") return brokenActions.filter((a) => a.actionType === "warehouse_breakage");
    return brokenActions;
  }, [brokenActions, brokenFilter]);

  // Expenses Aggregations & Filtered List
  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter((exp) => {
      const matchCat = expenseCategoryFilter === "all" || exp.category === expenseCategoryFilter;
      return matchCat;
    });
  }, [expenses, expenseCategoryFilter]);

  const totalExpenseAmount = useMemo(() => {
    return (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const fuelExpenses = useMemo(() => {
    return (expenses || [])
      .filter((e) => e.category === "Fuel & Transport" || e.category === "Vehicle Maintenance")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const laborExpenses = useMemo(() => {
    return (expenses || [])
      .filter((e) => e.category === "Labor & Wages")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const packagingUtilitiesExpenses = useMemo(() => {
    return (expenses || [])
      .filter(
        (e) =>
          e.category === "Packaging & Trays" ||
          e.category === "Utilities & Electricity" ||
          e.category === "Rent & Godam"
      )
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Handlers
  const handleOpenActionModal = (type) => {
    setActionModalType(type);
    setIsActionModalOpen(true);
  };

  const handleActionSubmit = async (payload) => {
    await addBrokenEggAction(payload);
  };

  const handleDeleteBrokenAction = async (id) => {
    if (!confirm("Are you sure you want to remove this record? The broken egg stock will be restored.")) {
      return;
    }
    setIsDeletingId(id);
    try {
      await deleteBrokenEggAction(id);
    } catch (e) {
      alert("Error deleting record: " + e.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleExpenseSubmit = async (payload) => {
    await addExpense(payload);
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("Are you sure you want to delete this expense record?")) {
      return;
    }
    setIsDeletingId(id);
    try {
      await deleteExpense(id);
    } catch (e) {
      alert("Error deleting expense: " + e.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900">
              Warehouse Operations & Inward Management
            </h2>
            {(isStockLoading || isBrokenEggsLoading || isExpensesLoading) && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
                <span>Syncing...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage farm inward deliveries, broken egg inventory pool, and operational expenses for accurate Net Profit calculation.
          </p>
        </div>

        {/* Tab-Specific Primary Action Button */}
        <div>
          {subTab === "batches" && (
            <button
              onClick={onOpenAddStock}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#044E45] text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-[#033c35] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Stock Inward</span>
            </button>
          )}

          {subTab === "broken" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenActionModal("sale")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>+ Sell Broken</span>
              </button>
              <button
                onClick={() => handleOpenActionModal("loss")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>+ Mark Loss</span>
              </button>
            </div>
          )}

          {subTab === "expenses" && (
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean, Organized Segmented Tab Bar */}
      <div className="flex border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
          {/* Tab 1: Farm Stock Inwards */}
          <button
            onClick={() => setSubTab("batches")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              subTab === "batches"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Package className="w-4 h-4 text-teal-700" />
            <span>Farm Stock Inwards</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {stockInwards.length}
            </span>
          </button>

          {/* Tab 2: Broken Eggs Pool */}
          <button
            onClick={() => {
              setSubTab("broken");
              fetchBrokenEggs();
            }}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              subTab === "broken"
                ? "border-amber-500 text-amber-900"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Broken Eggs (Tootay Anday)</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                brokenSummary.availableBrokenEggs > 0
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {brokenSummary.availableBrokenEggs.toLocaleString()}
            </span>
          </button>

          {/* Tab 3: Warehouse Expenses */}
          <button
            onClick={() => {
              setSubTab("expenses");
              fetchExpenses("all");
            }}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              subTab === "expenses"
                ? "border-rose-600 text-rose-800"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <DollarSign className="w-4 h-4 text-rose-600" />
            <span>Warehouse Expenses (Kharchay)</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              Rs. {totalExpenseAmount.toLocaleString()}
            </span>
          </button>
        </nav>
      </div>

      {/* =========================================================================
          SUB-TAB 1: FARM INWARD BATCHES TABLE
          ========================================================================= */}
      {subTab === "batches" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Incoming egg petis from poultry farms with breakage deductions and editable records</span>
            {totalBrokenEggsPurchase > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{totalBrokenEggsPurchase} Total Broken Eggs Deducted at Inward</span>
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/80 tracking-wider">
                  <th className="py-3.5 px-4">Batch ID</th>
                  <th className="py-3.5 px-4">Supplier / Farm</th>
                  <th className="py-3.5 px-4">Petis (Boxes)</th>
                  <th className="py-3.5 px-4">Toote Anday (Broken)</th>
                  <th className="py-3.5 px-4">Net Usable Eggs</th>
                  <th className="py-3.5 px-4">Rate / Peti</th>
                  <th className="py-3.5 px-4">Net Total Cost</th>
                  <th className="py-3.5 px-4">Vehicle #</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isStockLoading && stockInwards.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-7 h-7 animate-spin text-teal-700" />
                        <p className="font-semibold text-sm text-slate-700">Loading stock purchases from database...</p>
                      </div>
                    </td>
                  </tr>
                ) : stockInwards.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-sm text-slate-600">No stock purchases recorded yet</p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Click the "+ Add Stock Inward" button above to record your first farm delivery batch.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stockInwards.map((stock) => {
                    const grossEggs = stock.grossEggs || Number(stock.petis) * (EGGS_PER_PETI || 360);
                    const broken = Number(stock.brokenEggs) || 0;
                    const netEggs = stock.netEggs || grossEggs - broken;

                    return (
                      <tr key={stock.id} className="hover:bg-amber-50/30 transition-colors group">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                          {stock.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{stock.supplier}</span>
                          <span className="text-[11px] text-slate-500">{stock.phone}</span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          {stock.petis} Petis
                          <span className="text-[10px] text-slate-400 block font-normal">
                            ({grossEggs.toLocaleString()} gross)
                          </span>
                        </td>

                        {/* TOOTE ANDAY (BROKEN EGGS) */}
                        <td className="py-3.5 px-4">
                          {broken > 0 ? (
                            <div>
                              <span className="text-red-600 font-black flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                <span>{broken} Eggs Broken</span>
                              </span>
                              {stock.brokenDeduction > 0 && (
                                <span className="text-[10px] text-red-500 font-medium block">
                                  - Rs. {Number(stock.brokenDeduction).toLocaleString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                              0 Damaged
                            </span>
                          )}
                        </td>

                        {/* NET USABLE EGGS */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-teal-800 block">
                            {Number(netEggs).toLocaleString()} Eggs
                          </span>
                          <span className="text-[10px] text-slate-400 block">{stock.grade}</span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          Rs. {Number(stock.ratePerPeti).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 font-black text-slate-900">
                          Rs. {Number(stock.totalCost).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {stock.vehicleNo}
                        </td>

                        {/* EDIT ACTION BUTTON */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => onEditStock && onEditStock(stock)}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors shadow-xs cursor-pointer"
                            title="Edit this purchase record"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: BROKEN EGGS MANAGEMENT (TOOTAY ANDAY POOL, SALES & LOSSES)
          ========================================================================= */}
      {subTab === "broken" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top 4 KPI Cards for Broken Egg Inventory */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Available In-Stock Broken Eggs */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                  Available Broken Stock
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950">
                  In Godam
                </span>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-amber-950 mt-1">
                {brokenSummary.availableBrokenEggs.toLocaleString()}{" "}
                <span className="text-sm font-bold text-amber-800">Eggs</span>
              </h4>
              <p className="text-xs text-amber-800 mt-1 font-semibold">
                ≈ {brokenSummary.availableBrokenPetis} Petis + {brokenSummary.availableBrokenLoose} loose eggs
              </p>
            </div>

            {/* 2. Total Inflow Collected */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Inflow Collected
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {brokenSummary.totalBrokenInflow.toLocaleString()}{" "}
                <span className="text-sm font-normal text-slate-500">Eggs</span>
              </h4>
              <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span>Farm Deliveries:</span>
                  <strong className="text-slate-800">{brokenSummary.totalInwardBroken}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Salesmen Returns:</span>
                  <strong className="text-slate-800">{brokenSummary.totalSalesReturnBroken}</strong>
                </div>
              </div>
            </div>

            {/* 3. Sold Broken Eggs (Direct Profit) */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Sold for Profit
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  + Added to Profit
                </span>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                Rs. {brokenSummary.totalSoldRevenue.toLocaleString()}
              </h4>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                {brokenSummary.totalSoldEggs.toLocaleString()} Eggs Sold to Bakeries / Vendors
              </p>
            </div>

            {/* 4. Written-off / Discarded (Loss) */}
            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-800">
                  Total Loss / Discarded
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                  Waste Write-Off
                </span>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-red-600 mt-1">
                {brokenSummary.totalLossEggs.toLocaleString()}{" "}
                <span className="text-sm font-bold text-red-500">Eggs</span>
              </h4>
              <p className="text-xs text-red-600 font-semibold mt-1">
                ≈ Rs. {brokenSummary.totalLossAmount.toLocaleString()} Estimated Loss
              </p>
            </div>
          </div>

          {/* Activity Log / Filter Tabs */}
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">
                  Activity History & Disposal Records
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {brokenActions.length} Records
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setBrokenFilter("all")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    brokenFilter === "all"
                      ? "bg-white text-slate-950 shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({brokenActions.length})
                </button>
                <button
                  onClick={() => setBrokenFilter("sales")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    brokenFilter === "sales"
                      ? "bg-emerald-600 text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Sales (Profit)
                </button>
                <button
                  onClick={() => setBrokenFilter("loss")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    brokenFilter === "loss"
                      ? "bg-red-600 text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Loss / Waste
                </button>
                <button
                  onClick={() => setBrokenFilter("sources")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    brokenFilter === "sources"
                      ? "bg-slate-900 text-amber-300 shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Incoming Sources
                </button>
              </div>
            </div>

            {/* VIEW 1: ACTIONS HISTORY TABLE */}
            {brokenFilter !== "sources" && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/80 tracking-wider">
                      <th className="py-3 px-4">Date / Time</th>
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Rate & Amount</th>
                      <th className="py-3 px-4">Buyer / Reason</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBrokenActions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          <p className="font-semibold text-sm text-slate-600">No records found for this filter</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Use the "+ Sell Broken" or "+ Mark Loss" buttons above to record actions.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredBrokenActions.map((act) => {
                        const isSale = act.actionType === "sale";
                        const isLoss = act.actionType === "loss";

                        return (
                          <tr key={act.id || act._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 block">{act.date}</span>
                              <span className="text-[11px] text-slate-500">{act.time}</span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${
                                  isSale
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : isLoss
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-amber-50 text-amber-900 border-amber-300"
                                }`}
                              >
                                {isSale ? "💰 Sold (Profit)" : isLoss ? "⚠️ Loss / Waste" : "📦 Godam Damage"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-black text-slate-900">
                              {Number(act.quantityEggs).toLocaleString()} Eggs
                              <span className="text-[10px] text-slate-500 block font-normal">
                                ≈ {(Number(act.quantityEggs) / 360).toFixed(1)} Petis
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {isSale ? (
                                <div>
                                  <span className="font-black text-emerald-700 block">
                                    + Rs. {Number(act.totalAmount).toLocaleString()}
                                  </span>
                                  {act.ratePerEgg > 0 && (
                                    <span className="text-[11px] text-slate-500">
                                      @ Rs. {act.ratePerEgg} / egg
                                    </span>
                                  )}
                                </div>
                              ) : isLoss ? (
                                <span className="font-bold text-red-600">
                                  - Rs. {Number(act.estimatedLossAmount).toLocaleString()} Loss
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500 font-semibold">
                                  Added to pool
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {isSale ? (
                                <div>
                                  <span className="font-bold text-slate-900 block">
                                    {act.buyerName || "Direct Cash Buyer"}
                                  </span>
                                  {act.buyerPhone && (
                                    <span className="text-[11px] text-slate-500 font-mono">
                                      {act.buyerPhone}
                                    </span>
                                  )}
                                </div>
                              ) : isLoss ? (
                                <span className="font-semibold text-slate-700">
                                  {act.lossReason || "Rotten / Leaked"}
                                </span>
                              ) : (
                                <span className="text-slate-500">Handling break</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-xs text-slate-600 max-w-[200px] truncate">
                              {act.notes || "—"}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleDeleteBrokenAction(act.id || act._id)}
                                disabled={isDeletingId === (act.id || act._id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Delete this entry and restore stock"
                              >
                                {isDeletingId === (act.id || act._id) ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW 2: INCOMING SOURCES BREAKDOWN TABLE */}
            {brokenFilter === "sources" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Farm Inward Batches Broken Eggs */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-teal-700" />
                      <h4 className="font-extrabold text-xs text-slate-900">
                        Broken Eggs from Farm Inward Purchases
                      </h4>
                    </div>
                    <span className="text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                      {brokenSummary.totalInwardBroken.toLocaleString()} Total Eggs
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {inwardRecords.length === 0 ? (
                      <p className="py-6 text-center text-slate-400">No broken eggs recorded in farm shipments</p>
                    ) : (
                      inwardRecords.map((r) => (
                        <div key={r.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-amber-700 mr-2">{r.batchId}</span>
                            <span className="font-bold text-slate-900">{r.supplier}</span>
                            <span className="text-[11px] text-slate-400 block">{r.date}</span>
                          </div>
                          <span className="font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                            {r.brokenEggs} Broken
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Salesmen Field Deliveries Broken Eggs Returns */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-amber-700" />
                      <h4 className="font-extrabold text-xs text-slate-900">
                        Broken Eggs from Sales Deliveries
                      </h4>
                    </div>
                    <span className="text-xs font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                      {brokenSummary.totalSalesReturnBroken.toLocaleString()} Total Eggs
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {salesReturnRecords.length === 0 ? (
                      <p className="py-6 text-center text-slate-400">No broken eggs reported in sales deliveries</p>
                    ) : (
                      salesReturnRecords.map((r) => (
                        <div key={r.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-slate-700 mr-2">#{r.invoiceNo}</span>
                            <span className="font-bold text-slate-900">{r.shopName}</span>
                            <span className="text-[11px] text-slate-500 block">
                              Salesman: {r.salesmanName} • {r.date}
                            </span>
                          </div>
                          <span className="font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                            {r.brokenEggs} Broken
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: WAREHOUSE EXPENSES (KHARCHAY)
          ========================================================================= */}
      {subTab === "expenses" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 4 Expense KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Total Expenses */}
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-900">
                  Total Expenses
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-950">
                  Deducted from Net Profit
                </span>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">
                Rs. {totalExpenseAmount.toLocaleString()}
              </h4>
              <p className="text-xs text-rose-800 mt-1 font-semibold">
                {expenses.length} Total Expense Records
              </p>
            </div>

            {/* 2. Fuel & Transport */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Fuel & Vehicles
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">
                Rs. {fuelExpenses.toLocaleString()}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Petrol, loaders & maintenance
              </p>
            </div>

            {/* 3. Labor & Wages */}
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                Labor & Wages
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">
                Rs. {laborExpenses.toLocaleString()}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Daily labor & driver allowances
              </p>
            </div>

            {/* 4. Packaging, Trays & Rent */}
            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">
                Packaging & Utilities
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-purple-900 mt-1">
                Rs. {packagingUtilitiesExpenses.toLocaleString()}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Trays, godam rent, electricity bills
              </p>
            </div>
          </div>

          {/* Expenses Table Header & Filter Bar */}
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">
                  Expense Records & Ledger
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {filteredExpenses.length} Records
                </span>
              </div>

              {/* Category Filter Dropdown */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-bold text-slate-500">Category:</span>
                  <select
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="Fuel & Transport">Fuel & Transport</option>
                    <option value="Labor & Wages">Labor & Wages</option>
                    <option value="Packaging & Trays">Packaging & Trays</option>
                    <option value="Rent & Godam">Rent & Godam</option>
                    <option value="Utilities & Electricity">Utilities & Electricity</option>
                    <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                    <option value="Refreshments & Tea">Refreshments & Tea</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/80 tracking-wider">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description / Title</th>
                    <th className="py-3 px-4">Paid To</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Amount (Rs)</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <p className="font-semibold text-sm text-slate-600">No expenses recorded yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Click the "+ Record Expense" button above to record warehouse operational costs.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id || exp._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{exp.date}</span>
                          <span className="text-[11px] text-slate-500">{exp.time}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                            {exp.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {exp.title}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {exp.paidTo || "—"}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-600 font-medium">
                            {exp.paymentMode || "Cash"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-black text-rose-600 text-sm">
                          Rs. {Number(exp.amount).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[180px] truncate">
                          {exp.notes || "—"}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteExpense(exp.id || exp._id)}
                            disabled={isDeletingId === (exp.id || exp._id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete this expense"
                          >
                            {isDeletingId === (exp.id || exp._id) ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Broken Egg Action Modal */}
      <BrokenEggActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        initialType={actionModalType}
        availableStock={brokenSummary.availableBrokenEggs}
        onSubmit={handleActionSubmit}
      />

      {/* New Expense Modal */}
      <NewExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleExpenseSubmit}
      />
    </div>
  );
}
