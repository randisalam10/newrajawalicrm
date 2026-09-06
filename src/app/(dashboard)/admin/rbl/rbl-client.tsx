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
import {
    WalletCards, Plus, Trash2, Edit2, Calendar, FileText, Image as ImageIcon,
    CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, ArrowRight, Upload, Loader2,
    Eye, Printer, RefreshCw, Layers, Check, X, ShieldAlert, Building2, Lock,
    Sparkles, Minimize2, Search, RotateCcw
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
    createBudget, closeBudget, addExpenseBatch, updateExpense,
    deleteExpense, uploadBulkReceipts, deleteAttachment, getActiveBudget,
    getBudgetHistory, getBudgetDetail
} from "./actions"
import Link from "next/link"

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

const EXPENSE_CATEGORIES = [
    "BBM & Pelumas",
    "Konsumsi & Dapur",
    "Pemeliharaan & Sparepart",
    "ATK & Keperluan Kantor",
    "Listrik, Air & Internet",
    "Keamanan & Kebersihan",
    "Operasional Umum"
]

interface BatchRow {
    id: string
    date: string
    itemDescription: string
    category: string
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
    userRole: string
    userLocationId: string
    isSuperAdmin: boolean
    canCreate?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canClose?: boolean
    canExport?: boolean
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
    userRole,
    userLocationId,
    isSuperAdmin,
    canCreate = true,
    canEdit = true,
    canDelete = true,
    canClose = true,
    canExport = true,
}: RblClientProps) {
    const [activeBudget, setActiveBudget] = useState<any>(initialActiveBudget)
    const [history, setHistory] = useState<any[]>(initialHistory)
    const [selectedLocation, setSelectedLocation] = useState<string>(
        isSuperAdmin ? "all" : userLocationId
    )
    const [isPending, startTransition] = useTransition()

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
        setBatchRows([
            {
                id: `row-${Date.now()}`,
                date: budgetDateRange.defaultDate,
                itemDescription: "",
                category: "BBM & Pelumas",
                quantity: 1,
                unit: "Liter",
                unitPrice: 0,
                receiptNo: "",
                notes: "",
            }
        ])
    }, [budgetDateRange])

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

        setBatchRows(prev => [
            ...prev,
            {
                id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                date: nextDate,
                itemDescription: "",
                category: "BBM & Pelumas",
                quantity: 1,
                unit: "Pcs",
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

        startTransition(async () => {
            const res = await addExpenseBatch(activeBudget.id, validRows)
            if (res.success) {
                toast.success(`Berhasil menyimpan ${res.count} item pengeluaran!`)
                // Reset form to 1 clean row with the last used date
                const lastDate = validRows[validRows.length - 1].date
                setBatchRows([{
                    id: `row-${Date.now()}`,
                    date: lastDate,
                    itemDescription: "",
                    category: "BBM & Pelumas",
                    quantity: 1,
                    unit: "Pcs",
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
                category: editingExpense.category,
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
            {/* ─── HEADER: Title & Prominent Branch Indicator ───────────────────── */}
            <div className="flex flex-col gap-4 border-b pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-xs">
                            <WalletCards className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Rekap Bulanan (RBL) — Pengeluaran Cabang
                            </h1>
                            <p className="text-xs text-slate-500">
                                Manajemen anggaran budget operasional, input pengeluaran multi-baris, dan upload bulk foto nota.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status Cabang untuk Admin Cabang (JELAS & TERKUNCI) */}
                        {!isSuperAdmin && (
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs">
                                <Building2 className="h-4 w-4 text-slate-600" />
                                <span>{adminBranchName}</span>
                                {activeBudget ? (
                                    <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5">
                                        Budget: {activeBudget.code}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 text-[10px] px-2 py-0.5 flex items-center gap-1">
                                        <Lock className="h-2.5 w-2.5" /> Belum Ada Budget
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Action: Open New Budget */}
                        {!activeBudget && canCreate && (
                            <Button
                                onClick={() => {
                                    setBudgetForm(prev => ({
                                        ...prev,
                                        locationId: selectedLocation !== "all" ? selectedLocation : (userLocationId || locations[0]?.id || "")
                                    }))
                                    setIsCreateBudgetOpen(true)
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9 text-xs shadow-xs"
                            >
                                <Plus className="h-4 w-4" />
                                Buka Budget Baru
                            </Button>
                        )}

                        {/* Action: Close Current Active Budget */}
                        {activeBudget && canClose && (
                            <Button
                                variant="outline"
                                onClick={() => setIsCloseBudgetOpen(true)}
                                className="border-rose-200 text-rose-700 hover:bg-rose-50 gap-1.5 h-9 text-xs"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Tutup Buku (Close RBL)
                            </Button>
                        )}
                    </div>
                </div>

                {/* ─── HO Branch Pills Switcher (Visible ONLY for Super Admin / HO) ─── */}
                {isSuperAdmin && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-1">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            Filter Cabang (HO):
                        </span>
                        <button
                            onClick={() => {
                                setSelectedLocation("all")
                                reloadData("all")
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                selectedLocation === "all"
                                    ? "bg-blue-600 text-white shadow-xs"
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
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                    selectedLocation === loc.id
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                📍 {loc.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── ACTIVE BUDGET BANNER CARD (COMPACT & SLEEK) ───────────────────────── */}
            {activeBudget ? (
                <Card className="border shadow-2xs overflow-hidden bg-white">
                    {/* Compact Header Bar */}
                    <div className="px-4 py-2 border-b bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-emerald-600 text-white font-mono text-xs px-2 py-0.5">
                                {activeBudget.code}
                            </Badge>
                            <Badge variant="outline" className="text-slate-700 font-semibold text-xs bg-white">
                                🏢 {activeBudget.location?.name}
                            </Badge>
                            <Badge variant="outline" className="text-slate-600 text-xs bg-white">
                                📅 Periode: {MONTH_NAMES[activeBudget.periodMonth - 1]} {activeBudget.periodYear}
                            </Badge>
                            <span className="text-[11px] text-slate-400 hidden md:inline">
                                Diterima {fmtDate(activeBudget.receivedDate)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5 bg-white">
                                <Link href={`/admin/rbl/print/${activeBudget.id}`} target="_blank">
                                    <Printer className="h-3.5 w-3.5" />
                                    Cetak PDF
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Compact Metrics Row */}
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-lg border bg-slate-50/50">
                            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                                Budget HO
                            </div>
                            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                                {fmt(activeBudget.amount)}
                            </div>
                        </div>

                        <div className="p-2.5 rounded-lg border bg-blue-50/30">
                            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex justify-between">
                                <span>Realisasi</span>
                                <span className="font-semibold text-blue-700 font-mono">{activeBudget.expenses?.length || 0} item</span>
                            </div>
                            <div className="text-lg font-bold text-blue-700 font-mono mt-0.5">
                                {fmt(activeBudget.totalExpense)}
                            </div>
                        </div>

                        <div className={`p-2.5 rounded-lg border ${balanceStatus.bg}`}>
                            <div className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">
                                {balanceStatus.label}
                            </div>
                            <div className={`text-lg font-bold font-mono mt-0.5 ${balanceStatus.color}`}>
                                {activeBudget.remainingBalance >= 0 ? "+" : ""}{fmt(activeBudget.remainingBalance)}
                            </div>
                        </div>
                    </div>

                    {/* Compact Inline Serapan Bar */}
                    <div className="px-3 pb-2.5 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="shrink-0 font-medium">Serapan:</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    utilizationRate > 100
                                        ? "bg-rose-600"
                                        : utilizationRate > 85
                                        ? "bg-amber-500"
                                        : "bg-emerald-600"
                                }`}
                                style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                            />
                        </div>
                        <span className={`font-mono font-bold shrink-0 ${utilizationRate > 100 ? "text-rose-600" : "text-slate-700"}`}>
                            {utilizationRate.toFixed(1)}%
                        </span>
                    </div>
                </Card>
            ) : null}

            {/* ─── MAIN TABS ─────────────────────────────────────────────────────────── */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-slate-100 p-1 rounded-lg">
                    {canEdit && (
                        <TabsTrigger value="input-batch" className="gap-2 text-xs">
                            <Plus className="h-3.5 w-3.5" />
                            Input RBL
                            {!activeBudget && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium flex items-center gap-0.5">
                                    <Lock className="h-2.5 w-2.5" /> Terkunci
                                </span>
                            )}
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="daily-list" className="gap-2 text-xs">
                        <FileText className="h-3.5 w-3.5" />
                        Daftar Pengeluaran ({activeBudget?.expenses?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="bulk-upload" className="gap-2 text-xs">
                        <ImageIcon className="h-3.5 w-3.5" />
                        Galeri Foto Nota ({activeBudget?.attachments?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2 text-xs">
                        <Calendar className="h-3.5 w-3.5" />
                        Riwayat Periode RBL
                    </TabsTrigger>
                </TabsList>

                {/* ─── TAB 1: Quick Batch Expense Entry with Row-level Dates ─────────── */}
                <TabsContent value="input-batch" className="space-y-4">
                    {!activeBudget ? (
                        <Card className="border shadow-xs overflow-hidden bg-white">
                            <div className="bg-slate-50/80 border-b px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            Form Input RBL Terkunci
                                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold">
                                                Belum Ada Budget Aktif
                                            </Badge>
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Cabang {adminBranchName} belum membuka anggaran berjalan untuk periode ini.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                                    Ikuti alur kerja di bawah untuk memulai
                                </span>
                            </div>

                            <CardContent className="p-6 md:p-8 space-y-6">
                                <div className="max-w-xl mx-auto text-center space-y-1.5">
                                    <h4 className="text-base font-bold text-slate-800">
                                        Alur Kerja Penginputan Rekap Bulanan (RBL)
                                    </h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Sistem mewajibkan <strong>membuka budget terlebih dahulu</strong> sebelum menginput pengeluaran. Hal ini memastikan setiap transaksi operasional dan foto nota memiliki relasi alokasi dana yang sah.
                                    </p>
                                </div>

                                {/* Interactive Stepper Visual */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-1">
                                    <div
                                        onClick={() => {
                                            setBudgetForm(prev => ({
                                                ...prev,
                                                locationId: selectedLocation !== "all" ? selectedLocation : (userLocationId || locations[0]?.id || "")
                                            }))
                                            setIsCreateBudgetOpen(true)
                                        }}
                                        className="relative p-5 rounded-xl border-2 border-blue-500 bg-blue-50/50 text-center space-y-2 shadow-2xs cursor-pointer hover:bg-blue-50 hover:border-blue-600 transition-all group"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs mx-auto shadow-xs group-hover:scale-110 transition-transform">
                                            1
                                        </div>
                                        <div className="font-bold text-xs text-blue-900">1. Buka Budget Periode</div>
                                        <p className="text-[11px] text-slate-600 leading-relaxed">
                                            Tentukan periode bulan & nominal dana operasional yang diterima dari Head Office.
                                        </p>
                                        <div className="text-[10px] font-semibold text-blue-700 bg-blue-100 py-0.5 px-2.5 rounded-full inline-block">
                                            👉 Klik untuk Buka Budget
                                        </div>
                                    </div>

                                    <div className="relative p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-center space-y-2 opacity-75">
                                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs mx-auto">
                                            2
                                        </div>
                                        <div className="font-bold text-xs text-slate-700">2. Input RBL Multi-Baris</div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            Catat transaksi pengeluaran harian (BBM, Konsumsi, ATK, Sparepart) secara berkala.
                                        </p>
                                        <div className="text-[10px] text-slate-400 py-0.5 px-2 rounded-full inline-block">
                                            Terbuka Otomatis
                                        </div>
                                    </div>

                                    <div className="relative p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-center space-y-2 opacity-75">
                                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs mx-auto">
                                            3
                                        </div>
                                        <div className="font-bold text-xs text-slate-700">3. Upload Nota & Tutup Buku</div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            Upload foto bukti nota sekaligus dan tutup buku saat periode berakhir untuk rekonsiliasi.
                                        </p>
                                        <div className="text-[10px] text-slate-400 py-0.5 px-2 rounded-full inline-block">
                                            Tahap Akhir
                                        </div>
                                    </div>
                                </div>

                                {/* Call to action buttons */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                    <Button
                                        size="default"
                                        onClick={() => {
                                            setBudgetForm(prev => ({
                                                ...prev,
                                                locationId: selectedLocation !== "all" ? selectedLocation : (userLocationId || locations[0]?.id || "")
                                            }))
                                            setIsCreateBudgetOpen(true)
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold text-xs shadow-xs px-6 h-9 cursor-pointer"
                                    >
                                        <WalletCards className="h-4 w-4" />
                                        Buka Budget RBL Baru Sekarang
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="default"
                                        onClick={() => setActiveTab("history")}
                                        className="text-xs h-9 text-slate-700 bg-white cursor-pointer"
                                    >
                                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                                        Lihat Riwayat Periode RBL
                                    </Button>
                                </div>
                            </CardContent>
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
                                            return (
                                                <TableRow key={row.id} className="hover:bg-slate-50/70">
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
                                                        {row.isCustomCategory ? (
                                                            <div className="flex items-center gap-1">
                                                                <Input
                                                                    placeholder="Ketik kategori..."
                                                                    value={row.category}
                                                                    onChange={e => handleRowChange(row.id, "category", e.target.value)}
                                                                    className="h-8 text-xs bg-blue-50/50 border-blue-300 font-medium"
                                                                    autoFocus
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        handleRowChange(row.id, "isCustomCategory", false)
                                                                        handleRowChange(row.id, "category", EXPENSE_CATEGORIES[0])
                                                                    }}
                                                                    title="Pilih dari daftar dropdown"
                                                                    className="h-7 w-7 text-slate-400 hover:text-slate-600 shrink-0"
                                                                >
                                                                    <RotateCcw className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Select
                                                                value={row.category}
                                                                onValueChange={v => {
                                                                    if (v === "__OTHER__") {
                                                                        handleRowChange(row.id, "isCustomCategory", true)
                                                                        handleRowChange(row.id, "category", "")
                                                                    } else {
                                                                        handleRowChange(row.id, "category", v)
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {EXPENSE_CATEGORIES.map(cat => (
                                                                        <SelectItem key={cat} value={cat} className="text-xs">
                                                                            {cat}
                                                                        </SelectItem>
                                                                    ))}
                                                                    <SelectItem value="__OTHER__" className="text-xs font-semibold text-blue-600">
                                                                        + Lainnya (Input Manual)
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs text-slate-500">
                            Total <span className="font-bold text-slate-800 font-mono">{activeBudget?.expenses?.length || 0}</span> transaksi pengeluaran tercatat
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border w-fit">
                            <button
                                type="button"
                                onClick={() => setExpenseViewMode("grouped")}
                                className={`px-2.5 py-1 text-xs rounded font-medium transition-all cursor-pointer ${
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
                                className={`px-2.5 py-1 text-xs rounded font-medium transition-all cursor-pointer ${
                                    expenseViewMode === "flat"
                                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                        : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                Tabel Lengkap (1 — {activeBudget?.expenses?.length || 0})
                            </button>
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
                                                    {item.itemDescription}
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
                                                {item.itemDescription}
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
                                    {editingExpense.isCustomCategory || (!EXPENSE_CATEGORIES.includes(editingExpense.category) && editingExpense.category) ? (
                                        <div className="flex items-center gap-1">
                                            <Input
                                                placeholder="Ketik kategori..."
                                                value={editingExpense.category}
                                                onChange={e => setEditingExpense((prev: any) => ({ ...prev, category: e.target.value }))}
                                                className="h-8 text-xs bg-blue-50/50 border-blue-300 font-medium"
                                                autoFocus
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingExpense((prev: any) => ({ ...prev, isCustomCategory: false, category: EXPENSE_CATEGORIES[0] }))}
                                                title="Pilih dari daftar dropdown"
                                                className="h-7 w-7 text-slate-400 hover:text-slate-600 shrink-0"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Select
                                            value={editingExpense.category}
                                            onValueChange={v => {
                                                if (v === "__OTHER__") {
                                                    setEditingExpense((prev: any) => ({ ...prev, isCustomCategory: true, category: "" }))
                                                } else {
                                                    setEditingExpense((prev: any) => ({ ...prev, isCustomCategory: false, category: v }))
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EXPENSE_CATEGORIES.map(cat => (
                                                    <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                                                ))}
                                                <SelectItem value="__OTHER__" className="text-xs font-semibold text-blue-600">
                                                    + Lainnya (Input Manual)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
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
                                                            <TableCell className="font-medium text-slate-900">{exp.itemDescription}</TableCell>
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
