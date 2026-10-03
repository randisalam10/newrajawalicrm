"use client"

import React from "react"
import { MonthlyManagementReportResult } from "../../../types"

interface SectionFControlMetricsProps {
    data: MonthlyManagementReportResult
}

function formatRp(val: number): string {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}

function formatDec(val: number, maxDec = 1): string {
    return (val || 0).toLocaleString("id-ID", { maximumFractionDigits: maxDec })
}

export function SectionFControlMetrics({ data }: SectionFControlMetricsProps) {
    const sc = data.scorecard || ({} as any)
    const drilldown = data.drilldown || ({} as any)
    const unitEco = data.unitEconomics || ({} as any)
    const targets = unitEco.targets || ({} as any)
    const cf = sc.cashflow || {}
    const billing = drilldown.billing || {}

    const vol = sc.productionVolumeM3 || 0
    const totalDpp = sc.totalDppRevenue || sc.totalGrossRevenue || 0
    const totalCost = sc.totalDirectCost || 0
    const grossMargin = sc.grossMarginPercent || 0
    const netMargin = sc.fieldContributionMarginPercent || 0

    const refVol = sc.productionTargetM3 || 500
    const refAsp = targets.asp || 2150000
    const refCogs = targets.cogs || 1650000
    const refGm = targets.grossProfit && targets.asp ? (targets.grossProfit / targets.asp) * 100 : 21.5
    const refNcm = 12.0

    const actAsp = vol > 0 ? totalDpp / vol : 0
    const actCogs = vol > 0 ? totalCost / vol : 0

    return (
        <div className="grid grid-cols-2 gap-2 text-[9px] print-avoid-break">
            {/* Control Table: Planned vs Actual vs Variance */}
            <div className="border border-slate-200 rounded bg-white overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-2.5 py-1.5 font-extrabold text-slate-900 uppercase tracking-wide text-[9px]">
                    F1. Control Metrics (Actual vs Target)
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50/70 border-b border-slate-100 font-semibold text-slate-600 text-[8px]">
                        <tr>
                            <th className="py-0.5 px-2">Metric</th>
                            <th className="py-0.5 px-2 text-right">Actual</th>
                            <th className="py-0.5 px-2 text-right">Reference</th>
                            <th className="py-0.5 px-2 text-right">Variance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr>
                            <td className="py-0.5 px-2 font-medium text-slate-800">Volume Produksi</td>
                            <td className="py-0.5 px-2 text-right font-mono font-bold text-slate-900">{formatDec(vol)} m³</td>
                            <td className="py-0.5 px-2 text-right font-mono text-slate-500">{formatDec(refVol)} m³</td>
                            <td className="py-0.5 px-2 text-right font-mono text-emerald-700 font-semibold">
                                {refVol > 0 ? `${(((vol - refVol) / refVol) * 100).toFixed(1)}%` : "-"}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-0.5 px-2 font-medium text-slate-800">Revenue / m³ (ASP)</td>
                            <td className="py-0.5 px-2 text-right font-mono font-bold text-slate-900">{formatRp(actAsp)}</td>
                            <td className="py-0.5 px-2 text-right font-mono text-slate-500">{formatRp(refAsp)}</td>
                            <td className="py-0.5 px-2 text-right font-mono text-slate-700 font-medium">
                                {refAsp > 0 ? `${(((actAsp - refAsp) / refAsp) * 100).toFixed(1)}%` : "-"}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-0.5 px-2 font-medium text-slate-800">Direct Cost / m³</td>
                            <td className="py-0.5 px-2 text-right font-mono font-bold text-slate-900">{formatRp(actCogs)}</td>
                            <td className="py-0.5 px-2 text-right font-mono text-slate-500">{formatRp(refCogs)}</td>
                            <td className="py-0.5 px-2 text-right font-mono text-slate-700 font-medium">
                                {refCogs > 0 ? `${(((actCogs - refCogs) / refCogs) * 100).toFixed(1)}%` : "-"}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-0.5 px-2 font-medium text-slate-800">Gross Margin</td>
                            <td className="py-0.5 px-2 text-right font-mono font-bold text-slate-900">{grossMargin.toFixed(2)}%</td>
                            <td className="py-0.5 px-2 text-right font-mono text-slate-500">{refGm.toFixed(2)}%</td>
                            <td className="py-0.5 px-2 text-right font-mono text-emerald-700 font-semibold">
                                +{(grossMargin - refGm).toFixed(2)} pp
                            </td>
                        </tr>
                        <tr>
                            <td className="py-0.5 px-2 font-medium text-slate-800">Contribution Margin</td>
                            <td className="py-0.5 px-2 text-right font-mono font-bold text-slate-900">{netMargin.toFixed(2)}%</td>
                            <td className="py-0.5 px-2 text-right font-mono text-slate-500">{refNcm.toFixed(2)}%</td>
                            <td className="py-0.5 px-2 text-right font-mono text-emerald-700 font-semibold">
                                +{(netMargin - refNcm).toFixed(2)} pp
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Realisasi Kas Riil Lapangan & Sign-off */}
            <div className="border border-slate-200 rounded bg-white p-2 flex flex-col justify-between">
                <div>
                    <span className="font-extrabold text-slate-900 uppercase tracking-wide text-[9px] block">
                        F2. Realisasi Kas Riil &amp; Likuiditas (Operating Cash)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 mt-1 text-[8.5px]">
                        <div className="p-1.5 border border-slate-100 rounded bg-slate-50">
                            <span className="text-slate-500 block text-[7.5px] uppercase">Pelunasan Masuk</span>
                            <strong className="text-emerald-700 font-mono block">{formatRp(cf.totalPaymentReceived || 0)}</strong>
                            <span className="text-[7.5px] text-slate-400">Rate: {cf.cashCollectionRate || 0}%</span>
                        </div>
                        <div className="p-1.5 border border-slate-100 rounded bg-slate-50">
                            <span className="text-slate-500 block text-[7.5px] uppercase">Kas Keluar RBL</span>
                            <strong className="text-rose-700 font-mono block">-{formatRp(cf.totalCashOutflow || 0)}</strong>
                            <span className="text-[7.5px] text-slate-400">Realisasi Fisik</span>
                        </div>
                        <div className="p-1.5 border border-slate-100 rounded bg-slate-50">
                            <span className="text-slate-500 block text-[7.5px] uppercase">Net Cashflow</span>
                            <strong className={`font-mono block ${(cf.netOperatingCashflow || 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                {formatRp(cf.netOperatingCashflow || 0)}
                            </strong>
                            <span className="text-[7.5px] text-slate-400">Surplus / Defisit</span>
                        </div>
                        <div className="p-1.5 border border-slate-100 rounded bg-slate-50">
                            <span className="text-slate-500 block text-[7.5px] uppercase">Piutang Beredar</span>
                            <strong className="text-slate-800 font-mono block">{formatRp(billing.arAging?.totalOutstanding || 0)}</strong>
                            <span className="text-[7.5px] text-slate-400">Outstanding AR</span>
                        </div>
                    </div>
                </div>

                <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between text-[7.5px] text-slate-500">
                    <span>Pemeriksaan: <strong>Finance &amp; Operations</strong></span>
                    <span>Otorisasi: <strong>Direksi Rajawali Mix</strong></span>
                </div>
            </div>
        </div>
    )
}
