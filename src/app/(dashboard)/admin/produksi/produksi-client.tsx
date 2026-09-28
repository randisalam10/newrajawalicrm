"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Check, ChevronsUpDown, ShieldAlert, Lock } from "lucide-react"
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"

import { createProduction } from "./actions"
import { upsertMasterIncentive } from "../master-insentif/actions"

const fmtNum = (n: number) => new Intl.NumberFormat("id-ID").format(Math.round(n || 0))

export function ProduksiClient({
    masters,
    userRole,
    locations = [],
    canCreate = true
}: {
    masters: any
    userRole?: string
    locations?: any[]
    canCreate?: boolean
}) {
    const { projects = [], vehicles = [], drivers = [], qualities = [], workItems = [], operators = [], incentiveRates = [], retaseSettings = [] } = masters || {}
    const [localIncentives, setLocalIncentives] = useState<any[]>(incentiveRates)
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
    const activeOperators = userRole === 'SuperAdminBP' && selectedLocationId ? operators.filter((o: any) => o.locationId === selectedLocationId) : operators

    // Combobox states
    const [openCustomer, setOpenCustomer] = useState(false)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")

    const [openProject, setOpenProject] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")

    const [openVehicle, setOpenVehicle] = useState(false)
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")

    const [openDriver, setOpenDriver] = useState(false)
    const [selectedDriverId, setSelectedDriverId] = useState<string>("")

    const [openOperator, setOpenOperator] = useState(false)
    const [selectedOperatorId, setSelectedOperatorId] = useState<string>("")

    const [openQuality, setOpenQuality] = useState(false)
    const [selectedQualityId, setSelectedQualityId] = useState<string>("")

    const [openWorkItem, setOpenWorkItem] = useState(false)
    const [selectedWorkItemId, setSelectedWorkItemId] = useState<string>("")

    const canManageRate = userRole === "SuperAdminBP" || userRole === "AdminBP"
    const activeLocId = userRole === 'SuperAdminBP' && selectedLocationId ? selectedLocationId : null

    // Live active rate lookup with fallback to actual branch RetaseSetting
    const activeLocRetase = useMemo(() => {
        if (!activeLocId) return retaseSettings[0] || null
        return retaseSettings.find((s: any) => s.locationId === activeLocId) || retaseSettings[0] || null
    }, [retaseSettings, activeLocId])

    const activeOpRateItem = useMemo(() => {
        return (localIncentives || []).find((r: any) =>
            r.kategori_peran === "OPERATOR_BP" &&
            r.isActive &&
            (activeLocId ? r.locationId === activeLocId || !r.locationId : true)
        )
    }, [localIncentives, activeLocId])

    const activeMixerRateItem = useMemo(() => {
        return (localIncentives || []).find((r: any) =>
            r.kategori_peran === "SOPIR_MIXER" &&
            r.isActive &&
            (activeLocId ? r.locationId === activeLocId || !r.locationId : true)
        )
    }, [localIncentives, activeLocId])

    const activeOpRate = useMemo(() => {
        if (activeOpRateItem) return Number(activeOpRateItem.tarif_utama) || 0
        if (activeLocRetase && Number(activeLocRetase.operator_rate_per_cubic) > 0) return Number(activeLocRetase.operator_rate_per_cubic)
        return 1500
    }, [activeOpRateItem, activeLocRetase])

    const activeMixerRate = useMemo(() => {
        if (activeMixerRateItem) return Number(activeMixerRateItem.tarif_utama) || 0
        if (activeLocRetase && Number(activeLocRetase.price_per_cubic_km) > 0) return Number(activeLocRetase.price_per_cubic_km)
        return 10000
    }, [activeMixerRateItem, activeLocRetase])

    // --- 1. SHORTCUT KHUSUS OPERATOR BP ---
    const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false)
    const [operatorForm, setOperatorForm] = useState({
        id: "",
        nama_insentif: "Insentif Operator Batching Plant (Per Kubik)",
        tarif_utama: "1500",
        effective_date: new Date().toISOString().slice(0, 10),
        keterangan: "",
    })
    const [isSavingOperator, setIsSavingOperator] = useState(false)

    const handleOpenOperatorShortcut = () => {
        setOperatorForm({
            id: activeOpRateItem?.id || "",
            nama_insentif: activeOpRateItem?.nama_insentif || "Insentif Operator Batching Plant (Per Kubik)",
            tarif_utama: String(activeOpRate),
            effective_date: new Date().toISOString().slice(0, 10),
            keterangan: activeOpRateItem?.keterangan || "",
        })
        setIsOperatorModalOpen(true)
    }

    const handleSaveOperatorRate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canManageRate) return

        setIsSavingOperator(true)
        const res = await upsertMasterIncentive({
            id: operatorForm.id || undefined,
            nama_insentif: operatorForm.nama_insentif,
            kategori_peran: "OPERATOR_BP",
            formula_type: "PER_M3",
            tarif_utama: Number(operatorForm.tarif_utama) || 0,
            tarif_sekunder: 0,
            locationId: activeLocId || null,
            effective_date: operatorForm.effective_date,
            keterangan: operatorForm.keterangan,
            isActive: true,
        })
        setIsSavingOperator(false)

        if (res.error) {
            alert(res.error)
        } else {
            alert("Tarif Operator BP berhasil disimpan dan berlaku mulai " + operatorForm.effective_date + ". (Tarif sopir mixer tetap aman & tidak berubah)")
            if (res.data) {
                setLocalIncentives(prev => [res.data, ...(prev || []).filter(r => r.id !== res.data.id)])
            }
            setIsOperatorModalOpen(false)
        }
    }

    // --- 2. SHORTCUT KHUSUS SOPIR TRUK MIXER ---
    const [isMixerModalOpen, setIsMixerModalOpen] = useState(false)
    const [mixerForm, setMixerForm] = useState({
        id: "",
        nama_insentif: "Retase Sopir Truk Mixer (Jarak Tempuh)",
        tarif_utama: "10000",
        effective_date: new Date().toISOString().slice(0, 10),
        keterangan: "",
    })
    const [isSavingMixer, setIsSavingMixer] = useState(false)

    const handleOpenMixerShortcut = () => {
        setMixerForm({
            id: activeMixerRateItem?.id || "",
            nama_insentif: activeMixerRateItem?.nama_insentif || "Retase Sopir Truk Mixer (Jarak Tempuh)",
            tarif_utama: String(activeMixerRate),
            effective_date: new Date().toISOString().slice(0, 10),
            keterangan: activeMixerRateItem?.keterangan || "",
        })
        setIsMixerModalOpen(true)
    }

    const handleSaveMixerRate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canManageRate) return

        setIsSavingMixer(true)
        const res = await upsertMasterIncentive({
            id: mixerForm.id || undefined,
            nama_insentif: mixerForm.nama_insentif,
            kategori_peran: "SOPIR_MIXER",
            formula_type: "PER_KM",
            tarif_utama: Number(mixerForm.tarif_utama) || 0,
            tarif_sekunder: 0,
            locationId: activeLocId || null,
            effective_date: mixerForm.effective_date,
            keterangan: mixerForm.keterangan,
            isActive: true,
        })
        setIsSavingMixer(false)

        if (res.error) {
            alert(res.error)
        } else {
            alert("Tarif Retase Sopir Mixer berhasil disimpan dan berlaku mulai " + mixerForm.effective_date + ". (Tarif operator BP tetap aman & tidak berubah)")
            if (res.data) {
                setLocalIncentives(prev => [res.data, ...(prev || []).filter(r => r.id !== res.data.id)])
            }
            setIsMixerModalOpen(false)
        }
    }

    // Auto-select operator jika di cabang BP hanya ada 1 operator aktif
    useEffect(() => {
        if (activeOperators.length === 1) {
            setSelectedOperatorId(activeOperators[0].id)
        } else if (activeOperators.length === 0) {
            setSelectedOperatorId("")
        }
    }, [activeOperators, selectedLocationId])

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
        if (!canCreate) {
            alert("Akses Ditolak: Akun Anda (" + userRole + ") hanya memiliki izin pemantauan (Hanya Lihat).")
            return
        }

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

        // Add operatorId if selected
        if (selectedOperatorId) {
            formData.append("operatorId", selectedOperatorId)
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
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{canCreate ? "Form Input Produksi" : "Form Data Produksi (Terkunci)"}</CardTitle>
                        <CardDescription>
                            {canCreate
                                ? "Buat transaksi pengiriman beton precast baru."
                                : "Mode tampilan hanya lihat untuk monitoring. Form penginputan dinonaktifkan untuk role " + (userRole || "Pemantau") + "."}
                        </CardDescription>
                    </div>
                    {!canCreate && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold border border-amber-200">
                            <Lock className="w-3.5 h-3.5" />
                            Read-Only
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {!canCreate && (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/90 text-amber-900 text-sm mb-6">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold text-amber-950">Akses Terkunci: Mode Pemantauan (Hanya Lihat)</p>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Akun Anda terdaftar sebagai <strong>{userRole}</strong> yang hanya memiliki hak akses pemantauan (VIEW). Form input dan tombol simpan dinonaktifkan agar tidak terjadi kesalahan penginputan transaksi tiket pengiriman.
                            </p>
                        </div>
                    </div>
                )}
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
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                                            disabled={!canCreate}
                                        >
                                            {selectedCustomerId
                                                ? (uniqueCustomers.find(c => c.id === selectedCustomerId)?.customer_name ?? "-- Pilih Customer --")
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
                                            disabled={!canCreate || !selectedCustomerId}
                                        >
                                            {selectedProjectId
                                                ? (customerProjects.find((p: any) => p.id === selectedProjectId)?.name ?? "-- Pilih Proyek --")
                                                : (selectedCustomerId ? (customerProjects.length === 1 ? customerProjects[0].name : "-- Pilih Proyek --") : "Pilih customer dulu")}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                                    disabled={!canCreate}
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
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-slate-500 uppercase">2. Informasi Armada, Driver & Operator</h3>
                            {activeOperators.length === 1 && (
                                <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ✓ Operator Otomatis (1 di BP ini)
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <div className="space-y-2 flex flex-col">
                                <div className="flex items-center justify-between">
                                    <Label>Truk Mixer *</Label>
                                    <button
                                        type="button"
                                        onClick={handleOpenMixerShortcut}
                                        className="text-[11px] text-slate-500 hover:text-slate-800 underline font-normal cursor-pointer"
                                    >
                                        Atur Tarif Mixer
                                    </button>
                                </div>
                                <Popover open={openVehicle} onOpenChange={setOpenVehicle}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openVehicle}
                                            className="w-full justify-between"
                                            disabled={!canCreate}
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
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                    <span>Tarif: Rp {fmtNum(activeMixerRateItem?.tarif_utama || 10000)} / km</span>
                                    <a href="/admin/kendaraan" target="_blank" className="hover:text-slate-600 underline">
                                        + Armada Baru
                                    </a>
                                </div>
                            </div>

                            <div className="space-y-2 flex flex-col">
                                <div className="flex items-center justify-between">
                                    <Label>Sopir *</Label>
                                    <a
                                        href="/admin/karyawan"
                                        target="_blank"
                                        className="text-[11px] text-slate-400 hover:text-slate-700 underline font-normal"
                                    >
                                        + Sopir Baru
                                    </a>
                                </div>
                                <Popover open={openDriver} onOpenChange={setOpenDriver}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openDriver}
                                            className="w-full justify-between"
                                            disabled={!canCreate}
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
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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

                            <div className="space-y-2 flex flex-col">
                                <div className="flex items-center justify-between">
                                    <Label>Operator BP</Label>
                                    <button
                                        type="button"
                                        onClick={handleOpenOperatorShortcut}
                                        className="text-[11px] text-slate-500 hover:text-slate-800 underline font-normal cursor-pointer"
                                    >
                                        Atur Tarif
                                    </button>
                                </div>
                                <Popover open={openOperator} onOpenChange={setOpenOperator}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openOperator}
                                            className="w-full justify-between"
                                            disabled={!canCreate}
                                        >
                                            {selectedOperatorId
                                                ? (() => {
                                                    const o = activeOperators.find((o: any) => o.id === selectedOperatorId);
                                                    return o ? o.name : "-- Pilih Operator BP --"
                                                })()
                                                : (activeOperators.length === 0 ? "Belum ada operator BP" : "-- Pilih Operator BP --")}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari operator..." />
                                            <CommandList>
                                                <CommandEmpty>Operator tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {activeOperators.map((o: any) => (
                                                        <CommandItem
                                                            key={o.id}
                                                            value={o.name}
                                                            onSelect={() => {
                                                                setSelectedOperatorId(o.id === selectedOperatorId ? "" : o.id)
                                                                setOpenOperator(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedOperatorId === o.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {o.name} {o.location?.name ? `(${o.location.name})` : ''}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                    <span>Tarif: Rp {fmtNum(activeOpRateItem?.tarif_utama || 1500)} / m³</span>
                                    <a href="/admin/karyawan" target="_blank" className="hover:text-slate-600 underline">
                                        + Operator Baru
                                    </a>
                                </div>
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
                                            disabled={!canCreate}
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
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                                            disabled={!canCreate}
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
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                                <Input id="volume_cubic" name="volume_cubic" type="number" step="0.1" placeholder="Ex: 7.5" required disabled={!canCreate} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slump">Nilai Slump *</Label>
                                <Input id="slump" name="slump" placeholder="Ex: 10 ± 2" required disabled={!canCreate} />
                            </div>
                        </div>
                    </div>

                    {canCreate ? (
                        <Button type="submit" className="w-full h-12 text-md" disabled={loading}>
                            {loading ? "Memproses..." : "Simpan & Kirim Notifikasi"}
                        </Button>
                    ) : (
                        <div className="p-3.5 bg-slate-100 rounded-xl text-center text-slate-500 text-sm font-medium border border-dashed border-slate-300 flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4 text-slate-400" />
                            <span>Tombol Simpan Dinonaktifkan (Role <strong>{userRole}</strong> Tidak Memiliki Izin Input Produksi)</span>
                        </div>
                    )}

                </form>
            </CardContent>

            {/* Shortcut Modal 1: Khusus Pengaturan Tarif Operator BP */}
            <Dialog open={isOperatorModalOpen} onOpenChange={setIsOperatorModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-slate-900">
                            Pengaturan Tarif Operator BP
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Khusus tarif produksi operator batching plant (per m³). Tanggal mulai berlaku ini hanya berlaku untuk operator BP dan tidak mempengaruhi sopir mixer.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveOperatorRate} className="space-y-3.5 py-1">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">
                                Tarif Operator BP (Rp / m³)
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                disabled={!canManageRate}
                                value={operatorForm.tarif_utama}
                                onChange={e => setOperatorForm(f => ({ ...f, tarif_utama: e.target.value }))}
                                className="h-8 text-xs font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Mulai Berlaku Tanggal</Label>
                            <Input
                                type="date"
                                disabled={!canManageRate}
                                value={operatorForm.effective_date}
                                onChange={e => setOperatorForm(f => ({ ...f, effective_date: e.target.value }))}
                                className="h-8 text-xs"
                                required
                            />
                            <span className="text-[11px] text-slate-400">
                                Transaksi BP sebelum tanggal ini tetap aman menggunakan tarif terdahulu.
                            </span>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Catatan (Opsional)</Label>
                            <Input
                                disabled={!canManageRate}
                                placeholder="Misal: Penyesuaian tarif shift BP..."
                                value={operatorForm.keterangan}
                                onChange={e => setOperatorForm(f => ({ ...f, keterangan: e.target.value }))}
                                className="h-8 text-xs"
                            />
                        </div>

                        {!canManageRate && (
                            <div className="rounded bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-500">
                                Mode lihat saja. Hanya SuperAdmin atau Admin Cabang yang dapat mengubah tarif.
                            </div>
                        )}

                        {/* Akses Cepat Master Data Terkait */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-xs text-slate-500">
                            <div className="font-medium text-slate-600">Akses Master Terkait:</div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
                                <a href="/admin/master-insentif" target="_blank" className="hover:text-slate-900 underline">
                                    Master Insentif Lengkap ↗
                                </a>
                                <a href="/admin/karyawan" target="_blank" className="hover:text-slate-900 underline">
                                    Master Karyawan (Operator) ↗
                                </a>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsOperatorModalOpen(false)}
                                className="h-8 text-xs"
                            >
                                Tutup
                            </Button>
                            {canManageRate && (
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSavingOperator}
                                    className="h-8 text-xs cursor-pointer font-medium"
                                >
                                    {isSavingOperator ? "Menyimpan..." : "Simpan Tarif Operator"}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Shortcut Modal 2: Khusus Pengaturan Tarif Retase Sopir Mixer */}
            <Dialog open={isMixerModalOpen} onOpenChange={setIsMixerModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-slate-900">
                            Pengaturan Tarif Retase Sopir Mixer
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Khusus tarif retase jarak tempuh sopir truk mixer (per KM). Tanggal mulai berlaku ini hanya berlaku untuk sopir dan tidak mempengaruhi operator BP.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveMixerRate} className="space-y-3.5 py-1">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">
                                Tarif Retase Mixer (Rp / KM)
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                disabled={!canManageRate}
                                value={mixerForm.tarif_utama}
                                onChange={e => setMixerForm(f => ({ ...f, tarif_utama: e.target.value }))}
                                className="h-8 text-xs font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Mulai Berlaku Tanggal</Label>
                            <Input
                                type="date"
                                disabled={!canManageRate}
                                value={mixerForm.effective_date}
                                onChange={e => setMixerForm(f => ({ ...f, effective_date: e.target.value }))}
                                className="h-8 text-xs"
                                required
                            />
                            <span className="text-[11px] text-slate-400">
                                Transaksi pengiriman mixer sebelum tanggal ini tetap aman menggunakan tarif terdahulu.
                            </span>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Catatan (Opsional)</Label>
                            <Input
                                disabled={!canManageRate}
                                placeholder="Misal: Penyesuaian rute jarak..."
                                value={mixerForm.keterangan}
                                onChange={e => setMixerForm(f => ({ ...f, keterangan: e.target.value }))}
                                className="h-8 text-xs"
                            />
                        </div>

                        {!canManageRate && (
                            <div className="rounded bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-500">
                                Mode lihat saja. Hanya SuperAdmin atau Admin Cabang yang dapat mengubah tarif.
                            </div>
                        )}

                        {/* Akses Cepat Master Data Terkait */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-xs text-slate-500">
                            <div className="font-medium text-slate-600">Akses Master Terkait:</div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
                                <a href="/admin/master-insentif" target="_blank" className="hover:text-slate-900 underline">
                                    Master Insentif Lengkap ↗
                                </a>
                                <a href="/admin/kendaraan" target="_blank" className="hover:text-slate-900 underline">
                                    Master Armada (Mixer) ↗
                                </a>
                                <a href="/admin/karyawan" target="_blank" className="hover:text-slate-900 underline">
                                    Master Karyawan (Sopir) ↗
                                </a>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsMixerModalOpen(false)}
                                className="h-8 text-xs"
                            >
                                Tutup
                            </Button>
                            {canManageRate && (
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSavingMixer}
                                    className="h-8 text-xs cursor-pointer font-medium"
                                >
                                    {isSavingMixer ? "Menyimpan..." : "Simpan Tarif Mixer"}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
