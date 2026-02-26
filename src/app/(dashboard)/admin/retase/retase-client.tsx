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
import { MoreHorizontal, Printer, Settings, CheckCircle2, Trash2, Edit, ChevronsUpDown, Check } from "lucide-react"
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

export function RetaseClient({
    pendingTransactions,
    confirmedTransactions,
    settings,
    locations,
    userRole
}: {
    pendingTransactions: any[],
    confirmedTransactions: any[],
    settings: any[],
    locations: any[],
    userRole: string
}) {
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
        confirmedTransactions.forEach(t => map.set(t.customerId, t.customer?.customer_name || t.customerId))
        return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
    }, [confirmedTransactions])

    // Filtered confirmed transactions
    const filteredConfirmed = useMemo(() => {
        return confirmedTransactions.filter(t => {
            if (filterCabang !== "all" && t.locationId !== filterCabang) return false
            if (filterCustomer !== "all" && t.customerId !== filterCustomer) return false
            return true
        })
    }, [confirmedTransactions, filterCabang, filterCustomer])

    // Setting State
    const [settingLocation, setSettingLocation] = useState(locations[0]?.id || "")
    const [settingPrice, setSettingPrice] = useState("")

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
        setDistanceInput(t.customer?.default_distance?.toString() || "")
    }

    const handleSaveSetting = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData()
        formData.append("locationId", settingLocation)
        formData.append("price_per_cubic_km", settingPrice)
        const res = await upsertRetaseSetting(formData)
        setIsLoading(false)

        if (res.error) {
            toast({ title: "Gagal", description: res.error, variant: "destructive" })
        } else {
            toast({ title: "Tersimpan", description: "Harga Retase Cabang berhasil diupdate" })
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
        const existing = settings.find(s => s.locationId === val)
        if (existing) setSettingPrice(existing.price_per_cubic_km.toString())
        else setSettingPrice("")
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-8">
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Konfirmasi Retase ({pendingTransactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="confirmed" className="flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Surat Jalan & Selesai
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Pengaturan Harga Jarak
                    </TabsTrigger>
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
                                                {userRole === 'SuperAdminBP' && (
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
                                                    <TableCell colSpan={userRole === 'SuperAdminBP' ? 7 : 6} className="text-center text-slate-500 py-8">
                                                        Tidak ada transaksi pending.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {items.map(t => (
                                                <TableRow key={t.id}>
                                                    <TableCell className="text-xs">{format(new Date(t.date), "dd MMM yyyy HH:mm", { locale: id })}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-xs uppercase">{t.customer.customer_name}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase">{t.customer.project_name}</div>
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
                                                    {userRole === 'SuperAdminBP' && <TableCell className="text-xs">{t.location.name}</TableCell>}
                                                    <TableCell className="text-right">
                                                        <Button size="sm" onClick={() => handleOpenConfirm(t)}>
                                                            Konfirmasi
                                                        </Button>
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

                <TabsContent value="confirmed" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Riwayat Transaksi & Surat Jalan</CardTitle>
                            <CardDescription>
                                Cetak surat jalan dan pantau histori transaksi yang telah selesai. Segala modifikasi akan tercatat abadi di Audit Log.
                            </CardDescription>
                        </CardHeader>
                        {/* SuperAdmin Filters */}
                        {userRole === 'SuperAdminBP' && (
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
                                                {userRole === 'SuperAdminBP' && (
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
                                                    <TableCell colSpan={userRole === 'SuperAdminBP' ? 9 : 8} className="text-center text-slate-500 py-8">
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
                                                        <div className="font-medium text-xs uppercase">{t.customer.customer_name}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium uppercase">{t.customer.project_name}</div>
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
                                                    {userRole === 'SuperAdminBP' && <TableCell className="text-xs">{t.location.name}</TableCell>}
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
                                                                <DropdownMenuItem onClick={() => setDeleteId(t.id)} className="text-red-600 focus:bg-red-50">
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Transaksi (Log)
                                                                </DropdownMenuItem>
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

                <TabsContent value="settings">
                    <Card className="max-w-xl">
                        <CardHeader>
                            <CardTitle>Pengaturan Harga Retase per Cabang</CardTitle>
                            <CardDescription>Atur nilai rupiah per Kubik per Kilometer (Rp/M³/KM) untuk setiap cabang.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveSetting} className="space-y-4">
                                {userRole === 'SuperAdminBP' && (
                                    <div className="space-y-2">
                                        <Label>Pilih Cabang</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

                                <div className="space-y-2">
                                    <Label>Harga Dasar Retase (Rp)</Label>
                                    <Input
                                        type="number"
                                        required
                                        min="0"
                                        value={settingPrice}
                                        onChange={(e) => setSettingPrice(e.target.value)}
                                        placeholder="Misal: 1500"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Rumus: Jarak (KM) x Kubikasi x Harga ini
                                    </p>
                                </div>

                                <Button disabled={isLoading} type="submit" className="w-full">
                                    {isLoading ? "Menyimpan..." : "Simpan Pengaturan"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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
                            Pastikan data pelanggan dan riil jarak tempuh sudah benar untuk menghitung komisi Retase.
                        </DialogDescription>
                    </DialogHeader>

                    {(() => {
                        const t = pendingTransactions.find(tx => tx.id === isConfirming)
                        if (!t) return null
                        return (
                            <div className="bg-blue-50/50 p-4 rounded-lg my-2 text-sm space-y-2 border border-blue-100">
                                <div className="grid grid-cols-3 gap-1">
                                    <span className="text-slate-500">Customer</span>
                                    <span className="col-span-2 font-medium">{t.customer.customer_name}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    <span className="text-slate-500">Proyek</span>
                                    <span className="col-span-2">{t.customer.project_name}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    <span className="text-slate-500">Lokasi/Alamat</span>
                                    <span className="col-span-2">{t.customer.address}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    <span className="text-slate-500">Rute Master</span>
                                    <span className="col-span-2">{t.customer.default_distance} KM</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t">
                                    <span className="text-slate-500">Supir / Truk</span>
                                    <span className="col-span-2 font-medium">{t.driver.name} ({t.vehicle.plate_number})</span>
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
