"use client"

import { useState, useMemo } from "react"
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
import { Loader2, Search, Printer, User, TrendingUp, Truck, ChevronRight, Mountain } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export type DriverSummary = {
    driverId: string
    driverType: "MIXER" | "DUMP_TRUCK"
    name: string
    vehicleCode: string
    plateNumber?: string
    dumpTruckSize?: string
    totalTrip: number
    totalVolume: number
    totalKm: number
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
    const [reportData, setReportData] = useState<{ mixer: any[]; dumpTruck: any[] }>({ mixer: [], dumpTruck: [] })
    const [isLoading, setIsLoading] = useState(false)
    const [hasFetched, setHasFetched] = useState(false)
    const [viewingDriver, setViewingDriver] = useState<DriverSummary | null>(null)
    const [driverTypeFilter, setDriverTypeFilter] = useState<"ALL" | "MIXER" | "DUMP_TRUCK">("ALL")
    const [searchQuery, setSearchQuery] = useState("")

    // Aggregate per-driver across Mixer & Dump Truck
    const allDriverSummaries: DriverSummary[] = useMemo(() => {
        const map = new Map<string, DriverSummary>()

        // 1. Mixer Drivers
        reportData.mixer.forEach(tx => {
            if (!tx.retase) return
            const key = `mixer_${tx.driverId}`
            if (!map.has(key)) {
                map.set(key, {
                    driverId: tx.driverId,
                    driverType: "MIXER",
                    name: tx.driver?.name || "Sopir Mixer",
                    vehicleCode: tx.vehicle?.code || "-",
                    plateNumber: tx.vehicle?.plate_number || "-",
                    totalTrip: 0,
                    totalVolume: 0,
                    totalKm: 0,
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

        // 2. Dump Truck Drivers
        reportData.dumpTruck.forEach(tx => {
            const driverKey = tx.driverId || tx.driver_name || "Unknown"
            const key = `dt_${driverKey}`
            if (!map.has(key)) {
                map.set(key, {
                    driverId: tx.driverId || `name_${encodeURIComponent(tx.driver_name || "Sopir DT")}`,
                    driverType: "DUMP_TRUCK",
                    name: tx.driver?.name || tx.driver_name || "Sopir Dump Truck",
                    vehicleCode: tx.vehicle?.code || "Dump Truck",
                    plateNumber: tx.plate_number || tx.vehicle?.plate_number || "-",
                    dumpTruckSize: tx.dump_truck_size || tx.vehicle?.dump_truck_size || "-",
                    totalTrip: 0,
                    totalVolume: 0,
                    totalKm: 0,
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

    const mixerCount = useMemo(() => allDriverSummaries.filter(d => d.driverType === "MIXER").length, [allDriverSummaries])
    const dtCount = useMemo(() => allDriverSummaries.filter(d => d.driverType === "DUMP_TRUCK").length, [allDriverSummaries])

    // Filtered by Category Tab & Search Query
    const driverSummaries: DriverSummary[] = useMemo(() => {
        let list = allDriverSummaries
        if (driverTypeFilter !== "ALL") {
            list = list.filter(d => d.driverType === driverTypeFilter)
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            list = list.filter(d =>
                d.name.toLowerCase().includes(q) ||
                d.vehicleCode.toLowerCase().includes(q) ||
                (d.plateNumber && d.plateNumber.toLowerCase().includes(q))
            )
        }
        return list.sort((a, b) => b.totalIncome - a.totalIncome)
    }, [allDriverSummaries, driverTypeFilter, searchQuery])

    const grandTotal = useMemo(() => ({
        trip: driverSummaries.reduce((s, d) => s + d.totalTrip, 0),
        volume: driverSummaries.reduce((s, d) => s + d.totalVolume, 0),
        km: driverSummaries.reduce((s, d) => s + d.totalKm, 0),
        income: driverSummaries.reduce((s, d) => s + d.totalIncome, 0),
        drivers: driverSummaries.length,
    }), [driverSummaries])

    const fetchReport = async () => {
        setIsLoading(true)
        setHasFetched(false)
        try {
            const data = await getRetaseReportByMonth({
                year: selectedYear,
                month: selectedMonth,
                locationId: selectedLocation === "all" ? undefined : selectedLocation,
            })
            if (Array.isArray(data)) {
                setReportData({ mixer: data, dumpTruck: [] })
            } else if (data && typeof data === "object") {
                setReportData({
                    mixer: Array.isArray(data.mixer) ? data.mixer : [],
                    dumpTruck: Array.isArray(data.dumpTruck) ? data.dumpTruck : [],
                })
            }
        } finally {
            setIsLoading(false)
            setHasFetched(true)
        }
    }

    const handlePrintDriver = (driver: DriverSummary) => {
        const typeParam = driver.driverType.toLowerCase()
        const url = `/print/retase/${driver.driverId}?month=${selectedMonth}&year=${selectedYear}&type=${typeParam}${
            selectedLocation !== 'all' ? `&locationId=${selectedLocation}` : ''
        }`
        window.open(url, '_blank')
    }

    return (
        <div className="space-y-6">
            {/* Hero Filter Card */}
            <Card className="border-none shadow-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Rekap Gaji / Retase Supir</h2>
                            <p className="text-slate-300 text-sm">
                                Akumulasi perhitungan retase per supir (Truk Mixer & Dump Truck Agregat)
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                        {/* Tahun */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tahun</label>
                            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/30 hover:bg-white/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(availableYears || [now.getFullYear()]).map((y: number) => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bulan */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Bulan</label>
                            <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/30 hover:bg-white/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTH_NAMES.map((m, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cabang (SuperAdmin only) */}
                        {userRole === 'SuperAdminBP' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Cabang</label>
                                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/30 hover:bg-white/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Cabang</SelectItem>
                                        {locations?.map((loc: any) => (
                                            <SelectItem key={loc.id} value={loc.id}>📍 {loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Tombol Tampilkan */}
                        <div className={userRole !== 'SuperAdminBP' ? "col-span-2 md:col-span-2" : ""}>
                            <Button
                                onClick={fetchReport}
                                disabled={isLoading}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 shadow-sm transition-all"
                            >
                                {isLoading
                                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Memuat Data...</>
                                    : <><Search className="h-4 w-4" /> Tampilkan Rekap Gaji</>
                                }
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Section */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <span className="text-sm font-medium">Mengambil dan menghitung retase supir...</span>
                </div>
            )}

            {!isLoading && hasFetched && (
                <div className="space-y-5">
                    {/* Category Tabs & Search Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Segmented Buttons */}
                        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setDriverTypeFilter("ALL")}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    driverTypeFilter === "ALL"
                                        ? "bg-white text-slate-900 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Semua Sopir ({allDriverSummaries.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setDriverTypeFilter("MIXER")}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    driverTypeFilter === "MIXER"
                                        ? "bg-white text-blue-700 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Sopir Mixer ({mixerCount})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDriverTypeFilter("DUMP_TRUCK")}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    driverTypeFilter === "DUMP_TRUCK"
                                        ? "bg-white text-emerald-700 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Mountain className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Sopir Dump Truck ({dtCount})</span>
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-72">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <Input
                                placeholder="Cari supir, armada, plat..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs bg-white"
                            />
                        </div>
                    </div>

                    {/* Summary KPI Cards */}
                    {allDriverSummaries.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Card className="border-slate-200 bg-white shadow-2xs">
                                <CardContent className="p-3.5">
                                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Sopir Aktif</div>
                                    <div className="mt-1 flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-slate-900 font-mono">{grandTotal.drivers}</span>
                                        <span className="text-xs text-slate-500">orang</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 bg-white shadow-2xs">
                                <CardContent className="p-3.5">
                                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Pengiriman / Rit</div>
                                    <div className="mt-1 flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-slate-900 font-mono">{grandTotal.trip}</span>
                                        <span className="text-xs text-slate-500">ritase</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 bg-white shadow-2xs">
                                <CardContent className="p-3.5">
                                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Volume Angkut</div>
                                    <div className="mt-1 flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-blue-700 font-mono">
                                            {grandTotal.volume.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                                        </span>
                                        <span className="text-xs text-slate-500">m³</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-emerald-200 bg-emerald-50/50 shadow-2xs">
                                <CardContent className="p-3.5">
                                    <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Total Komisi Retase</div>
                                    <div className="mt-1 flex items-baseline gap-1">
                                        <span className="text-xs font-bold text-emerald-800">Rp</span>
                                        <span className="text-xl font-black text-emerald-700 font-mono">
                                            {grandTotal.income.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Driver List */}
                    {driverSummaries.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-xl text-slate-400 bg-slate-50/50">
                            <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold text-slate-700">Tidak ada data retase supir yang ditemukan</p>
                            <p className="text-xs mt-1 text-slate-500">
                                untuk periode {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                                {driverTypeFilter !== "ALL" ? ` (Kategori: ${driverTypeFilter === "MIXER" ? "Mixer" : "Dump Truck"})` : ""}
                            </p>
                        </div>
                    ) : (
                        <Card className="border-slate-200 shadow-2xs overflow-hidden bg-white">
                            <CardHeader className="border-b border-slate-100 py-3.5 px-6 bg-slate-50/70">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-900">
                                            Rekap Komisi Per Sopir — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Klik baris sopir untuk melihat rincian riil perjalanan dan cetak slip gaji retase.
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="text-xs font-mono font-bold">
                                        {driverSummaries.length} Sopir
                                    </Badge>
                                </div>
                            </CardHeader>
                            <div className="divide-y divide-slate-100">
                                {driverSummaries.map((driver, i) => (
                                    <div
                                        key={driver.driverId}
                                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        onClick={() => setViewingDriver(driver)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Rank Badge */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                                                i === 0 ? 'bg-amber-500 shadow-xs' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-300'
                                            }`}>
                                                {i + 1}
                                            </div>

                                            {/* Driver Info */}
                                            <div>
                                                <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                                    <span>{driver.name}</span>
                                                    {driver.driverType === "MIXER" ? (
                                                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none text-[10px] font-semibold flex items-center gap-1">
                                                            <Truck className="w-3 h-3" />
                                                            <span>Mixer ({driver.vehicleCode})</span>
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none text-[10px] font-semibold flex items-center gap-1">
                                                            <Mountain className="w-3 h-3" />
                                                            <span>Dump Truck ({driver.dumpTruckSize === "BESAR" ? "DT Besar" : "DT Kecil"})</span>
                                                        </Badge>
                                                    )}
                                                    {driver.plateNumber && driver.plateNumber !== "-" && (
                                                        <span className="text-[11px] font-mono text-slate-400">
                                                            {driver.plateNumber}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                                    <span className="font-semibold text-slate-700">{driver.totalTrip} Rit</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>{driver.totalVolume.toFixed(1)} m³ Total</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>{driver.totalKm.toFixed(0)} KM Jarak</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="font-black text-emerald-700 text-base font-mono">
                                                    Rp {driver.totalIncome.toLocaleString('id-ID')}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium">Total Komisi Retase</div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!viewingDriver} onOpenChange={o => { if (!o) setViewingDriver(null) }}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
                    {viewingDriver && (
                        <>
                            <DialogHeader className="pb-3 border-b border-slate-100">
                                <DialogTitle className="flex items-center justify-between pr-6">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-slate-900">{viewingDriver.name}</span>
                                            {viewingDriver.driverType === "MIXER" ? (
                                                <Badge className="bg-blue-100 text-blue-800 text-[10px]">Truk Mixer</Badge>
                                            ) : (
                                                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Dump Truck</Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 font-normal">
                                            Armada: {viewingDriver.vehicleCode} {viewingDriver.plateNumber ? `(${viewingDriver.plateNumber})` : ""} &nbsp;|&nbsp; Periode: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 shrink-0 border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
                                        onClick={() => handlePrintDriver(viewingDriver)}
                                    >
                                        <Printer className="h-4 w-4 text-slate-600" />
                                        <span>Cetak Slip Retase</span>
                                    </Button>
                                </DialogTitle>
                            </DialogHeader>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-4 gap-3 my-2">
                                {[
                                    { label: "Total Trip", value: `${viewingDriver.totalTrip}×` },
                                    { label: "Total Volume", value: `${viewingDriver.totalVolume.toFixed(1)} m³` },
                                    { label: "Total Jarak", value: `${viewingDriver.totalKm.toFixed(0)} km` },
                                    { label: "Total Komisi", value: `Rp ${viewingDriver.totalIncome.toLocaleString('id-ID')}`, highlight: true },
                                ].map(s => (
                                    <div key={s.label} className={`p-3 rounded-lg text-center ${s.highlight ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'}`}>
                                        <div className={`font-black text-base font-mono ${s.highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{s.value}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide font-semibold">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Detail Table */}
                            <div className="overflow-auto flex-1 border border-slate-200 rounded-lg">
                                {viewingDriver.driverType === "MIXER" ? (
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
                                            {viewingDriver.records.map((tx: any) => (
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
                                            {viewingDriver.records.map((tx: any) => (
                                                <TableRow key={tx.id} className="hover:bg-slate-50 text-xs">
                                                    <TableCell className="py-2 font-mono">
                                                        <div>{format(new Date(tx.date), "dd MMM yyyy", { locale: idLocale })}</div>
                                                    </TableCell>
                                                    <TableCell className="py-2 font-mono font-bold text-slate-800">
                                                        {tx.no_bon}
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
                                                            {tx.aggregate_type}
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
                                    {viewingDriver.totalTrip} pengiriman/ritase terkonfirmasi
                                </span>
                                <div className="font-black text-emerald-700 text-base font-mono">
                                    Total Retase: Rp {viewingDriver.totalIncome.toLocaleString('id-ID')}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
