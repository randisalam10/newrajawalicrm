export interface ProjectPriceItem {
    id: string
    projectId: string
    qualityId: string
    price: number
    ppn_mode: string // "NON_PPN" | "INCLUDE" | "EXCLUDE"
    ppn_rate: number
    concreteQuality?: {
        id: string
        name: string
        locationId?: string
        location?: {
            name: string
        }
    }
}

export interface CustomerProject {
    id: string
    name: string
    address: string
    default_distance: number
    tax_ppn: number
    customerId: string
    prices?: ProjectPriceItem[]
    sharedLocations?: { id: string; name: string }[]
}

export interface CustomerWithProjects {
    id: string
    customer_name: string
    address: string
    status: string
    locationId: string
    location?: {
        id: string
        name: string
    } | null
    sharedLocations?: { id: string; name: string }[]
    projects: CustomerProject[]
}

export interface LocationItem {
    id: string
    name: string
}

export interface ConcreteQualityItem {
    id: string
    name: string
    locationId?: string
    location?: {
        name: string
    }
}

export type DialogMode = "customerNew" | "customerEdit" | "projectNew" | "projectEdit" | null
export type SortKey = "customer_name" | "address" | "location" | "project_count"
export type SortDir = "asc" | "desc"
export type ProjectFilterStatus = "ALL" | "WITH_PROJECTS" | "WITHOUT_PROJECTS" | "NEEDS_PRICING"

export interface CustomerFilters {
    search: string
    locationId: string
    projectStatus: ProjectFilterStatus
    sortKey: SortKey
    sortDir: SortDir
}

export interface CustomerStats {
    totalCustomers: number
    totalProjects: number
    customersWithProjects: number
    customersWithoutProjects: number
    projectsWithPrices: number
    projectsWithoutPrices: number
}
