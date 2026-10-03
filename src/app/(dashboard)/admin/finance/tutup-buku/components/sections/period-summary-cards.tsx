"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Lock, TrendingUp, DollarSign, Layers } from "lucide-react"
import { PeriodSummaryStats } from "../../types"

interface PeriodSummaryCardsProps {
    stats: PeriodSummaryStats
}

function formatRp(val: number): string {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}

export function PeriodSummaryCards({ stats }: PeriodSummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Periode Ditutup
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            {stats.totalClosedPeriods} <span className="text-sm font-normal text-slate-500">Bulan</span>
                        </h3>
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                            <Lock className="h-3 w-3" /> Terkunci Aman
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                        <Lock className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Volume Beton Terkunci
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            {stats.totalClosedVolume.toLocaleString("id-ID", { maximumFractionDigits: 1 })}{" "}
                            <span className="text-sm font-normal text-slate-500">m³</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Terakhir: {stats.latestClosedPeriod ?? "Belum ada"}
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                        <Layers className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Total Omset Terkunci (DPP)
                        </p>
                        <h3 className="text-xl font-bold text-slate-900 mt-1 truncate">
                            {formatRp(stats.totalClosedRevenue)}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Bebas dari perubahan retroaktif
                        </p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                        <DollarSign className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Total Laba Bersih Terkunci
                        </p>
                        <h3 className={`text-xl font-bold mt-1 truncate ${stats.totalClosedNetProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                            {formatRp(stats.totalClosedNetProfit)}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Setelah dikurangi COGS & Beban
                        </p>
                    </div>
                    <div className={`p-3 rounded-xl border ${stats.totalClosedNetProfit >= 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                        <TrendingUp className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
