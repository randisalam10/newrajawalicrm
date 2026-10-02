"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table"
import { Truck, ChevronRight } from "lucide-react"
import { fmt, fmtNum, getCategoryBadgeClass } from "../helpers"
import { VehicleAnalyticsItem } from "../types"

interface VehicleMasterTableProps {
    filteredAnalytics: VehicleAnalyticsItem[]
    selectedVehicleId: string
    onSelectVehicle: (id: string) => void
    onShowAll: () => void
}

export function VehicleMasterTable({
    filteredAnalytics,
    selectedVehicleId,
    onSelectVehicle,
    onShowAll,
}: VehicleMasterTableProps) {
    return (
        <div className="border border-slate-200 rounded-lg bg-white shadow-2xs overflow-hidden print:border-none print:shadow-none">
            {/* Header */}
            <div className="p-2.5 sm:px-3.5 sm:py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-row items-center justify-between gap-2">
                <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-blue-600" />
                        <span>Rekapitulasi Performa Seluruh Armada ({filteredAnalytics.length} Unit)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 hidden sm:block">
                        Klik baris armada untuk melihat rincian log operasional, BBM, dan ritase secara mendalam.
                    </p>
                </div>
                {selectedVehicleId !== "all" && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onShowAll}
                        className="h-6 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 cursor-pointer"
                    >
                        Tampilkan Semua
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/80 text-[11px]">
                        <TableRow className="h-7">
                            <TableHead className="w-9 text-center">#</TableHead>
                            <TableHead className="w-24">Kode Unit</TableHead>
                            <TableHead className="w-28">No. Plat / Seri</TableHead>
                            <TableHead className="w-36">Kategori Kendaraan / Alat</TableHead>
                            <TableHead className="w-16 text-center">Meter</TableHead>
                            <TableHead className="w-28">Cabang</TableHead>
                            <TableHead className="text-right w-20">Solar (L)</TableHead>
                            <TableHead className="text-right w-24">Biaya BBM</TableHead>
                            <TableHead className="text-right w-24">Biaya RBL</TableHead>
                            <TableHead className="text-right w-28 text-slate-700 font-semibold">Suku Cadang (PO)</TableHead>
                            <TableHead className="text-right w-28 font-bold text-emerald-800">Total Biaya (TCO)</TableHead>
                            <TableHead className="text-right w-28 text-teal-700 font-semibold">Pendapatan Sewa</TableHead>
                            <TableHead className="text-right w-28 font-bold text-slate-800">Profit Bersih</TableHead>
                            <TableHead className="text-right w-24">KM / HM Range</TableHead>
                            <TableHead className="text-right w-24">Jarak / Jam</TableHead>
                            <TableHead className="text-right w-16">Rit</TableHead>
                            <TableHead className="text-right w-20">Volume (m³)</TableHead>
                            <TableHead className="text-right w-16">L/m³</TableHead>
                            <TableHead className="w-8 text-center"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                        {filteredAnalytics.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={19} className="py-8 text-center text-slate-400 italic">
                                    Tidak ada data armada yang sesuai dengan kriteria filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAnalytics.map((va: VehicleAnalyticsItem, idx: number) => {
                                const v = va.vehicle
                                const s = va.stats
                                const isSelected = selectedVehicleId === v.id
                                const categoryName = v.category?.name || v.vehicle_type || ""
                                const isHM = (v.meter_type || "").toUpperCase() === "HM"

                                return (
                                    <TableRow
                                        key={v.id}
                                        onClick={() => onSelectVehicle(isSelected ? "all" : v.id)}
                                        className={`cursor-pointer transition-colors h-8 ${
                                            isSelected
                                                ? "bg-blue-50/90 hover:bg-blue-50 font-medium"
                                                : "hover:bg-slate-50/70"
                                        }`}
                                    >
                                        <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900 font-mono py-1">
                                            {v.code}
                                        </TableCell>
                                        <TableCell className="font-mono text-slate-700 py-1">
                                            {v.plate_number}
                                        </TableCell>
                                        <TableCell className="py-1">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClass(
                                                    categoryName
                                                )}`}
                                            >
                                                {categoryName}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center py-1">
                                            <span
                                                className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold border ${
                                                    isHM
                                                        ? "bg-amber-50 text-amber-800 border-amber-300"
                                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                                }`}
                                            >
                                                {isHM ? "HM" : "KM"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-600 py-1 truncate max-w-[120px]">
                                            {v.location?.name || "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-amber-800 py-1">
                                            {s.fuelLiters > 0 ? `${fmtNum(s.fuelLiters)} L` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-700 py-1">
                                            {s.fuelCost > 0 ? fmt(s.fuelCost) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-800 py-1">
                                            {fmt(s.totalCost)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-900 font-semibold py-1">
                                            {s.sparepartCost && s.sparepartCost > 0 ? fmt(s.sparepartCost) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-emerald-700 py-1">
                                            {fmt(s.grandTotalCost || s.totalCost)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-teal-700 font-semibold py-1">
                                            {s.rentalRevenue && s.rentalRevenue > 0 ? (
                                                <div>
                                                    <div>{fmt(s.rentalRevenue)}</div>
                                                    <div className="text-[10px] text-slate-400 font-normal">{s.rentalDays} Hari</div>
                                                </div>
                                            ) : v.is_for_rent ? (
                                                <span className="text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                    Unit Sewa
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-mono font-bold py-1 ${
                                                v.is_for_rent || (s.rentalRevenue && s.rentalRevenue > 0)
                                                    ? (s.netProfit || 0) >= 0
                                                        ? "text-emerald-700"
                                                        : "text-rose-600"
                                                    : "text-slate-400 font-normal"
                                            }`}
                                        >
                                            {v.is_for_rent || (s.rentalRevenue && s.rentalRevenue > 0) ? fmt(s.netProfit || 0) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-[11px] text-slate-500 py-1">
                                            {s.minKm !== null && s.maxKm !== null ? `${fmtNum(s.minKm)} - ${fmtNum(s.maxKm)}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-blue-700 font-semibold py-1">
                                            {s.kmDistance > 0 ? `${fmtNum(s.kmDistance)} ${isHM ? "HM" : "KM"}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono py-1">
                                            {s.totalTrips > 0 ? `${s.totalTrips}x` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-slate-800 py-1">
                                            {s.totalVolume > 0 ? `${fmtNum(s.totalVolume, 1)} m³` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-amber-700 font-semibold py-1">
                                            {s.fuelPerCubic > 0 ? s.fuelPerCubic.toFixed(2) : "-"}
                                        </TableCell>
                                        <TableCell className="text-center text-slate-400 py-1">
                                            <ChevronRight
                                                className={`h-3.5 w-3.5 transition-transform ${
                                                    isSelected ? "rotate-90 text-blue-600" : ""
                                                }`}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                    {filteredAnalytics.length > 0 && (
                        <TableFooter className="bg-slate-50/90 font-semibold text-xs">
                            <TableRow className="h-8">
                                <TableCell colSpan={6} className="text-right text-slate-700">
                                    Total Rekapitulasi ({filteredAnalytics.length} Unit):
                                </TableCell>
                                <TableCell className="text-right font-mono text-amber-800 font-bold">
                                    {fmtNum(filteredAnalytics.reduce((s: number, va: any) => s + va.stats.fuelLiters, 0))} L
                                </TableCell>
                                <TableCell className="text-right font-mono text-slate-800">
                                    {fmt(filteredAnalytics.reduce((s: number, va: any) => s + va.stats.fuelCost, 0))}
                                </TableCell>
                                <TableCell className="text-right font-mono text-slate-800">
                                    {fmt(filteredAnalytics.reduce((s: number, va: any) => s + va.stats.totalCost, 0))}
                                </TableCell>
                                <TableCell className="text-right font-mono text-slate-900 font-bold">
                                    {fmt(filteredAnalytics.reduce((s: number, va: any) => s + (va.stats.sparepartCost || 0), 0))}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-emerald-700">
                                    {fmt(
                                        filteredAnalytics.reduce(
                                            (s: number, va: any) => s + (va.stats.grandTotalCost || va.stats.totalCost),
                                            0
                                        )
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-mono text-teal-700 font-bold">
                                    {fmt(filteredAnalytics.reduce((s: number, va: any) => s + (va.stats.rentalRevenue || 0), 0))}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-slate-900">
                                    {fmt(filteredAnalytics.reduce((s: number, va: any) => s + (va.stats.netProfit || 0), 0))}
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-right font-mono text-blue-700 font-bold">
                                    {fmtNum(filteredAnalytics.reduce((s: number, va: any) => s + va.stats.kmDistance, 0))}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold">
                                    {filteredAnalytics.reduce((s: number, va: any) => s + va.stats.totalTrips, 0)}x
                                </TableCell>
                                <TableCell className="text-right font-mono text-slate-800 font-bold">
                                    {fmtNum(filteredAnalytics.reduce((s: number, va: any) => s + va.stats.totalVolume, 0), 1)} m³
                                </TableCell>
                                <TableCell colSpan={2}></TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>
        </div>
    )
}
