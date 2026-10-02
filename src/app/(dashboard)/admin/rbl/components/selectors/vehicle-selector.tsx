"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"

export function VehicleSelector({
    selectedVehicleId,
    vehicles = [],
    isHeadOfficeBudget = false,
    onSelect,
    disabled = false,
}: {
    selectedVehicleId?: string | null
    vehicles: any[]
    isHeadOfficeBudget?: boolean
    onSelect: (vehicleId: string | null) => void
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)

    const selectedVehicle = useMemo(() => {
        if (!selectedVehicleId || selectedVehicleId === "none") return null
        return vehicles.find(v => v.id === selectedVehicleId)
    }, [selectedVehicleId, vehicles])

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
                        "h-7 text-xs justify-between font-normal bg-white border-amber-200 text-amber-950 hover:bg-amber-50/50 w-full px-2 gap-1 truncate cursor-pointer",
                        !selectedVehicle && "text-slate-500"
                    )}
                >
                    <span className="truncate">
                        {selectedVehicle ? (
                            <span className="font-medium text-slate-800">
                                <span className="font-bold text-amber-800">{selectedVehicle.code}</span> - {selectedVehicle.plate_number || selectedVehicle.plateNumber}
                                {isHeadOfficeBudget && selectedVehicle.location?.name ? ` • ${selectedVehicle.location.name}` : ""}
                            </span>
                        ) : (
                            "-- Umum / Bukan Armada Tertentu --"
                        )}
                    </span>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-1 text-amber-700" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0 shadow-lg" align="start" sideOffset={4} onOpenAutoFocus={(e) => e.preventDefault()}>
                <Command>
                    <CommandInput placeholder="Cari kode unit, plat nomor, atau cabang..." className="h-8 text-xs" />
                    <CommandList className="max-h-60 overflow-y-auto overscroll-contain">
                        <CommandEmpty className="py-2.5 text-center text-xs text-slate-500">
                            Armada tidak ditemukan.
                        </CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="none-bukan-armada"
                                onSelect={() => {
                                    onSelect(null)
                                    setOpen(false)
                                }}
                                className="text-xs cursor-pointer py-1.5"
                            >
                                <Check className={cn("mr-2 h-3.5 w-3.5", !selectedVehicle ? "opacity-100" : "opacity-0")} />
                                <span className="text-slate-500 font-medium">-- Umum / Bukan Armada Tertentu --</span>
                            </CommandItem>
                            {vehicles.map((v: any) => {
                                const isSelected = selectedVehicle?.id === v.id
                                const plate = v.plate_number || v.plateNumber || ""
                                const vType = v.vehicle_type || v.type || "Unit"
                                const searchVal = `${v.code} ${plate} ${vType} ${v.location?.name || ""}`

                                return (
                                    <CommandItem
                                        key={v.id}
                                        value={searchVal}
                                        onSelect={() => {
                                            onSelect(v.id)
                                            setOpen(false)
                                        }}
                                        className="text-xs cursor-pointer py-1.5 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Check className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "opacity-100 text-blue-600" : "opacity-0")} />
                                            <div className="truncate">
                                                <span className="font-bold text-slate-900">{v.code}</span>
                                                <span className="text-slate-600 ml-1.5 font-mono">{plate}</span>
                                                <span className="text-[10px] text-slate-400 ml-1">({vType})</span>
                                            </div>
                                        </div>
                                        {isHeadOfficeBudget && v.location?.name && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-50 text-blue-700 border-blue-200 shrink-0 ml-1 font-medium">
                                                {v.location.name}
                                            </Badge>
                                        )}
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
