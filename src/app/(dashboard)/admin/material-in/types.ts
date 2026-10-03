export type PurchaseUnitType = "KAPSUL" | "TON" | "ZAK_50" | "ZAK_40" | "KG" | string

export interface MaterialInRow {
    id: string
    date: string
    formattedDate: string
    formattedTime: string
    name: string
    supplier: string
    tonnage: number
    delivery_note: string
    locationName: string
    locationId: string
    unit_price: number
    total_price: number
    purchase_unit: string
    purchase_qty: number | null
    purchaseOrderId: string | null
    poNumber: string | null
    poStatus: string | null
    poDate: string | null
    poCompany: string | null
    poItemId: string | null
    poItemName: string | null
    poItemQty: number | null
    poItemUnitPrice: number | null
    effectivePricePerKg: number | null
}

export interface LedgerRow {
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

export interface MaterialInStats {
    totalTon: number
    totalKg: number
    totalNilai: number
    avgPricePerKg: number
    totalTransactions: number
    poLinkedCount: number
    manualCount: number
}

export type TracingFilterType = "ALL" | "PO" | "MANUAL"
