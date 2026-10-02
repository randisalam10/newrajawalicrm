import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Layers, Building2 } from "lucide-react"
import { fmt, fmtNum } from "../../utils/billing-helpers"

interface CustomerExposureAndBranchProps {
    topDebtors: any[]
    totalOutstanding: number
    unbilledByCustomer: any[]
    branchBreakdown: any[]
    onNavigateTab: (tab: string, filter?: any) => void
}

export function CustomerExposureAndBranch({
    topDebtors,
    totalOutstanding,
    unbilledByCustomer,
    branchBreakdown,
    onNavigateTab,
}: CustomerExposureAndBranchProps) {
    return (
        <div className="space-y-4">
            {/* ─── Corporate Customer Exposure: Top Debtors & Unbilled Pipeline ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {/* Top 5 Debitur Terbesar */}
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-600" />
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Top 5 Pelanggan dengan Piutang Terbesar
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Prioritas penagihan & monitoring batas kredit
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-2.5">
                        {topDebtors.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs italic">
                                Tidak ada piutang outstanding saat ini.
                            </div>
                        ) : (
                            topDebtors.map((deb, idx) => (
                                <div key={deb.customerId} className="space-y-1 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                                            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className="font-semibold text-slate-800 truncate" title={deb.customerName}>
                                                {deb.customerName}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0 font-mono">
                                            <span className="font-bold text-amber-700">{fmt(deb.remaining)}</span>
                                            <span className="text-[10px] text-slate-400 ml-1">
                                                ({deb.rate.toFixed(0)}% terbayar)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-amber-500 h-1.5 rounded-full"
                                            style={{ width: `${Math.min(100, (deb.remaining / (totalOutstanding || 1)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Unbilled Pipeline by Customer */}
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-orange-600" />
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Pipeline Transaksi Belum Difakturkan (Cor & Sewa)
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Pengiriman cor & sewa alat operasional yang siap ditagihkan
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigateTab("unbilled")}
                            className="h-6 text-[11px] px-2 text-orange-700 border-orange-200 hover:bg-orange-50 cursor-pointer"
                        >
                            Proses Penagihan
                        </Button>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-2.5">
                        {unbilledByCustomer.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs italic">
                                Seluruh pengiriman beton dan sewa alat telah berhasil difakturkan.
                            </div>
                        ) : (
                            unbilledByCustomer.map((ub, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                                    <div className="min-w-0 flex-1 mr-2">
                                        <div className="font-semibold text-slate-800 truncate">
                                            {ub.customerName}
                                        </div>
                                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                                            <span>{ub.txCount} Transaksi</span>
                                            <span>·</span>
                                            {ub.hasRm && (
                                                <span className="font-medium text-slate-700">{fmtNum(ub.rmVolume, 1)} m³</span>
                                            )}
                                            {ub.hasRm && ub.hasSewa && <span>+</span>}
                                            {ub.hasSewa && (
                                                <span className="font-medium text-purple-700">{ub.sewaDays} Hari Sewa</span>
                                            )}
                                            {ub.hasSewa && !ub.hasRm && (
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] px-1 py-0">Sewa Alat</Badge>
                                            )}
                                            {ub.hasRm && ub.hasSewa && (
                                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] px-1 py-0">Cor + Sewa</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-bold text-slate-900 font-mono">
                                            {ub.estValue > 0 ? fmt(ub.estValue) : "-"}
                                        </div>
                                        <div className="text-[10px] text-orange-600 font-medium">
                                            Siap Difakturkan
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ─── Konsolidasi Antar Cabang (Multi-Branch Breakdown) ─────────── */}
            {branchBreakdown.length > 0 && (
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Kinerja Penagihan Antar Cabang (Batching Plant)
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Perbandingan omset faktur terbit, realisasi penerimaan kas, dan sisa piutang per lokasi
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-[11px] border-b border-slate-200">
                                <tr>
                                    <th className="text-left p-2.5 font-semibold text-slate-600">Cabang / Batching Plant</th>
                                    <th className="text-right p-2.5 font-semibold text-slate-600">Total Invoice (Rp)</th>
                                    <th className="text-right p-2.5 font-semibold text-slate-600">Kas Diterima (Rp)</th>
                                    <th className="text-right p-2.5 font-semibold text-slate-600">Sisa Piutang (Rp)</th>
                                    <th className="text-center p-2.5 font-semibold text-slate-600">Kolektibilitas</th>
                                    <th className="text-right p-2.5 font-semibold text-slate-600">Antrean Unbilled</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {branchBreakdown.map((b, idx) => {
                                    const rate = b.invoiced > 0 ? (b.paid / b.invoiced) * 100 : 0
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-2.5 font-semibold text-slate-800">
                                                📍 {b.name}
                                            </td>
                                            <td className="p-2.5 text-right font-mono text-slate-700">
                                                {fmt(b.invoiced)}
                                            </td>
                                            <td className="p-2.5 text-right font-mono text-emerald-700 font-semibold">
                                                {fmt(b.paid)}
                                            </td>
                                            <td className="p-2.5 text-right font-mono text-amber-700 font-semibold">
                                                {fmt(b.outstanding)}
                                            </td>
                                            <td className="p-2.5 text-center">
                                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                                    {rate.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="p-2.5 text-right font-mono">
                                                {b.unbilledCount > 0 ? (
                                                    <span className="text-orange-700 font-bold">{b.unbilledCount} tx</span>
                                                ) : (
                                                    <span className="text-slate-400">0</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    )
}
