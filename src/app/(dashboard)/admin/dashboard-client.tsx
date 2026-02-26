"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import {
    Factory, TrendingUp, AlertCircle, Package,
    Users, Truck, CheckCircle2, Clock, Building2,
    ArrowRight, BarChart3
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

const MUTU_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16']

type DashboardData = {
    isSuperAdmin: boolean
    todayVolumeTotal: number
    todayTrips: number
    todayPending: number
    todayConfirmed: number
    monthVolumeTotal: number
    monthTrips: number
    estimasiStokSemen: number
    trendData: Array<{ date: string; volume: number; confirmed: number }>
    mutuDistribution: Array<{ name: string; volume: number }>
    topCustomers: Array<{ name: string; project: string; volume: number; trips: number }>
    recentActivity: any[]
    pendingCount: number
    branchBreakdown: Array<{
        locationId: string; locationName: string
        volume: number; trips: number; pending: number; confirmed: number
    }>
    totalRetaseBulanIni: number
}

export function DashboardClient({ data }: { data: DashboardData }) {
    const now = new Date()
    const monthName = format(now, "MMMM yyyy", { locale: idLocale })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-1">
                        {data.isSuperAdmin
                            ? "Tampilan 360° — Semua Cabang Batching Plant"
                            : `Performa Operasional — ${monthName}`
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border rounded-lg px-3 py-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live · {format(now, "dd MMM yyyy, HH:mm")}
                </div>
            </div>

            {/* ── KPI SUMMARY CARDS ── */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Produksi Hari Ini */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 border-none text-white shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium text-blue-100">Produksi Hari Ini</CardTitle>
                        <Factory className="h-5 w-5 text-blue-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{data.todayVolumeTotal.toFixed(1)} <span className="text-lg font-normal text-blue-200">m³</span></div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-blue-200">
                            <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {data.todayTrips} trip</span>
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {data.todayConfirmed} konfirm</span>
                            {data.todayPending > 0 && (
                                <span className="flex items-center gap-1 bg-yellow-400/20 rounded px-1 text-yellow-200">
                                    <Clock className="w-3 h-3" /> {data.todayPending} pending
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Card 2: Produksi Bulan Ini */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-violet-700 border-none text-white shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium text-violet-100">Bulan {format(now, "MMMM")}</CardTitle>
                        <TrendingUp className="h-5 w-5 text-violet-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{data.monthVolumeTotal.toFixed(1)} <span className="text-lg font-normal text-violet-200">m³</span></div>
                        <p className="text-xs text-violet-200 mt-2">{data.monthTrips} total pengiriman</p>
                    </CardContent>
                </Card>

                {/* Card 3: Pending Konfirmasi */}
                <Card className={`relative overflow-hidden border-none text-white shadow-lg ${data.pendingCount > 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-slate-500 to-slate-600'}`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium text-orange-100">Perlu Konfirmasi</CardTitle>
                        <AlertCircle className={`h-5 w-5 ${data.pendingCount > 0 ? 'text-yellow-200 animate-pulse' : 'text-slate-300'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{data.pendingCount}</div>
                        <div className="mt-2">
                            <Link href="/admin/retase">
                                <Button variant="ghost" size="sm" className="p-0 h-auto text-xs text-orange-100 hover:text-white hover:bg-transparent gap-1">
                                    Konfirmasi Retase <ArrowRight className="w-3 h-3" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 4: Estimasi Stok Semen */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 border-none text-white shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium text-emerald-100">Est. Stok Semen</CardTitle>
                        <Package className="h-5 w-5 text-emerald-200" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {data.estimasiStokSemen > 0
                                ? `${(data.estimasiStokSemen / 1000).toFixed(1)}`
                                : "0"}
                            <span className="text-lg font-normal text-emerald-200"> ton</span>
                        </div>
                        <p className="text-xs text-emerald-200 mt-2">
                            ~{data.estimasiStokSemen > 0 ? Math.round(data.estimasiStokSemen / 50) : 0} sak (masuk − pakai)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* SuperAdmin Extra Cards */}
            {data.isSuperAdmin && (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm bg-white">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium text-slate-600">Total Cabang Aktif</CardTitle>
                            <Building2 className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-800">{data.branchBreakdown.length}</div>
                            <p className="text-xs text-slate-500 mt-1">Batching Plant beroperasi</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-violet-500 shadow-sm bg-white">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium text-slate-600">Total Retase Bulan Ini</CardTitle>
                            <BarChart3 className="h-4 w-4 text-violet-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-800">
                                Rp {data.totalRetaseBulanIni.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Komisi sopir semua cabang</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium text-slate-600">Pending Semua Cabang</CardTitle>
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-800">
                                {data.branchBreakdown.reduce((s, b) => s + b.pending, 0)}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Transaksi belum dikonfirmasi</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── CHARTS ROW ── */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Trend Chart (2/3 width) */}
                <Card className="lg:col-span-2 border-none shadow-md bg-white overflow-hidden">
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="text-base">Trend Produksi 7 Hari Terakhir</CardTitle>
                        <CardDescription>Volume beton terkirim (m³) per hari</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="confirmedGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}m³`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }}
                                        formatter={(val: any, name: any) => [`${(Number(val) || 0).toFixed(1)} m³`, name === 'volume' ? 'Total' : 'Confirmed']}
                                    />
                                    <Area type="monotone" dataKey="volume" name="Total" stroke="#3B82F6" strokeWidth={2} fill="url(#volumeGrad)" />
                                    <Area type="monotone" dataKey="confirmed" name="Confirmed" stroke="#10B981" strokeWidth={2} fill="url(#confirmedGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Mutu Pie Chart (1/3 width) */}
                <Card className="border-none shadow-md bg-white overflow-hidden">
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="text-base">Distribusi Mutu Beton</CardTitle>
                        <CardDescription>Komposisi order bulan ini</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {data.mutuDistribution.length > 0 ? (
                            <div>
                                <div className="h-[160px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.mutuDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={3}
                                                dataKey="volume"
                                            >
                                                {data.mutuDistribution.map((_, i) => (
                                                    <Cell key={i} fill={MUTU_COLORS[i % MUTU_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '11px' }}
                                                formatter={(val: number | undefined) => [`${(val ?? 0).toFixed(1)} m³`]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-1.5 mt-2">
                                    {data.mutuDistribution.slice(0, 5).map((m, i) => {
                                        const total = data.mutuDistribution.reduce((s, x) => s + x.volume, 0)
                                        const pct = total > 0 ? ((m.volume / total) * 100).toFixed(0) : '0'
                                        return (
                                            <div key={m.name} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MUTU_COLORS[i % MUTU_COLORS.length] }} />
                                                    <span className="text-slate-600 font-medium">{m.name}</span>
                                                </div>
                                                <span className="text-slate-500">{pct}%</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[160px] flex items-center justify-center text-slate-400 text-sm">
                                Belum ada data bulan ini
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── SUPERADMIN: Branch Comparison ── */}
            {data.isSuperAdmin && data.branchBreakdown.length > 0 && (
                <Card className="border-none shadow-md bg-white overflow-hidden">
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="text-base">Perbandingan Kinerja Cabang — {monthName}</CardTitle>
                        <CardDescription>Volume produksi dan jumlah trip per Batching Plant</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Bar Chart */}
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.branchBreakdown}
                                        layout="vertical"
                                        margin={{ left: 10, right: 30 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                                        <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}m³`} />
                                        <YAxis dataKey="locationName" type="category" tick={{ fontSize: 12, fill: '#475569' }} tickLine={false} axisLine={false} width={80} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
                                            formatter={(val: number | undefined) => [`${(val ?? 0).toFixed(1)} m³`]}
                                        />
                                        <Bar dataKey="volume" name="Volume" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={28} />
                                        <Bar dataKey="confirmed" name="Confirmed" fill="#10B981" radius={[0, 4, 4, 0]} maxBarSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Branch Cards */}
                            <div className="space-y-2">
                                {data.branchBreakdown.map((branch, i) => (
                                    <div key={branch.locationId} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-violet-500' : 'bg-slate-400'}`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm text-slate-800">{branch.locationName}</div>
                                                <div className="text-xs text-slate-500">{branch.trips} trip · {branch.confirmed} confirmed</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-800 text-sm">{branch.volume.toFixed(1)} m³</div>
                                            {branch.pending > 0 && (
                                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                                                    {branch.pending} pending
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── BOTTOM TABLES ROW ── */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Top 5 Customers */}
                <Card className="border-none shadow-md bg-white overflow-hidden">
                    <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Top Customer Bulan Ini</CardTitle>
                            <CardDescription>Berdasarkan total kubikasi terkirim</CardDescription>
                        </div>
                        <Users className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent className="p-0">
                        {data.topCustomers.length === 0 ? (
                            <div className="flex items-center justify-center h-24 text-slate-400 text-sm">Belum ada data</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {data.topCustomers.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-300'}`}>
                                                {i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-sm text-slate-800 truncate">{c.name}</div>
                                                <div className="text-[10px] text-slate-400 uppercase truncate">{c.project}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <div className="font-bold text-sm text-blue-600">{c.volume.toFixed(1)} m³</div>
                                            <div className="text-[10px] text-slate-400">{c.trips} trip</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-none shadow-md bg-white overflow-hidden">
                    <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
                            <CardDescription>10 transaksi produksi terakhir</CardDescription>
                        </div>
                        <Link href="/admin/retase">
                            <Button variant="ghost" size="sm" className="text-xs text-slate-500 gap-1 h-7">
                                Lihat Semua <ArrowRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {data.recentActivity.length === 0 ? (
                            <div className="flex items-center justify-center h-24 text-slate-400 text-sm">Belum ada aktivitas</div>
                        ) : (
                            <div className="divide-y divide-slate-50 max-h-[360px] overflow-y-auto">
                                {data.recentActivity.map((t: any) => (
                                    <div key={t.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50/50 transition-colors">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'Confirmed' ? 'bg-green-500' : 'bg-amber-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-xs text-slate-800 truncate">{t.customer.customer_name}</span>
                                                <Badge variant={t.status === 'Confirmed' ? 'default' : 'secondary'} className="text-[10px] h-4 flex-shrink-0">
                                                    {t.status === 'Confirmed' ? 'Confirmed' : 'Pending'}
                                                </Badge>
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                <span className="font-medium text-slate-600">TM-{t.trip_sequence}</span>
                                                {' · '}{t.concreteQuality.name}
                                                {' · '}{t.volume_cubic} m³
                                                {' · '}{t.driver.name}
                                                {data.isSuperAdmin && <span className="ml-1 text-slate-400">({t.location.name})</span>}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex-shrink-0 text-right">
                                            {format(new Date(t.date), "dd MMM\nHH:mm")}
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
