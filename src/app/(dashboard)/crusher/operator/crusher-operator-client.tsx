"use client"

import { useState, useTransition } from "react"
import { OperatorWorkLogItem, LocationOption, EmployeeOption, VehicleOption } from "../types"
import { getOperatorWorkLogs } from "../actions"
import { OperatorLogForm } from "./components/operator-log-form"
import { OperatorLogTable } from "./components/operator-log-table"
import { OperatorRekapTab } from "./components/operator-rekap-tab"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HardHat, Users, FileText, Calendar, Filter, Loader2, Settings, MapPin } from "lucide-react"
import Link from "next/link"

type Props = {
    initialLogs: OperatorWorkLogItem[]
    initialDate: string
    activeLocationId: string
    activeLocationName: string
    locations: LocationOption[]
    employees: EmployeeOption[]
    vehicles: VehicleOption[]
    masterRates?: Record<string, { normal: number; overtime: number; name?: string }>
    canViewWages?: boolean
    isLocationLocked?: boolean
}

export function CrusherOperatorClient({
    initialLogs,
    initialDate,
    activeLocationId,
    activeLocationName,
    locations,
    employees,
    vehicles,
    masterRates,
    canViewWages = false,
    isLocationLocked = false,
}: Props) {
    const [selectedDate, setSelectedDate] = useState(initialDate)
    const [selectedLocationId, setSelectedLocationId] = useState(activeLocationId)
    const [roleFilter, setRoleFilter] = useState("ALL")
    const [paidFilter, setPaidFilter] = useState("ALL")
    const [activeTab, setActiveTab] = useState<"logs" | "rekap">("logs")

    const [logs, setLogs] = useState<OperatorWorkLogItem[]>(initialLogs)
    const [isRefreshing, startTransition] = useTransition()

    const handleRefresh = (
        targetDate = selectedDate,
        targetLoc = selectedLocationId,
        targetRole = roleFilter,
        targetPaid = paidFilter,
    ) => {
        startTransition(async () => {
            try {
                const updated = await getOperatorWorkLogs({
                    date: targetDate,
                    locationId: targetLoc,
                    role_type: targetRole !== "ALL" ? targetRole : undefined,
                    is_paid: targetPaid === "ALL" ? undefined : targetPaid === "PAID",
                })
                setLogs(updated)
            } catch (err) {
                console.error("Gagal refresh operator work logs", err)
            }
        })
    }

    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate)
        handleRefresh(newDate, selectedLocationId, roleFilter, paidFilter)
    }

    const handleLocationChange = (newLoc: string) => {
        setSelectedLocationId(newLoc)
        handleRefresh(selectedDate, newLoc, roleFilter, paidFilter)
    }

    const handleRoleChange = (newRole: string) => {
        setRoleFilter(newRole)
        handleRefresh(selectedDate, selectedLocationId, newRole, paidFilter)
    }

    const handlePaidChange = (newPaid: string) => {
        setPaidFilter(newPaid)
        handleRefresh(selectedDate, selectedLocationId, roleFilter, newPaid)
    }

    return (
        <div className="space-y-4 w-full">
            {/* Header & Branch Switcher */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <HardHat className="h-5 w-5 text-amber-600" />
                        <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            Retase & Upah Operator / Helper
                        </h1>
                    </div>
                    <p className="text-xs text-slate-500">
                        Pencatatan jam kerja normal & lembur Excavator, Wheel Loader, Helper, dan Mesin Crusher
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Branch Display: Dropdown hanya untuk Global Admin, Badge Terkunci untuk Admin Crusher */}
                    {!isLocationLocked && locations.length > 1 ? (
                        <Select value={selectedLocationId} onValueChange={handleLocationChange}>
                            <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 w-[170px] font-semibold">
                                <SelectValue placeholder="Pilih Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Cabang (Global)</SelectItem>
                                {locations.map((l) => (
                                    <SelectItem key={l.id} value={l.id}>
                                        {l.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{activeLocationName || "Cabang Terkunci"}</span>
                        </div>
                    )}

                    {/* Date Picker */}
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden"
                        />
                    </div>

                    {canViewWages && (
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 gap-1.5"
                        >
                            <Link href="/admin/master-insentif">
                                <Settings className="h-3.5 w-3.5 text-slate-500" />
                                Tarif Acuan
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("logs")}
                        className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                            activeTab === "logs"
                                ? "border-amber-600 text-amber-600"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        <HardHat className="h-3.5 w-3.5" />
                        Log Jam Kerja
                    </button>
                    {canViewWages && (
                        <button
                            type="button"
                            onClick={() => setActiveTab("rekap")}
                            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                                activeTab === "rekap"
                                    ? "border-amber-600 text-amber-600"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <FileText className="h-3.5 w-3.5" />
                            Rekapitulasi & Slip Upah
                        </button>
                    )}
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 pb-2">
                    <Select value={roleFilter} onValueChange={handleRoleChange}>
                        <SelectTrigger className="h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 w-[140px]">
                            <SelectValue placeholder="Semua Peran" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Peran</SelectItem>
                            <SelectItem value="OPERATOR_EXCAVATOR">Excavator</SelectItem>
                            <SelectItem value="OPERATOR_LOADER">Wheel Loader</SelectItem>
                            <SelectItem value="HELPER">Helper Harian</SelectItem>
                            <SelectItem value="OPERATOR_CRUSHER">Mesin SC</SelectItem>
                        </SelectContent>
                    </Select>

                    {canViewWages && (
                        <Select value={paidFilter} onValueChange={handlePaidChange}>
                            <SelectTrigger className="h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 w-[120px]">
                                <SelectValue placeholder="Status Upah" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Status</SelectItem>
                                <SelectItem value="UNPAID">Belum Lunas</SelectItem>
                                <SelectItem value="PAID">Sudah Lunas</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Tab 1: Form Input & Table Log */}
            {activeTab === "logs" && (
                <div className="space-y-4">
                    <OperatorLogForm
                        selectedDate={selectedDate}
                        activeLocationId={selectedLocationId}
                        activeLocationName={activeLocationName}
                        locations={locations}
                        employees={employees}
                        vehicles={vehicles}
                        masterRates={masterRates}
                        canViewWages={canViewWages}
                        onSuccess={() => handleRefresh()}
                    />

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                Catatan Jam Kerja Tanggal {selectedDate}
                            </span>
                            <span className="text-slate-500">{logs.length} catatan</span>
                        </div>
                        <OperatorLogTable logs={logs} canViewWages={canViewWages} onRefresh={() => handleRefresh()} />
                    </div>
                </div>
            )}

            {/* Tab 2: Rekapitulasi Upah & Slip (Khusus Finance / Role yang memiliki izin RBAC) */}
            {activeTab === "rekap" && canViewWages && (
                <OperatorRekapTab logs={logs} onRefresh={() => handleRefresh()} />
            )}
        </div>
    )
}
