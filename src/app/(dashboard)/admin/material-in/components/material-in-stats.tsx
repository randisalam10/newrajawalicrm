import { Card, CardContent } from "@/components/ui/card"
import { MaterialInStats } from "../types"
import { Package, DollarSign, Scale, FileCheck2 } from "lucide-react"

function formatRp(val: number): string {
    return "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(val || 0)
}

interface MaterialInStatsProps {
    stats: MaterialInStats
}

export function MaterialInStatsCards({ stats }: MaterialInStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Total Volume */}
            <Card className="border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Total Semen Masuk</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                                {stats.totalTon.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">Ton</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                            {stats.totalKg.toLocaleString("id-ID")} KG • {stats.totalTransactions} Pengiriman
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Total Nilai */}
            <Card className="border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Total Nilai Pembelian</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold font-mono text-emerald-700 tracking-tight">
                                {formatRp(stats.totalNilai)}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Akumulasi biaya riil belanja semen
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <DollarSign className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Rata-rata Biaya / KG */}
            <Card className="border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Rata-rata Harga / KG</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold font-mono text-sky-700 tracking-tight">
                                {formatRp(stats.avgPricePerKg)}
                            </span>
                            <span className="text-xs font-medium text-slate-500">/ kg</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                            ~{formatRp(Math.round(stats.avgPricePerKg * 1000))} / Ton
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <Scale className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>

            {/* Card 4: Tracing & Verifikasi PO */}
            <Card className="border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow bg-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Tracing Transaksi PO</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold font-mono text-amber-700 tracking-tight">
                                {stats.poLinkedCount}
                            </span>
                            <span className="text-xs text-slate-500">/ {stats.totalTransactions} PO Terhubung</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            {stats.manualCount} Dokumen Input Manual
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <FileCheck2 className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
