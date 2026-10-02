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
    Factory, ShoppingCart, Receipt, Banknote, Package,
    Truck, CheckCircle2, Clock, ArrowRight, Zap
} from "lucide-react"
import { formatRupiahCompact, MiniSparkline } from "../dashboard-helpers"
import { MUTU_COLORS, DashboardData } from "../dashboard-types"

interface AllPerspectiveViewProps {
    data: DashboardData
    monthName: string
    stockConfig: any
    volumeSparkline: number[]
    confirmedSparkline: number[]
    trendDailyAvg: number
    trendTotal7Days: number
    mutuTotal: number
    plannedVolToday: number
}

export function AllPerspectiveView({
    data, monthName, stockConfig, volumeSparkline, confirmedSparkline,
    trendDailyAvg, trendTotal7Days, mutuTotal, plannedVolToday
}: AllPerspectiveViewProps) {
    const StockIcon = stockConfig.icon

    return (
        <div className="space-y-4">
            {/* 4 Pillars Cross-Functional KPI Cards */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Pillar 1: Produksi & Operasional */}
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
                            <span>Bulan Ini: <strong>{data.monthVolumeTotal.toFixed(1)} m³</strong></span>
                            <span className="text-emerald-600 font-medium">{data.todayConfirmed} Terkonfirmasi</span>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-1">
                        <MiniSparkline data={volumeSparkline} color="#2563EB" />
                    </div>
                </Card>

                {/* Pillar 2: Logistik & Pengadaan PO */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pengadaan PO Bulan Ini</span>
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {formatRupiahCompact(data.logistik?.totalNilaiPoBulanIni || 0)}
                            </span>
                            <span className="text-xs text-slate-400 ml-auto font-medium">
                                {data.logistik?.totalPoBulanIni || 0} PO
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span className="flex items-center gap-1 text-amber-700 font-medium">
                                <Clock className="w-3 h-3 text-amber-500" />
                                {data.logistik?.poPendingApprovalCount || 0} Butuh Approval
                            </span>
                            <span className="text-slate-400">{data.logistik?.poApprovedCount || 0} Approved</span>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                            <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{
                                    width: `${data.logistik?.totalPoBulanIni > 0 ? Math.min(100, Math.round(((data.logistik?.poApprovedCount || 0) / data.logistik.totalPoBulanIni) * 100)) : 0}%`
                                }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Pillar 3: Billing & Penagihan */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Ditagih (Unbilled)</span>
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Receipt className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {data.keuangan?.unbilledCount || 0}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">Tiket</span>
                            <span className="text-xs text-indigo-600 ml-auto font-medium">
                                ≈ {formatRupiahCompact(data.keuangan?.unbilledEstimatedValue || 0)}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Vol: <strong>{(data.keuangan?.unbilledVolumeTotal || 0).toFixed(1)} m³</strong></span>
                            <Link href="/admin/billing" className="text-indigo-600 hover:underline font-medium flex items-center gap-0.5">
                                Tagih <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
                        </div>
                    </div>
                </Card>

                {/* Pillar 4: Sisa Kas RBL & Silo Semen */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kas RBL & Stok Semen</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4.5 border font-semibold ${stockConfig.bg} ${stockConfig.text} ${stockConfig.border} flex items-center gap-1`}>
                                <StockIcon className="w-3 h-3" />
                                {stockConfig.label}
                            </Badge>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <div>
                                <div className="text-[10px] text-slate-400 font-medium">Saldo Kas RBL</div>
                                <div className="text-lg font-bold text-emerald-700">
                                    {formatRupiahCompact(data.keuangan?.rblRemainingBalance || 0)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400 font-medium">Silo Semen</div>
                                <div className="text-lg font-bold text-slate-900">
                                    {(data.estimasiStokSemen > 0 ? data.estimasiStokSemen / 1000 : 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">Ton</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Solar: {data.keuangan?.totalSolarLitersRbl || 0} L</span>
                            <span className="text-slate-400">Armada: {data.armada?.activeVehiclesToday || 0}/{data.armada?.totalVehiclesCount || 0}</span>
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

            {/* Quick Access Corporate Actions Hub */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 px-4 shadow-xs">
                <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                        Pusat Aksi Cepat Terpadu
                    </span>
                    <span className="text-[11px] text-slate-400">Pintas navigasi modul operasional & manajemen</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    <Link href="/admin/produksi">
                        <Button variant="outline" size="sm" className="w-full h-9 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-xs font-medium justify-start gap-1.5">
                            <Factory className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate">Input Produksi</span>
                        </Button>
                    </Link>
                    <Link href="/admin/retase">
                        <Button variant="outline" size="sm" className="w-full h-9 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-xs font-medium justify-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">Konfirmasi Retase</span>
                        </Button>
                    </Link>
                    <Link href="/logistik/po">
                        <Button variant="outline" size="sm" className="w-full h-9 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 text-xs font-medium justify-start gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span className="truncate">Daftar PO</span>
                        </Button>
                    </Link>
                    <Link href="/admin/material-in">
                        <Button variant="outline" size="sm" className="w-full h-9 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-xs font-medium justify-start gap-1.5">
                            <Package className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            <span className="truncate">Material Semen</span>
                        </Button>
                    </Link>
                    <Link href="/admin/billing">
                        <Button variant="outline" size="sm" className="w-full h-9 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-xs font-medium justify-start gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate">Billing & Invoice</span>
                        </Button>
                    </Link>
                    <Link href="/admin/rbl">
                        <Button variant="outline" size="sm" className="w-full h-9 border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 text-xs font-medium justify-start gap-1.5">
                            <Banknote className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                            <span className="truncate">Rekap Kas RBL</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* SuperAdmin Cabang Breakdown */}
            {data.isSuperAdmin && data.branchBreakdown?.length > 0 && (
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Perbandingan Cabang Batching Plant</CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Volume produksi & status transaksi bulan {monthName}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[11px] font-normal">
                            {data.branchBreakdown.length} Cabang Aktif
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {data.branchBreakdown.map((b: any, i: number) => (
                                <div key={b.locationId} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-slate-800 truncate">{b.locationName}</span>
                                        <span className="text-[10px] font-mono text-slate-400">#{i + 1}</span>
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-lg font-bold text-blue-600">{b.volume.toFixed(1)} <span className="text-xs font-normal text-slate-400">m³</span></span>
                                        <span className="text-xs text-slate-500">{b.trips} trip</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-200/60">
                                        <span>{b.confirmed} confirmed</span>
                                        {b.pending > 0 ? (
                                            <span className="text-amber-600 font-semibold">{b.pending} pending</span>
                                        ) : (
                                            <span className="text-emerald-600">Lengkap</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Visual Analytics Row: Trend 7 Hari + Mutu Beton */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                {/* 7-Day Trend Chart */}
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
                                        <linearGradient id="volGradAll" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="cfmGradAll" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}`} width={40} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: '1px solid #E2E8F0',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                            fontSize: '11px',
                                            padding: '8px 12px'
                                        }}
                                        formatter={(val: any, name: any) => [`${(Number(val) || 0).toFixed(1)} m³`, name === 'volume' ? 'Total Produksi' : 'Confirmed']}
                                    />
                                    <Area type="monotone" dataKey="volume" name="volume" stroke="#2563EB" strokeWidth={2} fill="url(#volGradAll)" dot={false} activeDot={{ r: 4 }} />
                                    <Area type="monotone" dataKey="confirmed" name="confirmed" stroke="#10B981" strokeWidth={2} fill="url(#cfmGradAll)" dot={false} activeDot={{ r: 4 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Mutu Composition Donut */}
                <Card className="border border-slate-200/80 shadow-xs bg-white flex flex-col">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Distribusi Mutu</CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Komposisi beton bulan {monthName}</CardDescription>
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
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider">m³ Total</span>
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
                                                <span className="text-slate-400 font-normal">
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

            {/* Bottom 2-Column: Recent PO Activity & Recent Deliveries */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {/* Recent PO Snapshot */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <ShoppingCart className="w-4 h-4 text-amber-600" />
                                Aktivitas Pengadaan (PO) Terbaru
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Status PO pengadaan & barang masuk</CardDescription>
                        </div>
                        <Link href="/logistik/po">
                            <Button variant="ghost" size="sm" className="text-xs text-amber-600 hover:text-amber-700 h-6 px-2">
                                Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {(!data.logistik?.recentPos || data.logistik.recentPos.length === 0) ? (
                            <div className="p-8 text-center text-xs text-slate-400">Belum ada Purchase Order bulan ini</div>
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                                {data.logistik.recentPos.slice(0, 5).map((po: any) => (
                                    <div key={po.id} className="p-3 px-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-xs text-slate-900 font-mono">{po.po_number}</span>
                                                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border font-medium ${
                                                    po.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    po.status === 'SUBMITTED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    po.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                    {po.status}
                                                </Badge>
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                                                <span>{po.companyGroupName}</span>
                                                <span>•</span>
                                                <span className="text-slate-700">{po.categoryName}</span>
                                                <span>•</span>
                                                <span>{po.itemCount} Item</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-xs font-bold text-slate-900">
                                                {formatRupiahCompact(po.totalAmount)}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                {format(new Date(po.tanggal_terbit), "dd/MM/yyyy")}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Delivery Transactions */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-blue-600" />
                                Pengiriman Beton Terakhir
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Real-time transaksi retase batching plant</CardDescription>
                        </div>
                        <Link href="/admin/retase">
                            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2">
                                Detail <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {data.recentActivity.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400">Belum ada transaksi hari ini</div>
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                                {data.recentActivity.slice(0, 5).map((t: any) => (
                                    <div key={t.id} className="p-3 px-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-xs text-slate-900 truncate">
                                                    {t.project?.customer?.customer_name ?? '-'}
                                                </span>
                                                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border font-medium ${
                                                    t.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {t.status}
                                                </Badge>
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                                                <span className="text-slate-700 font-medium">{t.project?.name ?? '-'}</span>
                                                <span>•</span>
                                                <span className="text-blue-600 font-medium">{t.concreteQuality?.name}</span>
                                                <span>•</span>
                                                <span>{t.volume_cubic} m³</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 font-mono text-[11px]">
                                            <div className="font-bold text-slate-800">{format(new Date(t.date), "HH:mm")}</div>
                                            <div className="text-[10px] text-slate-400">{format(new Date(t.date), "dd/MM")}</div>
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
