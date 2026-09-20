export type AggregateInRow = {
    id: string
    date: string
    no_bon: string
    driver_name: string
    plate_number: string
    volume_cubic: number
    aggregate_type: string
    aggregateLabel: string
    source_type: string
    supplier: string | null
    notes: string | null
    locationName: string
    locationId: string
    vehicleId?: string | null
    driverId?: string | null
    dump_truck_size?: string | null
    distance_km?: number | null
    rate_price?: number | null
    retase_amount?: number | null
    is_retase_paid?: boolean
    vehicle?: any
    driver?: any
}

export type AggregateLedgerRow = {
    id: string
    formattedDate: string
    type: "IN" | "OUT"
    description: string
    reference: string
    qty_in: number
    qty_out: number
    balance: number
    locationName: string
}

export const AGGREGATE_TYPE_LABELS: Record<string, string> = {
    SplitHalfOne: "Batu Split 1/2",
    SplitTwoThree: "Batu Split 2/3",
    Pasir: "Pasir",
    Other: "Lainnya",
}

export const AGGREGATE_TYPE_OPTIONS = [
    { value: "SplitHalfOne", label: "Batu Split 1/2" },
    { value: "SplitTwoThree", label: "Batu Split 2/3" },
    { value: "Pasir", label: "Pasir" },
    { value: "Other", label: "Lainnya" },
]

export const SOURCE_TYPE_LABELS: Record<string, string> = {
    Internal: "Internal (Quarry)",
    External: "Eksternal (Pembelian)",
}
