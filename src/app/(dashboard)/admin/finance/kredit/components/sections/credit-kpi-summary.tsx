"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CreditKPIStats } from "../../types"
import { fmtRp, fmtCompact } from "../../utils/kredit-helpers"
import { AlertTriangle, Clock, CheckCircle2, DollarSign, Wallet } from "lucide-react"

interface CreditKpiSummaryProps {
    stats: CreditKPIStats
}

export function CreditKpiSummary({ stats }: CreditKpiSummaryProps) {
    const rate = Math.min(100, Math.max(0, stats.repaymentRatePct || 0))

    return (
        <div className="space-y-3">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Sisa Kewajiban Aktif */}
                <Card className="border-rose-200/80 bg-gradient-to-br from-white to-rose-50/30 shadow-2xs">
                    <CardContent className="p-3.5 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                                Total Sisa Kewajiban
                            </div>
                            <div className="text-xl font-bold font-mono text-rose-600 mt-1">
                                {fmtRp(stats.totalOutstandingValue)}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                                Dari total {stats.totalCreditsCount} transaksi kredit
                            </div>
                        </div>
                        <div className="p-2.5 bg-rose-100/70 text-rose-700 rounded-xl">
                            <Wallet className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Total Telah Dilunasi */}
                <Card className="border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/30 shadow-2xs">
                    <CardContent className="p-3.5 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                                Total Sudah Dibayar
                            </div>
                            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                                {fmtRp(stats.totalPaidValue)}
                            </div>
                            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                                {rate.toFixed(1)}% terlunasi ({stats.paidCount} lunas)
                            </div>
                        </div>
                        <div className="p-2.5 bg-emerald-100/70 text-emerald-700 rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Jatuh Tempo / Overdue */}
                <Card className={`shadow-2xs ${stats.overdueCount > 0 ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-white"}`}>
                    <CardContent className="p-3.5 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                                {stats.overdueCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
                                Lewat Jatuh Tempo
                            </div>
                            <div className="text-xl font-bold font-mono text-red-700 mt-1">
                                {fmtRp(stats.overdueValue)}
                            </div>
                            <div className="text-[11px] text-red-600 font-medium mt-0.5">
                                {stats.overdueCount} tagihan perlu penanganan segera
                            </div>
                        </div>
                        <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Segera Jatuh Tempo (H-7) */}
                <Card className="border-amber-200/80 bg-gradient-to-br from-white to-amber-50/30 shadow-2xs">
                    <CardContent className="p-3.5 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                                Jatuh Tempo 7 Hari ke Depan
                            </div>
                            <div className="text-xl font-bold font-mono text-amber-900 mt-1">
                                {fmtRp(stats.dueSoonValue)}
                            </div>
                            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                                {stats.dueSoonCount} tagihan akan jatuh tempo
                            </div>
                        </div>
                        <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                            <Clock className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Allocation Domain Split (Proyek vs Batching Plant vs Kantor Pusat) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {/* 1. Beban Kewajiban Proyek */}
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                        <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[11px] uppercase tracking-wider">
                            <span>🏗️ Kewajiban Proyek</span>
                            <span className="text-[10px] font-semibold bg-indigo-200/70 text-indigo-800 px-1.5 py-0.2 rounded-full">
                                {stats.projectStats?.count ?? 0} PO
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-mono font-bold text-sm text-indigo-950">
                                {fmtRp(stats.projectStats?.outstanding ?? 0)}
                            </span>
                            <span className="text-[10px] text-indigo-700">sisa</span>
                        </div>
                        <div className="text-[10px] text-indigo-600/90 mt-0.5">
                            Total Plafon: {fmtCompact(stats.projectStats?.totalAmount ?? 0)}
                        </div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-indigo-800 font-semibold">
                        {stats.totalOutstandingValue > 0
                            ? `${(((stats.projectStats?.outstanding ?? 0) / stats.totalOutstandingValue) * 100).toFixed(1)}%`
                            : "0%"}
                        <div className="text-[9px] text-indigo-600 font-normal">porsi beban</div>
                    </div>
                </div>

                {/* 2. Beban Kewajiban Batching Plant */}
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                        <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px] uppercase tracking-wider">
                            <span>🏭 Kewajiban Batching Plant</span>
                            <span className="text-[10px] font-semibold bg-blue-200/70 text-blue-800 px-1.5 py-0.2 rounded-full">
                                {stats.batchingPlantStats?.count ?? 0} PO
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-mono font-bold text-sm text-blue-950">
                                {fmtRp(stats.batchingPlantStats?.outstanding ?? 0)}
                            </span>
                            <span className="text-[10px] text-blue-700">sisa</span>
                        </div>
                        <div className="text-[10px] text-blue-600/90 mt-0.5">
                            Total Plafon: {fmtCompact(stats.batchingPlantStats?.totalAmount ?? 0)}
                        </div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-blue-800 font-semibold">
                        {stats.totalOutstandingValue > 0
                            ? `${(((stats.batchingPlantStats?.outstanding ?? 0) / stats.totalOutstandingValue) * 100).toFixed(1)}%`
                            : "0%"}
                        <div className="text-[9px] text-blue-600 font-normal">porsi beban</div>
                    </div>
                </div>

                {/* 3. Beban Kewajiban Kantor Pusat / Holding */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                            <span>🏢 Kantor Pusat / Holding</span>
                            <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
                                {stats.holdingStats?.count ?? 0} PO
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900">
                                {fmtRp(stats.holdingStats?.outstanding ?? 0)}
                            </span>
                            <span className="text-[10px] text-slate-500">sisa</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                            Total Plafon: {fmtCompact(stats.holdingStats?.totalAmount ?? 0)}
                        </div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-slate-700 font-semibold">
                        {stats.totalOutstandingValue > 0
                            ? `${(((stats.holdingStats?.outstanding ?? 0) / stats.totalOutstandingValue) * 100).toFixed(1)}%`
                            : "0%"}
                        <div className="text-[9px] text-slate-500 font-normal">porsi beban</div>
                    </div>
                </div>
            </div>

            {/* Repayment Progress Bar Banner */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800">Tingkat Pelunasan Kredit (Progress):</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {fmtCompact(stats.totalPaidValue)} / {fmtCompact(stats.totalCreditValue)} ({rate.toFixed(1)}%)
                    </span>
                </div>
                <div className="flex-1 max-w-md bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${rate}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
