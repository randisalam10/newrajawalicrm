"use client"

import { useState, useTransition, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import {
    Plus,
    Pencil,
    Trash2,
    Landmark,
    Building2,
    Calendar,
    Coins,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    FileText,
    ShieldAlert,
    Target
} from "lucide-react"
import {
    createFixedCostContract,
    updateFixedCostContract,
    deleteFixedCostContract,
    toggleFixedCostContractStatus
} from "./actions"
import { OperationalTargetsTab } from "./components/operational-targets-tab"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { toast } from "sonner"
import { format, differenceInMonths, differenceInDays } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export const DIRECT_COGS_CATEGORIES = [
    { value: "GAJI_KARYAWAN", label: "Gaji & Upah Karyawan / Operator", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
    { value: "BIAYA_POKOK_LAINNYA", label: "Biaya Pokok Langsung Lainnya", color: "bg-rose-50 text-rose-800 border-rose-200" },
    { value: "SUBKONTRAKTOR_PRODUKSI", label: "Subkontraktor & Jasa Cor Khusus", color: "bg-orange-50 text-orange-800 border-orange-200" },
    { value: "KIMIA_ADDITIVE_KHUSUS", label: "Bahan Kimia & Additive Khusus", color: "bg-amber-50 text-amber-800 border-amber-200" },
    { value: "LAB_UJI_BETON", label: "Uji Laboratorium & Slump Test Lapangan", color: "bg-red-50 text-red-800 border-red-200" },
]

export const FIXED_OVERHEAD_CATEGORIES = [
    { value: "SEWA_TANAH", label: "Sewa Tanah / Lahan Plant", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    { value: "SEWA_MESS", label: "Sewa Mess & Kantor", color: "bg-blue-50 text-blue-800 border-blue-200" },
    { value: "PAJAK_KIR", label: "Pajak STNK & Uji KIR Armada", color: "bg-teal-50 text-teal-800 border-teal-200" },
    { value: "PERIZINAN", label: "Perizinan, Amdal & Legalitas", color: "bg-amber-50 text-amber-800 border-amber-200" },
    { value: "ASURANSI", label: "Asuransi Plant & Alat", color: "bg-purple-50 text-purple-800 border-purple-200" },
    { value: "RETRIBUSI", label: "Retribusi & Iuran Warga", color: "bg-cyan-50 text-cyan-800 border-cyan-200" },
    { value: "LAINNYA", label: "Beban Tetap Lainnya", color: "bg-slate-50 text-slate-800 border-slate-200" },
]

export const ALL_CATEGORIES = [...DIRECT_COGS_CATEGORIES, ...FIXED_OVERHEAD_CATEGORIES]

export const isDirectCogs = (cat: string) => {
    const upper = (cat || "").toUpperCase()
    return (
        ["GAJI_KARYAWAN", "BIAYA_POKOK_LAINNYA", "SUBKONTRAKTOR_PRODUKSI", "KIMIA_ADDITIVE_KHUSUS", "LAB_UJI_BETON"].includes(upper) ||
        upper === "GAJI" ||
        upper.startsWith("COGS_") ||
        upper.startsWith("BIAYA_POKOK") ||
        upper.startsWith("GAJI_")
    )
}



export function FixedCostsClient({
    initialData = [],
    initialTargetSetting,
    locations = [],
    userRole,
    canManage = true,
    isCorporate = false,
}: {
    initialData: any[]
    initialTargetSetting?: any
    locations: any[]
    userRole: string
    canManage?: boolean
    isCorporate?: boolean
}) {
    const router = useRouter()
    const [activeMainTab, setActiveMainTab] = useState<"CONTRACTS" | "TARGETS">("CONTRACTS")
    const [dataList, setDataList] = useState<any[]>(initialData)
    const [open, setOpen] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<"ALL" | "DIRECT_COGS" | "FIXED_OVERHEAD">("ALL")
    const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("ALL")
    const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>("all")
    const [isPending, startTransition] = useTransition()

    // Sync initialData if updated from server
    useEffect(() => {
        if (initialData) {
            setDataList(initialData)
        }
    }, [initialData])

    // Form States
    const [costClassification, setCostClassification] = useState<"BEBAN_TETAP" | "BIAYA_POKOK_LANGSUNG">("BEBAN_TETAP")
    const [name, setName] = useState("")
    const [category, setCategory] = useState("SEWA_TANAH")
    const [vendorName, setVendorName] = useState("")
    const [contractNumber, setContractNumber] = useState("")
    const [totalAmount, setTotalAmount] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [paymentStatus, setPaymentStatus] = useState("LUNAS")
    const [locationId, setLocationId] = useState("all")
    const [notes, setNotes] = useState("")

    // Opsi Mode Periode Amortisasi (Tahunan, Bulanan, Kustom)
    const [periodMode, setPeriodMode] = useState<"TAHUNAN" | "BULANAN" | "KUSTOM">("TAHUNAN")
    const [customDurationMonths, setCustomDurationMonths] = useState<string>("12")

    // Perhitungan Durasi Bulan Cerdas
    const computedDuration = useMemo(() => {
        if (periodMode === "TAHUNAN") return 12
        if (periodMode === "BULANAN") return 1
        const parsed = parseInt(customDurationMonths)
        if (!isNaN(parsed) && parsed > 0) return parsed
        if (!startDate || !endDate) return 12
        const start = new Date(startDate)
        const end = new Date(endDate)
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 1
        const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        return Math.max(1, Math.round(diffDays / 30.4375))
    }, [periodMode, customDurationMonths, startDate, endDate])

    const computedMonthly = useMemo(() => {
        const tot = Number(totalAmount) || 0
        return computedDuration > 0 ? Math.round(tot / computedDuration) : tot
    }, [totalAmount, computedDuration])

    // Handler perpindahan mode periode (Tahunan vs Bulanan vs Kustom)
    const applyPeriodMode = (mode: "TAHUNAN" | "BULANAN" | "KUSTOM", baseStartDate?: string) => {
        setPeriodMode(mode)
        const sDate = baseStartDate || startDate || format(new Date(), "yyyy-MM-01")
        const start = new Date(sDate)
        if (isNaN(start.getTime())) return

        if (mode === "TAHUNAN") {
            const nextYear = new Date(start)
            nextYear.setFullYear(nextYear.getFullYear() + 1)
            nextYear.setDate(nextYear.getDate() - 1)
            setEndDate(format(nextYear, "yyyy-MM-dd"))
            setCustomDurationMonths("12")
        } else if (mode === "BULANAN") {
            const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0)
            setEndDate(format(endOfMonth, "yyyy-MM-dd"))
            setCustomDurationMonths("1")
        } else {
            setCustomDurationMonths(String(computedDuration || 12))
        }
    }

    const handleStartDateChange = (val: string) => {
        setStartDate(val)
        if (!val) return
        const start = new Date(val)
        if (isNaN(start.getTime())) return

        if (periodMode === "TAHUNAN") {
            const nextYear = new Date(start)
            nextYear.setFullYear(nextYear.getFullYear() + 1)
            nextYear.setDate(nextYear.getDate() - 1)
            setEndDate(format(nextYear, "yyyy-MM-dd"))
        } else if (periodMode === "BULANAN") {
            const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0)
            setEndDate(format(endOfMonth, "yyyy-MM-dd"))
        } else if (periodMode === "KUSTOM") {
            const m = parseInt(customDurationMonths)
            if (!isNaN(m) && m > 0) {
                const end = new Date(start)
                end.setMonth(end.getMonth() + m)
                end.setDate(end.getDate() - 1)
                setEndDate(format(end, "yyyy-MM-dd"))
            }
        }
    }

    const applyPresetMonths = (months: number) => {
        setCustomDurationMonths(String(months))
        if (startDate) {
            const start = new Date(startDate)
            if (!isNaN(start.getTime())) {
                const end = new Date(start)
                end.setMonth(end.getMonth() + months)
                end.setDate(end.getDate() - 1)
                setEndDate(format(end, "yyyy-MM-dd"))
            }
        }
    }

    const handleCustomDurationChange = (val: string) => {
        setCustomDurationMonths(val)
        const m = parseInt(val)
        if (!isNaN(m) && m > 0 && startDate) {
            const start = new Date(startDate)
            if (!isNaN(start.getTime())) {
                const end = new Date(start)
                end.setMonth(end.getMonth() + m)
                end.setDate(end.getDate() - 1)
                setEndDate(format(end, "yyyy-MM-dd"))
            }
        }
    }

    const handleEndDateChange = (val: string) => {
        setEndDate(val)
        if (periodMode === "KUSTOM" && startDate && val) {
            const start = new Date(startDate)
            const end = new Date(val)
            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
                const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                const calculatedMonths = Math.max(1, Math.round(diffDays / 30.4375))
                setCustomDurationMonths(String(calculatedMonths))
            }
        }
    }

    const handleOpenNew = (defaultType?: "BEBAN_TETAP" | "BIAYA_POKOK_LANGSUNG") => {
        setEditData(null)
        setName("")
        const initialType = defaultType || (selectedTypeFilter === "DIRECT_COGS" ? "BIAYA_POKOK_LANGSUNG" : "BEBAN_TETAP")
        setCostClassification(initialType)
        setCategory(initialType === "BIAYA_POKOK_LANGSUNG" ? "BIAYA_POKOK_LAINNYA" : "SEWA_TANAH")
        setVendorName("")
        setContractNumber("")
        setTotalAmount("")
        const defaultStart = format(new Date(), "yyyy-MM-01")
        setStartDate(defaultStart)
        setPeriodMode("TAHUNAN")
        setCustomDurationMonths("12")
        const start = new Date(defaultStart)
        const nextYear = new Date(start)
        nextYear.setFullYear(nextYear.getFullYear() + 1)
        nextYear.setDate(nextYear.getDate() - 1)
        setEndDate(format(nextYear, "yyyy-MM-dd"))
        setPaymentStatus("LUNAS")
        setLocationId("all")
        setNotes("")
        setOpen(true)
    }

    const handleOpenEdit = (item: any) => {
        setEditData(item)
        setName(item.name || "")
        const isCogs = isDirectCogs(item.category)
        setCostClassification(isCogs ? "BIAYA_POKOK_LANGSUNG" : "BEBAN_TETAP")
        setCategory(item.category || (isCogs ? "BIAYA_POKOK_LAINNYA" : "SEWA_TANAH"))
        setVendorName(item.vendor_name || "")
        setContractNumber(item.contract_number || "")
        setTotalAmount(item.total_amount ? String(item.total_amount) : "")

        setStartDate(item.start_date ? format(new Date(item.start_date), "yyyy-MM-dd") : "")
        setEndDate(item.end_date ? format(new Date(item.end_date), "yyyy-MM-dd") : "")
        setPaymentStatus(item.payment_status || "LUNAS")
        setLocationId(item.locationId || "all")
        setNotes(item.notes || "")
        if (item.duration_months === 1) {
            setPeriodMode("BULANAN")
            setCustomDurationMonths("1")
        } else if (item.duration_months === 12) {
            setPeriodMode("TAHUNAN")
            setCustomDurationMonths("12")
        } else {
            setPeriodMode("KUSTOM")
            setCustomDurationMonths(String(item.duration_months || 12))
        }
        setOpen(true)
    }

    async function handleSubmit(formData: FormData) {
        formData.set("name", name.trim())
        formData.set("category", category)
        if (vendorName.trim()) formData.set("vendor_name", vendorName.trim())
        if (contractNumber.trim()) formData.set("contract_number", contractNumber.trim())
        formData.set("total_amount", totalAmount || "0")
        formData.set("start_date", startDate)
        formData.set("end_date", endDate)
        formData.set("duration_months", String(computedDuration))
        formData.set("monthly_amount", String(computedMonthly))
        formData.set("payment_status", paymentStatus)
        formData.set("locationId", locationId)
        if (notes.trim()) formData.set("notes", notes.trim())
        formData.set("isActive", "true")

        let result: any
        if (editData) {
            result = await updateFixedCostContract(editData.id, formData)
        } else {
            result = await createFixedCostContract(formData)
        }

        if (result.success) {
            toast.success(editData ? "Kontrak beban tetap berhasil diperbarui" : "Kontrak beban tetap baru berhasil ditambahkan")
            setOpen(false)

            const savedItem = result.data || {
                id: editData?.id,
                name: name.trim(),
                category,
                vendor_name: vendorName.trim() || null,
                contract_number: contractNumber.trim() || null,
                total_amount: Number(totalAmount) || 0,
                start_date: startDate,
                end_date: endDate,
                duration_months: computedDuration,
                monthly_amount: computedMonthly,
                payment_status: paymentStatus,
                locationId: locationId === "all" ? null : locationId,
                notes: notes.trim() || null,
                isActive: editData ? editData.isActive : true
            }

            const locId = savedItem.locationId || savedItem.location?.id
            const matchedLoc = locations.find(l => l.id === locId) || null
            const fullItem = { ...savedItem, location: matchedLoc }

            if (editData) {
                setDataList(prev => prev.map(d => d.id === editData.id ? { ...d, ...fullItem } : d))
            } else {
                setDataList(prev => [fullItem, ...prev])
            }

            setEditData(null)
            router.refresh()
        } else {
            toast.error("Error: " + (typeof result.error === "object" ? JSON.stringify(result.error) : result.error))
        }
    }

    async function handleDelete(id: string) {
        if (confirm("Apakah Anda yakin ingin menghapus kontrak beban tetap ini? Data amortisasi pada laporan bulan terkait akan terhapus.")) {
            const result = await deleteFixedCostContract(id)
            if (result.success) {
                toast.success("Kontrak berhasil dihapus")
                setDataList(prev => prev.filter(d => d.id !== id))
                router.refresh()
            } else {
                toast.error("Gagal menghapus: " + result.error)
            }
        }
    }

    async function handleToggleStatus(id: string) {
        const result = await toggleFixedCostContractStatus(id)
        if (result.success) {
            setDataList(prev => prev.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d))
            toast.success("Status kontrak berhasil diubah")
            router.refresh()
        } else {
            toast.error("Gagal mengubah status: " + result.error)
        }
    }

    // Filter Data
    const filteredData = useMemo(() => {
        return dataList.filter(item => {
            const isCogs = isDirectCogs(item.category)
            const matchType =
                selectedTypeFilter === "ALL" ||
                (selectedTypeFilter === "DIRECT_COGS" && isCogs) ||
                (selectedTypeFilter === "FIXED_OVERHEAD" && !isCogs)

            const matchCategory = selectedCategoryTab === "ALL" || item.category === selectedCategoryTab
            const matchLocation = selectedLocationFilter === "all" || item.locationId === selectedLocationFilter || !item.locationId
            return matchType && matchCategory && matchLocation
        })
    }, [dataList, selectedTypeFilter, selectedCategoryTab, selectedLocationFilter])

    // Summary Metrics
    const metrics = useMemo(() => {
        const activeItems = dataList.filter(d => d.isActive)
        const totalCommitment = activeItems.reduce((s, d) => s + (d.total_amount || 0), 0)
        const totalMonthlyAmortization = activeItems.reduce((s, d) => s + (d.monthly_amount || 0), 0)

        const directCogsActive = activeItems.filter(d => isDirectCogs(d.category))
        const overheadActive = activeItems.filter(d => !isDirectCogs(d.category))

        const totalDirectCogsMonthly = directCogsActive.reduce((s, d) => s + (d.monthly_amount || 0), 0)
        const totalOverheadMonthly = overheadActive.reduce((s, d) => s + (d.monthly_amount || 0), 0)

        const now = new Date()
        const expiringSoon = activeItems.filter(d => {
            const end = new Date(d.end_date)
            const days = differenceInDays(end, now)
            return days >= 0 && days <= 60
        }).length

        return {
            activeCount: activeItems.length,
            directCogsCount: directCogsActive.length,
            overheadCount: overheadActive.length,
            totalCommitment,
            totalMonthlyAmortization,
            totalDirectCogsMonthly,
            totalOverheadMonthly,
            expiringSoon
        }
    }, [dataList])

    // List kategori yang ditampilkan pada tab sub-kategori
    const availableCategoryTabs = useMemo(() => {
        if (selectedTypeFilter === "DIRECT_COGS") return DIRECT_COGS_CATEGORIES
        if (selectedTypeFilter === "FIXED_OVERHEAD") return FIXED_OVERHEAD_CATEGORIES
        return ALL_CATEGORIES
    }, [selectedTypeFilter])

    return (
        <div className="space-y-6">
            {/* Header & Action Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                            <Landmark className="h-5 w-5" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            Master Biaya &amp; Target Operasional
                        </h1>
                    </div>
                    <p className="text-xs text-slate-500 pl-9">
                        Kelola data Biaya Pokok Langsung manual (COGS Bagian B), Beban Tetap &amp; Amortisasi (Overhead Bagian D), serta Standar Target Unit Economics.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {isCorporate && (
                        <Select value={selectedLocationFilter} onValueChange={setSelectedLocationFilter}>
                            <SelectTrigger className="w-[170px] h-9 text-xs bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Filter Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs">Semua Cabang (HO)</SelectItem>
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                        {loc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {canManage && activeMainTab === "CONTRACTS" && (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => handleOpenNew("BIAYA_POKOK_LANGSUNG")}
                                variant="outline"
                                className="border-rose-300 text-rose-700 hover:bg-rose-50 h-9 text-xs gap-1.5 font-semibold cursor-pointer shadow-2xs"
                            >
                                <Plus className="h-4 w-4 text-rose-600" />
                                <span>+ Biaya Pokok Langsung (COGS)</span>
                            </Button>
                            <Button
                                onClick={() => handleOpenNew("BEBAN_TETAP")}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs gap-1.5 shadow-2xs font-semibold cursor-pointer"
                            >
                                <Plus className="h-4 w-4" />
                                <span>+ Kontrak Beban Tetap</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Button
                    variant={activeMainTab === "CONTRACTS" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveMainTab("CONTRACTS")}
                    className={`h-9 text-xs font-semibold gap-2 ${
                        activeMainTab === "CONTRACTS"
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Daftar Kontrak &amp; Biaya Operasional</span>
                    <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1.5 font-mono">
                        {metrics.activeCount}
                    </Badge>
                </Button>

                <Button
                    variant={activeMainTab === "TARGETS" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveMainTab("TARGETS")}
                    className={`h-9 text-xs font-semibold gap-2 ${
                        activeMainTab === "TARGETS"
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                    <Target className="h-4 w-4 text-emerald-500" />
                    <span>Standar &amp; Target Operasional (Unit Economics)</span>
                </Button>
            </div>

            {activeMainTab === "TARGETS" ? (
                <OperationalTargetsTab
                    initialTargetSetting={initialTargetSetting}
                    locations={locations}
                    isCorporate={isCorporate}
                    canManage={canManage}
                />
            ) : (
                <>
            {/* Scorecard Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                        <span>Total Kontrak Aktif</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono">
                        {metrics.activeCount} <span className="text-xs font-normal text-slate-400 font-sans">Perjanjian</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                        {metrics.directCogsCount} COGS manual, {metrics.overheadCount} Beban tetap
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                        <span>Total Nilai Komitmen</span>
                        <Coins className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 font-mono">
                        Rp {metrics.totalCommitment.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Seluruh perjanjian kontrak aktif
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
                        <span>Biaya Pokok Langsung / Bln</span>
                        <Building2 className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="text-2xl font-bold text-rose-950 font-mono">
                        Rp {metrics.totalDirectCogsMonthly.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[11px] text-rose-600 font-medium">
                        Masuk Laporan Manajemen Point 4 (COGS)
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold">
                        <span>Beban Tetap &amp; Overhead / Bln</span>
                        <Calendar className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-bold text-indigo-950 font-mono">
                        Rp {metrics.totalOverheadMonthly.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[11px] text-indigo-600 font-medium">
                        Masuk Laporan Manajemen Bagian D (Overhead)
                    </div>
                </div>
            </div>

            {/* Classification & Category Filter Tabs */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                        type="button"
                        onClick={() => { setSelectedTypeFilter("ALL"); setSelectedCategoryTab("ALL") }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedTypeFilter === "ALL"
                                ? "bg-slate-900 text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                    >
                        Semua Klasifikasi ({dataList.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => { setSelectedTypeFilter("DIRECT_COGS"); setSelectedCategoryTab("ALL") }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedTypeFilter === "DIRECT_COGS"
                                ? "bg-rose-600 text-white shadow-2xs"
                                : "text-rose-700 hover:bg-rose-50 border border-rose-200"
                        }`}
                    >
                        <span>🧱 Biaya Pokok Langsung (COGS)</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">{metrics.directCogsCount}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setSelectedTypeFilter("FIXED_OVERHEAD"); setSelectedCategoryTab("ALL") }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedTypeFilter === "FIXED_OVERHEAD"
                                ? "bg-indigo-600 text-white shadow-2xs"
                                : "text-indigo-700 hover:bg-indigo-50 border border-indigo-200"
                        }`}
                    >
                        <span>🏢 Beban Tetap &amp; Overhead</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">{metrics.overheadCount}</span>
                    </button>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit text-xs border border-slate-200 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setSelectedCategoryTab("ALL")}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                            selectedCategoryTab === "ALL" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Semua Kategori
                    </button>
                    {availableCategoryTabs.map(cat => {
                        const count = dataList.filter(d => d.category === cat.value).length
                        return (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setSelectedCategoryTab(cat.value)}
                                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                                    selectedCategoryTab === cat.value ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                {cat.label} ({count})
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* DataTable */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <SimpleDataTable
                    data={filteredData}
                    searchKeys={["name", "vendor_name", "contract_number", "notes"]}
                    searchPlaceholder="Cari nama kontrak, pemilik lahan, nomor perjanjian..."
                >
                    {(items, sortConfig, toggleSort) => (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 text-xs">
                                    <TableHead>
                                        <SortableHeader label="Nama Kontrak & Vendor" sortKey="name" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader label="Kategori" sortKey="category" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader label="Cabang" sortKey="locationId" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader label="Periode & Durasi" sortKey="start_date" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <SortableHeader label="Total Kontrak" sortKey="total_amount" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <SortableHeader label="Beban / Bulan" sortKey="monthly_amount" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead className="text-center w-28">Status</TableHead>
                                    {canManage && <TableHead className="text-center w-24">Aksi</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-xs">
                                            Belum ada data kontrak biaya operasional / beban tetap yang tersimpan.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {items.map(item => {
                                    const catInfo = ALL_CATEGORIES.find(c => c.value === item.category) || {
                                        value: item.category,
                                        label: item.category.replace(/_/g, " "),
                                        color: "bg-slate-50 text-slate-700 border-slate-200"
                                    }
                                    const isCogs = isDirectCogs(item.category)
                                    const now = new Date()
                                    const start = new Date(item.start_date)
                                    const end = new Date(item.end_date)
                                    const daysRemaining = differenceInDays(end, now)
                                    const isExpired = end < now

                                    return (
                                        <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors text-xs">
                                            <TableCell>
                                                <div className="font-bold text-slate-900">{item.name}</div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                                    {item.vendor_name && (
                                                        <span>Pihak: <span className="font-medium text-slate-700">{item.vendor_name}</span></span>
                                                    )}
                                                    {item.contract_number && (
                                                        <span>No: <span className="font-mono text-slate-600">{item.contract_number}</span></span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catInfo.color}`}>
                                                        {catInfo.label}
                                                    </span>
                                                    <div>
                                                        {isCogs ? (
                                                            <span className="inline-flex items-center text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                                                Biaya Pokok (Point 4 COGS)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center text-[9px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                                                                Beban Tetap (Bagian D)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200 uppercase">
                                                    {item.location?.name || "Semua Cabang / HO"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-slate-700">
                                                    {format(start, "dd MMM yyyy", { locale: idLocale })} - {format(end, "dd MMM yyyy", { locale: idLocale })}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono">
                                                    Durasi: {item.duration_months} Bulan
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-slate-900">
                                                Rp {Number(item.total_amount).toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                                                    isCogs
                                                        ? "text-rose-700 bg-rose-50 border-rose-200"
                                                        : "text-indigo-700 bg-indigo-50 border-indigo-200"
                                                }`}>
                                                    Rp {Number(item.monthly_amount).toLocaleString("id-ID")}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {isExpired ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                            Berakhir
                                                        </span>
                                                    ) : daysRemaining <= 60 ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                            Sisa {daysRemaining} Hari
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Aktif ({daysRemaining} Hari)
                                                        </span>
                                                    )}
                                                    {!item.isActive && (
                                                        <span className="text-[9px] text-slate-400 italic">(Dinonaktifkan)</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            {canManage && (
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-500 hover:text-indigo-600"
                                                            onClick={() => handleOpenEdit(item)}
                                                            title="Edit Kontrak"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                                            onClick={() => handleDelete(item.id)}
                                                            title="Hapus Kontrak"
                                                        >
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
            </>
            )}

            {/* Modal Dialog: Add / Edit Contract */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[620px] max-h-[92vh] overflow-y-auto">
                    <form onSubmit={e => { e.preventDefault(); handleSubmit(new FormData(e.currentTarget)) }}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Landmark className="h-5 w-5 text-indigo-600" />
                                <span>
                                    {editData
                                        ? "Edit Data Biaya Operasional / Kontrak"
                                        : costClassification === "BIAYA_POKOK_LANGSUNG"
                                        ? "Tambah Biaya Pokok Langsung (COGS Manual)"
                                        : "Tambah Kontrak Beban Tetap / Sewa"}
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Data ini otomatis dialokasikan ke Laporan Bulanan Manajemen sesuai klasifikasi biaya yang dipilih.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-3 text-xs">
                            {/* Klasifikasi Biaya Selector */}
                            <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50">
                                <Label className="text-xs font-bold text-slate-800">
                                    Klasifikasi Biaya (Alokasi Laporan Manajemen) *
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCostClassification("BIAYA_POKOK_LANGSUNG")
                                            if (!isDirectCogs(category)) {
                                                setCategory("BIAYA_POKOK_LAINNYA")
                                            }
                                        }}
                                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                            costClassification === "BIAYA_POKOK_LANGSUNG"
                                                ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs"
                                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                                        }`}
                                    >
                                        <div className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                                            <span>🧱 Biaya Pokok Langsung (COGS)</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                                            Masuk ke <strong>Bagian B (Point 4 Lainnya)</strong>. Mempengaruhi Gross Profit &amp; COGS/m³.
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCostClassification("BEBAN_TETAP")
                                            if (isDirectCogs(category)) {
                                                setCategory("SEWA_TANAH")
                                            }
                                        }}
                                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                            costClassification === "BEBAN_TETAP"
                                                ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
                                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                                        }`}
                                    >
                                        <div className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                                            <span>🏢 Beban Tetap &amp; Amortisasi</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                                            Masuk ke <strong>Bagian D (Overhead)</strong>. Biaya operasional tetap &amp; amortisasi bulanan.
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="contract_name" className="text-xs font-semibold text-slate-700">
                                    Nama Biaya / Kontrak *
                                </Label>
                                <Input
                                    id="contract_name"
                                    placeholder={
                                        costClassification === "BIAYA_POKOK_LANGSUNG"
                                            ? "Contoh: Jasa Subkon Pengecoran Jalan Tol / Additive Khusus Batching Plant"
                                            : "Contoh: Sewa Tanah Batching Plant Youtefa (1 Tahun)"
                                    }
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="h-9 text-xs"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Kategori Biaya *</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="h-9 text-xs bg-white">
                                            <SelectValue placeholder="Pilih Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(costClassification === "BIAYA_POKOK_LANGSUNG"
                                                ? DIRECT_COGS_CATEGORIES
                                                : FIXED_OVERHEAD_CATEGORIES
                                            ).map(c => (
                                                <SelectItem key={c.value} value={c.value} className="text-xs">
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Alokasi Cabang / Plant</Label>
                                    <Select value={locationId} onValueChange={setLocationId}>
                                        <SelectTrigger className="h-9 text-xs bg-white">
                                            <SelectValue placeholder="Pilih Cabang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all" className="text-xs">Semua Cabang / Konsolidasi HO</SelectItem>
                                            {locations.map(l => (
                                                <SelectItem key={l.id} value={l.id} className="text-xs">
                                                    {l.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="vendor_name" className="text-xs font-semibold text-slate-700">
                                        Pemilik Lahan / Instansi / Vendor
                                    </Label>
                                    <Input
                                        id="vendor_name"
                                        placeholder="Contoh: Bapak H. Hamzah / PT Jaya"
                                        value={vendorName}
                                        onChange={e => setVendorName(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="contract_number" className="text-xs font-semibold text-slate-700">
                                        Nomor Surat Perjanjian / Akta
                                    </Label>
                                    <Input
                                        id="contract_number"
                                        placeholder="Contoh: 012/SPK-SEWA/2026"
                                        value={contractNumber}
                                        onChange={e => setContractNumber(e.target.value)}
                                        className="h-9 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            {/* Periode Waktu & Pilihan Skema (Tahunan / Bulanan / Kustom) */}
                            <div className="rounded-lg border border-indigo-100 bg-slate-50/80 p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4 text-indigo-600" />
                                        Skema Durasi & Masa Berlaku
                                    </span>
                                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono">
                                        Durasi: {computedDuration} Bulan
                                    </span>
                                </div>

                                {/* Toggle Mode: Tahunan vs Bulanan vs Kustom */}
                                <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => applyPeriodMode("TAHUNAN")}
                                        className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center cursor-pointer ${
                                            periodMode === "TAHUNAN"
                                                ? "bg-white text-indigo-700 shadow-xs font-bold"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                        }`}
                                    >
                                        📅 Tahunan (12 Bln)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyPeriodMode("BULANAN")}
                                        className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center cursor-pointer ${
                                            periodMode === "BULANAN"
                                                ? "bg-white text-indigo-700 shadow-xs font-bold"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                        }`}
                                    >
                                        🗓️ Bulanan (1 Bln)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyPeriodMode("KUSTOM")}
                                        className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center cursor-pointer ${
                                            periodMode === "KUSTOM"
                                                ? "bg-white text-indigo-700 shadow-xs font-bold"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                        }`}
                                    >
                                        ⚙️ Kustom / Multi-Bln
                                    </button>
                                </div>

                                {/* Preset Pills & Manual Input for Kustom */}
                                {periodMode === "KUSTOM" && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1 px-1 bg-white/70 rounded-md border border-slate-200/80">
                                        <span className="text-[10px] text-slate-500 font-medium pl-1">Preset:</span>
                                        {[1, 3, 6, 12, 24, 36].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => applyPresetMonths(m)}
                                                className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                                    computedDuration === m
                                                        ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                                                }`}
                                            >
                                                {m} Bln
                                            </button>
                                        ))}
                                        <div className="ml-auto flex items-center gap-1">
                                            <span className="text-[10px] text-slate-500">Manual:</span>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={customDurationMonths}
                                                onChange={e => handleCustomDurationChange(e.target.value)}
                                                className="w-14 h-6 text-xs text-center font-mono bg-white p-1"
                                            />
                                            <span className="text-[10px] text-slate-500 pr-1">Bln</span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="start_date" className="text-[11px] font-medium text-slate-700">
                                            Tanggal Mulai *
                                        </Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={startDate}
                                            onChange={e => handleStartDateChange(e.target.value)}
                                            className="h-8 text-xs bg-white"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="end_date" className="text-[11px] font-medium text-slate-700">
                                            Tanggal Berakhir *
                                        </Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            value={endDate}
                                            onChange={e => handleEndDateChange(e.target.value)}
                                            className={`h-8 text-xs bg-white ${periodMode !== "KUSTOM" ? "bg-slate-50 text-slate-700" : ""}`}
                                            required
                                        />
                                    </div>
                                </div>

                                {periodMode === "TAHUNAN" && (
                                    <p className="text-[10px] text-emerald-700 flex items-center gap-1 bg-emerald-50/80 px-2 py-1 rounded border border-emerald-100">
                                        <span>✓</span>
                                        <span>Periode dikunci tepat 1 tahun (12 bulan amortisasi). Tanggal selesai dihitung otomatis. Total kontrak dibagi 12.</span>
                                    </p>
                                )}
                                {periodMode === "BULANAN" && (
                                    <p className="text-[10px] text-indigo-700 flex items-center gap-1 bg-indigo-50/80 px-2 py-1 rounded border border-indigo-100">
                                        <span>✓</span>
                                        <span>Periode dikunci 1 bulan penuh (misal: Gaji bulan berjalan). Beban dialokasikan utuh pada bulan ini.</span>
                                    </p>
                                )}
                            </div>

                            {/* Biaya & Amortisasi */}
                            <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-3 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="total_amount" className="text-xs font-semibold text-slate-800">
                                            Total Nilai Kontrak (Rp) *
                                        </Label>
                                        <Input
                                            id="total_amount"
                                            type="number"
                                            placeholder="Contoh: 120000000"
                                            value={totalAmount}
                                            onChange={e => setTotalAmount(e.target.value)}
                                            className="h-9 text-xs bg-white font-mono font-semibold"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-800">
                                            Status Pembayaran Kontrak
                                        </Label>
                                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                            <SelectTrigger className="h-9 text-xs bg-white">
                                                <SelectValue placeholder="Status Pembayaran" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LUNAS" className="text-xs">Lunas Dibayar Di Muka</SelectItem>
                                                <SelectItem value="BERJALAN" className="text-xs">Termin / Bertahap</SelectItem>
                                                <SelectItem value="TERTUNDA" className="text-xs">Tertunda / Belum Bayar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className={`flex items-center justify-between p-2.5 rounded border ${
                                    costClassification === "BIAYA_POKOK_LANGSUNG"
                                        ? "bg-rose-100/70 border-rose-200 text-rose-950"
                                        : "bg-indigo-100/80 border-indigo-200 text-indigo-950"
                                }`}>
                                    <div>
                                        <div className={`text-[11px] font-semibold ${
                                            costClassification === "BIAYA_POKOK_LANGSUNG" ? "text-rose-900" : "text-indigo-900"
                                        }`}>
                                            {costClassification === "BIAYA_POKOK_LANGSUNG"
                                                ? "Alokasi Biaya Pokok Bulanan (COGS Bagian B Point 4):"
                                                : "Alokasi Beban Tetap & Amortisasi Bulanan (Bagian D):"}
                                        </div>
                                        <div className={`text-[10px] ${
                                            costClassification === "BIAYA_POKOK_LANGSUNG" ? "text-rose-700" : "text-indigo-600"
                                        }`}>
                                            Formula: Rp {(Number(totalAmount) || 0).toLocaleString("id-ID")} ÷ {computedDuration} Bulan
                                        </div>
                                    </div>
                                    <div className={`text-base font-bold font-mono ${
                                        costClassification === "BIAYA_POKOK_LANGSUNG" ? "text-rose-900" : "text-indigo-900"
                                    }`}>
                                        Rp {computedMonthly.toLocaleString("id-ID")} / bulan
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">
                                    Catatan / Klausul Penting (Opsional)
                                </Label>
                                <Input
                                    id="notes"
                                    placeholder="Misal: Luas tanah 2.500 m2, opsi perpanjangan tahun depan"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs h-9">
                                Batal
                            </Button>
                            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold">
                                Simpan Kontrak
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
