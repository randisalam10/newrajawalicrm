"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatRp } from "../formatters"
import { ScorecardData, UnitEconomicsData, DrilldownData } from "../../types"
import { SectionADrilldown } from "../drilldowns/section-a-drilldown"
import { SectionBDrilldown, SectionBItemType } from "../drilldowns/section-b-drilldown"
import { SectionCProfitability } from "../drilldowns/section-c-profitability"
import { SectionDDrilldown } from "../drilldowns/section-d-drilldown"
import { NetContributionBanner } from "./net-contribution-banner"

interface ExecutiveScorecardProps {
    scorecard: ScorecardData
    unitEconomics: UnitEconomicsData
    drilldown: DrilldownData
    selectedPeriodLabel: string
    activeSummarySection: "all" | "A" | "B" | "C" | "D"
    setActiveSummarySection: (section: "all" | "A" | "B" | "C" | "D") => void
    activeSectionAItem: "all" | "readymix" | "rental" | "aggregate"
    setActiveSectionAItem: (item: "all" | "readymix" | "rental" | "aggregate") => void
    activeSectionBItem: SectionBItemType
    setActiveSectionBItem: (item: SectionBItemType) => void
    activeSectionDItem: "all" | "rbl" | "fixed_contract" | "vehicle"
    setActiveSectionDItem: (item: "all" | "rbl" | "fixed_contract" | "vehicle") => void
    isDrilldownMinimized: boolean
    setIsDrilldownMinimized: (min: boolean) => void
}

export const ExecutiveScorecard: React.FC<ExecutiveScorecardProps> = ({
    scorecard,
    unitEconomics,
    drilldown,
    selectedPeriodLabel,
    activeSummarySection,
    setActiveSummarySection,
    activeSectionAItem,
    setActiveSectionAItem,
    activeSectionBItem,
    setActiveSectionBItem,
    activeSectionDItem,
    setActiveSectionDItem,
    isDrilldownMinimized,
    setIsDrilldownMinimized,
}) => {
    return (
        <Card className="border border-slate-200/80 shadow-xs bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-3.5 px-5">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                            1.1 Executive Performance Scorecard
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                            Ringkasan Volume, Omset, Biaya Pokok Langsung, dan Gross Margin ({selectedPeriodLabel})
                        </CardDescription>
                    </div>
                    <Badge className="bg-emerald-600 text-white font-semibold text-[11px]">
                        Terverifikasi
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
                {/* Grid 4 Kolom Indikator Finansial Utama */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40">
                        <div className="text-xs font-medium text-slate-500 uppercase">Total Volume Produksi</div>
                        <div className="text-2xl font-bold text-blue-700 mt-1">
                            {(scorecard.productionVolumeM3 || 0).toLocaleString("id-ID", { minimumFractionDigits: 1 })}{" "}
                            <span className="text-sm font-normal text-slate-500">m³</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                            {scorecard.productionTargetM3 && scorecard.productionTargetM3 > 0
                                ? `Target: ${scorecard.productionTargetM3.toLocaleString("id-ID")} m³ (${scorecard.achievementPct || 0}%)`
                                : "Target: Belum Ditetapkan"}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
                        <div className="text-xs font-medium text-indigo-700 uppercase flex items-center justify-between">
                            <span>Omset Bersih Usaha (DPP)</span>
                            <Badge className="bg-indigo-600 text-white text-[9px] px-1.5 py-0 h-4">Murni</Badge>
                        </div>
                        <div className="text-xl font-bold text-indigo-950 mt-1">
                            {formatRp(scorecard.totalDppRevenue || scorecard.totalGrossRevenue)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                            <span>PPN: {formatRp(scorecard.totalTaxLiability || 0)}</span>
                            <span>Gross: {formatRp(scorecard.totalGrossRevenue)}</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40">
                        <div className="text-xs font-medium text-amber-800 uppercase">Total Direct COGS</div>
                        <div className="text-xl font-bold text-amber-900 mt-1">
                            {formatRp(scorecard.totalDirectCost)}
                        </div>
                        <div className="text-[11px] text-amber-700 mt-1">
                            Unit Cost: {formatRp(scorecard.unitDirectCostPerM3)} / m³
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40">
                        <div className="text-xs font-medium text-emerald-800 uppercase">Gross Profit &amp; Margin</div>
                        <div className="text-xl font-bold text-emerald-700 mt-1">
                            {formatRp(scorecard.grossProfit)}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-800 mt-1">
                            Margin: {scorecard.grossMarginPercent}% (dari DPP)
                        </div>
                    </div>
                </div>

                {/* Sub-tab Navigasi: Seksi A, B, C, D */}
                <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3 mb-4">
                    {(["all", "A", "B", "C", "D"] as const).map((id) => (
                        <button
                            key={id}
                            onClick={() => {
                                setActiveSummarySection(id)
                                setIsDrilldownMinimized(false)
                            }}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                                activeSummarySection === id
                                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                                    : "bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:border-slate-400"
                            }`}
                        >
                            {id === "all" ? "Semua Seksi" : id === "A" ? "A. Pendapatan" : id === "B" ? "B. Biaya Langsung" : id === "C" ? "C. Laba Kotor" : "D. Overhead"}
                        </button>
                    ))}
                </div>

                {/* Rekapitulasi Rinci Formula Manajerial A, B, C, D */}
                <div className={`text-xs font-mono bg-slate-50 p-4 rounded-xl border border-slate-200/80 ${
                    activeSummarySection !== "all" ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"
                }`}>
                    {/* SEKSI A */}
                    {(activeSummarySection === "all" || activeSummarySection === "A") && (
                        <div className="space-y-3">
                            <div className="font-bold text-slate-800 border-b pb-1 font-sans flex items-center justify-between">
                                <span>A. PENDAPATAN USAHA (DPP &amp; BEBAN PAJAK PPN)</span>
                                <span className="text-[10px] font-normal text-slate-500">Dasar Pengenaan Pajak</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>• Ready-Mix (Beton Cor):</span>
                                <span className="text-right">
                                    <span className="font-bold">{formatRp(scorecard.readymixRevenue)}</span>
                                    {scorecard.readymixPpn > 0 && (
                                        <span className="text-[10px] text-slate-500 ml-1 font-sans">(+PPN {formatRp(scorecard.readymixPpn)})</span>
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>• Pendapatan Sewa Alat / Armada:</span>
                                <span className="text-right">
                                    <span className="font-bold">{formatRp(scorecard.rentalRevenue)}</span>
                                    {scorecard.rentalPpn > 0 && (
                                        <span className="text-[10px] text-slate-500 ml-1 font-sans">(+PPN {formatRp(scorecard.rentalPpn)})</span>
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>• Penjualan Agregat Bebas:</span>
                                <span className="font-bold">{formatRp(scorecard.aggregateRevenue)}</span>
                            </div>
                            <div className="flex justify-between pt-1.5 border-t font-bold text-indigo-900 bg-indigo-50/50 px-2 py-1 rounded">
                                <span>TOTAL PENDAPATAN BERSIH (DPP):</span>
                                <span>{formatRp(scorecard.totalDppRevenue || scorecard.totalGrossRevenue)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600 px-2 py-0.5">
                                <span>• Kewajiban Pajak Terutang (PPN Keluaran):</span>
                                <span className="font-semibold text-rose-600">+{formatRp(scorecard.totalTaxLiability || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-700 px-2 py-0.5 border-t border-dashed">
                                <span>• Total Gross Billing / Penjualan (DPP+PPN):</span>
                                <span className="font-bold">{formatRp(scorecard.totalGrossRevenue)}</span>
                            </div>

                            {activeSummarySection === "A" && (
                                <SectionADrilldown
                                    scorecard={scorecard}
                                    drilldown={drilldown}
                                    activeSectionAItem={activeSectionAItem}
                                    isDrilldownMinimized={isDrilldownMinimized}
                                    setActiveSectionAItem={setActiveSectionAItem}
                                    setIsDrilldownMinimized={setIsDrilldownMinimized}
                                    onClose={() => setActiveSummarySection("all")}
                                />
                            )}
                        </div>
                    )}

                    {/* SEKSI B */}
                    {(activeSummarySection === "all" || activeSummarySection === "B") && (
                        <div className="space-y-3">
                            <div className="font-bold text-slate-800 border-b pb-1 font-sans flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span>B. BIAYA POKOK LANGSUNG (DIRECT COGS)</span>
                                    <button
                                        onClick={() => {
                                            setActiveSummarySection("B")
                                            setActiveSectionBItem("reconciliation")
                                            setIsDrilldownMinimized(false)
                                        }}
                                        className="text-[10px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                        title="Buka Neraca Selisih Pengadaan vs Pemakaian Material"
                                    >
                                        ⚖️ Cek Selisih Material
                                    </button>
                                </div>
                                <span className="text-[10px] font-normal text-slate-500">Breakdown PO vs Kas RBL</span>
                            </div>

                            {/* Kelompok 1: Biaya Semen & Sparepart BP */}
                            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/70 space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center justify-between">
                                    <span>1. Biaya Semen &amp; Sparepart (PO BP)</span>
                                    <span className="text-amber-800 font-mono font-bold">
                                        {formatRp((scorecard.semenCost || 0) + (scorecard.maintenancePoCost || 0))}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-700">
                                    <span>• Semen Curah &amp; Zak (Biaya Pemakaian Produksi):</span>
                                    <span className="font-bold">{formatRp(scorecard.semenCost)}</span>
                                </div>
                                {scorecard.totalCementPoCost !== undefined && (
                                    <div className="text-[10px] text-amber-800/80 pl-2 italic">
                                        └ Ref. Nilai PO Semen BP Terbit: {formatRp(scorecard.totalCementPoCost)}
                                    </div>
                                )}
                                <div className="flex justify-between text-slate-700">
                                    <span>• Suku Cadang / Sparepart BP (PO BP):</span>
                                    <span className="font-bold">{formatRp(scorecard.maintenancePoCost || 0)}</span>
                                </div>
                            </div>

                            {/* Kelompok 2: Kas Operasional Lapangan (RBL) */}
                            <div className="bg-rose-50/40 p-2.5 rounded-lg border border-rose-200/70 space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-900 flex items-center justify-between">
                                    <span>2. Realisasi Kas Cabang (RBL Opex Langsung)</span>
                                    <span className="text-rose-800 font-mono font-bold">
                                        {formatRp((scorecard.fuelCost || 0) + (scorecard.maintenanceRblCost || 0))}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-700">
                                    <span>• Bahan Bakar Solar Armada (RBL BBM):</span>
                                    <span className="font-bold">{formatRp(scorecard.fuelCost)}</span>
                                </div>
                                <div className="flex justify-between text-slate-700">
                                    <span>• Servis Bengkel &amp; Perbaikan (RBL Kas):</span>
                                    <span className="font-bold">{formatRp(scorecard.maintenanceRblCost || 0)}</span>
                                </div>
                            </div>

                            {/* Kelompok 3: Agregat Quarry & Upah Supir */}
                            <div className="bg-blue-50/40 p-2.5 rounded-lg border border-blue-200/70 space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-900 flex items-center justify-between">
                                    <span>3. Agregat Quarry &amp; Upah Supir</span>
                                    <span className="text-blue-800 font-mono font-bold">
                                        {formatRp(
                                            (scorecard.aggregateCost || ((scorecard.pasirCost || 0) + (scorecard.splitCost || 0))) +
                                            (scorecard.retaseCost || 0)
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-700">
                                    <span>• Pasir Cor &amp; Batu Split (Agregat Quarry):</span>
                                    <span className="font-bold">
                                        {formatRp(scorecard.aggregateCost || ((scorecard.pasirCost || 0) + (scorecard.splitCost || 0)))}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-700">
                                    <span>• Upah Langsung Retase Supir (Mixer &amp; DT):</span>
                                    <span className="font-bold">{formatRp(scorecard.retaseCost)}</span>
                                </div>
                            </div>

                            {/* Kelompok 4: Biaya Pokok Langsung & Gaji Produksi (Input Manual) */}
                            <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200/70 space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 flex items-center justify-between">
                                    <span>4. Biaya Pokok Langsung &amp; Gaji Produksi (Manual)</span>
                                    <span className="text-emerald-800 font-mono font-bold">
                                        {formatRp(scorecard.manualDirectCost || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-700">
                                    <span>• Gaji Karyawan / Operator &amp; Biaya Langsung:</span>
                                    <span className="font-bold">{formatRp(scorecard.manualDirectCost || 0)}</span>
                                </div>
                                {scorecard.manualDirectCost && scorecard.manualDirectCost > 0 ? (
                                    <div className="text-[10px] text-emerald-800/90 pl-2 italic">
                                        └ Terhubung dari Master Biaya ({drilldown.manualDirectCostItems?.length || 0} item dialokasikan)
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-slate-400 pl-2 italic">
                                        └ Belum ada biaya pokok langsung / gaji manual bulan ini (dapat ditambahkan di Master Biaya)
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-1 border-t font-bold text-red-700 text-sm">
                                <span>TOTAL BIAYA LANGSUNG (B):</span>
                                <span>{formatRp(scorecard.totalDirectCost)}</span>
                            </div>

                            {activeSummarySection === "B" && (
                                <SectionBDrilldown
                                    scorecard={scorecard}
                                    drilldown={drilldown}
                                    activeSectionBItem={activeSectionBItem}
                                    isDrilldownMinimized={isDrilldownMinimized}
                                    setActiveSectionBItem={setActiveSectionBItem}
                                    setIsDrilldownMinimized={setIsDrilldownMinimized}
                                    onClose={() => setActiveSummarySection("all")}
                                />
                            )}
                        </div>
                    )}

                    {/* SEKSI C: LABA KOTOR (GROSS PROFIT = A - B) */}
                    {(activeSummarySection === "all" || activeSummarySection === "C") && (
                        <div className="space-y-3 pt-2 border-t md:border-t-0">
                            <div className="font-bold text-slate-800 border-b pb-1 font-sans flex items-center justify-between">
                                <span>C. LABA KOTOR USAHA (GROSS PROFIT DARI DPP)</span>
                                <span className="text-[10px] font-normal text-slate-500">Margin Murni (A - B)</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>• Total Pendapatan Bersih (DPP - A):</span>
                                <span className="font-mono font-medium">
                                    {formatRp(scorecard.totalDppRevenue || scorecard.totalGrossRevenue)}
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>• Total Biaya Pokok Langsung (COGS - B):</span>
                                <span className="font-mono text-rose-700 font-medium">-{formatRp(scorecard.totalDirectCost)}</span>
                            </div>
                            <div className="flex justify-between pt-1.5 border-t text-slate-900 font-bold bg-emerald-50/70 px-2 py-1.5 rounded border border-emerald-200/80">
                                <span className="text-emerald-950 font-bold">LABA KOTOR USAHA (C = A - B):</span>
                                <span className="font-bold text-emerald-700 text-sm">{formatRp(scorecard.grossProfit)}</span>
                            </div>
                            <div className="flex justify-between items-center px-1 text-slate-600">
                                <span>• Persentase Margin Kotor (Gross Margin):</span>
                                <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                                    {scorecard.grossMarginPercent}%
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-400 italic px-0.5">
                                * Laba Kotor murni sebelum dikurangi Beban Operasional Kas Cabang &amp; Amortisasi (D)
                            </div>

                            {activeSummarySection === "C" && (
                                <SectionCProfitability
                                    scorecard={scorecard}
                                    unitEconomics={unitEconomics}
                                    isDrilldownMinimized={isDrilldownMinimized}
                                    setIsDrilldownMinimized={setIsDrilldownMinimized}
                                    onClose={() => setActiveSummarySection("all")}
                                />
                            )}
                        </div>
                    )}

                    {/* SEKSI D: BEBAN OPERASIONAL KAS & AMORTISASI TETAP */}
                    {(activeSummarySection === "all" || activeSummarySection === "D") && (
                        <div className="space-y-3 pt-2 border-t md:border-t-0">
                            <div className="font-bold text-slate-800 border-b pb-1 font-sans flex items-center justify-between">
                                <span>D. BEBAN OPERASIONAL KAS &amp; AMORTISASI TETAP</span>
                                <span className="text-[10px] font-normal text-slate-500">Overhead &amp; Compliance</span>
                            </div>
                            {/* Kelompok 1: Realisasi Kas Operasional Cabang (RBL Opex Murni) */}
                            <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-200/70 space-y-1.5">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-900 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span>1. Beban Kas Cabang (Overhead Murni)</span>
                                        <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0 h-4">
                                            {drilldown.rblOpexDetail?.categories?.length || 0} Kategori
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-blue-900 font-mono font-bold">{formatRp(scorecard.rblOpex)}</span>
                                        <button
                                            onClick={() => {
                                                setActiveSummarySection("D")
                                                setActiveSectionDItem("rbl")
                                                setIsDrilldownMinimized(false)
                                            }}
                                            className="text-[9px] font-semibold text-blue-800 bg-white hover:bg-blue-100 border border-blue-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                            title="Lihat seluruh rincian kategori kas RBL"
                                        >
                                            🔍 Detail
                                        </button>
                                    </div>
                                </div>

                                {scorecard.rblTotalDisbursement && scorecard.rblTotalDisbursement > scorecard.rblOpex && (
                                    <div className="bg-white/80 p-1.5 rounded border border-blue-100 text-[10px] text-slate-600 flex justify-between items-center">
                                        <span>Total Realisasi Kas Fisik RBL:</span>
                                        <span className="font-mono font-semibold text-slate-800">
                                            {formatRp(scorecard.rblTotalDisbursement)}
                                            <span className="text-[9px] text-amber-700 ml-1 font-sans">
                                                (Alokasi BPL: -{formatRp((scorecard.rblBbmDirect || 0) + (scorecard.rblMaintenanceDirect || 0))})
                                            </span>
                                        </span>
                                    </div>
                                )}

                                {/* Rincian Kategori RBL Operasional Dinamis */}
                                <div className="space-y-1 text-[11px] text-slate-700 max-h-[160px] overflow-y-auto pr-1">
                                    {(drilldown.rblOpexDetail?.categories || []).slice(0, 6).map((c: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center py-0.5 border-b border-blue-100/50 last:border-b-0">
                                            <span className="truncate max-w-[200px]" title={c.name}>• {c.name}:</span>
                                            <span className="font-semibold font-mono">{formatRp(c.total)}</span>
                                        </div>
                                    ))}
                                    {(drilldown.rblOpexDetail?.categories || []).length > 6 && (
                                        <div className="flex justify-between items-center text-[10px] text-blue-700 pt-0.5">
                                            <span>• Kategori Lainnya ({(drilldown.rblOpexDetail?.categories || []).length - 6} kategori):</span>
                                            <span className="font-semibold font-mono">
                                                {formatRp(
                                                    (drilldown.rblOpexDetail?.categories || [])
                                                        .slice(6)
                                                        .reduce((s: number, it: any) => s + (it.total || 0), 0)
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-slate-500 text-[9.5px] pt-1 border-t border-blue-200/50">
                                        <span>└ BBM Solar &amp; Bengkel tercatat di:</span>
                                        <span className="font-medium text-amber-800">Seksi B (Direct COGS)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Kelompok 2: Amortisasi Kontrak & Kepatuhan */}
                            <div className="bg-slate-100/60 p-2.5 rounded-lg border border-slate-200 space-y-1 text-[11px] text-slate-700">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                                    <span>2. Amortisasi Beban Tetap &amp; Kepatuhan</span>
                                    <span className="font-mono font-bold text-slate-800">{formatRp(scorecard.totalAmortizationMonthly || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>• Amortisasi Sewa Tanah (1 Thn):</span>
                                    <span className="font-semibold">{formatRp(scorecard.sewaTanahMonthly || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>• Amortisasi Sewa Mess &amp; Fasilitas:</span>
                                    <span className="font-semibold">{formatRp(scorecard.sewaMessMonthly || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>• Pajak STNK &amp; Uji KIR Armada:</span>
                                    <span className="font-semibold text-blue-700 font-mono">{formatRp(scorecard.totalVehicleComplianceMonthly || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>• Perizinan, Asuransi &amp; Retribusi:</span>
                                    <span className="font-semibold">
                                        {formatRp((scorecard.perizinanMonthly || 0) + (scorecard.asuransiRetribusiMonthly || 0))}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between pt-1.5 border-t text-slate-900 font-bold bg-rose-50/70 px-2 py-1.5 rounded border border-rose-200/80">
                                <span className="text-rose-950 font-bold">TOTAL BEBAN OVERHEAD &amp; AMORTISASI (D):</span>
                                <span className="text-red-700 font-bold text-sm">
                                    {formatRp((scorecard.rblOpex || 0) + (scorecard.totalAmortizationMonthly || 0))}
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-400 italic px-0.5">
                                * Beban operasional bulanan yang menjadi pengurang Laba Kotor (C) untuk menghasilkan Kontribusi Bersih Lapangan (E = C - D)
                            </div>

                            {activeSummarySection === "D" && (
                                <SectionDDrilldown
                                    scorecard={scorecard}
                                    drilldown={drilldown}
                                    activeSectionDItem={activeSectionDItem}
                                    isDrilldownMinimized={isDrilldownMinimized}
                                    setActiveSectionDItem={setActiveSectionDItem}
                                    setIsDrilldownMinimized={setIsDrilldownMinimized}
                                    onClose={() => setActiveSummarySection("all")}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* SEKSI E: KONTRIBUSI BERSIH OPERASIONAL LAPANGAN */}
                <NetContributionBanner scorecard={scorecard} />
            </CardContent>
        </Card>
    )
}
