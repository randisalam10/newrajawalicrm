"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LocationOptionItem, VehicleOptionItem } from "../types"
import { RotateCcw } from "lucide-react"

interface Props {
    locations: LocationOptionItem[]
    vehicles: VehicleOptionItem[]
    selectedLocation: string
    selectedVehicle: string
    selectedSource: string
    startDate: string
    endDate: string
    isCorporate: boolean
    onLocationChange: (loc: string) => void
    onVehicleChange: (veh: string) => void
    onSourceChange: (src: string) => void
    onStartDateChange: (d: string) => void
    onEndDateChange: (d: string) => void
    onReset: () => void
}

export function FuelLogFilterBar({
    locations,
    vehicles,
    selectedLocation,
    selectedVehicle,
    selectedSource,
    startDate,
    endDate,
    isCorporate,
    onLocationChange,
    onVehicleChange,
    onSourceChange,
    onStartDateChange,
    onEndDateChange,
    onReset,
}: Props) {
    const filteredVehicles = selectedLocation && selectedLocation !== "all"
        ? vehicles.filter((v) => !v.locationId || v.locationId === selectedLocation)
        : vehicles

    return (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {isCorporate && (
                    <div>
                        <Select value={selectedLocation} onValueChange={onLocationChange}>
                            <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800">
                                <SelectValue placeholder="Semua Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang</SelectItem>
                                {locations.map((loc) => (
                                    <SelectItem key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div>
                    <Select value={selectedVehicle} onValueChange={onVehicleChange}>
                        <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800">
                            <SelectValue placeholder="Semua Unit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Unit Armada</SelectItem>
                            {filteredVehicles.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                    {v.code ? `[${v.code}] ` : ""}{v.plate_number}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Select value={selectedSource} onValueChange={onSourceChange}>
                        <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800">
                            <SelectValue placeholder="Semua Sumber" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Sumber BBM</SelectItem>
                            <SelectItem value="NON_RBL">Non-RBL (Tangki Duduk / Vendor)</SelectItem>
                            <SelectItem value="RBL">RBL (Kas Kecil)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                        title="Tanggal Mulai"
                    />
                </div>

                <div>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                        title="Tanggal Akhir"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onReset}
                        className="h-8 text-xs text-slate-500 hover:text-slate-800 gap-1 w-full"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                    </Button>
                </div>
            </div>
        </div>
    )
}
