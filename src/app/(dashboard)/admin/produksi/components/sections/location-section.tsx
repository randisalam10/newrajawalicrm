"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProduksiLocation } from "../../types"

interface LocationSectionProps {
    locations: ProduksiLocation[]
    openLocation: boolean
    setOpenLocation: (open: boolean) => void
    selectedLocationId: string
    setSelectedLocationId: (id: string) => void
    resetDependentSelections: () => void
}

export const LocationSection: React.FC<LocationSectionProps> = ({
    locations,
    openLocation,
    setOpenLocation,
    selectedLocationId,
    setSelectedLocationId,
    resetDependentSelections,
}) => {
    return (
        <div className="space-y-4 border p-4 rounded-lg bg-blue-50/50 border-blue-200">
            <h3 className="font-semibold text-sm text-blue-700 uppercase">Pilih Cabang (Khusus SuperAdmin)</h3>
            <div className="space-y-2 flex flex-col">
                <Label>Cabang Operasional *</Label>
                <Popover open={openLocation} onOpenChange={setOpenLocation}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openLocation}
                            className="w-full justify-between"
                        >
                            {selectedLocationId
                                ? (() => {
                                    const l = locations.find((loc) => loc.id === selectedLocationId)
                                    return l ? l.name : "-- Pilih Cabang --"
                                })()
                                : "-- Pilih Cabang --"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Cari cabang..." />
                            <CommandList>
                                <CommandEmpty>Cabang tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                    {locations.map((loc) => (
                                        <CommandItem
                                            key={loc.id}
                                            value={loc.name}
                                            onSelect={() => {
                                                setSelectedLocationId(loc.id === selectedLocationId ? "" : loc.id)
                                                setOpenLocation(false)
                                                resetDependentSelections()
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedLocationId === loc.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {loc.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}
