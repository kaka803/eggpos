"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  X,
  Store,
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageCircle,
  Truck,
  Loader2,
  FileText,
  ArrowRight,
  Check,
  RefreshCw
} from "lucide-react";

export default function CustomerLedgerModal({ isOpen, onClose, customer }) {
  const { openReceipt, EGGS_PER_PETI } = useApp();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'unpaid' | 'cleared'

  useEffect(() => {
    if (!isOpen || !customer?.phone) {
      setOrders([]);
      return;
    }

    const fetchCustomerOrders = async () => {
      setIsLoading(true);
      try {
        const rawDigits = (customer.phone || "").replace(/[^0-9]/g, "");
        const res = await fetch(
          `/api/orders?customerPhone=${encodeURIComponent(rawDigits)}&limit=100&summary=false`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.orders) {
            setOrders(data.orders || []);
          }
        }
      } catch (err) {
        console.error("Error fetching customer ledger:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerOrders();
  }, [isOpen, customer?.phone]);

  // Aggregate Customer Ledger Figures
  const stats = useMemo(() => {
    let totalPetis = 0;
    let totalEggs = 0;
    let totalSalesBilled = 0;
    let totalCashPaid = 0;
    let activePendingBalance = 0;
    let totalClearedUdhaar = 0;

    for (const o of orders) {
      const petis = Number(o.petis) || 0;
      const eggs = Number(o.netEggs) || Number(o.totalEggs) || petis * (EGGS_PER_PETI || 360);
      const saleAmount =
        Number(o.currentSaleAmount) ||
        Math.max(0, Number(o.totalAmount || 0) - Number(o.previousBalance || 0));
      const paid = Number(o.paidAmount) || 0;
      const rem = Number(o.remainingBalance) || 0;

      totalPetis += petis;
      totalEggs += eggs;
      totalSalesBilled += saleAmount;
      totalCashPaid += paid;

      // Only count active unsettled orders towards pending balance
      if (!o.settledInOrder && rem > 0) {
        activePendingBalance += rem;
      }

      // If this order cleared previous orders
      if (Array.isArray(o.previousOrdersUdhaar) && o.previousOrdersUdhaar.length > 0) {
        const clearedSum = o.previousOrdersUdhaar.reduce(
          (sum, p) => sum + (Number(p.remainingBalance) || 0),
          0
        );
        totalClearedUdhaar += clearedSum;
      }
    }

    // Add customer initial opening balance if active
    const openingBal = Number(customer?.openingBalance) || 0;
    activePendingBalance += openingBal;

    return {
      totalDeliveries: orders.length,
      totalPetis,
      totalEggs,
      totalSalesBilled,
      totalCashPaid,
      activePendingBalance,
      totalClearedUdhaar,
      openingBal,
    };
  }, [orders, customer, EGGS_PER_PETI]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (filterMode === "unpaid") {
      return orders.filter((o) => !o.settledInOrder && Number(o.remainingBalance) > 0);
    }
    if (filterMode === "cleared") {
      return orders.filter(
        (o) =>
          o.settledInOrder ||
          (Array.isArray(o.previousOrdersUdhaar) && o.previousOrdersUdhaar.length > 0) ||
          Number(o.remainingBalance) === 0
      );
    }
    return orders;
  }, [orders, filterMode]);

  if (!isOpen || !customer) return null;

  // Format WhatsApp Ledger Message
  const getWhatsAppStatementUrl = () => {
    const raw = (customer.phone || "").replace(/[^0-9]/g, "");
    let phoneNum = raw;
    if (phoneNum.startsWith("0")) {
      phoneNum = "92" + phoneNum.slice(1);
    }

    const text = encodeURIComponent(
      `*── AndaGodam POS: Customer Statement ──*\n` +
        `🏪 *Shop:* ${customer.shopName}\n` +
        `👤 *Owner:* ${customer.shopkeeperName || "Customer"}\n` +
        `📞 *Phone:* ${customer.phone}\n` +
        `📍 *Area:* ${customer.area || "City Route"}\n` +
        `─────────────────────\n` +
        `📦 *Total Deliveries:* ${stats.totalDeliveries} Orders (${stats.totalPetis} Petis)\n` +
        `💰 *Total Sales Billed:* Rs. ${stats.totalSalesBilled.toLocaleString()}\n` +
        `💵 *Total Cash Received:* Rs. ${stats.totalCashPaid.toLocaleString()}\n` +
        `⚠️ *Current Pending Balance:* Rs. ${stats.activePendingBalance.toLocaleString()}\n` +
        `─────────────────────\n` +
        `Thank you!\n*AndaGodam Egg Wholesale Management*`
    );
    return `https://wa.me/${phoneNum}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-sm shrink-0">
              <Store className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  {customer.shopName}
                </h3>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    stats.activePendingBalance > 0
                      ? "bg-red-500/20 text-red-300 border-red-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {stats.activePendingBalance > 0
                    ? `⚠️ Due: Rs. ${stats.activePendingBalance.toLocaleString()}`
                    : "✓ Cleared"}
                </span>
              </div>
              <p className="text-xs text-amber-300/90 flex flex-wrap items-center gap-2 mt-0.5">
                <span>{customer.shopkeeperName || "Customer"}</span>
                <span>•</span>
                <span className="font-mono">{customer.phone}</span>
                {customer.area && (
                  <>
                    <span>•</span>
                    <span>{customer.area}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getWhatsAppStatementUrl()}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Statement</span>
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Summary KPI Cards for this Customer */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Total Sales to date */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                All-Time Total Sales
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Rs. {stats.totalSalesBilled.toLocaleString()}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {stats.totalPetis} Petis ({stats.totalEggs.toLocaleString()} Eggs)
              </p>
            </div>

            {/* 2. Total Cash Received */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Cash Received
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                Rs. {stats.totalCashPaid.toLocaleString()}
              </h4>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-semibold">
                Customer paid to warehouse
              </p>
            </div>

            {/* 3. Current Outstanding Udhaar */}
            <div
              className={`p-3.5 rounded-2xl border ${
                stats.activePendingBalance > 0
                  ? "bg-red-50/80 border-red-300"
                  : "bg-emerald-50/50 border-emerald-200"
              }`}
            >
              <span
                className={`text-[10px] font-black uppercase tracking-wider block ${
                  stats.activePendingBalance > 0 ? "text-red-700" : "text-emerald-800"
                }`}
              >
                Current Pending Balance
              </span>
              <h4
                className={`text-xl sm:text-2xl font-black mt-1 ${
                  stats.activePendingBalance > 0 ? "text-red-600" : "text-emerald-700"
                }`}
              >
                Rs. {stats.activePendingBalance.toLocaleString()}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {stats.activePendingBalance > 0 ? "Pending market credit" : "Balance fully cleared"}
              </p>
            </div>

            {/* 4. Total Cleared Udhaar History */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Credit Cleared
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
                Rs. {stats.totalClearedUdhaar.toLocaleString()}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {stats.totalDeliveries} Invoices recorded
              </p>
            </div>
          </div>

          {/* Ledger History Section Header & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Complete Sales & Settlement History Ledger</span>
              </h4>
              <p className="text-xs text-slate-500">
                Detailed record of every invoice, credit issued, and payments cleared
              </p>
            </div>

            {/* Filter Tabs: All | Unpaid Invoices | Cleared Invoices */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === "all"
                    ? "bg-white text-slate-950 shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setFilterMode("unpaid")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === "unpaid"
                    ? "bg-red-500 text-white shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Unpaid Credit
              </button>
              <button
                onClick={() => setFilterMode("cleared")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === "cleared"
                    ? "bg-emerald-600 text-white shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cleared
              </button>
            </div>
          </div>

          {/* Initial Opening Balance Note if customer had one */}
          {customer.openingBalance > 0 && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <span className="font-bold text-amber-950 block">
                    Starting / Opening Credit Balance: Rs. {Number(customer.openingBalance).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Initial balance recorded when registering customer in the system.
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-200/80 text-amber-950">
                Opening Balance
              </span>
            </div>
          )}

          {/* Orders / Invoices Detailed List */}
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs font-semibold text-slate-600">
                Loading complete customer ledger records...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No invoices found for this filter.</p>
              <p className="text-xs text-slate-500">
                Sales orders created for this customer will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((ord) => {
                const isSettled = !!ord.settledInOrder;
                const hasPendingBal = !isSettled && Number(ord.remainingBalance) > 0;
                const clearedPrevious =
                  Array.isArray(ord.previousOrdersUdhaar) && ord.previousOrdersUdhaar.length > 0;

                return (
                  <div
                    key={ord.id || ord._id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 transition-all shadow-2xs space-y-3"
                  >
                    {/* Header: Date, Invoice #, Salesman, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          #{ord.invoiceNo || ord.id}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ord.date}</span>
                          <span className="text-slate-400">•</span>
                          <span>{ord.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {ord.salesmanName && (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Truck className="w-3 h-3 text-slate-500" />
                            <span>{ord.salesmanName}</span>
                          </span>
                        )}

                        {/* Status Badge */}
                        <span
                          className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                            isSettled
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : hasPendingBal
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {isSettled
                            ? `🔄 Settled in #${ord.settledInOrder}`
                            : hasPendingBal
                            ? `⚠️ Unpaid: Rs. ${Number(ord.remainingBalance).toLocaleString()}`
                            : "✓ Full Paid"}
                        </span>

                        <button
                          onClick={() => openReceipt(ord)}
                          className="px-2 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </div>

                    {/* Breakdown Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">
                          Delivered Items
                        </span>
                        <span className="font-bold text-slate-800">
                          {ord.petis} Petis{ord.trays > 0 ? ` + ${ord.trays} Trays` : ord.looseEggs > 0 ? ` + ${Math.floor(ord.looseEggs / 30)} Trays` : ""} ({ord.netEggs || ord.totalEggs || 0} eggs)
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          @ Rs. {ord.ratePerPeti}/peti
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">
                          Current Sale Bill
                        </span>
                        <span className="font-extrabold text-slate-900">
                          Rs. {Number(ord.currentSaleAmount || (ord.totalAmount - (ord.previousBalance || 0))).toLocaleString()}
                        </span>
                        {ord.previousBalance > 0 && (
                          <span className="text-[10px] text-amber-700 font-semibold block">
                            + Rs. {Number(ord.previousBalance).toLocaleString()} Previous Balance
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">
                          Cash Collected
                        </span>
                        <span className="font-black text-emerald-700">
                          Rs. {Number(ord.paidAmount).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Mode: {ord.paymentMode || "Cash"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">
                          Remaining Balance
                        </span>
                        <span
                          className={`font-black ${
                            hasPendingBal ? "text-red-600" : "text-slate-700"
                          }`}
                        >
                          Rs. {Number(ord.remainingBalance).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Settlement Explanatory Banners */}
                    {clearedPrevious && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Settled previous invoice credit in this order:{" "}
                            <strong className="font-mono">
                              {ord.previousOrdersUdhaar.map((p) => `#${p.invoiceNo}`).join(", ")}
                            </strong>
                          </span>
                        </div>
                        <span className="font-bold text-emerald-800 text-[11px]">
                          + Rs. {Number(ord.previousBalance || 0).toLocaleString()} Paid
                        </span>
                      </div>
                    )}

                    {isSettled && (
                      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>
                          The remaining balance of this invoice was rolled forward & settled in Invoice{" "}
                          <strong className="font-mono text-slate-900">#{ord.settledInOrder}</strong>.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Store className="w-4 h-4 text-amber-500" />
            <span>
              Customer Account: <strong className="text-slate-900">{customer.shopName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${customer.phone}`}
              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-slate-600" />
              <span>Call Customer</span>
            </a>

            <a
              href={getWhatsAppStatementUrl()}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Send Statement on WhatsApp</span>
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
