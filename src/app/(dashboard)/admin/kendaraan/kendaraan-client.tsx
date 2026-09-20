"use client"

import { useState, useTransition } from "react"
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
    if (lower.includes("operasional") || lower.includes("mobil")) return "bg-teal-100 text-teal-800 border-teal-200"
    if (lower.includes("genset") || lower.includes("berat")) return "bg-slate-100 text-slate-800 border-slate-200"
    if (lower.includes("motor")) return "bg-cyan-100 text-cyan-800 border-cyan-200"
    return "bg-indigo-100 text-indigo-800 border-indigo-200"
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

    const handleOpenNew = () => {
        setEditData(null)
        // Default to first category (e.g. Truck Mixer) or empty
        setSelectedCategoryId(categories[0]?.id || "")
        setDumpTruckSize("BESAR")
        setCapacityCubic("")
        setOpen(true)
    }

    const handleOpenEdit = (data: any) => {
        setEditData(data)
        setSelectedCategoryId(data.categoryId || categories.find(c => c.name.toLowerCase() === (data.vehicle_type || "").toLowerCase())?.id || "")
        setDumpTruckSize(data.dump_truck_size || "BESAR")
        setCapacityCubic(data.capacity_cubic != null ? String(data.capacity_cubic) : "")
        setOpen(true)
    }

    async function handleSubmit(formData: FormData) {
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
            toast.success(editData ? "Data kendaraan berhasil diperbarui" : "Kendaraan baru berhasil ditambahkan")
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
                            <span>Tambah Kendaraan</span>
                        </Button>
                    </div>
                )}
            </div>

            {/* Dialog: Form Tambah / Edit Kendaraan */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle className="text-base flex items-center gap-2">
                            <Truck className="h-5 w-5 text-blue-600" />
                            <span>{editData ? "Edit Kendaraan" : "Tambah Kendaraan Baru"}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Masukkan data armada kendaraan, kode unik, nomor plat, dan kategori operasional.
                        </DialogDescription>
                    </DialogHeader>

                    <form key={editData?.id || "new"} action={handleSubmit} className="space-y-3.5 mt-2 text-xs">
                        {editData && <input type="hidden" name="id" value={editData.id} />}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="code" className="text-xs font-semibold text-slate-700">Kode Kendaraan *</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    placeholder="Misal: MX-01, LD-02"
                                    defaultValue={editData?.code}
                                    required
                                    className="h-8 text-xs font-mono font-bold"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="plate_number" className="text-xs font-semibold text-slate-700">Plat Nomor *</Label>
                                <Input
                                    id="plate_number"
                                    name="plate_number"
                                    placeholder="Contoh: PA 8821 AB"
                                    defaultValue={editData?.plate_number}
                                    required
                                    className="h-8 text-xs font-mono uppercase"
                                />
                            </div>
                        </div>

                        {/* Kategori Kendaraan with Shortcut Button */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-700">
                                    Kategori / Jenis Kendaraan *
                                </Label>
                                <button
                                    type="button"
                                    onClick={() => setIsQuickCategoryOpen(true)}
                                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="h-3 w-3" />
                                    <span>+ Kategori Baru</span>
                                </button>
                            </div>

                            <Select
                                value={selectedCategoryId}
                                onValueChange={setSelectedCategoryId}
                            >
                                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Pilih Kategori Kendaraan" />
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
                            <p className="text-[10px] text-slate-400">
                                Pilih kategori armada atau tambahkan kategori baru melalui tombol shortcut di atas.
                            </p>
                        </div>

                        {/* Dump Truck Specific Configuration */}
                        {(() => {
                            const activeCat = categories.find(c => c.id === selectedCategoryId)
                            const isDT = activeCat?.name?.toLowerCase().includes("dump") || (editData && editData.dump_truck_size != null)

                            if (!isDT) return null

                            return (
                                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                                            <Truck className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>Konfigurasi Dump Truck</span>
                                        </div>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                                            Internal Quarry
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="space-y-1">
                                            <Label htmlFor="dump_truck_size" className="text-[11px] font-semibold text-emerald-950">
                                                Tipe Ukuran DT *
                                            </Label>
                                            <Select value={dumpTruckSize} onValueChange={setDumpTruckSize}>
                                                <SelectTrigger className="h-8 text-xs bg-white border-emerald-300 focus:ring-emerald-500">
                                                    <SelectValue placeholder="Pilih Tipe Ukuran" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BESAR" className="text-xs font-semibold">
                                                        🚛 DT Besar (Tronton)
                                                    </SelectItem>
                                                    <SelectItem value="KECIL" className="text-xs font-semibold">
                                                        🚚 DT Kecil (Engkel)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="capacity_cubic" className="text-[11px] font-semibold text-emerald-950">
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
                                                className="h-8 text-xs bg-white border-emerald-300"
                                            />
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-emerald-800 leading-tight">
                                        💡 <strong>Catatan:</strong> Tipe ukuran menentukan tarif retase per m³·km. Kapasitas bak adalah acuan spesifikasi teknis dan <u>tidak mengunci</u> volume muatan per transaksi material agregat.
                                    </p>
                                </div>
                            )
                        })()}

                        {userRole === "SuperAdminBP" && (
                            <div className="space-y-1">
                                <Label htmlFor="locationId" className="text-xs font-semibold text-slate-700">Cabang Pangkalan *</Label>
                                <Select name="locationId" defaultValue={editData?.locationId || locations[0]?.id || ""}>
                                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Pilih Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((loc) => (
                                            <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                                📍 {loc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

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

            {/* Table Kendaraan */}
            <SimpleDataTable
                data={initialData}
                searchKeys={["code", "plate_number", "vehicle_type"]}
                searchPlaceholder="Cari kode armada, nomor plat, atau kategori..."
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
                                    <SortableHeader label="Plat Nomor" sortKey="plate_number" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Kategori Kendaraan" sortKey="vehicle_type" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                {canManage && <TableHead className="w-[90px] text-center">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={(isCorporate ? 1 : 0) + 3 + (canManage ? 1 : 0)} className="text-center text-muted-foreground h-24 text-xs">
                                        Data kendaraan tidak ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.map((item) => {
                                const categoryName = item.category?.name || item.vehicle_type
                                const badgeClass = getCategoryBadgeClass(categoryName)

                                return (
                                    <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors text-xs">
                                        {isCorporate && (
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                    {item.location?.name || "N/A"}
                                                </span>
                                            </TableCell>
                                        )}
                                        <TableCell className="font-bold text-slate-900 font-mono text-xs">
                                            {item.code}
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
                                            </div>
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
}
