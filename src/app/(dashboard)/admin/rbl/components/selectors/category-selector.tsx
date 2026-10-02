"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Fuel, Plus } from "lucide-react"

export function CategorySelector({
    selectedCategoryName,
    categories,
    onSelect,
    onOpenQuickCreate,
    disabled = false,
}: {
    selectedCategoryName: string
    categories: any[]
    onSelect: (cat: any) => void
    onOpenQuickCreate: () => void
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const currentCat = categories.find(c => c.name.toLowerCase() === (selectedCategoryName || "").toLowerCase())

    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={disabled}
                    className="h-8 w-full justify-between text-xs px-2.5 bg-white font-normal hover:bg-slate-50 border-slate-200"
                >
                    <span className="truncate flex items-center gap-1.5">
                        {currentCat?.requireVehicleKm ? (
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                                <Fuel className="h-3 w-3 text-amber-600 shrink-0" />
                                {selectedCategoryName}
                            </span>
                        ) : (
                            <span className="text-slate-800">{selectedCategoryName || "Pilih Kategori..."}</span>
                        )}
                    </span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-40" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-lg" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <Command>
                    <CommandInput
                        placeholder="Cari kategori..."
                        value={search}
                        onValueChange={setSearch}
                        className="text-xs h-8"
                    />
                    <CommandList className="max-h-60 overflow-y-auto overscroll-contain">
                        <CommandEmpty className="text-xs py-3 text-center text-slate-400">
                            Kategori tidak ditemukan.
                        </CommandEmpty>
                        <CommandGroup heading="Daftar Kategori RBL">
                            {filtered.map(cat => (
                                <CommandItem
                                    key={cat.id}
                                    value={cat.name}
                                    onSelect={() => {
                                        onSelect(cat)
                                        setOpen(false)
                                    }}
                                    className="text-xs flex items-center justify-between cursor-pointer py-1.5 px-2"
                                >
                                    <div className="flex items-center gap-2 truncate mr-2">
                                        <Check
                                            className={cn(
                                                "h-3.5 w-3.5 shrink-0",
                                                cat.name === selectedCategoryName ? "opacity-100 text-blue-600 font-bold" : "opacity-0"
                                            )}
                                        />
                                        <div className="truncate">
                                            <span className="font-medium text-slate-900">{cat.name}</span>
                                            {cat.description && (
                                                <span className="block text-[10px] text-slate-400 truncate">{cat.description}</span>
                                            )}
                                        </div>
                                    </div>
                                    {cat.requireVehicleKm && (
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-800 border-amber-300 shrink-0 font-medium">
                                            ⛽ Armada & KM
                                        </Badge>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <div className="p-1.5 border-t bg-slate-50">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setOpen(false)
                                onOpenQuickCreate()
                            }}
                            className="w-full justify-start text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 gap-1.5"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            + Tambah Kategori Baru
                        </Button>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
