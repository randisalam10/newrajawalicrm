"use client"

import React, { useState, useTransition, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    Layers, Plus, History, Calendar, TrendingUp, TrendingDown,
    Building2, Search, Edit3, Trash2, CheckCircle2, Clock,
    AlertTriangle, Sparkles, Filter, Info, ArrowUpRight, Scale,
    HelpCircle, Calculator, Tag, ShieldCheck, ArrowDownLeft, ExternalLink
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
    addMaterialPrice,
    editMaterialPriceHistory,
    deleteMaterialPriceHistory,
    createMasterMaterial,
    simulatePriceAtDate
} from "./actions"

const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n || 0))
const fmtDate = (d: any) => d ? format(new Date(d), "dd MMM yyyy", { locale: idLocale }) : "-"
const fmtDateInput = (d: any) => d ? format(new Date(d), "yyyy-MM-dd") : ""

interface MasterMaterialClientProps {
    initialMaterials: any[]
    initialHistories: any[]
    locations: any[]
    userRole: string
    userLocationId?: string | null
}

export function MasterMaterialClient({
    initialMaterials = [],
    initialHistories = [],
    locations = [],
    userRole,
    userLocationId = null,
}: MasterMaterialClientProps) {
    const isSuperAdmin = userRole === "SuperAdminBP" || ["CEO", "FVP"].includes(userRole)
    const isAdmin = isSuperAdmin || userRole === "AdminBP" || userRole === "Admin" || userRole === "AdminLogistik"
    const canManage = isSuperAdmin || isAdmin
    const [isPending, startTransition] = useTransition()

    const [materials, setMaterials] = useState(initialMaterials)
    const [histories, setHistories] = useState(initialHistories)

    const [selectedLocation, setSelectedLocation] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<"active" | "history" | "simulator">("active")

    // Dialog state for setting new price
    const [showPriceDialog, setShowPriceDialog] = useState(false)
    const [priceFormMaterialId, setPriceFormMaterialId] = useState("")
    const [priceFormValue, setPriceFormValue] = useState<number | string>("")
    const [priceFormEffectiveDate, setPriceFormEffectiveDate] = useState(new Date().toISOString().split("T")[0])
    const [priceFormLocationIds, setPriceFormLocationIds] = useState<string[]>(["all"])
    const [priceFormNotes, setPriceFormNotes] = useState("")
    const [priceError, setPriceError] = useState("")

    // Dialog state for creating new material
    const [showNewMaterialDialog, setShowNewMaterialDialog] = useState(false)
    const [newMatCode, setNewMatCode] = useState("")
    const [newMatName, setNewMatName] = useState("")
    const [newMatCategory, setNewMatCategory] = useState("AGREGAT")
    const [newMatDensity, setNewMatDensity] = useState<number | string>("")
    const [newMatDescription, setNewMatDescription] = useState("")
    const [newMatInitialPrice, setNewMatInitialPrice] = useState<number | string>("")
    const [newMatEffectiveDate, setNewMatEffectiveDate] = useState(new Date().toISOString().split("T")[0])
    const [newMatLocationId, setNewMatLocationId] = useState("all")
    const [newMatError, setNewMatError] = useState("")

    // Dialog state for editing history
    const [showEditHistoryDialog, setShowEditHistoryDialog] = useState(false)
    const [editHistoryId, setEditHistoryId] = useState("")
    const [editHistoryMaterialName, setEditHistoryMaterialName] = useState("")
    const [editHistoryPrice, setEditHistoryPrice] = useState<number | string>("")
    const [editHistoryDate, setEditHistoryDate] = useState("")
    const [editHistoryLocationId, setEditHistoryLocationId] = useState("all")
    const [editHistoryNotes, setEditHistoryNotes] = useState("")

    // Dialog state for delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState("")
    const [deleteTargetText, setDeleteTargetText] = useState("")

    // Simulator State
    const [simMaterialCode, setSimMaterialCode] = useState(materials[0]?.code || "PASIR")
    const [simDate, setSimDate] = useState(new Date().toISOString().split("T")[0])
    const [simLocationId, setSimLocationId] = useState("all")
    const [simResult, setSimResult] = useState<any>(null)
    const [simLoading, setSimLoading] = useState(false)

    // Filtered materials: dynamically adapts to selectedLocation
    const filteredMaterials = useMemo(() => {
        return materials.filter(m => {
            const matchesSearch = !searchQuery ||
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.category.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesSearch
        }).map(m => {
            if (selectedLocation !== "all") {
                const override = m.branchOverrides?.find((b: any) => b.locationId === selectedLocation)
                const locObj = locations.find(l => l.id === selectedLocation)
                if (override) {
                    return {
                        ...m,
                        displayPrice: override.price,
                        displayEffectiveDate: override.effectiveDate,
                        displayLocationName: override.locationName || locObj?.name || "Cabang",
                        isBranchOverride: true,
                    }
                } else {
                    return {
                        ...m,
                        displayPrice: m.globalPrice ?? m.currentPrice,
                        displayEffectiveDate: m.currentEffectiveDate,
                        displayLocationName: `${locObj?.name || "Cabang"} (Mengikuti Global)`,
                        isBranchOverride: false,
                    }
                }
            } else {
                return {
                    ...m,
                    displayPrice: m.globalPrice ?? m.currentPrice,
                    displayEffectiveDate: m.currentEffectiveDate,
                    displayLocationName: "Semua Cabang (Global)",
                    isBranchOverride: false,
                }
            }
        })
    }, [materials, searchQuery, selectedLocation, locations])

    // Filtered histories
    const filteredHistories = useMemo(() => {
        return histories.filter(h => {
            const matchesLoc = selectedLocation === "all" || h.locationId === selectedLocation || (!h.locationId && selectedLocation === "all")
            const matchesSearch = !searchQuery ||
                h.material_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                h.material_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (h.notes && h.notes.toLowerCase().includes(searchQuery.toLowerCase()))
            return matchesLoc && matchesSearch
        })
    }, [histories, selectedLocation, searchQuery])

    // Open set price modal for specific material
    const handleOpenSetPrice = (mat: any) => {
        setPriceFormMaterialId(mat.id)
        setPriceFormValue(mat.displayPrice || mat.currentPrice || "")
        setPriceFormEffectiveDate(new Date().toISOString().split("T")[0])
        setPriceFormLocationIds(selectedLocation === "all" ? ["all"] : [selectedLocation])
        setPriceFormNotes("")
        setPriceError("")
        setShowPriceDialog(true)
    }

    // Submit Set Price
    const handleSavePrice = () => {
        setPriceError("")
        const numPrice = Number(priceFormValue)
        if (!numPrice || numPrice <= 0) {
            setPriceError("Nominal harga per kubik harus lebih besar dari 0.")
            return
        }
        if (!priceFormEffectiveDate) {
            setPriceError("Tanggal mulai berlaku wajib dipilih.")
            return
        }
        if (!priceFormLocationIds || priceFormLocationIds.length === 0) {
            setPriceError("Pilih minimal satu cabang atau Semua Cabang.")
            return
        }

        startTransition(async () => {
            try {
                await addMaterialPrice({
                    materialId: priceFormMaterialId,
                    price_per_m3: numPrice,
                    effective_date: priceFormEffectiveDate,
                    locationIds: priceFormLocationIds,
                    notes: priceFormNotes,
                })
                setShowPriceDialog(false)
                // Refresh local state without full reload
                window.location.reload()
            } catch (err: any) {
                setPriceError(err.message || "Gagal menyimpan harga material.")
            }
        })
    }

    // Submit New Material
    const handleCreateMaterial = () => {
        setNewMatError("")
        const numPrice = Number(newMatInitialPrice)
        if (!newMatCode.trim()) {
            setNewMatError("Kode material wajib diisi (misal: ABU_BATU).")
            return
        }
        if (!newMatName.trim()) {
            setNewMatError("Nama material wajib diisi.")
            return
        }
        if (!numPrice || numPrice <= 0) {
            setNewMatError("Harga awal per kubik harus lebih besar dari 0.")
            return
        }
        if (!newMatEffectiveDate) {
            setNewMatError("Tanggal mulai berlaku wajib diisi.")
            return
        }

        startTransition(async () => {
            try {
                await createMasterMaterial({
                    code: newMatCode,
                    name: newMatName,
                    category: newMatCategory,
                    unit: "m³",
                    defaultDensity: newMatDensity ? Number(newMatDensity) : undefined,
                    description: newMatDescription,
                    initial_price: numPrice,
                    effective_date: newMatEffectiveDate,
                    locationId: newMatLocationId === "all" ? null : newMatLocationId,
                    notes: "Penetapan harga awal material baru",
                })
                setShowNewMaterialDialog(false)
                window.location.reload()
            } catch (err: any) {
                setNewMatError(err.message || "Gagal membuat material baru.")
            }
        })
    }

    // Open Edit History Modal
    const handleOpenEditHistory = (h: any) => {
        setEditHistoryId(h.id)
        setEditHistoryMaterialName(h.material_name)
        setEditHistoryPrice(h.price_per_m3)
        setEditHistoryDate(fmtDateInput(h.effective_date))
        setEditHistoryLocationId(h.locationId || "all")
        setEditHistoryNotes(h.notes || "")
        setShowEditHistoryDialog(true)
    }

    // Quick Edit Active Price & Effective Date directly from Tab 1 or Cards
    const handleQuickEditActivePrice = (mat: any) => {
        let activeEntry = mat.histories?.find((h: any) => h.id === mat.currentHistoryId)
        if (!activeEntry && mat.histories && mat.histories.length > 0) {
            activeEntry = mat.histories[0]
        }

        if (activeEntry) {
            handleOpenEditHistory(activeEntry)
        } else {
            setEditHistoryId(mat.currentHistoryId || mat.id || "")
            setEditHistoryMaterialName(mat.name)
            setEditHistoryPrice(mat.currentPrice || 0)
            setEditHistoryDate(fmtDateInput(mat.currentEffectiveDate || new Date()))
            setEditHistoryLocationId(mat.currentLocationId || "all")
            setEditHistoryNotes(mat.currentNotes || "")
            setShowEditHistoryDialog(true)
        }
    }

    // Submit Edit History
    const handleSaveEditHistory = () => {
        const num = Number(editHistoryPrice)
        if (!num || num <= 0) return
        startTransition(async () => {
            try {
                await editMaterialPriceHistory({
                    id: editHistoryId,
                    price_per_m3: num,
                    effective_date: editHistoryDate,
                    locationId: editHistoryLocationId === "all" ? null : editHistoryLocationId,
                    notes: editHistoryNotes,
                })
                setShowEditHistoryDialog(false)
                window.location.reload()
            } catch (err: any) {
                alert(err.message || "Gagal mengupdate riwayat.")
            }
        })
    }

    // Execute Delete History
    const handleConfirmDelete = () => {
        if (!deleteTargetId) return
        startTransition(async () => {
            try {
                await deleteMaterialPriceHistory(deleteTargetId)
                setShowDeleteConfirm(false)
                window.location.reload()
            } catch (err: any) {
                alert(err.message || "Gagal menghapus riwayat.")
            }
        })
    }

    // Run Simulator
    const handleRunSimulation = async () => {
        setSimLoading(true)
        try {
            const res = await simulatePriceAtDate({
                materialCode: simMaterialCode,
                targetDate: simDate,
                locationId: simLocationId === "all" ? null : simLocationId,
            })
            setSimResult(res)
        } catch (err) {
            console.error(err)
        } finally {
            setSimLoading(false)
        }
    }

    return (
        <div className="space-y-5">
            {/* ═══ Header ══════════════════════════════════════════════════════════ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                            <Tag className="w-4 h-4" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Master Harga Material per Kubik (m³)
                        </h1>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                            Non-Semen (Agregat)
                        </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Kelola harga acuan dasar Pasir Cor, Batu Split, dan Agregat per m³ dengan pencatatan riwayat tanggal efektif (backdate safe).
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setNewMatCode("")
                            setNewMatName("")
                            setNewMatCategory("AGREGAT")
                            setNewMatDensity("")
                            setNewMatDescription("")
                            setNewMatInitialPrice("")
                            setNewMatEffectiveDate(new Date().toISOString().split("T")[0])
                            setNewMatLocationId("all")
                            setNewMatError("")
                            setShowNewMaterialDialog(true)
                        }}
                        className="h-8 text-xs cursor-pointer border-slate-300 hover:bg-slate-50 font-medium"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1 text-slate-600" />
                        Tambah Material Baru
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => {
                            if (materials.length > 0) {
                                handleOpenSetPrice(materials[0])
                            }
                        }}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-medium"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Tetapkan Harga Baru
                    </Button>
                </div>
            </div>

            {/* ═══ Integrasi Operasional Hub (Masuk & Keluar) ═════════════════════ */}
            <Card className="border-blue-200/90 bg-linear-to-r from-blue-50/70 via-sky-50/40 to-indigo-50/50 shadow-xs overflow-hidden">
                <CardContent className="p-4 space-y-3.5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                                    <span>Pusat Integrasi Harga Material (Masuk & Keluar)</span>
                                    <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0 h-4 font-semibold">
                                        Terhubung Otomatis
                                    </Badge>
                                </h3>
                                <p className="text-xs text-slate-600 mt-0.5">
                                    Harga acuan per m³ di master ini langsung menjadi sumber penentuan tarif default untuk seluruh transaksi material masuk dan keluar.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Link
                                href="/admin/material-agregat"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 hover:border-blue-400 text-blue-700 text-xs font-semibold rounded-lg shadow-2xs hover:bg-blue-50/60 transition-all"
                            >
                                <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
                                <span>Penerimaan Masuk</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>

                            <Link
                                href="/admin/material-agregat"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 hover:border-rose-400 text-rose-700 text-xs font-semibold rounded-lg shadow-2xs hover:bg-rose-50/60 transition-all"
                            >
                                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                                <span>Pengeluaran Keluar</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        <div className="bg-white/95 p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Material Masuk (Incoming)
                                </span>
                                <Badge variant="outline" className="text-[9px] bg-emerald-50 border-emerald-200 text-emerald-800">
                                    Internal & Eksternal
                                </Badge>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                <strong>Quarry Sendiri (Internal)</strong> & <strong>Pembelian Vendor (Eksternal)</strong> otomatis mengambil harga acuan per m³ saat transaksi dicatat, menghasilkan total nilai pengeluaran pokok material.
                            </p>
                        </div>

                        <div className="bg-white/95 p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                    Material Keluar (Outgoing)
                                </span>
                                <Badge variant="outline" className="text-[9px] bg-rose-50 border-rose-200 text-rose-800">
                                    Jual & Proyek Internal
                                </Badge>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                <strong>Penjualan Bebas (Eksternal)</strong> memakai harga ini sebagai harga jual default, sedangkan <strong>Proyek Lapangan Non-BP & Transfer (Internal)</strong> memakainya sebagai valuasi biaya pengeluaran.
                            </p>
                        </div>

                        <div className="bg-white/95 p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Point-in-Time & Cabang
                                </span>
                                <Badge variant="outline" className="text-[9px] bg-blue-50 border-blue-200 text-blue-800">
                                    Backdate Safe
                                </Badge>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Harga berlaku point-in-time berdasarkan tanggal surat jalan. Perubahan harga baru tidak merusak data historis sebelum tanggal efektif. Mendukung tarif per cabang atau global.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ═══ Material Highlight Cards (Current Active Rates) ═════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {materials.map((mat) => {
                    const isSand = mat.code.includes("PASIR")
                    const isStone = mat.code.includes("SPLIT") || mat.category === "BATU"

                    return (
                        <Card key={mat.id} className="border-slate-200/80 shadow-2xs bg-white hover:border-blue-300 transition-all group">
                            <CardContent className="p-3.5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Badge
                                        variant="outline"
                                        className={`text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider ${
                                            isSand
                                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                                : isStone
                                                ? "bg-blue-50 text-blue-800 border-blue-300"
                                                : "bg-slate-50 text-slate-700 border-slate-300"
                                        }`}
                                    >
                                        {mat.category}
                                    </Badge>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        {mat.code}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 truncate" title={mat.name}>
                                        {mat.name}
                                    </h4>
                                    <div className="text-[10px] text-slate-400">
                                        Satuan: <strong className="text-slate-600 font-mono">1 {mat.unit}</strong>
                                        {mat.defaultDensity && ` (±${mat.defaultDensity} kg)`}
                                    </div>
                                </div>

                                <div className="pt-1 border-t border-slate-100">
                                    <div className="text-lg font-bold font-mono text-slate-900">
                                        {fmt(mat.displayPrice ?? mat.currentPrice)}
                                    </div>
                                    <div className="text-[10px] text-emerald-700 flex items-center justify-between font-medium mt-0.5">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                            <span>Aktif: {fmtDate(mat.displayEffectiveDate ?? mat.currentEffectiveDate)}</span>
                                        </div>
                                        {canManage && (
                                            <button
                                                type="button"
                                                onClick={() => handleQuickEditActivePrice(mat)}
                                                className="text-[10px] text-blue-600 hover:text-blue-800 underline underline-offset-2 flex items-center gap-0.5 cursor-pointer"
                                                title="Koreksi tanggal berlaku atau nominal harga"
                                            >
                                                <Edit3 className="w-2.5 h-2.5" />
                                                <span>Koreksi</span>
                                            </button>
                                        )}
                                    </div>
                                    {selectedLocation === "all" && mat.branchOverrides && mat.branchOverrides.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-slate-100">
                                            {mat.branchOverrides.map((b: any) => (
                                                <span key={b.locationId} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    {b.locationName}: {fmt(b.price)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {mat.nextPrice && (
                                        <div className="text-[10px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 mt-1 border border-amber-200">
                                            Akan naik jadi {fmt(mat.nextPrice)} ({fmtDate(mat.nextEffectiveDate)})
                                        </div>
                                    )}
                                </div>

                                {canManage && (
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleQuickEditActivePrice(mat)}
                                            className="h-7 text-[10px] font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer justify-center"
                                            title="Koreksi tanggal mulai berlaku atau tarif aktif ini"
                                        >
                                            <Edit3 className="w-3 h-3 mr-1 text-slate-500" />
                                            <span>Koreksi Tgl</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleOpenSetPrice(mat)}
                                            className="h-7 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer justify-center"
                                            title="Tetapkan jadwal tarif baru"
                                        >
                                            <Plus className="w-3 h-3 mr-0.5" />
                                            <span>Harga Baru</span>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* ═══ Main Content Tabs ═══════════════════════════════════════════════ */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
                    <TabsList className="bg-slate-100 p-0.5">
                        <TabsTrigger value="active" className="text-xs">
                            <Layers className="w-3.5 h-3.5 mr-1" />
                            <span>Daftar Material & Harga Aktif</span>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="text-xs">
                            <History className="w-3.5 h-3.5 mr-1" />
                            <span>Riwayat Perubahan Harga ({histories.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="simulator" className="text-xs">
                            <Calculator className="w-3.5 h-3.5 mr-1" />
                            <span>Simulator Cek Backdate</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Filter controls */}
                    <div className="flex items-center gap-2">
                        {locations.length > 1 && (
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger className="h-8 text-xs w-48 bg-white">
                                    <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                    <SelectValue placeholder="Lingkup Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Cabang (Global)</SelectItem>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <div className="relative w-44 sm:w-56">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari material..."
                                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* ═══ TAB 1: DAFTAR MATERIAL & HARGA AKTIF ═════════════════════════ */}
                <TabsContent value="active" className="mt-4 space-y-4">
                    <Card className="border-slate-200/80 shadow-2xs">
                        <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Daftar Material Agregat & Harga Acuan Berlaku
                                </CardTitle>
                                <CardDescription className="text-[11px] text-slate-500">
                                    Harga acuan per meter kubik (m³) yang sedang aktif digunakan untuk estimasi pengeluaran
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader className="bg-slate-50 text-[11px]">
                                    <TableRow>
                                        <TableHead className="font-semibold text-slate-700">Kode</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Nama Material</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Kategori</TableHead>
                                        <TableHead className="text-center font-semibold text-slate-700">Satuan</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Densitas Standar</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Harga per m³</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Mulai Berlaku</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Lingkup Cabang</TableHead>
                                        <TableHead className="text-center font-semibold text-slate-700">Riwayat</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMaterials.map((mat) => (
                                        <TableRow key={mat.id} className="hover:bg-slate-50/80">
                                            <TableCell className="font-mono font-bold text-slate-800">
                                                {mat.code}
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-900">
                                                {mat.name}
                                                {mat.description && (
                                                    <div className="text-[10px] text-slate-400 font-normal">
                                                        {mat.description}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                    {mat.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-mono">
                                                1 {mat.unit}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-600">
                                                {mat.defaultDensity ? `${mat.defaultDensity} kg/m³` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-slate-900">
                                                {fmt(mat.displayPrice)}
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-700">
                                                {canManage ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickEditActivePrice(mat)}
                                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-700 cursor-pointer transition-colors group text-left"
                                                        title="Klik untuk koreksi tanggal mulai berlaku ini"
                                                    >
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                                                        <span className="font-mono text-xs">{fmtDate(mat.displayEffectiveDate)}</span>
                                                        <Edit3 className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600 opacity-60 group-hover:opacity-100 shrink-0" />
                                                    </button>
                                                ) : (
                                                    <span>{fmtDate(mat.displayEffectiveDate)}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                {selectedLocation !== "all" ? (
                                                    <div>
                                                        <Badge variant={mat.isBranchOverride ? "default" : "outline"} className={`text-[10px] px-1.5 py-0 ${
                                                            mat.isBranchOverride ? "bg-blue-600 text-white" : "text-slate-600 border-slate-300"
                                                        }`}>
                                                            {mat.displayLocationName}
                                                        </Badge>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="text-xs font-medium text-slate-800">Semua Cabang (Global)</span>
                                                        {mat.branchOverrides && mat.branchOverrides.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {mat.branchOverrides.map((b: any) => (
                                                                    <span key={b.locationId} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                                        {b.locationName}: {fmt(b.price)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-mono text-[10px]">
                                                    {mat.historyCount}x revisi
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {canManage ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleQuickEditActivePrice(mat)}
                                                            className="h-7 text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-blue-700 font-medium cursor-pointer"
                                                            title="Koreksi tanggal mulai berlaku atau harga aktif ini"
                                                        >
                                                            <Edit3 className="w-3 h-3 mr-1 text-slate-500" />
                                                            <span>Koreksi Tanggal/Tarif</span>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => handleOpenSetPrice(mat)}
                                                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer"
                                                            title="Tetapkan jadwal tarif baru di masa depan"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" />
                                                            <span>Tetapkan Baru</span>
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">Lihat Saja</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* ═══ TAB 2: RIWAYAT PERUBAHAN HARGA (COMPLETE TIMELINE) ═══════════ */}
                <TabsContent value="history" className="mt-4 space-y-4">
                    <Card className="border-slate-200/80 shadow-2xs">
                        <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Riwayat Kronologis Penetapan Harga Material
                                </CardTitle>
                                <CardDescription className="text-[11px] text-slate-500">
                                    Catatan riwayat tanggal mulai berlaku, selisih kenaikan/penurunan harga, dan penanggung jawab
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader className="bg-slate-50 text-[11px]">
                                    <TableRow>
                                        <TableHead className="font-semibold text-slate-700">Tgl Berlaku (Effective)</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Material</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Harga Satuan (Rp/m³)</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Perubahan</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Lingkup Cabang</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Keterangan / Alasan</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Dicatat Oleh</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHistories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-6 text-slate-400 italic">
                                                Belum ada riwayat perubahan harga.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredHistories.map((h: any) => {
                                            const isIncrease = h.price_diff > 0
                                            const isDecrease = h.price_diff < 0
                                            return (
                                                <TableRow key={h.id} className="hover:bg-slate-50/80">
                                                    <TableCell className="font-mono font-medium text-slate-800">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                            <span>{fmtDate(h.effective_date)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-slate-900">
                                                        {h.material_name}
                                                        <span className="text-[10px] text-slate-400 ml-1 font-mono">({h.material_code})</span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold text-slate-900">
                                                        {fmt(h.price_per_m3)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {h.old_price && h.old_price > 0 ? (
                                                            <span className={`inline-flex items-center gap-0.5 font-semibold text-[11px] ${
                                                                isIncrease ? "text-rose-600" : isDecrease ? "text-emerald-600" : "text-slate-500"
                                                            }`}>
                                                                {isIncrease ? <TrendingUp className="w-3 h-3" /> : isDecrease ? <TrendingDown className="w-3 h-3" /> : null}
                                                                {isIncrease ? "+" : ""}{fmt(h.price_diff)} ({h.percentage.toFixed(1)}%)
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-[10px]">Harga Dasar Awal</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-slate-600">
                                                        {h.locationName}
                                                    </TableCell>
                                                    <TableCell className="text-slate-600 max-w-[200px] truncate" title={h.notes}>
                                                        {h.notes || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500">
                                                        {h.createdByName}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleOpenEditHistory(h)}
                                                                className="h-6 w-6 p-0 text-slate-600 hover:text-blue-600 cursor-pointer"
                                                                title="Edit riwayat ini"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setDeleteTargetId(h.id)
                                                                    setDeleteTargetText(`${h.material_name} - ${fmt(h.price_per_m3)} (Berlaku: ${fmtDate(h.effective_date)})`)
                                                                    setShowDeleteConfirm(true)
                                                                }}
                                                                className="h-6 w-6 p-0 text-slate-600 hover:text-rose-600 cursor-pointer"
                                                                title="Hapus riwayat ini"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* ═══ TAB 3: SIMULATOR / KALKULATOR CEK BACKDATE ═══════════════════ */}
                <TabsContent value="simulator" className="mt-4">
                    <Card className="border-slate-200/80 shadow-2xs bg-white">
                        <CardHeader className="p-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-600 text-white rounded-md">
                                    <Calculator className="w-4 h-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800">
                                        Simulator Validasi Harga Berdasarkan Tanggal (Backdate Safe Checker)
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500">
                                        Uji coba langsung logika tanggal efektif: sistem akan mencari harga yang sah berlaku pada tanggal tersebut tanpa mengganggu harga masa lalu atau masa depan.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div>
                                    <Label className="text-xs font-semibold text-slate-700">Pilih Material</Label>
                                    <Select value={simMaterialCode} onValueChange={setSimMaterialCode}>
                                        <SelectTrigger className="h-9 text-xs bg-white mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {materials.map(m => (
                                                <SelectItem key={m.code} value={m.code}>{m.name} ({m.code})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-slate-700">Pilih Tanggal Transaksi / Pengeluaran</Label>
                                    <Input
                                        type="date"
                                        className="h-9 text-xs bg-white mt-1"
                                        value={simDate}
                                        onChange={e => setSimDate(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-slate-700">Cabang (Opsional)</Label>
                                    <Select value={simLocationId} onValueChange={setSimLocationId}>
                                        <SelectTrigger className="h-9 text-xs bg-white mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Cabang (Global)</SelectItem>
                                            {locations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        onClick={handleRunSimulation}
                                        disabled={simLoading}
                                        className="h-9 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs cursor-pointer font-medium"
                                    >
                                        {simLoading ? "Memeriksa..." : "Cek Harga Berlaku"}
                                    </Button>
                                </div>
                            </div>

                            {/* Simulation Result Box */}
                            {simResult && (
                                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2 mt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                            Hasil Pengecekan Harga Pada Tanggal: {fmtDate(simDate)}
                                        </span>
                                        <Badge className="bg-indigo-600 text-white font-mono">
                                            {fmt(simResult.matchedPrice)} / m³
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-indigo-950">
                                        Untuk material <strong>{materials.find(m => m.code === simMaterialCode)?.name}</strong> pada tanggal <strong>{fmtDate(simDate)}</strong>, harga dasar pengeluaran yang sah digunakan adalah <strong>{fmt(simResult.matchedPrice)} per m³</strong>.
                                    </p>
                                    <div className="pt-2 border-t border-indigo-200/80 text-[11px] text-indigo-800 flex items-center gap-4 flex-wrap">
                                        <div>
                                            Mulai berlaku sejak: <strong>{fmtDate(simResult.matchedEffectiveDate)}</strong>
                                        </div>
                                        <div>•</div>
                                        <div>
                                            Lingkup: <strong>{simResult.matchedLocationName}</strong>
                                        </div>
                                        {simResult.notes && (
                                            <>
                                                <div>•</div>
                                                <div>Catatan: <em>{simResult.notes}</em></div>
                                            </>
                                        )}
                                        {simResult.nextPrice && (
                                            <>
                                                <div>•</div>
                                                <div className="text-amber-800">
                                                    (Perubahan berikutnya: {fmt(simResult.nextPrice)} pada {fmtDate(simResult.nextEffectiveDate)})
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ═══ MODAL 1: SET / JADWALKAN HARGA BARU ══════════════════════════════ */}
            <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
                <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Tetapkan Harga Acuan Material</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Tentukan harga per kubik (m³) dan tanggal mulai berlakunya. Harga lama sebelum tanggal ini tidak akan berubah (backdate safe).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3.5 py-2">
                        {priceError && (
                            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{priceError}</span>
                            </div>
                        )}

                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Material Agregat</Label>
                            <Select value={priceFormMaterialId} onValueChange={setPriceFormMaterialId}>
                                <SelectTrigger className="h-9 text-xs mt-1 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {materials.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Harga Satuan per Kubik (Rp / m³)</Label>
                            <Input
                                type="number"
                                placeholder="Contoh: 185000"
                                className="h-9 text-xs font-mono font-bold mt-1"
                                value={priceFormValue}
                                onChange={e => setPriceFormValue(e.target.value)}
                            />
                            {Number(priceFormValue) > 0 && (
                                <p className="text-[11px] text-blue-600 font-mono mt-0.5">
                                    = {fmt(Number(priceFormValue))} per m³
                                </p>
                            )}
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800 space-y-1">
                            <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Perhatikan Tanggal Mulai Berlaku (Backdate)</span>
                            </div>
                            <p className="leading-relaxed">
                                Pastikan <strong>Tanggal Mulai Berlaku</strong> di bawah ini diisi sesuai tanggal awal berlakunya harga (contoh: 01 September). Jika Anda hanya ingin memperbaiki tanggal harga yang barusan disimpan, gunakan tombol <strong>"Koreksi Tanggal/Tarif"</strong>.
                            </p>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Tanggal Mulai Berlaku (Effective Date)</Label>
                            <Input
                                type="date"
                                className="h-9 text-xs mt-1"
                                value={priceFormEffectiveDate}
                                onChange={e => setPriceFormEffectiveDate(e.target.value)}
                            />
                            <p className="text-[10px] text-slate-500 mt-0.5">
                                Seluruh transaksi pada tanggal ini dan setelahnya akan menggunakan harga ini. Transaksi sebelum tanggal ini tetap menggunakan harga sebelumnya.
                            </p>
                        </div>

                        {locations.length > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-slate-700">Lingkup Cabang Berlaku</Label>
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <button
                                            type="button"
                                            onClick={() => setPriceFormLocationIds(["all"])}
                                            className="text-blue-600 hover:underline cursor-pointer"
                                        >
                                            Pilih Global
                                        </button>
                                        <span>•</span>
                                        <button
                                            type="button"
                                            onClick={() => setPriceFormLocationIds(locations.map(l => l.id))}
                                            className="text-blue-600 hover:underline cursor-pointer"
                                        >
                                            Pilih Semua Cabang
                                        </button>
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                            checked={priceFormLocationIds.includes("all")}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setPriceFormLocationIds(["all"])
                                                } else {
                                                    setPriceFormLocationIds([])
                                                }
                                            }}
                                        />
                                        <span>Semua Cabang (Global Default)</span>
                                    </label>
                                    <div className="border-t border-slate-200/60 pt-2 grid grid-cols-2 gap-1.5">
                                        {locations.map((loc) => {
                                            const isChecked = priceFormLocationIds.includes(loc.id)
                                            return (
                                                <label key={loc.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-blue-700">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            let next = priceFormLocationIds.filter(id => id !== "all")
                                                            if (e.target.checked) {
                                                                next.push(loc.id)
                                                            } else {
                                                                next = next.filter(id => id !== loc.id)
                                                            }
                                                            if (next.length === 0) {
                                                                next = ["all"]
                                                            }
                                                            setPriceFormLocationIds(next)
                                                        }}
                                                    />
                                                    <span className="truncate" title={loc.name}>{loc.name}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500">
                                    {priceFormLocationIds.includes("all")
                                        ? "Harga berlaku serentak sebagai acuan umum semua cabang."
                                        : `Harga berlaku khusus untuk ${priceFormLocationIds.length} cabang terpilih.`}
                                </p>
                            </div>
                        )}

                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Keterangan / Alasan Perubahan (Opsional)</Label>
                            <Input
                                placeholder="Contoh: Kenaikan harga solar, penyesuaian tambang galian C"
                                className="h-9 text-xs mt-1"
                                value={priceFormNotes}
                                onChange={e => setPriceFormNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPriceDialog(false)}
                            className="h-8 text-xs cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSavePrice}
                            disabled={isPending}
                            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-medium"
                        >
                            {isPending ? "Menyimpan..." : "Simpan Harga"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL 2: TAMBAH JENIS MATERIAL BARU ═════════════════════════════ */}
            <Dialog open={showNewMaterialDialog} onOpenChange={setShowNewMaterialDialog}>
                <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Tambah Jenis Material Agregat</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Daftarkan material non-semen baru ke dalam katalog harga perusahaan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3.5 py-2">
                        {newMatError && (
                            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{newMatError}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Kode Unik</Label>
                                <Input
                                    placeholder="Contoh: SIRTU"
                                    className="h-9 text-xs font-mono uppercase mt-1"
                                    value={newMatCode}
                                    onChange={e => setNewMatCode(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Kategori</Label>
                                <Select value={newMatCategory} onValueChange={setNewMatCategory}>
                                    <SelectTrigger className="h-9 text-xs mt-1 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PASIR">Pasir</SelectItem>
                                        <SelectItem value="BATU">Batu / Split</SelectItem>
                                        <SelectItem value="AGREGAT">Agregat Campuran</SelectItem>
                                        <SelectItem value="LAINNYA">Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Nama Material</Label>
                            <Input
                                placeholder="Contoh: Sirtu Urug Jayapura"
                                className="h-9 text-xs mt-1"
                                value={newMatName}
                                onChange={e => setNewMatName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Harga Awal per m³ (Rp)</Label>
                                <Input
                                    type="number"
                                    placeholder="Contoh: 160000"
                                    className="h-9 text-xs font-mono font-bold mt-1"
                                    value={newMatInitialPrice}
                                    onChange={e => setNewMatInitialPrice(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Mulai Berlaku</Label>
                                <Input
                                    type="date"
                                    className="h-9 text-xs mt-1"
                                    value={newMatEffectiveDate}
                                    onChange={e => setNewMatEffectiveDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Estimasi Densitas (kg/m³, Opsional)</Label>
                            <Input
                                type="number"
                                placeholder="Contoh: 1400"
                                className="h-9 text-xs font-mono mt-1"
                                value={newMatDensity}
                                onChange={e => setNewMatDensity(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Deskripsi / Catatan (Opsional)</Label>
                            <Input
                                placeholder="Keterangan kegunaan material"
                                className="h-9 text-xs mt-1"
                                value={newMatDescription}
                                onChange={e => setNewMatDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNewMaterialDialog(false)}
                            className="h-8 text-xs cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleCreateMaterial}
                            disabled={isPending}
                            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-medium"
                        >
                            {isPending ? "Mendaftarkan..." : "Daftarkan Material"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL 3: EDIT RIWAYAT ════════════════════════════════════════════ */}
            <Dialog open={showEditHistoryDialog} onOpenChange={setShowEditHistoryDialog}>
                <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Koreksi Riwayat Harga</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Perbaiki nilai harga atau tanggal berlaku untuk catatan riwayat: {editHistoryMaterialName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3.5 py-2">
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Harga Satuan (Rp / m³)</Label>
                            <Input
                                type="number"
                                className="h-9 text-xs font-mono font-bold mt-1"
                                value={editHistoryPrice}
                                onChange={e => setEditHistoryPrice(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Tanggal Mulai Berlaku</Label>
                            <Input
                                type="date"
                                className="h-9 text-xs mt-1"
                                value={editHistoryDate}
                                onChange={e => setEditHistoryDate(e.target.value)}
                            />
                        </div>

                        {locations.length > 1 && (
                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Lingkup Cabang</Label>
                                <Select value={editHistoryLocationId} onValueChange={setEditHistoryLocationId}>
                                    <SelectTrigger className="h-9 text-xs mt-1 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Cabang (Global)</SelectItem>
                                        {locations.map(loc => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Catatan / Alasan</Label>
                            <Input
                                className="h-9 text-xs mt-1"
                                value={editHistoryNotes}
                                onChange={e => setEditHistoryNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEditHistoryDialog(false)}
                            className="h-8 text-xs cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSaveEditHistory}
                            disabled={isPending}
                            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-medium"
                        >
                            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL 4: HAPUS RIWAYAT CONFIRMATION ══════════════════════════════ */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="max-w-sm bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            Konfirmasi Hapus Riwayat
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-600 mt-1">
                            Apakah Anda yakin ingin menghapus catatan riwayat harga:
                            <br />
                            <strong className="text-slate-900 block mt-1">{deleteTargetText}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="h-8 text-xs cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleConfirmDelete}
                            disabled={isPending}
                            className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer font-medium"
                        >
                            {isPending ? "Menghapus..." : "Ya, Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
