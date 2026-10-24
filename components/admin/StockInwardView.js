"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { PlusCircle, Edit3, AlertTriangle, CheckCircle2, Package, Loader2 } from "lucide-react";

export default function StockInwardView({ onOpenAddStock, onEditStock }) {
  const { stockInwards, totalBrokenEggsPurchase, isStockLoading, EGGS_PER_PETI } = useApp();

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900">
              Warehouse Stock Inward Purchases
            </h2>
            {isStockLoading && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
                <span>Loading stock...</span>
              </span>
            )}
            {totalBrokenEggsPurchase > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{totalBrokenEggsPurchase} Total Broken Eggs Deducted</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming egg petis from poultry farms with breakage deductions and editable records
          </p>
        </div>

        <button
          onClick={onOpenAddStock}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#044E45] text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-[#033c35] transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Stock Inward</span>
        </button>
      </div>

      {/* Stock Table with Broken Eggs & Edit Action */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/80 tracking-wider">
              <th className="py-3.5 px-4">Batch ID</th>
              <th className="py-3.5 px-4">Supplier / Farm</th>
              <th className="py-3.5 px-4">Petis (Boxes)</th>
              <th className="py-3.5 px-4">Toote Anday (Broken)</th>
              <th className="py-3.5 px-4">Net Usable Eggs</th>
              <th className="py-3.5 px-4">Rate / Peti</th>
              <th className="py-3.5 px-4">Net Total Cost</th>
              <th className="py-3.5 px-4">Vehicle #</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isStockLoading && stockInwards.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-teal-700" />
                    <p className="font-semibold text-sm text-slate-700">Loading stock purchases from database...</p>
                  </div>
                </td>
              </tr>
            ) : stockInwards.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-sm text-slate-600">No stock purchases recorded yet</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Click the "+ Add Stock Inward" button above to record your first farm delivery batch.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              stockInwards.map((stock) => {
              const grossEggs = stock.grossEggs || Number(stock.petis) * EGGS_PER_PETI;
              const broken = Number(stock.brokenEggs) || 0;
              const netEggs = stock.netEggs || grossEggs - broken;

              return (
                <tr key={stock.id} className="hover:bg-amber-50/30 transition-colors group">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                    {stock.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{stock.supplier}</span>
                    <span className="text-[11px] text-slate-500">{stock.phone}</span>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    {stock.petis} Petis
                    <span className="text-[10px] text-slate-400 block font-normal">
                      ({grossEggs.toLocaleString()} gross)
                    </span>
                  </td>

                  {/* TOOTE ANDAY (BROKEN EGGS) */}
                  <td className="py-3.5 px-4">
                    {broken > 0 ? (
                      <div>
                        <span className="text-red-600 font-black flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span>{broken} Eggs Broken</span>
                        </span>
                        {stock.brokenDeduction > 0 && (
                          <span className="text-[10px] text-red-500 font-medium block">
                            - Rs. {Number(stock.brokenDeduction).toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        0 Damaged
                      </span>
                    )}
                  </td>

                  {/* NET USABLE EGGS */}
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-teal-800 block">
                      {Number(netEggs).toLocaleString()} Eggs
                    </span>
                    <span className="text-[10px] text-slate-400 block">{stock.grade}</span>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    Rs. {Number(stock.ratePerPeti).toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 font-black text-slate-900">
                    Rs. {Number(stock.totalCost).toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                    {stock.vehicleNo}
                  </td>

                  {/* EDIT ACTION BUTTON */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onEditStock && onEditStock(stock)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors shadow-xs"
                      title="Edit this purchase record"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
