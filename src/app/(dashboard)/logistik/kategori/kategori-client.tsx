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
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"

export function KategoriClient({ initialData }: { initialData: any[] }) {
    const [data] = useState(initialData)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-md border shadow-sm">
                <div className="flex gap-4 items-center w-full max-w-sm">
                    <div className="flex-1 relative">
                        <Input placeholder="Cari Kategori..." className="bg-slate-50 pl-8" />
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
                <Button onClick={() => { setEditData(null); setDialogOpen(true) }} className="shrink-0">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
                </Button>
            </div>

            <div className="rounded-md border bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors">Nama Kategori ↕</TableHead>
                            <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors">Kode (Untuk PO) ↕</TableHead>
                            <TableHead>Wajib KM/HM</TableHead>
                            <TableHead className="w-[100px] text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((cat) => (
                            <TableRow key={cat.id} className="hover:bg-slate-50/70">
                                <TableCell className="font-semibold text-sm">{cat.name}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {cat.kode_kategori}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {cat.require_hm_km ? (
                                        <span className="text-red-600 text-xs font-bold">Ya</span>
                                    ) : (
                                        <span className="text-slate-500 text-xs">Tidak</span>
                                    )}
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
                                            disabled={["1", "2", "3", "4"].includes(cat.id)} // Protect default ones
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editData ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4 pt-4" onSubmit={(e) => { e.preventDefault(); setDialogOpen(false); alert("Mock Save") }}>
                        <div className="space-y-2">
                            <Label>Nama Kategori</Label>
                            <Input defaultValue={editData?.name} placeholder="Contoh: ATK" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Kode Kategori (Prefix PO)</Label>
                            <Input defaultValue={editData?.kode_kategori} placeholder="Contoh: ATK" maxLength={4} required />
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <input type="checkbox" id="req_hm" defaultChecked={editData?.require_hm_km} className="h-4 w-4 rounded border-gray-300" />
                            <Label htmlFor="req_hm" className="font-normal cursor-pointer">Wajib input KM/HM Alat/Kendaraan saat PO</Label>
                        </div>
                        <Button type="submit" className="w-full mt-4">Simpan</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
