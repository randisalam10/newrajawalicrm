"use client"

import { useState, useMemo } from "react"
import { MasterMaterialItem, MaterialLocation, MaterialPriceHistoryItem } from "../types"

export function useMasterMaterialFilter(
    materials: MasterMaterialItem[],
    histories: MaterialPriceHistoryItem[],
    locations: MaterialLocation[],
    initialLocation: string = "all"
) {
    const [selectedLocation, setSelectedLocation] = useState<string>(initialLocation)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<"active" | "history" | "simulator">("active")

    // Filtered materials: dynamically adapts to selectedLocation
    const filteredMaterials = useMemo(() => {
        return materials.filter(m => {
            const matchesSearch = !searchQuery ||
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.category.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesSearch
        }).map(m => {
            if (selectedLocation !== "all") {
                const override = m.branchOverrides?.find((b: any) => b.locationId === selectedLocation)
                const locObj = locations.find(l => l.id === selectedLocation)
                if (override) {
                    return {
                        ...m,
                        displayPrice: override.price,
                        displayEffectiveDate: override.effectiveDate,
                        displayLocationName: override.locationName || locObj?.name || "Cabang",
                        isBranchOverride: true,
                    }
                } else {
                    return {
                        ...m,
                        displayPrice: m.globalPrice ?? m.currentPrice,
                        displayEffectiveDate: m.currentEffectiveDate,
                        displayLocationName: `${locObj?.name || "Cabang"} (Mengikuti Global)`,
                        isBranchOverride: false,
                    }
                }
            } else {
                return {
                    ...m,
                    displayPrice: m.globalPrice ?? m.currentPrice,
                    displayEffectiveDate: m.currentEffectiveDate,
                    displayLocationName: "Semua Cabang (Global)",
                    isBranchOverride: false,
                }
            }
        })
    }, [materials, searchQuery, selectedLocation, locations])

    // Filtered histories
    const filteredHistories = useMemo(() => {
        return histories.filter(h => {
            const matchesLoc = selectedLocation === "all" || h.locationId === selectedLocation || !h.locationId
            const matchesSearch = !searchQuery ||
                h.material_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                h.material_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (h.notes && h.notes.toLowerCase().includes(searchQuery.toLowerCase()))
            return matchesLoc && matchesSearch
        })
    }, [histories, selectedLocation, searchQuery])

    return {
        selectedLocation,
        setSelectedLocation,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredMaterials,
        filteredHistories,
    }
}
