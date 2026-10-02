import { CreditStatusType } from "../types"

export function fmtRp(value: number | null | undefined): string {
    const val = value ?? 0
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val)
}

export function fmtCompact(value: number | null | undefined): string {
    const val = value ?? 0
    if (Math.abs(val) >= 1_000_000_000) {
        return `Rp ${(val / 1_000_000_000).toFixed(2)} M`
    }
    if (Math.abs(val) >= 1_000_000) {
        return `Rp ${(val / 1_000_000).toFixed(1)} Jt`
    }
    return fmtRp(val)
}

export function fmtDate(date: string | Date | null | undefined): string {
    if (!date) return "-"
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) return "-"
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(d)
}

export function fmtDateTime(date: string | Date | null | undefined): string {
    if (!date) return "-"
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) return "-"
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d)
}

export function getCreditStatusBadgeConfig(status: CreditStatusType, dueDate?: string | Date | null, outstanding?: number): {
    label: string
    className: string
} {
    if (status === "CANCELLED") {
        return {
            label: "Dibatalkan",
            className: "bg-rose-50 text-rose-700 border-rose-200",
        }
    }
    if (status === "PAID") {
        return {
            label: "Lunas",
            className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        }
    }

    // Check overdue dynamically
    if (dueDate && (outstanding ?? 1) > 0) {
        const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        due.setHours(0, 0, 0, 0)

        if (due < now) {
            return {
                label: "Jatuh Tempo (Overdue)",
                className: "bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse",
            }
        }

        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays <= 7) {
            return {
                label: `Jatuh Tempo H-${diffDays}`,
                className: "bg-amber-50 text-amber-800 border-amber-300 font-semibold",
            }
        }
    }

    if (status === "PARTIAL") {
        return {
            label: "Sebagian (Cicil)",
            className: "bg-amber-50 text-amber-700 border-amber-200",
        }
    }

    return {
        label: "Belum Dibayar",
        className: "bg-slate-50 text-slate-700 border-slate-200",
    }
}
