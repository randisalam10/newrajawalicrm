"use client"

import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import {
    createBudget,
    updateBudget,
    closeBudget,
    updateExpense,
    deleteExpense,
    getActiveBudget,
    getBudgetHistory,
    getBudgetDetail,
} from "../actions"
import { RblClientProps, BudgetUpdatePayload } from "../types"
import { fmt, MONTH_NAMES } from "../utils/rbl-helpers"
import { useRblCategories } from "./use-rbl-categories"
import { useBatchExpenses } from "./use-batch-expenses"
import { useBulkReceipts } from "./use-bulk-receipts"

export function useRbl({
    initialActiveBudget,
    initialHistory,
    locations,
    initialCategories = [],
    vehicles = [],
    userLocationId,
    isSuperAdmin,
    canEdit = true,
}: RblClientProps) {
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

    // Filter vehicles: Head Office can select ALL vehicles; branches only see their own branch vehicles
    const branchVehicles = useMemo(() => {
        if (!vehicles || vehicles.length === 0) return []
        if (isHeadOfficeBudget || !activeBudget?.locationId) {
            return vehicles
        }
        return vehicles.filter((v: any) => v.locationId === activeBudget.locationId)
    }, [vehicles, activeBudget, isHeadOfficeBudget])

    // Dialog & UI States
    const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false)
    const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false)
    const [editingBudget, setEditingBudget] = useState<any>(null)
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

    // Budget Date Range Constraints
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

        const isCurrentMonth = now.getFullYear() === y && (now.getMonth() + 1) === m
        const defaultDate = isCurrentMonth ? format(now, "yyyy-MM-dd") : `${y}-${monthStr}-01`

        return {
            min: `${y}-${monthStr}-01`,
            max: `${y}-${monthStr}-${String(lastDay).padStart(2, "0")}`,
            defaultDate,
            label: `${MONTH_NAMES[m - 1]} ${y}`
        }
    }, [activeBudget])

    // Reload active budget & history
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

    // Group expenses by Date
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

    // Flat sorted list of all expenses
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

    // Categories hook
    const categoriesHook = useRblCategories({
        initialCategories,
        onCategoryCreatedForRow: (rowId, category) => {
            batchExpensesHook.handleCategorySelect(rowId, category)
        },
    })

    // Batch expenses hook
    const batchExpensesHook = useBatchExpenses({
        activeBudget,
        categories: categoriesHook.categories,
        vehicles,
        budgetDateRange,
        selectedLocation,
        reloadData,
    })

    // Bulk receipts hook
    const bulkReceiptsHook = useBulkReceipts({
        activeBudget,
        selectedLocation,
        reloadData,
    })

    // Budget Create & Close Handlers
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

    const handleOpenEditBudget = (target?: any) => {
        const b = target || activeBudget
        if (!b) return
        if (b.status === "CLOSED") {
            toast.error("Budget yang sudah ditutup (CLOSED) tidak dapat diedit.")
            return
        }
        setEditingBudget(b)
        setIsEditBudgetOpen(true)
    }

    const handleUpdateBudgetSubmit = async (budgetId: string, payload: BudgetUpdatePayload) => {
        startTransition(async () => {
            const res = await updateBudget(budgetId, payload)
            if (res.success) {
                toast.success("Budget RBL berhasil diperbarui!")
                setIsEditBudgetOpen(false)
                setEditingBudget(null)
                reloadData(selectedLocation)
                if (isDetailOpen && selectedDetailBudget?.id === budgetId) {
                    const updatedDetail = await getBudgetDetail(budgetId)
                    setSelectedDetailBudget(updatedDetail)
                }
            } else {
                toast.error(res.error || "Gagal memperbarui budget.")
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

    const adminBranchName = useMemo(() => {
        const found = locations.find(l => l.id === userLocationId)
        return found?.name || "Cabang Anda"
    }, [locations, userLocationId])

    return {
        isPending,
        activeBudget,
        selectedLocation,
        setSelectedLocation,
        reloadData,
        isHeadOfficeBudget,
        branchVehicles,
        adminBranchName,
        budgetDateRange,
        utilizationRate,
        balanceStatus,
        expensesByDate,
        sortedAllExpenses,
        filteredHistory,
        history,
        historyAvailableYears,
        activeTab,
        setActiveTab,
        // Dialog states
        isCreateBudgetOpen,
        setIsCreateBudgetOpen,
        isEditBudgetOpen,
        setIsEditBudgetOpen,
        editingBudget,
        setEditingBudget,
        isCloseBudgetOpen,
        setIsCloseBudgetOpen,
        isEditExpenseOpen,
        setIsEditExpenseOpen,
        editingExpense,
        setEditingExpense,
        previewImage,
        setPreviewImage,
        expenseViewMode,
        setExpenseViewMode,
        historySearch,
        setHistorySearch,
        historyStatusFilter,
        setHistoryStatusFilter,
        historyYearFilter,
        setHistoryYearFilter,
        isDetailOpen,
        setIsDetailOpen,
        isLoadingDetail,
        selectedDetailBudget,
        // Budget forms
        budgetForm,
        setBudgetForm,
        closeNotes,
        setCloseNotes,
        closeDate,
        setCloseDate,
        // Handlers
        handleOpenDetail,
        handleOpenEditBudget,
        handleUpdateBudgetSubmit,
        handleCreateBudgetSubmit,
        handleCloseBudgetSubmit,
        handleDeleteExpense,
        handleEditExpenseSubmit,
        // Sub-hooks
        categoriesHook,
        batchExpensesHook,
        bulkReceiptsHook,
    }
}
