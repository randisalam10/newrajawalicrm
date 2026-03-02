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
import { createSupplier, updateSupplier, deleteSupplier } from "./actions"

export function SupplierClient({ initialData }: { initialData: any[] }) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)

    async function handleSubmit(formData: FormData) {
        const result = editData
            ? await updateSupplier(editData.id, formData)
            : await createSupplier(formData)
        if (result.success) { setDialogOpen(false); setEditData(null) }
        else alert("Error: " + JSON.stringify(result.error))
    }

    return (
        <div className="space-y-4 p-4">
            <div className="flex justify-end">
                <Button onClick={() => { setEditData(null); setDialogOpen(true) }}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Toko
                </Button>
            </div>

            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead>Nama Toko</TableHead>
                            <TableHead>Alamat</TableHead>
                            <TableHead>Kontak</TableHead>
                            <TableHead className="w-[100px] text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    Belum ada supplier / toko.
                                </TableCell>
                            </TableRow>
                        )}
                        {initialData.map((sup) => (
                            <TableRow key={sup.id} className="hover:bg-slate-50/70">
                                <TableCell className="font-semibold text-sm">{sup.name}</TableCell>
                                <TableCell className="text-sm text-slate-500">{sup.address || "-"}</TableCell>
                                <TableCell className="text-sm text-slate-500">{sup.contact || "-"}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost" size="icon" className="h-8 w-8"
                                            onClick={() => { setEditData(sup); setDialogOpen(true) }}
                                        >
                                            <Pencil className="w-4 h-4 text-slate-500" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon" className="h-8 w-8"
                                            onClick={async () => {
                                                if (!confirm(`Hapus toko "${sup.name}"?`)) return
                                                const r = await deleteSupplier(sup.id)
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
                        <DialogTitle>{editData ? "Edit Toko" : "Tambah Toko Baru"}</DialogTitle>
                    </DialogHeader>
                    <form key={editData?.id || "new"} action={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Nama Toko *</Label>
                            <Input name="name" defaultValue={editData?.name} placeholder="PT Jasindo Trans Papua" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Alamat</Label>
                            <Input name="address" defaultValue={editData?.address} placeholder="Jayapura Selatan" />
                        </div>
                        <div className="space-y-2">
                            <Label>Kontak (Opsional)</Label>
                            <Input name="contact" defaultValue={editData?.contact} placeholder="08..." />
                        </div>
                        <Button type="submit" className="w-full mt-4">Simpan</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
