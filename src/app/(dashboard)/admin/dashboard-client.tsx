"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import {
    Factory, TrendingUp, AlertCircle, Package,
    Truck, CheckCircle2, Clock, Building2,
    ArrowRight, BarChart3, Users, Layers, Zap, CalendarClock, Target, PlayCircle, XCircle
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
    todayPlans: Array<{
        id: string
        volume_plan: number
        status: string
        project: { name: string; customer: { customer_name: string } }
        concreteQuality: { name: string }
        workItem: { name: string }
    }>
}

// Mini sparkline for KPI cards using recharts
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
    const d = data.map((v, i) => ({ v }))
    return (
        <ResponsiveContainer width="100%" height={36}>
            <AreaChart data={d} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg-${color})`} dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    )
}

export function DashboardClient({ data }: { data: DashboardData }) {
    const now = new Date()
    const monthName = format(now, "MMMM yyyy", { locale: idLocale })

    // Sparkline from 7-day trend
    const volumeSparkline = data.trendData.map(d => d.volume)
    const confirmedSparkline = data.trendData.map(d => d.confirmed)

    const mutuTotal = data.mutuDistribution.reduce((s, m) => s + m.volume, 0)

    // Confirmation rate today
    const confirmRate = data.todayTrips > 0
        ? Math.round((data.todayConfirmed / data.todayTrips) * 100)
        : 0

    return (
        <div className="space-y-4">
            {/* ── HEADER ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {data.isSuperAdmin ? "Ringkasan 360° — Semua Cabang Batching Plant" : `Performa Operasional — ${monthName}`}
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    {data.pendingCount > 0 && (
                        <Link href="/admin/retase">
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 gap-1.5 animate-pulse cursor-pointer px-3 py-1">
                                <AlertCircle className="w-3 h-3" />
                                {data.pendingCount} Pending Konfirmasi
                            </Badge>
                        </Link>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border rounded-lg px-3 py-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live · {format(now, "HH:mm")}
                    </div>
                </div>
            </div>

            {/* ── ROW 1: PLANNING HARI INI ── */}
            <Card className="border shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-2 px-5 pt-4 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-primary" />
                            Planning Hari Ini
                        </CardTitle>
                        <CardDescription className="text-[11px]">
                            {data.todayPlans.length > 0
                                ? `${data.todayPlans.length} rencana · ${data.todayPlans.reduce((s, p) => s + p.volume_plan, 0).toFixed(1)} m³ target`
                                : 'Belum ada rencana pengecoran hari ini'}
                        </CardDescription>
                    </div>
                    <Link href="/admin/planning">
                        <Button variant="ghost" size="sm" className="text-[11px] text-slate-400 gap-1 h-6 px-2">
                            Kelola <ArrowRight className="w-3 h-3" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent className="px-5 pb-4 pt-0">
                    {data.todayPlans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-16 text-slate-400 gap-2">
                            <p className="text-xs">Belum ada planning untuk hari ini —</p>
                            <Link href="/admin/planning">
                                <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                                    <CalendarClock className="w-3.5 h-3.5" /> Tambah Planning
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {data.todayPlans.map((plan) => {
                                const statusMap: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
                                    Planned: { label: 'Direncanakan', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock className="w-3 h-3" /> },
                                    OnGoing: { label: 'Berjalan', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <PlayCircle className="w-3 h-3" /> },
                                    Done: { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
                                    Cancelled: { label: 'Dibatalkan', cls: 'bg-slate-100 text-slate-500 border-slate-200', icon: <XCircle className="w-3 h-3" /> },
                                }
                                const s = statusMap[plan.status] || statusMap['Planned']
                                return (
                                    <div key={plan.id} className="border rounded-lg p-3 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${s.cls}`}>
                                                {s.icon}{s.label}
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                                                <Target className="w-3 h-3" />{plan.volume_plan} m³
                                            </span>
                                        </div>
                                        <div className="font-semibold text-xs text-slate-800 truncate">{plan.project.customer.customer_name}</div>
                                        <div className="text-[10px] text-slate-500 truncate">{plan.project.name}</div>
                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                            <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5">{plan.concreteQuality.name}</span>
                                            <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 rounded-full px-2 py-0.5">{plan.workItem.name}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── ROW 2: COMPACT KPI CARDS ── */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {/* Produksi Hari Ini */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 border-none text-white shadow-md">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -translate-y-10 translate-x-10" />
                    </div>
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-start justify-between mb-1">
                            <p className="text-[11px] font-medium text-blue-100 uppercase tracking-wider">Hari Ini</p>
                            <Factory className="h-4 w-4 text-blue-200" />
                        </div>
                        <div className="text-2xl font-bold leading-tight">
                            {data.todayVolumeTotal.toFixed(1)}
                            <span className="text-sm font-normal text-blue-200 ml-1">m³</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-blue-200">
                            <span className="flex items-center gap-0.5"><Truck className="w-2.5 h-2.5" />{data.todayTrips} trip</span>
                            <span className="flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />{data.todayConfirmed} ok</span>
                            {data.todayPending > 0 && (
                                <span className="flex items-center gap-0.5 text-yellow-200"><Clock className="w-2.5 h-2.5" />{data.todayPending}</span>
                            )}
                        </div>
                    </CardContent>
                    <div className="px-4 pb-1">
                        <MiniSparkline data={volumeSparkline} color="#93C5FD" />
                    </div>
                </Card>

                {/* Bulan Ini */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-violet-700 border-none text-white shadow-md">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -translate-y-10 translate-x-10" />
                    </div>
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-start justify-between mb-1">
                            <p className="text-[11px] font-medium text-violet-100 uppercase tracking-wider">{format(now, "MMMM")}</p>
                            <TrendingUp className="h-4 w-4 text-violet-200" />
                        </div>
                        <div className="text-2xl font-bold leading-tight">
                            {data.monthVolumeTotal.toFixed(1)}
                            <span className="text-sm font-normal text-violet-200 ml-1">m³</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-violet-200">
                            <span>{data.monthTrips} pengiriman total</span>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-1">
                        <MiniSparkline data={confirmedSparkline} color="#C4B5FD" />
                    </div>
                </Card>

                {/* Konfirmasi Rate */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 border-none text-white shadow-md">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -translate-y-10 translate-x-10" />
                    </div>
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-start justify-between mb-1">
                            <p className="text-[11px] font-medium text-emerald-100 uppercase tracking-wider">Rate Konfirmasi</p>
                            <Zap className="h-4 w-4 text-emerald-200" />
                        </div>
                        <div className="text-2xl font-bold leading-tight">
                            {confirmRate}
                            <span className="text-sm font-normal text-emerald-200 ml-0.5">%</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-emerald-800/40 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-300 rounded-full transition-all" style={{ width: `${confirmRate}%` }} />
                        </div>
                        <p className="text-[10px] text-emerald-200 mt-1">{data.todayConfirmed} dari {data.todayTrips} trip hari ini</p>
                    </CardContent>
                    <div className="pb-2" />
                </Card>

                {/* Stok Semen */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 border-none text-white shadow-md">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -translate-y-10 translate-x-10" />
                    </div>
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-start justify-between mb-1">
                            <p className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">Est. Stok Semen</p>
                            <Package className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="text-2xl font-bold leading-tight">
                            {data.estimasiStokSemen > 0 ? (data.estimasiStokSemen / 1000).toFixed(1) : "0"}
                            <span className="text-sm font-normal text-slate-300 ml-1">ton</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            ≈ {data.estimasiStokSemen > 0 ? Math.round(data.estimasiStokSemen / 50) : 0} sak · masuk minus pakai
                        </p>
                    </CardContent>
                    <div className="pb-2" />
                </Card>
            </div>

            {/* SuperAdmin: Compact Extra Cards */}
            {data.isSuperAdmin && (
                <div className="grid gap-3 grid-cols-3">
                    <div className="border rounded-lg bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
                        <div className="p-2 rounded-lg bg-blue-50"><Building2 className="w-4 h-4 text-blue-600" /></div>
                        <div>
                            <div className="text-lg font-bold text-slate-800">{data.branchBreakdown.length}</div>
                            <div className="text-[11px] text-slate-500">Cabang Aktif</div>
                        </div>
                    </div>
                    <div className="border rounded-lg bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
                        <div className="p-2 rounded-lg bg-violet-50"><BarChart3 className="w-4 h-4 text-violet-600" /></div>
                        <div>
                            <div className="text-lg font-bold text-slate-800">
                                Rp {(data.totalRetaseBulanIni / 1000000).toFixed(1)}jt
                            </div>
                            <div className="text-[11px] text-slate-500">Retase Bulan Ini</div>
                        </div>
                    </div>
                    <div className="border rounded-lg bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
                        <div className="p-2 rounded-lg bg-amber-50"><AlertCircle className="w-4 h-4 text-amber-600" /></div>
                        <div>
                            <div className="text-lg font-bold text-slate-800">
                                {data.branchBreakdown.reduce((s, b) => s + b.pending, 0)}
                            </div>
                            <div className="text-[11px] text-slate-500">Pending Semua Cabang</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ROW 4: CHARTS + MUTU ── */}

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                {/* Trend Chart (2/3) */}
                <Card className="lg:col-span-2 border shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-2 px-5 pt-4 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-sm font-semibold">Trend Produksi 7 Hari</CardTitle>
                            <CardDescription className="text-[11px]">Volume total vs confirmed (m³)</CardDescription>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />Total</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />Confirmed</span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 pb-3">
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.12} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="cfmGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}`} width={30} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px', padding: '8px 12px' }}
                                        formatter={(val: any, name: any) => [`${(Number(val) || 0).toFixed(1)} m³`, name === 'volume' ? 'Total' : 'Confirmed']}
                                    />
                                    <Area type="monotone" dataKey="volume" name="volume" stroke="#3B82F6" strokeWidth={2} fill="url(#volGrad)" dot={false} activeDot={{ r: 4 }} />
                                    <Area type="monotone" dataKey="confirmed" name="confirmed" stroke="#10B981" strokeWidth={2} fill="url(#cfmGrad)" dot={false} activeDot={{ r: 4 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Mutu + Top Customer side panel (1/3) */}
                <div className="space-y-4">
                    {/* Mutu Donut */}
                    <Card className="border shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-2 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold">Distribusi Mutu</CardTitle>
                            <CardDescription className="text-[11px]">Bulan {format(now, "MMMM")}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                            {data.mutuDistribution.length > 0 ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-[90px] h-[90px] flex-shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={data.mutuDistribution} cx="50%" cy="50%" innerRadius={28} outerRadius={44} paddingAngle={2} dataKey="volume" startAngle={90} endAngle={-270}>
                                                    {data.mutuDistribution.map((_, i) => (
                                                        <Cell key={i} fill={MUTU_COLORS[i % MUTU_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', border: 'none' }} formatter={(v: any) => [`${Number(v).toFixed(1)} m³`]} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 space-y-1 min-w-0">
                                        {data.mutuDistribution.slice(0, 5).map((m, i) => (
                                            <div key={m.name} className="flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: MUTU_COLORS[i % MUTU_COLORS.length] }} />
                                                    <span className="text-slate-600 truncate">{m.name}</span>
                                                </div>
                                                <span className="text-slate-400 ml-1 flex-shrink-0">
                                                    {mutuTotal > 0 ? Math.round((m.volume / mutuTotal) * 100) : 0}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-16 flex items-center justify-center text-slate-400 text-xs">Belum ada data</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick links */}
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: "Input Produksi", href: "/admin/produksi", icon: <Factory className="w-3.5 h-3.5" />, color: "bg-blue-50 text-blue-700 border-blue-100" },
                            { label: "Konfirmasi", href: "/admin/retase", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                            { label: "Surat Jalan", href: "/admin/retase", icon: <Truck className="w-3.5 h-3.5" />, color: "bg-slate-50 text-slate-700 border-slate-100" },
                            { label: "Laporan", href: "/admin/reports/billing", icon: <BarChart3 className="w-3.5 h-3.5" />, color: "bg-violet-50 text-violet-700 border-violet-100" },
                        ].map(l => (
                            <Link key={l.href + l.label} href={l.href}>
                                <div className={`flex items-center gap-1.5 border rounded-lg p-2.5 text-[11px] font-medium cursor-pointer hover:opacity-80 transition-opacity ${l.color}`}>
                                    {l.icon}{l.label}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── ROW 3: SuperAdmin Branch Comparison ── */}
            {data.isSuperAdmin && data.branchBreakdown.length > 0 && (
                <Card className="border shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-2 px-5 pt-4 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-sm font-semibold">Perbandingan Cabang — {monthName}</CardTitle>
                            <CardDescription className="text-[11px]">Volume, trip, dan status per Batching Plant</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 pb-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.branchBreakdown} layout="vertical" margin={{ left: 0, right: 24 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}m³`} />
                                        <YAxis dataKey="locationName" type="category" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} width={70} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '11px' }} formatter={(v: any) => [`${Number(v).toFixed(1)} m³`]} />
                                        <Bar dataKey="volume" name="Volume" fill="#3B82F6" radius={[0, 3, 3, 0]} maxBarSize={18} />
                                        <Bar dataKey="confirmed" name="Confirmed" fill="#10B981" radius={[0, 3, 3, 0]} maxBarSize={18} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-1.5">
                                {data.branchBreakdown.map((branch, i) => (
                                    <div key={branch.locationId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-violet-500' : 'bg-slate-400'}`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-xs text-slate-800">{branch.locationName}</div>
                                                <div className="text-[10px] text-slate-400">{branch.trips} trip · {branch.confirmed} konfirm</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-xs text-blue-600">{branch.volume.toFixed(1)} m³</div>
                                            {branch.pending > 0 && (
                                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-amber-600 border-amber-200 bg-amber-50">
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

            {/* ── ROW 4: TOP CUSTOMERS + RECENT ACTIVITY ── */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
                {/* Top Customers (2/5) */}
                <Card className="lg:col-span-2 border shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-2 px-5 pt-4 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-sm font-semibold">Top Customer</CardTitle>
                            <CardDescription className="text-[11px]">Volume m³ bulan ini</CardDescription>
                        </div>
                        <Users className="h-4 w-4 text-slate-300" />
                    </CardHeader>
                    <CardContent className="p-0">
                        {data.topCustomers.length === 0 ? (
                            <div className="flex items-center justify-center h-20 text-slate-400 text-xs">Belum ada data</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {data.topCustomers.map((c, i) => {
                                    const maxVol = data.topCustomers[0]?.volume || 1
                                    const pct = Math.round((c.volume / maxVol) * 100)
                                    return (
                                        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0
                                                ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-xs text-slate-800 truncate">{c.name}</p>
                                                    <span className="text-xs font-bold text-blue-600 ml-2 flex-shrink-0">{c.volume.toFixed(1)}<span className="text-[10px] text-slate-400 font-normal">m³</span></span>
                                                </div>
                                                <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{c.project} · {c.trips} trip</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity (3/5) */}
                <Card className="lg:col-span-3 border shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-2 px-5 pt-4 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-sm font-semibold">Aktivitas Terbaru</CardTitle>
                            <CardDescription className="text-[11px]">10 transaksi produksi terakhir</CardDescription>
                        </div>
                        <Link href="/admin/retase">
                            <Button variant="ghost" size="sm" className="text-[11px] text-slate-400 gap-1 h-6 px-2">
                                Lihat Semua <ArrowRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {data.recentActivity.length === 0 ? (
                            <div className="flex items-center justify-center h-20 text-slate-400 text-xs">Belum ada aktivitas</div>
                        ) : (
                            <div className="divide-y divide-slate-50 max-h-[340px] overflow-y-auto">
                                {data.recentActivity.map((t: any) => (
                                    <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/60 transition-colors">
                                        {/* Status dot */}
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${t.status === 'Confirmed' ? 'bg-green-500' : 'bg-amber-400'}`} />
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-xs text-slate-800 truncate">
                                                    {t.project?.customer?.customer_name ?? '-'}
                                                </span>
                                                <span className={`text-[10px] font-medium flex-shrink-0 ${t.status === 'Confirmed' ? 'text-green-600' : 'text-amber-500'}`}>
                                                    {t.status === 'Confirmed' ? '✓' : '⏳'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                                <span className="text-slate-500 font-medium">{t.project?.name ?? '-'}</span>
                                                {' · TM-'}{t.trip_sequence}
                                                {' · '}{t.concreteQuality?.name}
                                                {' · '}{t.volume_cubic} m³
                                                {' · '}{t.driver?.name}
                                                {data.isSuperAdmin && t.location && <span className="text-slate-300"> ({t.location.name})</span>}
                                            </div>
                                        </div>
                                        {/* Time */}
                                        <div className="text-[10px] text-slate-400 flex-shrink-0 text-right">
                                            <div>{format(new Date(t.date), "dd/MM")}</div>
                                            <div>{format(new Date(t.date), "HH:mm")}</div>
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
