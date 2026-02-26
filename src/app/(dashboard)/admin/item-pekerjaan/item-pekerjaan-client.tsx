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
import { Plus, Pencil, Trash2 } from "lucide-react"
import { createWorkItem, updateWorkItem, deleteWorkItem } from "./actions"

export function ItemPekerjaanClient({ initialData }: { initialData: any[] }) {
    const [open, setOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)

    async function handleSubmit(formData: FormData) {
        let result;
        if (editData) {
            result = await updateWorkItem(editData.id, formData)
        } else {
            result = await createWorkItem(formData)
        }

        if (result.success) {
            setOpen(false)
            setEditData(null)
        } else {
            alert("Error: " + JSON.stringify(result.error))
        }
    }

    async function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this Item Pekerjaan?")) {
            const result = await deleteWorkItem(id)
            if (!result.success) alert(result.error)
        }
    }

    const handleOpenEdit = (data: any) => {
        setEditData(data)
        setOpen(true)
    }

    const handleOpenNew = () => {
        setEditData(null)
        setOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Daftar Item Pekerjaan</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenNew}><Plus className="w-4 h-4 mr-2" /> Tambah Item</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editData ? 'Edit Item Pekerjaan' : 'Tambah Item Pekerjaan Baru'}</DialogTitle>
                        </DialogHeader>
                        <form key={editData?.id || 'new'} action={handleSubmit} className="space-y-4 mt-4">
                            {editData && <input type="hidden" name="id" value={editData.id} />}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Item Pekerjaan *</Label>
                                <Input id="name" name="name" placeholder="Misal: Rigid, Kolom, Sloof" defaultValue={editData?.name} required />
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
                            <TableHead>Nama Item Pekerjaan</TableHead>
                            <TableHead className="w-[100px]">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">Belum ada data item pekerjaan.</TableCell>
                            </TableRow>
                        )}
                        {initialData.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium text-primary">{item.name}</TableCell>
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
