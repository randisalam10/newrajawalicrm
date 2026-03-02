"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { createPoCategory, updatePoCategory, deletePoCategory } from "./actions"

export function KategoriClient({ initialData }: { initialData: any[] }) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)

    async function handleSubmit(formData: FormData) {
        const result = editData
            ? await updatePoCategory(editData.id, formData)
            : await createPoCategory(formData)
        if (result.success) { setDialogOpen(false); setEditData(null) }
        else alert("Error: " + JSON.stringify(result.error))
    }

    return (
        <div className="space-y-4 p-4">
            <div className="flex justify-end">
                <Button onClick={() => { setEditData(null); setDialogOpen(true) }}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
                </Button>
            </div>

            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead>Nama Kategori</TableHead>
                            <TableHead>Kode (Untuk PO)</TableHead>
                            <TableHead>Wajib KM/HM</TableHead>
                            <TableHead className="w-[100px] text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    Belum ada kategori.
                                </TableCell>
                            </TableRow>
                        )}
                        {initialData.map((cat) => (
                            <TableRow key={cat.id} className="hover:bg-slate-50/70">
                                <TableCell className="font-semibold text-sm">{cat.name}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {cat.kode_kategori}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {cat.require_hm_km
                                        ? <span className="text-red-600 text-xs font-bold">Ya</span>
                                        : <span className="text-slate-500 text-xs">Tidak</span>}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost" size="icon" className="h-8 w-8"
                                            onClick={() => { setEditData(cat); setDialogOpen(true) }}
                                        >
                                            <Pencil className="w-4 h-4 text-slate-500" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon" className="h-8 w-8"
                                            onClick={async () => {
                                                if (!confirm(`Hapus kategori "${cat.name}"?`)) return
                                                const r = await deletePoCategory(cat.id)
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

            <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditData(null) } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editData ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
                    </DialogHeader>
                    <form key={editData?.id || "new"} action={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Nama Kategori *</Label>
                            <Input name="name" defaultValue={editData?.name} placeholder="Contoh: Suku Cadang" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Kode Kategori (Prefix PO) *</Label>
                            <Input name="kode_kategori" defaultValue={editData?.kode_kategori} placeholder="Contoh: SPR" maxLength={10} required />
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <input
                                type="checkbox" id="req_hm" name="require_hm_km"
                                defaultChecked={editData?.require_hm_km}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="req_hm" className="font-normal cursor-pointer">
                                Wajib input KM/HM Alat/Kendaraan saat PO
                            </Label>
                        </div>
                        <Button type="submit" className="w-full mt-4">Simpan</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
