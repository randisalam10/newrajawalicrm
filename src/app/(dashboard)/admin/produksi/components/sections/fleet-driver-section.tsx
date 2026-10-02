"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    IncentiveRateItem,
    ProduksiDriver,
    ProduksiOperator,
    ProduksiVehicle,
} from "../../types"

const fmtNum = (n: number) => new Intl.NumberFormat("id-ID").format(Math.round(n || 0))

interface FleetDriverSectionProps {
    canCreate: boolean
    activeVehicles: ProduksiVehicle[]
    activeDrivers: ProduksiDriver[]
    activeOperators: ProduksiOperator[]
    openVehicle: boolean
    setOpenVehicle: (open: boolean) => void
    selectedVehicleId: string
    setSelectedVehicleId: (id: string) => void
    openDriver: boolean
    setOpenDriver: (open: boolean) => void
    selectedDriverId: string
    setSelectedDriverId: (id: string) => void
    openOperator: boolean
    setOpenOperator: (open: boolean) => void
    selectedOperatorId: string
    setSelectedOperatorId: (id: string) => void
    activeMixerRateItem: IncentiveRateItem | undefined
    activeOpRateItem: IncentiveRateItem | undefined
    handleOpenMixerShortcut: () => void
    handleOpenOperatorShortcut: () => void
}

export const FleetDriverSection: React.FC<FleetDriverSectionProps> = ({
    canCreate,
    activeVehicles,
    activeDrivers,
    activeOperators,
    openVehicle,
    setOpenVehicle,
    selectedVehicleId,
    setSelectedVehicleId,
    openDriver,
    setOpenDriver,
    selectedDriverId,
    setSelectedDriverId,
    openOperator,
    setOpenOperator,
    selectedOperatorId,
    setSelectedOperatorId,
    activeMixerRateItem,
    activeOpRateItem,
    handleOpenMixerShortcut,
    handleOpenOperatorShortcut,
}) => {
    return (
        <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-500 uppercase">2. Informasi Armada, Driver & Operator</h3>
                {activeOperators.length === 1 && (
                    <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Operator Otomatis (1 di BP ini)
                    </span>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="space-y-2 flex flex-col">
                    <div className="flex items-center justify-between">
                        <Label>Truk Mixer *</Label>
                        <button
                            type="button"
                            onClick={handleOpenMixerShortcut}
                            className="text-[11px] text-slate-500 hover:text-slate-800 underline font-normal cursor-pointer"
                        >
                            Atur Tarif Mixer
                        </button>
                    </div>
                    <Popover open={openVehicle} onOpenChange={setOpenVehicle}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openVehicle}
                                className="w-full justify-between"
                                disabled={!canCreate}
                            >
                                {selectedVehicleId
                                    ? (() => {
                                        const v = activeVehicles.find((veh) => veh.id === selectedVehicleId)
                                        return v ? `${v.code} (${v.plate_number})` : "-- Pilih Armada --"
                                    })()
                                    : "-- Pilih Armada --"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari armada..." />
                                <CommandList>
                                    <CommandEmpty>Armada tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {activeVehicles.map((v) => (
                                            <CommandItem
                                                key={v.id}
                                                value={`${v.code} ${v.plate_number}`}
                                                onSelect={() => {
                                                    setSelectedVehicleId(v.id === selectedVehicleId ? "" : v.id)
                                                    setOpenVehicle(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedVehicleId === v.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {v.code} ({v.plate_number})
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                            Tarif: {activeMixerRateItem && Number(activeMixerRateItem.tarif_utama) > 0
                                ? `Rp ${fmtNum(activeMixerRateItem.tarif_utama)} / km`
                                : "Belum disetting"}
                        </span>
                        <a href="/admin/kendaraan" target="_blank" className="hover:text-slate-600 underline">
                            + Armada Baru
                        </a>
                    </div>
                </div>

                <div className="space-y-2 flex flex-col">
                    <div className="flex items-center justify-between">
                        <Label>Sopir *</Label>
                        <a
                            href="/admin/karyawan"
                            target="_blank"
                            className="text-[11px] text-slate-400 hover:text-slate-700 underline font-normal"
                        >
                            + Sopir Baru
                        </a>
                    </div>
                    <Popover open={openDriver} onOpenChange={setOpenDriver}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openDriver}
                                className="w-full justify-between"
                                disabled={!canCreate}
                            >
                                {selectedDriverId
                                    ? (() => {
                                        const d = activeDrivers.find((drv) => drv.id === selectedDriverId)
                                        return d ? d.name : "-- Pilih Sopir --"
                                    })()
                                    : "-- Pilih Sopir --"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari sopir..." />
                                <CommandList>
                                    <CommandEmpty>Sopir tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {activeDrivers.map((d) => (
                                            <CommandItem
                                                key={d.id}
                                                value={d.name}
                                                onSelect={() => {
                                                    setSelectedDriverId(d.id === selectedDriverId ? "" : d.id)
                                                    setOpenDriver(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedDriverId === d.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {d.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2 flex flex-col">
                    <div className="flex items-center justify-between">
                        <Label>Operator BP</Label>
                        <button
                            type="button"
                            onClick={handleOpenOperatorShortcut}
                            className="text-[11px] text-slate-500 hover:text-slate-800 underline font-normal cursor-pointer"
                        >
                            Atur Tarif
                        </button>
                    </div>
                    <Popover open={openOperator} onOpenChange={setOpenOperator}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openOperator}
                                className="w-full justify-between"
                                disabled={!canCreate}
                            >
                                {selectedOperatorId
                                    ? (() => {
                                        const o = activeOperators.find((op) => op.id === selectedOperatorId)
                                        return o ? o.name : "-- Pilih Operator BP --"
                                    })()
                                    : (activeOperators.length === 0 ? "Belum ada operator BP" : "-- Pilih Operator BP --")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari operator..." />
                                <CommandList>
                                    <CommandEmpty>Operator tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {activeOperators.map((o) => (
                                            <CommandItem
                                                key={o.id}
                                                value={o.name}
                                                onSelect={() => {
                                                    setSelectedOperatorId(o.id === selectedOperatorId ? "" : o.id)
                                                    setOpenOperator(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedOperatorId === o.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {o.name} {o.location?.name ? `(${o.location.name})` : ""}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                            Tarif: {activeOpRateItem && Number(activeOpRateItem.tarif_utama) > 0
                                ? `Rp ${fmtNum(activeOpRateItem.tarif_utama)} / m³`
                                : "Belum disetting"}
                        </span>
                        <a href="/admin/karyawan" target="_blank" className="hover:text-slate-600 underline">
                            + Operator Baru
                        </a>
                    </div>
                </div>

            </div>
        </div>
    )
}
