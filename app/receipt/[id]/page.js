"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { Download, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { downloadThermalReceiptPDF } from "@/lib/thermalPdf";

const EGGS_PER_PETI = 360;

function AutoDownloadReceiptContent() {
  const params = useParams();
  const id = params?.id;

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading"); // 'loading' | 'downloaded' | 'error'
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const fetchAndDownload = async () => {
      try {
        setStatus("loading");
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error("Receipt not found");
        const data = await res.json();

        if (data.success && data.order) {
          if (!isMounted) return;
          setOrder(data.order);

          // Automatically trigger thermal PDF download immediately
          downloadThermalReceiptPDF(data.order, EGGS_PER_PETI);
          setStatus("downloaded");
        } else {
          throw new Error(data.error || "Receipt record not found");
        }
      } catch (err) {
        if (!isMounted) return;
        setErrorMessage(err.message || "Failed to download receipt");
        setStatus("error");
      }
    };

    fetchAndDownload();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleManualTrigger = () => {
    if (order) {
      downloadThermalReceiptPDF(order, EGGS_PER_PETI);
    }
  };

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-6 text-slate-900 text-center font-sans">
        <div className="w-full max-w-sm p-7 bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-500 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-base font-extrabold text-slate-900">Receipt Not Found</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {errorMessage || "Receipt could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-6 text-slate-900 text-center font-sans">
      <div className="w-full max-w-sm p-7 bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 flex flex-col items-center">
        {status === "loading" ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mb-3.5 shadow-sm">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            </div>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
              Al-Barkat Egg Wholesale
            </h1>
            <p className="text-xs text-amber-600 font-bold mt-1">
              Preparing Receipt PDF...
            </p>
            <p className="text-[12px] text-slate-500 mt-0.5">
              File download shuru ho rahi hai...
            </p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3.5 shadow-sm">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
              Al-Barkat Egg Wholesale
            </h1>
            <p className="text-xs text-emerald-700 font-bold mt-1">
              Receipt #{order?.invoiceNo || ""} PDF Downloaded Successfully
            </p>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Slip aap k device mai save ho gayi hai.
            </p>

            {/* Fallback button if popup blocker paused auto-download */}
            <button
              type="button"
              onClick={handleManualTrigger}
              className="mt-5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-400/25 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Again</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PublicReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-600 text-center font-sans">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading...</p>
        </div>
      }
    >
      <AutoDownloadReceiptContent />
    </Suspense>
  );
}
