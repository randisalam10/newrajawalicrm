"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Printer, FileSpreadsheet } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

interface VehicleReportHeaderProps {
    mounted: boolean
    activeLocationName: string
    availableCount: number
    isPending: boolean
    onRefresh: () => void
    onExportCSV: () => void
}

export function VehicleReportHeader({
    mounted,
    activeLocationName,
    availableCount,
    isPending,
    onRefresh,
    onExportCSV,
}: VehicleReportHeaderProps) {
    return (
        <>
            {/* ─── Printable Letterhead ─────────────────────────────────────────── */}
            <div className="hidden print:block mb-4 border-b pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">PT RAJAWALI ANUGRAH READYMIX</h1>
                        <p className="text-xs text-slate-600">Laporan Monitoring Operasional & Efisiensi Armada Kendaraan</p>
                    </div>
                    <div className="text-right text-xs text-slate-500" suppressHydrationWarning>
                        <div suppressHydrationWarning>
                            Tanggal: {mounted ? format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale }) : ""}
                        </div>
                        <div>Cabang: <strong>{activeLocationName}</strong></div>
                    </div>
                </div>
            </div>

            {/* ─── Top Compact Action Toolbar ───────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden bg-white p-2.5 px-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                        Cabang: {activeLocationName}
                    </span>
                    <span className="text-xs text-slate-300">|</span>
                    <span className="text-xs text-slate-500 font-medium">
                        {availableCount} Armada Terdaftar
                    </span>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isPending}
                        className="h-7 text-xs px-2.5 gap-1.5 bg-white shadow-2xs hover:bg-slate-50 cursor-pointer"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isPending ? "animate-spin text-blue-600" : ""}`} />
                        <span className="hidden xs:inline">Refresh</span>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-7 text-xs px-2.5 gap-1.5 bg-white shadow-2xs hover:bg-slate-50 cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-600" />
                        <span className="hidden xs:inline">Cetak</span>
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={onExportCSV}
                        className="h-7 text-xs px-3 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer font-medium"
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Ekspor Excel / CSV</span>
                    </Button>
                </div>
            </div>
        </>
    )
}
