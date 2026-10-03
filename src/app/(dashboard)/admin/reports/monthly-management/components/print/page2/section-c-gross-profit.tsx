"use client"

import React from "react"
import { MonthlyManagementReportResult } from "../../../types"

interface SectionCGrossProfitProps {
    data: MonthlyManagementReportResult
}

function formatRp(val: number): string {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}

export function SectionCGrossProfit({ data }: SectionCGrossProfitProps) {
    const sc = data.scorecard || ({} as any)

    const vol = sc.productionVolumeM3 || 0
    const totalDpp = sc.totalDppRevenue || sc.totalGrossRevenue || 0
    const totalCost = sc.totalDirectCost || 0
    const grossProfit = sc.grossProfit || 0
    const grossMargin = sc.grossMarginPercent || 0

    return (
        <div className="border border-sky-200 bg-sky-50/60 rounded p-2.5 print-avoid-break">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[8.5px] font-bold text-sky-900 uppercase tracking-wider block">
                        C. Profit Bridge — Laba Kotor Operasional
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xs text-slate-600">Revenue DPP: <strong className="text-slate-800">{formatRp(totalDpp)}</strong></span>
                        <span className="text-xs text-slate-400">−</span>
                        <span className="text-xs text-slate-600">Direct Cost: <strong className="text-slate-800">{formatRp(totalCost)}</strong></span>
                        <span className="text-xs text-slate-400">=</span>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-[9px] font-bold text-sky-800 uppercase block">GROSS PROFIT</span>
                    <div className="text-lg font-black text-sky-950 tracking-tight">
                        {formatRp(grossProfit)}
                    </div>
                    <div className="flex items-center justify-end gap-2 text-[9px] mt-0.5">
                        <span className="font-extrabold text-sky-900 bg-sky-200/70 px-1.5 py-0.5 rounded">
                            Gross Margin {grossMargin.toFixed(2)}%
                        </span>
                        <span className="text-slate-600 font-medium font-mono">
                            Unit GP: {formatRp(vol > 0 ? grossProfit / vol : 0)} / m³
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
