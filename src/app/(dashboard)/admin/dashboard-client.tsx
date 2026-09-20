"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import {
    Factory, TrendingUp, TrendingDown, AlertCircle, Package,
    Truck, CheckCircle2, Clock, Building2,
    ArrowRight, BarChart3, Users, Layers, Zap, CalendarClock,
    Target, Banknote, ShieldAlert, ShieldCheck,
    Calendar, ArrowUpRight, ArrowDownRight, UserCheck,
    ShoppingCart, FileText, Receipt, Fuel, AlertTriangle,
    Boxes, Sparkles, ExternalLink, PlusCircle
} from "lucide-react"

import Link from "next/link"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

const MUTU_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B']

type DashboardData = {
    isSuperAdmin: boolean
    userContext: {
        role: string
        name: string
        locationId: string
        locationName: string
        isSuperAdmin: boolean
        isCorporate: boolean
    }
    todayVolumeTotal: number
    todayTrips: number
    todayPending: number
    todayConfirmed: number
    todayActiveVehicles: number
    todayActiveDrivers: number
    monthVolumeTotal: number
    monthTrips: number
    estimatedOmsetBulanIni: number
    estimasiStokSemen: number
    stokStatus: 'SAFE' | 'WARNING' | 'CRITICAL'
    trendData: Array<{ date: string; volume: number; confirmed: number }>
    weekGrowthRate: number | null
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
    logistik: {
        totalPoBulanIni: number
        totalNilaiPoBulanIni: number
        poPendingApprovalCount: number
        poApprovedCount: number
        poDraftCount: number
        recentPos: Array<{
            id: string
            po_number: string
            tanggal_terbit: Date | string
            status: string
            categoryName: string
            companyGroupName: string
            totalAmount: number
            itemCount: number
        }>
        pendingPos: Array<{
            id: string
            po_number: string
            tanggal_terbit: Date | string
            status: string
            categoryName: string
            companyGroupName: string
            totalAmount: number
        }>
        totalSemenMasukTon: number
        totalAgregatMasukM3: number
        estimatedMaterialConsumption: {
            semenKg: number
            semenTon: number
        }
    }
    keuangan: {
        unbilledCount: number
        unbilledVolumeTotal: number
        unbilledEstimatedValue: number
        totalInvoiced: number
        totalInvoicePaid: number
        totalOutstandingReceivables: number
        rblBudgetAmount: number
        rblExpensesTotal: number
        rblRemainingBalance: number
        totalSolarLitersRbl: number
        totalSolarCostRbl: number
        hasActiveRbl: boolean
    }
    armada: {
        totalVehiclesCount: number
        activeVehiclesToday: number
    }
}

type Perspective = "all" | "operasional" | "logistik" | "keuangan"

function formatRupiahCompact(amount: number) {
    if (!amount || amount === 0) return "Rp 0"
    if (amount >= 1_000_000_000) {
        return `Rp ${(amount / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`
    }
    if (amount >= 1_000_000) {
        return `Rp ${(amount / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`
    }
    return `Rp ${amount.toLocaleString('id-ID')}`
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
    const d = data.map((v, i) => ({ v }))
    return (
        <div className="w-full h-[30px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#sg-${color.replace('#', '')})`} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

export function DashboardClient({ data }: { data: DashboardData }) {
    const now = new Date()
    const monthName = format(now, "MMMM yyyy", { locale: idLocale })

    // Default perspective based on role
    const defaultPerspective: Perspective = useMemo(() => {
        const role = (data.userContext?.role || "").toLowerCase()
        if (role.includes("logistik")) return "logistik"
        if (role === "operatorbp" || role === "adminbp") return "operasional"
        return "all"
    }, [data.userContext?.role])

    const [perspective, setPerspective] = useState<Perspective>(defaultPerspective)

    // Sparkline series
    const volumeSparkline = data.trendData.map(d => d.volume)
    const confirmedSparkline = data.trendData.map(d => d.confirmed)

    // Summary calculations
    const mutuTotal = data.mutuDistribution.reduce((s, m) => s + m.volume, 0)
    const trendTotal7Days = data.trendData.reduce((s, d) => s + d.volume, 0)
    const trendDailyAvg = trendTotal7Days / (data.trendData.length || 1)

    const confirmRate = data.todayTrips > 0
        ? Math.round((data.todayConfirmed / data.todayTrips) * 100)
        : 0

    const plannedVolToday = data.todayPlans.reduce((s, p) => s + p.volume_plan, 0)

    // Stock status visual config
    const stockConfig = {
        SAFE: { label: 'AMAN', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: ShieldCheck },
        WARNING: { label: 'WASPADA', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertCircle },
        CRITICAL: { label: 'KRITIS', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: ShieldAlert },
    }[data.stokStatus] || { label: 'AMAN', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: ShieldCheck }

    const StockIcon = stockConfig.icon

    // Role display configuration
    const roleConfig = useMemo(() => {
        const role = data.userContext?.role || ""
        if (role === "AdminLogistik") {
            return {
                title: "Logistik & Pengadaan",
                badge: "Admin Logistik",
                badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
                icon: Package
            }
        }
        if (role === "OperatorBP") {
            return {
                title: "Operasional Batching",
                badge: "Operator BP",
                badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
                icon: Factory
            }
        }
        if (role === "AdminBP") {
            return {
                title: "Operasional & Kas BP",
                badge: "Admin Batching Plant",
                badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
                icon: Building2
            }
        }
        return {
            title: "Ringkasan Eksekutif",
            badge: data.userContext?.isSuperAdmin ? "Super Admin" : role || "Eksekutif",
            badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
            icon: Building2
        }
    }, [data.userContext?.role, data.userContext?.isSuperAdmin])

    const RoleIcon = roleConfig.icon

    return (
        <div className="space-y-4">
            {/* ── 1. ROLE BADGE & STATUS BAR ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 px-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`text-xs font-semibold px-2 py-0.5 border ${roleConfig.badgeColor}`}>
                        <RoleIcon className="w-3 h-3 mr-1 inline" />
                        {roleConfig.badge}
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 font-medium">
                        {data.userContext?.locationName || (data.isSuperAdmin ? "Semua Lokasi" : "Batching Plant")}
                    </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Logistik Alert Badge */}
                    {data.logistik?.poPendingApprovalCount > 0 && (
                        <Link href="/logistik/approval">
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer px-2.5 py-1 text-xs font-medium">
                                <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                                {data.logistik.poPendingApprovalCount} PO Butuh Approval
                            </Badge>
                        </Link>
                    )}

                    {/* Unbilled Alert Badge */}
                    {data.keuangan?.unbilledCount > 0 && (
                        <Link href="/admin/billing">
                            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800 gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer px-2.5 py-1 text-xs font-medium">
                                <Receipt className="w-3 h-3 text-blue-600" />
                                {data.keuangan.unbilledCount} Siap Tagih
                            </Badge>
                        </Link>
                    )}

                    {/* Pending Retase */}
                    {data.pendingCount > 0 && (
                        <Link href="/admin/retase">
                            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-800 gap-1.5 hover:bg-orange-100 transition-colors cursor-pointer px-2.5 py-1 text-xs font-medium">
                                <Clock className="w-3 h-3 text-orange-600" />
                                {data.pendingCount} Pending Retase
                            </Badge>
                        </Link>
                    )}

                    <div suppressHydrationWarning className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span suppressHydrationWarning>{format(now, "dd MMM yyyy", { locale: idLocale })}</span>
                        <span className="text-slate-300">|</span>
                        <span suppressHydrationWarning className="font-mono">{format(now, "HH:mm")}</span>
                    </div>
                </div>
            </div>

            {/* ── 2. ROLE PERSPECTIVE SWITCHER TABS ── */}
            <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200 flex flex-wrap items-center gap-1">
                <button
                    onClick={() => setPerspective("all")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        perspective === "all"
                            ? "bg-white text-slate-900 shadow-xs font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                >
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>🏢 Semua (Eksekutif 360°)</span>
                </button>

                <button
                    onClick={() => setPerspective("operasional")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        perspective === "operasional"
                            ? "bg-white text-slate-900 shadow-xs font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                >
                    <Factory className="w-3.5 h-3.5 text-indigo-600" />
                    <span>🏭 Operasional & Produksi</span>
                    {data.pendingCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                            {data.pendingCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setPerspective("logistik")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        perspective === "logistik"
                            ? "bg-white text-slate-900 shadow-xs font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                >
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                    <span>📦 Logistik & Pengadaan</span>
                    {data.logistik?.poPendingApprovalCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                            {data.logistik.poPendingApprovalCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setPerspective("keuangan")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        perspective === "keuangan"
                            ? "bg-white text-slate-900 shadow-xs font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                >
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>💰 Keuangan & Kas RBL</span>
                    {data.keuangan?.unbilledCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                            {data.keuangan.unbilledCount}
                        </span>
                    )}
                </button>

                <div className="ml-auto pr-2 hidden md:flex items-center text-[11px] text-slate-500">
                    <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
                    <span>Tampilan aktif: <strong className="text-slate-700 capitalize">{perspective}</strong></span>
                </div>
            </div>

            {/* ── 3. ACTION & NOTIFICATION CALLOUTS ── */}
            {perspective === "logistik" && data.logistik?.poPendingApprovalCount > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-amber-950 flex items-center gap-2">
                                <span>Perhatian Tim Logistik & Approval</span>
                                <Badge variant="secondary" className="bg-amber-200/80 text-amber-900 text-[10px] h-4">
                                    {data.logistik.poPendingApprovalCount} Menunggu Tindakan
                                </Badge>
                            </div>
                            <div className="text-[11px] text-amber-800/90 mt-0.5">
                                Terdapat {data.logistik.poPendingApprovalCount} Purchase Order yang telah diajukan dan membutuhkan review atau persetujuan pimpinan.
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                        <Link href="/logistik/approval">
                            <Button size="sm" className="h-8 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-xs">
                                Buka Halaman Approval <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {perspective === "keuangan" && data.keuangan?.unbilledCount > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                            <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-blue-950 flex items-center gap-2">
                                <span>Peluang Penagihan (Unbilled Pool)</span>
                                <Badge variant="secondary" className="bg-blue-200/80 text-blue-900 text-[10px] h-4">
                                    {data.keuangan.unbilledCount} Tiket Siap Invoice
                                </Badge>
                            </div>
                            <div className="text-[11px] text-blue-800/90 mt-0.5">
                                Ada {data.keuangan.unbilledCount} tiket pengiriman ({data.keuangan.unbilledVolumeTotal.toFixed(1)} m³) dengan estimasi nilai {formatRupiahCompact(data.keuangan.unbilledEstimatedValue)} yang siap ditagihkan ke customer.
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                        <Link href="/admin/billing">
                            <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs">
                                Buat Invoice Sekarang <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {data.stokStatus === "CRITICAL" && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 px-4 flex items-center justify-between gap-3 text-rose-900">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
                        <div>
                            <span className="text-xs font-bold">Peringatan: Stok Semen Silo Berada di Level Kritis!</span>
                            <p className="text-[11px] text-rose-700 mt-0.5">
                                Sisa estimasi semen saat ini hanya {data.estimasiStokSemen > 0 ? (data.estimasiStokSemen / 1000).toFixed(1) : 0} Ton. Segera lakukan pengadaan semen untuk mencegah terhentinya produksi cor.
                            </p>
                        </div>
                    </div>
                    <Link href="/logistik/po">
                        <Button size="sm" variant="destructive" className="h-7 text-xs flex-shrink-0">
                            + Order Semen (PO)
                        </Button>
                    </Link>
                </div>
            )}

            {/* ── 4. CONDITIONAL VIEW: PERSPECTIVE CONTENT ── */}
            {perspective === "all" && (
                <AllPerspectiveView
                    data={data}
                    monthName={monthName}
                    stockConfig={stockConfig}
                    volumeSparkline={volumeSparkline}
                    confirmedSparkline={confirmedSparkline}
                    trendDailyAvg={trendDailyAvg}
                    trendTotal7Days={trendTotal7Days}
                    mutuTotal={mutuTotal}
                    plannedVolToday={plannedVolToday}
                />
            )}

            {perspective === "operasional" && (
                <OperasionalPerspectiveView
                    data={data}
                    monthName={monthName}
                    stockConfig={stockConfig}
                    volumeSparkline={volumeSparkline}
                    confirmedSparkline={confirmedSparkline}
                    confirmRate={confirmRate}
                    trendDailyAvg={trendDailyAvg}
                    trendTotal7Days={trendTotal7Days}
                    mutuTotal={mutuTotal}
                    plannedVolToday={plannedVolToday}
                />
            )}

            {perspective === "logistik" && (
                <LogistikPerspectiveView
                    data={data}
                    monthName={monthName}
                    stockConfig={stockConfig}
                />
            )}

            {perspective === "keuangan" && (
                <KeuanganPerspectiveView
                    data={data}
                    monthName={monthName}
                />
            )}
        </div>
    )
}

// =========================================================================
// 1. ALL PERSPECTIVE (RINGKASAN EKSEKUTIF 360°)
// =========================================================================
function AllPerspectiveView({
    data, monthName, stockConfig, volumeSparkline, confirmedSparkline,
    trendDailyAvg, trendTotal7Days, mutuTotal, plannedVolToday
}: any) {
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

// =========================================================================
// 2. OPERASIONAL & PRODUKSI PERSPECTIVE
// =========================================================================
function OperasionalPerspectiveView({
    data, monthName, stockConfig, volumeSparkline, confirmedSparkline,
    confirmRate, trendDailyAvg, trendTotal7Days, mutuTotal, plannedVolToday
}: any) {
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

// =========================================================================
// 3. LOGISTIK & PENGADAAN PERSPECTIVE
// =========================================================================
function LogistikPerspectiveView({ data, monthName, stockConfig }: any) {
    const StockIcon = stockConfig.icon
    const logistik = data.logistik || {}

    return (
        <div className="space-y-4">
            {/* 4 Specialized Logistics KPI Tiles */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Nilai PO */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nilai Pengadaan Bulan Ini</span>
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {formatRupiahCompact(logistik.totalNilaiPoBulanIni || 0)}
                            </span>
                            <span className="text-xs text-slate-400 ml-auto font-medium">
                                {logistik.totalPoBulanIni || 0} PO Terbit
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Approved: <strong>{logistik.poApprovedCount || 0}</strong></span>
                            <span className="text-slate-400">Draft: {logistik.poDraftCount || 0}</span>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
                        </div>
                    </div>
                </Card>

                {/* PO Pending Approval */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Butuh Approval / Review</span>
                            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-orange-600 tracking-tight">
                                {logistik.poPendingApprovalCount || 0}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">PO Tertunda</span>
                            <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 h-4.5 border-orange-200 bg-orange-50 text-orange-700">
                                Verifikasi
                            </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Status: SUBMITTED</span>
                            <Link href="/logistik/approval" className="text-orange-600 hover:underline font-medium">
                                Tindak Lanjut →
                            </Link>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                            <div
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${logistik.poPendingApprovalCount > 0 ? 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Material Inflow (Semen & Agregat) */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Material Masuk Bulan Ini</span>
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Package className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <div>
                                <div className="text-[10px] text-slate-400 font-medium">Semen Inflow</div>
                                <div className="text-xl font-bold text-slate-900">
                                    {(logistik.totalSemenMasukTon || 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">Ton</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400 font-medium">Agregat & Pasir</div>
                                <div className="text-xl font-bold text-blue-600">
                                    {(logistik.totalAgregatMasukM3 || 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">m³</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Penerimaan Batching Plant</span>
                            <span className="text-slate-400">Gudang & Silo</span>
                        </div>
                    </CardContent>
                    <div className="px-4 pb-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '80%' }} />
                        </div>
                    </div>
                </Card>

                {/* Silo Semen & Pemakaian Produksi */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stok Silo vs Pemakaian</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4.5 border font-semibold ${stockConfig.bg} ${stockConfig.text} ${stockConfig.border} flex items-center gap-1`}>
                                <StockIcon className="w-3 h-3" />
                                {stockConfig.label}
                            </Badge>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <div>
                                <div className="text-[10px] text-slate-400 font-medium">Sisa Stok Silo</div>
                                <div className="text-xl font-bold text-slate-900">
                                    {(data.estimasiStokSemen > 0 ? data.estimasiStokSemen / 1000 : 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">Ton</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400 font-medium">Terpakai Cor</div>
                                <div className="text-xl font-bold text-slate-700">
                                    {(logistik.estimatedMaterialConsumption?.semenTon || 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">Ton</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>Coverage Stok</span>
                            <span className="text-slate-400">≈ {data.estimasiStokSemen > 0 ? Math.round(data.estimasiStokSemen / 50).toLocaleString('id-ID') : 0} sak</span>
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

            {/* Quick Logistics Action Bar */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 px-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        Aksi Cepat Logistik & Pengadaan
                    </span>
                    <span className="text-[11px] text-slate-400">Manajemen PO, Material & Stok</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Link href="/logistik/po">
                        <Button size="sm" className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5">
                            <ShoppingCart className="w-4 h-4" />
                            <span>Daftar & Buat PO</span>
                        </Button>
                    </Link>
                    <Link href="/logistik/approval">
                        <Button size="sm" variant="outline" className="w-full h-10 border-slate-200 hover:bg-amber-50 hover:text-amber-800 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Approval Purchase Order</span>
                        </Button>
                    </Link>
                    <Link href="/admin/material-in">
                        <Button size="sm" variant="outline" className="w-full h-10 border-slate-200 hover:bg-blue-50 hover:text-blue-800 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5">
                            <Boxes className="w-4 h-4 text-blue-600" />
                            <span>Penerimaan Semen (Silo)</span>
                        </Button>
                    </Link>
                    <Link href="/logistik/master-barang">
                        <Button size="sm" variant="outline" className="w-full h-10 border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5">
                            <Layers className="w-4 h-4 text-slate-500" />
                            <span>Master Barang & Stok</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* PO Lists: Pending Approval (Left) & Recent POs (Right) */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {/* Pending Approval PO List */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-600" />
                                PO Menunggu Persetujuan
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Perlu tindakan verifikasi approval</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[11px] font-semibold text-amber-700 bg-amber-50 border-amber-200">
                            {logistik.poPendingApprovalCount || 0} Menunggu
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        {(!logistik.pendingPos || logistik.pendingPos.length === 0) ? (
                            <div className="p-8 text-center text-xs text-slate-400">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                                Tidak ada PO yang tertunda saat ini. Semua telah diproses.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
                                {logistik.pendingPos.map((po: any) => (
                                    <div key={po.id} className="p-3 px-4 hover:bg-amber-50/40 transition-colors flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-xs text-slate-900 font-mono">{po.po_number}</span>
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-amber-300 bg-amber-50 text-amber-800">
                                                    SUBMITTED
                                                </Badge>
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                                                <span className="text-slate-700 font-medium">{po.companyGroupName}</span>
                                                <span>•</span>
                                                <span>{po.categoryName}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-xs font-bold text-amber-900">
                                                {formatRupiahCompact(po.totalAmount)}
                                            </div>
                                            <Link href="/logistik/approval" className="text-[10px] text-blue-600 hover:underline font-medium">
                                                Review →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent POs with Status */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <ShoppingCart className="w-4 h-4 text-blue-600" />
                                Riwayat Purchase Order Terbaru
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">PO yang diterbitkan bulan {monthName}</CardDescription>
                        </div>
                        <Link href="/logistik/po">
                            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2">
                                Semua PO <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {(!logistik.recentPos || logistik.recentPos.length === 0) ? (
                            <div className="p-8 text-center text-xs text-slate-400">Belum ada Purchase Order terbit</div>
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
                                {logistik.recentPos.map((po: any) => (
                                    <div key={po.id} className="p-3 px-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3">
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
            </div>
        </div>
    )
}

// =========================================================================
// 4. KEUANGAN & KAS RBL PERSPECTIVE
// =========================================================================
function KeuanganPerspectiveView({ data, monthName }: any) {
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
