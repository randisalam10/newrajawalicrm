"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProduksiQuality, ProduksiWorkItem } from "../../types"

interface ConcreteSpecSectionProps {
    canCreate: boolean
    activeQualities: ProduksiQuality[]
    activeWorkItems: ProduksiWorkItem[]
    openQuality: boolean
    setOpenQuality: (open: boolean) => void
    selectedQualityId: string
    setSelectedQualityId: (id: string) => void
    openWorkItem: boolean
    setOpenWorkItem: (open: boolean) => void
    selectedWorkItemId: string
    setSelectedWorkItemId: (id: string) => void
}

export const ConcreteSpecSection: React.FC<ConcreteSpecSectionProps> = ({
    canCreate,
    activeQualities,
    activeWorkItems,
    openQuality,
    setOpenQuality,
    selectedQualityId,
    setSelectedQualityId,
    openWorkItem,
    setOpenWorkItem,
    selectedWorkItemId,
    setSelectedWorkItemId,
}) => {
    return (
        <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
            <h3 className="font-semibold text-sm text-slate-500 uppercase">3. Spesifikasi Beton</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="space-y-2 flex flex-col">
                    <Label>Mutu Beton *</Label>
                    <Popover open={openQuality} onOpenChange={setOpenQuality}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openQuality}
                                className="w-full justify-between"
                                disabled={!canCreate}
                            >
                                {selectedQualityId
                                    ? (() => {
                                        const q = activeQualities.find((qual) => qual.id === selectedQualityId)
                                        return q ? q.name : "-- Pilih Mutu --"
                                    })()
                                    : "-- Pilih Mutu --"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari mutu..." />
                                <CommandList>
                                    <CommandEmpty>Mutu tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {activeQualities.map((q) => (
                                            <CommandItem
                                                key={q.id}
                                                value={q.name}
                                                onSelect={() => {
                                                    setSelectedQualityId(q.id === selectedQualityId ? "" : q.id)
                                                    setOpenQuality(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedQualityId === q.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {q.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2 flex flex-col">
                    <Label>Item Pekerjaan *</Label>
                    <Popover open={openWorkItem} onOpenChange={setOpenWorkItem}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openWorkItem}
                                className="w-full justify-between"
                                disabled={!canCreate}
                            >
                                {selectedWorkItemId
                                    ? (() => {
                                        const w = activeWorkItems.find((work) => work.id === selectedWorkItemId)
                                        return w ? w.name : "-- Pilih Pekerjaan --"
                                    })()
                                    : "-- Pilih Pekerjaan --"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari pekerjaan..." />
                                <CommandList>
                                    <CommandEmpty>Pekerjaan tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {activeWorkItems.map((w) => (
                                            <CommandItem
                                                key={w.id}
                                                value={w.name}
                                                onSelect={() => {
                                                    setSelectedWorkItemId(w.id === selectedWorkItemId ? "" : w.id)
                                                    setOpenWorkItem(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedWorkItemId === w.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {w.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="volume_cubic">Volume (m³) *</Label>
                    <Input
                        id="volume_cubic"
                        name="volume_cubic"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 7.5"
                        required
                        disabled={!canCreate}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="slump">Nilai Slump *</Label>
                    <Input
                        id="slump"
                        name="slump"
                        placeholder="Ex: 10 ± 2"
                        required
                        disabled={!canCreate}
                    />
                </div>
            </div>
        </div>
    )
}
