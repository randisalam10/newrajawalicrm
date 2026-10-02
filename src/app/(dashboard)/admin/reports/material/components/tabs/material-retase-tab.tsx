"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Truck } from "lucide-react"
import { fmt, fmtNum } from "../../helpers"
import { DriverRetaseItem, SourceSummaryItem } from "../../types"

interface MaterialRetaseTabProps {
    bySource: SourceSummaryItem[]
    byDriver: DriverRetaseItem[]
}

export function MaterialRetaseTab({ bySource, byDriver }: MaterialRetaseTabProps) {
    return (
        <div className="space-y-4">
            {/* Source Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bySource.map((s: SourceSummaryItem) => {
                    const isInternal = s.source_type === "Internal"
                    return (
                        <Card
                            key={s.source_type}
                            className={`border ${
                                isInternal ? "border-emerald-200 bg-emerald-50/20" : "border-indigo-200 bg-indigo-50/20"
                            } shadow-2xs`}
                        >
                            <CardContent className="p-4 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                        <span
                                            className={`w-2.5 h-2.5 rounded-full ${
                                                isInternal ? "bg-emerald-500" : "bg-indigo-500"
                                            }`}
                                        ></span>
                                        {s.label}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                        {s.count} transaksi
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                                    <div>
                                        <div className="text-[10px] text-slate-400">Total Volume</div>
                                        <div className="text-sm font-bold font-mono text-slate-800">
                                            {fmtNum(s.volume_cubic, 2)} m³
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400">Biaya Pokok</div>
                                        <div className="text-sm font-bold font-mono text-slate-800">
                                            {fmt(s.material_cost)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-amber-700">Retase DT</div>
                                        <div className="text-sm font-bold font-mono text-amber-800">
                                            {fmt(s.retase_cost)}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-600">Landed Cost:</span>
                                    <span className="font-extrabold font-mono text-slate-900">
                                        {fmt(s.landed_cost)} ({fmt(s.avg_landed_per_m3)}/m³)
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Driver & Dump Truck Retase Table */}
            <Card className="border-slate-200/80 shadow-2xs">
                <CardHeader className="p-4 pb-2 border-b border-slate-100">
                    <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-amber-600" />
                        Rekapitulasi Komisi Retase per Sopir Dump Truck
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                        Akumulasi jumlah trip pengangkutan (rit), kubikasi material, dan komisi retase sopir Dump Truck internal
                    </CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table className="text-xs">
                        <TableHeader className="bg-slate-50 text-[11px]">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700">Nama Sopir Dump Truck</TableHead>
                                <TableHead className="font-semibold text-slate-700">Plat DT</TableHead>
                                <TableHead className="font-semibold text-slate-700">Ukuran DT</TableHead>
                                <TableHead className="text-center font-semibold text-slate-700">Jumlah Rit</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Total Kubikasi (m³)</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Nilai Material Diangkut</TableHead>
                                <TableHead className="text-right font-bold text-amber-900 bg-amber-50/50">Total Retase (Rp)</TableHead>
                                <TableHead className="text-right font-semibold text-emerald-700">Sudah Lunas (Rp)</TableHead>
                                <TableHead className="text-right font-semibold text-rose-700">Belum Dibayar (Rp)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {byDriver.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-6 text-slate-400 italic">
                                        Tidak ada data retase supir Dump Truck pada periode ini.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                byDriver.map((d: DriverRetaseItem) => (
                                    <TableRow key={d.driver_name} className="hover:bg-slate-50/80">
                                        <TableCell className="font-semibold text-slate-900">
                                            {d.driver_name}
                                        </TableCell>
                                        <TableCell className="font-mono text-slate-600">
                                            {d.plate_number}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                {d.dump_truck_size}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-mono font-semibold">
                                            {d.trip_count} rit
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-slate-900">
                                            {fmtNum(d.volume_cubic, 2)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-700">
                                            {fmt(d.material_cost)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-extrabold text-amber-950 bg-amber-50/30">
                                            {fmt(d.retase_cost)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-emerald-700">
                                            {fmt(d.paid_retase)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-rose-700">
                                            {fmt(d.unpaid_retase)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
