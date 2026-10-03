"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BreakEvenAnalysisResult, SimulatorScenarioParams } from "../../types"
import { formatRupiah, formatNumber } from "../../utils/cashflow-math"
import { Target, TrendingUp, Calendar, AlertCircle } from "lucide-react"

interface BreakEvenCardProps {
    breakEven: BreakEvenAnalysisResult
    params: SimulatorScenarioParams
}

export function BreakEvenCard({ breakEven, params }: BreakEvenCardProps) {
    const isVolumeAboveCashBep = params.targetMonthlyVolume >= breakEven.cashBepVolume

    return (
        <Card className="border-slate-200 bg-white shadow-xs w-full">
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-600" />
                    <CardTitle className="text-sm font-bold text-slate-800">
                        Analisis Titik Impas: Akrual (P&amp;L) vs Arus Kas Riil (Cash BEP)
                    </CardTitle>
                </div>
                <Badge className={isVolumeAboveCashBep ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}>
                    {isVolumeAboveCashBep ? "Volume di Atas Cash BEP" : "Volume di Bawah Cash BEP"}
                </Badge>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Accounting Break-Even */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        1. Accounting BEP (P&amp;L)
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-slate-900">
                            {formatNumber(breakEven.accountingBepVolume)}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">m³ / bulan</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                        {formatRupiah(breakEven.accountingBepRevenue)}
                    </div>
                    <p className="text-[10px] text-slate-400">
                        Menutup Beban Pokok &amp; Overhead Akrual bulanan
                    </p>
                </div>

                {/* 2. Cash Break-Even */}
                <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/40 space-y-1.5">
                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center justify-between">
                        <span>2. Cash Break-Even Riil</span>
                        <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-blue-900">
                            {formatNumber(breakEven.cashBepVolume)}
                        </span>
                        <span className="text-xs font-semibold text-blue-600">m³ / bulan</span>
                    </div>
                    <div className="text-xs font-semibold text-blue-800">
                        {formatRupiah(breakEven.cashBepRevenue)}
                    </div>
                    <p className="text-[10px] text-blue-600/80">
                        Menutup seluruh kewajiban kas (Payroll + AP + Kasbon + Pajak + Hutang)
                    </p>
                </div>

                {/* 3. Margin Kontribusi per m³ */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        3. Contribution Margin
                    </div>
                    <div className="text-lg font-black text-emerald-700">
                        {formatRupiah(breakEven.unitContributionMargin)} <span className="text-xs font-normal text-slate-500">/ m³</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                        Margin Kotor: {breakEven.grossMarginPercent.toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-slate-400">
                        Setiap 1 m³ menghasilkan kas kotor Rp {formatNumber(breakEven.unitContributionMargin / 1000)} ribu
                    </p>
                </div>

                {/* 4. Horizon Titik Aman Kas */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>4. Milestone Kas Aman</span>
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                        Cash Positive: <span className="font-bold text-blue-700">{breakEven.cashPositiveMonth || "Belum Tercapai"}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                        Max Defisit: <span className="font-bold text-rose-700">{formatRupiah(breakEven.maximumCashDeficit)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-slate-400" />
                        Runway Tersedia: {breakEven.cashRunwayMonths} Bulan
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
