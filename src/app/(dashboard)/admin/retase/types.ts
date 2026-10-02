export interface RetaseLocation {
    id: string
    name: string
    [key: string]: any
}

export interface RetaseCustomer {
    id: string
    customer_name?: string
    name?: string
    [key: string]: any
}

export interface MasterIncentiveItem {
    id?: string
    kategori_peran: string
    locationId?: string | null
    isActive?: boolean
    tarif_utama: number | string
    [key: string]: any
}

export interface RetaseSettingItem {
    id?: string
    locationId: string
    price_per_cubic_km?: number | string | null
    operator_rate_per_cubic?: number | string | null
    calculation_mode?: "DISTANCE_ONLY" | "DISTANCE_AND_VOLUME"
    [key: string]: any
}

export interface RetaseClientProps {
    pendingTransactions: any[]
    confirmedTransactions: any[]
    settings: RetaseSettingItem[]
    masterIncentives?: MasterIncentiveItem[]
    locations: RetaseLocation[]
    userRole: string
    customers: RetaseCustomer[]
    canConfirm?: boolean
    canDelete?: boolean
    canManageSettings?: boolean
}
