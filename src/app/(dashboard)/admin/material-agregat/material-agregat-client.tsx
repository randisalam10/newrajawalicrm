"use client"

import React, { useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    PackagePlus,
    PackageMinus,
    ClipboardList,
    Settings,
    ArrowUpDown,
} from "lucide-react"
import {
    AggregateInRow,
    AggregateOutRow,
    AggregateLedgerRow,
    AggregateCombinedRow,
    AGGREGATE_TYPE_LABELS,
    OUTGOING_CATEGORY_LABELS,
} from "./columns"
import { MaterialAgregatForm } from "./material-agregat-form"
import { MaterialAgregatOutForm } from "./material-agregat-out-form"
import {
    deleteAggregateIncoming,
    deleteAggregateOutgoing,
    saveAggregateRetaseSetting,
} from "./actions"
import { useToast } from "@/hooks/use-toast"
import { MaterialAgregatProps, AggregateSummary, AggregateOutSummary } from "./types"
import { exportAggregateCSV } from "./utils/material-constants"
import { HeaderActionBar } from "./components/header-action-bar"
import { KpiMetrics } from "./components/kpi-metrics"
import { SemuaMutasiTab } from "./components/tabs/semua-mutasi-tab"
import { MaterialMasukTab } from "./components/tabs/material-masuk-tab"
import { MaterialKeluarTab } from "./components/tabs/material-keluar-tab"
import { KartuStokTab } from "./components/tabs/kartu-stok-tab"
import { TarifRetaseTab } from "./components/tabs/tarif-retase-tab"

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
}: MaterialAgregatProps) {
    const { toast } = useToast()

    // Dialog state for incoming material
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingData, setEditingData] = useState<AggregateInRow | null>(null)

    // Dialog & filter state for outgoing material
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

    // Incoming filter toolbar state
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

    // Formatted incoming data
    const formattedData: AggregateInRow[] = useMemo(() => {
        return initialData.map((t: any) => ({
            id: t.id,
            date: new Date(t.date).toISOString().split("T")[0],
            no_bon: t.no_bon,
            driver_name: t.driver_name,
            plate_number: t.plate_number,
            volume_cubic: t.volume_cubic,
            aggregate_type: t.aggregate_type,
            custom_material_name: t.custom_material_name,
            aggregateLabel: (t.aggregate_type === "Other" && t.custom_material_name)
                ? t.custom_material_name
                : (AGGREGATE_TYPE_LABELS[t.aggregate_type] || t.aggregate_type),
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
            unit_price: t.unit_price,
            total_price: t.total_price,
            vehicle: t.vehicle,
            driver: t.driver,
        }))
    }, [initialData])

    // Filtered incoming data
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

    // Summary calculations from filtered incoming data
    const summary: AggregateSummary = useMemo(() => {
        const byType: Record<string, number> = {}
        let totalVol = 0
        let totalRetase = 0
        let totalMaterialExpense = 0
        let internalVol = 0
        let externalVol = 0

        filteredData.forEach((row) => {
            byType[row.aggregate_type] = (byType[row.aggregate_type] || 0) + row.volume_cubic
            totalVol += row.volume_cubic
            if (row.total_price) totalMaterialExpense += row.total_price
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
            totalMaterialExpense,
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

    // Formatted outgoing data
    const formattedOutData: AggregateOutRow[] = useMemo(() => {
        return (initialOutData || []).map((t: any) => ({
            id: t.id,
            date: new Date(t.date).toISOString().split("T")[0],
            no_bon: t.no_bon,
            aggregate_type: t.aggregate_type,
            custom_material_name: t.custom_material_name,
            aggregateLabel: (t.aggregate_type === "Other" && t.custom_material_name)
                ? t.custom_material_name
                : (AGGREGATE_TYPE_LABELS[t.aggregate_type] || t.aggregate_type),
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

    // Filtered outgoing data
    const filteredOutData = useMemo(() => {
        return formattedOutData.filter((row) => {
            if (filterOutCabang !== "ALL" && row.locationId !== filterOutCabang) return false
            if (filterOutMaterial !== "ALL" && row.aggregate_type !== filterOutMaterial) return false
            if (filterOutCategory !== "ALL" && row.category !== filterOutCategory) return false
            return true
        })
    }, [formattedOutData, filterOutCabang, filterOutMaterial, filterOutCategory])

    // Summary calculations from outgoing data
    const summaryOut: AggregateOutSummary = useMemo(() => {
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
        const inRows: AggregateCombinedRow[] = filteredData.map(r => {
            let finInfo: string | undefined = undefined
            if (r.total_price && r.total_price > 0 && r.retase_amount && r.retase_amount > 0) {
                finInfo = `Mat: Rp ${r.total_price.toLocaleString("id-ID")} • Ret: Rp ${r.retase_amount.toLocaleString("id-ID")}`
            } else if (r.total_price && r.total_price > 0) {
                finInfo = `Rp ${r.total_price.toLocaleString("id-ID")}`
            } else if (r.retase_amount) {
                finInfo = `Retase: Rp ${r.retase_amount.toLocaleString("id-ID")}`
            }

            return {
                id: "in_" + r.id,
                date: r.date,
                direction: "IN",
                no_bon: r.no_bon,
                aggregate_type: r.aggregate_type,
                custom_material_name: r.custom_material_name,
                aggregateLabel: r.aggregateLabel,
                volume: r.volume_cubic,
                unit: "m³",
                categoryOrSource: r.source_type === "Internal" ? "Internal Quarry" : "Eksternal",
                party: r.supplier || (r.source_type === "Internal" ? "Quarry PT" : "-"),
                vehicleInfo: `${r.plate_number} • ${r.driver_name}${r.dump_truck_size ? ` (${r.dump_truck_size})` : ""}`,
                financialInfo: finInfo,
                notes: r.notes,
                locationName: r.locationName,
                locationId: r.locationId,
                rawIn: r,
            }
        })

        const outRows: AggregateCombinedRow[] = filteredOutData.map(r => ({
            id: "out_" + r.id,
            date: r.date,
            direction: "OUT",
            no_bon: r.no_bon || "-",
            aggregate_type: r.aggregate_type,
            custom_material_name: r.custom_material_name,
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

    // Handlers for edit & delete
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

    const showCabang = userRole === "SuperAdminBP" || isCorporate

    return (
        <div className="space-y-5 w-full">
            {/* ── HEADER & QUICK ACTIONS ── */}
            <HeaderActionBar
                isReadOnly={isReadOnly}
                canManage={canManage}
                onExportCSV={() => exportAggregateCSV(combinedData, toast)}
                onOpenInForm={() => {
                    setEditingData(null)
                    setIsFormOpen(true)
                }}
                onOpenOutForm={() => {
                    setEditingOutData(null)
                    setIsOutFormOpen(true)
                }}
            />

            {/* ── COMPACT KPI METRICS BAR ── */}
            <KpiMetrics summary={summary} summaryOut={summaryOut} />

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

                {/* TAB 0: SEMUA MUTASI */}
                <TabsContent value="semua" className="space-y-4">
                    <SemuaMutasiTab
                        combinedData={combinedData}
                        showCabang={showCabang}
                        canManage={canManage}
                        onEditIn={handleEdit}
                        onDeleteIn={handleDelete}
                        onEditOut={handleEditOut}
                        onDeleteOut={handleDeleteOut}
                    />
                </TabsContent>

                {/* TAB 1: PENERIMAAN MASUK */}
                <TabsContent value="masuk" className="space-y-4">
                    <MaterialMasukTab
                        filteredData={filteredData}
                        locations={locations}
                        showCabang={showCabang}
                        canManage={canManage}
                        filterCabang={filterCabang}
                        setFilterCabang={setFilterCabang}
                        filterMaterial={filterMaterial}
                        setFilterMaterial={setFilterMaterial}
                        filterSource={filterSource}
                        setFilterSource={setFilterSource}
                        filterDtSize={filterDtSize}
                        setFilterDtSize={setFilterDtSize}
                        hasActiveFilters={hasActiveFilters}
                        resetFilters={resetFilters}
                        totalVol={summary.totalVol}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </TabsContent>

                {/* TAB 2: PENGELUARAN KELUAR */}
                <TabsContent value="keluar" className="space-y-4">
                    <MaterialKeluarTab
                        filteredOutData={filteredOutData}
                        locations={locations}
                        showCabang={showCabang}
                        canManage={canManage}
                        filterOutCabang={filterOutCabang}
                        setFilterOutCabang={setFilterOutCabang}
                        filterOutMaterial={filterOutMaterial}
                        setFilterOutMaterial={setFilterOutMaterial}
                        filterOutCategory={filterOutCategory}
                        setFilterOutCategory={setFilterOutCategory}
                        onOpenOutForm={() => {
                            setEditingOutData(null)
                            setIsOutFormOpen(true)
                        }}
                        onEditOut={handleEditOut}
                        onDeleteOut={handleDeleteOut}
                    />
                </TabsContent>

                {/* TAB 3: KARTU STOK (LEDGER) */}
                <TabsContent value="stok" className="space-y-4">
                    <KartuStokTab
                        showCabang={showCabang}
                        ledgerType={ledgerType}
                        ledgerData={ledgerData}
                        ledgerLoading={ledgerLoading}
                        ledgerLoaded={ledgerLoaded}
                        onLedgerTypeChange={handleLedgerTypeChange}
                    />
                </TabsContent>

                {/* TAB 4: PENGATURAN TARIF RETASE DT */}
                {canManageTarif && (
                    <TabsContent value="tarif" className="space-y-6">
                        <TarifRetaseTab
                            locations={locations}
                            retaseSettings={retaseSettings}
                            tarifLocationId={tarifLocationId}
                            onTarifLocationSelect={handleTarifLocationSelect}
                            priceDtBesar={priceDtBesar}
                            setPriceDtBesar={setPriceDtBesar}
                            priceDtKecil={priceDtKecil}
                            setPriceDtKecil={setPriceDtKecil}
                            defaultDistanceKm={defaultDistanceKm}
                            setDefaultDistanceKm={setDefaultDistanceKm}
                            isSavingTarif={isSavingTarif}
                            onSaveTarif={handleSaveTarif}
                        />
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
