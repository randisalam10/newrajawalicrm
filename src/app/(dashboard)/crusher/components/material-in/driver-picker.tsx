"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
    id?: string
    value: string
    options: { id: string; name: string }[]
    onChange: (name: string) => void
    onAddNew: (initialName: string) => void
}

/** Dropdown sopir berbasis Master Karyawan Crusher (bisa dicari, ramah mobile) */
export function DriverPicker({ id, value, options, onChange, onAddNew }: Props) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const handleAddNew = () => {
        setOpen(false)
        onAddNew(search.trim())
        setSearch("")
    }

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
                    <span className={cn("truncate", value ? "font-semibold text-slate-900" : "text-slate-400")}>
                        {value || "Pilih sopir"}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[240px]" align="start">
                <Command>
                    <CommandInput placeholder="Cari nama sopir..." value={search} onValueChange={setSearch} className="text-xs" />
                    <CommandList className="max-h-60">
                        <CommandEmpty className="py-3 px-3 text-xs text-slate-500 space-y-2">
                            <p>Sopir tidak ditemukan di master.</p>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt.id}
                                    value={opt.name.toLowerCase()}
                                    onSelect={() => {
                                        onChange(opt.name)
                                        setOpen(false)
                                        setSearch("")
                                    }}
                                    className="text-xs cursor-pointer py-1.5"
                                >
                                    <Check className={cn("h-4 w-4 mr-1.5", value === opt.name ? "opacity-100 text-emerald-600" : "opacity-0")} />
                                    <span>{opt.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <div className="border-t border-slate-100 p-1 space-y-0.5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleAddNew}
                            className="w-full h-7 justify-start gap-1 text-[11px] text-blue-700 font-semibold"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {search.trim() ? `Simpan "${search.trim()}" ke Master Sopir` : "+ Tambah Sopir Baru ke Master"}
                        </Button>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
