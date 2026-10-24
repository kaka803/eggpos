"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { UserPlus, Phone, Key, ShieldCheck, FileText, User, Loader2 } from "lucide-react";

export default function SalesmenView({ onOpenAddSalesman, onSelectReport }) {
  const { salesmen, isSalesmenLoading, setCurrentUser } = useApp();

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900">
              Salesmen & Field Drivers Directory
            </h2>
            {isSalesmenLoading && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Loading salesmen...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Manage route assignments, login credentials, and daily delivery targets
          </p>
        </div>
        <button
          onClick={onOpenAddSalesman}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-xs hover:bg-amber-500 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Create New Salesman</span>
        </button>
      </div>

      {isSalesmenLoading && salesmen.length === 0 ? (
        <div className="p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
          <p className="font-semibold text-sm text-slate-700">Loading salesmen directory from database...</p>
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
            key={sm.id}
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
                    Delivered: {sm.todaySoldPetis} Petis ({Number(sm.todaySoldEggs).toLocaleString()} Eggs)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((sm.todaySoldPetis / sm.dailyTargetPetis) * 100))}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onSelectReport(sm.id)}
                className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200"
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
    </div>
  );
}
