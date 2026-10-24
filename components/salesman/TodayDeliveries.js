"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Receipt, Share2, CheckCircle2, Loader2 } from "lucide-react";

export default function TodayDeliveries({ activeSalesman }) {
  const { salesOrders, openReceipt, isOrdersLoading, EGGS_PER_PETI } = useApp();

  const myOrders = salesOrders.filter(
    (o) => o.salesmanId === activeSalesman?.id || o.salesmanName === activeSalesman?.name
  );

  const getWhatsAppLink = (receipt) => {
    const rawPhone = (receipt.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = rawPhone.startsWith("0")
      ? `92${rawPhone.slice(1)}`
      : rawPhone.startsWith("92")
      ? rawPhone
      : `92${rawPhone}`;

    const text =
      `*AL-BARKAT EGG WHOLESALE WAREHOUSE*\n` +
      `🧾 *SALE INVOICE #${receipt.id}*\n` +
      `------------------------------------\n` +
      `🏪 *Shop:* ${receipt.shopName}\n` +
      `👤 *Customer:* ${receipt.shopkeeperName}\n` +
      `🛵 *Salesman:* ${receipt.salesmanName}\n` +
      `📅 *Date:* ${receipt.date} at ${receipt.time}\n` +
      `------------------------------------\n` +
      `📦 *Quantity:* ${receipt.petis} Petis (${receipt.totalEggs.toLocaleString()} Eggs)\n` +
      `💵 *Rate per Peti:* Rs. ${Number(receipt.ratePerPeti).toLocaleString()}\n` +
      `💰 *Total Bill:* Rs. ${Number(receipt.totalAmount).toLocaleString()}\n` +
      `✅ *Paid Amount:* Rs. ${Number(receipt.paidAmount).toLocaleString()}\n` +
      `⚠️ *Remaining Balance:* Rs. ${Number(receipt.remainingBalance).toLocaleString()}\n` +
      `------------------------------------\n` +
      `Thank you for your business!`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase">
            Today's Deliveries ({myOrders.length})
          </h4>
          {isOrdersLoading && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin text-teal-700" />
              <span>Updating...</span>
            </span>
          )}
        </div>
        <span className="text-[11px] font-semibold text-teal-700">
          {myOrders.reduce((a, b) => a + Number(b.petis), 0)} Petis Delivered
        </span>
      </div>

      {isOrdersLoading && myOrders.length === 0 ? (
        <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
          <p className="text-xs font-bold text-slate-700">Loading today's deliveries from database...</p>
        </div>
      ) : myOrders.length === 0 ? (
        <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
          <p className="text-xs font-bold text-slate-600">No deliveries recorded yet today</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Use the form above to record your first shop sale
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {myOrders.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs hover:border-amber-300 transition-colors"
            >
              <div>
                <strong className="text-slate-900 block text-xs font-extrabold">{item.shopName}</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {item.petis} Petis ({(item.netEggs || item.totalEggs).toLocaleString()} eggs)
                  {Number(item.brokenEggs) > 0 && (
                    <span className="text-red-600 font-semibold ml-1">(-{item.brokenEggs} broken)</span>
                  )}
                  {" "}• Rs. {Number(item.totalAmount).toLocaleString()}
                </p>
                {item.remainingBalance > 0 ? (
                  <span className="text-[10px] font-bold text-red-600">
                    Balance Due: Rs. {Number(item.remainingBalance).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Paid in Full
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openReceipt(item)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  title="View Invoice"
                >
                  <Receipt className="w-4 h-4" />
                </button>
                <a
                  href={getWhatsAppLink(item)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  title="Send WhatsApp Invoice"
                >
                  <Share2 className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
