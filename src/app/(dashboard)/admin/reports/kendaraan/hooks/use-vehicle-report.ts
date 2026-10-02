"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { subMonths } from "date-fns"
import { toast } from "sonner"
import { getVehicleReportData } from "../../../rbl/actions"
import { VehicleAnalyticsItem, VehicleCategory, VehicleItem, VehicleLocation } from "../types"

interface UseVehicleReportProps {
    initialVehicles: VehicleItem[]
    categories?: VehicleCategory[]
    locations: VehicleLocation[]
    userLocationId?: string
    isSuperAdmin?: boolean
}

export function useVehicleReport({
    initialVehicles = [],
    categories = [],
    locations = [],
    userLocationId = "",
    isSuperAdmin = false,
}: UseVehicleReportProps) {
    const [isPending, startTransition] = useTransition()
    const [mounted, setMounted] = useState(false)

    // Filters
    const defaultLocation = isSuperAdmin ? "all" : (userLocationId || "all")
    const [selectedLocation, setSelectedLocation] = useState<string>(defaultLocation)
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    // Date range: Default to current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
    const [startDate, setStartDate] = useState(firstDay)
    const [endDate, setEndDate] = useState(lastDay)

    // Data from server action
    const [reportData, setReportData] = useState<any>(null)
    const [activeDetailTab, setActiveDetailTab] = useState<string>("expenses")

    const loadData = () => {
        startTransition(async () => {
            const res = await getVehicleReportData({
                locationId: selectedLocation,
                vehicleId: selectedVehicleId,
                categoryId: selectedCategoryId,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            })

            if (res.success) {
                setReportData(res)
            } else {
                toast.error(res.error || "Gagal memuat data laporan kendaraan.")
            }
        })
    }

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        loadData()
    }, [selectedLocation, selectedCategoryId, selectedVehicleId, startDate, endDate])

    const activeLocationName = useMemo(() => {
        if (selectedLocation === "all") return "Semua Cabang"
        const found = locations.find(l => l.id === selectedLocation)
        return found?.name || "Cabang"
    }, [selectedLocation, locations])

    const vehicleAnalytics: VehicleAnalyticsItem[] = reportData?.vehicleAnalytics || []
    const overall = reportData?.overallSummary || {}

    // Available vehicles for selector filtered by location & category
    const availableVehicles = useMemo(() => {
        return initialVehicles.filter(v => {
            const matchLoc = selectedLocation === "all" || v.locationId === selectedLocation
            const matchCat =
                selectedCategoryId === "all" ||
                v.categoryId === selectedCategoryId ||
                (v.category?.name && v.category.name.toLowerCase() === selectedCategoryId.toLowerCase())
            return matchLoc && matchCat
        })
    }, [initialVehicles, selectedLocation, selectedCategoryId])

    // Filter analytics by search
    const filteredAnalytics = useMemo(() => {
        if (!searchQuery.trim()) return vehicleAnalytics
        const q = searchQuery.toLowerCase()
        return vehicleAnalytics.filter((va: VehicleAnalyticsItem) => {
            const v = va.vehicle
            const catName = (v.category?.name || v.vehicle_type || "").toLowerCase()
            return (
                v.code.toLowerCase().includes(q) ||
                v.plate_number.toLowerCase().includes(q) ||
                catName.includes(q) ||
                (v.location?.name || "").toLowerCase().includes(q)
            )
        })
    }, [vehicleAnalytics, searchQuery])

    // Selected single vehicle analytics (if specific vehicle is selected)
    const singleVehicleData = useMemo(() => {
        if (selectedVehicleId === "all") return null
        return vehicleAnalytics.find((va: VehicleAnalyticsItem) => va.vehicle.id === selectedVehicleId) || null
    }, [selectedVehicleId, vehicleAnalytics])

    // Check if any filter has been customized
    const isFiltered =
        selectedLocation !== defaultLocation ||
        selectedCategoryId !== "all" ||
        selectedVehicleId !== "all" ||
        searchQuery.trim() !== "" ||
        startDate !== firstDay ||
        endDate !== lastDay

    const handleResetFilters = () => {
        setSelectedLocation(defaultLocation)
        setSelectedCategoryId("all")
        setSelectedVehicleId("all")
        setSearchQuery("")
        setStartDate(firstDay)
        setEndDate(lastDay)
    }

    const setDatePresetThisMonth = () => {
        const d = new Date()
        setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0])
        setEndDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0])
    }

    const setDatePresetLastMonth = () => {
        const prev = subMonths(new Date(), 1)
        setStartDate(new Date(prev.getFullYear(), prev.getMonth(), 1).toISOString().split("T")[0])
        setEndDate(new Date(prev.getFullYear(), prev.getMonth() + 1, 0).toISOString().split("T")[0])
    }

    const setDatePresetThisYear = () => {
        const d = new Date()
        setStartDate(`${d.getFullYear()}-01-01`)
        setEndDate(`${d.getFullYear()}-12-31`)
    }

    return {
        mounted,
        isPending,
        selectedLocation,
        setSelectedLocation,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedVehicleId,
        setSelectedVehicleId,
        searchQuery,
        setSearchQuery,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        reportData,
        vehicleAnalytics,
        overall,
        activeLocationName,
        availableVehicles,
        filteredAnalytics,
        singleVehicleData,
        isFiltered,
        handleResetFilters,
        setDatePresetThisMonth,
        setDatePresetLastMonth,
        setDatePresetThisYear,
        activeDetailTab,
        setActiveDetailTab,
        loadData,
    }
}
