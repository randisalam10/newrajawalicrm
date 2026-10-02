export type PpnMode = "NON_PPN" | "INCLUDE" | "EXCLUDE"
export type DateMode = "RANGE" | "DATES"

export interface SewaCustomer {
    id: string
    customer_name: string
    address?: string | null
    projects?: Array<{
        id: string
        name: string
        address?: string | null
    }>
    [key: string]: any
}

export interface SewaEquipment {
    id: string
    nama_alat: string
    kode_alat: string
    kategori?: string | null
    nomor_seri_plat?: string | null
    status?: string
    default_day_rate?: number | null
    [key: string]: any
}

export interface SewaOperator {
    id: string
    name: string
    position?: string | null
    driverCategory?: {
        id: string
        name: string
    } | null
    [key: string]: any
}

export interface SewaLocation {
    id: string
    name: string
    [key: string]: any
}

export interface SewaMasters {
    customers: any[]
    equipments: any[]
    operators: any[]
    locations: any[]
}

export interface SewaTransaction {
    id: string
    sewa_number: string
    date: Date | string
    start_date: Date | string
    end_date: Date | string
    total_days: number
    date_mode?: DateMode | string | null
    rental_dates?: string | null
    price_per_day: number
    total_price: number
    dpp_amount?: number | null
    ppn_amount?: number | null
    is_ppn?: boolean
    ppn_mode?: PpnMode | string | null
    ppn_rate?: number | null
    status: "Active" | "Completed" | "Cancelled" | string
    notes?: string | null
    lokasi_proyek?: string | null
    locationId?: string | null
    customer?: any | null
    project?: any | null
    equipment?: any | null
    vehicle?: any | null
    operator?: any | null
    location?: any | null
    [key: string]: any
}
