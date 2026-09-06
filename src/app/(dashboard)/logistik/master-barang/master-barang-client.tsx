"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Combobox } from "@/components/ui/combobox"
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, History } from "lucide-react"
import { createMasterItem, updateMasterItem, deleteMasterItem } from "./actions"

const PAGE_SIZE = 20

export function MasterBarangClient({
    initialData,
    suppliers,
    categories,
    canManage = true,
}: {
    initialData: any[]
    suppliers: any[]
    categories: any[]
    canManage?: boolean
}) {
    const [search, setSearch] = useState("")
    const [filterCategory, setFilterCategory] = useState("all")
    const [page, setPage] = useState(1)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [historyItem, setHistoryItem] = useState<any>(null)
    const [editData, setEditData] = useState<any>(null)
    const [formSupplierId, setFormSupplierId] = useState("")
    const [formCategoryId, setFormCategoryId] = useState("")

    React.useEffect(() => {
        if (editData) {
            setFormSupplierId(editData.supplierId || "")
            setFormCategoryId(editData.categoryId || "")
        } else {
            setFormSupplierId("")
            setFormCategoryId("")
        }
    }, [editData, dialogOpen])

    // Reset ke halaman 1 saat filter berubah
    React.useEffect(() => { setPage(1) }, [search, filterCategory])

    const filtered = useMemo(() => initialData.filter(item => {
        const matchSearch = !search ||
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.kode_barang.toLowerCase().includes(search.toLowerCase())
        const matchCategory = filterCategory === "all" || item.categoryId === filterCategory
        return matchSearch && matchCategory
    }), [initialData, search, filterCategory])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }))
    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
    const filterCategoryOptions = [
        { value: "all", label: "Semua Kategori" },
        ...categoryOptions
    ]

    async function handleSubmit(formData: FormData) {
        formData.set("supplierId", formSupplierId)
        formData.set("categoryId", formCategoryId)
        const result = editData
            ? await updateMasterItem(editData.id, formData)
            : await createMasterItem(formData)
        if (result.success) { setDialogOpen(false); setEditData(null) }
        else alert("Error: " + JSON.stringify(result.error))
    }

    return (
        <div className="space-y-3 p-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center gap-4">
                <div className="flex gap-3 flex-1 max-w-2xl">
                    <Input
                        placeholder="Cari kode atau nama barang..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1"
                    />
                    <div className="w-[220px]">
                        <Combobox
                            options={filterCategoryOptions}
                            value={filterCategory}
                            onChange={setFilterCategory}
                            placeholder="Semua Kategori"
                        />
                    </div>
                </div>
                {canManage && (
                    <Button onClick={() => { setEditData(null); setDialogOpen(true) }}>
                        <Plus className="w-4 h-4 mr-2" /> Tambah Barang
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-100/80 h-9">
                                <TableHead className="py-2 min-w-[130px] text-xs">Toko</TableHead>
                                <TableHead className="py-2 min-w-[80px] text-xs">Kode</TableHead>
                                <TableHead className="py-2 min-w-[200px] text-xs">Nama Barang</TableHead>
                                <TableHead className="py-2 min-w-[120px] text-xs">Part / Merk</TableHead>
                                <TableHead className="py-2 min-w-[130px] text-xs">Kategori PO</TableHead>
                                <TableHead className="py-2 text-right min-w-[140px] text-xs">Harga Satuan</TableHead>
                                <TableHead className="py-2 w-[100px] text-center text-xs">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                                        {search || filterCategory !== "all" ? "Tidak ada barang yang cocok." : "Belum ada master barang."}
                                    </TableCell>
                                </TableRow>
                            )}
                            {paginated.map((item) => {
                                const latestChange = item.priceHistories && item.priceHistories.length > 0 && item.priceHistories[0].oldPrice > 0
                                    ? item.priceHistories[0]
                                    : null

                                return (
                                    <TableRow key={item.id} className="hover:bg-slate-50 h-9">
                                        <TableCell className="py-1.5 text-xs font-semibold text-blue-700">
                                            {item.supplier?.name}
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                            <span className="inline-flex items-center rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium">
                                                {item.kode_barang}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-1.5 text-xs font-medium text-slate-900">
                                            {item.name}
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                            <div className="text-xs text-slate-700">{item.part_number || "-"}</div>
                                            {item.merk && <div className="text-[10px] text-slate-400">{item.merk}</div>}
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                            <span className="inline-flex items-center rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 ring-1 ring-inset ring-orange-600/10">
                                                {item.category?.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-1.5 text-right">
                                            <div className="flex flex-col items-end">
                                                <div>
                                                    <span className="text-xs font-bold text-green-700">Rp {Number(item.harga).toLocaleString('id-ID')}</span>
                                                    <span className="text-[10px] text-slate-400 ml-1">/{item.satuan}</span>
                                                </div>
                                                {latestChange && (
                                                    <div className="mt-0.5">
                                                        {latestChange.percentage > 0 ? (
                                                            <span className="inline-flex items-center text-[9px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.2 rounded" title={`Kenaikan Rp ${Math.abs(latestChange.priceDiff).toLocaleString('id-ID')}`}>
                                                                ▲ +{latestChange.percentage.toFixed(1)}%
                                                            </span>
                                                        ) : latestChange.percentage < 0 ? (
                                                            <span className="inline-flex items-center text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded" title={`Penurunan Rp ${Math.abs(latestChange.priceDiff).toLocaleString('id-ID')}`}>
                                                                ▼ {latestChange.percentage.toFixed(1)}%
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <Button
                                                    variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    title="Lihat Riwayat Harga"
                                                    onClick={() => { setHistoryItem(item); setHistoryOpen(true) }}
                                                >
                                                    <History className="w-3.5 h-3.5" />
                                                </Button>
                                                {canManage && (
                                                    <>
                                                        <Button
                                                            variant="ghost" size="icon" className="h-7 w-7"
                                                            title="Edit Barang"
                                                            onClick={() => { setEditData(item); setDialogOpen(true) }}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5 text-slate-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="icon" className="h-7 w-7"
                                                            title="Hapus Barang"
                                                            onClick={async () => {
                                                                if (!confirm(`Hapus barang "${item.name}"?`)) return
                                                                const r = await deleteMasterItem(item.id)
                                                                if (!r.success) alert(r.error)
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-slate-500 px-1">
                <span>
                    Menampilkan <span className="font-medium text-slate-700">{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</span>–<span className="font-medium text-slate-700">{Math.min(page * PAGE_SIZE, filtered.length)}</span> dari <span className="font-medium text-slate-700">{filtered.length}</span> barang
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .reduce<(number | "...")[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...")
                            acc.push(p)
                            return acc
                        }, [])
                        .map((p, i) =>
                            p === "..." ? (
                                <span key={`ellipsis-${i}`} className="px-1 text-slate-400">…</span>
                            ) : (
                                <Button
                                    key={p}
                                    variant={page === p ? "default" : "outline"}
                                    size="icon" className="h-7 w-7 text-xs"
                                    onClick={() => setPage(p as number)}
                                >
                                    {p}
                                </Button>
                            )
                        )}
                    <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Dialog Tambah / Edit */}
            <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditData(null) } }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="text-xl">{editData ? "Edit Data Barang" : "Tambah Barang Baru"}</DialogTitle>
                    </DialogHeader>
                    <form key={editData?.id || "new"} action={handleSubmit} className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="md:col-span-2 p-4 bg-slate-50 rounded-lg border">
                                <h3 className="text-sm font-semibold mb-3">Kepemilikan & Kategori</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Toko / Supplier *</Label>
                                        <Combobox options={supplierOptions} value={formSupplierId} onChange={setFormSupplierId} placeholder="Pilih Toko..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kategori PO *</Label>
                                        <Combobox options={categoryOptions} value={formCategoryId} onChange={setFormCategoryId} placeholder="Pilih Kategori..." />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Kode Barang *</Label>
                                <Input name="kode_barang" defaultValue={editData?.kode_barang} placeholder="BRG-001" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Nama Barang *</Label>
                                <Input name="name" defaultValue={editData?.name} placeholder="Nama lengkap barang" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Part Number / Tipe</Label>
                                <Input name="part_number" defaultValue={editData?.part_number} placeholder="Opsional" />
                            </div>
                            <div className="space-y-2">
                                <Label>Merk</Label>
                                <Input name="merk" defaultValue={editData?.merk} placeholder="GITI / Pertamina" />
                            </div>
                            <div className="space-y-2">
                                <Label>Satuan *</Label>
                                <Input name="satuan" defaultValue={editData?.satuan} placeholder="PCS / SET / LTR" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Harga Satuan (Rp) *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                                    <Input type="number" name="harga" defaultValue={editData?.harga} className="pl-9" placeholder="0" required />
                                </div>
                            </div>
                            {editData && (
                                <div className="md:col-span-2 space-y-2">
                                    <Label>Catatan / Alasan Perubahan Harga (Opsional)</Label>
                                    <Input name="reason" placeholder="Contoh: Kenaikan harga pabrik / supplier" />
                                </div>
                            )}
                        </div>
                        <DialogFooter className="border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={!formSupplierId || !formCategoryId}>Simpan Data Barang</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Riwayat Perubahan Harga */}
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-lg flex items-center gap-2">
                                    <History className="w-5 h-5 text-blue-600" />
                                    Riwayat Perubahan Harga
                                </DialogTitle>
                                <p className="text-xs text-slate-500 mt-1">
                                    <span className="font-semibold text-slate-800">{historyItem?.name}</span> ({historyItem?.kode_barang}) • {historyItem?.supplier?.name}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400">Harga Saat Ini:</span>
                                <div className="text-sm font-bold text-green-700">Rp {Number(historyItem?.harga || 0).toLocaleString('id-ID')} /{historyItem?.satuan}</div>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1 p-1">
                        {(!historyItem?.priceHistories || historyItem.priceHistories.length === 0) ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                Belum ada riwayat perubahan harga tercatat untuk barang ini.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 text-xs">
                                        <TableHead className="py-2 text-xs">Tanggal</TableHead>
                                        <TableHead className="py-2 text-right text-xs">Harga Lama</TableHead>
                                        <TableHead className="py-2 text-right text-xs">Harga Baru</TableHead>
                                        <TableHead className="py-2 text-center text-xs">Perubahan</TableHead>
                                        <TableHead className="py-2 text-xs">Diubah Oleh</TableHead>
                                        <TableHead className="py-2 text-xs">Keterangan / Alasan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historyItem.priceHistories.map((h: any, idx: number) => {
                                        const isIncrease = h.priceDiff > 0
                                        const isDecrease = h.priceDiff < 0
                                        return (
                                            <TableRow key={h.id || idx} className="text-xs hover:bg-slate-50">
                                                <TableCell className="py-2 font-mono whitespace-nowrap text-slate-600">
                                                    {new Date(h.effectiveDate || h.createdAt).toLocaleDateString('id-ID', {
                                                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </TableCell>
                                                <TableCell className="py-2 text-right text-slate-500 whitespace-nowrap">
                                                    {h.oldPrice > 0 ? `Rp ${Number(h.oldPrice).toLocaleString('id-ID')}` : '-'}
                                                </TableCell>
                                                <TableCell className="py-2 text-right font-bold text-slate-900 whitespace-nowrap">
                                                    Rp {Number(h.newPrice).toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="py-2 text-center whitespace-nowrap">
                                                    {h.oldPrice === 0 ? (
                                                        <span className="inline-flex text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                            Harga Awal
                                                        </span>
                                                    ) : isIncrease ? (
                                                        <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                                            ▲ +Rp {Math.abs(h.priceDiff).toLocaleString('id-ID')} (+{h.percentage.toFixed(1)}%)
                                                        </span>
                                                    ) : isDecrease ? (
                                                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                            ▼ -Rp {Math.abs(h.priceDiff).toLocaleString('id-ID')} ({h.percentage.toFixed(1)}%)
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400">Tetap</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2 text-slate-700 whitespace-nowrap">
                                                    {h.updatedBy?.employee?.name || h.updatedBy?.username || "Sistem"}
                                                </TableCell>
                                                <TableCell className="py-2 text-slate-600 max-w-[200px] truncate" title={h.reason || "-"}>
                                                    {h.reason || "-"}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    <DialogFooter className="border-t pt-3">
                        <Button variant="outline" size="sm" onClick={() => setHistoryOpen(false)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
