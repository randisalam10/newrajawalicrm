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
    Layers, Truck, DollarSign, Building2, Search, RefreshCw,
    Printer, FileSpreadsheet, Calendar, ArrowUpRight, ArrowDownLeft,
    TrendingUp, TrendingDown, Filter, RotateCcw, CheckCircle2,
    Clock, AlertTriangle, ShieldCheck, PieChart, BarChart3, ChevronRight, Wrench
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getMaterialReportData, syncHistoricalAggregatePrices, MaterialReportFilters } from "./actions"

const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n || 0))
const fmtNum = (n: number, decimals: number = 2) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: decimals }).format(n || 0)
const fmtDate = (d: any) => d ? format(new Date(d), "dd/MM/yyyy", { locale: idLocale }) : "-"

interface MaterialReportClientProps {
    locations: any[]
    userRole: string
    userLocationId?: string | null
}

export function MaterialReportClient({
    locations = [],
    userRole,
    userLocationId = null,
}: MaterialReportClientProps) {
    const isSuperAdmin = userRole === "SuperAdminBP" || ["CEO", "FVP"].includes(userRole)
    const canManagePrices = isSuperAdmin || ["AdminLogistik", "Admin"].includes(userRole)
    const [isPending, startTransition] = useTransition()

    // Sync Modal State
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
    const [syncMode, setSyncMode] = useState<"missing_only" | "force_all">("missing_only")
    const [isSyncing, setIsSyncing] = useState(false)

    // Date Range Presets
    const now = new Date()
    const currentMonthStart = format(startOfMonth(now), "yyyy-MM-dd")
    const currentMonthEnd = format(endOfMonth(now), "yyyy-MM-dd")

    const [datePreset, setDatePreset] = useState<string>("this_month")
    const [startDate, setStartDate] = useState<string>(currentMonthStart)
    const [endDate, setEndDate] = useState<string>(currentMonthEnd)

    // Filters
    const [selectedLocation, setSelectedLocation] = useState<string>(isSuperAdmin ? "all" : (userLocationId || "all"))
    const [selectedMaterialType, setSelectedMaterialType] = useState<string>("all")
    const [selectedSourceType, setSelectedSourceType] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState<string>("")

    // Active View Tab
    const [activeTab, setActiveTab] = useState<"summary" | "incoming" | "outgoing" | "retase">("summary")

    // Client hydration safety
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    // Report Data State
    const [reportData, setReportData] = useState<any>(null)

    // Handle Preset Change
    const handlePresetChange = (preset: string) => {
        setDatePreset(preset)
        const today = new Date()
        if (preset === "today") {
            const t = format(today, "yyyy-MM-dd")
            setStartDate(t)
            setEndDate(t)
        } else if (preset === "last_7") {
            setStartDate(format(subDays(today, 6), "yyyy-MM-dd"))
            setEndDate(format(today, "yyyy-MM-dd"))
        } else if (preset === "this_month") {
            setStartDate(format(startOfMonth(today), "yyyy-MM-dd"))
            setEndDate(format(endOfMonth(today), "yyyy-MM-dd"))
        } else if (preset === "last_month") {
            const prev = subMonths(today, 1)
            setStartDate(format(startOfMonth(prev), "yyyy-MM-dd"))
            setEndDate(format(endOfMonth(prev), "yyyy-MM-dd"))
        } else if (preset === "this_year") {
            setStartDate(format(startOfYear(today), "yyyy-MM-dd"))
            setEndDate(format(endOfYear(today), "yyyy-MM-dd"))
        }
    }

    // Load Data from Server Action
    const loadReportData = () => {
        startTransition(async () => {
            const res = await getMaterialReportData({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                locationId: selectedLocation,
                aggregateType: selectedMaterialType,
                sourceType: selectedSourceType,
                search: searchQuery,
            })

            if (res.success) {
                setReportData(res)
            } else {
                toast.error(res.error || "Gagal memuat data laporan material.")
            }
        })
    }

    useEffect(() => {
        loadReportData()
    }, [startDate, endDate, selectedLocation, selectedMaterialType, selectedSourceType])

    // Reset Filters
    const handleResetFilters = () => {
        handlePresetChange("this_month")
        setSelectedLocation(isSuperAdmin ? "all" : (userLocationId || "all"))
        setSelectedMaterialType("all")
        setSelectedSourceType("all")
        setSearchQuery("")
    }

    // Run Price Sync / Correction Action
    const handleSyncPrices = async () => {
        setIsSyncing(true)
        try {
            const res = await syncHistoricalAggregatePrices({
                mode: syncMode,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                locationId: selectedLocation !== "all" ? selectedLocation : undefined,
            })
            if (res.success) {
                toast.success(res.message || "Koreksi harga material berhasil disimpan!")
                setIsSyncModalOpen(false)
                loadReportData()
            } else {
                toast.error(res.error || "Gagal melakukan sinkronisasi harga.")
            }
        } catch (err: any) {
            toast.error(err.message || "Terjadi kesalahan sistem saat sinkronisasi.")
        } finally {
            setIsSyncing(false)
        }
    }

    // Export to CSV Function
    const handleExportCSV = () => {
        if (!reportData || !reportData.incomingList || reportData.incomingList.length === 0) {
            toast.error("Tidak ada data material masuk untuk diekspor.")
            return
        }

        const headers = [
            "Tanggal",
            "No Surat Jalan / Bon",
            "Cabang / Plant",
            "Jenis Material",
            "Sumber Material",
            "Supplier / Quarry",
            "Nama Driver",
            "Plat Kendaraan",
            "Ukuran DT",
            "Jarak (KM)",
            "Volume (m3)",
            "Harga Pokok Satuan (Rp)",
            "Total Nilai Pokok (Rp)",
            "Ongkos Retase DT (Rp)",
            "Total Landed Cost (Rp)",
            "Landed Cost per m3 (Rp)",
            "Status Retase",
            "Catatan"
        ]

        const rows = reportData.incomingList.map((item: any) => [
            `"${fmtDate(item.date)}"`,
            `"${item.no_bon}"`,
            `"${item.locationName}"`,
            `"${item.material_name}"`,
            `"${item.source_type === 'Internal' ? 'Quarry Sendiri' : 'Vendor Luar'}"`,
            `"${item.supplier}"`,
            `"${item.driver_name}"`,
            `"${item.plate_number}"`,
            `"${item.dump_truck_size}"`,
            item.distance_km || 0,
            item.volume_cubic,
            item.unit_price,
            item.material_cost,
            item.retase_cost,
            item.landed_cost,
            Math.round(item.landed_per_m3),
            `"${item.is_retase_paid ? 'Lunas' : 'Belum Lunas'}"`,
            `"${(item.notes || '').replace(/"/g, '""')}"`
        ])

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `Laporan_Biaya_Material_${startDate}_sd_${endDate}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Berhasil mengunduh laporan CSV.")
    }

    // Trigger Browser Print
    const handlePrint = () => {
        window.print()
    }

    const kpis = reportData?.kpis || {
        totalIncomingVolume: 0,
        totalIncomingMaterialCost: 0,
        totalIncomingRetaseCost: 0,
        grandTotalLandedCost: 0,
        avgLandedCostPerM3: 0,
        avgMaterialUnitPrice: 0,
        totalOutgoingVolume: 0,
        totalOutgoingValue: 0,
        netCost: 0,
        incomingCount: 0,
        outgoingCount: 0,
    }

    const byMaterial = reportData?.byMaterial || []
    const bySource = reportData?.bySource || []
    const byDriver = reportData?.byDriver || []
    const incomingList = reportData?.incomingList || []
    const outgoingList = reportData?.outgoingList || []

    return (
        <div className="space-y-5 pb-12 print:p-0 print:m-0">
            {/* ═══ Header Section ══════════════════════════════════════════════════ */}
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
                        onClick={handlePrint}
                        className="h-8 text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium cursor-pointer shadow-2xs"
                    >
                        <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        <span>Cetak / PDF</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 font-medium cursor-pointer shadow-2xs"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        <span>Ekspor Excel/CSV</span>
                    </Button>

                    <Button
                        variant="default"
                        size="sm"
                        onClick={loadReportData}
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
                            onClick={() => setIsSyncModalOpen(true)}
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
                    Periode: {fmtDate(startDate)} s/d {fmtDate(endDate)} {mounted ? `| Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale })}` : ""}
                </p>
            </div>

            {/* ═══ Filter Toolbar ══════════════════════════════════════════════════ */}
            <Card className="border-slate-200/80 shadow-2xs bg-white print:hidden">
                <CardContent className="p-3.5 space-y-3">
                    {/* Top Row: Presets & Date Range */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                            {[
                                { id: "today", label: "Hari Ini" },
                                { id: "last_7", label: "7 Hari" },
                                { id: "this_month", label: "Bulan Ini" },
                                { id: "last_month", label: "Bulan Lalu" },
                                { id: "this_year", label: "Tahun Ini" },
                            ].map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handlePresetChange(preset.id)}
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
                                    onChange={(e) => {
                                        setDatePreset("custom")
                                        setStartDate(e.target.value)
                                    }}
                                />
                                <span className="text-slate-400 text-xs">s/d</span>
                                <Input
                                    type="date"
                                    className="h-8 text-xs w-36 bg-white"
                                    value={endDate}
                                    suppressHydrationWarning
                                    onChange={(e) => {
                                        setDatePreset("custom")
                                        setEndDate(e.target.value)
                                    }}
                                />
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
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
                                <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={!isSuperAdmin && !!userLocationId}>
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
                            <Select value={selectedMaterialType} onValueChange={setSelectedMaterialType}>
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
                            <Select value={selectedSourceType} onValueChange={setSelectedSourceType}>
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
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && loadReportData()}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ═══ Executive KPI Metrics Cards ═════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* KPI 1: Grand Total Landed Cost */}
                <Card className="border-blue-200/80 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/20 shadow-2xs">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                                Grand Total Landed Cost
                            </span>
                            <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0">
                                Pokok + Retase
                            </Badge>
                        </div>
                        <div className="text-xl font-extrabold font-mono text-blue-950">
                            {fmt(kpis.grandTotalLandedCost)}
                        </div>
                        <div className="text-[10px] text-blue-700/80 font-medium">
                            Total beban biaya riil material tiba di plant
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 2: Total Nilai Pokok Material */}
                <Card className="border-slate-200/80 bg-white shadow-2xs">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-slate-500" />
                                Nilai Pokok Material
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-slate-500">
                                {kpis.grandTotalLandedCost > 0 ? ((kpis.totalIncomingMaterialCost / kpis.grandTotalLandedCost) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div className="text-xl font-extrabold font-mono text-slate-900">
                            {fmt(kpis.totalIncomingMaterialCost)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                            Volume: <strong className="text-slate-800">{fmtNum(kpis.totalIncomingVolume, 1)} m³</strong> ({kpis.incomingCount} transaksi)
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 3: Total Ongkos Retase DT */}
                <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 shadow-2xs">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-amber-600" />
                                Ongkos Retase DT
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-amber-700">
                                {kpis.grandTotalLandedCost > 0 ? ((kpis.totalIncomingRetaseCost / kpis.grandTotalLandedCost) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div className="text-xl font-extrabold font-mono text-amber-950">
                            {fmt(kpis.totalIncomingRetaseCost)}
                        </div>
                        <div className="text-[10px] text-amber-800/80 font-mono">
                            Rata-rata: <strong className="text-amber-950">{fmt(kpis.totalIncomingVolume > 0 ? kpis.totalIncomingRetaseCost / kpis.totalIncomingVolume : 0)}</strong> / m³
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 4: Rata-rata Landed Cost per m3 */}
                <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 shadow-2xs">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                Landed Cost / m³
                            </span>
                            <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                Rata-rata Riil
                            </Badge>
                        </div>
                        <div className="text-xl font-extrabold font-mono text-emerald-950">
                            {fmt(kpis.avgLandedCostPerM3)}
                        </div>
                        <div className="text-[10px] text-emerald-800/80 font-mono">
                            Pokok: {fmt(kpis.avgMaterialUnitPrice)} + Retase: {fmt(kpis.totalIncomingVolume > 0 ? kpis.totalIncomingRetaseCost / kpis.totalIncomingVolume : 0)}
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 5: Komparasi Material Keluar */}
                <Card className="border-rose-200/80 bg-gradient-to-br from-rose-50/50 via-white to-rose-50/20 shadow-2xs">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                                Pengeluaran Material
                            </span>
                            <span className="text-[10px] font-mono text-rose-600">
                                {kpis.outgoingCount} bon keluar
                            </span>
                        </div>
                        <div className="text-xl font-extrabold font-mono text-rose-950">
                            {fmt(kpis.totalOutgoingValue)}
                        </div>
                        <div className="text-[10px] text-rose-800/80 font-mono">
                            Volume: <strong className="text-rose-950">{fmtNum(kpis.totalOutgoingVolume, 1)} m³</strong>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ═══ Main Analytics Tabs ═════════════════════════════════════════════ */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <TabsList className="bg-slate-100 p-0.5 print:hidden">
                    <TabsTrigger value="summary" className="text-xs">
                        <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                        <span>Akumulasi per Material ({byMaterial.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="retase" className="text-xs">
                        <Truck className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                        <span>Analisa Sumber & Retase DT ({byDriver.length} Sopir)</span>
                    </TabsTrigger>
                    <TabsTrigger value="incoming" className="text-xs">
                        <ArrowDownLeft className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        <span>Log Detail Material Masuk ({incomingList.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="outgoing" className="text-xs">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                        <span>Log Detail Material Keluar ({outgoingList.length})</span>
                    </TabsTrigger>
                </TabsList>

                {/* ═══ TAB 1: AKUMULASI PER MATERIAL ═════════════════════════════════ */}
                <TabsContent value="summary" className="mt-4 space-y-4">
                    <Card className="border-slate-200/80 shadow-2xs">
                        <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                    <PieChart className="w-4 h-4 text-blue-600" />
                                    Matriks Akumulasi Biaya & Retase per Jenis Material
                                </CardTitle>
                                <CardDescription className="text-[11px] text-slate-500">
                                    Rincian volume kubikasi riil, nilai pokok material, beban ongkos retase Dump Truck, dan biaya mendarat per m³
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader className="bg-slate-50 text-[11px]">
                                    <TableRow>
                                        <TableHead className="font-semibold text-slate-700">Jenis Material</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Volume Masuk (m³)</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Rata-rata Pokok (Rp/m³)</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Total Nilai Pokok (Rp)</TableHead>
                                        <TableHead className="text-right font-semibold text-amber-800">Total Retase DT (Rp)</TableHead>
                                        <TableHead className="text-right font-bold text-blue-900 bg-blue-50/50">Total Landed Cost (Rp)</TableHead>
                                        <TableHead className="text-right font-bold text-emerald-800 bg-emerald-50/40">Biaya Riil / m³</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Porsi (%)</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Keluar (m³)</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Net Stok (m³)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {byMaterial.map((m: any) => {
                                        const isPasir = m.code === "PASIR"
                                        const isSplit = m.code.includes("SPLIT")
                                        return (
                                            <TableRow key={m.code} className="hover:bg-slate-50/80">
                                                <TableCell className="font-semibold text-slate-900">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] font-bold ${
                                                                isPasir
                                                                    ? "bg-amber-50 text-amber-800 border-amber-300"
                                                                    : isSplit
                                                                    ? "bg-blue-50 text-blue-800 border-blue-300"
                                                                    : "bg-slate-50 text-slate-700 border-slate-300"
                                                            }`}
                                                        >
                                                            {m.code}
                                                        </Badge>
                                                        <span>{m.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold text-slate-900">
                                                    {fmtNum(m.volume_cubic, 2)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-slate-700">
                                                    {fmt(m.avg_unit_price)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold text-slate-900">
                                                    {fmt(m.material_cost)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-amber-900 font-semibold">
                                                    {fmt(m.retase_cost)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-extrabold text-blue-900 bg-blue-50/30">
                                                    {fmt(m.landed_cost)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-emerald-800 bg-emerald-50/30">
                                                    {fmt(m.avg_landed_per_m3)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <span>{m.pct_of_total.toFixed(1)}%</span>
                                                        <div className="w-12 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-600 rounded-full"
                                                                style={{ width: `${Math.min(100, m.pct_of_total)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-rose-700">
                                                    {fmtNum(m.outgoing_volume, 2)}
                                                </TableCell>
                                                <TableCell className={`text-right font-mono font-bold ${m.net_volume >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                                    {m.net_volume > 0 ? "+" : ""}{fmtNum(m.net_volume, 2)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                                <TableFooter className="bg-slate-100/90 font-bold text-xs">
                                    <TableRow>
                                        <TableCell>TOTAL AKUMULASI</TableCell>
                                        <TableCell className="text-right font-mono">{fmtNum(kpis.totalIncomingVolume, 2)} m³</TableCell>
                                        <TableCell className="text-right font-mono">{fmt(kpis.avgMaterialUnitPrice)}</TableCell>
                                        <TableCell className="text-right font-mono">{fmt(kpis.totalIncomingMaterialCost)}</TableCell>
                                        <TableCell className="text-right font-mono text-amber-900">{fmt(kpis.totalIncomingRetaseCost)}</TableCell>
                                        <TableCell className="text-right font-mono text-blue-950 font-extrabold">{fmt(kpis.grandTotalLandedCost)}</TableCell>
                                        <TableCell className="text-right font-mono text-emerald-900 font-extrabold">{fmt(kpis.avgLandedCostPerM3)}</TableCell>
                                        <TableCell className="text-right font-mono">100.0%</TableCell>
                                        <TableCell className="text-right font-mono text-rose-700">{fmtNum(kpis.totalOutgoingVolume, 2)}</TableCell>
                                        <TableCell className="text-right font-mono text-emerald-800">
                                            {fmtNum(kpis.totalIncomingVolume - kpis.totalOutgoingVolume, 2)}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    </Card>

                    {/* Explanatory Analysis Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                Formulasi Perhitungan Biaya Mendarat (Landed Cost)
                            </span>
                            <p className="text-xs text-blue-950 leading-relaxed">
                                <strong>Landed Cost</strong> adalah total biaya riil pengadaan material hingga sampai di Batching Plant:
                            </p>
                            <div className="p-2.5 rounded-lg bg-white/80 border border-blue-200/80 font-mono text-xs text-blue-900 space-y-1">
                                <div>• Total Landed Cost = Nilai Pokok Material + Ongkos Retase DT</div>
                                <div>• Biaya Riil per m³ = Total Landed Cost ÷ Total Volume (m³)</div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                <PieChart className="w-4 h-4 text-slate-600" />
                                Komposisi Pengeluaran Material
                            </span>
                            <div className="space-y-2 pt-1 text-xs">
                                <div>
                                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                                        <span>Beban Bahan Pokok Material</span>
                                        <span>{kpis.grandTotalLandedCost > 0 ? ((kpis.totalIncomingMaterialCost / kpis.grandTotalLandedCost) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full"
                                            style={{ width: `${kpis.grandTotalLandedCost > 0 ? (kpis.totalIncomingMaterialCost / kpis.grandTotalLandedCost) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                                        <span>Beban Ongkos Retase Dump Truck</span>
                                        <span>{kpis.grandTotalLandedCost > 0 ? ((kpis.totalIncomingRetaseCost / kpis.grandTotalLandedCost) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 rounded-full"
                                            style={{ width: `${kpis.grandTotalLandedCost > 0 ? (kpis.totalIncomingRetaseCost / kpis.grandTotalLandedCost) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ═══ TAB 2: ANALISA SUMBER & RETASE DT ═══════════════════════════════ */}
                <TabsContent value="retase" className="mt-4 space-y-4">
                    {/* Source Comparison Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {bySource.map((s: any) => {
                            const isInternal = s.source_type === "Internal"
                            return (
                                <Card key={s.source_type} className={`border ${isInternal ? "border-emerald-200 bg-emerald-50/20" : "border-indigo-200 bg-indigo-50/20"} shadow-2xs`}>
                                    <CardContent className="p-4 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                                <span className={`w-2.5 h-2.5 rounded-full ${isInternal ? "bg-emerald-500" : "bg-indigo-500"}`}></span>
                                                {s.label}
                                            </span>
                                            <Badge variant="outline" className="text-[10px] font-mono">
                                                {s.count} transaksi
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                                            <div>
                                                <div className="text-[10px] text-slate-400">Total Volume</div>
                                                <div className="text-sm font-bold font-mono text-slate-800">{fmtNum(s.volume_cubic, 2)} m³</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-400">Biaya Pokok</div>
                                                <div className="text-sm font-bold font-mono text-slate-800">{fmt(s.material_cost)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-amber-700">Retase DT</div>
                                                <div className="text-sm font-bold font-mono text-amber-800">{fmt(s.retase_cost)}</div>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-600">Landed Cost:</span>
                                            <span className="font-extrabold font-mono text-slate-900">{fmt(s.landed_cost)} ({fmt(s.avg_landed_per_m3)}/m³)</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Driver & Dump Truck Retase Table */}
                    <Card className="border-slate-200/80 shadow-2xs">
                        <CardHeader className="p-4 pb-2 border-b border-slate-100">
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-amber-600" />
                                Rekapitulasi Komisi Retase per Sopir Dump Truck
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">
                                Akumulasi jumlah trip pengangkutan (rit), kubikasi material, dan komisi retase sopir Dump Truck internal
                            </CardDescription>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader className="bg-slate-50 text-[11px]">
                                    <TableRow>
                                        <TableHead className="font-semibold text-slate-700">Nama Sopir Dump Truck</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Plat DT</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Ukuran DT</TableHead>
                                        <TableHead className="text-center font-semibold text-slate-700">Jumlah Rit</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Total Kubikasi (m³)</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Nilai Material Diangkut</TableHead>
                                        <TableHead className="text-right font-bold text-amber-900 bg-amber-50/50">Total Retase (Rp)</TableHead>
                                        <TableHead className="text-right font-semibold text-emerald-700">Sudah Lunas (Rp)</TableHead>
                                        <TableHead className="text-right font-semibold text-rose-700">Belum Dibayar (Rp)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {byDriver.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-6 text-slate-400 italic">
                                                Tidak ada data retase supir Dump Truck pada periode ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        byDriver.map((d: any) => (
                                            <TableRow key={d.driver_name} className="hover:bg-slate-50/80">
                                                <TableCell className="font-semibold text-slate-900">
                                                    {d.driver_name}
                                                </TableCell>
                                                <TableCell className="font-mono text-slate-600">
                                                    {d.plate_number}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                        {d.dump_truck_size}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-semibold">
                                                    {d.trip_count} rit
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold text-slate-900">
                                                    {fmtNum(d.volume_cubic, 2)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-slate-700">
                                                    {fmt(d.material_cost)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-extrabold text-amber-950 bg-amber-50/30">
                                                    {fmt(d.retase_cost)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold text-emerald-700">
                                                    {fmt(d.paid_retase)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold text-rose-700">
                                                    {fmt(d.unpaid_retase)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* ═══ TAB 3: LOG DETAIL MATERIAL MASUK ════════════════════════════════ */}
                <TabsContent value="incoming" className="mt-4 space-y-4">
                    <Card className="border-slate-200/80 shadow-2xs">
                        <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                                    Daftar Surat Jalan Penerimaan Material Masuk
                                </CardTitle>
                                <CardDescription className="text-[11px] text-slate-500">
                                    Menampilkan {incomingList.length} tiket transaksi material masuk beserta rincian kubikasi, harga satuan, dan retase
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleExportCSV}
                                className="h-7 text-xs bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                            >
                                <FileSpreadsheet className="w-3 h-3 mr-1" />
                                <span>Ekspor Data</span>
                            </Button>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader className="bg-slate-50 text-[11px]">
                                    <TableRow>
                                        <TableHead className="font-semibold text-slate-700">Tgl Bon</TableHead>
                                        <TableHead className="font-semibold text-slate-700">No Bon</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Cabang</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Material</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Sumber / Supplier</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Sopir & Plat</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Volume (m³)</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Harga Pokok/m³</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Nilai Pokok (Rp)</TableHead>
                                        <TableHead className="text-right font-semibold text-amber-800">Retase DT (Rp)</TableHead>
                                        <TableHead className="text-right font-bold text-blue-900 bg-blue-50/50">Landed Cost (Rp)</TableHead>
                                        <TableHead className="text-right font-bold text-emerald-800">Landed/m³</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incomingList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-6 text-slate-400 italic">
                                                Tidak ada data penerimaan material masuk pada filter yang dipilih.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        incomingList.map((item: any) => (
                                            <TableRow key={item.id} className="hover:bg-slate-50/80">
                                                <TableCell className="font-mono text-slate-700 whitespace-nowrap">
                                                    {fmtDate(item.date)}
                                                </TableCell>
                                                <TableCell className="font-mono font-bold text-slate-900 whitespace-nowrap">
                                                    {item.no_bon}
                                                </TableCell>
                                                <TableCell className="text-slate-600 whitespace-nowrap">
                                                    {item.locationName}
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-900 whitespace-nowrap">
                                                    {item.material_name}
                                                </TableCell>
                                                <TableCell className="text-slate-600 max-w-[140px] truncate" title={item.supplier}>
                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${item.source_type === 'Internal' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                                                    {item.supplier}
                                                </TableCell>
                                                <TableCell className="text-slate-700 whitespace-nowrap">
                                                    <div>{item.driver_name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{item.plate_number}</div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-slate-900">
                                                    {fmtNum(item.volume_cubic, 2)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-slate-700">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <span>{fmt(item.unit_price)}</span>
                                                        {item.is_from_master_price && (
                                                            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-blue-50 text-blue-700 border-blue-200 font-semibold" title="Harga dihitung otomatis dari tarif Master Material">
                                                                Master
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold text-slate-900">
                                                    {fmt(item.material_cost)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-amber-900 font-semibold">
                                                    {fmt(item.retase_cost)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-extrabold text-blue-900 bg-blue-50/30">
                                                    {fmt(item.landed_cost)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-emerald-800">
                                                    {fmt(item.landed_per_m3)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* ═══ TAB 4: LOG DETAIL MATERIAL KELUAR ════════════════════════════════ */}
                <TabsContent value="outgoing" className="mt-4 space-y-4">
                    <Card className="border-slate-200/80 shadow-2xs">
                        <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                                    Daftar Pengeluaran / Penjualan Material Keluar
                                </CardTitle>
                                <CardDescription className="text-[11px] text-slate-500">
                                    Menampilkan {outgoingList.length} tiket transaksi material keluar untuk proyek internal maupun penjualan
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader className="bg-slate-50 text-[11px]">
                                    <TableRow>
                                        <TableHead className="font-semibold text-slate-700">Tgl Keluar</TableHead>
                                        <TableHead className="font-semibold text-slate-700">No Bon</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Cabang</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Material</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Kategori</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Penerima / Proyek Tujuan</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Volume (m³)</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Harga Satuan (Rp/m³)</TableHead>
                                        <TableHead className="text-right font-bold text-rose-900">Total Nilai (Rp)</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Angkutan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {outgoingList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-6 text-slate-400 italic">
                                                Tidak ada data pengeluaran material pada filter yang dipilih.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        outgoingList.map((item: any) => (
                                            <TableRow key={item.id} className="hover:bg-slate-50/80">
                                                <TableCell className="font-mono text-slate-700 whitespace-nowrap">
                                                    {fmtDate(item.date)}
                                                </TableCell>
                                                <TableCell className="font-mono font-bold text-slate-900 whitespace-nowrap">
                                                    {item.no_bon}
                                                </TableCell>
                                                <TableCell className="text-slate-600 whitespace-nowrap">
                                                    {item.locationName}
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-900 whitespace-nowrap">
                                                    {item.material_name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                        {item.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-700 max-w-[150px] truncate" title={item.recipient}>
                                                    {item.recipient}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-slate-900">
                                                    {fmtNum(item.volume_cubic, 2)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-slate-700">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <span>{fmt(item.unit_price)}</span>
                                                        {item.is_from_master_price && (
                                                            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-blue-50 text-blue-700 border-blue-200 font-semibold" title="Harga dihitung otomatis dari tarif Master Material">
                                                                Master
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-extrabold text-rose-950">
                                                    {fmt(item.total_price)}
                                                </TableCell>
                                                <TableCell className="text-slate-600 whitespace-nowrap">
                                                    {item.transport_mode === 'INTERNAL_DT' ? 'DT Internal' : 'Diambil Pembeli'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ═══ Dialog Modal: Koreksi & Sinkronisasi Harga Master ══════════════ */}
            <Dialog open={isSyncModalOpen} onOpenChange={setIsSyncModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Wrench className="w-5 h-5 text-amber-600" />
                            <span>Koreksi & Sinkronisasi Harga Material</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-600">
                            Sesuaikan harga per m³ dan total nilai transaksi material (masuk & keluar) dengan tarif Master Material yang berlaku pada tanggal masing-masing transaksi.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-xs">
                        {/* Context Info */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
                            <div className="flex justify-between text-slate-600">
                                <span>Periode Diproses:</span>
                                <strong className="text-slate-900">{fmtDate(startDate)} s/d {fmtDate(endDate)}</strong>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Cabang / Lokasi:</span>
                                <strong className="text-slate-900">
                                    {selectedLocation === "all" ? "Semua Cabang (Global)" : (locations.find((l: any) => l.id === selectedLocation)?.name || selectedLocation)}
                                </strong>
                            </div>
                        </div>

                        {/* Sync Mode Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-800">Pilih Metode Koreksi:</Label>
                            <div className="space-y-2">
                                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${syncMode === 'missing_only' ? 'border-blue-500 bg-blue-50/40 text-blue-950 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
                                    <input
                                        type="radio"
                                        name="syncMode"
                                        checked={syncMode === 'missing_only'}
                                        onChange={() => setSyncMode('missing_only')}
                                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="space-y-0.5">
                                        <div className="font-semibold text-xs flex items-center gap-1.5">
                                            <span>Koreksi Transaksi Tanpa Harga (Rp 0)</span>
                                            <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 font-bold">Rekomendasi</Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            Hanya mengisi transaksi yang harga satuannya masih Rp 0 atau kosong. Transaksi yang sengaja diisi harga manual dari invoice vendor tidak akan diubah.
                                        </p>
                                    </div>
                                </label>

                                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${syncMode === 'force_all' ? 'border-amber-500 bg-amber-50/40 text-amber-950 ring-1 ring-amber-500' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
                                    <input
                                        type="radio"
                                        name="syncMode"
                                        checked={syncMode === 'force_all'}
                                        onChange={() => setSyncMode('force_all')}
                                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                                    />
                                    <div className="space-y-0.5">
                                        <div className="font-semibold text-xs text-amber-900">
                                            Sinkronkan Ulang Semua Transaksi Sesuai Master
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            Memperbarui seluruh transaksi material (masuk & keluar) dalam periode terpilih mengikuti tarif Master Material per tanggal transaksi.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="p-2.5 rounded-md bg-amber-50/70 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                                Operasi ini akan menyimpan pembaruan nilai kubikasi × harga satuan riil ke database secara permanen.
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSyncModalOpen(false)}
                            disabled={isSyncing}
                            className="text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleSyncPrices}
                            disabled={isSyncing}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                            {isSyncing ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    <span>Memproses Koreksi...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                    <span>Jalankan Koreksi Sekarang</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
