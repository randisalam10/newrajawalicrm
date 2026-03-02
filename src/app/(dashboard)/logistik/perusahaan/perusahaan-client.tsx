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
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, FolderOpen } from "lucide-react"
import {
    createPoCompany, updatePoCompany, deletePoCompany,
    createPoCompanyProject, updatePoCompanyProject, deletePoCompanyProject
} from "./actions"

export function PerusahaanClient({ initialData }: { initialData: any[] }) {
    const [expandedCompany, setExpandedCompany] = useState<string | null>(null)
    const [dialogMode, setDialogMode] = useState<"companyNew" | "companyEdit" | "projectNew" | "projectEdit" | null>(null)
    const [editData, setEditData] = useState<any>(null)
    const [parentCompany, setParentCompany] = useState<any>(null)

    async function handleCompanySubmit(formData: FormData) {
        const result = dialogMode === "companyEdit"
            ? await updatePoCompany(editData.id, formData)
            : await createPoCompany(formData)
        if (result.success) { setDialogMode(null); setEditData(null) }
        else alert("Error: " + JSON.stringify(result.error))
    }

    async function handleProjectSubmit(formData: FormData) {
        formData.set("companyGroupId", dialogMode === "projectEdit" ? editData.companyGroupId : parentCompany.id)
        const result = dialogMode === "projectEdit"
            ? await updatePoCompanyProject(editData.id, formData)
            : await createPoCompanyProject(formData)
        if (result.success) { setDialogMode(null); setEditData(null) }
        else alert("Error: " + JSON.stringify(result.error))
    }

    return (
        <div className="space-y-4 p-4">
            <div className="flex justify-between items-center">
                <div />
                <Button onClick={() => { setEditData(null); setDialogMode("companyNew") }}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Perusahaan
                </Button>
            </div>

            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Nama Perusahaan</TableHead>
                            <TableHead>Kode PO</TableHead>
                            <TableHead>Kota</TableHead>
                            <TableHead>Pimpinan</TableHead>
                            <TableHead>Proyek</TableHead>
                            <TableHead className="w-[120px] text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                                    Belum ada perusahaan. Tambah terlebih dahulu.
                                </TableCell>
                            </TableRow>
                        )}
                        {initialData.map((company) => (
                            <React.Fragment key={company.id}>
                                <TableRow
                                    className="hover:bg-slate-50/70 cursor-pointer"
                                    onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
                                >
                                    <TableCell className="pl-4">
                                        {expandedCompany === company.id
                                            ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                            : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-sm">{company.name}</div>
                                        {company.address && <div className="text-xs text-slate-500">{company.address}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono">{company.kode_cabang}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{company.kota}</TableCell>
                                    <TableCell className="text-sm">{company.pimpinan_default || "-"}</TableCell>
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
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8"
                                                onClick={async () => {
                                                    if (!confirm(`Hapus perusahaan "${company.name}"?`)) return
                                                    const r = await deletePoCompany(company.id)
                                                    if (!r.success) alert(r.error)
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {expandedCompany === company.id && (
                                    <TableRow className="bg-slate-50/80">
                                        <TableCell colSpan={7} className="p-0">
                                            <div className="px-10 py-3 border-l-4 border-blue-200 bg-blue-50/30">
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        Proyek / Lokasi <span className="text-blue-700">{company.name}</span>
                                                    </p>
                                                    <Button
                                                        size="sm" variant="outline" className="h-7 text-xs"
                                                        onClick={() => { setParentCompany(company); setEditData(null); setDialogMode("projectNew") }}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" /> Tambah Proyek
                                                    </Button>
                                                </div>
                                                {(!company.projects || company.projects.length === 0) ? (
                                                    <p className="text-sm text-slate-400 italic py-2">Belum ada proyek.</p>
                                                ) : (
                                                    <table className="w-full text-sm">
                                                        <tbody>
                                                            {company.projects.map((proj: any) => (
                                                                <tr key={proj.id} className="border-b border-slate-100 last:border-0">
                                                                    <td className="py-2 text-slate-800 font-medium">
                                                                        {proj.name}
                                                                        {proj.kode_proyek && (
                                                                            <span className="ml-2 inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                                                                                ({proj.kode_proyek})
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2 w-[80px]">
                                                                        <div className="flex gap-1 justify-end">
                                                                            <Button
                                                                                variant="ghost" size="icon" className="h-7 w-7"
                                                                                onClick={() => { setParentCompany(company); setEditData(proj); setDialogMode("projectEdit") }}
                                                                            >
                                                                                <Pencil className="w-3 h-3 text-slate-500" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost" size="icon" className="h-7 w-7"
                                                                                onClick={async () => {
                                                                                    if (!confirm("Hapus proyek ini?")) return
                                                                                    const r = await deletePoCompanyProject(proj.id)
                                                                                    if (!r.success) alert(r.error)
                                                                                }}
                                                                            >
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
                    <form key={editData?.id || "new"} action={handleCompanySubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Nama Perusahaan *</Label>
                                <Input name="name" defaultValue={editData?.name} placeholder="PT. Rajawali Puncak Jayawijaya" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Kode Cabang (Singkatan) *</Label>
                                <Input name="kode_cabang" defaultValue={editData?.kode_cabang} placeholder="RPJ" maxLength={10} required />
                                <p className="text-[10px] text-slate-500">Format Nomor PO: id/KODE/Kat/bln/thn</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Kota TTD *</Label>
                                <Input name="kota" defaultValue={editData?.kota} placeholder="Jayapura" required />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Alamat KOP Surat</Label>
                                <Input name="address" defaultValue={editData?.address} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Email KOP Surat</Label>
                                <Input type="email" name="email" defaultValue={editData?.email} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Nama Pimpinan (Default)</Label>
                                <Input name="pimpinan_default" defaultValue={editData?.pimpinan_default} placeholder="JEFFRY FERDY S.T." />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Nama Kepala Peralatan (Default)</Label>
                                <Input name="kepala_peralatan_default" defaultValue={editData?.kepala_peralatan_default} placeholder="RUSLAN" />
                                <p className="text-[10px] text-slate-500">Akan otomatis terisi di form Buat PO</p>
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
                    <form key={editData?.id || "new-proj"} action={handleProjectSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Kode Proyek</Label>
                            <Input name="kode_proyek" defaultValue={editData?.kode_proyek} placeholder="Contoh: 005" />
                            <p className="text-xs text-slate-500">Bisa dikosongkan jika tidak ada.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Nama / Lokasi Proyek *</Label>
                            <Input name="name" defaultValue={editData?.name} placeholder="PRESERVASI JALAN YETTI..." required />
                        </div>
                        <Button type="submit" className="w-full mt-4">Simpan Proyek</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
