"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getLogistikDashboardData } from "./actions"
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts'
import {
    Wallet, ShoppingCart, Loader2, Factory, FileText, CheckCircle2,
    Clock, XCircle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Building2, Store, Calendar, Layers, ArrowRight, RefreshCw
} from "lucide-react"
import Link from "next/link"

const CATEGORY_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B']
const COMPANY_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#06B6D4', '#EC4899']

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
const months = [
    { value: 1, label: "Januari" }, { value: 2, label: "Februari" },
    { value: 3, label: "Maret" }, { value: 4, label: "April" },
    { value: 5, label: "Mei" }, { value: 6, label: "Juni" },
    { value: 7, label: "Juli" }, { value: 8, label: "Agustus" },
    { value: 9, label: "September" }, { value: 10, label: "Oktober" },
    { value: 11, label: "November" }, { value: 12, label: "Desember" }
]

export function DashboardClient() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [filter, setFilter] = useState({
        month: new Date().getMonth() + 1,
        year: currentYear,
        companyGroupId: "all"
    })

    useEffect(() => {
        loadData()
    }, [filter.month, filter.year, filter.companyGroupId])

    async function loadData() {
        setLoading(true)
        try {
            const res = await getLogistikDashboardData(filter)
            if (res?.success && res?.data) {
                setData(res.data)
            } else {
                console.error("Dashboard data load failed:", res)
            }
        } catch (err) {
            console.error("Failed to fetch logistik dashboard", err)
        } finally {
            setLoading(false)
        }
    }

    if (!data && loading) {
        return (
            <div className="flex h-[450px] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-xs text-slate-400 font-medium">Memuat data logistik...</span>
                </div>
            </div>
        )
    }

    const summary = data?.summary || {
        totalPengeluaran: 0,
        totalPo: 0,
        totalItems: 0,
        poDraftCount: 0,
        poApprovedCount: 0,
        poCancelledCount: 0,
        avgPoValue: 0,
        maxPoValue: 0,
        monthOverMonthChange: null,
        prevMonthTotal: 0
    }
    const chartByCategory = data?.chartByCategory || []
    const companyStats = data?.companyStats || []
    const filterOptions = data?.filterOptions || { companies: [], categories: [] }
    const recentPos = data?.recentPos || []
    const topSuppliers = data?.topSuppliers || []

    const monthLabel = months.find(m => m.value === filter.month)?.label || `Bulan ${filter.month}`

    return (
        <div className="space-y-4 pb-8">
            {/* ── 1. COMPACT EXECUTIVE HEADER WITH INTEGRATED FILTERS ── */}
            <div className="bg-white p-3.5 sm:px-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard Logistik & Pengadaan</h1>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {filter.companyGroupId === 'all' ? 'Konsolidasian' : 'Per Unit'}
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Analisis pengeluaran Purchase Order, performa rekanan & status persetujuan · {monthLabel} {filter.year}
                    </p>
                </div>

                {/* Inline Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={String(filter.month)} onValueChange={(v) => setFilter(f => ({ ...f, month: parseInt(v) }))}>
                        <SelectTrigger className="w-[125px] h-8 text-xs bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(m => <SelectItem key={m.value} value={String(m.value)} className="text-xs">{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={String(filter.year)} onValueChange={(v) => setFilter(f => ({ ...f, year: parseInt(v) }))}>
                        <SelectTrigger className="w-[85px] h-8 text-xs bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filter.companyGroupId} onValueChange={(v) => setFilter(f => ({ ...f, companyGroupId: v }))}>
                        <SelectTrigger className="w-[180px] h-8 text-xs bg-slate-50 border-slate-200 font-medium">
                            <SelectValue placeholder="Semua Perusahaan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">Semua Perusahaan</SelectItem>
                            {filterOptions?.companies.map((c: any) => (
                                <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={loadData} title="Refresh data">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* ── 2. EXECUTIVE KPI CARDS (4 TILES) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Total Belanja */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Belanja (PO)</span>
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Wallet className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-xs font-medium text-slate-400">Rp</span>
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {summary.totalPengeluaran >= 1000000
                                    ? `${(summary.totalPengeluaran / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}`
                                    : summary.totalPengeluaran.toLocaleString('id-ID')}
                            </span>
                            {summary.totalPengeluaran >= 1000000 && <span className="text-xs font-semibold text-slate-400">Jt</span>}

                            {summary.monthOverMonthChange !== null && (
                                <Badge variant="outline" className={`ml-auto text-[10px] px-1.5 py-0 h-4.5 border font-semibold ${
                                    summary.monthOverMonthChange > 0
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : summary.monthOverMonthChange < 0
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                    {summary.monthOverMonthChange > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                    {summary.monthOverMonthChange > 0 ? `+${summary.monthOverMonthChange}%` : `${summary.monthOverMonthChange}%`}
                                </Badge>
                            )}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>{summary.totalPo} PO Diterbitkan</span>
                            <span className="text-slate-400">MoM spend</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Rata-Rata Nilai PO */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-Rata per PO</span>
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-xs font-medium text-slate-400">Rp</span>
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {summary.avgPoValue >= 1000000
                                    ? `${(summary.avgPoValue / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}`
                                    : summary.avgPoValue.toLocaleString('id-ID')}
                            </span>
                            {summary.avgPoValue >= 1000000 && <span className="text-xs font-semibold text-slate-400">Jt</span>}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span className="truncate">Maks: Rp {((summary.maxPoValue || 0) / 1000000).toFixed(1)}jt</span>
                            <span className="text-slate-400">Rasio nilai</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Total Item Dibeli */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Barang</span>
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {summary.totalItems}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">Unit Barang</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span>{chartByCategory.length} Kategori Barang</span>
                            <span className="text-slate-400">Total volume</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Approval Pipeline */}
                <Card className="bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Persetujuan</span>
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-emerald-600">{summary.poApprovedCount}</span>
                                <span className="text-xs text-slate-400">Disetujui</span>
                            </div>
                            <span className="text-slate-200">/</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-amber-500">{summary.poDraftCount}</span>
                                <span className="text-xs text-slate-400">Draft</span>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span className="text-emerald-600 font-medium">{summary.poApprovedCount} siap proses</span>
                            {summary.poCancelledCount > 0 && (
                                <span className="text-rose-500">{summary.poCancelledCount} batal</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── 3. VISUAL ANALYTICS GRID (3 COLUMNS) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* A. Donut Belanja per Kategori (1/3) */}
                <Card className="border border-slate-200/80 shadow-xs bg-white flex flex-col">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pengeluaran per Kategori</CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Proporsi alokasi dana PO</CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-normal">
                            {chartByCategory.length} Kategori
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col justify-center">
                        {chartByCategory.length === 0 ? (
                            <div className="h-[240px] flex items-center justify-center text-slate-400 text-xs">Belum ada pengeluaran</div>
                        ) : (
                            <div className="space-y-3 w-full flex flex-col items-center">
                                <div className="h-[140px] w-full min-w-0 relative flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartByCategory}
                                                dataKey="total"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={42}
                                                outerRadius={62}
                                                paddingAngle={2}
                                            >
                                                {chartByCategory.map((_: any, i: number) => (
                                                    <Cell key={`cell-${i}`} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xs font-bold text-slate-800">
                                            Rp {(summary.totalPengeluaran / 1000000).toFixed(0)}M
                                        </span>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider">Total</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5 border-t border-slate-100 pt-2 w-full">
                                    {chartByCategory.slice(0, 4).map((cat: any, i: number) => {
                                        const pct = summary.totalPengeluaran > 0 ? Math.round((cat.total / summary.totalPengeluaran) * 100) : 0
                                        return (
                                            <div key={cat.name} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                                                    <span className="text-slate-700 font-medium truncate">{cat.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] flex-shrink-0">
                                                    <span className="font-semibold text-slate-800">Rp {(cat.total / 1000000).toFixed(1)}jt</span>
                                                    <span className="text-slate-400">({pct}%)</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* B. Top 5 Supplier / Rekanan (1/3) */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top 5 Supplier / Rekanan</CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Nilai transaksi pengadaan tertinggi</CardDescription>
                        </div>
                        <Store className="w-4 h-4 text-slate-400" />
                    </CardHeader>
                    <CardContent className="p-0">
                        {(!topSuppliers || topSuppliers.length === 0) ? (
                            <div className="h-[240px] flex items-center justify-center text-slate-400 text-xs">Belum ada data supplier</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {topSuppliers.map((s: any, i: number) => {
                                    const maxSpend = topSuppliers[0]?.total || 1
                                    const pct = Math.round((s.total / maxSpend) * 100)
                                    return (
                                        <div key={s.id || i} className="p-3 px-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-[10px] font-bold w-4 text-slate-400">#{i + 1}</span>
                                                    <span className="font-semibold text-xs text-slate-800 truncate">{s.name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-900 ml-2 flex-shrink-0">
                                                    Rp {(s.total / 1000000).toFixed(1)}jt
                                                </span>
                                            </div>
                                            <div className="mt-1.5 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                                                <span>{s.count} transaksi PO</span>
                                                <span>{summary.totalPengeluaran > 0 ? Math.round((s.total / summary.totalPengeluaran) * 100) : 0}% belanja</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* C. Breakdown Unit / Perusahaan (1/3) */}
                <Card className="border border-slate-200/80 shadow-xs bg-white flex flex-col">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Distribusi Unit Usaha</CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">Alokasi belanja per entitas bisnis</CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-normal">
                            {companyStats.length} Perusahaan
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col justify-center">
                        {(!companyStats || companyStats.length === 0) ? (
                            <div className="h-[240px] flex items-center justify-center text-slate-400 text-xs">Belum ada data per unit</div>
                        ) : (
                            <div className="space-y-3 w-full flex flex-col items-center">
                                <div className="h-[140px] w-full min-w-0 relative flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={companyStats}
                                                dataKey="total"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={42}
                                                outerRadius={62}
                                                paddingAngle={2}
                                            >
                                                {companyStats.map((_: any, i: number) => (
                                                    <Cell key={`comp-${i}`} fill={COMPANY_COLORS[i % COMPANY_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xs font-bold text-slate-800">
                                            {companyStats.length}
                                        </span>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider">Unit Usaha</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5 border-t border-slate-100 pt-2 w-full">
                                    {companyStats.slice(0, 4).map((comp: any, i: number) => {
                                        const pct = summary.totalPengeluaran > 0 ? Math.round((comp.total / summary.totalPengeluaran) * 100) : 0
                                        return (
                                            <div key={comp.id || i} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COMPANY_COLORS[i % COMPANY_COLORS.length] }} />
                                                    <span className="font-semibold text-slate-800 truncate">{comp.name}</span>
                                                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-mono text-slate-500 flex-shrink-0">
                                                        {comp.kode}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] flex-shrink-0">
                                                    <span className="font-semibold text-slate-800">Rp {(comp.total / 1000000).toFixed(1)}jt</span>
                                                    <span className="text-slate-400">({pct}%)</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── 4. PO TERBARU TABLE (COMPACT HIGH-DENSITY) ── */}
            <Card className="border border-slate-200/80 shadow-xs bg-white overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Purchase Order Terbaru</CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">10 transaksi PO bulan {monthLabel} {filter.year}</CardDescription>
                    </div>
                    <Link href="/logistik/po">
                        <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2">
                            Lihat Semua PO <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500">
                                <tr>
                                    <th className="px-4 py-2.5 text-left font-semibold">No PO</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Perusahaan</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Tanggal</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Kategori</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Total Nilai</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentPos.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            Belum ada transaksi Purchase Order pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    recentPos.map((po: any) => {
                                        const total = po.items.reduce((acc: number, item: any) => acc + item.subtotal, 0)
                                        return (
                                            <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-4 py-2.5 font-mono font-medium text-slate-900">
                                                    {po.po_number}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-700 font-medium">
                                                    {po.companyGroup?.name}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600 truncate max-w-[160px]">
                                                    {po.supplier?.name || '-'}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                                                    {new Date(po.tanggal_terbit).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                                        {po.category?.name || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {po.status === 'DRAFT' && (
                                                        <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 bg-amber-50 text-amber-700 border-amber-200">
                                                            Draft
                                                        </Badge>
                                                    )}
                                                    {po.status === 'APPROVED' && (
                                                        <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                                                            Disetujui
                                                        </Badge>
                                                    )}
                                                    {po.status === 'CANCELLED' && (
                                                        <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 bg-rose-50 text-rose-700 border-rose-200">
                                                            Batal
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                                                    Rp {total.toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
