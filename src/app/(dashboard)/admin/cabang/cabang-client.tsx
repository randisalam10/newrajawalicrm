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
import { createLocation, updateLocation, deleteLocation } from "./actions"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"

export function CabangClient({ initialData }: { initialData: any[] }) {
    const [open, setOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)

    async function handleSubmit(formData: FormData) {
        let result;
        if (editData) {
            result = await updateLocation(editData.id, formData)
        } else {
            result = await createLocation(formData)
        }

        if (result.success) {
            setOpen(false)
            setEditData(null)
        } else {
            alert("Error: " + JSON.stringify(result.error))
        }
    }

    async function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this cabang?")) {
            const result = await deleteLocation(id)
            if (!result.success) alert(result.error)
        }
    }

    const handleOpenEdit = (cabang: any) => {
        setEditData(cabang)
        setOpen(true)
    }

    const handleOpenNew = () => {
        setEditData(null)
        setOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Daftar Cabang</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenNew}><Plus className="w-4 h-4 mr-2" /> Tambah Cabang</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editData ? 'Edit Cabang' : 'Tambah Cabang Baru'}</DialogTitle>
                        </DialogHeader>
                        <form key={editData?.id || 'new'} action={handleSubmit} className="space-y-4 mt-4">
                            {editData && <input type="hidden" name="id" value={editData.id} />}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Cabang *</Label>
                                <Input id="name" name="name" defaultValue={editData?.name} required />
                            </div>
                            <Button type="submit" className="w-full mt-4">Simpan</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <SimpleDataTable
                data={initialData}
                searchKeys={["name"]}
                searchPlaceholder="Cari nama cabang..."
            >
                {(items, sortConfig, toggleSort) => (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="w-[150px]">
                                    <SortableHeader label="ID Cabang" sortKey="id" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Nama Cabang" sortKey="name" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                        Data tidak ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.map((cabang) => (
                                <TableRow key={cabang.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-mono text-[10px] text-muted-foreground">{cabang.id.substring(0, 8)}...</TableCell>
                                    <TableCell className="font-medium text-sm">{cabang.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(cabang)}>
                                                <Pencil className="w-4 h-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(cabang.id)}>
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
