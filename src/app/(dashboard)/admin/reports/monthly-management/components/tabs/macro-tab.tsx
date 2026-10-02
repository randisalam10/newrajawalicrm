"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatRp } from "../formatters"
import {
    BranchBenchmarkItem,
    MutuDistributionItem,
    TopCustomerItem,
    FleetStatsData,
    CostCompositionItem
} from "../../types"

interface MacroTabProps {
    branchBenchmark: BranchBenchmarkItem[]
    mutuDistribution: MutuDistributionItem[]
    topCustomers: TopCustomerItem[]
    fleetStats: FleetStatsData
    costComposition: CostCompositionItem[]
    selectedPeriodLabel: string
}

export function MacroTab({
    branchBenchmark,
    mutuDistribution,
    topCustomers,
    fleetStats,
    costComposition,
    selectedPeriodLabel
}: MacroTabProps) {
    return (
        <div className="space-y-6">
            {/* 2.1 Komparasi Antar Cabang */}
            <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-3.5 px-5">
                    <CardTitle className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                        2.1 Komparasi Kinerja Antar Cabang / Batching Plant
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                        Benchmark volume, revenue, dan efisiensi margin per cabang ({selectedPeriodLabel})
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100/70 border-b text-slate-700 font-semibold uppercase">
                            <tr>
                                <th className="py-2.5 px-4">Nama Cabang / Plant</th>
                                <th className="py-2.5 px-4 text-right">Volume (m³)</th>
                                <th className="py-2.5 px-4 text-right">Target</th>
                                <th className="py-2.5 px-4 text-right">Capaian %</th>
                                <th className="py-2.5 px-4 text-right">Omset (Rp)</th>
                                <th className="py-2.5 px-4 text-right">ASP / m³</th>
                                <th className="py-2.5 px-4 text-right">Gross Margin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {branchBenchmark.map((b: BranchBenchmarkItem) => (
                                <tr key={b.id} className="hover:bg-slate-50/70">
                                    <td className="py-2.5 px-4 font-bold text-slate-900">{b.name}</td>
                                    <td className="py-2.5 px-4 text-right font-bold text-blue-700">
                                        {b.volume.toLocaleString("id-ID", { minimumFractionDigits: 1 })}
                                    </td>
                                    <td className="py-2.5 px-4 text-right text-slate-500">
                                        {b.target.toLocaleString("id-ID")}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-semibold">
                                        <Badge
                                            variant="outline"
                                            className={
                                                b.achievementPct >= 80
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : b.achievementPct >= 50
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                    : "bg-red-50 text-red-700 border-red-200"
                                            }
                                        >
                                            {b.achievementPct}%
                                        </Badge>
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-mono font-medium">{formatRp(b.revenue)}</td>
                                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">{formatRp(b.asp)}</td>
                                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">{b.grossMarginPct.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* 2.2 Distribusi Mutu Beton & 2.3 Pelanggan Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 2.2 Mutu Distribution */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                            2.2 Distribusi Mutu Beton Terkirim
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">
                            Porsi volume dan kontribusi nilai per kelas mutu beton
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                                <tr>
                                    <th className="py-2 px-3 text-left">Mutu Beton</th>
                                    <th className="py-2 px-3 text-right">Volume (m³)</th>
                                    <th className="py-2 px-3 text-right">Porsi %</th>
                                    <th className="py-2 px-3 text-right">ASP / m³</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mutuDistribution.slice(0, 7).map((m: MutuDistributionItem) => (
                                    <tr key={m.name} className="hover:bg-slate-50/50">
                                        <td className="py-2 px-3 font-semibold text-slate-800">{m.name}</td>
                                        <td className="py-2 px-3 text-right font-bold text-blue-700">
                                            {m.volume.toLocaleString("id-ID", { minimumFractionDigits: 1 })}
                                        </td>
                                        <td className="py-2 px-3 text-right font-medium text-slate-600">{m.sharePct.toFixed(1)}%</td>
                                        <td className="py-2 px-3 text-right font-mono">{formatRp(m.asp)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* 2.3 Top 5 Pelanggan & Proyek */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                            2.3 Top 5 Pelanggan &amp; Proyek Terbesar
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">
                            Kontribusi omset terbesar per pelanggan di bulan ini
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                                <tr>
                                    <th className="py-2 px-3 text-left">Pelanggan &amp; Proyek</th>
                                    <th className="py-2 px-3 text-right">Vol (m³)</th>
                                    <th className="py-2 px-3 text-right">Nilai Kontrak</th>
                                    <th className="py-2 px-3 text-right">Porsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {topCustomers.map((c: TopCustomerItem, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="py-2 px-3">
                                            <div className="font-bold text-slate-800">{c.customerName}</div>
                                            <div className="text-[10px] text-slate-500">{c.projectName}</div>
                                        </td>
                                        <td className="py-2 px-3 text-right font-bold text-blue-700">
                                            {c.volume.toLocaleString("id-ID", { minimumFractionDigits: 1 })}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">{formatRp(c.revenue)}</td>
                                        <td className="py-2 px-3 text-right font-semibold text-emerald-700">{c.sharePct.toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            {/* 2.4 Kapasitas Pabrik & Utilitas Armada */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                            2.4 Utilisasi Kapasitas Batching Plant &amp; Armada
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 rounded-lg border">
                                <div className="text-slate-500 text-[11px]">Truk Mixer Aktif</div>
                                <div className="text-xl font-bold text-slate-900 mt-1">{fleetStats.activeMixerCount} Unit</div>
                                <div className="text-[10px] text-slate-400">Armada Beroperasi</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border">
                                <div className="text-slate-500 text-[11px]">Total Pengiriman (Trips)</div>
                                <div className="text-xl font-bold text-blue-700 mt-1">{fleetStats.totalTrips} Rit</div>
                                <div className="text-[10px] text-slate-400">Rata-rata {fleetStats.tripsPerMixerAvg} rit / mixer</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border">
                                <div className="text-slate-500 text-[11px]">Muatan per Rit (Avg)</div>
                                <div className="text-xl font-bold text-emerald-700 mt-1">{fleetStats.loadPerTripAvg} m³</div>
                                <div className="text-[10px] text-slate-400">Kapasitas Maks ~7 m³</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border">
                                <div className="text-slate-500 text-[11px]">Plant Capacity Utilization</div>
                                <div className="text-xl font-bold text-indigo-700 mt-1">{fleetStats.capacityUtilizationPct}%</div>
                                <div className="text-[10px] text-slate-400">Basis 12.480 m³/bulan</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2.5 Komposisi Biaya Langsung */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                            2.5 Struktur Komposisi Biaya Pokok (Direct COGS)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        {costComposition.map((c: CostCompositionItem, i: number) => (
                            <div key={i} className="text-xs space-y-1">
                                <div className="flex justify-between text-slate-700 font-medium">
                                    <span>{c.name}</span>
                                    <span>{formatRp(c.value)} ({c.pct.toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full rounded-full"
                                        style={{ width: `${Math.min(100, Math.max(0, c.pct))}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
