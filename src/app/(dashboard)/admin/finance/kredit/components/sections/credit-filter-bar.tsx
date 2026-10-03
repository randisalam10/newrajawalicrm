"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { CreditFilterState } from "../../types"
import { Filter, Search, RotateCcw, RefreshCw, Plus, Building2, Store } from "lucide-react"

interface CreditFilterBarProps {
    filters: CreditFilterState
    setFilters: React.Dispatch<React.SetStateAction<CreditFilterState>>
    setDatePreset: (preset: CreditFilterState["datePreset"]) => void
    resetFilters: () => void
    isFiltered: boolean
    companies: Array<{ id: string; name: string }>
    suppliers: Array<{ id: string; name: string }>
    locations: Array<{ id: string; name: string }>
    projects: Array<{ id: string; name: string; kode_proyek: string | null }>
    onApply: () => void
    onSyncPos: () => void
    onOpenCreateModal: () => void
    isPending: boolean
    canManage?: boolean
}

export function CreditFilterBar({
    filters,
    setFilters,
    setDatePreset,
    resetFilters,
    isFiltered,
    companies,
    suppliers,
    locations,
    projects,
    onApply,
    onSyncPos,
    onOpenCreateModal,
    isPending,
    canManage,
}: CreditFilterBarProps) {
    return (
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs space-y-3">
            {/* Top Bar: Title, Presets & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="p-1 bg-blue-50 text-blue-600 rounded-md">
                        <Filter className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Filter & Pencarian Kewajiban Kredit
                    </span>
                    {isFiltered && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                            Filter Aktif
                        </span>
                    )}
                </div>

                {/* Preset Buttons & Global Actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">Periode:</span>
                    <button
                        type="button"
                        onClick={() => { setDatePreset("TODAY"); onApply(); }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                            filters.datePreset === "TODAY"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                    >
                        Hari Ini
                    </button>
                    <button
                        type="button"
                        onClick={() => { setDatePreset("THIS_MONTH"); onApply(); }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                            filters.datePreset === "THIS_MONTH"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                    >
                        Bulan Ini
                    </button>
                    <button
                        type="button"
                        onClick={() => { setDatePreset("THIS_YEAR"); onApply(); }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                            filters.datePreset === "THIS_YEAR"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                    >
                        Tahun Ini
                    </button>
                    <button
                        type="button"
                        onClick={() => { setDatePreset("ALL"); onApply(); }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                            filters.datePreset === "ALL"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                    >
                        Semua
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                    {/* Sync PO Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSyncPos}
                        disabled={isPending}
                        className="h-7 text-xs border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 cursor-pointer"
                        title="Periksa dan daftarkan PO bertipe CREDIT yang baru di-approve"
                    >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isPending ? "animate-spin" : ""}`} />
                        Sinkronkan PO
                    </Button>

                    {/* Create Manual Credit */}
                    {canManage && (
                        <Button
                            size="sm"
                            onClick={onOpenCreateModal}
                            className="h-7 text-xs bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Kredit Non-PO
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Controls Row 1: Search & Allocation Segments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {/* Search */}
                <div className="relative lg:col-span-2">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Cari no. PO, kredit, vendor..."
                        className="h-8 pl-8 pr-3 text-xs bg-white border-slate-200"
                        value={filters.search}
                        onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") onApply() }}
                    />
                </div>

                {/* Filter Jenis Alokasi (Proyek vs BP vs Holding) */}
                <Select
                    value={filters.allocationType}
                    onValueChange={v => {
                        setFilters(prev => ({
                            ...prev,
                            allocationType: v as any,
                            companyProjectId: v === "BATCHING_PLANT" || v === "HOLDING" ? "ALL" : prev.companyProjectId,
                            locationId: v === "PROJECT" || v === "HOLDING" ? "ALL" : prev.locationId,
                        }))
                        onApply()
                    }}
                >
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200 font-medium">
                        <SelectValue placeholder="Peruntukan / Alokasi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Semua Peruntukan</SelectItem>
                        <SelectItem value="PROJECT">🏗️ Khusus Proyek</SelectItem>
                        <SelectItem value="BATCHING_PLANT">🏭 Khusus Batching Plant</SelectItem>
                        <SelectItem value="HOLDING">🏢 Kantor Pusat / Holding</SelectItem>
                    </SelectContent>
                </Select>

                {/* Filter Proyek Spesifik (aktif jika ALL atau PROJECT) */}
                {filters.allocationType !== "BATCHING_PLANT" && filters.allocationType !== "HOLDING" ? (
                    <Select
                        value={filters.companyProjectId}
                        onValueChange={v => { setFilters(prev => ({ ...prev, companyProjectId: v })); onApply(); }}
                    >
                        <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                            <SelectValue placeholder="Pilih Proyek" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Proyek</SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    /* Filter Lokasi Batching Plant Spesifik */
                    <Select
                        value={filters.locationId}
                        onValueChange={v => { setFilters(prev => ({ ...prev, locationId: v })); onApply(); }}
                    >
                        <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                            <SelectValue placeholder="Batching Plant" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Cabang BP</SelectItem>
                            {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>BP {loc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Status Filter */}
                <Select
                    value={filters.status}
                    onValueChange={v => { setFilters(prev => ({ ...prev, status: v })); onApply(); }}
                >
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Semua Status</SelectItem>
                        <SelectItem value="UNPAID">Belum Dibayar</SelectItem>
                        <SelectItem value="PARTIAL">Sebagian (Cicil)</SelectItem>
                        <SelectItem value="PAID">Lunas</SelectItem>
                        <SelectItem value="OVERDUE" className="text-red-600 font-semibold">Lewat Jatuh Tempo</SelectItem>
                        <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                    </SelectContent>
                </Select>

                {/* Sort By */}
                <Select
                    value={filters.sortBy}
                    onValueChange={v => { setFilters(prev => ({ ...prev, sortBy: v as any })); onApply(); }}
                >
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                        <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date_desc">Tgl Terbit (Terbaru)</SelectItem>
                        <SelectItem value="date_asc">Tgl Terbit (Terlama)</SelectItem>
                        <SelectItem value="outstanding_desc">Sisa Tertinggi</SelectItem>
                        <SelectItem value="amount_desc">Nilai Kredit Terbesar</SelectItem>
                        <SelectItem value="due_soon">Jatuh Tempo Terdekat</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Filter Controls Row 2: Secondary Dropdowns (Company & Supplier & BP if Project mode) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                {/* Batching Plant Filter (when in ALL mode) */}
                {filters.allocationType === "ALL" && (
                    <Select
                        value={filters.locationId}
                        onValueChange={v => { setFilters(prev => ({ ...prev, locationId: v })); onApply(); }}
                    >
                        <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                            <SelectValue placeholder="Batching Plant" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Cabang BP</SelectItem>
                            {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>BP {loc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Company Filter */}
                <Select
                    value={filters.companyGroupId}
                    onValueChange={v => { setFilters(prev => ({ ...prev, companyGroupId: v })); onApply(); }}
                >
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                        <SelectValue placeholder="Perusahaan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Semua Perusahaan</SelectItem>
                        {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Supplier Filter */}
                <Select
                    value={filters.supplierId}
                    onValueChange={v => { setFilters(prev => ({ ...prev, supplierId: v })); onApply(); }}
                >
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                        <SelectValue placeholder="Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Semua Supplier</SelectItem>
                        {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Custom Date Range & Reset Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 text-[11px]">Rentang Khusus:</span>
                    <Input
                        type="date"
                        className="h-7 w-32 text-xs bg-white border-slate-200"
                        value={filters.startDate}
                        onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value, datePreset: "CUSTOM" }))}
                    />
                    <span className="text-slate-400">s/d</span>
                    <Input
                        type="date"
                        className="h-7 w-32 text-xs bg-white border-slate-200"
                        value={filters.endDate}
                        onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value, datePreset: "CUSTOM" }))}
                    />
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onApply}
                        className="h-7 px-3 text-xs cursor-pointer"
                    >
                        Terapkan
                    </Button>
                </div>

                {isFiltered && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { resetFilters(); onApply(); }}
                        className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                    >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Reset Filter
                    </Button>
                )}
            </div>
        </div>
    )
}
