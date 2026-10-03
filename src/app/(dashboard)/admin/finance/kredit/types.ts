export type CreditStatusType = "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED"
export type CreditSourceType = "PO_PURCHASE" | "NON_PO"
export type CreditPaymentMethod = "TRANSFER" | "CASH" | "GIRO" | "DEPOSIT"
export type CreditAllocationType = "ALL" | "PROJECT" | "BATCHING_PLANT" | "HOLDING"

export interface CreditItemDTO {
    id: string
    credit_number: string
    source_type: CreditSourceType
    allocation_type: "PROJECT" | "BATCHING_PLANT" | "HOLDING"
    allocation_label: string
    projectId?: string | null
    projectName?: string | null
    locationId: string | null
    locationName?: string | null
    is_for_bp?: boolean
    purchaseOrderId: string | null
    purchaseOrder?: {
        id: string
        po_number: string
        tanggal_terbit: string | Date
        status: string
        is_for_bp?: boolean
        locationId?: string | null
        companyProjectId?: string | null
        category?: { name: string; kode_kategori: string } | null
        pimpinan?: string
        items?: Array<{
            id: string
            quantity: number
            harga_satuan: number
            subtotal: number
            masterItem?: { name: string; kode_barang: string; satuan: string }
        }>
    } | null
    supplierId: string | null
    supplier_name: string
    companyGroupId: string | null
    company_name: string
    total_amount: number
    paid_amount: number
    outstanding: number
    credit_date: string | Date
    due_date: string | Date | null
    term_days: number | null
    status: CreditStatusType
    notes: string | null
    createdById: string
    createdBy?: {
        id: string
        username: string
        employee?: { name: string }
    }
    createdAt: string | Date
    updatedAt: string | Date
    payments?: CreditPaymentDTO[]
    auditLogs?: CreditAuditLogDTO[]
}

export interface CreditPaymentDTO {
    id: string
    creditId: string
    payment_date: string | Date
    amount: number
    method: CreditPaymentMethod | string
    source_account: string | null
    reference_no: string | null
    proof_url: string | null
    notes: string | null
    is_cancelled: boolean
    cancel_reason: string | null
    cancelled_at: string | Date | null
    cancelledById: string | null
    cancelledBy?: { username: string; employee?: { name: string } } | null
    recordedById: string
    recordedBy?: { username: string; employee?: { name: string } } | null
    createdAt: string | Date
}

export interface CreditAuditLogDTO {
    id: string
    action: string
    actorId: string
    actorName: string
    description: string
    metadata: string | null
    createdAt: string | Date
}

export interface CreditAllocationSubStats {
    totalAmount: number
    outstanding: number
    paidAmount: number
    count: number
}

export interface CreditKPIStats {
    totalCreditsCount: number
    totalCreditValue: number
    totalPaidValue: number
    totalOutstandingValue: number
    overdueCount: number
    overdueValue: number
    dueSoonCount: number
    dueSoonValue: number
    paidCount: number
    unpaidCount: number
    partialCount: number
    repaymentRatePct: number
    projectStats: CreditAllocationSubStats
    batchingPlantStats: CreditAllocationSubStats
    holdingStats: CreditAllocationSubStats
    byProject: Array<{ projectId: string; projectName: string; totalAmount: number; outstanding: number; count: number }>
    byLocation: Array<{ locationId: string; locationName: string; totalAmount: number; outstanding: number; count: number }>
    byCompany: Array<{ companyName: string; totalAmount: number; outstanding: number; count: number }>
    byCategory: Array<{ categoryName: string; totalAmount: number; outstanding: number; count: number }>
    topSuppliers: Array<{ supplierName: string; totalAmount: number; outstanding: number; count: number }>
    monthlyTrend: Array<{ monthKey: string; monthLabel: string; paymentAmount: number; paymentCount: number }>
}

export interface CreditFilterState {
    datePreset: "ALL" | "TODAY" | "THIS_MONTH" | "THIS_YEAR" | "CUSTOM"
    startDate: string
    endDate: string
    status: string
    allocationType: CreditAllocationType
    companyProjectId: string
    companyGroupId: string
    supplierId: string
    locationId: string
    search: string
    sortBy: "date_desc" | "date_asc" | "amount_desc" | "outstanding_desc" | "due_soon"
}

export interface PaymentFormState {
    creditId: string
    amount: string
    paymentDate: string
    method: CreditPaymentMethod
    sourceAccount: string
    referenceNo: string
    notes: string
    proofFile: File | null
    proofUrl: string
}

export interface CreateCreditFormState {
    supplierName: string
    companyGroupId: string
    allocationType: "BATCHING_PLANT" | "PROJECT" | "HOLDING"
    companyProjectId?: string
    locationId: string
    totalAmount: string
    creditDate: string
    dueDate: string
    termDays: number
    notes: string
    sourceAccount: string
}

export interface KreditClientProps {
    initialCredits: CreditItemDTO[]
    initialStats: CreditKPIStats
    companies: Array<{ id: string; name: string; kode_cabang: string }>
    suppliers: Array<{ id: string; name: string }>
    locations: Array<{ id: string; name: string }>
    projects: Array<{ id: string; name: string; kode_proyek: string | null; companyGroupId: string }>
    userRole: string
    userPermissions: string[]
    userLocationId?: string
}

