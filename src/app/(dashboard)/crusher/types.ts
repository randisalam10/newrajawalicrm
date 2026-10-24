export type CrusherTabKey = "machine" | "fuel" | "material_in" | "material_out" | "recap"

export type CrusherDowntimeItem = {
    id: string
    start_time: string
    end_time: string
    total_hours: number
    problem_desc: string
    action_taken?: string | null
}

export type CrusherFuelLogItem = {
    id: string
    unit_name: string
    unit_category: "EXCAVATOR" | "GENSET" | "DUMP_TRUCK" | "LAINNYA"
    vehicleId?: string | null
    liters: number
    current_hm?: number | null
    current_km?: number | null
    work_hours?: number | null
    notes?: string | null
    fuel_source?: string | null
    cost_per_liter?: number | null
    total_cost?: number | null
    rblExpenseId?: string | null
}

export type CrusherMaterialInItem = {
    id: string
    feed_type: "QUARRY_RAW" | "COLD_BIN"
    vehicleId?: string | null
    plate_number: string
    driverId?: string | null
    driver_name: string
    sourceId?: string | null
    source_name: string
    distance_km: number
    ritase: number
    volume_m3?: number | null
    rate_price?: number
    retase_amount?: number
    is_paid?: boolean
    paid_date?: string | null
    notes?: string | null
}

export type CrusherMaterialOutItem = {
    id: string
    material_name: string
    volume_m3: number
    vehicleId?: string | null
    plate_number?: string | null
    driverId?: string | null
    driver_name?: string | null
    dump_truck_size?: string | null
    ritase?: number
    distance_km?: number
    retase_rate?: number
    retase_amount?: number
    is_retase_paid?: boolean
    paid_retase_date?: string | null
    operatorId?: string | null
    operator_name?: string | null
    operator_rate?: number
    operator_fee?: number
    is_operator_paid?: boolean
    destination_type: "BATCHING_PLANT" | "PENJUALAN_BEBAS"
    destinationId?: string | null
    destinationName?: string | null
    targetLocationId?: string | null
    targetLocationName?: string | null
    receipt_status?: string
    receivedAt?: string | null
    customer_name?: string | null
    unit_price?: number | null
    total_price?: number | null
    payment_method?: string | null
    payment_status?: string | null
    notes?: string | null
}

export type CrusherDestinationItem = {
    id: string
    name: string
    distance_km: number
    address?: string | null
    contact_person?: string | null
    phone?: string | null
    notes?: string | null
    isActive: boolean
    locationId?: string | null
    locationName?: string | null
    totalDeliveries?: number
}

export type CrusherRetaseSettingItem = {
    id: string
    locationId?: string | null
    locationName?: string | null
    formula_type: "PER_KM_TIERED" | "PER_KM_FLAT" | "PER_M3_KM" | "PER_RIT_FLAT"
    rate_dt_kecil: number
    rate_dt_besar: number
    rate_per_km: number
    rate_per_m3_km: number
    rate_flat_rit: number
    effective_date?: string | null
    isActive: boolean
    notes?: string | null
}

export type OperatorWorkLogItem = {
    id: string
    date: string
    locationId: string
    locationName?: string | null
    reportId?: string | null
    employeeId: string
    employee_name: string
    role_type: "OPERATOR_EXCAVATOR" | "OPERATOR_LOADER" | "HELPER" | "OPERATOR_CRUSHER" | "LAINNYA"
    vehicleId?: string | null
    vehicle_code?: string | null
    hm_start?: number | null
    hm_end?: number | null
    work_hours_normal: number
    work_hours_overtime: number
    total_hours: number
    rate_normal: number
    rate_overtime: number
    fee_normal: number
    fee_overtime: number
    total_fee: number
    incentiveRateId?: string | null
    is_paid: boolean
    paid_date?: string | null
    notes?: string | null
}

export type CrusherEditLogItem = {
    id: string
    action: string
    changes: string
    userName: string
    createdAt: string
}

export type CrusherDailyReportData = {
    id: string
    date: string
    locationId: string
    locationName: string
    hm_start: number
    hm_end: number
    total_hm: number
    hm_notes?: string | null
    sunny_from?: string | null
    sunny_to?: string | null
    rain_from?: string | null
    rain_to?: string | null
    weather_notes?: string | null
    status: "DRAFT" | "SUBMITTED" | "APPROVED"
    createdById: string
    createdByName?: string | null
    downtimes: CrusherDowntimeItem[]
    fuelLogs: CrusherFuelLogItem[]
    materialsIn: CrusherMaterialInItem[]
    materialsOut: CrusherMaterialOutItem[]
    operatorLogs?: OperatorWorkLogItem[]
    editLogs?: CrusherEditLogItem[]
}

export type CrusherMaterialSourceItem = {
    id: string
    name: string
    default_distance_km: number
    description?: string | null
    isActive: boolean
}

export type VehicleOption = {
    id: string
    plate_number: string
    code?: string | null
    dump_truck_size?: string | null
    capacity_cubic?: number | null
    categoryName?: string | null
    meter_type?: string | null
    merk_model?: string | null
    locationId?: string | null
    locationName?: string | null
}

export type EmployeeOption = {
    id: string
    name: string
    position: string
    status: string
    driverCategoryId?: string | null
    driverCategoryName?: string | null
    locationId?: string | null
    locationName?: string | null
}

export type LocationOption = {
    id: string
    name: string
}

