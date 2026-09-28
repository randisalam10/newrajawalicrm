"use client"

import { useState, useMemo, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Loader2
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
    ROLE_CATEGORIES,
    FORMULA_TEMPLATES,
} from "./constants"
import {
    upsertMasterIncentive,
    deleteMasterIncentive,
    toggleMasterIncentiveStatus
} from "./actions"
import { toast } from "sonner"

const fmtNum = (n: number) => new Intl.NumberFormat("id-ID").format(Math.round(n || 0))
const fmtDate = (d: any) => d ? format(new Date(d), "dd MMM yyyy", { locale: idLocale }) : "-"
const fmtDateInput = (d: any) => {
    if (!d) return format(new Date(), "yyyy-MM-dd")
    const date = new Date(d)
    return isNaN(date.getTime()) ? format(new Date(), "yyyy-MM-dd") : format(date, "yyyy-MM-dd")
}

export function MasterInsentifClient({
    initialRates,
    locations,
    canManage = true,
    isCorporate = false,
}: {
    initialRates: any[]
    locations: any[]
    canManage?: boolean
    isCorporate?: boolean
}) {
    const [rates, setRates] = useState<any[]>(initialRates)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterRole, setFilterRole] = useState("ALL")
    const [filterBranch, setFilterBranch] = useState("ALL")

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Form states
    const [formData, setFormData] = useState({
        nama_insentif: "",
        kategori_peran: "OPERATOR_BP",
        formula_type: "PER_M3",
        tarif_utama: "1500",
        tarif_sekunder: "0",
        locationId: "ALL",
        effective_date: format(new Date(), "yyyy-MM-dd"),
        keterangan: "",
        isActive: true,
    })

    const [, startTransition] = useTransition()

    // Filtered data
    const filteredRates = useMemo(() => {
        return rates.filter(item => {
            if (filterRole !== "ALL" && item.kategori_peran !== filterRole) return false
            if (filterBranch !== "ALL") {
                if (filterBranch === "GLOBAL" && item.locationId !== null) return false
                if (filterBranch !== "GLOBAL" && item.locationId !== filterBranch) return false
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const matchName = item.nama_insentif?.toLowerCase().includes(q)
                const matchLoc = item.location?.name?.toLowerCase().includes(q)
                const matchKet = item.keterangan?.toLowerCase().includes(q)
                if (!matchName && !matchLoc && !matchKet) return false
            }
            return true
        })
    }, [rates, filterRole, filterBranch, searchQuery])

    // Find active formula template info
    const activeFormula = useMemo(() => {
        return FORMULA_TEMPLATES.find(f => f.value === formData.formula_type) || FORMULA_TEMPLATES[0]
    }, [formData.formula_type])

    // Live calculation simulation
    const simulationText = useMemo(() => {
        const tarif = Number(formData.tarif_utama) || 0
        const tarifSekunder = Number(formData.tarif_sekunder) || 0

        switch (formData.formula_type) {
            case "PER_M3":
                return `Jika volume cor 100 m³: 100 m³ × Rp ${fmtNum(tarif)} = Rp ${fmtNum(100 * tarif)}`
            case "PER_TRIP":
                return `Jika menjalankan 2 trip pengecoran: 2 Trip × Rp ${fmtNum(tarif)} = Rp ${fmtNum(2 * tarif)}`
            case "PER_JAM_HM":
                return `Jika jam operasional alat 8 jam (HM): 8 Jam × Rp ${fmtNum(tarif)} = Rp ${fmtNum(8 * tarif)}`
            case "PER_HARI":
                return `Jika bertugas selama 5 hari: 5 Hari × Rp ${fmtNum(tarif)} = Rp ${fmtNum(5 * tarif)}`
            case "PER_KM":
                return `Jika jarak tempuh pengiriman 15 KM: 15 KM × Rp ${fmtNum(tarif)} = Rp ${fmtNum(15 * tarif)}`
            case "PER_M3_KM":
                return `Jika kirim 7 m³ sejauh 10 KM: 7 m³ × 10 KM × Rp ${fmtNum(tarif)} = Rp ${fmtNum(70 * tarif)}`
            case "DT_TIERED":
                return `DT Besar per rit = Rp ${fmtNum(tarif)} | DT Kecil per rit = Rp ${fmtNum(tarifSekunder)}`
            default:
                return `Tarif acuan: Rp ${fmtNum(tarif)}`
        }
    }, [formData.formula_type, formData.tarif_utama, formData.tarif_sekunder])

    const handleOpenAdd = () => {
        setEditingItem(null)
        setFormData({
            nama_insentif: "",
            kategori_peran: "OPERATOR_BP",
            formula_type: "PER_M3",
            tarif_utama: "1500",
            tarif_sekunder: "0",
            locationId: isCorporate ? "ALL" : (locations[0]?.id || "ALL"),
            effective_date: format(new Date(), "yyyy-MM-dd"),
            keterangan: "",
            isActive: true,
        })
        setIsModalOpen(true)
    }

    const handleOpenEdit = (item: any) => {
        setEditingItem(item)
        setFormData({
            nama_insentif: item.nama_insentif || "",
            kategori_peran: item.kategori_peran || "OPERATOR_BP",
            formula_type: item.formula_type || "PER_M3",
            tarif_utama: String(item.tarif_utama ?? 0),
            tarif_sekunder: String(item.tarif_sekunder ?? 0),
            locationId: item.locationId || "ALL",
            effective_date: fmtDateInput(item.effective_date),
            keterangan: item.keterangan || "",
            isActive: item.isActive !== undefined ? item.isActive : true,
        })
        setIsModalOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.nama_insentif.trim()) {
            toast.error("Nama insentif wajib diisi")
            return
        }

        setIsSaving(true)
        const payload = {
            id: editingItem?.id,
            nama_insentif: formData.nama_insentif,
            kategori_peran: formData.kategori_peran,
            formula_type: formData.formula_type,
            tarif_utama: Number(formData.tarif_utama) || 0,
            tarif_sekunder: Number(formData.tarif_sekunder) || 0,
            locationId: formData.locationId === "ALL" ? null : formData.locationId,
            effective_date: formData.effective_date,
            keterangan: formData.keterangan,
            isActive: formData.isActive,
        }

        const res = await upsertMasterIncentive(payload)
        setIsSaving(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(res.message || "Tarif insentif tersimpan.")
            setIsModalOpen(false)
            startTransition(() => {
                if (editingItem) {
                    setRates(prev => prev.map(r => r.id === editingItem.id ? res.data : r))
                } else if (res.data) {
                    setRates(prev => [res.data, ...prev])
                }
            })
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        const res = await deleteMasterIncentive(deleteTarget.id)
        setIsDeleting(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(res.message || "Tarif dihapus.")
            setRates(prev => prev.filter(r => r.id !== deleteTarget.id))
            setDeleteTarget(null)
        }
    }

    const handleToggleStatus = async (item: any) => {
        const nextStatus = !item.isActive
        const res = await toggleMasterIncentiveStatus(item.id, nextStatus)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(res.message)
            setRates(prev => prev.map(r => r.id === item.id ? { ...r, isActive: nextStatus } : r))
        }
    }

    return (
        <div className="space-y-4">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Tarif Insentif</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola parameter tarif dan rumus insentif untuk operator BP, operator CP, alat berat, dan supir.
                    </p>
                </div>
                {canManage && (
                    <Button onClick={handleOpenAdd} size="sm" className="h-8 text-xs font-medium cursor-pointer">
                        Tambah Tarif
                    </Button>
                )}
            </div>

            {/* Filter Toolbar */}
            <Card className="border-slate-200/80 shadow-none">
                <CardContent className="p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search */}
                            <Input
                                placeholder="Cari tarif / peran / cabang..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-8 text-xs bg-white w-52 sm:w-60"
                            />

                            {/* Filter Peran */}
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="h-8 w-44 text-xs bg-white">
                                    <SelectValue placeholder="Semua Peran" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Peran</SelectItem>
                                    {ROLE_CATEGORIES.map(rc => (
                                        <SelectItem key={rc.value} value={rc.value}>{rc.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Filter Cabang */}
                            {isCorporate && (
                                <Select value={filterBranch} onValueChange={setFilterBranch}>
                                    <SelectTrigger className="h-8 w-40 text-xs bg-white">
                                        <SelectValue placeholder="Semua Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Cabang</SelectItem>
                                        <SelectItem value="GLOBAL">Berlaku Global (Semua)</SelectItem>
                                        {locations.map((loc: any) => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <span className="text-xs text-slate-500 font-mono">
                            {filteredRates.length} tarif terdaftar
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Main Table */}
            <Card className="border-slate-200/80 shadow-none overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow>
                                <TableHead className="text-xs">Peran / Jabatan</TableHead>
                                <TableHead className="text-xs">Nama Insentif</TableHead>
                                <TableHead className="text-xs">Rumus & Satuan</TableHead>
                                <TableHead className="text-xs text-right">Tarif Dasar</TableHead>
                                <TableHead className="text-xs">Cabang</TableHead>
                                <TableHead className="text-xs">Mulai Berlaku</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                                {canManage && <TableHead className="w-16 text-right text-xs">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={canManage ? 8 : 7} className="text-center py-10 text-xs text-slate-400">
                                        Tidak ada data tarif insentif yang sesuai filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRates.map((item) => {
                                    const roleInfo = ROLE_CATEGORIES.find(r => r.value === item.kategori_peran)
                                    const formulaInfo = FORMULA_TEMPLATES.find(f => f.value === item.formula_type)

                                    return (
                                        <TableRow key={item.id} className="text-xs hover:bg-slate-50/60">
                                            <TableCell className="font-medium text-slate-800">
                                                {roleInfo?.label || item.kategori_peran}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-slate-800">{item.nama_insentif}</div>
                                                {item.keterangan && (
                                                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.keterangan}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-slate-700">{formulaInfo?.label || item.formula_type}</div>
                                                <div className="text-[11px] text-slate-400 font-mono">{formulaInfo?.formula}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-medium text-slate-800">
                                                {item.formula_type === "DT_TIERED" ? (
                                                    <div>
                                                        <div>Besar: Rp {fmtNum(item.tarif_utama)}</div>
                                                        <div className="text-slate-500 text-[11px]">Kecil: Rp {fmtNum(item.tarif_sekunder)}</div>
                                                    </div>
                                                ) : (
                                                    <span>Rp {fmtNum(item.tarif_utama)}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                {item.location?.name ? (
                                                    <span>{item.location.name}</span>
                                                ) : (
                                                    <span className="text-slate-400">Semua Cabang</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap font-mono text-slate-600">
                                                {fmtDate(item.effective_date)}
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    type="button"
                                                    onClick={() => canManage && handleToggleStatus(item)}
                                                    disabled={!canManage}
                                                    className="cursor-pointer"
                                                >
                                                    <Badge
                                                        variant="outline"
                                                        className={item.isActive
                                                            ? "bg-slate-50 text-slate-700 border-slate-300 font-normal text-[10px]"
                                                            : "bg-slate-100 text-slate-400 border-slate-200 font-normal text-[10px]"
                                                        }
                                                    >
                                                        {item.isActive ? "Aktif" : "Nonaktif"}
                                                    </Badge>
                                                </button>
                                            </TableCell>
                                            {canManage && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2 text-xs">
                                                        <button
                                                            type="button"
                                                            className="text-slate-600 hover:text-slate-900 font-medium hover:underline cursor-pointer"
                                                            onClick={() => handleOpenEdit(item)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <span className="text-slate-300">|</span>
                                                        <button
                                                            type="button"
                                                            className="text-slate-400 hover:text-red-600 hover:underline cursor-pointer"
                                                            onClick={() => setDeleteTarget(item)}
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal Dialog Form Tambah / Edit */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            {editingItem ? "Edit Parameter Insentif" : "Tambah Parameter Insentif"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Tentukan peran, jenis rumus, nilai tarif, serta tanggal mulai berlakunya.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-3.5 py-1">
                        {/* Nama Insentif */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Nama Aturan Insentif</Label>
                            <Input
                                placeholder="Contoh: Insentif Operator BP, Insentif Operator CP per Trip..."
                                value={formData.nama_insentif}
                                onChange={e => setFormData(f => ({ ...f, nama_insentif: e.target.value }))}
                                className="h-8 text-xs"
                                required
                            />
                        </div>

                        {/* Peran & Template Rumus */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Peran / Jabatan</Label>
                                <Select
                                    value={formData.kategori_peran}
                                    onValueChange={v => {
                                        // Auto-adjust default formula based on role
                                        let defaultFormula = "PER_M3"
                                        let defaultRate = "1500"
                                        if (v === "OPERATOR_CP") { defaultFormula = "PER_TRIP"; defaultRate = "150000" }
                                        else if (v === "OPERATOR_ALAT_BERAT") { defaultFormula = "PER_JAM_HM"; defaultRate = "35000" }
                                        else if (v === "SOPIR_MIXER") { defaultFormula = "PER_KM"; defaultRate = "10000" }
                                        else if (v === "SOPIR_DT") { defaultFormula = "DT_TIERED"; defaultRate = "45000" }

                                        setFormData(f => ({
                                            ...f,
                                            kategori_peran: v,
                                            formula_type: defaultFormula,
                                            tarif_utama: defaultRate
                                        }))
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_CATEGORIES.map(rc => (
                                            <SelectItem key={rc.value} value={rc.value}>{rc.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Pola Rumus Hitungan</Label>
                                <Select
                                    value={formData.formula_type}
                                    onValueChange={v => setFormData(f => ({ ...f, formula_type: v }))}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FORMULA_TEMPLATES.map(ft => (
                                            <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tarif Inputs */}
                        <div className={formData.formula_type === "DT_TIERED" ? "grid grid-cols-2 gap-3" : "space-y-1"}>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">
                                    {formData.formula_type === "DT_TIERED" ? "Tarif DT Besar (Rp)" : `Tarif (${activeFormula.unit})`}
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.tarif_utama}
                                    onChange={e => setFormData(f => ({ ...f, tarif_utama: e.target.value }))}
                                    className="h-8 text-xs font-mono"
                                    required
                                />
                            </div>

                            {formData.formula_type === "DT_TIERED" && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Tarif DT Kecil (Rp)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.tarif_sekunder}
                                        onChange={e => setFormData(f => ({ ...f, tarif_sekunder: e.target.value }))}
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Cabang & Tanggal Mulai Berlaku */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Penempatan Cabang</Label>
                                <Select
                                    value={formData.locationId}
                                    onValueChange={v => setFormData(f => ({ ...f, locationId: v }))}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Cabang (Global)</SelectItem>
                                        {locations.map((loc: any) => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Mulai Berlaku Tanggal</Label>
                                <Input
                                    type="date"
                                    value={formData.effective_date}
                                    onChange={e => setFormData(f => ({ ...f, effective_date: e.target.value }))}
                                    className="h-8 text-xs"
                                    required
                                />
                            </div>
                        </div>

                        {/* Keterangan */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Catatan / Keterangan (Opsional)</Label>
                            <Input
                                placeholder="Misal: Sesuai kesepakatan SK Operasional 2026..."
                                value={formData.keterangan}
                                onChange={e => setFormData(f => ({ ...f, keterangan: e.target.value }))}
                                className="h-8 text-xs"
                            />
                        </div>

                        {/* Kotak Simulasi & Batas Waktu Ringkas (Desain Tenang & Tanpa Kontras Tinggi) */}
                        <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 space-y-1.5 text-xs text-slate-600">
                            <div>
                                <span className="font-semibold text-slate-700">Cara Kerja: </span>
                                <span>{simulationText}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                                Berlaku otomatis untuk transaksi mulai <strong className="text-slate-700 font-mono">{formData.effective_date}</strong> ke depan. Transaksi sebelum tanggal tersebut aman dan tidak terpengaruh.
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsModalOpen(false)}
                                className="h-8 text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSaving}
                                className="h-8 text-xs cursor-pointer font-medium"
                            >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                                {editingItem ? "Simpan Perubahan" : "Buat Tarif"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus */}
            <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-slate-900">Hapus Tarif Insentif?</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Yakin ingin menghapus aturan <strong className="text-slate-800">{deleteTarget?.nama_insentif}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(null)}
                            className="h-8 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="h-8 text-xs cursor-pointer"
                        >
                            {isDeleting ? "Menghapus..." : "Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
