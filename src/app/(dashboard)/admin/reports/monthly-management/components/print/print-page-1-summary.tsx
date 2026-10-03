"use client"

import React from "react"
import { MonthlyManagementReportResult } from "../../types"
import { PrintHeader } from "./print-header"

interface PrintPage1Props {
    data: MonthlyManagementReportResult
}

function formatJuta(val: number): string {
    const num = val || 0
    if (Math.abs(num) >= 1_000_000_000) {
        return (num / 1_000_000_000).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " M"
    }
    return (num / 1_000_000).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " Jt"
}

function formatRpExact(val: number): string {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}

export function PrintPage1Summary({ data }: PrintPage1Props) {
    const sc = data.scorecard || ({} as any)
    const drilldown = data.drilldown || ({} as any)
    const billing = drilldown.billing || {}

    const totalRev = sc.totalDppRevenue || sc.totalGrossRevenue || 1
    const totalCost = sc.totalDirectCost || 1

    // Cost Drivers
    const rawMaterialCost = (sc.semenCost || 0) + (sc.pasirCost || 0) + (sc.splitCost || 0)
    const manualDirectCost = sc.manualDirectCost || 0
    const fuelCost = sc.fuelCost || 0
    const maintenanceCost = sc.maintenanceCost || 0
    const retaseCost = sc.retaseCost || 0

    const costDrivers = [
        {
            name: "Bahan Baku (Semen, Pasir, Split)",
            amount: rawMaterialCost,
            pctCost: (rawMaterialCost / totalCost) * 100,
            pctRev: (rawMaterialCost / totalRev) * 100,
            color: "bg-blue-600"
        },
        {
            name: "Biaya Pokok Manual / Gaji Lapangan",
            amount: manualDirectCost,
            pctCost: (manualDirectCost / totalCost) * 100,
            pctRev: (manualDirectCost / totalRev) * 100,
            color: "bg-indigo-500"
        },
        {
            name: "Solar BBM Armada (RBL)",
            amount: fuelCost,
            pctCost: (fuelCost / totalCost) * 100,
            pctRev: (fuelCost / totalRev) * 100,
            color: "bg-amber-500"
        },
        {
            name: "Pemeliharaan, Bengkel & Sparepart",
            amount: maintenanceCost,
            pctCost: (maintenanceCost / totalCost) * 100,
            pctRev: (maintenanceCost / totalRev) * 100,
            color: "bg-slate-500"
        },
        {
            name: "Upah Langsung Retase Supir",
            amount: retaseCost,
            pctCost: (retaseCost / totalCost) * 100,
            pctRev: (retaseCost / totalRev) * 100,
            color: "bg-emerald-600"
        }
    ]

    return (
        <div className="print-page-break space-y-4 font-sans text-slate-900 leading-tight">
            {/* 1. Header Minimalis & Premium */}
            <PrintHeader
                data={data}
                pageTitle="Executive Summary"
                pageNumber={1}
                totalPages={2}
            />

            {/* 2. Executive KPI Strip (Maks 5 Kartu) */}
            <div className="grid grid-cols-5 gap-2.5 print-avoid-break">
                {/* KPI 1: Volume */}
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Total Volume
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                        {(sc.productionVolumeM3 || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                        <span className="text-xs font-normal text-slate-500 ml-1">m³</span>
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-1">
                        Target: {(sc.productionTargetM3 || 0).toLocaleString("id-ID")} m³ ({sc.achievementPct || 0}%)
                    </span>
                </div>

                {/* KPI 2: Revenue */}
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Revenue (DPP)
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                        {formatJuta(sc.totalDppRevenue || sc.totalGrossRevenue || 0)}
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-1">
                        Gross: {formatJuta(sc.totalGrossRevenue || 0)}
                    </span>
                </div>

                {/* KPI 3: Direct Cost */}
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Direct Cost
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                        {formatJuta(sc.totalDirectCost || 0)}
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-1">
                        {formatJuta(sc.unitDirectCostPerM3 || 0)} / m³
                    </span>
                </div>

                {/* KPI 4: Gross Profit */}
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Gross Profit
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                        {formatJuta(sc.grossProfit || 0)}
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 block mt-1">
                        Margin: {sc.grossMarginPercent || 0}%
                    </span>
                </div>

                {/* KPI 5: Net Field Contribution */}
                <div className="p-3 border border-emerald-300 rounded-lg bg-emerald-50/30">
                    <span className="text-[9px] font-bold text-emerald-900 uppercase tracking-wider block">
                        Net Field Contribution
                    </span>
                    <div className="text-2xl font-black text-emerald-800 mt-1">
                        {formatJuta(sc.netFieldContribution || 0)}
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 block mt-1">
                        Margin: {sc.fieldContributionMarginPercent || 0}%
                    </span>
                </div>
            </div>

            {/* 3. Executive Performance Summary Banner */}
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/60 print-avoid-break">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                        Executive Performance Summary
                    </span>
                    <div className="flex items-center gap-3 text-[10px]">
                        <span>Revenue: <strong className="text-slate-900">{formatJuta(sc.totalDppRevenue || sc.totalGrossRevenue || 0)}</strong></span>
                        <span>Gross Margin: <strong className="text-emerald-700">{sc.grossMarginPercent || 0}%</strong></span>
                        <span>Net Contribution: <strong className="text-emerald-800">{formatJuta(sc.netFieldContribution || 0)}</strong></span>
                        <span>Net Margin: <strong className="text-emerald-700">{sc.fieldContributionMarginPercent || 0}%</strong></span>
                    </div>
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                    Periode <strong className="text-slate-900">{data.selectedPeriodLabel || data.selectedPeriodStr}</strong> membukukan omset bersih usaha (DPP) sebesar <strong className="text-slate-900">{formatJuta(sc.totalDppRevenue || 0)}</strong> dengan Gross Margin sehat di <strong className="text-slate-900">{sc.grossMarginPercent || 0}%</strong> ({formatJuta(sc.grossProfit || 0)}) dan menghasilkan Kontribusi Laba Bersih Lapangan sebesar <strong className="text-emerald-800">{formatJuta(sc.netFieldContribution || 0)}</strong> ({sc.fieldContributionMarginPercent || 0}% dari DPP).
                </p>
            </div>

            {/* 4. Profit Bridge / Financial Flow (Horizontal Waterfall) */}
            <div className="border border-slate-200 rounded-lg p-3 print-avoid-break">
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    Financial Flow &amp; Profit Bridge
                </span>
                <div className="grid grid-cols-5 gap-2 items-center text-center">
                    {/* Step 1: Revenue */}
                    <div className="p-2 border border-slate-200 rounded bg-white">
                        <span className="text-[8.5px] text-slate-500 uppercase block">Revenue (DPP)</span>
                        <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
                            {formatJuta(sc.totalDppRevenue || sc.totalGrossRevenue || 0)}
                        </strong>
                        <span className="text-[8px] text-slate-400 block mt-0.5">100% Basis</span>
                    </div>

                    {/* Bridge 1: Direct Cost */}
                    <div className="p-2 border border-rose-200 rounded bg-rose-50/30">
                        <span className="text-[8.5px] text-rose-700 uppercase block">Direct COGS</span>
                        <strong className="text-sm font-extrabold text-rose-700 block mt-0.5">
                            -{formatJuta(sc.totalDirectCost || 0)}
                        </strong>
                        <span className="text-[8px] text-rose-600 block mt-0.5">
                            {((sc.totalDirectCost / totalRev) * 100).toFixed(1)}% of Rev
                        </span>
                    </div>

                    {/* Step 2: Gross Profit */}
                    <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <span className="text-[8.5px] text-slate-600 uppercase block font-semibold">Gross Profit</span>
                        <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
                            {formatJuta(sc.grossProfit || 0)}
                        </strong>
                        <span className="text-[8px] font-bold text-emerald-700 block mt-0.5">
                            Margin {sc.grossMarginPercent || 0}%
                        </span>
                    </div>

                    {/* Bridge 2: Branch Overhead */}
                    <div className="p-2 border border-rose-200 rounded bg-rose-50/30">
                        <span className="text-[8.5px] text-rose-700 uppercase block">Overhead &amp; Amort</span>
                        <strong className="text-sm font-extrabold text-rose-700 block mt-0.5">
                            -{formatJuta((sc.rblOpex || 0) + (sc.totalAmortizationMonthly || 0))}
                        </strong>
                        <span className="text-[8px] text-rose-600 block mt-0.5">
                            {((((sc.rblOpex || 0) + (sc.totalAmortizationMonthly || 0)) / totalRev) * 100).toFixed(1)}% of Rev
                        </span>
                    </div>

                    {/* Step 3: Net Field Contribution */}
                    <div className="p-2 border-2 border-emerald-500 rounded bg-emerald-50/40">
                        <span className="text-[8.5px] text-emerald-900 uppercase block font-bold">Net Contribution</span>
                        <strong className="text-base font-black text-emerald-800 block mt-0.5">
                            {formatJuta(sc.netFieldContribution || 0)}
                        </strong>
                        <span className="text-[8px] font-bold text-emerald-700 block mt-0.5">
                            Margin {sc.fieldContributionMarginPercent || 0}%
                        </span>
                    </div>
                </div>
            </div>

            {/* 5. Cost Drivers & Operational Contribution (2-Kolom Seimbang) */}
            <div className="grid grid-cols-2 gap-4 print-avoid-break">
                {/* Kolom Kiri: Cost Structure & Main Cost Drivers */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block">
                        Cost Structure &amp; Key Cost Drivers
                    </span>

                    {/* Visual Proportion Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        {costDrivers.map((d, i) => (
                            <div
                                key={i}
                                className={`h-full ${d.color}`}
                                style={{ width: `${Math.min(100, Math.max(0, d.pctCost))}%` }}
                                title={`${d.name}: ${d.pctCost.toFixed(1)}%`}
                            />
                        ))}
                    </div>

                    <table className="w-full text-[9px] text-left">
                        <thead className="border-b border-slate-200 text-slate-500 text-[8.5px]">
                            <tr>
                                <th className="py-1 font-semibold">Cost Driver</th>
                                <th className="py-1 text-right font-semibold">Amount</th>
                                <th className="py-1 text-right font-semibold">% Cost</th>
                                <th className="py-1 text-right font-semibold">% Rev</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {costDrivers.map((driver, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-1 flex items-center gap-1.5 font-medium text-slate-800">
                                        <span className={`w-2 h-2 rounded-full ${driver.color} shrink-0`} />
                                        <span className="truncate max-w-[150px]">{driver.name}</span>
                                    </td>
                                    <td className="py-1 text-right font-bold text-slate-900">{formatJuta(driver.amount)}</td>
                                    <td className="py-1 text-right text-slate-600 font-semibold">{driver.pctCost.toFixed(1)}%</td>
                                    <td className="py-1 text-right text-slate-500">{driver.pctRev.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t border-slate-300 font-bold text-slate-900 text-[9px]">
                            <tr>
                                <td className="py-1">Total Direct COGS</td>
                                <td className="py-1 text-right">{formatJuta(sc.totalDirectCost || 0)}</td>
                                <td className="py-1 text-right">100%</td>
                                <td className="py-1 text-right">{((sc.totalDirectCost / totalRev) * 100).toFixed(1)}%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Kolom Kanan: Operational Contribution & Cash Realization */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block">
                        Operational Contribution &amp; Cashflow
                    </span>

                    {/* Focal Card: Net Field Contribution */}
                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center justify-between">
                        <div>
                            <span className="text-[8.5px] font-bold text-emerald-900 uppercase block tracking-wider">
                                Net Field Contribution
                            </span>
                            <div className="text-2xl font-black text-emerald-800 mt-0.5">
                                {formatJuta(sc.netFieldContribution || 0)}
                            </div>
                            <span className="text-[8.5px] text-slate-600 block mt-0.5">
                                Unit Margin: {formatRpExact((sc.netFieldContribution || 0) / (sc.productionVolumeM3 || 1))} / m³
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="inline-block px-2.5 py-1 bg-emerald-600 text-white font-black text-xs rounded">
                                Margin {sc.fieldContributionMarginPercent || 0}%
                            </span>
                            <span className="text-[8.5px] text-emerald-800 block mt-1 font-medium">dari Omset DPP</span>
                        </div>
                    </div>

                    {/* Cashflow Realization Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                        <div className="p-2 border border-slate-200 rounded bg-white">
                            <span className="text-slate-500 block text-[8px] uppercase">Pelunasan Masuk</span>
                            <strong className="text-xs font-bold text-emerald-700 block mt-0.5">
                                {formatJuta(sc.cashflow?.totalPaymentReceived || 0)}
                            </strong>
                            <span className="text-[8px] text-slate-400">
                                Collection Rate: {sc.cashflow?.cashCollectionRate || 0}%
                            </span>
                        </div>

                        <div className="p-2 border border-slate-200 rounded bg-white">
                            <span className="text-slate-500 block text-[8px] uppercase">Net Cash Surplus</span>
                            <strong className={`text-xs font-bold block mt-0.5 ${(sc.cashflow?.netOperatingCashflow || 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                {formatJuta(sc.cashflow?.netOperatingCashflow || 0)}
                            </strong>
                            <span className="text-[8px] text-slate-400">
                                Kas Outflow: -{formatJuta(sc.cashflow?.totalCashOutflow || 0)}
                            </span>
                        </div>
                    </div>

                    {/* Outstanding AR */}
                    <div className="flex justify-between items-center px-1 text-[8.5px] text-slate-500 border-t border-slate-100 pt-1">
                        <span>Piutang Beredar (Outstanding AR):</span>
                        <strong className="text-slate-800 font-mono">
                            {formatJuta(billing.arAging?.totalOutstanding || 0)}
                        </strong>
                    </div>
                </div>
            </div>

            {/* 6. Footnote Minimalis */}
            <div className="pt-2 text-center text-[8px] text-slate-400 border-t border-slate-200">
                Dokumen Manajemen Internal Rajawali Mix • Hal. 01 / 02 • Detailed Performance &amp; P&amp;L di Halaman 02 / 02
            </div>
        </div>
    )
}
