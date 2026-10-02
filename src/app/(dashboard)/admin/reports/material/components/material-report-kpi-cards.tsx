"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Layers, Truck, TrendingUp, ArrowUpRight } from "lucide-react"
import { fmt, fmtNum } from "../helpers"
import { MaterialReportKPIs } from "../types"

interface MaterialReportKpiCardsProps {
    kpis: MaterialReportKPIs
}

export function MaterialReportKpiCards({ kpis }: MaterialReportKpiCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* KPI 1: Grand Total Landed Cost */}
            <Card className="border-blue-200/80 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/20 shadow-2xs">
                <CardContent className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                            Grand Total Landed Cost
                        </span>
                        <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0">
                            Pokok + Retase
                        </Badge>
                    </div>
                    <div className="text-xl font-extrabold font-mono text-blue-950">
                        {fmt(kpis.grandTotalLandedCost)}
                    </div>
                    <div className="text-[10px] text-blue-700/80 font-medium">
                        Total beban biaya riil material tiba di plant
                    </div>
                </CardContent>
            </Card>

            {/* KPI 2: Total Nilai Pokok Material */}
            <Card className="border-slate-200/80 bg-white shadow-2xs">
                <CardContent className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                            Nilai Pokok Material
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-500">
                            {kpis.grandTotalLandedCost > 0
                                ? ((kpis.totalIncomingMaterialCost / kpis.grandTotalLandedCost) * 100).toFixed(1)
                                : 0}%
                        </span>
                    </div>
                    <div className="text-xl font-extrabold font-mono text-slate-900">
                        {fmt(kpis.totalIncomingMaterialCost)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                        Volume: <strong className="text-slate-800">{fmtNum(kpis.totalIncomingVolume, 1)} m³</strong> ({kpis.incomingCount} transaksi)
                    </div>
                </CardContent>
            </Card>

            {/* KPI 3: Total Ongkos Retase DT */}
            <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 shadow-2xs">
                <CardContent className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-amber-600" />
                            Ongkos Retase DT
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-amber-700">
                            {kpis.grandTotalLandedCost > 0
                                ? ((kpis.totalIncomingRetaseCost / kpis.grandTotalLandedCost) * 100).toFixed(1)
                                : 0}%
                        </span>
                    </div>
                    <div className="text-xl font-extrabold font-mono text-amber-950">
                        {fmt(kpis.totalIncomingRetaseCost)}
                    </div>
                    <div className="text-[10px] text-amber-800/80 font-mono">
                        Rata-rata:{" "}
                        <strong className="text-amber-950">
                            {fmt(
                                kpis.totalIncomingVolume > 0
                                    ? kpis.totalIncomingRetaseCost / kpis.totalIncomingVolume
                                    : 0
                            )}
                        </strong>{" "}
                        / m³
                    </div>
                </CardContent>
            </Card>

            {/* KPI 4: Rata-rata Landed Cost per m3 */}
            <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 shadow-2xs">
                <CardContent className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            Landed Cost / m³
                        </span>
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-800 border-emerald-200">
                            Rata-rata Riil
                        </Badge>
                    </div>
                    <div className="text-xl font-extrabold font-mono text-emerald-950">
                        {fmt(kpis.avgLandedCostPerM3)}
                    </div>
                    <div className="text-[10px] text-emerald-800/80 font-mono">
                        Pokok: {fmt(kpis.avgMaterialUnitPrice)} + Retase:{" "}
                        {fmt(
                            kpis.totalIncomingVolume > 0
                                ? kpis.totalIncomingRetaseCost / kpis.totalIncomingVolume
                                : 0
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* KPI 5: Komparasi Material Keluar */}
            <Card className="border-rose-200/80 bg-gradient-to-br from-rose-50/50 via-white to-rose-50/20 shadow-2xs">
                <CardContent className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                            Pengeluaran Material
                        </span>
                        <span className="text-[10px] font-mono text-rose-600">
                            {kpis.outgoingCount} bon keluar
                        </span>
                    </div>
                    <div className="text-xl font-extrabold font-mono text-rose-950">
                        {fmt(kpis.totalOutgoingValue)}
                    </div>
                    <div className="text-[10px] text-rose-800/80 font-mono">
                        Volume: <strong className="text-rose-950">{fmtNum(kpis.totalOutgoingVolume, 1)} m³</strong>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
