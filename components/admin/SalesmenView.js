"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import NewCustomerModal from "./NewCustomerModal";
import CustomerLedgerModal from "./CustomerLedgerModal";
import {
  UserPlus,
  Phone,
  Key,
  ShieldCheck,
  FileText,
  User,
  Loader2,
  Store,
  MapPin,
  Search,
  DollarSign,
  AlertTriangle,
  Edit2,
  Trash2,
  MessageCircle,
  Truck,
  CheckCircle2,
  History,
  Layers
} from "lucide-react";

export default function SalesmenView({ onOpenAddSalesman, onSelectReport }) {
  const {
    salesmen,
    isSalesmenLoading,
    customers,
    isCustomersLoading,
    deleteCustomer,
    fetchCustomers,
  } = useApp();

  // Sub-tab: 'salesmen' | 'customers'
  const [subTab, setSubTab] = useState("salesmen");

  // Customer search & filter state
  const [customerSearch, setCustomerSearch] = useState("");
  const [salesmanFilter, setSalesmanFilter] = useState("all");

  // Customer modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // Customer Ledger (Hisab Kitab) Modal state
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return (customers || []).filter((c) => {
      const q = customerSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (c.shopName && c.shopName.toLowerCase().includes(q)) ||
        (c.shopkeeperName && c.shopkeeperName.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.area && c.area.toLowerCase().includes(q));

      const matchesSalesman =
        salesmanFilter === "all" ||
        c.salesmanId === salesmanFilter ||
        c.salesmanName === salesmanFilter;

      return matchesSearch && matchesSalesman;
    });
  }, [customers, customerSearch, salesmanFilter]);

  // Customer KPIs
  const totalMarketUdhaar = useMemo(() => {
    return (customers || []).reduce((sum, c) => sum + (Number(c.pendingUdhaar) || 0), 0);
  }, [customers]);

  const customersWithUdhaarCount = useMemo(() => {
    return (customers || []).filter((c) => Number(c.pendingUdhaar) > 0).length;
  }, [customers]);

  const handleOpenAddCustomer = () => {
    setCustomerToEdit(null);
    setIsCustomerModalOpen(true);
  };

  const handleEditCustomer = (cust) => {
    setCustomerToEdit(cust);
    setIsCustomerModalOpen(true);
  };

  const handleDeleteCustomer = async (cust) => {
    if (
      !confirm(
        `Are you sure you want to remove customer "${cust.shopName}" (${cust.phone})?`
      )
    ) {
      return;
    }

    setIsDeletingId(cust.id || cust._id);
    try {
      await deleteCustomer(cust.id || cust._id);
      await fetchCustomers();
    } catch (e) {
      alert("Error deleting customer: " + e.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  const getWhatsAppLink = (cust) => {
    const raw = (cust.phone || "").replace(/[^0-9]/g, "");
    let phoneNum = raw;
    if (phoneNum.startsWith("0")) {
      phoneNum = "92" + phoneNum.slice(1);
    }
    const balance = Number(cust.pendingUdhaar) || 0;
    const text = encodeURIComponent(
      `*── AndaGodam Warehouse: Customer Balance Notice ──*\nDear ${cust.shopkeeperName || "Customer"},\nThis is a notification regarding your shop *${cust.shopName}*.\nYour current outstanding balance is *Rs. ${balance.toLocaleString()}*.\nThank you!\n*AndaGodam Egg Wholesale Management*`
    );
    return `https://wa.me/${phoneNum}?text=${text}`;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
      {/* Top Header with Switcher Tabs & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900">
              Salesmen & Direct Customers Directory
            </h2>
            {(isSalesmenLoading || isCustomersLoading) && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Loading directory...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage delivery drivers, direct customer shop profiles, and market udhaar records
          </p>
        </div>

        {/* View Switcher Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
            <button
              onClick={() => setSubTab("salesmen")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === "salesmen"
                  ? "bg-white text-slate-950 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-teal-700" />
              <span>Salesmen ({salesmen.length})</span>
            </button>
            <button
              onClick={() => setSubTab("customers")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === "customers"
                  ? "bg-amber-400 text-slate-950 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store className="w-3.5 h-3.5 text-slate-950" />
              <span>Direct Customers ({(customers || []).length})</span>
            </button>
          </div>

          {/* Action Buttons */}
          {subTab === "salesmen" ? (
            <button
              onClick={onOpenAddSalesman}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-xs hover:bg-amber-500 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Create New Salesman</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddCustomer}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#044E45] text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-[#033c35] transition-colors cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>+ Add Direct Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB 1: SALESMEN DIRECTORY
          ========================================================================= */}
      {subTab === "salesmen" && (
        <>
          {isSalesmenLoading && salesmen.length === 0 ? (
            <div className="p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="font-semibold text-sm text-slate-700">
                Loading salesmen directory from database...
              </p>
            </div>
          ) : salesmen.length === 0 ? (
            <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
              <p className="text-sm font-bold text-slate-700">No salesmen created yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "+ Create New Salesman" above to add your first delivery driver or field salesman.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salesmen.map((sm) => (
                <div
                  key={sm.id || sm._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 font-extrabold text-base flex items-center justify-center">
                          <User className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900">{sm.name}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sm.phone}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/50">
                        {sm.status}
                      </span>
                    </div>

                    {/* Credentials & Details Box */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Delivery Route:</span>
                        <span className="font-bold text-slate-800">{sm.route}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vehicle / Loader:</span>
                        <span className="font-medium text-slate-700">{sm.vehicle}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Key className="w-3 h-3 text-amber-600" /> App Username:
                        </span>
                        <span className="font-mono font-bold text-amber-800">{sm.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-slate-400" /> Password:
                        </span>
                        <span className="font-mono text-slate-700">{sm.password}</span>
                      </div>
                    </div>

                    {/* Daily Target Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-600">Daily Target: {sm.dailyTargetPetis} Petis</span>
                        <span className="text-teal-800 font-bold">
                          Delivered: {sm.todaySoldPetis} Petis (
                          {Number(sm.todaySoldEggs).toLocaleString()} Eggs)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((sm.todaySoldPetis / sm.dailyTargetPetis) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onSelectReport(sm.id || sm._id)}
                      className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Sales Report & Khata</span>
                    </button>

                    <a
                      href={`tel:${sm.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Call Salesman</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          SUB-TAB 2: DIRECT CUSTOMERS DIRECTORY
          ========================================================================= */}
      {subTab === "customers" && (
        <div className="space-y-5">
          {/* Summary KPI Cards for Customers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Total Direct Shops
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                  {(customers || []).length}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-800 flex items-center justify-center font-bold">
                <Store className="w-5 h-5 text-amber-700" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-red-800 uppercase tracking-wider">
                  Total Market Udhaar (Baqaya)
                </p>
                <h3 className="text-2xl font-black text-red-600 mt-0.5">
                  Rs. {totalMarketUdhaar.toLocaleString()}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                  Shops with Pending Udhaar
                </p>
                <h3 className="text-2xl font-black text-teal-900 mt-0.5">
                  {customersWithUdhaarCount} Shops
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 text-teal-700" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by shop name, customer name, phone number, or area..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {customerSearch && (
                <button
                  onClick={() => setCustomerSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2">
              <select
                value={salesmanFilter}
                onChange={(e) => setSalesmanFilter(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-auto"
              >
                <option value="all">All Delivery Routes / Salesmen</option>
                {salesmen.map((sm) => (
                  <option key={sm.id || sm._id} value={sm.id || sm._id}>
                    Route: {sm.name} ({sm.route})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Cards Grid */}
          {isCustomersLoading && (!customers || customers.length === 0) ? (
            <div className="p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="font-semibold text-sm text-slate-700">Loading customers directory...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
              <Store className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {customerSearch ? "No matching customers found." : "No direct customers registered yet."}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {customerSearch
                    ? "Try clearing your search query or route filter."
                    : "Add direct customers so they are auto-suggested on the salesman billing page."}
                </p>
              </div>
              <button
                onClick={handleOpenAddCustomer}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Store className="w-3.5 h-3.5" />
                <span>+ Register First Customer</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((cust) => {
                const hasUdhaar = Number(cust.pendingUdhaar) > 0;
                return (
                  <div
                    key={cust.id || cust._id}
                    onClick={() => {
                      setSelectedLedgerCustomer(cust);
                      setIsLedgerModalOpen(true);
                    }}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between shadow-2xs group cursor-pointer"
                  >
                    <div>
                      {/* Shop Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Store className="w-5 h-5 text-amber-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                                {cust.shopName}
                              </h3>
                              <span className="text-[10px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                ➔ View Ledger
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{cust.shopkeeperName || "Customer"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Balance Status Badge */}
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            hasUdhaar
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {hasUdhaar ? "⚠️ Pending" : "✓ Settled"}
                        </span>
                      </div>

                      {/* Details Box */}
                      <div className="mt-3.5 p-2.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> Phone:
                          </span>
                          <span className="font-mono font-bold text-slate-800">{cust.phone}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> Area:
                          </span>
                          <span className="font-medium text-slate-700 truncate max-w-[150px]">
                            {cust.area || "Market Route"}
                          </span>
                        </div>

                        {cust.salesmanName && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Truck className="w-3 h-3 text-slate-400" /> Route:
                            </span>
                            <span className="font-bold text-teal-800">{cust.salesmanName}</span>
                          </div>
                        )}

                        {cust.openingBalance > 0 && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                            <span className="text-slate-500">Opening Balance:</span>
                            <span className="font-semibold text-slate-700">
                              Rs. {Number(cust.openingBalance).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Outstanding Khata Balance Card */}
                      <div
                        className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between ${
                          hasUdhaar
                            ? "bg-red-50/50 border-red-200"
                            : "bg-emerald-50/40 border-emerald-200"
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Current Pending Balance
                          </span>
                          <span
                            className={`text-base font-black ${
                              hasUdhaar ? "text-red-600" : "text-emerald-700"
                            }`}
                          >
                            Rs. {Number(cust.pendingUdhaar || 0).toLocaleString()}
                          </span>
                        </div>

                        {cust.pendingOrdersCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-100 text-red-800">
                            {cust.pendingOrdersCount} Unpaid
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer Action Footer */}
                    <div
                      className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setSelectedLedgerCustomer(cust);
                          setIsLedgerModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-extrabold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-amber-200"
                        title="View Complete Customer History & Ledger"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-700" />
                        <span>Customer Ledger</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditCustomer(cust)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(cust)}
                          disabled={isDeletingId === (cust.id || cust._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Customer"
                        >
                          {isDeletingId === (cust.id || cust._id) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={getWhatsAppLink(cust)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          title="WhatsApp Reminder"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Customer Create & Edit Modal */}
      <NewCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customerToEdit={customerToEdit}
      />

      {/* Customer Hisab Kitab Ledger Modal */}
      <CustomerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => {
          setIsLedgerModalOpen(false);
          setSelectedLedgerCustomer(null);
        }}
        customer={selectedLedgerCustomer}
      />
    </div>
  );
}
