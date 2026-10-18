"use client"

import { useState, useTransition } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    CrusherRetaseReportData,
    CrusherRetaseSettingDTO,
    CrusherLocationOption,
    CrusherTripType,
} from "./types"
import {
    getCrusherRetaseReport,
    getCrusherRetaseSetting,
    markCrusherRetasePaid,
    markCrusherOperatorPaid,
} from "./actions"
import { RetaseStatCards } from "./components/stat-cards"
import { DriverSummaryTable } from "./components/driver-summary-table"
import { TripDetailTable } from "./components/trip-detail-table"
import { OperatorSummaryTable } from "./components/operator-summary-table"
import { OperatorTransactionTable } from "./components/operator-transaction-table"
import { RetaseSettingCard } from "./components/retase-setting-card"
import { BackdateRecalcModal } from "./components/backdate-modal"
import { toast } from "sonner"
import {
    Calculator,
    Users,
    Truck,
    Settings,
    RefreshCw,
    Loader2,
    Calendar,
    Filter,
    HardHat,
    Layers,
} from "lucide-react"

type Props = {
    initialReport: CrusherRetaseReportData
    initialSetting: CrusherRetaseSettingDTO | null
    locations: CrusherLocationOption[]
    canManageSettings?: boolean
}

export function RetaseCrusherClient({
    initialReport,
    initialSetting,
    locations,
    canManageSettings = true,
}: Props) {
    const [report, setReport] = useState<CrusherRetaseReportData>(initialReport)
    const [setting, setSetting] = useState<CrusherRetaseSettingDTO | null>(initialSetting)

    const [selectedMonth, setSelectedMonth] = useState(initialReport.periodMonth)
    const [selectedLocation, setSelectedLocation] = useState<string>("all")
    const [tripTypeFilter, setTripTypeFilter] = useState<CrusherTripType>("ALL")
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL")
    const [driverFilter, setDriverFilter] = useState<string>("all")

    const [isBackdateOpen, setIsBackdateOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("rekap")
    const [isPending, startTransition] = useTransition()

    const handleRefresh = (
        month = selectedMonth,
        loc = selectedLocation,
        st = statusFilter,
        drv = driverFilter,
        tt = tripTypeFilter
    ) => {
        startTransition(async () => {
            try {
                const updated = await getCrusherRetaseReport({
                    month,
                    locationId: loc === "all" ? undefined : loc,
                    isPaid: st,
                    driverId: drv === "all" ? undefined : drv,
                    tripType: tt,
                })
                setReport(updated)

                const updatedSetting = await getCrusherRetaseSetting(loc === "all" ? undefined : loc)
                setSetting(updatedSetting)
            } catch (err: any) {
                toast.error(err.message || "Gagal memuat data retase")
            }
        })
    }

    const handleMarkPaid = (ids: string[], isPaid: boolean) => {
        startTransition(async () => {
            try {
                await markCrusherRetasePaid(ids, isPaid)
                toast.success(
                    isPaid
                        ? `${ids.length} pengiriman ditandai Lunas`
                        : `${ids.length} pengiriman ditandai Belum Lunas`
                )
                handleRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal memperbarui status pembayaran")
            }
        })
    }

    const handleMarkDriverPaid = (driverId: string | null, driverName: string) => {
        const unpaidTrips = report.deliveries.filter(
            (d) => !d.isRetasePaid && (driverId ? d.driverId === driverId : d.driverName === driverName)
        )
        if (unpaidTrips.length === 0) {
            toast.info(`Seluruh pengiriman ${driverName} sudah lunas`)
            return
        }
        handleMarkPaid(
            unpaidTrips.map((d) => d.id),
            true
        )
    }

    const handleMarkOperatorPaid = (ids: string[], isPaid: boolean) => {
        startTransition(async () => {
            try {
                await markCrusherOperatorPaid(ids, isPaid)
                toast.success(
                    isPaid
                        ? `${ids.length} transaksi operator ditandai Lunas`
                        : `${ids.length} transaksi operator ditandai Belum Lunas`
                )
                handleRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal memperbarui status pembayaran operator")
            }
        })
    }

    const handleMarkSingleOperatorPaid = (operatorId: string | null, operatorName: string) => {
        const unpaid = (report.operatorTransactions || []).filter(
            (t) => !t.isOperatorPaid && (operatorId ? t.operatorId === operatorId : t.operatorName === operatorName)
        )
        if (unpaid.length === 0) {
            toast.info(`Seluruh insentif ${operatorName} sudah lunas`)
            return
        }
        handleMarkOperatorPaid(
            unpaid.map((t) => t.id),
            true
        )
    }

    const handleSelectOperatorFromSummary = (operatorName: string) => {
        setActiveTab("detail-operator")
    }

    const handleFilterDriverFromSummary = (driverName: string) => {
        setDriverFilter(driverName)
        setActiveTab("detail")
        handleRefresh(selectedMonth, selectedLocation, statusFilter, driverName, tripTypeFilter)
    }

    // Driver options for filter
    const uniqueDrivers = Array.from(
        new Set(report.deliveries.map((d) => d.driverName).filter(Boolean))
    ).sort()

    return (
        <div className="space-y-4 w-full">
            {/* Header Control */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <span>Retase Stone Crusher</span>
                    </h1>
                    <p className="text-xs text-slate-500">
                        Laporan dan rekapitulasi upah retase dump truck stone crusher & insentif operator crusher (Rp 5.000/m³).
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {canManageSettings && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsBackdateOpen(true)}
                            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
                        >
                            <Calculator className="h-3.5 w-3.5" />
                            <span>Hitung Ulang (Backdate)</span>
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRefresh()}
                        className="h-8 text-xs gap-1.5"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                        <span>Segarkan</span>
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Periode Bulan
                    </span>
                    <Input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => {
                            setSelectedMonth(e.target.value)
                            handleRefresh(e.target.value, selectedLocation, statusFilter, driverFilter, tripTypeFilter)
                        }}
                        className="h-8 text-xs bg-white dark:bg-slate-900"
                    />
                </div>

                <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Cabang Crusher</span>
                    <Select
                        value={selectedLocation}
                        onValueChange={(val) => {
                            setSelectedLocation(val)
                            handleRefresh(selectedMonth, val, statusFilter, driverFilter, tripTypeFilter)
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Semua Cabang" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Stone Crusher</SelectItem>
                            {locations.map((l) => (
                                <SelectItem key={l.id} value={l.id}>
                                    {l.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Alur Operasional</span>
                    <Select
                        value={tripTypeFilter}
                        onValueChange={(val: any) => {
                            setTripTypeFilter(val)
                            handleRefresh(selectedMonth, selectedLocation, statusFilter, driverFilter, val)
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Semua Alur" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Alur (Masuk & Keluar)</SelectItem>
                            <SelectItem value="MATERIAL_IN">Material Masuk (Quarry & Kolbin)</SelectItem>
                            <SelectItem value="MATERIAL_OUT">Material Keluar (Penjualan Bebas)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Status Pembayaran</span>
                    <Select
                        value={statusFilter}
                        onValueChange={(val: any) => {
                            setStatusFilter(val)
                            handleRefresh(selectedMonth, selectedLocation, val, driverFilter, tripTypeFilter)
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            <SelectItem value="UNPAID">Belum Lunas (Pending)</SelectItem>
                            <SelectItem value="PAID">Sudah Lunas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Filter className="h-3 w-3" /> Filter Sopir
                    </span>
                    <Select
                        value={driverFilter}
                        onValueChange={(val) => {
                            setDriverFilter(val)
                            handleRefresh(selectedMonth, selectedLocation, statusFilter, val, tripTypeFilter)
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Semua Sopir" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Sopir ({uniqueDrivers.length})</SelectItem>
                            {uniqueDrivers.map((d) => (
                                <SelectItem key={d} value={d}>
                                    {d}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stat Cards */}
            <RetaseStatCards summary={report.summary} />

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 flex-wrap h-auto">
                    <TabsTrigger value="rekap" className="text-xs font-semibold gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>Rekap Sopir DT ({report.driverSummaries.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="rekap-operator" className="text-xs font-semibold gap-1.5">
                        <HardHat className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Rekap Operator SC ({report.operatorSummaries?.length || 0})</span>
                    </TabsTrigger>
                    <TabsTrigger value="detail" className="text-xs font-semibold gap-1.5">
                        <Truck className="h-3.5 w-3.5" />
                        <span>Detail Trip Sopir ({report.deliveries.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="detail-operator" className="text-xs font-semibold gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Detail Transaksi Operator ({report.operatorTransactions?.length || 0})</span>
                    </TabsTrigger>
                    {canManageSettings && (
                        <TabsTrigger value="settings" className="text-xs font-semibold gap-1.5">
                            <Settings className="h-3.5 w-3.5" />
                            <span>Pengaturan Rumus & Tarif</span>
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="rekap" className="space-y-3 pt-1">
                    <DriverSummaryTable
                        summaries={report.driverSummaries}
                        onSelectDriver={handleFilterDriverFromSummary}
                        onMarkDriverPaid={handleMarkDriverPaid}
                    />
                </TabsContent>

                <TabsContent value="rekap-operator" className="space-y-3 pt-1">
                    <OperatorSummaryTable
                        summaries={report.operatorSummaries || []}
                        onSelectOperator={handleSelectOperatorFromSummary}
                        onMarkOperatorPaid={handleMarkSingleOperatorPaid}
                    />
                </TabsContent>

                <TabsContent value="detail" className="space-y-3 pt-1">
                    <TripDetailTable
                        deliveries={report.deliveries}
                        onMarkPaid={handleMarkPaid}
                        isPending={isPending}
                    />
                </TabsContent>

                <TabsContent value="detail-operator" className="space-y-3 pt-1">
                    <OperatorTransactionTable
                        transactions={report.operatorTransactions || []}
                        onMarkOperatorPaid={handleMarkOperatorPaid}
                        isPending={isPending}
                    />
                </TabsContent>

                {canManageSettings && (
                    <TabsContent value="settings" className="space-y-3 pt-1">
                        <RetaseSettingCard
                            initialSetting={setting}
                            locations={locations}
                            onSaved={() => handleRefresh()}
                        />
                    </TabsContent>
                )}
            </Tabs>

            {/* Modal Hitung Ulang Backdate */}
            <BackdateRecalcModal
                isOpen={isBackdateOpen}
                onClose={() => setIsBackdateOpen(false)}
                locations={locations}
                currentLocationId={selectedLocation}
                onCompleted={() => handleRefresh()}
            />
        </div>
    )
}
