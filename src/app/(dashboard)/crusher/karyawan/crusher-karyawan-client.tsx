"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { EmployeeOption } from "../types"
import { CrusherPageHeader } from "../components/crusher-page-header"
import { quickAddEmployee, updateCrusherEmployee, getCrusherEmployees } from "../actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Users, UserPlus, Search, ExternalLink, Loader2, Pencil, CheckCircle2 } from "lucide-react"

type Props = {
    initialEmployees: EmployeeOption[]
    locationId: string
    locationName: string
    canAccessHQ: boolean
    locations?: { id: string; name: string }[]
}

export function CrusherKaryawanClient({
    initialEmployees,
    locationId,
    locationName,
    canAccessHQ,
    locations,
}: Props) {
    const [employees, setEmployees] = useState<EmployeeOption[]>(initialEmployees)
    const [search, setSearch] = useState("")
    const [filterPosition, setFilterPosition] = useState("ALL")
    const [isPending, startTransition] = useTransition()

    // Modal Quick Add
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newName, setNewName] = useState("")
    const [newPosition, setNewPosition] = useState<"Sopir" | "Operator" | "Helper">("Sopir")
    const [newDriverCat, setNewDriverCat] = useState("Sopir Dump Truck")

    // Modal Edit
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editId, setEditId] = useState("")
    const [editName, setEditName] = useState("")
    const [editPosition, setEditPosition] = useState<"Sopir" | "Operator" | "Helper">("Sopir")
    const [editDriverCat, setEditDriverCat] = useState("Sopir Dump Truck")
    const [editStatus, setEditStatus] = useState<"Active" | "Inactive">("Active")

    const refreshData = () => {
        startTransition(async () => {
            try {
                const updated = await getCrusherEmployees(locationId)
                setEmployees(updated)
            } catch (err) {
                console.error("Gagal refresh data karyawan", err)
            }
        })
    }

    const handleSaveEmployee = () => {
        if (!newName.trim()) {
            toast.error("Nama lengkap karyawan wajib diisi")
            return
        }

        startTransition(async () => {
            try {
                const res = await quickAddEmployee({
                    name: newName.trim(),
                    position: newPosition,
                    locationId,
                    driverCategoryName: newPosition === "Sopir" ? newDriverCat : undefined,
                })

                toast.success(`Karyawan "${res.employee.name}" berhasil ditambahkan ke Master Employee!`)
                setNewName("")
                setIsModalOpen(false)
                refreshData()
            } catch (err: any) {
                toast.error(err.message || "Gagal menyimpan karyawan")
            }
        })
    }

    const openEditDialog = (e: EmployeeOption) => {
        setEditId(e.id)
        setEditName(e.name)
        setEditPosition((e.position as any) || "Sopir")
        setEditDriverCat(e.driverCategoryName || "Sopir Dump Truck")
        setEditStatus((e.status as any) || "Active")
        setIsEditOpen(true)
    }

    const handleUpdateEmployee = () => {
        if (!editName.trim()) {
            toast.error("Nama lengkap karyawan wajib diisi")
            return
        }

        startTransition(async () => {
            try {
                await updateCrusherEmployee({
                    id: editId,
                    name: editName.trim(),
                    position: editPosition,
                    driverCategoryName: editPosition === "Sopir" ? editDriverCat : undefined,
                    status: editStatus,
                })

                toast.success(`Data karyawan "${editName}" berhasil diperbarui!`)
                setIsEditOpen(false)
                refreshData()
            } catch (err: any) {
                toast.error(err.message || "Gagal memperbarui data karyawan")
            }
        })
    }

    const filteredEmployees = employees.filter((e) => {
        const matchSearch = e.name.toLowerCase().includes(search.toLowerCase())
        if (!matchSearch) return false
        if (filterPosition === "ALL") return true
        if (filterPosition === "SOPIR") return e.position === "Sopir"
        if (filterPosition === "OPERATOR") return e.position === "Operator"
        if (filterPosition === "HELPER") return e.position === "Helper"
        return true
    })

    const countSopir = employees.filter((e) => e.position === "Sopir").length
    const countOperator = employees.filter((e) => e.position === "Operator").length
    const countHelper = employees.filter((e) => e.position === "Helper").length

    return (
        <div className="space-y-4 w-full">
            <CrusherPageHeader
                title="Master Karyawan & Sopir Crusher"
                subtitle="Terhubung langsung dengan master data Employee New Rajawali untuk sopir dump truck, operator stone crusher, dan kru lapangan"
                selectedDate=""
                locationName={locationName}
                locations={locations}
                selectedLocationId={locationId}
            />

            {/* Quick Action & HQ Link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 gap-1.5"
                    >
                        <UserPlus className="h-4 w-4" />
                        Shortcut Tambah Sopir / Kru Baru
                    </Button>
                </div>

                {canAccessHQ && (
                    <Link
                        href="/admin/karyawan"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors w-fit"
                    >
                        <span>Buka Master Karyawan Pusat (HQ)</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                )}
            </div>

            {/* Quick Stats Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[11px] font-medium text-slate-500">Total Karyawan SC</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">{employees.length} Orang</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[11px] font-medium text-slate-500">Sopir Dump Truck</div>
                    <div className="text-xl font-bold text-emerald-700 mt-1">{countSopir} Orang</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[11px] font-medium text-slate-500">Operator Mesin & Alat</div>
                    <div className="text-xl font-bold text-blue-700 mt-1">{countOperator} Orang</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[11px] font-medium text-slate-500">Helper Harian</div>
                    <div className="text-xl font-bold text-amber-700 mt-1">{countHelper} Orang</div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="Cari nama sopir, operator, atau helper..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-9 text-xs"
                    />
                </div>
                <Select value={filterPosition} onValueChange={setFilterPosition}>
                    <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
                        <SelectValue placeholder="Semua Posisi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL" className="text-xs">Semua Posisi</SelectItem>
                        <SelectItem value="SOPIR" className="text-xs">Sopir</SelectItem>
                        <SelectItem value="OPERATOR" className="text-xs">Operator</SelectItem>
                        <SelectItem value="HELPER" className="text-xs">Helper</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Employee List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {filteredEmployees.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 italic">
                        Tidak ada data karyawan yang sesuai filter.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredEmployees.map((e) => (
                            <div
                                key={e.id}
                                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900">{e.name}</span>
                                        <Badge
                                            className={`text-[10px] font-semibold border ${
                                                e.position === "Sopir"
                                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                    : e.position === "Operator"
                                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                                    : e.position === "Helper"
                                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                                    : "bg-slate-50 text-slate-700 border-slate-200"
                                            }`}
                                        >
                                            {e.position}
                                        </Badge>
                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                                            {e.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                                        {e.driverCategoryName && (
                                            <span>Kategori: <strong className="text-slate-700">{e.driverCategoryName}</strong></span>
                                        )}
                                        {e.locationName && (
                                            <span className="text-slate-400">• Lokasi: {e.locationName}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditDialog(e)}
                                        className="h-7 px-2.5 text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50 border-slate-200 gap-1"
                                    >
                                        <Pencil className="h-3 w-3" />
                                        <span>Edit</span>
                                    </Button>
                                    <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50 border-slate-200">
                                        Master Employee
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Shortcut Tambah Karyawan / Sopir */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md w-full p-4">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-emerald-600" />
                            Tambah Personel ke Master Karyawan SC
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs">Nama Lengkap *</Label>
                            <Input
                                placeholder="Contoh: Hendrik, Yohanis, Dani W"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Posisi / Jabatan</Label>
                            <Select
                                value={newPosition}
                                onValueChange={(val: "Sopir" | "Operator" | "Helper") => setNewPosition(val)}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sopir" className="text-xs">Sopir (Dump Truck / Armada)</SelectItem>
                                    <SelectItem value="Operator" className="text-xs">Operator (Crusher / Loader / Excavator)</SelectItem>
                                    <SelectItem value="Helper" className="text-xs">Helper (Tenaga Harian)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {newPosition === "Sopir" && (
                            <div className="space-y-1">
                                <Label className="text-xs">Kategori Sopir</Label>
                                <Select value={newDriverCat} onValueChange={setNewDriverCat}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Sopir Dump Truck" className="text-xs">Sopir Dump Truck</SelectItem>
                                        <SelectItem value="Sopir Dump Truck Besar" className="text-xs">Sopir Dump Truck Besar (8 m³)</SelectItem>
                                        <SelectItem value="Sopir Dump Truck Kecil" className="text-xs">Sopir Dump Truck Kecil (4 m³)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsModalOpen(false)}
                            className="h-8 text-xs flex-1"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveEmployee}
                            disabled={isPending}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                        >
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Simpan ke Master"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Karyawan */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md w-full p-4">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                            <Pencil className="h-4 w-4 text-blue-600" />
                            Edit Data Personel Master
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs">Nama Lengkap *</Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Posisi / Jabatan</Label>
                            <Select
                                value={editPosition}
                                onValueChange={(val: "Sopir" | "Operator" | "Helper") => setEditPosition(val)}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sopir" className="text-xs">Sopir (Dump Truck / Armada)</SelectItem>
                                    <SelectItem value="Operator" className="text-xs">Operator (Crusher / Loader / Excavator)</SelectItem>
                                    <SelectItem value="Helper" className="text-xs">Helper (Tenaga Harian)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {editPosition === "Sopir" && (
                            <div className="space-y-1">
                                <Label className="text-xs">Kategori Sopir</Label>
                                <Select value={editDriverCat} onValueChange={setEditDriverCat}>
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Sopir Dump Truck" className="text-xs">Sopir Dump Truck</SelectItem>
                                        <SelectItem value="Sopir Dump Truck Besar" className="text-xs">Sopir Dump Truck Besar (8 m³)</SelectItem>
                                        <SelectItem value="Sopir Dump Truck Kecil" className="text-xs">Sopir Dump Truck Kecil (4 m³)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label className="text-xs">Status Karyawan</Label>
                            <Select
                                value={editStatus}
                                onValueChange={(val: "Active" | "Inactive") => setEditStatus(val)}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active" className="text-xs">Aktif</SelectItem>
                                    <SelectItem value="Inactive" className="text-xs">Non-Aktif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditOpen(false)}
                            className="h-8 text-xs flex-1"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleUpdateEmployee}
                            disabled={isPending}
                            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-1"
                        >
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Perbarui Data"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
