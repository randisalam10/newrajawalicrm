import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Truck, AlertTriangle, ArrowUpRight, CheckCircle2,
    Receipt, Clock, Layers, AlertCircle, Wrench
} from "lucide-react"
import { fmtNum } from "../../utils/billing-helpers"

interface BranchOperationalDashboardProps {
    activeLocName: string
    unbilledBreakdown: any
    allInvoices: any[]
    statusCounts: any
    overdueInvoices: any[]
    unbilledByCustomer: any[]
    onNavigateTab: (tab: string, filter?: any) => void
}

export function BranchOperationalDashboard({
    activeLocName,
    unbilledBreakdown,
    allInvoices,
    statusCounts,
    overdueInvoices,
    unbilledByCustomer,
    onNavigateTab,
}: BranchOperationalDashboardProps) {
    const now = new Date()

    return (
        <div className="space-y-4 pt-1">
            {/* Header Operasional Cabang */}
            <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                                DASHBOARD OPERASIONAL PENAGIHAN
                            </span>
                            <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px] bg-slate-800">
                                📍 {activeLocName}
                            </Badge>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                            Alur Penagihan & Antrean Pengiriman Cabang
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Fokus pada pemrosesan antrean surat jalan siap invoice, kelengkapan harga mutu, dan monitoring status faktur cabang.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 cursor-pointer font-medium"
                            onClick={() => onNavigateTab("unbilled")}
                        >
                            <Truck className="w-3.5 h-3.5 mr-1.5" />
                            Buka Antrean & Buat Faktur
                        </Button>
                    </div>
                </div>
            </div>

            {/* Peringatan Transaksi Tanpa Harga (jika ada) */}
            {unbilledBreakdown.missingPriceCount > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg mt-0.5 shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-amber-950">
                                Perhatian: {unbilledBreakdown.missingPriceCount} Transaksi Belum Memiliki Harga Kesepakatan ({fmtNum(unbilledBreakdown.missingPriceVolume, 1)} m³ beton cor)
                            </h4>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                                Tiket pengiriman ini tertahan dan belum bisa dibuatkan invoice sampai harga satuan mutu diisi di Master Proyek.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100/60 shrink-0 font-medium cursor-pointer shadow-2xs"
                        onClick={() => onNavigateTab("unbilled", { noPriceOnly: true })}
                    >
                        Lihat Transaksi Tanpa Harga <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                </div>
            )}

            {/* 4 Kartu KPI Operasional Lapangan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Antrean Siap Ditagih */}
                <Card className="border-slate-200/80 shadow-2xs bg-white">
                    <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Antrean Siap Ditagih
                            </span>
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                <Truck className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold text-slate-900 font-mono">
                            {unbilledBreakdown.totalCount} Tiket
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Surat jalan & sewa selesai kirim
                        </div>
                        <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-blue-500" /> Cor ReadyMix:</span>
                                <span className="font-semibold text-slate-800 font-mono">{fmtNum(unbilledBreakdown.rmVolume, 1)} m³</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1"><Wrench className="w-3 h-3 text-purple-500" /> Sewa Alat:</span>
                                <span className="font-semibold text-purple-700 font-mono">{unbilledBreakdown.sewaDays} Hari</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 p-0 cursor-pointer justify-between"
                            onClick={() => onNavigateTab("unbilled")}
                        >
                            <span>Proses Buat Faktur</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                    </CardContent>
                </Card>

                {/* 2. Kelengkapan Harga Mutu */}
                <Card className="border-slate-200/80 shadow-2xs bg-white">
                    <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Validasi Harga Mutu
                            </span>
                            <div className={`p-1.5 rounded-md ${unbilledBreakdown.missingPriceCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {unbilledBreakdown.missingPriceCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </div>
                        </div>
                        <div className={`text-xl font-bold font-mono ${unbilledBreakdown.missingPriceCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {unbilledBreakdown.missingPriceCount > 0 ? `${unbilledBreakdown.missingPriceCount} Belum Ada` : "100% Lengkap"}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                            {unbilledBreakdown.missingPriceCount > 0
                                ? `${fmtNum(unbilledBreakdown.missingPriceVolume, 1)} m³ perlu diset di Master Proyek`
                                : "Seluruh tiket memiliki harga mutu valid"}
                        </div>
                        <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Tiket Berharga:</span>
                                <span className="font-semibold text-emerald-700 font-mono">{unbilledBreakdown.pricedCount} Siap</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Tiket Tanpa Harga:</span>
                                <span className={`font-semibold font-mono ${unbilledBreakdown.missingPriceCount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                    {unbilledBreakdown.missingPriceCount} Tiket
                                </span>
                            </div>
                        </div>
                        {unbilledBreakdown.missingPriceCount > 0 ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 h-7 p-0 cursor-pointer justify-between"
                                onClick={() => onNavigateTab("unbilled", { noPriceOnly: true })}
                            >
                                <span>Periksa Tiket Tertahan</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                        ) : (
                            <div className="h-7 flex items-center text-[10px] text-emerald-700 font-medium">
                                ✓ Siap difakturkan seluruhnya
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Status Faktur Cabang */}
                <Card className="border-slate-200/80 shadow-2xs bg-white">
                    <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Faktur Cabang
                            </span>
                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                                <Receipt className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold text-slate-900 font-mono">
                            {allInvoices.length} Faktur
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Total faktur aktif cabang
                        </div>
                        <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Terbit (Issued):</span>
                                <span className="font-semibold text-blue-600 font-mono">{statusCounts.issued} Faktur</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Lunas (Paid):</span>
                                <span className="font-semibold text-emerald-600 font-mono">{statusCounts.paid} Faktur</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-7 p-0 cursor-pointer justify-between"
                            onClick={() => onNavigateTab("invoices")}
                        >
                            <span>Buka Daftar Faktur</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                    </CardContent>
                </Card>

                {/* 4. Monitoring Jatuh Tempo */}
                <Card className="border-slate-200/80 shadow-2xs bg-white">
                    <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Monitoring Jatuh Tempo
                            </span>
                            <div className={`p-1.5 rounded-md ${overdueInvoices.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className={`text-xl font-bold font-mono ${overdueInvoices.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                            {overdueInvoices.length > 0 ? `${overdueInvoices.length} Faktur` : "Tertib"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            {overdueInvoices.length > 0 ? "Melewati batas jatuh tempo" : "Tidak ada faktur lewat tempo"}
                        </div>
                        <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Sebagian (Partial):</span>
                                <span className="font-semibold text-amber-600 font-mono">{statusCounts.partial} Faktur</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Draft:</span>
                                <span className="font-semibold text-slate-600 font-mono">{statusCounts.draft} Faktur</span>
                            </div>
                        </div>
                        {overdueInvoices.length > 0 ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 h-7 p-0 cursor-pointer justify-between"
                                onClick={() => onNavigateTab("invoices", { status: "ISSUED" })}
                            >
                                <span>Tindak Lanjut Penagihan</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                        ) : (
                            <div className="h-7 flex items-center text-[10px] text-slate-500 font-medium">
                                ✓ Penagihan cabang tertib
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Overdue alert jika ada */}
            {overdueInvoices.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-rose-600 text-white rounded-md shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                <span>Ada {overdueInvoices.length} Faktur Melewati Jatuh Tempo di Cabang Ini</span>
                            </div>
                            <div className="text-[11px] text-rose-700 mt-0.5">
                                Silakan hubungi pelaksana proyek atau PIC penagihan customer untuk follow up fisik / konfirmasi pembayaran.
                            </div>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateTab("invoices", { status: "ISSUED" })}
                        className="h-7 text-xs bg-white text-rose-700 border-rose-300 hover:bg-rose-100/50 self-start sm:self-auto cursor-pointer"
                    >
                        Tampilkan Faktur Jatuh Tempo
                    </Button>
                </div>
            )}

            {/* Worklist Operasional: Antrean Surat Jalan per Pelanggan */}
            <Card className="border-slate-200/80 shadow-2xs bg-white">
                <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                Antrean Surat Jalan & Sewa per Pelanggan (Siap Difakturkan)
                            </CardTitle>
                            <span className="text-[11px] text-slate-500">
                                Daftar pelanggan dengan pengiriman cor atau alat sewa yang belum dibuatkan faktur
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigateTab("unbilled")}
                        className="h-7 text-xs px-2 text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer"
                    >
                        Buka Semua Antrean →
                    </Button>
                </CardHeader>
                <CardContent className="p-3.5 space-y-2">
                    {unbilledByCustomer.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs italic">
                            Semua surat jalan telah selesai dibuatkan faktur. Tidak ada antrean pending.
                        </div>
                    ) : (
                        unbilledByCustomer.map((ub, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 gap-2 text-xs hover:bg-slate-100/60 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-slate-800 truncate flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                            {idx + 1}
                                        </span>
                                        <span className="truncate">{ub.customerName}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-1 ml-7">
                                        <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 text-[10px] px-1.5 py-0 font-medium">
                                            {ub.txCount} Tiket Pengiriman
                                        </Badge>
                                        {ub.hasRm && (
                                            <span className="font-medium text-blue-700 flex items-center gap-1 font-mono">
                                                <Truck className="w-3 h-3" /> {fmtNum(ub.rmVolume, 1)} m³ Cor
                                            </span>
                                        )}
                                        {ub.hasSewa && (
                                            <span className="font-medium text-purple-700 flex items-center gap-1 font-mono">
                                                <Wrench className="w-3 h-3" /> {ub.sewaDays} Hari Sewa
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="self-end sm:self-center shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onNavigateTab("unbilled", { search: ub.customerName })}
                                        className="h-7 text-xs bg-white text-blue-700 border-blue-300 hover:bg-blue-50 font-medium cursor-pointer"
                                    >
                                        Buat Faktur Pelanggan Ini →
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Daftar Faktur Lewat Jatuh Tempo (jika ada) */}
            {overdueInvoices.length > 0 && (
                <Card className="border-rose-200/80 shadow-2xs bg-white">
                    <CardHeader className="p-3.5 pb-2 border-b border-rose-100 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Daftar Faktur Cabang Melewati Batas Jatuh Tempo ({overdueInvoices.length} Faktur)
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Prioritas konfirmasi dan penagihan lapangan kepada penanggung jawab proyek
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigateTab("invoices", { status: "ISSUED" })}
                            className="h-7 text-xs text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer"
                        >
                            Kelola Semua Faktur →
                        </Button>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-rose-50/50 text-[11px] border-b border-rose-100 text-slate-600">
                                <tr>
                                    <th className="text-left p-2.5 font-semibold">No. Invoice</th>
                                    <th className="text-left p-2.5 font-semibold">Pelanggan & Proyek</th>
                                    <th className="text-left p-2.5 font-semibold">Tgl Jatuh Tempo</th>
                                    <th className="text-center p-2.5 font-semibold">Status</th>
                                    <th className="text-right p-2.5 font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {overdueInvoices.slice(0, 5).map((inv: any, idx: number) => {
                                    const dueDate = inv.due_date ? new Date(inv.due_date) : null
                                    const diffDays = dueDate ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
                                    return (
                                        <tr key={idx} className="hover:bg-rose-50/30">
                                            <td className="p-2.5 font-mono font-semibold text-slate-800">
                                                {inv.invoice_number}
                                            </td>
                                            <td className="p-2.5">
                                                <div className="font-semibold text-slate-800">{inv.customerName || "-"}</div>
                                                <div className="text-[10px] text-slate-500">{inv.projectName || "-"}</div>
                                            </td>
                                            <td className="p-2.5">
                                                <div className="text-slate-700 font-medium">
                                                    {dueDate ? dueDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                                                </div>
                                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 mt-0.5">
                                                    Lewat {diffDays} hari
                                                </span>
                                            </td>
                                            <td className="p-2.5 text-center">
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                                                    {inv.status}
                                                </Badge>
                                            </td>
                                            <td className="p-2.5 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onNavigateTab("invoices", { search: inv.invoice_number })}
                                                    className="h-6 text-[11px] text-blue-600 hover:text-blue-800 p-0 font-medium cursor-pointer"
                                                >
                                                    Buka Faktur →
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    )
}
