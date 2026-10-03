"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    SimulatorScenarioParams
} from "../../types"
import { formatRupiah, formatNumber } from "../../utils/cashflow-math"
import { Sliders, RotateCcw } from "lucide-react"

interface ScenarioControlsProps {
    params: SimulatorScenarioParams
    onUpdateParam: <K extends keyof SimulatorScenarioParams>(key: K, val: SimulatorScenarioParams[K]) => void
    onApplyPreset: (preset: "BASE" | "CONSERVATIVE" | "OPTIMISTIC") => void
    onReset: () => void
}

export function ScenarioControls({
    params,
    onUpdateParam,
    onApplyPreset,
    onReset
}: ScenarioControlsProps) {
    return (
        <Card className="border-slate-200 bg-white shadow-xs w-full">
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-bold text-slate-800">
                        Kontrol Parameter Skenario &amp; Simulasi What-If
                    </CardTitle>
                    <Badge variant="outline" className="text-xs font-semibold ml-2">
                        {params.scenarioName}
                    </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                    <Button
                        size="sm"
                        variant={params.scenarioName === "BASE" ? "default" : "outline"}
                        className={`h-7 text-xs px-2.5 ${params.scenarioName === "BASE" ? "bg-slate-800 text-white" : ""}`}
                        onClick={() => onApplyPreset("BASE")}
                    >
                        Base Case
                    </Button>
                    <Button
                        size="sm"
                        variant={params.scenarioName === "CONSERVATIVE" ? "default" : "outline"}
                        className={`h-7 text-xs px-2.5 ${params.scenarioName === "CONSERVATIVE" ? "bg-amber-600 text-white" : "text-amber-800 border-amber-200"}`}
                        onClick={() => onApplyPreset("CONSERVATIVE")}
                    >
                        Konservatif (-20%)
                    </Button>
                    <Button
                        size="sm"
                        variant={params.scenarioName === "OPTIMISTIC" ? "default" : "outline"}
                        className={`h-7 text-xs px-2.5 ${params.scenarioName === "OPTIMISTIC" ? "bg-emerald-600 text-white" : "text-emerald-800 border-emerald-200"}`}
                        onClick={() => onApplyPreset("OPTIMISTIC")}
                    >
                        Optimis (+25%)
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-2 text-slate-500 hover:text-slate-800"
                        onClick={onReset}
                        title="Reset ke Nilai Dasar"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Target Volume Produksi */}
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Volume Produksi Bulanan</span>
                        <span className="font-black text-blue-700 text-sm">{formatNumber(params.targetMonthlyVolume)} m³</span>
                    </div>
                    <input
                        type="range"
                        min="100"
                        max="1500"
                        step="25"
                        value={params.targetMonthlyVolume}
                        onChange={(e) => onUpdateParam("targetMonthlyVolume", Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                        <span>100 m³</span>
                        <span>500 m³ (Standar)</span>
                        <span>1.500 m³</span>
                    </div>
                </div>

                {/* 2. Rata-rata Harga Jual (ASP) */}
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Rata-rata Harga Jual (ASP / m³)</span>
                        <span className="font-black text-slate-900 text-sm">{formatRupiah(params.aspPerM3)}</span>
                    </div>
                    <input
                        type="range"
                        min="1500000"
                        max="2500000"
                        step="25000"
                        value={params.aspPerM3}
                        onChange={(e) => onUpdateParam("aspPerM3", Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Rp 1,5 Jt</span>
                        <span>Rp 2,0 Jt (Target)</span>
                        <span>Rp 2,5 Jt</span>
                    </div>
                </div>

                {/* 3. Kecepatan Penagihan Piutang (DSO) */}
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Masa Penagihan Piutang (DSO)</span>
                        <Badge variant="secondary" className="font-bold text-xs bg-blue-100 text-blue-800">
                            {params.dsoDays} Hari
                        </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {[15, 30, 45, 60].map((days) => (
                            <Button
                                key={days}
                                type="button"
                                size="sm"
                                variant={params.dsoDays === days ? "default" : "outline"}
                                className={`h-7 text-xs ${params.dsoDays === days ? "bg-blue-600 text-white" : "text-slate-600"}`}
                                onClick={() => onUpdateParam("dsoDays", days)}
                            >
                                {days} H
                            </Button>
                        ))}
                    </div>
                    <div className="text-[10px] text-slate-400">
                        {params.dsoDays === 15 ? "Penagihan cepat / tunai" : params.dsoDays === 30 ? "Standar jatuh tempo 1 bulan" : "Risiko keterlambatan pembayaran"}
                    </div>
                </div>

                {/* 4. Biaya Pokok Variabel (COGS / m³) */}
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Biaya Pokok Variabel / m³</span>
                        <span className="font-bold text-rose-700 text-xs">{formatRupiah(params.variableCogsPerM3)}</span>
                    </div>
                    <input
                        type="range"
                        min="500000"
                        max="850000"
                        step="10000"
                        value={params.variableCogsPerM3}
                        onChange={(e) => onUpdateParam("variableCogsPerM3", Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Rp 500 Rb</span>
                        <span>Rp 630 Rb (Standar)</span>
                        <span>Rp 850 Rb</span>
                    </div>
                </div>

                {/* 5. Kenaikan Payroll & Biaya Lapangan */}
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Kenaikan Gaji (Payroll Growth)</span>
                        <span className="font-bold text-slate-800 text-xs">+{params.payrollGrowthPct}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {[0, 5, 10].map((pct) => (
                            <Button
                                key={pct}
                                type="button"
                                size="sm"
                                variant={params.payrollGrowthPct === pct ? "default" : "outline"}
                                className={`h-7 text-xs ${params.payrollGrowthPct === pct ? "bg-slate-800 text-white" : "text-slate-600"}`}
                                onClick={() => onUpdateParam("payrollGrowthPct", pct)}
                            >
                                +{pct}%
                            </Button>
                        ))}
                    </div>
                    <div className="text-[10px] text-slate-400">
                        Uji sensitivitas jika ada penambahan operator / regu lembur
                    </div>
                </div>

                {/* 6. Cadangan Pajak Bulanan */}
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Cadangan Pajak Bulanan</span>
                        <span className="font-bold text-slate-800 text-xs">{formatRupiah(params.monthlyTaxReserve)}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="30000000"
                        step="2500000"
                        value={params.monthlyTaxReserve}
                        onChange={(e) => onUpdateParam("monthlyTaxReserve", Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Rp 0</span>
                        <span>Rp 10 Jt (Rekomendasi)</span>
                        <span>Rp 30 Jt</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
