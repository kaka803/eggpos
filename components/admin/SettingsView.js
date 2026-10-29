"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Settings,
  Building2,
  Lock,
  User,
  Phone,
  MapPin,
  Package,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";

export default function SettingsView() {
  const { currentUser, login, setSettings, fetchSettings: refreshGlobalSettings } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("godam"); // 'godam' | 'password' | 'profile'
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // Godam Details
  const [godamForm, setGodamForm] = useState({
    godamName: "",
    godamAddress: "",
    godamPhone: "",
    godamCity: "",
    eggsPetiSize: "360",
  });

  // Admin Profile
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });

  // Password Change
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          const s = data.settings;
          setGodamForm({
            godamName: s.godamName || "",
            godamAddress: s.godamAddress || "",
            godamPhone: s.godamPhone || "",
            godamCity: s.godamCity || "",
            eggsPetiSize: String(s.eggsPetiSize || 360),
          });
          setProfileForm({
            name: s.name || "",
            phone: s.phone || "",
          });
        }
      }
    } catch (e) {
      console.error("fetchSettings error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const saveGodamSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          godamName: godamForm.godamName,
          godamAddress: godamForm.godamAddress,
          godamPhone: godamForm.godamPhone,
          godamCity: godamForm.godamCity,
          eggsPetiSize: Number(godamForm.eggsPetiSize) || 360,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Godam details updated successfully!");
        const updated = {
          godamName: godamForm.godamName,
          godamAddress: godamForm.godamAddress,
          godamPhone: godamForm.godamPhone,
          godamCity: godamForm.godamCity,
          eggsPetiSize: Number(godamForm.eggsPetiSize) || 360,
        };
        if (setSettings) setSettings(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem("andagodam_settings", JSON.stringify(updated));
        }
        if (refreshGlobalSettings) refreshGlobalSettings();
      } else {
        showToast("error", data.error || "Failed to update godam details");
      }
    } catch (err) {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast("error", "Name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Update session name
        if (currentUser) {
          const updated = { ...currentUser, name: profileForm.name };
          localStorage.setItem("andagodam_user", JSON.stringify(updated));
          login(updated.role, updated);
        }
        showToast("success", "Profile updated successfully!");
      } else {
        showToast("error", data.error || "Failed to update profile");
      }
    } catch (err) {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast("error", "New passwords do not match.");
      return;
    }
    if (pwForm.newPassword.length < 4) {
      showToast("error", "New password must be at least 4 characters.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Password changed successfully!");
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showToast("error", data.error || "Failed to change password");
      }
    } catch (err) {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: "godam", label: "Godam Details", icon: Building2 },
    { id: "profile", label: "Admin Profile", icon: User },
    { id: "password", label: "Change Password", icon: Lock },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
        <p className="text-sm font-semibold text-slate-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-200">
          <Settings className="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">System Settings</h2>
          <p className="text-xs text-slate-500">Manage godam info, admin profile & security</p>
        </div>
        <button
          onClick={fetchSettings}
          className="ml-auto p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
          title="Refresh settings"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold border animate-in slide-in-from-top duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========== SECTION 1: GODAM DETAILS ========== */}
      {activeSection === "godam" && (
        <form onSubmit={saveGodamSettings} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-teal-700" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Godam / Warehouse Details</h3>
                <p className="text-[11px] text-slate-500">Shown on receipts, invoices, and reports</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Godam Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Godam / Warehouse Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AL-BARKAT EGG WHOLESALE WAREHOUSE"
                value={godamForm.godamName}
                onChange={(e) => setGodamForm({ ...godamForm, godamName: e.target.value })}
                className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            {/* City & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" /> City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lahore, Karachi"
                  value={godamForm.godamCity}
                  onChange={(e) => setGodamForm({ ...godamForm, godamCity: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" /> Godam Contact Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0300-1234567"
                  value={godamForm.godamPhone}
                  onChange={(e) => setGodamForm({ ...godamForm, godamPhone: e.target.value })}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Godam Address (Pata)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Shop # 5, Egg Market, Main Bazar, Lahore"
                value={godamForm.godamAddress}
                onChange={(e) => setGodamForm({ ...godamForm, godamAddress: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white resize-none"
              />
            </div>

            {/* Peti Size */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                Eggs per Peti (1 Peti = ? Andey)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                placeholder="360"
                value={godamForm.eggsPetiSize}
                onChange={(e) => setGodamForm({ ...godamForm, eggsPetiSize: e.target.value })}
                onBlur={(e) => { if (!e.target.value) setGodamForm((p) => ({ ...p, eggsPetiSize: "360" })); }}
                className="w-32 text-sm font-extrabold bg-white border border-amber-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900"
              />
              <p className="text-[11px] text-amber-700 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Currently system-wide default is 360. Changing this affects all calculations.
              </p>
            </div>
          </div>

          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#044E45] hover:bg-[#033c35] text-white font-bold text-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Godam Details
            </button>
          </div>
        </form>
      )}

      {/* ========== SECTION 2: ADMIN PROFILE ========== */}
      {activeSection === "profile" && (
        <form onSubmit={saveProfile} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
                <User className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Admin Profile</h3>
                <p className="text-[11px] text-slate-500">Update your display name and contact info</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Username - Read Only */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Username (Login ID) — Cannot be changed
              </label>
              <div className="w-full text-sm font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 cursor-not-allowed">
                {currentUser?.username || "admin"}
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Admin Display Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Muhammad Ali"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:bg-white"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Phone / WhatsApp Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 0300-1234567"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:bg-white"
              />
            </div>
          </div>

          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Profile
            </button>
          </div>
        </form>
      )}

      {/* ========== SECTION 3: CHANGE PASSWORD ========== */}
      {activeSection === "password" && (
        <form onSubmit={changePassword} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <Lock className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Change Admin Password</h3>
                <p className="text-[11px] text-slate-500">Must enter current password to confirm changes</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Current Password */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showPw.current ? "text" : "password"}
                  required
                  placeholder="Your current password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => ({ ...p, current: !p.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPw.new ? "text" : "password"}
                  required
                  minLength={4}
                  placeholder="Min. 4 characters"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => ({ ...p, new: !p.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showPw.confirm ? "text" : "password"}
                  required
                  placeholder="Repeat new password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className={`w-full text-sm font-semibold bg-slate-50 border rounded-xl px-4 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:bg-white ${
                    pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
                      ? "border-red-400 focus:ring-red-400"
                      : "border-slate-300 focus:ring-red-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
            </div>

            {/* Strength indicator */}
            {pwForm.newPassword && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        pwForm.newPassword.length >= level * 2
                          ? level <= 1
                            ? "bg-red-400"
                            : level <= 2
                            ? "bg-amber-400"
                            : level <= 3
                            ? "bg-teal-400"
                            : "bg-emerald-500"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {pwForm.newPassword.length < 4
                    ? "Too short"
                    : pwForm.newPassword.length < 6
                    ? "Weak — use longer password"
                    : pwForm.newPassword.length < 8
                    ? "Medium strength"
                    : "Strong password ✓"}
                </p>
              </div>
            )}
          </div>

          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            <button
              type="submit"
              disabled={isSaving || (pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Change Password
            </button>
          </div>
        </form>
      )}

      {/* App Info Footer */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
        <span className="text-2xl">🥚</span>
        <div>
          <p className="font-bold text-slate-700">AndaGodam POS</p>
          <p>Wholesale Egg Management System — Built for field-ready operations</p>
        </div>
        <span className="ml-auto text-[10px] font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">v2.0</span>
      </div>
    </div>
  );
}
