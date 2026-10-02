"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Calendar, Filter, RotateCcw, Building2, User, Loader2 } from "lucide-react"

interface BillingFilterBarProps {
    locations: any[]
    selectedLocation: string
    onLocationChange: (locId: string) => void
    customerOptions: { value: string; label: string }[]
    selectedCustomerId: string
    onCustomerChange: (custId: string) => void
    startDate: string
    endDate: string
    onDateChange: (start: string, end: string) => void
    onApply: () => void
    onReset: () => void
    isLoading: boolean
    isCorporate: boolean
}

export function BillingFilterBar({
    locations,
    selectedLocation,
    onLocationChange,
    customerOptions,
    selectedCustomerId,
    onCustomerChange,
    startDate,
    endDate,
    onDateChange,
    onApply,
    onReset,
    isLoading,
    isCorporate,
}: BillingFilterBarProps) {
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    const firstOfYear = `${now.getFullYear()}-01-01`

    const isFiltered = Boolean(
        (selectedLocation && selectedLocation !== "all") ||
        (selectedCustomerId && selectedCustomerId !== "all") ||
        startDate ||
        endDate
    )

    return (
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-50 text-blue-600 rounded-md">
                        <Filter className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Filter Tagihan & Laporan Periode
                    </span>
                    {isFiltered && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                            Filter Aktif
                        </span>
                    )}
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1 text-xs">
                    <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">Preset:</span>
                    <button
                        type="button"
                        onClick={() => onDateChange(today, today)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${startDate === today && endDate === today ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"}`}
                    >
                        Hari Ini
                    </button>
                    <button
                        type="button"
                        onClick={() => onDateChange(firstOfMonth, today)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${startDate === firstOfMonth && endDate === today ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"}`}
                    >
                        Bulan Ini
                    </button>
                    <button
                        type="button"
                        onClick={() => onDateChange(firstOfYear, today)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${startDate === firstOfYear && endDate === today ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"}`}
                    >
                        Tahun Ini
                    </button>
                    <button
                        type="button"
                        onClick={() => onDateChange("", "")}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${!startDate && !endDate ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"}`}
                    >
                        Semua Waktu
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                {/* Cabang Filter (SuperAdmin / Corporate) */}
                {isCorporate && (
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Cabang BP</span>
                        </Label>
                        <Select value={selectedLocation} onValueChange={onLocationChange}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Pilih Cabang..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang</SelectItem>
                                {locations.map((l: any) => (
                                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Customer Filter */}
                <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pelanggan / Customer</span>
                    </Label>
                    <Select value={selectedCustomerId} onValueChange={onCustomerChange}>
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Semua Customer..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                            <SelectItem value="all">Semua Customer</SelectItem>
                            {customerOptions.map(c => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Tanggal Dari */}
                <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Dari Tanggal</span>
                    </Label>
                    <Input
                        type="date"
                        className="h-9 text-xs"
                        value={startDate}
                        onChange={e => onDateChange(e.target.value, endDate)}
                    />
                </div>

                {/* Tanggal Sampai */}
                <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sampai Tanggal</span>
                    </Label>
                    <Input
                        type="date"
                        className="h-9 text-xs"
                        value={endDate}
                        onChange={e => onDateChange(startDate, e.target.value)}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        onClick={onApply}
                        disabled={isLoading}
                        className="h-9 flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-xs"
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />}
                        <span>Terapkan</span>
                    </Button>
                    {isFiltered && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onReset}
                            disabled={isLoading}
                            className="h-9 px-2.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                            title="Reset semua filter"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
