"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export const EGGS_PER_PETI = 360;

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Current authenticated user
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("andagodam_user");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  // Aggregated Database KPIs from /api/stats (Computed via fast Mongo aggregation)
  const [stats, setStats] = useState({
    totalStockInEggs: 0,
    totalStockInPetis: 0,
    todaySoldPetis: 0,
    todaySoldEggs: 0,
    periodSoldPetis: 0,
    periodSoldEggs: 0,
    grossRevenue: 0,
    totalSaleRevenue: 0,
    cashCollected: 0,
    pendingUdhaar: 0,
    costOfSoldEggs: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    isNetLoss: false,
    totalLossAmount: 0,
    totalBrokenEggs: 0,
    brokenSalesEggs: 0,
    brokenSalesLoss: 0,
    brokenPurchaseEggs: 0,
    brokenPurchaseLoss: 0,
    avgSaleRatePerPeti: 7300,
    avgPurchaseCostPerPeti: 6800,
    orderCount: 0,
    activeSalesmenCount: 0,
  });

  // Tab-specific datasets (Fetched on-demand / lazy loaded)
  const [stockInwards, setStockInwards] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);

  // Loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isStockLoading, setIsStockLoading] = useState(false);
  const [isSalesmenLoading, setIsSalesmenLoading] = useState(false);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);
  const [brokenEggsData, setBrokenEggsData] = useState({
    summary: {
      totalInwardBroken: 0,
      totalSalesReturnBroken: 0,
      totalWarehouseBroken: 0,
      totalBrokenInflow: 0,
      totalSoldEggs: 0,
      totalSoldRevenue: 0,
      totalLossEggs: 0,
      totalLossAmount: 0,
      availableBrokenEggs: 0,
      availableBrokenPetis: 0,
      availableBrokenLoose: 0,
    },
    actions: [],
    inwardRecords: [],
    salesReturnRecords: [],
  });
  const [isBrokenEggsLoading, setIsBrokenEggsLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);

  // In-memory cache for full order details { [id]: fullOrderObject }
  // Avoids re-fetching the same order details multiple times!
  const orderDetailCache = useRef({});

  // Active receipt modal data
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Godam and System Settings (name, address, contact phone, etc.)
  const [settings, setSettings] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("andagodam_settings");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return {
      godamName: "AL-BARKAT EGG WHOLESALE WAREHOUSE",
      godamAddress: "",
      godamPhone: "",
      godamCity: "",
      eggsPetiSize: 360,
    };
  });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          const s = data.settings;
          const sanitized = {
            godamName: s.godamName || "AL-BARKAT EGG WHOLESALE WAREHOUSE",
            godamAddress: s.godamAddress || "",
            godamPhone: s.godamPhone || "",
            godamCity: s.godamCity || "",
            eggsPetiSize: Number(s.eggsPetiSize) || 360,
          };
          setSettings(sanitized);
          if (typeof window !== "undefined") {
            localStorage.setItem("andagodam_settings", JSON.stringify(sanitized));
          }
          return sanitized;
        }
      }
    } catch (e) {
      console.warn("fetchSettings in AppContext error:", e);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // 1. Fetch Fast Aggregated Stats (Dashboard KPIs & Profit/Loss)
  const fetchStats = useCallback(async (dateFilter = "today", specificDate = null) => {
    try {
      const params = new URLSearchParams();
      if (typeof dateFilter === "object" && dateFilter !== null) {
        if (dateFilter.dateFilter) params.set("dateFilter", dateFilter.dateFilter);
        if (dateFilter.date) params.set("date", dateFilter.date);
      } else {
        params.set("dateFilter", dateFilter || "today");
        if (specificDate) {
          params.set("date", specificDate);
        }
      }

      const res = await fetch(`/api/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
          return data.stats;
        }
      }
    } catch (e) {
      console.warn("fetchStats error:", e);
    }
  }, []);

  // 2. Fetch Salesmen (On demand or dashboard overview)
  const fetchSalesmen = useCallback(async () => {
    setIsSalesmenLoading(true);
    try {
      const res = await fetch("/api/salesmen");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSalesmen(data.salesmen || []);
        }
      }
    } catch (e) {
      console.warn("fetchSalesmen error:", e);
    } finally {
      setIsSalesmenLoading(false);
    }
  }, []);

  // 2b. Fetch Customers (Directory of registered shops)
  const fetchCustomers = useCallback(async (params = {}) => {
    setIsCustomersLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set("search", params.search);
      if (params.salesmanId) searchParams.set("salesmanId", params.salesmanId);
      if (params.limit) searchParams.set("limit", params.limit.toString());

      const res = await fetch(`/api/customers?${searchParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.customers) {
          setCustomers(data.customers);
          return data.customers;
        }
      }
      return [];
    } catch (e) {
      console.warn("fetchCustomers error:", e);
      return [];
    } finally {
      setIsCustomersLoading(false);
    }
  }, []);

  // 3. Fetch Stock Inwards (On demand when Stock tab is visited)
  const fetchStockInwards = useCallback(async () => {
    setIsStockLoading(true);
    try {
      const res = await fetch("/api/stock");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStockInwards(data.stockInwards || []);
        }
      }
    } catch (e) {
      console.warn("fetchStockInwards error:", e);
    } finally {
      setIsStockLoading(false);
    }
  }, []);

  // 4. Fetch Orders with Date Filters & Light Payload (summary=true)
  const fetchOrders = useCallback(async (params = {}) => {
    setIsOrdersLoading(true);
    try {
      const searchParams = new URLSearchParams();
      // Default to today if dateFilter not specified
      searchParams.set("dateFilter", params.dateFilter || "today");
      searchParams.set("summary", params.summary !== false ? "true" : "false");

      if (params.salesmanId && params.salesmanId !== "All") {
        searchParams.set("salesmanId", params.salesmanId);
      }
      if (params.status && params.status !== "All") {
        searchParams.set("status", params.status);
      }
      if (params.search && params.search.trim() !== "") {
        searchParams.set("search", params.search.trim());
      }
      if (params.startDate) {
        searchParams.set("startDate", params.startDate);
      }
      if (params.endDate) {
        searchParams.set("endDate", params.endDate);
      }
      if (params.date) {
        searchParams.set("date", params.date);
      }
      if (params.limit) {
        searchParams.set("limit", params.limit.toString());
      }

      const res = await fetch(`/api/orders?${searchParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSalesOrders(data.orders || []);
          return data.orders || [];
        }
      }
      return [];
    } catch (e) {
      console.warn("fetchOrders error:", e);
      return [];
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  // 5. Fetch Full Order Details on Demand (for single order inspection / receipt / whatsapp)
  const fetchOrderDetails = useCallback(async (orderId) => {
    if (!orderId) return null;

    // Check fast in-memory cache first!
    if (orderDetailCache.current[orderId]) {
      return orderDetailCache.current[orderId];
    }

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          // Cache it for subsequent instant access
          orderDetailCache.current[orderId] = data.order;
          if (data.order._id) orderDetailCache.current[data.order._id] = data.order;
          if (data.order.invoiceNo) orderDetailCache.current[data.order.invoiceNo] = data.order;
          return data.order;
        }
      }
    } catch (e) {
      console.warn("fetchOrderDetails error:", e);
    }
    return null;
  }, []);

  // Initial Load: Fetch lightweight Stats, Salesmen, and Customer Directory!
  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchStats(), fetchSalesmen(), fetchCustomers()])
      .catch((err) => console.warn("Init fetch warning:", err))
      .finally(() => {
        setIsLoading(false);
        setDbConnected(true);
      });
  }, [fetchStats, fetchSalesmen, fetchCustomers]);

  // Derived stock totals (backwards compatibility for UI)
  const totalStockInEggs = stats.totalStockInEggs;
  const totalStockInPetis = stats.totalStockInPetis;
  const totalStockLooseEggs = totalStockInEggs % EGGS_PER_PETI;
  const totalBrokenEggsPurchase = stats.totalBrokenPurchase;
  const totalBrokenEggsSales = stats.totalBrokenSales;

  // Add stock purchase to Backend & update local state & stats
  const addStockInward = async (recordData) => {
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordData),
      });
      const data = await res.json();
      if (data.success && data.stockInward) {
        setStockInwards((prev) => [data.stockInward, ...prev]);
        fetchStats(); // Refresh KPIs in background
        return data.stockInward;
      }
    } catch (e) {
      console.error("Add Stock Inward Error:", e);
    }
    setStockInwards((prev) => [recordData, ...prev]);
    fetchStats();
    return recordData;
  };

  // Edit / Update existing stock purchase in Backend
  const updateStockInward = async (updatedRecord) => {
    try {
      const res = await fetch("/api/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRecord),
      });
      const data = await res.json();
      if (data.success && data.stockInward) {
        setStockInwards((prev) =>
          prev.map((item) => (item.id === data.stockInward.id ? data.stockInward : item))
        );
        fetchStats();
        return data.stockInward;
      }
    } catch (e) {
      console.error("Update Stock Inward Error:", e);
    }
    setStockInwards((prev) =>
      prev.map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
    );
    fetchStats();
    return updatedRecord;
  };

  // Broken Eggs Operations
  const fetchBrokenEggs = useCallback(async () => {
    try {
      setIsBrokenEggsLoading(true);
      const res = await fetch("/api/broken-eggs");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBrokenEggsData({
            summary: data.summary,
            actions: data.actions || [],
            inwardRecords: data.inwardRecords || [],
            salesReturnRecords: data.salesReturnRecords || [],
          });
        }
      }
    } catch (err) {
      console.warn("fetchBrokenEggs error:", err);
    } finally {
      setIsBrokenEggsLoading(false);
    }
  }, []);

  const addBrokenEggAction = useCallback(async (actionData) => {
    const res = await fetch("/api/broken-eggs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actionData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to record broken egg action");
    }
    await fetchBrokenEggs();
    await fetchStats();
    return data;
  }, [fetchBrokenEggs, fetchStats]);

  const deleteBrokenEggAction = useCallback(async (id) => {
    const res = await fetch(`/api/broken-eggs?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to delete record");
    }
    await fetchBrokenEggs();
    await fetchStats();
    return data;
  }, [fetchBrokenEggs, fetchStats]);

  // Expenses Operations
  const fetchExpenses = useCallback(async (dateFilter = "today", specificDate = null, category = "all") => {
    try {
      setIsExpensesLoading(true);
      const params = new URLSearchParams();
      if (dateFilter && dateFilter !== "all") params.set("dateFilter", dateFilter);
      if (specificDate) params.set("date", specificDate);
      if (category && category !== "all") params.set("category", category);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.expenses) {
          setExpenses(data.expenses);
          return data;
        }
      }
    } catch (err) {
      console.warn("fetchExpenses error:", err);
    } finally {
      setIsExpensesLoading(false);
    }
  }, []);

  const addExpense = useCallback(async (expenseData) => {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to record expense");
    }
    await fetchExpenses();
    await fetchStats();
    return data;
  }, [fetchExpenses, fetchStats]);

  const deleteExpense = useCallback(async (id) => {
    const res = await fetch(`/api/expenses?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to delete expense");
    }
    await fetchExpenses();
    await fetchStats();
    return data;
  }, [fetchExpenses, fetchStats]);

  // Add salesman to Backend & update local state
  const addSalesman = async (salesmanData) => {
    try {
      const res = await fetch("/api/salesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(salesmanData),
      });
      const data = await res.json();
      if (data.success && data.salesman) {
        setSalesmen((prev) => [...prev, data.salesman]);
        fetchStats();
        return data.salesman;
      } else if (data.error) {
        alert(data.error);
        return null;
      }
    } catch (e) {
      console.error("Add Salesman Error:", e);
    }
    setSalesmen((prev) => [...prev, salesmanData]);
    return salesmanData;
  };

  // Add customer to Backend & update local state
  const addCustomer = async (custData) => {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(custData),
      });
      const data = await res.json();
      if (data.success && data.customer) {
        setCustomers((prev) => [data.customer, ...prev]);
        return { success: true, customer: data.customer };
      }
      return { success: false, error: data.error || "Failed to create customer" };
    } catch (e) {
      console.error("Add Customer Error:", e);
      return { success: false, error: e.message };
    }
  };

  // Update customer in Backend & update local state
  const updateCustomer = async (custData) => {
    try {
      const res = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(custData),
      });
      const data = await res.json();
      if (data.success && data.customer) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === data.customer.id ? { ...c, ...data.customer } : c))
        );
        return { success: true, customer: data.customer };
      }
      return { success: false, error: data.error || "Failed to update customer" };
    } catch (e) {
      console.error("Update Customer Error:", e);
      return { success: false, error: e.message };
    }
  };

  // Delete customer from Backend & update local state
  const deleteCustomer = async (customerId) => {
    try {
      const res = await fetch(`/api/customers?id=${encodeURIComponent(customerId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== customerId && c._id !== customerId));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (e) {
      console.error("Delete Customer Error:", e);
      return { success: false, error: e.message };
    }
  };

  // Add sale order to Backend & update local state
  const addSaleOrder = async (orderData) => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (data.success && data.order) {
        // Cache the full order details
        orderDetailCache.current[data.order.id] = data.order;
        if (data.order._id) orderDetailCache.current[data.order._id] = data.order;

        setSalesOrders((prev) => [data.order, ...prev]);

        // Refresh live salesmen metrics, customer khata, and stats from server
        fetchSalesmen();
        fetchCustomers();
        fetchStats();
        return data.order;
      }
    } catch (e) {
      console.error("Add Sale Order Error:", e);
    }

    setSalesOrders((prev) => [orderData, ...prev]);
    fetchSalesmen();
    fetchStats();
    return orderData;
  };

  // Update sale order (Admin only)
  const updateSaleOrder = async (orderData) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (data.success && data.order) {
        const updated = data.order;
        // Invalidate and update cache
        orderDetailCache.current[updated.id] = updated;
        if (updated._id) orderDetailCache.current[updated._id] = updated;
        if (updated.invoiceNo) orderDetailCache.current[updated.invoiceNo] = updated;

        setSalesOrders((prev) =>
          prev.map((o) => (o.id === updated.id || o._id === updated._id ? updated : o))
        );

        fetchStats(); // Recalculate KPIs
        return { success: true, order: updated };
      } else {
        return { success: false, error: data.error || "Failed to update order" };
      }
    } catch (e) {
      console.error("Update Sale Order Error:", e);
      return { success: false, error: e.message };
    }
  };

  // Cloudinary Image Upload helper
  const uploadShopImage = async (base64OrData) => {
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64OrData }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    } catch (e) {
      console.error("Cloudinary upload failed:", e);
    }
    return base64OrData;
  };

  // Receipt Modal handlers (Supports on-demand detail fetch if needed)
  const openReceipt = async (orderOrSummary) => {
    if (!orderOrSummary) return;

    // Open immediately with available data
    setActiveReceipt(orderOrSummary);
    setShowReceiptModal(true);

    // If summary is missing pricing breakdown or eggs, fetch in background
    const id = orderOrSummary.id || orderOrSummary._id;
    if (id && (!orderOrSummary.ratePerPeti || !orderOrSummary.ratePerEgg)) {
      const full = await fetchOrderDetails(id);
      if (full) {
        setActiveReceipt(full);
      }
    }
  };

  const closeReceipt = () => {
    setShowReceiptModal(false);
    setActiveReceipt(null);
  };

  // Legacy refreshData helper for manual refreshes
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchStats(), fetchSalesmen(), fetchStockInwards()]);
    setIsLoading(false);
  }, [fetchStats, fetchSalesmen, fetchStockInwards]);

  // Login handler
  const login = (role, userRecord) => {
    const sessionUser = {
      role: role || userRecord.role || "admin",
      ...userRecord,
    };
    setCurrentUser(sessionUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("andagodam_user", JSON.stringify(sessionUser));
    }
  };

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("andagodam_user");
    }
  };

  return (
    <AppContext.Provider
      value={{
        EGGS_PER_PETI,
        currentUser,
        setCurrentUser,
        login,
        logout,
        stats,
        fetchStats,
        stockInwards,
        fetchStockInwards,
        addStockInward,
        updateStockInward,
        isStockLoading,
        salesmen,
        fetchSalesmen,
        addSalesman,
        isSalesmenLoading,
        customers,
        fetchCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        isCustomersLoading,
        brokenEggsData,
        isBrokenEggsLoading,
        fetchBrokenEggs,
        addBrokenEggAction,
        deleteBrokenEggAction,
        expenses,
        isExpensesLoading,
        fetchExpenses,
        addExpense,
        deleteExpense,
        salesOrders,
        setSalesOrders,
        fetchOrders,
        fetchOrderDetails,
        addSaleOrder,
        updateSaleOrder,
        isOrdersLoading,
        totalStockInPetis,
        totalStockInEggs,
        totalStockLooseEggs,
        totalBrokenEggsPurchase,
        totalBrokenEggsSales,
        activeReceipt,
        showReceiptModal,
        openReceipt,
        closeReceipt,
        uploadShopImage,
        refreshData,
        settings,
        setSettings,
        fetchSettings,
        isLoading,
        dbConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
