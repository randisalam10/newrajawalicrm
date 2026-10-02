import React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import {
    Factory, TrendingUp, Banknote, CalendarClock, Target,
    CheckCircle2, ArrowRight, UserCheck, ArrowUpRight, ArrowDownRight, Users
} from "lucide-react"
import { formatRupiahCompact, MiniSparkline } from "../dashboard-helpers"
import { MUTU_COLORS, DashboardData } from "../dashboard-types"

interface OperasionalPerspectiveViewProps {
    data: DashboardData
    monthName: string
    stockConfig: any
    volumeSparkline: number[]
    confirmedSparkline: number[]
    confirmRate: number
    trendDailyAvg: number
    trendTotal7Days: number
    mutuTotal: number
    plannedVolToday: number
}

export function OperasionalPerspectiveView({
    data, monthName, stockConfig, volumeSparkline, confirmedSparkline,
    confirmRate, trendDailyAvg, trendTotal7Days, mutuTotal, plannedVolToday
}: OperasionalPerspectiveViewProps) {
    const StockIcon = stockConfig.icon

    return (
        <div className="space-y-4">
            {/* Quick Action & Planning Tracker Strip */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-xl p-3 px-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <CalendarClock className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-800">Planning Produksi Hari Ini</span>
                                {data.todayPlans.length > 0 ? (
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-700 border border-blue-200">
                                        {data.todayPlans.length} Rencana
                                    </Badge>
                                ) : (
                                    <span className="text-[11px] text-slate-400">Tidak ada jadwal aktif</span>
                                )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                                {data.todayPlans.length > 0
                                    ? `Target volume: ${plannedVolToday.toFixed(1)} m³ (${data.todayPlans.filter((p: any) => p.status === 'Done').length} selesai, ${data.todayPlans.filter((p: any) => p.status === 'OnGoing').length} berjalan)`
                                    : "Belum ada rencana pengecoran dijadwalkan untuk hari ini."}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {data.todayPlans.length > 0 && (
                            <div className="hidden xl:flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                                <Target className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Realisasi: <strong>{data.todayVolumeTotal.toFixed(1)}</strong> / {plannedVolToday.toFixed(1)} m³</span>
                            </div>
                        )}
                        <Link href="/admin/planning">
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5">
                                Detail Planning <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="lg:col-span-4 grid grid-cols-2 gap-2">
                    <Link href="/admin/produksi" className="w-full">
                        <Button size="sm" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-2">
                            <Factory className="w-4 h-4" />
                            <span>Input Produksi</span>
                        </Button>
                    </Link>
                    <Link href="/admin/retase" className="w-full">
                        <Button size="sm" variant="outline" className="w-full h-11 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Konfirmasi Retase</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 4 KPI Tiles */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Produksi Hari Ini */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Produksi Hari Ini</span>
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Factory className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {data.todayVolumeTotal.toFixed(1)}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">m³</span>
                            <span className="text-xs text-slate-400 ml-auto font-medium">
                                {data.todayTrips} Trip
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span className="flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                                {data.todayActiveVehicles} TM · {data.todayActiveDrivers} Sopir
                            </span>
                            <span className="flex items-center gap-1 font-medium text-emerald-600">
                                <CheckCircle2 className="w-3 h-3" />
                                {confirmRate}% Ok
                            </span>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-1">
                        <MiniSparkline data={volumeSparkline} color="#2563EB" />
                    </div>
                </Card>

                {/* 2. Produksi Bulan Ini */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Volume Bulan Ini</span>
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {data.monthVolumeTotal.toFixed(1)}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">m³</span>

                            {data.weekGrowthRate !== null && (
                                <Badge variant="outline" className={`ml-auto text-[10px] px-1.5 py-0 h-4.5 border font-semibold ${
                                    data.weekGrowthRate > 0
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : data.weekGrowthRate < 0
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                    {data.weekGrowthRate > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : data.weekGrowthRate < 0 ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : null}
                                    {data.weekGrowthRate > 0 ? `+${data.weekGrowthRate}%` : `${data.weekGrowthRate}%`}
                                </Badge>
                            )}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>{data.monthTrips} Total Pengiriman</span>
                            <span className="text-slate-400">vs 7h lalu</span>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-1">
                        <MiniSparkline data={confirmedSparkline} color="#6366F1" />
                    </div>
                </Card>

                {/* 3. Estimasi Nilai Omset Produksi */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Omset Bulan Ini</span>
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Banknote className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {formatRupiahCompact(data.estimatedOmsetBulanIni)}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span className="truncate">
                                {data.isSuperAdmin
                                    ? `Retase: ${formatRupiahCompact(data.totalRetaseBulanIni)}`
                                    : "Estimasi harga kontrak m³"}
                            </span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-slate-100 text-slate-600">
                                Gross
                            </Badge>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                        </div>
                    </div>
                </Card>

                {/* 4. Stok Semen Silo */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stok Semen Silo</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4.5 border font-semibold ${stockConfig.bg} ${stockConfig.text} ${stockConfig.border} flex items-center gap-1`}>
                                <StockIcon className="w-3 h-3" />
                                {stockConfig.label}
                            </Badge>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {data.estimasiStokSemen > 0 ? (data.estimasiStokSemen / 1000).toFixed(1) : "0"}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">Ton</span>
                            <span className="text-xs text-slate-400 ml-auto font-medium">
                                ≈ {data.estimasiStokSemen > 0 ? Math.round(data.estimasiStokSemen / 50).toLocaleString('id-ID') : 0} sak
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Silo Batching Plant</span>
                            <span className="text-slate-400">Inflow - Outflow</span>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                            <div
                                className={`h-full rounded-full ${
                                    data.stokStatus === 'SAFE' ? 'bg-emerald-500' : data.stokStatus === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(10, (data.estimasiStokSemen / 50000) * 100))}%` }}
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* 7-Day Trend + Mutu */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                <Card className="lg:col-span-2 border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Trend Produksi 7 Hari Terakhir</CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">
                                Rata-rata: <strong className="text-slate-700">{trendDailyAvg.toFixed(1)} m³/hari</strong> · Total: <strong className="text-slate-700">{trendTotal7Days.toFixed(1)} m³</strong>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                            <span className="flex items-center gap-1.5 text-slate-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Total Volume
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Confirmed
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-4">
                        <div className="h-[210px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.trendData} margin={{ top: 8, right: 10, left: -15, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="volGradOp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="cfmGradOp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}`} width={40} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px', padding: '8px 12px' }}
                                        formatter={(val: any, name: any) => [`${(Number(val) || 0).toFixed(1)} m³`, name === 'volume' ? 'Total' : 'Confirmed']}
                                    />
                                    <Area type="monotone" dataKey="volume" stroke="#2563EB" strokeWidth={2} fill="url(#volGradOp)" dot={false} activeDot={{ r: 4 }} />
                                    <Area type="monotone" dataKey="confirmed" stroke="#10B981" strokeWidth={2} fill="url(#cfmGradOp)" dot={false} activeDot={{ r: 4 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200/80 shadow-xs bg-white flex flex-col">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Distribusi Mutu</CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Bulan {monthName}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-normal">
                            {data.mutuDistribution.length} Mutu
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col justify-center">
                        {data.mutuDistribution.length > 0 ? (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="h-[120px] w-full min-w-0 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.mutuDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={36}
                                                outerRadius={54}
                                                paddingAngle={2}
                                                dataKey="volume"
                                                startAngle={90}
                                                endAngle={-270}
                                            >
                                                {data.mutuDistribution.map((_: any, i: number) => (
                                                    <Cell key={i} fill={MUTU_COLORS[i % MUTU_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ fontSize: '11px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}
                                                formatter={(v: any) => [`${Number(v).toFixed(1)} m³`]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xs font-bold text-slate-800">{mutuTotal.toFixed(0)}</span>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider">m³</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5 border-t border-slate-100 pt-2">
                                    {data.mutuDistribution.slice(0, 4).map((m: any, i: number) => (
                                        <div key={m.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: MUTU_COLORS[i % MUTU_COLORS.length] }} />
                                                <span className="text-slate-700 font-medium truncate">{m.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] flex-shrink-0">
                                                <span className="font-semibold text-slate-800">{m.volume.toFixed(1)} m³</span>
                                                <span className="text-slate-400">
                                                    ({mutuTotal > 0 ? Math.round((m.volume / mutuTotal) * 100) : 0}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-slate-400 text-xs">Belum ada data produksi</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Customer & Recent Activity */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
                <Card className="lg:col-span-2 border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Customer & Proyek</CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Volume bulan {monthName}</CardDescription>
                        </div>
                        <Users className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent className="p-0">
                        {data.topCustomers.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">Belum ada data pengiriman</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {data.topCustomers.map((c: any, i: number) => {
                                    const maxVol = data.topCustomers[0]?.volume || 1
                                    const pct = Math.round((c.volume / maxVol) * 100)
                                    return (
                                        <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
                                                i === 0 ? 'bg-blue-600' : i === 1 ? 'bg-indigo-500' : i === 2 ? 'bg-slate-500' : 'bg-slate-300 text-slate-700'
                                            }`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-xs text-slate-900 truncate">{c.name}</p>
                                                    <span className="text-xs font-bold text-blue-600 ml-2 flex-shrink-0">
                                                        {c.volume.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">m³</span>
                                                    </span>
                                                </div>
                                                <div className="mt-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-1 truncate">
                                                    {c.project} · {c.trips} pengiriman
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aktivitas Pengiriman Terbaru</CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Transaksi real-time</CardDescription>
                        </div>
                        <Link href="/admin/retase">
                            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2">
                                Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {data.recentActivity.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">Belum ada transaksi</div>
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                                {data.recentActivity.map((t: any) => (
                                    <div key={t.id} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50/60 transition-colors">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            t.status === 'Confirmed' ? 'bg-emerald-500' : 'bg-amber-400'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-xs text-slate-800 truncate">
                                                    {t.project?.customer?.customer_name ?? '-'}
                                                </span>
                                                <Badge variant="outline" className={`text-[9px] h-4.5 px-1.5 border font-medium ${
                                                    t.status === 'Confirmed'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {t.status === 'Confirmed' ? 'Confirmed' : 'Pending'}
                                                </Badge>
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                                                <span className="text-slate-700 font-medium">{t.project?.name ?? '-'}</span>
                                                <span>•</span>
                                                <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-600">TM-{t.trip_sequence}</span>
                                                <span>•</span>
                                                <span className="text-blue-600 font-medium">{t.concreteQuality?.name}</span>
                                                <span>•</span>
                                                <span className="font-semibold text-slate-800">{t.volume_cubic} m³</span>
                                                <span>•</span>
                                                <span>{t.driver?.name}</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex-shrink-0 text-right font-mono">
                                            <div>{format(new Date(t.date), "HH:mm")}</div>
                                            <div className="text-[9px] text-slate-300">{format(new Date(t.date), "dd/MM")}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
