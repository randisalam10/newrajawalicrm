"use client"

import React, { useState, useEffect, useTransition, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import {
    Truck, Fuel, DollarSign, Building2, Tag,
    Search, RefreshCw, Printer, FileSpreadsheet, Layers,
    ChevronRight, X, RotateCcw, Calendar, Gauge, ExternalLink,
    Filter, ArrowUpDown, Wrench, AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, subMonths } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"
import { getVehicleReportData } from "../../rbl/actions"

const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n || 0))
const fmtNum = (n: number, decimals: number = 0) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: decimals }).format(n || 0)
const fmtDate = (d: any) => d ? format(new Date(d), "dd/MM/yyyy", { locale: idLocale }) : "-"

const getCategoryBadgeClass = (name: string = "") => {
    const lower = name.toLowerCase()
    if (lower.includes("mixer")) return "bg-blue-50 text-blue-700 border-blue-200"
    if (lower.includes("loader")) return "bg-orange-50 text-orange-700 border-orange-200"
    if (lower.includes("dump")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
    if (lower.includes("pump")) return "bg-sky-50 text-sky-700 border-sky-200"
    if (lower.includes("operasional") || lower.includes("mobil")) return "bg-teal-50 text-teal-700 border-teal-200"
    if (lower.includes("genset") || lower.includes("berat")) return "bg-slate-100 text-slate-700 border-slate-200"
    if (lower.includes("motor")) return "bg-cyan-50 text-cyan-700 border-cyan-200"
    return "bg-indigo-50 text-indigo-700 border-indigo-200"
}

interface VehicleReportClientProps {
    initialVehicles: any[]
    categories?: any[]
    locations: any[]
    userLocationId?: string
    isSuperAdmin?: boolean
}

export function VehicleReportClient({
    initialVehicles = [],
    categories = [],
    locations = [],
    userLocationId = "",
    isSuperAdmin = false,
}: VehicleReportClientProps) {
    const [isPending, startTransition] = useTransition()

    // Filters
    const [selectedLocation, setSelectedLocation] = useState<string>(isSuperAdmin ? "all" : (userLocationId || "all"))
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    // Date range: Default to current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
    const [startDate, setStartDate] = useState(firstDay)
    const [endDate, setEndDate] = useState(lastDay)

    // Data from server action
    const [reportData, setReportData] = useState<any>(null)
    const [activeDetailTab, setActiveDetailTab] = useState<string>("expenses")

    const loadData = () => {
        startTransition(async () => {
            const res = await getVehicleReportData({
                locationId: selectedLocation,
                vehicleId: selectedVehicleId,
                categoryId: selectedCategoryId,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            })

            if (res.success) {
                setReportData(res)
            } else {
                toast.error(res.error || "Gagal memuat data laporan kendaraan.")
            }
        })
    }

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        loadData()
    }, [selectedLocation, selectedCategoryId, selectedVehicleId, startDate, endDate])

    const activeLocationName = useMemo(() => {
        if (selectedLocation === "all") return "Semua Cabang"
        const found = locations.find(l => l.id === selectedLocation)
        return found?.name || "Cabang"
    }, [selectedLocation, locations])

    const vehicleAnalytics = reportData?.vehicleAnalytics || []
    const overall = reportData?.overallSummary || {}

    // Available vehicles for selector filtered by location & category
    const availableVehicles = useMemo(() => {
        return initialVehicles.filter(v => {
            const matchLoc = selectedLocation === "all" || v.locationId === selectedLocation
            const matchCat = selectedCategoryId === "all" || v.categoryId === selectedCategoryId ||
                (v.category?.name && v.category.name.toLowerCase() === selectedCategoryId.toLowerCase())
            return matchLoc && matchCat
        })
    }, [initialVehicles, selectedLocation, selectedCategoryId])

    // Filter analytics by search
    const filteredAnalytics = useMemo(() => {
        if (!searchQuery.trim()) return vehicleAnalytics
        const q = searchQuery.toLowerCase()
        return vehicleAnalytics.filter((va: any) => {
            const v = va.vehicle
            const catName = (v.category?.name || v.vehicle_type || "").toLowerCase()
            return (
                v.code.toLowerCase().includes(q) ||
                v.plate_number.toLowerCase().includes(q) ||
                catName.includes(q) ||
                (v.location?.name || "").toLowerCase().includes(q)
            )
        })
    }, [vehicleAnalytics, searchQuery])

    // Selected single vehicle analytics (if specific vehicle is selected)
    const singleVehicleData = useMemo(() => {
        if (selectedVehicleId === "all") return null
        return vehicleAnalytics.find((va: any) => va.vehicle.id === selectedVehicleId) || null
    }, [selectedVehicleId, vehicleAnalytics])

    // Check if any filter has been customized
    const isFiltered = selectedLocation !== (isSuperAdmin ? "all" : (userLocationId || "all")) ||
        selectedCategoryId !== "all" ||
        selectedVehicleId !== "all" ||
        searchQuery.trim() !== "" ||
        startDate !== firstDay ||
        endDate !== lastDay

    const handleResetFilters = () => {
        setSelectedLocation(isSuperAdmin ? "all" : (userLocationId || "all"))
        setSelectedCategoryId("all")
        setSelectedVehicleId("all")
        setSearchQuery("")
        setStartDate(firstDay)
        setEndDate(lastDay)
    }

    // ─── Export CSV ─────────────────────────────────────────────────────────────
    const handleExportCSV = () => {
        if (!vehicleAnalytics || vehicleAnalytics.length === 0) {
            toast.error("Tidak ada data armada untuk diekspor.")
            return
        }

        const headers = [
            "No",
            "Kode Unit",
            "No. Plat",
            "Kategori Kendaraan",
            "Tipe Produksi",
            "Unit Sewa",
            "Cabang Pangkalan",
            "Total Solar (Liter)",
            "Biaya Solar (Rp)",
            "Biaya Pelumas/Oli (Rp)",
            "Biaya Lain-lain (Rp)",
            "Total Biaya RBL (Rp)",
            "Biaya Sparepart PO (Rp)",
            "Grand Total TCO (Rp)",
            "Pendapatan Sewa (Rp)",
            "Profit Bersih Unit (Rp)",
            "KM Awal",
            "KM Akhir",
            "Jarak Tempuh (KM)",
            "Total Ritase",
            "Total Volume Cor (m3)",
            "Konsumsi BBM / m3 (L/m3)",
            "Biaya / Ritase (Rp)",
            "Biaya / m3 (Rp)"
        ]

        const rows = vehicleAnalytics.map((va: any, idx: number) => {
            const v = va.vehicle
            const s = va.stats
            const categoryName = v.category?.name || v.vehicle_type || "-"
            return [
                idx + 1,
                `"${v.code}"`,
                `"${v.plate_number}"`,
                `"${categoryName}"`,
                `"${v.vehicle_type}"`,
                `"${v.is_for_rent ? "Ya (Sewa)" : "Operasional"}"`,
                `"${v.location?.name || "-"}"`,
                s.fuelLiters,
                s.fuelCost,
                s.lubricantCost,
                s.otherCost,
                s.totalCost,
                s.sparepartCost || 0,
                s.grandTotalCost || s.totalCost,
                s.rentalRevenue || 0,
                s.netProfit || 0,
                s.minKm ?? "-",
                s.maxKm ?? "-",
                s.kmDistance,
                s.totalTrips,
                s.totalVolume,
                s.fuelPerCubic > 0 ? s.fuelPerCubic.toFixed(2) : "-",
                Math.round(s.costPerTrip),
                Math.round(s.costPerCubic)
            ]
        })

        const csvContent = "\uFEFF" + [
            `"LAPORAN REKAPITULASI KENDARAAN & OPERASIONAL ARMADA"`,
            `"Cabang: ${activeLocationName}"`,
            `"Periode: ${startDate ? fmtDate(startDate) : "Awal"} s/d ${endDate ? fmtDate(endDate) : "Sekarang"}"`,
            `"Tanggal Cetak: ${format(new Date(), "dd/MM/yyyy HH:mm")}"`,
            "",
            headers.join(","),
            ...rows.map((r: any) => r.join(","))
        ].join("\r\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", `Laporan_Armada_${format(new Date(), "yyyyMMdd")}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success("File rekap armada Excel/CSV berhasil diunduh.")
    }

    return (
        <div className="space-y-3.5">
            {/* ─── Printable Letterhead ─────────────────────────────────────────── */}
            <div className="hidden print:block mb-4 border-b pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">PT RAJAWALI ANUGRAH READYMIX</h1>
                        <p className="text-xs text-slate-600">Laporan Monitoring Operasional & Efisiensi Armada Kendaraan</p>
                    </div>
                    <div className="text-right text-xs text-slate-500" suppressHydrationWarning>
                        <div suppressHydrationWarning>Tanggal: {mounted ? format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale }) : ""}</div>
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
                        {availableVehicles.length} Armada Terdaftar
                    </span>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loadData}
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
                        onClick={handleExportCSV}
                        className="h-7 text-xs px-3 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer font-medium"
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Ekspor Excel / CSV</span>
                    </Button>
                </div>
            </div>

            {/* ─── Unified High-Density Filter Toolbar ─────────────────────────── */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-2.5 sm:p-3 space-y-2 print:hidden">
                {/* Row 1: Selectors & Search */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {/* Cabang */}
                    <div className="relative">
                        <Select
                            value={selectedLocation}
                            onValueChange={(val) => {
                                setSelectedLocation(val)
                                setSelectedVehicleId("all")
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
                                setSelectedCategoryId(val)
                                setSelectedVehicleId("all")
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
                            onValueChange={setSelectedVehicleId}
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
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Cari kode unit, plat, jenis..."
                            className="h-8 text-xs bg-slate-50/70 pl-8 pr-7 border-slate-200"
                        />
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
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
                            onChange={e => setStartDate(e.target.value)}
                            className="h-7 text-xs w-[125px] bg-white border-slate-200"
                        />
                        <span className="text-slate-400 text-[11px]">s/d</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="h-7 text-xs w-[125px] bg-white border-slate-200"
                        />

                        <div className="flex items-center gap-1 ml-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const d = new Date()
                                    setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0])
                                    setEndDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0])
                                }}
                                className="h-6 text-[11px] px-2 text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded"
                            >
                                Bulan Ini
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const prev = subMonths(new Date(), 1)
                                    setStartDate(new Date(prev.getFullYear(), prev.getMonth(), 1).toISOString().split("T")[0])
                                    setEndDate(new Date(prev.getFullYear(), prev.getMonth() + 1, 0).toISOString().split("T")[0])
                                }}
                                className="h-6 text-[11px] px-2 text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded"
                            >
                                Bulan Lalu
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const d = new Date()
                                    setStartDate(`${d.getFullYear()}-01-01`)
                                    setEndDate(`${d.getFullYear()}-12-31`)
                                }}
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
                                onClick={handleResetFilters}
                                className="h-6 text-[11px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 cursor-pointer"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Reset Filter
                            </Button>
                        )}
                        <span className="text-[11px] text-slate-500 font-mono">
                            {filteredAnalytics.length} Unit Terpantau
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── Sleek Executive Summary Grid (Unified Card) ────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x border border-slate-200 bg-white rounded-lg shadow-2xs overflow-hidden">
                {/* 1. Total Armada & Alat */}
                <div className="p-3 sm:p-3.5 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                        <Truck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Total Armada & Alat
                        </div>
                        <div className="text-base sm:text-lg font-bold text-slate-900 font-mono leading-tight mt-0.5">
                            {overall.totalVehicles || 0}
                            <span className="text-xs font-normal text-slate-500 ml-1">Unit</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            📍 {activeLocationName}
                        </div>
                    </div>
                </div>

                {/* 2. Konsumsi BBM */}
                <div className="p-3 sm:p-3.5 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                        <Fuel className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Konsumsi BBM / Solar
                        </div>
                        <div className="text-base sm:text-lg font-bold text-amber-700 font-mono leading-tight mt-0.5">
                            {fmtNum(overall.totalFuelLiters || 0)}
                            <span className="text-xs font-normal text-slate-500 ml-1">Liter</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            Biaya: <span className="font-semibold text-slate-700">{fmt(overall.totalFuelCost || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Ritase & Volume Cor */}
                <div className="p-3 sm:p-3.5 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                        <Layers className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Ritase & Volume Cor
                        </div>
                        <div className="text-base sm:text-lg font-bold text-indigo-700 font-mono leading-tight mt-0.5">
                            {overall.totalTrips || 0}
                            <span className="text-xs font-normal text-slate-500 ml-1">Rit</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            Volume: <span className="font-semibold text-slate-700">{fmtNum(overall.totalVolume || 0, 1)} m³</span>
                        </div>
                    </div>
                </div>

                {/* 4. Suku Cadang & Alat PO */}
                <div className="p-3 sm:p-3.5 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                        <Wrench className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Suku Cadang & PO
                        </div>
                        <div className="text-base sm:text-lg font-bold text-purple-700 font-mono leading-tight mt-0.5 truncate">
                            {fmt(overall.totalSparepartCost || 0)}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {overall.totalPoItems || 0} Pengadaan item PO
                        </div>
                    </div>
                </div>

                {/* 5. Total Biaya Operasional / TCO */}
                <div className="p-3 sm:p-3.5 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                        <DollarSign className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Total Biaya (TCO)
                        </div>
                        <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono leading-tight mt-0.5 truncate">
                            {fmt(overall.grandTotalCost || overall.totalCost || 0)}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            RBL ({fmt(overall.totalCost || 0)}) + PO
                        </div>
                    </div>
                </div>

                {/* 6. Pendapatan Sewa Unit */}
                <div className="p-3 sm:p-3.5 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                        <Tag className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Pendapatan Sewa
                        </div>
                        <div className="text-base sm:text-lg font-bold text-teal-700 font-mono leading-tight mt-0.5 truncate">
                            {fmt(overall.totalRentalRevenue || 0)}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {overall.totalRentalDays || 0} Hari ({overall.totalSewaCount || 0} Sewa)
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Single Focused Vehicle Inspection View ──────────────────────── */}
            {singleVehicleData && (
                <div className="border border-blue-200 rounded-lg bg-blue-50/20 overflow-hidden shadow-2xs">
                    {/* Header Strip */}
                    <div className="p-3 bg-white border-b border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-2xs shrink-0">
                                <Truck className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="text-base font-bold text-slate-900 font-mono">
                                        {singleVehicleData.vehicle.code}
                                    </h3>
                                    <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                        {singleVehicleData.vehicle.plate_number}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClass(singleVehicleData.vehicle.category?.name || singleVehicleData.vehicle.vehicle_type)}`}>
                                        {singleVehicleData.vehicle.category?.name || singleVehicleData.vehicle.vehicle_type}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {singleVehicleData.vehicle.location?.name || "-"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick metrics in header */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                                <span className="text-[9px] text-slate-500 block uppercase font-medium">Jarak / Jam Tempuh</span>
                                <span className="font-mono font-bold text-slate-900">
                                    {singleVehicleData.stats.kmDistance > 0 ? `${fmtNum(singleVehicleData.stats.kmDistance)} ${(singleVehicleData.vehicle.meter_type || "").toUpperCase() === "HM" ? "HM" : "KM"}` : "-"}
                                </span>
                            </div>
                            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                                <span className="text-[9px] text-slate-500 block uppercase font-medium">Rentang Meter</span>
                                <span className="font-mono font-bold text-slate-900">
                                    {singleVehicleData.stats.minKm !== null && singleVehicleData.stats.maxKm !== null ? `${fmtNum(singleVehicleData.stats.minKm)} - ${fmtNum(singleVehicleData.stats.maxKm)}` : "-"}
                                </span>
                            </div>
                            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                                <span className="text-[9px] text-slate-500 block uppercase font-medium">Solar Terpakai</span>
                                <span className="font-mono font-bold text-amber-700">
                                    {fmtNum(singleVehicleData.stats.fuelLiters)} L
                                </span>
                            </div>
                            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                                <span className="text-[9px] text-slate-500 block uppercase font-medium">Ritase / Volume</span>
                                <span className="font-mono font-bold text-indigo-700">
                                    {singleVehicleData.stats.totalTrips}x ({fmtNum(singleVehicleData.stats.totalVolume, 1)} m³)
                                </span>
                            </div>
                            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                                <span className="text-[9px] text-slate-500 block uppercase font-medium">Total Biaya TCO</span>
                                <span className="font-mono font-bold text-emerald-700">
                                    {fmt(singleVehicleData.stats.grandTotalCost || singleVehicleData.stats.totalCost)}
                                </span>
                            </div>
                            {(singleVehicleData.stats.rentalRevenue > 0 || singleVehicleData.vehicle.is_for_rent) && (
                                <>
                                    <div className="px-2 py-1 bg-teal-50/70 rounded border border-teal-200 text-right">
                                        <span className="text-[9px] text-teal-700 block uppercase font-semibold">Pendapatan Sewa</span>
                                        <span className="font-mono font-bold text-teal-800">
                                            {fmt(singleVehicleData.stats.rentalRevenue || 0)}
                                        </span>
                                    </div>
                                    <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                                        <span className="text-[9px] text-slate-500 block uppercase font-medium">Profit Bersih</span>
                                        <span className={`font-mono font-bold ${(singleVehicleData.stats.netProfit || 0) >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                            {fmt(singleVehicleData.stats.netProfit || 0)}
                                        </span>
                                    </div>
                                </>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedVehicleId("all")}
                                className="h-7 text-xs px-2 gap-1 text-slate-600 hover:text-slate-900 bg-white border-slate-300 ml-1 cursor-pointer"
                            >
                                <X className="h-3.5 w-3.5" />
                                <span>Tutup Detail</span>
                            </Button>
                        </div>
                    </div>

                    {/* Tabs Log */}
                    <div className="p-3 space-y-2.5">
                        <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab}>
                            <TabsList className="bg-slate-100/90 p-0.5 rounded-md h-7">
                                <TabsTrigger value="expenses" className="text-xs h-6 px-2.5 gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-2xs">
                                    <Fuel className="h-3 w-3 text-amber-600" />
                                    <span>Log BBM & Pengeluaran RBL ({singleVehicleData.recentExpenses.length})</span>
                                </TabsTrigger>
                                <TabsTrigger value="trips" className="text-xs h-6 px-2.5 gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-2xs">
                                    <Layers className="h-3 w-3 text-indigo-600" />
                                    <span>Log Pengiriman & Ritase ({singleVehicleData.recentTransactions.length})</span>
                                </TabsTrigger>
                                <TabsTrigger value="spareparts" className="text-xs h-6 px-2.5 gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-2xs">
                                    <Wrench className="h-3 w-3 text-slate-600" />
                                    <span>Suku Cadang & PO ({singleVehicleData.recentPoItems?.length || 0})</span>
                                </TabsTrigger>
                                <TabsTrigger value="meter" className="text-xs h-6 px-2.5 gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-2xs">
                                    <Gauge className="h-3 w-3 text-slate-700" />
                                    <span>Audit Meter (RBL + PO) ({singleVehicleData.meterEvents?.length || 0})</span>
                                    {singleVehicleData.stats.hasBackdateAnomaly && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-300 ml-1">
                                            Backdate!
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="sewa" className="text-xs h-6 px-2.5 gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-2xs">
                                    <Tag className="h-3 w-3 text-teal-600" />
                                    <span>Log Sewa & Pendapatan ({singleVehicleData.recentSewaTransactions?.length || 0})</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB 1: Expenses Log */}
                            <TabsContent value="expenses" className="mt-2">
                                <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50/80 text-[11px]">
                                            <TableRow className="h-7">
                                                <TableHead className="w-9 text-center">#</TableHead>
                                                <TableHead className="w-24">Tanggal</TableHead>
                                                <TableHead className="w-28">No. Bukti / Ref</TableHead>
                                                <TableHead className="w-28">Kategori</TableHead>
                                                <TableHead>Uraian Kebutuhan</TableHead>
                                                <TableHead className="text-right w-24">KM Odometer</TableHead>
                                                <TableHead className="text-right w-20">Qty</TableHead>
                                                <TableHead className="text-right w-24">Harga (Rp)</TableHead>
                                                <TableHead className="text-right w-28 font-bold">Total (Rp)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="text-xs">
                                            {singleVehicleData.recentExpenses.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="py-6 text-center text-slate-400 italic">
                                                        Belum ada log transaksi pengeluaran RBL untuk armada ini pada periode yang dipilih.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                singleVehicleData.recentExpenses.map((exp: any, idx: number) => (
                                                    <TableRow key={exp.id} className="h-8 hover:bg-slate-50/70">
                                                        <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                                            {idx + 1}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-slate-700 py-1">
                                                            {fmtDate(exp.date)}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-slate-600 text-[11px] py-1">
                                                            {exp.receiptNo || "-"}
                                                        </TableCell>
                                                        <TableCell className="py-1">
                                                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                                {exp.categoryRef?.name || exp.category || "-"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="font-medium text-slate-900 py-1">
                                                            {exp.itemDescription}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-slate-700 py-1 font-semibold">
                                                            {exp.kmMeter !== null && exp.kmMeter !== undefined ? exp.kmMeter.toLocaleString("id-ID") : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-medium py-1">
                                                            {exp.quantity ? `${exp.quantity} ${exp.unit || ""}` : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-slate-600 py-1">
                                                            {exp.unitPrice ? fmt(exp.unitPrice) : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-slate-900 py-1">
                                                            {fmt(exp.amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                        {singleVehicleData.recentExpenses.length > 0 && (
                                            <TableFooter className="bg-slate-50/80 font-semibold text-xs">
                                                <TableRow className="h-8">
                                                    <TableCell colSpan={6} className="text-right text-slate-600">
                                                        Total Pengeluaran:
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-amber-700">
                                                        {fmtNum(singleVehicleData.stats.fuelLiters)} L
                                                    </TableCell>
                                                    <TableCell className="text-right"></TableCell>
                                                    <TableCell className="text-right font-mono text-emerald-700 font-bold">
                                                        {fmt(singleVehicleData.stats.totalCost)}
                                                    </TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        )}
                                    </Table>
                                </div>
                            </TabsContent>

                            {/* TAB 2: Trips Log */}
                            <TabsContent value="trips" className="mt-2">
                                <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50/80 text-[11px]">
                                            <TableRow className="h-7">
                                                <TableHead className="w-9 text-center">#</TableHead>
                                                <TableHead className="w-24">Tanggal</TableHead>
                                                <TableHead className="w-16 text-center">Rit Ke</TableHead>
                                                <TableHead>Proyek</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Mutu Beton</TableHead>
                                                <TableHead className="text-right w-24">Volume (m³)</TableHead>
                                                <TableHead>Supir</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="text-xs">
                                            {singleVehicleData.recentTransactions.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="py-6 text-center text-slate-400 italic">
                                                        Belum ada catatan pengiriman beton oleh unit ini pada periode yang dipilih.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                singleVehicleData.recentTransactions.map((tx: any, idx: number) => (
                                                    <TableRow key={tx.id} className="h-8 hover:bg-slate-50/70">
                                                        <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                                            {idx + 1}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-slate-700 py-1">
                                                            {fmtDate(tx.date)}
                                                        </TableCell>
                                                        <TableCell className="text-center font-mono font-bold text-slate-800 py-1">
                                                            #{tx.trip_sequence}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-slate-900 py-1">
                                                            {tx.project?.name || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-slate-600 py-1">
                                                            {tx.project?.customer?.customer_name || "-"}
                                                        </TableCell>
                                                        <TableCell className="py-1">
                                                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-100">
                                                                {tx.concreteQuality?.name || "-"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-blue-700 py-1">
                                                            {tx.volume_cubic ? `${tx.volume_cubic} m³` : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-slate-700 py-1">
                                                            {tx.driver?.name || "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                        {singleVehicleData.recentTransactions.length > 0 && (
                                            <TableFooter className="bg-slate-50/80 font-semibold text-xs">
                                                <TableRow className="h-8">
                                                    <TableCell colSpan={6} className="text-right text-slate-600">
                                                        Total Ritase & Volume:
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-blue-700 font-bold">
                                                        {fmtNum(singleVehicleData.stats.totalVolume, 1)} m³
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 font-normal text-[11px]">
                                                        {singleVehicleData.stats.totalTrips} Ritase
                                                    </TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        )}
                                    </Table>
                                </div>
                            </TabsContent>

                            {/* TAB 3: PO Spareparts & Equipment Log */}
                            <TabsContent value="spareparts" className="mt-2">
                                <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50/80 text-[11px]">
                                            <TableRow className="h-7">
                                                <TableHead className="w-9 text-center">#</TableHead>
                                                <TableHead className="w-24">Tanggal PO</TableHead>
                                                <TableHead className="w-28">No. PO</TableHead>
                                                <TableHead className="w-32">Supplier</TableHead>
                                                <TableHead>Nama Suku Cadang / Barang</TableHead>
                                                <TableHead className="w-28">Part No / Merk</TableHead>
                                                <TableHead className="text-center w-24">KM / HM</TableHead>
                                                <TableHead className="text-right w-16">Qty</TableHead>
                                                <TableHead className="w-16">Satuan</TableHead>
                                                <TableHead className="text-right w-24">Harga (Rp)</TableHead>
                                                <TableHead className="text-right w-28 font-bold">Total (Rp)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="text-xs">
                                            {(!singleVehicleData.recentPoItems || singleVehicleData.recentPoItems.length === 0) ? (
                                                <TableRow>
                                                    <TableCell colSpan={11} className="py-6 text-center text-slate-400 italic">
                                                        Belum ada riwayat pembelian suku cadang / sparepart melalui PO untuk unit ini pada periode yang dipilih.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                singleVehicleData.recentPoItems.map((item: any, idx: number) => {
                                                    const itemSubtotal = item.subtotal || ((item.harga_satuan || 0) * (item.quantity || 0))
                                                    return (
                                                        <TableRow key={item.id} className="h-8 hover:bg-slate-50/70">
                                                            <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                                                {idx + 1}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-slate-700 py-1">
                                                                {fmtDate(item.purchaseOrder?.tanggal_terbit)}
                                                            </TableCell>
                                                            <TableCell className="font-mono font-semibold text-blue-700 py-1 text-[11px]">
                                                                <div>{item.purchaseOrder?.po_number || "-"}</div>
                                                                {item.purchaseOrder?.status && (
                                                                    <span className={`inline-block px-1 py-0.2 rounded text-[9px] font-semibold border mt-0.5 ${
                                                                        item.purchaseOrder.status === 'APPROVED' 
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    }`}>
                                                                        {item.purchaseOrder.status === 'APPROVED' ? 'Disetujui' : 'Menunggu Approval'}
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-slate-600 py-1 truncate max-w-[130px]">
                                                                {item.supplierName || item.purchaseOrder?.supplier?.name || "-"}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-slate-900 py-1">
                                                                {item.masterItem?.name || "-"}
                                                            </TableCell>
                                                            <TableCell className="text-slate-500 py-1 text-[11px]">
                                                                {[item.masterItem?.merk, item.masterItem?.part_number].filter(Boolean).join(" / ") || "-"}
                                                            </TableCell>
                                                            <TableCell className="text-center font-mono py-1">
                                                                {item.km_hm ? (
                                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px]">
                                                                        {item.km_hm}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono font-bold text-slate-900 py-1">
                                                                {item.quantity}
                                                            </TableCell>
                                                            <TableCell className="text-slate-600 py-1 text-[11px]">
                                                                {item.masterItem?.satuan || "PCS"}
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono text-slate-600 py-1">
                                                                {fmt(item.harga_satuan)}
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono font-bold text-slate-900 py-1">
                                                                {fmt(itemSubtotal)}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })
                                            )}
                                        </TableBody>
                                        {singleVehicleData.recentPoItems && singleVehicleData.recentPoItems.length > 0 && (
                                            <TableFooter className="bg-slate-50/80 font-semibold text-xs">
                                                <TableRow className="h-8">
                                                    <TableCell colSpan={10} className="text-right text-slate-600">
                                                        Total Biaya Suku Cadang (PO):
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-slate-900 font-bold">
                                                        {fmt(singleVehicleData.stats.sparepartCost || 0)}
                                                    </TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        )}
                                    </Table>
                                </div>
                            </TabsContent>

                            {/* TAB 4: Sewa & Pendapatan Log */}
                            <TabsContent value="sewa" className="mt-2">
                                <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50/80 text-[11px]">
                                            <TableRow className="h-7">
                                                <TableHead className="w-9 text-center">#</TableHead>
                                                <TableHead className="w-24">Tanggal</TableHead>
                                                <TableHead className="w-32">No. Surat Jalan</TableHead>
                                                <TableHead>Penyewa / Customer</TableHead>
                                                <TableHead>Lokasi Kerja</TableHead>
                                                <TableHead className="w-28">Operator</TableHead>
                                                <TableHead className="text-center w-20">Durasi</TableHead>
                                                <TableHead className="text-right w-24">Tarif/Hari</TableHead>
                                                <TableHead className="text-right w-28 font-bold text-teal-800">Total Sewa</TableHead>
                                                <TableHead className="w-20 text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="text-xs">
                                            {(!singleVehicleData.recentSewaTransactions || singleVehicleData.recentSewaTransactions.length === 0) ? (
                                                <TableRow>
                                                    <TableCell colSpan={10} className="py-6 text-center text-slate-400 italic">
                                                        Belum ada riwayat transaksi penyewaan untuk unit ini pada periode yang dipilih.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                singleVehicleData.recentSewaTransactions.map((item: any, idx: number) => (
                                                    <TableRow key={item.id} className="h-8 hover:bg-slate-50/70">
                                                        <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                                            {idx + 1}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-slate-700 py-1">
                                                            {fmtDate(item.date)}
                                                        </TableCell>
                                                        <TableCell className="font-mono font-semibold text-blue-700 py-1 text-[11px]">
                                                            {item.sewa_number}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-slate-900 py-1">
                                                            {item.customer?.customer_name || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-slate-500 py-1 truncate max-w-[150px]">
                                                            {item.lokasi_proyek || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-slate-700 py-1">
                                                            {item.operator?.name || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold text-blue-700 py-1">
                                                            {item.total_days} Hari
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-slate-600 py-1">
                                                            {fmt(item.price_per_day)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-teal-700 py-1">
                                                            {fmt(item.total_price)}
                                                        </TableCell>
                                                        <TableCell className="text-center py-1">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                                                item.status === 'Completed'
                                                                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                                                                    : item.status === 'Active'
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                                            }`}>
                                                                {item.status === 'Active' ? 'Aktif' : item.status === 'Completed' ? 'Selesai' : item.status}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                        {singleVehicleData.recentSewaTransactions && singleVehicleData.recentSewaTransactions.length > 0 && (
                                            <TableFooter className="bg-slate-50/80 font-semibold text-xs">
                                                <TableRow className="h-8">
                                                    <TableCell colSpan={8} className="text-right text-slate-600">
                                                        Total Pendapatan Sewa:
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-teal-700 font-bold">
                                                        {fmt(singleVehicleData.stats.rentalRevenue || 0)}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        )}
                                    </Table>
                                </div>
                            </TabsContent>

                            {/* TAB 5: Unified Meter Audit Trail (RBL + PO) */}
                            <TabsContent value="meter" className="mt-2">
                                <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50/80 text-[11px]">
                                            <TableRow className="h-7">
                                                <TableHead className="w-9 text-center">#</TableHead>
                                                <TableHead className="w-24">Tanggal</TableHead>
                                                <TableHead className="w-28">Sumber</TableHead>
                                                <TableHead className="w-28">No. Referensi</TableHead>
                                                <TableHead>Keterangan Transaksi</TableHead>
                                                <TableHead className="text-right w-28">Nilai Meter ({(singleVehicleData.vehicle.meter_type || "").toUpperCase() === "HM" ? "HM" : "KM"})</TableHead>
                                                <TableHead className="text-right w-24">Selisih (Δ)</TableHead>
                                                <TableHead className="w-28 text-center">Status Urutan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="text-xs">
                                            {(!singleVehicleData.meterEvents || singleVehicleData.meterEvents.length === 0) ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="py-6 text-center text-slate-400 italic">
                                                        Belum ada catatan pembacaan meter (KM/HM) dari transaksi RBL ataupun PO untuk unit ini.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                singleVehicleData.meterEvents.map((evt: any, idx: number) => {
                                                    const prevEvt = idx > 0 ? singleVehicleData.meterEvents[idx - 1] : null
                                                    const delta = prevEvt ? evt.meter - prevEvt.meter : 0
                                                    return (
                                                        <TableRow key={evt.id} className={cn("h-8 hover:bg-slate-50/70", evt.isBackdateAnomaly && "bg-rose-50/40")}>
                                                            <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                                                {idx + 1}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-slate-700 py-1">
                                                                {fmtDate(evt.date)}
                                                            </TableCell>
                                                            <TableCell className="py-1">
                                                                <span className={cn(
                                                                    "inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border",
                                                                    evt.type === "RBL" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-800 border-blue-200"
                                                                )}>
                                                                    {evt.type === "RBL" ? "RBL BBM/Operasional" : "PO Suku Cadang"}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-slate-600 text-[11px] py-1">
                                                                {evt.referenceNo}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-slate-900 py-1">
                                                                {evt.description}
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono font-bold text-slate-900 py-1">
                                                                {fmtNum(evt.meter)}
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono py-1">
                                                                {prevEvt ? (
                                                                    <span className={cn("font-semibold text-[11px]", delta >= 0 ? "text-emerald-700" : "text-rose-600 font-bold")}>
                                                                        {delta >= 0 ? `+${fmtNum(delta)}` : fmtNum(delta)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 text-[11px]">Awal</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center py-1">
                                                                {evt.isBackdateAnomaly ? (
                                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                                                        ⚠️ Backdate
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                        Normal
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            )}

            {/* ─── Master Fleet Summary Table ─────────────────────────────────── */}
            <div className="border border-slate-200 rounded-lg bg-white shadow-2xs overflow-hidden print:border-none print:shadow-none">
                <div className="p-2.5 sm:px-3.5 sm:py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-row items-center justify-between gap-2">
                    <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-blue-600" />
                            <span>Rekapitulasi Performa Seluruh Armada ({filteredAnalytics.length} Unit)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 hidden sm:block">
                            Klik baris armada untuk melihat rincian log operasional, BBM, dan ritase secara mendalam.
                        </p>
                    </div>
                    {selectedVehicleId !== "all" && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVehicleId("all")}
                            className="h-6 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 cursor-pointer"
                        >
                            Tampilkan Semua
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80 text-[11px]">
                            <TableRow className="h-7">
                                <TableHead className="w-9 text-center">#</TableHead>
                                <TableHead className="w-24">Kode Unit</TableHead>
                                <TableHead className="w-28">No. Plat / Seri</TableHead>
                                <TableHead className="w-36">Kategori Kendaraan / Alat</TableHead>
                                <TableHead className="w-16 text-center">Meter</TableHead>
                                <TableHead className="w-28">Cabang</TableHead>
                                <TableHead className="text-right w-20">Solar (L)</TableHead>
                                <TableHead className="text-right w-24">Biaya BBM</TableHead>
                                <TableHead className="text-right w-24">Biaya RBL</TableHead>
                                <TableHead className="text-right w-28 text-slate-700 font-semibold">Suku Cadang (PO)</TableHead>
                                <TableHead className="text-right w-28 font-bold text-emerald-800">Total Biaya (TCO)</TableHead>
                                <TableHead className="text-right w-28 text-teal-700 font-semibold">Pendapatan Sewa</TableHead>
                                <TableHead className="text-right w-28 font-bold text-slate-800">Profit Bersih</TableHead>
                                <TableHead className="text-right w-24">KM / HM Range</TableHead>
                                <TableHead className="text-right w-24">Jarak / Jam</TableHead>
                                <TableHead className="text-right w-16">Rit</TableHead>
                                <TableHead className="text-right w-20">Volume (m³)</TableHead>
                                <TableHead className="text-right w-16">L/m³</TableHead>
                                <TableHead className="w-8 text-center"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {filteredAnalytics.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={19} className="py-8 text-center text-slate-400 italic">
                                        Tidak ada data armada yang sesuai dengan kriteria filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAnalytics.map((va: any, idx: number) => {
                                    const v = va.vehicle
                                    const s = va.stats
                                    const isSelected = selectedVehicleId === v.id
                                    const categoryName = v.category?.name || v.vehicle_type
                                    const isHM = (v.meter_type || "").toUpperCase() === "HM"

                                    return (
                                        <TableRow
                                            key={v.id}
                                            onClick={() => setSelectedVehicleId(isSelected ? "all" : v.id)}
                                            className={`cursor-pointer transition-colors h-8 ${
                                                isSelected
                                                    ? "bg-blue-50/90 hover:bg-blue-50 font-medium"
                                                    : "hover:bg-slate-50/70"
                                            }`}
                                        >
                                            <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-900 font-mono py-1">
                                                {v.code}
                                            </TableCell>
                                            <TableCell className="font-mono text-slate-700 py-1">
                                                {v.plate_number}
                                            </TableCell>
                                            <TableCell className="py-1">
                                                <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClass(categoryName)}`}>
                                                    {categoryName}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center py-1">
                                                <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold border ${
                                                    isHM 
                                                        ? "bg-amber-50 text-amber-800 border-amber-300" 
                                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                                }`}>
                                                    {isHM ? "HM" : "KM"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-600 py-1 truncate max-w-[120px]">
                                                {v.location?.name || "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-amber-800 py-1">
                                                {s.fuelLiters > 0 ? `${fmtNum(s.fuelLiters)} L` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-700 py-1">
                                                {s.fuelCost > 0 ? fmt(s.fuelCost) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-800 py-1">
                                                {fmt(s.totalCost)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-900 font-semibold py-1">
                                                {s.sparepartCost > 0 ? fmt(s.sparepartCost) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-emerald-700 py-1">
                                                {fmt(s.grandTotalCost || s.totalCost)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-teal-700 font-semibold py-1">
                                                {s.rentalRevenue > 0 ? (
                                                     <div>
                                                         <div>{fmt(s.rentalRevenue)}</div>
                                                         <div className="text-[10px] text-slate-400 font-normal">{s.rentalDays} Hari</div>
                                                     </div>
                                                 ) : v.is_for_rent ? (
                                                     <span className="text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                         Unit Sewa
                                                     </span>
                                                 ) : "-"}
                                            </TableCell>
                                            <TableCell className={`text-right font-mono font-bold py-1 ${
                                                v.is_for_rent || s.rentalRevenue > 0
                                                    ? (s.netProfit >= 0 ? "text-emerald-700" : "text-rose-600")
                                                    : "text-slate-400 font-normal"
                                            }`}>
                                                {v.is_for_rent || s.rentalRevenue > 0 ? fmt(s.netProfit) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-[11px] text-slate-500 py-1">
                                                {s.minKm !== null && s.maxKm !== null ? `${fmtNum(s.minKm)} - ${fmtNum(s.maxKm)}` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-blue-700 font-semibold py-1">
                                                {s.kmDistance > 0 ? `${fmtNum(s.kmDistance)} ${isHM ? "HM" : "KM"}` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono py-1">
                                                {s.totalTrips > 0 ? `${s.totalTrips}x` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-slate-800 py-1">
                                                {s.totalVolume > 0 ? `${fmtNum(s.totalVolume, 1)} m³` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-amber-700 font-semibold py-1">
                                                {s.fuelPerCubic > 0 ? s.fuelPerCubic.toFixed(2) : "-"}
                                            </TableCell>
                                            <TableCell className="text-center text-slate-400 py-1">
                                                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isSelected ? "rotate-90 text-blue-600" : ""}`} />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                        {filteredAnalytics.length > 0 && (
                            <TableFooter className="bg-slate-50/90 font-semibold text-xs">
                                <TableRow className="h-8">
                                    <TableCell colSpan={6} className="text-right text-slate-700">
                                        Total Rekapitulasi ({filteredAnalytics.length} Unit):
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-amber-800 font-bold">
                                        {fmtNum(filteredAnalytics.reduce((s: number, va: any) => s + va.stats.fuelLiters, 0))} L
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-slate-800">
                                        {fmt(filteredAnalytics.reduce((s: number, va: any) => s + va.stats.fuelCost, 0))}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-slate-800">
                                        {fmt(filteredAnalytics.reduce((s: number, va: any) => s + va.stats.totalCost, 0))}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-slate-900 font-bold">
                                        {fmt(filteredAnalytics.reduce((s: number, va: any) => s + (va.stats.sparepartCost || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-emerald-700">
                                        {fmt(filteredAnalytics.reduce((s: number, va: any) => s + (va.stats.grandTotalCost || va.stats.totalCost), 0))}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-teal-700 font-bold">
                                        {fmt(filteredAnalytics.reduce((s: number, va: any) => s + (va.stats.rentalRevenue || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-slate-900">
                                        {fmt(filteredAnalytics.reduce((s: number, va: any) => s + (va.stats.netProfit || 0), 0))}
                                    </TableCell>
                                    <TableCell></TableCell>
                                    <TableCell className="text-right font-mono text-blue-700 font-bold">
                                        {fmtNum(filteredAnalytics.reduce((s: number, va: any) => s + va.stats.kmDistance, 0))}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {filteredAnalytics.reduce((s: number, va: any) => s + va.stats.totalTrips, 0)}x
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-slate-800 font-bold">
                                        {fmtNum(filteredAnalytics.reduce((s: number, va: any) => s + va.stats.totalVolume, 0), 1)} m³
                                    </TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </div>
            </div>
        </div>
    )
}
