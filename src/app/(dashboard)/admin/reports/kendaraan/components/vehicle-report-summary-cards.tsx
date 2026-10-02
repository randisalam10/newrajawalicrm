"use client"

import React from "react"
import { Truck, Fuel, Layers, Wrench, DollarSign, Tag } from "lucide-react"
import { fmt, fmtNum } from "../helpers"
import { OverallSummary } from "../types"

interface VehicleReportSummaryCardsProps {
    overall: OverallSummary
    activeLocationName: string
}

export function VehicleReportSummaryCards({
    overall,
    activeLocationName,
}: VehicleReportSummaryCardsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x border border-slate-200 bg-white rounded-lg shadow-2xs overflow-hidden">
            {/* 1. Total Armada & Alat */}
            <div className="p-3 sm:p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                    <Truck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Total Armada & Alat
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 font-mono leading-tight mt-0.5">
                        {overall.totalVehicles || 0}
                        <span className="text-xs font-normal text-slate-500 ml-1">Unit</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        📍 {activeLocationName}
                    </div>
                </div>
            </div>

            {/* 2. Konsumsi BBM */}
            <div className="p-3 sm:p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                    <Fuel className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Konsumsi BBM / Solar
                    </div>
                    <div className="text-base sm:text-lg font-bold text-amber-700 font-mono leading-tight mt-0.5">
                        {fmtNum(overall.totalFuelLiters || 0)}
                        <span className="text-xs font-normal text-slate-500 ml-1">Liter</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Biaya: <span className="font-semibold text-slate-700">{fmt(overall.totalFuelCost || 0)}</span>
                    </div>
                </div>
            </div>

            {/* 3. Ritase & Volume Cor */}
            <div className="p-3 sm:p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                    <Layers className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Ritase & Volume Cor
                    </div>
                    <div className="text-base sm:text-lg font-bold text-indigo-700 font-mono leading-tight mt-0.5">
                        {overall.totalTrips || 0}
                        <span className="text-xs font-normal text-slate-500 ml-1">Rit</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Volume: <span className="font-semibold text-slate-700">{fmtNum(overall.totalVolume || 0, 1)} m³</span>
                    </div>
                </div>
            </div>

            {/* 4. Suku Cadang & Alat PO */}
            <div className="p-3 sm:p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                    <Wrench className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Suku Cadang & PO
                    </div>
                    <div className="text-base sm:text-lg font-bold text-purple-700 font-mono leading-tight mt-0.5 truncate">
                        {fmt(overall.totalSparepartCost || 0)}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {overall.totalPoItems || 0} Pengadaan item PO
                    </div>
                </div>
            </div>

            {/* 5. Total Biaya Operasional / TCO */}
            <div className="p-3 sm:p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                    <DollarSign className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Total Biaya (TCO)
                    </div>
                    <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono leading-tight mt-0.5 truncate">
                        {fmt(overall.grandTotalCost || overall.totalCost || 0)}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        RBL ({fmt(overall.totalCost || 0)}) + PO
                    </div>
                </div>
            </div>

            {/* 6. Pendapatan Sewa Unit */}
            <div className="p-3 sm:p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                    <Tag className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Pendapatan Sewa
                    </div>
                    <div className="text-base sm:text-lg font-bold text-teal-700 font-mono leading-tight mt-0.5 truncate">
                        {fmt(overall.totalRentalRevenue || 0)}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {overall.totalRentalDays || 0} Hari ({overall.totalSewaCount || 0} Sewa)
                    </div>
                </div>
            </div>
        </div>
    )
}
