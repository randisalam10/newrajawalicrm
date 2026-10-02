"use client"

import { useState, useMemo } from "react"
import { SewaTransaction } from "../types"

export function useSewaFilter(transactions: SewaTransaction[]) {
    const todayStr = new Date().toISOString().split("T")[0]
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [filterStatus, setFilterStatus] = useState<string>("ALL")
    const [filterBranch, setFilterBranch] = useState<string>("ALL")
    const [filterStartDate, setFilterStartDate] = useState<string>("")
    const [filterEndDate, setFilterEndDate] = useState<string>("")

    const getDateStr = (val: Date | string | null | undefined): string => {
        if (!val) return ""
        if (val instanceof Date) return val.toISOString().split("T")[0]
        return String(val).split("T")[0]
    }

    const filteredTransactions = useMemo(() => {
        const filtered = transactions.filter(tx => {
            if (filterStatus !== "ALL" && tx.status !== filterStatus) return false
            if (filterBranch !== "ALL" && tx.locationId !== filterBranch) return false
            if (filterStartDate) {
                const txEnd = getDateStr(tx.end_date) || getDateStr(tx.date)
                if (txEnd && txEnd < filterStartDate) return false
            }
            if (filterEndDate) {
                const txStart = getDateStr(tx.start_date) || getDateStr(tx.date)
                if (txStart && txStart > filterEndDate) return false
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const matchNum = tx.sewa_number?.toLowerCase().includes(q)
                const matchCust = tx.customer?.customer_name?.toLowerCase().includes(q)
                const matchEq = tx.equipment?.nama_alat?.toLowerCase().includes(q) || tx.equipment?.kode_alat?.toLowerCase().includes(q)
                const matchOp = tx.operator?.name?.toLowerCase().includes(q)
                const matchLoc = tx.lokasi_proyek?.toLowerCase().includes(q)
                if (!matchNum && !matchCust && !matchEq && !matchOp && !matchLoc) return false
            }
            return true
        })

        // Urutkan DESC berdasarkan tanggal sewa (start_date, fallback date)
        return [...filtered].sort((a, b) => {
            const timeA = new Date(a.start_date || a.date).getTime()
            const timeB = new Date(b.start_date || b.date).getTime()
            if (timeB !== timeA) return timeB - timeA
            const createA = new Date(a.createdAt || a.date).getTime()
            const createB = new Date(b.createdAt || b.date).getTime()
            return createB - createA
        })
    }, [transactions, filterStatus, filterBranch, filterStartDate, filterEndDate, searchQuery])

    const handleResetFilters = () => {
        setSearchQuery("")
        setFilterStatus("ALL")
        setFilterBranch("ALL")
        setFilterStartDate("")
        setFilterEndDate("")
    }

    const setDatePresetToday = () => {
        setFilterStartDate(todayStr)
        setFilterEndDate(todayStr)
    }

    const setDatePresetThisMonth = () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
        setFilterStartDate(start)
        setFilterEndDate(end)
    }

    const hasActiveFilters = Boolean(
        searchQuery ||
        filterStatus !== "ALL" ||
        filterBranch !== "ALL" ||
        filterStartDate ||
        filterEndDate
    )

    return {
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        filterBranch,
        setFilterBranch,
        filterStartDate,
        setFilterStartDate,
        filterEndDate,
        setFilterEndDate,
        filteredTransactions,
        handleResetFilters,
        setDatePresetToday,
        setDatePresetThisMonth,
        hasActiveFilters,
        todayStr,
    }
}
