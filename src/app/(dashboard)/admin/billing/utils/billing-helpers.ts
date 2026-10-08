import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n || 0))
export const fmtNum = (n: number, dec: number = 0) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: dec }).format(n || 0)
export const fmtDate = (d: any) => d ? format(new Date(d), "dd MMM yyyy", { locale: idLocale }) : "-"
export const fmtDateTime = (d: any) => d ? format(new Date(d), "dd MMM yyyy, HH:mm", { locale: idLocale }) : "-"

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Draft", color: "bg-slate-100 text-slate-700" },
    ISSUED: { label: "Terbit", color: "bg-blue-100 text-blue-700" },
    PARTIAL: { label: "Sebagian", color: "bg-amber-100 text-amber-700" },
    PAID: { label: "Lunas", color: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
}
