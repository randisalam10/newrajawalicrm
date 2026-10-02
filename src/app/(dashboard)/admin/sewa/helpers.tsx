import React from "react"
import { Badge } from "@/components/ui/badge"

export const formatRp = (num: number, withDecimals = false) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: withDecimals || (num % 1 !== 0) ? 2 : 0,
    }).format(num || 0)
}

export const parseDecimal = (val: string): number => {
    if (!val) return 0
    let clean = String(val).trim()
    if (clean.includes(",") && clean.includes(".")) {
        clean = clean.replace(/\./g, "").replace(/,/g, ".")
    } else if (clean.includes(",")) {
        clean = clean.replace(/,/g, ".")
    }
    const num = parseFloat(clean)
    return isNaN(num) ? 0 : num
}

export const getStatusBadge = (status: string) => {
    switch (status) {
        case "Active":
            return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Aktif (Disewa)</Badge>
        case "Completed":
            return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Selesai</Badge>
        case "Cancelled":
            return <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200">Dibatalkan</Badge>
        default:
            return <Badge variant="secondary">{status}</Badge>
    }
}
