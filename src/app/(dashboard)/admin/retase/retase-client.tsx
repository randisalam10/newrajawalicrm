"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { MoreHorizontal, Printer, Settings, CheckCircle2, Trash2, Edit, ChevronsUpDown, Check, AlertTriangle, Calculator, Calendar } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { confirmTransaction, upsertRetaseSetting, deleteConfirmedTransaction } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { RetaseLaporanClient } from "./retase-laporan-client"

export function RetaseClient({
    pendingTransactions,
    confirmedTransactions,
    settings,
    locations,
    userRole,
    customers,
    canConfirm = true,
    canDelete = true,
    canManageSettings = true,
}: {
    pendingTransactions: any[],
    confirmedTransactions: any[],
    settings: any[],
    locations: any[],
    userRole: string,
    customers: any[],
    canConfirm?: boolean,
    canDelete?: boolean,
    canManageSettings?: boolean,
}) {
    const isCorporate = userRole === "SuperAdminBP" || ["CEO", "FVP", "Approver"].includes(userRole)
    const { toast } = useToast()
    const [isConfirming, setIsConfirming] = useState<string | null>(null)
    const [distanceInput, setDistanceInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // SuperAdmin: Filter for Confirmed tab
    const [filterCabang, setFilterCabang] = useState("all")
    const [filterCustomer, setFilterCustomer] = useState("all")
    const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false)

    // Unique customer list derived from confirmedTransactions
    const uniqueCustomers = useMemo(() => {
        const map = new Map<string, string>()
        confirmedTransactions.forEach(t => map.set(
            t.project?.customerId || t.projectId,
            t.project?.customer?.customer_name || t.projectId
        ))
        return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
    }, [confirmedTransactions])

    // Filtered confirmed transactions
    const filteredConfirmed = useMemo(() => {
        return confirmedTransactions.filter(t => {
            if (filterCabang !== "all" && t.locationId !== filterCabang) return false
            if (filterCustomer !== "all" && t.project?.customerId !== filterCustomer) return false
            return true
        })
    }, [confirmedTransactions, filterCabang, filterCustomer])

    // Setting State
    const initialLoc = locations[0]?.id || ""
    const initialSetting = settings.find((s: any) => s.locationId === initialLoc)
    const [settingLocation, setSettingLocation] = useState(initialLoc)
    const [settingPrice, setSettingPrice] = useState(initialSetting?.price_per_cubic_km != null ? String(initialSetting.price_per_cubic_km) : "")
    const [settingCalcMode, setSettingCalcMode] = useState<"DISTANCE_ONLY" | "DISTANCE_AND_VOLUME">(initialSetting?.calculation_mode || "DISTANCE_ONLY")
    const [applyScope, setApplyScope] = useState<"FUTURE" | "BACKDATE">("FUTURE")
    const [effectiveDate, setEffectiveDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
    const [showBackdateAlert, setShowBackdateAlert] = useState(false)

    const handleConfirm = async () => {
        if (!isConfirming) return
        if (!distanceInput) return toast({ title: "Jarak wajib diisi", variant: "destructive" })

        setIsLoading(true)
        const res = await confirmTransaction(isConfirming, Number(distanceInput))
        setIsLoading(false)

        if (res.error) {
            toast({ title: "Gagal", description: res.error, variant: "destructive" })
        } else {
            toast({ title: "Berhasil", description: "Transaksi & Retase Dikonfirmasi" })
            setIsConfirming(null)
            setDistanceInput("")
        }
    }

    const handleOpenConfirm = (t: any) => {
        setIsConfirming(t.id)
        setDistanceInput(t.project?.default_distance?.toString() || "")
    }

    const executeSaveSetting = async () => {
        setIsLoading(true)
        const formData = new FormData()
        formData.append("locationId", settingLocation)
        formData.append("price_per_cubic_km", settingPrice)
        formData.append("calculation_mode", settingCalcMode)
        formData.append("apply_mode", applyScope)
        if (applyScope === "BACKDATE") {
            formData.append("effective_date", effectiveDate)
        }

        const res = await upsertRetaseSetting(formData)
        setIsLoading(false)
        setShowBackdateAlert(false)

        if (res.error) {
            toast({ title: "Gagal", description: res.error, variant: "destructive" })
        } else {
            toast({
                title: "Tersimpan",
                description: res.message || "Harga & Rumus Retase berhasil diperbarui."
            })
        }
    }

    const handleSaveSetting = (e: React.FormEvent) => {
        e.preventDefault()
        if (!settingPrice || Number(settingPrice) < 0) {
            return toast({ title: "Harga tidak valid", description: "Masukkan nilai harga dasar yang valid", variant: "destructive" })
        }

        if (applyScope === "BACKDATE") {
            if (!effectiveDate) {
                return toast({ title: "Tanggal Wajib Diisi", description: "Pilih tanggal mulai berlaku mundur", variant: "destructive" })
            }
            setShowBackdateAlert(true)
        } else {
            executeSaveSetting()
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        setIsLoading(true)
        const res = await deleteConfirmedTransaction(deleteId)
        setIsLoading(false)
        if (res.error) {
            toast({ title: "Gagal Menghapus", description: res.error, variant: "destructive" })
        } else {
            toast({ title: "Dihapus", description: "Transaksi berhasil dihapus ke Audit Log." })
            setDeleteId(null)
        }
    }

    // Prefill setting form when location changes if setting exists
    const onLocationChange = (val: string) => {
        setSettingLocation(val)
        const existing = settings.find((s: any) => s.locationId === val)
        if (existing) {
            setSettingPrice(existing.price_per_cubic_km != null ? existing.price_per_cubic_km.toString() : "")
            setSettingCalcMode(existing.calculation_mode || "DISTANCE_ONLY")
        } else {
            setSettingPrice("")
            setSettingCalcMode("DISTANCE_ONLY")
        }
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="pending">
                <TabsList className={`grid w-full ${canManageSettings ? "grid-cols-4 max-w-3xl" : "grid-cols-3 max-w-2xl"} mb-8`}>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Konfirmasi Retase ({pendingTransactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="confirmed" className="flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Surat Jalan & Selesai
                    </TabsTrigger>
                    <TabsTrigger value="laporan" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Laporan
                    </TabsTrigger>
                    {canManageSettings && (
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Pengaturan Harga Jarak
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaksi Menunggu Konfirmasi</CardTitle>
                            <CardDescription>
                                Masukkan riil jarak tempuh (KM) setelah mobil kembali untuk menghitung Retase otomatis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SimpleDataTable<any>
                                data={pendingTransactions}
                                searchKeys={["customer.customer_name", "customer.project_name", "driver.name"]}
                                searchPlaceholder="Cari customer atau sopir..."
                            >
                                {(items, sortConfig, toggleSort) => (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50">
                                                <TableHead>
                                                    <SortableHeader<any> label="Tanggal" sortKey="date" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="Customer / Proyek" sortKey="customer.customer_name" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="Rit (TM)" sortKey="trip_sequence" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="Mutu / Vol" sortKey="concreteQuality.name" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="Supir / No Pol" sortKey="driver.name" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                {isCorporate && (
                                                    <TableHead>
                                                        <SortableHeader<any> label="Cabang" sortKey="location.name" sortConfig={sortConfig} onSort={toggleSort} />
                                                    </TableHead>
                                                )}
                                                {canConfirm && <TableHead className="text-right">Aksi</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={(isCorporate ? 1 : 0) + (canConfirm ? 1 : 0) + 5} className="text-center text-slate-500 py-8">
                                                        Tidak ada transaksi pending.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {items.map(t => (
                                                <TableRow key={t.id}>
                                                    <TableCell className="text-xs">{format(new Date(t.date), "dd MMM yyyy HH:mm", { locale: id })}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-xs uppercase">{t.project?.customer?.customer_name ?? '-'}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase">{t.project?.name ?? '-'}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-bold bg-slate-50">TM-{t.trip_sequence}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-xs">{t.concreteQuality.name}</div>
                                                        <div className="text-[10px] text-slate-500">{t.volume_cubic} M³</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs font-medium">{t.driver.name}</div>
                                                        <div className="text-[10px] text-slate-500">{t.vehicle.plate_number}</div>
                                                    </TableCell>
                                                    {isCorporate && <TableCell className="text-xs">{t.location.name}</TableCell>}
                                                    {canConfirm && (
                                                        <TableCell className="text-right">
                                                            <Button size="sm" onClick={() => handleOpenConfirm(t)}>
                                                                Konfirmasi
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </SimpleDataTable>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="confirmed" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Riwayat Transaksi & Surat Jalan</CardTitle>
                            <CardDescription>
                                Cetak surat jalan dan pantau histori transaksi yang telah selesai. Segala modifikasi akan tercatat abadi di Audit Log.
                            </CardDescription>
                        </CardHeader>
                        {/* SuperAdmin & Corporate Filters */}
                        {isCorporate && (
                            <div className="flex flex-wrap gap-3 px-6 pt-4 pb-0">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Cabang:</label>
                                    <Select value={filterCabang} onValueChange={setFilterCabang}>
                                        <SelectTrigger className="h-8 text-xs w-44">
                                            <SelectValue placeholder="Semua Cabang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Cabang</SelectItem>
                                            {locations.map((loc: any) => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Customer:</label>
                                    <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="h-8 text-xs w-56 justify-between font-normal"
                                            >
                                                <span className="truncate">
                                                    {filterCustomer === "all"
                                                        ? "Semua Customer"
                                                        : uniqueCustomers.find(c => c.id === filterCustomer)?.name ?? "Semua Customer"
                                                    }
                                                </span>
                                                <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Cari customer..." className="h-8 text-xs" />
                                                <CommandList>
                                                    <CommandEmpty className="text-xs py-3 text-center text-slate-400">Customer tidak ditemukan</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="all"
                                                            onSelect={() => { setFilterCustomer("all"); setCustomerPopoverOpen(false) }}
                                                            className="text-xs"
                                                        >
                                                            <Check className={`mr-2 h-3 w-3 ${filterCustomer === "all" ? "opacity-100" : "opacity-0"}`} />
                                                            Semua Customer
                                                        </CommandItem>
                                                        {uniqueCustomers.map(c => (
                                                            <CommandItem
                                                                key={c.id}
                                                                value={c.name}
                                                                onSelect={() => { setFilterCustomer(c.id); setCustomerPopoverOpen(false) }}
                                                                className="text-xs"
                                                            >
                                                                <Check className={`mr-2 h-3 w-3 ${filterCustomer === c.id ? "opacity-100" : "opacity-0"}`} />
                                                                {c.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                {(filterCabang !== "all" || filterCustomer !== "all") && (
                                    <button
                                        onClick={() => { setFilterCabang("all"); setFilterCustomer("all") }}
                                        className="text-xs text-slate-400 hover:text-slate-700 underline"
                                    >
                                        Reset Filter
                                    </button>
                                )}
                            </div>
                        )}
                        <CardContent className="pt-4">
                            <SimpleDataTable<any>
                                data={filteredConfirmed}
                                searchKeys={["customer.customer_name", "customer.project_name", "driver.name", "id"]}
                                searchPlaceholder="Cari no. SJ, customer atau sopir..."
                            >
                                {(items, sortConfig, toggleSort) => (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50">
                                                <TableHead className="text-xs">
                                                    <SortableHeader<any> label="No. SJ" sortKey="id" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="Tanggal" sortKey="date" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="Customer / Proyek" sortKey="customer.customer_name" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="TM / Kumulatif" sortKey="trip_sequence" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="Mutu / Vol" sortKey="concreteQuality.name" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="Retase (Sopir)" sortKey="driver.name" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                {isCorporate && (
                                                    <TableHead>
                                                        <SortableHeader<any> label="Cabang" sortKey="location.name" sortConfig={sortConfig} onSort={toggleSort} />
                                                    </TableHead>
                                                )}
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={isCorporate ? 9 : 8} className="text-center text-slate-500 py-8">
                                                        Tidak ada histori.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {items.map(t => (
                                                <TableRow key={t.id}>
                                                    <TableCell className="text-[11px] font-mono">
                                                        <span className="font-semibold text-slate-700">{t.id.split('-')[0].toUpperCase()}</span>
                                                        <div className="text-[9px] text-slate-400">/SJ/{format(new Date(t.date), "MM/yy")}</div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">{format(new Date(t.date), "dd MMM HH:mm", { locale: id })}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-xs uppercase">{t.project?.customer?.customer_name ?? '-'}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium uppercase">{t.project?.name ?? '-'}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-bold bg-slate-50">TM-{t.trip_sequence}</Badge>
                                                        <div className="text-[10px] text-slate-500 mt-0.5">{t.cumulative_volume} m³ kum.</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-xs">{t.concreteQuality.name}</div>
                                                        <div className="text-[10px] text-slate-500">{t.volume_cubic} M³</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {t.retase ? (
                                                            <>
                                                                <div className="font-medium flex items-center gap-2 text-xs">
                                                                    {t.driver.name}
                                                                    <Badge variant="outline" className="text-[10px]">{t.retase.calculated_distance} KM</Badge>
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 uppercase">
                                                                    {t.vehicle.code} ({t.vehicle.plate_number})
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-400 italic text-xs">Retase Error</span>
                                                        )}
                                                    </TableCell>
                                                    {isCorporate && <TableCell className="text-xs">{t.location.name}</TableCell>}
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => window.open(`/print/produksi/${t.id}`, '_blank')}>
                                                                    <Printer className="mr-2 h-4 w-4" /> Cetak Surat Jalan
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem disabled>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit Transaksi
                                                                </DropdownMenuItem>
                                                                {canDelete && (
                                                                    <DropdownMenuItem onClick={() => setDeleteId(t.id)} className="text-red-600 focus:bg-red-50">
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Hapus Transaksi (Log)
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </SimpleDataTable>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TAB LAPORAN ──────────────────────────────── */}
                <TabsContent value="laporan">
                    <Card>
                        <CardContent className="p-0">
                            <RetaseLaporanClient
                                locations={locations}
                                customers={customers}
                                userRole={userRole}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {canManageSettings && (
                    <TabsContent value="settings">
                        <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-blue-600" />
                                Pengaturan Rumus & Tarif Retase Cabang
                            </CardTitle>
                            <CardDescription>
                                Atur rumus komisi sopir dan tarif dasar per kilometer untuk masing-masing cabang operasional.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveSetting} className="space-y-6">
                                {userRole === 'SuperAdminBP' && (
                                    <div className="space-y-2">
                                        <Label className="font-semibold text-slate-800">Pilih Cabang Operasional</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                                            value={settingLocation}
                                            onChange={(e) => onLocationChange(e.target.value)}
                                            required
                                        >
                                            {locations.map((loc: any) => (
                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* PILIHAN RUMUS PERHITUNGAN */}
                                <div className="space-y-3">
                                    <Label className="font-semibold text-slate-800">Metode & Rumus Perhitungan Komisi</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div
                                            onClick={() => setSettingCalcMode("DISTANCE_ONLY")}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                settingCalcMode === "DISTANCE_ONLY"
                                                    ? "border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600"
                                                    : "border-slate-200 hover:border-slate-300 bg-white"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 text-sm">Harga × Jarak (KM)</span>
                                                        <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">Default Baru</Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                        Komisi supir hanya dihitung berdasarkan kilometer jarak tempuh (Rp/KM). Volume kubikasi mixer tidak mempengaruhi komisi.
                                                    </p>
                                                </div>
                                                <input
                                                    type="radio"
                                                    checked={settingCalcMode === "DISTANCE_ONLY"}
                                                    onChange={() => setSettingCalcMode("DISTANCE_ONLY")}
                                                    className="mt-1 accent-blue-600"
                                                />
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setSettingCalcMode("DISTANCE_AND_VOLUME")}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                settingCalcMode === "DISTANCE_AND_VOLUME"
                                                    ? "border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600"
                                                    : "border-slate-200 hover:border-slate-300 bg-white"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 text-sm">Harga × Jarak × Kubikasi</span>
                                                        <Badge variant="outline" className="text-[10px] text-slate-600 px-1.5 py-0">Rumus Lama</Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                        Komisi supir dihitung proporsional terhadap jarak tempuh dan kubikasi volume beton yang diangkut (Rp/M³/KM).
                                                    </p>
                                                </div>
                                                <input
                                                    type="radio"
                                                    checked={settingCalcMode === "DISTANCE_AND_VOLUME"}
                                                    onChange={() => setSettingCalcMode("DISTANCE_AND_VOLUME")}
                                                    className="mt-1 accent-blue-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* INPUT HARGA DASAR */}
                                <div className="space-y-2">
                                    <Label className="font-semibold text-slate-800">
                                        {settingCalcMode === "DISTANCE_ONLY"
                                            ? "Harga Dasar Retase per KM (Rp/KM) *"
                                            : "Harga Dasar Retase per M³ per KM (Rp/M³/KM) *"}
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">Rp</span>
                                        <Input
                                            type="number"
                                            required
                                            min="0"
                                            step="any"
                                            value={settingPrice}
                                            onChange={(e) => setSettingPrice(e.target.value)}
                                            placeholder={settingCalcMode === "DISTANCE_ONLY" ? "Misal: 2500" : "Misal: 1500"}
                                            className="pl-10 text-base font-semibold"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Rumus aktif:{" "}
                                        <span className="font-semibold text-slate-700">
                                            {settingCalcMode === "DISTANCE_ONLY"
                                                ? "Jarak Tempuh (KM) × Harga ini"
                                                : "Jarak Tempuh (KM) × Kubikasi Beton (M³) × Harga ini"}
                                        </span>
                                    </p>
                                </div>

                                {/* SIMULASI LIVE */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        <Calculator className="w-4 h-4 text-blue-600" />
                                        Simulasi Live Perhitungan (Contoh: Jarak 10 KM, Muatan 7 M³)
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs text-slate-600">
                                            {settingCalcMode === "DISTANCE_ONLY"
                                                ? `10 KM × Rp ${(Number(settingPrice) || 0).toLocaleString("id-ID")}`
                                                : `10 KM × 7 M³ × Rp ${(Number(settingPrice) || 0).toLocaleString("id-ID")}`}
                                        </span>
                                        <div className="text-sm font-black text-blue-700">
                                            Rp{" "}
                                            {(
                                                settingCalcMode === "DISTANCE_ONLY"
                                                    ? 10 * (Number(settingPrice) || 0)
                                                    : 10 * 7 * (Number(settingPrice) || 0)
                                            ).toLocaleString("id-ID")}
                                        </div>
                                    </div>
                                </div>

                                {/* CAKUPAN KEBERLAKUAN (FUTURE vs BACKDATE) */}
                                <div className="space-y-3 pt-2 border-t">
                                    <Label className="font-semibold text-slate-800">Cakupan Keberlakuan Perubahan</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div
                                            onClick={() => setApplyScope("FUTURE")}
                                            className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                                                applyScope === "FUTURE"
                                                    ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600"
                                                    : "border-slate-200 hover:border-slate-300 bg-white"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                                        <span>Berlaku Mulai Sekarang</span>
                                                        <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">Default</Badge>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                                        Hanya berlaku untuk konfirmasi transaksi mendatang. Data pengiriman lama tidak berubah.
                                                    </p>
                                                </div>
                                                <input
                                                    type="radio"
                                                    checked={applyScope === "FUTURE"}
                                                    onChange={() => setApplyScope("FUTURE")}
                                                    className="mt-0.5 accent-emerald-600"
                                                />
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setApplyScope("BACKDATE")}
                                            className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                                                applyScope === "BACKDATE"
                                                    ? "border-amber-600 bg-amber-50/40 shadow-sm ring-1 ring-amber-600"
                                                    : "border-slate-200 hover:border-slate-300 bg-white"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                                        <span>Berlaku Mundur (Backdate)</span>
                                                        <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">Revisi Data</Badge>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                                        Menghitung ulang komisi seluruh pengiriman selesai yang ada sejak tanggal tertentu.
                                                    </p>
                                                </div>
                                                <input
                                                    type="radio"
                                                    checked={applyScope === "BACKDATE"}
                                                    onChange={() => setApplyScope("BACKDATE")}
                                                    className="mt-0.5 accent-amber-600"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {applyScope === "BACKDATE" && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 space-y-2 mt-2">
                                            <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                Pilih Tanggal Awal Berlaku Mundur
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                                <Input
                                                    type="date"
                                                    value={effectiveDate}
                                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                                    className="max-w-xs bg-white text-sm"
                                                    required
                                                />
                                                <span className="text-xs text-amber-800 leading-tight">
                                                    Seluruh data retase cabang ini sejak tanggal tersebut akan direvisi dan dicatat ke Audit Log.
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button disabled={isLoading} type="submit" className="w-full">
                                    {isLoading ? "Menyimpan..." : "Simpan Pengaturan"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    </TabsContent>
                )}
            </Tabs>

            {/* Dialog Alert Peringatan Konfirmasi Backdate */}
            <Dialog open={showBackdateAlert} onOpenChange={setShowBackdateAlert}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2 text-amber-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-slate-900">Konfirmasi Revisi Data Masa Lalu (Backdate)</DialogTitle>
                        <DialogDescription className="text-sm text-slate-600 leading-relaxed pt-2">
                            Anda memilih untuk menerapkan tarif <strong>Rp {Number(settingPrice).toLocaleString("id-ID")}</strong> ({settingCalcMode === "DISTANCE_ONLY" ? "Jarak Saja" : "Jarak & Kubikasi"}) secara <strong>berlaku mundur</strong> sejak{" "}
                            <span className="font-bold text-slate-900">
                                {effectiveDate ? format(new Date(effectiveDate), "dd MMMM yyyy", { locale: id }) : "-"}
                            </span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-xs text-amber-800 space-y-1.5 my-2">
                        <p className="font-semibold text-amber-900">Peringatan & Konsekuensi Tindakan:</p>
                        <ul className="list-disc list-inside space-y-1 text-amber-900">
                            <li>Seluruh surat jalan yang telah selesai di cabang ini sejak tanggal tersebut akan <strong>dihitung ulang nilai komisinya</strong>.</li>
                            <li>Perubahan ini akan langsung mempengaruhi laporan rekapitulasi retase supir.</li>
                            <li>Tindakan revisi ini akan <strong>tercatat secara permanen di Audit Log sistem</strong>.</li>
                        </ul>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowBackdateAlert(false)}>
                            Batal
                        </Button>
                        <Button
                            disabled={isLoading}
                            onClick={executeSaveSetting}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        >
                            {isLoading ? "Memproses Revisi..." : "Ya, Revisi & Simpan Pengaturan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Konfirmasi Dialog */}
            <Dialog open={!!isConfirming} onOpenChange={(o) => {
                if (!o) {
                    setIsConfirming(null)
                    setDistanceInput("")
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Retase Sopir</DialogTitle>
                        <DialogDescription>
                            Pastikan data riil jarak tempuh sudah benar untuk menghitung komisi Retase supir.
                        </DialogDescription>
                    </DialogHeader>

                    {(() => {
                        const t = pendingTransactions.find(tx => tx.id === isConfirming)
                        if (!t) return null
                        const locSetting = settings.find((s: any) => s.locationId === t.locationId)
                        const mode = locSetting?.calculation_mode || "DISTANCE_ONLY"
                        const unitPrice = locSetting?.price_per_cubic_km || 0
                        const dist = Number(distanceInput) || 0
                        const vol = t.volume_cubic || 0
                        const estimatedCommission = mode === "DISTANCE_ONLY"
                            ? dist * unitPrice
                            : dist * vol * unitPrice

                        return (
                            <div className="space-y-3 my-2">
                                <div className="bg-blue-50/50 p-4 rounded-lg text-sm space-y-2 border border-blue-100">
                                    <div className="grid grid-cols-3 gap-1">
                                        <span className="text-slate-500">Customer</span>
                                        <span className="col-span-2 font-medium">{t.project?.customer?.customer_name ?? '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <span className="text-slate-500">Proyek</span>
                                        <span className="col-span-2">{t.project?.name ?? '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <span className="text-slate-500">Lokasi Cor</span>
                                        <span className="col-span-2">{t.project?.address ?? '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <span className="text-slate-500">Volume Muatan</span>
                                        <span className="col-span-2 font-semibold">{t.volume_cubic} M³</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <span className="text-slate-500">Jarak Default Rute</span>
                                        <span className="col-span-2">{t.project?.default_distance ?? '-'} KM</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t">
                                        <span className="text-slate-500">Supir / Truk</span>
                                        <span className="col-span-2 font-medium">{t.driver.name} ({t.vehicle.plate_number})</span>
                                    </div>
                                </div>

                                {/* Preview Estimasi Komisi & Rumus Aktif */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Rumus Cabang:</span>
                                        <Badge variant="secondary" className="text-[11px] font-semibold">
                                            {mode === "DISTANCE_ONLY" ? "Jarak Saja (KM × Tarif)" : "Jarak & Kubikasi (KM × M³ × Tarif)"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Tarif Dasar Cabang:</span>
                                        <span className="font-semibold text-slate-800">
                                            Rp {unitPrice.toLocaleString("id-ID")} {mode === "DISTANCE_ONLY" ? "/ KM" : "/ M³ / KM"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t">
                                        <span className="font-bold text-slate-700">Estimasi Komisi Sopir:</span>
                                        <span className="font-black text-emerald-700 text-sm">
                                            Rp {estimatedCommission.toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })()}

                    <div className="py-2">
                        <Label>Jarak Pengiriman (KM) Aktual *</Label>
                        <Input
                            type="number"
                            step="0.1"
                            value={distanceInput}
                            onChange={(e) => setDistanceInput(e.target.value)}
                            placeholder="Contoh: 12.5"
                            className="mt-2 text-lg font-bold"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirming(null)}>Batal</Button>
                        <Button disabled={isLoading} onClick={handleConfirm}>{isLoading ? "Memproses..." : "Konfirmasi & Hitung"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Hapus Transaksi & Surat Jalan?</DialogTitle>
                        <DialogDescription>
                            Tindakan ini akan menghapus permanen transaksi dan riwayat retase sopir dari database.
                            <strong>Namun, log rekam jejak penghapusan (Audit Log) akan tetap tersimpan secara abadi di server sebagai bukti.</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
                        <Button disabled={isLoading} variant="destructive" onClick={handleDelete}>{isLoading ? "Menghapus..." : "Setuju Hapus"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
