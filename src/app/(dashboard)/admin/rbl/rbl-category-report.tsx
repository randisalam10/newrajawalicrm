"use client"

import React, { useState, useEffect, useTransition, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Fuel, Download, Printer, Search, RefreshCw, Calendar, Building2,
    Truck, Tag, Filter, FileSpreadsheet, ArrowUpDown, ChevronRight, Gauge, CheckCircle2
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { toast } from "sonner"
import { getRblCategoryReport } from "./actions"

const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n || 0))
const fmtDate = (d: any) => d ? format(new Date(d), "dd/MM/yyyy", { locale: idLocale }) : "-"
const fmtFullDate = (d: any) => d ? format(new Date(d), "dd MMMM yyyy", { locale: idLocale }) : "-"

interface RblCategoryReportProps {
    categories: any[]
    locations: any[]
    vehicles: any[]
    userLocationId?: string
    isSuperAdmin?: boolean
    defaultCategoryId?: string
    embedded?: boolean // if embedded in RBL tabs
}

export function RblCategoryReport({
    categories = [],
    locations = [],
    vehicles = [],
    userLocationId = "",
    isSuperAdmin = false,
    defaultCategoryId = "all",
    embedded = false,
}: RblCategoryReportProps) {
    const [isPending, startTransition] = useTransition()

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategoryId)
    const [selectedLocation, setSelectedLocation] = useState<string>(isSuperAdmin ? "all" : (userLocationId || "all"))
    const [selectedVehicle, setSelectedVehicle] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    // Date range states: Default to current month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
    const [startDate, setStartDate] = useState(firstDayOfMonth)
    const [endDate, setEndDate] = useState(lastDayOfMonth)

    // Data state
    const [expenses, setExpenses] = useState<any[]>([])
    const [summary, setSummary] = useState<any>(null)

    // Filter vehicles by selected location
    const filteredVehicles = useMemo(() => {
        if (!selectedLocation || selectedLocation === "all") return vehicles
        return vehicles.filter(v => v.locationId === selectedLocation)
    }, [vehicles, selectedLocation])

    const loadData = () => {
        startTransition(async () => {
            const res = await getRblCategoryReport({
                categoryId: selectedCategory,
                locationId: selectedLocation,
                vehicleId: selectedVehicle,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                search: searchQuery || undefined,
            })

            if (res.success) {
                setExpenses(res.expenses || [])
                setSummary(res.summary || null)
            } else {
                toast.error(res.error || "Gagal memuat laporan.")
            }
        })
    }

    // Initial load & when major filters change
    useEffect(() => {
        loadData()
    }, [selectedCategory, selectedLocation, selectedVehicle, startDate, endDate])

    // Selected category details
    const currentCatObj = categories.find(c => c.id === selectedCategory)
    const isFuelSelected = currentCatObj?.requireVehicleKm ||
        (currentCatObj?.name || "").toLowerCase().includes("bbm") ||
        (currentCatObj?.name || "").toLowerCase().includes("solar")

    // Active location label
    const activeLocationName = useMemo(() => {
        if (selectedLocation === "all") return "Semua Cabang (Konsolidasi)"
        const found = locations.find(l => l.id === selectedLocation)
        return found?.name || "Cabang"
    }, [selectedLocation, locations])

    // Quick Date Range Helpers
    const setQuickDateRange = (type: "this-month" | "last-month" | "this-year" | "all-time") => {
        const d = new Date()
        if (type === "this-month") {
            setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0])
            setEndDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0])
        } else if (type === "last-month") {
            setStartDate(new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split("T")[0])
            setEndDate(new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split("T")[0])
        } else if (type === "this-year") {
            setStartDate(`${d.getFullYear()}-01-01`)
            setEndDate(`${d.getFullYear()}-12-31`)
        } else if (type === "all-time") {
            setStartDate("")
            setEndDate("")
        }
    }

    // ─── Export to Excel / CSV ──────────────────────────────────────────────────
    const handleExportCSV = () => {
        if (!expenses || expenses.length === 0) {
            toast.error("Tidak ada data untuk diekspor.")
            return
        }

        const headers = [
            "No",
            "Tanggal",
            "No. Bon / Ref",
            "Uraian Pengeluaran",
            "Kategori",
            "Kode Armada",
            "No. Plat",
            "Tipe Kendaraan",
            "KM Odometer",
            "Qty",
            "Satuan",
            "Harga Satuan (Rp)",
            "Total Biaya (Rp)",
            "Cabang",
            "Periode Budget",
            "Diinput Oleh",
            "Catatan"
        ]

        const rows = expenses.map((e, idx) => {
            const plate = e.vehicle?.plate_number || "-"
            const code = e.vehicle?.code || "-"
            const vType = e.vehicle?.vehicle_type || "-"
            const odo = e.kmMeter !== null && e.kmMeter !== undefined ? e.kmMeter : ""
            const branch = e.budget?.location?.name || "-"
            const budgetCode = e.budget?.code || "-"
            const createdUser = e.createdBy?.employee?.name || e.createdBy?.username || "-"

            return [
                idx + 1,
                fmtDate(e.date),
                `"${(e.receiptNo || "").replace(/"/g, '""')}"`,
                `"${(e.itemDescription || "").replace(/"/g, '""')}"`,
                `"${(e.category || "-").replace(/"/g, '""')}"`,
                `"${code}"`,
                `"${plate}"`,
                `"${vType}"`,
                odo,
                e.quantity || 0,
                `"${e.unit || "Pcs"}"`,
                e.unitPrice || 0,
                e.amount || 0,
                `"${branch}"`,
                `"${budgetCode}"`,
                `"${createdUser}"`,
                `"${(e.notes || "").replace(/"/g, '""')}"`
            ]
        })

        // Add summary line
        const summaryRow = [
            "",
            "TOTAL",
            "",
            `"Total Transaksi: ${expenses.length}"`,
            "",
            "",
            "",
            "",
            "",
            summary?.totalQuantity || 0,
            "",
            "",
            summary?.totalAmount || 0,
            "",
            "",
            "",
            ""
        ]

        const csvContent = "\uFEFF" + [
            `"LAPORAN PENGELUARAN RBL - ${currentCatObj?.name ? currentCatObj.name.toUpperCase() : "SEMUA KATEGORI"}"`,
            `"Cabang: ${activeLocationName}"`,
            `"Periode: ${startDate ? fmtDate(startDate) : "Awal"} s/d ${endDate ? fmtDate(endDate) : "Sekarang"}"`,
            `"Waktu Ekspor: ${format(new Date(), "dd/MM/yyyy HH:mm")}"`,
            "",
            headers.join(","),
            ...rows.map(r => r.join(",")),
            summaryRow.join(",")
        ].join("\r\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const catNameClean = (currentCatObj?.name || "Semua_Kategori").replace(/[^a-zA-Z0-9]/g, "_")
        const branchClean = activeLocationName.replace(/[^a-zA-Z0-9]/g, "_")
        link.href = url
        link.setAttribute("download", `Laporan_RBL_${catNameClean}_${branchClean}_${format(new Date(), "yyyyMMdd")}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success("File laporan Excel/CSV berhasil diunduh.")
    }

    // ─── Print View ────────────────────────────────────────────────────────────
    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-4">
            {/* ─── Printable Letterhead (Only visible in Print mode) ─────────────── */}
            <div className="hidden print:block mb-6 border-b pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">PT RAJAWALI ANUGRAH READYMIX</h1>
                        <p className="text-xs text-slate-600">Laporan Rincian Biaya Lapangan (RBL) — Khusus Kategori</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                        <div>Dicetak: {format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale })}</div>
                        <div>Cabang: <strong>{activeLocationName}</strong></div>
                    </div>
                </div>
                <div className="mt-3 flex gap-4 text-xs bg-slate-100 p-2 rounded">
                    <div>Kategori: <strong>{currentCatObj?.name || "Semua Kategori"}</strong></div>
                    <div>Periode: <strong>{startDate ? fmtDate(startDate) : "Awal"} — {endDate ? fmtDate(endDate) : "Sekarang"}</strong></div>
                    <div>Total Transaksi: <strong>{expenses.length} item</strong></div>
                    <div>Total Realisasi: <strong>{fmt(summary?.totalAmount || 0)}</strong></div>
                </div>
            </div>

            {/* ─── Page Title & Action Bar (Hidden in Print) ───────────────────── */}
            {embedded ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-2xs">
                            <Fuel className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                    Rekap & Ekspor per Kategori
                                </h3>
                                <Badge variant="outline" className="text-[10px] bg-white border-amber-300 text-amber-900 font-semibold">
                                    {currentCatObj ? currentCatObj.name : "Semua Kategori"}
                                </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Analisis volume konsumsi, efisiensi unit armada, dan unduh data ke Excel/CSV atau cetak.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={loadData}
                            disabled={isPending}
                            className="h-7 text-xs gap-1.5 bg-white cursor-pointer shadow-2xs"
                        >
                            <RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="h-7 text-xs gap-1.5 bg-white cursor-pointer shadow-2xs"
                        >
                            <Printer className="h-3 w-3 text-slate-600" />
                            Cetak
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleExportCSV}
                            className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer font-medium"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            Ekspor Excel / CSV
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-600 text-white rounded-lg shadow-2xs">
                            <Fuel className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                Laporan Khusus Per Kategori RBL
                            </h2>
                            <p className="text-xs text-slate-500">
                                Analisis & ekspor pengeluaran BBM/Solar, pelumas, dan kategori operasional cabang lainnya.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={loadData}
                            disabled={isPending}
                            className="h-8 text-xs gap-1.5 bg-white cursor-pointer"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="h-8 text-xs gap-1.5 bg-white cursor-pointer"
                        >
                            <Printer className="h-3.5 w-3.5 text-slate-600" />
                            Cetak Laporan
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleExportCSV}
                            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            Ekspor Excel / CSV
                        </Button>
                    </div>
                </div>
            )}

            {/* ─── Compact Filter Bar (Hidden in Print) ─────────────────────────── */}
            <Card className="border shadow-2xs bg-white print:hidden">
                <CardContent className="p-3.5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {/* Kategori Filter */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                <Tag className="h-3 w-3 text-slate-400" />
                                Pilih Kategori
                            </Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs font-medium">
                                        🏷️ Semua Kategori Pengeluaran
                                    </SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id} className="text-xs">
                                            {c.requireVehicleKm ? "⛽ " : "• "}
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cabang Filter */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-slate-400" />
                                Cabang / Lokasi
                            </Label>
                            <Select
                                value={selectedLocation}
                                onValueChange={setSelectedLocation}
                                disabled={!isSuperAdmin}
                            >
                                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Pilih Cabang" />
                                </SelectTrigger>
                                <SelectContent>
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

                        {/* Armada Filter */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                <Truck className="h-3 w-3 text-slate-400" />
                                Unit Armada Kendaraan
                            </Label>
                            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Semua Armada" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">
                                        🚛 Semua Armada & Pengeluaran Umum
                                    </SelectItem>
                                    <SelectItem value="none" className="text-xs text-slate-500 italic">
                                        -- Hanya Biaya Non-Armada --
                                    </SelectItem>
                                    {filteredVehicles.map(v => (
                                        <SelectItem key={v.id} value={v.id} className="text-xs">
                                            <span className="font-semibold text-amber-800">{v.code}</span> - {v.plate_number || v.plateNumber} ({v.vehicle_type || v.type || "Unit"})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Input */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                <Search className="h-3 w-3 text-slate-400" />
                                Cari Item / Bon / Catatan
                            </Label>
                            <div className="relative">
                                <Input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && loadData()}
                                    placeholder="Ketik & Enter..."
                                    className="h-8 text-xs bg-slate-50 pl-8"
                                />
                                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Date Range & Quick Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-slate-500 font-medium">Rentang Tanggal:</span>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="h-7 text-xs w-32 bg-white"
                            />
                            <span className="text-slate-400">s/d</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="h-7 text-xs w-32 bg-white"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setQuickDateRange("this-month")}
                                className="h-6 text-[11px] px-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                            >
                                Bulan Ini
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setQuickDateRange("last-month")}
                                className="h-6 text-[11px] px-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                            >
                                Bulan Lalu
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setQuickDateRange("this-year")}
                                className="h-6 text-[11px] px-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                            >
                                Tahun Ini
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setQuickDateRange("all-time")}
                                className="h-6 text-[11px] px-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                                Semua
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Compact KPI Cards ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white rounded-lg border shadow-2xs">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Total Biaya Kategori
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-0.5">
                        {fmt(summary?.totalAmount || 0)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {expenses.length} transaksi tercatat
                    </div>
                </div>

                <div className="p-3 bg-white rounded-lg border shadow-2xs">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {isFuelSelected ? "Total Volume Solar / BBM" : "Total Qty / Volume"}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-amber-700 font-mono mt-0.5">
                        {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(summary?.totalQuantity || 0)}
                        <span className="text-xs font-normal text-slate-500 ml-1">
                            {expenses[0]?.unit || (isFuelSelected ? "Liter" : "Unit")}
                        </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                        Alokasi pemakaian armada
                    </div>
                </div>

                <div className="p-3 bg-white rounded-lg border shadow-2xs">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Rata-rata Harga Satuan
                    </div>
                    <div className="text-base sm:text-lg font-bold text-blue-700 font-mono mt-0.5">
                        {fmt(summary?.avgPrice || 0)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        per {expenses[0]?.unit || (isFuelSelected ? "Liter" : "Satuan")}
                    </div>
                </div>

                <div className="p-3 bg-white rounded-lg border shadow-2xs">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Armada Terlibat
                    </div>
                    <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono mt-0.5">
                        {summary?.vehicleBreakdown ? summary.vehicleBreakdown.filter((v: any) => v.vehicleId).length : 0}
                        <span className="text-xs font-normal text-slate-500 ml-1">Unit</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {activeLocationName}
                    </div>
                </div>
            </div>

            {/* ─── Vehicle Consumption Breakdown Bar / Table (If multiple vehicles) ─ */}
            {summary?.vehicleBreakdown && summary.vehicleBreakdown.length > 1 && (
                <Card className="border shadow-2xs bg-white print:border-none">
                    <CardHeader className="p-3 border-b bg-slate-50/70">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Truck className="h-3.5 w-3.5 text-amber-600" />
                                Rincian Konsumsi Berdasarkan Unit Armada
                            </CardTitle>
                            <span className="text-[11px] text-slate-500">
                                Diurutkan dari biaya tertinggi
                            </span>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 text-[11px]">
                                <TableRow>
                                    <TableHead className="w-12 text-center">#</TableHead>
                                    <TableHead>Kode / Plat Unit</TableHead>
                                    <TableHead>Cabang</TableHead>
                                    <TableHead className="text-right">Frekuensi</TableHead>
                                    <TableHead className="text-right">Total Qty</TableHead>
                                    <TableHead className="text-right">Total Biaya (Rp)</TableHead>
                                    <TableHead className="text-right">KM Min - Max</TableHead>
                                    <TableHead className="text-right">Estimasi Jarak</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="text-xs">
                                {summary.vehicleBreakdown.map((vb: any, idx: number) => (
                                    <TableRow key={vb.vehicleId || idx} className="hover:bg-slate-50/80">
                                        <TableCell className="text-center font-mono text-slate-400 text-[11px]">
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-slate-900">
                                                {vb.code}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono">
                                                {vb.plateNumber} ({vb.type})
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {vb.locationName}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {vb.count}x
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-amber-800">
                                            {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(vb.totalQty)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-900">
                                            {fmt(vb.totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-[11px] text-slate-600">
                                            {vb.minKm !== null && vb.maxKm !== null
                                                ? `${vb.minKm.toLocaleString("id-ID")} - ${vb.maxKm.toLocaleString("id-ID")}`
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-blue-700">
                                            {vb.kmDiff > 0 ? `${vb.kmDiff.toLocaleString("id-ID")} KM` : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* ─── Detailed Chronological Transactions Table ───────────────────── */}
            <Card className="border shadow-2xs bg-white print:border-none print:shadow-none">
                <CardHeader className="p-3 border-b bg-slate-50/70 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xs font-bold text-slate-800">
                            Daftar Transaksi Pengeluaran ({expenses.length} Item)
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">
                            Semua transaksi yang cocok dengan filter kategori dan periode waktu yang dipilih.
                        </CardDescription>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80 text-[11px]">
                            <TableRow>
                                <TableHead className="w-10 text-center">#</TableHead>
                                <TableHead className="w-24">Tanggal</TableHead>
                                <TableHead className="w-24">No. Bon</TableHead>
                                <TableHead className="min-w-[180px]">Uraian Item</TableHead>
                                <TableHead className="w-28">Kategori</TableHead>
                                <TableHead className="w-36">Unit Armada</TableHead>
                                <TableHead className="w-24 text-right">KM Odo</TableHead>
                                <TableHead className="w-20 text-right">Qty</TableHead>
                                <TableHead className="w-16">Satuan</TableHead>
                                <TableHead className="w-24 text-right">Harga Satuan</TableHead>
                                <TableHead className="w-28 text-right font-bold">Total (Rp)</TableHead>
                                <TableHead className="min-w-[120px]">Catatan / Cabang</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={12} className="py-8 text-center text-slate-400 italic">
                                        Tidak ada transaksi pengeluaran yang sesuai dengan filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((exp, idx) => (
                                    <TableRow key={exp.id} className="hover:bg-slate-50/80">
                                        <TableCell className="text-center font-mono text-slate-400 text-[11px]">
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell className="font-mono text-slate-700">
                                            {fmtDate(exp.date)}
                                        </TableCell>
                                        <TableCell className="font-mono text-[11px] text-slate-600">
                                            {exp.receiptNo || "-"}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            {exp.itemDescription}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal bg-slate-50">
                                                {exp.category || "-"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {exp.vehicle ? (
                                                <div>
                                                    <span className="font-bold text-amber-800">{exp.vehicle.code}</span>
                                                    <span className="text-[11px] text-slate-500 font-mono ml-1">
                                                        ({exp.vehicle.plate_number})
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-[11px] italic">Umum</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-700">
                                            {exp.kmMeter !== null && exp.kmMeter !== undefined ? exp.kmMeter.toLocaleString("id-ID") : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold">
                                            {exp.quantity}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-[11px]">
                                            {exp.unit || "Pcs"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-600">
                                            {fmt(exp.unitPrice)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-900">
                                            {fmt(exp.amount)}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-[11px]">
                                            <div>{exp.notes || "-"}</div>
                                            <div className="text-[10px] text-slate-400">
                                                {exp.budget?.location?.name} • {exp.createdBy?.employee?.name || exp.createdBy?.username}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Print Signatures (Only in Print mode) */}
                <div className="hidden print:grid grid-cols-3 gap-6 pt-12 mt-8 border-t text-center text-xs">
                    <div>
                        <p className="font-semibold text-slate-700">Dibuat Oleh,</p>
                        <div className="h-16"></div>
                        <p className="border-t border-slate-400 pt-1 font-bold text-slate-800">( Admin Logistik / Cabang )</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-700">Diperiksa Oleh,</p>
                        <div className="h-16"></div>
                        <p className="border-t border-slate-400 pt-1 font-bold text-slate-800">( Kepala Cabang / BP )</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-700">Disetujui Oleh,</p>
                        <div className="h-16"></div>
                        <p className="border-t border-slate-400 pt-1 font-bold text-slate-800">( Finance / Manajemen HO )</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
