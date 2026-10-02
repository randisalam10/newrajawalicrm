"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { formatRp } from "../formatters"
import { MomComparisonData, ReportAlert } from "../../types"

interface MomAlertsSectionProps {
    momComparison: MomComparisonData
    alerts: ReportAlert[]
    prevPeriodLabel: string
}

export const MomAlertsSection: React.FC<MomAlertsSectionProps> = ({
    momComparison,
    alerts,
    prevPeriodLabel,
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MoM Table */}
            <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="py-3 px-4 border-b border-slate-100">
                    <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                        1.3 Perbandingan Month-over-Month (MoM)
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                        Pertumbuhan kinerja vs {prevPeriodLabel}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                            <tr>
                                <th className="py-2 px-3 text-left">Parameter</th>
                                <th className="py-2 px-3 text-right">Bulan Lalu</th>
                                <th className="py-2 px-3 text-right">Bulan Ini</th>
                                <th className="py-2 px-3 text-right">MoM %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="py-2 px-3 font-medium text-slate-700">Volume Produksi (m³)</td>
                                <td className="py-2 px-3 text-right">{momComparison.volume?.prev.toFixed(1)}</td>
                                <td className="py-2 px-3 text-right font-bold text-blue-700">{momComparison.volume?.current.toFixed(1)}</td>
                                <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                                    {(momComparison.volume?.growthPct || 0) >= 0
                                        ? `+${(momComparison.volume?.growthPct || 0).toFixed(1)}%`
                                        : `${(momComparison.volume?.growthPct || 0).toFixed(1)}%`}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 px-3 font-medium text-slate-700">Gross Revenue (Rp)</td>
                                <td className="py-2 px-3 text-right">{formatRp(momComparison.revenue?.prev || 0)}</td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRp(momComparison.revenue?.current || 0)}</td>
                                <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                                    {(momComparison.revenue?.growthPct || 0) >= 0
                                        ? `+${(momComparison.revenue?.growthPct || 0).toFixed(1)}%`
                                        : `${(momComparison.revenue?.growthPct || 0).toFixed(1)}%`}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 px-3 font-medium text-slate-700">Harga Jual (ASP / m³)</td>
                                <td className="py-2 px-3 text-right">{formatRp(momComparison.asp?.prev || 0)}</td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRp(momComparison.asp?.current || 0)}</td>
                                <td className="py-2 px-3 text-right">
                                    {(momComparison.asp?.growthPct || 0) >= 0
                                        ? `+${(momComparison.asp?.growthPct || 0).toFixed(1)}%`
                                        : `${(momComparison.asp?.growthPct || 0).toFixed(1)}%`}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 px-3 font-medium text-slate-700">Direct Cost / m³</td>
                                <td className="py-2 px-3 text-right">{formatRp(momComparison.cogs?.prev || 0)}</td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRp(momComparison.cogs?.current || 0)}</td>
                                <td className="py-2 px-3 text-right">
                                    {(momComparison.cogs?.growthPct || 0) >= 0
                                        ? `+${(momComparison.cogs?.growthPct || 0).toFixed(1)}%`
                                        : `${(momComparison.cogs?.growthPct || 0).toFixed(1)}%`}
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 px-3 font-medium text-slate-700">Gross Margin %</td>
                                <td className="py-2 px-3 text-right">{momComparison.grossMarginPct?.prev.toFixed(1)}%</td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-700">{momComparison.grossMarginPct?.current.toFixed(1)}%</td>
                                <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                                    {(momComparison.grossMarginPct?.diffPct || 0) >= 0
                                        ? `+${(momComparison.grossMarginPct?.diffPct || 0).toFixed(1)}%`
                                        : `${(momComparison.grossMarginPct?.diffPct || 0).toFixed(1)}%`}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* 1.4 Critical Alerts */}
            <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="py-3 px-4 border-b border-slate-100">
                    <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        1.4 Peringatan Dini Eksekutif (Critical Alerts)
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                        Deteksi anomali operasional lapangan otomatis
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {alerts.map((al: ReportAlert, idx: number) => (
                        <div
                            key={idx}
                            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                                al.type === "danger"
                                    ? "bg-red-50/70 border-red-200 text-red-900"
                                    : al.type === "warning"
                                    ? "bg-amber-50/70 border-amber-200 text-amber-900"
                                    : "bg-blue-50/70 border-blue-200 text-blue-900"
                            }`}
                        >
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-current" />
                            <div>
                                <div className="font-bold">{al.title}</div>
                                <div className="text-[11px] opacity-90 mt-0.5">{al.message}</div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
