export interface BatchRow {
    id: string
    date: string
    itemDescription: string
    categoryId?: string | null
    category: string
    vehicleId?: string | null
    kmMeter?: number | null
    isCustomCategory?: boolean
    quantity: number
    unit: string
    unitPrice: number
    receiptNo: string
    notes: string
}

export interface StagedFile {
    file: File
    name: string
    originalSize: number
    compressedSize: number
    previewUrl: string
}

export interface RblClientProps {
    initialActiveBudget: any
    initialHistory: any[]
    summaryData: any
    locations: any[]
    initialCategories?: any[]
    vehicles?: any[]
    userRole: string
    userLocationId: string
    isSuperAdmin: boolean
    canCreate?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canClose?: boolean
    canExport?: boolean
}

export interface BudgetDateRange {
    min: string
    max: string
    defaultDate: string
    label: string
    start?: Date | null
    end?: Date | null
}

export interface BudgetAuditLogDTO {
    id: string
    action: string
    timestamp: Date | string
    userName: string
    oldValues?: {
        amount?: number
        receivedDate?: string | null
        notes?: string | null
    } | null
    newValues?: {
        amount?: number
        receivedDate?: string | null
        notes?: string | null
        editReason?: string | null
    } | null
    editReason?: string | null
}

export interface BudgetUpdatePayload {
    amount: number
    receivedDate: string
    notes?: string
    editReason: string
}

