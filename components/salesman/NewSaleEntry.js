"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import {
  Store,
  Camera,
  Package,
  DollarSign,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Sparkles,
  HelpCircle,
  FileCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  History,
  User,
  Search,
  Check,
  X,
  UserPlus
} from "lucide-react";
import SalesmanNewCustomerModal from "./SalesmanNewCustomerModal";

export default function NewSaleEntry({ activeSalesman, initialCustomer = null }) {
  const {
    addSaleOrder,
    openReceipt,
    salesOrders,
    uploadShopImage,
    EGGS_PER_PETI,
    customers,
    fetchCustomers,
  } = useApp();

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentPreset, setPaymentPreset] = useState("full"); // 'full' | 'current' | 'credit' | 'custom'

  const [form, setForm] = useState({
    entryMode: "manual", // 'manual' | 'photo'
    shopName: "",
    shopkeeperName: "",
    phone: "",
    area: "",
    photoUrl: null,
    petis: "1",       // stored as string so backspace/clear works
    trays: "",        // 1 Tray = 30 eggs
    brokenEggs: "",   // empty string = 0 for math
    ratePerPeti: "7300",
    paymentMode: "Cash",
    paidAmount: "7300",
  });

  // State for previous pending udhaar lookup by phone
  const [pendingUdhaar, setPendingUdhaar] = useState({
    isLoading: false,
    hasPending: false,
    total: 0,
    orders: [],
    customerDetails: null,
  });
  const [showUdhaarDetails, setShowUdhaarDetails] = useState(false);

  // Salesman Add Customer Modal State
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [customerModalPrefill, setCustomerModalPrefill] = useState({});

  // Customer suggestion & autocomplete states
  const [activeSuggestionField, setActiveSuggestionField] = useState(null); // 'shopName' | 'shopkeeperName' | 'phone'
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [apiSuggestions, setApiSuggestions] = useState([]);
  const [isSearchingCust, setIsSearchingCust] = useState(false);
  const suggestionContainerRef = useRef(null);

  // Live filter matching registered customers based on search text
  const getSuggestions = useCallback(
    (field, text) => {
      if (!text || text.trim().length < 1) {
        return [];
      }
      const q = text.toLowerCase().trim();
      const cleanDigits = q.replace(/[^0-9]/g, "");

      const allCusts = [...(customers || []), ...(apiSuggestions || [])];
      const unique = [];
      const seen = new Set();
      for (const c of allCusts) {
        const key = c.id || c._id || c.phone;
        if (key && !seen.has(key)) {
          seen.add(key);
          unique.push(c);
        }
      }

      return unique
        .filter((c) => {
          const matchShop = c.shopName && c.shopName.toLowerCase().includes(q);
          const matchKeeper = c.shopkeeperName && c.shopkeeperName.toLowerCase().includes(q);
          const matchArea = c.area && c.area.toLowerCase().includes(q);
          const matchPhone =
            (cleanDigits.length >= 2 &&
              c.phone &&
              c.phone.replace(/[^0-9]/g, "").includes(cleanDigits)) ||
            (c.phone && c.phone.toLowerCase().includes(q));
          return matchShop || matchKeeper || matchArea || matchPhone;
        })
        .slice(0, 6);
    },
    [customers, apiSuggestions]
  );

  // Debounced API search to fetch latest DB customers when typing 2+ chars
  useEffect(() => {
    if (!activeSuggestionField) return;
    const text = form[activeSuggestionField];
    if (!text || text.trim().length < 2) {
      setApiSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setIsSearchingCust(true);
        const res = await fetch(`/api/customers?search=${encodeURIComponent(text.trim())}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.customers) {
            setApiSuggestions(data.customers);
          }
        }
      } catch (err) {
        console.warn("Customer search error:", err);
      } finally {
        setIsSearchingCust(false);
      }
    }, 200);

    return () => clearTimeout(t);
  }, [form.shopName, form.shopkeeperName, form.phone, activeSuggestionField]);

  // Click outside listener to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionContainerRef.current && !suggestionContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Handle selecting a suggested customer
  const handleSelectCustomer = useCallback((cust) => {
    if (!cust) return;
    setForm((prev) => ({
      ...prev,
      shopName: cust.shopName || prev.shopName,
      shopkeeperName: cust.shopkeeperName || prev.shopkeeperName,
      phone: cust.phone || prev.phone,
      area: cust.area || prev.area,
    }));
    setSelectedCustomer(cust);
    setShowSuggestions(false);
    setActiveSuggestionField(null);
    if (cust.phone) {
      checkPhoneUdhaar(cust.phone);
    }
  }, []);

  // Preload initialCustomer if passed from Customers tab (e.g. "Bill Now")
  useEffect(() => {
    if (initialCustomer) {
      handleSelectCustomer(initialCustomer);
    }
  }, [initialCustomer, handleSelectCustomer]);

  // Auto-lookup previous pending udhaar with instant local check + API DB query
  const checkPhoneUdhaar = async (phoneToTest) => {
    const rawDigits = (phoneToTest || "").replace(/[^0-9]/g, "");
    if (rawDigits.length < 7) {
      setPendingUdhaar({
        isLoading: false,
        hasPending: false,
        total: 0,
        orders: [],
        customerDetails: null,
      });
      return;
    }

    // 1. Instant synchronous check against in-memory salesOrders
    const last7 = rawDigits.slice(-7);
    const localMatches = (salesOrders || []).filter((o) => {
      const oDigits = (o.phone || "").replace(/[^0-9]/g, "");
      const isMatch = oDigits.endsWith(last7) || oDigits.includes(last7);
      const hasBalance = Number(o.remainingBalance) > 0 && !o.settledInOrder;
      return isMatch && hasBalance;
    });

    if (localMatches.length > 0) {
      const localTotal = localMatches.reduce((s, o) => s + (Number(o.remainingBalance) || 0), 0);
      setPendingUdhaar({
        isLoading: false,
        hasPending: true,
        total: localTotal,
        orders: localMatches.map((o) => ({
          id: o.invoiceNo || o.id,
          invoiceNo: o.invoiceNo || o.id,
          date: o.date,
          time: o.time,
          shopName: o.shopName,
          shopkeeperName: o.shopkeeperName,
          petis: o.petis,
          netEggs: o.netEggs || o.totalEggs,
          totalAmount: o.totalAmount,
          paidAmount: o.paidAmount,
          remainingBalance: o.remainingBalance,
          paymentStatus: o.paymentStatus,
        })),
        customerDetails: {
          shopName: localMatches[0].shopName,
          shopkeeperName: localMatches[0].shopkeeperName,
          phone: localMatches[0].phone,
          area: localMatches[0].area,
        },
      });

      // Auto fill shop & customer details if currently blank
      setForm((prev) => ({
        ...prev,
        shopName: prev.shopName || localMatches[0].shopName || "",
        shopkeeperName: prev.shopkeeperName || localMatches[0].shopkeeperName || "",
        area: prev.area || localMatches[0].area || "",
      }));
    }

    // 2. Query MongoDB backend for full persistent records
    try {
      setPendingUdhaar((prev) => ({ ...prev, isLoading: true }));
      const res = await fetch(`/api/orders?pendingUdhaarPhone=${encodeURIComponent(rawDigits)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPendingUdhaar({
            isLoading: false,
            hasPending: data.hasPendingUdhaar,
            total: data.totalPendingUdhaar || 0,
            orders: data.pendingOrders || [],
            customerDetails: data.customerDetails || null,
          });

          // Auto-fill customer profile details
          if (data.customerDetails) {
            setForm((prev) => ({
              ...prev,
              shopName: prev.shopName || data.customerDetails.shopName || "",
              shopkeeperName: prev.shopkeeperName || data.customerDetails.shopkeeperName || "",
              area: prev.area || data.customerDetails.area || "",
            }));
          }
        }
      }
    } catch (err) {
      console.warn("Failed to check pending udhaar:", err);
    } finally {
      setPendingUdhaar((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkPhoneUdhaar(form.phone);
    }, 250);
    return () => clearTimeout(timer);
  }, [form.phone]);

  // 1 Tray = 30 Eggs; 1 Peti = 12 Trays = 360 Eggs
  const EGGS_PER_TRAY = 30;
  const petisCount = Number(form.petis) || 0;
  const traysCount = Number(form.trays) || 0;
  const looseCount = traysCount * EGGS_PER_TRAY;
  const grossEggs = petisCount * EGGS_PER_PETI + looseCount;
  const brokenCount = Math.min(grossEggs, Number(form.brokenEggs) || 0);
  const netEggs = Math.max(0, grossEggs - brokenCount);

  const petiRate = Number(form.ratePerPeti) || 0;
  const singleEggRate = petiRate > 0 ? petiRate / EGGS_PER_PETI : 0;
  const trayRate = singleEggRate * EGGS_PER_TRAY; // Rate per tray = ratePerPeti / 12
  const traysAmount = Math.round(traysCount * trayRate);
  const grossBill = petisCount * petiRate + traysAmount;
  // Per business rule: Broken eggs are recorded for warehouse stock tracking, but NOT deducted from customer bill
  const brokenDeduction = 0;
  const totalBill = grossBill;

  // Previous balance and grand total math
  const previousUdhaarTotal = pendingUdhaar.hasPending ? pendingUdhaar.total : 0;
  const grandTotal = totalBill + previousUdhaarTotal;

  // Amount paid depends on preset or custom input
  const paid =
    paymentPreset === "full"
      ? grandTotal
      : paymentPreset === "current"
      ? totalBill
      : paymentPreset === "credit"
      ? 0
      : Number(form.paidAmount) || 0;

  const remainingBalance = Math.max(0, grandTotal - paid);

  const updatePetis = (newPetis) => {
    const validPetis = Math.max(0, newPetis);
    const newGross = validPetis * EGGS_PER_PETI + looseCount;
    const newBroken = Math.min(newGross, Number(form.brokenEggs) || 0);
    const newGrossBill = validPetis * petiRate + traysAmount;
    const newTotal = newGrossBill;
    const newGrandTotal = newTotal + previousUdhaarTotal;

    setForm((prev) => ({
      ...prev,
      petis: String(validPetis),
      paidAmount:
        paymentPreset === "full"
          ? String(newGrandTotal)
          : paymentPreset === "current"
          ? String(newTotal)
          : paymentPreset === "credit"
          ? "0"
          : prev.paidAmount,
    }));
  };

  const handlePresetSelect = (preset) => {
    setPaymentPreset(preset);
    if (preset === "full") {
      setForm((prev) => ({ ...prev, paidAmount: String(grandTotal), paymentMode: "Cash" }));
    } else if (preset === "current") {
      setForm((prev) => ({ ...prev, paidAmount: String(totalBill), paymentMode: "Cash" }));
    } else if (preset === "credit") {
      setForm((prev) => ({ ...prev, paidAmount: "0", paymentMode: "Credit / Khata" }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        const uploadedUrl = await uploadShopImage(base64);
        setForm((prev) => ({
          ...prev,
          photoUrl: uploadedUrl,
          shopName: prev.shopName || "Photo Shop Entry",
        }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shopName && !form.photoUrl) {
      alert("Please enter Shop Name OR snap a shop signboard photo!");
      return;
    }

    if (petisCount === 0 && looseCount === 0) {
      alert("Please enter at least 1 Peti or loose eggs.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Serial numbers start from 0001
      const orderId = String(salesOrders.length + 1).padStart(4, "0");
      const code = (form.shopName ? form.shopName.slice(0, 2) : "SP").toUpperCase();
      const status = remainingBalance <= 0 ? "Full Paid" : paid === 0 ? "Credit / Unpaid" : "Partial";

      const newOrder = {
        id: orderId,
        invoiceNo: orderId,
        code: code,
        salesmanId: activeSalesman?.id || "SM-1",
        salesmanName: activeSalesman?.name || "Muhammad Usman",
        shopName: form.shopName || "Shop Board Snap Entry",
        shopkeeperName: form.shopkeeperName || "Shopkeeper",
        phone: form.phone || "03001234567",
        area: form.area || activeSalesman?.route || "Market Route",
        hasPhoto: !!form.photoUrl,
        photoUrl: form.photoUrl,
        petis: petisCount,
        trays: traysCount,
        looseEggs: looseCount,
        grossEggs: grossEggs,
        brokenEggs: brokenCount, // Toote hue anday
        netEggs: netEggs,
        totalEggs: netEggs, // Billable net eggs
        ratePerPeti: petiRate,
        ratePerEgg: singleEggRate.toFixed(2),
        brokenDeduction: brokenDeduction,
        totalAmount: grandTotal,
        currentSaleAmount: totalBill,
        previousBalance: previousUdhaarTotal,
        grandTotal: grandTotal,
        previousOrdersUdhaar: pendingUdhaar.orders.map((o) => ({
          invoiceNo: o.invoiceNo,
          date: o.date,
          remainingBalance: o.remainingBalance,
          totalAmount: o.totalAmount,
          paidAmount: o.paidAmount,
        })),
        pendingOrderInvoices: pendingUdhaar.orders.map((o) => o.invoiceNo),
        paidAmount: paid,
        remainingBalance: remainingBalance,
        paymentStatus: status,
        paymentMode: form.paymentMode,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        orderStatus: "Completed",
      };

      const saved = await addSaleOrder(newOrder);
      openReceipt(saved || newOrder);

      // Reset Form for next sale
      setForm({
        entryMode: "manual",
        shopName: "",
        shopkeeperName: "",
        phone: "",
        area: "",
        photoUrl: null,
        petis: "1",
        trays: "",
        brokenEggs: "",
        ratePerPeti: "7300",
        paymentMode: "Cash",
        paidAmount: "7300",
      });
      setPaymentPreset("full");
      setSelectedCustomer(null);
      setShowSuggestions(false);
      setPendingUdhaar({
        isLoading: false,
        hasPending: false,
        total: 0,
        orders: [],
        customerDetails: null,
      });
      setShowUdhaarDetails(false);
    } catch (err) {
      console.error("Order submit error:", err);
      alert("Error saving sale order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render suggestions dropdown below active input
  const renderSuggestionsDropdown = (field) => {
    if (!showSuggestions || activeSuggestionField !== field) return null;
    const currentText = form[field] || "";
    if (currentText.trim().length < 1) return null;

    const matches = getSuggestions(field, currentText);

    // If no matches found, prompt to create new customer
    if (matches.length === 0) {
      return (
        <div className="absolute z-40 left-0 right-0 mt-1 bg-white rounded-2xl border-2 border-amber-400 shadow-2xl overflow-hidden animate-in fade-in duration-150 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold">Koi saved customer nahi mila</span>
            <span className="text-[11px] text-amber-800 font-bold max-w-[120px] truncate">"{currentText}"</span>
          </div>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setCustomerModalPrefill({
                shopName: field === "shopName" ? currentText : form.shopName || "",
                shopkeeperName: field === "shopkeeperName" ? currentText : form.shopkeeperName || "",
                phone: field === "phone" ? currentText : form.phone || "",
                area: form.area || activeSalesman?.route || "",
              });
              setIsAddCustomerModalOpen(true);
              setShowSuggestions(false);
            }}
            className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Naya Customer Add Karein (+ Add)</span>
          </button>
        </div>
      );
    }

    return (
      <div className="absolute z-40 left-0 right-0 mt-1 bg-white rounded-2xl border-2 border-amber-400 shadow-2xl overflow-hidden animate-in fade-in duration-150">
        <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between text-[11px] font-bold text-amber-900">
          <span className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-amber-700" />
            <span>Matching Customers ({matches.length})</span>
          </span>
          {isSearchingCust && <Loader2 className="w-3 h-3 animate-spin text-amber-700" />}
          <span className="text-[10px] text-amber-700/80">Tap to select & auto-fill</span>
        </div>

        <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
          {matches.map((cust) => {
            const hasUdhaar = Number(cust.pendingUdhaar) > 0;
            return (
              <button
                key={cust.id || cust._id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectCustomer(cust);
                }}
                className="w-full text-left p-2.5 hover:bg-amber-50/70 active:bg-amber-100 transition-colors flex items-center justify-between gap-2.5 cursor-pointer"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    <Store className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">
                      {cust.shopName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700">
                        {cust.shopkeeperName || "Customer"}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-700 font-bold">{cust.phone}</span>
                      {cust.area && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 truncate max-w-[100px]">
                            {cust.area}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {hasUdhaar ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black border border-red-200">
                      ⚠️ Rs. {Number(cust.pendingUdhaar).toLocaleString()}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Clear</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Add New Customer Option at Bottom */}
        <div className="p-2 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setCustomerModalPrefill({
                shopName: field === "shopName" ? currentText : form.shopName || "",
                shopkeeperName: field === "shopkeeperName" ? currentText : form.shopkeeperName || "",
                phone: field === "phone" ? currentText : form.phone || "",
                area: form.area || activeSalesman?.route || "",
              });
              setIsAddCustomerModalOpen(true);
              setShowSuggestions(false);
            }}
            className="w-full py-1.5 px-2.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 text-slate-900 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-700" />
            <span>Naya Customer Add Karein (+ Add New)</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* =========================================================================
          STEP 1: SHOP & CUSTOMER INFORMATION
          ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="font-extrabold text-sm text-slate-900">
              Shop & Customer Details
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Add Customer Button */}
            <button
              type="button"
              onClick={() => {
                setCustomerModalPrefill({
                  shopName: form.shopName || "",
                  shopkeeperName: form.shopkeeperName || "",
                  phone: form.phone || "",
                  area: form.area || activeSalesman?.route || "",
                });
                setIsAddCustomerModalOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-black rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Naya Customer Add Karein"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Customer</span>
            </button>

            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setForm({ ...form, entryMode: "manual" })}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  form.entryMode === "manual"
                    ? "bg-amber-400 text-slate-950 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Type Details
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, entryMode: "photo" })}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-all ${
                  form.entryMode === "photo"
                    ? "bg-teal-800 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Snap</span>
              </button>
            </div>
          </div>
        </div>

        {form.entryMode === "manual" ? (
            <div className="space-y-3" ref={suggestionContainerRef}>
              {/* Selected Customer Banner */}
              {selectedCustomer && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-2 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-amber-950 truncate">
                      Selected:{" "}
                      <strong className="font-black text-slate-900">
                        {selectedCustomer.shopName}
                      </strong>{" "}
                      ({selectedCustomer.phone})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-[11px] font-bold text-slate-500 hover:text-red-600 px-2 py-0.5 rounded hover:bg-white transition-colors cursor-pointer shrink-0"
                  >
                    Clear Selection
                  </button>
                </div>
              )}

              {/* Shop Name Input with Autocomplete */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Shop Name (Dukan ka Naam) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Madina Super Store (Type to search)"
                  value={form.shopName}
                  onFocus={() => {
                    setActiveSuggestionField("shopName");
                    setShowSuggestions(true);
                  }}
                  onChange={(e) => {
                    setForm({ ...form, shopName: e.target.value });
                    setActiveSuggestionField("shopName");
                    setShowSuggestions(true);
                    if (selectedCustomer && selectedCustomer.shopName !== e.target.value) {
                      setSelectedCustomer(null);
                    }
                  }}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                />
                {renderSuggestionsDropdown("shopName")}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Customer / Owner Name with Autocomplete */}
                <div className="relative">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Customer / Owner Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Haji Abdul"
                    value={form.shopkeeperName}
                    onFocus={() => {
                      setActiveSuggestionField("shopkeeperName");
                      setShowSuggestions(true);
                    }}
                    onChange={(e) => {
                      setForm({ ...form, shopkeeperName: e.target.value });
                      setActiveSuggestionField("shopkeeperName");
                      setShowSuggestions(true);
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                  />
                  {renderSuggestionsDropdown("shopkeeperName")}
                </div>

                {/* WhatsApp / Phone with Autocomplete & Udhaar badge */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      WhatsApp / Phone *
                    </label>
                    {pendingUdhaar.hasPending && (
                      <span className="text-[10px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        ⚠️ Udhaar: Rs. {pendingUdhaar.total.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="03001234567"
                      value={form.phone}
                      onFocus={() => {
                        setActiveSuggestionField("phone");
                        setShowSuggestions(true);
                      }}
                      onChange={(e) => {
                        setForm({ ...form, phone: e.target.value });
                        setActiveSuggestionField("phone");
                        setShowSuggestions(true);
                      }}
                      onBlur={() => checkPhoneUdhaar(form.phone)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                    />
                    {pendingUdhaar.isLoading && (
                      <Loader2 className="w-4 h-4 animate-spin text-teal-700 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {renderSuggestionsDropdown("phone")}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Area / Shop Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop # 12, Main Bazar"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                />
              </div>
            </div>
          ) : (
          /* Camera Signboard Upload */
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-teal-300 text-center">
              {form.photoUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden max-h-40 w-full bg-slate-900 shadow-inner">
                    <img
                      src={form.photoUrl}
                      alt="Captured Shop Board"
                      className="w-full h-40 object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-slate-900/90 text-amber-300 text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Signboard Photo Attached
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, photoUrl: null })}
                    className="text-xs text-red-600 font-bold hover:underline"
                  >
                    Remove & Re-take Photo
                  </button>
                </div>
              ) : (
                <div className="py-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Snap Shop Signboard Photo
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Fast logging option for field salesmen on bike/van
                  </p>

                  <label className="mt-3 px-4 py-2.5 rounded-xl bg-teal-800 text-white text-xs font-bold shadow-md hover:bg-teal-900 cursor-pointer inline-flex items-center gap-2 transition-all">
                    <Camera className="w-4 h-4" />
                    <span>{isUploading ? "Uploading to Cloudinary..." : "Open Camera / Take Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      disabled={isUploading}
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Shopkeeper WhatsApp Number (for receipt) *
                </label>
                {pendingUdhaar.hasPending && (
                  <span className="text-[10px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    ⚠️ Udhaar: Rs. {pendingUdhaar.total.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="03001234567"
                  value={form.phone}
                  onFocus={() => {
                    setActiveSuggestionField("phone");
                    setShowSuggestions(true);
                  }}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value });
                    setActiveSuggestionField("phone");
                    setShowSuggestions(true);
                  }}
                  onBlur={() => checkPhoneUdhaar(form.phone)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
                {pendingUdhaar.isLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-teal-700 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {renderSuggestionsDropdown("phone")}
            </div>
          </div>
        )}

        {/* PENDING UDHAAR AUTO-ALERT & BREAKDOWN */}
        {pendingUdhaar.isLoading && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center gap-2 text-amber-800">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
            <span className="font-semibold">Checking shop previous udhaar records...</span>
          </div>
        )}

        {pendingUdhaar.hasPending && (
          <div className="mt-3 rounded-2xl bg-amber-50/70 border border-amber-200/90 p-3.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
                  <History className="w-4 h-4 text-amber-800" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Previous Udhaar (Peechla Baqaya)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 border border-amber-300">
                      {pendingUdhaar.orders.length} Unpaid {pendingUdhaar.orders.length > 1 ? "Invoices" : "Invoice"}
                    </span>
                  </div>
                  <p className="text-sm font-black text-red-600 mt-0.5">
                    Rs. {pendingUdhaar.total.toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUdhaarDetails((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <span>{showUdhaarDetails ? "Hide Details" : "View Invoices"}</span>
                {showUdhaarDetails ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>

            {/* EXPANDED PENDING INVOICES LIST */}
            {showUdhaarDetails && (
              <div className="pt-2.5 border-t border-amber-200/70 space-y-2">
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {pendingUdhaar.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs hover:border-amber-300 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            #{ord.invoiceNo || ord.id}
                          </span>
                          <span className="text-[11px] text-slate-500">{ord.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {ord.petis} Petis • Bill: Rs. {Number(ord.totalAmount).toLocaleString()} • Paid: Rs. {Number(ord.paidAmount).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Due Udhaar</span>
                        <strong className="text-red-600 font-black text-xs">
                          Rs. {Number(ord.remainingBalance).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          STEP 2: EGG QUANTITY & BREAKAGE (TOOTE ANDAY)
          ========================================================================= */}
      <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="font-extrabold text-sm text-slate-900">
              Quantity & Breakage
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
            1 Peti = {EGGS_PER_PETI} Eggs
          </span>
        </div>

        {/* Petis Touch Stepper */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="font-bold text-slate-800">Boxes (Petis) Quantity:</span>
            <span className="font-extrabold text-amber-800">
              {petisCount * EGGS_PER_PETI} Eggs Gross
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updatePetis(form.petis - 1)}
              className="w-14 h-12 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-2xl font-black text-slate-700 flex items-center justify-center active:scale-95 transition-all shadow-xs"
            >
              -
            </button>

            <div className="flex-1 relative">
              <input
                type="number"
                min="0"
                value={form.petis}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Allow empty string while typing; recalc bill on valid number
                  setForm((prev) => ({
                    ...prev,
                    petis: raw,
                    ...(raw !== "" && {
                      paidAmount:
                        paymentPreset === "full"
                          ? String(Math.max(0, Number(raw) * petiRate + traysAmount + previousUdhaarTotal))
                          : paymentPreset === "current"
                          ? String(Math.max(0, Number(raw) * petiRate + traysAmount))
                          : paymentPreset === "credit"
                          ? "0"
                          : prev.paidAmount,
                    }),
                  }));
                }}
                onBlur={(e) => {
                  // On blur, ensure valid non-negative number
                  if (e.target.value === "" || Number(e.target.value) < 0) {
                    setForm((prev) => ({ ...prev, petis: "0" }));
                  }
                }}
                className="w-full text-center font-black text-2xl bg-white border border-amber-400 rounded-xl h-12 text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                Petis
              </span>
            </div>

            <button
              type="button"
              onClick={() => updatePetis(form.petis + 1)}
              className="w-14 h-12 rounded-xl bg-amber-400 hover:bg-amber-500 text-2xl font-black text-slate-950 flex items-center justify-center active:scale-95 transition-all shadow-xs"
            >
              +
            </button>
          </div>

          {/* Quick Peti Preset Chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
            {[1, 2, 3, 5, 8, 10, 15].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => updatePetis(num)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition-all shrink-0 ${
                  form.petis === num
                    ? "bg-slate-900 text-amber-300 border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {num} Peti
              </button>
            ))}
          </div>
        </div>

        {/* Trays & Rate per Peti */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Trays (30 Eggs / Tray)
              </label>
              {traysCount > 0 && (
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                  {traysCount * 30} Eggs
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              placeholder="0 Trays"
              value={form.trays}
              onChange={(e) => {
                const raw = e.target.value;
                const newTrays = Number(raw) || 0;
                const newTraysAmount = Math.round(newTrays * (petiRate / 12));
                const newGross = petisCount * petiRate + newTraysAmount;
                const newGrand = newGross + previousUdhaarTotal;
                setForm((prev) => ({
                  ...prev,
                  trays: raw,
                  ...(raw !== "" && {
                    paidAmount:
                      paymentPreset === "full"
                        ? String(newGrand)
                        : paymentPreset === "current"
                        ? String(newGross)
                        : paymentPreset === "credit"
                        ? "0"
                        : prev.paidAmount,
                  }),
                }));
              }}
              onBlur={(e) => { if (e.target.value === "") setForm((p) => ({ ...p, trays: "" })); }}
              className="w-full text-xs font-black text-slate-900 bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {/* Quick Tray Presets */}
            <div className="flex items-center gap-1 mt-1.5 overflow-x-auto pb-0.5">
              {[1, 2, 3, 4, 6].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    const newTraysAmount = Math.round(t * (petiRate / 12));
                    const newGross = petisCount * petiRate + newTraysAmount;
                    const newGrand = newGross + previousUdhaarTotal;
                    setForm((prev) => ({
                      ...prev,
                      trays: String(t),
                      paidAmount:
                        paymentPreset === "full"
                          ? String(newGrand)
                          : paymentPreset === "current"
                          ? String(newGross)
                          : paymentPreset === "credit"
                          ? "0"
                          : prev.paidAmount,
                    }));
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors shrink-0 ${
                    form.trays === String(t)
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {t} Tray{t > 1 ? "s" : ""}
                </button>
              ))}
            </div>
            {petiRate > 0 && (
              <span className="text-[10px] text-slate-500 block mt-1">
                ≈ Rs. {Math.round(petiRate / 12)} / tray
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Rate per Peti (Rs) *
            </label>
            <input
              type="number"
              required
              min="0"
              placeholder="0"
              value={form.ratePerPeti}
              onChange={(e) => {
                const raw = e.target.value;
                const newPetiRate = Number(raw) || 0;
                const newTraysAmount = Math.round(traysCount * (newPetiRate / 12));
                const newGross = petisCount * newPetiRate + newTraysAmount;
                const newGrand = newGross + previousUdhaarTotal;
                setForm((prev) => ({
                  ...prev,
                  ratePerPeti: raw,
                  paidAmount:
                    paymentPreset === "full"
                      ? String(newGrand)
                      : paymentPreset === "current"
                      ? String(newGross)
                      : paymentPreset === "credit"
                      ? "0"
                      : prev.paidAmount,
                }));
              }}
              onBlur={(e) => { if (e.target.value === "") setForm((p) => ({ ...p, ratePerPeti: "0" })); }}
              className="w-full text-xs font-extrabold text-slate-900 bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <span className="text-[10px] text-slate-500 block mt-0.5">
              ≈ Rs. {(petiRate > 0 ? petiRate / EGGS_PER_PETI : 0).toFixed(2)} / egg
            </span>
          </div>
        </div>

        {/* TOOTE HUE ANDAY (BROKEN EGGS WAREHOUSE RECORD) */}
        <div className="bg-amber-50/90 p-3 rounded-xl border border-amber-300 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Toote Hue Anday (Broken Eggs)</span>
            </label>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
              Warehouse Record (No Bill Deduction)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="0 (e.g. 5, 10 toote anday)"
              value={form.brokenEggs}
              onChange={(e) => setForm({ ...form, brokenEggs: e.target.value })}
              onBlur={(e) => { if (e.target.value === "") setForm((p) => ({ ...p, brokenEggs: "" })); }}
              className="w-full text-xs font-black text-amber-900 bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {brokenCount > 0 && (
              <span className="text-xs font-black text-amber-900 whitespace-nowrap px-2.5 py-1 rounded-lg bg-amber-200/80 border border-amber-300 shrink-0">
                📦 {brokenCount} Recorded
              </span>
            )}
          </div>
          {brokenCount > 0 && (
            <p className="text-[11px] text-amber-800 font-medium">
              ✓ {brokenCount} toote anday warehouse record mai save honge (Customer bill mai kami nahi hogi).
            </p>
          )}
        </div>

        {/* Live Calculation Preview Strip */}
        {/* Live Calculation Preview Strip */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-300 text-xs space-y-1.5 shadow-xs">
          <div className="flex justify-between text-slate-600">
            <span>Gross Eggs:</span>
            <strong className="text-slate-900">
              {grossEggs.toLocaleString()} Eggs
              {traysCount > 0 && ` (${petisCount} Petis + ${traysCount} Trays)`}
            </strong>
          </div>
          {brokenCount > 0 && (
            <div className="flex justify-between text-amber-800 font-bold">
              <span>Broken Eggs (Warehouse Record):</span>
              <span>{brokenCount} Eggs (No bill deduction)</span>
            </div>
          )}
          <div className="flex justify-between text-teal-800 font-extrabold pt-1 border-t border-slate-100">
            <span>Net Billable Eggs:</span>
            <span>{netEggs.toLocaleString()} Eggs</span>
          </div>

          <div className="flex items-baseline justify-between pt-1 border-t border-amber-200">
            <span className="font-bold text-slate-700">Today's Sale Bill:</span>
            <strong className="text-sm font-black text-slate-900">
              Rs. {totalBill.toLocaleString()}
            </strong>
          </div>

          {pendingUdhaar.hasPending && (
            <div className="flex items-baseline justify-between text-red-700 font-extrabold pt-0.5">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                Previous Pending Udhaar:
              </span>
              <span className="text-sm font-black">
                + Rs. {pendingUdhaar.total.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-baseline justify-between pt-1.5 border-t-2 border-slate-900">
            <span className="font-black text-slate-950 text-sm">Kul Wasooli (Grand Total):</span>
            <strong className="text-base font-black text-emerald-800">
              Rs. {grandTotal.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* =========================================================================
          STEP 3: PAYMENT & KHATA (UDHAAR)
          ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              3
            </span>
            <h3 className="font-extrabold text-sm text-slate-900">
              Payment & Udhaar (Khata)
            </h3>
          </div>
          {pendingUdhaar.hasPending && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-300">
              Includes Udhaar
            </span>
          )}
        </div>

        {/* Quick-Tap Shortcut Buttons */}
        <div className={`grid gap-2 ${pendingUdhaar.hasPending ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
          <button
            type="button"
            onClick={() => handlePresetSelect("full")}
            className={`py-2 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1 border transition-all cursor-pointer ${
              paymentPreset === "full"
                ? "bg-teal-800 text-white border-teal-800 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>Full Wasooli</span>
            <span className="text-[10px] font-bold text-teal-200">Rs. {grandTotal.toLocaleString()}</span>
          </button>

          {pendingUdhaar.hasPending && (
            <button
              type="button"
              onClick={() => handlePresetSelect("current")}
              className={`py-2 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                paymentPreset === "current"
                  ? "bg-blue-700 text-white border-blue-700 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>Today Bill Only</span>
              <span className="text-[10px] font-bold text-blue-200">Rs. {totalBill.toLocaleString()}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handlePresetSelect("credit")}
            className={`py-2 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1 border transition-all cursor-pointer ${
              paymentPreset === "credit"
                ? "bg-red-700 text-white border-red-700 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>Full Udhaar</span>
            <span className="text-[10px] font-bold text-red-200">Rs. 0 Paid</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect("custom")}
            className={`py-2 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1 border transition-all cursor-pointer ${
              paymentPreset === "custom"
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>Partial Pay</span>
            <span className="text-[10px] font-bold text-slate-600">Custom Amount</span>
          </button>
        </div>

        {/* Custom Payment Amount Input (visible when Partial Pay is selected) */}
        {paymentPreset === "custom" && (
          <div className="space-y-1.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">
                Enter Cash Amount Received (Rs)
              </label>
              <span className="text-[10px] text-slate-500">Max: Rs. {grandTotal.toLocaleString()}</span>
            </div>
            <input
              type="number"
              min="0"
              max={grandTotal}
              placeholder="0"
              value={form.paidAmount}
              onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
              onBlur={(e) => { if (e.target.value === "") setForm((p) => ({ ...p, paidAmount: "0" })); }}
              className="w-full text-sm font-black text-slate-900 bg-white border border-amber-400 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}

        {/* Live Balance / Udhaar Status Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block font-semibold">
              Remaining Udhaar (Baqaya):
            </span>
            <strong
              className={`text-base font-black ${
                remainingBalance > 0 ? "text-red-600" : "text-emerald-700"
              }`}
            >
              Rs. {remainingBalance.toLocaleString()}
            </strong>
          </div>

          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full ${
              remainingBalance <= 0
                ? "bg-emerald-100 text-emerald-800"
                : paid === 0
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {remainingBalance <= 0 ? "✓ Full Paid" : paid === 0 ? "⚠️ Full Udhaar" : "Partial Paid"}
          </span>
        </div>
      </div>

      {/* =========================================================================
          BIG SUBMIT BUTTON
          ========================================================================= */}
      <button
        type="submit"
        disabled={isSubmitting || isUploading}
        className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-base shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
            <span>Saving Sale & Generating Receipt...</span>
          </>
        ) : (
          <>
            <Receipt className="w-5 h-5 text-slate-950" />
            <span>Save Sale & View Thermal Receipt</span>
          </>
        )}
      </button>

      {/* Salesman Add Customer Modal */}
      <SalesmanNewCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        activeSalesman={activeSalesman}
        prefill={customerModalPrefill}
        onCustomerAdded={(newCust) => {
          handleSelectCustomer(newCust);
        }}
      />
    </form>
  );
}
