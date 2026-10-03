"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditKPIStats } from "../../types"
import { fmtRp, fmtCompact } from "../../utils/kredit-helpers"
import { Building2, Layers, Store, TrendingUp, Calendar, CheckCircle2, HardHat, Factory } from "lucide-react"

interface CreditDashboardTabProps {
    stats: CreditKPIStats
}

export function CreditDashboardTab({ stats }: CreditDashboardTabProps) {
    const totalVal = stats.totalCreditValue || 1 // Avoid divide by zero
    const totalOutstanding = stats.totalOutstandingValue || 1
    const rate = Math.min(100, Math.max(0, stats.repaymentRatePct || 0))

    const projPct = ((stats.projectStats?.outstanding ?? 0) / totalOutstanding) * 100
    const bpPct = ((stats.batchingPlantStats?.outstanding ?? 0) / totalOutstanding) * 100
    const holdingPct = ((stats.holdingStats?.outstanding ?? 0) / totalOutstanding) * 100

    return (
        <div className="space-y-4">
            {/* Executive Overview Card */}
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                                MONITORING KREDIT EKSEKUTIF
                            </span>
                            <span className="text-xs text-slate-400">Status Kewajiban Hutang Pengadaan & Kontrak Perusahaan</span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-3 flex-wrap">
                            <span className="text-3xl font-black font-mono tracking-tight text-white">
                                {fmtRp(stats.totalOutstandingValue)}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700/60">
                                Sisa Kewajiban Aktif
                            </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                            <span>Total Plafon Kredit: <strong className="text-slate-200">{fmtRp(stats.totalCreditValue)}</strong></span>
                            <span>•</span>
                            <span>Sudah Dibayar: <strong className="text-emerald-400">{fmtRp(stats.totalPaidValue)}</strong></span>
                            <span>•</span>
                            <span>Tingkat Pelunasan: <strong className="text-white">{rate.toFixed(1)}%</strong></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs flex-wrap sm:flex-nowrap">
                        <div className="bg-slate-800/90 px-3.5 py-2.5 rounded-lg border border-slate-700/80 min-w-[140px]">
                            <div className="text-slate-400 text-[10px] uppercase font-semibold">Total Kredit</div>
                            <div className="text-white font-mono font-bold text-base mt-0.5">
                                {stats.totalCreditsCount} Transaksi
                            </div>
                            <div className="text-[10px] text-emerald-400 mt-0.5">
                                {stats.paidCount} Lunas · {stats.partialCount} Cicil
                            </div>
                        </div>

                        <div className="bg-slate-800/90 px-3.5 py-2.5 rounded-lg border border-slate-700/80 min-w-[140px]">
                            <div className="text-slate-400 text-[10px] uppercase font-semibold">Overdue / Telat</div>
                            <div className="text-rose-400 font-mono font-bold text-base mt-0.5">
                                {fmtCompact(stats.overdueValue)}
                            </div>
                            <div className="text-[10px] text-rose-400 mt-0.5">
                                {stats.overdueCount} Tagihan Perlu Atensi
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEKSI BARU: Komposisi Alokasi Beban Proyek vs Batching Plant vs Kantor Pusat */}
            <Card className="border-slate-200/80 shadow-2xs">
                <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span>Segmentasi Alokasi Beban: Proyek vs Batching Plant</span>
                        </CardTitle>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Perbandingan portofolio hutang pengadaan berdasarkan peruntukan cost center
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-indigo-600" /> Proyek ({projPct.toFixed(1)}%)
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-700 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-blue-600" /> Batching Plant ({bpPct.toFixed(1)}%)
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-slate-500" /> Pusat ({holdingPct.toFixed(1)}%)
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {/* Multi-segment Progress Bar */}
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex border border-slate-200">
                        <div
                            className="bg-indigo-600 h-full transition-all duration-500"
                            style={{ width: `${projPct}%` }}
                            title={`Proyek: ${fmtRp(stats.projectStats?.outstanding ?? 0)} (${projPct.toFixed(1)}%)`}
                        />
                        <div
                            className="bg-blue-600 h-full transition-all duration-500"
                            style={{ width: `${bpPct}%` }}
                            title={`Batching Plant: ${fmtRp(stats.batchingPlantStats?.outstanding ?? 0)} (${bpPct.toFixed(1)}%)`}
                        />
                        <div
                            className="bg-slate-400 h-full transition-all duration-500"
                            style={{ width: `${holdingPct}%` }}
                            title={`Kantor Pusat: ${fmtRp(stats.holdingStats?.outstanding ?? 0)} (${holdingPct.toFixed(1)}%)`}
                        />
                    </div>

                    {/* 2 Kolom Sub-Breakdown: Proyek vs Batching Plant */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* 1. Proyek Fisik Terbesar */}
                        <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between text-xs border-b border-indigo-100 pb-2">
                                <span className="font-bold text-indigo-900 flex items-center gap-1.5 uppercase text-[11px]">
                                    <HardHat className="w-3.5 h-3.5 text-indigo-600" />
                                    Eksposur per Proyek Konstruksi
                                </span>
                                <span className="font-mono font-bold text-indigo-800">
                                    {fmtCompact(stats.projectStats?.outstanding ?? 0)}
                                </span>
                            </div>
                            {stats.byProject.length === 0 ? (
                                <p className="text-xs text-slate-400 py-3 text-center">Belum ada kewajiban proyek</p>
                            ) : (
                                <div className="space-y-2">
                                    {stats.byProject.slice(0, 4).map(p => {
                                        const share = totalOutstanding > 0 ? ((p.outstanding / totalOutstanding) * 100).toFixed(1) : "0"
                                        return (
                                            <div key={p.projectId} className="text-xs space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-slate-800 truncate max-w-[220px]" title={p.projectName}>
                                                        {p.projectName}
                                                    </span>
                                                    <span className="font-mono text-slate-700 font-medium">
                                                        {fmtCompact(p.outstanding)} <span className="text-[10px] text-slate-400 font-sans">({share}%)</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                    <span>{p.count} PO Kredit</span>
                                                    <span>Plafon: {fmtRp(p.totalAmount)}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 2. Batching Plant Cabang */}
                        <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between text-xs border-b border-blue-100 pb-2">
                                <span className="font-bold text-blue-900 flex items-center gap-1.5 uppercase text-[11px]">
                                    <Factory className="w-3.5 h-3.5 text-blue-600" />
                                    Eksposur per Batching Plant
                                </span>
                                <span className="font-mono font-bold text-blue-800">
                                    {fmtCompact(stats.batchingPlantStats?.outstanding ?? 0)}
                                </span>
                            </div>
                            {stats.byLocation.length === 0 ? (
                                <div className="py-4 text-center text-xs text-slate-400">
                                    <p className="font-medium text-slate-600">Belum ada PO kredit spesifik cabang</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">PO baru bertag BP akan otomatis tampil di sini.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {stats.byLocation.map(l => {
                                        const share = totalOutstanding > 0 ? ((l.outstanding / totalOutstanding) * 100).toFixed(1) : "0"
                                        return (
                                            <div key={l.locationId} className="text-xs space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-slate-800">
                                                        BP {l.locationName}
                                                    </span>
                                                    <span className="font-mono text-slate-700 font-medium">
                                                        {fmtCompact(l.outstanding)} <span className="text-[10px] text-slate-400 font-sans">({share}%)</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                    <span>{l.count} PO Kredit</span>
                                                    <span>Plafon: {fmtRp(l.totalAmount)}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Grid 2 Kolom: Perusahaan & Kategori */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Breakdown Kewajiban per Entitas Perusahaan */}
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            Kewajiban per Entitas Badan Usaha
                        </CardTitle>
                        <span className="text-[11px] text-slate-400">{stats.byCompany.length} Entitas</span>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {stats.byCompany.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Belum ada data kewajiban per entitas</p>
                        ) : (
                            stats.byCompany.map(comp => {
                                const sharePct = ((comp.totalAmount / totalVal) * 100).toFixed(1)
                                return (
                                    <div key={comp.companyName} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={comp.companyName}>
                                                {comp.companyName}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 font-mono">{fmtCompact(comp.outstanding)} sisa</span>
                                                <span className="text-[10px] font-bold text-slate-400">({sharePct}%)</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                            <div
                                                className="bg-blue-600 h-full rounded-full"
                                                style={{ width: `${sharePct}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                                            <span>{comp.count} transaksi PO kredit</span>
                                            <span>Plafon: {fmtRp(comp.totalAmount)}</span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </CardContent>
                </Card>

                {/* 2. Breakdown Kewajiban per Kategori Beban Pengadaan */}
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-600" />
                            Kewajiban per Kategori Pengadaan
                        </CardTitle>
                        <span className="text-[11px] text-slate-400">{stats.byCategory.length} Kategori</span>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {stats.byCategory.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Belum ada data kategori</p>
                        ) : (
                            stats.byCategory.map(cat => {
                                const sharePct = ((cat.totalAmount / totalVal) * 100).toFixed(1)
                                return (
                                    <div key={cat.categoryName} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-800">{cat.categoryName}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-rose-600 font-mono font-medium">{fmtCompact(cat.outstanding)} sisa</span>
                                                <span className="text-[10px] text-slate-400">({sharePct}%)</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                            <div
                                                className="bg-emerald-600 h-full rounded-full"
                                                style={{ width: `${sharePct}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                                            <span>{cat.count} transaksi PO</span>
                                            <span>Plafon: {fmtRp(cat.totalAmount)}</span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Grid 2 Kolom: Top Suppliers Exposure & Tren Realisasi Pelunasan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 3. Top 5 Supplier Exposure */}
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Store className="w-4 h-4 text-amber-600" />
                            Top 5 Rekanan dengan Hutang Tertinggi
                        </CardTitle>
                        <span className="text-[10px] text-slate-400">Exposure Hutang Terbesar</span>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2.5">
                        {stats.topSuppliers.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Belum ada supplier dengan sisa kewajiban</p>
                        ) : (
                            stats.topSuppliers.map((sup, idx) => (
                                <div key={sup.supplierName} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-slate-800 truncate" title={sup.supplierName}>
                                                {sup.supplierName}
                                            </div>
                                            <div className="text-[10px] text-slate-400">{sup.count} transaksi terkait</div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-mono font-bold text-rose-600">{fmtRp(sup.outstanding)}</div>
                                        <div className="text-[10px] text-slate-400">Plafon: {fmtCompact(sup.totalAmount)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* 4. Realisasi Pembayaran Kas Keluar (Monthly Cash Outflow) */}
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            Realisasi Pengeluaran Kas Pelunasan (Bulanan)
                        </CardTitle>
                        <span className="text-[10px] text-slate-400">Data Riil Kas Keluar</span>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2.5">
                        {stats.monthlyTrend.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-xs">
                                <Calendar className="w-8 h-8 mx-auto mb-1.5 opacity-30 text-blue-500" />
                                <p className="font-medium">Belum ada realisasi pembayaran kredit yang tercatat</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Catat pembayaran pada tab "Daftar Kredit" untuk melihat riwayat arus kas keluar.</p>
                            </div>
                        ) : (
                            stats.monthlyTrend.map(trend => (
                                <div key={trend.monthKey} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-800">{trend.monthLabel}</div>
                                            <div className="text-[10px] text-slate-500">{trend.paymentCount} bukti pembayaran transfer/kas</div>
                                        </div>
                                    </div>
                                    <div className="font-mono font-bold text-emerald-700 text-sm">
                                        {fmtRp(trend.paymentAmount)}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
