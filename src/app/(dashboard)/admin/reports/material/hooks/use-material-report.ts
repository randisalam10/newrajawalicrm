"use client"

import { useState, useEffect, useTransition } from "react"
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns"
import { toast } from "sonner"
import { getMaterialReportData, syncHistoricalAggregatePrices } from "../actions"
import {
    DriverRetaseItem,
    IncomingMaterialItem,
    MaterialLocation,
    MaterialReportKPIs,
    MaterialSummaryItem,
    OutgoingMaterialItem,
    SourceSummaryItem,
} from "../types"

interface UseMaterialReportProps {
    locations: MaterialLocation[]
    userRole: string
    userLocationId?: string | null
}

export function useMaterialReport({
    locations = [],
    userRole,
    userLocationId = null,
}: UseMaterialReportProps) {
    const isSuperAdmin = userRole === "SuperAdminBP" || ["CEO", "FVP"].includes(userRole)
    const canManagePrices = isSuperAdmin || ["AdminLogistik", "Admin"].includes(userRole)
    const [isPending, startTransition] = useTransition()

    // Sync Modal State
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
    const [syncMode, setSyncMode] = useState<"missing_only" | "force_all">("missing_only")
    const [isSyncing, setIsSyncing] = useState(false)

    // Date Range Presets
    const now = new Date()
    const currentMonthStart = format(startOfMonth(now), "yyyy-MM-dd")
    const currentMonthEnd = format(endOfMonth(now), "yyyy-MM-dd")

    const [datePreset, setDatePreset] = useState<string>("this_month")
    const [startDate, setStartDate] = useState<string>(currentMonthStart)
    const [endDate, setEndDate] = useState<string>(currentMonthEnd)

    // Filters
    const [selectedLocation, setSelectedLocation] = useState<string>(
        isSuperAdmin ? "all" : (userLocationId || "all")
    )
    const [selectedMaterialType, setSelectedMaterialType] = useState<string>("all")
    const [selectedSourceType, setSelectedSourceType] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState<string>("")

    // Active View Tab
    const [activeTab, setActiveTab] = useState<"summary" | "incoming" | "outgoing" | "retase">("summary")

    // Client hydration safety
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    // Report Data State
    const [reportData, setReportData] = useState<any>(null)

    // Handle Preset Change
    const handlePresetChange = (preset: string) => {
        setDatePreset(preset)
        const today = new Date()
        if (preset === "today") {
            const t = format(today, "yyyy-MM-dd")
            setStartDate(t)
            setEndDate(t)
        } else if (preset === "last_7") {
            setStartDate(format(subDays(today, 6), "yyyy-MM-dd"))
            setEndDate(format(today, "yyyy-MM-dd"))
        } else if (preset === "this_month") {
            setStartDate(format(startOfMonth(today), "yyyy-MM-dd"))
            setEndDate(format(endOfMonth(today), "yyyy-MM-dd"))
        } else if (preset === "last_month") {
            const prev = subMonths(today, 1)
            setStartDate(format(startOfMonth(prev), "yyyy-MM-dd"))
            setEndDate(format(endOfMonth(prev), "yyyy-MM-dd"))
        } else if (preset === "this_year") {
            setStartDate(format(startOfYear(today), "yyyy-MM-dd"))
            setEndDate(format(endOfYear(today), "yyyy-MM-dd"))
        }
    }

    // Load Data from Server Action
    const loadReportData = () => {
        startTransition(async () => {
            const res = await getMaterialReportData({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                locationId: selectedLocation,
                aggregateType: selectedMaterialType,
                sourceType: selectedSourceType,
                search: searchQuery,
            })

            if (res.success) {
                setReportData(res)
            } else {
                toast.error(res.error || "Gagal memuat data laporan material.")
            }
        })
    }

    useEffect(() => {
        loadReportData()
    }, [startDate, endDate, selectedLocation, selectedMaterialType, selectedSourceType])

    // Reset Filters
    const handleResetFilters = () => {
        handlePresetChange("this_month")
        setSelectedLocation(isSuperAdmin ? "all" : (userLocationId || "all"))
        setSelectedMaterialType("all")
        setSelectedSourceType("all")
        setSearchQuery("")
    }

    // Run Price Sync / Correction Action
    const handleSyncPrices = async () => {
        setIsSyncing(true)
        try {
            const res = await syncHistoricalAggregatePrices({
                mode: syncMode,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                locationId: selectedLocation !== "all" ? selectedLocation : undefined,
            })
            if (res.success) {
                toast.success(res.message || "Koreksi harga material berhasil disimpan!")
                setIsSyncModalOpen(false)
                loadReportData()
            } else {
                toast.error(res.error || "Gagal melakukan sinkronisasi harga.")
            }
        } catch (err: any) {
            toast.error(err.message || "Terjadi kesalahan sistem saat sinkronisasi.")
        } finally {
            setIsSyncing(false)
        }
    }

    const kpis: MaterialReportKPIs = reportData?.kpis || {
        totalIncomingVolume: 0,
        totalIncomingMaterialCost: 0,
        totalIncomingRetaseCost: 0,
        grandTotalLandedCost: 0,
        avgLandedCostPerM3: 0,
        avgMaterialUnitPrice: 0,
        totalOutgoingVolume: 0,
        totalOutgoingValue: 0,
        netCost: 0,
        incomingCount: 0,
        outgoingCount: 0,
    }

    const byMaterial: MaterialSummaryItem[] = reportData?.byMaterial || []
    const bySource: SourceSummaryItem[] = reportData?.bySource || []
    const byDriver: DriverRetaseItem[] = reportData?.byDriver || []
    const incomingList: IncomingMaterialItem[] = reportData?.incomingList || []
    const outgoingList: OutgoingMaterialItem[] = reportData?.outgoingList || []

    return {
        isSuperAdmin,
        canManagePrices,
        isPending,
        mounted,
        isSyncModalOpen,
        setIsSyncModalOpen,
        syncMode,
        setSyncMode,
        isSyncing,
        handleSyncPrices,
        datePreset,
        setDatePreset,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        handlePresetChange,
        selectedLocation,
        setSelectedLocation,
        selectedMaterialType,
        setSelectedMaterialType,
        selectedSourceType,
        setSelectedSourceType,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        loadReportData,
        handleResetFilters,
        kpis,
        byMaterial,
        bySource,
        byDriver,
        incomingList,
        outgoingList,
    }
}
