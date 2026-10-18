export type CrusherRetaseFormulaType = "PER_KM_TIERED" | "PER_KM_FLAT" | "PER_M3_KM" | "PER_RIT_FLAT"
export type CrusherTripType = "ALL" | "MATERIAL_IN" | "MATERIAL_OUT"

export interface CrusherRetaseSettingDTO {
    id: string
    locationId: string | null
    locationName?: string | null
    formula_type: CrusherRetaseFormulaType
    rate_dt_kecil: number
    rate_dt_besar: number
    rate_per_km: number
    rate_per_m3_km: number
    rate_flat_rit: number
    effective_date: string | null
    isActive: boolean
    notes: string | null
}

export interface CrusherDriverRetaseSummary {
    driverId: string | null
    driverName: string
    totalTrips: number
    totalRitMasuk: number
    totalRitKeluar: number
    totalVolumeM3: number
    totalDistanceKm: number
    totalRetaseAmount: number
    totalPaidAmount: number
    totalUnpaidAmount: number
    unpaidTripCount: number
}

export interface CrusherMaterialOutDelivery {
    id: string
    reportId: string
    category: "MATERIAL_IN" | "MATERIAL_OUT"
    categoryLabel: string // "Material Masuk (Quarry)" | "Material Masuk (Kolbin)" | "Material Keluar (Non-BP)"
    feedType?: string | null
    date: string
    locationId: string
    locationName: string
    plateNumber: string
    dumpTruckSize: "BESAR" | "KECIL" | string
    driverId: string | null
    driverName: string
    materialName: string
    volumeM3: number
    destinationId: string | null
    destinationName: string
    distanceKm: number
    ritase: number
    retaseRate: number
    retaseAmount: number
    isRetasePaid: boolean
    paidRetaseDate: string | null
    notes: string | null
}

export type CrusherRetaseTripItem = CrusherMaterialOutDelivery

export interface CrusherOperatorRetaseSummary {
    operatorId: string | null
    operatorName: string
    totalTransactions: number
    totalVolumeM3: number
    totalOperatorFee: number
    totalPaidAmount: number
    totalUnpaidAmount: number
    unpaidCount: number
}

export interface CrusherOperatorTransactionItem {
    id: string
    reportId: string
    date: string
    locationId: string
    locationName: string
    operatorId: string | null
    operatorName: string
    materialName: string
    volumeM3: number
    operatorRate: number
    operatorFee: number
    isOperatorPaid: boolean
    destinationType: string
    destinationName: string
    plateNumber: string | null
    driverName: string | null
    notes: string | null
}

export interface CrusherRetaseReportData {
    periodMonth: string // YYYY-MM
    locationId: string | null
    selectedTripType: CrusherTripType
    summary: {
        totalTrips: number
        totalRitMasuk: number
        totalRitKeluar: number
        totalVolumeM3: number
        totalDistanceKm: number
        totalRetaseAmount: number
        totalPaidAmount: number
        totalUnpaidAmount: number
        // Operator Stone Crusher Incentive Summary
        totalOperatorFee: number
        totalOperatorPaid: number
        totalOperatorUnpaid: number
        totalOperatorVolumeM3: number
    }
    driverSummaries: CrusherDriverRetaseSummary[]
    deliveries: CrusherMaterialOutDelivery[]
    operatorSummaries: CrusherOperatorRetaseSummary[]
    operatorTransactions: CrusherOperatorTransactionItem[]
}

export interface CrusherLocationOption {
    id: string
    name: string
}

