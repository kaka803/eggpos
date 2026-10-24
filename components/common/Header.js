"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { LogOut, User } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout, EGGS_PER_PETI } = useApp();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isAdmin = pathname.startsWith("/admin");
  const isSalesman = pathname.startsWith("/salesman");

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-8 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <Link href={isAdmin ? "/admin" : isSalesman ? "/salesman" : "/"} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <span className="text-xl">🥚</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                AndaGodam <span className="text-amber-500">POS</span>
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                {isAdmin ? "Admin Portal" : isSalesman ? "Salesman App" : "Wholesale"}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              1 Peti = <strong className="text-slate-700">{EGGS_PER_PETI} Eggs</strong> Wholesale Standard
            </p>
          </div>
        </Link>


        {/* User Info & Logout Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4 text-amber-400" />
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-semibold text-slate-900 leading-tight">
                {currentUser?.name || "User"}
              </p>
              <p className="text-[10px] text-slate-500">
                {currentUser?.role === "admin" ? "Warehouse Manager" : currentUser?.route || "Sales Staff"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
