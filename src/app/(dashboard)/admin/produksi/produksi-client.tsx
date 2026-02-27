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

export function ProduksiClient({ masters, userRole, locations = [] }: { masters: any, userRole?: string, locations?: any[] }) {
    const { projects = [], vehicles = [], drivers = [], qualities = [], workItems = [] } = masters || {}
    const [loading, setLoading] = useState(false)

    // Master Cabang state (for SuperAdmin)
    const [openLocation, setOpenLocation] = useState(false)
    const [selectedLocationId, setSelectedLocationId] = useState<string>("")

    // Filter masters (guard against projects with missing customer relation)
    const validProjects = projects.filter((p: any) => p.customer != null)
    const activeProjects = userRole === 'SuperAdminBP' && selectedLocationId ? validProjects.filter((p: any) => p.customer?.locationId === selectedLocationId) : validProjects
    const activeVehicles = userRole === 'SuperAdminBP' && selectedLocationId ? vehicles.filter((v: any) => v.locationId === selectedLocationId) : vehicles
    const activeDrivers = userRole === 'SuperAdminBP' && selectedLocationId ? drivers.filter((d: any) => d.locationId === selectedLocationId) : drivers
    const activeQualities = userRole === 'SuperAdminBP' && selectedLocationId ? qualities.filter((q: any) => q.locationId === selectedLocationId) : qualities
    const activeWorkItems = userRole === 'SuperAdminBP' && selectedLocationId ? workItems.filter((w: any) => w.locationId === selectedLocationId) : workItems

    // Combobox states
    const [openCustomer, setOpenCustomer] = useState(false)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")

    const [openProject, setOpenProject] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")

    const [openVehicle, setOpenVehicle] = useState(false)
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")

    const [openDriver, setOpenDriver] = useState(false)
    const [selectedDriverId, setSelectedDriverId] = useState<string>("")

    const [openQuality, setOpenQuality] = useState(false)
    const [selectedQualityId, setSelectedQualityId] = useState<string>("")

    const [openWorkItem, setOpenWorkItem] = useState(false)
    const [selectedWorkItemId, setSelectedWorkItemId] = useState<string>("")

    // Derive unique customers from active projects
    const uniqueCustomers: any[] = []
    const seenIds = new Set<string>()
    for (const p of activeProjects) {
        if (!seenIds.has(p.customer.id)) {
            seenIds.add(p.customer.id)
            uniqueCustomers.push(p.customer)
        }
    }
    uniqueCustomers.sort((a, b) => a.customer_name.localeCompare(b.customer_name))

    // Projects filtered by selected customer
    const customerProjects = selectedCustomerId
        ? activeProjects.filter((p: any) => p.customer.id === selectedCustomerId)
        : []

    const selectedProject = customerProjects.find((p: any) => p.id === selectedProjectId)

    function handleSelectCustomer(custId: string) {
        const newId = custId === selectedCustomerId ? "" : custId
        setSelectedCustomerId(newId)
        setSelectedProjectId("") // reset project
        setOpenCustomer(false)
        if (newId) {
            const projs = activeProjects.filter((p: any) => p.customer.id === newId)
            if (projs.length === 1) {
                // Auto-select if only 1 project
                setSelectedProjectId(projs[0].id)
            }
        }
    }

    async function handleSubmit(formData: FormData) {
        if (userRole === 'SuperAdminBP' && !selectedLocationId) {
            alert("Harap pilih Cabang Operasional terlebih dahulu.")
            return
        }
        if (!selectedProjectId || !selectedVehicleId || !selectedDriverId || !selectedQualityId || !selectedWorkItemId) {
            alert("Harap lengkapi semua pilihan Master Data (Proyek, Truk, Sopir, Mutu, dan Item Pekerjaan).")
            return
        }

        // Add locationId manually to formData if superadmin
        if (userRole === 'SuperAdminBP' && selectedLocationId) {
            formData.append("locationId", selectedLocationId)
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
                    <input type="hidden" name="projectId" value={selectedProjectId} />
                    <input type="hidden" name="vehicleId" value={selectedVehicleId} />
                    <input type="hidden" name="driverId" value={selectedDriverId} />
                    <input type="hidden" name="qualityId" value={selectedQualityId} />
                    <input type="hidden" name="workItemId" value={selectedWorkItemId} />

                    {userRole === 'SuperAdminBP' && (
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
                                                    const l = locations.find((loc: any) => loc.id === selectedLocationId);
                                                    return l ? l.name : "-- Pilih Cabang --"
                                                })()
                                                : "-- Pilih Cabang --"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Cari cabang..." />
                                            <CommandList>
                                                <CommandEmpty>Cabang tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {locations.map((loc: any) => (
                                                        <CommandItem
                                                            key={loc.id}
                                                            value={loc.name}
                                                            onSelect={() => {
                                                                setSelectedLocationId(loc.id === selectedLocationId ? "" : loc.id)
                                                                setOpenLocation(false)
                                                                // Reset all dependent selections
                                                                setSelectedCustomerId("")
                                                                setSelectedProjectId("")
                                                                setSelectedVehicleId("")
                                                                setSelectedDriverId("")
                                                                setSelectedQualityId("")
                                                                setSelectedWorkItemId("")
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
                    )}

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
                                        >
                                            {selectedCustomerId
                                                ? (uniqueCustomers.find(c => c.id === selectedCustomerId)?.customer_name ?? "-- Pilih Customer --")
                                                : "-- Pilih Customer --"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Cari nama customer..." />
                                            <CommandList>
                                                <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {uniqueCustomers.map((c: any) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={c.customer_name}
                                                            onSelect={() => handleSelectCustomer(c.id)}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === c.id ? "opacity-100" : "opacity-0")} />
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
                                            disabled={!selectedCustomerId}
                                        >
                                            {selectedProjectId
                                                ? (customerProjects.find((p: any) => p.id === selectedProjectId)?.name ?? "-- Pilih Proyek --")
                                                : (selectedCustomerId ? (customerProjects.length === 1 ? customerProjects[0].name : "-- Pilih Proyek --") : "Pilih customer dulu")}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Cari nama proyek..." />
                                            <CommandList>
                                                <CommandEmpty>Proyek tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {customerProjects.map((p: any) => (
                                                        <CommandItem
                                                            key={p.id}
                                                            value={p.name}
                                                            onSelect={() => {
                                                                setSelectedProjectId(p.id === selectedProjectId ? "" : p.id)
                                                                setOpenProject(false)
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selectedProjectId === p.id ? "opacity-100" : "opacity-0")} />
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
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Jarak Pengiriman (KM)</Label>
                                <Input disabled value={selectedProject?.default_distance ? `${selectedProject.default_distance} KM` : "-"} className="bg-slate-100" />
                                <span className="text-xs text-slate-400">Jarak default master proyek. Bisa diubah saat Konfirmasi.</span>
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
                                                    const v = activeVehicles.find((v: any) => v.id === selectedVehicleId);
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
                                                    {activeVehicles.map((v: any) => (
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
                                                    const d = activeDrivers.find((d: any) => d.id === selectedDriverId);
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
                                                    {activeDrivers.map((d: any) => (
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
                                                    const q = activeQualities.find((q: any) => q.id === selectedQualityId);
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
                                                    {activeQualities.map((q: any) => (
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
                                                    const w = activeWorkItems.find((w: any) => w.id === selectedWorkItemId);
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
                                                    {activeWorkItems.map((w: any) => (
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
