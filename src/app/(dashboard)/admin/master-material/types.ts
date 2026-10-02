export interface MaterialLocation {
    id: string
    name: string
}

export interface MaterialBranchOverride {
    locationId: string
    locationName?: string
    price: number
    effectiveDate: Date | string
}

export interface MasterMaterialItem {
    id: string
    code: string
    name: string
    category: string
    unit: string
    defaultDensity?: number | null
    description?: string | null
    currentPrice?: number
    currentEffectiveDate?: Date | string | null
    currentHistoryId?: string
    currentLocationId?: string
    currentNotes?: string
    globalPrice?: number
    nextPrice?: number | null
    nextEffectiveDate?: Date | string | null
    historyCount?: number
    branchOverrides?: MaterialBranchOverride[]
    histories?: MaterialPriceHistoryItem[]
    displayPrice?: number
    displayEffectiveDate?: Date | string | null
    displayLocationName?: string
    isBranchOverride?: boolean
}

export interface MaterialPriceHistoryItem {
    id: string
    materialId: string
    material_name: string
    material_code: string
    price_per_m3: number
    old_price?: number | null
    price_diff: number
    percentage: number
    effective_date: Date | string
    locationId?: string | null
    locationName?: string
    notes?: string | null
    createdByName?: string
    createdAt?: Date | string
}
