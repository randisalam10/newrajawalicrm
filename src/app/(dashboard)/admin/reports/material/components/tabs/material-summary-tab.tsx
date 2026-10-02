"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { PieChart, ShieldCheck } from "lucide-react"
import { fmt, fmtNum } from "../../helpers"
import { MaterialReportKPIs, MaterialSummaryItem } from "../../types"

interface MaterialSummaryTabProps {
    byMaterial: MaterialSummaryItem[]
    kpis: MaterialReportKPIs
}

export function MaterialSummaryTab({ byMaterial, kpis }: MaterialSummaryTabProps) {
    return (
        <div className="space-y-4">
            <Card className="border-slate-200/80 shadow-2xs">
                <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                            <PieChart className="w-4 h-4 text-blue-600" />
                            Matriks Akumulasi Biaya & Retase per Jenis Material
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">
                            Rincian volume kubikasi riil, nilai pokok material, beban ongkos retase Dump Truck, dan biaya mendarat per m³
                        </CardDescription>
                    </div>
                </CardHeader>

                <div className="overflow-x-auto">
                    <Table className="text-xs">
                        <TableHeader className="bg-slate-50 text-[11px]">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700">Jenis Material</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Volume Masuk (m³)</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Rata-rata Pokok (Rp/m³)</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Total Nilai Pokok (Rp)</TableHead>
                                <TableHead className="text-right font-semibold text-amber-800">Total Retase DT (Rp)</TableHead>
                                <TableHead className="text-right font-bold text-blue-900 bg-blue-50/50">Total Landed Cost (Rp)</TableHead>
                                <TableHead className="text-right font-bold text-emerald-800 bg-emerald-50/40">Biaya Riil / m³</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Porsi (%)</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Keluar (m³)</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Net Stok (m³)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {byMaterial.map((m: MaterialSummaryItem) => {
                                const isPasir = m.code === "PASIR"
                                const isSplit = m.code.includes("SPLIT")
                                return (
                                    <TableRow key={m.code} className="hover:bg-slate-50/80">
                                        <TableCell className="font-semibold text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-bold ${
                                                        isPasir
                                                            ? "bg-amber-50 text-amber-800 border-amber-300"
                                                            : isSplit
                                                            ? "bg-blue-50 text-blue-800 border-blue-300"
                                                            : "bg-slate-50 text-slate-700 border-slate-300"
                                                    }`}
                                                >
                                                    {m.code}
                                                </Badge>
                                                <span>{m.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-slate-900">
                                            {fmtNum(m.volume_cubic, 2)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-700">
                                            {fmt(m.avg_unit_price)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-slate-900">
                                            {fmt(m.material_cost)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-amber-900 font-semibold">
                                            {fmt(m.retase_cost)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-extrabold text-blue-900 bg-blue-50/30">
                                            {fmt(m.landed_cost)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-emerald-800 bg-emerald-50/30">
                                            {fmt(m.avg_landed_per_m3)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span>{m.pct_of_total.toFixed(1)}%</span>
                                                <div className="w-12 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 rounded-full"
                                                        style={{ width: `${Math.min(100, m.pct_of_total)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-rose-700">
                                            {fmtNum(m.outgoing_volume, 2)}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-mono font-bold ${
                                                m.net_volume >= 0 ? "text-emerald-700" : "text-rose-700"
                                            }`}
                                        >
                                            {m.net_volume > 0 ? "+" : ""}{fmtNum(m.net_volume, 2)}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                        <TableFooter className="bg-slate-100/90 font-bold text-xs">
                            <TableRow>
                                <TableCell>TOTAL AKUMULASI</TableCell>
                                <TableCell className="text-right font-mono">{fmtNum(kpis.totalIncomingVolume, 2)} m³</TableCell>
                                <TableCell className="text-right font-mono">{fmt(kpis.avgMaterialUnitPrice)}</TableCell>
                                <TableCell className="text-right font-mono">{fmt(kpis.totalIncomingMaterialCost)}</TableCell>
                                <TableCell className="text-right font-mono text-amber-900">{fmt(kpis.totalIncomingRetaseCost)}</TableCell>
                                <TableCell className="text-right font-mono text-blue-950 font-extrabold">{fmt(kpis.grandTotalLandedCost)}</TableCell>
                                <TableCell className="text-right font-mono text-emerald-900 font-extrabold">{fmt(kpis.avgLandedCostPerM3)}</TableCell>
                                <TableCell className="text-right font-mono">100.0%</TableCell>
                                <TableCell className="text-right font-mono text-rose-700">{fmtNum(kpis.totalOutgoingVolume, 2)}</TableCell>
                                <TableCell className="text-right font-mono text-emerald-800">
                                    {fmtNum(kpis.totalIncomingVolume - kpis.totalOutgoingVolume, 2)}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </Card>

            {/* Explanatory Analysis Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        Formulasi Perhitungan Biaya Mendarat (Landed Cost)
                    </span>
                    <p className="text-xs text-blue-950 leading-relaxed">
                        <strong>Landed Cost</strong> adalah total biaya riil pengadaan material hingga sampai di Batching Plant:
                    </p>
                    <div className="p-2.5 rounded-lg bg-white/80 border border-blue-200/80 font-mono text-xs text-blue-900 space-y-1">
                        <div>• Total Landed Cost = Nilai Pokok Material + Ongkos Retase DT</div>
                        <div>• Biaya Riil per m³ = Total Landed Cost ÷ Total Volume (m³)</div>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <PieChart className="w-4 h-4 text-slate-600" />
                        Komposisi Pengeluaran Material
                    </span>
                    <div className="space-y-2 pt-1 text-xs">
                        <div>
                            <div className="flex justify-between font-semibold text-slate-700 mb-1">
                                <span>Beban Bahan Pokok Material</span>
                                <span>
                                    {kpis.grandTotalLandedCost > 0
                                        ? ((kpis.totalIncomingMaterialCost / kpis.grandTotalLandedCost) * 100).toFixed(1)
                                        : 0}%
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{
                                        width: `${
                                            kpis.grandTotalLandedCost > 0
                                                ? (kpis.totalIncomingMaterialCost / kpis.grandTotalLandedCost) * 100
                                                : 0
                                        }%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between font-semibold text-slate-700 mb-1">
                                <span>Beban Ongkos Retase Dump Truck</span>
                                <span>
                                    {kpis.grandTotalLandedCost > 0
                                        ? ((kpis.totalIncomingRetaseCost / kpis.grandTotalLandedCost) * 100).toFixed(1)
                                        : 0}%
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full"
                                    style={{
                                        width: `${
                                            kpis.grandTotalLandedCost > 0
                                                ? (kpis.totalIncomingRetaseCost / kpis.grandTotalLandedCost) * 100
                                                : 0
                                        }%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
