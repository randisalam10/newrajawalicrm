"use client"

import React from "react"
import { MonthlyManagementReportResult } from "../../../types"

interface SectionARevenueProps {
    data: MonthlyManagementReportResult
}

function formatRp(val: number): string {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}

function formatDec(val: number, maxDec = 1): string {
    return (val || 0).toLocaleString("id-ID", { maximumFractionDigits: maxDec })
}

export function SectionARevenue({ data }: SectionARevenueProps) {
    const sc = data.scorecard || ({} as any)
    const drilldown = data.drilldown || ({} as any)

    const vol = sc.productionVolumeM3 || 0
    const totalDpp = sc.totalDppRevenue || sc.totalGrossRevenue || 0
    const actAsp = vol > 0 ? totalDpp / vol : 0

    const readymixDpp = sc.readymixRevenue || totalDpp
    const readymixPpn = sc.readymixPpn || sc.totalTaxLiability || 0
    const readymixGross = sc.readymixGross || (readymixDpp + readymixPpn)
    const rentalDpp = sc.rentalRevenue || 0
    const rentalPpn = sc.rentalPpn || 0
    const rentalGross = sc.rentalGross || (rentalDpp + rentalPpn)
    const aggDpp = sc.aggregateRevenue || 0
    const aggPpn = sc.aggregatePpn || 0
    const aggGross = sc.aggregateGross || (aggDpp + aggPpn)
    const totalPpn = sc.totalTaxLiability || (readymixPpn + rentalPpn + aggPpn)
    const totalGross = sc.totalGrossRevenue || (totalDpp + totalPpn)

    return (
        <div className="border border-slate-200 rounded bg-white overflow-hidden text-[9px] print-avoid-break">
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex justify-between items-center">
                <span className="font-extrabold text-slate-900 uppercase tracking-wide text-[9.5px]">
                    A. Revenue &amp; Business Performance
                </span>
                <div className="flex items-center gap-3 text-[9px]">
                    <span>Volume: <strong className="text-slate-900">{formatDec(vol)} m³</strong></span>
                    <span>•</span>
                    <span>Revenue DPP: <strong className="text-slate-900">{formatRp(totalDpp)}</strong></span>
                    <span>•</span>
                    <span>ASP: <strong className="text-slate-900">{formatRp(actAsp)}/m³</strong></span>
                </div>
            </div>

            <table className="w-full text-left">
                <thead className="bg-slate-50/70 border-b border-slate-200 font-semibold text-slate-600 text-[8.5px]">
                    <tr>
                        <th className="py-1 px-2.5">Revenue Component</th>
                        <th className="py-1 px-2 text-right">Volume / Qty</th>
                        <th className="py-1 px-2 text-right">Harga Rata-rata</th>
                        <th className="py-1 px-2 text-right">Pendapatan DPP</th>
                        <th className="py-1 px-2 text-right">PPN 11%</th>
                        <th className="py-1 px-2 text-right">Total Gross</th>
                        <th className="py-1 px-2 text-right">Share %</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    <tr>
                        <td className="py-1 px-2.5 font-medium text-slate-800">
                            Ready-Mix (Beton Cor Berbagai Mutu)
                        </td>
                        <td className="py-1 px-2 text-right text-slate-600 font-mono">{formatDec(vol)} m³</td>
                        <td className="py-1 px-2 text-right text-slate-600 font-mono">{formatRp(actAsp)}</td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900 font-mono">{formatRp(readymixDpp)}</td>
                        <td className="py-1 px-2 text-right text-slate-500 font-mono">{formatRp(readymixPpn)}</td>
                        <td className="py-1 px-2 text-right text-slate-800 font-mono">{formatRp(readymixGross)}</td>
                        <td className="py-1 px-2 text-right font-medium text-slate-600">
                            {totalDpp > 0 ? ((readymixDpp / totalDpp) * 100).toFixed(1) : 0}%
                        </td>
                    </tr>
                    <tr>
                        <td className="py-1 px-2.5 font-medium text-slate-800">
                            Sewa Alat &amp; Penjualan Spare Part
                        </td>
                        <td className="py-1 px-2 text-right text-slate-600 font-mono">
                            {drilldown.rentalDetail?.count || 0} Trx
                        </td>
                        <td className="py-1 px-2 text-right text-slate-400">-</td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900 font-mono">{formatRp(rentalDpp)}</td>
                        <td className="py-1 px-2 text-right text-slate-500 font-mono">{formatRp(rentalPpn)}</td>
                        <td className="py-1 px-2 text-right text-slate-800 font-mono">{formatRp(rentalGross)}</td>
                        <td className="py-1 px-2 text-right font-medium text-slate-600">
                            {totalDpp > 0 ? ((rentalDpp / totalDpp) * 100).toFixed(1) : 0}%
                        </td>
                    </tr>
                    <tr>
                        <td className="py-1 px-2.5 font-medium text-slate-800">
                            Penjualan Agregat Bebas (Quarry)
                        </td>
                        <td className="py-1 px-2 text-right text-slate-600 font-mono">
                            {drilldown.aggregateSalesDetail?.count || 0} Bon
                        </td>
                        <td className="py-1 px-2 text-right text-slate-400">-</td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900 font-mono">{formatRp(aggDpp)}</td>
                        <td className="py-1 px-2 text-right text-slate-500 font-mono">{formatRp(aggPpn)}</td>
                        <td className="py-1 px-2 text-right text-slate-800 font-mono">{formatRp(aggGross)}</td>
                        <td className="py-1 px-2 text-right font-medium text-slate-600">
                            {totalDpp > 0 ? ((aggDpp / totalDpp) * 100).toFixed(1) : 0}%
                        </td>
                    </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900 text-[9px]">
                    <tr>
                        <td colSpan={3} className="py-1 px-2.5 uppercase">Total Revenue (DPP Basis):</td>
                        <td className="py-1 px-2 text-right text-slate-900 font-mono">{formatRp(totalDpp)}</td>
                        <td className="py-1 px-2 text-right text-slate-600 font-mono">{formatRp(totalPpn)}</td>
                        <td className="py-1 px-2 text-right text-slate-950 font-mono">{formatRp(totalGross)}</td>
                        <td className="py-1 px-2 text-right">100.0%</td>
                    </tr>
                </tfoot>
            </table>
            <div className="px-3 py-1 bg-slate-50/50 text-[8px] text-slate-500 border-t border-slate-100 flex justify-between">
                <span>* Catatan: PPN 11% merupakan kewajiban perpajakan keluaran. Pendapatan DPP menjadi basis perhitungan laba kotor &amp; margin operasional.</span>
                <span>Status Tiket: <strong>Confirmed Only</strong></span>
            </div>
        </div>
    )
}
