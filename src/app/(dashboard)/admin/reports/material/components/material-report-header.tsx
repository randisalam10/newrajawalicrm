"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Layers, Printer, FileSpreadsheet, RefreshCw, Wrench } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { fmtDate } from "../helpers"

interface MaterialReportHeaderProps {
    mounted: boolean
    startDate: string
    endDate: string
    isPending: boolean
    canManagePrices: boolean
    onPrint: () => void
    onExportCSV: () => void
    onRefresh: () => void
    onOpenSyncModal: () => void
}

export function MaterialReportHeader({
    mounted,
    startDate,
    endDate,
    isPending,
    canManagePrices,
    onPrint,
    onExportCSV,
    onRefresh,
    onOpenSyncModal,
}: MaterialReportHeaderProps) {
    return (
        <>
            {/* ═══ Header Section (Web View) ════════════════════════════════════════════ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 print:hidden">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                                Laporan Biaya Material
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                                    Agregat & Pasir
                                </Badge>
                            </h1>
                            <p className="text-xs text-slate-500">
                                Akumulasi menyeluruh nilai pokok material, ongkos angkut (retase Dump Truck), dan biaya mendarat riil (landed cost).
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onPrint}
                        className="h-8 text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium cursor-pointer shadow-2xs"
                    >
                        <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        <span>Cetak / PDF</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExportCSV}
                        className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 font-medium cursor-pointer shadow-2xs"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        <span>Ekspor Excel/CSV</span>
                    </Button>

                    <Button
                        variant="default"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isPending}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer shadow-2xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPending ? "animate-spin" : ""}`} />
                        <span>{isPending ? "Memuat..." : "Segarkan"}</span>
                    </Button>

                    {canManagePrices && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onOpenSyncModal}
                            className="h-8 text-xs bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100/80 font-medium cursor-pointer shadow-2xs"
                            title="Koreksi dan sinkronkan data material dengan tarif Master Material"
                        >
                            <Wrench className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
                            <span>Koreksi / Sinkronkan Harga</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* ═══ Print Only Header ═══════════════════════════════════════════════ */}
            <div className="hidden print:block mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-slate-900">PT RAJAWALI PAPUA BETON</h1>
                <h2 className="text-lg font-semibold text-slate-800">LAPORAN BIAYA MATERIAL AGREGAT</h2>
                <p className="text-xs text-slate-600" suppressHydrationWarning>
                    Periode: {fmtDate(startDate)} s/d {fmtDate(endDate)}{" "}
                    {mounted ? `| Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale })}` : ""}
                </p>
            </div>
        </>
    )
}
