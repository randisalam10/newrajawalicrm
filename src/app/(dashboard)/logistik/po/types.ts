export type POListClientProps = {
    initialData: any[]
    totalCount: number
    totalPages: number
    userRole: string
    userPermissions?: string[]
    companies: any[]
    categories: any[]
}

export type PODateFilterMode = "ALL" | "SPECIFIC" | "RANGE"

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 border border-slate-200" },
    SUBMITTED: { label: "Menunggu Approval", className: "bg-amber-50 text-amber-700 border border-amber-200" },
    APPROVED: { label: "Disetujui", className: "bg-green-50 text-green-700 border border-green-200" },
    REJECTED: { label: "Ditolak", className: "bg-red-50 text-red-700 border border-red-200" },
    CANCELLED: { label: "Dibatalkan", className: "bg-rose-50 text-rose-700 border border-rose-200" },
}

export function getPOStatusBadgeConfig(po: any): { label: string; className: string } {
    if (po.status === 'SUBMITTED') {
        let required = 0
        let approved = 0
        if (po.ceoId) required++
        if (po.fvpId) required++
        if (po.ceoApprovedAt) approved++
        if (po.fvpApprovedAt) approved++

        if (required > 0) {
            const pending = required - approved
            if (pending > 0) {
                return { 
                    label: `Menunggu (${pending})`, 
                    className: pending === 2 ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-blue-50 text-blue-700 border border-blue-200" 
                }
            } else {
                return { label: "Disetujui", className: "bg-green-50 text-green-700 border border-green-200" }
            }
        } else {
            return { label: "Menunggu Approval", className: "bg-amber-50 text-amber-700 border border-amber-200" }
        }
    }
    return STATUS_CONFIG[po.status] ?? STATUS_CONFIG.DRAFT
}
