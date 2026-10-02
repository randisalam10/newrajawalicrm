"use client"

import { Calendar, Building2, FileText, BarChart3, Layers } from "lucide-react"

interface ReportFilterBarProps {
    selectedMonth: string
    selectedLoc: string
    availableMonths: string[]
    availableLocations: Array<{ id: string; name: string }>
    isPending: boolean
    activeTab: "summary" | "macro" | "detail"
    onFilterChange: (month: string, loc: string) => void
    onTabChange: (tab: "summary" | "macro" | "detail") => void
}

export function ReportFilterBar({
    selectedMonth,
    selectedLoc,
    availableMonths,
    availableLocations,
    isPending,
    activeTab,
    onFilterChange,
    onTabChange
}: ReportFilterBarProps) {
    return (
        <div className="print:hidden space-y-3">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>Pilih Periode:</span>
                        <select
                            value={selectedMonth}
                            onChange={(e) => onFilterChange(e.target.value, selectedLoc)}
                            disabled={isPending}
                            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {availableMonths.map((m: string) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>Filter Cabang:</span>
                        <select
                            value={selectedLoc}
                            onChange={(e) => onFilterChange(selectedMonth, e.target.value)}
                            disabled={isPending}
                            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="all">Semua Cabang (Konsolidasi)</option>
                            {availableLocations.map((l: any) => (
                                <option key={l.id} value={l.id}>
                                    {l.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {isPending && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                        Memuat data periode...
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white p-1 rounded-xl shadow-xs">
                <button
                    onClick={() => onTabChange("summary")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "summary"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    1. Ringkasan Eksekutif
                </button>
                <button
                    onClick={() => onTabChange("macro")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "macro"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    2. Gambaran Makro &amp; Komparatif
                </button>
                <button
                    onClick={() => onTabChange("detail")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "detail"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    3. Audit Operasional &amp; Transaksi
                </button>
            </div>
        </div>
    )
}
