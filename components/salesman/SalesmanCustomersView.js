"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import SalesmanNewCustomerModal from "./SalesmanNewCustomerModal";
import {
  Store,
  User,
  Phone,
  MapPin,
  Search,
  Plus,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Loader2,
  DollarSign
} from "lucide-react";

export default function SalesmanCustomersView({ activeSalesman, onSelectForBilling }) {
  const { customers, isCustomersLoading, fetchCustomers } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'udhaar' | 'clear'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter customers for this salesman (or all if not strictly assigned)
  const myCustomers = useMemo(() => {
    if (!customers || customers.length === 0) return [];
    const sId = activeSalesman?.id || activeSalesman?._id;
    const sName = activeSalesman?.name;

    return customers.filter((c) => {
      // If customer has salesmanId/name, check match; otherwise include so salesman can see available route shops
      if (c.salesmanId || c.salesmanName) {
        return (
          (sId && (c.salesmanId === sId || String(c.salesmanId) === String(sId))) ||
          (sName && c.salesmanName === sName)
        );
      }
      return true; // Available unassigned route shop
    });
  }, [customers, activeSalesman]);

  // Filter by search query and udhaar filter mode
  const filteredCustomers = useMemo(() => {
    let list = myCustomers;

    if (filterMode === "udhaar") {
      list = list.filter((c) => Number(c.pendingUdhaar) > 0);
    } else if (filterMode === "clear") {
      list = list.filter((c) => Number(c.pendingUdhaar) <= 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cleanDigits = q.replace(/[^0-9]/g, "");

      list = list.filter((c) => {
        const matchShop = c.shopName && c.shopName.toLowerCase().includes(q);
        const matchKeeper = c.shopkeeperName && c.shopkeeperName.toLowerCase().includes(q);
        const matchArea = c.area && c.area.toLowerCase().includes(q);
        const matchPhone =
          (cleanDigits.length >= 2 &&
            c.phone &&
            c.phone.replace(/[^0-9]/g, "").includes(cleanDigits)) ||
          (c.phone && c.phone.toLowerCase().includes(q));
        return matchShop || matchKeeper || matchArea || matchPhone;
      });
    }

    return list;
  }, [myCustomers, filterMode, searchQuery]);

  const totalUdhaarAcrossMyCustomers = useMemo(() => {
    return myCustomers.reduce((sum, c) => sum + (Number(c.pendingUdhaar) || 0), 0);
  }, [myCustomers]);

  return (
    <div className="space-y-3.5">
      {/* Top Banner / Summary Strip */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-teal-800" />
              <span>Dukan Khata & Customers</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {myCustomers.length} Total Customers on Route
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Naya Customer</span>
          </button>
        </div>

        {/* Quick Udhaar Summary Strip */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase">
              Total Route Udhaar
            </span>
            <strong className="text-red-600 font-black text-sm">
              Rs. {totalUdhaarAcrossMyCustomers.toLocaleString()}
            </strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">
              Udhaar Dukanein
            </span>
            <strong className="text-slate-800 font-black text-sm">
              {myCustomers.filter((c) => Number(c.pendingUdhaar) > 0).length} Shops
            </strong>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Dukan, Phone ya Area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterMode === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({myCustomers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("udhaar")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterMode === "udhaar"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60"
            }`}
          >
            With Udhaar ({myCustomers.filter((c) => Number(c.pendingUdhaar) > 0).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("clear")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterMode === "clear"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
            }`}
          >
            Clear ({myCustomers.filter((c) => Number(c.pendingUdhaar) <= 0).length})
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-2.5">
        {isCustomersLoading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-800 mb-2" />
            <p className="text-xs text-slate-500 font-medium">Customers load ho rahe hain...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Koi Customer Nahi Mila</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {searchQuery
                  ? "Aap ki search query se match hone wala customer nahi mila."
                  : "Abhi koi customer add nahi hua."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Naya Customer Add Karein</span>
            </button>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const hasUdhaar = Number(cust.pendingUdhaar) > 0;
            const cleanPhone = (cust.phone || "").replace(/[^0-9]/g, "");

            return (
              <div
                key={cust.id || cust._id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5 hover:border-amber-400 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">
                      {cust.shopName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700">
                        {cust.shopkeeperName || "Customer"}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-700 font-bold">{cust.phone}</span>
                    </div>
                    {cust.area && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{cust.area}</span>
                      </p>
                    )}
                  </div>

                  {/* Udhaar Status Pill */}
                  <div className="text-right shrink-0">
                    {hasUdhaar ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-black">
                        ⚠️ Rs. {Number(cust.pendingUdhaar).toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Clear</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {cleanPhone && (
                      <>
                        <a
                          href={`tel:${cleanPhone}`}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                          title="Call Customer"
                        >
                          <Phone className="w-3 h-3 text-teal-700" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                          title="WhatsApp Chat"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </>
                    )}
                  </div>

                  {/* Bill Now / Select for New Sale */}
                  {onSelectForBilling && (
                    <button
                      type="button"
                      onClick={() => onSelectForBilling(cust)}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[11px] inline-flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Nayi Sale / Bill</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Customer Modal */}
      <SalesmanNewCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        activeSalesman={activeSalesman}
        onCustomerAdded={(newCust) => {
          if (onSelectForBilling) {
            onSelectForBilling(newCust);
          }
        }}
      />
    </div>
  );
}
