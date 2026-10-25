"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "@/context/AppContext";
import {
  Search,
  Receipt,
  Eye,
  List,
  LayoutGrid,
  User,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CalendarDays,
  Filter,
  RefreshCw,
  Loader2,
  Edit3
} from "lucide-react";

export default function OrdersGrid({ onSelectOrder, onEditOrder }) {
  const { salesmen, openReceipt, EGGS_PER_PETI, currentUser } = useApp();

  // View mode: 'list' (default) or 'grid'
  const [viewMode, setViewMode] = useState("list");

  // Server-side Filters:
  // Date filter defaults strictly to 'today' for fast initial response!
  const [dateFilter, setDateFilter] = useState("today"); // 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom' | 'all'
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // 'All' | 'On Process' | 'Completed'
  const [salesmanFilter, setSalesmanFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Orders data for current filter
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch orders from backend on demand whenever filters change
  const fetchFilteredOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("dateFilter", dateFilter);
      params.set("summary", "true");

      if (dateFilter === "custom" && customStartDate) {
        params.set("startDate", customStartDate);
        if (customEndDate) {
          params.set("endDate", customEndDate);
        }
      }

      if (salesmanFilter !== "All") {
        params.set("salesmanId", salesmanFilter);
      }

      if (statusFilter !== "All") {
        params.set("status", statusFilter);
      }

      if (debouncedSearch && debouncedSearch.trim() !== "") {
        params.set("search", debouncedSearch.trim());
      }

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders || []);
          setTotalCount(data.count || (data.orders ? data.orders.length : 0));
        }
      }
    } catch (e) {
      console.error("OrdersGrid fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate, salesmanFilter, statusFilter, debouncedSearch]);

  // Trigger fetch when filter dependencies change
  useEffect(() => {
    fetchFilteredOrders();
  }, [fetchFilteredOrders]);

  // Compute summary metrics for the currently viewed orders
  const summaryPetis = orders.reduce((sum, o) => sum + (Number(o.petis) || 0), 0);
  const summaryEggs = orders.reduce((sum, o) => sum + (Number(o.netEggs) || Number(o.totalEggs) || 0), 0);
  const summaryAmount = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const summaryCollected = orders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);
  const summaryUdhaar = orders.reduce((sum, o) => sum + (Number(o.remainingBalance) || 0), 0);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
      {/* 1. Header & View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900">Orders Directory</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {totalCount} Orders
            </span>
            {isLoading && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Fetching data...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Backend on-demand filtering: data is loaded for selected dates only, keeping the app fast and lightweight.
          </p>
        </div>

        {/* View Toggle & Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFilteredOrders}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-600" : ""}`} />
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-slate-900 text-amber-400 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-slate-900 text-amber-400 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DATE FILTER BAR — Compact Dropdown */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 min-w-[200px]">
          <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full"
          >
            <option value="today">📅 Today (Aaj)</option>
            <option value="yesterday">⏮ Yesterday (Kal)</option>
            <option value="this_week">📆 Last 7 Days</option>
            <option value="this_month">🗓 This Month</option>
            <option value="custom">🔎 Custom Date Range</option>
            <option value="all">📂 All Orders (History)</option>
          </select>
        </div>

        {/* Salesman Filter Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={salesmanFilter}
            onChange={(e) => setSalesmanFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="All">All Salesmen</option>
            {salesmen.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="On Process">On Process</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, shop, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Custom Date Range Picker (shown when 'custom' is selected) */}
      {dateFilter === "custom" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-wrap items-center gap-3 text-xs">
          <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-bold text-amber-800">Custom Range:</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            onClick={fetchFilteredOrders}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-amber-400 font-bold hover:bg-slate-800 transition-colors text-xs"
          >
            Apply Filter
          </button>
        </div>
      )}

      {/* 4. Active Filter Summary Strip */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Delivered</span>
            <strong className="text-slate-900 font-extrabold text-sm">
              {summaryPetis} Petis <span className="text-xs font-medium text-slate-500">({summaryEggs.toLocaleString()} eggs)</span>
            </strong>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Billing</span>
            <strong className="text-slate-900 font-extrabold text-sm">
              Rs. {summaryAmount.toLocaleString()}
            </strong>
          </div>
          <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Cash Collected</span>
            <strong className="text-emerald-800 font-extrabold text-sm">
              Rs. {summaryCollected.toLocaleString()}
            </strong>
          </div>
          <div className="bg-red-50/70 p-2.5 rounded-xl border border-red-200/60">
            <span className="text-[10px] text-red-600 font-bold uppercase block">Pending Balance (Udhaar)</span>
            <strong className="text-red-700 font-extrabold text-sm">
              Rs. {summaryUdhaar.toLocaleString()}
            </strong>
          </div>
        </div>
      )}

      {/* 5. LIST VIEW (LIGHTWEIGHT TABLE) */}
      {viewMode === "list" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Shop Name</th>
                <th className="py-3 px-4">Salesman</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Total Bill</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="text-xs font-semibold text-slate-600">
                        Fetching {dateFilter.replace("_", " ")} orders from backend...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Calendar className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-slate-700 text-xs">
                        No orders found for the selected {dateFilter.replace("_", " ")} filter.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Try switching to "Yesterday", "Last 7 Days", or "All Orders".
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isCompleted = order.paymentStatus === "Full Paid";
                  const netEggCount = order.netEggs || order.totalEggs;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder && onSelectOrder(order)}
                      className="hover:bg-amber-50/30 cursor-pointer transition-colors group"
                    >
                      {/* 1. Order Number & Date */}
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        <span className="font-mono font-extrabold text-amber-700 block group-hover:text-amber-600">
                          #{order.id}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {order.date} • {order.time}
                        </span>
                      </td>

                      {/* 2. Shop Name & Area */}
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold text-xs block truncate max-w-[200px]">
                          {order.shopName}
                        </strong>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                          {order.area || order.shopkeeperName}
                        </span>
                      </td>

                      {/* 3. Salesman */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-amber-300" />
                          </div>
                          <span className="font-semibold text-slate-800 text-xs">
                            {order.salesmanName}
                          </span>
                        </div>
                      </td>

                      {/* 4. Quantity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 text-xs">
                          {order.petis} Petis
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {Number(netEggCount).toLocaleString()} Eggs
                          {Number(order.brokenEggs) > 0 && (
                            <span className="text-red-600 font-semibold ml-1">
                              (-{order.brokenEggs})
                            </span>
                          )}
                        </span>
                      </td>

                      {/* 5. Total Bill */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <strong className="text-slate-900 font-extrabold text-sm block">
                          Rs. {Number(order.totalAmount).toLocaleString()}
                        </strong>
                      </td>

                      {/* 6. Payment Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            <span>Paid in Full</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span>Due: Rs. {Number(order.remainingBalance).toLocaleString()}</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Action Buttons */}
                      <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectOrder && onSelectOrder(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="View Full Breakdown & Shop Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                          {currentUser?.role === "admin" && (
                            <button
                              onClick={() => onEditOrder && onEditOrder(order)}
                              className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1 border border-teal-200 transition-colors cursor-pointer"
                              title="Admin: Edit Sale Order"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                              <span>Edit</span>
                            </button>
                          )}
                          <button
                            onClick={() => openReceipt(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            title="Print Thermal Slip"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. CARDS GRID VIEW */}
      {viewMode === "grid" && (
        isLoading ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-semibold text-slate-600">Loading {dateFilter} orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            No orders found matching your filters for {dateFilter}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const isCompleted = order.paymentStatus === "Full Paid";
              return (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder && onSelectOrder(order)}
                  className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-mono font-extrabold text-amber-700 text-xs">
                          #{order.id}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                          {order.shopName}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Salesman: <strong>{order.salesmanName}</strong>
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {isCompleted ? "Paid" : "Due"}
                      </span>
                    </div>

                    <div className="py-2 border-y border-slate-100 flex justify-between text-xs text-slate-600">
                      <span>Quantity:</span>
                      <strong className="text-slate-900 font-bold">
                        {order.petis} Petis ({(order.netEggs || order.totalEggs).toLocaleString()} eggs)
                      </strong>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Bill</span>
                      <strong className="text-sm font-black text-slate-900">
                        Rs. {Number(order.totalAmount).toLocaleString()}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectOrder && onSelectOrder(order)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Details
                      </button>
                      {currentUser?.role === "admin" && (
                        <button
                          onClick={() => onEditOrder && onEditOrder(order)}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 flex items-center gap-1 cursor-pointer"
                          title="Admin: Edit Sale"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => openReceipt(order)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
