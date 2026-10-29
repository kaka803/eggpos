"use client";

import React, { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Share2, Download, Loader2, X, MessageCircle } from "lucide-react";
import { generateWhatsAppInvoiceMessage, getWhatsAppPhoneUrl } from "@/lib/whatsappTemplate";

export default function ReceiptModal() {
  const { activeReceipt, showReceiptModal, closeReceipt, EGGS_PER_PETI, settings } = useApp();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const receiptRef = useRef(null);

  if (!showReceiptModal || !activeReceipt) return null;

  const godamName = settings?.godamName || activeReceipt.godamName || "AL-BARKAT EGG WHOLESALE";
  const godamAddress = settings?.godamAddress || activeReceipt.godamAddress || "";
  const godamCity = settings?.godamCity || activeReceipt.godamCity || "";
  const godamPhone = settings?.godamPhone || activeReceipt.godamPhone || "";
  const addressLine = [godamAddress, godamCity].filter(Boolean).join(", ");

  // Share PDF directly to WhatsApp using Web Share API
  const handleWhatsAppShare = async () => {
    if (!activeReceipt) return;
    setIsSharingPdf(true);
    try {
      const { getThermalReceiptPDFBlob } = await import("@/lib/thermalPdf");
      const pdfBlob = getThermalReceiptPDFBlob(activeReceipt, EGGS_PER_PETI, settings);
      if (!pdfBlob) throw new Error("PDF generation failed");

      const fileName = `invoice_${activeReceipt.id || "receipt"}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        // Web Share API with PDF file — opens native share sheet (WhatsApp, etc.)
        await navigator.share({
          title: `Invoice #${activeReceipt.id} — ${activeReceipt.shopName}`,
          text: `${godamName} — Invoice #${activeReceipt.id}`,
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

  // Direct WhatsApp chat to specific customer number with PDF download link
  const handleDirectWhatsApp = () => {
    if (!activeReceipt) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const message = generateWhatsAppInvoiceMessage(activeReceipt, origin, settings);
    const url = getWhatsAppPhoneUrl(activeReceipt.phone, message);
    window.open(url, "_blank");
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
      downloadThermalReceiptPDF(activeReceipt, EGGS_PER_PETI, settings);
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

        {/* Authentic POS Thermal Paper Slip */}
        <div
          ref={receiptRef}
          id="printable-receipt"
          className="bg-white text-black p-6 font-mono text-[11px] leading-snug shadow-xl border border-neutral-300 select-text"
          style={{
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          {/* Top Left-Aligned Header */}
          <div className="space-y-0.5">
            <h1 className="font-bold text-xs tracking-wide uppercase text-black">
              {godamName}
            </h1>
            {addressLine && (
              <p className="uppercase text-[10px]">LOCATION :{addressLine}</p>
            )}
            {godamPhone && (
              <p className="text-[10px]">TEL      :{godamPhone}</p>
            )}
          </div>

          <div className="my-2 space-y-0.5 text-[10px]">
            <div className="flex">
              <span className="w-20">DATE</span>
              <span>: {activeReceipt.date} {activeReceipt.time || ""}</span>
            </div>
            <div className="flex">
              <span className="w-20">INVOICE</span>
              <span>: #{activeReceipt.id || activeReceipt.invoiceNo || "-"}</span>
            </div>
            <div className="flex">
              <span className="w-20">CASHIER</span>
              <span>: {activeReceipt.salesmanName || "Salesman"}</span>
            </div>
          </div>

          <div className="my-2 space-y-0.5 text-[10px]">
            <div className="flex font-bold">
              <span className="w-20">SHOP</span>
              <span className="uppercase">: {activeReceipt.shopName || "CASH CUSTOMER"}</span>
            </div>
            <div className="flex">
              <span className="w-20">CUSTOMER</span>
              <span>: {activeReceipt.shopkeeperName || "-"}</span>
            </div>
            <div className="flex">
              <span className="w-20">PHONE</span>
              <span>: {activeReceipt.phone || "-"}</span>
            </div>
            {activeReceipt.area && (
              <div className="flex">
                <span className="w-20">LOCATION</span>
                <span>: {activeReceipt.area}</span>
              </div>
            )}
          </div>

          {/* Double Line Divider */}
          <div className="text-black select-none tracking-tighter font-bold my-1 text-[11px]">
            ========================================
          </div>

          {/* Table Header */}
          <div className="flex justify-between font-bold text-[10px] py-0.5">
            <span className="flex-1 text-left">ITEM</span>
            <span className="w-8 text-right">QTY</span>
            <span className="w-16 text-right">PRICE</span>
            <span className="w-16 text-right">TOTAL</span>
          </div>

          {/* Single Line Divider */}
          <div className="text-black select-none tracking-tighter my-0.5 text-[11px]">
            ----------------------------------------
          </div>

          {/* Items Rows */}
          <div className="space-y-1 py-1 text-[10px]">
            {/* Petis */}
            <div className="flex justify-between font-bold">
              <span className="flex-1 text-left truncate pr-1">PETIS ({activeReceipt.petis * EGGS_PER_PETI} EGGS)</span>
              <span className="w-8 text-right">{activeReceipt.petis}</span>
              <span className="w-16 text-right">{Number(activeReceipt.ratePerPeti).toLocaleString()}</span>
              <span className="w-16 text-right font-bold">{(activeReceipt.petis * activeReceipt.ratePerPeti).toLocaleString()}</span>
            </div>

            {/* Loose Eggs */}
            {activeReceipt.looseEggs > 0 && (
              <div className="flex justify-between font-bold">
                <span className="flex-1 text-left truncate pr-1">LOOSE EGGS</span>
                <span className="w-8 text-right">{activeReceipt.looseEggs}</span>
                <span className="w-16 text-right">{activeReceipt.ratePerEgg}</span>
                <span className="w-16 text-right font-bold">
                  {Math.round(
                    activeReceipt.looseEggs * (activeReceipt.ratePerPeti / EGGS_PER_PETI)
                  ).toLocaleString()}
                </span>
              </div>
            )}

            {/* Broken Eggs Deduction */}
            {brokenEggs > 0 && (
              <div className="flex justify-between font-bold">
                <span className="flex-1 text-left truncate pr-1">LESS TOOTE (DAMAGE)</span>
                <span className="w-8 text-right">-{brokenEggs}</span>
                <span className="w-16 text-right">-</span>
                <span className="w-16 text-right font-bold">-{Number(activeReceipt.brokenDeduction || 0).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Single Line Divider */}
          <div className="text-black select-none tracking-tighter my-0.5 text-[11px]">
            ----------------------------------------
          </div>

          {/* Egg Count Summary */}
          <div className="flex justify-between text-[10px] py-0.5">
            <span>Gross:{grossEggs.toLocaleString()}{brokenEggs > 0 ? ` Damaged:-${brokenEggs}` : ""}</span>
            <span className="font-bold">Net:{netEggs.toLocaleString()} Eggs</span>
          </div>

          {/* Single Line Divider */}
          <div className="text-black select-none tracking-tighter my-0.5 text-[11px]">
            ----------------------------------------
          </div>

          {/* Sub Totals */}
          <div className="space-y-0.5 py-1 text-[11px]">
            <div className="flex justify-between">
              <span className="pl-12">Sub Total:</span>
              <span className="font-bold">
                {Number(
                  activeReceipt.currentSaleAmount ||
                  (Number(activeReceipt.totalAmount) - (Number(activeReceipt.previousBalance) || 0))
                ).toLocaleString()}
              </span>
            </div>

            {Number(activeReceipt.previousBalance) > 0 && (
              <div className="flex justify-between">
                <span className="pl-12">Previous Udhaar:</span>
                <span className="font-bold">
                  +{Number(activeReceipt.previousBalance).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Double Line Divider */}
          <div className="text-black select-none tracking-tighter font-bold my-1 text-[11px]">
            ========================================
          </div>

          {/* Bill Total, Tendered (Cash Wasool), Balance */}
          <div className="space-y-0.5 py-1 text-[11px]">
            <div className="flex justify-between font-bold text-xs">
              <span className="pl-12">Bill Total:</span>
              <span>
                {Number(
                  activeReceipt.grandTotal || activeReceipt.totalAmount
                ).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between font-bold">
              <span className="pl-12">Cash Wasool:</span>
              <span>{Number(activeReceipt.paidAmount).toLocaleString()}</span>
            </div>

            <div className="flex justify-between font-bold text-xs">
              <span className="pl-12">Balance:</span>
              <span>{Number(activeReceipt.remainingBalance).toLocaleString()}</span>
            </div>
          </div>

          {/* Double Line Divider */}
          <div className="text-black select-none tracking-tighter font-bold my-1 text-[11px]">
            ========================================
          </div>

          {/* Included Udhaar Invoices (if any) */}
          {activeReceipt.previousOrdersUdhaar && activeReceipt.previousOrdersUdhaar.length > 0 && (
            <>
              <div className="py-1 text-[9px] space-y-0.5">
                <span className="font-bold">Pending Invoices Included:</span>
                {activeReceipt.previousOrdersUdhaar.map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>#{p.invoiceNo} ({p.date}):</span>
                    <span>Rs. {Number(p.remainingBalance).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="text-black select-none tracking-tighter my-0.5 text-[11px]">
                ----------------------------------------
              </div>
            </>
          )}

          {/* Centered Thank You */}
          <div className="text-center py-1.5 space-y-0.5 text-[10px]">
            <p className="font-bold tracking-widest">THANK YOU</p>
            <p className="text-[9px]">Tijarat Me Barkat Ki Dua</p>
          </div>

          {/* Double Line Divider */}
          <div className="text-black select-none tracking-tighter font-bold my-1 text-[11px]">
            ========================================
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="bg-slate-900 p-3 rounded-b-2xl space-y-2 border-t border-slate-800 mt-2">
          {/* Main Direct WhatsApp button with direct PDF download link */}
          <button
            onClick={handleDirectWhatsApp}
            className="w-full py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all font-sans cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-white" />
            <span>Send WhatsApp Slip to {activeReceipt.phone || "Customer"}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="py-2.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-colors font-sans cursor-pointer shadow-xs"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Creating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Slip</span>
                </>
              )}
            </button>

            <button
              onClick={handleWhatsAppShare}
              disabled={isSharingPdf}
              className="py-2.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors font-sans cursor-pointer"
              title="Attach PDF directly in WhatsApp share"
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
          </div>
        </div>
      </div>
    </div>
  );
}
