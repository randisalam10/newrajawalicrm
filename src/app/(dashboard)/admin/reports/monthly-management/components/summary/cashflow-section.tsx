"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    Receipt,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import { formatRp } from "../formatters"
import { ScorecardData, DrilldownData } from "../../types"

interface CashflowSectionProps {
    scorecard: ScorecardData
    drilldown: DrilldownData
}

export const CashflowSection: React.FC<CashflowSectionProps> = ({
    scorecard,
    drilldown,
}) => {
    const [showAllPayments, setShowAllPayments] = useState<boolean>(false)

    const cashflow = scorecard.cashflow || {
        totalPaymentReceived: 0,
        paymentCount: 0,
        totalDepositReceived: 0,
        totalCashInflow: 0,
        totalCashOutflow: scorecard.rblOpex || 0,
        netOperatingCashflow: -(scorecard.rblOpex || 0),
        cashCollectionRate: 0,
    }
    const recentPayments = drilldown.billing?.recentPayments || []

    return (
        <Card className="border border-slate-200/80 shadow-xs bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-3.5 px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200/80 shadow-2xs">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2">
                                1.2 Realisasi Arus Kas &amp; Cashflow Penjualan Beton
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 mt-0.5">
                                Arus kas riil: Penerimaan pembayaran beton &amp; pelunasan invoice pelanggan vs kas keluar operasional cabang
                            </CardDescription>
                        </div>
                    </div>
                    <Badge className={`px-3 py-1 text-xs font-bold shadow-2xs ${
                        cashflow.netOperatingCashflow >= 0
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-rose-600 hover:bg-rose-700 text-white"
                    }`}>
                        {cashflow.netOperatingCashflow >= 0
                            ? `✓ SURPLUS KAS MASUK: +${formatRp(cashflow.netOperatingCashflow)}`
                            : `⚠ DEFISIT KAS: ${formatRp(cashflow.netOperatingCashflow)}`}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
                {/* 4 Kartu Metrik Cash Flow */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Kas Masuk (Inflow) */}
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between shadow-2xs">
                        <div>
                            <div className="text-xs font-semibold text-emerald-800 uppercase flex items-center gap-1.5">
                                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                                Total Kas Masuk (Inflow)
                            </div>
                            <div className="text-xl font-bold font-mono text-emerald-900 mt-1.5">
                                {formatRp(cashflow.totalCashInflow)}
                            </div>
                        </div>
                        <div className="text-[11px] text-emerald-700 space-y-0.5 pt-2 border-t border-emerald-200/60 mt-3 font-medium">
                            <div className="flex justify-between">
                                <span>Pelunasan Invoice:</span>
                                <span className="font-bold">{formatRp(cashflow.totalPaymentReceived)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-emerald-600">
                                <span>Frekuensi Bayar:</span>
                                <span>{cashflow.paymentCount} Transaksi</span>
                            </div>
                            {cashflow.totalDepositReceived > 0 && (
                                <div className="flex justify-between text-[10px]">
                                    <span>Deposit Proyek:</span>
                                    <span>{formatRp(cashflow.totalDepositReceived)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Kas Keluar (Outflow) */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between shadow-2xs">
                        <div>
                            <div className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1.5">
                                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                                Kas Keluar Lapangan (Outflow)
                            </div>
                            <div className="text-xl font-bold font-mono text-slate-900 mt-1.5">
                                -{formatRp(cashflow.totalCashOutflow)}
                            </div>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5 pt-2 border-t border-slate-200 mt-3 font-medium">
                            <div className="flex justify-between">
                                <span>Operasional (RBL Opex):</span>
                                <span className="font-semibold text-rose-600">-{formatRp(scorecard.rblOpex || 0)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                                <span>BBM Solar (Kas RBL):</span>
                                <span>-{formatRp(scorecard.rblBbmDirect || 0)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Bengkel / Servis (Kas RBL):</span>
                                <span>-{formatRp(scorecard.rblMaintenanceDirect || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Arus Kas Bersih Operasional */}
                    <div className={`p-4 rounded-xl border-2 flex flex-col justify-between shadow-2xs ${
                        cashflow.netOperatingCashflow >= 0
                            ? "border-emerald-300 bg-emerald-50/60"
                            : "border-rose-300 bg-rose-50/60"
                    }`}>
                        <div>
                            <div className={`text-xs font-bold uppercase ${
                                cashflow.netOperatingCashflow >= 0 ? "text-emerald-900" : "text-rose-900"
                            }`}>
                                Arus Kas Bersih (Net Cashflow)
                            </div>
                            <div className={`text-2xl font-black font-mono tracking-tight mt-1.5 ${
                                cashflow.netOperatingCashflow >= 0 ? "text-emerald-700" : "text-rose-600"
                            }`}>
                                {formatRp(cashflow.netOperatingCashflow)}
                            </div>
                        </div>
                        <div className={`text-[10px] font-medium pt-2 border-t mt-3 ${
                            cashflow.netOperatingCashflow >= 0
                                ? "text-emerald-800 border-emerald-200"
                                : "text-rose-800 border-rose-200"
                        }`}>
                            {cashflow.netOperatingCashflow >= 0
                                ? "✓ Kas masuk dari pembayaran beton mencukupi seluruh beban operasional cabang."
                                : "⚠ Kas masuk belum menutup seluruh pengeluaran kas cabang bulan ini."}
                        </div>
                    </div>

                    {/* 4. Rasio Realisasi Penagihan (Cash Collection Rate) */}
                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 flex flex-col justify-between shadow-2xs">
                        <div>
                            <div className="text-xs font-semibold text-indigo-800 uppercase flex items-center gap-1.5">
                                <Receipt className="w-4 h-4 text-indigo-600" />
                                Collection Realization Rate
                            </div>
                            <div className="text-2xl font-black font-mono text-indigo-900 mt-1.5">
                                {cashflow.cashCollectionRate}%
                            </div>
                        </div>
                        <div className="text-[11px] text-indigo-800 space-y-0.5 pt-2 border-t border-indigo-200/60 mt-3">
                            <div className="flex justify-between">
                                <span>Omset Bersih (DPP):</span>
                                <span className="font-semibold">{formatRp(scorecard.totalDppRevenue || scorecard.totalGrossRevenue)}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                                {cashflow.cashCollectionRate >= 100
                                    ? "Pelunasan melebihi omset bulan berjalan (termasuk tagihan lalu)."
                                    : "Persentase tagihan yang sudah berhasil masuk ke rekening."}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Komparasi Edukatif: Laba Akrual vs Kas Riil */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            ⚖️ Komparasi Laba Akrual vs Arus Kas Riil:
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                            Laba Operasional (E) mengukur performa pengiriman beton bulan ini, sedangkan Cash Flow mengukur uang kas riil yang masuk rekening dari pelanggan.
                        </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="bg-white px-3 py-1.5 rounded border border-slate-200 text-right">
                            <div className="text-[10px] text-slate-500">Hasil Bersih Akrual (E):</div>
                            <div className={`font-mono font-bold ${
                                (scorecard.netFieldContribution || 0) >= 0 ? "text-emerald-700" : "text-rose-600"
                            }`}>
                                {formatRp(scorecard.netFieldContribution || 0)}
                            </div>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded border border-slate-200 text-right">
                            <div className="text-[10px] text-slate-500">Arus Kas Masuk Bersih:</div>
                            <div className={`font-mono font-bold ${
                                cashflow.netOperatingCashflow >= 0 ? "text-emerald-700" : "text-rose-600"
                            }`}>
                                {formatRp(cashflow.netOperatingCashflow)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabel Rincian Pembayaran Pelanggan Masuk Bulan Ini */}
                {recentPayments.length > 0 && (
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                <Receipt className="w-4 h-4 text-indigo-600" />
                                Daftar Realisasi Pembayaran Beton Masuk ({recentPayments.length} Pembayaran)
                            </span>
                            {recentPayments.length > 5 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllPayments(!showAllPayments)}
                                    className="h-7 text-xs text-indigo-600 hover:text-indigo-800 gap-1 font-semibold cursor-pointer"
                                >
                                    {showAllPayments ? (
                                        <>Tampilkan Lebih Sedikit <ChevronUp className="w-3.5 h-3.5" /></>
                                    ) : (
                                        <>Lihat Semua ({recentPayments.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                                    )}
                                </Button>
                            )}
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[300px]">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                    <tr>
                                        <th className="py-2 px-3 text-left">Tgl Bayar / Lapor</th>
                                        <th className="py-2 px-3 text-left">Pelanggan</th>
                                        <th className="py-2 px-3 text-left">No. Invoice</th>
                                        <th className="py-2 px-3 text-left">Metode / Catatan</th>
                                        <th className="py-2 px-3 text-right">Nominal Masuk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {(showAllPayments ? recentPayments : recentPayments.slice(0, 5)).map((p: any) => (
                                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                <div className="font-mono text-xs font-semibold text-slate-800">{p.date}</div>
                                                {p.createdAt && (
                                                    <div className="text-[10px] text-slate-400 font-sans">Lapor: {p.createdAt}</div>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-slate-800">{p.customerName}</td>
                                            <td className="py-2 px-3 font-mono text-indigo-600">{p.invoiceNumber}</td>
                                            <td className="py-2 px-3 text-slate-500">
                                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 mr-1.5">
                                                    {p.method}
                                                </span>
                                                <span className="text-[11px] text-slate-500">{p.notes !== "-" ? p.notes : ""}</span>
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30 whitespace-nowrap">
                                                +{formatRp(p.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
