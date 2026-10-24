export type FuelSourceType = "NON_RBL" | "RBL" | "TANGKI_INDUK" | "PO_SUPPLIER" | "KUPON" | "LAINNYA"

export interface VehicleOptionItem {
    id: string
    code: string
    plate_number: string
    vehicle_type: string
    meter_type: string // "KM" | "HM"
    merk_model?: string | null
    locationId?: string | null
    locationName?: string | null
    lastMeter?: number | null
    lastMeterSource?: string | null
    lastMeterDate?: string | null
}

export interface DriverOptionItem {
    id: string
    name: string
    position?: string | null
    locationId?: string | null
}

export interface LocationOptionItem {
    id: string
    name: string
    type?: string
}

export interface VehicleFuelLogItem {
    id: string
    date: string // YYYY-MM-DD
    createdAt: string
    locationId: string
    locationName: string
    vehicleId: string
    vehicleCode: string
    plateNumber: string
    vehicleType: string
    meterType: string // "KM" | "HM"
    currentMeter: number
    lastMeter?: number | null
    meterDelta?: number | null
    isMeterReset: boolean
    liters: number
    fuelSource: string // "NON_RBL" | "RBL" | ...
    costPerLiter: number
    totalCost: number
    driverId?: string | null
    driverName?: string | null
    receiptNo?: string | null
    notes?: string | null
    createdByName: string
}

export interface FuelLogStats {
    totalLiters: number
    totalCost: number
    totalNonRblLiters: number
    totalNonRblCost: number
    totalRblLiters: number
    totalRblCost: number
    totalEntries: number
}

export interface FuelFilterParams {
    locationId?: string
    vehicleId?: string
    fuelSource?: string
    startDate?: string
    endDate?: string
}
