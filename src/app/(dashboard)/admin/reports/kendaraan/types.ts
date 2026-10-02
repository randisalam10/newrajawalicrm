export interface VehicleLocation {
    id: string
    name: string
    [key: string]: any
}

export interface VehicleCategory {
    id: string
    name: string
    [key: string]: any
}

export interface VehicleItem {
    id: string
    code: string
    plate_number: string
    vehicle_type?: string | null
    meter_type?: string | null
    is_for_rent?: boolean
    locationId?: string | null
    categoryId?: string | null
    location?: VehicleLocation | null
    category?: VehicleCategory | null
    [key: string]: any
}

export interface VehicleStats {
    fuelLiters: number
    fuelCost: number
    lubricantCost: number
    otherCost: number
    totalCost: number
    sparepartCost?: number
    grandTotalCost?: number
    rentalRevenue?: number
    rentalDays?: number
    netProfit?: number
    minKm: number | null
    maxKm: number | null
    kmDistance: number
    totalTrips: number
    totalVolume: number
    fuelPerCubic: number
    costPerTrip: number
    costPerCubic: number
    hasBackdateAnomaly?: boolean
    [key: string]: any
}

export interface MeterEvent {
    id: string
    date: Date | string
    type: "RBL" | "PO"
    referenceNo: string
    description: string
    meter: number
    isBackdateAnomaly?: boolean
    [key: string]: any
}

export interface VehicleAnalyticsItem {
    vehicle: VehicleItem
    stats: VehicleStats
    recentExpenses: any[]
    recentTransactions: any[]
    recentPoItems?: any[]
    recentSewaTransactions?: any[]
    meterEvents?: MeterEvent[]
    [key: string]: any
}

export interface OverallSummary {
    totalVehicles?: number
    totalFuelLiters?: number
    totalFuelCost?: number
    totalTrips?: number
    totalVolume?: number
    totalSparepartCost?: number
    totalPoItems?: number
    grandTotalCost?: number
    totalCost?: number
    totalRentalRevenue?: number
    totalRentalDays?: number
    totalSewaCount?: number
    [key: string]: any
}

export interface VehicleReportClientProps {
    initialVehicles: VehicleItem[]
    categories?: VehicleCategory[]
    locations: VehicleLocation[]
    userLocationId?: string
    isSuperAdmin?: boolean
}
