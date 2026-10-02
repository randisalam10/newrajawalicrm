import React from "react"
import { Clock, PlayCircle, CheckCircle2, XCircle } from "lucide-react"
import { format, isToday, isTomorrow, parseISO } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { PlanStatus } from "./types"

export const STATUS_CONFIG: Record<PlanStatus, {
    label: string
    icon: React.ReactNode
    badge: string
    dot: string
}> = {
    Planned: {
        label: "Direncanakan",
        icon: <Clock className="w-3 h-3" />,
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
    },
    OnGoing: {
        label: "Sedang Berjalan",
        icon: <PlayCircle className="w-3 h-3" />,
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
    },
    Done: {
        label: "Selesai",
        icon: <CheckCircle2 className="w-3 h-3" />,
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
    },
    Cancelled: {
        label: "Dibatalkan",
        icon: <XCircle className="w-3 h-3" />,
        badge: "bg-slate-100 text-slate-500 border-slate-200",
        dot: "bg-slate-300",
    },
}

export const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

export function formatDateLabel(date: Date | string) {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (isToday(d)) return `Hari ini · ${format(d, "dd MMM yyyy", { locale: idLocale })}`
    if (isTomorrow(d)) return `Besok · ${format(d, "dd MMM yyyy", { locale: idLocale })}`
    return format(d, "EEEE, dd MMMM yyyy", { locale: idLocale })
}

export function StatusBadge({ status }: { status: PlanStatus }) {
    const cfg = STATUS_CONFIG[status]
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${cfg.badge}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    )
}
