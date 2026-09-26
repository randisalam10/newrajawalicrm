"use client"

import { useState, useMemo, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Wrench,
    Building2,
    Loader2
} from "lucide-react"
import {
    createMasterSewaAlat,
    updateMasterSewaAlat,
    deleteMasterSewaAlat
} from "../sewa/actions"
import { toast } from "sonner"

export function MasterSewaClient({
    initialEquipments,
    locations,
    canManage = true,
    isCorporate = false,
}: {
    initialEquipments: any[]
    locations: any[]
    canManage?: boolean
    isCorporate?: boolean
}) {
    const [equipments, setEquipments] = useState<any[]>(initialEquipments)
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [filterCategory, setFilterCategory] = useState<string>("ALL")
    const [filterStatus, setFilterStatus] = useState<string>("ALL")
    const [filterBranch, setFilterBranch] = useState<string>("ALL")

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [editingAlat, setEditingAlat] = useState<any>(null)
    const [isSaving, setIsSaving] = useState<boolean>(false)

    // Extract unique categories
    const categoriesList = useMemo(() => {
        const set = new Set<string>()
        equipments.forEach(e => {
            if (e.kategori) set.add(e.kategori)
        })
        return Array.from(set).sort()
    }, [equipments])

    // Filtered data
    const filteredData = useMemo(() => {
        return equipments.filter(item => {
            if (filterCategory !== "ALL" && item.kategori !== filterCategory) return false
            if (filterStatus !== "ALL" && item.status !== filterStatus) return false
            if (filterBranch !== "ALL" && item.locationId !== filterBranch) return false
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const matchCode = item.kode_alat?.toLowerCase().includes(q)
                const matchName = item.nama_alat?.toLowerCase().includes(q)
                const matchCat = item.kategori?.toLowerCase().includes(q)
                const matchPlat = item.nomor_seri_plat?.toLowerCase().includes(q)
                if (!matchCode && !matchName && !matchCat && !matchPlat) return false
            }
            return true
        })
    }, [equipments, filterCategory, filterStatus, filterBranch, searchQuery])

    const formatRp = (num: number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num || 0)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        setIsSaving(true)
        try {
            if (editingAlat) {
                const res = await updateMasterSewaAlat(editingAlat.id, formData)
                if (res.success && res.alat) {
                    toast.success(`Alat "${res.alat.nama_alat}" berhasil diperbarui`)
                    setEquipments(prev => prev.map(a => a.id === editingAlat.id ? res.alat : a))
                    setIsModalOpen(false)
                } else {
                    toast.error(res.error || "Gagal memperbarui alat")
                }
            } else {
                const res = await createMasterSewaAlat(formData)
                if (res.success && res.alat) {
                    toast.success(`Alat "${res.alat.nama_alat}" berhasil ditambahkan`)
                    setEquipments(prev => [...prev, res.alat])
                    setIsModalOpen(false)
                } else {
                    toast.error(res.error || "Gagal menambahkan alat")
                }
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Hapus alat "${name}"?`)) return
        const res = await deleteMasterSewaAlat(id)
        if (res.success) {
            toast.success("Alat berhasil dihapus")
            setEquipments(prev => prev.filter(e => e.id !== id))
        } else {
            toast.error(res.error || "Gagal menghapus alat")
        }
    }

    return (
        <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Cari kode alat, nama, seri/plat..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>

                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="h-9 text-xs w-[140px]">
                            <SelectValue placeholder="Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Kategori</SelectItem>
                            {categoriesList.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-9 text-xs w-[120px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            <SelectItem value="Tersedia">Tersedia</SelectItem>
                            <SelectItem value="Disewa">Disewa</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {canManage && (
                    <Button
                        onClick={() => {
                            setEditingAlat(null)
                            setIsModalOpen(true)
                        }}
                        className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Tambah Alat Sewa
                    </Button>
                )}
            </div>

            {/* Table */}
            <Card className="shadow-xs border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 border-b border-slate-200">
                            <TableHead className="w-[110px]">Kode Alat</TableHead>
                            <TableHead>Nama Alat & Tipe</TableHead>
                            <TableHead className="w-[140px]">Kategori</TableHead>
                            <TableHead className="w-[130px]">Plat / No Seri</TableHead>
                            <TableHead className="text-right w-[140px]">Tarif Acuan / Hari</TableHead>
                            <TableHead className="text-center w-[110px]">Status</TableHead>
                            {canManage && <TableHead className="text-center w-[80px]">Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={canManage ? 7 : 6} className="text-center py-10 text-xs text-slate-400">
                                    Tidak ada data alat sewa yang sesuai filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map(eq => (
                                <TableRow key={eq.id} className="hover:bg-slate-50/60 transition-colors">
                                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                                        {eq.kode_alat}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-semibold text-xs text-slate-900">{eq.nama_alat}</p>
                                        {eq.merk_model && (
                                            <p className="text-[11px] text-slate-400">{eq.merk_model}</p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] font-medium bg-slate-50">
                                            {eq.kategori}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-600">
                                        {eq.nomor_seri_plat || "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs font-semibold text-slate-800">
                                        {eq.default_day_rate > 0 ? formatRp(eq.default_day_rate) : "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            className={
                                                eq.status === "Tersedia"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : eq.status === "Disewa"
                                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                            }
                                        >
                                            {eq.status}
                                        </Badge>
                                    </TableCell>
                                    {canManage && (
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingAlat(eq)
                                                        setIsModalOpen(true)
                                                    }}
                                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit Data Alat"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(eq.id, eq.nama_alat)}
                                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                    title="Hapus Alat"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Modal Tambah / Edit */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Wrench className="w-4 h-4 text-blue-600" />
                            {editingAlat ? "Edit Master Alat Sewa" : "Tambah Alat Sewa Baru"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-3.5 py-1 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Kode Alat *</Label>
                                <Input
                                    name="kode_alat"
                                    placeholder="Misal: CP-01, EXC-02"
                                    defaultValue={editingAlat?.kode_alat || ""}
                                    className="h-8 text-xs font-mono uppercase font-bold"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Kategori *</Label>
                                <Input
                                    name="kategori"
                                    placeholder="Concrete Pump, Excavator, dll"
                                    defaultValue={editingAlat?.kategori || "Concrete Pump"}
                                    className="h-8 text-xs"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Nama Alat / Kendaraan *</Label>
                            <Input
                                name="nama_alat"
                                placeholder="Contoh: Concrete Pump Sany 37M"
                                defaultValue={editingAlat?.nama_alat || ""}
                                className="h-8 text-xs"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Merk / Model</Label>
                                <Input
                                    name="merk_model"
                                    placeholder="Misal: Sany SY5290"
                                    defaultValue={editingAlat?.merk_model || ""}
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Plat / No. Seri Unit</Label>
                                <Input
                                    name="nomor_seri_plat"
                                    placeholder="Misal: B 9102 SAA"
                                    defaultValue={editingAlat?.nomor_seri_plat || ""}
                                    className="h-8 text-xs uppercase font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Tarif Acuan / Hari (Rp)</Label>
                                <Input
                                    name="default_day_rate"
                                    type="number"
                                    min="0"
                                    step="1000"
                                    placeholder="Misal: 3500000"
                                    defaultValue={editingAlat?.default_day_rate || 0}
                                    className="h-8 text-xs font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Status</Label>
                                <Select name="status" defaultValue={editingAlat?.status || "Tersedia"}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tersedia">Tersedia</SelectItem>
                                        <SelectItem value="Disewa">Disewa</SelectItem>
                                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                                        <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {isCorporate && (
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Cabang Penempatan</Label>
                                <Select name="locationId" defaultValue={editingAlat?.locationId || "ALL"}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Pusat / Semua Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Pusat / Semua Cabang</SelectItem>
                                        {locations.map(loc => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Spesifikasi / Catatan</Label>
                            <Textarea
                                name="keterangan"
                                placeholder="Kapasitas, jangkauan boom, kondisi unit, dll..."
                                defaultValue={editingAlat?.keterangan || ""}
                                rows={2}
                                className="text-xs resize-none"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" size="sm" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Simpan Data"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
