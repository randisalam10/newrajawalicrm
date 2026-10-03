"use client"

import React from "react"
import { MonthlyManagementReportResult } from "../../types"
import { PrintHeader } from "./print-header"
import { SectionARevenue } from "./page2/section-a-revenue"
import { SectionBDirectCost } from "./page2/section-b-direct-cost"
import { SectionCGrossProfit } from "./page2/section-c-gross-profit"
import { SectionDOpex } from "./page2/section-d-opex"
import { SectionENetContribution } from "./page2/section-e-net-contribution"
import { SectionFControlMetrics } from "./page2/section-f-control-metrics"

interface PrintPage2DetailedProps {
    data: MonthlyManagementReportResult
}

export function PrintPage2Detailed({ data }: PrintPage2DetailedProps) {
    return (
        <div className="space-y-2 font-sans text-slate-900 leading-tight">
            {/* Header Standar Manajemen */}
            <PrintHeader
                data={data}
                pageTitle="Detailed Performance & P&L"
                pageNumber={2}
                totalPages={2}
            />

            {/* SECTION A — REVENUE & BUSINESS PERFORMANCE */}
            <SectionARevenue data={data} />

            {/* SECTION B — DIRECT COST (BIAYA POKOK PRODUKSI LANGSUNG) */}
            <SectionBDirectCost data={data} />

            {/* SECTION C — GROSS PROFIT (LABA KOTOR OPERASIONAL) */}
            <SectionCGrossProfit data={data} />

            {/* SECTION D — OPERATING EXPENSE & AMORTIZATION */}
            <SectionDOpex data={data} />

            {/* SECTION E — NET FIELD CONTRIBUTION (LABA BERSIH LAPANGAN) */}
            <SectionENetContribution data={data} />

            {/* SECTION F — MANAGEMENT CHECK & CONTROL METRICS */}
            <SectionFControlMetrics data={data} />

            {/* Footnote Hal. 2 */}
            <div className="pt-1 text-center text-[8px] text-slate-400 border-t border-slate-200">
                Dokumen Manajemen Internal Rajawali Mix • Hal. 02 / 02 • Selesai.
            </div>
        </div>
    )
}
