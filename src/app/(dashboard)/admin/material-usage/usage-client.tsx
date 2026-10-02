"use client"

import { useMemo, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from "@/components/ui/table"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Factory, Package, Layers, Weight, Calendar, Download,
    Search, Filter, Info, ChevronDown, Check, Sparkles,
    TrendingUp, BarChart3, HelpCircle, ArrowUpRight, Scale, SlidersHorizontal,
    FileSpreadsheet
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

type PeriodFilter = "today" | "7days" | "month" | "all" | string
type UnitType = "ton" | "kg"
type ChartMode = "grouped" | "stacked"

export function MaterialUsageClient({
    initialData,
    locations,
    userRole,
    isCorporate = false,
}: {
    initialData: any[]
    locations: any[]
    userRole: string
    isCorporate?: boolean
}) {
    const [selectedLocation, setSelectedLocation] = useState<string>("all")
    const [unit, setUnit] = useState<UnitType>("ton")
    const [chartMode, setChartMode] = useState<ChartMode>("grouped")

    // Extract all distinct historical months from actual transactions
    const availableMonths = useMemo(() => {
        const monthMap = new Map<string, string>()
        initialData.forEach((t: any) => {
            if (t.date) {
                const d = new Date(t.date)
                const key = format(d, "yyyy-MM")
                if (!monthMap.has(key)) {
                    monthMap.set(key, format(d, "MMMM yyyy", { locale: idLocale }))
                }
            }
        })
        return Array.from(monthMap.entries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([value, label]) => ({ value, label }))
    }, [initialData])

    // Initial period state: if current month has no transactions, auto-select latest available month with data
    const [period, setPeriod] = useState<PeriodFilter>(() => {
        const currentMonthKey = format(new Date(), "yyyy-MM")
        const hasCurrentMonthData = initialData.some(t => t.date && format(new Date(t.date), "yyyy-MM") === currentMonthKey)
        return hasCurrentMonthData ? "month" : (availableMonths[0]?.value || "month")
    })

    const showCabang = userRole === "SuperAdminBP" || isCorporate

    // 1. Filter Data by Location
    const locationFiltered = useMemo(() => {
        if (selectedLocation === "all" || !showCabang) return initialData
        return initialData.filter(item => item.locationId === selectedLocation)
    }, [initialData, selectedLocation, showCabang])

    // 2. Filter Data by Time Period
    const filteredData = useMemo(() => {
        if (period === "all") return locationFiltered
        const now = new Date()
        let start: Date
        let end: Date = endOfDay(now)

        if (period === "today") {
            start = startOfDay(now)
        } else if (period === "7days") {
            start = startOfDay(subDays(now, 6))
        } else if (period === "month") {
            start = startOfMonth(now)
        } else if (/^\d{4}-\d{2}$/.test(period)) {
            // Specific Year-Month filter (e.g. 2026-09)
            const [y, m] = period.split("-").map(Number)
            start = startOfMonth(new Date(y, m - 1, 1))
            end = endOfMonth(new Date(y, m - 1, 1))
        } else {
            return locationFiltered
        }

        return locationFiltered.filter((t: any) => {
            const d = new Date(t.date)
            return d >= start && d <= end
        })
    }, [locationFiltered, period])

    // 3. Format Table Rows & Per-Transaction Material Usages
    const tableData = useMemo(() => {
        return filteredData.map((t: any) => {
            const vol = t.volume_cubic || 0
            const q = t.concreteQuality || {}
            const txDate = new Date(t.date)

            const semenKg = vol * (q.composition_cement || 0)
            const pasirKg = vol * (q.composition_sand || 0)
            const b05Kg = vol * (q.composition_stone_05 || 0)
            const b12Kg = vol * (q.composition_stone_12 || 0)
            const b23Kg = vol * (q.composition_stone_23 || 0)
            const batuTotalKg = b05Kg + b12Kg + b23Kg

            return {
                id: t.id,
                dateObj: txDate,
                dateFormatted: format(txDate, "dd MMM yyyy", { locale: idLocale }),
                timeFormatted: format(txDate, "HH:mm"),
                rawDate: txDate.toISOString().split('T')[0],
                vehicleCode: t.vehicle?.code || '-',
                driverName: t.driver?.name || '-',
                customerName: t.project?.customer?.customer_name || t.customer?.customer_name || '-',
                projectName: t.project?.name || '-',
                mutuName: q.name || '-',
                volume: vol,
                // Material in KG
                semen: semenKg,
                pasir: pasirKg,
                batu05: b05Kg,
                batu12: b12Kg,
                batu23: b23Kg,
                batuTotal: batuTotalKg,
                // Material in Ton
                semenTon: semenKg / 1000,
                pasirTon: pasirKg / 1000,
                batuTotalTon: batuTotalKg / 1000,
                // Sak Semen
                semenSak: Math.round(semenKg / 50),
                locationName: t.location?.name || 'Cabang'
            }
        })
    }, [filteredData])

    // 4. Aggregated Summary Metrics
    const metrics = useMemo(() => {
        const totalVol = tableData.reduce((acc, r) => acc + r.volume, 0)
        const totalSemenKg = tableData.reduce((acc, r) => acc + r.semen, 0)
        const totalPasirKg = tableData.reduce((acc, r) => acc + r.pasir, 0)
        const totalBatuKg = tableData.reduce((acc, r) => acc + r.batuTotal, 0)
        const totalBatu05Kg = tableData.reduce((acc, r) => acc + r.batu05, 0)
        const totalBatu12Kg = tableData.reduce((acc, r) => acc + r.batu12, 0)
        const totalBatu23Kg = tableData.reduce((acc, r) => acc + r.batu23, 0)

        const totalDryWeightKg = totalSemenKg + totalPasirKg + totalBatuKg

        // Rata-rata per m3 (Formula Realisasi)
        const avgSemenPerM3 = totalVol > 0 ? Math.round(totalSemenKg / totalVol) : 0
        const avgPasirPerM3 = totalVol > 0 ? Math.round(totalPasirKg / totalVol) : 0
        const avgBatuPerM3 = totalVol > 0 ? Math.round(totalBatuKg / totalVol) : 0

        // Persentase Proporsi
        const propSemen = totalDryWeightKg > 0 ? Math.round((totalSemenKg / totalDryWeightKg) * 100) : 0
        const propPasir = totalDryWeightKg > 0 ? Math.round((totalPasirKg / totalDryWeightKg) * 100) : 0
        const propBatu = totalDryWeightKg > 0 ? Math.max(0, 100 - propSemen - propPasir) : 0

        return {
            volume: totalVol,
            trips: tableData.length,
            semenKg: totalSemenKg,
            semenTon: totalSemenKg / 1000,
            semenSak: Math.round(totalSemenKg / 50),
            pasirKg: totalPasirKg,
            pasirTon: totalPasirKg / 1000,
            batuKg: totalBatuKg,
            batuTon: totalBatuKg / 1000,
            batu05Kg: totalBatu05Kg,
            batu12Kg: totalBatu12Kg,
            batu23Kg: totalBatu23Kg,
            totalDryWeightTon: totalDryWeightKg / 1000,
            avgSemenPerM3,
            avgPasirPerM3,
            avgBatuPerM3,
            propSemen,
            propPasir,
            propBatu
        }
    }, [tableData])

    // 5. Chart Data (Daily breakdown)
    const chartData = useMemo(() => {
        const groups: Record<string, any> = {}
        tableData.forEach(row => {
            const key = row.rawDate
            if (!groups[key]) {
                groups[key] = {
                    key,
                    displayDate: format(row.dateObj, "dd MMM", { locale: idLocale }),
                    semenKg: 0,
                    pasirKg: 0,
                    batuKg: 0,
                    volume: 0,
                    trips: 0
                }
            }
            groups[key].semenKg += row.semen
            groups[key].pasirKg += row.pasir
            groups[key].batuKg += row.batuTotal
            groups[key].volume += row.volume
            groups[key].trips += 1
        })

        const sorted = Object.values(groups).sort((a: any, b: any) => a.key.localeCompare(b.key))

        // Ambil maksimal 14 hari transaksi terakhir agar tidak berjejal
        const limited = sorted.slice(-14)

        return limited.map(d => ({
            ...d,
            // Nilai sesuai unit aktif (Ton atau Kg)
            semen: unit === "ton" ? Number((d.semenKg / 1000).toFixed(1)) : Math.round(d.semenKg),
            pasir: unit === "ton" ? Number((d.pasirKg / 1000).toFixed(1)) : Math.round(d.pasirKg),
            batu: unit === "ton" ? Number((d.batuKg / 1000).toFixed(1)) : Math.round(d.batuKg),
            semenTon: (d.semenKg / 1000).toFixed(1),
            pasirTon: (d.pasirKg / 1000).toFixed(1),
            batuTon: (d.batuKg / 1000).toFixed(1),
            volumeM3: d.volume.toFixed(1)
        }))
    }, [tableData, unit])

    // CSV Export Handler
    const handleExportCsv = () => {
        if (tableData.length === 0) return
        const headers = [
            "Tanggal",
            "Waktu",
            "Cabang",
            "No Kendaraan",
            "Sopir",
            "Customer",
            "Proyek",
            "Mutu Beton",
            "Volume (m3)",
            "Semen (kg)",
            "Semen (Ton)",
            "Pasir (kg)",
            "Pasir (Ton)",
            "Batu 0.5 (kg)",
            "Batu 1-2 (kg)",
            "Batu 2-3 (kg)",
            "Batu Total (kg)",
            "Batu Total (Ton)"
        ]

        const rows = tableData.map(r => [
            `"${r.dateFormatted}"`,
            `"${r.timeFormatted}"`,
            `"${r.locationName}"`,
            `"${r.vehicleCode}"`,
            `"${r.driverName}"`,
            `"${r.customerName.replace(/"/g, '""')}"`,
            `"${r.projectName.replace(/"/g, '""')}"`,
            `"${r.mutuName}"`,
            r.volume.toFixed(2),
            r.semen.toFixed(1),
            r.semenTon.toFixed(2),
            r.pasir.toFixed(1),
            r.pasirTon.toFixed(2),
            r.batu05.toFixed(1),
            r.batu12.toFixed(1),
            r.batu23.toFixed(1),
            r.batuTotal.toFixed(1),
            r.batuTotalTon.toFixed(2)
        ])

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `Laporan_Penggunaan_Material_${period}_${format(new Date(), "yyyyMMdd")}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-4">
            {/* ── 1. COMPACT CONTROL & FILTER BAR ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 px-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Periode:</span>
                    {/* Period Filter Buttons */}
                    <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
                        <button
                            onClick={() => setPeriod("today")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                period === "today" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Hari Ini
                        </button>
                        <button
                            onClick={() => setPeriod("7days")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                period === "7days" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            7 Hari
                        </button>
                        <button
                            onClick={() => setPeriod("month")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                period === "month" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Bulan Ini
                        </button>
                        <button
                            onClick={() => setPeriod("all")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                period === "all" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Semua
                        </button>
                    </div>

                    {/* Month Selector Dropdown */}
                    {availableMonths.length > 0 && (
                        <Select
                            value={availableMonths.some(m => m.value === period) ? period : ""}
                            onValueChange={(val) => {
                                if (val) setPeriod(val)
                            }}
                        >
                            <SelectTrigger className="h-7 text-xs bg-slate-50 border-slate-200 min-w-[140px]">
                                <Calendar className="w-3.5 h-3.5 text-slate-500 mr-1" />
                                <SelectValue placeholder="Pilih Bulan..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMonths.map(m => (
                                    <SelectItem key={m.value} value={m.value} className="text-xs">
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center gap-2">

                    {/* Unit Switcher (Ton vs Kg) */}
                    <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
                        <button
                            onClick={() => setUnit("ton")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                unit === "ton" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Ton
                        </button>
                        <button
                            onClick={() => setUnit("kg")}
                            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                unit === "kg" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            Kg
                        </button>
                    </div>

                    {/* Cabang Filter (SuperAdmin / Corporate) */}
                    {showCabang && (
                        <div className="w-40 sm:w-48">
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                                    <SelectValue placeholder="Pilih Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Cabang</SelectItem>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Export CSV Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCsv}
                        className="h-8 text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700 gap-1.5"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </Button>
                </div>
            </div>

            {/* ── 2. HERO KPI METRICS (CALM PALETTE & DUAL INTUITIVE UNITS) ── */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Total Volume Produksi */}
                <Card className="bg-white border border-slate-200/80 border-t-2 border-t-blue-600 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Volume Beton Cor</span>
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Factory className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {metrics.volume.toFixed(1)}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">m³</span>
                            <span className="text-xs text-slate-400 ml-auto font-medium">
                                {metrics.trips} Pengiriman
                            </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Total Berat Material:</span>
                            <span className="font-semibold text-slate-800">{metrics.totalDryWeightTon.toFixed(1)} Ton</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Semen (Deep Slate / Graphite) */}
                <Card className="bg-white border border-slate-200/80 border-t-2 border-t-slate-700 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Konsumsi Semen</span>
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                                <Package className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {unit === "ton" ? metrics.semenTon.toFixed(1) : metrics.semenKg.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">{unit === "ton" ? "Ton" : "kg"}</span>
                            <span className="text-xs text-slate-500 ml-auto font-medium">
                                ≈ {metrics.semenSak.toLocaleString('id-ID')} Sak
                            </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Rasio Adukan Rata-rata:</span>
                            <span className="font-semibold text-slate-800">~{metrics.avgSemenPerM3} kg/m³</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Pasir (Warm Amber / Sand) */}
                <Card className="bg-white border border-slate-200/80 border-t-2 border-t-amber-600 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Konsumsi Pasir</span>
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                                <Layers className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {unit === "ton" ? metrics.pasirTon.toFixed(1) : metrics.pasirKg.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">{unit === "ton" ? "Ton" : "kg"}</span>
                            <span className="text-xs text-amber-800 ml-auto font-medium">
                                Pasir Cor
                            </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Rasio Adukan Rata-rata:</span>
                            <span className="font-semibold text-slate-800">~{metrics.avgPasirPerM3} kg/m³</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Batu Split (Cool Slate / Mineral Stone) */}
                <Card className="bg-white border border-slate-200/80 border-t-2 border-t-slate-500 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Batu Split Total</span>
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                <Weight className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {unit === "ton" ? metrics.batuTon.toFixed(1) : metrics.batuKg.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">{unit === "ton" ? "Ton" : "kg"}</span>
                            <span className="text-xs text-slate-500 ml-auto font-medium">
                                Koral / Split
                            </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Rasio Adukan Rata-rata:</span>
                            <span className="font-semibold text-slate-800">~{metrics.avgBatuPerM3} kg/m³</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── 3. LAYPERSON-FRIENDLY COMPOSITION FORMULA STRIP ── */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:px-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-slate-700" />
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Proporsi & Komposisi Rata-Rata Campuran Beton
                            </h2>
                            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 bg-slate-100 text-slate-600">
                                Berdasarkan Mutu
                            </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Dalam setiap <strong>1 m³ beton cor</strong> rata-rata membutuhkan perpaduan material kering berikut:
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/70 self-start md:self-auto">
                        <span>Semen <strong className="text-slate-900">{metrics.propSemen}%</strong></span>
                        <span className="text-slate-300">·</span>
                        <span>Pasir <strong className="text-amber-800">{metrics.propPasir}%</strong></span>
                        <span className="text-slate-300">·</span>
                        <span>Batu Split <strong className="text-slate-700">{metrics.propBatu}%</strong></span>
                    </div>
                </div>

                {/* Visual Segmented Progress Bar */}
                <div className="mt-3">
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                        <div
                            className="h-full bg-slate-700 transition-all"
                            style={{ width: `${metrics.propSemen}%` }}
                            title={`Semen: ${metrics.propSemen}%`}
                        />
                        <div
                            className="h-full bg-amber-600 transition-all"
                            style={{ width: `${metrics.propPasir}%` }}
                            title={`Pasir: ${metrics.propPasir}%`}
                        />
                        <div
                            className="h-full bg-slate-500 transition-all"
                            style={{ width: `${metrics.propBatu}%` }}
                            title={`Batu Split: ${metrics.propBatu}%`}
                        />
                    </div>

                    {/* Intuitive Legend Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-1">
                        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                            <div className="w-3 h-3 rounded-full bg-slate-700 flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-800">Semen ({metrics.propSemen}%)</div>
                                <div className="text-[11px] text-slate-500">
                                    ~<strong>{metrics.avgSemenPerM3} kg</strong> per m³ (≈ {(metrics.avgSemenPerM3 / 50).toFixed(1)} sak)
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-amber-50/40 border border-amber-100/60">
                            <div className="w-3 h-3 rounded-full bg-amber-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="text-xs font-semibold text-amber-950">Pasir Pasang/Cor ({metrics.propPasir}%)</div>
                                <div className="text-[11px] text-amber-900/80">
                                    ~<strong>{metrics.avgPasirPerM3} kg</strong> per m³ adukan
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                            <div className="w-3 h-3 rounded-full bg-slate-500 flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-800">Batu Split/Koral ({metrics.propBatu}%)</div>
                                <div className="text-[11px] text-slate-500">
                                    ~<strong>{metrics.avgBatuPerM3} kg</strong> per m³ (Agregat kasar)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 4. VISUAL CHART: TREN PENGGUNAAN HARIAN (CALM COLOR PALETTE) ── */}
            <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="py-3 px-4 sm:px-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0">
                    <div>
                        <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <BarChart3 className="w-4 h-4 text-slate-600" />
                            Tren Konsumsi Material Harian (14 Hari Terakhir)
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">
                            Volume material terpakai dalam satuan {unit.toUpperCase()} per hari transaksi
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
                            <button
                                onClick={() => setChartMode("grouped")}
                                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                                    chartMode === "grouped" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Berdampingan
                            </button>
                            <button
                                onClick={() => setChartMode("stacked")}
                                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                                    chartMode === "stacked" ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Bertumpuk
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-5">
                    <div className="h-[300px] w-full min-w-0">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="displayDate"
                                        tick={{ fill: '#64748B', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#64748B', fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => unit === "ton" ? `${val}t` : `${Math.round(val / 1000)}k`}
                                        width={45}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: '1px solid #E2E8F0',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                            fontSize: '11px',
                                            padding: '8px 12px'
                                        }}
                                        formatter={(val: any, name: any, item: any) => {
                                            const label = name === "semen" ? "Semen" : name === "pasir" ? "Pasir" : "Batu Split"
                                            const formattedVal = unit === "ton" ? `${val} Ton` : `${Number(val).toLocaleString('id-ID')} kg`
                                            return [formattedVal, label]
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }}
                                        iconType="circle"
                                        formatter={(val) => {
                                            if (val === "semen") return `Semen (${unit})`
                                            if (val === "pasir") return `Pasir (${unit})`
                                            return `Batu Split (${unit})`
                                        }}
                                    />
                                    <Bar
                                        dataKey="semen"
                                        name="semen"
                                        fill="#334155"
                                        stackId={chartMode === "stacked" ? "materials" : undefined}
                                        radius={chartMode === "stacked" ? [0, 0, 0, 0] : [3, 3, 0, 0]}
                                        maxBarSize={chartMode === "stacked" ? 40 : 22}
                                    />
                                    <Bar
                                        dataKey="pasir"
                                        name="pasir"
                                        fill="#D97706"
                                        stackId={chartMode === "stacked" ? "materials" : undefined}
                                        radius={chartMode === "stacked" ? [0, 0, 0, 0] : [3, 3, 0, 0]}
                                        maxBarSize={chartMode === "stacked" ? 40 : 22}
                                    />
                                    <Bar
                                        dataKey="batu"
                                        name="batu"
                                        fill="#64748B"
                                        stackId={chartMode === "stacked" ? "materials" : undefined}
                                        radius={chartMode === "stacked" ? [3, 3, 0, 0] : [3, 3, 0, 0]}
                                        maxBarSize={chartMode === "stacked" ? 40 : 22}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400 text-xs">
                                Tidak ada transaksi terkonfirmasi untuk periode yang dipilih
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── 5. DATA TABLE TRANSAKSI PENGGUNAAN MATERIAL ── */}
            <Card className="border border-slate-200/80 shadow-xs bg-white overflow-hidden">
                <CardHeader className="py-3 px-4 sm:px-5 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Rincian Transaksi Penggunaan Material
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">
                            Menampilkan {tableData.length} transaksi pengecoran beton terkonfirmasi
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs font-normal">
                        Total Volume: <strong>{metrics.volume.toFixed(1)} m³</strong>
                    </Badge>
                </CardHeader>

                <SimpleDataTable<any>
                    data={tableData}
                    searchKeys={["customerName", "projectName", "vehicleCode", "driverName", "mutuName", "locationName"]}
                    searchPlaceholder="Cari customer, proyek, kendaraan, sopir, atau mutu..."
                >
                    {(items, sortConfig, toggleSort) => (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/70 border-b border-slate-200/80">
                                    <TableHead className="text-xs font-bold text-slate-700 py-3">
                                        <SortableHeader<any> label="Waktu & Tanggal" sortKey="rawDate" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    {showCabang && (
                                        <TableHead className="text-xs font-bold text-slate-700 py-3">
                                            <SortableHeader<any> label="Cabang" sortKey="locationName" sortConfig={sortConfig} onSort={toggleSort} />
                                        </TableHead>
                                    )}
                                    <TableHead className="text-xs font-bold text-slate-700 py-3">
                                        <SortableHeader<any> label="Armada & Sopir" sortKey="vehicleCode" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 py-3">
                                        <SortableHeader<any> label="Customer & Proyek" sortKey="customerName" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 py-3">
                                        <SortableHeader<any> label="Mutu" sortKey="mutuName" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 py-3 text-right">
                                        <SortableHeader<any> label="Vol (m³)" sortKey="volume" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 py-3 text-right">
                                        <SortableHeader<any> label={`Semen (${unit})`} sortKey="semen" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 py-3 text-right">
                                        <SortableHeader<any> label={`Pasir (${unit})`} sortKey="pasir" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 py-3 text-right">
                                        <SortableHeader<any> label={`Batu Split (${unit})`} sortKey="batuTotal" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={showCabang ? 9 : 8} className="h-28 text-center text-slate-400 text-xs">
                                            Tidak ada data transaksi material untuk filter saat ini.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((row) => (
                                        <TableRow key={row.id} className="hover:bg-slate-50/60 transition-colors">
                                            {/* Tanggal & Waktu */}
                                            <TableCell className="text-xs py-2.5">
                                                <div className="font-semibold text-slate-900">{row.dateFormatted}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{row.timeFormatted} WIT</div>
                                            </TableCell>

                                            {/* Cabang (jika SuperAdmin/Corporate) */}
                                            {showCabang && (
                                                <TableCell className="py-2.5">
                                                    <Badge variant="outline" className="text-[10px] font-medium border-slate-200 bg-slate-50 text-slate-700">
                                                        {row.locationName}
                                                    </Badge>
                                                </TableCell>
                                            )}

                                            {/* Kendaraan & Sopir */}
                                            <TableCell className="py-2.5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs text-slate-900">{row.vehicleCode}</span>
                                                    <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{row.driverName}</span>
                                                </div>
                                            </TableCell>

                                            {/* Customer & Proyek */}
                                            <TableCell className="py-2.5 max-w-[200px]">
                                                <div className="font-semibold text-xs text-slate-900 truncate">{row.customerName}</div>
                                                <div className="text-[10px] text-slate-500 truncate">{row.projectName}</div>
                                            </TableCell>

                                            {/* Mutu Beton */}
                                            <TableCell className="py-2.5">
                                                <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-800">
                                                    {row.mutuName}
                                                </Badge>
                                            </TableCell>

                                            {/* Volume m3 */}
                                            <TableCell className="py-2.5 text-right font-bold text-xs text-blue-600">
                                                {row.volume.toFixed(1)}
                                            </TableCell>

                                            {/* Semen */}
                                            <TableCell className="py-2.5 text-right">
                                                <div className="font-semibold text-xs text-slate-900">
                                                    {unit === "ton"
                                                        ? `${row.semenTon.toFixed(2)} t`
                                                        : `${row.semen.toLocaleString('id-ID', { maximumFractionDigits: 0 })} kg`}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    ≈ {row.semenSak} sak
                                                </div>
                                            </TableCell>

                                            {/* Pasir */}
                                            <TableCell className="py-2.5 text-right">
                                                <div className="font-medium text-xs text-slate-800">
                                                    {unit === "ton"
                                                        ? `${row.pasirTon.toFixed(2)} t`
                                                        : `${row.pasir.toLocaleString('id-ID', { maximumFractionDigits: 0 })} kg`}
                                                </div>
                                            </TableCell>

                                            {/* Batu Split Total */}
                                            <TableCell className="py-2.5 text-right">
                                                <div className="font-medium text-xs text-slate-800">
                                                    {unit === "ton"
                                                        ? `${row.batuTotalTon.toFixed(2)} t`
                                                        : `${row.batuTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 })} kg`}
                                                </div>
                                                {(row.batu05 > 0 || row.batu12 > 0 || row.batu23 > 0) && (
                                                    <div className="text-[9px] text-slate-400 font-mono">
                                                        {row.batu12 > 0 ? `1-2: ${(row.batu12 / 1000).toFixed(1)}t` : ''}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>

                            {/* Table Summary Footer */}
                            {items.length > 0 && (
                                <TableFooter className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                                    <TableRow>
                                        <TableCell colSpan={showCabang ? 5 : 4} className="text-xs text-slate-700 py-3">
                                            Total Akumulasi ({items.length} transaksi)
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-bold text-blue-600 py-3">
                                            {items.reduce((s: number, r: any) => s + r.volume, 0).toFixed(1)} m³
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-slate-900 py-3">
                                            {unit === "ton"
                                                ? `${(items.reduce((s: number, r: any) => s + r.semen, 0) / 1000).toFixed(1)} t`
                                                : `${items.reduce((s: number, r: any) => s + r.semen, 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })} kg`}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-slate-900 py-3">
                                            {unit === "ton"
                                                ? `${(items.reduce((s: number, r: any) => s + r.pasir, 0) / 1000).toFixed(1)} t`
                                                : `${items.reduce((s: number, r: any) => s + r.pasir, 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })} kg`}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-slate-900 py-3">
                                            {unit === "ton"
                                                ? `${(items.reduce((s: number, r: any) => s + r.batuTotal, 0) / 1000).toFixed(1)} t`
                                                : `${items.reduce((s: number, r: any) => s + r.batuTotal, 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })} kg`}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    )}
                </SimpleDataTable>
            </Card>
        </div>
    )
}
