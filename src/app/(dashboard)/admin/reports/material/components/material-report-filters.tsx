"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Layers, Filter, Search, RotateCcw } from "lucide-react"
import { MaterialLocation } from "../types"

interface MaterialReportFiltersProps {
    locations: MaterialLocation[]
    isSuperAdmin: boolean
    userLocationId?: string | null
    datePreset: string
    onPresetChange: (preset: string) => void
    startDate: string
    onStartDateChange: (val: string) => void
    endDate: string
    onEndDateChange: (val: string) => void
    selectedLocation: string
    onLocationChange: (val: string) => void
    selectedMaterialType: string
    onMaterialTypeChange: (val: string) => void
    selectedSourceType: string
    onSourceTypeChange: (val: string) => void
    searchQuery: string
    onSearchQueryChange: (val: string) => void
    onSearchSubmit: () => void
    onResetFilters: () => void
}

export function MaterialReportFilters({
    locations,
    isSuperAdmin,
    userLocationId,
    datePreset,
    onPresetChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    selectedLocation,
    onLocationChange,
    selectedMaterialType,
    onMaterialTypeChange,
    selectedSourceType,
    onSourceTypeChange,
    searchQuery,
    onSearchQueryChange,
    onSearchSubmit,
    onResetFilters,
}: MaterialReportFiltersProps) {
    const presets = [
        { id: "today", label: "Hari Ini" },
        { id: "last_7", label: "7 Hari" },
        { id: "this_month", label: "Bulan Ini" },
        { id: "last_month", label: "Bulan Lalu" },
        { id: "this_year", label: "Tahun Ini" },
    ]

    return (
        <Card className="border-slate-200/80 shadow-2xs bg-white print:hidden">
            <CardContent className="p-3.5 space-y-3">
                {/* Top Row: Presets & Date Range */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                        {presets.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => onPresetChange(preset.id)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    datePreset === preset.id
                                        ? "bg-blue-600 text-white shadow-2xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Date Inputs */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-500">Periode:</span>
                            <Input
                                type="date"
                                className="h-8 text-xs w-36 bg-white"
                                value={startDate}
                                suppressHydrationWarning
                                onChange={(e) => onStartDateChange(e.target.value)}
                            />
                            <span className="text-slate-400 text-xs">s/d</span>
                            <Input
                                type="date"
                                className="h-8 text-xs w-36 bg-white"
                                value={endDate}
                                suppressHydrationWarning
                                onChange={(e) => onEndDateChange(e.target.value)}
                            />
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onResetFilters}
                            className="h-8 text-xs text-slate-600 hover:text-rose-600 cursor-pointer p-2"
                            title="Reset filter"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Bottom Row: Location, Material Type, Source Type, Search */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
                    {/* Cabang / Plant */}
                    {locations.length > 1 && (
                        <div>
                            <Select
                                value={selectedLocation}
                                onValueChange={onLocationChange}
                                disabled={!isSuperAdmin && !!userLocationId}
                            >
                                <SelectTrigger className="h-8 text-xs bg-slate-50/50">
                                    <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                    <SelectValue placeholder="Semua Cabang / Plant" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Cabang (Global)</SelectItem>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Jenis Material */}
                    <div>
                        <Select value={selectedMaterialType} onValueChange={onMaterialTypeChange}>
                            <SelectTrigger className="h-8 text-xs bg-slate-50/50">
                                <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                <SelectValue placeholder="Semua Jenis Material" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Jenis Material</SelectItem>
                                <SelectItem value="Pasir">Pasir Cor</SelectItem>
                                <SelectItem value="SplitHalfOne">Batu Split 1/2</SelectItem>
                                <SelectItem value="SplitTwoThree">Batu Split 2/3</SelectItem>
                                <SelectItem value="AbuBatu">Abu Batu / Screening</SelectItem>
                                <SelectItem value="Other">Agregat Lainnya / Sirtu</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sumber Pengambilan */}
                    <div>
                        <Select value={selectedSourceType} onValueChange={onSourceTypeChange}>
                            <SelectTrigger className="h-8 text-xs bg-slate-50/50">
                                <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                <SelectValue placeholder="Semua Sumber Material" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Sumber (Internal & Vendor)</SelectItem>
                                <SelectItem value="Internal">Quarry Sendiri (Internal)</SelectItem>
                                <SelectItem value="External">Pembelian Vendor (Eksternal)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Text Search */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <Input
                            placeholder="Cari no bon, supir, plat..."
                            className="h-8 pl-8 text-xs bg-slate-50/50"
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
