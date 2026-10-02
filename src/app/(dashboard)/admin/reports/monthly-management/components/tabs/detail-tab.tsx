"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatRp } from "../formatters"
import { DrilldownData, ScorecardData } from "../../types"

interface DetailTabProps {
    drilldown: DrilldownData
    scorecard: ScorecardData
}

export function DetailTab({ drilldown, scorecard }: DetailTabProps) {
    return (
        <div className="space-y-6">
            {/* 3.1 Detail Produksi */}
            <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-3.5 px-5 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                            3.1 Rekap Penjualan Beton Ready-Mix (Group by Pelanggan &amp; Mutu)
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Rekapitulasi penjualan cor berdasarkan Pelanggan, Proyek, dan Mutu Beton ({drilldown.groupedSales?.length || (drilldown.readymixDetail as any)?.groupedSales?.length || 0} rekap pelanggan &amp; mutu)
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto max-h-[420px]">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100/70 border-b text-slate-700 font-semibold sticky top-0 z-10">
                            <tr>
                                <th className="py-2.5 px-4">Periode Cor</th>
                                <th className="py-2.5 px-4">Pelanggan &amp; Proyek</th>
                                <th className="py-2.5 px-4">Mutu</th>
                                <th className="py-2.5 px-4 text-center">Ritase</th>
                                <th className="py-2.5 px-4 text-right">Vol (m³)</th>
                                <th className="py-2.5 px-4 text-right">Harga DPP / m³</th>
                                <th className="py-2.5 px-4 text-right">Total DPP</th>
                                <th className="py-2.5 px-4 text-right">Total Gross</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(drilldown.groupedSales || (drilldown.readymixDetail as any)?.groupedSales || []).map((g: any, i: number) => (
                                <tr key={g.key || i} className="hover:bg-slate-50/60">
                                    <td className="py-2 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">{g.dateRange || "—"}</td>
                                    <td className="py-2 px-4">
                                        <div className="font-semibold text-slate-800">{g.customer}</div>
                                        <div className="text-[10px] text-slate-500">{g.project}</div>
                                    </td>
                                    <td className="py-2 px-4 font-medium text-slate-700 font-mono">
                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                                            {g.quality}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 text-center font-mono text-slate-600">
                                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                                            {g.tripsCount} Rit
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 text-right font-bold text-blue-700 font-mono">
                                        {Number(g.volume).toLocaleString("id-ID", { minimumFractionDigits: 1 })}
                                    </td>
                                    <td className="py-2 px-4 text-right font-mono text-slate-600">{formatRp(g.unitPrice)}</td>
                                    <td className="py-2 px-4 text-right font-bold text-slate-900 font-mono">{formatRp(g.dppTotal)}</td>
                                    <td className="py-2 px-4 text-right font-bold text-indigo-900 font-mono">{formatRp(g.grossTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-100/90 font-bold border-t text-slate-800 sticky bottom-0 z-10 text-xs">
                            <tr>
                                <td colSpan={3} className="py-2 px-4">
                                    Total Penjualan Ready-Mix
                                </td>
                                <td className="py-2 px-4 text-center font-mono text-blue-800">
                                    {(drilldown.groupedSales || (drilldown.readymixDetail as any)?.groupedSales || []).reduce((s: number, g: any) => s + (g.tripsCount || 0), 0)} Rit
                                </td>
                                <td className="py-2 px-4 text-right font-mono text-blue-800">
                                    {(drilldown.groupedSales || (drilldown.readymixDetail as any)?.groupedSales || []).reduce((s: number, g: any) => s + (g.volume || 0), 0).toLocaleString("id-ID", { minimumFractionDigits: 1 })} m³
                                </td>
                                <td className="py-2 px-4 text-right font-mono text-slate-700 text-xs">
                                    {formatRp(scorecard.unitASP || 0)}
                                </td>
                                <td className="py-2 px-4 text-right font-mono text-indigo-950">
                                    {formatRp((drilldown.groupedSales || (drilldown.readymixDetail as any)?.groupedSales || []).reduce((s: number, g: any) => s + (g.dppTotal || 0), 0))}
                                </td>
                                <td className="py-2 px-4 text-right font-mono text-indigo-950">
                                    {formatRp((drilldown.groupedSales || (drilldown.readymixDetail as any)?.groupedSales || []).reduce((s: number, g: any) => s + (g.grossTotal || 0), 0))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </CardContent>
            </Card>

            {/* 3.2 Detail Sewa & 3.3 Detail PO Logistik */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 3.2 Sewa Alat */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                            3.2 Detail Transaksi Sewa Alat &amp; Kendaraan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[300px]">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                <tr>
                                    <th className="py-2 px-3 text-left">No Transaksi / Alat</th>
                                    <th className="py-2 px-3 text-left">Pelanggan</th>
                                    <th className="py-2 px-3 text-right">Hari</th>
                                    <th className="py-2 px-3 text-right">Grand Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {!drilldown.sewaList || drilldown.sewaList.length === 0 ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Belum ada data sewa bulan ini</td></tr>
                                ) : (
                                    drilldown.sewaList.map((s: any) => (
                                        <tr key={s.id} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3">
                                                <div className="font-bold text-slate-800">{s.sewa_number}</div>
                                                <div className="text-[10px] text-slate-500">{s.equipment}</div>
                                            </td>
                                            <td className="py-2 px-3 font-medium text-slate-700">{s.customer}</td>
                                            <td className="py-2 px-3 text-right">{s.days} Hari</td>
                                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRp(s.total_price)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* 3.3 Logistik PO */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                            3.3 Detail Pengadaan Barang &amp; Logistik (PO)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[300px]">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                <tr>
                                    <th className="py-2 px-3 text-left">No PO / Kategori</th>
                                    <th className="py-2 px-3 text-left">Supplier</th>
                                    <th className="py-2 px-3 text-right">Nilai PO</th>
                                    <th className="py-2 px-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {!drilldown.poList || drilldown.poList.length === 0 ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Belum ada PO terbit bulan ini</td></tr>
                                ) : (
                                    drilldown.poList.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3">
                                                <div className="font-bold text-slate-800">{p.po_number}</div>
                                                <div className="text-[10px] text-slate-500">{p.category}</div>
                                            </td>
                                            <td className="py-2 px-3 text-slate-700">{p.supplier}</td>
                                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRp(p.amount)}</td>
                                            <td className="py-2 px-3 text-center">
                                                <Badge variant="outline" className="text-[10px] py-0">
                                                    {p.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            {/* 3.4 Detail BBM Solar & 3.5 Detail Upah Retase Supir */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 3.4 BBM Solar */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                                3.4 Detail Realisasi Kas BBM Solar Armada (RBL)
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">
                                Total: {formatRp(drilldown.fuelDetail?.total || scorecard.fuelCost || 0)} ({(drilldown.fuelDetail?.totalLitres || 0).toLocaleString("id-ID")} Liter)
                            </CardDescription>
                        </div>
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                            {drilldown.fuelDetail?.items?.length || 0} Pengisian
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[300px]">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                <tr>
                                    <th className="py-2 px-3 text-left">Tanggal / Armada</th>
                                    <th className="py-2 px-3 text-right">Liter</th>
                                    <th className="py-2 px-3 text-right">Harga/L</th>
                                    <th className="py-2 px-3 text-right">Total (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {!drilldown.fuelDetail?.items || drilldown.fuelDetail.items.length === 0 ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Belum ada data pengisian BBM bulan ini</td></tr>
                                ) : (
                                    drilldown.fuelDetail.items.map((f: any) => (
                                        <tr key={f.id} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3">
                                                <div className="font-semibold text-slate-800">{f.kendaraan || f.deskripsi}</div>
                                                <div className="text-[10px] text-slate-500">{f.tanggal} {f.km_hm !== "-" ? `• ${f.km_hm}` : ""}</div>
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono">{f.liter} L</td>
                                            <td className="py-2 px-3 text-right font-mono text-slate-500">{formatRp(f.harga_satuan)}</td>
                                            <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">{formatRp(f.amount)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* 3.5 Upah Retase Supir */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                                3.5 Rekap Komisi Retase Pengemudi (Mixer &amp; DT)
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">
                                Total: {formatRp(drilldown.retaseDetail?.total || scorecard.retaseCost || 0)}
                            </CardDescription>
                        </div>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                            {drilldown.retaseDetail?.topDrivers?.length || 0} Pengemudi
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[300px]">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                <tr>
                                    <th className="py-2 px-3 text-left">Nama Supir</th>
                                    <th className="py-2 px-3 text-center">Ritase</th>
                                    <th className="py-2 px-3 text-right">Volume (m³)</th>
                                    <th className="py-2 px-3 text-right">Komisi (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {!drilldown.retaseDetail?.topDrivers || drilldown.retaseDetail.topDrivers.length === 0 ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Belum ada data retase supir bulan ini</td></tr>
                                ) : (
                                    drilldown.retaseDetail.topDrivers.map((d: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3 font-semibold text-slate-800">
                                                {d.rank ? `${d.rank}. ` : ""}{d.name}
                                            </td>
                                            <td className="py-2 px-3 text-center font-mono">
                                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                                                    {d.trips} Rit
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-slate-700">{d.volume || d.totalVolume} m³</td>
                                            <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">{formatRp(d.retase || d.commission)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            {/* 3.6 Detail Pengadaan Material Silo & Agregat */}
            <Card className="border border-slate-200/80 shadow-xs bg-white">
                <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                            3.6 Detail Penerimaan Material Masuk Silo &amp; Quarry
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">
                            Surat Jalan Penerimaan Semen &amp; Bon Agregat Pasir/Split Masuk Bulan Ini
                        </CardDescription>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                        {(drilldown.cementIncomings?.length || 0) + (drilldown.aggregateIncomings?.length || 0)} Dokumen Masuk
                    </Badge>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto max-h-[300px]">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                            <tr>
                                <th className="py-2 px-3 text-left">Tanggal / No Surat</th>
                                <th className="py-2 px-3 text-left">Material &amp; Jenis</th>
                                <th className="py-2 px-3 text-left">Pemasok / Armada</th>
                                <th className="py-2 px-3 text-right">Kuantitas</th>
                                <th className="py-2 px-3 text-right">Total Nilai (Rp)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(drilldown.cementIncomings || []).map((c: any) => (
                                <tr key={`cem-${c.id}`} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-3">
                                        <div className="font-semibold text-slate-800">{c.delivery_note || "Surat Jalan Silo"}</div>
                                        <div className="text-[10px] text-slate-500">{c.date}</div>
                                    </td>
                                    <td className="py-2 px-3">
                                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                                            Semen ({c.name})
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-slate-700">{c.supplier}</td>
                                    <td className="py-2 px-3 text-right font-mono font-semibold text-blue-700">{Number(c.tonnage || 0).toLocaleString("id-ID")} Kg</td>
                                    <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">{formatRp(c.total_price || 0)}</td>
                                </tr>
                            ))}
                            {(drilldown.aggregateIncomings || []).map((a: any) => (
                                <tr key={`agg-${a.id}`} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-3">
                                        <div className="font-semibold text-slate-800">{a.no_bon || "Bon Quarry"}</div>
                                        <div className="text-[10px] text-slate-500">{a.date}</div>
                                    </td>
                                    <td className="py-2 px-3">
                                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                                            {a.aggregate_type}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-slate-700">{a.supplier || a.driver_name} ({a.plate_number || "-"})</td>
                                    <td className="py-2 px-3 text-right font-mono font-semibold text-blue-700">{Number(a.volume_cubic || 0).toFixed(1)} m³</td>
                                    <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">{formatRp(a.total_price || 0)}</td>
                                </tr>
                            ))}
                            {(!drilldown.cementIncomings || drilldown.cementIncomings.length === 0) && (!drilldown.aggregateIncomings || drilldown.aggregateIncomings.length === 0) && (
                                <tr><td colSpan={5} className="py-6 text-center text-slate-400">Belum ada pencatatan penerimaan material bulan ini</td></tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* 3.7 Kas RBL & 3.8 Billing AR Aging */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 3.7 Kas Cabang RBL */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                            3.7 Realisasi Beban Kas Cabang (RBL)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[300px]">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                                <tr>
                                    <th className="py-2 px-3 text-left">Kategori Biaya</th>
                                    <th className="py-2 px-3 text-right">Item</th>
                                    <th className="py-2 px-3 text-right">Realisasi (Rp)</th>
                                    <th className="py-2 px-3 text-left">Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(drilldown.rblCategories || []).map((r: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="py-2 px-3 font-semibold text-slate-800">{r.name}</td>
                                        <td className="py-2 px-3 text-right text-slate-500">{r.count}</td>
                                        <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRp(r.total)}</td>
                                        <td className="py-2 px-3 text-slate-500 truncate max-w-[150px]">{r.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* 3.8 Billing & AR Aging */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                            3.8 Penagihan (Billing) &amp; Piutang Usaha (AR Aging)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-3 bg-slate-50 rounded-lg border">
                                <div className="text-slate-500 text-[11px]">Faktur Terbit Bulan Ini</div>
                                <div className="text-lg font-bold text-slate-900 mt-0.5">{formatRp(drilldown.billing?.totalInvoiced || 0)}</div>
                                <div className="text-[10px] text-slate-400">{drilldown.billing?.invoicedCount || 0} Faktur</div>
                            </div>
                            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                <div className="text-blue-700 text-[11px]">Unbilled Pool (Belum Ditagih)</div>
                                <div className="text-lg font-bold text-blue-900 mt-0.5">{formatRp(drilldown.billing?.unbilledEstimatedValue || 0)}</div>
                                <div className="text-[10px] text-blue-700">{drilldown.billing?.unbilledCount || 0} Tiket ({(drilldown.billing?.unbilledVolume || 0).toFixed(1)} m³)</div>
                            </div>
                        </div>

                        <div className="border-t pt-3 space-y-1.5 text-xs">
                            <div className="font-semibold text-slate-700 text-[11px] uppercase">Jadwal Umur Piutang (AR Aging):</div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-emerald-700 font-medium">• Lancar / Current (≤30 Hari):</span>
                                <span className="font-bold">{formatRp(drilldown.billing?.arAging?.current || 0)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-amber-700 font-medium">• Menunggak (31 - 60 Hari):</span>
                                <span className="font-bold">{formatRp(drilldown.billing?.arAging?.ar31to60 || 0)}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-red-700 font-medium">• Kritis (&gt; 60 Hari):</span>
                                <span className="font-bold text-red-700">{formatRp(drilldown.billing?.arAging?.arOver60 || 0)}</span>
                            </div>
                            <div className="flex justify-between pt-1.5 border-t font-bold text-slate-900">
                                <span>TOTAL PIUTANG OUTSTANDING:</span>
                                <span>{formatRp(drilldown.billing?.arAging?.totalOutstanding || 0)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3.9 Kontrak Beban Tetap & 3.10 Kepatuhan Pajak/KIR Armada */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 3.9 Kontrak Beban Tetap */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                                3.9 Kontrak Beban Tetap &amp; Amortisasi (Sewa Lahan &amp; Fasilitas)
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">
                                Total Amortisasi: {formatRp(scorecard.totalFixedContractMonthly || 0)} / bulan
                            </CardDescription>
                        </div>
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
                            {drilldown.fixedCostContracts?.length || 0} Kontrak
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[320px]">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                <tr>
                                    <th className="py-2 px-3 text-left">Nama Kontrak &amp; Pihak</th>
                                    <th className="py-2 px-3 text-left">Kategori</th>
                                    <th className="py-2 px-3 text-left">Periode</th>
                                    <th className="py-2 px-3 text-right">Nilai Kontrak</th>
                                    <th className="py-2 px-3 text-right">Beban/Bulan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {!drilldown.fixedCostContracts || drilldown.fixedCostContracts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                                            Belum ada kontrak beban tetap / sewa tanah aktif bulan ini
                                        </td>
                                    </tr>
                                ) : (
                                    drilldown.fixedCostContracts.map((c: any) => (
                                        <tr key={c.id} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3">
                                                <div className="font-bold text-slate-800">{c.name}</div>
                                                <div className="text-[10px] text-slate-500">Pihak: {c.vendor}</div>
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                                    {c.category}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-slate-600">
                                                <div>{c.startDate} - {c.endDate}</div>
                                                <div className="text-[10px] text-slate-400">{c.durationMonths} Bulan</div>
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono">{formatRp(c.totalAmount)}</td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700 bg-indigo-50/50">
                                                {formatRp(c.monthlyAmount)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* 3.10 Kepatuhan Pajak STNK & Uji KIR Armada */}
                <Card className="border border-slate-200/80 shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                                3.10 Beban Kepatuhan Armada (Pajak STNK &amp; Uji KIR)
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">
                                Total Amortisasi: {formatRp(scorecard.totalVehicleComplianceMonthly || 0)} / bulan
                            </CardDescription>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">
                            {drilldown.vehicleCompliance?.length || 0} Unit Terdaftar
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[320px]">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                <tr>
                                    <th className="py-2 px-3 text-left">Unit &amp; Plat</th>
                                    <th className="py-2 px-3 text-left">Pajak Tahunan</th>
                                    <th className="py-2 px-3 text-left">Biaya Uji KIR</th>
                                    <th className="py-2 px-3 text-center">Status</th>
                                    <th className="py-2 px-3 text-right">Beban/Bulan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {!drilldown.vehicleCompliance || drilldown.vehicleCompliance.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                                            Belum ada armada dengan data pajak/KIR terdaftar
                                        </td>
                                    </tr>
                                ) : (
                                    drilldown.vehicleCompliance.map((v: any) => (
                                        <tr key={v.id} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3">
                                                <div className="font-bold text-slate-800 font-mono">{v.code}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">{v.plate} • {v.category}</div>
                                            </td>
                                            <td className="py-2 px-3">
                                                {v.annualTax > 0 ? (
                                                    <div>
                                                        <div className="font-mono text-slate-800">{formatRp(v.annualTax)}/thn</div>
                                                        <div className="text-[10px] text-slate-500">Exp: {v.taxExpiry}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3">
                                                {v.kirCost > 0 ? (
                                                    <div>
                                                        <div className="font-mono text-slate-800">{formatRp(v.kirCost)}/{v.kirPeriodMonths}bln</div>
                                                        <div className="text-[10px] text-slate-500">Exp: {v.kirExpiry}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                {v.hasHistory ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        ✓ Riwayat Tercatat
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                        ⚡ Estimasi Master
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                                                {formatRp(v.totalMonthly)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
