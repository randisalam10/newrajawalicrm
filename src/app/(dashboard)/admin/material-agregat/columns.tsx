export type AggregateInRow = {
    id: string
    date: string
    no_bon: string
    driver_name: string
    plate_number: string
    volume_cubic: number
    aggregate_type: string
    custom_material_name?: string | null
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
    unit_price?: number | null
    total_price?: number | null
    vehicle?: any
    driver?: any
}

export type AggregateOutRow = {
    id: string
    date: string
    no_bon: string | null
    aggregate_type: string
    custom_material_name?: string | null
    aggregateLabel: string
    volume_cubic: number
    unit?: string | null
    unit_price?: number | null
    total_price?: number | null
    category: string
    categoryLabel: string
    recipient: string | null
    transport_mode?: string | null
    vehicleId?: string | null
    driverId?: string | null
    dump_truck_size?: string | null
    distance_km?: number | null
    rate_price?: number | null
    retase_amount?: number | null
    is_retase_paid?: boolean
    vehicle?: any
    driver?: any
    plate_number: string | null
    driver_name: string | null
    notes: string | null
    locationName: string
    locationId: string
    createdById?: string | null
}

export type AggregateLedgerRow = {
    id: string
    formattedDate: string
    type: "IN" | "OUT"
    category?: string
    description: string
    reference: string
    weight_kg?: number | null
    detail_conversion?: string | null
    qty_in: number
    qty_out: number
    balance: number
    locationName: string
}

export type AggregateCombinedRow = {
    id: string
    date: string
    direction: "IN" | "OUT"
    no_bon: string
    aggregate_type: string
    custom_material_name?: string | null
    aggregateLabel: string
    volume: number
    unit: string
    categoryOrSource: string
    party: string // Supplier or Recipient
    vehicleInfo: string // Plate / Driver / Dump Truck
    financialInfo?: string // Retase or Selling Price
    notes: string | null
    locationName: string
    locationId: string
    rawIn?: AggregateInRow
    rawOut?: AggregateOutRow
}

export const AGGREGATE_TYPE_LABELS: Record<string, string> = {
    SplitHalfOne: "Batu Split 1/2",
    SplitTwoThree: "Batu Split 2/3",
    Pasir: "Pasir Cor",
    AbuBatu: "Abu Batu / Screening",
    Semen: "Semen (Zak / Curah)",
    Other: "Lainnya / Material Khusus",
}

export const AGGREGATE_TYPE_OPTIONS = [
    { value: "SplitHalfOne", label: "Batu Split 1/2" },
    { value: "SplitTwoThree", label: "Batu Split 2/3" },
    { value: "Pasir", label: "Pasir Cor" },
    { value: "AbuBatu", label: "Abu Batu / Screening" },
    { value: "Semen", label: "Semen (Zak / Curah)" },
    { value: "Other", label: "Lainnya / Material Khusus..." },
]

export const AGGREGATE_TYPE_TO_MATERIAL_CODE: Record<string, string> = {
    SplitHalfOne: "SPLIT_1_2",
    SplitTwoThree: "SPLIT_2_3",
    Pasir: "PASIR",
    AbuBatu: "ABU_BATU",
    Other: "OTHER",
}

export const SOURCE_TYPE_LABELS: Record<string, string> = {
    Internal: "Internal (Quarry)",
    External: "Eksternal (Pembelian)",
}

export const OUTGOING_CATEGORY_LABELS: Record<string, string> = {
    PENJUALAN: "Penjualan Bebas / Komersial",
    INTERNAL_PROYEK: "Internal Non-BP (Proyek)",
    TRANSFER: "Transfer Antar Batching Plant",
    KOREKSI_SUSUT: "Koreksi / Opname Susut",
    INTERNAL_PLANT: "Pemakaian Internal Fasilitas Plant",
    INTERNAL: "Pemakaian Internal Plant",
    LAINNYA: "Pengeluaran Lainnya",
}

export const OUTGOING_CATEGORY_OPTIONS = [
    { value: "PENJUALAN", label: "Penjualan Bebas / Komersial" },
    { value: "INTERNAL_PROYEK", label: "Internal Non-BP (Proyek Lapangan)" },
    { value: "TRANSFER", label: "Transfer Antar Plant / Quarry" },
    { value: "KOREKSI_SUSUT", label: "Koreksi Stok / Opname Susut" },
    { value: "INTERNAL_PLANT", label: "Pemakaian Fasilitas Plant" },
    { value: "LAINNYA", label: "Pengeluaran Lainnya" },
]
