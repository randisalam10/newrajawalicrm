"use client"

import { useState } from "react"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { createKaryawan, updateKaryawan, deleteKaryawan } from "./actions"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"

export function KaryawanClient({ initialData, locations, userRole }: { initialData: any[], locations: any[], userRole: string }) {
    const [open, setOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [selectedPosition, setSelectedPosition] = useState<string>("Sopir")

    async function handleSubmit(formData: FormData) {
        let result;
        if (editData) {
            result = await updateKaryawan(editData.id, formData)
        } else {
            result = await createKaryawan(formData)
        }

        if (result.success) {
            setOpen(false)
            setEditData(null)
        } else {
            alert("Error: " + JSON.stringify(result.error))
        }
    }

    async function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this Karyawan?")) {
            const result = await deleteKaryawan(id)
            if (!result.success) alert(result.error)
        }
    }

    const handleOpenEdit = (data: any) => {
        setEditData({
            ...data,
            join_date: new Date(data.join_date).toISOString().split('T')[0]
        })
        setSelectedPosition(data.position)
        setOpen(true)
    }

    const handleOpenNew = () => {
        setEditData(null)
        setSelectedPosition("Sopir")
        setOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Daftar Karyawan</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenNew}><Plus className="w-4 h-4 mr-2" /> Tambah Karyawan</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editData ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</DialogTitle>
                        </DialogHeader>
                        <form key={editData?.id || 'new'} action={handleSubmit} className="space-y-4 mt-4">
                            {editData && <input type="hidden" name="id" value={editData.id} />}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Karyawan *</Label>
                                <Input id="name" name="name" defaultValue={editData?.name} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="position">Posisi *</Label>
                                    <Select name="position" value={selectedPosition} onValueChange={setSelectedPosition}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Posisi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sopir">Sopir</SelectItem>
                                            <SelectItem value="Operator">Operator</SelectItem>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                            <SelectItem value="AdminLogistik">Admin Logistik & Peralatan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select name="status" defaultValue={editData?.status || "Active"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Aktif</SelectItem>
                                            <SelectItem value="Inactive">Non-Aktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="join_date">Tanggal Bergabung *</Label>
                                <Input id="join_date" name="join_date" type="date" defaultValue={editData?.join_date} required />
                            </div>

                            {userRole === "SuperAdminBP" && selectedPosition !== "AdminLogistik" && (
                                <div className="space-y-2">
                                    <Label htmlFor="locationId">Cabang (Lokasi) *</Label>
                                    <Select name="locationId" defaultValue={editData?.locationId || ""}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Cabang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map((loc) => (
                                                <SelectItem key={loc.id} value={loc.id}>
                                                    {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Button type="submit" className="w-full mt-4">Simpan</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <SimpleDataTable
                data={initialData}
                searchKeys={["name", "position"]}
                searchPlaceholder="Cari nama atau posisi..."
            >
                {(items, sortConfig, toggleSort) => (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                {userRole === "SuperAdminBP" && (
                                    <TableHead>
                                        <SortableHeader label="Cabang" sortKey="locationId" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                )}
                                <TableHead>
                                    <SortableHeader label="Nama" sortKey="name" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Posisi" sortKey="position" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Tgl Gabung" sortKey="join_date" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={userRole === "SuperAdminBP" ? 6 : 5} className="text-center text-muted-foreground h-24">
                                        Data tidak ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    {userRole === "SuperAdminBP" && (
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                {item.location?.name || "N/A"}
                                            </span>
                                        </TableCell>
                                    )}
                                    <TableCell className="font-medium text-sm text-primary">{item.name}</TableCell>
                                    <TableCell className="text-sm">{item.position}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.status === 'Active' ? 'Aktif' : 'Non-Aktif'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm">{new Date(item.join_date).toLocaleDateString('id-ID')}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(item)}>
                                                <Pencil className="w-4 h-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </SimpleDataTable>
        </div>
    )
}
