"use client"

import React, { useState } from "react"
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
import { Plus, Pencil, Trash2 } from "lucide-react"
import { createMasterItem, updateMasterItem, deleteMasterItem } from "./actions"

export function MasterBarangClient({ initialData, suppliers, categories }: { initialData: any[], suppliers: any[], categories: any[] }) {
    const [search, setSearch] = useState("")
    const [filterCategory, setFilterCategory] = useState("all")
    const [dialogOpen, setDialogOpen] = useState(false)
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

    const filtered = initialData.filter(item => {
        const matchSearch = !search ||
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.kode_barang.toLowerCase().includes(search.toLowerCase())
        const matchCategory = filterCategory === "all" || item.categoryId === filterCategory
        return matchSearch && matchCategory
    })

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
        <div className="space-y-4 p-4">
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
                <Button onClick={() => { setEditData(null); setDialogOpen(true) }}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Barang
                </Button>
            </div>

            <div className="rounded-md border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-100/80">
                                <TableHead className="min-w-[140px]">Toko</TableHead>
                                <TableHead className="min-w-[240px]">Info Barang</TableHead>
                                <TableHead className="min-w-[140px]">Part / Tipe</TableHead>
                                <TableHead className="min-w-[130px]">Kategori PO</TableHead>
                                <TableHead className="text-right min-w-[140px]">Harga Satuan</TableHead>
                                <TableHead className="w-[100px] text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                        {search || filterCategory !== "all" ? "Tidak ada barang yang cocok." : "Belum ada master barang."}
                                    </TableCell>
                                </TableRow>
                            )}
                            {filtered.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50">
                                    <TableCell className="text-sm font-semibold text-blue-700 align-top pt-4">
                                        {item.supplier?.name}
                                    </TableCell>
                                    <TableCell className="align-top pt-4">
                                        <div className="font-semibold text-sm">{item.name}</div>
                                        <div className="mt-1 inline-flex items-center rounded-sm bg-slate-100 px-2 py-0.5 text-[11px] font-medium font-mono">
                                            {item.kode_barang}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top pt-4">
                                        <div className="text-sm">{item.part_number || "-"}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Merk: {item.merk || "-"}</div>
                                    </TableCell>
                                    <TableCell className="align-top pt-4">
                                        <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/10">
                                            {item.category?.name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right align-top pt-4">
                                        <div className="font-bold text-green-700">Rp {Number(item.harga).toLocaleString('id-ID')}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">/ {item.satuan}</div>
                                    </TableCell>
                                    <TableCell className="align-top pt-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8"
                                                onClick={() => { setEditData(item); setDialogOpen(true) }}
                                            >
                                                <Pencil className="w-4 h-4 text-slate-600" />
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8"
                                                onClick={async () => {
                                                    if (!confirm(`Hapus barang "${item.name}"?`)) return
                                                    const r = await deleteMasterItem(item.id)
                                                    if (!r.success) alert(r.error)
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

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
                        </div>
                        <DialogFooter className="border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={!formSupplierId || !formCategoryId}>Simpan Data Barang</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
