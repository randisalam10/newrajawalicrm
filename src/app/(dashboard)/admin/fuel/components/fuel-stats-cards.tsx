"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FuelLogStats } from "../types"
import { Fuel, DollarSign, Wallet, Building2 } from "lucide-react"

interface Props {
    stats: FuelLogStats
}

export function FuelStatsCards({ stats }: Props) {
    const formatRp = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val || 0)
    }

    const formatNum = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            maximumFractionDigits: 1,
        }).format(val || 0)
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Card 1: Total Volume */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <CardContent className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Total Konsumsi</span>
                        <Fuel className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {formatNum(stats.totalLiters)} <span className="text-xs font-normal text-slate-500">L</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                        {stats.totalEntries} transaksi tercatat
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Total Biaya */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <CardContent className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Total Biaya BBM</span>
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {formatRp(stats.totalCost)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Rata-rata: {stats.totalLiters > 0 ? formatRp(stats.totalCost / stats.totalLiters) : "Rp 0"}/L
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Non-RBL */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <CardContent className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">BBM Non-RBL</span>
                        <Building2 className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="text-xl font-bold text-sky-700 dark:text-sky-400">
                        {formatNum(stats.totalNonRblLiters)} <span className="text-xs font-normal text-slate-500">L</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                        {formatRp(stats.totalNonRblCost)} (Harga Manual)
                    </div>
                </CardContent>
            </Card>

            {/* Card 4: RBL */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <CardContent className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">BBM dari Kas RBL</span>
                        <Wallet className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-xl font-bold text-amber-700 dark:text-amber-400">
                        {formatNum(stats.totalRblLiters)} <span className="text-xs font-normal text-slate-500">L</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                        {formatRp(stats.totalRblCost)} (Kas Cabang)
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
