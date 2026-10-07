"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { getRetaseReportByMonth } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Loader2, Search, Printer, User, TrendingUp, Truck, ChevronRight,
    Mountain, HardHat, RefreshCw, Coins, Layers, ArrowUpRight, Building2, Calendar, Eye
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export type RecipientType = "OPERATOR_BP" | "MIXER" | "DUMP_TRUCK"

export type RecipientSummary = {
    id: string
    recipientType: RecipientType
    name: string
    roleLabel: string
    locationName: string
    vehicleCode?: string
    plateNumber?: string
    dumpTruckSize?: string
    totalTrip: number
    totalVolume: number
    totalKm: number
    ratePrice: number
    totalIncome: number
    records: any[]
}

export function RetaseReportClient({ locations, availableYears, userRole, userLocationId }: any) {
    const now = new Date()
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)
    const [selectedLocation, setSelectedLocation] = useState<string>(
        userRole !== 'SuperAdminBP' ? userLocationId : "all"
    )
    const [reportData, setReportData] = useState<{ mixer: any[]; dumpTruck: any[]; operatorBP: any[] }>({
        mixer: [],
        dumpTruck: [],
        operatorBP: []
    })
    const [isLoading, setIsLoading] = useState(false)
    const [hasFetched, setHasFetched] = useState(false)
    const [viewingRecipient, setViewingRecipient] = useState<RecipientSummary | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<"ALL" | RecipientType>("ALL")
    const [searchQuery, setSearchQuery] = useState("")

    // Fetch report data
    const fetchReport = useCallback(async () => {
        setIsLoading(true)
        try {
            const data: any = await getRetaseReportByMonth({
                year: selectedYear,
                month: selectedMonth,
                locationId: selectedLocation === "all" ? undefined : selectedLocation,
            })
            if (data && typeof data === "object") {
                setReportData({
                    mixer: Array.isArray(data.mixer) ? data.mixer : [],
                    dumpTruck: Array.isArray(data.dumpTruck) ? data.dumpTruck : [],
                    operatorBP: Array.isArray(data.operatorBP) ? data.operatorBP : [],
                })
            }
        } finally {
            setIsLoading(false)
            setHasFetched(true)
        }
    }, [selectedYear, selectedMonth, selectedLocation])

    // Auto-fetch on initial mount and when filters change (never blank screen!)
    useEffect(() => {
        fetchReport()
    }, [fetchReport])

    // Aggregate all recipients across Operator BP, Mixer Drivers, and Dump Truck Drivers
    const allSummaries: RecipientSummary[] = useMemo(() => {
        const map = new Map<string, RecipientSummary>()

        // 1. Operator Batching Plant
        reportData.operatorBP.forEach(tx => {
            const key = `op_${tx.operatorId}`
            if (!map.has(key)) {
                map.set(key, {
                    id: tx.operatorId,
                    recipientType: "OPERATOR_BP",
                    name: tx.operatorName || "Operator BP",
                    roleLabel: "Operator Batching Plant",
                    locationName: tx.locationName || "-",
                    totalTrip: 0,
                    totalVolume: 0,
                    totalKm: 0,
                    ratePrice: tx.rate_price || 0,
                    totalIncome: 0,
                    records: []
                })
            }
            const o = map.get(key)!
            o.totalTrip++
            o.totalVolume += tx.volume_cubic || 0
            o.totalIncome += tx.income_amount || 0
            if (tx.rate_price && (!o.ratePrice || o.ratePrice === 0)) {
                o.ratePrice = tx.rate_price
            }
            o.records.push(tx)
        })

        // 2. Sopir Truk Mixer
        reportData.mixer.forEach(tx => {
            if (!tx.retase) return
            const key = `mixer_${tx.driverId}`
            if (!map.has(key)) {
                map.set(key, {
                    id: tx.driverId,
                    recipientType: "MIXER",
                    name: tx.driver?.name || "Sopir Mixer",
                    roleLabel: "Sopir Mixer",
                    locationName: tx.location?.name || "-",
                    vehicleCode: tx.vehicle?.code || "-",
                    plateNumber: tx.vehicle?.plate_number || "-",
                    totalTrip: 0,
                    totalVolume: 0,
                    totalKm: 0,
                    ratePrice: tx.retase.price_per_cubic_km || 0,
                    totalIncome: 0,
                    records: []
                })
            }
            const d = map.get(key)!
            d.totalTrip++
            d.totalVolume += tx.volume_cubic || 0
            d.totalKm += tx.retase.calculated_distance || 0
            d.totalIncome += tx.retase.income_amount || 0
            d.records.push(tx)
        })

        // 3. Sopir Dump Truck (Agregat Quarry)
        reportData.dumpTruck.forEach(tx => {
            const driverKey = tx.driverId || tx.driver_name || "Unknown"
            const key = `dt_${driverKey}`
            if (!map.has(key)) {
                map.set(key, {
                    id: tx.driverId || `name_${encodeURIComponent(tx.driver_name || "Sopir DT")}`,
                    recipientType: "DUMP_TRUCK",
                    name: tx.driver?.name || tx.driver_name || "Sopir Dump Truck",
                    roleLabel: "Sopir Dump Truck",
                    locationName: tx.location?.name || "-",
                    vehicleCode: tx.vehicle?.code || "Dump Truck",
                    plateNumber: tx.plate_number || tx.vehicle?.plate_number || "-",
                    dumpTruckSize: tx.dump_truck_size || tx.vehicle?.dump_truck_size || "-",
                    totalTrip: 0,
                    totalVolume: 0,
                    totalKm: 0,
                    ratePrice: tx.rate_price || 0,
                    totalIncome: 0,
                    records: []
                })
            }
            const d = map.get(key)!
            d.totalTrip++
            d.totalVolume += tx.volume_cubic || 0
            d.totalKm += tx.distance_km || 0
            d.totalIncome += tx.retase_amount || 0
            d.records.push(tx)
        })

        return Array.from(map.values())
    }, [reportData])

    // Counts per category
    const operatorCount = useMemo(() => allSummaries.filter(s => s.recipientType === "OPERATOR_BP").length, [allSummaries])
    const mixerCount = useMemo(() => allSummaries.filter(s => s.recipientType === "MIXER").length, [allSummaries])
    const dtCount = useMemo(() => allSummaries.filter(s => s.recipientType === "DUMP_TRUCK").length, [allSummaries])

    // Filtered by Category Tab & Search Query
    const filteredSummaries: RecipientSummary[] = useMemo(() => {
        let list = allSummaries
        if (categoryFilter !== "ALL") {
            list = list.filter(d => d.recipientType === categoryFilter)
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            list = list.filter(d =>
                d.name.toLowerCase().includes(q) ||
                (d.vehicleCode && d.vehicleCode.toLowerCase().includes(q)) ||
                (d.plateNumber && d.plateNumber.toLowerCase().includes(q)) ||
                d.locationName.toLowerCase().includes(q) ||
                d.roleLabel.toLowerCase().includes(q)
            )
        }
        return list.sort((a, b) => b.totalIncome - a.totalIncome)
    }, [allSummaries, categoryFilter, searchQuery])

    // High level totals for the top stats bar
    const totals = useMemo(() => {
        const totalVolumeAll = reportData.mixer.reduce((s, t) => s + (t.volume_cubic || 0), 0)
        const opIncome = allSummaries.filter(s => s.recipientType === "OPERATOR_BP").reduce((s, d) => s + d.totalIncome, 0)
        const mixerIncome = allSummaries.filter(s => s.recipientType === "MIXER").reduce((s, d) => s + d.totalIncome, 0)
        const dtIncome = allSummaries.filter(s => s.recipientType === "DUMP_TRUCK").reduce((s, d) => s + d.totalIncome, 0)
        const totalTripAll = allSummaries.reduce((s, d) => s + d.totalTrip, 0)
        const grandTotal = opIncome + mixerIncome + dtIncome

        return {
            volume: totalVolumeAll,
            opIncome,
            mixerIncome,
            dtIncome,
            grandTotal,
            totalTrip: totalTripAll,
            totalRecipients: allSummaries.length
        }
    }, [allSummaries, reportData])

    const handlePrintRecipient = (recipient: RecipientSummary) => {
        const typeParam = recipient.recipientType.toLowerCase()
        const url = `/print/retase/${recipient.id}?month=${selectedMonth}&year=${selectedYear}&type=${typeParam}${
            selectedLocation !== 'all' ? `&locationId=${selectedLocation}` : ''
        }`
        window.open(url, '_blank')
    }

    return (
        <div className="space-y-3.5">
            {/* Page Header (Compact) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            Laporan Retase Batchingplant
                        </h1>
                        <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-300 font-mono py-0.5">
                            Periode: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                        </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                        Akumulasi insentif Operator Batching Plant &amp; retase armada (Truk Mixer &amp; Dump Truck).
                    </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchReport}
                        disabled={isLoading}
                        className="h-8 text-xs px-2.5 gap-1.5 bg-white border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
                        <span>Segarkan</span>
                    </Button>
                </div>
            </div>

            {/* Filter Toolbar (Compact Single Bar) */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-2.5 sm:p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-end">
                    {/* Tahun */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>Tahun</span>
                        </label>
                        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
                            <SelectTrigger className="h-8 text-xs bg-slate-50/70 border-slate-200 hover:bg-white focus:bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(availableYears || [now.getFullYear()]).map((y: number) => (
                                    <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Bulan */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>Bulan</span>
                        </label>
                        <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
                            <SelectTrigger className="h-8 text-xs bg-slate-50/70 border-slate-200 hover:bg-white focus:bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTH_NAMES.map((m, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cabang BP */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            <span>Cabang BP</span>
                        </label>
                        {userRole === 'SuperAdminBP' ? (
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger className="h-8 text-xs bg-slate-50/70 border-slate-200 hover:bg-white focus:bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs font-medium">🏢 Semua Cabang (Konsolidasi)</SelectItem>
                                    {locations?.map((loc: any) => (
                                        <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                            📍 {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="h-8 px-2.5 flex items-center bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-600 font-medium truncate">
                                {locations?.[0]?.name ? `📍 ${locations[0].name}` : "Cabang Terkunci"}
                            </div>
                        )}
                    </div>

                    {/* Tombol Terapkan Filter */}
                    <div>
                        <Button
                            onClick={fetchReport}
                            disabled={isLoading}
                            className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                            {isLoading ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat...</>
                            ) : (
                                <><RefreshCw className="h-3.5 w-3.5" /> Terapkan Filter</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Compact KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {/* Volume Cor */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-medium text-slate-500">Volume Cor</div>
                        <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                            {totals.volume.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                            <span className="text-xs text-slate-400 font-normal ml-1">m³</span>
                        </div>
                    </div>
                    <div className="p-2 rounded-md bg-blue-50 text-blue-600">
                        <Layers className="h-4 w-4" />
                    </div>
                </div>

                {/* Insentif Operator BP */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-medium text-slate-500">Insentif Operator BP</div>
                        <div className="text-lg font-bold font-mono text-violet-700 mt-0.5">
                            <span className="text-xs font-semibold mr-0.5">Rp</span>
                            {totals.opIncome.toLocaleString("id-ID")}
                        </div>
                    </div>
                    <div className="p-2 rounded-md bg-violet-50 text-violet-600">
                        <HardHat className="h-4 w-4" />
                    </div>
                </div>

                {/* Retase Mixer */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-medium text-slate-500">Retase Truk Mixer</div>
                        <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">
                            <span className="text-xs font-semibold mr-0.5">Rp</span>
                            {totals.mixerIncome.toLocaleString("id-ID")}
                        </div>
                    </div>
                    <div className="p-2 rounded-md bg-sky-50 text-sky-600">
                        <Truck className="h-4 w-4" />
                    </div>
                </div>

                {/* Retase Dump Truck */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-medium text-slate-500">Retase Dump Truck</div>
                        <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
                            <span className="text-xs font-semibold mr-0.5">Rp</span>
                            {totals.dtIncome.toLocaleString("id-ID")}
                        </div>
                    </div>
                    <div className="p-2 rounded-md bg-amber-50 text-amber-600">
                        <Mountain className="h-4 w-4" />
                    </div>
                </div>

                {/* Grand Total */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-2.5 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
                    <div>
                        <div className="text-[11px] font-semibold text-emerald-800">Total Insentif</div>
                        <div className="text-lg font-black font-mono text-emerald-700 mt-0.5">
                            <span className="text-xs font-semibold mr-0.5">Rp</span>
                            {totals.grandTotal.toLocaleString("id-ID")}
                        </div>
                    </div>
                    <div className="p-2 rounded-md bg-emerald-100 text-emerald-700">
                        <TrendingUp className="h-4 w-4" />
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {isLoading && !hasFetched ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2.5">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                    <span className="text-xs font-medium">Mengambil dan menghitung data insentif...</span>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {/* Tabs & Search Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Segmented Buttons */}
                        <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 gap-0.5 text-xs flex-wrap">
                            <button
                                type="button"
                                onClick={() => setCategoryFilter("ALL")}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                    categoryFilter === "ALL"
                                        ? "bg-white text-slate-900 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Semua ({allSummaries.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategoryFilter("OPERATOR_BP")}
                                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    categoryFilter === "OPERATOR_BP"
                                        ? "bg-white text-violet-700 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <HardHat className="w-3 h-3 text-violet-600" />
                                <span>Operator BP ({operatorCount})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategoryFilter("MIXER")}
                                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    categoryFilter === "MIXER"
                                        ? "bg-white text-blue-700 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Truck className="w-3 h-3 text-blue-600" />
                                <span>Sopir Mixer ({mixerCount})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategoryFilter("DUMP_TRUCK")}
                                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    categoryFilter === "DUMP_TRUCK"
                                        ? "bg-white text-amber-700 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Mountain className="w-3 h-3 text-amber-600" />
                                <span>Sopir DT ({dtCount})</span>
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <Input
                                placeholder="Cari nama / plat / cabang..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 h-8 text-xs bg-white border-slate-200"
                            />
                        </div>
                    </div>

                    {/* Table Data (High-Density ERP View) */}
                    {filteredSummaries.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg text-slate-400 bg-white">
                            <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p className="font-semibold text-slate-700 text-xs">Tidak ada data penerima insentif pada periode ini</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Periode {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                            <Table>
                                <TableHeader className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                                    <TableRow className="h-8">
                                        <TableHead className="w-9 text-center">#</TableHead>
                                        <TableHead>Nama Penerima</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Cabang / Unit</TableHead>
                                        <TableHead className="text-center">Trip / Batch</TableHead>
                                        <TableHead className="text-right">Volume (m³)</TableHead>
                                        <TableHead className="text-right">Tarif Satuan</TableHead>
                                        <TableHead className="text-right">Total Insentif</TableHead>
                                        <TableHead className="w-20 text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="text-xs divide-y divide-slate-100">
                                    {filteredSummaries.map((item, i) => (
                                        <TableRow
                                            key={`${item.recipientType}_${item.id}`}
                                            className="h-10 hover:bg-slate-50/80 transition-colors"
                                        >
                                            <TableCell className="text-center font-mono text-slate-400 text-[11px]">
                                                {i + 1}
                                            </TableCell>
                                            <TableCell
                                                className="font-bold text-slate-900 cursor-pointer"
                                                onClick={() => setViewingRecipient(item)}
                                            >
                                                <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                                                    <span>{item.name}</span>
                                                    {item.plateNumber && item.plateNumber !== "-" && (
                                                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                                                            [{item.plateNumber}]
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {item.recipientType === "OPERATOR_BP" ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                                                        <HardHat className="w-2.5 h-2.5" />
                                                        Operator BP
                                                    </span>
                                                ) : item.recipientType === "MIXER" ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                        <Truck className="w-2.5 h-2.5" />
                                                        Sopir Mixer
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <Mountain className="w-2.5 h-2.5" />
                                                        Sopir DT ({item.dumpTruckSize === "BESAR" ? "Besar" : "Kecil"})
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                <div className="flex items-center gap-1 text-[11px]">
                                                    <span>{item.locationName}</span>
                                                    {item.vehicleCode && item.vehicleCode !== "-" && (
                                                        <span className="text-slate-400 font-mono">({item.vehicleCode})</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-semibold font-mono text-slate-700">
                                                {item.totalTrip} {item.recipientType === "OPERATOR_BP" ? "Batch" : "Rit"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-medium text-slate-800">
                                                {item.totalVolume.toFixed(1)} m³
                                            </TableCell>
                                            <TableCell className="text-right text-[11px] font-mono text-slate-500">
                                                {item.recipientType === "OPERATOR_BP" ? (
                                                    <span>Rp {item.ratePrice.toLocaleString("id-ID")}/m³</span>
                                                ) : (
                                                    <span>{item.totalKm.toFixed(0)} KM</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold font-mono text-emerald-700">
                                                Rp {item.totalIncome.toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                                        title="Lihat Rincian"
                                                        onClick={() => setViewingRecipient(item)}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                                        title="Cetak Slip"
                                                        onClick={() => handlePrintRecipient(item)}
                                                    >
                                                        <Printer className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!viewingRecipient} onOpenChange={o => { if (!o) setViewingRecipient(null) }}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
                    {viewingRecipient && (
                        <>
                            <DialogHeader className="pb-3 border-b border-slate-100">
                                <DialogTitle className="flex items-center justify-between pr-6">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-slate-900">{viewingRecipient.name}</span>
                                            {viewingRecipient.recipientType === "OPERATOR_BP" ? (
                                                <Badge className="bg-violet-100 text-violet-800 text-[10px]">Operator Batching Plant</Badge>
                                            ) : viewingRecipient.recipientType === "MIXER" ? (
                                                <Badge className="bg-blue-100 text-blue-800 text-[10px]">Sopir Truk Mixer</Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-800 text-[10px]">Sopir Dump Truck</Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 font-normal">
                                            Cabang: {viewingRecipient.locationName} &nbsp;|&nbsp; Periode: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                                            {viewingRecipient.vehicleCode && ` | Armada: ${viewingRecipient.vehicleCode}`}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 shrink-0 border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
                                        onClick={() => handlePrintRecipient(viewingRecipient)}
                                    >
                                        <Printer className="h-4 w-4 text-slate-600" />
                                        <span>Cetak Slip Insentif</span>
                                    </Button>
                                </DialogTitle>
                            </DialogHeader>

                            {/* Summary Stats in Modal */}
                            <div className="grid grid-cols-4 gap-3 my-2">
                                {[
                                    {
                                        label: viewingRecipient.recipientType === "OPERATOR_BP" ? "Total Batch" : "Total Trip",
                                        value: `${viewingRecipient.totalTrip}×`
                                    },
                                    {
                                        label: "Total Kubikasi",
                                        value: `${viewingRecipient.totalVolume.toFixed(1)} m³`
                                    },
                                    {
                                        label: viewingRecipient.recipientType === "OPERATOR_BP" ? "Tarif / m³" : "Total Jarak",
                                        value: viewingRecipient.recipientType === "OPERATOR_BP"
                                            ? `Rp ${viewingRecipient.ratePrice.toLocaleString("id-ID")}`
                                            : `${viewingRecipient.totalKm.toFixed(0)} km`
                                    },
                                    {
                                        label: "Total Insentif",
                                        value: `Rp ${viewingRecipient.totalIncome.toLocaleString('id-ID')}`,
                                        highlight: true
                                    },
                                ].map(s => (
                                    <div key={s.label} className={`p-3 rounded-lg text-center ${s.highlight ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'}`}>
                                        <div className={`font-black text-base font-mono ${s.highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{s.value}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide font-semibold">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Detail Table */}
                            <div className="overflow-auto flex-1 border border-slate-200 rounded-lg">
                                {viewingRecipient.recipientType === "OPERATOR_BP" ? (
                                    /* TABLE FOR OPERATOR BP */
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-slate-50">
                                            <TableRow className="text-xs">
                                                <TableHead>Tgl & Waktu</TableHead>
                                                <TableHead>No. Tiket / Trip</TableHead>
                                                <TableHead>Pelanggan & Proyek</TableHead>
                                                <TableHead>Mutu Beton</TableHead>
                                                <TableHead>Armada Mixer</TableHead>
                                                <TableHead className="text-right">Vol (m³)</TableHead>
                                                <TableHead className="text-right">Tarif / m³</TableHead>
                                                <TableHead className="text-right text-emerald-700">Insentif</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewingRecipient.records.map((tx: any) => (
                                                <TableRow key={tx.id} className="hover:bg-slate-50 text-xs">
                                                    <TableCell className="py-2 font-mono">
                                                        <div>{format(new Date(tx.date), "dd MMM yyyy", { locale: idLocale })}</div>
                                                        <div className="text-slate-400 text-[10px]">{format(new Date(tx.date), "HH:mm")}</div>
                                                    </TableCell>
                                                    <TableCell className="py-2 font-mono font-semibold">
                                                        TM-{tx.trip_sequence}
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <div className="font-semibold text-slate-800">{tx.customer?.customer_name || tx.project?.customer?.customer_name || "-"}</div>
                                                        <div className="text-slate-400 text-[10px]">{tx.project?.name || "-"}</div>
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <Badge variant="secondary" className="text-[10px] font-bold">{tx.concreteQuality?.name || "-"}</Badge>
                                                    </TableCell>
                                                    <TableCell className="py-2 font-mono text-slate-600">
                                                        {tx.vehicle?.code || "-"}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-mono font-bold text-blue-700">
                                                        {tx.volume_cubic?.toFixed(1)}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-mono text-slate-500">
                                                        Rp {tx.rate_price?.toLocaleString('id-ID')}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-mono font-bold text-emerald-700">
                                                        Rp {tx.income_amount?.toLocaleString('id-ID')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : viewingRecipient.recipientType === "MIXER" ? (
                                    /* TABLE FOR MIXER */
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-slate-50">
                                            <TableRow className="text-xs">
                                                <TableHead>Tgl / Waktu</TableHead>
                                                <TableHead>Customer / Proyek</TableHead>
                                                <TableHead>Mutu</TableHead>
                                                <TableHead className="text-right">Vol (m³)</TableHead>
                                                <TableHead className="text-right">Jarak (KM)</TableHead>
                                                <TableHead className="text-right">Rate</TableHead>
                                                <TableHead className="text-right text-emerald-700">Komisi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewingRecipient.records.map((tx: any) => (
                                                <TableRow key={tx.id} className="hover:bg-slate-50 text-xs">
                                                    <TableCell className="py-2 font-mono">
                                                        <div>{format(new Date(tx.date), "dd MMM yyyy", { locale: idLocale })}</div>
                                                        <div className="text-slate-400 text-[10px]">{format(new Date(tx.date), "HH:mm")}</div>
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <div className="font-semibold text-slate-800">{tx.project?.customer?.customer_name ?? '-'}</div>
                                                        <div className="text-slate-400 text-[10px]">{tx.project?.name ?? '-'}</div>
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <Badge variant="secondary" className="text-[10px] font-bold">{tx.concreteQuality?.name || "-"}</Badge>
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-mono font-semibold">{tx.volume_cubic}</TableCell>
                                                    <TableCell className="py-2 text-right font-mono">{tx.retase?.calculated_distance}</TableCell>
                                                    <TableCell className="py-2 text-right font-mono text-slate-500">
                                                        Rp {tx.retase?.price_per_cubic_km?.toLocaleString('id-ID')}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-mono font-bold text-emerald-700">
                                                        Rp {tx.retase?.income_amount?.toLocaleString('id-ID')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    /* TABLE FOR DUMP TRUCK */
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-slate-50">
                                            <TableRow className="text-xs">
                                                <TableHead>Tanggal</TableHead>
                                                <TableHead>No Bon / DO</TableHead>
                                                <TableHead>Armada & Plat</TableHead>
                                                <TableHead>Tipe DT</TableHead>
                                                <TableHead>Material</TableHead>
                                                <TableHead className="text-right">Vol (m³)</TableHead>
                                                <TableHead className="text-right">Jarak (KM)</TableHead>
                                                <TableHead className="text-right">Tarif (Rp)</TableHead>
                                                <TableHead className="text-right text-emerald-700">Komisi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewingRecipient.records.map((tx: any) => (
                                                <TableRow key={tx.id} className="hover:bg-slate-50 text-xs">
                                                    <TableCell className="py-2 font-mono">
                                                        <div>{format(new Date(tx.date), "dd MMM yyyy", { locale: idLocale })}</div>
                                                    </TableCell>
                                                    <TableCell className="py-2 font-mono font-bold text-slate-800">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{tx.no_bon || "-"}</span>
                                                            {tx.movement_type === "OUTGOING" ? (
                                                                <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                                    Keluar
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    Masuk
                                                                </span>
                                                            )}
                                                        </div>
                                                        {tx.recipient && (
                                                            <div className="text-[10px] text-slate-500 font-normal font-sans">
                                                                Tujuan: {tx.recipient}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-2 font-mono">
                                                        <div className="font-semibold text-slate-900">{tx.vehicle?.code || "DT"}</div>
                                                        <div className="text-[10px] text-slate-500">{tx.plate_number}</div>
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[9px] px-1 py-0 ${
                                                                tx.dump_truck_size === "BESAR"
                                                                    ? "bg-amber-50 text-amber-700 border-amber-300"
                                                                    : "bg-blue-50 text-blue-700 border-blue-300"
                                                            }`}
                                                        >
                                                            {tx.dump_truck_size === "BESAR" ? "DT Besar" : "DT Kecil"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {tx.aggregate_type === "Other" && tx.custom_material_name
                                                                ? tx.custom_material_name
                                                                : tx.aggregate_type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-mono font-semibold">
                                                        {tx.volume_cubic?.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-mono">
                                                        {tx.distance_km != null ? `${tx.distance_km}` : "-"}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-mono text-slate-500">
                                                        Rp {tx.rate_price?.toLocaleString('id-ID')}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-mono font-bold text-emerald-700">
                                                        Rp {tx.retase_amount?.toLocaleString('id-ID')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>

                            {/* Footer Total */}
                            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-sm">
                                <span className="text-slate-500 text-xs">
                                    {viewingRecipient.totalTrip} transaksi terkonfirmasi
                                </span>
                                <div className="font-black text-emerald-700 text-base font-mono">
                                    Total Insentif: Rp {viewingRecipient.totalIncome.toLocaleString('id-ID')}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
