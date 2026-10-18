"use client"

import { useState, useTransition } from "react"
import { CrusherTabKey, CrusherDailyReportData, CrusherMaterialSourceItem, LocationOption, VehicleOption, EmployeeOption } from "./types"
import { CrusherHeader } from "./components/crusher-header"
import { SourceMasterDialog } from "./components/source-master-dialog"
import { TabMachineHm } from "./components/tabs/tab-machine-hm"
import { TabFuelSolar } from "./components/tabs/tab-fuel-solar"
import { TabMaterialIn } from "./components/tabs/tab-material-in"
import { TabMaterialOut } from "./components/tabs/tab-material-out"
import { TabDailyRecap } from "./components/tabs/tab-daily-recap"
import { getCrusherDailyReport, getCrusherMaterialSources } from "./actions"
import { Clock, Fuel, Layers, Mountain, FileCheck, Loader2 } from "lucide-react"

type Props = {
    initialReport: CrusherDailyReportData | null
    initialDate: string
    locationId: string
    locationName: string
    locations: LocationOption[]
    bpLocations?: LocationOption[]
    sources: CrusherMaterialSourceItem[]
    vehicles: VehicleOption[]
    employees?: EmployeeOption[]
    canViewWages?: boolean
}

export function CrusherClient({
    initialReport,
    initialDate,
    locationId,
    locationName,
    locations,
    bpLocations,
    sources: initialSources,
    vehicles,
    employees = [],
    canViewWages = false,
}: Props) {
    const [selectedDate, setSelectedDate] = useState<string>(initialDate)
    const [activeTab, setActiveTab] = useState<CrusherTabKey>("machine")
    const [report, setReport] = useState<CrusherDailyReportData | null>(initialReport)
    const [sources, setSources] = useState<CrusherMaterialSourceItem[]>(initialSources)
    const [isSourceMasterOpen, setIsSourceMasterOpen] = useState(false)
    const [isLoadingDate, startTransition] = useTransition()

    // Refresh current date data
    const refreshData = (targetDate = selectedDate) => {
        startTransition(async () => {
            try {
                const updated = await getCrusherDailyReport(targetDate, locationId)
                setReport(updated)
            } catch (err) {
                console.error("Gagal refresh data crusher", err)
            }
        })
    }

    const refreshSources = async () => {
        try {
            const updatedSources = await getCrusherMaterialSources()
            setSources(updatedSources)
        } catch (err) {
            console.error("Gagal refresh master sumber", err)
        }
    }

    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate)
        refreshData(newDate)
    }

    const tabsConfig = [
        { key: "machine" as const, label: "Jam Mesin", icon: Clock },
        { key: "fuel" as const, label: "Solar (BBM)", icon: Fuel },
        { key: "material_in" as const, label: "Masuk Mentah", icon: Layers },
        { key: "material_out" as const, label: "Batu Keluar", icon: Mountain },
        { key: "recap" as const, label: "Rekap Harian", icon: FileCheck },
    ]

    return (
        <div className="space-y-3.5 w-full">
            {/* Header Ringkas & Metrik Cepat */}
            <CrusherHeader
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                report={report}
                locationName={locationName}
                onOpenSourceMaster={() => setIsSourceMasterOpen(true)}
                locations={locations}
                selectedLocationId={locationId}
            />

            {/* Segmented Mobile Horizontal Navigation Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 min-w-max sm:min-w-0 sm:grid sm:grid-cols-5">
                    {tabsConfig.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.key
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                    isActive
                                        ? "bg-slate-900 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                }`}
                            >
                                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Loading Indicator saat berganti tanggal */}
            {isLoadingDate && (
                <div className="py-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    <span>Memuat data tanggal {selectedDate}...</span>
                </div>
            )}

            {/* Tab Contents */}
            <div className="w-full">
                {activeTab === "machine" && (
                    <TabMachineHm
                        report={report}
                        selectedDate={selectedDate}
                        locationId={locationId}
                        onRefresh={() => refreshData(selectedDate)}
                    />
                )}

                {activeTab === "fuel" && (
                    <TabFuelSolar
                        report={report}
                        selectedDate={selectedDate}
                        locationId={locationId}
                        vehicles={vehicles}
                        onRefresh={() => refreshData(selectedDate)}
                    />
                )}

                {activeTab === "material_in" && (
                    <TabMaterialIn
                        report={report}
                        selectedDate={selectedDate}
                        locationId={locationId}
                        sources={sources}
                        vehicles={vehicles}
                        employees={employees}
                        canViewWages={canViewWages}
                        onRefresh={() => refreshData(selectedDate)}
                    />
                )}

                {activeTab === "material_out" && (
                    <TabMaterialOut
                        report={report}
                        selectedDate={selectedDate}
                        locationId={locationId}
                        locations={bpLocations && bpLocations.length > 0 ? bpLocations : locations}
                        vehicles={vehicles}
                        employees={employees}
                        canViewWages={canViewWages}
                        onRefresh={() => refreshData(selectedDate)}
                    />
                )}

                {activeTab === "recap" && (
                    <TabDailyRecap
                        report={report}
                        selectedDate={selectedDate}
                        onRefresh={() => refreshData(selectedDate)}
                    />
                )}
            </div>

            {/* Modal Master Sumber Material */}
            <SourceMasterDialog
                isOpen={isSourceMasterOpen}
                onClose={() => setIsSourceMasterOpen(false)}
                sources={sources}
                onRefresh={refreshSources}
            />
        </div>
    )
}
