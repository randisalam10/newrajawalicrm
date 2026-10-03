"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    HistoricalBaselineData,
    SimulatorScenarioParams,
    BreakEvenAnalysisResult
} from "../../types"
import { formatRupiah } from "../../utils/cashflow-math"
import { AlertCircle, CheckCircle2, AlertTriangle, Edit3 } from "lucide-react"

interface ExecutiveKpiBarProps {
    baseline: HistoricalBaselineData
    params: SimulatorScenarioParams
    breakEven: BreakEvenAnalysisResult
    onOpenStartingCashModal: () => void
}

export function ExecutiveKpiBar({
    baseline,
    params,
    breakEven,
    onOpenStartingCashModal
}: ExecutiveKpiBarProps) {
    const isCoverageHealthy = breakEven.current30DayCoveragePct >= 100

    return (
        <div className="space-y-4 w-full">
            {/* ── ALARM / WARNING BANNER UTAMA ── */}
            {breakEven.alertType === "CRITICAL_DEFICIT" && (
                <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 flex items-start gap-3 shadow-sm">
                    <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm tracking-wide">{breakEven.alertHeadline}</span>
                            <Badge className="bg-rose-600 text-white text-xs">Defisit Kas Riil</Badge>
                        </div>
                        <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                            {breakEven.alertDescription}
                        </p>
                    </div>
                </div>
            )}

            {breakEven.alertType === "DEFICIT_RISK" && (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm tracking-wide">{breakEven.alertHeadline}</span>
                            <Badge className="bg-amber-600 text-white text-xs">Perhatian Manajemen</Badge>
                        </div>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                            {breakEven.alertDescription}
                        </p>
                    </div>
                </div>
            )}

            {breakEven.alertType === "HEALTHY" && (
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 flex items-start gap-3 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm tracking-wide">{breakEven.alertHeadline}</span>
                            <Badge className="bg-emerald-600 text-white text-xs">Arus Kas Aman</Badge>
                        </div>
                        <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                            {breakEven.alertDescription}
                        </p>
                    </div>
                </div>
            )}

            {/* ── 5 KARTU INDIKATOR POSISI KAS & KEWAJIBAN ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
                {/* 1. Saldo Kas Awal */}
                <Card className="border-slate-200 bg-white shadow-xs">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Kas Awal</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onOpenStartingCashModal}
                                className="h-6 px-1.5 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit
                            </Button>
                        </div>
                        <div className="text-lg font-black text-slate-900">
                            {formatRupiah(params.startingCash)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Min Buffer: <span className="font-semibold text-slate-700">{formatRupiah(params.minCashBuffer)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Piutang Usaha (AR) */}
                <Card className="border-slate-200 bg-white shadow-xs">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Piutang (AR) Berjalan</span>
                            <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-50">
                                {baseline.unpaidInvoicesCount} Inv
                            </Badge>
                        </div>
                        <div className="text-lg font-black text-blue-700">
                            {formatRupiah(baseline.outstandingArTotal)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Kecepatan: <span className="font-semibold text-slate-700">DSO {params.dsoDays} Hari</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Hutang Usaha (AP) */}
                <Card className="border-slate-200 bg-white shadow-xs">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hutang (AP) Supplier</span>
                            <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-50">
                                {baseline.unpaidCreditsCount} PO
                            </Badge>
                        </div>
                        <div className="text-lg font-black text-rose-700">
                            {formatRupiah(baseline.outstandingApTotal)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Tempo PO: <span className="font-semibold text-slate-700">DPO {params.dpoDays} Hari</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Kewajiban Kas 30 Hari */}
                <Card className="border-slate-200 bg-white shadow-xs">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Beban 30 Hari</span>
                            <span className="text-[10px] text-slate-400 font-medium">Bulan ke-1</span>
                        </div>
                        <div className="text-lg font-black text-slate-900">
                            {formatRupiah(breakEven.totalFixedCashObligation)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Gaji + AP + RBL + Cicilan
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Coverage Ratio */}
                <Card className={`border-slate-200 bg-white shadow-xs ${isCoverageHealthy ? "border-emerald-200" : "border-amber-200"}`}>
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Coverage Ratio</span>
                            <Badge className={`text-[10px] ${isCoverageHealthy ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                {isCoverageHealthy ? "Aman" : "Ketat"}
                            </Badge>
                        </div>
                        <div className={`text-lg font-black ${isCoverageHealthy ? "text-emerald-700" : "text-amber-700"}`}>
                            {breakEven.current30DayCoveragePct}%
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Runway: <span className="font-semibold text-slate-700">{breakEven.cashRunwayMonths} Bulan</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
