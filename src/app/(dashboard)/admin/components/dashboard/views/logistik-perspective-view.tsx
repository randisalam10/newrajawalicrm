import React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ShoppingCart, Clock, Package, Boxes, Layers,
    CheckCircle2, ArrowRight
} from "lucide-react"
import { formatRupiahCompact } from "../dashboard-helpers"
import { DashboardData } from "../dashboard-types"

interface LogistikPerspectiveViewProps {
    data: DashboardData
    monthName: string
    stockConfig: any
}

export function LogistikPerspectiveView({ data, monthName, stockConfig }: LogistikPerspectiveViewProps) {
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
