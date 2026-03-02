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
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, FolderOpen } from "lucide-react"

export function PerusahaanClient({ initialData }: { initialData: any[] }) {
    const [data] = useState(initialData)
    const [expandedCompany, setExpandedCompany] = useState<string | null>(null)
    const [dialogMode, setDialogMode] = useState<"companyNew" | "companyEdit" | "projectNew" | "projectEdit" | null>(null)
    const [editData, setEditData] = useState<any>(null)
    const [parentCompany, setParentCompany] = useState<any>(null)

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-md border shadow-sm">
                <div className="flex gap-4 items-center w-full max-w-sm">
                    <div className="flex-1 relative">
                        <Input placeholder="Cari Perusahaan..." className="bg-slate-50 pl-8" />
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
                <Button onClick={() => { setEditData(null); setDialogMode("companyNew") }} className="shrink-0">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Perusahaan
                </Button>
            </div>

            <div className="rounded-md border bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="w-8"></TableHead>
                            <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors">Nama Perusahaan ↕</TableHead>
                            <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors">Kode (PO) ↕</TableHead>
                            <TableHead>Kota</TableHead>
                            <TableHead>Pimpinan</TableHead>
                            <TableHead>Proyek</TableHead>
                            <TableHead className="w-[120px] text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((company) => (
                            <React.Fragment key={company.id}>
                                <TableRow
                                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                                    onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
                                >
                                    <TableCell className="pl-4">
                                        {expandedCompany === company.id
                                            ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                            : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-sm">{company.name}</div>
                                        <div className="text-xs text-slate-500">{company.address}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono">{company.kode_cabang}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{company.kota}</TableCell>
                                    <TableCell className="text-sm">{company.pimpinan_default}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{company.projects?.length ?? 0} proyek</Badge>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8" title="Tambah Proyek"
                                                onClick={() => { setParentCompany(company); setEditData(null); setExpandedCompany(company.id); setDialogMode("projectNew") }}
                                            >
                                                <FolderOpen className="w-4 h-4 text-green-600" />
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8"
                                                onClick={() => { setEditData(company); setDialogMode("companyEdit") }}
                                            >
                                                <Pencil className="w-4 h-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* Proyek List */}
                                {expandedCompany === company.id && (
                                    <TableRow className="bg-slate-50/80 border-t-0">
                                        <TableCell colSpan={7} className="p-0">
                                            <div className="px-10 py-3 border-l-4 border-blue-200 bg-blue-50/30">
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        Tujuan / Lokasi Pemesanan Proyek <span className="text-blue-700">{company.name}</span>
                                                    </p>
                                                </div>
                                                {(!company.projects || company.projects.length === 0) ? (
                                                    <p className="text-sm text-slate-400 italic py-2">Belum ada proyek.</p>
                                                ) : (
                                                    <table className="w-full text-sm">
                                                        <tbody>
                                                            {company.projects.map((proj: any) => (
                                                                <tr key={proj.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/50 transition-colors">
                                                                    <td className="py-2 pr-4 text-slate-800 font-medium">
                                                                        {proj.name}
                                                                        {proj.kode_proyek && <span className="ml-2 inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">({proj.kode_proyek})</span>}
                                                                    </td>
                                                                    <td className="py-2 w-[80px]">
                                                                        <div className="flex gap-1 justify-end">
                                                                            <Button
                                                                                variant="ghost" size="icon" className="h-7 w-7"
                                                                                onClick={() => { setParentCompany(company); setEditData(proj); setDialogMode("projectEdit") }}
                                                                            >
                                                                                <Pencil className="w-3 h-3 text-slate-500" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                                <Trash2 className="w-3 h-3 text-red-500" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Company Dialog */}
            <Dialog open={dialogMode === "companyNew" || dialogMode === "companyEdit"} onOpenChange={(o) => !o && setDialogMode(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{dialogMode === "companyEdit" ? "Edit Perusahaan" : "Tambah Perusahaan Baru"}</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4 pt-4" onSubmit={(e) => { e.preventDefault(); setDialogMode(null); alert("Mock Save") }}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Nama Perusahaan *</Label>
                                <Input defaultValue={editData?.name} placeholder="PT. Rajawali Puncak Jayawijaya" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Kode Cabang (Singkatan) *</Label>
                                <Input defaultValue={editData?.kode_cabang} placeholder="RPJ" maxLength={10} required />
                                <p className="text-[10px] text-slate-500">Muncul di format Nmr PO: id/KODE/Kat/bln/thn</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Kota TTD *</Label>
                                <Input defaultValue={editData?.kota} placeholder="Jayapura" required />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Alamat KOP Surat</Label>
                                <Input defaultValue={editData?.address} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Email KOP Surat</Label>
                                <Input type="email" defaultValue={editData?.email} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Nama Pimpinan (Default)</Label>
                                <Input defaultValue={editData?.pimpinan_default} placeholder="JEFFRY FERDY S.T." />
                            </div>
                        </div>
                        <Button type="submit" className="w-full mt-4">Simpan</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Project Dialog */}
            <Dialog open={dialogMode === "projectNew" || dialogMode === "projectEdit"} onOpenChange={(o) => !o && setDialogMode(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogMode === "projectEdit" ? "Edit Proyek" : `Tambah Proyek — ${parentCompany?.name}`}</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4 pt-4" onSubmit={(e) => { e.preventDefault(); setDialogMode(null); alert("Mock Save") }}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Kode Proyek</Label>
                                <Input defaultValue={editData?.kode_proyek} placeholder="Contoh: 005" />
                                <p className="text-xs text-slate-500">Bisa dikosongkan jika tidak ada.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Nama / Lokasi Proyek *</Label>
                                <Input defaultValue={editData?.name} placeholder="PRESERVASI JALAN YETTI..." required />
                                <p className="text-xs text-slate-500">Ini akan tampil di nota PO bagian Tujuan / Lokasi Pemesanan.</p>
                            </div>
                        </div>
                        <Button type="submit" className="w-full mt-4">Simpan Proyek</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
