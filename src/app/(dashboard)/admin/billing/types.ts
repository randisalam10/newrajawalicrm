export interface BillingClientProps {
    initialData: any
    locations: any[]
    userRole: string
    userLocationId: string
    canManage?: boolean
}

export interface PaymentFormState {
    amount: string
    method: string
    paymentDate: string
    referenceNo: string
    notes: string
    proofFile: File | null
    proofUrl: string
}

export interface CompressionInfo {
    origSize: number
    compSize: number
    previewUrl: string
}

export interface DepositFormState {
    amount: string
    description: string
    reference: string
}

export interface InvoiceFormState {
    initialsOverride: string
    customerSeqOverride: string
    includePpn: boolean
    dueDate: string
    notes: string
}

export interface UnbilledGroupItem {
    key: string
    title: string
    subTitle?: string
    transactions: any[]
    totalVol: number
    totalVal: number
}
