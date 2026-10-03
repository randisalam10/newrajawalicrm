"use client"

import React from "react"
import { MonthlyManagementReportResult } from "../../types"

interface PrintHeaderProps {
    data: MonthlyManagementReportResult
    pageTitle?: string
    pageSubtitle?: string
    pageNumber?: number
    totalPages?: number
}

export function PrintHeader({ data, pageTitle, pageSubtitle, pageNumber, totalPages = 2 }: PrintHeaderProps) {
    const printDateStr = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    })

    const isClosed = data.isClosed
    const locationName = data.activeLocationName || "Semua Cabang (Konsolidasi)"
    const periodLabel = data.selectedPeriodLabel || data.selectedPeriodStr || "September 2026"

    const pageStr = pageNumber ? `${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}` : ""

    return (
        <div className="border-b border-slate-900 pb-2 mb-3 print-avoid-break font-sans">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
                            RAJAWALI MIX
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                            {pageTitle || "Executive Performance Scorecard"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>Periode: <strong className="text-slate-900">{periodLabel}</strong></span>
                        <span>•</span>
                        <span>Unit / Plant: <strong className="text-slate-900">{locationName}</strong></span>
                        {pageSubtitle && (
                            <>
                                <span>•</span>
                                <span className="text-slate-600">{pageSubtitle}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="text-right text-[10px]">
                    <div className="font-extrabold text-slate-900 uppercase tracking-wider">
                        {isClosed ? "🔒 DOKUMEN RESMI (TUTUP BUKU)" : "INTERNAL MANAGEMENT DOCUMENT"}
                    </div>
                    <div className="flex items-center justify-end gap-2 text-slate-500 mt-0.5">
                        <span>Reporting Date: {printDateStr}</span>
                        {pageStr && (
                            <>
                                <span>•</span>
                                <strong className="text-slate-900 font-mono text-[11px]">{pageStr}</strong>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
