"use client"

import { useState, useTransition, useMemo } from "react"
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
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, Tag, Truck, Sparkles, Loader2 } from "lucide-react"
import {
    createKendaraan,
    updateKendaraan,
    deleteKendaraan,
    createVehicleCategory,
    deleteVehicleCategory
} from "./actions"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { toast } from "sonner"

const getCategoryBadgeClass = (name: string = "") => {
    const lower = name.toLowerCase()
    if (lower.includes("mixer")) return "bg-blue-100 text-blue-800 border-blue-200"
    if (lower.includes("loader")) return "bg-orange-100 text-orange-800 border-orange-200"
    if (lower.includes("dump")) return "bg-emerald-100 text-emerald-800 border-emerald-200"
    if (lower.includes("pump")) return "bg-purple-100 text-purple-800 border-purple-200"
    if (lower.includes("batching") || lower.includes("plant")) return "bg-indigo-100 text-indigo-800 border-indigo-200"
    if (lower.includes("genset") || lower.includes("power")) return "bg-amber-100 text-amber-800 border-amber-200"
    if (lower.includes("excavator")) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (lower.includes("operasional") || lower.includes("mobil")) return "bg-teal-100 text-teal-800 border-teal-200"
    if (lower.includes("motor")) return "bg-cyan-100 text-cyan-800 border-cyan-200"
    return "bg-slate-100 text-slate-800 border-slate-200"
}

export function KendaraanClient({
    initialData = [],
    locations = [],
    initialCategories = [],
    userRole,
    canManage = true,
    isCorporate = false,
}: {
    initialData: any[]
    locations: any[]
    initialCategories?: any[]
    userRole: string
    canManage?: boolean
    isCorporate?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [categories, setCategories] = useState<any[]>(initialCategories)
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
    const [meterType, setMeterType] = useState<string>("KM")
    const [merkModel, setMerkModel] = useState<string>("")
    const [isPending, startTransition] = useTransition()

    // Shortcut Modal: Quick Add Vehicle Category
    const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false)
    const [quickCategoryName, setQuickCategoryName] = useState("")
    const [quickCategoryCode, setQuickCategoryCode] = useState("")
    const [quickCategoryDesc, setQuickCategoryDesc] = useState("")
    const [isSavingCategory, setIsSavingCategory] = useState(false)

    // Master Category Management Dialog
    const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false)

    // Dump Truck Form State
    const [dumpTruckSize, setDumpTruckSize] = useState<string>("BESAR")
    const [capacityCubic, setCapacityCubic] = useState<string>("")

    // Rental / Sewa Configuration State
    const [isForRent, setIsForRent] = useState<boolean>(false)
    const [defaultDayRate, setDefaultDayRate] = useState<string>("")
    const [rentalStatus, setRentalStatus] = useState<string>("Tersedia")
    const [rentalNotes, setRentalNotes] = useState<string>("")

    // Filter Tab State: ALL | OPERASIONAL | SEWA
    const [filterTab, setFilterTab] = useState<"ALL" | "OPERASIONAL" | "SEWA">("ALL")

    const handleCategoryChange = (catId: string) => {
        setSelectedCategoryId(catId)
        const cat = categories.find(c => c.id === catId)
        const catName = cat?.name?.toLowerCase() || ""
        if (catName.includes("batching") || catName.includes("genset") || catName.includes("loader") || catName.includes("excavator") || catName.includes("pump") || catName.includes("crane")) {
            setMeterType("HM")
        } else if (catName.includes("mixer") || catName.includes("dump") || catName.includes("mobil") || catName.includes("motor")) {
            setMeterType("KM")
        }
    }

    const handleOpenNew = () => {
        setEditData(null)
        // Default to first category (e.g. Truck Mixer) or empty
        const firstCatId = categories[0]?.id || ""
        setSelectedCategoryId(firstCatId)
        setMeterType("KM")
        setMerkModel("")
        setDumpTruckSize("BESAR")
        setCapacityCubic("")
        setIsForRent(false)
        setDefaultDayRate("")
        setRentalStatus("Tersedia")
        setRentalNotes("")
        setOpen(true)
    }

    const handleOpenEdit = (data: any) => {
        setEditData(data)
        setSelectedCategoryId(data.categoryId || categories.find(c => c.name.toLowerCase() === (data.vehicle_type || "").toLowerCase())?.id || "")
        setMeterType(data.meter_type || "KM")
        setMerkModel(data.merk_model || "")
        setDumpTruckSize(data.dump_truck_size || "BESAR")
        setCapacityCubic(data.capacity_cubic != null ? String(data.capacity_cubic) : "")
        setIsForRent(Boolean(data.is_for_rent))
        setDefaultDayRate(data.default_day_rate != null && data.default_day_rate > 0 ? String(data.default_day_rate) : "")
        setRentalStatus(data.rental_status || "Tersedia")
        setRentalNotes(data.rental_notes || "")
        setOpen(true)
    }

    async function handleSubmit(formData: FormData) {
        // Pass meter_type and merk_model
        formData.set("meter_type", meterType)
        if (merkModel.trim()) {
            formData.set("merk_model", merkModel.trim())
        } else {
            formData.delete("merk_model")
        }

        // Pass rental / sewa tag fields
        formData.set("is_for_rent", isForRent ? "true" : "false")
        if (isForRent) {
            formData.set("default_day_rate", defaultDayRate || "0")
            formData.set("rental_status", rentalStatus || "Tersedia")
            if (rentalNotes.trim()) {
                formData.set("rental_notes", rentalNotes.trim())
            } else {
                formData.delete("rental_notes")
            }
        } else {
            formData.set("default_day_rate", "0")
            formData.delete("rental_notes")
        }

        // Ensure categoryId is passed in formData
        if (selectedCategoryId) {
            formData.set("categoryId", selectedCategoryId)
            const activeCat = categories.find(c => c.id === selectedCategoryId)
            const isDT = activeCat?.name?.toLowerCase().includes("dump") || (editData && editData.dump_truck_size != null)
            if (isDT) {
                formData.set("dump_truck_size", dumpTruckSize)
                if (capacityCubic) {
                    formData.set("capacity_cubic", capacityCubic)
                } else {
                    formData.delete("capacity_cubic")
                }
            }
        }

        let result: any
        if (editData) {
            result = await updateKendaraan(editData.id, formData)
        } else {
            result = await createKendaraan(formData)
        }

        if (result.success) {
            toast.success(editData ? "Data unit berhasil diperbarui" : "Unit kendaraan / alat baru berhasil ditambahkan")
            setOpen(false)
            setEditData(null)
        } else {
            toast.error("Error: " + (typeof result.error === "object" ? JSON.stringify(result.error) : result.error))
        }
    }

    async function handleDelete(id: string) {
        if (confirm("Apakah Anda yakin ingin menghapus data kendaraan ini?")) {
            const result = await deleteKendaraan(id)
            if (result.success) {
                toast.success("Data kendaraan berhasil dihapus")
            } else {
                toast.error(result.error || "Gagal menghapus kendaraan")
            }
        }
    }

    // Quick Category Save (from shortcut)
    const handleSaveQuickCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!quickCategoryName.trim()) {
            toast.error("Nama kategori kendaraan wajib diisi.")
            return
        }

        setIsSavingCategory(true)
        try {
            const res = await createVehicleCategory({
                name: quickCategoryName.trim(),
                code: quickCategoryCode.trim() || undefined,
                description: quickCategoryDesc.trim() || undefined
            })

            if (res.success && res.category) {
                toast.success(`Kategori "${res.category.name}" berhasil dibuat!`)
                setCategories(prev => {
                    if (prev.some(c => c.id === res.category.id)) return prev
                    return [...prev, res.category]
                })
                // Auto select the new category in the form!
                setSelectedCategoryId(res.category.id)
                setQuickCategoryName("")
                setQuickCategoryCode("")
                setQuickCategoryDesc("")
                setIsQuickCategoryOpen(false)
            } else {
                toast.error(res.error || "Gagal membuat kategori kendaraan.")
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal membuat kategori.")
        } finally {
            setIsSavingCategory(false)
        }
    }

    // Delete Category from master list
    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`Hapus kategori "${name}"?`)) return

        startTransition(async () => {
            const res = await deleteVehicleCategory(id)
            if (res.success) {
                toast.success(`Kategori "${name}" berhasil dihapus.`)
                setCategories(prev => prev.filter(c => c.id !== id))
            } else {
                toast.error(res.error || "Gagal menghapus kategori.")
            }
        })
    }

    return (
        <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsManageCategoriesOpen(true)}
                        className="h-9 text-xs gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                    >
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>Kategori Kendaraan ({categories.length})</span>
                    </Button>
                </div>

                {canManage && (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleOpenNew}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 gap-1.5 shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Kendaraan & Alat</span>
                        </Button>
                    </div>
                )}
            </div>

            {/* Dialog: Form Tambah / Edit Kendaraan & Alat */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base flex items-center gap-2">
                            <Truck className="h-5 w-5 text-blue-600" />
                            <span>{editData ? "Edit Unit Kendaraan / Alat" : "Tambah Unit Kendaraan & Alat Baru"}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Informasi data armada, alat berat, batching plant, genset, dan spesifikasi unit.
                        </DialogDescription>
                    </DialogHeader>

                    <form key={editData?.id || "new"} action={handleSubmit} className="space-y-4 mt-2 text-xs">
                        {editData && <input type="hidden" name="id" value={editData.id} />}

                        {/* Identitas Unit (2 Kolom) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                                <Label htmlFor="code" className="text-xs font-semibold text-slate-700">Kode Unit *</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    placeholder="Misal: MX-01, BP-01, GS-02"
                                    defaultValue={editData?.code}
                                    required
                                    className="h-8 text-xs font-mono font-bold"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="plate_number" className="text-xs font-semibold text-slate-700">Plat Nomor / No. Seri *</Label>
                                <Input
                                    id="plate_number"
                                    name="plate_number"
                                    placeholder="PA 8821 AB atau No. Seri Unit"
                                    defaultValue={editData?.plate_number}
                                    required
                                    className="h-8 text-xs font-mono uppercase"
                                />
                            </div>
                        </div>

                        {/* Kategori & Merk / Model (2 Kolom) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-slate-700">
                                        Kategori / Jenis Unit *
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => setIsQuickCategoryOpen(true)}
                                        className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="h-3 w-3" />
                                        <span>Kategori Baru</span>
                                    </button>
                                </div>

                                <Select
                                    value={selectedCategoryId}
                                    onValueChange={handleCategoryChange}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Pilih Kategori Kendaraan / Alat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-800">{cat.name}</span>
                                                    {cat.code && (
                                                        <span className="text-[10px] text-slate-400 font-mono">({cat.code})</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="merk_model" className="text-xs font-semibold text-slate-700">Merk / Model / Spesifikasi</Label>
                                <Input
                                    id="merk_model"
                                    placeholder="Sicoma 60m³, Perkins 150kVA, Sany SY5290THB"
                                    value={merkModel}
                                    onChange={e => setMerkModel(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        {/* Satuan Meter & Cabang (2 Kolom) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Satuan Meter Unit *</Label>
                                <Select value={meterType} onValueChange={setMeterType}>
                                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Pilih Satuan Meter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="KM" className="text-xs font-medium">
                                            KM (Kilometer - Kendaraan)
                                        </SelectItem>
                                        <SelectItem value="HM" className="text-xs font-medium">
                                            HM (Hour Meter - Alat/Mesin)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(userRole === "SuperAdminBP" || isCorporate || !editData?.locationId) ? (
                                <div className="space-y-1">
                                    <Label htmlFor="locationId" className="text-xs font-semibold text-slate-700">Cabang Pangkalan *</Label>
                                    <Select name="locationId" defaultValue={editData?.locationId || locations[0]?.id || ""}>
                                        <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                            <SelectValue placeholder="Pilih Cabang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map((loc) => (
                                                <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                                    {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : <div />}
                        </div>

                        {/* Dump Truck Specific Configuration */}
                        {(() => {
                            const activeCat = categories.find(c => c.id === selectedCategoryId)
                            const isDT = activeCat?.name?.toLowerCase().includes("dump") || (editData && editData.dump_truck_size != null)

                            if (!isDT) return null

                            return (
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                            <Truck className="h-3.5 w-3.5 text-slate-600" />
                                            <span>Konfigurasi Dump Truck</span>
                                        </div>
                                        <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.5 rounded">
                                            Internal Quarry
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div className="space-y-1">
                                            <Label htmlFor="dump_truck_size" className="text-[11px] font-medium text-slate-700">
                                                Tipe Ukuran DT *
                                            </Label>
                                            <Select value={dumpTruckSize} onValueChange={setDumpTruckSize}>
                                                <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                                                    <SelectValue placeholder="Pilih Tipe Ukuran" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BESAR" className="text-xs font-medium">
                                                        DT Besar (Tronton)
                                                    </SelectItem>
                                                    <SelectItem value="KECIL" className="text-xs font-medium">
                                                        DT Kecil (Engkel)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="capacity_cubic" className="text-[11px] font-medium text-slate-700">
                                                Kapasitas Bak Spec (m³)
                                            </Label>
                                            <Input
                                                id="capacity_cubic"
                                                name="capacity_cubic"
                                                type="number"
                                                step="0.1"
                                                placeholder="Misal: 8 atau 10"
                                                value={capacityCubic}
                                                onChange={e => setCapacityCubic(e.target.value)}
                                                className="h-8 text-xs bg-white border-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}

                        {/* Sewa & Rental Tagging Configuration */}
                        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isForRent}
                                    onChange={e => setIsForRent(e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                                <span className="font-semibold text-xs text-slate-800">
                                    Daftarkan sebagai Unit yang Bisa Disewa
                                </span>
                            </label>

                            {isForRent && (
                                <div className="pt-2.5 border-t border-slate-200 space-y-2.5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="default_day_rate" className="text-[11px] font-medium text-slate-700">
                                                Tarif Acuan Sewa / Hari (Rp)
                                            </Label>
                                            <Input
                                                id="default_day_rate"
                                                type="number"
                                                placeholder="Contoh: 3500000"
                                                value={defaultDayRate}
                                                onChange={e => setDefaultDayRate(e.target.value)}
                                                className="h-8 text-xs bg-white border-slate-300 font-mono"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="rental_status" className="text-[11px] font-medium text-slate-700">
                                                Status Ketersediaan Sewa
                                            </Label>
                                            <Select value={rentalStatus} onValueChange={setRentalStatus}>
                                                <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                                                    <SelectValue placeholder="Pilih Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Tersedia" className="text-xs font-medium">
                                                        Tersedia
                                                    </SelectItem>
                                                    <SelectItem value="Disewa" className="text-xs font-medium">
                                                        Sedang Disewa
                                                    </SelectItem>
                                                    <SelectItem value="Maintenance" className="text-xs font-medium">
                                                        Perawatan / Maintenance
                                                    </SelectItem>
                                                    <SelectItem value="Nonaktif" className="text-xs font-medium">
                                                        Nonaktif
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="rental_notes" className="text-[11px] font-medium text-slate-700">
                                            Catatan / Spesifikasi Sewa (Opsional)
                                        </Label>
                                        <Input
                                            id="rental_notes"
                                            placeholder="Contoh: Boom reach 37m, output 120m3/h"
                                            value={rentalNotes}
                                            onChange={e => setRentalNotes(e.target.value)}
                                            className="h-8 text-xs bg-white border-slate-300"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs h-8">
                                Batal
                            </Button>
                            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                                Simpan Kendaraan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Shortcut Dialog: Quick Add Vehicle Category */}
            <Dialog open={isQuickCategoryOpen} onOpenChange={setIsQuickCategoryOpen}>
                <DialogContent className="sm:max-w-[380px] z-[60]">
                    <form onSubmit={handleSaveQuickCategory}>
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
                                <Tag className="h-4 w-4 text-amber-600" />
                                <span>Tambah Kategori Kendaraan</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Buat jenis/kategori armada baru untuk langsung digunakan pada form.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-3 text-xs">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Nama Kategori *</Label>
                                <Input
                                    placeholder="Misal: Concrete Pump, Dump Truck, dll."
                                    value={quickCategoryName}
                                    onChange={e => setQuickCategoryName(e.target.value)}
                                    className="h-8 text-xs"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Kode Singkatan (Opsional)</Label>
                                <Input
                                    placeholder="Contoh: CP, DT, OPS"
                                    value={quickCategoryCode}
                                    onChange={e => setQuickCategoryCode(e.target.value)}
                                    className="h-8 text-xs uppercase font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Keterangan (Opsional)</Label>
                                <Input
                                    placeholder="Keterangan singkat fungsi armada..."
                                    value={quickCategoryDesc}
                                    onChange={e => setQuickCategoryDesc(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsQuickCategoryOpen(false)}
                                className="h-7 text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSavingCategory}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                                {isSavingCategory ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                <span>Simpan & Pilih</span>
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog: Master Kategori Kendaraan Management */}
            <Dialog open={isManageCategoriesOpen} onOpenChange={setIsManageCategoriesOpen}>
                <DialogContent className="sm:max-w-[540px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                            <Tag className="h-5 w-5 text-amber-600" />
                            <span>Master Kategori Kendaraan</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Kelola kategori armada dan jenis alat operasional yang tersedia di seluruh cabang.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">
                                Total <strong>{categories.length}</strong> kategori terdaftar
                            </span>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setIsQuickCategoryOpen(true)}
                                className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 cursor-pointer"
                            >
                                <Plus className="h-3 w-3" />
                                <span>Tambah Kategori</span>
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-slate-50 text-[11px]">
                                    <TableRow>
                                        <TableHead className="w-12 text-center">#</TableHead>
                                        <TableHead>Nama Kategori</TableHead>
                                        <TableHead>Kode</TableHead>
                                        <TableHead className="text-center">Jumlah Unit</TableHead>
                                        <TableHead className="w-12 text-center"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="text-xs">
                                    {categories.map((cat, idx) => {
                                        const unitCount = cat._count?.vehicles || cat.vehicles?.length || 0
                                        return (
                                            <TableRow key={cat.id} className="hover:bg-slate-50/70">
                                                <TableCell className="text-center font-mono text-slate-400 text-[11px]">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold text-slate-800">{cat.name}</div>
                                                    {cat.description && (
                                                        <div className="text-[10px] text-slate-400">{cat.description}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-slate-600 text-[11px]">
                                                    {cat.code || "-"}
                                                </TableCell>
                                                <TableCell className="text-center font-mono">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-semibold text-slate-700">
                                                        {unitCount} unit
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {!cat.isSystem && unitCount === 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                            className="h-6 w-6 text-slate-400 hover:text-rose-600"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsManageCategoriesOpen(false)}
                            className="text-xs h-8"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Filter Tabs & Table Kendaraan & Alat */}
            {(() => {
                const operationalCount = initialData.filter(d => !d.is_for_rent).length
                const rentalCount = initialData.filter(d => d.is_for_rent).length
                const filteredData = filterTab === "OPERASIONAL"
                    ? initialData.filter(d => !d.is_for_rent)
                    : filterTab === "SEWA"
                    ? initialData.filter(d => d.is_for_rent)
                    : initialData

                return (
                    <div className="space-y-3">
                        {/* Quick Filter Tabs */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit text-xs border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setFilterTab("ALL")}
                                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                                    filterTab === "ALL"
                                        ? "bg-white text-slate-900 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Semua Unit ({initialData.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab("OPERASIONAL")}
                                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                                    filterTab === "OPERASIONAL"
                                        ? "bg-white text-blue-700 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Operasional Internal ({operationalCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTab("SEWA")}
                                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                                    filterTab === "SEWA"
                                        ? "bg-white text-blue-700 shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Unit Sewa ({rentalCount})
                            </button>
                        </div>

                        <SimpleDataTable
                            data={filteredData}
                            searchKeys={["code", "plate_number", "vehicle_type", "merk_model"]}
                            searchPlaceholder="Cari kode unit, nomor plat, merk/tipe, atau kategori alat..."
                        >
                            {(items, sortConfig, toggleSort) => (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/70 text-xs">
                                            {isCorporate && (
                                                <TableHead>
                                                    <SortableHeader label="Cabang" sortKey="locationId" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                            )}
                                            <TableHead>
                                                <SortableHeader label="Kode Unit" sortKey="code" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead>
                                                <SortableHeader label="Plat / No. Seri" sortKey="plate_number" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead>
                                                <SortableHeader label="Kategori Unit" sortKey="vehicle_type" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            <TableHead className="text-center w-24">
                                                <SortableHeader label="Meter" sortKey="meter_type" sortConfig={sortConfig} onSort={toggleSort} />
                                            </TableHead>
                                            {canManage && <TableHead className="w-[90px] text-center">Aksi</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={(isCorporate ? 1 : 0) + 4 + (canManage ? 1 : 0)} className="text-center text-muted-foreground h-24 text-xs">
                                                    Data kendaraan & alat tidak ditemukan.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {items.map((item) => {
                                            const categoryName = item.category?.name || item.vehicle_type
                                            const badgeClass = getCategoryBadgeClass(categoryName)
                                            const isHM = item.meter_type === "HM"

                                            return (
                                                <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors text-xs">
                                                    {isCorporate && (
                                                        <TableCell>
                                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                                {item.location?.name || "N/A"}
                                                            </span>
                                                        </TableCell>
                                                    )}
                                                    <TableCell>
                                                        <div className="font-bold text-slate-900 font-mono text-xs">
                                                            {item.code}
                                                        </div>
                                                        {item.merk_model && (
                                                            <div className="text-[10px] text-slate-500 font-sans truncate max-w-[170px]" title={item.merk_model}>
                                                                {item.merk_model}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-700 font-mono text-xs">
                                                        {item.plate_number}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
                                                                {categoryName}
                                                            </span>
                                                            {item.dump_truck_size && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    {item.dump_truck_size === "BESAR" ? "DT Besar" : "DT Kecil"}
                                                                    {item.capacity_cubic ? ` • ${item.capacity_cubic} m³` : ""}
                                                                </span>
                                                            )}
                                                            {item.is_for_rent && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                                    <span>Unit Sewa</span>
                                                                    {item.default_day_rate > 0 && (
                                                                        <span className="font-mono text-slate-900 font-semibold">
                                                                            • Rp {Number(item.default_day_rate).toLocaleString("id-ID")}/hr
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            )}
                                                            {item.is_for_rent && (
                                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                                                    item.rental_status === "Disewa"
                                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                        : item.rental_status === "Maintenance"
                                                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                }`}>
                                                                    {item.rental_status === "Disewa" ? "Sedang Disewa" : item.rental_status === "Maintenance" ? "Maintenance" : "Tersedia"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${isHM ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-800 border-blue-200"}`}>
                                                            {isHM ? "HM" : "KM"}
                                                        </span>
                                        </TableCell>
                                        {canManage && (
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-blue-600" onClick={() => handleOpenEdit(item)}>
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </SimpleDataTable>
        </div>
    )
})()}
        </div>
    )
}
