"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  Smartphone,
  Package,
  TrendingUp,
  Receipt,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { totalStockInPetis, totalStockInEggs, salesmen, EGGS_PER_PETI } = useApp();

  return (
    <div className="min-h-screen bg-[#F6F7FA] text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <span className="text-xl">🥚</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                AndaGodam <span className="text-amber-500">POS</span>
              </h1>
              <p className="text-xs text-slate-500">
                Egg Wholesale & Warehouse Distribution System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Login Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Welcome Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-10 flex flex-col justify-center space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Godam Standard: 1 Peti = {EGGS_PER_PETI} Eggs</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Select Your Role to Access Portal
          </h2>
          <p className="text-sm text-slate-600">
            Dedicated portals for Warehouse Admin Management and Field Delivery Salesmen
          </p>
        </div>

        {/* Two Main Cards: Admin Portal & Salesman Mobile App */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Admin Godam Portal */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200/90 hover:border-amber-400 hover:shadow-xl transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Management Side
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">Admin Portal</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Full control over godam stock, purchase invoices, salesman creation, and financial reports.
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time Godam Stock (Petis & Total Eggs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Create Salesmen & Generate Login Credentials</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Incoming Stock Purchases (Poultry Farms Khareed)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Shop Deliveries & Salesman Ledger Reports</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              <Link
                href="/admin"
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-500 active:scale-[0.99] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-400/20 transition-all"
              >
                <span>Enter Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Salesman Field Mobile App */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200/90 hover:border-[#044E45] hover:shadow-xl transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Smartphone className="w-7 h-7 text-[#044E45]" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Field Delivery Side
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">Salesman Mobile App</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mobile-optimized interface for field delivery vans and bikes with instant receipt generation.
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Fast Shop Entry (Manual Typing OR Photo Capture)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Auto Egg Calculator (1 Peti = 360 Eggs + Loose Eggs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Cash & Market Credit (Udhaar) Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Direct WhatsApp Invoice Sharing to Customer</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              <Link
                href="/salesman"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#044E45] hover:bg-[#033c35] active:scale-[0.99] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-900/20 transition-all"
              >
                <span>Open Salesman Mobile App</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Current Live Stats Footer Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Godam Stock</span>
              <strong className="text-slate-900 text-sm font-extrabold">
                {totalStockInPetis} Petis ({totalStockInEggs.toLocaleString()} Eggs)
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Active Salesmen</span>
              <strong className="text-slate-900 text-sm font-extrabold">
                {salesmen.length} Field Staff On Route
              </strong>
            </div>
          </div>

          <div>
            <Link
              href="/login"
              className="text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1"
            >
              <span>Go to Login Screen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
