"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Printer, ArrowLeft, Loader2, Store, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { downloadThermalReceiptPDF } from "@/lib/thermalPdf";

const EGGS_PER_PETI = 360;

export default function PublicReceiptPage() {
  const params = useParams();
  const id = params?.id;

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error("Receipt not found");
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          throw new Error(data.error || "Receipt not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <p className="text-sm font-bold text-slate-300">Loading Official Thermal Receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="p-6 bg-slate-800 rounded-2xl max-w-sm text-center border border-slate-700">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <h2 className="text-base font-black text-white">Receipt Not Found</h2>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            The receipt #{id} could not be located in the database.
          </p>
          <Link
            href="/salesman"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  const grossEggs = order.grossEggs || Number(order.petis) * EGGS_PER_PETI + (Number(order.looseEggs) || 0);
  const brokenEggs = Number(order.brokenEggs) || 0;
  const netEggs = order.netEggs || grossEggs - brokenEggs;

  const currentSale = Number(
    order.currentSaleAmount ||
    (Number(order.totalAmount) - (Number(order.previousBalance) || 0))
  );
  const prevBal = Number(order.previousBalance) || 0;
  const grandTotal = Number(
    order.grandTotal || (prevBal > 0 ? currentSale + prevBal : order.totalAmount)
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-6 px-3 sm:px-4">
      {/* Top Bar */}
      <div className="w-full max-w-[360px] flex items-center justify-between mb-3 text-white">
        <Link
          href="/salesman"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </Link>
        <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
          Official Digital Slip
        </span>
      </div>

      {/* 80mm Thermal Paper Slip */}
      <div className="w-full max-w-[360px] bg-[#FCFCFA] text-slate-950 p-5 font-mono text-[11px] leading-tight shadow-2xl relative rounded-t-xl border-x border-t border-slate-300">
        {/* Header */}
        <div className="text-center pb-2">
          <h2 className="text-sm font-black tracking-wider uppercase text-slate-950">
            AL-BARKAT EGG WHOLESALE
          </h2>
          <p className="text-[10px] text-slate-700 tracking-wide">
            Central Egg Godam & Supply
          </p>
          <p className="text-[9px] text-slate-600">
            Main Poultry Market, Wholesale Sector
          </p>
          <p className="text-[9px] text-slate-600">Tel: 0300-1234567 • 0321-9876543</p>
        </div>

        <div className="text-center text-slate-500 my-1 select-none">
          ================================
        </div>

        {/* Receipt Info */}
        <div className="space-y-1 py-1">
          <div className="flex justify-between font-bold">
            <span>RCV-NO: #{order.invoiceNo || order.id}</span>
            <span>{order.time}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>DATE: {order.date}</span>
            <span>SM: {(order.salesmanName || "Salesman").slice(0, 14)}</span>
          </div>
        </div>

        <div className="text-center text-slate-400 select-none">
          --------------------------------
        </div>

        {/* Customer / Shop Info */}
        <div className="space-y-0.5 py-1">
          <p className="font-bold text-xs uppercase text-slate-950">
            SHOP: {order.shopName}
          </p>
          <p className="text-slate-700">ATTN: {order.shopkeeperName || "Customer"}</p>
          <p className="text-slate-700">TEL:  {order.phone}</p>
          {order.area && (
            <p className="text-slate-600 truncate">LOC:  {order.area}</p>
          )}
        </div>

        <div className="text-center text-slate-500 my-1 select-none">
          ================================
        </div>

        {/* Items Header */}
        <div className="flex justify-between font-black text-[10px] pb-1 uppercase border-b border-slate-400">
          <span className="w-10">QTY</span>
          <span className="flex-1 text-left">ITEM / UNIT</span>
          <span className="w-16 text-right">TOTAL</span>
        </div>

        {/* Items Rows */}
        <div className="py-2 space-y-1.5">
          <div>
            <div className="flex justify-between font-bold">
              <span className="w-10">{order.petis} BX</span>
              <span className="flex-1 text-left font-black">
                PETIS ({order.petis * EGGS_PER_PETI} EGGS)
              </span>
              <span className="w-16 text-right">
                {(order.petis * order.ratePerPeti).toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] text-slate-600 pl-10">
              @ Rs. {Number(order.ratePerPeti).toLocaleString()} / Peti
            </div>
          </div>

          {order.looseEggs > 0 && (
            <div>
              <div className="flex justify-between font-bold">
                <span className="w-10">{order.looseEggs} PC</span>
                <span className="flex-1 text-left">LOOSE EGGS</span>
                <span className="w-16 text-right">
                  {Math.round(
                    order.looseEggs * (order.ratePerPeti / EGGS_PER_PETI)
                  ).toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 pl-10">
                @ Rs. {order.ratePerEgg} / Egg
              </div>
            </div>
          )}

          {brokenEggs > 0 && (
            <div className="text-red-700 font-bold pt-1 border-t border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="w-10">-{brokenEggs}</span>
                <span className="flex-1 text-left">LESS TOOTE ANDAY (DAMAGE)</span>
                <span className="w-16 text-right">
                  - {Number(order.brokenDeduction || 0).toLocaleString()}
                </span>
              </div>
              <div className="text-[9px] text-red-600 pl-10">
                Breakage deduction credited to shop
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-slate-400 select-none">
          --------------------------------
        </div>

        {/* Unit calculation summary */}
        <div className="py-1 text-[10px] text-slate-700 space-y-0.5">
          <div className="flex justify-between">
            <span>GROSS EGGS:</span>
            <span>{grossEggs.toLocaleString()} PCS</span>
          </div>
          {brokenEggs > 0 && (
            <div className="flex justify-between text-red-600 font-bold">
              <span>DAMAGED / BROKEN:</span>
              <span>-{brokenEggs.toLocaleString()} PCS</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900">
            <span>NET BILLABLE EGGS:</span>
            <span>{netEggs.toLocaleString()} PCS</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>CALCULATION UNIT:</span>
            <span>1 PETI = {EGGS_PER_PETI} EGGS</span>
          </div>
        </div>

        <div className="text-center text-slate-500 my-1 select-none">
          ================================
        </div>

        {/* Totals Section */}
        <div className="space-y-1 py-1 text-xs">
          <div className="flex justify-between font-bold text-slate-800">
            <span>TODAY EGG SALE:</span>
            <span>Rs. {currentSale.toLocaleString()}</span>
          </div>

          {prevBal > 0 && (
            <div className="flex justify-between font-bold text-red-700 bg-red-50/80 px-1 py-0.5 rounded">
              <span>PREVIOUS UDHAAR:</span>
              <span>+ Rs. {prevBal.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between font-black text-sm text-slate-950 pt-1 border-t border-slate-300">
            <span>KUL BILL (TOTAL PAYABLE):</span>
            <span>Rs. {grandTotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between font-bold text-emerald-800">
            <span>CASH RECEIVED (WASOOL):</span>
            <span>Rs. {Number(order.paidAmount).toLocaleString()}</span>
          </div>

          <div className="flex justify-between font-black text-slate-950 pt-1 border-t border-dashed border-slate-400">
            <span>NET REMAINING UDHAAR (BAQAYA):</span>
            <span className={order.remainingBalance > 0 ? "underline text-red-700 font-black" : "text-emerald-800"}>
              Rs. {Number(order.remainingBalance).toLocaleString()}
            </span>
          </div>

          {order.previousOrdersUdhaar && order.previousOrdersUdhaar.length > 0 && (
            <div className="pt-1.5 text-[9px] text-slate-500 border-t border-slate-200">
              <span className="font-bold uppercase block text-slate-600">Pending Invoices Included:</span>
              {order.previousOrdersUdhaar.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>• #{p.invoiceNo} ({p.date}):</span>
                  <span>Rs. {Number(p.remainingBalance).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-slate-500 my-1 select-none">
          ================================
        </div>

        {/* Payment Status & Footer */}
        <div className="text-center space-y-1 pt-1 text-[10px]">
          <p className="font-bold tracking-wider uppercase">
            STATUS: {order.paymentStatus} ({order.paymentMode || "Cash"})
          </p>
          <p className="text-slate-600 pt-1">*** THANK YOU FOR YOUR BUSINESS ***</p>
          <p className="text-slate-500 italic">Tijarat Me Barkat Ki Dua</p>
          <div className="pt-2 text-[8px] text-slate-400">
            SYSTEM BY ANDAGODAM POS • {order.invoiceNo || order.id}
          </div>
        </div>

        {/* Sawtooth / Zig-Zag Paper Bottom Edge */}
        <div className="absolute -bottom-2 left-0 right-0 h-2 bg-[#FCFCFA] [clip-path:polygon(0%_0%,5%_100%,10%_0%,15%_100%,20%_0%,25%_100%,30%_0%,35%_100%,40%_0%,45%_100%,50%_0%,55%_100%,60%_0%,65%_100%,70%_0%,75%_100%,80%_0%,85%_100%,90%_0%,95%_100%,100%_0%)]" />
      </div>

      {/* Action Buttons Below Slip */}
      <div className="w-full max-w-[360px] bg-slate-900 p-3 rounded-b-2xl grid grid-cols-2 gap-2 mt-2 border-t border-slate-800">
        <button
          onClick={() => downloadThermalReceiptPDF(order, EGGS_PER_PETI)}
          className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>
        <button
          onClick={() => window.print()}
          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
        >
          <Printer className="w-4 h-4 text-slate-300" />
          <span>Print Slip</span>
        </button>
      </div>
    </div>
  );
}
