"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, Plus, Truck } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
    id?: string
    value: string
    options: { plate: string; size: string | null; code?: string }[]
    onChange: (plate: string) => void
    onAddNew: (initialPlate: string) => void
}

/** Dropdown armada truk wajib berbasis Master Kendaraan Crusher */
export function TruckPicker({ id, value, options, onChange, onAddNew }: Props) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const handleAddNew = () => {
        setOpen(false)
        onAddNew(search.trim().toUpperCase())
        setSearch("")
    }

    const selectedOption = options.find((o) => o.plate.toUpperCase() === value.toUpperCase())

    return (
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch("") }}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full h-9 justify-between px-2.5 text-xs font-normal bg-white"
                >
                    <div className="flex items-center gap-1.5 truncate">
                        <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className={cn("truncate font-bold uppercase", value ? "text-slate-900" : "text-slate-400 font-normal")}>
                            {value || "Pilih armada truk"}
                        </span>
                        {selectedOption?.size && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-slate-50 text-slate-600 border-slate-200">
                                {selectedOption.size === "BESAR" ? "8 m³" : "4 m³"}
                            </Badge>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[260px]" align="start">
                <Command>
                    <CommandInput placeholder="Cari plat atau kode unit..." value={search} onValueChange={setSearch} className="text-xs uppercase" />
                    <CommandList className="max-h-60">
                        <CommandEmpty className="py-3 px-3 text-xs text-slate-500 space-y-2">
                            <p>Truk tidak ditemukan di master.</p>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt.plate}
                                    value={`${opt.plate} ${opt.code || ""}`.toLowerCase()}
                                    onSelect={() => {
                                        onChange(opt.plate)
                                        setOpen(false)
                                        setSearch("")
                                    }}
                                    className="text-xs cursor-pointer py-1.5 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Check className={cn("h-4 w-4 mr-1", value.toUpperCase() === opt.plate.toUpperCase() ? "opacity-100 text-emerald-600" : "opacity-0")} />
                                        <span className="font-bold text-slate-800 uppercase">{opt.plate}</span>
                                        {opt.code && (
                                            <span className="text-[11px] text-slate-500 font-mono">({opt.code})</span>
                                        )}
                                    </div>
                                    {opt.size && (
                                        <Badge variant="outline" className="text-[9px] px-1 h-4 bg-emerald-50 text-emerald-700 border-emerald-200">
                                            {opt.size === "BESAR" ? "DT Besar (8m³)" : "DT Kecil (4m³)"}
                                        </Badge>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <div className="border-t border-slate-100 p-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleAddNew}
                            className="w-full h-7 justify-start gap-1 text-[11px] text-blue-700 font-semibold"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {search.trim() ? `Tambah "${search.trim().toUpperCase()}" ke Master Truk` : "+ Tambah Truk Baru ke Master"}
                        </Button>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
