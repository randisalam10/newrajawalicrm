"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Truck, User, Plus, HardHat } from "lucide-react"
import { VehicleOption, EmployeeOption } from "../types"

// ─── SEARCHABLE TRUCK SELECTOR ───────────────────────────────────────

interface TruckSelectorProps {
    selectedVehicleId: string
    vehicles: VehicleOption[]
    onSelectVehicle: (v: VehicleOption | null) => void
    onManualToggle: (initialPlate?: string) => void
    disabled?: boolean
    className?: string
}

export function CrusherTruckSelector({
    selectedVehicleId,
    vehicles = [],
    onSelectVehicle,
    onManualToggle,
    disabled = false,
    className,
}: TruckSelectorProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const selectedVehicle = useMemo(() => {
        return vehicles.find((v) => v.id === selectedVehicleId) || null
    }, [selectedVehicleId, vehicles])

    return (
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch("") }}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "h-9 text-xs justify-between font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-full px-2.5 gap-1 truncate cursor-pointer shadow-none",
                        !selectedVehicle && "text-slate-400",
                        className
                    )}
                >
                    <span className="truncate flex items-center gap-1.5 min-w-0">
                        <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        {selectedVehicle ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                <span className="font-mono">{selectedVehicle.plate_number}</span>
                                {selectedVehicle.dump_truck_size && (
                                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium ml-1">
                                        ({selectedVehicle.dump_truck_size === "BESAR" ? "8 m³" : "4 m³"})
                                    </span>
                                )}
                                {selectedVehicle.locationName && (
                                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                                        • {selectedVehicle.locationName}
                                    </span>
                                )}
                            </span>
                        ) : (
                            <span className="truncate">Pilih Armada Truk (Master)</span>
                        )}
                    </span>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50 ml-1 text-slate-500" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[280px] shadow-lg" align="start" sideOffset={4}>
                <Command>
                    <CommandInput
                        placeholder="Cari plat nomor atau cabang..."
                        value={search}
                        onValueChange={setSearch}
                        className="h-8 text-xs uppercase"
                    />
                    <CommandList className="max-h-60 overflow-y-auto">
                        <CommandEmpty className="py-2.5 px-3 text-center text-xs text-slate-500">
                            Truk tidak ditemukan di master.
                        </CommandEmpty>
                        <CommandGroup heading="Daftar Armada Truk">
                            {vehicles.map((v) => {
                                const isSelected = selectedVehicle?.id === v.id
                                const searchVal = `${v.plate_number} ${v.code || ""} ${v.dump_truck_size || ""} ${v.locationName || ""}`.toLowerCase()

                                return (
                                    <CommandItem
                                        key={v.id}
                                        value={searchVal}
                                        onSelect={() => {
                                            onSelectVehicle(v)
                                            setOpen(false)
                                            setSearch("")
                                        }}
                                        className="text-xs cursor-pointer py-1.5 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Check className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "opacity-100 text-blue-600" : "opacity-0")} />
                                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                                                {v.plate_number}
                                            </span>
                                            {v.dump_truck_size && (
                                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200 shrink-0">
                                                    {v.dump_truck_size === "BESAR" ? "8 m³" : "4 m³"}
                                                </Badge>
                                            )}
                                        </div>
                                        {v.locationName && (
                                            <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                                                {v.locationName}
                                            </span>
                                        )}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                    <div className="border-t border-slate-100 dark:border-slate-800 p-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setOpen(false)
                                onManualToggle(search.trim().toUpperCase())
                                setSearch("")
                            }}
                            className="w-full h-7 justify-start gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {search.trim() ? `Gunakan "${search.trim().toUpperCase()}" (Manual)` : "+ Input Plat Nomor Manual (Luar)"}
                        </Button>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── SEARCHABLE DRIVER SELECTOR ───────────────────────────────────────

interface DriverSelectorProps {
    selectedDriverId: string
    drivers: EmployeeOption[]
    targetLocationName?: string
    onSelectDriver: (d: EmployeeOption | null) => void
    onManualToggle: (initialName?: string) => void
    disabled?: boolean
    className?: string
}

export function CrusherDriverSelector({
    selectedDriverId,
    drivers = [],
    targetLocationName,
    onSelectDriver,
    onManualToggle,
    disabled = false,
    className,
}: DriverSelectorProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const selectedDriver = useMemo(() => {
        return drivers.find((d) => d.id === selectedDriverId) || null
    }, [selectedDriverId, drivers])

    // Group drivers by Crusher vs BP (prioritize target BP if provided)
    const { crusherDrivers, bpDrivers } = useMemo(() => {
        const sc: EmployeeOption[] = []
        const bp: EmployeeOption[] = []

        const target = (targetLocationName || "").toLowerCase()

        for (const d of drivers) {
            const locName = (d.locationName || "").toLowerCase()
            if (locName.includes("crusher") || locName.includes("harapan") || locName.includes("stone")) {
                sc.push(d)
            } else {
                bp.push(d)
            }
        }

        // Sort BP drivers: if driver matches targetLocationName, put on top
        if (target) {
            bp.sort((a, b) => {
                const aMatch = (a.locationName || "").toLowerCase().includes(target) ? 1 : 0
                const bMatch = (b.locationName || "").toLowerCase().includes(target) ? 1 : 0
                if (aMatch !== bMatch) return bMatch - aMatch
                return a.name.localeCompare(b.name)
            })
        }

        return { crusherDrivers: sc, bpDrivers: bp }
    }, [drivers, targetLocationName])

    return (
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch("") }}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "h-9 text-xs justify-between font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-full px-2.5 gap-1 truncate cursor-pointer shadow-none",
                        !selectedDriver && "text-slate-400",
                        className
                    )}
                >
                    <span className="truncate flex items-center gap-1.5 min-w-0">
                        <User className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        {selectedDriver ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {selectedDriver.name}
                                {selectedDriver.locationName && (
                                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                                        • {selectedDriver.locationName}
                                    </span>
                                )}
                            </span>
                        ) : (
                            <span className="truncate">Pilih Sopir (Crusher / BP)</span>
                        )}
                    </span>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50 ml-1 text-slate-500" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[280px] shadow-lg" align="start" sideOffset={4}>
                <Command>
                    <CommandInput
                        placeholder="Cari nama sopir atau cabang..."
                        value={search}
                        onValueChange={setSearch}
                        className="h-8 text-xs"
                    />
                    <CommandList className="max-h-60 overflow-y-auto">
                        <CommandEmpty className="py-2.5 px-3 text-center text-xs text-slate-500">
                            Sopir tidak ditemukan di master.
                        </CommandEmpty>

                        {crusherDrivers.length > 0 && (
                            <CommandGroup heading="Sopir Stone Crusher">
                                {crusherDrivers.map((d) => {
                                    const isSelected = selectedDriver?.id === d.id
                                    const searchVal = `${d.name} ${d.locationName || ""} crusher stone`.toLowerCase()
                                    return (
                                        <CommandItem
                                            key={d.id}
                                            value={searchVal}
                                            onSelect={() => {
                                                onSelectDriver(d)
                                                setOpen(false)
                                                setSearch("")
                                            }}
                                            className="text-xs cursor-pointer py-1.5 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Check className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "opacity-100 text-blue-600" : "opacity-0")} />
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                    {d.name}
                                                </span>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                                                Crusher
                                            </Badge>
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        )}

                        {bpDrivers.length > 0 && (
                            <CommandGroup heading="Sopir Batching Plant (Jemput Material)">
                                {bpDrivers.map((d) => {
                                    const isSelected = selectedDriver?.id === d.id
                                    const isTargetMatch = targetLocationName && (d.locationName || "").toLowerCase().includes(targetLocationName.toLowerCase())
                                    const searchVal = `${d.name} ${d.locationName || ""} batching plant bp`.toLowerCase()
                                    return (
                                        <CommandItem
                                            key={d.id}
                                            value={searchVal}
                                            onSelect={() => {
                                                onSelectDriver(d)
                                                setOpen(false)
                                                setSearch("")
                                            }}
                                            className="text-xs cursor-pointer py-1.5 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Check className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "opacity-100 text-blue-600" : "opacity-0")} />
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                    {d.name}
                                                </span>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[9px] px-1 py-0 h-4 shrink-0",
                                                    isTargetMatch
                                                        ? "bg-blue-100 text-blue-800 border-blue-300 font-bold"
                                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                                )}
                                            >
                                                {d.locationName || "BP"}
                                            </Badge>
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        )}
                    </CommandList>
                    <div className="border-t border-slate-100 dark:border-slate-800 p-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setOpen(false)
                                onManualToggle(search.trim())
                                setSearch("")
                            }}
                            className="w-full h-7 justify-start gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {search.trim() ? `Gunakan "${search.trim()}" (Sopir Luar)` : "+ Input Nama Sopir Bebas (Luar)"}
                        </Button>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── SEARCHABLE OPERATOR SELECTOR ─────────────────────────────────────

interface OperatorSelectorProps {
    selectedOperatorId: string
    operators: EmployeeOption[]
    onSelectOperator: (op: EmployeeOption | null) => void
    disabled?: boolean
    className?: string
}

export function CrusherOperatorSelector({
    selectedOperatorId,
    operators = [],
    onSelectOperator,
    disabled = false,
    className,
}: OperatorSelectorProps) {
    const [open, setOpen] = useState(false)

    const selectedOperator = useMemo(() => {
        return operators.find((op) => op.id === selectedOperatorId) || null
    }, [selectedOperatorId, operators])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "h-9 text-xs justify-between font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-full px-2.5 gap-1 truncate cursor-pointer shadow-none",
                        !selectedOperator && "text-slate-400",
                        className
                    )}
                >
                    <span className="truncate flex items-center gap-1.5 min-w-0">
                        <HardHat className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        {selectedOperator ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {selectedOperator.name}
                            </span>
                        ) : (
                            <span className="truncate">Pilih Operator Crusher</span>
                        )}
                    </span>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50 ml-1 text-slate-500" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[240px] shadow-lg" align="start" sideOffset={4}>
                <Command>
                    <CommandInput placeholder="Cari nama operator..." className="h-8 text-xs" />
                    <CommandList className="max-h-60 overflow-y-auto">
                        <CommandEmpty className="py-2.5 px-3 text-center text-xs text-slate-500">
                            Operator tidak ditemukan.
                        </CommandEmpty>
                        <CommandGroup heading="Operator Mesin Crusher">
                            {operators.map((op) => {
                                const isSelected = selectedOperator?.id === op.id
                                return (
                                    <CommandItem
                                        key={op.id}
                                        value={`${op.name} operator`.toLowerCase()}
                                        onSelect={() => {
                                            onSelectOperator(op)
                                            setOpen(false)
                                        }}
                                        className="text-xs cursor-pointer py-1.5 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Check className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "opacity-100 text-emerald-600" : "opacity-0")} />
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                {op.name}
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                                            Operator SC
                                        </Badge>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
