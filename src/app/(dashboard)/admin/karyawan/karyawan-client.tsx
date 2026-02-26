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

export function KaryawanClient({ initialData }: { initialData: any[] }) {
    const [open, setOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)

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
        setOpen(true)
    }

    const handleOpenNew = () => {
        setEditData(null)
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
                                    <Select name="position" defaultValue={editData?.position || "Sopir"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Posisi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sopir">Sopir</SelectItem>
                                            <SelectItem value="Operator">Operator</SelectItem>
                                            <SelectItem value="Admin">Admin</SelectItem>
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

                            <Button type="submit" className="w-full mt-4">Simpan</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Posisi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tgl Gabung</TableHead>
                            <TableHead className="w-[100px]">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">Belum ada data karyawan.</TableCell>
                            </TableRow>
                        )}
                        {initialData.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium text-primary">{item.name}</TableCell>
                                <TableCell>{item.position}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.status}
                                    </span>
                                </TableCell>
                                <TableCell>{new Date(item.join_date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
                                            <Pencil className="w-4 h-4 text-slate-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
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
    )
}
