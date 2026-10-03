"use client"

import React from "react"
import { MonthlyManagementReportResult } from "../../types"
import { PrintPage1Summary } from "./print-page-1-summary"
import { PrintPage2Detailed } from "./print-page-2-detailed"

interface ExecutivePrintDocumentProps {
    data: MonthlyManagementReportResult
}

export function ExecutivePrintDocument({ data }: ExecutivePrintDocumentProps) {
    if (!data || !data.authorized) return null

    return (
        <div id="executive-print-container" className="hidden print:block w-full bg-white text-slate-900 m-0 p-0">
            {/* Halaman 1: Executive Summary (Executive KPI Strip, Performance Overview, Profit Bridge & Cost Drivers) */}
            <PrintPage1Summary data={data} />

            {/* Halaman 2: Detailed Performance & P&L (Seksi A s.d. F: Revenue, Direct Cost, Gross Profit, Opex & Amortisasi, Net Contribution, Control Metrics) */}
            <PrintPage2Detailed data={data} />
        </div>
    )
}

