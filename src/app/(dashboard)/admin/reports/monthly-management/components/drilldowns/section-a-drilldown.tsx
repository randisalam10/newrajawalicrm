"use client"

import { useState, useMemo } from "react"
import { Receipt, Boxes, Truck, Layers, Search } from "lucide-react"
import { formatRp } from "../formatters"
import { ScorecardData, DrilldownData } from "../../types"

interface SectionADrilldownProps {
    scorecard: ScorecardData
    drilldown: DrilldownData
    activeSectionAItem: "all" | "readymix" | "rental" | "aggregate"
    isDrilldownMinimized: boolean
    setActiveSectionAItem: (item: "all" | "readymix" | "rental" | "aggregate") => void
    setIsDrilldownMinimized: (minimized: boolean) => void
    onClose: () => void
}

export function SectionADrilldown({
    scorecard,
    drilldown,
    activeSectionAItem,
    isDrilldownMinimized,
    setActiveSectionAItem,
    setIsDrilldownMinimized,
    onClose
}: SectionADrilldownProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<"grouped" | "individual">("grouped")

    const rawGroupedSales = useMemo(() => {
        return drilldown.groupedSales || (drilldown.readymixDetail as any)?.groupedSales || []
    }, [drilldown.groupedSales, drilldown.readymixDetail])

    const filteredGroupedSales = useMemo(() => {
        if (!searchQuery.trim()) return rawGroupedSales
        const q = searchQuery.toLowerCase()
        return rawGroupedSales.filter((s: any) =>
            s.customer?.toLowerCase().includes(q) ||
            s.project?.toLowerCase().includes(q) ||
            s.quality?.toLowerCase().includes(q) ||
            s.dateRange?.toLowerCase().includes(q)
        )
    }, [rawGroupedSales, searchQuery])

    const groupedTotals = useMemo(() => {
        return filteredGroupedSales.reduce((acc: any, item: any) => ({
            trips: acc.trips + (item.tripsCount || 0),
            volume: acc.volume + (item.volume || 0),
            dpp: acc.dpp + (item.dppTotal || 0),
            ppn: acc.ppn + (item.ppnTotal || 0),
            gross: acc.gross + (item.grossTotal || 0),
        }), { trips: 0, volume: 0, dpp: 0, ppn: 0, gross: 0 })
    }, [filteredGroupedSales])

    return (
        <div className="space-y-4 pt-3 border-t-2 border-dashed border-indigo-300 font-sans">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-indigo-600" /> Detail Drilldown Pendapatan
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Sub-item pills */}
                    <div className="flex flex-wrap gap-1">
                        {(["all", "readymix", "rental", "aggregate"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveSectionAItem(tab)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all border ${
                                    activeSectionAItem === tab
                                        ? "bg-indigo-700 text-white border-indigo-700"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                            >
                                {tab === "all" ? "Semua Pendapatan" : tab === "readymix" ? "1. Beton Cor" : tab === "rental" ? "2. Sewa Alat/Armada" : "3. Agregat"}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsDrilldownMinimized(!isDrilldownMinimized)}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                            {isDrilldownMinimized ? "▼ Buka Detail" : "▲ Minimize"}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 hover:text-slate-800 cursor-pointer"
                        >
                            ✕ Tutup
                        </button>
                    </div>
                </div>
            </div>

            {isDrilldownMinimized ? (
                <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-200 flex items-center justify-between text-xs text-indigo-900">
                    <span>Rincian drilldown pendapatan sedang disembunyikan.</span>
                    <button
                        onClick={() => setIsDrilldownMinimized(false)}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-800 rounded font-semibold text-[11px] shadow-xs cursor-pointer"
                    >
                        👁️ Buka / Tampilkan Rincian Detail
                    </button>
                </div>
            ) : (
                <>
                    {/* 1. Detail Beton Ready-Mix */}
                    {(activeSectionAItem === "all" || activeSectionAItem === "readymix") && (
                        <div className="bg-white rounded-lg border border-indigo-100 p-3 shadow-xs space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                                <div className="space-y-0.5">
                                    <div className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                                        <Boxes className="w-4 h-4 text-indigo-600" /> Penjualan Beton Cor (Ready-Mix) - Rekapitulasi per Pelanggan &amp; Mutu
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        Data dikelompokkan (group by) berdasarkan Pelanggan, Proyek, dan Mutu Beton untuk seluruh transaksi periode berjalan.
                                    </div>
                                </div>
                                <div className="text-right text-[11px] font-mono text-slate-600">
                                    Vol: <strong className="text-blue-700">{(scorecard.productionVolumeM3 || 0).toLocaleString("id-ID", { minimumFractionDigits: 1 })} m³</strong>
                                    &nbsp;|&nbsp;DPP: <strong className="text-indigo-900">{formatRp(scorecard.readymixRevenue)}</strong>
                                    {scorecard.readymixPpn > 0 && <span className="text-slate-500 text-[10px]"> (+PPN {formatRp(scorecard.readymixPpn)})</span>}
                                </div>
                            </div>

                            {/* Toolbar Pencarian & Toggle Mode */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Cari pelanggan, proyek, mutu..."
                                            className="h-7 pl-8 pr-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md w-48 sm:w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md border border-slate-200 text-[10px]">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("grouped")}
                                        className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition-all ${
                                            viewMode === "grouped" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        📊 Rekap Pelanggan &amp; Mutu ({filteredGroupedSales.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("individual")}
                                        className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition-all ${
                                            viewMode === "individual" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        📋 Sampel Tiket Mixer ({drilldown.recentTickets?.length || 0})
                                    </button>
                                </div>
                            </div>

                            {/* View 1: Grouped by Pelanggan & Mutu */}
                            {viewMode === "grouped" && (
                                <>
                                    {filteredGroupedSales.length > 0 ? (
                                        <div className="overflow-x-auto max-h-[380px] rounded-lg border border-slate-200">
                                            <table className="w-full text-[11px]">
                                                <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b z-10">
                                                    <tr>
                                                        <th className="py-2 px-2.5 text-left">Periode Cor</th>
                                                        <th className="py-2 px-2.5 text-left">Pelanggan &amp; Proyek</th>
                                                        <th className="py-2 px-2.5 text-left">Mutu Beton</th>
                                                        <th className="py-2 px-2.5 text-center">Rit (Trips)</th>
                                                        <th className="py-2 px-2.5 text-right">Vol (m³)</th>
                                                        <th className="py-2 px-2.5 text-right">Harga DPP / m³</th>
                                                        <th className="py-2 px-2.5 text-right">Total DPP</th>
                                                        <th className="py-2 px-2.5 text-right">PPN</th>
                                                        <th className="py-2 px-2.5 text-right">Total Nilai Gross</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {filteredGroupedSales.map((g: any) => (
                                                        <tr key={g.key} className="hover:bg-slate-50/70 transition-colors">
                                                            <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-600 font-mono text-[10px]">{g.dateRange || "—"}</td>
                                                            <td className="py-1.5 px-2.5">
                                                                <div className="font-bold text-slate-900">{g.customer}</div>
                                                                <div className="text-[10px] text-slate-500">{g.project}</div>
                                                            </td>
                                                            <td className="py-1.5 px-2.5">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                                                                    {g.quality}
                                                                </span>
                                                            </td>
                                                            <td className="py-1.5 px-2.5 text-center font-mono">
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                                    {g.tripsCount} Rit
                                                                </span>
                                                            </td>
                                                            <td className="py-1.5 px-2.5 text-right font-bold text-blue-700 font-mono">
                                                                {g.volume.toLocaleString("id-ID", { minimumFractionDigits: 1 })}
                                                            </td>
                                                            <td className="py-1.5 px-2.5 text-right font-mono text-slate-700">
                                                                {formatRp(g.unitPrice)}
                                                            </td>
                                                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                                                                {formatRp(g.dppTotal)}
                                                            </td>
                                                            <td className="py-1.5 px-2.5 text-right font-mono text-slate-500">
                                                                {g.ppnTotal > 0 ? formatRp(g.ppnTotal) : "—"}
                                                            </td>
                                                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-indigo-900">
                                                                {formatRp(g.grossTotal)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-slate-100 font-bold border-t text-slate-800 sticky bottom-0 z-10">
                                                    <tr>
                                                        <td colSpan={3} className="py-2 px-2.5 text-slate-700">
                                                            TOTAL PENJUALAN BETON ({filteredGroupedSales.length} Rekap Pelanggan &amp; Mutu)
                                                        </td>
                                                        <td className="py-2 px-2.5 text-center font-mono">
                                                            {groupedTotals.trips} Rit
                                                        </td>
                                                        <td className="py-2 px-2.5 text-right font-mono text-blue-800">
                                                            {groupedTotals.volume.toLocaleString("id-ID", { minimumFractionDigits: 1 })} m³
                                                        </td>
                                                        <td className="py-2 px-2.5 text-right font-mono text-slate-500 text-[10px]">
                                                            ASP: {formatRp(scorecard.unitASP || 0)}
                                                        </td>
                                                        <td className="py-2 px-2.5 text-right font-mono text-indigo-950">
                                                            {formatRp(groupedTotals.dpp)}
                                                        </td>
                                                        <td className="py-2 px-2.5 text-right font-mono text-slate-600">
                                                            {formatRp(groupedTotals.ppn)}
                                                        </td>
                                                        <td className="py-2 px-2.5 text-right font-mono text-indigo-950">
                                                            {formatRp(groupedTotals.gross)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-400 text-xs py-4 italic">
                                            {searchQuery ? "Tidak ada data penjualan yang cocok dengan kata kunci pencarian." : "Belum ada transaksi tiket beton pada periode ini."}
                                        </p>
                                    )}
                                </>
                            )}

                            {/* View 2: Individual Samples (Audit Tiket) */}
                            {viewMode === "individual" && (
                                <>
                                    {drilldown.recentTickets && drilldown.recentTickets.length > 0 ? (
                                        <div className="overflow-x-auto max-h-[300px] rounded border border-slate-200">
                                            <table className="w-full text-[11px]">
                                                <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b">
                                                    <tr>
                                                        <th className="py-1.5 px-2 text-left">Tgl</th>
                                                        <th className="py-1.5 px-2 text-left">Pelanggan &amp; Proyek</th>
                                                        <th className="py-1.5 px-2 text-left">Mutu</th>
                                                        <th className="py-1.5 px-2 text-right">Vol (m³)</th>
                                                        <th className="py-1.5 px-2 text-left">Armada/Supir</th>
                                                        <th className="py-1.5 px-2 text-right">Harga Sat.</th>
                                                        <th className="py-1.5 px-2 text-right">Total Nilai</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {drilldown.recentTickets.slice(0, 30).map((t: any) => (
                                                        <tr key={t.id} className="hover:bg-slate-50/70">
                                                            <td className="py-1 px-2 whitespace-nowrap text-slate-500 font-mono">{t.date}</td>
                                                            <td className="py-1 px-2">
                                                                <div className="font-semibold text-slate-800">{t.customer}</div>
                                                                <div className="text-[10px] text-slate-500">{t.project}</div>
                                                            </td>
                                                            <td className="py-1 px-2 font-medium text-slate-700">{t.quality}</td>
                                                            <td className="py-1 px-2 text-right font-bold text-blue-700 font-mono">{t.volume}</td>
                                                            <td className="py-1 px-2 text-slate-600">
                                                                <div>{t.plate}</div>
                                                                <div className="text-[10px] text-slate-400">{t.driver}</div>
                                                            </td>
                                                            <td className="py-1 px-2 text-right font-mono">{formatRp(t.price)}</td>
                                                            <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{formatRp(t.total)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-400 text-xs py-2">Belum ada transaksi tiket beton pada periode ini.</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* 2. Detail Sewa Alat / Armada */}
                    {(activeSectionAItem === "all" || activeSectionAItem === "rental") && (
                        <div className="bg-white rounded-lg border border-indigo-100 p-3 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                                    <Truck className="w-4 h-4 text-indigo-600" /> Pendapatan Sewa Alat Berat / Pompa / Mixer
                                </div>
                                <div className="text-[11px] font-mono text-slate-600">
                                    Total DPP: <strong className="text-indigo-900">{formatRp(scorecard.rentalRevenue)}</strong>
                                    {scorecard.rentalPpn > 0 && <span className="text-slate-500 text-[10px]"> (+PPN {formatRp(scorecard.rentalPpn)})</span>}
                                </div>
                            </div>

                            {drilldown.rentalDetail?.items && drilldown.rentalDetail.items.length > 0 ? (
                                <div className="overflow-x-auto max-h-[240px] rounded border border-slate-200">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b">
                                            <tr>
                                                <th className="py-1.5 px-2 text-left">No. Sewa</th>
                                                <th className="py-1.5 px-2 text-left">Tgl</th>
                                                <th className="py-1.5 px-2 text-left">Pelanggan</th>
                                                <th className="py-1.5 px-2 text-left">Alat / Kendaraan</th>
                                                <th className="py-1.5 px-2 text-left">Operator</th>
                                                <th className="py-1.5 px-2 text-center">Hari</th>
                                                <th className="py-1.5 px-2 text-right">Tarif/Hari</th>
                                                <th className="py-1.5 px-2 text-right">DPP</th>
                                                <th className="py-1.5 px-2 text-right">PPN</th>
                                                <th className="py-1.5 px-2 text-right">Gross Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {drilldown.rentalDetail.items.map((s: any) => (
                                                <tr key={s.id} className="hover:bg-slate-50/70">
                                                    <td className="py-1 px-2 font-mono text-blue-700 whitespace-nowrap">{s.sewa_number}</td>
                                                    <td className="py-1 px-2 text-slate-500 whitespace-nowrap">{s.date}</td>
                                                    <td className="py-1 px-2 font-medium text-slate-800">{s.customer}</td>
                                                    <td className="py-1 px-2 text-slate-700">{s.equipment}</td>
                                                    <td className="py-1 px-2 text-slate-500">{s.operator}</td>
                                                    <td className="py-1 px-2 text-center">{s.days}</td>
                                                    <td className="py-1 px-2 text-right font-mono">{formatRp(s.rate)}</td>
                                                    <td className="py-1 px-2 text-right font-mono font-bold text-indigo-900">{formatRp(s.dpp)}</td>
                                                    <td className="py-1 px-2 text-right font-mono text-slate-500">{formatRp(s.ppn)}</td>
                                                    <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{formatRp(s.total_price)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 text-xs py-2">Belum ada transaksi sewa alat pada periode ini.</p>
                            )}
                        </div>
                    )}

                    {/* 3. Detail Penjualan Agregat Bebas */}
                    {(activeSectionAItem === "all" || activeSectionAItem === "aggregate") && (
                        <div className="bg-white rounded-lg border border-indigo-100 p-3 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600" /> Penjualan Agregat Bebas (Quarry / Plant)
                                </div>
                                <div className="text-[11px] font-mono text-slate-600">
                                    Total: <strong className="text-indigo-900">{formatRp(scorecard.aggregateRevenue)}</strong>
                                </div>
                            </div>

                            {drilldown.aggregateSalesDetail?.items && drilldown.aggregateSalesDetail.items.length > 0 ? (
                                <div className="overflow-x-auto max-h-[220px] rounded border border-slate-200">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b">
                                            <tr>
                                                <th className="py-1.5 px-2 text-left">Tgl</th>
                                                <th className="py-1.5 px-2 text-left">Jenis Material</th>
                                                <th className="py-1.5 px-2 text-right">Volume (m³)</th>
                                                <th className="py-1.5 px-2 text-right">Harga Sat.</th>
                                                <th className="py-1.5 px-2 text-left">Penerima</th>
                                                <th className="py-1.5 px-2 text-left">Armada</th>
                                                <th className="py-1.5 px-2 text-right">Total Nilai</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {drilldown.aggregateSalesDetail.items.map((a: any) => (
                                                <tr key={a.id} className="hover:bg-slate-50/70">
                                                    <td className="py-1 px-2 text-slate-500 whitespace-nowrap">{a.date}</td>
                                                    <td className="py-1 px-2 font-medium text-slate-800">{a.aggregate_type}</td>
                                                    <td className="py-1 px-2 text-right font-bold text-blue-700">{a.volume_cubic}</td>
                                                    <td className="py-1 px-2 text-right font-mono">{formatRp(a.unit_price)}</td>
                                                    <td className="py-1 px-2 text-slate-700">{a.recipient}</td>
                                                    <td className="py-1 px-2 text-slate-500">{a.vehicle}</td>
                                                    <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{formatRp(a.total_price)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 text-xs py-2">Belum ada transaksi penjualan agregat pada periode ini.</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
