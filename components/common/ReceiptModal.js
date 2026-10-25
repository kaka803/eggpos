"use client";

import React, { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Share2, Download, Loader2, X, MessageCircle } from "lucide-react";

export default function ReceiptModal() {
  const { activeReceipt, showReceiptModal, closeReceipt, EGGS_PER_PETI } = useApp();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const receiptRef = useRef(null);

  if (!showReceiptModal || !activeReceipt) return null;

  // Share PDF directly to WhatsApp using Web Share API
  const handleWhatsAppShare = async () => {
    if (!activeReceipt) return;
    setIsSharingPdf(true);
    try {
      const { getThermalReceiptPDFBlob } = await import("@/lib/thermalPdf");
      const pdfBlob = getThermalReceiptPDFBlob(activeReceipt, EGGS_PER_PETI);
      if (!pdfBlob) throw new Error("PDF generation failed");

      const fileName = `invoice_${activeReceipt.id || "receipt"}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        // Web Share API with PDF file — opens native share sheet (WhatsApp, etc.)
        await navigator.share({
          title: `Invoice #${activeReceipt.id} — ${activeReceipt.shopName}`,
          text: `Al-Barkat Egg Wholesale — Invoice #${activeReceipt.id}`,
          files: [pdfFile],
        });
      } else {
        // Fallback: download PDF (desktop browsers that don't support file sharing)
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        alert("PDF downloaded — open WhatsApp and attach the file manually.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("WhatsApp PDF share failed:", err);
        alert("Sharing failed. PDF will be downloaded instead.");
      }
    } finally {
      setIsSharingPdf(false);
    }
  };

  // Direct WhatsApp chat to specific customer number
  const handleDirectWhatsApp = () => {
    if (!activeReceipt) return;
    const rawPhone = (activeReceipt.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = rawPhone.startsWith("0")
      ? `92${rawPhone.slice(1)}`
      : rawPhone.startsWith("92")
      ? rawPhone
      : `92${rawPhone}`;

    const currentSale = Number(
      activeReceipt.currentSaleAmount ||
      (Number(activeReceipt.totalAmount) - (Number(activeReceipt.previousBalance) || 0))
    );
    const prevBal = Number(activeReceipt.previousBalance) || 0;
    const grandTotal = Number(activeReceipt.grandTotal || activeReceipt.totalAmount);

    let billDetails = "";
    if (prevBal > 0) {
      billDetails =
        `💵 *Aaj Ka Egg Bill:* Rs. ${currentSale.toLocaleString()}\n` +
        `⏳ *Peechla Udhaar:* + Rs. ${prevBal.toLocaleString()}\n` +
        `💰 *Kul Total Bill:* Rs. ${grandTotal.toLocaleString()}\n`;
    } else {
      billDetails = `💰 *Total Bill:* Rs. ${grandTotal.toLocaleString()}\n`;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const receiptLink = origin ? `${origin}/receipt/${activeReceipt.invoiceNo || activeReceipt.id}` : "";

    const text =
      `*AL-BARKAT EGG WHOLESALE WAREHOUSE*\n` +
      `🧾 *SALE INVOICE #${activeReceipt.id}*\n` +
      `------------------------------------\n` +
      `🏪 *Shop:* ${activeReceipt.shopName}\n` +
      `👤 *Customer:* ${activeReceipt.shopkeeperName}\n` +
      `🛵 *Salesman:* ${activeReceipt.salesmanName}\n` +
      `📅 *Date:* ${activeReceipt.date} at ${activeReceipt.time}\n` +
      `------------------------------------\n` +
      `📦 *Quantity:* ${activeReceipt.petis} Petis (${(activeReceipt.netEggs || activeReceipt.totalEggs || 0).toLocaleString()} Eggs)\n` +
      (Number(activeReceipt.brokenEggs) > 0 ? `⚠️ *Toote Anday:* -${activeReceipt.brokenEggs} Eggs\n` : "") +
      `💵 *Rate per Peti:* Rs. ${Number(activeReceipt.ratePerPeti).toLocaleString()}\n` +
      billDetails +
      `✅ *Paid (Wasool):* Rs. ${Number(activeReceipt.paidAmount).toLocaleString()}\n` +
      `⚠️ *Remaining (Baqaya):* Rs. ${Number(activeReceipt.remainingBalance).toLocaleString()}\n` +
      `------------------------------------\n` +
      (receiptLink ? `📄 *View / Download Thermal Slip (PDF):*\n👉 ${receiptLink}\n------------------------------------\n` : "") +
      `Thank you for your business!`;

    // Also download PDF slip so it's ready in recent downloads if they want to attach it
    try {
      import("@/lib/thermalPdf").then(({ downloadThermalReceiptPDF }) => {
        downloadThermalReceiptPDF(activeReceipt, EGGS_PER_PETI);
      });
    } catch {}

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, "_blank");
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
            {/* Today's Fresh Egg Sale Amount */}
            <div className="flex justify-between font-bold text-slate-800">
              <span>TODAY EGG SALE:</span>
              <span>
                Rs. {Number(
                  activeReceipt.currentSaleAmount ||
                  (Number(activeReceipt.totalAmount) - (Number(activeReceipt.previousBalance) || 0))
                ).toLocaleString()}
              </span>
            </div>

            {/* Previous Udhaar Added to Bill */}
            {Number(activeReceipt.previousBalance) > 0 && (
              <div className="flex justify-between font-bold text-red-700 bg-red-50/80 px-1 py-0.5 rounded">
                <span>PREVIOUS UDHAAR:</span>
                <span>+ Rs. {Number(activeReceipt.previousBalance).toLocaleString()}</span>
              </div>
            )}

            {/* Kul Bill / Grand Total */}
            <div className="flex justify-between font-black text-sm text-slate-950 pt-1 border-t border-slate-300">
              <span>KUL BILL (TOTAL PAYABLE):</span>
              <span>
                Rs. {Number(
                  activeReceipt.grandTotal || activeReceipt.totalAmount
                ).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between font-bold text-emerald-800">
              <span>CASH RECEIVED (WASOOL):</span>
              <span>Rs. {Number(activeReceipt.paidAmount).toLocaleString()}</span>
            </div>

            <div className="flex justify-between font-black text-slate-950 pt-1 border-t border-dashed border-slate-400">
              <span>NET REMAINING UDHAAR (BAQAYA):</span>
              <span className={activeReceipt.remainingBalance > 0 ? "underline text-red-700 font-black" : "text-emerald-800"}>
                Rs. {Number(activeReceipt.remainingBalance).toLocaleString()}
              </span>
            </div>

            {activeReceipt.previousOrdersUdhaar && activeReceipt.previousOrdersUdhaar.length > 0 && (
              <div className="pt-1.5 text-[9px] text-slate-500 border-t border-slate-200">
                <span className="font-bold uppercase block text-slate-600">Pending Invoices Included:</span>
                {activeReceipt.previousOrdersUdhaar.map((p, idx) => (
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
        <div className="bg-slate-900 p-3 rounded-b-2xl space-y-2 border-t border-slate-800 mt-2">
          {/* Main Direct WhatsApp button */}
          <button
            onClick={handleDirectWhatsApp}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-950/30 transition-all font-sans cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-100" />
            <span>Open WhatsApp Chat ({activeReceipt.phone || "Customer"})</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsAppShare}
              disabled={isSharingPdf}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors font-sans cursor-pointer"
              title="Share PDF Document directly"
            >
              {isSharingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Share PDF File</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="py-2 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-[11px] font-black flex items-center justify-center gap-1.5 transition-colors font-sans cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Slip</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
