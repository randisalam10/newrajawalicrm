"use client"

import { useState } from "react"
import { Building2, WalletCards, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatRp } from "../formatters"
import { ScorecardData, DrilldownData } from "../../types"

interface SectionDDrilldownProps {
    scorecard: ScorecardData
    drilldown: DrilldownData
    activeSectionDItem: "all" | "rbl" | "fixed_contract" | "vehicle"
    isDrilldownMinimized: boolean
    setActiveSectionDItem: (item: "all" | "rbl" | "fixed_contract" | "vehicle") => void
    setIsDrilldownMinimized: (minimized: boolean) => void
    onClose: () => void
}

export function SectionDDrilldown({
    scorecard,
    drilldown,
    activeSectionDItem,
    isDrilldownMinimized,
    setActiveSectionDItem,
    setIsDrilldownMinimized,
    onClose
}: SectionDDrilldownProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const allCategories = drilldown.rblOpexDetail?.categories || []
    const totalRealized = drilldown.rblOpexDetail?.totalRealized || scorecard.rblOpex || 1
    const filteredExpenses = selectedCategory === "all"
        ? (drilldown.rblOpexDetail?.recentExpenses || [])
        : (drilldown.rblOpexDetail?.recentExpenses || []).filter(e => e.kategori.toLowerCase() === selectedCategory.toLowerCase())

    return (
        <div className="space-y-4 pt-3 border-t-2 border-dashed border-blue-400 font-sans">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" /> Detail Drilldown Overhead &amp; Amortisasi
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Sub-item pills */}
                    <div className="flex flex-wrap gap-1">
                        {(["all", "rbl", "fixed_contract", "vehicle"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveSectionDItem(tab)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all border ${
                                    activeSectionDItem === tab
                                        ? "bg-blue-800 text-white border-blue-800"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                            >
                                {tab === "all" ? "Semua Overhead" : tab === "rbl" ? "1. Kas Cabang (RBL)" : tab === "fixed_contract" ? "2. Sewa Tanah & Mess" : "3. Pajak & KIR Armada"}
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
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200 flex items-center justify-between text-xs text-blue-900">
                    <span>Rincian drilldown beban overhead dan amortisasi sedang disembunyikan.</span>
                    <button
                        onClick={() => setIsDrilldownMinimized(false)}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-300 text-blue-800 rounded font-semibold text-[11px] shadow-xs cursor-pointer"
                    >
                        👁️ Buka / Tampilkan Rincian Detail
                    </button>
                </div>
            ) : (
                <>
                    {/* 1. Detail Kas Operasional Cabang (RBL Opex) */}
                    {(activeSectionDItem === "all" || activeSectionDItem === "rbl") && (
                        <div className="bg-white rounded-lg border border-blue-200 p-3 shadow-xs space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                        <WalletCards className="w-4 h-4 text-blue-600" /> 1. Realisasi Kas Cabang (RBL Opex)
                                        <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0 h-4">
                                            {allCategories.length} KATEGORI TERDAFTAR
                                        </Badge>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-600">
                                        Plafon: <strong className="text-slate-800">{formatRp(drilldown.rblOpexDetail?.totalBudget || 0)}</strong>
                                        &nbsp;|&nbsp;Realisasi: <strong className="text-red-700">{formatRp(drilldown.rblOpexDetail?.totalRealized || scorecard.rblOpex)}</strong>
                                        &nbsp;|&nbsp;Sisa: <strong className="text-emerald-700">{formatRp(drilldown.rblOpexDetail?.sisaKas || 0)}</strong>
                                    </div>
                                </div>

                                {/* Penjelasan Alokasi RBL */}
                                <div className="bg-blue-50/60 border border-blue-200 p-2.5 rounded-lg text-xs text-blue-950 space-y-1">
                                    <div className="font-semibold text-[11px] flex items-center gap-1.5">
                                        <span>💡 Alokasi Pengeluaran Kas RBL Sesuai Kategori Lapangan:</span>
                                    </div>
                                    <p className="text-[10.5px] leading-relaxed text-slate-600">
                                        Pengeluaran kas RBL mencakup <strong>{allCategories.length} kategori operasional</strong> di plant. Kategori yang berkaitan langsung dengan armada &amp; operasional cor (seperti <em>BBM/Solar</em> dan <em>Pemeliharaan Bengkel</em>) dikelompokkan ke <strong>Seksi B (Biaya Pokok Langsung / COGS)</strong>. Sedangkan kategori pendukung plant (seperti <em>Konsumsi, Listrik, Retribusi, ATK, Keamanan, K3</em>) dicatat sebagai <strong>Seksi D (Beban Operasional / Overhead)</strong>.
                                    </p>
                                </div>

                                {/* Grid Kartu Seluruh Kategori Kas (Bisa Diklik untuk Filter) */}
                                {allCategories.length > 0 && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-semibold text-slate-700">Daftar Seluruh Kategori Pengeluaran Kas ({allCategories.length} Kategori):</span>
                                            {selectedCategory !== "all" && (
                                                <button
                                                    onClick={() => setSelectedCategory("all")}
                                                    className="text-[10px] text-blue-700 hover:underline font-semibold cursor-pointer"
                                                >
                                                    ✕ Reset Filter (Tampilkan Semua)
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                                            {allCategories.map((c: any) => {
                                                const isSelected = selectedCategory.toLowerCase() === c.name.toLowerCase()
                                                const pct = totalRealized > 0 ? ((c.total / totalRealized) * 100).toFixed(1) : "0"
                                                const isDirectCogs = c.name.toLowerCase().includes("bbm") || c.name.toLowerCase().includes("solar") || c.name.toLowerCase().includes("pemeliharaan") || c.name.toLowerCase().includes("sparepart")
                                                return (
                                                    <div
                                                        key={c.name}
                                                        onClick={() => setSelectedCategory(isSelected ? "all" : c.name)}
                                                        className={`p-2 rounded border cursor-pointer transition-all ${
                                                            isSelected
                                                                ? "bg-blue-100/80 border-blue-500 shadow-xs ring-1 ring-blue-500"
                                                                : "bg-slate-50 border-slate-200 hover:bg-blue-50/50 hover:border-blue-300"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-1">
                                                            <div className="text-[10px] font-bold text-slate-800 truncate" title={c.name}>{c.name}</div>
                                                            <span className="text-[8.5px] px-1 py-0.2 rounded font-mono bg-slate-200/70 text-slate-700">
                                                                {pct}%
                                                            </span>
                                                        </div>
                                                        <div className="font-bold font-mono text-slate-900 mt-0.5 text-[11px]">{formatRp(c.total)}</div>
                                                        <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                                                            <span>{c.count} Trx</span>
                                                            <span className={`px-1 py-0.2 rounded text-[8px] font-medium ${isDirectCogs ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                                                                {isDirectCogs ? "COGS (B)" : "Opex (D)"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Tabel Audit Transaksi Kas */}
                                <div className="space-y-1 pt-1 border-t">
                                    <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span>Rincian Transaksi Kas RBL:</span>
                                            <Badge variant="outline" className="text-[9px] font-mono">
                                                {filteredExpenses.length} Transaksi {selectedCategory !== "all" ? `[Kategori: ${selectedCategory}]` : ""}
                                            </Badge>
                                        </div>
                                        {selectedCategory !== "all" && (
                                            <span className="text-[10px] text-slate-500">
                                                Subtotal Kategori: <strong className="text-blue-800 font-mono">{formatRp(filteredExpenses.reduce((s, e) => s + e.amount, 0))}</strong>
                                            </span>
                                        )}
                                    </div>
                                    {filteredExpenses.length > 0 ? (
                                        <div className="overflow-x-auto max-h-[260px] rounded border border-slate-200">
                                            <table className="w-full text-[11px]">
                                                <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                                    <tr>
                                                        <th className="py-1.5 px-2 text-left">Tanggal</th>
                                                        <th className="py-1.5 px-2 text-left">Kategori</th>
                                                        <th className="py-1.5 px-2 text-left">Keterangan / Uraian</th>
                                                        <th className="py-1.5 px-2 text-left">Cabang Plant</th>
                                                        <th className="py-1.5 px-2 text-right">Nilai Biaya</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {filteredExpenses.map((e: any) => (
                                                        <tr key={e.id} className="hover:bg-slate-50/70">
                                                            <td className="py-1 px-2 whitespace-nowrap text-slate-500">{e.tanggal}</td>
                                                            <td className="py-1 px-2 whitespace-nowrap">
                                                                <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                                                    {e.kategori}
                                                                </span>
                                                            </td>
                                                            <td className="py-1 px-2 text-slate-700">{e.deskripsi}</td>
                                                            <td className="py-1 px-2 text-slate-500">{e.cabang}</td>
                                                            <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{formatRp(e.amount)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-xs italic py-2 text-center">
                                            Tidak ada transaksi kas RBL untuk kategori "{selectedCategory}" pada periode ini.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                    {/* 2. Detail Kontrak Beban Tetap */}
                    {(activeSectionDItem === "all" || activeSectionDItem === "fixed_contract") && (
                        <div className="bg-white rounded-lg border border-blue-200 p-3 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-blue-600" /> 2. Amortisasi Kontrak Beban Tetap (Sewa Tanah, Mess &amp; Izin)
                                </div>
                                <div className="text-[11px] font-mono text-slate-600">
                                    Amortisasi/Bulan: <strong className="text-slate-900">{formatRp(scorecard.totalFixedContractMonthly || 0)}</strong>
                                </div>
                            </div>

                            {drilldown.fixedCostContracts && drilldown.fixedCostContracts.length > 0 ? (
                                <div className="overflow-x-auto max-h-[220px] rounded border border-slate-200">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                            <tr>
                                                <th className="py-1.5 px-2 text-left">Nama Kontrak</th>
                                                <th className="py-1.5 px-2 text-left">Kategori</th>
                                                <th className="py-1.5 px-2 text-left">Vendor / Pihak</th>
                                                <th className="py-1.5 px-2 text-left">Periode</th>
                                                <th className="py-1.5 px-2 text-right">Nilai Kontrak</th>
                                                <th className="py-1.5 px-2 text-right">Beban/Bulan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {drilldown.fixedCostContracts.map((c: any) => (
                                                <tr key={c.id} className="hover:bg-slate-50/70">
                                                    <td className="py-1 px-2 font-medium text-slate-800">{c.name}</td>
                                                    <td className="py-1 px-2">
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                                            {c.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-1 px-2 text-slate-600">{c.vendor}</td>
                                                    <td className="py-1 px-2 text-slate-500 whitespace-nowrap">{c.startDate} - {c.endDate}</td>
                                                    <td className="py-1 px-2 text-right font-mono">{formatRp(c.totalAmount)}</td>
                                                    <td className="py-1 px-2 text-right font-mono font-bold text-indigo-900">{formatRp(c.monthlyAmount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-xs italic">Belum ada kontrak beban tetap aktif pada periode ini.</p>
                            )}
                        </div>
                    )}

                    {/* 3. Detail Kepatuhan Kendaraan */}
                    {(activeSectionDItem === "all" || activeSectionDItem === "vehicle") && (
                        <div className="bg-white rounded-lg border border-blue-200 p-3 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-blue-600" /> 3. Beban Pajak STNK &amp; Uji KIR Armada
                                </div>
                                <div className="text-[11px] font-mono text-slate-600">
                                    Pajak STNK: <strong className="text-slate-800">{formatRp(scorecard.vehicleTaxMonthly || 0)}/bln</strong>
                                    &nbsp;|&nbsp;KIR: <strong className="text-slate-800">{formatRp(scorecard.vehicleKirMonthly || 0)}/bln</strong>
                                    &nbsp;|&nbsp;Total: <strong className="text-slate-900">{formatRp(scorecard.totalVehicleComplianceMonthly || 0)}/bln</strong>
                                </div>
                            </div>

                            {drilldown.vehicleCompliance && drilldown.vehicleCompliance.length > 0 ? (
                                <div className="overflow-x-auto max-h-[220px] rounded border border-slate-200">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                            <tr>
                                                <th className="py-1.5 px-2 text-left">Unit / Plat</th>
                                                <th className="py-1.5 px-2 text-left">Pajak Tahunan</th>
                                                <th className="py-1.5 px-2 text-left">Biaya Uji KIR</th>
                                                <th className="py-1.5 px-2 text-center">Status</th>
                                                <th className="py-1.5 px-2 text-right">Amortisasi/Bulan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {drilldown.vehicleCompliance.map((v: any) => (
                                                <tr key={v.id} className="hover:bg-slate-50/70">
                                                    <td className="py-1 px-2">
                                                        <div className="font-bold text-slate-800 font-mono">{v.code}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono">{v.plate} • {v.category}</div>
                                                    </td>
                                                    <td className="py-1 px-2">
                                                        {v.annualTax > 0 ? (
                                                            <div>
                                                                <div className="font-mono text-slate-800">{formatRp(v.annualTax)}/thn</div>
                                                                <div className="text-[10px] text-slate-500">Exp: {v.taxExpiry}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-1 px-2">
                                                        {v.kirCost > 0 ? (
                                                            <div>
                                                                <div className="font-mono text-slate-800">{formatRp(v.kirCost)}/{v.kirPeriodMonths}bln</div>
                                                                <div className="text-[10px] text-slate-500">Exp: {v.kirExpiry}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-1 px-2 text-center">
                                                        {v.hasHistory ? (
                                                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                ✓ Riwayat
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                                ⚡ Master
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-1 px-2 text-right font-mono font-bold text-slate-900 bg-slate-50/40">
                                                        {formatRp(v.totalMonthly)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-xs italic">Belum ada armada dengan data kepatuhan STNK/KIR terdaftar.</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
