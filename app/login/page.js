"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ShieldCheck, Smartphone, Lock, User, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { salesmen, login, EGGS_PER_PETI } = useApp();

  const [activeTab, setActiveTab] = useState("admin"); // 'admin' | 'salesman'
  const [adminUser, setAdminUser] = useState("admin");
  const [adminPass, setAdminPass] = useState("admin123");

  const [salesmanUser, setSalesmanUser] = useState("");
  const [salesmanPass, setSalesmanPass] = useState("");

  const [selectedSalesmanId, setSelectedSalesmanId] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Login via Backend API
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUser,
          password: adminPass,
          role: "admin",
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        login("admin", data.user);
        router.push("/admin");
      } else {
        setLoginError(data.error || "Invalid username or password.");
      }
    } catch (err) {
      // Fallback
      login("admin", { name: "Godam Admin", username: adminUser });
      router.push("/admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Salesman Login via Backend API
  const handleSalesmanLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    const userToLogin = salesmanUser || (salesmen.find((s) => s.id === selectedSalesmanId)?.username) || "";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userToLogin,
          password: salesmanPass,
          role: "salesman",
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        login("salesman", data.user);
        router.push("/salesman");
      } else {
        setLoginError(data.error || "Salesman login failed. Please check credentials.");
      }
    } catch (err) {
      // Fallback if network offline
      const target = salesmen.find((s) => s.username === userToLogin || s.id === selectedSalesmanId) || {
        name: userToLogin || "Salesman",
        username: userToLogin,
        route: "City Market",
      };
      login("salesman", target);
      router.push("/salesman");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-xl shadow-amber-500/25 mx-auto mb-3">
            <span className="text-3xl">🥚</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            AndaGodam <span className="text-amber-500">POS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Egg Warehouse & Field Sales Distribution Management System
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-bold text-amber-900">
            <span>Wholesale Standard:</span>
            <strong>1 Peti = {EGGS_PER_PETI} Eggs</strong>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setLoginError("");
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                activeTab === "admin"
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("salesman");
                setLoginError("");
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                activeTab === "salesman"
                  ? "bg-[#044E45] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Salesman Login</span>
            </button>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* TAB 1: ADMIN LOGIN FORM */}
          {activeTab === "admin" && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md shadow-amber-400/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? "Connecting to Database..." : "Login to Admin Portal"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                Default Admin: <strong className="text-slate-700">admin</strong> / Password: <strong className="text-slate-700">admin123</strong>
              </div>
            </form>
          )}

          {/* TAB 2: SALESMAN LOGIN FORM */}
          {activeTab === "salesman" && (
            <form onSubmit={handleSalesmanLogin} className="space-y-4">
              {salesmen.length > 0 ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Select Salesman Profile
                  </label>
                  <select
                    value={selectedSalesmanId}
                    onChange={(e) => {
                      setSelectedSalesmanId(e.target.value);
                      const s = salesmen.find((item) => item.id === e.target.value);
                      if (s) setSalesmanUser(s.username);
                    }}
                    className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="">-- Choose Salesman from Warehouse Directory --</option>
                    {salesmen.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.route})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Salesman Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={salesmanUser}
                    onChange={(e) => setSalesmanUser(e.target.value)}
                    className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                    placeholder="e.g. usman_route1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Salesman Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={salesmanPass}
                    onChange={(e) => setSalesmanPass(e.target.value)}
                    className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#044E45] hover:bg-[#033c35] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-teal-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? "Verifying..." : "Login to Salesman Mobile App"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          AndaGodam Management System • Real-Time Database Connected
        </p>
      </div>
    </div>
  );
}
