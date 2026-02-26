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
import { createMutu, updateMutu, deleteMutu } from "./actions"

export function MutuClient({ initialData }: { initialData: any[] }) {
    const [open, setOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)

    async function handleSubmit(formData: FormData) {
        let result;
        if (editData) {
            result = await updateMutu(editData.id, formData)
        } else {
            result = await createMutu(formData)
        }

        if (result.success) {
            setOpen(false)
            setEditData(null)
        } else {
            alert("Error: " + JSON.stringify(result.error))
        }
    }

    async function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this Mutu Beton?")) {
            const result = await deleteMutu(id)
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
                <h2 className="text-xl font-bold tracking-tight">Daftar Mutu Beton</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenNew}><Plus className="w-4 h-4 mr-2" /> Tambah Mutu</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editData ? 'Edit Mutu Beton' : 'Tambah Mutu Beton Baru'}</DialogTitle>
                        </DialogHeader>
                        <form key={editData?.id || 'new'} action={handleSubmit} className="space-y-4 mt-4">
                            {editData && <input type="hidden" name="id" value={editData.id} />}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Mutu (K-xxx) *</Label>
                                <Input id="name" name="name" defaultValue={editData?.name} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="composition_sand">Pasir (Kg) *</Label>
                                    <Input id="composition_sand" name="composition_sand" type="number" step="0.1" defaultValue={editData?.composition_sand ?? 0} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="composition_cement">Semen (Kg) *</Label>
                                    <Input id="composition_cement" name="composition_cement" type="number" step="0.1" defaultValue={editData?.composition_cement ?? 0} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="composition_stone_05">Batu 0.5 (Kg) *</Label>
                                    <Input id="composition_stone_05" name="composition_stone_05" type="number" step="0.1" defaultValue={editData?.composition_stone_05 ?? 0} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="composition_stone_12">Batu 1.2 (Kg) *</Label>
                                    <Input id="composition_stone_12" name="composition_stone_12" type="number" step="0.1" defaultValue={editData?.composition_stone_12 ?? 0} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="composition_stone_23">Batu 2.3 (Kg) *</Label>
                                    <Input id="composition_stone_23" name="composition_stone_23" type="number" step="0.1" defaultValue={editData?.composition_stone_23 ?? 0} required />
                                </div>
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
                            <TableHead>Nama Mutu</TableHead>
                            <TableHead>Pasir</TableHead>
                            <TableHead>Batu 0.5</TableHead>
                            <TableHead>Batu 1.2</TableHead>
                            <TableHead>Batu 2.3</TableHead>
                            <TableHead>Semen</TableHead>
                            <TableHead className="w-[100px]">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground h-24">Belum ada data mutu beton.</TableCell>
                            </TableRow>
                        )}
                        {initialData.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium text-primary">{item.name}</TableCell>
                                <TableCell>{item.composition_sand} Kg</TableCell>
                                <TableCell>{item.composition_stone_05} Kg</TableCell>
                                <TableCell>{item.composition_stone_12} Kg</TableCell>
                                <TableCell>{item.composition_stone_23} Kg</TableCell>
                                <TableCell>{item.composition_cement} Kg</TableCell>
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
