"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { Receipt, Calendar, Loader2, User, RefreshCw } from "lucide-react";

export default function ReportsView({ selectedSalesmanId, onSalesmanChange }) {
  const { salesmen, openReceipt } = useApp();
  const [filterId, setFilterId] = useState(selectedSalesmanId || "All");
  const [dateFilter, setDateFilter] = useState("this_month"); // 'all' | 'this_month' | 'today' | 'this_week'
  const [reportOrders, setReportOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterId !== "All") {
        params.set("salesmanId", filterId);
      }
      params.set("dateFilter", dateFilter);
      params.set("summary", "true");

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReportOrders(data.orders || []);
        }
      }
    } catch (e) {
      console.error("Reports fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [filterId, dateFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleChangeSalesman = (e) => {
    const val = e.target.value;
    setFilterId(val);
    if (onSalesmanChange) onSalesmanChange(val);
  };

  const totalPetis = reportOrders.reduce((a, b) => a + Number(b.petis || 0), 0);
  const totalEggs = reportOrders.reduce((a, b) => a + Number(b.netEggs || b.totalEggs || 0), 0);
  const totalBill = reportOrders.reduce((a, b) => a + Number(b.totalAmount || 0), 0);
  const totalPaid = reportOrders.reduce((a, b) => a + Number(b.paidAmount || 0), 0);
  const totalBalance = reportOrders.reduce((a, b) => a + Number(b.remainingBalance || 0), 0);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              Salesmen Detailed Reports & Khata Ledger
            </h2>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
          </div>
          <p className="text-xs text-slate-500">
            On-demand report ledger: individual salesman petis sold, cash collected, and market credit
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
            {[
              { id: "today", label: "Today" },
              { id: "this_week", label: "7 Days" },
              { id: "this_month", label: "This Month" },
              { id: "all", label: "All Time" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  dateFilter === d.id
                    ? "bg-amber-400 text-slate-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Salesman Select */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
            <User className="w-3.5 h-3.5 text-amber-600" />
            <select
              value={filterId}
              onChange={handleChangeSalesman}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Salesmen Combined</option>
              {salesmen.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.route})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchReports}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
          <span className="text-[11px] font-bold text-amber-800 uppercase">Total Petis Sold</span>
          <h4 className="text-2xl font-black text-slate-900 mt-1">{totalPetis} Petis</h4>
          <p className="text-xs text-slate-500">{totalEggs.toLocaleString()} Total Eggs</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-600 uppercase">Gross Sales Value</span>
          <h4 className="text-2xl font-black text-slate-900 mt-1">
            Rs. {totalBill.toLocaleString()}
          </h4>
          <p className="text-xs text-slate-500">Total Billed Amount</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
          <span className="text-[11px] font-bold text-emerald-800 uppercase">Cash Collected</span>
          <h4 className="text-2xl font-black text-emerald-700 mt-1">
            Rs. {totalPaid.toLocaleString()}
          </h4>
          <p className="text-xs text-emerald-600">Paid to Godam</p>
        </div>
        <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200">
          <span className="text-[11px] font-bold text-red-800 uppercase">Market Credit (Udhaar)</span>
          <h4 className="text-2xl font-black text-red-600 mt-1">
            Rs. {totalBalance.toLocaleString()}
          </h4>
          <p className="text-xs text-red-500">Pending Receivables</p>
        </div>
      </div>

      {/* Deliveries Table */}
      <div>
        <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center justify-between">
          <span>Shop-by-Shop Deliveries Breakdown ({reportOrders.length} Invoices)</span>
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px] bg-slate-50">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Shop Name</th>
                <th className="py-3 px-4">Salesman</th>
                <th className="py-3 px-4">Quantity Sold</th>
                <th className="py-3 px-4">Rate / Peti</th>
                <th className="py-3 px-4">Bill Amount</th>
                <th className="py-3 px-4">Cash Received</th>
                <th className="py-3 px-4">Remaining Balance</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Loading report records...</span>
                  </td>
                </tr>
              ) : reportOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No sales reports or deliveries found for this selection.
                  </td>
                </tr>
              ) : (
                reportOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                      #{order.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{order.shopName}</span>
                      <span className="text-[11px] text-slate-500">{order.area}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {order.salesmanName}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {order.petis} Petis {order.looseEggs > 0 ? `+ ${order.looseEggs} Eggs` : ""}
                      <span className="text-[11px] text-teal-800 block font-normal">
                        ({(order.netEggs || order.totalEggs || 0).toLocaleString()} eggs)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">Rs. {Number(order.ratePerPeti || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      Rs. {Number(order.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      Rs. {Number(order.paidAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-red-600">
                      Rs. {Number(order.remainingBalance || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => openReceipt(order)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-amber-700" />
                        <span>Receipt</span>
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
  );
}
