import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    TrendingUp, Truck, Wrench, Scale, Landmark,
    Percent, ShieldAlert, ArrowUpRight
} from "lucide-react"
import { fmt, fmtNum } from "../../utils/billing-helpers"

interface RevenueAndTaxAnalysisProps {
    revenueBreakdown: any
    ppnBreakdown: any
    unbilledBreakdown: any
    totalInvoiced: number
    onNavigateTab: (tab: string, filter?: any) => void
}

export function RevenueAndTaxAnalysis({
    revenueBreakdown,
    ppnBreakdown,
    unbilledBreakdown,
    totalInvoiced,
    onNavigateTab,
}: RevenueAndTaxAnalysisProps) {
    return (
        <div className="space-y-4">
            {/* ─── Komposisi Pendapatan Usaha: Beton ReadyMix vs Sewa Alat ─── */}
            <Card className="border-slate-200/80 shadow-2xs bg-white overflow-hidden">
                <CardHeader className="p-3.5 pb-2.5 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-md shadow-xs">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Komposisi Pendapatan Usaha: Beton ReadyMix vs Sewa Alat & Kendaraan
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Perbandingan perolehan gross invoice, realisasi kas, piutang, serta volume (m³) vs durasi sewa
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500 text-[11px]">Total Omset Usaha:</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{fmt(totalInvoiced)}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {/* Visual Segmented Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                                <span className="font-semibold text-slate-800">Beton ReadyMix</span>
                                <span className="font-mono text-blue-600 font-bold">{revenueBreakdown.rmSharePct.toFixed(1)}%</span>
                                <span className="text-slate-400 text-[11px]">({fmt(revenueBreakdown.rmGross)})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-[11px]">({fmt(revenueBreakdown.sewaGross)})</span>
                                <span className="font-mono text-purple-600 font-bold">{revenueBreakdown.sewaSharePct.toFixed(1)}%</span>
                                <span className="font-semibold text-slate-800">Sewa Alat & CP</span>
                                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden p-0.5 shadow-inner">
                            <div
                                style={{ width: `${revenueBreakdown.rmSharePct || (totalInvoiced === 0 ? 100 : 0)}%` }}
                                className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-l-full transition-all duration-500"
                                title={`ReadyMix: ${fmt(revenueBreakdown.rmGross)}`}
                            />
                            <div
                                style={{ width: `${revenueBreakdown.sewaSharePct || 0}%` }}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-r-full transition-all duration-500"
                                title={`Sewa Alat: ${fmt(revenueBreakdown.sewaGross)}`}
                            />
                        </div>
                    </div>

                    {/* Comparative Cards: ReadyMix vs Sewa */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Column 1: ReadyMix */}
                        <div className="p-3.5 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/40 via-white to-blue-50/10 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                                        <Truck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs text-blue-950 uppercase tracking-wide">Divisi Produksi Beton Cor</div>
                                        <div className="text-[11px] text-slate-500">ReadyMix batching plant & pengiriman mixer</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-mono text-[10px]">
                                    {revenueBreakdown.rmInvoiceCount} Faktur
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tagihan Gross</span>
                                    <span className="text-sm font-bold font-mono text-slate-900 block mt-0.5">{fmt(revenueBreakdown.rmGross)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Kas Diterima</span>
                                    <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">{fmt(revenueBreakdown.rmPaid)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Sisa Piutang</span>
                                    <span className="text-sm font-bold font-mono text-amber-700 block mt-0.5">{fmt(revenueBreakdown.rmOutstanding)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Kubikasi</span>
                                    <span className="text-sm font-bold font-mono text-blue-700 block mt-0.5">{fmtNum(revenueBreakdown.rmVolume, 1)} m³</span>
                                </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-blue-100/40 border border-blue-200 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[10px] font-semibold text-blue-900 uppercase block">Antrean Siap Tagih (Unbilled)</span>
                                    <span className="text-slate-600 text-[11px]">
                                        {unbilledBreakdown.rmCount} Pengiriman · {fmtNum(unbilledBreakdown.rmVolume, 1)} m³
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold font-mono text-blue-900 text-xs block">{fmt(unbilledBreakdown.rmEstValue)}</span>
                                    <button
                                        onClick={() => onNavigateTab("unbilled", { type: "READYMIX" })}
                                        className="text-[10px] text-blue-700 font-semibold hover:underline cursor-pointer"
                                    >
                                        Buka Cor →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Sewa Alat & Kendaraan */}
                        <div className="p-3.5 rounded-xl border border-purple-200/80 bg-gradient-to-br from-purple-50/40 via-white to-purple-50/10 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                                        <Wrench className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs text-purple-950 uppercase tracking-wide">Divisi Sewa Alat & Kendaraan</div>
                                        <div className="text-[11px] text-slate-500">Concrete Pump, Excavator, Crane & Alat Berat</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 font-mono text-[10px]">
                                    {revenueBreakdown.sewaInvoiceCount} Faktur
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tagihan Gross</span>
                                    <span className="text-sm font-bold font-mono text-purple-950 block mt-0.5">{fmt(revenueBreakdown.sewaGross)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Kas Diterima</span>
                                    <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">{fmt(revenueBreakdown.sewaPaid)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Sisa Piutang</span>
                                    <span className="text-sm font-bold font-mono text-amber-700 block mt-0.5">{fmt(revenueBreakdown.sewaOutstanding)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Durasi Sewa</span>
                                    <span className="text-sm font-bold font-mono text-purple-700 block mt-0.5">{revenueBreakdown.sewaDays} Hari</span>
                                </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-purple-100/40 border border-purple-200 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[10px] font-semibold text-purple-900 uppercase block">Antrean Siap Tagih (Unbilled)</span>
                                    <span className="text-slate-600 text-[11px]">
                                        {unbilledBreakdown.sewaCount} Transaksi · {unbilledBreakdown.sewaDays} Hari Kerja
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold font-mono text-purple-900 text-xs block">{fmt(unbilledBreakdown.sewaEstValue)}</span>
                                    <button
                                        onClick={() => onNavigateTab("unbilled", { type: "SEWA" })}
                                        className="text-[10px] text-purple-700 font-semibold hover:underline cursor-pointer"
                                    >
                                        Buka Sewa →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Monitoring Pajak PPN: Pakai PPN vs Non-PPN & Kewajiban Pajak 11% ─── */}
            <Card className="border-slate-200/80 shadow-2xs bg-white overflow-hidden">
                <CardHeader className="p-3.5 pb-2.5 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-md shadow-xs">
                                <Scale className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                    <span>Monitoring Kepatuhan Pajak: Tagihan Pakai PPN vs Non-PPN</span>
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Pemisahan omzet, realisasi pembayaran, dan estimasi beban PPN 11% yang wajib disetor perusahaan untuk transaksi Non-PPN
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 text-[11px]">Beban PPN Non-PPN (Wajib Setor Kas):</span>
                            <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-mono font-bold text-xs">
                                {fmt(ppnBreakdown.nonPpnPaidTaxLiability)}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {/* Visual Segmented Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                                <span className="font-semibold text-slate-800">Pakai PPN (11%)</span>
                                <span className="font-mono text-emerald-700 font-bold">{ppnBreakdown.ppnSharePct.toFixed(1)}%</span>
                                <span className="text-slate-400 text-[11px]">({fmt(ppnBreakdown.ppnGross)})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-[11px]">({fmt(ppnBreakdown.nonPpnGross)})</span>
                                <span className="font-mono text-amber-700 font-bold">{ppnBreakdown.nonPpnSharePct.toFixed(1)}%</span>
                                <span className="font-semibold text-slate-800">Non-PPN (Bebas PPN)</span>
                                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden p-0.5 shadow-inner">
                            <div
                                style={{ width: `${ppnBreakdown.ppnSharePct || (totalInvoiced === 0 ? 100 : 0)}%` }}
                                className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-l-full transition-all duration-500"
                                title={`Pakai PPN: ${fmt(ppnBreakdown.ppnGross)}`}
                            />
                            <div
                                style={{ width: `${ppnBreakdown.nonPpnSharePct || 0}%` }}
                                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-r-full transition-all duration-500"
                                title={`Non-PPN: ${fmt(ppnBreakdown.nonPpnGross)}`}
                            />
                        </div>
                    </div>

                    {/* Comparative Columns: Pakai PPN vs Non-PPN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Column 1: Pakai PPN */}
                        <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/10 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                                        <Landmark className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs text-emerald-950 uppercase tracking-wide">Faktur Kena Pajak (PPN 11%)</div>
                                        <div className="text-[11px] text-slate-500">Customer membayar PPN resmi (Faktur Pajak Standar)</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-[10px]">
                                    {ppnBreakdown.ppnInvoiceCount} Faktur
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tagihan Gross (DPP+PPN)</span>
                                    <span className="text-sm font-bold font-mono text-slate-900 block mt-0.5">{fmt(ppnBreakdown.ppnGross)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Nilai PPN 11% Terbit</span>
                                    <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">{fmt(ppnBreakdown.ppnTaxAmount)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Kas Masuk Diterima</span>
                                    <span className="text-sm font-bold font-mono text-emerald-800 block mt-0.5">
                                        {fmt(ppnBreakdown.ppnPaid)}
                                        <span className="text-[10px] text-slate-400 font-normal ml-1">({ppnBreakdown.ppnCollectionRate.toFixed(0)}%)</span>
                                    </span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Sisa Piutang Ber-PPN</span>
                                    <span className="text-sm font-bold font-mono text-amber-700 block mt-0.5">{fmt(ppnBreakdown.ppnOutstanding)}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-emerald-900 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                                <span className="font-medium">Antrean Belum Ditagih (Pakai PPN):</span>
                                <button
                                    onClick={() => onNavigateTab("unbilled", { unbilledPpnFilter: "PPN" })}
                                    className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                                    title="Klik untuk lihat transaksi unbilled PPN"
                                >
                                    {unbilledBreakdown.ppnCount} tx ({fmt(unbilledBreakdown.ppnEstValue)}) <ArrowUpRight className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="p-2.5 rounded-lg bg-emerald-100/40 border border-emerald-200 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[10px] font-semibold text-emerald-900 uppercase block">Kepatuhan Pajak PPN Masuk</span>
                                    <span className="text-slate-600 text-[11px]">
                                        PPN telah dibebankan kepada customer pemesan cor/sewa.
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onNavigateTab("invoices", { ppnFilter: "PPN" })}
                                    className="h-7 text-xs bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 cursor-pointer font-medium"
                                >
                                    Filter Faktur PPN →
                                </Button>
                            </div>
                        </div>

                        {/* Column 2: Non-PPN */}
                        <div className="p-3.5 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/10 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-600 text-white rounded-lg">
                                        <Percent className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs text-amber-950 uppercase tracking-wide">Faktur Non-PPN (Bebas Pajak Pelanggan)</div>
                                        <div className="text-[11px] text-slate-500">Customer tidak ditagih PPN (Harga Bersih DPP)</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-mono text-[10px]">
                                    {ppnBreakdown.nonPpnInvoiceCount} Faktur
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tagihan Gross DPP</span>
                                    <span className="text-sm font-bold font-mono text-slate-900 block mt-0.5">{fmt(ppnBreakdown.nonPpnGross)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Kas Masuk Diterima</span>
                                    <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">
                                        {fmt(ppnBreakdown.nonPpnPaid)}
                                        <span className="text-[10px] text-slate-400 font-normal ml-1">({ppnBreakdown.nonPpnCollectionRate.toFixed(0)}%)</span>
                                    </span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Sisa Piutang Non-PPN</span>
                                    <span className="text-sm font-bold font-mono text-amber-700 block mt-0.5">{fmt(ppnBreakdown.nonPpnOutstanding)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                                    <span className="text-[10px] text-amber-800 block uppercase font-bold">Total Potensi PPN 11%</span>
                                    <span className="text-sm font-bold font-mono text-amber-900 block mt-0.5">{fmt(ppnBreakdown.nonPpnEstimatedTaxTotal)}</span>
                                </div>
                            </div>

                            {/* ALERT BOX: Kewajiban Beban Pajak 11% Perusahaan */}
                            <div className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-300 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                                        <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                                        <span>Kewajiban Setor PPN 11% Perusahaan:</span>
                                    </div>
                                    <span className="font-mono font-black text-amber-900 text-sm">
                                        {fmt(ppnBreakdown.nonPpnPaidTaxLiability)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
                                    <span>Dari kas masuk {fmt(ppnBreakdown.nonPpnPaid)} (wajib disetor sendiri 11%)</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onNavigateTab("invoices", { ppnFilter: "NON_PPN" })}
                                        className="h-6 text-[10px] bg-white text-amber-900 border-amber-300 hover:bg-amber-100/50 cursor-pointer font-semibold px-2"
                                    >
                                        Filter Non-PPN →
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-amber-900 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200">
                                <div>
                                    <span className="font-medium block">Antrean Belum Ditagih (Non-PPN):</span>
                                    <span className="text-[10px] text-amber-700">Potensi beban PPN 11%: {fmt(unbilledBreakdown.nonPpnEstimatedTaxTotal)}</span>
                                </div>
                                <button
                                    onClick={() => onNavigateTab("unbilled", { unbilledPpnFilter: "NON_PPN" })}
                                    className="font-mono font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                                    title="Klik untuk lihat transaksi unbilled Non-PPN"
                                >
                                    {unbilledBreakdown.nonPpnCount} tx ({fmt(unbilledBreakdown.nonPpnEstValue)}) <ArrowUpRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
