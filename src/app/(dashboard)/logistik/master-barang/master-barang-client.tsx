"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Combobox } from "@/components/ui/combobox"
import { Plus, Pencil, Trash2 } from "lucide-react"

export function MasterBarangClient({ initialData, suppliers, categories }: { initialData: any[], suppliers: any[], categories: any[] }) {
    const [data] = useState(initialData)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)

    // Form states for combobox
    const [filterCategory, setFilterCategory] = useState("all")
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
    }, [editData])

    const filterCategoryOptions = [
        { value: "all", label: "Semua Kategori" },
        ...categories.map(c => ({ value: c.id, label: c.name }))
    ]
    const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }))
    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-md border shadow-sm">
                <div className="flex gap-4 items-center w-full max-w-2xl">
                    <div className="flex-1">
                        <Input placeholder="Cari Kode atau Nama Barang..." className="bg-slate-50" />
                    </div>
                    <div className="w-[250px]">
                        <Combobox
                            options={filterCategoryOptions}
                            value={filterCategory}
                            onChange={setFilterCategory}
                            placeholder="Semua Kategori"
                            className="bg-slate-50"
                        />
                    </div>
                </div>
                <Button onClick={() => { setEditData(null); setDialogOpen(true) }} className="shrink-0">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Barang
                </Button>
            </div>

            <div className="rounded-md border bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-100/80">
                                <TableHead className="min-w-[150px] cursor-pointer hover:bg-slate-200 transition-colors">Toko (Supplier) ↕</TableHead>
                                <TableHead className="min-w-[250px] cursor-pointer hover:bg-slate-200 transition-colors">Info Barang ↕</TableHead>
                                <TableHead className="min-w-[150px] cursor-pointer hover:bg-slate-200 transition-colors">Part Number / Tipe ↕</TableHead>
                                <TableHead className="min-w-[150px] cursor-pointer hover:bg-slate-200 transition-colors">Kategori PO ↕</TableHead>
                                <TableHead className="text-right min-w-[150px] cursor-pointer hover:bg-slate-200 transition-colors">Harga Satuan ↕</TableHead>
                                <TableHead className="w-[100px] text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => {
                                const supplier = suppliers.find(s => s.id === item.supplierId)
                                const category = categories.find(c => c.id === item.categoryId)
                                return (
                                    <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="text-sm font-semibold text-blue-700 align-top pt-4">
                                            {supplier?.name}
                                        </TableCell>
                                        <TableCell className="align-top pt-4">
                                            <div className="font-semibold text-sm text-slate-900">{item.name}</div>
                                            <div className="mt-1 inline-flex items-center rounded-sm bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 font-mono">
                                                {item.kode_barang}
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top pt-4">
                                            <div className="text-sm">{item.part_number || "-"}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">Merk: {item.merk || "-"}</div>
                                        </TableCell>
                                        <TableCell className="align-top pt-4">
                                            <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/10">
                                                {category?.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right align-top pt-4">
                                            <div className="font-bold text-green-700 tabular-nums">Rp {item.harga.toLocaleString('id-ID')}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">/ {item.satuan}</div>
                                        </TableCell>
                                        <TableCell className="align-top pt-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200"
                                                    onClick={() => { setEditData(item); setDialogOpen(true) }}
                                                >
                                                    <Pencil className="w-4 h-4 text-slate-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50">
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="text-xl">{editData ? "Edit Data Barang" : "Tambah Barang Baru"}</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-6 pt-4" onSubmit={(e) => { e.preventDefault(); setDialogOpen(false); alert("Mock Save") }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-2 md:col-span-2 p-4 bg-slate-50 rounded-lg border">
                                <h3 className="text-sm font-semibold text-slate-800 mb-3">Informasi Kepemilikan & Kategori</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Toko / Supplier *</Label>
                                        <Combobox
                                            options={supplierOptions}
                                            value={formSupplierId}
                                            onChange={setFormSupplierId}
                                            placeholder="Pilih Toko..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kategori PO *</Label>
                                        <Combobox
                                            options={categoryOptions}
                                            value={formCategoryId}
                                            onChange={setFormCategoryId}
                                            placeholder="Pilih Kategori..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Kode Barang *</Label>
                                <Input defaultValue={editData?.kode_barang} placeholder="Contoh: BRG-001" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Nama Barang *</Label>
                                <Input defaultValue={editData?.name} placeholder="Nama lengkap barang" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Part Number / Tipe</Label>
                                <Input defaultValue={editData?.part_number} placeholder="Opsional" />
                            </div>
                            <div className="space-y-2">
                                <Label>Merk</Label>
                                <Input defaultValue={editData?.merk} placeholder="Contoh: GITI / Pertamina" />
                            </div>
                            <div className="space-y-2">
                                <Label>Satuan *</Label>
                                <Input defaultValue={editData?.satuan} placeholder="PCS / SET / LTR / Pail" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Harga Satuan (Rp) *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                                    <Input type="number" defaultValue={editData?.harga} className="pl-9" placeholder="0" required />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                            <Button type="submit">Simpan Data Barang</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
