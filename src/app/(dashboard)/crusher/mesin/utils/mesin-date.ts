import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

/** Tanggal hari ini (YYYY-MM-DD) berdasarkan zona waktu WIB, bukan UTC server */
export function todayJakarta(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date())
}

/** Parsing aman tengah hari UTC agar tidak bergeser hari */
export function toMiddayUtc(dateStr: string): Date {
    return new Date(`${dateStr}T12:00:00.000Z`)
}

export function shiftDateStr(dateStr: string, days: number): string {
    const d = toMiddayUtc(dateStr)
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
}

export function shiftMonthStr(month: string, delta: number): string {
    const [y, m] = month.split("-").map(Number)
    const d = new Date(Date.UTC(y, m - 1 + delta, 1, 12))
    return d.toISOString().slice(0, 7)
}

/** Range [start, end) untuk satu bulan (YYYY-MM) */
export function monthRange(month: string): { start: Date; end: Date } {
    const [y, m] = month.split("-").map(Number)
    return {
        start: new Date(Date.UTC(y, m - 1, 1, 0, 0, 0)),
        end: new Date(Date.UTC(y, m, 1, 0, 0, 0)),
    }
}

export function daysInMonth(month: string): number {
    const [y, m] = month.split("-").map(Number)
    return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function formatDayLong(dateStr: string): string {
    return format(new Date(`${dateStr}T12:00:00`), "EEEE, dd MMM yyyy", { locale: idLocale })
}

export function formatDayShort(dateStr: string): string {
    return format(new Date(`${dateStr}T12:00:00`), "EEE, dd MMM", { locale: idLocale })
}

export function formatMonthLabel(month: string): string {
    return format(new Date(`${month}-01T12:00:00`), "MMMM yyyy", { locale: idLocale })
}

/** Konversi "HH:mm" ke menit; null jika tidak valid */
export function timeToMinutes(time: string): number | null {
    if (!time) return null
    const [h, m] = time.split(":").map(Number)
    if (!Number.isFinite(h)) return null
    return h * 60 + (Number.isFinite(m) ? m : 0)
}

/** Parsing angka desimal aman (mendukung koma) */
export function parseDecimal(val: string): number {
    const n = parseFloat(String(val ?? "").replace(",", "."))
    return Number.isFinite(n) ? n : 0
}
