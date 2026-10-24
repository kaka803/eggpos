"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/common/Header";
import StatCards from "@/components/admin/StatCards";
import OrdersGrid from "@/components/admin/OrdersGrid";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";
import StockInwardView from "@/components/admin/StockInwardView";
import SalesmenView from "@/components/admin/SalesmenView";
import ReportsView from "@/components/admin/ReportsView";
import SettingsView from "@/components/admin/SettingsView";
import StockModal from "@/components/admin/StockModal";
import NewSalesmanModal from "@/components/admin/NewSalesmanModal";
import ReceiptModal from "@/components/common/ReceiptModal";
import { useApp } from "@/context/AppContext";
import {
  Package,
  Layers,
  Users,
  FileText,
  PlusCircle,
  UserPlus,
  MapPin,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
  Receipt,
  User,
  Loader2,
  Settings,
  RefreshCw
} from "lucide-react";

export default function AdminPage() {
  const {
    salesmen,
    stockInwards,
    fetchStockInwards,
    fetchSalesmen,
    fetchStats,
    openReceipt,
    EGGS_PER_PETI,
  } = useApp();

  // Tab State: 'dashboard' | 'orders' | 'stock' | 'salesmen' | 'reports'
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedReportSalesmanId, setSelectedReportSalesmanId] = useState("All");

  // Selected Order for OrderDetailsModal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Modals
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [showSalesmanModal, setShowSalesmanModal] = useState(false);

  // Lightweight Recent Orders for Dashboard widget (limit 4)
  const [recentOrders, setRecentOrders] = useState([]);
  const [isRecentLoading, setIsRecentLoading] = useState(false);
  const [isDashboardRefreshing, setIsDashboardRefreshing] = useState(false);

  const fetchRecentOrders = useCallback(async () => {
    setIsRecentLoading(true);
    try {
      // First try today's orders
      const res = await fetch("/api/orders?limit=4&dateFilter=today&summary=true");
      if (res.ok) {
        const data = await res.json();
        if (data.success && (data.orders || []).length > 0) {
          setRecentOrders(data.orders);
          return;
        }
      }
      // If today has no orders yet, show most recent orders
      const fallbackRes = await fetch("/api/orders?limit=4&dateFilter=all&summary=true");
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        setRecentOrders(fbData.orders || []);
      }
    } catch (e) {
      console.warn("fetchRecentOrders error:", e);
    } finally {
      setIsRecentLoading(false);
    }
  }, []);

  // Full dashboard refresh: stats + salesmen + recent orders
  const handleDashboardRefresh = useCallback(async () => {
    setIsDashboardRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchSalesmen(), fetchRecentOrders()]);
    } finally {
      setIsDashboardRefreshing(false);
    }
  }, [fetchStats, fetchSalesmen, fetchRecentOrders]);

  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);

  // Tab switching with lazy loading (loads data only when the tab is visited)
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "stock" && stockInwards.length === 0) {
      fetchStockInwards();
    }
    if (tabId === "salesmen" && salesmen.length === 0) {
      fetchSalesmen();
    }
    if (tabId === "dashboard") {
      fetchStats();
      fetchRecentOrders();
    }
  };

  const handleOpenOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const adminTabs = [
    { id: "dashboard", label: "Dashboard", shortLabel: "Home", icon: Package },
    { id: "orders", label: "Orders Directory", shortLabel: "Orders", icon: ShoppingCart },
    { id: "stock", label: "Stock Inward", shortLabel: "Stock", icon: Layers },
    { id: "salesmen", label: "Salesmen Management", shortLabel: "Salesmen", icon: Users },
    { id: "reports", label: "Sales Reports & Khata", shortLabel: "Reports", icon: FileText },
    { id: "settings", label: "Settings", shortLabel: "Settings", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Header />

      {/* Main Admin Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-28 md:pb-8">
        {/* Navigation Sub-Tabs (Desktop) & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          {/* Desktop Tab Buttons (Hidden on mobile so no scrolling needed!) */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                    isActive
                      ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                setEditingStock(null);
                setShowStockModal(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#044E45] hover:bg-[#033c35] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Stock Inward</span>
            </button>
            <button
              onClick={() => setShowSalesmanModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ New Salesman</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Dashboard Header with Refresh button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Dashboard Overview</h2>
                <p className="text-xs text-slate-500 mt-0.5">Live godam performance & field delivery tracking</p>
              </div>
              <button
                onClick={handleDashboardRefresh}
                disabled={isDashboardRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-800 font-bold text-xs shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDashboardRefreshing ? "animate-spin text-amber-600" : ""}`} />
                <span>{isDashboardRefreshing ? "Refreshing..." : "Refresh Dashboard"}</span>
              </button>
            </div>
            {/* Top KPI Statistics with Date Filter */}
            <StatCards />
            {/* Salesmen Performance Live Overview */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Salesmen Live Performance Tracker
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time field monitoring of deliveries, targets and collections
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                  {salesmen.length} Active Salesmen
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {salesmen.map((sm) => {
                  const percentage = Math.min(
                    100,
                    Math.round((sm.todaySoldPetis / sm.dailyTargetPetis) * 100)
                  );
                  return (
                    <div
                      key={sm.id}
                      className="bg-[#FBFBFC] hover:bg-slate-50 transition-colors p-4 rounded-2xl border border-slate-200/70"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                            <User className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{sm.name}</h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[110px]">{sm.route}</span>
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sm.status === "Completed"
                              ? "bg-teal-50 text-teal-700 border border-teal-200/50"
                              : "bg-amber-50 text-amber-800 border border-amber-200/50"
                          }`}
                        >
                          {sm.status}
                        </span>
                      </div>

                      {/* Peti Target Progress */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600">
                            Sold: <strong className="text-slate-900">{sm.todaySoldPetis}</strong> /{" "}
                            {sm.dailyTargetPetis} Petis
                          </span>
                          <span className="text-amber-600 font-bold">{percentage}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Cash & Udhaar Footer */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">
                            Cash Collected
                          </span>
                          <strong className="text-emerald-700 font-bold">
                            Rs. {Number(sm.cashCollected).toLocaleString()}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[9px] uppercase">
                            Pending Credit
                          </span>
                          <strong className="text-red-600 font-bold">
                            Rs. {Number(sm.pendingUdhaar).toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders Preview Box with direct link to Orders Tab */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recent Deliveries Overview</h3>
                  <p className="text-xs text-slate-500">
                    Latest invoices issued by field salesmen today
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>View All Orders in Orders Tab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px] bg-slate-50">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Shop Name</th>
                      <th className="py-2.5 px-3">Salesman</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Total Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isRecentLoading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-1" />
                          <span>Loading recent deliveries...</span>
                        </td>
                      </tr>
                    ) : recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No recent deliveries found.
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => handleOpenOrderDetails(order)}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-amber-700">
                            #{order.id}
                          </td>
                          <td className="py-3 px-3">
                            <strong className="text-slate-900 block">{order.shopName}</strong>
                            <span className="text-[10px] text-slate-400">{order.area}</span>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700">
                            {order.salesmanName}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {order.petis} Petis ({(order.netEggs || order.totalEggs || 0).toLocaleString()} eggs)
                          </td>
                          <td className="py-3 px-3 font-extrabold text-slate-900">
                            Rs. {Number(order.totalAmount).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                order.paymentStatus === "Full Paid"
                                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenOrderDetails(order)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-[11px] cursor-pointer"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => openReceipt(order)}
                                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 font-black text-slate-950 text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>Receipt</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEPARATE ORDERS TAB (DEDICATED ORDERS DIRECTORY) */}
        {activeTab === "orders" && (
          <OrdersGrid onSelectOrder={handleOpenOrderDetails} />
        )}

        {/* TAB 3: STOCK INWARD */}
        {activeTab === "stock" && (
          <StockInwardView
            onOpenAddStock={() => {
              setEditingStock(null);
              setShowStockModal(true);
            }}
            onEditStock={(stock) => {
              setEditingStock(stock);
              setShowStockModal(true);
            }}
          />
        )}

        {/* TAB 4: SALESMEN MANAGEMENT */}
        {activeTab === "salesmen" && (
          <SalesmenView
            onOpenAddSalesman={() => setShowSalesmanModal(true)}
            onSelectReport={(smId) => {
              setSelectedReportSalesmanId(smId);
              setActiveTab("reports");
            }}
          />
        )}

        {/* TAB 5: SALES REPORTS & KHATA */}
        {activeTab === "reports" && (
          <ReportsView
            selectedSalesmanId={selectedReportSalesmanId}
            onSalesmanChange={setSelectedReportSalesmanId}
          />
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === "settings" && (
          <SettingsView />
        )}
      </main>

      {/* Order Details Modal when clicking any order */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }}
      />

      {/* Stock & Salesman Modals */}
      <StockModal
        isOpen={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setEditingStock(null);
        }}
        editRecord={editingStock}
      />
      <NewSalesmanModal
        isOpen={showSalesmanModal}
        onClose={() => setShowSalesmanModal(false)}
      />

      {/* Thermal Printer Style Receipt Modal */}
      <ReceiptModal />

      {/* Mobile Bottom Navigation Dock (Fixed Blurry Glass Effect) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] px-1 py-1.5 pb-[max(env(safe-area-inset-bottom),0.6rem)]">
        <div className="grid grid-cols-6 gap-0.5 items-center max-w-md mx-auto">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all relative cursor-pointer ${
                  isActive
                    ? "text-slate-950 font-black"
                    : "text-slate-500 hover:text-slate-800 font-medium"
                }`}
              >
                <div
                  className={`w-8 h-6.5 flex items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? "bg-amber-400 text-slate-950 shadow-xs scale-105"
                      : "bg-transparent text-slate-500"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-[9px] mt-0.5 tracking-tight truncate max-w-full leading-tight ${
                    isActive ? "font-extrabold text-slate-950" : "font-semibold text-slate-500"
                  }`}
                >
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
