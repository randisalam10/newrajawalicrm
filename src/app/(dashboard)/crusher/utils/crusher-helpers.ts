import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(amount ?? 0)
}

export function formatNumber(val: number, decimals: number = 1): string {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: 0,
    }).format(val ?? 0)
}

export function formatDateIndo(dateStr: string | Date): string {
    try {
        const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr
        return format(d, "EEEE, dd MMMM yyyy", { locale: idLocale })
    } catch {
        return String(dateStr)
    }
}

export function calculateHmDifference(start: number, end: number): number {
    const s = Number(start) || 0
    const e = Number(end) || 0
    if (e < s) return 0
    return Math.round((e - s) * 10) / 10
}

export function calculateDowntimeHours(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0
    try {
        const [startH, startM] = startTime.split(":").map(Number)
        const [endH, endM] = endTime.split(":").map(Number)
        const totalStartMinutes = (startH * 60) + (startM || 0)
        const totalEndMinutes = (endH * 60) + (endM || 0)
        const diffMinutes = totalEndMinutes - totalStartMinutes
        if (diffMinutes <= 0) return 0
        return Math.round((diffMinutes / 60) * 10) / 10
    } catch {
        return 0
    }
}

export const CRUSHER_DEFAULT_MATERIALS = [
    "Abu Batu",
    "Batu 0.5 (Ciping)",
    "Batu 1-2",
    "Batu 2-3",
    "Batu Bulat",
] as const

export const FUEL_UNIT_PRESETS = [
    { name: "Excavator I", category: "EXCAVATOR" as const },
    { name: "Excavator II", category: "EXCAVATOR" as const },
    { name: "Genset Crusher", category: "GENSET" as const },
] as const

/**
 * Cek apakah user berhak melihat hasil upah pribadi / nominal retase / slip upah di Stone Crusher
 * Default untuk user crusher operasional: FALSE (hanya Finance / HO / SuperAdmin atau izin CRUSHER_WAGES_VIEW)
 */
export function canUserViewCrusherWages(role?: string | null, permissions?: string[] | null): boolean {
    const r = role || ""
    const perms = permissions || []
    if (["SuperAdminBP", "CEO", "FVP", "Finance"].includes(r)) return true
    if (perms.includes("CRUSHER_WAGES_VIEW")) return true
    if (perms.includes("FINANCE_VIEW") || perms.includes("RETASE_EXPORT")) return true
    return false
}

