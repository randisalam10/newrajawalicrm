"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CrusherPoStats } from "../types"
import { FileText, Clock, CheckCircle2, DollarSign } from "lucide-react"

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount ?? 0)
}

type Props = {
    stats: CrusherPoStats
}

export function CrusherPoStatsCards({ stats }: Props) {
    const items = [
        {
            label: "Total PO Bulan Ini",
            value: `${stats.totalPoCount} PO`,
            icon: FileText,
            color: "text-slate-700 bg-slate-100 border-slate-200",
            iconColor: "text-slate-600",
        },
        {
            label: "Menunggu Persetujuan",
            value: `${stats.pendingCount} PO`,
            icon: Clock,
            color: "text-amber-800 bg-amber-50 border-amber-200",
            iconColor: "text-amber-600",
        },
        {
            label: "Disetujui (Approved)",
            value: `${stats.approvedCount} PO`,
            icon: CheckCircle2,
            color: "text-emerald-800 bg-emerald-50 border-emerald-200",
            iconColor: "text-emerald-600",
        },
        {
            label: "Total Belanja Bulan Ini",
            value: formatRupiah(stats.totalAmountThisMonth),
            icon: DollarSign,
            color: "text-blue-800 bg-blue-50 border-blue-200",
            iconColor: "text-blue-600",
        },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            {items.map((stat, idx) => {
                const Icon = stat.icon
                return (
                    <Card key={idx} className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                                    {stat.label}
                                </p>
                                <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`p-2 rounded-lg border ${stat.color}`}>
                                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
