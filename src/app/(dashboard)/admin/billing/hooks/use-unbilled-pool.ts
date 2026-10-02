"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { fmtDate } from "../utils/billing-helpers"

export const UNBILLED_FLAT_PAGE_SIZE = 50
export const UNBILLED_GROUP_PAGE_SIZE = 15

export function useUnbilledPool(unbilled: any[] = []) {
    const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set())
    const [unbilledSearch, setUnbilledSearch] = useState("")
    const [unbilledTypeFilter, setUnbilledTypeFilter] = useState<"ALL" | "READYMIX" | "SEWA">("ALL")
    const [unbilledPpnFilter, setUnbilledPpnFilter] = useState<"all" | "PPN" | "NON_PPN">("all")
    const [filterNoPriceOnly, setFilterNoPriceOnly] = useState(false)
    const [groupBy, setGroupBy] = useState<"flat" | "date" | "mutu" | "customer">("date")
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
    const [unbilledPage, setUnbilledPage] = useState(1)

    const noPriceTxCount = useMemo(() => {
        return unbilled.filter((tx: any) => {
            if (tx.itemType === "SEWA") {
                const val = tx.totalPrice || (tx.pricePerDay * (tx.totalDays || tx.volume_cubic || 0)) || 0
                return val <= 0
            }
            const price = tx.project?.prices?.find((p: any) => 
                p.qualityId === tx.qualityId || 
                (p.concreteQuality?.name && tx.concreteQuality?.name && p.concreteQuality.name.toLowerCase() === tx.concreteQuality.name.toLowerCase())
            )?.price || 0
            return !price || price <= 0
        }).length
    }, [unbilled])

    const unbilledPpnCount = useMemo(() => {
        return unbilled.filter((tx: any) => {
            return tx.itemType === "SEWA"
                ? (tx.is_ppn === true || (tx.ppn_mode && tx.ppn_mode !== "NON_PPN"))
                : Boolean(tx.project?.tax_ppn && tx.project.tax_ppn > 0)
        }).length
    }, [unbilled])

    const unbilledNonPpnCount = useMemo(() => {
        return unbilled.filter((tx: any) => {
            const isPpn = tx.itemType === "SEWA"
                ? (tx.is_ppn === true || (tx.ppn_mode && tx.ppn_mode !== "NON_PPN"))
                : Boolean(tx.project?.tax_ppn && tx.project.tax_ppn > 0)
            return !isPpn
        }).length
    }, [unbilled])

    const filteredUnbilled = useMemo(() => {
        const q = unbilledSearch.toLowerCase().trim()
        return unbilled.filter(tx => {
            if (unbilledTypeFilter === "READYMIX" && tx.itemType === "SEWA") return false
            if (unbilledTypeFilter === "SEWA" && tx.itemType !== "SEWA") return false

            const isPpn = tx.itemType === "SEWA"
                ? (tx.is_ppn === true || (tx.ppn_mode && tx.ppn_mode !== "NON_PPN"))
                : Boolean(tx.project?.tax_ppn && tx.project.tax_ppn > 0)

            if (unbilledPpnFilter === "PPN" && !isPpn) return false
            if (unbilledPpnFilter === "NON_PPN" && isPpn) return false

            if (filterNoPriceOnly) {
                if (tx.itemType === "SEWA") {
                    const val = tx.totalPrice || (tx.pricePerDay * (tx.totalDays || tx.volume_cubic || 0)) || 0
                    if (val > 0) return false
                } else {
                    const price = tx.project?.prices?.find((p: any) => 
                        p.qualityId === tx.qualityId || 
                        (p.concreteQuality?.name && tx.concreteQuality?.name && p.concreteQuality.name.toLowerCase() === tx.concreteQuality.name.toLowerCase())
                    )?.price || 0
                    if (price > 0) return false
                }
            }

            if (!q) return true
            const custName = (tx.customer?.customer_name || tx.project?.customer?.customer_name || "").toLowerCase()
            const projName = (tx.project?.name || tx.lokasi_proyek || "").toLowerCase()
            const mutuName = (tx.concreteQuality?.name || "").toLowerCase()
            const equipName = (tx.equipment?.nama_alat || "").toLowerCase()
            const operName = (tx.operator?.name || "").toLowerCase()
            const doNum = (tx.sewaNumber || "").toLowerCase()
            return custName.includes(q) || projName.includes(q) || mutuName.includes(q) || equipName.includes(q) || operName.includes(q) || doNum.includes(q)
        })
    }, [unbilled, unbilledSearch, unbilledTypeFilter, unbilledPpnFilter, filterNoPriceOnly])

    const groupedUnbilled = useMemo(() => {
        if (groupBy === "flat") return [{ key: "all", label: "Semua", items: filteredUnbilled }]
        if (groupBy === "date") {
            const map = new Map<string, any[]>()
            for (const tx of filteredUnbilled) {
                const key = format(new Date(tx.date), "yyyy-MM-dd")
                if (!map.has(key)) map.set(key, [])
                map.get(key)!.push(tx)
            }
            return Array.from(map.entries()).map(([key, items]) => ({
                key,
                label: fmtDate(key),
                items,
            }))
        }
        if (groupBy === "customer") {
            const map = new Map<string, any[]>()
            for (const tx of filteredUnbilled) {
                const key = tx.customer?.id ?? tx.project?.customer?.id ?? "-"
                if (!map.has(key)) map.set(key, [])
                map.get(key)!.push(tx)
            }
            return Array.from(map.entries()).map(([key, items]) => {
                const first = items[0]
                const label = first?.customer?.customer_name ?? first?.project?.customer?.customer_name ?? "Tanpa Customer"
                return { key, label, items }
            })
        }
        // Group by mutu / alat
        const map = new Map<string, any[]>()
        for (const tx of filteredUnbilled) {
            const key = tx.itemType === "SEWA"
                ? (tx.equipment?.nama_alat || "Sewa Alat")
                : (tx.concreteQuality?.name || "ReadyMix")
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(tx)
        }
        return Array.from(map.entries()).map(([key, items]) => ({ key, label: key, items }))
    }, [filteredUnbilled, groupBy])

    const displayedGroups = useMemo(() => {
        if (groupBy === "flat") {
            const start = (unbilledPage - 1) * UNBILLED_FLAT_PAGE_SIZE
            const pagedItems = filteredUnbilled.slice(start, start + UNBILLED_FLAT_PAGE_SIZE)
            return [{ key: "all", label: "Semua", items: pagedItems }]
        }
        const start = (unbilledPage - 1) * UNBILLED_GROUP_PAGE_SIZE
        return groupedUnbilled.slice(start, start + UNBILLED_GROUP_PAGE_SIZE)
    }, [groupedUnbilled, filteredUnbilled, groupBy, unbilledPage])

    const selectedTxList = filteredUnbilled.filter(tx => selectedTxIds.has(tx.id))
    const selectedVolume = selectedTxList.filter((tx: any) => tx.itemType !== "SEWA").reduce((s: number, tx: any) => s + (tx.volume_cubic || 0), 0)
    const selectedDays = selectedTxList.filter((tx: any) => tx.itemType === "SEWA").reduce((s: number, tx: any) => s + (tx.totalDays || 0), 0)

    const toggleTx = (id: string) => {
        setSelectedTxIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const selectGroup = (items: any[]) => {
        setSelectedTxIds(prev => {
            const next = new Set(prev)
            const allSelected = items.every(tx => next.has(tx.id))
            items.forEach(tx => allSelected ? next.delete(tx.id) : next.add(tx.id))
            return next
        })
    }

    const selectAll = () => {
        if (selectedTxIds.size === filteredUnbilled.length) {
            setSelectedTxIds(new Set())
        } else {
            setSelectedTxIds(new Set(filteredUnbilled.map(tx => tx.id)))
        }
    }

    const isGroupExpanded = (key: string) => {
        if (unbilledSearch.trim().length > 0) return true
        return expandedGroups.has(key)
    }

    const toggleGroupExpand = (key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const allGroupKeys = useMemo(() => groupedUnbilled.map(g => g.key), [groupedUnbilled])
    const isAllExpanded = allGroupKeys.length > 0 && allGroupKeys.every(k => expandedGroups.has(k))
    const toggleExpandAll = () => {
        if (isAllExpanded) {
            setExpandedGroups(new Set())
        } else {
            setExpandedGroups(new Set(allGroupKeys))
        }
    }

    const clearSelectedTx = () => setSelectedTxIds(new Set())

    return {
        selectedTxIds,
        setSelectedTxIds,
        unbilledSearch,
        setUnbilledSearch,
        unbilledTypeFilter,
        setUnbilledTypeFilter,
        unbilledPpnFilter,
        setUnbilledPpnFilter,
        filterNoPriceOnly,
        setFilterNoPriceOnly,
        groupBy,
        setGroupBy,
        unbilledPage,
        setUnbilledPage,
        noPriceTxCount,
        unbilledPpnCount,
        unbilledNonPpnCount,
        filteredUnbilled,
        groupedUnbilled,
        displayedGroups,
        selectedTxList,
        selectedVolume,
        selectedDays,
        toggleTx,
        selectGroup,
        selectAll,
        isGroupExpanded,
        toggleGroupExpand,
        isAllExpanded,
        toggleExpandAll,
        clearSelectedTx,
        UNBILLED_FLAT_PAGE_SIZE,
        UNBILLED_GROUP_PAGE_SIZE,
    }
}
