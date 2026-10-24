"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { VehicleOption } from "../types"
import { CrusherPageHeader } from "../components/crusher-page-header"
import { quickAddVehicle, updateCrusherVehicle, getCrusherVehicles, deleteCrusherVehicle } from "../actions"
import { VehicleUsageDialog } from "@/app/(dashboard)/admin/kendaraan/components/vehicle-usage-dialog"
import { VehicleDeleteDialog } from "@/app/(dashboard)/admin/kendaraan/components/vehicle-delete-dialog"
import { VehicleAuditLogDialog } from "@/app/(dashboard)/admin/kendaraan/components/vehicle-audit-log-dialog"
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
import { Truck, Plus, Search, ExternalLink, Loader2, Pencil, Trash2, History, FileText, CheckCircle2 } from "lucide-react"

type Props = {
    initialVehicles: VehicleOption[]
    locationId: string
    locationName: string
    canAccessHQ: boolean
    locations?: { id: string; name: string }[]
}

export function CrusherKendaraanClient({
    initialVehicles,
    locationId,
    locationName,
    canAccessHQ,
    locations,
}: Props) {
    const [vehicles, setVehicles] = useState<VehicleOption[]>(initialVehicles)
    const [search, setSearch] = useState("")
    const [filterCategory, setFilterCategory] = useState("ALL")
    const [isPending, startTransition] = useTransition()

    // Modal Quick Add
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newPlate, setNewPlate] = useState("")
    const [newCategory, setNewCategory] = useState("Dump Truck")
    const [newDumpSize, setNewDumpSize] = useState<"BESAR" | "KECIL">("BESAR")
    const [newMerk, setNewMerk] = useState("")

    // Modal Edit
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editId, setEditId] = useState("")
    const [editPlate, setEditPlate] = useState("")
    const [editCode, setEditCode] = useState("")
    const [editCategory, setEditCategory] = useState("Dump Truck")
    const [editDumpSize, setEditDumpSize] = useState<"BESAR" | "KECIL">("BESAR")
    const [editMerk, setEditMerk] = useState("")
    const [editMeterType, setEditMeterType] = useState<"KM" | "HM">("KM")

    // Dialogs: Catatan Riwayat, Safe Delete & Audit Log
    const [selectedVehicleForUsage, setSelectedVehicleForUsage] = useState<VehicleOption | null>(null)
    const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false)
    const [selectedVehicleForDelete, setSelectedVehicleForDelete] = useState<VehicleOption | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isAuditLogOpen, setIsAuditLogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const refreshData = () => {
        startTransition(async () => {
            try {
                const updated = await getCrusherVehicles(locationId)
                setVehicles(updated)
            } catch (err) {
                console.error("Gagal refresh data kendaraan", err)
            }
        })
    }

    const handleDeleteVehicle = async (id: string, reason: string) => {
        setIsDeleting(true)
        try {
            await deleteCrusherVehicle(id, reason)
            toast.success("Armada berhasil dihapus dan tercatat di Audit Log!")
            refreshData()
        } catch (err: any) {
            toast.error(err.message || "Gagal menghapus armada kendaraan")
        } finally {
            setIsDeleting(false)
        }
    }

    const openEditDialog = (v: VehicleOption) => {
        setEditId(v.id)
        setEditPlate(v.plate_number)
        setEditCode(v.code || "")
        setEditCategory(v.categoryName || "Dump Truck")
        setEditDumpSize((v.dump_truck_size as any) || "BESAR")
        setEditMerk(v.merk_model || "")
        setEditMeterType((v.meter_type as any) || (v.categoryName?.toLowerCase().includes("loader") || v.categoryName?.toLowerCase().includes("excavator") || v.categoryName?.toLowerCase().includes("genset") || v.categoryName?.toLowerCase().includes("crusher") ? "HM" : "KM"))
        setIsEditOpen(true)
    }

    const handleUpdateVehicle = () => {
        if (!editPlate.trim()) {
            toast.error("Plat nomor / kode kendaraan wajib diisi")
            return
        }

        startTransition(async () => {
            try {
                await updateCrusherVehicle({
                    id: editId,
                    plate_number: editPlate.trim(),
                    code: editCode.trim() || undefined,
                    dump_truck_size: editCategory === "Dump Truck" ? editDumpSize : null,
                    capacity_cubic: editCategory === "Dump Truck" ? (editDumpSize === "KECIL" ? 4.0 : 8.0) : 0,
                    categoryName: editCategory,
                    merk_model: editMerk.trim() || undefined,
                    meter_type: editMeterType,
                })

                toast.success(`Data armada "${editPlate}" berhasil diperbarui!`)
                setIsEditOpen(false)
                refreshData()
            } catch (err: any) {
                toast.error(err.message || "Gagal memperbarui data kendaraan")
            }
        })
    }

    const handleSaveVehicle = () => {
        if (!newPlate.trim()) {
            toast.error("Plat nomor / kode kendaraan wajib diisi")
            return
        }

        startTransition(async () => {
            try {
                const res = await quickAddVehicle({
                    plate_number: newPlate.trim(),
                    dump_truck_size: newCategory === "Dump Truck" ? newDumpSize : undefined,
                    capacity_cubic: newCategory === "Dump Truck" ? (newDumpSize === "KECIL" ? 4.0 : 8.0) : 0,
                    categoryName: newCategory,
                    locationId,
                    merk_model: newMerk.trim() || undefined,
                })

                toast.success(`Armada "${res.vehicle.plate_number}" berhasil disimpan ke Master Kendaraan!`)
                setNewPlate("")
                setNewMerk("")
                setIsModalOpen(false)
                refreshData()
            } catch (err: any) {
                toast.error(err.message || "Gagal menyimpan kendaraan")
            }
        })
    }

    const filteredVehicles = vehicles.filter((v) => {
        const matchSearch =
            v.plate_number.toLowerCase().includes(search.toLowerCase()) ||
            (v.code && v.code.toLowerCase().includes(search.toLowerCase())) ||
            (v.merk_model && v.merk_model.toLowerCase().includes(search.toLowerCase()))

        if (!matchSearch) return false
        if (filterCategory === "ALL") return true
        if (filterCategory === "DT") return (v.categoryName || "").toLowerCase().includes("dump")
        if (filterCategory === "LOADER") return (v.categoryName || "").toLowerCase().includes("loader")
        if (filterCategory === "EXCAVATOR") return (v.categoryName || "").toLowerCase().includes("excavator")
        if (filterCategory === "GENSET") return (v.categoryName || "").toLowerCase().includes("genset")
        if (filterCategory === "CRUSHER") return (v.categoryName || "").toLowerCase().includes("crusher")
        return true
    })

    const countDtBesar = vehicles.filter((v) => v.dump_truck_size === "BESAR").length
    const countDtKecil = vehicles.filter((v) => v.dump_truck_size === "KECIL").length
    const countAlatBerat = vehicles.filter((v) => !v.dump_truck_size).length

    return (
        <div className="space-y-4 w-full">
            <CrusherPageHeader
                title="Master Kendaraan & Alat Crusher"
                subtitle="Terhubung langsung dengan master armada Vehicle New Rajawali untuk dump truck, wheel loader, excavator, dan genset"
                selectedDate=""
                locationName={locationName}
                locations={locations}
                selectedLocationId={locationId}
            />

            {/* Quick Action & HQ Link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Armada / Alat Crusher Baru
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAuditLogOpen(true)}
                        className="h-9 text-xs text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border-slate-200 gap-1.5"
                    >
                        <History className="h-4 w-4 text-indigo-600" />
                        <span>Log Riwayat Hapus</span>
                    </Button>
                </div>

                {canAccessHQ && (
                    <Link
                        href="/admin/kendaraan"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors w-fit"
                    >
                        <span>Buka Master Kendaraan Pusat (HQ)</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                )}
            </div>

            {/* Quick Stats Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[11px] font-medium text-slate-500">Total Armada Terdata</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">{vehicles.length} Unit</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[11px] font-medium text-slate-500">Dump Truck Besar (8 m³)</div>
                    <div className="text-xl font-bold text-emerald-700 mt-1">{countDtBesar} Unit</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[11px] font-medium text-slate-500">Dump Truck Kecil (4 m³)</div>
                    <div className="text-xl font-bold text-amber-700 mt-1">{countDtKecil} Unit</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[11px] font-medium text-slate-500">Alat Berat / Mesin</div>
                    <div className="text-xl font-bold text-blue-700 mt-1">
                        {countAlatBerat} Unit
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="Cari plat nomor, kode unit, atau tipe armada..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-9 text-xs"
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-48 h-9 text-xs" suppressHydrationWarning>
                        <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL" className="text-xs">Semua Kategori</SelectItem>
                        <SelectItem value="DT" className="text-xs">Dump Truck</SelectItem>
                        <SelectItem value="LOADER" className="text-xs">Wheel Loader</SelectItem>
                        <SelectItem value="EXCAVATOR" className="text-xs">Excavator</SelectItem>
                        <SelectItem value="GENSET" className="text-xs">Genset</SelectItem>
                        <SelectItem value="CRUSHER" className="text-xs">Mesin Crusher</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Vehicle List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {filteredVehicles.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 italic">
                        Tidak ada armada kendaraan yang sesuai filter.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredVehicles.map((v) => (
                            <div
                                key={v.id}
                                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors"
                            >
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900">{v.plate_number}</span>
                                        {v.code && (
                                            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                                                {v.code}
                                            </Badge>
                                        )}
                                        <Badge
                                            className={`text-[10px] font-semibold border ${
                                                (v.categoryName || "").toLowerCase().includes("dump")
                                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                    : "bg-blue-50 text-blue-800 border-blue-200"
                                            }`}
                                        >
                                            {v.categoryName || "Dump Truck"}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50 border-slate-200 font-mono">
                                            {v.meter_type || "KM"}
                                        </Badge>

                                        {/* Badge Riwayat Catatan Transaksi */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedVehicleForUsage(v)
                                                setIsUsageDialogOpen(true)
                                            }}
                                            className="inline-flex items-center gap-1 group text-left cursor-pointer transition-transform hover:scale-105"
                                            title="Klik untuk melihat rincian catatan riwayat transaksi"
                                        >
                                            {(v.usageCounts?.total || 0) > 0 ? (
                                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors text-[10px] font-semibold gap-1">
                                                    <FileText className="w-3 h-3 text-blue-500" />
                                                    <span>{v.usageCounts?.total} Catatan</span>
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors text-[10px] font-semibold gap-1">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    <span>0 Catatan (Kosong)</span>
                                                </Badge>
                                            )}
                                        </button>
                                    </div>
                                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                                        {v.dump_truck_size && (
                                            <span>
                                                Ukuran:{" "}
                                                <strong className="text-slate-800">
                                                    DT {v.dump_truck_size === "BESAR" ? "Besar (8 m³)" : "Kecil (4 m³)"}
                                                </strong>
                                            </span>
                                        )}
                                        {v.capacity_cubic && !v.dump_truck_size && (
                                            <span>Kapasitas: {v.capacity_cubic} m³</span>
                                        )}
                                        {v.merk_model && <span>• {v.merk_model}</span>}
                                        {v.locationName && (
                                            <span className="text-slate-400">• Lokasi: {v.locationName}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-center">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditDialog(v)}
                                        className="h-7 px-2.5 text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50 border-slate-200 gap-1"
                                    >
                                        <Pencil className="h-3 w-3" />
                                        <span>Edit</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedVehicleForDelete(v)
                                            setIsDeleteDialogOpen(true)
                                        }}
                                        className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 gap-1"
                                        title="Hapus Unit / Cek Status Integritas"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Hapus</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Tambah Cepat Armada */}
            {isModalOpen && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-md w-full p-4">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                <Truck className="h-4 w-4 text-emerald-600" />
                                Tambah Armada ke Master Kendaraan
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Plat Nomor / No. Seri *</Label>
                                <Input
                                    placeholder="Contoh: DA 9041 AD atau EX-01"
                                    value={newPlate}
                                    onChange={(e) => setNewPlate(e.target.value)}
                                    className="h-9 text-xs uppercase font-bold"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Kategori Unit</Label>
                                <Select value={newCategory} onValueChange={setNewCategory}>
                                    <SelectTrigger className="h-9 text-xs" suppressHydrationWarning>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Dump Truck" className="text-xs">Dump Truck</SelectItem>
                                        <SelectItem value="Wheel Loader" className="text-xs">Wheel Loader</SelectItem>
                                        <SelectItem value="Excavator" className="text-xs">Excavator</SelectItem>
                                        <SelectItem value="Genset" className="text-xs">Genset</SelectItem>
                                        <SelectItem value="Stone Crusher" className="text-xs">Mesin Crusher</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {newCategory === "Dump Truck" && (
                                <div className="space-y-1">
                                    <Label className="text-xs">Ukuran Bak Dump Truck</Label>
                                    <Select
                                        value={newDumpSize}
                                        onValueChange={(val: "BESAR" | "KECIL") => setNewDumpSize(val)}
                                    >
                                        <SelectTrigger className="h-9 text-xs" suppressHydrationWarning>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BESAR" className="text-xs">Dump Truck Besar (8 m³)</SelectItem>
                                            <SelectItem value="KECIL" className="text-xs">Dump Truck Kecil (4 m³)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label className="text-xs">Merk / Tipe Unit (Opsional)</Label>
                                <Input
                                    placeholder="Contoh: Hino Dutro 130 HD, Komatsu WA200"
                                    value={newMerk}
                                    onChange={(e) => setNewMerk(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>
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
                                onClick={handleSaveVehicle}
                                disabled={isPending}
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                            >
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Simpan ke Master"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modal Edit Armada */}
            {isEditOpen && (
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-md w-full p-4">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                <Pencil className="h-4 w-4 text-blue-600" />
                                Edit Data Armada Master
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Plat Nomor *</Label>
                                <Input
                                    value={editPlate}
                                    onChange={(e) => setEditPlate(e.target.value)}
                                    className="h-9 text-xs uppercase font-bold"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Kode Lambung / Unit (Opsional)</Label>
                                <Input
                                    placeholder="Contoh: DT-01, EXC-01"
                                    value={editCode}
                                    onChange={(e) => setEditCode(e.target.value)}
                                    className="h-9 text-xs uppercase"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Kategori Unit</Label>
                                <Select
                                    value={editCategory}
                                    onValueChange={(val) => {
                                        setEditCategory(val)
                                        if (val === "Dump Truck") {
                                            setEditMeterType("KM")
                                        } else {
                                            setEditMeterType("HM")
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-9 text-xs" suppressHydrationWarning>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Dump Truck" className="text-xs">Dump Truck</SelectItem>
                                        <SelectItem value="Wheel Loader" className="text-xs">Wheel Loader</SelectItem>
                                        <SelectItem value="Excavator" className="text-xs">Excavator</SelectItem>
                                        <SelectItem value="Genset" className="text-xs">Genset</SelectItem>
                                        <SelectItem value="Stone Crusher" className="text-xs">Mesin Crusher</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {editCategory === "Dump Truck" && (
                                <div className="space-y-1">
                                    <Label className="text-xs">Ukuran Bak Dump Truck</Label>
                                    <Select
                                        value={editDumpSize}
                                        onValueChange={(val: "BESAR" | "KECIL") => setEditDumpSize(val)}
                                    >
                                        <SelectTrigger className="h-9 text-xs" suppressHydrationWarning>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BESAR" className="text-xs">Dump Truck Besar (8 m³)</SelectItem>
                                            <SelectItem value="KECIL" className="text-xs">Dump Truck Kecil (4 m³)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label className="text-xs">Tipe Pengukur (Meter Type)</Label>
                                <Select
                                    value={editMeterType}
                                    onValueChange={(val: "KM" | "HM") => setEditMeterType(val)}
                                >
                                    <SelectTrigger className="h-9 text-xs" suppressHydrationWarning>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="KM" className="text-xs">KM (Odometer - Kendaraan Berjalan)</SelectItem>
                                        <SelectItem value="HM" className="text-xs">HM (Hour Meter - Alat Berat / Mesin)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Merk / Tipe Unit (Opsional)</Label>
                                <Input
                                    placeholder="Contoh: Hino Dutro 130 HD, Komatsu WA200"
                                    value={editMerk}
                                    onChange={(e) => setEditMerk(e.target.value)}
                                    className="h-9 text-xs"
                                />
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
                                onClick={handleUpdateVehicle}
                                disabled={isPending}
                                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-1"
                            >
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Perbarui Data"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Dialog Rincian Catatan Riwayat Transaksi */}
            <VehicleUsageDialog
                open={isUsageDialogOpen}
                onOpenChange={setIsUsageDialogOpen}
                vehicle={selectedVehicleForUsage}
            />

            {/* Dialog Hapus dengan Proteksi & Wajib Alasan */}
            <VehicleDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                vehicle={selectedVehicleForDelete}
                onConfirmDelete={handleDeleteVehicle}
                isDeleting={isDeleting}
            />

            {/* Dialog Audit Log Penghapusan */}
            <VehicleAuditLogDialog
                open={isAuditLogOpen}
                onOpenChange={setIsAuditLogOpen}
            />
        </div>
    )
}
