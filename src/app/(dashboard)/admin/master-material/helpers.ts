import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export const fmt = (n: number) =>
    "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n || 0))

export const fmtDate = (d: any) =>
    d ? format(new Date(d), "dd MMM yyyy", { locale: idLocale }) : "-"

export const fmtDateInput = (d: any) =>
    d ? format(new Date(d), "yyyy-MM-dd") : ""
