export interface ProduksiLocation {
    id: string
    name: string
    [key: string]: any
}

export interface ProduksiCustomer {
    id: string
    customer_name: string
    locationId?: string | null
    [key: string]: any
}

export interface ProduksiProject {
    id: string
    name: string
    address?: string | null
    default_distance?: number | null
    customer?: ProduksiCustomer | null
    [key: string]: any
}

export interface ProduksiVehicle {
    id: string
    code: string
    plate_number: string
    locationId?: string | null
    [key: string]: any
}

export interface ProduksiDriver {
    id: string
    name: string
    locationId?: string | null
    [key: string]: any
}

export interface ProduksiOperator {
    id: string
    name: string
    locationId?: string | null
    location?: { name: string } | null
    [key: string]: any
}

export interface ProduksiQuality {
    id: string
    name: string
    locationId?: string | null
    [key: string]: any
}

export interface ProduksiWorkItem {
    id: string
    name: string
    locationId?: string | null
    [key: string]: any
}

export interface IncentiveRateItem {
    id: string
    nama_insentif: string
    kategori_peran: string
    formula_type: string
    tarif_utama: number
    tarif_sekunder?: number | null
    locationId?: string | null
    effective_date: string | Date
    keterangan?: string | null
    isActive: boolean
    [key: string]: any
}

export interface RetaseSettingItem {
    id: string
    locationId?: string | null
    operator_rate_per_cubic?: number | null
    price_per_cubic_km?: number | null
    [key: string]: any
}

export interface ProductionMasters {
    projects?: ProduksiProject[]
    vehicles?: ProduksiVehicle[]
    drivers?: ProduksiDriver[]
    qualities?: ProduksiQuality[]
    workItems?: ProduksiWorkItem[]
    operators?: ProduksiOperator[]
    incentiveRates?: IncentiveRateItem[]
    retaseSettings?: RetaseSettingItem[]
}

export interface ProduksiClientProps {
    masters: ProductionMasters
    userRole?: string
    locations?: ProduksiLocation[]
    canCreate?: boolean
}

export interface RateFormState {
    id: string
    nama_insentif: string
    tarif_utama: string
    effective_date: string
    keterangan: string
}
