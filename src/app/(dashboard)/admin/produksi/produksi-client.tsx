"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { createProduction } from "./actions"

export function ProduksiClient({ masters }: { masters: any }) {
    const { customers = [], vehicles = [], drivers = [], qualities = [], workItems = [] } = masters || {}
    const [loading, setLoading] = useState(false)

    // Combobox states
    const [openCustomer, setOpenCustomer] = useState(false)
    const [selectedCustId, setSelectedCustId] = useState<string>("")

    const [openVehicle, setOpenVehicle] = useState(false)
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")

    const [openDriver, setOpenDriver] = useState(false)
    const [selectedDriverId, setSelectedDriverId] = useState<string>("")

    const [openQuality, setOpenQuality] = useState(false)
    const [selectedQualityId, setSelectedQualityId] = useState<string>("")

    const [openWorkItem, setOpenWorkItem] = useState(false)
    const [selectedWorkItemId, setSelectedWorkItemId] = useState<string>("")

    const selectedCustomer = customers?.find((c: any) => c.id === selectedCustId)

    async function handleSubmit(formData: FormData) {
        if (!selectedCustId || !selectedVehicleId || !selectedDriverId || !selectedQualityId || !selectedWorkItemId) {
            alert("Harap lengkapi semua pilihan Master Data (Customer, Truk, Sopir, Mutu, dan Item Pekerjaan).")
            return
        }

        setLoading(true)
        const result = await createProduction(formData)
        setLoading(false)

        if (result?.success) {
            alert("Produksi berhasil diinput dan notifikasi Telegram terkirim!")
            window.location.reload()
        } else {
            alert("Error: " + JSON.stringify(result?.error || "Unknown error"))
        }
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Form Input Produksi</CardTitle>
                <CardDescription>Buat transaksi pengiriman beton precast baru.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    {/* Native hidden inputs for standard FormData submission */}
                    <input type="hidden" name="customerId" value={selectedCustId} />
                    <input type="hidden" name="vehicleId" value={selectedVehicleId} />
                    <input type="hidden" name="driverId" value={selectedDriverId} />
                    <input type="hidden" name="qualityId" value={selectedQualityId} />
                    <input type="hidden" name="workItemId" value={selectedWorkItemId} />

                    <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
                        <h3 className="font-semibold text-sm text-slate-500 uppercase">1. Informasi Customer</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <Label>Pilih Customer *</Label>
                                <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCustomer}
                                            className="w-full justify-between"
                                        >
                                            {selectedCustId
                                                ? (() => {
                                                    const c = customers.find((c: any) => c.id === selectedCustId);
                                                    return c ? `${c.customer_name} - ${c.project_name}` : "-- Pilih Customer --"
                                                })()
                                                : "-- Pilih Customer --"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Cari nama atau proyek customer..." />
                                            <CommandList>
                                                <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {customers.map((c: any) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={`${c.customer_name} ${c.project_name}`}
                                                            onSelect={() => {
                                                                setSelectedCustId(c.id === selectedCustId ? "" : c.id)
                                                                setOpenCustomer(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedCustId === c.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {c.customer_name} - {c.project_name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>Lokasi Proyek</Label>
                                <Input disabled value={selectedCustomer?.location || "-"} className="bg-slate-100" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
                        <h3 className="font-semibold text-sm text-slate-500 uppercase">2. Informasi Armada & Driver</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div className="space-y-2 flex flex-col">
                                <Label>Truk Mixer *</Label>
                                <Popover open={openVehicle} onOpenChange={setOpenVehicle}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openVehicle}
                                            className="w-full justify-between"
                                        >
                                            {selectedVehicleId
                                                ? (() => {
                                                    const v = vehicles.find((v: any) => v.id === selectedVehicleId);
                                                    return v ? `${v.code} (${v.plate_number})` : "-- Pilih Armada --"
                                                })()
                                                : "-- Pilih Armada --"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Cari armada..." />
                                            <CommandList>
                                                <CommandEmpty>Armada tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {vehicles.map((v: any) => (
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
                            </div>

                            <div className="space-y-2 flex flex-col">
                                <Label>Sopir *</Label>
                                <Popover open={openDriver} onOpenChange={setOpenDriver}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openDriver}
                                            className="w-full justify-between"
                                        >
                                            {selectedDriverId
                                                ? (() => {
                                                    const d = drivers.find((d: any) => d.id === selectedDriverId);
                                                    return d ? d.name : "-- Pilih Sopir --"
                                                })()
                                                : "-- Pilih Sopir --"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Cari sopir..." />
                                            <CommandList>
                                                <CommandEmpty>Sopir tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {drivers.map((d: any) => (
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

                        </div>
                    </div>

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
                                        >
                                            {selectedQualityId
                                                ? (() => {
                                                    const q = qualities.find((q: any) => q.id === selectedQualityId);
                                                    return q ? q.name : "-- Pilih Mutu --"
                                                })()
                                                : "-- Pilih Mutu --"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Cari mutu..." />
                                            <CommandList>
                                                <CommandEmpty>Mutu tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {qualities.map((q: any) => (
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
                                        >
                                            {selectedWorkItemId
                                                ? (() => {
                                                    const w = workItems.find((w: any) => w.id === selectedWorkItemId);
                                                    return w ? w.name : "-- Pilih Pekerjaan --"
                                                })()
                                                : "-- Pilih Pekerjaan --"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Cari pekerjaan..." />
                                            <CommandList>
                                                <CommandEmpty>Pekerjaan tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {workItems.map((w: any) => (
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
                                <Input id="volume_cubic" name="volume_cubic" type="number" step="0.1" placeholder="Ex: 7.5" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slump">Nilai Slump *</Label>
                                <Input id="slump" name="slump" placeholder="Ex: 10 ± 2" required />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-md" disabled={loading}>
                        {loading ? "Memproses..." : "Simpan & Kirim Notifikasi"}
                    </Button>

                </form>
            </CardContent>
        </Card>
    )
}
