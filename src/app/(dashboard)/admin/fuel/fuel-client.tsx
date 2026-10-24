"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    DriverOptionItem,
    FuelLogStats,
    LocationOptionItem,
    VehicleFuelLogItem,
    VehicleOptionItem,
} from "./types"
import { FuelStatsCards } from "./components/fuel-stats-cards"
import { FuelLogFilterBar } from "./components/fuel-log-filter"
import { FuelLogTable } from "./components/fuel-log-table"
import { FuelLogFormDialog } from "./components/fuel-log-form"
import { getVehicleFuelLogs } from "./actions"
import { Fuel, Plus, RefreshCw } from "lucide-react"

interface Props {
    initialItems: VehicleFuelLogItem[]
    initialStats: FuelLogStats
    locations: LocationOptionItem[]
    vehicles: VehicleOptionItem[]
    drivers: DriverOptionItem[]
    currentLocationId?: string
    isCorporate: boolean
    canCreate?: boolean
    canDelete?: boolean
}

export function FuelClient({
    initialItems,
    initialStats,
    locations,
    vehicles,
    drivers,
    currentLocationId = "",
    isCorporate,
    canCreate = true,
    canDelete = true,
}: Props) {
    const [items, setItems] = useState<VehicleFuelLogItem[]>(initialItems)
    const [stats, setStats] = useState<FuelLogStats>(initialStats)
    const [isPending, startTransition] = useTransition()
    const [formOpen, setFormOpen] = useState(false)

    // Filter states: Default to current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

    const [selectedLocation, setSelectedLocation] = useState(isCorporate ? "all" : (currentLocationId || "all"))
    const [selectedVehicle, setSelectedVehicle] = useState("all")
    const [selectedSource, setSelectedSource] = useState("all")
    const [startDate, setStartDate] = useState(firstDay)
    const [endDate, setEndDate] = useState(lastDay)

    const fetchLogs = (override?: {
        locationId?: string
        vehicleId?: string
        fuelSource?: string
        startDate?: string
        endDate?: string
    }) => {
        startTransition(async () => {
            try {
                const res = await getVehicleFuelLogs({
                    locationId: override?.locationId ?? selectedLocation,
                    vehicleId: override?.vehicleId ?? selectedVehicle,
                    fuelSource: override?.fuelSource ?? selectedSource,
                    startDate: override?.startDate ?? startDate,
                    endDate: override?.endDate ?? endDate,
                })
                setItems(res.items)
                setStats(res.stats)
            } catch (err) {
                console.error("Gagal memuat data log BBM:", err)
            }
        })
    }

    const handleReset = () => {
        setSelectedLocation(isCorporate ? "all" : (currentLocationId || "all"))
        setSelectedVehicle("all")
        setSelectedSource("all")
        setStartDate(firstDay)
        setEndDate(lastDay)
        fetchLogs({
            locationId: isCorporate ? "all" : (currentLocationId || "all"),
            vehicleId: "all",
            fuelSource: "all",
            startDate: firstDay,
            endDate: lastDay,
        })
    }

    return (
        <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Fuel className="h-5 w-5 text-amber-600" />
                        <span>Monitoring Penggunaan BBM Armada & Alat</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Pencatatan konsumsi BBM solar armada (Truk Mixer, Dump Truck, Loader, Genset) baik dari kas RBL maupun Non-RBL dengan harga manual & tracking KM/HM.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLogs()}
                        disabled={isPending}
                        className="h-9 text-xs gap-1.5"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                    {canCreate && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setFormOpen(true)}
                            className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-xs"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Catat BBM Baru</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Stat Cards */}
            <FuelStatsCards stats={stats} />

            {/* Filter Bar */}
            <FuelLogFilterBar
                locations={locations}
                vehicles={vehicles}
                selectedLocation={selectedLocation}
                selectedVehicle={selectedVehicle}
                selectedSource={selectedSource}
                startDate={startDate}
                endDate={endDate}
                isCorporate={isCorporate}
                onLocationChange={(loc) => {
                    setSelectedLocation(loc)
                    fetchLogs({ locationId: loc })
                }}
                onVehicleChange={(veh) => {
                    setSelectedVehicle(veh)
                    fetchLogs({ vehicleId: veh })
                }}
                onSourceChange={(src) => {
                    setSelectedSource(src)
                    fetchLogs({ fuelSource: src })
                }}
                onStartDateChange={(d) => {
                    setStartDate(d)
                    fetchLogs({ startDate: d })
                }}
                onEndDateChange={(d) => {
                    setEndDate(d)
                    fetchLogs({ endDate: d })
                }}
                onReset={handleReset}
            />

            {/* Data Table */}
            <FuelLogTable
                items={items}
                canDelete={canDelete}
                onSuccess={() => fetchLogs()}
            />

            {/* Form Dialog */}
            <FuelLogFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                locations={locations}
                vehicles={vehicles}
                drivers={drivers}
                currentLocationId={currentLocationId}
                isCorporate={isCorporate}
                onSuccess={() => fetchLogs()}
            />
        </div>
    )
}
