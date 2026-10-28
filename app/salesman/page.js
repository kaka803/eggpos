"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/common/Header";
import NewSaleEntry from "@/components/salesman/NewSaleEntry";
import SalesmanHistory from "@/components/salesman/SalesmanHistory";
import TodayDeliveries from "@/components/salesman/TodayDeliveries";
import SalesmanCustomersView from "@/components/salesman/SalesmanCustomersView";
import ReceiptModal from "@/components/common/ReceiptModal";
import { useApp } from "@/context/AppContext";
import {
  MapPin,
  Smartphone,
  Monitor,
  ShoppingBag,
  History,
  TrendingUp,
  Package,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Loader2,
  Store,
  Users
} from "lucide-react";

export default function SalesmanPage() {
  const router = useRouter();
  const { currentUser, logout, salesOrders, fetchOrders, isOrdersLoading, EGGS_PER_PETI, customers } = useApp();

  // Tab: 'billing' | 'customers' | 'history' | 'stats'
  const [activeTab, setActiveTab] = useState("billing");
  const [selectedCustomerForBilling, setSelectedCustomerForBilling] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Authentication Lock: Ensure only logged in salesman can view this page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("andagodam_user");
      if (!saved) {
        router.replace("/login");
        return;
      }
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role !== "salesman") {
          router.replace("/login");
          return;
        }
      } catch (e) {
        router.replace("/login");
        return;
      }
      setIsAuthChecking(false);
    }
  }, [router]);

  // Strictly bind to the authenticated salesman account
  const activeSalesman = currentUser?.role === "salesman" ? currentUser : null;

  // Fetch orders strictly for THIS authenticated salesman on-demand
  useEffect(() => {
    if (activeSalesman?.id || activeSalesman?._id) {
      const sId = activeSalesman.id || activeSalesman._id;
      const filter = activeTab === "history" ? "all" : "today";
      fetchOrders({ salesmanId: sId, dateFilter: filter });
    }
  }, [activeSalesman?.id, activeSalesman?._id, activeTab, fetchOrders]);

  const myOrders = salesOrders.filter(
    (o) =>
      o.salesmanId === (activeSalesman?.id || activeSalesman?._id) ||
      o.salesmanName === activeSalesman?.name
  );

  // Mobile frame simulator toggle for desktop testing
  const [simulatorMode, setSimulatorMode] = useState(false);

  const handleLogout = () => {
    if (confirm(`Are you sure you want to log out of ${activeSalesman?.name || "your account"}?`)) {
      logout();
      router.replace("/login");
    }
  };

  if (isAuthChecking || !activeSalesman) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] flex flex-col justify-center items-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center max-w-sm w-full space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-800" />
          <h3 className="font-extrabold text-sm text-slate-800">Verifying Salesman Session...</h3>
          <p className="text-xs text-slate-500">Only authorized salesmen can access this portal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FA] text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Header />

      {/* Simulator Frame Toggle Bar for Desktop Users */}
      <div className="bg-slate-100 border-b border-slate-200 py-1.5 px-4 hidden md:flex items-center justify-between text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-teal-700" />
          <span>Salesman Mobile App Mode</span>
          <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-200">
            Field Delivery Friendly
          </span>
        </span>
        <button
          onClick={() => setSimulatorMode(!simulatorMode)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
            simulatorMode
              ? "bg-amber-100 text-amber-900 border-amber-300"
              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
          }`}
        >
          {simulatorMode ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          <span>{simulatorMode ? "Full Screen View" : "Device Simulator Frame (390px)"}</span>
        </button>
      </div>

      {/* Main Container */}
      <main
        className={`flex-1 flex justify-center ${
          simulatorMode
            ? "py-8 bg-slate-800 min-h-[calc(100vh-100px)]"
            : "p-0 sm:p-4 bg-[#F6F7FA]"
        }`}
      >
        {/* Mobile Device Shell */}
        <div
          className={`w-full bg-white flex flex-col transition-all ${
            simulatorMode
              ? "max-w-[420px] rounded-[44px] shadow-2xl border-[12px] border-slate-900 overflow-hidden min-h-[840px] max-h-[92vh]"
              : "max-w-md mx-auto min-h-screen sm:min-h-0 sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-lg"
          }`}
        >
          {/* Mobile App Header */}
          <div className="bg-[#044E45] text-white p-4 pt-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white leading-tight">
                  {activeSalesman.name}
                </h3>
                <p className="text-[11px] text-teal-200 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-300" />
                  <span>{activeSalesman.route}</span>
                </p>
              </div>

              {/* Verified Salesman Badge & Logout (NO DROPDOWN SWITCHER - STRICTLY SECURED) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-teal-900/90 text-amber-300 border border-teal-700/60 shadow-xs">
                  {activeSalesman.code ? `Code: ${activeSalesman.code}` : `@${activeSalesman.username}`}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg bg-teal-900/80 hover:bg-red-800 text-teal-200 hover:text-white transition-colors cursor-pointer"
                  title="Logout Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Daily Target Progress Strip */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between text-xs border border-white/10">
              <div>
                <span className="text-[10px] text-teal-200 block uppercase font-bold">
                  Today's Deliveries
                </span>
                <strong className="text-white text-sm">
                  {myOrders.reduce((sum, o) => sum + (Number(o.petis) || 0), 0)} / {activeSalesman.dailyTargetPetis || 50} Petis
                </strong>
              </div>
              <div className="h-7 w-[1px] bg-white/20" />
              <div>
                <span className="text-[10px] text-teal-200 block uppercase font-bold">
                  Total Eggs Sold
                </span>
                <strong className="text-amber-300 text-sm">
                  {myOrders.reduce((sum, o) => sum + (Number(o.netEggs) || Number(o.totalEggs) || 0), 0).toLocaleString()}
                </strong>
              </div>
              <div className="h-7 w-[1px] bg-white/20" />
              <div>
                <span className="text-[10px] text-teal-200 block uppercase font-bold">
                  Cash Collected
                </span>
                <strong className="text-emerald-300 text-sm">
                  Rs. {myOrders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          {/* Scrollable Mobile Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            {/* TAB 1: NEW SALE BILLING FORM */}
            {activeTab === "billing" && (
              <div>
                <NewSaleEntry
                  activeSalesman={activeSalesman}
                  initialCustomer={selectedCustomerForBilling}
                />
              </div>
            )}

            {/* TAB 2: ROUTE CUSTOMERS & KHATA */}
            {activeTab === "customers" && (
              <div>
                <SalesmanCustomersView
                  activeSalesman={activeSalesman}
                  onSelectForBilling={(cust) => {
                    setSelectedCustomerForBilling(cust);
                    setActiveTab("billing");
                  }}
                />
              </div>
            )}

            {/* TAB 3: MY SALES HISTORY */}
            {activeTab === "history" && (
              <div>
                <SalesmanHistory activeSalesman={activeSalesman} />
              </div>
            )}

            {/* TAB 4: ROUTE & PERFORMANCE STATS */}
            {activeTab === "stats" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Today's Target & Route Performance
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-amber-800 font-bold uppercase">
                        Petis Delivered
                      </span>
                      <h4 className="text-xl font-black text-slate-900 mt-1">
                        {activeSalesman.todaySoldPetis || 0} Petis
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Target: {activeSalesman.dailyTargetPetis || 50} Petis
                      </p>
                    </div>

                    <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                      <span className="text-[10px] text-teal-800 font-bold uppercase">
                        Net Eggs Delivered
                      </span>
                      <h4 className="text-xl font-black text-slate-900 mt-1">
                        {Number(activeSalesman.todaySoldEggs || 0).toLocaleString()}
                      </h4>
                      <p className="text-[11px] text-teal-700">1 Peti = {EGGS_PER_PETI} Eggs</p>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase">
                        Cash Collected
                      </span>
                      <h4 className="text-xl font-black text-emerald-700 mt-1">
                        Rs. {Number(activeSalesman.cashCollected || 0).toLocaleString()}
                      </h4>
                      <p className="text-[11px] text-emerald-600">Deposited into Godam Khata</p>
                    </div>

                    <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-[10px] text-red-800 font-bold uppercase">
                        Pending Udhaar
                      </span>
                      <h4 className="text-xl font-black text-red-600 mt-1">
                        Rs. {Number(activeSalesman.pendingUdhaar || 0).toLocaleString()}
                      </h4>
                      <p className="text-[11px] text-red-500">Due from shopkeepers</p>
                    </div>
                  </div>
                </div>

                {/* Recent deliveries brief list */}
                <div className="pt-2">
                  <TodayDeliveries activeSalesman={activeSalesman} />
                </div>
              </div>
            )}
          </div>

          {/* Mobile Bottom Navigation Dock (Fixed Blurry Glass Effect) */}
          <nav className="sticky bottom-0 left-0 right-0 z-30 bg-white/85 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] px-2.5 py-2 pb-[max(env(safe-area-inset-bottom),0.6rem)] mt-auto">
            <div className="grid grid-cols-4 gap-1 items-center max-w-sm mx-auto">
              {[
                { id: "billing", label: "New Sale", icon: ShoppingBag },
                { id: "customers", label: "Customers", icon: Store, count: customers?.length || 0 },
                { id: "history", label: "History", icon: History, count: myOrders.length },
                { id: "stats", label: "Route Stats", icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all relative cursor-pointer ${
                      isActive
                        ? "text-slate-950 font-black"
                        : "text-slate-500 hover:text-slate-800 font-medium"
                    }`}
                  >
                    <div
                      className={`w-11 h-7.5 flex items-center justify-center rounded-xl transition-all relative ${
                        isActive
                          ? "bg-amber-400 text-slate-950 shadow-xs scale-105"
                          : "bg-transparent text-slate-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.count > 0 && (
                        <span
                          className={`absolute -top-1 -right-1 text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                            isActive
                              ? "bg-slate-900 text-amber-400"
                              : "bg-amber-500 text-white"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9.5px] mt-0.5 tracking-tight truncate max-w-full leading-tight ${
                        isActive ? "font-extrabold text-slate-950" : "font-semibold text-slate-500"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </main>

      {/* Global Receipt Modal */}
      <ReceiptModal />
    </div>
  );
}
