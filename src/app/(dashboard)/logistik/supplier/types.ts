export interface SupplierItem {
    id: string
    name: string
    address: string | null
    contact: string | null
    target_business: "BP" | "CRUSHER" | "ALL"
    is_global: boolean
    locationId: string | null
    location?: { id: string; name: string } | null
    sharedLocations?: { id: string; name: string }[]
    itemCount: number
    poCount: number
    createdAt: string
}

export interface SupplierStats {
    totalSuppliers: number
    totalItems: number
    activeSuppliers: number
    withContactCount: number
}

export interface SupplierFormData {
    name: string
    address?: string
    contact?: string
}

export interface BulkUpdateSupplierScopePayload {
    supplierIds: string[]
    is_global: boolean
    target_business?: "BP" | "CRUSHER" | "ALL"
    locationId?: string | null
    sharedLocationIds?: string[]
    syncItems?: boolean
}
