"use client"

import React from "react"
import { MonthlyManagementReportResult } from "../../../types"

interface SectionENetContributionProps {
    data: MonthlyManagementReportResult
}

function formatRp(val: number): string {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}

export function SectionENetContribution({ data }: SectionENetContributionProps) {
    const sc = data.scorecard || ({} as any)

    const vol = sc.productionVolumeM3 || 0
    const grossProfit = sc.grossProfit || 0
    const rblOpex = sc.rblOpex || 0
    const totalAmort = sc.totalAmortizationMonthly || ((sc.sewaTanahMonthly || 0) + (sc.sewaMessMonthly || 0) + (sc.totalVehicleComplianceMonthly || 0) + (sc.perizinanMonthly || 0)) || 0
    const netContrib = sc.netFieldContribution || 0
    const netMargin = sc.fieldContributionMarginPercent || 0

    return (
        <div className="border border-emerald-300 bg-emerald-50/50 rounded p-2.5 print-avoid-break">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[8.5px] font-bold text-emerald-900 uppercase tracking-wider block">
                        E. Net Field Contribution — Laba Bersih Lapangan
                    </span>
                    <div className="text-[10px] text-slate-600 mt-1 flex items-center gap-1.5">
                        <span>Gross Profit: <strong className="text-slate-900">{formatRp(grossProfit)}</strong></span>
                        <span>−</span>
                        <span>Opex D1: <strong className="text-slate-900">{formatRp(rblOpex)}</strong></span>
                        <span>−</span>
                        <span>Amort D2: <strong className="text-slate-900">{formatRp(totalAmort)}</strong></span>
                        <span>=</span>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase block">NET FIELD CONTRIBUTION</span>
                    <div className="text-lg font-black text-emerald-950 tracking-tight">
                        {formatRp(netContrib)}
                    </div>
                    <div className="flex items-center justify-end gap-2 text-[9px] mt-0.5">
                        <span className="font-extrabold text-white bg-emerald-700 px-1.5 py-0.5 rounded">
                            Margin {netMargin.toFixed(2)}%
                        </span>
                        <span className="text-emerald-900 font-medium font-mono">
                            Unit Net: {formatRp(vol > 0 ? netContrib / vol : 0)} / m³
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
