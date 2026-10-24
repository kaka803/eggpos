"use client";

import React, { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Share2, Download, Loader2, X } from "lucide-react";

export default function ReceiptModal() {
  const { activeReceipt, showReceiptModal, closeReceipt, EGGS_PER_PETI } = useApp();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const receiptRef = useRef(null);

  if (!showReceiptModal || !activeReceipt) return null;

  const generateWhatsAppLink = (receipt) => {
    const rawPhone = (receipt.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = rawPhone.startsWith("0")
      ? `92${rawPhone.slice(1)}`
      : rawPhone.startsWith("92")
      ? rawPhone
      : `92${rawPhone}`;

    const grossCount = receipt.grossEggs || receipt.petis * EGGS_PER_PETI + (receipt.looseEggs || 0);
    const broken = Number(receipt.brokenEggs) || 0;
    const netCount = receipt.netEggs || grossCount - broken;

    const text =
      `================================\n` +
      `   *AL-BARKAT EGG WHOLESALE*    \n` +
      `     *CENTRAL GODAM & SUPPLY*   \n` +
      `  Main Poultry Market • Tel: 0300-1234567\n` +
      `================================\n` +
      `🧾 *INVOICE #:* ${receipt.id}\n` +
      `📅 *DATE:* ${receipt.date}  ⏰ ${receipt.time}\n` +
      `🛵 *SALESMAN:* ${receipt.salesmanName}\n` +
      `--------------------------------\n` +
      `🏪 *SHOP:* ${receipt.shopName}\n` +
      `👤 *CUSTOMER:* ${receipt.shopkeeperName}\n` +
      `📞 *TEL:* ${receipt.phone}\n` +
      `📍 *AREA:* ${receipt.area}\n` +
      `================================\n` +
      `QTY   ITEM / DESCRIPTION   AMOUNT\n` +
      `--------------------------------\n` +
      `${receipt.petis} Petis (${(receipt.petis * EGGS_PER_PETI).toLocaleString()} Eggs)  Rs. ${(receipt.petis * receipt.ratePerPeti).toLocaleString()}\n` +
      `  @ Rs. ${Number(receipt.ratePerPeti).toLocaleString()} / Peti\n` +
      (receipt.looseEggs > 0
        ? `${receipt.looseEggs} Loose Eggs        Rs. ${Math.round(receipt.looseEggs * (receipt.ratePerPeti / EGGS_PER_PETI)).toLocaleString()}\n`
        : "") +
      (broken > 0
        ? `⚠️ *LESS DAMAGE (TOOTE ANDAY):* -${broken} Eggs (-Rs. ${Number(receipt.brokenDeduction || 0).toLocaleString()})\n`
        : "") +
      `--------------------------------\n` +
      `🥚 *NET BILLABLE EGGS:* ${netCount.toLocaleString()} Eggs\n` +
      `📊 *RATE PER EGG:* Rs. ${receipt.ratePerEgg}\n` +
      `================================\n` +
      `💰 *TOTAL BILL:*      Rs. ${Number(receipt.totalAmount).toLocaleString()}\n` +
      `💵 *CASH RECEIVED:*   Rs. ${Number(receipt.paidAmount).toLocaleString()}\n` +
      `⚠️ *BALANCE / UDHAAR:* Rs. ${Number(receipt.remainingBalance).toLocaleString()}\n` +
      `================================\n` +
      `*STATUS:* ${receipt.paymentStatus} (${receipt.paymentMode})\n\n` +
      `   * THANK YOU FOR BUSINESS *   \n` +
      `    ~ Tijarat Me Barkat Ho ~    \n` +
      `================================`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  const grossEggs = activeReceipt.grossEggs || activeReceipt.petis * EGGS_PER_PETI + (activeReceipt.looseEggs || 0);
  const brokenEggs = Number(activeReceipt.brokenEggs) || 0;
  const netEggs = activeReceipt.netEggs || grossEggs - brokenEggs;

  // Generate and download direct 80mm Thermal PDF roll
  const handleDownloadPDF = async () => {
    if (!activeReceipt) return;

    try {
      setIsGeneratingPdf(true);
      const { downloadThermalReceiptPDF } = await import("@/lib/thermalPdf");
      downloadThermalReceiptPDF(activeReceipt, EGGS_PER_PETI);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate thermal PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-[360px] my-auto flex flex-col">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-t-2xl">
          <span className="text-xs font-mono font-bold tracking-wider text-amber-400">
            THERMAL RECEIPT (80mm)
          </span>
          <button
            onClick={closeReceipt}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Realistic Thermal Paper Slip */}
        <div
          ref={receiptRef}
          id="printable-receipt"
          className="bg-[#FCFCFA] text-slate-950 p-5 font-mono text-[11px] leading-tight shadow-2xl relative border-x border-slate-300"
          style={{
            fontFamily: "Courier, 'Courier New', monospace",
          }}
        >
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
              <span>RCV-NO: #{activeReceipt.id}</span>
              <span>{activeReceipt.time}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>DATE: {activeReceipt.date}</span>
              <span>SM: {activeReceipt.salesmanName.slice(0, 14)}</span>
            </div>
          </div>

          <div className="text-center text-slate-400 select-none">
            --------------------------------
          </div>

          {/* Customer / Shop Info */}
          <div className="space-y-0.5 py-1">
            <p className="font-bold text-xs uppercase text-slate-950">
              SHOP: {activeReceipt.shopName}
            </p>
            <p className="text-slate-700">ATTN: {activeReceipt.shopkeeperName}</p>
            <p className="text-slate-700">TEL:  {activeReceipt.phone}</p>
            {activeReceipt.area && (
              <p className="text-slate-600 truncate">LOC:  {activeReceipt.area}</p>
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
                <span className="w-10">{activeReceipt.petis} BX</span>
                <span className="flex-1 text-left font-black">
                  PETIS ({activeReceipt.petis * EGGS_PER_PETI} EGGS)
                </span>
                <span className="w-16 text-right">
                  {(activeReceipt.petis * activeReceipt.ratePerPeti).toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 pl-10">
                @ Rs. {Number(activeReceipt.ratePerPeti).toLocaleString()} / Peti
              </div>
            </div>

            {activeReceipt.looseEggs > 0 && (
              <div>
                <div className="flex justify-between font-bold">
                  <span className="w-10">{activeReceipt.looseEggs} PC</span>
                  <span className="flex-1 text-left">LOOSE EGGS</span>
                  <span className="w-16 text-right">
                    {Math.round(
                      activeReceipt.looseEggs * (activeReceipt.ratePerPeti / EGGS_PER_PETI)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 pl-10">
                  @ Rs. {activeReceipt.ratePerEgg} / Egg
                </div>
              </div>
            )}

            {/* BROKEN EGGS DEDUCTION ROW */}
            {brokenEggs > 0 && (
              <div className="text-red-700 font-bold pt-1 border-t border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span className="w-10">-{brokenEggs}</span>
                  <span className="flex-1 text-left">LESS TOOTE ANDAY (DAMAGE)</span>
                  <span className="w-16 text-right">
                    - {Number(activeReceipt.brokenDeduction || 0).toLocaleString()}
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
            <div className="flex justify-between font-black text-sm text-slate-950">
              <span>TOTAL BILL:</span>
              <span>Rs. {Number(activeReceipt.totalAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800">
              <span>CASH RECEIVED:</span>
              <span>Rs. {Number(activeReceipt.paidAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-black text-slate-950 pt-1 border-t border-dashed border-slate-400">
              <span>BALANCE / UDHAAR:</span>
              <span className={activeReceipt.remainingBalance > 0 ? "underline" : ""}>
                Rs. {Number(activeReceipt.remainingBalance).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="text-center text-slate-500 my-1 select-none">
            ================================
          </div>

          {/* Payment Status & Footer */}
          <div className="text-center space-y-1 pt-1 text-[10px]">
            <p className="font-bold tracking-wider uppercase">
              STATUS: {activeReceipt.paymentStatus} ({activeReceipt.paymentMode})
            </p>
            <p className="text-slate-600 pt-1">*** THANK YOU FOR YOUR BUSINESS ***</p>
            <p className="text-slate-500 italic">Tijarat Me Barkat Ki Dua</p>
            <div className="pt-2 text-[8px] text-slate-400">
              SYSTEM BY ANDAGODAM POS • {activeReceipt.id}
            </div>
          </div>

          {/* Sawtooth / Zig-Zag Paper Bottom Edge */}
          <div className="absolute -bottom-2 left-0 right-0 h-2 bg-[#FCFCFA] [clip-path:polygon(0%_0%,5%_100%,10%_0%,15%_100%,20%_0%,25%_100%,30%_0%,35%_100%,40%_0%,45%_100%,50%_0%,55%_100%,60%_0%,65%_100%,70%_0%,75%_100%,80%_0%,85%_100%,90%_0%,95%_100%,100%_0%)]" />
        </div>

        {/* Modal Action Buttons */}
        <div className="bg-slate-900 p-3 rounded-b-2xl grid grid-cols-2 gap-2 border-t border-slate-800 mt-2">
          <a
            href={generateWhatsAppLink(activeReceipt)}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors font-sans"
          >
            <Share2 className="w-4 h-4" />
            <span>Send WhatsApp</span>
          </a>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-colors font-sans"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Creating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF Slip</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
