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
import { MoreHorizontal, Printer, Settings, CheckCircle2, Trash2, Edit, ChevronsUpDown, Check, AlertTriangle, Calculator, Calendar, Truck, Download, Mountain } from "lucide-react"
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
import { 
    confirmTransaction, 
    upsertRetaseSetting, 
    saveMixerRetaseSetting,
    saveOperatorBPRateSetting,
    deleteConfirmedTransaction,
    upsertAggregateRetaseSetting,
    toggleAggregateRetasePaid
} from "./actions"
import { useToast } from "@/hooks/use-toast"
import { RetaseLaporanClient } from "./retase-laporan-client"

export function RetaseClient({
    pendingTransactions,
    confirmedTransactions,
    settings,
    masterIncentives = [],
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
    masterIncentives?: any[],
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

    // Helper untuk mencari tarif peran tertentu berdasarkan cabang atau fallback global
    const resolveRate = (locId: string, role: string, fallback: number) => {
        const branchRate = (masterIncentives || []).find((r: any) => r.kategori_peran === role && r.locationId === locId && r.isActive)
        if (branchRate && Number(branchRate.tarif_utama) > 0) return Number(branchRate.tarif_utama)
        const globalRate = (masterIncentives || []).find((r: any) => r.kategori_peran === role && !r.locationId && r.isActive)
        if (globalRate && Number(globalRate.tarif_utama) > 0) return Number(globalRate.tarif_utama)
        return fallback
    }

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

    // Setting State Mixer & Operator BP
    const initialLoc = locations[0]?.id || ""
    const initialSetting = settings.find((s: any) => s.locationId === initialLoc)
    const [settingLocation, setSettingLocation] = useState(initialLoc)

    const initialMixerPrice = initialSetting?.price_per_cubic_km != null && Number(initialSetting.price_per_cubic_km) > 0
        ? String(initialSetting.price_per_cubic_km)
        : String(resolveRate(initialLoc, "SOPIR_MIXER", 10000))

    const initialOpRate = initialSetting?.operator_rate_per_cubic != null && Number(initialSetting.operator_rate_per_cubic) > 0
        ? String(initialSetting.operator_rate_per_cubic)
        : String(resolveRate(initialLoc, "OPERATOR_BP", 1500))

    // 1. Mixer Retase State
    const [mixerPrice, setMixerPrice] = useState(initialMixerPrice)
    const [mixerCalcMode, setMixerCalcMode] = useState<"DISTANCE_ONLY" | "DISTANCE_AND_VOLUME">(initialSetting?.calculation_mode || "DISTANCE_ONLY")
    const [mixerApplyScope, setMixerApplyScope] = useState<"FUTURE" | "BACKDATE">("FUTURE")
    const [mixerEffectiveDate, setMixerEffectiveDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
    const [isSavingMixer, setIsSavingMixer] = useState(false)
    const [showMixerBackdateAlert, setShowMixerBackdateAlert] = useState(false)

    // 2. Operator BP State
    const [operatorRate, setOperatorRate] = useState(initialOpRate)
    const [operatorApplyScope, setOperatorApplyScope] = useState<"FUTURE" | "BACKDATE">("FUTURE")
    const [operatorEffectiveDate, setOperatorEffectiveDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
    const [isSavingOperator, setIsSavingOperator] = useState(false)
    const [showOperatorBackdateAlert, setShowOperatorBackdateAlert] = useState(false)

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

    // --- MIXER HANDLERS (TERISOLASI 100%) ---
    const executeSaveMixer = async () => {
        setIsSavingMixer(true)
        const formData = new FormData()
        formData.append("locationId", settingLocation)
        formData.append("price_per_cubic_km", mixerPrice)
        formData.append("calculation_mode", mixerCalcMode)
        formData.append("apply_mode", mixerApplyScope)
        if (mixerApplyScope === "BACKDATE") {
            formData.append("effective_date", mixerEffectiveDate)
        }

        const res = await saveMixerRetaseSetting(formData)
        setIsSavingMixer(false)
        setShowMixerBackdateAlert(false)

        if (res.error) {
            toast({ title: "Gagal Menyimpan Tarif Mixer", description: res.error, variant: "destructive" })
        } else {
            toast({
                title: "Tarif Sopir Mixer Tersimpan",
                description: res.message || "Harga & Rumus Retase Sopir Mixer berhasil diperbarui."
            })
        }
    }

    const handleSaveMixer = (e: React.FormEvent) => {
        e.preventDefault()
        if (!mixerPrice || Number(mixerPrice) < 0) {
            return toast({ title: "Harga tidak valid", description: "Masukkan nilai harga dasar yang valid", variant: "destructive" })
        }

        if (mixerApplyScope === "BACKDATE") {
            if (!mixerEffectiveDate) {
                return toast({ title: "Tanggal Wajib Diisi", description: "Pilih tanggal mulai berlaku mundur untuk Sopir Mixer", variant: "destructive" })
            }
            setShowMixerBackdateAlert(true)
        } else {
            executeSaveMixer()
        }
    }

    // --- OPERATOR BP HANDLERS (TERISOLASI 100%) ---
    const executeSaveOperator = async () => {
        setIsSavingOperator(true)
        const formData = new FormData()
        formData.append("locationId", settingLocation)
        formData.append("operator_rate_per_cubic", operatorRate || "0")
        formData.append("apply_mode", operatorApplyScope)
        if (operatorApplyScope === "BACKDATE") {
            formData.append("effective_date", operatorEffectiveDate)
        }

        const res = await saveOperatorBPRateSetting(formData)
        setIsSavingOperator(false)
        setShowOperatorBackdateAlert(false)

        if (res.error) {
            toast({ title: "Gagal Menyimpan Insentif Operator", description: res.error, variant: "destructive" })
        } else {
            toast({
                title: "Insentif Operator BP Tersimpan",
                description: res.message || "Tarif insentif Operator BP berhasil diperbarui."
            })
        }
    }

    const handleSaveOperator = (e: React.FormEvent) => {
        e.preventDefault()
        if (!operatorRate || Number(operatorRate) < 0) {
            return toast({ title: "Tarif tidak valid", description: "Masukkan nilai tarif operator BP yang valid", variant: "destructive" })
        }

        if (operatorApplyScope === "BACKDATE") {
            if (!operatorEffectiveDate) {
                return toast({ title: "Tanggal Wajib Diisi", description: "Pilih tanggal mulai berlaku mundur untuk Operator BP", variant: "destructive" })
            }
            setShowOperatorBackdateAlert(true)
        } else {
            executeSaveOperator()
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

    // Prefill setting form when location changes if setting exists, with fallback to Master Data
    const onLocationChange = (val: string) => {
        setSettingLocation(val)
        const existing = settings.find((s: any) => s.locationId === val)
        const mixerRate = resolveRate(val, "SOPIR_MIXER", 10000)
        const opRate = resolveRate(val, "OPERATOR_BP", 1500)

        if (existing && Number(existing.price_per_cubic_km) > 0) {
            setMixerPrice(existing.price_per_cubic_km.toString())
            setMixerCalcMode(existing.calculation_mode || "DISTANCE_ONLY")
        } else {
            setMixerPrice(String(mixerRate))
            setMixerCalcMode("DISTANCE_ONLY")
        }

        if (existing && Number(existing.operator_rate_per_cubic) > 0) {
            setOperatorRate(existing.operator_rate_per_cubic.toString())
        } else {
            setOperatorRate(String(opRate))
        }
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="pending">
                <TabsList className={`grid w-full ${canManageSettings ? "grid-cols-4 max-w-3xl" : "grid-cols-3 max-w-2xl"} mb-6`}>
                    <TabsTrigger value="pending" className="flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Retase Mixer ({pendingTransactions.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="confirmed" className="flex items-center gap-1.5 text-xs">
                        <Printer className="w-3.5 h-3.5" />
                        <span>Surat Jalan Mixer</span>
                    </TabsTrigger>
                    <TabsTrigger value="laporan" className="flex items-center gap-1.5 text-xs">
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Laporan Mixer</span>
                    </TabsTrigger>
                    {canManageSettings && (
                        <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs">
                            <Settings className="w-3.5 h-3.5" />
                            <span>Pengaturan Tarif</span>
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
                    <TabsContent value="settings" className="space-y-4">
                        {/* Banner Akses Data Master Insentif Terpusat */}
                        <div className="max-w-2xl bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-blue-600" />
                                    <span className="font-semibold text-sm text-slate-900">Pusat Data Master Insentif & Tarif Operasional</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Pengaturan seluruh peran operasional (Operator BP, Operator Concrete Pump, Operator Excavator, Sopir Mixer, dan Dump Truck) kini tersedia lengkap di Data Master.
                                </p>
                            </div>
                            <a
                                href="/admin/master-insentif"
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors shrink-0"
                            >
                                Buka Data Master ↗
                            </a>
                        </div>

                        {/* Ringkasan Tarif Aktif Cabang Terpilih */}
                        <div className="max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Operator BP</span>
                                <span className="text-sm font-bold text-slate-800">
                                    Rp {resolveRate(settingLocation, "OPERATOR_BP", 1500).toLocaleString("id-ID")}
                                </span>
                                <span className="text-[10px] text-slate-400 block">/ m³ beton</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Operator CP</span>
                                <span className="text-sm font-bold text-slate-800">
                                    Rp {resolveRate(settingLocation, "OPERATOR_CP", 150000).toLocaleString("id-ID")}
                                </span>
                                <span className="text-[10px] text-slate-400 block">/ trip cor</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Operator Exca</span>
                                <span className="text-sm font-bold text-slate-800">
                                    Rp {resolveRate(settingLocation, "OPERATOR_ALAT_BERAT", 35000).toLocaleString("id-ID")}
                                </span>
                                <span className="text-[10px] text-slate-400 block">/ jam HM</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Sopir DT</span>
                                <span className="text-sm font-bold text-slate-800">
                                    Rp {resolveRate(settingLocation, "SOPIR_DT", 45000).toLocaleString("id-ID")}
                                </span>
                                <span className="text-[10px] text-slate-400 block">agregat</span>
                            </div>
                        </div>

                        {/* Selector Cabang untuk SuperAdmin */}
                        {userRole === 'SuperAdminBP' && (
                            <Card className="border-slate-200 bg-white">
                                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <Label className="font-bold text-slate-800 text-sm">Pilih Cabang Operasional</Label>
                                        <p className="text-xs text-slate-500">Pilih cabang yang ingin diatur tarif komisi Sopir Mixer dan insentif Operator BP-nya</p>
                                    </div>
                                    <select
                                        className="flex h-10 w-full sm:w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                                        value={settingLocation}
                                        onChange={(e) => onLocationChange(e.target.value)}
                                        required
                                    >
                                        {locations.map((loc: any) => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </CardContent>
                            </Card>
                        )}

                        {/* Dua Kartu Pengaturan Terpisah 100%: Sopir Mixer & Operator BP */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                            {/* KARTU 1: PENGATURAN KOMISI SOPIR TRUK MIXER */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="bg-slate-50/50 border-b pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base text-slate-900">
                                                    1. Komisi Sopir Truk Mixer
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    Pengaturan khusus komisi pengiriman armada Mixer
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge className="bg-blue-600 text-white text-[11px]">Sopir Mixer</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-5">
                                    <form onSubmit={handleSaveMixer} className="space-y-5">
                                        {/* PILIHAN RUMUS PERHITUNGAN MIXER */}
                                        <div className="space-y-2.5">
                                            <Label className="font-semibold text-slate-800 text-xs">Metode & Rumus Perhitungan</Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                <div
                                                    onClick={() => setMixerCalcMode("DISTANCE_ONLY")}
                                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                        mixerCalcMode === "DISTANCE_ONLY"
                                                            ? "border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600"
                                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-slate-900 text-xs">Harga × Jarak (KM)</span>
                                                                <Badge className="bg-blue-600 text-white text-[9px] px-1 py-0">Default</Badge>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 leading-tight">
                                                                Dihitung per kilometer jarak tempuh. Volume tidak mempengaruhi.
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="radio"
                                                            checked={mixerCalcMode === "DISTANCE_ONLY"}
                                                            onChange={() => setMixerCalcMode("DISTANCE_ONLY")}
                                                            className="mt-0.5 accent-blue-600"
                                                        />
                                                    </div>
                                                </div>

                                                <div
                                                    onClick={() => setMixerCalcMode("DISTANCE_AND_VOLUME")}
                                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                        mixerCalcMode === "DISTANCE_AND_VOLUME"
                                                            ? "border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600"
                                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-slate-900 text-xs">Harga × Jarak × M³</span>
                                                                <Badge variant="outline" className="text-[9px] text-slate-600 px-1 py-0">Rumus Lama</Badge>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 leading-tight">
                                                                Dihitung proporsional jarak tempuh dan kubikasi (Rp/M³/KM).
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="radio"
                                                            checked={mixerCalcMode === "DISTANCE_AND_VOLUME"}
                                                            onChange={() => setMixerCalcMode("DISTANCE_AND_VOLUME")}
                                                            className="mt-0.5 accent-blue-600"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* INPUT HARGA DASAR MIXER */}
                                        <div className="space-y-1.5">
                                            <Label className="font-semibold text-slate-800 text-xs">
                                                {mixerCalcMode === "DISTANCE_ONLY"
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
                                                    value={mixerPrice}
                                                    onChange={(e) => setMixerPrice(e.target.value)}
                                                    placeholder={mixerCalcMode === "DISTANCE_ONLY" ? "Misal: 10000" : "Misal: 1500"}
                                                    className="pl-10 text-base font-semibold"
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-500">
                                                Rumus aktif:{" "}
                                                <span className="font-semibold text-slate-700">
                                                    {mixerCalcMode === "DISTANCE_ONLY"
                                                        ? "Jarak Tempuh (KM) × Rp " + (Number(mixerPrice) || 0).toLocaleString("id-ID")
                                                        : "Jarak (KM) × M³ × Rp " + (Number(mixerPrice) || 0).toLocaleString("id-ID")}
                                                </span>
                                            </p>
                                        </div>

                                        {/* SIMULASI LIVE MIXER */}
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                                                Simulasi Live (Contoh: Jarak 10 KM, Muatan 7 M³)
                                            </div>
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-xs text-slate-600">
                                                    {mixerCalcMode === "DISTANCE_ONLY"
                                                        ? `10 KM × Rp ${(Number(mixerPrice) || 0).toLocaleString("id-ID")}`
                                                        : `10 KM × 7 M³ × Rp ${(Number(mixerPrice) || 0).toLocaleString("id-ID")}`}
                                                </span>
                                                <div className="text-sm font-black text-blue-700">
                                                    Rp{" "}
                                                    {(
                                                        mixerCalcMode === "DISTANCE_ONLY"
                                                            ? 10 * (Number(mixerPrice) || 0)
                                                            : 10 * 7 * (Number(mixerPrice) || 0)
                                                    ).toLocaleString("id-ID")}
                                                </div>
                                            </div>
                                        </div>

                                        {/* CAKUPAN KEBERLAKUAN MIXER */}
                                        <div className="space-y-2.5 pt-2 border-t">
                                            <Label className="font-semibold text-slate-800 text-xs">Cakupan Keberlakuan Tarif Mixer</Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                <div
                                                    onClick={() => setMixerApplyScope("FUTURE")}
                                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                        mixerApplyScope === "FUTURE"
                                                            ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600"
                                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                                                                <span>Mulai Sekarang</span>
                                                                <Badge variant="outline" className="text-[9px] text-emerald-700 border-emerald-300">Default</Badge>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                                                Hanya transaksi mendatang.
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="radio"
                                                            checked={mixerApplyScope === "FUTURE"}
                                                            onChange={() => setMixerApplyScope("FUTURE")}
                                                            className="mt-0.5 accent-emerald-600"
                                                        />
                                                    </div>
                                                </div>

                                                <div
                                                    onClick={() => setMixerApplyScope("BACKDATE")}
                                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                        mixerApplyScope === "BACKDATE"
                                                            ? "border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600"
                                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                                                                <span>Tanggal Tertentu</span>
                                                                <Badge variant="outline" className="text-[9px] text-blue-700 border-blue-300">Backdate</Badge>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                                                Berlaku dari tanggal pilihan.
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="radio"
                                                            checked={mixerApplyScope === "BACKDATE"}
                                                            onChange={() => setMixerApplyScope("BACKDATE")}
                                                            className="mt-0.5 accent-blue-600"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {mixerApplyScope === "BACKDATE" && (
                                                <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 space-y-1.5 mt-2">
                                                    <div className="flex items-center gap-1.5 text-blue-900 text-xs font-semibold">
                                                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                                        Pilih Tanggal Mulai Berlaku Tarif Mixer
                                                    </div>
                                                    <Input
                                                        type="date"
                                                        value={mixerEffectiveDate}
                                                        onChange={(e) => setMixerEffectiveDate(e.target.value)}
                                                        className="bg-white text-sm"
                                                        required
                                                    />
                                                    <span className="text-[11px] text-blue-800 leading-tight block">
                                                        Tarif Mixer baru berlaku untuk transaksi pada tanggal tersebut ke depan.
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                                            ℹ️ <strong>Isolasi Aman:</strong> Menyimpan form ini <strong>hanya mengubah tarif Sopir Mixer</strong> dan tidak menyentuh tarif Operator BP.
                                        </div>

                                        <Button disabled={isSavingMixer} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                            {isSavingMixer ? "Menyimpan Tarif Mixer..." : "Simpan Tarif Sopir Mixer"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* KARTU 2: PENGATURAN INSENTIF OPERATOR BP */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="bg-slate-50/50 border-b pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                                                <Calculator className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base text-slate-900">
                                                    2. Insentif Operator BP
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    Pengaturan insentif produksi Operator Batching Plant
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-600 text-white text-[11px]">Operator BP</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-5">
                                    <form onSubmit={handleSaveOperator} className="space-y-5">
                                        {/* INFO METODE OPERATOR BP */}
                                        <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 space-y-1">
                                            <span className="text-xs font-semibold text-emerald-950 block">
                                                Metode Perhitungan Volume (M³)
                                            </span>
                                            <p className="text-[11px] text-emerald-800 leading-relaxed">
                                                Insentif Operator BP dihitung murni berdasarkan total volume kubikasi beton yang diproduksi (Rp/M³).
                                            </p>
                                        </div>

                                        {/* INPUT TARIF INSENTIF OPERATOR BP */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="font-semibold text-slate-800 text-xs">
                                                    Tarif Insentif Operator BP per M³ (Rp/M³) *
                                                </Label>
                                                <span className="text-[10px] text-slate-400">
                                                    (Peran lain diatur di Data Master)
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">Rp</span>
                                                <Input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="any"
                                                    value={operatorRate}
                                                    onChange={(e) => setOperatorRate(e.target.value)}
                                                    placeholder="Misal: 1500"
                                                    className="pl-10 text-base font-semibold"
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-500">
                                                Rumus aktif:{" "}
                                                <span className="font-semibold text-slate-700">
                                                    Total Kubikasi Produksi (M³) × Rp {(Number(operatorRate) || 0).toLocaleString("id-ID")}
                                                </span>
                                            </p>
                                        </div>

                                        {/* SIMULASI LIVE OPERATOR BP */}
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                                                Simulasi Live (Contoh: Produksi 100 M³ Beton)
                                            </div>
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-xs text-slate-600">
                                                    100 M³ × Rp {(Number(operatorRate) || 0).toLocaleString("id-ID")}
                                                </span>
                                                <div className="text-sm font-black text-emerald-700">
                                                    Rp {(100 * (Number(operatorRate) || 0)).toLocaleString("id-ID")}
                                                </div>
                                            </div>
                                        </div>

                                        {/* CAKUPAN KEBERLAKUAN OPERATOR BP */}
                                        <div className="space-y-2.5 pt-2 border-t">
                                            <Label className="font-semibold text-slate-800 text-xs">Cakupan Keberlakuan Insentif Operator</Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                <div
                                                    onClick={() => setOperatorApplyScope("FUTURE")}
                                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                        operatorApplyScope === "FUTURE"
                                                            ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600"
                                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                                                                <span>Mulai Sekarang</span>
                                                                <Badge variant="outline" className="text-[9px] text-emerald-700 border-emerald-300">Default</Badge>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                                                Hanya produksi mendatang.
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="radio"
                                                            checked={operatorApplyScope === "FUTURE"}
                                                            onChange={() => setOperatorApplyScope("FUTURE")}
                                                            className="mt-0.5 accent-emerald-600"
                                                        />
                                                    </div>
                                                </div>

                                                <div
                                                    onClick={() => setOperatorApplyScope("BACKDATE")}
                                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                        operatorApplyScope === "BACKDATE"
                                                            ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600"
                                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                                                                <span>Tanggal Tertentu</span>
                                                                <Badge variant="outline" className="text-[9px] text-emerald-700 border-emerald-300">Backdate</Badge>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                                                Berlaku dari tanggal pilihan.
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="radio"
                                                            checked={operatorApplyScope === "BACKDATE"}
                                                            onChange={() => setOperatorApplyScope("BACKDATE")}
                                                            className="mt-0.5 accent-emerald-600"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {operatorApplyScope === "BACKDATE" && (
                                                <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 space-y-1.5 mt-2">
                                                    <div className="flex items-center gap-1.5 text-emerald-900 text-xs font-semibold">
                                                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                                        Pilih Tanggal Mulai Berlaku Insentif Operator
                                                    </div>
                                                    <Input
                                                        type="date"
                                                        value={operatorEffectiveDate}
                                                        onChange={(e) => setOperatorEffectiveDate(e.target.value)}
                                                        className="bg-white text-sm"
                                                        required
                                                    />
                                                    <span className="text-[11px] text-emerald-800 leading-tight block">
                                                        Tarif Operator baru berlaku untuk produksi pada tanggal tersebut ke depan.
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                                            ℹ️ <strong>Isolasi Aman:</strong> Menyimpan form ini <strong>hanya mengubah tarif Operator BP</strong> dan tidak menyentuh tarif atau transaksi Sopir Mixer.
                                        </div>

                                        <Button disabled={isSavingOperator} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                            {isSavingOperator ? "Menyimpan Insentif Operator..." : "Simpan Insentif Operator BP"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            {/* Dialog Alert Konfirmasi Backdate Sopir Mixer */}
            <Dialog open={showMixerBackdateAlert} onOpenChange={setShowMixerBackdateAlert}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 text-blue-600">
                            <Truck className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-slate-900">Konfirmasi Tanggal Berlaku Tarif Mixer</DialogTitle>
                        <DialogDescription className="text-sm text-slate-600 leading-relaxed pt-2">
                            Tarif Sopir Mixer <strong>Rp {Number(mixerPrice).toLocaleString("id-ID")}</strong> ({mixerCalcMode === "DISTANCE_ONLY" ? "Jarak Saja" : "Jarak & Kubikasi"}) akan mulai berlaku untuk pengiriman per tanggal{" "}
                            <span className="font-bold text-slate-900">
                                {mixerEffectiveDate ? format(new Date(mixerEffectiveDate), "dd MMMM yyyy", { locale: id }) : "-"}
                            </span> ke depan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-700 space-y-1.5 my-2">
                        <p className="font-semibold text-slate-900">Isolasi Keberlakuan Sistem:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                            <li>Transaksi Mixer pada atau setelah tanggal tersebut akan menggunakan tarif baru ini.</li>
                            <li>Transaksi Mixer sebelum tanggal tersebut tetap aman dan menggunakan tarif lama.</li>
                            <li><strong>Tarif Operator BP tidak akan tersentuh sama sekali.</strong></li>
                            <li>Tersinkronisasi otomatis ke Data Master Insentif (Peran Sopir Mixer).</li>
                        </ul>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowMixerBackdateAlert(false)}>
                            Batal
                        </Button>
                        <Button
                            disabled={isSavingMixer}
                            onClick={executeSaveMixer}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                            {isSavingMixer ? "Menyimpan..." : "Simpan & Terapkan Mixer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Alert Konfirmasi Backdate Operator BP */}
            <Dialog open={showOperatorBackdateAlert} onOpenChange={setShowOperatorBackdateAlert}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2 text-emerald-600">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-slate-900">Konfirmasi Tanggal Berlaku Insentif Operator BP</DialogTitle>
                        <DialogDescription className="text-sm text-slate-600 leading-relaxed pt-2">
                            Insentif Operator BP <strong>Rp {Number(operatorRate).toLocaleString("id-ID")}/M³</strong> akan mulai berlaku untuk produksi per tanggal{" "}
                            <span className="font-bold text-slate-900">
                                {operatorEffectiveDate ? format(new Date(operatorEffectiveDate), "dd MMMM yyyy", { locale: id }) : "-"}
                            </span> ke depan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-700 space-y-1.5 my-2">
                        <p className="font-semibold text-slate-900">Isolasi Keberlakuan Sistem:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                            <li>Produksi pada atau setelah tanggal tersebut akan menggunakan tarif insentif baru ini.</li>
                            <li>Produksi sebelum tanggal tersebut tetap menggunakan tarif insentif lama.</li>
                            <li><strong>Tarif dan transaksi Sopir Mixer tidak akan tersentuh sama sekali.</strong></li>
                            <li>Tersinkronisasi otomatis ke Data Master Insentif (Peran Operator BP).</li>
                        </ul>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowOperatorBackdateAlert(false)}>
                            Batal
                        </Button>
                        <Button
                            disabled={isSavingOperator}
                            onClick={executeSaveOperator}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                            {isSavingOperator ? "Menyimpan..." : "Simpan & Terapkan Operator"}
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
