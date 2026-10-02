"use client"

import { useState, useTransition, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { updatePlan, deletePlan } from "../actions"
import { Plan, PlanStatus, ViewMode } from "../types"
import { STATUS_CONFIG } from "../constants"

interface UsePlanningProps {
    initialPlans: Plan[]
}

export function usePlanning({ initialPlans }: UsePlanningProps) {
    const { toast } = useToast()
    const [plans] = useState<Plan[]>(initialPlans)
    const [, startTransition] = useTransition()

    // View mode
    const [viewMode, setViewMode] = useState<ViewMode>("calendar")

    // Dialogs
    const [showForm, setShowForm] = useState(false)
    const [editTarget, setEditTarget] = useState<Plan | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [defaultFormDate, setDefaultFormDate] = useState<string>("")

    // List filters
    const [filterStatus, setFilterStatus] = useState<PlanStatus | "All">("All")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")
    const [searchText, setSearchText] = useState("")

    // Filtered plans (for list view)
    const filtered = useMemo(() => {
        return plans.filter((p) => {
            if (filterStatus !== "All" && p.status !== filterStatus) return false
            if (filterDateFrom && new Date(p.date) < new Date(filterDateFrom)) return false
            if (filterDateTo && new Date(p.date) > new Date(filterDateTo + "T23:59:59")) return false
            if (searchText) {
                const q = searchText.toLowerCase()
                if (
                    !p.project.name.toLowerCase().includes(q) &&
                    !p.project.customer.customer_name.toLowerCase().includes(q) &&
                    !p.concreteQuality.name.toLowerCase().includes(q) &&
                    !p.workItem.name.toLowerCase().includes(q)
                ) return false
            }
            return true
        })
    }, [plans, filterStatus, filterDateFrom, filterDateTo, searchText])

    const grouped = useMemo(() => {
        const map = new Map<string, Plan[]>()
        for (const p of filtered) {
            const key = format(new Date(p.date), "yyyy-MM-dd")
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(p)
        }
        return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
    }, [filtered])

    function openEdit(plan: Plan) {
        setEditTarget(plan)
        setDefaultFormDate("")
        setShowForm(true)
    }

    function closeForm() {
        setShowForm(false)
        setEditTarget(null)
        setDefaultFormDate("")
    }

    function handleAddForDay(dateStr: string) {
        setEditTarget(null)
        setDefaultFormDate(dateStr)
        setShowForm(true)
    }

    function handleOpenCreateNew() {
        setEditTarget(null)
        setDefaultFormDate("")
        setShowForm(true)
    }

    function handleStatusChange(id: string, status: PlanStatus) {
        startTransition(async () => {
            try {
                await updatePlan(id, { status })
                toast({ title: `Status → ${STATUS_CONFIG[status].label}` })
            } catch {
                toast({ title: "Gagal memperbarui status", variant: "destructive" })
            }
        })
    }

    async function handleDelete() {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            await deletePlan(deleteTarget.id)
            toast({ title: "Planning berhasil dihapus" })
        } catch {
            toast({ title: "Gagal menghapus planning", variant: "destructive" })
        } finally {
            setIsDeleting(false)
            setDeleteTarget(null)
        }
    }

    function handleResetFilters() {
        setFilterStatus("All")
        setFilterDateFrom("")
        setFilterDateTo("")
        setSearchText("")
    }

    return {
        plans,
        viewMode,
        setViewMode,
        showForm,
        setShowForm,
        editTarget,
        deleteTarget,
        setDeleteTarget,
        isDeleting,
        defaultFormDate,
        filterStatus,
        setFilterStatus,
        filterDateFrom,
        setFilterDateFrom,
        filterDateTo,
        setFilterDateTo,
        searchText,
        setSearchText,
        filtered,
        grouped,
        openEdit,
        closeForm,
        handleAddForDay,
        handleOpenCreateNew,
        handleStatusChange,
        handleDelete,
        handleResetFilters,
    }
}
