"use client"

import { Scale, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2, Info, Layers, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatRp } from "../formatters"
import { ScorecardData, DrilldownData } from "../../types"

interface MaterialReconciliationCardProps {
    scorecard: ScorecardData
    drilldown: DrilldownData
}

export function MaterialReconciliationCard({ scorecard, drilldown }: MaterialReconciliationCardProps) {
    const md = drilldown.materialDetail
    const semen = md?.semen || {
        totalCost: scorecard.semenCost || 0,
        avgPricePerKg: 0,
        totalInKg: 0,
        consumedKg: 0,
        diffKg: 0,
        totalPoKg: 0,
        totalPoVal: 0,
        totalIncomingVal: 0
    }
    const pasir = md?.pasir || {
        totalCost: scorecard.pasirCost || 0,
        avgPricePerM3: 0,
        totalInM3: 0,
        consumedM3: 0,
        diffM3: 0,
        totalIncomingVal: 0
    }
    const split = md?.split || {
        totalCost: scorecard.splitCost || 0,
        avgPricePerM3: 0,
        totalInM3: 0,
        consumedM3: 0,
        diffM3: 0,
        totalIncomingVal: 0
    }

    const totalProcuredVal = md?.reconciliation?.totalProcuredVal ?? (semen.totalIncomingVal + pasir.totalIncomingVal + split.totalIncomingVal)
    const totalConsumedVal = md?.reconciliation?.totalConsumedVal ?? (semen.totalCost + pasir.totalCost + split.totalCost)
    const totalDiffVal = md?.reconciliation?.totalDiffVal ?? (totalProcuredVal - totalConsumedVal)

    // Data baris rekonsiliasi
    const rows = [
        {
            name: "Semen Curah & Zak",
            satuan: "Kg / Ton",
            unitLabel: "Kg",
            procuredQty: semen.totalInKg || 0,
            procuredTon: (semen.totalInKg || 0) / 1000,
            procuredVal: semen.totalIncomingVal || 0,
            poQty: semen.totalPoKg || 0,
            poVal: semen.totalPoVal || 0,
            consumedQty: semen.consumedKg || 0,
            consumedTon: (semen.consumedKg || 0) / 1000,
            consumedVal: semen.totalCost || scorecard.semenCost || 0,
            diffQty: semen.diffKg ?? ((semen.totalInKg || 0) - (semen.consumedKg || 0)),
            diffVal: (semen.totalIncomingVal || 0) - (semen.totalCost || scorecard.semenCost || 0),
            status: (semen.diffKg ?? 0) >= 0 ? "Pengadaan Berlebih (Stok +)" : "Pengadaan Kurang (Tarik Silo -)",
            statusType: (semen.diffKg ?? 0) >= 0 ? "success" : "warning",
            notes: (semen.diffKg ?? 0) >= 0
                ? `Pengadaan masuk Silo lebih banyak ${Math.round(semen.diffKg || 0).toLocaleString("id-ID")} Kg (${((semen.diffKg || 0) / 1000).toFixed(1)} Ton) dibanding kebutuhan produksi cor (ada penambahan cadangan buffer stok di Silo).`
                : `Pemakaian cor lebih banyak ${Math.abs(Math.round(semen.diffKg || 0)).toLocaleString("id-ID")} Kg (${Math.abs((semen.diffKg || 0) / 1000).toFixed(1)} Ton) dibanding pengadaan masuk bulan ini (mengambil buffer stock Silo awal bulan). PO resmi terbit: ${((semen.totalPoKg || 0) / 1000).toFixed(0)} Ton.`
        },
        {
            name: "Pasir Cor Lapangan",
            satuan: "m³",
            unitLabel: "m³",
            procuredQty: pasir.totalInM3 || drilldown.totalPasirMasukM3 || 0,
            procuredVal: pasir.totalIncomingVal || 0,
            consumedQty: pasir.consumedM3 || 0,
            consumedVal: pasir.totalCost || scorecard.pasirCost || 0,
            diffQty: pasir.diffM3 ?? ((pasir.totalInM3 || drilldown.totalPasirMasukM3 || 0) - (pasir.consumedM3 || 0)),
            diffVal: (pasir.totalIncomingVal || 0) - (pasir.totalCost || scorecard.pasirCost || 0),
            status: (pasir.totalInM3 || drilldown.totalPasirMasukM3 || 0) === 0 ? "Bon Fisik Belum Diinput" : "Tercatat",
            statusType: (pasir.totalInM3 || drilldown.totalPasirMasukM3 || 0) === 0 ? "danger" : "info",
            notes: (pasir.totalInM3 || drilldown.totalPasirMasukM3 || 0) === 0
                ? `Pemakaian tercatat ${(pasir.consumedM3 || 0).toFixed(1)} m³ (${formatRp(pasir.totalCost)}). Belum ada surat bon masuk dari Quarry yang diinput ke menu Material Agregat periode ini.`
                : `Selisih pasokan bon vs pemakaian riil: ${(pasir.diffM3 || 0).toFixed(1)} m³.`
        },
        {
            name: "Batu Split (1/2 & 2/3)",
            satuan: "m³",
            unitLabel: "m³",
            procuredQty: split.totalInM3 || drilldown.totalSplitMasukM3 || 0,
            procuredVal: split.totalIncomingVal || 0,
            consumedQty: split.consumedM3 || 0,
            consumedVal: split.totalCost || scorecard.splitCost || 0,
            diffQty: split.diffM3 ?? ((split.totalInM3 || drilldown.totalSplitMasukM3 || 0) - (split.consumedM3 || 0)),
            diffVal: (split.totalIncomingVal || 0) - (split.totalCost || scorecard.splitCost || 0),
            status: (split.totalInM3 || 0) < (split.consumedM3 || 0) ? "Input Bon Parsial" : "Tercatat",
            statusType: (split.totalInM3 || 0) < 50 ? "warning" : "info",
            notes: (split.totalInM3 || 0) < 50
                ? `Baru ${(split.totalInM3 || 0).toFixed(1)} m³ bon Quarry terdaftar di sistem. Pemakaian produksi tercatat ${(split.consumedM3 || 0).toFixed(1)} m³ (${formatRp(split.totalCost)}). Sisa bon fisik lapangan belum terinput.`
                : `Selisih pasokan bon vs pemakaian riil: ${(split.diffM3 || 0).toFixed(1)} m³.`
        }
    ]

    return (
        <div className="bg-white rounded-xl border border-amber-300 shadow-xs p-4 space-y-4 font-sans">
            {/* Header Section */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                        <Scale className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                                Neraca Rekonsiliasi &amp; Selisih Material
                            </h3>
                            <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] px-2 py-0.2">
                                Pengadaan vs Pemakaian
                            </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Perbandingan kuantitas dan nilai pengadaan fisik/surat jalan yang diterima dengan pemakaian riil produksi (COGS)
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Biaya Bahan Baku Terpakai</div>
                    <div className="text-base font-bold font-mono text-slate-900">{formatRp(totalConsumedVal)}</div>
                </div>
            </div>

            {/* 3 Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Pengadaan Masuk */}
                <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">
                            1. Pengadaan Masuk (Fisik)
                        </span>
                        <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-lg font-bold font-mono text-blue-950 mt-1">
                        {formatRp(totalProcuredVal)}
                    </div>
                    <div className="text-[10px] text-blue-800/80 leading-relaxed">
                        Semen Silo: <strong>{(semen.totalInKg || 0).toLocaleString("id-ID")} Kg</strong> ({((semen.totalInKg || 0) / 1000).toFixed(0)} Ton) • Agregat: <strong>{((pasir.totalInM3 || 0) + (split.totalInM3 || 0)).toFixed(1)} m³</strong>
                    </div>
                </div>

                {/* 2. Penggunaan Tercatat */}
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                            2. Penggunaan Produksi (COGS)
                        </span>
                        <Layers className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-lg font-bold font-mono text-amber-950 mt-1">
                        {formatRp(totalConsumedVal)}
                    </div>
                    <div className="text-[10px] text-amber-800/80 leading-relaxed">
                        Semen Terpakai: <strong>{(semen.consumedKg || 0).toLocaleString("id-ID")} Kg</strong> ({((semen.consumedKg || 0) / 1000).toFixed(1)} Ton) • Agregat: <strong>{((pasir.consumedM3 || 0) + (split.consumedM3 || 0)).toFixed(1)} m³</strong>
                    </div>
                </div>

                {/* 3. Selisih Net */}
                <div className={`p-3 rounded-lg border space-y-1 ${
                    totalDiffVal >= 0
                        ? "border-emerald-200 bg-emerald-50/50 text-emerald-950"
                        : "border-rose-200 bg-rose-50/50 text-rose-950"
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wide">
                            3. Selisih Nilai (Pengadaan - Pakai)
                        </span>
                        {totalDiffVal >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                            <ArrowDownRight className="w-4 h-4 text-rose-600" />
                        )}
                    </div>
                    <div className="text-lg font-bold font-mono mt-1">
                        {totalDiffVal >= 0 ? `+${formatRp(totalDiffVal)}` : `-${formatRp(Math.abs(totalDiffVal))}`}
                    </div>
                    <div className="text-[10px] opacity-80 leading-relaxed">
                        {totalDiffVal >= 0
                            ? "Pengadaan masuk lebih besar dari pemakaian (net buffer stok bertambah)."
                            : "Pemakaian lebih besar dari surat jalan pengadaan masuk yang terinput."}
                    </div>
                </div>
            </div>

            {/* Reconciliation Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-[11px]">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
                        <tr>
                            <th className="py-2 px-2.5 text-left">Nama Material</th>
                            <th className="py-2 px-2 text-center">Sat.</th>
                            <th className="py-2 px-2.5 text-right bg-blue-50/40">Pengadaan Masuk (Qty)</th>
                            <th className="py-2 px-2.5 text-right bg-blue-50/40">Nilai Pengadaan</th>
                            <th className="py-2 px-2.5 text-right bg-amber-50/40">Pemakaian Riil (Qty)</th>
                            <th className="py-2 px-2.5 text-right bg-amber-50/40">Nilai Pemakaian (COGS)</th>
                            <th className="py-2 px-2.5 text-right">Selisih Kuantitas</th>
                            <th className="py-2 px-2.5 text-right">Selisih Nilai (Rp)</th>
                            <th className="py-2 px-2.5 text-center">Status Audit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((r, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                                    {r.name}
                                </td>
                                <td className="py-2 px-2 text-center text-slate-500 font-mono text-[10px]">
                                    {r.satuan}
                                </td>
                                
                                {/* Pengadaan Masuk */}
                                <td className="py-2 px-2.5 text-right font-mono font-bold text-blue-900 bg-blue-50/20">
                                    {r.satuan.includes("Ton") ? (
                                        <div>
                                            <span>{r.procuredQty.toLocaleString("id-ID")} Kg</span>
                                            <div className="text-[9px] font-normal text-slate-500">
                                                ({(r.procuredTon || 0).toFixed(0)} Ton)
                                            </div>
                                        </div>
                                    ) : (
                                        <span>{r.procuredQty.toLocaleString("id-ID")} m³</span>
                                    )}
                                </td>
                                <td className="py-2 px-2.5 text-right font-mono font-medium text-blue-950 bg-blue-50/20">
                                    {formatRp(r.procuredVal)}
                                </td>

                                {/* Pemakaian Produksi */}
                                <td className="py-2 px-2.5 text-right font-mono font-bold text-amber-900 bg-amber-50/20">
                                    {r.satuan.includes("Ton") ? (
                                        <div>
                                            <span>{r.consumedQty.toLocaleString("id-ID")} Kg</span>
                                            <div className="text-[9px] font-normal text-slate-500">
                                                ({(r.consumedTon || 0).toFixed(1)} Ton)
                                            </div>
                                        </div>
                                    ) : (
                                        <span>{r.consumedQty.toLocaleString("id-ID")} m³</span>
                                    )}
                                </td>
                                <td className="py-2 px-2.5 text-right font-mono font-medium text-amber-950 bg-amber-50/20">
                                    {formatRp(r.consumedVal)}
                                </td>

                                {/* Selisih Kuantitas */}
                                <td className={`py-2 px-2.5 text-right font-mono font-bold ${
                                    r.diffQty >= 0 ? "text-emerald-700" : "text-rose-700"
                                }`}>
                                    {r.satuan.includes("Ton") ? (
                                        <div>
                                            <span>{r.diffQty >= 0 ? `+${r.diffQty.toLocaleString("id-ID")}` : r.diffQty.toLocaleString("id-ID")} Kg</span>
                                            <div className="text-[9px] font-normal text-slate-500">
                                                ({(r.diffQty / 1000).toFixed(1)} Ton)
                                            </div>
                                        </div>
                                    ) : (
                                        <span>{r.diffQty >= 0 ? `+${r.diffQty.toLocaleString("id-ID")}` : r.diffQty.toLocaleString("id-ID")} m³</span>
                                    )}
                                </td>

                                {/* Selisih Nilai */}
                                <td className={`py-2 px-2.5 text-right font-mono font-bold whitespace-nowrap ${
                                    r.diffVal >= 0 ? "text-emerald-700" : "text-rose-700"
                                }`}>
                                    {r.diffVal >= 0 ? `+${formatRp(r.diffVal)}` : `-${formatRp(Math.abs(r.diffVal))}`}
                                </td>

                                {/* Status */}
                                <td className="py-2 px-2.5 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                                        r.statusType === "success"
                                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                            : r.statusType === "warning"
                                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                                            : "bg-rose-100 text-rose-800 border border-rose-200"
                                    }`}>
                                        {r.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900">
                        <tr>
                            <td className="py-2 px-2.5" colSpan={3}>
                                TOTAL NERACA MATERIAL
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-blue-900">
                                {formatRp(totalProcuredVal)}
                            </td>
                            <td></td>
                            <td className="py-2 px-2.5 text-right font-mono text-amber-900">
                                {formatRp(totalConsumedVal)}
                            </td>
                            <td></td>
                            <td className={`py-2 px-2.5 text-right font-mono ${
                                totalDiffVal >= 0 ? "text-emerald-700" : "text-rose-700"
                            }`}>
                                {totalDiffVal >= 0 ? `+${formatRp(totalDiffVal)}` : `-${formatRp(Math.abs(totalDiffVal))}`}
                            </td>
                            <td className="py-2 px-2.5 text-center text-[10px] font-semibold">
                                <span className={totalDiffVal >= 0 ? "text-emerald-700" : "text-amber-700"}>
                                    {totalDiffVal >= 0 ? "Surplus Pengadaan (Stok +)" : "Pengadaan Kurang (Tarik Cadangan)"}
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Detail Catatan Audit & Penjelasan Selisih */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 space-y-2 text-[11px] text-slate-700">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Catatan Audit &amp; Analisis Selisih Operasional Lapangan:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                    <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="font-semibold text-blue-900 flex items-center justify-between">
                            <span>1. Semen Curah (Silo):</span>
                            <Badge className="bg-blue-100 text-blue-800 text-[9px] font-mono">10 Truk Silo</Badge>
                        </div>
                        <p className="text-[10.5px] leading-relaxed text-slate-600">
                            {rows[0].notes}
                        </p>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="font-semibold text-amber-900 flex items-center justify-between">
                            <span>2. Pasir Cor:</span>
                            <Badge className="bg-amber-100 text-amber-800 text-[9px] font-mono">Quarry Input</Badge>
                        </div>
                        <p className="text-[10.5px] leading-relaxed text-slate-600">
                            {rows[1].notes}
                        </p>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="font-semibold text-indigo-900 flex items-center justify-between">
                            <span>3. Batu Split (1/2 &amp; 2/3):</span>
                            <Badge className="bg-indigo-100 text-indigo-800 text-[9px] font-mono">1 Bon Terinput</Badge>
                        </div>
                        <p className="text-[10.5px] leading-relaxed text-slate-600">
                            {rows[2].notes}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
