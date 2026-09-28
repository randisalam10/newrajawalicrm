"use client"

import { useMemo, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Plus,
    PackagePlus,
    PackageMinus,
    ClipboardList,
    Edit,
    Trash2,
    Mountain,
    ShoppingCart,
    BarChart2,
    Truck,
    Settings,
    Download,
    RotateCcw,
    Calculator,
    Layers,
    MapPin,
    Calendar,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    ArrowUpDown,
    Coins,
} from "lucide-react"
import {
    AggregateInRow,
    AggregateOutRow,
    AggregateLedgerRow,
    AggregateCombinedRow,
    AGGREGATE_TYPE_LABELS,
    AGGREGATE_TYPE_OPTIONS,
    OUTGOING_CATEGORY_LABELS,
    OUTGOING_CATEGORY_OPTIONS,
} from "./columns"
import { MaterialAgregatForm } from "./material-agregat-form"
import { MaterialAgregatOutForm } from "./material-agregat-out-form"
import { deleteAggregateIncoming, deleteAggregateOutgoing, getAggregateStockLedger, saveAggregateRetaseSetting } from "./actions"
import { useToast } from "@/hooks/use-toast"

type Props = {
    initialData: any[]
    initialOutData?: any[]
    locations: { id: string; name: string }[]
    vehicles?: any[]
    drivers?: any[]
    retaseSettings?: any[]
    userRole: string
    userLocationId?: string | null
    isCorporate?: boolean
    canManage?: boolean
    isReadOnly?: boolean
}

const MATERIAL_COLORS: Record<string, string> = {
    SplitHalfOne: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/30 border-amber-200",
    SplitTwoThree: "bg-rose-50 text-rose-800 ring-1 ring-rose-600/30 border-rose-200",
    Pasir: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/30 border-yellow-200",
    Semen: "bg-stone-100 text-stone-800 ring-1 ring-stone-600/30 border-stone-200",
    Other: "bg-slate-100 text-slate-800 ring-1 ring-slate-600/20 border-slate-200",
}

export function MaterialAgregatClient({
    initialData,
    initialOutData = [],
    locations,
    vehicles = [],
    drivers = [],
    retaseSettings = [],
    userRole,
    userLocationId,
    isCorporate = false,
    canManage = true,
    isReadOnly = false,
}: Props) {
    const { toast } = useToast()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingData, setEditingData] = useState<AggregateInRow | null>(null)

    // Outgoing state
    const [isOutFormOpen, setIsOutFormOpen] = useState(false)
    const [editingOutData, setEditingOutData] = useState<AggregateOutRow | null>(null)
    const [filterOutCabang, setFilterOutCabang] = useState<string>("ALL")
    const [filterOutMaterial, setFilterOutMaterial] = useState<string>("ALL")
    const [filterOutCategory, setFilterOutCategory] = useState<string>("ALL")

    // Ledger state
    const [ledgerType, setLedgerType] = useState("SplitHalfOne")
    const [ledgerData, setLedgerData] = useState<AggregateLedgerRow[]>([])
    const [ledgerLoading, setLedgerLoading] = useState(false)
    const [ledgerLoaded, setLedgerLoaded] = useState(false)

    // Filter toolbar state
    const [filterCabang, setFilterCabang] = useState<string>("ALL")
    const [filterMaterial, setFilterMaterial] = useState<string>("ALL")
    const [filterSource, setFilterSource] = useState<string>("ALL")
    const [filterDtSize, setFilterDtSize] = useState<string>("ALL")

    // Pengaturan Tarif Retase State
    const canManageTarif = userRole === "SuperAdminBP" || userRole === "AdminBP"
    const initialTarifLoc = userLocationId && locations.some(l => l.id === userLocationId)
        ? userLocationId
        : locations[0]?.id || ""
    const [tarifLocationId, setTarifLocationId] = useState<string>(initialTarifLoc)

    const getExistingSetting = (locId: string) => retaseSettings.find((s: any) => s.locationId === locId)
    const initialSettingObj = getExistingSetting(initialTarifLoc)

    const [priceDtBesar, setPriceDtBesar] = useState<string>(
        initialSettingObj?.price_dt_besar != null ? String(initialSettingObj.price_dt_besar) : "1500"
    )
    const [priceDtKecil, setPriceDtKecil] = useState<string>(
        initialSettingObj?.price_dt_kecil != null ? String(initialSettingObj.price_dt_kecil) : "1800"
    )
    const [defaultDistanceKm, setDefaultDistanceKm] = useState<string>(
        initialSettingObj?.default_distance_km != null ? String(initialSettingObj.default_distance_km) : "25"
    )
    const [isSavingTarif, setIsSavingTarif] = useState(false)

    const handleTarifLocationSelect = (locId: string) => {
        setTarifLocationId(locId)
        const s = getExistingSetting(locId)
        if (s) {
            setPriceDtBesar(s.price_dt_besar != null ? String(s.price_dt_besar) : "")
            setPriceDtKecil(s.price_dt_kecil != null ? String(s.price_dt_kecil) : "")
            setDefaultDistanceKm(s.default_distance_km != null ? String(s.default_distance_km) : "")
        } else {
            setPriceDtBesar("")
            setPriceDtKecil("")
            setDefaultDistanceKm("")
        }
    }

    const handleSaveTarif = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canManageTarif) {
            return toast({ title: "Akses Ditolak", description: "Hanya SuperAdmin dan Admin BP yang berwenang mengubah tarif.", variant: "destructive" })
        }
        if (!tarifLocationId) {
            return toast({ title: "Validasi Gagal", description: "Pilih cabang terlebih dahulu.", variant: "destructive" })
        }

        setIsSavingTarif(true)
        const formData = new FormData()
        formData.append("locationId", tarifLocationId)
        formData.append("price_dt_besar", priceDtBesar || "0")
        formData.append("price_dt_kecil", priceDtKecil || "0")
        formData.append("default_distance_km", defaultDistanceKm || "0")

        const res = await saveAggregateRetaseSetting(formData)
        setIsSavingTarif(false)

        if (res?.error) {
            toast({ title: "Gagal Menyimpan", description: res.error, variant: "destructive" })
        } else {
            toast({ title: "Tarif Tersimpan", description: "Pengaturan tarif retase Dump Truck berhasil disimpan." })
        }
    }

    const formattedData: AggregateInRow[] = useMemo(() => {
        return initialData.map((t: any) => ({
            id: t.id,
            date: new Date(t.date).toISOString().split("T")[0],
            no_bon: t.no_bon,
            driver_name: t.driver_name,
            plate_number: t.plate_number,
            volume_cubic: t.volume_cubic,
            aggregate_type: t.aggregate_type,
            aggregateLabel: AGGREGATE_TYPE_LABELS[t.aggregate_type] || t.aggregate_type,
            source_type: t.source_type,
            supplier: t.supplier,
            notes: t.notes,
            locationName: t.location?.name || "N/A",
            locationId: t.locationId,
            vehicleId: t.vehicleId,
            driverId: t.driverId,
            dump_truck_size: t.dump_truck_size,
            distance_km: t.distance_km,
            rate_price: t.rate_price,
            retase_amount: t.retase_amount,
            is_retase_paid: t.is_retase_paid,
            vehicle: t.vehicle,
            driver: t.driver,
        }))
    }, [initialData])

    // Filtered data based on toolbar filters
    const filteredData = useMemo(() => {
        return formattedData.filter((row) => {
            if (filterCabang !== "ALL" && row.locationId !== filterCabang) return false
            if (filterMaterial !== "ALL" && row.aggregate_type !== filterMaterial) return false
            if (filterSource !== "ALL" && row.source_type !== filterSource) return false
            if (filterDtSize !== "ALL") {
                if (filterDtSize === "BESAR" && row.dump_truck_size !== "BESAR") return false
                if (filterDtSize === "KECIL" && row.dump_truck_size !== "KECIL") return false
            }
            return true
        })
    }, [formattedData, filterCabang, filterMaterial, filterSource, filterDtSize])

    // Summary calculations from filtered data
    const summary = useMemo(() => {
        const byType: Record<string, number> = {}
        let totalVol = 0
        let totalRetase = 0
        let internalVol = 0
        let externalVol = 0

        filteredData.forEach((row) => {
            byType[row.aggregate_type] = (byType[row.aggregate_type] || 0) + row.volume_cubic
            totalVol += row.volume_cubic
            if (row.source_type === "Internal") {
                internalVol += row.volume_cubic
                if (row.retase_amount) totalRetase += row.retase_amount
            } else {
                externalVol += row.volume_cubic
            }
        })

        return {
            byType,
            totalVol,
            totalRit: filteredData.length,
            totalRetase,
            internalVol,
            externalVol,
        }
    }, [filteredData])

    const hasActiveFilters = filterCabang !== "ALL" || filterMaterial !== "ALL" || filterSource !== "ALL" || filterDtSize !== "ALL"

    const resetFilters = () => {
        setFilterCabang("ALL")
        setFilterMaterial("ALL")
        setFilterSource("ALL")
        setFilterDtSize("ALL")
    }

    const formattedOutData: AggregateOutRow[] = useMemo(() => {
        return (initialOutData || []).map((t: any) => ({
            id: t.id,
            date: new Date(t.date).toISOString().split("T")[0],
            no_bon: t.no_bon,
            aggregate_type: t.aggregate_type,
            aggregateLabel: AGGREGATE_TYPE_LABELS[t.aggregate_type] || t.aggregate_type,
            volume_cubic: t.volume_cubic,
            unit: t.unit || "m³",
            unit_price: t.unit_price,
            total_price: t.total_price,
            category: t.category,
            categoryLabel: OUTGOING_CATEGORY_LABELS[t.category] || t.category,
            recipient: t.recipient,
            transport_mode: t.transport_mode || "BUYER",
            vehicleId: t.vehicleId,
            driverId: t.driverId,
            dump_truck_size: t.dump_truck_size,
            distance_km: t.distance_km,
            rate_price: t.rate_price,
            retase_amount: t.retase_amount,
            is_retase_paid: t.is_retase_paid,
            vehicle: t.vehicle,
            driver: t.driver,
            plate_number: t.plate_number,
            driver_name: t.driver_name,
            notes: t.notes,
            locationName: t.location?.name || "N/A",
            locationId: t.locationId,
            createdById: t.createdById,
        }))
    }, [initialOutData])

    const filteredOutData = useMemo(() => {
        return formattedOutData.filter((row) => {
            if (filterOutCabang !== "ALL" && row.locationId !== filterOutCabang) return false
            if (filterOutMaterial !== "ALL" && row.aggregate_type !== filterOutMaterial) return false
            if (filterOutCategory !== "ALL" && row.category !== filterOutCategory) return false
            return true
        })
    }, [formattedOutData, filterOutCabang, filterOutMaterial, filterOutCategory])

    // Summary calculations from outgoing data
    const summaryOut = useMemo(() => {
        let totalVol = 0
        let totalSales = 0
        let totalRetase = 0
        const byType: Record<string, number> = {}

        filteredOutData.forEach((row) => {
            byType[row.aggregate_type] = (byType[row.aggregate_type] || 0) + row.volume_cubic
            totalVol += row.volume_cubic
            if (row.total_price) totalSales += row.total_price
            if (row.retase_amount) totalRetase += row.retase_amount
        })

        return {
            totalVol,
            totalSales,
            totalRetase,
            totalRit: filteredOutData.length,
            byType,
        }
    }, [filteredOutData])

    // Unified combined transactions (Masuk & Keluar side-by-side)
    const combinedData: AggregateCombinedRow[] = useMemo(() => {
        const inRows: AggregateCombinedRow[] = filteredData.map(r => ({
            id: "in_" + r.id,
            date: r.date,
            direction: "IN",
            no_bon: r.no_bon,
            aggregate_type: r.aggregate_type,
            aggregateLabel: r.aggregateLabel,
            volume: r.volume_cubic,
            unit: "m³",
            categoryOrSource: r.source_type === "Internal" ? "Internal Quarry" : "Eksternal",
            party: r.supplier || (r.source_type === "Internal" ? "Quarry PT" : "-"),
            vehicleInfo: `${r.plate_number} • ${r.driver_name}${r.dump_truck_size ? ` (${r.dump_truck_size})` : ""}`,
            financialInfo: r.retase_amount ? `Retase: Rp ${r.retase_amount.toLocaleString("id-ID")}` : undefined,
            notes: r.notes,
            locationName: r.locationName,
            locationId: r.locationId,
            rawIn: r,
        }))

        const outRows: AggregateCombinedRow[] = filteredOutData.map(r => ({
            id: "out_" + r.id,
            date: r.date,
            direction: "OUT",
            no_bon: r.no_bon || "-",
            aggregate_type: r.aggregate_type,
            aggregateLabel: r.aggregateLabel,
            volume: r.volume_cubic,
            unit: r.unit || "m³",
            categoryOrSource: r.categoryLabel,
            party: r.recipient || "-",
            vehicleInfo: r.transport_mode === "INTERNAL_DT"
                ? `DT Internal: ${r.plate_number || "-"} • ${r.driver_name || "-"}`
                : (r.plate_number ? `Pembeli: ${r.plate_number}` : "Ambil Sendiri"),
            financialInfo: r.total_price && r.total_price > 0
                ? `Rp ${r.total_price.toLocaleString("id-ID")}`
                : (r.retase_amount ? `Retase: Rp ${r.retase_amount.toLocaleString("id-ID")}` : undefined),
            notes: r.notes,
            locationName: r.locationName,
            locationId: r.locationId,
            rawOut: r,
        }))

        return [...inRows, ...outRows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [filteredData, filteredOutData])

    const handleEditOut = (row: AggregateOutRow) => {
        if (!canManage) return
        setEditingOutData(row)
        setIsOutFormOpen(true)
    }

    const handleDeleteOut = async (row: AggregateOutRow) => {
        if (!canManage) return
        if (
            confirm(
                `Yakin ingin menghapus pengeluaran ${row.aggregateLabel} sebesar ${row.volume_cubic} m³ (${row.recipient || row.categoryLabel})?`
            )
        ) {
            await deleteAggregateOutgoing(row.id)
            toast({ title: "Data Dihapus", description: "Pengeluaran material berhasil dihapus." })
        }
    }

    const handleEdit = (row: AggregateInRow) => {
        if (!canManage) return
        setEditingData(row)
        setIsFormOpen(true)
    }

    const handleDelete = async (row: AggregateInRow) => {
        if (!canManage) return
        if (
            confirm(
                `Yakin ingin menghapus data ${row.aggregateLabel} dari ${row.driver_name} (${row.plate_number})?`
            )
        ) {
            await deleteAggregateIncoming(row.id)
            toast({ title: "Data Dihapus", description: "Penerimaan material berhasil dihapus." })
        }
    }

    const loadLedger = async (type?: string) => {
        const t = type ?? ledgerType
        setLedgerLoading(true)
        try {
            const data = await import("./actions").then((m) => m.getAggregateStockLedger(t))
            setLedgerData(data as AggregateLedgerRow[])
            setLedgerLoaded(true)
        } finally {
            setLedgerLoading(false)
        }
    }

    const handleLedgerTypeChange = (val: string) => {
        setLedgerType(val)
        loadLedger(val)
    }

    // Export CSV
    const exportCSV = () => {
        if (combinedData.length === 0) {
            return toast({ title: "Data Kosong", description: "Tidak ada data untuk diekspor." })
        }

        const headers = [
            "Tanggal",
            "Arah",
            "Cabang",
            "Jenis Material",
            "Kategori / Sumber",
            "No Bon / Surat Jalan",
            "Pihak / Rekanan",
            "Armada & Sopir",
            "Volume",
            "Satuan",
            "Info Finansial",
            "Catatan",
        ]

        const rows = combinedData.map((row) => [
            `"${row.date}"`,
            `"${row.direction === "IN" ? "MASUK" : "KELUAR"}"`,
            `"${row.locationName}"`,
            `"${row.aggregateLabel}"`,
            `"${row.categoryOrSource}"`,
            `"${row.no_bon}"`,
            `"${row.party}"`,
            `"${row.vehicleInfo}"`,
            `"${row.volume}"`,
            `"${row.unit}"`,
            `"${row.financialInfo || '-'}"`,
            `"${(row.notes || "").replace(/"/g, '""')}"`,
        ])

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `Mutasi_Material_Agregat_${new Date().toISOString().split("T")[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast({ title: "Ekspor Berhasil", description: "File CSV mutasi material berhasil diunduh." })
    }

    const showCabang = userRole === "SuperAdminBP" || isCorporate

    return (
        <div className="space-y-5 w-full">
            {/* ── HEADER & QUICK ACTIONS ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                            <Truck className="h-5 w-5" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            Penerimaan Material & Agregat
                        </h1>
                        {isReadOnly && (
                            <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 text-xs px-2.5 py-0.5">
                                Mode Pemantauan
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-slate-500">
                        Pencatatan pasokan batu split, pasir, kontrol stok batching plant, dan sistem perhitungan retase dump truck quarry.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        onClick={exportCSV}
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-700"
                    >
                        <Download className="h-3.5 w-3.5 text-slate-500" />
                        <span>Ekspor CSV</span>
                    </Button>

                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => {
                                    setEditingOutData(null)
                                    setIsOutFormOpen(true)
                                }}
                                variant="outline"
                                size="sm"
                                className="h-9 gap-1.5 text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 shadow-xs"
                            >
                                <PackageMinus className="h-4 w-4 text-rose-600" />
                                <span>Input Material Keluar</span>
                            </Button>
                            <Button
                                onClick={() => {
                                    setEditingData(null)
                                    setIsFormOpen(true)
                                }}
                                size="sm"
                                className="h-9 gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Input Penerimaan Material</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── COMPACT KPI METRICS (SPACE-EFFICIENT & INFORMATIVE) ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {/* 1. Total Masuk */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Masuk</span>
                        <div className="p-1 rounded-md bg-blue-50 text-blue-600">
                            <PackagePlus className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black font-mono text-slate-900 leading-tight">
                            +{summary.totalVol.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">m³</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {summary.totalRit} Rit ({summary.internalVol.toFixed(0)}m³ Quarry / {summary.externalVol.toFixed(0)}m³ Vendor)
                    </div>
                </div>

                {/* 2. Total Keluar */}
                <div className="bg-white border border-rose-200/80 rounded-xl p-3 shadow-2xs hover:border-rose-300 transition-colors bg-rose-50/20">
                    <div className="flex items-center justify-between text-rose-700 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Total Keluar</span>
                        <div className="p-1 rounded-md bg-rose-100 text-rose-700">
                            <PackageMinus className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black font-mono text-rose-700 leading-tight">
                            -{summaryOut.totalVol.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-[10px] text-rose-500 font-semibold">m³</span>
                    </div>
                    <div className="text-[10px] text-rose-700/80 mt-0.5 truncate font-medium">
                        {summaryOut.totalRit} Transaksi {summaryOut.totalSales > 0 ? `• Rp ${(summaryOut.totalSales / 1000000).toFixed(1)}M` : ""}
                    </div>
                </div>

                {/* 3. Split 1/2 */}
                <div className="bg-white border border-amber-200/80 rounded-xl p-3 shadow-2xs hover:border-amber-300 transition-colors bg-amber-50/20">
                    <div className="flex items-center justify-between text-amber-800 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Split 1/2</span>
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black font-mono text-amber-950 leading-tight">
                            {(summary.byType["SplitHalfOne"] || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-[10px] text-amber-700 font-semibold">m³</span>
                    </div>
                    <div className="text-[10px] text-amber-800/80 mt-0.5 truncate">
                        Keluar: {(summaryOut.byType["SplitHalfOne"] || 0).toFixed(1)} m³
                    </div>
                </div>

                {/* 4. Split 2/3 */}
                <div className="bg-white border border-rose-200/80 rounded-xl p-3 shadow-2xs hover:border-rose-300 transition-colors bg-rose-50/20">
                    <div className="flex items-center justify-between text-rose-800 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Split 2/3</span>
                        <Layers className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black font-mono text-rose-950 leading-tight">
                            {(summary.byType["SplitTwoThree"] || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-[10px] text-rose-700 font-semibold">m³</span>
                    </div>
                    <div className="text-[10px] text-rose-800/80 mt-0.5 truncate">
                        Keluar: {(summaryOut.byType["SplitTwoThree"] || 0).toFixed(1)} m³
                    </div>
                </div>

                {/* 5. Pasir Cor */}
                <div className="bg-white border border-yellow-200/80 rounded-xl p-3 shadow-2xs hover:border-yellow-300 transition-colors bg-yellow-50/20">
                    <div className="flex items-center justify-between text-yellow-800 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-800">Pasir Cor</span>
                        <Layers className="w-3.5 h-3.5 text-yellow-600" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black font-mono text-yellow-950 leading-tight">
                            {(summary.byType["Pasir"] || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-[10px] text-yellow-700 font-semibold">m³</span>
                    </div>
                    <div className="text-[10px] text-yellow-800/80 mt-0.5 truncate">
                        Keluar: {(summaryOut.byType["Pasir"] || 0).toFixed(1)} m³
                    </div>
                </div>

                {/* 6. Retase Sopir DT */}
                <div className="bg-white border border-blue-200/80 rounded-xl p-3 shadow-2xs hover:border-blue-300 transition-colors bg-blue-50/30">
                    <div className="flex items-center justify-between text-blue-800 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">Retase Sopir DT</span>
                        <Calculator className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-base font-black font-mono text-blue-900 leading-tight truncate">
                            Rp {(summary.totalRetase + summaryOut.totalRetase).toLocaleString("id-ID")}
                        </span>
                    </div>
                    <div className="text-[10px] text-blue-700/80 mt-0.5 truncate">
                        Quarry: Rp {summary.totalRetase.toLocaleString("id-ID")} • Keluar: Rp {summaryOut.totalRetase.toLocaleString("id-ID")}
                    </div>
                </div>
            </div>

            {/* ── MAIN TABS ── */}
            <Tabs defaultValue="semua" className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2">
                    <TabsList className="bg-slate-100 p-1">
                        <TabsTrigger value="semua" className="gap-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                            <ArrowUpDown className="h-3.5 w-3.5 text-blue-600" />
                            <span>Semua Mutasi (Masuk & Keluar)</span>
                            <span className="bg-slate-200 text-slate-800 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold">
                                {combinedData.length}
                            </span>
                        </TabsTrigger>

                        <TabsTrigger value="masuk" className="gap-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs">
                            <PackagePlus className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Penerimaan Masuk</span>
                            <span className="bg-emerald-100 text-emerald-800 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold">
                                {filteredData.length}
                            </span>
                        </TabsTrigger>

                        <TabsTrigger value="keluar" className="gap-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-xs">
                            <PackageMinus className="h-3.5 w-3.5 text-rose-600" />
                            <span>Pengeluaran Keluar</span>
                            <span className="bg-rose-100 text-rose-800 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold">
                                {filteredOutData.length}
                            </span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="stok"
                            className="gap-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-xs"
                            onClick={() => !ledgerLoaded && loadLedger()}
                        >
                            <ClipboardList className="h-3.5 w-3.5" />
                            <span>Kartu Stok (Ledger)</span>
                        </TabsTrigger>

                        {canManageTarif && (
                            <TabsTrigger value="tarif" className="gap-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs">
                                <Settings className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Pengaturan Tarif Retase DT</span>
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    TAB 0: SEMUA MUTASI (MASUK & KELUAR BERDAMPINGAN)
                ══════════════════════════════════════════════════════════ */}
                <TabsContent value="semua" className="space-y-4">
                    {/* TABLE SEMUA MUTASI */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                        <SimpleDataTable<AggregateCombinedRow>
                            data={combinedData}
                            searchKeys={["no_bon", "party", "vehicleInfo", "notes", "aggregateLabel", "categoryOrSource"]}
                            searchPlaceholder="Cari surat jalan, supplier/pembeli, kendaraan, sopir, atau keperluan..."
                            pageSize={15}
                        >
                            {(items, sortConfig, toggleSort) => (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 border-b border-slate-200">
                                            <TableHead className="w-[105px]">
                                                <SortableHeader<AggregateCombinedRow>
                                                    label="Tanggal"
                                                    sortKey="date"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[100px] text-center">Arah Mutasi</TableHead>
                                            {showCabang && <TableHead className="w-[110px]">Cabang</TableHead>}
                                            <TableHead className="w-[115px]">Material</TableHead>
                                            <TableHead className="w-[130px]">Kategori / Sumber</TableHead>
                                            <TableHead className="w-[105px]">No. Surat Jalan</TableHead>
                                            <TableHead className="min-w-[130px]">Pihak / Rekanan</TableHead>
                                            <TableHead className="w-[140px]">Armada & Sopir</TableHead>
                                            <TableHead className="w-[110px] text-right">
                                                <SortableHeader<AggregateCombinedRow>
                                                    label="Volume / Qty"
                                                    sortKey="volume"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[125px] text-right">Nilai / Retase</TableHead>
                                            <TableHead className="min-w-[120px]">Catatan</TableHead>
                                            {canManage && <TableHead className="w-[75px] text-right">Aksi</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={showCabang ? 12 : 11} className="h-24 text-center text-muted-foreground text-xs">
                                                    Belum ada transaksi mutasi material agregat.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            items.map((row) => {
                                                const isIncoming = row.direction === "IN"
                                                return (
                                                    <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <TableCell className="text-xs font-mono whitespace-nowrap text-slate-700">
                                                            {row.date}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {isIncoming ? (
                                                                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] px-1.5 py-0.5 font-bold gap-1">
                                                                    <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                                                                    MASUK
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-800 text-[10px] px-1.5 py-0.5 font-bold gap-1">
                                                                    <ArrowUpRight className="w-3 h-3 text-rose-600" />
                                                                    KELUAR
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        {showCabang && (
                                                            <TableCell className="text-xs font-medium text-slate-800">
                                                                {row.locationName}
                                                            </TableCell>
                                                        )}
                                                        <TableCell>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${MATERIAL_COLORS[row.aggregate_type] || "bg-slate-100 text-slate-700"}`}>
                                                                {row.aggregateLabel}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`text-[10px] font-medium ${isIncoming ? "border-emerald-200 bg-emerald-50/30 text-emerald-900" : "border-slate-300"}`}>
                                                                {row.categoryOrSource}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-xs font-mono text-slate-700">
                                                            {row.no_bon}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-semibold text-slate-800">
                                                            {row.party}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-slate-600">
                                                            <div className="font-mono text-[11px]">{row.vehicleInfo}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-xs">
                                                            {isIncoming ? (
                                                                <span className="text-emerald-700 font-black">
                                                                    +{row.volume.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {row.unit}
                                                                </span>
                                                            ) : (
                                                                <span className="text-rose-700 font-black">
                                                                    -{row.volume.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {row.unit}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs font-mono">
                                                            {row.financialInfo ? (
                                                                <span className="font-bold text-slate-900 text-[11px]">
                                                                    {row.financialInfo}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-slate-500 max-w-[140px] truncate" title={row.notes || ""}>
                                                            {row.notes || "-"}
                                                        </TableCell>
                                                        {canManage && (
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                                        onClick={() => {
                                                                            if (isIncoming && row.rawIn) {
                                                                                handleEdit(row.rawIn)
                                                                            } else if (!isIncoming && row.rawOut) {
                                                                                handleEditOut(row.rawOut)
                                                                            }
                                                                        }}
                                                                        title="Edit transaksi"
                                                                    >
                                                                        <Edit className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                                        onClick={() => {
                                                                            if (isIncoming && row.rawIn) {
                                                                                handleDelete(row.rawIn)
                                                                            } else if (!isIncoming && row.rawOut) {
                                                                                handleDeleteOut(row.rawOut)
                                                                            }
                                                                        }}
                                                                        title="Hapus transaksi"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </SimpleDataTable>
                    </Card>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════
                    TAB 1: DATA MATERIAL MASUK
                ══════════════════════════════════════════════════════════ */}
                <TabsContent value="masuk" className="space-y-4">
                    {/* FILTER TOOLBAR */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Filter Cabang */}
                            {showCabang && (
                                <div className="w-[180px]">
                                    <Select value={filterCabang} onValueChange={setFilterCabang}>
                                        <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                            <SelectValue placeholder="Semua Cabang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL" className="text-xs font-semibold">Semua Cabang BP</SelectItem>
                                            {locations.map((loc) => (
                                                <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                                    📍 {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Filter Jenis Material */}
                            <div className="w-[170px]">
                                <Select value={filterMaterial} onValueChange={setFilterMaterial}>
                                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Semua Material" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL" className="text-xs font-semibold">Semua Jenis Material</SelectItem>
                                        {AGGREGATE_TYPE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filter Sumber */}
                            <div className="w-[160px]">
                                <Select value={filterSource} onValueChange={setFilterSource}>
                                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Semua Sumber" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL" className="text-xs font-semibold">Semua Sumber</SelectItem>
                                        <SelectItem value="Internal" className="text-xs">⛰️ Quarry Sendiri</SelectItem>
                                        <SelectItem value="External" className="text-xs">🛒 Eksternal Vendor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filter Ukuran DT */}
                            <div className="w-[150px]">
                                <Select value={filterDtSize} onValueChange={setFilterDtSize}>
                                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Semua Ukuran DT" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL" className="text-xs font-semibold">Semua Ukuran DT</SelectItem>
                                        <SelectItem value="BESAR" className="text-xs">🚛 DT Besar (Tronton)</SelectItem>
                                        <SelectItem value="KECIL" className="text-xs">🚚 DT Kecil (Engkel)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Reset Filter Button */}
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 font-medium"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    Reset Filter
                                </Button>
                            )}
                        </div>

                        <div className="text-xs text-slate-500 font-medium">
                            Menampilkan <span className="font-bold text-slate-800">{filteredData.length}</span> transaksi
                            (<span className="font-bold font-mono text-slate-800">{summary.totalVol.toFixed(1)} m³</span>)
                        </div>
                    </div>

                    {/* TABLE PENERIMAAN MATERIAL */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                        <SimpleDataTable<AggregateInRow>
                            data={filteredData}
                            searchKeys={["no_bon", "driver_name", "plate_number", "aggregateLabel", "supplier", "notes"]}
                            searchPlaceholder="Cari no. bon, supir, plat nomor, material, atau supplier..."
                            pageSize={15}
                        >
                            {(items, sortConfig, toggleSort) => (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 border-b border-slate-200">
                                            <TableHead className="w-[110px]">
                                                <SortableHeader<AggregateInRow>
                                                    label="Tanggal"
                                                    sortKey="date"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            {showCabang && (
                                                <TableHead className="w-[120px]">
                                                    <SortableHeader<AggregateInRow>
                                                        label="Cabang"
                                                        sortKey="locationName"
                                                        sortConfig={sortConfig}
                                                        onSort={toggleSort}
                                                    />
                                                </TableHead>
                                            )}
                                            <TableHead className="w-[130px]">
                                                <SortableHeader<AggregateInRow>
                                                    label="Material"
                                                    sortKey="aggregateLabel"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[110px]">Sumber</TableHead>
                                            <TableHead className="w-[130px]">
                                                <SortableHeader<AggregateInRow>
                                                    label="No. Bon / DO"
                                                    sortKey="no_bon"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[140px]">
                                                <SortableHeader<AggregateInRow>
                                                    label="Sopir"
                                                    sortKey="driver_name"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[150px]">Kendaraan / DT</TableHead>
                                            <TableHead className="w-[110px] text-right">
                                                <SortableHeader<AggregateInRow>
                                                    label="Volume (m³)"
                                                    sortKey="volume_cubic"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[160px]">Retase / Jarak</TableHead>
                                            <TableHead className="min-w-[140px]">Supplier / Catatan</TableHead>
                                            {canManage && (
                                                <TableHead className="w-[80px] text-right text-xs uppercase font-semibold">
                                                    Aksi
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={showCabang ? (canManage ? 11 : 10) : (canManage ? 10 : 9)}
                                                    className="h-36 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <AlertCircle className="h-6 w-6 text-slate-300" />
                                                        <span className="font-medium text-sm">Tidak ada data material masuk yang cocok.</span>
                                                        {hasActiveFilters && (
                                                            <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs h-7">
                                                                Reset Filter
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            items.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                    {/* Tanggal */}
                                                    <TableCell className="text-xs font-medium text-slate-700 whitespace-nowrap">
                                                        {item.date}
                                                    </TableCell>

                                                    {/* Cabang */}
                                                    {showCabang && (
                                                        <TableCell>
                                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                                {item.locationName}
                                                            </span>
                                                        </TableCell>
                                                    )}

                                                    {/* Material */}
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${MATERIAL_COLORS[item.aggregate_type] || MATERIAL_COLORS.Other}`}
                                                        >
                                                            {item.aggregateLabel}
                                                        </span>
                                                    </TableCell>

                                                    {/* Sumber */}
                                                    <TableCell>
                                                        {item.source_type === "Internal" ? (
                                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                                <Mountain className="h-3 w-3 text-emerald-600" /> Quarry
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                <ShoppingCart className="h-3 w-3 text-amber-600" /> Vendor
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    {/* No Bon */}
                                                    <TableCell className="text-xs font-mono font-bold text-slate-800">
                                                        {item.no_bon}
                                                    </TableCell>

                                                    {/* Sopir */}
                                                    <TableCell>
                                                        <div className="text-xs font-bold text-slate-900 leading-snug">
                                                            {item.driver_name}
                                                        </div>
                                                        {item.driver && (
                                                            <span className="text-[10px] text-slate-400">Supir Internal</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Plat & Ukuran */}
                                                    <TableCell>
                                                        <div className="space-y-0.5">
                                                            <div className="text-xs font-mono font-bold text-slate-900">
                                                                {item.plate_number}
                                                            </div>
                                                            {item.dump_truck_size && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[10px] px-1.5 py-0 h-4 font-bold ${
                                                                        item.dump_truck_size === "KECIL"
                                                                            ? "border-amber-300 text-amber-800 bg-amber-50"
                                                                            : "border-blue-300 text-blue-800 bg-blue-50"
                                                                    }`}
                                                                >
                                                                    {item.dump_truck_size === "KECIL" ? "DT Kecil" : "DT Besar"}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Volume */}
                                                    <TableCell className="text-right">
                                                        <span className="font-mono font-black text-sm text-slate-900">
                                                            {item.volume_cubic.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-xs text-slate-400 ml-1">m³</span>
                                                    </TableCell>

                                                    {/* Retase DT */}
                                                    <TableCell>
                                                        {item.source_type === "Internal" ? (
                                                            <div className="space-y-0.5">
                                                                {item.retase_amount != null && item.retase_amount > 0 ? (
                                                                    <div className="text-xs font-black text-emerald-700 font-mono">
                                                                        Rp {item.retase_amount.toLocaleString("id-ID")}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 font-mono">-</span>
                                                                )}
                                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                                                                    <span>{item.distance_km ? `${item.distance_km} KM` : "-"}</span>
                                                                    {item.rate_price ? <span>• @Rp {item.rate_price.toLocaleString("id-ID")}</span> : null}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 italic">Non-Retase</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Supplier / Catatan */}
                                                    <TableCell>
                                                        {item.source_type === "External" && item.supplier && (
                                                            <div className="text-xs font-semibold text-slate-800 truncate max-w-[180px]" title={item.supplier}>
                                                                🏢 {item.supplier}
                                                            </div>
                                                        )}
                                                        {item.notes && (
                                                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]" title={item.notes}>
                                                                {item.notes}
                                                            </div>
                                                        )}
                                                        {!item.supplier && !item.notes && (
                                                            <span className="text-slate-300 text-xs">-</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Aksi */}
                                                    {canManage && (
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                                    onClick={() => handleEdit(item)}
                                                                    title="Edit transaksi"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                                    onClick={() => handleDelete(item)}
                                                                    title="Hapus transaksi"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </SimpleDataTable>
                    </Card>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════
                    TAB 2: DATA MATERIAL KELUAR
                ══════════════════════════════════════════════════════════ */}
                <TabsContent value="keluar" className="space-y-4">
                    {/* FILTER TOOLBAR KELUAR */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Filter Cabang */}
                            {showCabang && (
                                <div className="w-[180px]">
                                    <Select value={filterOutCabang} onValueChange={setFilterOutCabang}>
                                        <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                            <SelectValue placeholder="Semua Cabang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL" className="text-xs font-semibold">Semua Cabang BP</SelectItem>
                                            {locations.map((loc) => (
                                                <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                                    📍 {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Filter Jenis Material */}
                            <div className="w-[170px]">
                                <Select value={filterOutMaterial} onValueChange={setFilterOutMaterial}>
                                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Semua Material" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL" className="text-xs font-semibold">Semua Jenis Material</SelectItem>
                                        {AGGREGATE_TYPE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filter Kategori */}
                            <div className="w-[180px]">
                                <Select value={filterOutCategory} onValueChange={setFilterOutCategory}>
                                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Semua Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL" className="text-xs font-semibold">Semua Kategori</SelectItem>
                                        {OUTGOING_CATEGORY_OPTIONS.map((cat) => (
                                            <SelectItem key={cat.value} value={cat.value} className="text-xs">
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-medium">
                                Total: <strong className="font-mono text-slate-800">{filteredOutData.reduce((acc, r) => acc + r.volume_cubic, 0).toFixed(1)} m³</strong> ({filteredOutData.length} transaksi)
                            </span>
                            {canManage && (
                                <Button
                                    onClick={() => {
                                        setEditingOutData(null)
                                        setIsOutFormOpen(true)
                                    }}
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                    <PackageMinus className="h-3.5 w-3.5" />
                                    <span>+ Catat Material Keluar</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* TABLE MATERIAL KELUAR */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                        <SimpleDataTable<AggregateOutRow>
                            data={filteredOutData}
                            searchKeys={["no_bon", "recipient", "driver_name", "plate_number", "notes", "aggregateLabel", "categoryLabel"]}
                            searchPlaceholder="Cari no. bon, penerima, supir, plat nomor, material, atau keperluan..."
                            pageSize={15}
                        >
                            {(items, sortConfig, toggleSort) => (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 border-b border-slate-200">
                                            <TableHead className="w-[110px]">
                                                <SortableHeader<AggregateOutRow>
                                                    label="Tanggal"
                                                    sortKey="date"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            {showCabang && (
                                                <TableHead className="w-[120px]">
                                                    <SortableHeader<AggregateOutRow>
                                                        label="Cabang"
                                                        sortKey="locationName"
                                                        sortConfig={sortConfig}
                                                        onSort={toggleSort}
                                                    />
                                                </TableHead>
                                            )}
                                            <TableHead className="w-[120px]">Jenis Material</TableHead>
                                            <TableHead className="w-[130px]">Kategori</TableHead>
                                            <TableHead className="w-[110px]">No. Bon</TableHead>
                                            <TableHead className="min-w-[130px]">Penerima / Tujuan</TableHead>
                                            <TableHead className="w-[145px]">Armada & Sopir</TableHead>
                                            <TableHead className="w-[105px] text-right">
                                                <SortableHeader<AggregateOutRow>
                                                    label="Volume / Qty"
                                                    sortKey="volume_cubic"
                                                    sortConfig={sortConfig}
                                                    onSort={toggleSort}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[125px] text-right">Nilai Jual (Rp)</TableHead>
                                            <TableHead className="w-[110px] text-right">Retase DT (Rp)</TableHead>
                                            <TableHead className="min-w-[120px]">Catatan</TableHead>
                                            {canManage && <TableHead className="w-[75px] text-right">Aksi</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={showCabang ? 12 : 11} className="h-24 text-center text-muted-foreground text-xs">
                                                    Tidak ada data pengeluaran material agregat yang sesuai filter.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            items.map((row) => (
                                                <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <TableCell className="text-xs font-mono whitespace-nowrap text-slate-700">
                                                        {row.date}
                                                    </TableCell>
                                                    {showCabang && (
                                                        <TableCell className="text-xs font-medium text-slate-800">
                                                            {row.locationName}
                                                        </TableCell>
                                                    )}
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${MATERIAL_COLORS[row.aggregate_type] || "bg-slate-100 text-slate-700"}`}>
                                                            {row.aggregateLabel}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[10px] font-medium border-slate-300">
                                                            {row.categoryLabel}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs font-mono text-slate-700">
                                                        {row.no_bon || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-semibold text-slate-800">
                                                        {row.recipient || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-slate-600">
                                                        {row.transport_mode === "INTERNAL_DT" ? (
                                                            <div>
                                                                <span className="font-mono font-bold text-blue-700">{row.plate_number}</span>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <Badge className="bg-blue-600 text-white text-[9px] px-1 py-0 h-3.5">DT Internal</Badge>
                                                                    {row.driver_name && <span className="text-[10px] text-slate-500">{row.driver_name}</span>}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span className="font-mono font-medium text-slate-700">{row.plate_number || "-"}</span>
                                                                <div className="text-[10px] text-slate-400">Pembeli: {row.driver_name || "Ambil Sendiri"}</div>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold text-xs text-rose-700">
                                                        -{row.volume_cubic.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {row.unit || "m³"}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs">
                                                        {row.total_price && row.total_price > 0 ? (
                                                            <div>
                                                                <span className="font-bold text-emerald-700">
                                                                    Rp {row.total_price.toLocaleString("id-ID")}
                                                                </span>
                                                                {row.unit_price && (
                                                                    <div className="text-[9px] text-slate-400">
                                                                        @Rp {row.unit_price.toLocaleString("id-ID")}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs">
                                                        {row.retase_amount && row.retase_amount > 0 ? (
                                                            <div>
                                                                <span className="font-bold text-blue-800">
                                                                    Rp {row.retase_amount.toLocaleString("id-ID")}
                                                                </span>
                                                                <div className="text-[9px] text-slate-400">
                                                                    {row.distance_km ? `${row.distance_km} KM` : ""}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-slate-500 max-w-[130px] truncate" title={row.notes || ""}>
                                                        {row.notes || "-"}
                                                    </TableCell>
                                                    {canManage && (
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                                    onClick={() => handleEditOut(row)}
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                                    onClick={() => handleDeleteOut(row)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </SimpleDataTable>
                    </Card>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════
                    TAB 2: KARTU STOK (LEDGER MUTASI)
                ══════════════════════════════════════════════════════════ */}
                <TabsContent value="stok" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-700">Tampilkan stok untuk:</span>
                            <Select value={ledgerType} onValueChange={handleLedgerTypeChange}>
                                <SelectTrigger className="w-[220px] h-8 text-xs bg-slate-50 border-slate-200 font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {AGGREGATE_TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-slate-500">
                            Menghitung mutasi masuk (penerimaan material) vs mutasi keluar (pemakaian produksi batching)
                        </p>
                    </div>

                    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                        {ledgerLoading ? (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-xs gap-2">
                                <Loader className="animate-spin h-4 w-4 text-blue-600" />
                                <span>Memuat mutasi kartu stok...</span>
                            </div>
                        ) : !ledgerLoaded ? (
                            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                                <BarChart2 className="h-8 w-8 text-slate-300" />
                                <p>Pilih material untuk memuat kartu stok mutasi</p>
                            </div>
                        ) : (
                            <SimpleDataTable<AggregateLedgerRow>
                                data={ledgerData}
                                searchKeys={["description", "reference"]}
                                searchPlaceholder="Cari keterangan atau referensi surat jalan..."
                                pageSize={15}
                            >
                                {(items, sortConfig, toggleSort) => (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 border-b border-slate-200">
                                                <TableHead className="w-[140px]">
                                                    <SortableHeader
                                                        label="Tanggal & Jam"
                                                        sortKey="formattedDate"
                                                        sortConfig={sortConfig}
                                                        onSort={toggleSort}
                                                    />
                                                </TableHead>
                                                {showCabang && <TableHead className="w-[120px]">Cabang</TableHead>}
                                                <TableHead className="w-[80px]">Tipe</TableHead>
                                                <TableHead className="min-w-[200px]">Keterangan Transaksi</TableHead>
                                                <TableHead className="w-[140px]">Referensi</TableHead>
                                                <TableHead className="w-[110px] text-right">
                                                    <SortableHeader
                                                        label="Masuk (m³)"
                                                        sortKey="qty_in"
                                                        sortConfig={sortConfig}
                                                        onSort={toggleSort}
                                                    />
                                                </TableHead>
                                                <TableHead className="w-[110px] text-right">
                                                    <SortableHeader
                                                        label="Keluar (m³)"
                                                        sortKey="qty_out"
                                                        sortConfig={sortConfig}
                                                        onSort={toggleSort}
                                                    />
                                                </TableHead>
                                                <TableHead className="w-[120px] text-right">
                                                    <SortableHeader
                                                        label="Sisa Stok (m³)"
                                                        sortKey="balance"
                                                        sortConfig={sortConfig}
                                                        onSort={toggleSort}
                                                    />
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={showCabang ? 8 : 7}
                                                        className="h-24 text-center text-muted-foreground text-xs"
                                                    >
                                                        Belum ada rekaman mutasi stok untuk jenis material ini.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                items.map((item) => {
                                                    const isOut = item.type === "OUT"
                                                    return (
                                                        <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                            <TableCell className="text-xs font-mono whitespace-nowrap text-slate-700">
                                                                {item.formattedDate}
                                                            </TableCell>
                                                            {showCabang && (
                                                                <TableCell>
                                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                                        {item.locationName}
                                                                    </span>
                                                                </TableCell>
                                                            )}
                                                            <TableCell>
                                                                <Badge
                                                                    variant={isOut ? "destructive" : "default"}
                                                                    className="text-[10px] uppercase font-bold py-0 h-4"
                                                                >
                                                                    {isOut ? "OUT" : "IN"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="font-medium text-xs max-w-[260px] text-slate-800">
                                                                <div>{item.description}</div>
                                                                {item.detail_conversion && (
                                                                    <span className="text-[10px] text-slate-500 font-normal block font-mono">
                                                                        Konversi: {item.detail_conversion}
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-xs font-mono text-slate-500 max-w-[160px] truncate">
                                                                {item.reference}
                                                            </TableCell>
                                                            <TableCell className="text-right text-xs font-mono">
                                                                {item.qty_in > 0 ? (
                                                                    <span className="font-bold text-emerald-600">
                                                                        +{item.qty_in.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right text-xs font-mono">
                                                                {item.qty_out > 0 ? (
                                                                    <span className="font-bold text-rose-600">
                                                                        -{item.qty_out.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-xs text-slate-900 border-l border-slate-100 pl-3 bg-slate-50/50 font-mono">
                                                                {item.balance.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </SimpleDataTable>
                        )}
                    </Card>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════
                    TAB 3: PENGATURAN TARIF RETASE DUMP TRUCK
                ══════════════════════════════════════════════════════════ */}
                {canManageTarif && (
                    <TabsContent value="tarif" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* FORM KONFIGURASI TARIF PER CABANG (7 Cols) */}
                            <Card className="lg:col-span-7 border-emerald-200/80 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
                                    <div className="flex items-center gap-2 text-emerald-950">
                                        <div className="p-2 bg-emerald-600 text-white rounded-lg">
                                            <Settings className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">
                                                Konfigurasi Tarif Retase Dump Truck Quarry
                                            </CardTitle>
                                            <CardDescription className="text-xs text-emerald-800">
                                                Atur tarif retase per m³·km armada Dump Truck Besar (Tronton) & DT Kecil (Engkel) serta jarak acuan quarry per pangkalan.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-6">
                                    <form onSubmit={handleSaveTarif} className="space-y-5">
                                        {/* PILIH CABANG */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Pilih Cabang Pangkalan Batching Plant *</span>
                                            </Label>
                                            <select
                                                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                                                value={tarifLocationId}
                                                onChange={(e) => handleTarifLocationSelect(e.target.value)}
                                                required
                                            >
                                                {locations.map((loc) => (
                                                    <option key={loc.id} value={loc.id}>
                                                        📍 {loc.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* RUMUS INFO CARD */}
                                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                                            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                                                <Calculator className="h-4 w-4 text-emerald-600" />
                                                <span>Rumus Baku Perhitungan Retase Dump Truck:</span>
                                            </div>
                                            <div className="p-2.5 bg-white rounded-lg border border-emerald-200 font-mono font-bold text-emerald-900 text-center text-xs shadow-2xs">
                                                Total Retase = Tarif DT (Rp/m³·km) × Jarak Riil (KM) × Kubikasi Muatan (m³)
                                            </div>
                                            <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                                                Komisi sopir DT internal dihitung proporsional terhadap jarak tempuh dari tambang quarry ke pangkalan dan volume agregat yang diangkut.
                                            </p>
                                        </div>

                                        {/* INPUT HARGA DT BESAR & DT KECIL */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* DT BESAR */}
                                            <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold text-slate-900">
                                                        Tarif DT Besar (Rp / m³·km) *
                                                    </Label>
                                                    <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">Tronton</Badge>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        value={priceDtBesar}
                                                        onChange={(e) => setPriceDtBesar(e.target.value)}
                                                        placeholder="Misal: 1500"
                                                        required
                                                        className="pl-9 h-9 text-xs font-bold font-mono bg-white"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-500">
                                                    Khusus armada Dump Truck 10 roda / Tronton.
                                                </p>
                                            </div>

                                            {/* DT KECIL */}
                                            <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold text-slate-900">
                                                        Tarif DT Kecil (Rp / m³·km) *
                                                    </Label>
                                                    <Badge className="bg-amber-600 text-white text-[10px] px-1.5 py-0">Engkel</Badge>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        value={priceDtKecil}
                                                        onChange={(e) => setPriceDtKecil(e.target.value)}
                                                        placeholder="Misal: 1800"
                                                        required
                                                        className="pl-9 h-9 text-xs font-bold font-mono bg-white"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-500">
                                                    Khusus armada Dump Truck 6 roda / Engkel.
                                                </p>
                                            </div>
                                        </div>

                                        {/* JARAK DEFAULT */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-900">
                                                Default Jarak Rute Quarry ke Batching Plant (KM) *
                                            </Label>
                                            <div className="relative max-w-sm">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={defaultDistanceKm}
                                                    onChange={(e) => setDefaultDistanceKm(e.target.value)}
                                                    placeholder="Misal: 25.0"
                                                    required
                                                    className="h-9 text-xs font-bold font-mono pr-12 bg-white"
                                                />
                                                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">KM</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">
                                                Jarak standar rute quarry cabang ini. Operator saat input penerimaan dapat menggunakan jarak ini otomatis atau mengetik jarak riil.
                                            </p>
                                        </div>

                                        {/* SIMULASI LIVE */}
                                        <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200 space-y-2">
                                            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Simulasi Komisi (Contoh: Jarak {defaultDistanceKm || "25"} KM, Muatan 8 m³)</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                                    <div className="text-[10px] text-slate-500 font-semibold">Komisi DT Besar:</div>
                                                    <div className="text-sm font-black text-blue-700 font-mono mt-0.5">
                                                        Rp {Math.round((Number(priceDtBesar) || 0) * (Number(defaultDistanceKm) || 0) * 8).toLocaleString("id-ID")}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                                    <div className="text-[10px] text-slate-500 font-semibold">Komisi DT Kecil:</div>
                                                    <div className="text-sm font-black text-amber-700 font-mono mt-0.5">
                                                        Rp {Math.round((Number(priceDtKecil) || 0) * (Number(defaultDistanceKm) || 0) * 8).toLocaleString("id-ID")}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            disabled={isSavingTarif}
                                            type="submit"
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-xs"
                                        >
                                            {isSavingTarif ? "Menyimpan Tarif Dump Truck..." : "Simpan Konfigurasi Tarif"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* TABEL MASTER TARIF SELURUH CABANG (5 Cols) */}
                            <Card className="lg:col-span-5 border-slate-200 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="bg-slate-50/80 border-b border-slate-200 pb-3">
                                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                        <span>Daftar Tarif Seluruh Cabang</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500">
                                        Perbandingan tarif retase aktif per batching plant.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50">
                                                <TableHead className="text-xs">Cabang</TableHead>
                                                <TableHead className="text-xs">DT Besar</TableHead>
                                                <TableHead className="text-xs">DT Kecil</TableHead>
                                                <TableHead className="text-xs">Jarak</TableHead>
                                                <TableHead className="text-xs text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {locations.map((loc) => {
                                                const s = getExistingSetting(loc.id)
                                                const isSelected = loc.id === tarifLocationId
                                                return (
                                                    <TableRow
                                                        key={loc.id}
                                                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? "bg-emerald-50/40 font-semibold" : ""}`}
                                                        onClick={() => handleTarifLocationSelect(loc.id)}
                                                    >
                                                        <TableCell className="text-xs font-bold text-slate-800">
                                                            {loc.name}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-mono">
                                                            {s?.price_dt_besar ? `Rp ${s.price_dt_besar.toLocaleString("id-ID")}` : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-mono">
                                                            {s?.price_dt_kecil ? `Rp ${s.price_dt_kecil.toLocaleString("id-ID")}` : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-mono text-slate-500">
                                                            {s?.default_distance_km ? `${s.default_distance_km} KM` : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant={isSelected ? "default" : "outline"}
                                                                size="sm"
                                                                className={`h-6 text-[10px] px-2 ${isSelected ? "bg-emerald-600 text-white" : ""}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleTarifLocationSelect(loc.id)
                                                                }}
                                                            >
                                                                {isSelected ? "Aktif" : "Edit"}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            {/* ── MODAL INPUT & EDIT PENERIMAAN ── */}
            <MaterialAgregatForm
                isOpen={isFormOpen}
                initialData={editingData}
                locations={locations}
                vehicles={vehicles}
                drivers={drivers}
                retaseSettings={retaseSettings}
                userRole={userRole}
                userLocationId={userLocationId}
                onSuccess={() => setIsFormOpen(false)}
                onCancel={() => setIsFormOpen(false)}
            />

            {/* ── MODAL INPUT & EDIT PENGELUARAN ── */}
            <MaterialAgregatOutForm
                isOpen={isOutFormOpen}
                initialData={editingOutData}
                locations={locations}
                vehicles={vehicles}
                drivers={drivers}
                retaseSettings={retaseSettings}
                userRole={userRole}
                userLocationId={userLocationId}
                onSuccess={() => {
                    setIsOutFormOpen(false)
                    setEditingOutData(null)
                    toast({ title: "Berhasil", description: "Data pengeluaran material berhasil dicatat." })
                }}
                onCancel={() => {
                    setIsOutFormOpen(false)
                    setEditingOutData(null)
                }}
            />
        </div>
    )
}

function Loader({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
        </svg>
    )
}
