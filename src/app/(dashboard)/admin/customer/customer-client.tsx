"use client"

import { useState, useActionState } from "react"
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
import { createCustomer, updateCustomer, deleteCustomer } from "./actions"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"

export function CustomerClient({ initialData, locations, userRole }: { initialData: any[], locations: any[], userRole: string }) {
    const [open, setOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)

    async function handleSubmit(formData: FormData) {
        let result;
        if (editData) {
            result = await updateCustomer(editData.id, formData)
        } else {
            result = await createCustomer(formData)
        }

        if (result.success) {
            setOpen(false)
            setEditData(null)
        } else {
            alert("Error: " + JSON.stringify(result.error))
        }
    }

    async function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this customer?")) {
            const result = await deleteCustomer(id)
            if (!result.success) alert(result.error)
        }
    }

    const handleOpenEdit = (customer: any) => {
        setEditData(customer)
        setOpen(true)
    }

    const handleOpenNew = () => {
        setEditData(null)
        setOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Daftar Customer</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenNew}><Plus className="w-4 h-4 mr-2" /> Tambah Customer</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editData ? 'Edit Customer' : 'Tambah Customer Baru'}</DialogTitle>
                        </DialogHeader>
                        <form key={editData?.id || 'new'} action={handleSubmit} className="space-y-4 mt-4">
                            {editData && <input type="hidden" name="id" value={editData.id} />}
                            <div className="space-y-2">
                                <Label htmlFor="customer_name">Nama Customer *</Label>
                                <Input id="customer_name" name="customer_name" defaultValue={editData?.customer_name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="project_name">Nama Proyek *</Label>
                                <Input id="project_name" name="project_name" defaultValue={editData?.project_name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Lokasi Proyek *</Label>
                                <Input id="address" name="address" defaultValue={editData?.address} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="default_distance">Jarak (Km) *</Label>
                                    <Input id="default_distance" name="default_distance" type="number" step="0.1" defaultValue={editData?.default_distance} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax_ppn">PPN (%) *</Label>
                                    <Input id="tax_ppn" name="tax_ppn" type="number" step="0.1" defaultValue={editData?.tax_ppn ?? 0} required />
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
                searchKeys={["customer_name", "project_name", "address"]}
                searchPlaceholder="Cari customer, proyek, atau alamat..."
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
                                    <SortableHeader label="Nama Customer" sortKey="customer_name" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Proyek" sortKey="project_name" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Lokasi" sortKey="address" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Jarak" sortKey="default_distance" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>PPN (%)</TableHead>
                                <TableHead className="w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={userRole === "SuperAdminBP" ? 7 : 6} className="text-center text-muted-foreground h-24">
                                        Data tidak ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.map((cust) => (
                                <TableRow key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                                    {userRole === "SuperAdminBP" && (
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                {cust.location?.name || "N/A"}
                                            </span>
                                        </TableCell>
                                    )}
                                    <TableCell className="font-medium text-sm">{cust.customer_name}</TableCell>
                                    <TableCell className="text-sm">{cust.project_name}</TableCell>
                                    <TableCell className="text-sm">{cust.address}</TableCell>
                                    <TableCell className="text-sm">{cust.default_distance} Km</TableCell>
                                    <TableCell className="text-sm">{cust.tax_ppn}%</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(cust)}>
                                                <Pencil className="w-4 h-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(cust.id)}>
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
