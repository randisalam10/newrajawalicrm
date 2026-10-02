"use client"

import { useState, useMemo, useCallback } from "react"
import { CreditFilterState } from "../types"

export function useKreditFilters() {
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    const firstOfYear = `${now.getFullYear()}-01-01`

    const [filters, setFilters] = useState<CreditFilterState>({
        datePreset: "ALL",
        startDate: "",
        endDate: "",
        status: "ALL",
        companyGroupId: "ALL",
        supplierId: "ALL",
        locationId: "ALL",
        search: "",
        sortBy: "date_desc",
    })

    const setDatePreset = useCallback((preset: CreditFilterState["datePreset"]) => {
        if (preset === "TODAY") {
            setFilters(prev => ({ ...prev, datePreset: preset, startDate: today, endDate: today }))
        } else if (preset === "THIS_MONTH") {
            setFilters(prev => ({ ...prev, datePreset: preset, startDate: firstOfMonth, endDate: today }))
        } else if (preset === "THIS_YEAR") {
            setFilters(prev => ({ ...prev, datePreset: preset, startDate: firstOfYear, endDate: today }))
        } else if (preset === "ALL") {
            setFilters(prev => ({ ...prev, datePreset: preset, startDate: "", endDate: "" }))
        } else {
            setFilters(prev => ({ ...prev, datePreset: preset }))
        }
    }, [today, firstOfMonth, firstOfYear])

    const resetFilters = useCallback(() => {
        setFilters({
            datePreset: "ALL",
            startDate: "",
            endDate: "",
            status: "ALL",
            companyGroupId: "ALL",
            supplierId: "ALL",
            locationId: "ALL",
            search: "",
            sortBy: "date_desc",
        })
    }, [])

    const isFiltered = useMemo(() => {
        return Boolean(
            filters.startDate ||
            filters.endDate ||
            filters.status !== "ALL" ||
            filters.companyGroupId !== "ALL" ||
            filters.supplierId !== "ALL" ||
            filters.locationId !== "ALL" ||
            filters.search.trim()
        )
    }, [filters])

    return {
        filters,
        setFilters,
        setDatePreset,
        resetFilters,
        isFiltered,
    }
}
