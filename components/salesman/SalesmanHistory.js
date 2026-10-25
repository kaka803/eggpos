"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Search,
  Share2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Phone,
  Store,
  Clock,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function SalesmanHistory({ activeSalesman }) {
  const { salesOrders, openReceipt, isOrdersLoading, EGGS_PER_PETI } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'paid' | 'credit'

  const myOrders = salesOrders.filter((order) => {
    const isMine =
      order.salesmanId === activeSalesman?.id ||
      order.salesmanName === activeSalesman?.name;
    return isMine;
  });

  const filtered = myOrders.filter((order) => {
    const matchesSearch =
      (order.shopName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.shopkeeperName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.phone || "").includes(searchQuery);

    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "paid"
        ? order.paymentStatus === "Full Paid"
        : order.paymentStatus !== "Full Paid";

    return matchesSearch && matchesStatus;
  });

  const getWhatsAppLink = (receipt) => {
    const rawPhone = (receipt.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = rawPhone.startsWith("0")
      ? `92${rawPhone.slice(1)}`
      : rawPhone.startsWith("92")
      ? rawPhone
      : `92${rawPhone}`;

    const currentSale = Number(receipt.currentSaleAmount || (Number(receipt.totalAmount) - (Number(receipt.previousBalance) || 0)));
    const prevBal = Number(receipt.previousBalance) || 0;
    const grandTotal = Number(receipt.grandTotal || receipt.totalAmount);

    let billBreakdown = "";
    if (prevBal > 0) {
      billBreakdown =
        `💵 *Aaj Ka Bill:* Rs. ${currentSale.toLocaleString()}\n` +
        `⏳ *Peechla Udhaar:* + Rs. ${prevBal.toLocaleString()}\n` +
        `💰 *Kul Total Bill:* Rs. ${grandTotal.toLocaleString()}\n`;
    } else {
      billBreakdown = `💰 *Total Bill:* Rs. ${grandTotal.toLocaleString()}\n`;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const receiptLink = origin ? `${origin}/receipt/${receipt.invoiceNo || receipt.id}` : "";

    const text =
      `*AL-BARKAT EGG WHOLESALE*\n` +
      `🧾 *SALE INVOICE #${receipt.id}*\n` +
      `------------------------------------\n` +
      `🏪 *Shop:* ${receipt.shopName}\n` +
      `👤 *Customer:* ${receipt.shopkeeperName}\n` +
      `📅 *Date:* ${receipt.date} at ${receipt.time}\n` +
      `📦 *Petis:* ${receipt.petis} Petis (${(receipt.netEggs || receipt.totalEggs).toLocaleString()} Eggs)\n` +
      (receipt.brokenEggs > 0 ? `⚠️ *Broken Eggs:* -${receipt.brokenEggs} Eggs\n` : "") +
      billBreakdown +
      `✅ *Paid (Wasool):* Rs. ${Number(receipt.paidAmount).toLocaleString()}\n` +
      `⚠️ *Remaining (Baqaya Udhaar):* Rs. ${Number(receipt.remainingBalance).toLocaleString()}\n` +
      `------------------------------------\n` +
      (receiptLink ? `📄 *View / Download Thermal Slip (PDF):*\n👉 ${receiptLink}\n------------------------------------\n` : "") +
      `Thank you for your business!`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Sales & Invoices History</h3>
              <p className="text-[11px] text-slate-500">
                Total {myOrders.length} orders recorded by you
              </p>
            </div>
            {isOrdersLoading && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin text-teal-700" />
                <span>Loading...</span>
              </span>
            )}
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {myOrders.reduce((a, b) => a + Number(b.petis || 0), 0)} Petis Delivered
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by shop name, invoice #, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterStatus === "all"
                ? "bg-slate-900 text-amber-300 shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({myOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("paid")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterStatus === "paid"
                ? "bg-teal-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Paid ({myOrders.filter((o) => o.paymentStatus === "Full Paid").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("credit")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterStatus === "credit"
                ? "bg-red-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Udhaar ({myOrders.filter((o) => o.paymentStatus !== "Full Paid").length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {isOrdersLoading && filtered.length === 0 ? (
        <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2 flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
          <p className="text-xs font-bold text-slate-700">Loading your delivery history...</p>
          <p className="text-[11px] text-slate-400">Fetching records from warehouse database.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No sale records found</p>
          <p className="text-[11px] text-slate-400">
            {searchQuery
              ? "No invoices match your search keyword."
              : "Use the 'New Sale' tab to make your first sale entry."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isFullPaid = order.paymentStatus === "Full Paid";
            const netEggs = order.netEggs || order.totalEggs;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-amber-300 shadow-xs space-y-3 transition-all"
              >
                {/* Top Row: Shop & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {order.shopName}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{order.phone || "No phone"}</span>
                        <span>•</span>
                        <span>{order.shopkeeperName || "Customer"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isFullPaid
                        ? "bg-teal-50 text-teal-800 border border-teal-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {isFullPaid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                        <span>Paid</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        <span>Due: Rs. {Number(order.remainingBalance).toLocaleString()}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Middle Info: Quantity & Bill */}
                <div className="bg-slate-50 rounded-xl p-2.5 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Quantity</span>
                    <strong className="text-slate-900 font-black">
                      {order.petis} Petis
                    </strong>
                    <span className="text-[10px] text-slate-500 block">
                      ({Number(netEggs).toLocaleString()} eggs)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Bill</span>
                    <strong className="text-slate-900 font-black">
                      Rs. {Number(order.totalAmount).toLocaleString()}
                    </strong>
                    {order.brokenEggs > 0 && (
                      <span className="text-[10px] text-red-600 font-bold block">
                        -{order.brokenEggs} broken
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Cash Paid</span>
                    <strong className="text-teal-800 font-black">
                      Rs. {Number(order.paidAmount).toLocaleString()}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">{order.paymentMode}</span>
                  </div>
                </div>

                {/* Bottom Row: Time and Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {order.date} • {order.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Send WhatsApp */}
                    <a
                      href={getWhatsAppLink(order)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 border border-emerald-200 transition-colors"
                      title="Share invoice on WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>

                    {/* View & Download Thermal Receipt */}
                    <button
                      onClick={() => openReceipt(order)}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                      title="View & Download Thermal Receipt PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Receipt PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
