"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { formatRp } from "../formatters"
import { ScorecardData } from "../../types"

interface NetContributionBannerProps {
    scorecard: ScorecardData
}

export const NetContributionBanner: React.FC<NetContributionBannerProps> = ({ scorecard }) => {
    const isSurplus = (scorecard.netFieldContribution || 0) >= 0
    const netMarginPct = ((scorecard.netFieldContribution / (scorecard.totalDppRevenue || 1)) * 100).toFixed(2)
    const perM3 = scorecard.productionVolumeM3 > 0
        ? Math.round(scorecard.netFieldContribution / scorecard.productionVolumeM3)
        : 0

    return (
        <div className={`mt-4 rounded-xl p-4 shadow-2xs border transition-colors space-y-3.5 ${
            isSurplus
                ? "bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/50 border-emerald-200"
                : "bg-gradient-to-r from-rose-50/80 via-white to-red-50/60 border-rose-300"
        }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg border shadow-2xs ${
                        isSurplus
                            ? "bg-emerald-100/80 text-emerald-700 border-emerald-300"
                            : "bg-rose-100/90 text-rose-700 border-rose-300"
                    }`}>
                        {isSurplus ? (
                            <TrendingUp className="w-5 h-5" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-rose-700" />
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2">
                            E. KONTRIBUSI BERSIH OPERASIONAL LAPANGAN (E = C - D)
                        </h4>
                        <p className="text-[11px] text-slate-600">
                            Laba Bersih Operasional Unit Batching Plant setelah dikurangi Biaya Pokok Langsung (COGS) dan Biaya Overhead Operasional Lapangan
                        </p>
                    </div>
                </div>
                <Badge className={`px-3 py-1 text-xs font-bold shadow-2xs ${
                    isSurplus
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-rose-600 hover:bg-rose-700 text-white"
                }`}>
                    {isSurplus ? "✓ SURPLUS / LABA OPERASIONAL" : "⚠ DEFISIT OPERASIONAL"}
                </Badge>
            </div>

            {/* Kalkulasi Step-by-Step E = C - D */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-0.5">
                {/* Step 1: Laba Kotor (C) */}
                <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-2xs flex flex-col justify-between">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        1. Laba Kotor Usaha (C)
                    </div>
                    <div className="text-base font-extrabold text-emerald-700 font-mono mt-1">
                        {formatRp(scorecard.grossProfit)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                        Margin: <strong className="text-slate-700">{scorecard.grossMarginPercent}%</strong> dari DPP
                    </div>
                </div>

                {/* Step 2: Beban Overhead & Amortisasi (D) */}
                <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-2xs flex flex-col justify-between">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        2. Beban Overhead Cabang (D)
                    </div>
                    <div className="text-base font-extrabold text-rose-600 font-mono mt-1">
                        -{formatRp((scorecard.rblOpex || 0) + (scorecard.totalAmortizationMonthly || 0))}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                        Kas RBL Opex + Amortisasi Tetap
                    </div>
                </div>

                {/* Step 3: Hasil Bersih (E = C - D) */}
                <div className={`border-2 rounded-lg p-3 md:col-span-2 flex flex-col justify-between shadow-xs ${
                    isSurplus
                        ? "bg-emerald-50/90 border-emerald-400/80"
                        : "bg-rose-50/90 border-rose-400/80"
                }`}>
                    <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                            isSurplus ? "text-emerald-900" : "text-rose-900"
                        }`}>
                            3. Hasil Bersih Operasional (E = C - D)
                        </span>
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                            isSurplus
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}>
                            Net Margin: {netMarginPct}%
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-2 gap-2">
                        <span className={`text-2xl font-black font-mono tracking-tight ${
                            isSurplus ? "text-emerald-700" : "text-rose-600"
                        }`}>
                            {formatRp(scorecard.netFieldContribution)}
                        </span>
                        {scorecard.productionVolumeM3 > 0 && (
                            <span className={`text-xs font-bold px-2.5 py-1 rounded border shadow-2xs font-mono ${
                                isSurplus
                                    ? "bg-white text-emerald-800 border-emerald-200"
                                    : "bg-white text-rose-700 border-rose-200"
                            }`}>
                                {formatRp(perM3)} / m³
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
