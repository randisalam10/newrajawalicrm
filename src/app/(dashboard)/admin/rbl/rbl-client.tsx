"use client"

import React, { useState, useTransition, useMemo, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
    WalletCards, Plus, Trash2, Edit2, Calendar, FileText, Image as ImageIcon,
    CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, ArrowRight, Upload, Loader2,
    Eye, Printer, RefreshCw, Layers, Check, X, ShieldAlert, Building2, Lock,
    Sparkles, Minimize2, Search, RotateCcw, Fuel, Gauge, Tag, ChevronsUpDown
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
    createBudget, closeBudget, addExpenseBatch, updateExpense,
    deleteExpense, uploadBulkReceipts, deleteAttachment, getActiveBudget,
    getBudgetHistory, getBudgetDetail, createRblCategory, updateRblCategory,
    deleteRblCategory
} from "./actions"
import Link from "next/link"
import { RblCategoryReport } from "./rbl-category-report"

const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n || 0))
const fmtDate = (d: any) => d ? format(new Date(d), "dd MMMM yyyy", { locale: idLocale }) : "-"
const fmtShortDate = (d: any) => d ? format(new Date(d), "dd/MM/yyyy") : "-"
const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

interface BatchRow {
    id: string
    date: string
    itemDescription: string
    categoryId?: string | null
    category: string
    vehicleId?: string | null
    kmMeter?: number | null
    isCustomCategory?: boolean
    quantity: number
    unit: string
    unitPrice: number
    receiptNo: string
    notes: string
}

interface StagedFile {
    file: File
    name: string
    originalSize: number
    compressedSize: number
    previewUrl: string
}

interface RblClientProps {
    initialActiveBudget: any
    initialHistory: any[]
    summaryData: any
    locations: any[]
    initialCategories?: any[]
    vehicles?: any[]
    userRole: string
    userLocationId: string
    isSuperAdmin: boolean
    canCreate?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canClose?: boolean
    canExport?: boolean
}

// ─── Searchable Category Combobox with Quick Shortcut ─────────────────────────
function CategorySelector({
    selectedCategoryName,
    categories,
    onSelect,
    onOpenQuickCreate,
    disabled = false,
}: {
    selectedCategoryName: string
    categories: any[]
    onSelect: (cat: any) => void
    onOpenQuickCreate: () => void
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const currentCat = categories.find(c => c.name.toLowerCase() === (selectedCategoryName || "").toLowerCase())

    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={disabled}
                    className="h-8 w-full justify-between text-xs px-2.5 bg-white font-normal hover:bg-slate-50 border-slate-200"
                >
                    <span className="truncate flex items-center gap-1.5">
                        {currentCat?.requireVehicleKm ? (
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                                <Fuel className="h-3 w-3 text-amber-600 shrink-0" />
                                {selectedCategoryName}
                            </span>
                        ) : (
                            <span className="text-slate-800">{selectedCategoryName || "Pilih Kategori..."}</span>
                        )}
                    </span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-40" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-lg" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <Command>
                    <CommandInput
                        placeholder="Cari kategori..."
                        value={search}
                        onValueChange={setSearch}
                        className="text-xs h-8"
                    />
                    <CommandList className="max-h-60 overflow-y-auto overscroll-contain">
                        <CommandEmpty className="text-xs py-3 text-center text-slate-400">
                            Kategori tidak ditemukan.
                        </CommandEmpty>
                        <CommandGroup heading="Daftar Kategori RBL">
                            {filtered.map(cat => (
                                <CommandItem
                                    key={cat.id}
                                    value={cat.name}
                                    onSelect={() => {
                                        onSelect(cat)
                                        setOpen(false)
                                    }}
                                    className="text-xs flex items-center justify-between cursor-pointer py-1.5 px-2"
                                >
                                    <div className="flex items-center gap-2 truncate mr-2">
                                        <Check
                                            className={cn(
                                                "h-3.5 w-3.5 shrink-0",
                                                cat.name === selectedCategoryName ? "opacity-100 text-blue-600 font-bold" : "opacity-0"
                                            )}
                                        />
                                        <div className="truncate">
                                            <span className="font-medium text-slate-900">{cat.name}</span>
                                            {cat.description && (
                                                <span className="block text-[10px] text-slate-400 truncate">{cat.description}</span>
                                            )}
                                        </div>
                                    </div>
                                    {cat.requireVehicleKm && (
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-800 border-amber-300 shrink-0 font-medium">
                                            ⛽ Armada & KM
                                        </Badge>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <div className="p-1.5 border-t bg-slate-50">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setOpen(false)
                                onOpenQuickCreate()
                            }}
                            className="w-full justify-start text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 gap-1.5"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            + Tambah Kategori Baru
                        </Button>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── Searchable Vehicle Combobox with Head Office Branch Indicator ────────────
function VehicleSelector({
    selectedVehicleId,
    vehicles = [],
    isHeadOfficeBudget = false,
    onSelect,
    disabled = false,
}: {
    selectedVehicleId?: string | null
    vehicles: any[]
    isHeadOfficeBudget?: boolean
    onSelect: (vehicleId: string | null) => void
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)

    const selectedVehicle = useMemo(() => {
        if (!selectedVehicleId || selectedVehicleId === "none") return null
        return vehicles.find(v => v.id === selectedVehicleId)
    }, [selectedVehicleId, vehicles])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "h-7 text-xs justify-between font-normal bg-white border-amber-200 text-amber-950 hover:bg-amber-50/50 w-full px-2 gap-1 truncate cursor-pointer",
                        !selectedVehicle && "text-slate-500"
                    )}
                >
                    <span className="truncate">
                        {selectedVehicle ? (
                            <span className="font-medium text-slate-800">
                                <span className="font-bold text-amber-800">{selectedVehicle.code}</span> - {selectedVehicle.plate_number || selectedVehicle.plateNumber}
                                {isHeadOfficeBudget && selectedVehicle.location?.name ? ` • ${selectedVehicle.location.name}` : ""}
                            </span>
                        ) : (
                            "-- Umum / Bukan Armada Tertentu --"
                        )}
                    </span>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-1 text-amber-700" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0 shadow-lg" align="start" sideOffset={4} onOpenAutoFocus={(e) => e.preventDefault()}>
                <Command>
                    <CommandInput placeholder="Cari kode unit, plat nomor, atau cabang..." className="h-8 text-xs" />
                    <CommandList className="max-h-60 overflow-y-auto overscroll-contain">
                        <CommandEmpty className="py-2.5 text-center text-xs text-slate-500">
                            Armada tidak ditemukan.
                        </CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="none-bukan-armada"
                                onSelect={() => {
                                    onSelect(null)
                                    setOpen(false)
                                }}
                                className="text-xs cursor-pointer py-1.5"
                            >
                                <Check className={cn("mr-2 h-3.5 w-3.5", !selectedVehicle ? "opacity-100" : "opacity-0")} />
                                <span className="text-slate-500 font-medium">-- Umum / Bukan Armada Tertentu --</span>
                            </CommandItem>
                            {vehicles.map((v: any) => {
                                const isSelected = selectedVehicle?.id === v.id
                                const plate = v.plate_number || v.plateNumber || ""
                                const vType = v.vehicle_type || v.type || "Unit"
                                const searchVal = `${v.code} ${plate} ${vType} ${v.location?.name || ""}`

                                return (
                                    <CommandItem
                                        key={v.id}
                                        value={searchVal}
                                        onSelect={() => {
                                            onSelect(v.id)
                                            setOpen(false)
                                        }}
                                        className="text-xs cursor-pointer py-1.5 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Check className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "opacity-100 text-blue-600" : "opacity-0")} />
                                            <div className="truncate">
                                                <span className="font-bold text-slate-900">{v.code}</span>
                                                <span className="text-slate-600 ml-1.5 font-mono">{plate}</span>
                                                <span className="text-[10px] text-slate-400 ml-1">({vType})</span>
                                            </div>
                                        </div>
                                        {isHeadOfficeBudget && v.location?.name && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-50 text-blue-700 border-blue-200 shrink-0 ml-1 font-medium">
                                                {v.location.name}
                                            </Badge>
                                        )}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── Client-side Image Compression Helper ────────────────────────────────────
// Downscales image to max 1920x1920 with high-quality JPEG (82%)
// Yields ~90-95% file size reduction while keeping all small text & numbers razor-sharp
async function compressImage(file: File, maxDim = 1920, quality = 0.82): Promise<StagedFile> {
    const originalSize = file.size
    const previewUrl = URL.createObjectURL(file)

    if (!file.type.startsWith("image/")) {
        return { file, name: file.name, originalSize, compressedSize: originalSize, previewUrl }
    }

    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string
            img.onload = () => {
                let { width, height } = img
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width)
                        width = maxDim
                    } else {
                        width = Math.round((width * maxDim) / height)
                        height = maxDim
                    }
                }
                const canvas = document.createElement("canvas")
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    return resolve({ file, name: file.name, originalSize, compressedSize: originalSize, previewUrl })
                }
                ctx.drawImage(img, 0, 0, width, height)
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return resolve({ file, name: file.name, originalSize, compressedSize: originalSize, previewUrl })
                        }
                        const newName = file.name.replace(/\.[^/.]+$/, ".jpg")
                        const compressedFile = new File([blob], newName, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        })
                        const compressedPreview = URL.createObjectURL(compressedFile)
                        resolve({
                            file: compressedFile,
                            name: newName,
                            originalSize,
                            compressedSize: compressedFile.size,
                            previewUrl: compressedPreview
                        })
                    },
                    "image/jpeg",
                    quality
                )
            }
            img.onerror = () => resolve({ file, name: file.name, originalSize, compressedSize: originalSize, previewUrl })
        }
        reader.onerror = () => resolve({ file, name: file.name, originalSize, compressedSize: originalSize, previewUrl })
    })
}

export function RblClient({
    initialActiveBudget,
    initialHistory,
    summaryData,
    locations,
    initialCategories = [],
    vehicles = [],
    userRole,
    userLocationId,
    isSuperAdmin,
    canCreate = true,
    canEdit = true,
    canDelete = true,
    canClose = true,
    canExport = true,
}: RblClientProps) {
    const [categories, setCategories] = useState<any[]>(initialCategories)
    const [activeBudget, setActiveBudget] = useState<any>(initialActiveBudget)
    const [history, setHistory] = useState<any[]>(initialHistory)
    const [selectedLocation, setSelectedLocation] = useState<string>(
        isSuperAdmin ? "all" : userLocationId
    )
    const [isPending, startTransition] = useTransition()

    // Helper to determine if active budget is Head Office / Corporate
    const isHeadOfficeBudget = useMemo(() => {
        if (!activeBudget) return isSuperAdmin
        const locName = (activeBudget.location?.name || "").toLowerCase()
        return locName.includes("head office") || locName.includes("pusat") || locName.includes("ho")
    }, [activeBudget, isSuperAdmin])

    // Filter vehicles: Head Office can select ALL vehicles across all branches; other batching plants only see their own branch vehicles
    const branchVehicles = useMemo(() => {
        if (!vehicles || vehicles.length === 0) return []

        // Kalau Head Office (atau budget tanpa lokasi spesifik), tampilkan SEMUA kendaraan
        if (isHeadOfficeBudget || !activeBudget?.locationId) {
            return vehicles
        }

        // Kalau batching plant lain (Youtefa, Sorong, Koya, dll), HANYA kendaraan berdasarkan lokasinya
        return vehicles.filter((v: any) => v.locationId === activeBudget.locationId)
    }, [vehicles, activeBudget, isHeadOfficeBudget])

    // Dialog States
    const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false)
    const [isCloseBudgetOpen, setIsCloseBudgetOpen] = useState(false)
    const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<any>(null)
    const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null)
    const [expenseViewMode, setExpenseViewMode] = useState<"grouped" | "flat">("grouped")
    const [historySearch, setHistorySearch] = useState("")
    const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL")
    const [historyYearFilter, setHistoryYearFilter] = useState("ALL")
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isLoadingDetail, setIsLoadingDetail] = useState(false)
    const [selectedDetailBudget, setSelectedDetailBudget] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<string>(canEdit ? "input-batch" : "daily-list")

    // Category Management & Quick Shortcut Dialogs
    const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false)
    const [quickCategoryTargetRowId, setQuickCategoryTargetRowId] = useState<string | null>(null)
    const [quickCategoryForm, setQuickCategoryForm] = useState({ name: "", description: "", requireVehicleKm: false })
    const [isCategorySubmitting, setIsCategorySubmitting] = useState(false)
    const [categoryModalMode, setCategoryModalMode] = useState<"create" | "edit">("create")
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

    // Form: Create Budget
    const [budgetForm, setBudgetForm] = useState({
        locationId: userLocationId || (locations[0]?.id ?? ""),
        periodMonth: new Date().getMonth() + 1,
        periodYear: new Date().getFullYear(),
        receivedDate: format(new Date(), "yyyy-MM-dd"),
        amount: "",
        notes: "",
    })

    // Form: Close Budget
    const [closeNotes, setCloseNotes] = useState("")
    const [closeDate, setCloseDate] = useState(format(new Date(), "yyyy-MM-dd"))

    // ─── Budget Date Range Constraints ────────────────────────────────────────
    // Restricts expense dates strictly within the active budget's month and year!
    const budgetDateRange = useMemo(() => {
        if (!activeBudget) {
            const now = new Date()
            const y = now.getFullYear()
            const m = String(now.getMonth() + 1).padStart(2, "0")
            return {
                min: `${y}-${m}-01`,
                max: `${y}-${m}-31`,
                defaultDate: format(now, "yyyy-MM-dd"),
                label: `${MONTH_NAMES[now.getMonth()]} ${y}`
            }
        }
        const y = activeBudget.periodYear
        const m = activeBudget.periodMonth
        const monthStr = String(m).padStart(2, "0")
        const lastDay = new Date(y, m, 0).getDate()
        const now = new Date()

        // Default date: today if today is within this budget month; otherwise 1st of that month
        const isCurrentMonth = now.getFullYear() === y && (now.getMonth() + 1) === m
        const defaultDate = isCurrentMonth ? format(now, "yyyy-MM-dd") : `${y}-${monthStr}-01`

        return {
            min: `${y}-${monthStr}-01`,
            max: `${y}-${monthStr}-${String(lastDay).padStart(2, "0")}`,
            defaultDate,
            label: `${MONTH_NAMES[m - 1]} ${y}`
        }
    }, [activeBudget])

    // Form: Batch Expense Entry with Row-level Dates
    const [batchRows, setBatchRows] = useState<BatchRow[]>([])

    // Initialize or reset batch rows when active budget changes
    useEffect(() => {
        const firstCat = categories[0] || { id: null, name: "BBM / Solar", requireVehicleKm: true }
        setBatchRows([
            {
                id: `row-${Date.now()}`,
                date: budgetDateRange.defaultDate,
                itemDescription: "",
                categoryId: firstCat.id || null,
                category: firstCat.name,
                vehicleId: null,
                kmMeter: null,
                quantity: 1,
                unit: firstCat.name?.toLowerCase().includes("bbm") ? "Liter" : "Pcs",
                unitPrice: 0,
                receiptNo: "",
                notes: "",
            }
        ])
    }, [budgetDateRange, categories])

    // Bulk Receipt Upload with Compression
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([])
    const [isCompressing, setIsCompressing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Reload active budget & history when branch filter changes
    const reloadData = (locId: string) => {
        startTransition(async () => {
            const target = locId === "all" ? undefined : locId
            const [b, h] = await Promise.all([
                getActiveBudget(target),
                getBudgetHistory({ locationId: target })
            ])
            setActiveBudget(b)
            setHistory(h)
        })
    }

    // Calculations for Active Budget
    const utilizationRate = useMemo(() => {
        if (!activeBudget || activeBudget.amount === 0) return 0
        return (activeBudget.totalExpense / activeBudget.amount) * 100
    }, [activeBudget])

    const balanceStatus = useMemo(() => {
        if (!activeBudget) return { label: "Nihil", color: "text-slate-500", bg: "bg-slate-100" }
        if (activeBudget.remainingBalance > 0) {
            return { label: "Sisa Pengembalian (Surplus)", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" }
        } else if (activeBudget.remainingBalance < 0) {
            return { label: "Defisit / Minus (Klaim HO)", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" }
        }
        return { label: "Pas / Seimbang", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" }
    }, [activeBudget])

    // Group expenses by Date for clean daily view
    const expensesByDate = useMemo(() => {
        if (!activeBudget?.expenses) return []
        const map = new Map<string, { date: string; items: any[]; subtotal: number }>()

        for (const exp of activeBudget.expenses) {
            const dateKey = format(new Date(exp.date), "yyyy-MM-dd")
            if (!map.has(dateKey)) {
                map.set(dateKey, { date: dateKey, items: [], subtotal: 0 })
            }
            const group = map.get(dateKey)!
            group.items.push(exp)
            group.subtotal += exp.amount
        }

        return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [activeBudget])

    // Flat sorted list of all expenses with global sequence
    const sortedAllExpenses = useMemo(() => {
        if (!activeBudget?.expenses) return []
        return [...activeBudget.expenses].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }, [activeBudget])

    // Helper to find the previous recorded KM for a vehicle
    const getVehiclePreviousKmInfo = (vehicleId: string | null | undefined, currentRowIndex?: number) => {
        if (!vehicleId) return null

        // 1. Check earlier rows in the current batch form (within batchRows[0...currentRowIndex-1])
        if (currentRowIndex !== undefined && currentRowIndex > 0) {
            for (let i = currentRowIndex - 1; i >= 0; i--) {
                const prevRow = batchRows[i]
                if (prevRow.vehicleId === vehicleId && prevRow.kmMeter !== null && prevRow.kmMeter !== undefined && prevRow.kmMeter > 0) {
                    return {
                        km: prevRow.kmMeter,
                        source: `Baris #${i + 1} (${fmtShortDate(prevRow.date)})`,
                        date: prevRow.date
                    }
                }
            }
        }

        // 2. Check in activeBudget.expenses for this vehicle
        if (activeBudget?.expenses && activeBudget.expenses.length > 0) {
            const matchExpenses = activeBudget.expenses
                .filter((e: any) => (e.vehicleId === vehicleId || e.vehicle?.id === vehicleId) && e.kmMeter && e.kmMeter > 0)
                .sort((a: any, b: any) => {
                    const dDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
                    if (dDiff !== 0) return dDiff
                    return (b.kmMeter || 0) - (a.kmMeter || 0)
                })

            if (matchExpenses.length > 0) {
                const latestExp = matchExpenses[0]
                return {
                    km: latestExp.kmMeter,
                    source: `RBL Aktif (${fmtShortDate(latestExp.date)})`,
                    date: latestExp.date
                }
            }
        }

        // 3. Check in vehicles list (from getRblVehicles with historical lastKmMeter)
        const foundVehicle = vehicles.find((v: any) => v.id === vehicleId)
        if (foundVehicle?.lastKmMeter && foundVehicle.lastKmMeter > 0) {
            return {
                km: foundVehicle.lastKmMeter,
                source: foundVehicle.lastKmDate ? `Riwayat (${fmtShortDate(foundVehicle.lastKmDate)})` : "Database",
                date: foundVehicle.lastKmDate
            }
        }

        return null
    }

    // Filtered history list based on search & filters
    const filteredHistory = useMemo(() => {
        return history.filter(b => {
            if (historyStatusFilter !== "ALL" && b.status !== historyStatusFilter) return false
            if (historyYearFilter !== "ALL" && String(b.periodYear) !== historyYearFilter) return false
            if (historySearch.trim()) {
                const q = historySearch.toLowerCase()
                const matchCode = b.code?.toLowerCase().includes(q)
                const matchLoc = b.location?.name?.toLowerCase().includes(q)
                const matchNotes = b.notes?.toLowerCase().includes(q) || b.closeNotes?.toLowerCase().includes(q)
                const matchMonth = MONTH_NAMES[b.periodMonth - 1]?.toLowerCase().includes(q)
                if (!matchCode && !matchLoc && !matchNotes && !matchMonth) return false
            }
            return true
        })
    }, [history, historySearch, historyStatusFilter, historyYearFilter])

    // Available years in history for filter dropdown
    const historyAvailableYears = useMemo(() => {
        const set = new Set<number>()
        set.add(new Date().getFullYear())
        for (const h of history) {
            if (h.periodYear) set.add(h.periodYear)
        }
        return Array.from(set).sort((a, b) => b - a)
    }, [history])

    const handleOpenDetail = async (budgetId: string) => {
        setIsLoadingDetail(true)
        setIsDetailOpen(true)
        try {
            const detail = await getBudgetDetail(budgetId)
            setSelectedDetailBudget(detail)
        } catch (err) {
            toast.error("Gagal memuat detail budget.")
        } finally {
            setIsLoadingDetail(false)
        }
    }

    // Total compression stats
    const compressionStats = useMemo(() => {
        if (stagedFiles.length === 0) return null
        const totalOriginal = stagedFiles.reduce((s, f) => s + f.originalSize, 0)
        const totalCompressed = stagedFiles.reduce((s, f) => s + f.compressedSize, 0)
        const savedPercent = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0
        return {
            totalOriginal,
            totalCompressed,
            savedPercent,
        }
    }, [stagedFiles])

    // ─── Batch Row Handlers ───────────────────────────────────────────────────

    const handleAddBatchRow = (customDate?: string) => {
        const lastRow = batchRows[batchRows.length - 1]
        const nextDate = customDate || lastRow?.date || budgetDateRange.defaultDate
        const firstCat = categories[0] || { id: null, name: "BBM / Solar", requireVehicleKm: true }

        setBatchRows(prev => [
            ...prev,
            {
                id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                date: nextDate,
                itemDescription: "",
                categoryId: firstCat.id || null,
                category: firstCat.name,
                vehicleId: null,
                kmMeter: null,
                quantity: 1,
                unit: firstCat.name?.toLowerCase().includes("bbm") ? "Liter" : "Pcs",
                unitPrice: 0,
                receiptNo: "",
                notes: "",
            }
        ])
    }

    const handleRemoveBatchRow = (id: string) => {
        if (batchRows.length === 1) {
            toast.info("Minimal harus ada satu baris pengeluaran.")
            return
        }
        setBatchRows(prev => prev.filter(r => r.id !== id))
    }

    const handleRowChange = (id: string, field: keyof BatchRow, value: any) => {
        setBatchRows(prev => prev.map(r => {
            if (r.id !== id) return r
            return { ...r, [field]: value }
        }))
    }

    const handleCategorySelect = (rowId: string, cat: any) => {
        setBatchRows(prev => prev.map(r => {
            if (r.id !== rowId) return r
            const isFuel = cat.name.toLowerCase().includes("bbm") || cat.name.toLowerCase().includes("solar")
            return {
                ...r,
                categoryId: cat.id,
                category: cat.name,
                vehicleId: cat.requireVehicleKm ? r.vehicleId : null,
                kmMeter: cat.requireVehicleKm ? r.kmMeter : null,
                unit: isFuel ? "Liter" : (r.unit === "Liter" ? "Pcs" : r.unit),
            }
        }))
    }

    const handleOpenQuickCategory = (rowId?: string) => {
        setCategoryModalMode("create")
        setEditingCategoryId(null)
        setQuickCategoryTargetRowId(rowId || null)
        setQuickCategoryForm({ name: "", description: "", requireVehicleKm: false })
        setIsQuickCategoryOpen(true)
    }

    const handleOpenEditCategory = (cat: any) => {
        setCategoryModalMode("edit")
        setEditingCategoryId(cat.id)
        setQuickCategoryForm({
            name: cat.name,
            description: cat.description || "",
            requireVehicleKm: Boolean(cat.requireVehicleKm)
        })
        setIsQuickCategoryOpen(true)
    }

    const handleSaveCategory = async () => {
        if (!quickCategoryForm.name.trim()) {
            toast.error("Nama kategori wajib diisi.")
            return
        }
        setIsCategorySubmitting(true)
        try {
            if (categoryModalMode === "create") {
                const res = await createRblCategory(quickCategoryForm)
                if (res.success && res.category) {
                    toast.success(`Kategori "${res.category.name}" berhasil dibuat!`)
                    setCategories(prev => [...prev, res.category])
                    if (quickCategoryTargetRowId) {
                        handleCategorySelect(quickCategoryTargetRowId, res.category)
                    }
                    setIsQuickCategoryOpen(false)
                } else {
                    toast.error(res.error || "Gagal membuat kategori.")
                }
            } else if (categoryModalMode === "edit" && editingCategoryId) {
                const res = await updateRblCategory(editingCategoryId, quickCategoryForm)
                if (res.success && res.category) {
                    toast.success(`Kategori "${res.category.name}" berhasil diperbarui!`)
                    setCategories(prev => prev.map(c => c.id === editingCategoryId ? res.category : c))
                    setIsQuickCategoryOpen(false)
                } else {
                    toast.error(res.error || "Gagal memperbarui kategori.")
                }
            }
        } catch (e: any) {
            toast.error(e.message || "Terjadi kesalahan sistem.")
        } finally {
            setIsCategorySubmitting(false)
        }
    }

    const handleDeleteCategory = async (cat: any) => {
        if (cat.isSystem) {
            toast.error("Kategori bawaan sistem tidak dapat dihapus.")
            return
        }
        if (!confirm(`Hapus kategori "${cat.name}"?`)) return

        try {
            const res = await deleteRblCategory(cat.id)
            if (res.success) {
                toast.success(`Kategori "${cat.name}" berhasil dihapus.`)
                setCategories(prev => prev.filter(c => c.id !== cat.id))
            } else {
                toast.error(res.error || "Gagal menghapus kategori.")
            }
        } catch (e: any) {
            toast.error(e.message || "Gagal menghapus kategori.")
        }
    }

    const handleSetAllRowsDate = (newDate: string) => {
        setBatchRows(prev => prev.map(r => ({ ...r, date: newDate })))
        toast.info(`Tanggal seluruh baris diset ke: ${fmtShortDate(newDate)}`)
    }

    const handleSaveBatchExpenses = async () => {
        if (!activeBudget) {
            toast.error("Belum ada Budget yang aktif. Buka budget terlebih dahulu.")
            return
        }

        const validRows = batchRows.filter(r => r.itemDescription.trim().length > 0)
        if (validRows.length === 0) {
            toast.error("Nama Item / Uraian pengeluaran wajib diisi minimal 1 baris.")
            return
        }

        // Validate date boundaries
        for (const r of validRows) {
            if (r.date < budgetDateRange.min || r.date > budgetDateRange.max) {
                toast.error(`Tanggal ${r.date} berada di luar periode budget aktif (${budgetDateRange.label})!`)
                return
            }
        }

        // Validate odometer readings (warn if current KM is less than previous KM)
        for (let i = 0; i < validRows.length; i++) {
            const r = validRows[i]
            if (r.vehicleId && r.kmMeter !== null && r.kmMeter !== undefined && r.kmMeter > 0) {
                const prevInfo = getVehiclePreviousKmInfo(r.vehicleId, i)
                if (prevInfo && prevInfo.km && r.kmMeter < prevInfo.km) {
                    const vehicleObj = vehicles.find((v: any) => v.id === r.vehicleId)
                    const vName = vehicleObj ? `${vehicleObj.code} (${vehicleObj.plate_number || vehicleObj.plateNumber})` : "Armada"
                    const proceed = window.confirm(
                        `⚠️ PERINGATAN ODOMETER:\n` +
                        `Unit: ${vName}\n` +
                        `KM Input Sekarang: ${r.kmMeter.toLocaleString("id-ID")} KM\n` +
                        `KM Sebelumnya: ${prevInfo.km.toLocaleString("id-ID")} KM (${prevInfo.source})\n` +
                        `Selisih: ${(r.kmMeter - prevInfo.km).toLocaleString("id-ID")} KM (MUNDUR / LEBIH KECIL)\n\n` +
                        `Apakah Anda yakin data ini sudah benar dan ingin tetap menyimpannya?`
                    )
                    if (!proceed) return
                }
            }
        }

        startTransition(async () => {
            const res = await addExpenseBatch(activeBudget.id, validRows)
            if (res.success) {
                toast.success(`Berhasil menyimpan ${res.count} item pengeluaran!`)
                // Reset form to 1 clean row with the last used date
                const lastDate = validRows[validRows.length - 1].date
                const firstCat = categories[0] || { id: null, name: "BBM / Solar", requireVehicleKm: true }
                setBatchRows([{
                    id: `row-${Date.now()}`,
                    date: lastDate,
                    itemDescription: "",
                    categoryId: firstCat.id || null,
                    category: firstCat.name,
                    vehicleId: null,
                    kmMeter: null,
                    quantity: 1,
                    unit: firstCat.name?.toLowerCase().includes("bbm") ? "Liter" : "Pcs",
                    unitPrice: 0,
                    receiptNo: "",
                    notes: "",
                }])
                reloadData(selectedLocation)
            } else {
                toast.error(res.error || "Gagal menyimpan pengeluaran.")
            }
        })
    }

    // ─── Bulk Upload with Compression Handlers ───────────────────────────────

    const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files)
            setIsCompressing(true)
            toast.info(`Sedang mengompresi ${filesArray.length} foto nota untuk mengoptimalkan ukuran...`)

            try {
                const compressedResults: StagedFile[] = []
                for (const file of filesArray) {
                    const result = await compressImage(file)
                    compressedResults.push(result)
                }
                setStagedFiles(prev => [...prev, ...compressedResults])
                toast.success(`${compressedResults.length} foto nota siap diunggah!`)
            } catch (err) {
                toast.error("Gagal mengompresi beberapa foto.")
            } finally {
                setIsCompressing(false)
            }
        }
    }

    const handleRemoveStagedFile = (index: number) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleExecuteBulkUpload = async () => {
        if (!activeBudget) {
            toast.error("Tidak ada budget aktif. Upload nota wajib terikat ke budget aktif.")
            return
        }
        if (stagedFiles.length === 0) {
            toast.error("Pilih minimal satu foto nota.")
            return
        }

        setIsUploading(true)
        try {
            const formData = new FormData()
            for (const item of stagedFiles) {
                formData.append("files", item.file)
            }

            const res = await uploadBulkReceipts(activeBudget.id, formData)
            if (res.success) {
                toast.success(`Berhasil mengunggah ${res.count} foto nota ke budget ${activeBudget.code}!`)
                setStagedFiles([])
                if (fileInputRef.current) fileInputRef.current.value = ""
                reloadData(selectedLocation)
            } else {
                toast.error(res.error || "Gagal mengunggah foto nota.")
            }
        } catch (e: any) {
            toast.error(e.message || "Terjadi kesalahan saat upload.")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDeleteAttachment = async (id: string) => {
        if (!confirm("Hapus foto nota ini dari galeri?")) return
        startTransition(async () => {
            const res = await deleteAttachment(id)
            if (res.success) {
                toast.success("Foto nota dihapus.")
                reloadData(selectedLocation)
            } else {
                toast.error(res.error || "Gagal menghapus.")
            }
        })
    }

    // ─── Budget Creation & Closing Handlers ───────────────────────────────────

    const handleCreateBudgetSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const amountNum = parseFloat(budgetForm.amount.replace(/[^0-9]/g, ""))
        if (!amountNum || amountNum <= 0) {
            toast.error("Masukkan nominal budget yang valid.")
            return
        }

        startTransition(async () => {
            const res = await createBudget({
                locationId: budgetForm.locationId,
                periodMonth: Number(budgetForm.periodMonth),
                periodYear: Number(budgetForm.periodYear),
                receivedDate: budgetForm.receivedDate,
                amount: amountNum,
                notes: budgetForm.notes,
            })

            if (res.success) {
                toast.success("Budget RBL berhasil dibuka!")
                setIsCreateBudgetOpen(false)
                setBudgetForm(prev => ({ ...prev, amount: "", notes: "" }))
                setActiveTab("input-batch")
                reloadData(selectedLocation)
            } else {
                toast.error(res.error || "Gagal membuat budget.")
            }
        })
    }

    const handleCloseBudgetSubmit = async () => {
        if (!activeBudget) return
        startTransition(async () => {
            const res = await closeBudget(activeBudget.id, closeNotes, closeDate)
            if (res.success) {
                const typeText = res.statusType === "SURPLUS"
                    ? `Sisa pengembalian: ${fmt(res.balance)}`
                    : res.statusType === "DEFICIT"
                    ? `Minus/Defisit: ${fmt(Math.abs(res.balance))}`
                    : "Saldo pas nihil"

                toast.success(`Budget RBL periode ini resmi DITUTUP! (${typeText})`)
                setIsCloseBudgetOpen(false)
                setCloseNotes("")
                reloadData(selectedLocation)
            } else {
                toast.error(res.error || "Gagal menutup budget.")
            }
        })
    }

    const handleDeleteExpense = async (id: string) => {
        if (!confirm("Hapus pengeluaran ini?")) return
        startTransition(async () => {
            const res = await deleteExpense(id)
            if (res.success) {
                toast.success("Pengeluaran berhasil dihapus.")
                reloadData(selectedLocation)
            } else {
                toast.error(res.error || "Gagal menghapus.")
            }
        })
    }

    const handleEditExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingExpense) return
        startTransition(async () => {
            const res = await updateExpense(editingExpense.id, {
                date: editingExpense.date,
                itemDescription: editingExpense.itemDescription,
                categoryId: editingExpense.categoryId || null,
                category: editingExpense.category,
                vehicleId: editingExpense.vehicleId || null,
                kmMeter: editingExpense.kmMeter !== undefined && editingExpense.kmMeter !== null && !isNaN(Number(editingExpense.kmMeter)) ? Number(editingExpense.kmMeter) : null,
                quantity: Number(editingExpense.quantity),
                unit: editingExpense.unit,
                unitPrice: Number(editingExpense.unitPrice),
                receiptNo: editingExpense.receiptNo,
                notes: editingExpense.notes,
            })
            if (res.success) {
                toast.success("Pengeluaran diperbarui.")
                setIsEditExpenseOpen(false)
                setEditingExpense(null)
                reloadData(selectedLocation)
            } else {
                toast.error(res.error || "Gagal update.")
            }
        })
    }

    // Branch Name Helper for Admin Cabang
    const adminBranchName = useMemo(() => {
        const found = locations.find(l => l.id === userLocationId)
        return found?.name || "Cabang Anda"
    }, [locations, userLocationId])

    return (
        <div className="space-y-6">
            {/* ─── HEADER: Title & Prominent Branch Indicator (Streamlined) ───── */}
            <div className="flex flex-col gap-2.5 border-b pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-600 rounded-lg text-white shadow-xs">
                            <WalletCards className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                    Rekap Bulanan (RBL)
                                </h1>
                                {!isSuperAdmin && (
                                    <Badge variant="outline" className="text-xs bg-slate-50 border-slate-300 font-semibold text-slate-800">
                                        📍 {adminBranchName}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-500">
                                Anggaran operasional cabang, input pengeluaran harian, armada BBM, dan nota kas.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Action: Open New Budget */}
                        {!activeBudget && canCreate && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    setBudgetForm(prev => ({
                                        ...prev,
                                        locationId: selectedLocation !== "all" ? selectedLocation : (userLocationId || locations[0]?.id || "")
                                    }))
                                    setIsCreateBudgetOpen(true)
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs shadow-xs cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Buka Budget Baru
                            </Button>
                        )}

                        {/* Action: Close Current Active Budget */}
                        {activeBudget && canClose && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCloseBudgetOpen(true)}
                                className="border-rose-200 text-rose-700 hover:bg-rose-50 gap-1.5 h-8 text-xs cursor-pointer"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Tutup Buku (Close RBL)
                            </Button>
                        )}
                    </div>
                </div>

                {/* ─── HO Branch Pills Switcher (Visible ONLY for Super Admin / HO) ─── */}
                {isSuperAdmin && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            Cabang (HO):
                        </span>
                        <button
                            onClick={() => {
                                setSelectedLocation("all")
                                reloadData("all")
                            }}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                selectedLocation === "all"
                                    ? "bg-blue-600 text-white shadow-2xs font-semibold"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            🏢 Semua Cabang
                        </button>
                        {locations.map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => {
                                    setSelectedLocation(loc.id)
                                    reloadData(loc.id)
                                }}
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                    selectedLocation === loc.id
                                        ? "bg-blue-600 text-white shadow-2xs font-semibold"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                📍 {loc.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── ACTIVE BUDGET EXECUTIVE SUMMARY CARD (BALANCED & HIGH-DENSITY) ───── */}
            {activeBudget ? (
                <Card className="border border-slate-200/90 shadow-xs overflow-hidden bg-white">
                    {/* Header Strip: Period, Branch, Code & Quick Actions */}
                    <div className="bg-slate-50/90 px-4 py-2 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs px-2.5 py-0.5 shadow-2xs">
                                {activeBudget.code}
                            </Badge>
                            <Badge variant="outline" className="text-slate-700 font-semibold bg-white border-slate-200">
                                🏢 {activeBudget.location?.name}
                            </Badge>
                            <Badge variant="outline" className="text-slate-700 bg-white border-slate-200">
                                📅 {MONTH_NAMES[activeBudget.periodMonth - 1]} {activeBudget.periodYear}
                            </Badge>
                            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                                Diterima: {fmtShortDate(activeBudget.receivedDate)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs cursor-pointer">
                                <Link href={`/admin/rbl/print/${activeBudget.id}`} target="_blank">
                                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Cetak PDF</span>
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveTab("category-report")}
                                className={`h-7 text-xs gap-1.5 shadow-2xs transition-all cursor-pointer ${
                                    activeTab === "category-report"
                                        ? "bg-amber-100 text-amber-950 border-amber-300 font-semibold"
                                        : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                                }`}
                            >
                                <Fuel className="h-3.5 w-3.5 text-amber-600" />
                                <span>Laporan Kategori</span>
                            </Button>
                        </div>
                    </div>

                    {/* 4-Column Balanced Financial Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 p-3 sm:p-4">
                        {/* Col 1: Budget HO */}
                        <div className="p-2 sm:px-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span className="uppercase tracking-wider text-[10px] text-slate-400 font-bold">Plafon Anggaran</span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">HO Budget</span>
                            </div>
                            <div className="font-mono font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                                {fmt(activeBudget.amount)}
                            </div>
                            <p className="text-[11px] text-slate-400">Pagu operasional disetujui</p>
                        </div>

                        {/* Col 2: Realisasi */}
                        <div className="p-2 sm:px-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span className="uppercase tracking-wider text-[10px] text-slate-400 font-bold">Total Realisasi</span>
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                                    {activeBudget.expenses?.length || 0} Item
                                </span>
                            </div>
                            <div className="font-mono font-bold text-lg sm:text-xl text-blue-700 tracking-tight">
                                {fmt(activeBudget.totalExpense)}
                            </div>
                            <p className="text-[11px] text-slate-400">Total terpakai dilaporkan</p>
                        </div>

                        {/* Col 3: Sisa Saldo (Surplus / Defisit) */}
                        <div className="p-2 sm:px-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span className="uppercase tracking-wider text-[10px] text-slate-400 font-bold">
                                    {balanceStatus.label}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                                    activeBudget.remainingBalance >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                }`}>
                                    {activeBudget.remainingBalance >= 0 ? "SURPLUS" : "DEFISIT"}
                                </span>
                            </div>
                            <div className={`font-mono font-bold text-lg sm:text-xl tracking-tight ${balanceStatus.color}`}>
                                {activeBudget.remainingBalance >= 0 ? "+" : ""}{fmt(activeBudget.remainingBalance)}
                            </div>
                            <p className="text-[11px] text-slate-400">
                                {activeBudget.remainingBalance >= 0 ? "Sisa kas belum terpakai" : "Pengeluaran melebihi plafon"}
                            </p>
                        </div>

                        {/* Col 4: Tingkat Serapan */}
                        <div className="p-2 sm:px-4 space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span className="uppercase tracking-wider text-[10px] text-slate-400 font-bold">Serapan Anggaran</span>
                                <span className={`font-mono font-bold text-xs ${
                                    utilizationRate > 100 ? "text-rose-600" : utilizationRate > 85 ? "text-amber-600" : "text-emerald-600"
                                }`}>
                                    {utilizationRate.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                        utilizationRate > 100 ? "bg-rose-600" : utilizationRate > 85 ? "bg-amber-500" : "bg-emerald-600"
                                    }`}
                                    style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>Status:</span>
                                <span className={`font-medium ${
                                    utilizationRate > 100 ? "text-rose-600 font-semibold" : utilizationRate > 85 ? "text-amber-600 font-semibold" : "text-emerald-700 font-medium"
                                }`}>
                                    {utilizationRate > 100 ? "⚠️ Overbudget" : utilizationRate > 85 ? "⚠️ Waspada (>85%)" : "✓ Terkendali"}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            ) : null}

            {/* ─── MAIN TABS (SLEEK & RESPONSIVE) ─────────────────────────────────────────── */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 h-auto flex flex-wrap gap-1">
                    {canEdit && (
                        <TabsTrigger value="input-batch" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Input RBL</span>
                            {!activeBudget && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-medium flex items-center gap-0.5">
                                    <Lock className="h-2.5 w-2.5" /> Terkunci
                                </span>
                            )}
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="daily-list" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Daftar Pengeluaran</span>
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono h-4 bg-slate-200/70 text-slate-700">
                            {activeBudget?.expenses?.length || 0}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="category-report" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-amber-800 data-[state=active]:shadow-2xs text-amber-900 font-medium">
                        <Fuel className="h-3.5 w-3.5 text-amber-600" />
                        <span>Laporan Kategori</span>
                        <Badge className="ml-1 px-1.5 py-0 text-[10px] bg-amber-100 text-amber-800 border-none font-sans">
                            BBM/Export
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="bulk-upload" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Nota Kas</span>
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono h-4 bg-slate-200/70 text-slate-700">
                            {activeBudget?.attachments?.length || 0}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Riwayat Periode</span>
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs">
                        <Tag className="h-3.5 w-3.5" />
                        <span>Master Kategori</span>
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono h-4 bg-slate-200/70 text-slate-700">
                            {categories.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                {/* ─── TAB 1: Quick Batch Expense Entry with Row-level Dates ─────────── */}
                <TabsContent value="input-batch" className="space-y-4">
                    {!activeBudget ? (
                        <Card className="border border-amber-200 bg-amber-50/40 shadow-2xs overflow-hidden">
                            <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Anggaran Belum Dibuka untuk {adminBranchName}
                                            </h3>
                                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold">
                                                Form Terkunci
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                                            Sistem memerlukan anggaran periode berjalan dibuka terlebih dahulu sebelum menginput pengeluaran harian dan mengunggah foto nota kas.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                    {canCreate && (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setBudgetForm(prev => ({
                                                    ...prev,
                                                    locationId: selectedLocation !== "all" ? selectedLocation : (userLocationId || locations[0]?.id || "")
                                                }))
                                                setIsCreateBudgetOpen(true)
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-8 shadow-xs cursor-pointer"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Buka Budget Baru
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setActiveTab("history")}
                                        className="text-xs h-8 text-slate-700 bg-white cursor-pointer"
                                    >
                                        <Calendar className="h-3.5 w-3.5 mr-1 text-slate-500" />
                                        Lihat Riwayat
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                    <Card className="border shadow-xs">
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <span>Input RBL</span>
                                        <Badge variant="outline" className="text-xs bg-white text-blue-700 border-blue-200">
                                            Periode: {budgetDateRange.label}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500">
                                        Tanggal ditentukan per baris untuk mencegah mis-input. Setiap baris baru otomatis melanjutkan tanggal sebelumnya.
                                    </CardDescription>
                                </div>

                                {/* Quick Date Synchronizer Shortcut */}
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-2xs">
                                    <Label className="text-xs text-slate-600 whitespace-nowrap">Set Semua Baris:</Label>
                                    <Input
                                        type="date"
                                        min={budgetDateRange.min}
                                        max={budgetDateRange.max}
                                        defaultValue={budgetDateRange.defaultDate}
                                        onChange={e => e.target.value && handleSetAllRowsDate(e.target.value)}
                                        className="h-7 text-xs w-36 bg-slate-50"
                                    />
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="text-[11px]">
                                            <TableHead className="w-10 text-center">#</TableHead>
                                            <TableHead className="w-36">Tanggal Transaksi *</TableHead>
                                            <TableHead className="min-w-[200px]">Nama Item / Uraian (Free Text) *</TableHead>
                                            <TableHead className="min-w-[160px]">Kategori</TableHead>
                                            <TableHead className="w-20">Qty</TableHead>
                                            <TableHead className="w-24">Satuan</TableHead>
                                            <TableHead className="w-32">Harga Satuan (Rp)</TableHead>
                                            <TableHead className="w-32 text-right">Total (Rp)</TableHead>
                                            <TableHead className="w-28">No. Bon / Ref</TableHead>
                                            <TableHead className="min-w-[140px]">Catatan (Opsional)</TableHead>
                                            <TableHead className="w-10 text-center"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {batchRows.map((row, idx) => {
                                            const subtotal = (row.quantity || 0) * (row.unitPrice || 0)
                                            const currentCat = categories.find(c => c.id === row.categoryId || c.name.toLowerCase() === (row.category || "").toLowerCase())
                                            const showVehicleSubrow = Boolean(currentCat?.requireVehicleKm || row.vehicleId)

                                            return (
                                                <React.Fragment key={row.id}>
                                                    <TableRow className="hover:bg-slate-50/70">
                                                        <TableCell className="text-center text-xs text-slate-400 font-mono">
                                                            {idx + 1}
                                                        </TableCell>
                                                        {/* Dedicated Row-level Date */}
                                                        <TableCell>
                                                            <Input
                                                                type="date"
                                                                min={budgetDateRange.min}
                                                                max={budgetDateRange.max}
                                                                value={row.date}
                                                                onChange={e => handleRowChange(row.id, "date", e.target.value)}
                                                                className="h-8 text-xs font-mono"
                                                                required
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                placeholder="Misal: Beli Solar Mixer 01"
                                                                value={row.itemDescription}
                                                                onChange={e => handleRowChange(row.id, "itemDescription", e.target.value)}
                                                                className="h-8 text-xs"
                                                                autoFocus={idx === batchRows.length - 1 && idx > 0}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <CategorySelector
                                                                selectedCategoryName={row.category}
                                                                categories={categories}
                                                                onSelect={(cat) => handleCategorySelect(row.id, cat)}
                                                                onOpenQuickCreate={() => handleOpenQuickCategory(row.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                value={row.quantity || ""}
                                                                onChange={e => handleRowChange(row.id, "quantity", parseFloat(e.target.value) || 0)}
                                                                className="h-8 text-xs text-center"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                placeholder="Liter/Pcs"
                                                                value={row.unit}
                                                                onChange={e => handleRowChange(row.id, "unit", e.target.value)}
                                                                className="h-8 text-xs"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={row.unitPrice || ""}
                                                                onChange={e => handleRowChange(row.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                                                className="h-8 text-xs text-right font-mono"
                                                                placeholder="0"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-xs text-slate-800">
                                                            {fmt(subtotal)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                placeholder="No. Struk"
                                                                value={row.receiptNo}
                                                                onChange={e => handleRowChange(row.id, "receiptNo", e.target.value)}
                                                                className="h-8 text-xs"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                placeholder="Catatan..."
                                                                value={row.notes}
                                                                onChange={e => handleRowChange(row.id, "notes", e.target.value)}
                                                                className="h-8 text-xs"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemoveBatchRow(row.id)}
                                                                className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {/* Conditional Sub-row for Vehicle & KM Odometer with Real-time Distance Calculation */}
                                                    {showVehicleSubrow && (() => {
                                                        const prevKmInfo = getVehiclePreviousKmInfo(row.vehicleId, idx)
                                                        const currentKm = row.kmMeter !== null && row.kmMeter !== undefined && !isNaN(Number(row.kmMeter)) ? Number(row.kmMeter) : null
                                                        const prevKm = prevKmInfo?.km ?? null
                                                        const hasDelta = currentKm !== null && prevKm !== null
                                                        const deltaKm = hasDelta ? currentKm! - prevKm! : null
                                                        const isNegative = deltaKm !== null && deltaKm < 0
                                                        const isZero = deltaKm !== null && deltaKm === 0
                                                        const isPositive = deltaKm !== null && deltaKm > 0
                                                        const fuelConsumption = (isPositive && row.quantity && row.quantity > 0)
                                                            ? (deltaKm! / row.quantity).toFixed(1)
                                                            : null

                                                        return (
                                                            <TableRow className={`border-b transition-colors ${
                                                                isNegative
                                                                    ? "bg-rose-50/90 border-rose-200"
                                                                    : isPositive
                                                                        ? "bg-emerald-50/50 border-emerald-200/70"
                                                                        : "bg-amber-50/50 border-amber-200/60"
                                                            }`}>
                                                                <TableCell className="text-center font-mono text-[11px] text-amber-600 font-bold">
                                                                    ↳
                                                                </TableCell>
                                                                <TableCell colSpan={3} className="py-2">
                                                                    <div className="flex items-center gap-2 text-xs text-slate-800">
                                                                        <Fuel className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                                                        <span className="font-semibold text-[11px] whitespace-nowrap text-slate-700">Unit Armada:</span>
                                                                        <div className="flex-1 min-w-[200px]">
                                                                            <VehicleSelector
                                                                                selectedVehicleId={row.vehicleId}
                                                                                vehicles={branchVehicles}
                                                                                isHeadOfficeBudget={isHeadOfficeBudget}
                                                                                onSelect={vId => handleRowChange(row.id, "vehicleId", vId)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell colSpan={2} className="py-2">
                                                                    <div className="flex items-center gap-1.5 text-xs">
                                                                        <Gauge className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                                                        <span className="font-semibold text-[11px] whitespace-nowrap text-slate-700">KM Odo:</span>
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            placeholder="Contoh: 124500"
                                                                            value={row.kmMeter ?? ""}
                                                                            onChange={e => handleRowChange(row.id, "kmMeter", e.target.value ? parseFloat(e.target.value) : null)}
                                                                            className={`h-7 text-xs font-mono font-bold w-full transition-all ${
                                                                                isNegative
                                                                                    ? "border-rose-500 bg-rose-50/80 text-rose-900 focus-visible:ring-rose-400"
                                                                                    : isPositive
                                                                                        ? "border-emerald-500 bg-white text-emerald-900 focus-visible:ring-emerald-400"
                                                                                        : "border-amber-300 bg-white"
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell colSpan={5} className="py-2">
                                                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                                                        {/* Badge KM Sebelumnya */}
                                                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] shadow-2xs">
                                                                            <span className="text-slate-400 font-medium">KM Lalu:</span>
                                                                            <span className="font-mono font-bold">
                                                                                {prevKmInfo ? `${prevKmInfo.km.toLocaleString("id-ID")} KM` : "Belum Ada (Awal)"}
                                                                            </span>
                                                                            {prevKmInfo?.source && (
                                                                                <span className="text-[10px] text-slate-400">({prevKmInfo.source})</span>
                                                                            )}
                                                                        </div>

                                                                        {/* Perhitungan Real-time Jarak Tempuh / Peringatan Mundur */}
                                                                        {isNegative && (
                                                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-semibold animate-pulse">
                                                                                <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
                                                                                <span>⚠️ KM Sekarang lebih kecil dari KM sebelumnya! Selisih: {deltaKm!.toLocaleString("id-ID")} KM (Cek salah ketik / kurang angka)</span>
                                                                            </div>
                                                                        )}

                                                                        {isZero && (
                                                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-[11px]">
                                                                                <span>⚠️ Odometer sama dengan KM sebelumnya (Jarak 0 KM)</span>
                                                                            </div>
                                                                        )}

                                                                        {isPositive && (
                                                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-semibold">
                                                                                <CheckCircle2 className="h-3 w-3 text-emerald-700 shrink-0" />
                                                                                <span>Jarak Tempuh: +{deltaKm!.toLocaleString("id-ID")} KM</span>
                                                                                {fuelConsumption && (
                                                                                    <span className="font-normal text-emerald-800 ml-1 pl-1.5 border-l border-emerald-300">
                                                                                        Rasio: <strong>{fuelConsumption} KM/L</strong> ({row.quantity} L)
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {!hasDelta && (
                                                                            <span className="text-[11px] text-slate-400 italic">
                                                                                Masukkan KM Odo untuk menghitung jarak tempuh
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })()}
                                                </React.Fragment>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t bg-slate-50/50 gap-3">
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddBatchRow()}
                                        className="gap-1.5 h-8 text-xs bg-white"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Tambah Baris
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const today = format(new Date(), "yyyy-MM-dd")
                                            handleAddBatchRow(today)
                                        }}
                                        className="h-8 text-xs text-slate-600 hover:text-blue-600"
                                    >
                                        + Baris Hari Ini
                                    </Button>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-xs text-slate-600">
                                        Total Form Ini:{" "}
                                        <span className="font-bold text-sm text-slate-900 font-mono">
                                            {fmt(batchRows.reduce((s, r) => s + (r.quantity || 0) * (r.unitPrice || 0), 0))}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={handleSaveBatchExpenses}
                                        disabled={isPending || !activeBudget}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-8 text-xs shadow-xs"
                                    >
                                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                        Simpan Semua Baris
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    )}
                </TabsContent>

                {/* ─── TAB 2: Daily Grouped Expense List ─────────────────────────────── */}
                <TabsContent value="daily-list" className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                                Total <span className="font-bold text-slate-800 font-mono">{activeBudget?.expenses?.length || 0}</span> transaksi pengeluaran tercatat
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveTab("category-report")}
                                className="h-7 text-xs gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 cursor-pointer shadow-2xs font-medium"
                            >
                                <Fuel className="h-3.5 w-3.5 text-amber-600" />
                                <span>Ekspor & Laporan Kategori</span>
                            </Button>
                            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border">
                                <button
                                    type="button"
                                    onClick={() => setExpenseViewMode("grouped")}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                                        expenseViewMode === "grouped"
                                            ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                            : "text-slate-500 hover:text-slate-900"
                                    }`}
                                >
                                    Per Tanggal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExpenseViewMode("flat")}
                                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                                        expenseViewMode === "flat"
                                            ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                            : "text-slate-500 hover:text-slate-900"
                                    }`}
                                >
                                    Tabel Lengkap (1 — {activeBudget?.expenses?.length || 0})
                                </button>
                            </div>
                        </div>
                    </div>

                    {!activeBudget ? (
                        <Card className="p-10 text-center text-slate-500 text-xs border rounded-xl bg-slate-50/60 space-y-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="font-semibold text-slate-700 text-sm">Tidak Ada Budget Aktif</div>
                            <p className="text-slate-400 max-w-md mx-auto">
                                Daftar pengeluaran terikat pada periode budget yang aktif. Buka budget baru terlebih dahulu untuk mulai mencatat transaksi.
                            </p>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setBudgetForm(prev => ({
                                        ...prev,
                                        locationId: selectedLocation !== "all" ? selectedLocation : (userLocationId || locations[0]?.id || "")
                                    }))
                                    setIsCreateBudgetOpen(true)
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Buka Budget Sekarang
                            </Button>
                        </Card>
                    ) : (!activeBudget.expenses || activeBudget.expenses.length === 0) ? (
                        <Card className="p-8 text-center text-slate-500 text-sm">
                            Belum ada pengeluaran yang dicatat pada budget aktif ini.
                        </Card>
                    ) : expenseViewMode === "grouped" ? (
                        expensesByDate.map(group => (
                            <Card key={group.date} className="border shadow-xs overflow-hidden">
                                <div className="bg-slate-100/70 px-4 py-2.5 flex items-center justify-between border-b text-xs">
                                    <div className="flex items-center gap-2 font-bold text-slate-800">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                        <span>{fmtDate(group.date)}</span>
                                        <Badge variant="outline" className="text-[10px] bg-white">
                                            {group.items.length} item
                                        </Badge>
                                    </div>
                                    <div className="font-mono font-bold text-sm text-slate-900">
                                        Subtotal Hari Ini: {fmt(group.subtotal)}
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader className="bg-white">
                                        <TableRow className="text-[11px] text-slate-500">
                                            <TableHead className="w-12 text-center">No</TableHead>
                                            <TableHead>Nama Item / Uraian</TableHead>
                                            <TableHead className="w-36">Kategori</TableHead>
                                            <TableHead className="w-24 text-center">Qty / Satuan</TableHead>
                                            <TableHead className="w-28 text-right">Harga Satuan</TableHead>
                                            <TableHead className="w-32 text-right">Total</TableHead>
                                            <TableHead className="w-24">No. Bon</TableHead>
                                            <TableHead className="w-16 text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.items.map((item, itemIdx) => (
                                            <TableRow key={item.id} className="text-xs hover:bg-slate-50/50">
                                                <TableCell className="text-center font-mono text-slate-400 font-semibold text-xs">
                                                    {itemIdx + 1}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-900">
                                                    <div>{item.itemDescription}</div>
                                                    {item.vehicle && (
                                                        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-800 border-amber-200 font-medium">
                                                                <Fuel className="h-2.5 w-2.5 mr-1 text-amber-600" />
                                                                {item.vehicle.code} ({item.vehicle.plate_number || item.vehicle.plateNumber})
                                                            </Badge>
                                                            {item.kmMeter && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 text-slate-700 border-slate-200 font-mono">
                                                                    <Gauge className="h-2.5 w-2.5 mr-1 text-slate-500" />
                                                                    {Number(item.kmMeter).toLocaleString("id-ID")} KM
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                    {item.notes && (
                                                        <span className="block text-[10px] text-slate-400">{item.notes}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                                        {item.category}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center font-mono">
                                                    {item.quantity} {item.unit}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-slate-600">
                                                    {fmt(item.unitPrice)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-slate-900">
                                                    {fmt(item.amount)}
                                                </TableCell>
                                                <TableCell className="text-slate-500 font-mono text-[11px]">
                                                    {item.receiptNo || "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {canEdit && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setEditingExpense({
                                                                        ...item,
                                                                        date: format(new Date(item.date), "yyyy-MM-dd")
                                                                    })
                                                                    setIsEditExpenseOpen(true)
                                                                }}
                                                                className="h-7 w-7 text-slate-500 hover:text-blue-600"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                        {canDelete && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteExpense(item.id)}
                                                                className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        ))
                    ) : (
                        <Card className="border shadow-xs overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="text-[11px] text-slate-500">
                                        <TableHead className="w-12 text-center">No</TableHead>
                                        <TableHead className="w-28">Tanggal</TableHead>
                                        <TableHead>Nama Item / Uraian</TableHead>
                                        <TableHead className="w-36">Kategori</TableHead>
                                        <TableHead className="w-24 text-center">Qty / Satuan</TableHead>
                                        <TableHead className="w-28 text-right">Harga Satuan</TableHead>
                                        <TableHead className="w-32 text-right">Total</TableHead>
                                        <TableHead className="w-24">No. Bon</TableHead>
                                        <TableHead className="w-16 text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedAllExpenses.map((item: any, idx: number) => (
                                        <TableRow key={item.id} className="text-xs hover:bg-slate-50/50">
                                            <TableCell className="text-center font-mono text-slate-400 font-semibold text-xs">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell className="font-mono text-slate-600 text-xs whitespace-nowrap">
                                                {format(new Date(item.date), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-900">
                                                <div>{item.itemDescription}</div>
                                                {item.vehicle && (
                                                    <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-800 border-amber-200 font-medium">
                                                            <Fuel className="h-2.5 w-2.5 mr-1 text-amber-600" />
                                                            {item.vehicle.code} ({item.vehicle.plate_number || item.vehicle.plateNumber})
                                                        </Badge>
                                                        {item.kmMeter && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 text-slate-700 border-slate-200 font-mono">
                                                                <Gauge className="h-2.5 w-2.5 mr-1 text-slate-500" />
                                                                {Number(item.kmMeter).toLocaleString("id-ID")} KM
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                                {item.notes && (
                                                    <span className="block text-[10px] text-slate-400">{item.notes}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                                    {item.category}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center font-mono">
                                                {item.quantity} {item.unit}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-600">
                                                {fmt(item.unitPrice)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-slate-900">
                                                {fmt(item.amount)}
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-mono text-[11px]">
                                                {item.receiptNo || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {canEdit && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditingExpense({
                                                                    ...item,
                                                                    date: format(new Date(item.date), "yyyy-MM-dd")
                                                                })
                                                                setIsEditExpenseOpen(true)
                                                            }}
                                                            className="h-7 w-7 text-slate-500 hover:text-blue-600"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteExpense(item.id)}
                                                            className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </TabsContent>

                {/* ─── TAB 3: Bulk Upload Galeri Foto Nota with Compression ─────────── */}
                <TabsContent value="bulk-upload" className="space-y-4">
                    <Card className="border shadow-xs">
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4 text-blue-600" />
                                        <span>Galeri Foto Bukti Nota / Kwitansi</span>
                                        {activeBudget && (
                                            <Badge variant="outline" className="text-xs bg-white text-emerald-700 border-emerald-200">
                                                Terkunci ke: {activeBudget.code}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Upload bulk foto nota untuk budget aktif ini. Setiap foto dikompresi otomatis tanpa menurunkan ketajaman teks/angka.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-4 space-y-4">
                            {!activeBudget ? (
                                <div className="p-10 text-center text-slate-500 text-xs border rounded-xl bg-slate-50/60 space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                                        <ImageIcon className="h-5 w-5" />
                                    </div>
                                    <div className="font-semibold text-slate-700 text-sm">Belum Ada Budget Aktif</div>
                                    <p className="text-slate-400 max-w-md mx-auto">
                                        Foto nota atau kwitansi wajib terikat ke budget aktif. Buka budget baru sebelum mengunggah berkas.
                                    </p>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setBudgetForm(prev => ({
                                                ...prev,
                                                locationId: selectedLocation !== "all" ? selectedLocation : (userLocationId || locations[0]?.id || "")
                                            }))
                                            setIsCreateBudgetOpen(true)
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 cursor-pointer"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Buka Budget Sekarang
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Dropzone Upload */}
                                    {canEdit && (
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                                                onChange={handleFilesSelected}
                                                className="hidden"
                                                id="bulk-receipt-upload"
                                            />
                                            <label
                                                htmlFor="bulk-receipt-upload"
                                                className="cursor-pointer flex flex-col items-center space-y-2"
                                            >
                                                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                                    {isCompressing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                                                </div>
                                                <div className="text-sm font-semibold text-slate-800">
                                                    {isCompressing ? "Mengompresi Gambar..." : "Klik untuk Pilih Banyak Foto Sekaligus"}
                                                </div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                                    <span>Kompresi pintar otomatis: Ukuran hemat hingga 95%, teks nota tetap 100% terbaca jelas.</span>
                                                </div>
                                            </label>
                                        </div>
                                    )}

                                    {/* Staged files waiting to be uploaded */}
                                    {canEdit && stagedFiles.length > 0 && (
                                        <div className="space-y-3 p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                                <div>
                                                    <span className="font-bold text-blue-900">
                                                        {stagedFiles.length} Foto Nota Siap Diunggah:
                                                    </span>
                                                    {compressionStats && (
                                                        <span className="block text-[11px] text-blue-700 mt-0.5">
                                                            Total ukuran: {formatFileSize(compressionStats.totalCompressed)} (dikompresi dari {formatFileSize(compressionStats.totalOriginal)} — hemat {compressionStats.savedPercent}%)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setStagedFiles([])}
                                                        className="h-7 text-xs text-slate-500"
                                                    >
                                                        Batal
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={handleExecuteBulkUpload}
                                                        disabled={isUploading}
                                                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                                                    >
                                                        {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                                        Upload {stagedFiles.length} Foto
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Preview Staged File Chips */}
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {stagedFiles.map((sf, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center gap-1.5 bg-white pl-2 pr-1.5 py-1 rounded-lg border text-xs shadow-2xs"
                                                    >
                                                        <span className="truncate max-w-[120px] font-medium text-slate-700" title={sf.name}>
                                                            {sf.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            ({formatFileSize(sf.compressedSize)})
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setStagedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded-sm"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Gallery of already uploaded attachments */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                            <span>Lampiran Nota Tersimpan ({activeBudget.attachments?.length || 0})</span>
                                        </div>

                                        {!activeBudget.attachments || activeBudget.attachments.length === 0 ? (
                                            <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed text-slate-400 text-xs">
                                                Belum ada foto nota yang diunggah untuk budget ini.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                {activeBudget.attachments.map((att: any) => (
                                                    <div
                                                        key={att.id}
                                                        className="group relative rounded-xl border bg-white overflow-hidden shadow-2xs hover:shadow-xs transition-all"
                                                    >
                                                        <div
                                                            className="h-28 bg-slate-100 relative overflow-hidden cursor-pointer flex items-center justify-center"
                                                            onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                                                        >
                                                            <img
                                                                src={att.fileUrl}
                                                                alt={att.fileName}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                            />
                                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                <Eye className="h-5 w-5" />
                                                            </div>
                                                        </div>
                                                        <div className="p-2 text-[10px] space-y-1">
                                                            <div className="font-medium truncate text-slate-800" title={att.fileName}>
                                                                {att.fileName}
                                                            </div>
                                                            <div className="flex items-center justify-between text-slate-400">
                                                                <span>{att.fileSize ? formatFileSize(att.fileSize) : "-"}</span>
                                                                {canDelete && (
                                                                    <button
                                                                        onClick={() => handleDeleteAttachment(att.id)}
                                                                        className="text-slate-400 hover:text-rose-600 p-0.5"
                                                                        title="Hapus foto"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── TAB 4: History & Period Archive ──────────────────────────────── */}
                <TabsContent value="history" className="space-y-4">
                    <Card className="border shadow-xs">
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base">Riwayat Periode RBL Cabang</CardTitle>
                                    <CardDescription className="text-xs">
                                        Arsip periode anggaran sebelumnya yang telah ditutup atau sedang berjalan.
                                    </CardDescription>
                                </div>

                                {/* Filters & Search Bar */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="relative">
                                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="Cari kode / cabang / catatan..."
                                            value={historySearch}
                                            onChange={e => setHistorySearch(e.target.value)}
                                            className="h-8 text-xs pl-8 w-44 md:w-56 bg-white"
                                        />
                                    </div>

                                    <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                                        <SelectTrigger className="h-8 text-xs w-32 bg-white">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                                            <SelectItem value="OPEN" className="text-xs">OPEN (Aktif)</SelectItem>
                                            <SelectItem value="CLOSED" className="text-xs">CLOSED (Tutup Buku)</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={historyYearFilter} onValueChange={setHistoryYearFilter}>
                                        <SelectTrigger className="h-8 text-xs w-28 bg-white">
                                            <SelectValue placeholder="Tahun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL" className="text-xs">Semua Tahun</SelectItem>
                                            {historyAvailableYears.map(yr => (
                                                <SelectItem key={yr} value={String(yr)} className="text-xs">{yr}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="text-[11px]">
                                        <TableHead>Kode RBL</TableHead>
                                        <TableHead>Cabang</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead className="w-24">Tgl Buka</TableHead>
                                        <TableHead className="w-28">Tgl Terima Dana</TableHead>
                                        <TableHead className="w-24">Tgl Tutup</TableHead>
                                        <TableHead className="text-right">Budget HO</TableHead>
                                        <TableHead className="text-right">Pengeluaran</TableHead>
                                        <TableHead className="text-right">Sisa / Minus</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center text-xs text-slate-400 py-6">
                                                {history.length === 0 ? "Belum ada riwayat RBL." : "Tidak ada riwayat yang sesuai dengan filter pencarian."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredHistory.map(b => (
                                            <TableRow key={b.id} className="text-xs hover:bg-slate-50/50">
                                                <TableCell className="font-mono font-bold text-slate-800">
                                                    {b.code}
                                                </TableCell>
                                                <TableCell>{b.location?.name}</TableCell>
                                                <TableCell>
                                                    {MONTH_NAMES[b.periodMonth - 1]} {b.periodYear}
                                                </TableCell>
                                                <TableCell className="font-mono text-slate-600 text-xs whitespace-nowrap">
                                                    {fmtShortDate(b.createdAt)}
                                                </TableCell>
                                                <TableCell className="font-mono text-slate-800 font-medium text-xs whitespace-nowrap">
                                                    {fmtShortDate(b.receivedDate)}
                                                </TableCell>
                                                <TableCell className="font-mono text-slate-600 text-xs whitespace-nowrap">
                                                    {b.closedAt ? fmtShortDate(b.closedAt) : (
                                                        <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                                                            Aktif
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold">
                                                    {fmt(b.amount)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-slate-600">
                                                    {fmt(b.totalExpense)}
                                                </TableCell>
                                                <TableCell className={`text-right font-mono font-bold ${
                                                    b.remainingBalance > 0 ? "text-emerald-700" : b.remainingBalance < 0 ? "text-rose-700" : "text-slate-600"
                                                }`}>
                                                    {b.remainingBalance >= 0 ? "+" : ""}{fmt(b.remainingBalance)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        className={b.status === "OPEN" ? "bg-emerald-600 text-white text-[10px]" : "bg-slate-200 text-slate-700 text-[10px]"}
                                                    >
                                                        {b.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenDetail(b.id)}
                                                            className="h-7 text-xs gap-1 text-slate-700 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            Detail
                                                        </Button>
                                                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 text-slate-600 hover:text-slate-900">
                                                            <Link href={`/admin/rbl/print/${b.id}`} target="_blank">
                                                                <Printer className="h-3.5 w-3.5" />
                                                                Cetak
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── TAB 5: Master Kategori RBL ──────────────────────────────────── */}
                <TabsContent value="categories" className="space-y-4">
                    <Card className="border shadow-xs">
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-blue-600" />
                                        <span>Master Kategori Pengeluaran RBL</span>
                                        <Badge variant="outline" className="text-xs bg-white text-blue-700 border-blue-200">
                                            {categories.length} Kategori
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500">
                                        Kelola daftar kategori pengeluaran operasional dan penandaan kebutuhan armada kendaraan / KM Odometer.
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleOpenQuickCategory()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs cursor-pointer shadow-xs"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Tambah Kategori Baru
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="text-[11px] text-slate-600">
                                            <TableHead className="w-12 text-center">No</TableHead>
                                            <TableHead className="min-w-[200px]">Nama Kategori</TableHead>
                                            <TableHead className="min-w-[240px]">Deskripsi / Keterangan</TableHead>
                                            <TableHead className="w-48 text-center">Armada & Odometer</TableHead>
                                            <TableHead className="w-28 text-center">Tipe</TableHead>
                                            <TableHead className="w-24 text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                                                    Belum ada kategori terdaftar.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            categories.map((cat, idx) => (
                                                <TableRow key={cat.id} className="text-xs hover:bg-slate-50/60">
                                                    <TableCell className="text-center font-mono text-slate-400 font-semibold">
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-slate-900">
                                                        <div className="flex items-center gap-2">
                                                            <span className="p-1 rounded bg-blue-50 text-blue-600">
                                                                <Tag className="h-3.5 w-3.5" />
                                                            </span>
                                                            <span>{cat.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-slate-600">
                                                        {cat.description || <span className="text-slate-300 italic">-</span>}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {cat.requireVehicleKm ? (
                                                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-medium">
                                                                <Fuel className="h-2.5 w-2.5 mr-1 text-amber-600" />
                                                                Aktif (Unit & KM)
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200">
                                                                Umum
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {cat.isSystem ? (
                                                            <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-700">
                                                                Bawaan Sistem
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                                                Kustom
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleOpenEditCategory(cat)}
                                                                className="h-7 w-7 text-slate-500 hover:text-blue-600 cursor-pointer"
                                                                title="Edit Kategori"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                            {!cat.isSystem && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteCategory(cat)}
                                                                    className="h-7 w-7 text-slate-400 hover:text-rose-600 cursor-pointer"
                                                                    title="Hapus Kategori"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── TAB 6: Dedicated Category Report Export View ──────────────────── */}
                <TabsContent value="category-report" className="space-y-4">
                    <RblCategoryReport
                        categories={categories}
                        locations={locations}
                        vehicles={vehicles}
                        userLocationId={userLocationId}
                        isSuperAdmin={isSuperAdmin}
                        embedded={true}
                    />
                </TabsContent>
            </Tabs>

            {/* ─── DIALOG: Buka Budget Baru ─────────────────────────────────────────── */}
            <Dialog open={isCreateBudgetOpen} onOpenChange={setIsCreateBudgetOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <form onSubmit={handleCreateBudgetSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-base flex items-center gap-2">
                                <WalletCards className="h-5 w-5 text-blue-600" />
                                Buka Budget RBL Baru
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Input penerimaan anggaran operasional dari Head Office untuk periode berjalan.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-3 py-4 text-xs">
                            {isSuperAdmin ? (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Pilih Cabang *</Label>
                                    <Select
                                        value={budgetForm.locationId}
                                        onValueChange={v => setBudgetForm(prev => ({ ...prev, locationId: v }))}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Pilih Cabang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map(l => (
                                                <SelectItem key={l.id} value={l.id} className="text-xs">
                                                    {l.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Cabang Terdaftar</Label>
                                    <Input value={adminBranchName} disabled className="h-8 text-xs bg-slate-100 font-semibold" />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Bulan Periode *</Label>
                                    <Select
                                        value={String(budgetForm.periodMonth)}
                                        onValueChange={v => setBudgetForm(prev => ({ ...prev, periodMonth: parseInt(v) }))}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTH_NAMES.map((m, i) => (
                                                <SelectItem key={i} value={String(i + 1)} className="text-xs">
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Tahun *</Label>
                                    <Input
                                        type="number"
                                        value={budgetForm.periodYear}
                                        onChange={e => setBudgetForm(prev => ({ ...prev, periodYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Tanggal Penerimaan Dana *</Label>
                                <Input
                                    type="date"
                                    value={budgetForm.receivedDate}
                                    onChange={e => setBudgetForm(prev => ({ ...prev, receivedDate: e.target.value }))}
                                    className="h-8 text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Nominal Budget yang Diterima (Rp) *</Label>
                                <Input
                                    type="text"
                                    placeholder="Misal: 15.000.000"
                                    value={budgetForm.amount}
                                    onChange={e => {
                                        const clean = e.target.value.replace(/[^0-9]/g, "")
                                        const formatted = clean ? new Intl.NumberFormat("id-ID").format(parseInt(clean)) : ""
                                        setBudgetForm(prev => ({ ...prev, amount: formatted }))
                                    }}
                                    className="h-9 text-sm font-bold font-mono"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Catatan / Sumber Transfer (Opsional)</Label>
                                <Input
                                    placeholder="Misal: Transfer BCA HO ke Rekening Operasional"
                                    value={budgetForm.notes}
                                    onChange={e => setBudgetForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateBudgetOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isPending} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                Buka Budget RBL
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── DIALOG: Tutup Buku (Close Budget) ─────────────────────────────────── */}
            <Dialog open={isCloseBudgetOpen} onOpenChange={setIsCloseBudgetOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="text-base flex items-center gap-2 text-slate-900">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            Konfirmasi Tutup Buku RBL
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Setelah ditutup, mutasi pengeluaran periode ini akan dikunci dan laporan resmi akan diterbitkan.
                        </DialogDescription>
                    </DialogHeader>

                    {activeBudget && (
                        <div className="space-y-3 py-2 text-xs">
                            <div className="p-3 bg-slate-50 rounded-lg border space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Kode Periode:</span>
                                    <span className="font-bold text-slate-800">{activeBudget.code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Budget Awal:</span>
                                    <span className="font-bold text-slate-900 font-mono">{fmt(activeBudget.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total Pengeluaran:</span>
                                    <span className="font-bold text-blue-700 font-mono">{fmt(activeBudget.totalExpense)}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between items-center">
                                    <span className="font-bold text-slate-700">Saldo Akhir:</span>
                                    <span className={`font-bold font-mono text-sm ${
                                        activeBudget.remainingBalance > 0 ? "text-emerald-700" : activeBudget.remainingBalance < 0 ? "text-rose-700" : "text-slate-800"
                                    }`}>
                                        {activeBudget.remainingBalance >= 0 ? "+" : ""}{fmt(activeBudget.remainingBalance)}
                                    </span>
                                </div>
                            </div>

                            <div className={`p-2.5 rounded-md text-xs border ${
                                activeBudget.remainingBalance > 0
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : activeBudget.remainingBalance < 0
                                    ? "bg-rose-50 text-rose-800 border-rose-200"
                                    : "bg-blue-50 text-blue-800 border-blue-200"
                            }`}>
                                {activeBudget.remainingBalance > 0 ? (
                                    <span>Terdapat <strong>Sisa Pengembalian Dana (Surplus) sebesar {fmt(activeBudget.remainingBalance)}</strong> yang harus disetorkan kembali ke Head Office.</span>
                                ) : activeBudget.remainingBalance < 0 ? (
                                    <span>Terdapat <strong>Defisit / Minus sebesar {fmt(Math.abs(activeBudget.remainingBalance))}</strong> yang akan diajukan sebagai klaim penagihan ke Head Office.</span>
                                ) : (
                                    <span>Anggaran terpakai tepat seimbang tanpa sisa dan tanpa minus.</span>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Tanggal Tutup Periode RBL *</Label>
                                <Input
                                    type="date"
                                    value={closeDate}
                                    onChange={e => setCloseDate(e.target.value)}
                                    className="h-8 text-xs font-mono bg-white"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Catatan Berita Acara Penutupan / Bukti Transfer Pengembalian</Label>
                                <Textarea
                                    rows={2}
                                    placeholder="Misal: Sisa dana Rp 1.750.000 telah ditransfer kembali ke rekening HO BCA tgl 31 Mar."
                                    value={closeNotes}
                                    onChange={e => setCloseNotes(e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setIsCloseBudgetOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleCloseBudgetSubmit}
                            disabled={isPending}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            Konfirmasi Tutup Buku
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── DIALOG: Edit Single Expense ──────────────────────────────────────── */}
            <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="text-base">Edit Pengeluaran</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Perbarui rincian item pengeluaran RBL terpilih.
                        </DialogDescription>
                    </DialogHeader>

                    {editingExpense && (
                        <form onSubmit={handleEditExpenseSubmit}>
                            <div className="grid gap-3 py-3 text-xs">
                                <div className="space-y-1">
                                    <Label className="text-xs">Tanggal</Label>
                                    <Input
                                        type="date"
                                        min={budgetDateRange.min}
                                        max={budgetDateRange.max}
                                        value={editingExpense.date}
                                        onChange={e => setEditingExpense((prev: any) => ({ ...prev, date: e.target.value }))}
                                        className="h-8 text-xs font-mono"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Nama Item / Uraian</Label>
                                    <Input
                                        value={editingExpense.itemDescription}
                                        onChange={e => setEditingExpense((prev: any) => ({ ...prev, itemDescription: e.target.value }))}
                                        className="h-8 text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Kategori</Label>
                                    <CategorySelector
                                        selectedCategoryName={editingExpense.category}
                                        categories={categories}
                                        onSelect={(cat) => {
                                            const isFuel = cat.name.toLowerCase().includes("bbm") || cat.name.toLowerCase().includes("solar")
                                            setEditingExpense((prev: any) => ({
                                                ...prev,
                                                categoryId: cat.id,
                                                category: cat.name,
                                                unit: isFuel ? "Liter" : (prev.unit === "Liter" ? "Pcs" : prev.unit),
                                                vehicleId: cat.requireVehicleKm ? prev.vehicleId : null,
                                                kmMeter: cat.requireVehicleKm ? prev.kmMeter : null,
                                            }))
                                        }}
                                        onOpenQuickCreate={() => handleOpenQuickCategory()}
                                    />
                                </div>

                                {/* Conditional Vehicle & KM Meter if category requires vehicle or has vehicleId */}
                                {(categories.find(c => c.id === editingExpense.categoryId || c.name.toLowerCase() === (editingExpense.category || "").toLowerCase())?.requireVehicleKm || editingExpense.vehicleId) && (() => {
                                    const prevKmInfo = getVehiclePreviousKmInfo(editingExpense.vehicleId)
                                    const currentKm = editingExpense.kmMeter !== null && editingExpense.kmMeter !== undefined && !isNaN(Number(editingExpense.kmMeter)) ? Number(editingExpense.kmMeter) : null
                                    const prevKm = prevKmInfo?.km ?? null
                                    const hasDelta = currentKm !== null && prevKm !== null
                                    const deltaKm = hasDelta ? currentKm! - prevKm! : null
                                    const isNegative = deltaKm !== null && deltaKm < 0
                                    const isPositive = deltaKm !== null && deltaKm > 0

                                    return (
                                        <div className={`p-2.5 rounded-lg border space-y-2 transition-colors ${
                                            isNegative ? "bg-rose-50 border-rose-300" : isPositive ? "bg-emerald-50/60 border-emerald-200" : "bg-amber-50/70 border-amber-200"
                                        }`}>
                                            <div className="flex items-center justify-between gap-1 text-xs font-semibold">
                                                <div className="flex items-center gap-1 text-amber-900">
                                                    <Fuel className="h-3.5 w-3.5 text-amber-600" />
                                                    <span>Rincian Kendaraan & Odometer</span>
                                                </div>
                                                {prevKmInfo && (
                                                    <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border text-slate-600 font-normal">
                                                        KM Lalu: <strong>{prevKmInfo.km.toLocaleString("id-ID")}</strong>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[11px] text-slate-700">Unit Kendaraan / Alat</Label>
                                                    <VehicleSelector
                                                        selectedVehicleId={editingExpense.vehicleId}
                                                        vehicles={branchVehicles}
                                                        isHeadOfficeBudget={isHeadOfficeBudget}
                                                        onSelect={vId => setEditingExpense((prev: any) => ({
                                                            ...prev,
                                                            vehicleId: vId
                                                        }))}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[11px] text-slate-700">KM Odometer Sekarang</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        placeholder="Contoh: 124500"
                                                        value={editingExpense.kmMeter ?? ""}
                                                        onChange={e => setEditingExpense((prev: any) => ({
                                                            ...prev,
                                                            kmMeter: e.target.value ? parseFloat(e.target.value) : null
                                                        }))}
                                                        className={`h-8 text-xs font-mono font-bold bg-white ${
                                                            isNegative ? "border-rose-500 text-rose-900 bg-rose-50" : "border-amber-200"
                                                        }`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Real-time distance calculation in Edit Dialog */}
                                            {hasDelta && (
                                                <div className="text-[11px] pt-1 border-t">
                                                    {isNegative ? (
                                                        <div className="text-rose-700 font-semibold flex items-center gap-1">
                                                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                                            <span>⚠️ KM Sekarang lebih kecil dari KM sebelumnya! Selisih: {deltaKm!.toLocaleString("id-ID")} KM</span>
                                                        </div>
                                                    ) : isPositive ? (
                                                        <div className="text-emerald-800 font-medium flex items-center gap-1">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                            <span>Jarak Tempuh: <strong>+{deltaKm!.toLocaleString("id-ID")} KM</strong></span>
                                                            {editingExpense.quantity > 0 && (
                                                                <span className="text-slate-500 ml-1">
                                                                    (Rasio: <strong>{(deltaKm! / editingExpense.quantity).toFixed(1)} KM/L</strong>)
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-amber-800">⚠️ KM sama dengan KM sebelumnya (0 KM)</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })()}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Qty</Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={editingExpense.quantity}
                                            onChange={e => setEditingExpense((prev: any) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Satuan</Label>
                                        <Input
                                            value={editingExpense.unit}
                                            onChange={e => setEditingExpense((prev: any) => ({ ...prev, unit: e.target.value }))}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Harga (Rp)</Label>
                                        <Input
                                            type="number"
                                            value={editingExpense.unitPrice}
                                            onChange={e => setEditingExpense((prev: any) => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">No. Bon / Struk</Label>
                                    <Input
                                        value={editingExpense.receiptNo || ""}
                                        onChange={e => setEditingExpense((prev: any) => ({ ...prev, receiptNo: e.target.value }))}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Catatan (Opsional)</Label>
                                    <Input
                                        placeholder="Keterangan tambahan..."
                                        value={editingExpense.notes || ""}
                                        onChange={e => setEditingExpense((prev: any) => ({ ...prev, notes: e.target.value }))}
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditExpenseOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isPending} size="sm" className="bg-blue-600 text-white">
                                    Simpan Perubahan
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* ─── DIALOG: Tambah / Edit Kategori RBL ─────────────────────────────── */}
            <Dialog open={isQuickCategoryOpen} onOpenChange={setIsQuickCategoryOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="text-base flex items-center gap-2">
                            <Tag className="h-4 w-4 text-blue-600" />
                            {categoryModalMode === "create" ? "Tambah Kategori RBL Baru" : "Edit Kategori RBL"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            {categoryModalMode === "create"
                                ? "Kategori baru akan langsung dapat dipilih pada form input RBL."
                                : "Perbarui nama atau preferensi unit armada kategori ini."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2 text-xs">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Nama Kategori *</Label>
                            <Input
                                placeholder="Contoh: Oli Hidrolik & Transmisi"
                                value={quickCategoryForm.name}
                                onChange={e => setQuickCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                className="h-8 text-xs font-medium"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Deskripsi / Peruntukan (Opsional)</Label>
                            <Input
                                placeholder="Contoh: Penggantian oli berkala truck mixer dan loader"
                                value={quickCategoryForm.description}
                                onChange={e => setQuickCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                                className="h-8 text-xs"
                            />
                        </div>

                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg space-y-2">
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    id="requireVehicleKmCheck"
                                    checked={quickCategoryForm.requireVehicleKm}
                                    onChange={e => setQuickCategoryForm(prev => ({ ...prev, requireVehicleKm: e.target.checked }))}
                                    className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer h-4 w-4"
                                />
                                <label htmlFor="requireVehicleKmCheck" className="text-xs text-amber-900 font-medium cursor-pointer leading-tight">
                                    Aktifkan Input Unit Armada & KM Odometer
                                    <span className="block text-[11px] text-amber-700 font-normal mt-0.5">
                                        Cocok untuk BBM, solar, pelumas oli, atau sparepart armada agar form otomatis memunculkan pilihan unit kendaraan & odometer.
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsQuickCategoryOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isCategorySubmitting}
                            onClick={handleSaveCategory}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                        >
                            {isCategorySubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            {categoryModalMode === "create" ? "Buat Kategori" : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── DIALOG: Detail Data Periode RBL (Bisa dilihat kapan saja walau CLOSED) ─── */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-[850px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b bg-slate-50/70 shrink-0">
                        <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <DialogTitle className="text-base font-bold font-mono text-slate-900">
                                        {selectedDetailBudget?.code || "Detail Periode RBL"}
                                    </DialogTitle>
                                    {selectedDetailBudget && (
                                        <>
                                            <Badge className={selectedDetailBudget.status === "OPEN" ? "bg-emerald-600 text-white text-xs" : "bg-slate-700 text-white text-xs"}>
                                                {selectedDetailBudget.status === "OPEN" ? "OPEN (Aktif)" : "CLOSED (Tutup Buku)"}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs font-semibold bg-white">
                                                🏢 {selectedDetailBudget.location?.name}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs bg-white">
                                                📅 {MONTH_NAMES[selectedDetailBudget.periodMonth - 1]} {selectedDetailBudget.periodYear}
                                            </Badge>
                                        </>
                                    )}
                                </div>
                                {selectedDetailBudget && (
                                    <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1.5 self-start sm:self-auto bg-white">
                                        <Link href={`/admin/rbl/print/${selectedDetailBudget.id}`} target="_blank">
                                            <Printer className="h-3.5 w-3.5" />
                                            Cetak PDF
                                        </Link>
                                    </Button>
                                )}
                            </div>
                            <DialogDescription className="text-xs text-slate-500">
                                {isLoadingDetail ? (
                                    <span className="inline-flex items-center gap-1.5 text-blue-600 font-medium">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Sedang memuat data detail transaksi dan berkas nota...
                                    </span>
                                ) : selectedDetailBudget ? (
                                    <>
                                        Diterima {fmtDate(selectedDetailBudget.receivedDate)} • Diinput oleh {selectedDetailBudget.createdBy?.employee?.name || selectedDetailBudget.createdBy?.username || "-"}
                                        {selectedDetailBudget.status === "CLOSED" && selectedDetailBudget.closedAt && (
                                            <span> • Ditutup {fmtDate(selectedDetailBudget.closedAt)} oleh {selectedDetailBudget.closedBy?.employee?.name || selectedDetailBudget.closedBy?.username || "-"}</span>
                                        )}
                                    </>
                                ) : (
                                    "Detail transaksi pengeluaran dan lampiran foto nota RBL"
                                )}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {isLoadingDetail ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-slate-500 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="font-medium text-slate-700">Sedang memuat data detail RBL...</p>
                            <p className="text-[11px] text-slate-400">Menghubungkan ke database untuk mengambil rincian mutasi dan lampiran.</p>
                        </div>
                    ) : selectedDetailBudget ? (
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Timeline Periode Waktu */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-100/70 p-3 rounded-lg border">
                                <div>
                                    <span className="text-[11px] text-slate-500 block">1. Tanggal Buka Periode RBL:</span>
                                    <span className="font-semibold text-slate-800 font-mono">
                                        {fmtDate(selectedDetailBudget.createdAt)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block">2. Tanggal Ambil / Terima Budget:</span>
                                    <span className="font-semibold text-slate-800 font-mono">
                                        {fmtDate(selectedDetailBudget.receivedDate)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-500 block">3. Tanggal Closed / Tutup Buku:</span>
                                    <span className="font-semibold font-mono text-slate-800">
                                        {selectedDetailBudget.closedAt ? fmtDate(selectedDetailBudget.closedAt) : "Masih Berjalan (OPEN)"}
                                    </span>
                                </div>
                            </div>

                            {/* Summary strip */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                <div className="p-2.5 rounded-lg border bg-slate-50/50">
                                    <span className="text-[11px] text-slate-500 font-medium uppercase">Budget Diterima HO</span>
                                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                                        {fmt(selectedDetailBudget.amount)}
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-lg border bg-blue-50/30">
                                    <span className="text-[11px] text-slate-500 font-medium uppercase">Total Pengeluaran</span>
                                    <div className="text-base font-bold font-mono text-blue-700 mt-0.5">
                                        {fmt(selectedDetailBudget.totalExpense)}
                                    </div>
                                </div>
                                <div className={`p-2.5 rounded-lg border ${
                                    selectedDetailBudget.remainingBalance > 0
                                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                                        : selectedDetailBudget.remainingBalance < 0
                                        ? "bg-rose-50 text-rose-900 border-rose-200"
                                        : "bg-slate-50 text-slate-900"
                                }`}>
                                    <span className="text-[11px] font-medium uppercase text-slate-600">
                                        {selectedDetailBudget.remainingBalance >= 0 ? "Sisa Pengembalian HO" : "Defisit / Minus (Klaim HO)"}
                                    </span>
                                    <div className="text-base font-bold font-mono mt-0.5">
                                        {selectedDetailBudget.remainingBalance >= 0 ? "+" : ""}{fmt(selectedDetailBudget.remainingBalance)}
                                    </div>
                                </div>
                            </div>

                            {selectedDetailBudget.closeNotes && (
                                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900">
                                    <span className="font-bold">Catatan Penutupan Buku: </span>
                                    <span>{selectedDetailBudget.closeNotes}</span>
                                </div>
                            )}

                            {/* Tabs in Modal: Expenses vs Attachments */}
                            <Tabs defaultValue="expenses" className="space-y-3">
                                <TabsList className="bg-slate-100 p-1 h-8 rounded-lg">
                                    <TabsTrigger value="expenses" className="text-xs h-6 px-3">
                                        Daftar Pengeluaran ({selectedDetailBudget.expenses?.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="attachments" className="text-xs h-6 px-3">
                                        Bukti Foto Nota ({selectedDetailBudget.attachments?.length || 0})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="expenses">
                                    <div className="border rounded-lg overflow-hidden max-h-[350px] overflow-y-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                                <TableRow className="text-[11px]">
                                                    <TableHead className="w-10 text-center">No</TableHead>
                                                    <TableHead className="w-24">Tanggal</TableHead>
                                                    <TableHead>Nama Item / Uraian</TableHead>
                                                    <TableHead className="w-32">Kategori</TableHead>
                                                    <TableHead className="w-20 text-center">Qty</TableHead>
                                                    <TableHead className="w-28 text-right">Harga Satuan</TableHead>
                                                    <TableHead className="w-28 text-right">Total</TableHead>
                                                    <TableHead className="w-20">No. Bon</TableHead>
                                                    <TableHead className="min-w-[120px]">Catatan</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedDetailBudget.expenses?.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={9} className="text-center text-xs text-slate-400 py-6">
                                                            Tidak ada data transaksi pengeluaran.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    selectedDetailBudget.expenses?.map((exp: any, i: number) => (
                                                        <TableRow key={exp.id} className="text-xs hover:bg-slate-50">
                                                            <TableCell className="text-center font-mono text-slate-400">{i + 1}</TableCell>
                                                            <TableCell className="font-mono text-slate-600 whitespace-nowrap">{format(new Date(exp.date), "dd/MM/yyyy")}</TableCell>
                                                            <TableCell className="font-medium text-slate-900">
                                                                <div>{exp.itemDescription}</div>
                                                                {exp.vehicle && (
                                                                    <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-800 border-amber-200 font-medium">
                                                                            <Fuel className="h-2.5 w-2.5 mr-1 text-amber-600" />
                                                                            {exp.vehicle.code} ({exp.vehicle.plate_number || exp.vehicle.plateNumber})
                                                                        </Badge>
                                                                        {exp.kmMeter && (
                                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 text-slate-700 border-slate-200 font-mono">
                                                                                <Gauge className="h-2.5 w-2.5 mr-1 text-slate-500" />
                                                                                {Number(exp.kmMeter).toLocaleString("id-ID")} KM
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell><span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">{exp.category}</span></TableCell>
                                                            <TableCell className="text-center font-mono">{exp.quantity} {exp.unit}</TableCell>
                                                            <TableCell className="text-right font-mono text-slate-600">{fmt(exp.unitPrice)}</TableCell>
                                                            <TableCell className="text-right font-mono font-bold text-slate-900">{fmt(exp.amount)}</TableCell>
                                                            <TableCell className="font-mono text-slate-500 text-[11px]">{exp.receiptNo || "-"}</TableCell>
                                                            <TableCell className="text-slate-500 text-[11px]">{exp.notes || "-"}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                <TabsContent value="attachments">
                                    {selectedDetailBudget.attachments?.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-slate-400 border rounded-lg bg-slate-50">
                                            Tidak ada foto nota yang diunggah pada periode ini.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[350px] overflow-y-auto p-1">
                                            {selectedDetailBudget.attachments?.map((att: any) => (
                                                <div
                                                    key={att.id}
                                                    onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                                                    className="group border rounded-lg overflow-hidden bg-white shadow-2xs hover:shadow-md cursor-pointer transition-all"
                                                >
                                                    <div className="aspect-square bg-slate-100 overflow-hidden">
                                                        <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    </div>
                                                    <div className="p-1.5 text-[10px] truncate text-slate-700 font-medium" title={att.fileName}>
                                                        {att.fileName}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : null}

                    <DialogFooter className="p-3 border-t bg-slate-50 shrink-0">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── DIALOG: Lightbox Preview Foto Nota ───────────────────────────────── */}
            <Dialog open={!!previewImage} onOpenChange={open => !open && setPreviewImage(null)}>
                <DialogContent className="sm:max-w-[700px] p-2">
                    <DialogHeader className="px-3 pt-2 pb-1">
                        <DialogTitle className="text-xs truncate font-mono text-slate-700">
                            {previewImage?.name || "Pratinjau Foto Bukti"}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Pratinjau lampiran foto nota transaksi RBL
                        </DialogDescription>
                    </DialogHeader>
                    {previewImage && (
                        <div className="max-h-[80vh] overflow-auto flex items-center justify-center bg-slate-950/5 rounded-lg p-2">
                            <img
                                src={previewImage.url}
                                alt={previewImage.name}
                                className="max-w-full max-h-[75vh] object-contain rounded"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
