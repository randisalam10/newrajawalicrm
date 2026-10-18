"use client"

import { formatNumber } from "../../utils/crusher-helpers"
import type { MachineMonthSummary } from "../types"

type Props = {
    summary: MachineMonthSummary
}

export function MachineSummaryCards({ summary }: Props) {
    const items = [
        {
            label: "Hari Tercatat",
            value: `${summary.recordedDays} / ${summary.expectedDays}`,
            hint: summary.expectedDays - summary.recordedDays > 0
                ? `${summary.expectedDays - summary.recordedDays} hari belum diisi`
                : "Lengkap",
            tone: summary.recordedDays < summary.expectedDays ? "text-amber-700" : "text-emerald-700",
        },
        { label: "Total Jam Kerja", value: `${formatNumber(summary.totalHm)} Jam`, hint: `Rata-rata ${formatNumber(summary.avgHm)} jam/hari`, tone: "text-blue-700" },
        { label: "Total Downtime", value: `${formatNumber(summary.totalDowntime)} Jam`, hint: "Akumulasi jam rusak", tone: "text-rose-700" },
        { label: "Hari Hujan", value: `${summary.rainDays} Hari`, hint: "Tercatat jam hujan", tone: "text-slate-800" },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {items.map((it) => (
                <div key={it.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{it.label}</div>
                    <div className={`text-lg font-bold tabular-nums ${it.tone}`}>{it.value}</div>
                    <div className="text-[11px] text-slate-500">{it.hint}</div>
                </div>
            ))}
        </div>
    )
}
