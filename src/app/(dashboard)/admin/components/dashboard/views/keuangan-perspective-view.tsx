import React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Receipt, FileText, Banknote, Fuel, ArrowRight
} from "lucide-react"
import { formatRupiahCompact } from "../dashboard-helpers"
import { DashboardData } from "../dashboard-types"

interface KeuanganPerspectiveViewProps {
    data: DashboardData
    monthName: string
}

export function KeuanganPerspectiveView({ data }: KeuanganPerspectiveViewProps) {
    const keuangan = data.keuangan || {}

    return (
        <div className="space-y-4">
            {/* 4 Specialized Finance & Billing KPI Tiles */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Unbilled Pool */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiket Belum Ditagih</span>
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Receipt className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-blue-700 tracking-tight">
                                {keuangan.unbilledCount || 0}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">Tiket</span>
                            <span className="text-xs text-slate-500 ml-auto font-medium">
                                {(keuangan.unbilledVolumeTotal || 0).toFixed(1)} m³
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Est: <strong>{formatRupiahCompact(keuangan.unbilledEstimatedValue || 0)}</strong></span>
                            <Link href="/admin/billing" className="text-blue-600 hover:underline font-medium">
                                Buat Invoice →
                            </Link>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                        </div>
                    </div>
                </Card>

                {/* Piutang Outstanding */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Piutang Outstanding</span>
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-indigo-900 tracking-tight">
                                {formatRupiahCompact(keuangan.totalOutstandingReceivables || 0)}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Total Invoice: {formatRupiahCompact(keuangan.totalInvoiced || 0)}</span>
                            <span className="text-emerald-600 font-medium">Lunas: {formatRupiahCompact(keuangan.totalInvoicePaid || 0)}</span>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                            <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{
                                    width: `${keuangan.totalInvoiced > 0 ? Math.min(100, Math.round(((keuangan.totalInvoicePaid || 0) / keuangan.totalInvoiced) * 100)) : 0}%`
                                }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Sisa Saldo Kas RBL */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sisa Saldo Kas RBL</span>
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Banknote className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className={`text-2xl font-bold tracking-tight ${
                                (keuangan.rblRemainingBalance || 0) < 0 ? 'text-rose-600' : 'text-emerald-700'
                            }`}>
                                {formatRupiahCompact(keuangan.rblRemainingBalance || 0)}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Budget: {formatRupiahCompact(keuangan.rblBudgetAmount || 0)}</span>
                            <span>Pengeluaran: {formatRupiahCompact(keuangan.rblExpensesTotal || 0)}</span>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                            <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{
                                    width: `${keuangan.rblBudgetAmount > 0 ? Math.min(100, Math.max(0, Math.round(((keuangan.rblRemainingBalance || 0) / keuangan.rblBudgetAmount) * 100))) : 0}%`
                                }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Biaya BBM Solar RBL */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Penggunaan Solar (RBL)</span>
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Fuel className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {(keuangan.totalSolarLitersRbl || 0).toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">Liter</span>
                            <span className="text-xs text-amber-700 ml-auto font-medium">
                                {formatRupiahCompact(keuangan.totalSolarCostRbl || 0)}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Kas Operasional BP</span>
                            <Link href="/admin/rbl" className="text-amber-700 hover:underline font-medium">
                                Laporan BBM →
                            </Link>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions Hub for Finance */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 px-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        Pusat Aksi Keuangan & Penagihan
                    </span>
                    <span className="text-[11px] text-slate-400">Kelola Piutang, Invoice & Kas Operasional</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Link href="/admin/billing">
                        <Button size="sm" className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5">
                            <Receipt className="w-4 h-4" />
                            <span>Unbilled Pool (Tagihan)</span>
                        </Button>
                    </Link>
                    <Link href="/admin/billing">
                        <Button size="sm" variant="outline" className="w-full h-10 border-slate-200 hover:bg-blue-50 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>Daftar Invoice Terbit</span>
                        </Button>
                    </Link>
                    <Link href="/admin/rbl">
                        <Button size="sm" variant="outline" className="w-full h-10 border-slate-200 hover:bg-emerald-50 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5">
                            <Banknote className="w-4 h-4 text-emerald-600" />
                            <span>Kas Operasional RBL</span>
                        </Button>
                    </Link>
                    <Link href="/admin/rbl">
                        <Button size="sm" variant="outline" className="w-full h-10 border-slate-200 hover:bg-amber-50 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5">
                            <Fuel className="w-4 h-4 text-amber-600" />
                            <span>Rekap Solar BBM</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Detail Summary Cards */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {/* Invoicing Summary */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Receipt className="w-4 h-4 text-blue-600" />
                                Ringkasan Piutang & Penagihan
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Status penagihan invoice customer</CardDescription>
                        </div>
                        <Link href="/admin/billing">
                            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2">
                                Buka Billing <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-slate-600">Total Nilai Invoice Terbit</span>
                            <span className="font-bold text-slate-900">{formatRupiahCompact(keuangan.totalInvoiced || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                            <span className="text-emerald-700 font-medium">Sudah Dibayar (Lunas)</span>
                            <span className="font-bold text-emerald-800">{formatRupiahCompact(keuangan.totalInvoicePaid || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                            <span className="text-indigo-700 font-medium">Sisa Piutang (Outstanding)</span>
                            <span className="font-bold text-indigo-900">{formatRupiahCompact(keuangan.totalOutstandingReceivables || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
                            <span className="text-blue-700 font-medium">Estimasi Siap Ditagih (Unbilled)</span>
                            <span className="font-bold text-blue-900">{formatRupiahCompact(keuangan.unbilledEstimatedValue || 0)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Kas RBL Summary */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Banknote className="w-4 h-4 text-emerald-600" />
                                Ringkasan Kas Operasional (RBL)
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Anggaran cabang & realisasi pengeluaran</CardDescription>
                        </div>
                        <Link href="/admin/rbl">
                            <Button variant="ghost" size="sm" className="text-xs text-emerald-600 hover:text-emerald-700 h-6 px-2">
                                Buka RBL <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-slate-600">Alokasi Anggaran RBL</span>
                            <span className="font-bold text-slate-900">{formatRupiahCompact(keuangan.rblBudgetAmount || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                            <span className="text-amber-800 font-medium">Total Pengeluaran Realisasi</span>
                            <span className="font-bold text-amber-900">{formatRupiahCompact(keuangan.rblExpensesTotal || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                            <span className="text-emerald-700 font-medium">Sisa Saldo Kas RBL</span>
                            <span className="font-bold text-emerald-800">{formatRupiahCompact(keuangan.rblRemainingBalance || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-orange-50/50 border border-orange-100">
                            <span className="text-orange-800 font-medium">Biaya Bahan Bakar (Solar)</span>
                            <span className="font-bold text-orange-900">{formatRupiahCompact(keuangan.totalSolarCostRbl || 0)} ({keuangan.totalSolarLitersRbl || 0} L)</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
