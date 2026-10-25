"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  X,
  Receipt,
  Share2,
  Store,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Package,
  DollarSign,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Edit3
} from "lucide-react";

export default function OrderDetailsModal({ order, isOpen, onClose, onEditOrder }) {
  const { openReceipt, fetchOrderDetails, EGGS_PER_PETI, currentUser } = useApp();

  const [detailedOrder, setDetailedOrder] = useState(order);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  useEffect(() => {
    if (!isOpen || !order) {
      setDetailedOrder(null);
      return;
    }

    setDetailedOrder(order);

    // On-demand fetch of extra details (e.g. photo, notes, latest server fields)
    let isMounted = true;
    const loadFullDetails = async () => {
      const orderId = order.id || order._id;
      if (!orderId) return;

      setIsFetchingDetails(true);
      try {
        const full = await fetchOrderDetails(orderId);
        if (isMounted && full) {
          setDetailedOrder((prev) => ({ ...prev, ...full }));
        }
      } catch (err) {
        console.warn("Failed to load extra order details:", err);
      } finally {
        if (isMounted) setIsFetchingDetails(false);
      }
    };

    loadFullDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, order, fetchOrderDetails]);

  if (!isOpen || !detailedOrder) return null;

  const current = detailedOrder;
  const isCompleted = current.paymentStatus === "Full Paid";

  const getWhatsAppLink = (receipt) => {
    const rawPhone = (receipt.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = rawPhone.startsWith("0")
      ? `92${rawPhone.slice(1)}`
      : rawPhone.startsWith("92")
      ? rawPhone
      : `92${rawPhone}`;

    const text =
      `*AL-BARKAT EGG WHOLESALE*\n` +
      `🧾 *SALE INVOICE #${receipt.id}*\n` +
      `🏪 *Shop:* ${receipt.shopName}\n` +
      `📦 *Petis:* ${receipt.petis} Petis (${(receipt.netEggs || receipt.totalEggs || 0).toLocaleString()} Eggs)\n` +
      `💰 *Total Bill:* Rs. ${Number(receipt.totalAmount).toLocaleString()}\n` +
      `💵 *Paid:* Rs. ${Number(receipt.paidAmount).toLocaleString()}\n` +
      `⚠️ *Remaining Balance:* Rs. ${Number(receipt.remainingBalance).toLocaleString()}\n` +
      `Thank you for your business!`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm ${
                current.code?.startsWith("A")
                  ? "bg-teal-700 text-white"
                  : current.code?.startsWith("B")
                  ? "bg-amber-400 text-slate-950"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {current.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Order Details</h3>
                <span className="font-mono text-xs text-amber-400 font-bold">
                  #{current.id}
                </span>
                {isFetchingDetails && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                    <span>Syncing...</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {current.date} • {current.time}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Banner */}
          <div
            className={`p-3 rounded-2xl flex items-center justify-between border ${
              isCompleted
                ? "bg-teal-50 border-teal-200 text-teal-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
              <span className="font-bold">
                Payment Status: {current.paymentStatus} ({current.paymentMode || "Cash"})
              </span>
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80">
              {current.orderStatus || "Completed"}
            </span>
          </div>

          {/* Shop Information Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              Shop Information
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Shop Name</span>
                <strong className="text-slate-900 text-sm font-extrabold">{current.shopName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                <strong className="text-slate-800">{current.shopkeeperName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Number</span>
                <a href={`tel:${current.phone}`} className="text-teal-700 font-bold hover:underline">
                  {current.phone}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Area</span>
                <span className="text-slate-700">{current.area || "City Route"}</span>
              </div>
            </div>

            {/* Shop Photo if salesman captured one (fetched on-demand) */}
            {current.hasPhoto && current.photoUrl && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Shop Photo Verification Record:
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-40 bg-slate-900">
                  <img
                    src={current.photoUrl}
                    alt="Shop Front"
                    className="w-full h-36 object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Delivery & Salesman Information */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                {(current.salesmanName || "SM").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Delivered By</span>
                <h4 className="text-xs font-bold text-slate-900">{current.salesmanName}</h4>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Delivery Timestamp</span>
              <p className="text-xs font-medium text-slate-700">
                {current.date} at {current.time}
              </p>
            </div>
          </div>

          {/* Egg Quantity & Breakage Breakdown */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-2">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              Egg Quantity & Breakage Breakdown (1 Peti = {EGGS_PER_PETI} Eggs)
            </h4>

            <div className="space-y-1.5 pt-1 border-t border-amber-200/60">
              <div className="flex justify-between text-slate-800">
                <span>
                  <strong>{current.petis} Petis (Boxes)</strong> × {EGGS_PER_PETI} Eggs
                </span>
                <span className="font-bold">
                  {(current.petis * EGGS_PER_PETI).toLocaleString()} Eggs Gross
                </span>
              </div>
              {Number(current.looseEggs) > 0 && (
                <div className="flex justify-between text-slate-800">
                  <span>
                    <strong>{current.looseEggs} Loose Eggs</strong>
                  </span>
                  <span className="font-bold">+{current.looseEggs} Eggs</span>
                </div>
              )}
              {Number(current.brokenEggs) > 0 && (
                <div className="flex justify-between text-red-600 font-bold bg-red-50/80 p-1.5 rounded-lg border border-red-200">
                  <span>Toote Anday (Broken / Damaged):</span>
                  <span>- {current.brokenEggs} Eggs (- Rs. {Number(current.brokenDeduction || 0).toLocaleString()})</span>
                </div>
              )}
              <div className="flex justify-between text-teal-900 pt-1 border-t border-amber-200/60 font-black">
                <span>Net Billable Eggs (Anday):</span>
                <span>{(current.netEggs || current.totalEggs || 0).toLocaleString()} Eggs</span>
              </div>
            </div>
          </div>

          {/* Pricing & Balance Overview */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Rate per Peti (360 eggs):</span>
              <span className="font-bold text-slate-800">
                Rs. {Number(current.ratePerPeti || 0).toLocaleString()}
              </span>
            </div>
            {current.ratePerEgg && (
              <div className="flex justify-between text-slate-600">
                <span>Equivalent Rate per Egg:</span>
                <span className="font-medium text-slate-800">Rs. {current.ratePerEgg} / egg</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Today's Sale Bill:</span>
                <span className="text-slate-900">
                  Rs. {Number(current.totalAmount || 0).toLocaleString()}
                </span>
              </div>

              {Number(current.previousBalance) > 0 && (
                <div className="flex justify-between text-xs font-bold text-red-700">
                  <span>+ Previous Udhaar (Peechla):</span>
                  <span>Rs. {Number(current.previousBalance).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-slate-900 pt-0.5 border-t border-slate-200">
                <span>Kul Wasooli (Grand Total):</span>
                <span className="text-base text-slate-950">
                  Rs. {Number(current.grandTotal || (Number(current.totalAmount || 0) + Number(current.previousBalance || 0))).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-xs font-bold text-emerald-700">
                <span>Cash Paid / Wasool:</span>
                <span>Rs. {Number(current.paidAmount || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-xs font-black text-red-600 pt-1 border-t border-slate-100">
                <span>Remaining Balance (Udhaar):</span>
                <span>Rs. {Number(current.remainingBalance || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes if present */}
          {current.notes && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-500" />
                Additional Order Notes:
              </span>
              <p className="text-slate-700 mt-1">{current.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 bg-slate-50 border-t border-slate-200 grid ${currentUser?.role === "admin" ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
          {currentUser?.role === "admin" && (
            <button
              onClick={() => {
                onClose();
                if (onEditOrder) onEditOrder(current);
              }}
              className="py-2.5 px-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-teal-200" />
              <span>Edit Sale</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              openReceipt(current);
            }}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Thermal Slip</span>
          </button>

          <a
            href={getWhatsAppLink(current)}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
