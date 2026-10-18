"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { createLocation, updateLocation, deleteLocation } from "./actions"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"

export function CabangClient({ initialData }: { initialData: any[] }) {
    const [open, setOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [selectedType, setSelectedType] = useState<string>("BATCHING_PLANT")

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
        setSelectedType(cabang.type || "BATCHING_PLANT")
        setOpen(true)
    }

    const handleOpenNew = () => {
        setEditData(null)
        setSelectedType("BATCHING_PLANT")
        setOpen(true)
    }

    const renderTypeBadge = (type?: string) => {
        switch (type) {
            case "STONE_CRUSHER":
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">Stone Crusher (Quarry)</Badge>
            case "HEAD_OFFICE":
                return <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200">Head Office</Badge>
            case "BATCHING_PLANT":
            default:
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">Batching Plant</Badge>
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center">
                <Button onClick={handleOpenNew}><Plus className="w-4 h-4 mr-2" /> Tambah Cabang</Button>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editData ? 'Edit Cabang' : 'Tambah Cabang Baru'}</DialogTitle>
                        </DialogHeader>
                        <form key={editData?.id || 'new'} action={handleSubmit} className="space-y-4 mt-4">
                            {editData && <input type="hidden" name="id" value={editData.id} />}
                            <input type="hidden" name="type" value={selectedType} />
                            
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Cabang *</Label>
                                <Input id="name" name="name" defaultValue={editData?.name} placeholder="Misal: Stone Crusher Harapan / BP Youtefa" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="branch-type">Tipe Operasional *</Label>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger id="branch-type" className="w-full">
                                        <SelectValue placeholder="Pilih Tipe Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BATCHING_PLANT">Batching Plant (BP)</SelectItem>
                                        <SelectItem value="STONE_CRUSHER">Stone Crusher (Non-BP / Quarry)</SelectItem>
                                        <SelectItem value="HEAD_OFFICE">Head Office / Kantor Pusat</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground">
                                    {selectedType === "STONE_CRUSHER"
                                        ? "Khusus operasional stone crusher (pemecah batu, alat berat quarry, cold bin)."
                                        : selectedType === "BATCHING_PLANT"
                                        ? "Cabang produksi ready mix beton batching plant."
                                        : "Kantor pusat manajemen & administrasi."}
                                </p>
                            </div>

                            <Button type="submit" className="w-full mt-4">Simpan</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <SimpleDataTable
                data={initialData}
                searchKeys={["name", "type"]}
                searchPlaceholder="Cari nama atau tipe cabang..."
            >
                {(items, sortConfig, toggleSort) => (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="w-[140px]">
                                    <SortableHeader label="ID Cabang" sortKey="id" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Nama Cabang" sortKey="name" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="w-[200px]">
                                    <SortableHeader label="Tipe Cabang" sortKey="type" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="w-[100px] text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        Data tidak ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.map((cabang) => (
                                <TableRow key={cabang.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-mono text-[10px] text-muted-foreground">{cabang.id.substring(0, 8)}...</TableCell>
                                    <TableCell className="font-medium text-sm">{cabang.name}</TableCell>
                                    <TableCell>{renderTypeBadge(cabang.type)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
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

