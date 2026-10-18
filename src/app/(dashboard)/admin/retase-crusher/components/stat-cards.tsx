"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Truck, Layers, Navigation, DollarSign, Clock, CheckCircle2, HardHat } from "lucide-react"

type Props = {
    summary: {
        totalTrips: number
        totalVolumeM3: number
        totalDistanceKm: number
        totalRetaseAmount: number
        totalPaidAmount: number
        totalUnpaidAmount: number
        totalOperatorFee?: number
        totalOperatorPaid?: number
        totalOperatorUnpaid?: number
        totalOperatorVolumeM3?: number
    }
}

function formatRupiah(num: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(num || 0)
}

function formatNumber(num: number, decimals = 1): string {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(num || 0)
}

export function RetaseStatCards({ summary }: Props) {
    const totalCombinedUnpaid = (summary.totalUnpaidAmount || 0) + (summary.totalOperatorUnpaid || 0)
    const totalCombinedPaid = (summary.totalPaidAmount || 0) + (summary.totalOperatorPaid || 0)

    return (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Card 1: Total Trip */}
            <Card className="shadow-none border-slate-200 dark:border-slate-800">
                <CardContent className="p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Truck className="h-3.5 w-3.5 text-blue-600" />
                        <span>Trip Sopir DT</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {formatNumber(summary.totalTrips, 0)} <span className="text-xs font-normal text-slate-500">Rit</span>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Total Volume Produksi */}
            <Card className="shadow-none border-slate-200 dark:border-slate-800">
                <CardContent className="p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Layers className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Volume Produksi</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {formatNumber(summary.totalOperatorVolumeM3 || summary.totalVolumeM3, 1)} <span className="text-xs font-normal text-slate-500">m³</span>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Total Retase Sopir */}
            <Card className="shadow-none border-slate-200 dark:border-slate-800">
                <CardContent className="p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                        <span>Retase Sopir DT</span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                        {formatRupiah(summary.totalRetaseAmount)}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Pending: {formatRupiah(summary.totalUnpaidAmount)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Card 4: Insentif Operator Crusher */}
            <Card className="shadow-none border-slate-200 dark:border-slate-800">
                <CardContent className="p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <HardHat className="h-3.5 w-3.5" />
                        <span>Insentif Operator SC</span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-emerald-800 dark:text-emerald-300 truncate">
                        {formatRupiah(summary.totalOperatorFee || 0)}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Pending: {formatRupiah(summary.totalOperatorUnpaid || 0)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Card 5: Total Belum Dibayar (Gabungan) */}
            <Card className="shadow-none border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/60">
                <CardContent className="p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Total Belum Bayar</span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-amber-900 dark:text-amber-200 truncate">
                        {formatRupiah(totalCombinedUnpaid)}
                    </div>
                    <div className="text-[10px] text-amber-700/80">
                        Sopir + Operator
                    </div>
                </CardContent>
            </Card>

            {/* Card 6: Total Lunas (Gabungan) */}
            <Card className="shadow-none border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/60">
                <CardContent className="p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Total Sudah Lunas</span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-200 truncate">
                        {formatRupiah(totalCombinedPaid)}
                    </div>
                    <div className="text-[10px] text-emerald-700/80">
                        Sopir + Operator
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

