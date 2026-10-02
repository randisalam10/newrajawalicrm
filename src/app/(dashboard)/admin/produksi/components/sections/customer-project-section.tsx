"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProduksiCustomer, ProduksiProject } from "../../types"

interface CustomerProjectSectionProps {
    canCreate: boolean
    uniqueCustomers: ProduksiCustomer[]
    customerProjects: ProduksiProject[]
    selectedProject: ProduksiProject | undefined
    openCustomer: boolean
    setOpenCustomer: (open: boolean) => void
    selectedCustomerId: string
    onSelectCustomer: (id: string) => void
    openProject: boolean
    setOpenProject: (open: boolean) => void
    selectedProjectId: string
    setSelectedProjectId: (id: string) => void
}

export const CustomerProjectSection: React.FC<CustomerProjectSectionProps> = ({
    canCreate,
    uniqueCustomers,
    customerProjects,
    selectedProject,
    openCustomer,
    setOpenCustomer,
    selectedCustomerId,
    onSelectCustomer,
    openProject,
    setOpenProject,
    selectedProjectId,
    setSelectedProjectId,
}) => {
    return (
        <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
            <h3 className="font-semibold text-sm text-slate-500 uppercase">1. Informasi Proyek / Customer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Step 1 — Pilih Customer */}
                <div className="space-y-2 flex flex-col">
                    <Label>Pilih Customer *</Label>
                    <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCustomer}
                                className="w-full justify-between"
                                disabled={!canCreate}
                            >
                                {selectedCustomerId
                                    ? (uniqueCustomers.find((c) => c.id === selectedCustomerId)?.customer_name ?? "-- Pilih Customer --")
                                    : "-- Pilih Customer --"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari nama customer..." />
                                <CommandList>
                                    <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {uniqueCustomers.map((c) => (
                                            <CommandItem
                                                key={c.id}
                                                value={c.customer_name}
                                                onSelect={() => onSelectCustomer(c.id)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedCustomerId === c.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {c.customer_name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Step 2 — Pilih Proyek (filtered by customer) */}
                <div className="space-y-2 flex flex-col">
                    <Label>Pilih Proyek *</Label>
                    <Popover open={openProject} onOpenChange={setOpenProject}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openProject}
                                className="w-full justify-between"
                                disabled={!canCreate || !selectedCustomerId}
                            >
                                {selectedProjectId
                                    ? (customerProjects.find((p) => p.id === selectedProjectId)?.name ?? "-- Pilih Proyek --")
                                    : (selectedCustomerId
                                        ? (customerProjects.length === 1 ? customerProjects[0].name : "-- Pilih Proyek --")
                                        : "Pilih customer dulu")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari nama proyek..." />
                                <CommandList>
                                    <CommandEmpty>Proyek tidak ditemukan.</CommandEmpty>
                                    <CommandGroup>
                                        {customerProjects.map((p) => (
                                            <CommandItem
                                                key={p.id}
                                                value={p.name}
                                                onSelect={() => {
                                                    setSelectedProjectId(p.id === selectedProjectId ? "" : p.id)
                                                    setOpenProject(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedProjectId === p.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {p.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {selectedCustomerId && customerProjects.length === 1 && (
                        <p className="text-xs text-green-600">✓ Proyek otomatis dipilih (hanya 1 proyek)</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Lokasi Proyek</Label>
                    <Input disabled value={selectedProject?.address || "-"} className="bg-slate-100" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="date">Tanggal & Waktu Produksi *</Label>
                    <Input
                        id="date"
                        name="date"
                        type="datetime-local"
                        defaultValue={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                        required
                        disabled={!canCreate}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Jarak Pengiriman (KM)</Label>
                    <Input
                        disabled
                        value={selectedProject?.default_distance ? `${selectedProject.default_distance} KM` : "-"}
                        className="bg-slate-100"
                    />
                    <span className="text-xs text-slate-400">Jarak default master proyek. Bisa diubah saat Konfirmasi.</span>
                </div>
            </div>
        </div>
    )
}
