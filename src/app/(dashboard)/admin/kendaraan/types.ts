export type FilterTab = "ALL" | "OPERASIONAL" | "SEWA" | "KEPATUHAN"

export type MeterType = "KM" | "HM"

export type DumpTruckSize = "BESAR" | "KECIL"

export type ComplianceType = "PAJAK_STNK" | "UJI_KIR" | "IZIN_TRAYEK" | "LAINNYA"

export interface VehicleCategory {
    id: string
    name: string
    code?: string | null
    description?: string | null
    isSystem?: boolean
    vehicles?: any[]
    _count?: {
        vehicles: number
    }
}

export interface VehicleComplianceRecord {
    id: string
    vehicleId: string
    type: ComplianceType
    cost: number
    monthly_amount: number
    payment_date?: Date | string | null
    valid_from: Date | string
    valid_until: Date | string
    period_months: number
    receipt_number?: string | null
    notes?: string | null
    vehicleCode?: string
    plateNumber?: string
    vehicleCategory?: string
    locationName?: string
}

export interface Vehicle {
    id: string
    code: string
    plate_number: string
    vehicle_type?: string
    categoryId?: string | null
    category?: VehicleCategory | null
    meter_type?: MeterType
    merk_model?: string | null
    locationId?: string | null
    location?: {
        id: string
        name: string
    } | null
    dump_truck_size?: DumpTruckSize | null
    capacity_cubic?: number | null
    is_for_rent?: boolean
    default_day_rate?: number | null
    rental_status?: string | null
    rental_notes?: string | null
    annual_tax_cost?: number | null
    tax_expiry_date?: Date | string | null
    kir_cost?: number | null
    kir_expiry_date?: Date | string | null
    kir_period_months?: number | null
    complianceRecords?: VehicleComplianceRecord[]
}

export const getCategoryBadgeClass = (name: string = "") => {
    const lower = name.toLowerCase()
    if (lower.includes("mixer")) return "bg-blue-100 text-blue-800 border-blue-200"
    if (lower.includes("loader")) return "bg-orange-100 text-orange-800 border-orange-200"
    if (lower.includes("dump")) return "bg-emerald-100 text-emerald-800 border-emerald-200"
    if (lower.includes("pump")) return "bg-purple-100 text-purple-800 border-purple-200"
    if (lower.includes("batching") || lower.includes("plant")) return "bg-indigo-100 text-indigo-800 border-indigo-200"
    if (lower.includes("genset") || lower.includes("power")) return "bg-amber-100 text-amber-800 border-amber-200"
    if (lower.includes("excavator")) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (lower.includes("operasional") || lower.includes("mobil")) return "bg-teal-100 text-teal-800 border-teal-200"
    if (lower.includes("motor")) return "bg-cyan-100 text-cyan-800 border-cyan-200"
    return "bg-slate-100 text-slate-800 border-slate-200"
}
