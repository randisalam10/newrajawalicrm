"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Factory, AlertCircle, Package,
    Clock, Building2,
    ArrowRight, Banknote, ShieldAlert, ShieldCheck,
    Calendar, Receipt, Sparkles
} from "lucide-react"

import { DashboardData, Perspective } from "./components/dashboard/dashboard-types"
import { formatRupiahCompact } from "./components/dashboard/dashboard-helpers"
import { AllPerspectiveView } from "./components/dashboard/views/all-perspective-view"
import { OperasionalPerspectiveView } from "./components/dashboard/views/operasional-perspective-view"
import { LogistikPerspectiveView } from "./components/dashboard/views/logistik-perspective-view"
import { KeuanganPerspectiveView } from "./components/dashboard/views/keuangan-perspective-view"

export function DashboardClient({ data }: { data: DashboardData }) {
    const router = useRouter()
    const now = new Date()
    const monthName = data.selectedMonthLabel || format(now, "MMMM yyyy", { locale: idLocale })

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

                    {/* Periode Month Selector */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs hover:border-slate-300 transition-colors">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Periode:</span>
                        <input
                            type="month"
                            value={data.selectedMonth || format(now, "yyyy-MM")}
                            onChange={(e) => {
                                if (e.target.value) {
                                    router.push(`/admin?month=${e.target.value}`)
                                }
                            }}
                            className="text-xs font-semibold text-slate-800 bg-transparent border-none outline-none cursor-pointer focus:ring-0 p-0"
                            title="Pilih Bulan & Tahun Dashboard"
                        />
                    </div>

                    <div suppressHydrationWarning className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-1">
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
