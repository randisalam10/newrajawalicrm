import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Receipt, CheckCircle2, CreditCard, Layers, Wallet,
    Truck, Wrench, AlertTriangle, ArrowUpRight
} from "lucide-react"
import { fmt, fmtNum } from "../../utils/billing-helpers"

interface ExecutiveKpiSummaryProps {
    consolidatedAll: any
    revenueBreakdown: any
    unbilledBreakdown: any
    totalInvoiced: number
    totalPaid: number
    totalOutstanding: number
    collectionRate: number
    ppnBreakdown: any
    activeInvoices: any[]
    activeLocName: string
    totalDeposits: number
    deposits: any[]
    onNavigateTab: (tab: string, filter?: any) => void
}

export function ExecutiveKpiSummary({
    consolidatedAll,
    revenueBreakdown,
    unbilledBreakdown,
    totalInvoiced,
    totalPaid,
    totalOutstanding,
    collectionRate,
    ppnBreakdown,
    activeInvoices,
    activeLocName,
    totalDeposits,
    deposits,
    onNavigateTab,
}: ExecutiveKpiSummaryProps) {
    return (
        <div className="space-y-4">
            {/* ─── Consolidated Total Business Potential Banner (ALL = Invoiced + Unbilled) ─── */}
            <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                                KONSOLIDASI TOTAL OMZET & PRODUKSI (ALL)
                            </span>
                            <span className="text-xs text-slate-400">Total Transaksi Sudah Terbit Invoice + Masih Antre Unbilled</span>
                        </div>
                        <div className="mt-1.5 flex items-baseline gap-2.5 flex-wrap">
                            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                                {fmt(consolidatedAll.totalGrossValue)}
                            </span>
                            <span className="text-xs text-slate-300 font-medium bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                                Total: {fmtNum(consolidatedAll.totalVolumeAll, 1)} m³ beton cor · {consolidatedAll.totalSewaDaysAll} hari sewa
                            </span>
                        </div>
                        {/* Rincian Komponen Konsolidasi (Faktur Terbit vs Antrean Unbilled) */}
                        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-3 flex-wrap">
                            <span>
                                <strong className="text-slate-300">Rincian Cor:</strong> Faktur {fmtNum(revenueBreakdown.rmVolume, 1)} m³ + Antrean {fmtNum(unbilledBreakdown.rmVolume, 1)} m³ = <strong className="text-white">{fmtNum(consolidatedAll.totalVolumeAll, 1)} m³</strong>
                            </span>
                            <span>•</span>
                            <span>
                                <strong className="text-slate-300">Rincian Sewa:</strong> Faktur {revenueBreakdown.sewaDays} Hari + Antrean {unbilledBreakdown.sewaDays} Hari = <strong className="text-white">{consolidatedAll.totalSewaDaysAll} Hari</strong>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs flex-wrap sm:flex-nowrap">
                        <div className="bg-slate-800/90 px-3.5 py-2 rounded-lg border border-slate-700/80 min-w-[150px]">
                            <div className="text-slate-400 text-[10px] uppercase font-semibold">Sudah Ditagihkan (Invoice)</div>
                            <div className="text-blue-400 font-mono font-bold text-sm">
                                {fmt(totalInvoiced)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                                {consolidatedAll.invoicedValueShare.toFixed(1)}% dari total omzet
                            </div>
                        </div>
                        <div className="bg-slate-800/90 px-3.5 py-2 rounded-lg border border-slate-700/80 min-w-[150px]">
                            <div className="text-slate-400 text-[10px] uppercase font-semibold">Antrean Belum Ditagih</div>
                            <div className="text-orange-400 font-mono font-bold text-sm">
                                {fmt(unbilledBreakdown.totalEstValue)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                                {consolidatedAll.unbilledValueShare.toFixed(1)}% dari total omzet
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Missing Price Alert Banner ─── */}
            {unbilledBreakdown.missingPriceCount > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg mt-0.5 shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-amber-950">
                                Perhatian: {unbilledBreakdown.missingPriceCount} Transaksi Belum Memiliki Harga Kesepakatan ({fmtNum(unbilledBreakdown.missingPriceVolume, 1)} m³ beton cor)
                            </h4>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                                Transaksi ini sementara dihitung Rp 0 pada estimasi unbilled. Silakan lengkapi harga mutu di Master Proyek agar nilai tagihan akurat.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100/60 shrink-0 font-medium cursor-pointer shadow-2xs"
                        onClick={() => onNavigateTab("unbilled", { noPriceOnly: true })}
                    >
                        Lihat Transaksi Tanpa Harga <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                </div>
            )}

            {/* ─── Top Executive Summary Banner (5 Core Metrics with ReadyMix & Sewa Breakdown) ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Total Tagihan Terbit (Gross) */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-blue-50/20">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Total Invoice Terbit (Gross)
                            </span>
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                <Receipt className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-slate-900 font-mono truncate">
                            {fmt(totalInvoiced)}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{activeInvoices.length} Faktur Aktif</span>
                            <span className="text-blue-600 font-medium">{activeLocName}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-blue-500" /> Cor ReadyMix</span>
                                <span className="font-mono font-semibold text-slate-800">{fmt(revenueBreakdown.rmGross)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1"><Wrench className="w-3 h-3 text-purple-500" /> Sewa Alat/CP</span>
                                <span className="font-mono font-semibold text-purple-700">{fmt(revenueBreakdown.sewaGross)}</span>
                            </div>
                            <div className="flex items-center justify-between pt-0.5 border-t border-dashed border-slate-100">
                                <span className="text-emerald-700 font-medium">✓ Pakai PPN (11%)</span>
                                <span className="font-mono font-bold text-emerald-800">{fmt(ppnBreakdown.ppnGross)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-amber-700 font-medium">⚠ Non-PPN (0%)</span>
                                <span className="font-mono font-bold text-amber-800">{fmt(ppnBreakdown.nonPpnGross)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Pembayaran Masuk (Cash Collected) */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-emerald-50/20">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Pembayaran Masuk
                            </span>
                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono truncate">
                            {fmt(totalPaid)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Kolektibilitas</span>
                                <span className="font-bold text-emerald-700 font-mono">{collectionRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, collectionRate)}%` }}
                                />
                            </div>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Kas PPN ({ppnBreakdown.ppnCollectionRate.toFixed(0)}%)</span>
                                <span className="font-mono font-semibold text-emerald-800">{fmt(ppnBreakdown.ppnPaid)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Kas Non-PPN ({ppnBreakdown.nonPpnCollectionRate.toFixed(0)}%)</span>
                                <span className="font-mono font-semibold text-amber-800">{fmt(ppnBreakdown.nonPpnPaid)}</span>
                            </div>
                            <div className="flex items-center justify-between text-amber-900 bg-amber-50/80 rounded px-1 py-0.5 mt-0.5 font-medium border border-amber-200/50">
                                <span>Beban PPN 11%:</span>
                                <span className="font-mono font-bold text-amber-800">{fmt(ppnBreakdown.nonPpnPaidTaxLiability)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Sisa Piutang Usaha */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-amber-50/20">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Sisa Piutang Usaha
                            </span>
                            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                                <CreditCard className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-amber-700 font-mono truncate">
                            {fmt(totalOutstanding)}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Outstanding A/R</span>
                            <button
                                onClick={() => onNavigateTab("invoices", { status: "ISSUED" })}
                                className="text-amber-700 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                                Periksa <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Cor ReadyMix</span>
                                <span className="font-mono font-semibold text-amber-800">{fmt(revenueBreakdown.rmOutstanding)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Sewa Alat</span>
                                <span className="font-mono font-semibold text-purple-800">{fmt(revenueBreakdown.sewaOutstanding)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Potensi Tagihan Unbilled Pool */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-orange-50/20">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Belum Ditagih (Unbilled)
                            </span>
                            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-md">
                                <Layers className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-orange-700 font-mono truncate">
                            {unbilledBreakdown.totalEstValue > 0 ? fmt(unbilledBreakdown.totalEstValue) : `${unbilledBreakdown.totalCount} Transaksi`}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{unbilledBreakdown.totalCount} Transaksi Siap</span>
                            <button
                                onClick={() => onNavigateTab("unbilled")}
                                className="text-orange-700 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                                Proses <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                        {unbilledBreakdown.missingPriceCount > 0 ? (
                            <div
                                onClick={() => onNavigateTab("unbilled", { noPriceOnly: true })}
                                className="text-[10px] text-amber-800 font-medium bg-amber-100/70 hover:bg-amber-100 rounded px-1.5 py-0.5 border border-amber-200/80 flex items-center justify-between cursor-pointer transition-colors"
                                title="Klik untuk filter transaksi yang belum ada harga kesepakatan"
                            >
                                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-600" /> Belum Ada Harga:</span>
                                <span className="font-bold underline">{unbilledBreakdown.missingPriceCount} tx ({fmtNum(unbilledBreakdown.missingPriceVolume, 1)} m³) ↗</span>
                            </div>
                        ) : (
                            <div className="text-[10px] text-emerald-800 font-medium bg-emerald-50 rounded px-1.5 py-0.5 border border-emerald-200/60 flex items-center justify-between">
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Semua Berharga:</span>
                                <span className="font-bold">{unbilledBreakdown.pricedCount} tx Siap</span>
                            </div>
                        )}
                        <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-blue-500" /> Cor: {fmtNum(unbilledBreakdown.rmVolume, 1)} m³</span>
                                <span className="font-mono font-semibold text-slate-700">{fmt(unbilledBreakdown.rmEstValue)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1"><Wrench className="w-3 h-3 text-purple-500" /> Sewa: {unbilledBreakdown.sewaDays} Hari</span>
                                <span className="font-mono font-semibold text-slate-700">{fmt(unbilledBreakdown.sewaEstValue)}</span>
                            </div>
                            <div
                                onClick={() => onNavigateTab("unbilled", { unbilledPpnFilter: "PPN" })}
                                className="flex items-center justify-between text-slate-500 pt-0.5 border-t border-slate-100/60 hover:text-emerald-700 cursor-pointer group"
                                title="Klik untuk filter antrean unbilled Pakai PPN (11%)"
                            >
                                <span className="flex items-center gap-1 text-emerald-600 font-medium group-hover:underline">✓ Pakai PPN (11%)</span>
                                <span className="font-mono font-medium text-emerald-700">{fmt(unbilledBreakdown.ppnEstValue)}</span>
                            </div>
                            <div
                                onClick={() => onNavigateTab("unbilled", { unbilledPpnFilter: "NON_PPN" })}
                                className="flex items-center justify-between text-slate-500 hover:text-amber-700 cursor-pointer group"
                                title="Klik untuk filter antrean unbilled Non-PPN (0%)"
                            >
                                <span className="flex items-center gap-1 text-amber-600 font-medium group-hover:underline">⚠ Non-PPN (0%)</span>
                                <span className="font-mono font-medium text-amber-700">{fmt(unbilledBreakdown.nonPpnEstValue)}</span>
                            </div>
                            {unbilledBreakdown.nonPpnEstimatedTaxTotal > 0 && (
                                <div className="flex items-center justify-between text-[9px] text-amber-800/80 bg-amber-50/70 px-1.5 py-0.5 rounded mt-0.5 border border-amber-200/50">
                                    <span>Beban PPN 11%:</span>
                                    <span className="font-mono font-bold text-amber-900">{fmt(unbilledBreakdown.nonPpnEstimatedTaxTotal)}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Saldo Deposito Pelanggan */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-purple-50/20 col-span-2 lg:col-span-1">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Saldo Deposito Aktif
                            </span>
                            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                                <Wallet className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-purple-700 font-mono truncate">
                            {fmt(totalDeposits)}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{deposits.length} Proyek Pelanggan</span>
                            <button
                                onClick={() => onNavigateTab("deposit")}
                                className="text-purple-700 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                                Kelola <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                            Dapat dipotong langsung saat pelunasan tagihan
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
