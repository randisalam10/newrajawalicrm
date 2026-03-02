"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getLogistikDashboardData } from "./actions"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Sector, PieChart, Pie } from 'recharts'
import { Wallet, ShoppingCart, Loader2, Factory, FileText, CheckCircle2, Clock } from "lucide-react"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

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
        const res = await getLogistikDashboardData(filter)
        if (res?.success) {
            setData(res.data)
        }
        setLoading(false)
    }

    if (!data && loading) {
        return <div className="flex h-[400px] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }
    if (!data) return <div>Failed to load dashboard</div>

    const { summary, chartByCategory, companyStats, filterOptions, recentPos } = data

    return (
        <div className="space-y-6 pb-8">
            {/* Filter Section */}
            <Card className="bg-slate-50/50 border-slate-200 shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                        <Wallet className="w-4 h-4" /> Filter Laporan Logistik
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Select value={String(filter.month)} onValueChange={(v) => setFilter(f => ({ ...f, month: parseInt(v) }))}>
                            <SelectTrigger className="w-[140px] bg-white">
                                <SelectValue placeholder="Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={String(filter.year)} onValueChange={(v) => setFilter(f => ({ ...f, year: parseInt(v) }))}>
                            <SelectTrigger className="w-[100px] bg-white">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={filter.companyGroupId} onValueChange={(v) => setFilter(f => ({ ...f, companyGroupId: v }))}>
                            <SelectTrigger className="w-[240px] bg-white font-medium">
                                <SelectValue placeholder="Semua Perusahaan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">-- Semua Perusahaan --</SelectItem>
                                {filterOptions?.companies.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {loading && (
                <div className="fixed inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-slate-500">Total Pengeluaran (Bulan Ini)</p>
                            <Wallet className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-700">Rp {summary.totalPengeluaran.toLocaleString('id-ID')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Dari {summary.totalPo} PO diterbitkan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-slate-500">Total Item Dibeli</p>
                            <ShoppingCart className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{summary.totalItems} <span className="text-sm font-normal text-slate-500">Barang</span></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-slate-500">PO Disetujui</p>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{summary.poApprovedCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-slate-500">PO Draft (Menunggu)</p>
                            <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-amber-600">{summary.poDraftCount}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Kategori Global */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
                        <CardDescription>Persentase belanja barang</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {chartByCategory.length === 0 ? (
                            <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">Belum ada data</div>
                        ) : (
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartByCategory}
                                            dataKey="total"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {chartByCategory.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        <div className="mt-4 space-y-2">
                            {chartByCategory.slice(0, 5).map((cat: any, i: number) => (
                                <div key={cat.name} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-slate-600">{cat.name}</span>
                                    </div>
                                    <span className="font-medium text-slate-900">Rp {cat.total.toLocaleString('id-ID')}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Info Perusahaan (Hanya tampil jika filter "Semua Perusahaan") */}
                {filter.companyGroupId === "all" && (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Breakdown per Perusahaan</CardTitle>
                            <CardDescription>Rincian pengeluaran per perusahaan dan kategori di dalamnya</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {companyStats.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">Belum ada data pengeluaran bulan ini.</div>
                            ) : (
                                <div className="space-y-6">
                                    {companyStats.map((comp: any) => (
                                        <div key={comp.id} className="border rounded-lg p-4 bg-slate-50/50">
                                            <div className="flex justify-between items-center mb-4 pb-2 border-b">
                                                <div className="flex items-center gap-2">
                                                    <Factory className="w-5 h-5 text-blue-600" />
                                                    <h3 className="font-semibold text-slate-800">{comp.name}</h3>
                                                    <Badge variant="outline" className="ml-2 font-mono">{comp.kode}</Badge>
                                                </div>
                                                <div className="text-lg font-bold text-emerald-700">Rp {comp.total.toLocaleString('id-ID')}</div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                                                {comp.categoriesList.map((cat: any) => (
                                                    <div key={cat.name} className="flex flex-col">
                                                        <span className="text-[11px] text-slate-500 uppercase tracking-widest">{cat.name}</span>
                                                        <span className="text-sm font-semibold text-slate-700">Rp {cat.total.toLocaleString('id-ID')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* PO Terbaru */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">10 Purchase Order Terbaru Bulan Ini</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-slate-500">No PO</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-500">Perusahaan</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-500">Tanggal</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-500">Kategori</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                                    <th className="px-4 py-3 text-right font-medium text-slate-500">Total (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {recentPos.length === 0 ? (
                                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">Belum ada transaksi.</td></tr>
                                ) : recentPos.map((po: any) => {
                                    const total = po.items.reduce((acc: number, item: any) => acc + item.subtotal, 0)
                                    return (
                                        <tr key={po.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-mono font-medium">{po.po_number}</td>
                                            <td className="px-4 py-3 text-slate-700">{po.companyGroup?.name}</td>
                                            <td className="px-4 py-3 text-slate-500">{new Date(po.tanggal_terbit).toLocaleDateString('id-ID')}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-100">{po.category?.name}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                {po.status === 'DRAFT' && <Badge variant="secondary" className="bg-slate-200 text-slate-600 hover:bg-slate-200">Draft</Badge>}
                                                {po.status === 'APPROVED' && <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Disetujui</Badge>}
                                                {po.status === 'CANCELLED' && <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">Dibatalkan</Badge>}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-700">{(total).toLocaleString('id-ID')}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
