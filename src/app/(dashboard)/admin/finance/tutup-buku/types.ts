export interface MonthlyClosingRecord {
    id: string
    closingKey: string
    period: string // e.g. "2026-09"
    year: number
    month: number
    locationId: string | null
    locationName: string
    status: "OPEN" | "CLOSED"
    closedAt: string
    closedById: string
    closedByName: string
    
    // Ringkasan Finansial
    totalVolume: number
    totalRevenue: number
    totalCogs: number
    totalGrossProfit: number
    totalOverhead: number
    totalNetProfit: number

    // Rincian Biaya Pokok Langsung
    semenCost: number
    pasirCost: number
    split12Cost: number
    split23Cost: number
    solarCost: number
    retaseCost: number
    maintenanceCost: number

    // Catatan & Snapshot
    notes?: string | null
    snapshotData?: any
    
    // Reopen Audit Info
    reopenedAt?: string | null
    reopenedByName?: string | null
    reopenReason?: string | null
}

export interface PeriodSummaryStats {
    totalClosedPeriods: number
    latestClosedPeriod: string | null
    totalClosedRevenue: number
    totalClosedNetProfit: number
    totalClosedVolume: number
}

export interface PeriodFilterState {
    year: number
    locationId: string
    search: string
}

export interface ClosingStatusMapItem {
    id: string
    closingKey: string
    period: string
    locationId: string | null
    status: "OPEN" | "CLOSED"
    closedAt?: string
    closedByName?: string
}

export type ClosingStatusMap = Record<string, ClosingStatusMapItem>

export interface ClosePeriodPayload {
    period: string
    locationId?: string | null
    notes?: string
    closeAllBranches?: boolean
}

export interface PeriodOptionItem {
    period: string // "2026-09"
    label: string // "September 2026"
    status: "OPEN" | "CLOSED"
    hasTransactions: boolean
}

export interface ClosePeriodPreview {
    period: string
    periodLabel: string
    locationId: string | null
    locationName: string
    volumeTotal: number
    dppRevenue: number
    totalCogs: number
    grossProfit: number
    overheadCost: number
    netProfit: number
    pasirCost: number
    splitCost: number
    semenCost: number
    solarCost: number
    retaseCost: number
    maintenanceCost: number
}

