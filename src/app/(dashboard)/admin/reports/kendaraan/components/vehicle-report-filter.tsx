"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Building2,
    Tag,
    Truck,
    Search,
    X,
    Calendar,
    RotateCcw,
} from "lucide-react"
import { VehicleCategory, VehicleItem, VehicleLocation } from "../types"

interface VehicleReportFilterProps {
    locations: VehicleLocation[]
    categories: VehicleCategory[]
    availableVehicles: VehicleItem[]
    selectedLocation: string
    onLocationChange: (val: string) => void
    selectedCategoryId: string
    onCategoryChange: (val: string) => void
    selectedVehicleId: string
    onVehicleChange: (val: string) => void
    searchQuery: string
    onSearchChange: (val: string) => void
    startDate: string
    onStartDateChange: (val: string) => void
    endDate: string
    onEndDateChange: (val: string) => void
    isSuperAdmin: boolean
    isFiltered: boolean
    onResetFilters: () => void
    onSetThisMonth: () => void
    onSetLastMonth: () => void
    onSetThisYear: () => void
    filteredCount: number
}

export function VehicleReportFilter({
    locations,
    categories,
    availableVehicles,
    selectedLocation,
    onLocationChange,
    selectedCategoryId,
    onCategoryChange,
    selectedVehicleId,
    onVehicleChange,
    searchQuery,
    onSearchChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    isSuperAdmin,
    isFiltered,
    onResetFilters,
    onSetThisMonth,
    onSetLastMonth,
    onSetThisYear,
    filteredCount,
}: VehicleReportFilterProps) {
    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-2.5 sm:p-3 space-y-2 print:hidden">
            {/* Row 1: Selectors & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Cabang */}
                <div className="relative">
                    <Select
                        value={selectedLocation}
                        onValueChange={(val) => {
                            onLocationChange(val)
                            onVehicleChange("all")
                        }}
                        disabled={!isSuperAdmin}
                    >
                        <SelectTrigger className="h-8 text-xs bg-slate-50/70 border-slate-200">
                            <div className="flex items-center gap-1.5 truncate">
                                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <SelectValue placeholder="Semua Cabang" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                            {isSuperAdmin && (
                                <SelectItem value="all" className="text-xs font-medium">
                                    🏢 Semua Cabang
                                </SelectItem>
                            )}
                            {locations.map(l => (
                                <SelectItem key={l.id} value={l.id} className="text-xs">
                                    📍 {l.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Kategori Kendaraan */}
                <div className="relative">
                    <Select
                        value={selectedCategoryId}
                        onValueChange={(val) => {
                            onCategoryChange(val)
                            onVehicleChange("all")
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs bg-slate-50/70 border-slate-200">
                            <div className="flex items-center gap-1.5 truncate">
                                <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <SelectValue placeholder="Semua Kategori" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                            <SelectItem value="all" className="text-xs font-medium">
                                🏷️ Semua Kategori Armada
                            </SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Unit Armada */}
                <div className="relative">
                    <Select
                        value={selectedVehicleId}
                        onValueChange={onVehicleChange}
                    >
                        <SelectTrigger className="h-8 text-xs bg-slate-50/70 border-slate-200">
                            <div className="flex items-center gap-1.5 truncate">
                                <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <SelectValue placeholder="Semua Armada" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="text-xs max-h-60">
                            <SelectItem value="all" className="text-xs font-medium">
                                🚛 Semua Armada ({availableVehicles.length} Unit)
                            </SelectItem>
                            {availableVehicles.map(v => (
                                <SelectItem key={v.id} value={v.id} className="text-xs">
                                    <span className="font-bold text-slate-900">{v.code}</span>
                                    <span className="text-slate-500 ml-1.5">({v.plate_number})</span>
                                    <span className="text-[10px] text-blue-600 ml-1 font-medium">
                                        [{v.category?.name || v.vehicle_type}]
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Quick Search */}
                <div className="relative">
                    <Input
                        value={searchQuery}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Cari kode unit, plat, jenis..."
                        className="h-8 text-xs bg-slate-50/70 pl-8 pr-7 border-slate-200"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange("")}
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Row 2: Date Range & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        Periode:
                    </span>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={e => onStartDateChange(e.target.value)}
                        className="h-7 text-xs w-[125px] bg-white border-slate-200"
                    />
                    <span className="text-slate-400 text-[11px]">s/d</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={e => onEndDateChange(e.target.value)}
                        className="h-7 text-xs w-[125px] bg-white border-slate-200"
                    />

                    <div className="flex items-center gap-1 ml-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onSetThisMonth}
                            className="h-6 text-[11px] px-2 text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded"
                        >
                            Bulan Ini
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onSetLastMonth}
                            className="h-6 text-[11px] px-2 text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded"
                        >
                            Bulan Lalu
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onSetThisYear}
                            className="h-6 text-[11px] px-2 text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded"
                        >
                            Tahun Ini
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isFiltered && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onResetFilters}
                            className="h-6 text-[11px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 cursor-pointer"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Reset Filter
                        </Button>
                    )}
                    <span className="text-[11px] text-slate-500 font-mono">
                        {filteredCount} Unit Terpantau
                    </span>
                </div>
            </div>
        </div>
    )
}
