"use client"

import { TrendingUp } from "lucide-react"
import { formatRp } from "../formatters"
import { ScorecardData, UnitEconomicsData } from "../../types"

interface SectionCProfitabilityProps {
    scorecard: ScorecardData
    unitEconomics: UnitEconomicsData
    isDrilldownMinimized: boolean
    setIsDrilldownMinimized: (minimized: boolean) => void
    onClose: () => void
}

export function SectionCProfitability({
    scorecard,
    unitEconomics,
    isDrilldownMinimized,
    setIsDrilldownMinimized,
    onClose
}: SectionCProfitabilityProps) {
    const unitASP = scorecard.unitASP || unitEconomics.aspPerM3 || 0
    const unitCOGS = scorecard.unitDirectCostPerM3 || unitEconomics.cogsPerM3 || 0
    const unitGrossProfit = unitASP - unitCOGS

    return (
        <div className="space-y-3 pt-3 border-t-2 border-dashed border-emerald-400 font-sans">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Analisis Profitabilitas Unit per 1 m³ Beton
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsDrilldownMinimized(!isDrilldownMinimized)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                        {isDrilldownMinimized ? "▼ Buka Detail" : "▲ Minimize"}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 hover:text-slate-800 cursor-pointer"
                    >
                        ✕ Tutup
                    </button>
                </div>
            </div>

            {isDrilldownMinimized ? (
                <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                    <span>Analisis profitabilitas unit per m³ sedang disembunyikan.</span>
                    <button
                        onClick={() => setIsDrilldownMinimized(false)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded font-semibold text-[11px] shadow-xs cursor-pointer"
                    >
                        👁️ Buka / Tampilkan Rincian Detail
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-3 bg-white rounded-lg border border-emerald-200">
                        <div className="text-[10px] uppercase font-semibold text-slate-500">Harga Jual Rata-rata (ASP / m³)</div>
                        <div className="text-base font-bold text-indigo-950 mt-1">{formatRp(unitASP)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Pendapatan DPP per kubik</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                        <div className="text-[10px] uppercase font-semibold text-slate-500">Biaya Langsung / m³ (COGS)</div>
                        <div className="text-base font-bold text-red-700 mt-1">{formatRp(unitCOGS)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Bahan, BBM, Retase, Suku Cadang</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-300">
                        <div className="text-[10px] uppercase font-semibold text-emerald-800">Gross Margin per m³</div>
                        <div className="text-base font-bold text-emerald-700 mt-1">
                            {formatRp(unitGrossProfit)}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Margin: {scorecard.grossMarginPercent}%</div>
                    </div>
                </div>
            )}
        </div>
    )
}
