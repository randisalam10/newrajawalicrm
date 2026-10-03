export interface SupplierItem {
    id: string
    name: string
    address: string | null
    contact: string | null
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
