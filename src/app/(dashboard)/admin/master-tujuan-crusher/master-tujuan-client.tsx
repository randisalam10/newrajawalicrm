"use client"

import { useState, useTransition, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CrusherDestinationItem } from "@/app/(dashboard)/crusher/types"
import {
    getCrusherDestinations,
    saveCrusherDestination,
    deleteCrusherDestination,
} from "@/app/(dashboard)/crusher/actions"
import { toast } from "sonner"
import {
    MapPin,
    Plus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    CheckCircle2,
    XCircle,
    Truck,
} from "lucide-react"

type Props = {
    initialDestinations: CrusherDestinationItem[]
    locations: Array<{ id: string; name: string }>
}

function formatNum(num: number, decimals = 1): string {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(num || 0)
}

export function MasterTujuanClient({ initialDestinations, locations }: Props) {
    const [destinations, setDestinations] = useState<CrusherDestinationItem[]>(initialDestinations)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterLocation, setFilterLocation] = useState("all")

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<CrusherDestinationItem | null>(null)
    const [name, setName] = useState("")
    const [distanceKm, setDistanceKm] = useState("")
    const [address, setAddress] = useState("")
    const [contactPerson, setContactPerson] = useState("")
    const [phone, setPhone] = useState("")
    const [notes, setNotes] = useState("")
    const [selectedLocationId, setSelectedLocationId] = useState("all")

    const [isPending, startTransition] = useTransition()

    const refreshData = () => {
        startTransition(async () => {
            try {
                const updated = await getCrusherDestinations(
                    filterLocation === "all" ? undefined : filterLocation
                )
                setDestinations(updated)
            } catch (err: any) {
                toast.error(err.message || "Gagal memuat data tujuan")
            }
        })
    }

    const filteredDestinations = useMemo(() => {
        return destinations.filter((d) => {
            const matchesQuery =
                d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (d.address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (d.contact_person || "").toLowerCase().includes(searchQuery.toLowerCase())
            const matchesLoc =
                filterLocation === "all" ||
                !d.locationId ||
                d.locationId === filterLocation
            return matchesQuery && matchesLoc
        })
    }, [destinations, searchQuery, filterLocation])

    const handleOpenCreate = () => {
        setEditingItem(null)
        setName("")
        setDistanceKm("")
        setAddress("")
        setContactPerson("")
        setPhone("")
        setNotes("")
        setSelectedLocationId("all")
        setIsModalOpen(true)
    }

    const handleOpenEdit = (item: CrusherDestinationItem) => {
        setEditingItem(item)
        setName(item.name)
        setDistanceKm(String(item.distance_km))
        setAddress(item.address || "")
        setContactPerson(item.contact_person || "")
        setPhone(item.phone || "")
        setNotes(item.notes || "")
        setSelectedLocationId(item.locationId || "all")
        setIsModalOpen(true)
    }

    const handleSave = () => {
        if (!name.trim()) {
            toast.error("Nama tujuan / proyek / pembeli wajib diisi")
            return
        }
        const parsedDistance = parseFloat(distanceKm.replace(",", "."))
        if (isNaN(parsedDistance) || parsedDistance < 0) {
            toast.error("Estimasi jarak tempuh (KM) harus berupa angka valid (>= 0)")
            return
        }

        startTransition(async () => {
            try {
                const res = await saveCrusherDestination({
                    id: editingItem?.id,
                    name: name.trim(),
                    distance_km: parsedDistance,
                    address: address.trim() || undefined,
                    contact_person: contactPerson.trim() || undefined,
                    phone: phone.trim() || undefined,
                    notes: notes.trim() || undefined,
                    locationId: selectedLocationId === "all" ? undefined : selectedLocationId,
                })

                if (!res?.success) {
                    toast.error("Gagal menyimpan data tujuan")
                    return
                }

                toast.success(
                    editingItem
                        ? `Tujuan "${name}" berhasil diperbarui`
                        : `Tujuan "${name}" berhasil ditambahkan`
                )
                setIsModalOpen(false)
                refreshData()
            } catch (err: any) {
                toast.error(err.message || "Gagal menyimpan data tujuan")
            }
        })
    }

    const handleDelete = (id: string, destName: string) => {
        if (!confirm(`Hapus atau nonaktifkan tujuan "${destName}"?`)) return
        startTransition(async () => {
            try {
                await deleteCrusherDestination(id)
                toast.success(`Tujuan "${destName}" dihapus/dinonaktifkan`)
                refreshData()
            } catch (err: any) {
                toast.error(err.message || "Gagal menghapus tujuan")
            }
        })
    }

    return (
        <div className="space-y-4 w-full">
            {/* Header Control */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                        <span>Master Tujuan Pengiriman Non-BP (Stone Crusher)</span>
                    </h1>
                    <p className="text-xs text-slate-500">
                        Daftar master lokasi proyek, pembeli umum, dan estimasi jarak tempuh untuk kalkulasi retase dump truck stone crusher.
                    </p>
                </div>

                <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenCreate}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Tujuan Baru</span>
                </Button>
            </div>

            {/* Filter Search Bar */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2.5 text-xs">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="Cari nama tujuan, proyek, alamat, atau PIC..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs bg-white dark:bg-slate-900"
                    />
                </div>

                <div className="w-full sm:w-60">
                    <Select value={filterLocation} onValueChange={setFilterLocation}>
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Pilih Cabang" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Cabang Stone Crusher</SelectItem>
                            {locations.map((l) => (
                                <SelectItem key={l.id} value={l.id}>
                                    {l.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table List */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                            <TableRow className="text-xs">
                                <TableHead className="font-semibold text-slate-700">Nama Tujuan / Proyek</TableHead>
                                <TableHead className="text-center font-semibold text-slate-700">Estimasi Jarak (KM)</TableHead>
                                <TableHead className="font-semibold text-slate-700">Cabang Crusher</TableHead>
                                <TableHead className="font-semibold text-slate-700">Alamat & Lokasi</TableHead>
                                <TableHead className="font-semibold text-slate-700">PIC & Kontak</TableHead>
                                <TableHead className="text-center font-semibold text-slate-700">Pengiriman</TableHead>
                                <TableHead className="text-center font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="text-center font-semibold text-slate-700">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {filteredDestinations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                                        Tidak ada data master tujuan yang sesuai.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDestinations.map((d) => (
                                    <TableRow key={d.id} className="hover:bg-slate-50/70 transition-colors">
                                        <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                <span>{d.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-emerald-700 dark:text-emerald-400">
                                            {formatNum(d.distance_km, 1)} KM
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-600 dark:text-slate-400">
                                            {d.locationName || "Universal"}
                                        </TableCell>
                                        <TableCell className="text-slate-600 max-w-[200px] truncate">
                                            {d.address || "-"}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {d.contact_person ? (
                                                <div>
                                                    <span className="font-medium">{d.contact_person}</span>
                                                    {d.phone && <span className="text-[11px] text-slate-400 block">{d.phone}</span>}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="text-[10px] h-5 gap-1 font-semibold">
                                                <Truck className="h-2.5 w-2.5" />
                                                <span>{d.totalDeliveries || 0} Rit</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {d.isActive ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                    Aktif
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                                                    Nonaktif
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenEdit(d)}
                                                    className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(d.id, d.name)}
                                                    className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal Dialog Create/Edit */}
            <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
                <DialogContent className="max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                            <MapPin className="h-5 w-5 text-emerald-600" />
                            {editingItem ? "Edit Master Tujuan Non-BP" : "Tambah Master Tujuan Non-BP"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3.5 py-2 text-xs">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Nama Tujuan / Proyek / Customer *</Label>
                            <Input
                                placeholder="Contoh: Proyek Jembatan Youtefa, TB Sentosa"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Estimasi Jarak (KM) *</Label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    inputMode="decimal"
                                    placeholder="18.5"
                                    value={distanceKm}
                                    onChange={(e) => setDistanceKm(e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-slate-900 font-bold text-emerald-700 dark:text-emerald-400"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Cabang Stone Crusher</Label>
                                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                                        <SelectValue placeholder="Pilih Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Cabang (Universal)</SelectItem>
                                        {locations.map((l) => (
                                            <SelectItem key={l.id} value={l.id}>
                                                {l.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Alamat / Patokan Lokasi</Label>
                            <Input
                                placeholder="Jl. Raya Holtekamp KM 9"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">PIC / Penerima</Label>
                                <Input
                                    placeholder="Pak Hasan"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">No. Telepon / WA</Label>
                                <Input
                                    placeholder="0812xxxx"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Catatan</Label>
                            <Textarea
                                placeholder="Catatan kondisi jalan, batas jam kirim, dll."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="text-xs bg-white dark:bg-slate-900"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPending}
                                onClick={() => setIsModalOpen(false)}
                                className="h-9 text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={isPending}
                                onClick={handleSave}
                                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                            >
                                {isPending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Plus className="h-3.5 w-3.5" />
                                )}
                                {editingItem ? "Simpan Perubahan" : "Simpan Tujuan"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
