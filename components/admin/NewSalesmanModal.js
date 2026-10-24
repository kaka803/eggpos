"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { X, Key, ShieldCheck } from "lucide-react";

export default function NewSalesmanModal({ isOpen, onClose }) {
  const { addSalesman, salesmen } = useApp();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    username: "",
    password: "",
    route: "",
    vehicle: "",
    dailyTargetPetis: 35
  });

  if (!isOpen) return null;

  const handleGenerateCredentials = (name) => {
    const cleanName = (name || "salesman").toLowerCase().replace(/[^a-z0-9]/g, "");
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const user = `${cleanName}_${randomDigits}`;
    const pass = `egg@${cleanName.slice(0, 4)}${randomDigits}`;
    setForm((prev) => ({ ...prev, username: user, password: pass }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    const initialCode = form.name.substring(0, 1).toUpperCase() + (salesmen.length + 1);
    const created = {
      id: `SM-${salesmen.length + 1}`,
      code: initialCode,
      name: form.name,
      phone: form.phone || "0300-0000000",
      username: form.username || `${form.name.toLowerCase()}_${salesmen.length + 1}`,
      password: form.password || "egg12345",
      route: form.route || "Local City Route",
      vehicle: form.vehicle || "Bike Loader",
      dailyTargetPetis: Number(form.dailyTargetPetis) || 30,
      todaySoldPetis: 0,
      todaySoldEggs: 0,
      cashCollected: 0,
      pendingUdhaar: 0,
      status: "On Route"
    };

    addSalesman(created);
    onClose();
    setForm({
      name: "",
      phone: "",
      username: "",
      password: "",
      route: "",
      vehicle: "",
      dailyTargetPetis: 35
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-amber-400 text-slate-950 p-5 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base">Create New Salesman</h3>
            <p className="text-xs text-slate-800">
              Generate login username, password & assign delivery route
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-500/50 hover:bg-amber-500 text-slate-950 flex items-center justify-center font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Salesman Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tariq Mehmood"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (!form.username) handleGenerateCredentials(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Phone *</label>
              <input
                type="tel"
                required
                placeholder="0301-2345678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Daily Peti Target</label>
              <input
                type="number"
                placeholder="35"
                value={form.dailyTargetPetis}
                onChange={(e) => setForm({ ...form, dailyTargetPetis: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Delivery Route / Area</label>
              <input
                type="text"
                placeholder="e.g. Saddar & Empress Market"
                value={form.route}
                onChange={(e) => setForm({ ...form, route: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Vehicle / Loader #</label>
              <input
                type="text"
                placeholder="Bike Loader # KH-123"
                value={form.vehicle}
                onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Credentials Box */}
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-xs flex items-center gap-1">
                <Key className="w-3.5 h-3.5" /> Mobile App Login Credentials
              </span>
              <button
                type="button"
                onClick={() => handleGenerateCredentials(form.name)}
                className="text-[11px] font-bold text-amber-800 hover:underline"
              >
                Auto Generate
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="tariq_sales"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block">
                  Password
                </label>
                <input
                  type="text"
                  required
                  placeholder="egg12345"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-400/20"
            >
              Save & Create Salesman
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
