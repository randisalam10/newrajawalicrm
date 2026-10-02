export interface MaterialLocation {
    id: string
    name: string
    [key: string]: any
}

export interface MaterialReportKPIs {
    totalIncomingVolume: number
    totalIncomingMaterialCost: number
    totalIncomingRetaseCost: number
    grandTotalLandedCost: number
    avgLandedCostPerM3: number
    avgMaterialUnitPrice: number
    totalOutgoingVolume: number
    totalOutgoingValue: number
    netCost: number
    incomingCount: number
    outgoingCount: number
    [key: string]: any
}

export interface MaterialSummaryItem {
    code: string
    name: string
    volume_cubic: number
    avg_unit_price: number
    material_cost: number
    retase_cost: number
    landed_cost: number
    avg_landed_per_m3: number
    pct_of_total: number
    outgoing_volume: number
    net_volume: number
    [key: string]: any
}

export interface SourceSummaryItem {
    source_type: "Internal" | "External" | string
    label: string
    count: number
    volume_cubic: number
    material_cost: number
    retase_cost: number
    landed_cost: number
    avg_landed_per_m3: number
    [key: string]: any
}

export interface DriverRetaseItem {
    driver_name: string
    plate_number: string
    dump_truck_size: string
    trip_count: number
    volume_cubic: number
    material_cost: number
    retase_cost: number
    paid_retase: number
    unpaid_retase: number
    [key: string]: any
}

export interface IncomingMaterialItem {
    id: string
    date: Date | string
    no_bon: string
    locationName: string
    material_name: string
    source_type: string
    supplier: string
    driver_name: string
    plate_number: string
    dump_truck_size: string
    distance_km?: number | null
    volume_cubic: number
    unit_price: number
    material_cost: number
    retase_cost: number
    landed_cost: number
    landed_per_m3: number
    is_retase_paid?: boolean
    is_from_master_price?: boolean
    notes?: string | null
    [key: string]: any
}

export interface OutgoingMaterialItem {
    id: string
    date: Date | string
    no_bon: string
    locationName: string
    material_name: string
    category: string
    recipient: string
    volume_cubic: number
    unit_price: number
    total_price: number
    transport_mode?: string | null
    is_from_master_price?: boolean
    [key: string]: any
}

export interface MaterialReportClientProps {
    locations: MaterialLocation[]
    userRole: string
    userLocationId?: string | null
}
