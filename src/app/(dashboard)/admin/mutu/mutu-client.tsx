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
import { createMutu, updateMutu, deleteMutu } from "./actions"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"

export function MutuClient({ initialData, locations, userRole }: { initialData: any[], locations: any[], userRole: string }) {
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

                            {userRole === "SuperAdminBP" && (
                                <div className="space-y-2">
                                    <Label htmlFor="locationId">Cabang (Lokasi) *</Label>
                                    <Select name="locationId" defaultValue={editData?.locationId || ""}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Cabang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map((loc: any) => (
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
                searchKeys={["name"]}
                searchPlaceholder="Cari nama mutu..."
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
                                    <SortableHeader label="Nama Mutu" sortKey="name" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Pasir" sortKey="composition_sand" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Batu 0.5" sortKey="composition_stone_05" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Batu 1.2" sortKey="composition_stone_12" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Batu 2.3" sortKey="composition_stone_23" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Semen" sortKey="composition_cement" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={userRole === "SuperAdminBP" ? 8 : 7} className="text-center text-muted-foreground h-24">
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
                                    <TableCell className="text-sm">{item.composition_sand} Kg</TableCell>
                                    <TableCell className="text-sm">{item.composition_stone_05} Kg</TableCell>
                                    <TableCell className="text-sm">{item.composition_stone_12} Kg</TableCell>
                                    <TableCell className="text-sm">{item.composition_stone_23} Kg</TableCell>
                                    <TableCell className="text-sm font-semibold text-slate-700">{item.composition_cement} Kg</TableCell>
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
