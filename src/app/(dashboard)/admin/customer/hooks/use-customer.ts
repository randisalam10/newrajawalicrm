"use client"

import { useState, useMemo, useEffect } from "react"
import {
    CustomerWithProjects,
    CustomerProject,
    CustomerFilters,
    CustomerStats,
    DialogMode,
    SortKey,
    SortDir,
    ProjectFilterStatus,
} from "../types"

interface UseCustomerProps {
    initialData: CustomerWithProjects[]
}

const PAGE_SIZE = 10

export function useCustomer({ initialData }: UseCustomerProps) {
    // Dialog & selection state
    const [dialogMode, setDialogMode] = useState<DialogMode>(null)
    const [editData, setEditData] = useState<any>(null)
    const [parentCustomer, setParentCustomer] = useState<CustomerWithProjects | null>(null)
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
    const [expandedProject, setExpandedProject] = useState<string | null>(null)

    // Shared locations state
    const [selectedSharedLocs, setSelectedSharedLocs] = useState<string[]>([])

    // Price inline form state
    const [priceForm, setPriceForm] = useState<{
        qualityId: string
        price: string
        ppnMode: string
        ppnRate: string
    }>({
        qualityId: "",
        price: "",
        ppnMode: "NON_PPN",
        ppnRate: "11",
    })
    const [priceLoading, setPriceLoading] = useState(false)

    // Filters
    const [search, setSearch] = useState("")
    const [locationId, setLocationId] = useState("ALL")
    const [projectStatus, setProjectStatus] = useState<ProjectFilterStatus>("ALL")
    const [sortKey, setSortKey] = useState<SortKey>("customer_name")
    const [sortDir, setSortDir] = useState<SortDir>("asc")
    const [currentPage, setCurrentPage] = useState(1)

    // Sync selected shared locations on dialog open
    useEffect(() => {
        if (dialogMode) {
            setSelectedSharedLocs(editData?.sharedLocations?.map((l: any) => l.id) || [])
        }
    }, [dialogMode, editData])

    function toggleSharedLoc(id: string) {
        setSelectedSharedLocs(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    // ── Global Stats calculation ──
    const stats: CustomerStats = useMemo(() => {
        let totalProjects = 0
        let customersWithProjects = 0
        let customersWithoutProjects = 0
        let projectsWithPrices = 0
        let projectsWithoutPrices = 0

        for (const c of initialData) {
            const pCount = c.projects?.length || 0
            totalProjects += pCount
            if (pCount > 0) {
                customersWithProjects++
                for (const p of c.projects) {
                    if (p.prices && p.prices.length > 0) {
                        projectsWithPrices++
                    } else {
                        projectsWithoutPrices++
                    }
                }
            } else {
                customersWithoutProjects++
            }
        }

        return {
            totalCustomers: initialData.length,
            totalProjects,
            customersWithProjects,
            customersWithoutProjects,
            projectsWithPrices,
            projectsWithoutPrices,
        }
    }, [initialData])

    // ── Filtered data ──
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return initialData.filter((c) => {
            // 1. Search filter
            if (q) {
                const matchName = c.customer_name?.toLowerCase().includes(q)
                const matchAddress = c.address?.toLowerCase().includes(q)
                const matchLocation = c.location?.name?.toLowerCase().includes(q)
                const matchProjects = c.projects?.some((p) =>
                    p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)
                )
                if (!matchName && !matchAddress && !matchLocation && !matchProjects) return false
            }

            // 2. Location filter
            if (locationId !== "ALL") {
                const isOwner = c.locationId === locationId
                const isShared = c.sharedLocations?.some((sl) => sl.id === locationId)
                if (!isOwner && !isShared) return false
            }

            // 3. Project status filter
            const pCount = c.projects?.length || 0
            if (projectStatus === "WITH_PROJECTS" && pCount === 0) return false
            if (projectStatus === "WITHOUT_PROJECTS" && pCount > 0) return false
            if (projectStatus === "NEEDS_PRICING") {
                const hasUnpriced = c.projects?.some((p) => !p.prices || p.prices.length === 0)
                if (!hasUnpriced) return false
            }

            return true
        })
    }, [initialData, search, locationId, projectStatus])

    // ── Sorted data ──
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let av: any = ""
            let bv: any = ""
            if (sortKey === "customer_name") {
                av = a.customer_name ?? ""
                bv = b.customer_name ?? ""
                const cmp = av.localeCompare(bv)
                return sortDir === "asc" ? cmp : -cmp
            }
            if (sortKey === "address") {
                av = a.address ?? ""
                bv = b.address ?? ""
                const cmp = av.localeCompare(bv)
                return sortDir === "asc" ? cmp : -cmp
            }
            if (sortKey === "location") {
                av = a.location?.name ?? ""
                bv = b.location?.name ?? ""
                const cmp = av.localeCompare(bv)
                return sortDir === "asc" ? cmp : -cmp
            }
            if (sortKey === "project_count") {
                av = a.projects?.length || 0
                bv = b.projects?.length || 0
                return sortDir === "asc" ? av - bv : bv - av
            }
            return 0
        })
    }, [filtered, sortKey, sortDir])

    // ── Pagination ──
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return sorted.slice(start, start + PAGE_SIZE)
    }, [sorted, currentPage])

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        } else {
            setSortKey(key)
            setSortDir("asc")
        }
        setCurrentPage(1)
    }

    function resetFilters() {
        setSearch("")
        setLocationId("ALL")
        setProjectStatus("ALL")
        setCurrentPage(1)
    }

    const hasActiveFilters = search.trim() !== "" || locationId !== "ALL" || projectStatus !== "ALL"

    return {
        // Data & pagination
        filteredCount: sorted.length,
        totalCustomers: initialData.length,
        paginated,
        currentPage,
        totalPages,
        setCurrentPage,
        // Sort & filter
        search,
        setSearch: (val: string) => { setSearch(val); setCurrentPage(1) },
        locationId,
        setLocationId: (val: string) => { setLocationId(val); setCurrentPage(1) },
        projectStatus,
        setProjectStatus: (val: ProjectFilterStatus) => { setProjectStatus(val); setCurrentPage(1) },
        sortKey,
        sortDir,
        handleSort,
        resetFilters,
        hasActiveFilters,
        // Stats
        stats,
        // Expand
        expandedCustomer,
        setExpandedCustomer,
        expandedProject,
        setExpandedProject,
        // Dialogs
        dialogMode,
        setDialogMode,
        editData,
        setEditData,
        parentCustomer,
        setParentCustomer,
        // Shared locations
        selectedSharedLocs,
        setSelectedSharedLocs,
        toggleSharedLoc,
        // Inline pricing form
        priceForm,
        setPriceForm,
        priceLoading,
        setPriceLoading,
    }
}
