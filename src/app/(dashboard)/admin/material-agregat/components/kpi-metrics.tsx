"use client"

import React from "react"
import { PackagePlus, PackageMinus, Layers, Calculator } from "lucide-react"
import { AggregateSummary, AggregateOutSummary } from "../types"

interface KpiMetricsProps {
    summary: AggregateSummary
    summaryOut: AggregateOutSummary
}

export function KpiMetrics({ summary, summaryOut }: KpiMetricsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* 1. Total Masuk */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Masuk</span>
                    <div className="p-1 rounded-md bg-blue-50 text-blue-600">
                        <PackagePlus className="w-3.5 h-3.5" />
                    </div>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black font-mono text-slate-900 leading-tight">
                        +{summary.totalVol.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">m³</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {summary.totalRit} Rit {summary.totalMaterialExpense > 0 ? `• Rp ${(summary.totalMaterialExpense / 1000000).toFixed(1)}Jt` : ""} ({summary.internalVol.toFixed(0)}m³ Quarry / {summary.externalVol.toFixed(0)}m³ Vendor)
                </div>
            </div>

            {/* 2. Total Keluar */}
            <div className="border border-rose-200/80 rounded-xl p-3 shadow-2xs hover:border-rose-300 transition-colors bg-rose-50/20">
                <div className="flex items-center justify-between text-rose-700 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Total Keluar</span>
                    <div className="p-1 rounded-md bg-rose-100 text-rose-700">
                        <PackageMinus className="w-3.5 h-3.5" />
                    </div>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black font-mono text-rose-700 leading-tight">
                        -{summaryOut.totalVol.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-[10px] text-rose-500 font-semibold">m³</span>
                </div>
                <div className="text-[10px] text-rose-700/80 mt-0.5 truncate font-medium">
                    {summaryOut.totalRit} Transaksi {summaryOut.totalSales > 0 ? `• Rp ${(summaryOut.totalSales >= 1000000000 ? (summaryOut.totalSales / 1000000000).toFixed(2) + " M" : (summaryOut.totalSales / 1000000).toFixed(1) + " Jt")}` : ""}
                </div>
            </div>

            {/* 3. Split 1/2 */}
            <div className="border border-amber-200/80 rounded-xl p-3 shadow-2xs hover:border-amber-300 transition-colors bg-amber-50/20">
                <div className="flex items-center justify-between text-amber-800 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Split 1/2</span>
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black font-mono text-amber-950 leading-tight">
                        {(summary.byType["SplitHalfOne"] || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold">m³</span>
                </div>
                <div className="text-[10px] text-amber-800/80 mt-0.5 truncate">
                    Keluar: {(summaryOut.byType["SplitHalfOne"] || 0).toFixed(1)} m³
                </div>
            </div>

            {/* 4. Split 2/3 */}
            <div className="border border-rose-200/80 rounded-xl p-3 shadow-2xs hover:border-rose-300 transition-colors bg-rose-50/20">
                <div className="flex items-center justify-between text-rose-800 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Split 2/3</span>
                    <Layers className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black font-mono text-rose-950 leading-tight">
                        {(summary.byType["SplitTwoThree"] || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-[10px] text-rose-700 font-semibold">m³</span>
                </div>
                <div className="text-[10px] text-rose-800/80 mt-0.5 truncate">
                    Keluar: {(summaryOut.byType["SplitTwoThree"] || 0).toFixed(1)} m³
                </div>
            </div>

            {/* 5. Pasir Cor */}
            <div className="border border-yellow-200/80 rounded-xl p-3 shadow-2xs hover:border-yellow-300 transition-colors bg-yellow-50/20">
                <div className="flex items-center justify-between text-yellow-800 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-800">Pasir Cor</span>
                    <Layers className="w-3.5 h-3.5 text-yellow-600" />
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black font-mono text-yellow-950 leading-tight">
                        {(summary.byType["Pasir"] || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-[10px] text-yellow-700 font-semibold">m³</span>
                </div>
                <div className="text-[10px] text-yellow-800/80 mt-0.5 truncate">
                    Keluar: {(summaryOut.byType["Pasir"] || 0).toFixed(1)} m³
                </div>
            </div>

            {/* 6. Retase Sopir DT */}
            <div className="border border-blue-200/80 rounded-xl p-3 shadow-2xs hover:border-blue-300 transition-colors bg-blue-50/30">
                <div className="flex items-center justify-between text-blue-800 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">Retase Sopir DT</span>
                    <Calculator className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-base font-black font-mono text-blue-900 leading-tight truncate">
                        Rp {(summary.totalRetase + summaryOut.totalRetase).toLocaleString("id-ID")}
                    </span>
                </div>
                <div className="text-[10px] text-blue-700/80 mt-0.5 truncate">
                    Quarry: Rp {summary.totalRetase.toLocaleString("id-ID")} • Keluar: Rp {summaryOut.totalRetase.toLocaleString("id-ID")}
                </div>
            </div>
        </div>
    )
}
