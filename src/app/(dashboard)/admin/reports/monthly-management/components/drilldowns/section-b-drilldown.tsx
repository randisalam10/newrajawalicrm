"use client"

import { Search, Package, Fuel, Users, Wrench, Layers, FileCheck, CheckCircle2, Scale } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatRp } from "../formatters"
import { ScorecardData, DrilldownData } from "../../types"
import { MaterialReconciliationCard } from "./material-reconciliation-card"

export type SectionBItemType =
    | "all"
    | "reconciliation"
    | "semen_po"
    | "aggregate"
    | "fuel_rbl"
    | "maintenance_rbl"
    | "maintenance_po"
    | "retase"
    | "manual_cogs"

interface SectionBDrilldownProps {
    scorecard: ScorecardData
    drilldown: DrilldownData
    activeSectionBItem: SectionBItemType
    isDrilldownMinimized: boolean
    setActiveSectionBItem: (item: SectionBItemType) => void
    setIsDrilldownMinimized: (minimized: boolean) => void
    onClose: () => void
}

export function SectionBDrilldown({
    scorecard,
    drilldown,
    activeSectionBItem,
    isDrilldownMinimized,
    setActiveSectionBItem,
    setIsDrilldownMinimized,
    onClose
}: SectionBDrilldownProps) {
    const md = drilldown.maintenanceDetail
    const hasPo = md?.fromPo?.length > 0
    const hasRbl = md?.fromRbl?.length > 0

    const aggregateItems = drilldown.aggregateIncomings || []
    const cementPoItems = drilldown.materialDetail?.cementPoItems || []
    const cementIncomings = drilldown.materialDetail?.incomings || []

    return (
        <div className="space-y-4 pt-3 border-t-2 border-dashed border-amber-400 font-sans">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <Search className="w-3.5 h-3.5 text-amber-600" /> Detail Drilldown Biaya: Terpisah PO vs RBL vs Agregat
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Sub-item pills */}
                    <div className="flex flex-wrap gap-1">
                        {([
                            { id: "all", label: "Semua Biaya" },
                            { id: "reconciliation", label: "⚖️ Selisih Pengadaan vs Pakai" },
                            { id: "semen_po", label: "1. PO Semen (BP)" },
                            { id: "aggregate", label: "2. Agregat Pasir/Split" },
                            { id: "fuel_rbl", label: "3. Solar BBM (RBL)" },
                            { id: "maintenance_rbl", label: "4. Bengkel Kas (RBL)" },
                            { id: "maintenance_po", label: "5. PO Sparepart (BP)" },
                            { id: "retase", label: "6. Upah Retase" },
                            { id: "manual_cogs", label: "7. Biaya Pokok & Gaji (Manual)" }
                        ] as const).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSectionBItem(tab.id as SectionBItemType)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all border cursor-pointer ${
                                    activeSectionBItem === tab.id
                                        ? "bg-amber-700 text-white border-amber-700 shadow-xs"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                            >
                                {tab.label}
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
                <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                    <span>Rincian drilldown komponen biaya langsung sedang disembunyikan.</span>
                    <button
                        onClick={() => setIsDrilldownMinimized(false)}
                        className="px-2.5 py-1 bg-white hover:bg-amber-50 border border-amber-300 text-amber-800 rounded font-semibold text-[11px] shadow-xs cursor-pointer"
                    >
                        👁️ Buka / Tampilkan Rincian Detail
                    </button>
                </div>
            ) : (
                <>
                    {/* ========================================================================= */}
                    {/* ── 0. NERACA REKONSILIASI & SELISIH MATERIAL (PENGADAAN VS PENGGUNAAN) ── */}
                    {/* ========================================================================= */}
                    {(activeSectionBItem === "all" || activeSectionBItem === "reconciliation") && (
                        <MaterialReconciliationCard scorecard={scorecard} drilldown={drilldown} />
                    )}

                    {/* ========================================================================= */}
                    {/* ── 1. DETAIL PO SEMEN (KHUSUS BATCHING PLANT) ─────────────────────────── */}
                    {/* ========================================================================= */}
                    {(activeSectionBItem === "all" || activeSectionBItem === "semen_po") && (
                        <div className="bg-white rounded-lg border border-amber-200 p-3 shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <FileCheck className="w-4 h-4 text-blue-600" />
                                    <span className="font-bold text-slate-900 text-xs">
                                        1. Pengadaan Semen via Purchase Order (Khusus Batching Plant)
                                    </span>
                                    <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0 h-4">
                                        BP ONLY
                                    </Badge>
                                </div>
                                <div className="text-[11px] font-mono text-slate-700">
                                    Biaya Semen Terpakai (Tiket): <strong className="text-amber-900">{formatRp(scorecard.semenCost)}</strong>
                                    &nbsp;|&nbsp;Total PO Semen BP: <strong className="text-blue-900">{formatRp(scorecard.totalCementPoCost || 0)}</strong>
                                </div>
                            </div>

                            {/* Info Box Filter Khusus BP & Rekonsiliasi Silo */}
                            <div className="bg-blue-50/60 border border-blue-200 p-2.5 rounded-lg text-xs text-blue-950 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span>
                                            Daftar PO Semen di bawah ini <strong>hanya memuat PO yang dicentang [Untuk Batching Plant]</strong>.
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-blue-700 whitespace-nowrap ml-2">
                                        {cementPoItems.length} PO Terverifikasi
                                    </span>
                                </div>
                                
                                {/* Status Rekonsiliasi Logistik Silo vs Purchasing PO */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-blue-200/60 text-[11px]">
                                    <div className="bg-white p-2 rounded border border-blue-100">
                                        <div className="text-slate-500 text-[10px]">1. Pemakaian Produksi (HPP/COGS):</div>
                                        <div className="font-bold text-amber-900 mt-0.5">{formatRp(scorecard.semenCost)}</div>
                                        <div className="text-[9px] text-slate-400">Estimasi ~261 Ton beton cor</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-blue-100">
                                        <div className="text-slate-500 text-[10px]">2. Fisik Masuk Silo (Timbangan):</div>
                                        <div className="font-bold text-blue-800 mt-0.5">
                                            {(drilldown.materialDetail?.semen?.totalInKg || 0).toLocaleString("id-ID")} Kg ({((drilldown.materialDetail?.semen?.totalInKg || 0) / 1000).toFixed(0)} Ton)
                                        </div>
                                        <div className="text-[9px] text-slate-400">{cementIncomings.length} Truk Cipta Jaya Tobati</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-blue-100">
                                        <div className="text-slate-500 text-[10px]">3. PO BP Diterbitkan (Purchasing):</div>
                                        <div className="font-bold text-indigo-900 mt-0.5">{formatRp(scorecard.totalCementPoCost || 0)}</div>
                                        <div className="text-[9px] text-slate-400">1 PO (25 Ton Jumbo Bag)</div>
                                    </div>
                                </div>

                                <div className="text-[10px] text-slate-600 bg-amber-50/80 p-2 rounded border border-amber-200/80">
                                    💡 <strong>Catatan Audit Rekonsiliasi:</strong> Fisik semen yang masuk ke Silo tercatat <strong>{((drilldown.materialDetail?.semen?.totalInKg || 0) / 1000).toFixed(0)} Ton (10 Surat Jalan Cipta Jaya)</strong> dan sinkron dengan pemakaian cor (~261 Ton). Namun bagian Purchasing baru menerbitkan <strong>1 PO BP sebesar 25 Ton (Rp 50.500.000)</strong>. Sisa 225 Ton fisik masuk Silo belum dihubungkan ke nomor PO di sistem.
                                </div>
                            </div>

                            {/* Tabel PO Semen BP */}
                            {cementPoItems.length > 0 ? (
                                <div className="space-y-1">
                                    <div className="overflow-x-auto max-h-[220px] rounded border border-slate-200">
                                        <table className="w-full text-[11px]">
                                            <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                                <tr>
                                                    <th className="py-1.5 px-2 text-left">No. PO</th>
                                                    <th className="py-1.5 px-2 text-left">Tanggal</th>
                                                    <th className="py-1.5 px-2 text-left">Perusahaan</th>
                                                    <th className="py-1.5 px-2 text-left">Deskripsi Barang</th>
                                                    <th className="py-1.5 px-2 text-left">Cabang BP</th>
                                                    <th className="py-1.5 px-2 text-right">Kuantitas</th>
                                                    <th className="py-1.5 px-2 text-right">Harga Satuan</th>
                                                    <th className="py-1.5 px-2 text-right">Subtotal PO</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {cementPoItems.map((p: any) => (
                                                    <tr key={p.id} className="hover:bg-blue-50/40">
                                                        <td className="py-1.5 px-2 font-mono font-bold text-blue-700 whitespace-nowrap">
                                                            {p.po_number}
                                                            <span className="ml-1 text-[9px] px-1 py-0.2 bg-blue-100 text-blue-800 rounded">BP</span>
                                                        </td>
                                                        <td className="py-1.5 px-2 text-slate-500 whitespace-nowrap">{p.tanggal}</td>
                                                        <td className="py-1.5 px-2 text-slate-700 text-[10px]">{p.companyGroup || "-"}</td>
                                                        <td className="py-1.5 px-2 text-slate-900 font-medium">{p.item_name}</td>
                                                        <td className="py-1.5 px-2 text-slate-600">{p.lokasi}</td>
                                                        <td className="py-1.5 px-2 text-right font-medium">{p.quantity} {p.satuan}</td>
                                                        <td className="py-1.5 px-2 text-right font-mono">{formatRp(p.harga_satuan)}</td>
                                                        <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">{formatRp(p.subtotal)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-xs py-2 italic text-center">
                                    Tidak ada Surat Pesanan (PO) Semen dengan peruntukan Batching Plant pada periode ini.
                                </p>
                            )}

                            {/* Ringkasan Timbangan Semen Silo Masuk */}
                            {cementIncomings.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t">
                                    <div className="text-[11px] font-semibold text-slate-700 flex flex-wrap items-center justify-between gap-1">
                                        <span>Penerimaan Fisik Semen ke Silo (Material Incoming):</span>
                                        <div className="text-slate-600 text-[10px] space-x-2">
                                            <span>Total Tonase: <strong className="text-blue-700 font-mono">{(drilldown.materialDetail?.semen?.totalInKg || 0).toLocaleString("id-ID")} Kg</strong></span>
                                            <span>•</span>
                                            <span>Total Nilai Masuk: <strong className="text-emerald-700 font-mono">{formatRp(cementIncomings.reduce((s: number, c: any) => s + (c.total_price || 0), 0))}</strong></span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto max-h-[180px] rounded border border-slate-200">
                                        <table className="w-full text-[11px]">
                                            <thead className="bg-slate-50 border-b text-slate-600 sticky top-0 font-semibold">
                                                <tr>
                                                    <th className="py-1.5 px-2 text-left">Tgl</th>
                                                    <th className="py-1.5 px-2 text-left">Nama / Jenis</th>
                                                    <th className="py-1.5 px-2 text-left">Supplier</th>
                                                    <th className="py-1.5 px-2 text-left">No. Surat Jalan</th>
                                                    <th className="py-1.5 px-2 text-right">Tonase (Kg)</th>
                                                    <th className="py-1.5 px-2 text-right">Harga Satuan</th>
                                                    <th className="py-1.5 px-2 text-right">Total Nilai</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {cementIncomings.map((c: any) => (
                                                    <tr key={c.id} className="hover:bg-slate-50/70">
                                                        <td className="py-1.5 px-2 text-slate-500 whitespace-nowrap">{c.date}</td>
                                                        <td className="py-1.5 px-2 font-medium text-slate-800">{c.name}</td>
                                                        <td className="py-1.5 px-2 text-slate-600">{c.supplier}</td>
                                                        <td className="py-1.5 px-2 font-mono text-[10px] text-slate-500">{c.delivery_note || "-"}</td>
                                                        <td className="py-1.5 px-2 text-right font-bold text-blue-700">{c.tonnage?.toLocaleString("id-ID")} Kg</td>
                                                        <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                                                            {c.unit_price > 0 ? formatRp(c.unit_price) : "-"}
                                                        </td>
                                                        <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-700">
                                                            {c.total_price > 0 ? formatRp(c.total_price) : "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* ── 2. DETAIL AGREGAT PASIR & SPLIT (QUARRY & SUPPLIER) ────────────────── */}
                    {/* ========================================================================= */}
                    {(activeSectionBItem === "all" || activeSectionBItem === "aggregate") && (
                        <div className="bg-white rounded-lg border border-amber-200 p-3 shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-emerald-600" />
                                    <span className="font-bold text-slate-900 text-xs">
                                        2. Bahan Baku Agregat (Pasir Cor &amp; Batu Split dari Quarry/Plant)
                                    </span>
                                    <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 h-4">
                                        QUARRY / BON
                                    </Badge>
                                </div>
                                <div className="text-[11px] font-mono text-slate-700">
                                    Total Agregat: <strong className="text-emerald-900">{formatRp(scorecard.aggregateCost || ((scorecard.pasirCost || 0) + (scorecard.splitCost || 0)))}</strong>
                                </div>
                            </div>

                            {/* Cards Breakdown Material Agregat (Pasir, B12, B23, Ciping) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                                {/* 1. Pasir Cor */}
                                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-amber-950">Pasir Cor</span>
                                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                                            Pemakaian Produksi
                                        </span>
                                    </div>
                                    <div className="text-base font-bold text-slate-900">{formatRp(scorecard.pasirCost)}</div>
                                    <div className="text-[10px] text-slate-600 flex items-center justify-between pt-1 border-t border-amber-200/60">
                                        <span>Bon Fisik Quarry:</span>
                                        <span className="font-bold text-blue-700">
                                            {(drilldown.totalPasirMasukM3 || 0).toLocaleString("id-ID")} m³
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Batu Split 1-2 (B12) */}
                                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-indigo-950">Batu Split 1-2 (B12)</span>
                                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                                            Ukuran 10-20mm
                                        </span>
                                    </div>
                                    <div className="text-base font-bold text-slate-900">{formatRp(scorecard.split12Cost || 0)}</div>
                                    <div className="text-[10px] text-slate-600 pt-1 border-t border-indigo-200/60">
                                        <span>Fraksi mutu beton K-225 ke atas</span>
                                    </div>
                                </div>

                                {/* 3. Batu Split 2-3 (B23) */}
                                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-blue-950">Batu Split 2-3 (B23)</span>
                                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                                            Ukuran 20-30mm
                                        </span>
                                    </div>
                                    <div className="text-base font-bold text-slate-900">{formatRp(scorecard.split23Cost || 0)}</div>
                                    <div className="text-[10px] text-slate-600 pt-1 border-t border-blue-200/60">
                                        <span>Fraksi beton struktur berat</span>
                                    </div>
                                </div>

                                {/* 4. Ciping (0-5) */}
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900">Ciping (0-5) / Skrining</span>
                                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/60 px-1.5 py-0.5 rounded">
                                            Ukuran 0-5mm
                                        </span>
                                    </div>
                                    <div className="text-base font-bold text-slate-900">{formatRp(scorecard.ciping05Cost || 0)}</div>
                                    <div className="text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                                        <span>Abu batu / agregat pengisi</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Penjelasan Perbedaan HPP Pemakaian vs Bon Masuk Fisik */}
                            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[11px] text-slate-600 space-y-0.5">
                                <div className="font-semibold text-slate-800">
                                    💡 Penjelasan Data Agregat:
                                </div>
                                <p>
                                    Nilai Rupiah di atas (<strong className="text-slate-800">{formatRp(scorecard.pasirCost)}</strong> untuk Pasir dan <strong className="text-slate-800">{formatRp(scorecard.splitCost)}</strong> untuk Split) adalah <strong>Biaya Konsumsi Material Produksi (COGS)</strong> yang terhitung dari total kubikasi beton cor yang diproduksi di Batching Plant.
                                </p>
                                <p>
                                    Sedangkan tabel di bawah mencatat <strong>Surat Bon / Surat Jalan Fisik</strong> penerimaan barang dari Quarry (tabel <code>AggregateIncoming</code>). Jika tim operasional lapangan belum menginput surat bon fisik di menu <em>Material Agregat</em>, maka baris bon tidak akan muncul di tabel bawah.
                                </p>
                            </div>

                            {/* Tabel Riil Penerimaan Agregat Masuk */}
                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                                    <span>Penerimaan Agregat Masuk (Surat Bon / Surat Jalan Quarry):</span>
                                    <span className="text-[10px] text-slate-500">{aggregateItems.length} Transaksi Terdaftar</span>
                                </div>
                                {aggregateItems.length > 0 ? (
                                    <div className="overflow-x-auto max-h-[220px] rounded border border-slate-200">
                                        <table className="w-full text-[11px]">
                                            <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                                <tr>
                                                    <th className="py-1.5 px-2 text-left">No. Bon</th>
                                                    <th className="py-1.5 px-2 text-left">Tanggal</th>
                                                    <th className="py-1.5 px-2 text-left">Jenis Material</th>
                                                    <th className="py-1.5 px-2 text-left">Sopir / Plat</th>
                                                    <th className="py-1.5 px-2 text-left">Supplier/Quarry</th>
                                                    <th className="py-1.5 px-2 text-right">Volume (m³)</th>
                                                    <th className="py-1.5 px-2 text-right">Harga Sat.</th>
                                                    <th className="py-1.5 px-2 text-right">Total Nilai</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {aggregateItems.map((a: any) => (
                                                    <tr key={a.id} className="hover:bg-slate-50/70">
                                                        <td className="py-1 px-2 font-mono text-emerald-700 whitespace-nowrap">{a.no_bon}</td>
                                                        <td className="py-1 px-2 text-slate-500 whitespace-nowrap">{a.date}</td>
                                                        <td className="py-1 px-2 font-semibold text-slate-800">{a.aggregate_type}</td>
                                                        <td className="py-1 px-2 text-slate-600">
                                                            <div>{a.driver_name}</div>
                                                            <div className="text-[9px] text-slate-400 font-mono">{a.plate_number}</div>
                                                        </td>
                                                        <td className="py-1 px-2 text-slate-500">{a.supplier || "Quarry Internal"}</td>
                                                        <td className="py-1 px-2 text-right font-bold text-blue-700">{a.volume_cubic} m³</td>
                                                        <td className="py-1 px-2 text-right font-mono">{formatRp(a.unit_price)}</td>
                                                        <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{formatRp(a.total_price)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-xs py-2 italic text-center">
                                        Belum ada data penerimaan surat bon agregat masuk pada periode ini.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* ── 3. DETAIL BBM SOLAR ARMADA (RBL KAS OPERASIONAL) ───────────────────── */}
                    {/* ========================================================================= */}
                    {(activeSectionBItem === "all" || activeSectionBItem === "fuel_rbl") && (
                        <div className="bg-white rounded-lg border border-amber-200 p-3 shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <Fuel className="w-4 h-4 text-amber-600" />
                                    <span className="font-bold text-slate-900 text-xs">
                                        3. Bahan Bakar Solar Armada (Kas RBL Cabang)
                                    </span>
                                    <Badge className="bg-amber-600 text-white text-[9px] px-1.5 py-0 h-4">
                                        RBL KAS
                                    </Badge>
                                </div>
                                <div className="text-[11px] font-mono text-slate-700">
                                    Vol: <strong className="text-amber-900">{(drilldown.fuelDetail?.totalLitres || 0).toLocaleString("id-ID")} L</strong>
                                    &nbsp;|&nbsp;Total: <strong className="text-amber-900">{formatRp(scorecard.fuelCost)}</strong>
                                </div>
                            </div>

                            {drilldown.fuelDetail?.items && drilldown.fuelDetail.items.length > 0 ? (
                                <div className="overflow-x-auto max-h-[220px] rounded border border-slate-200">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                            <tr>
                                                <th className="py-1.5 px-2 text-left">Tgl</th>
                                                <th className="py-1.5 px-2 text-left">Unit / Plat</th>
                                                <th className="py-1.5 px-2 text-left">KM/HM</th>
                                                <th className="py-1.5 px-2 text-right">Liter</th>
                                                <th className="py-1.5 px-2 text-right">Harga Satuan</th>
                                                <th className="py-1.5 px-2 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {drilldown.fuelDetail.items.map((b: any) => (
                                                <tr key={b.id} className="hover:bg-slate-50/70">
                                                    <td className="py-1 px-2 whitespace-nowrap text-slate-500">{b.tanggal}</td>
                                                    <td className="py-1 px-2 font-medium text-slate-800">{b.kendaraan}</td>
                                                    <td className="py-1 px-2 text-slate-500 font-mono">{b.km_hm}</td>
                                                    <td className="py-1 px-2 text-right font-bold text-amber-800">{b.liter} L</td>
                                                    <td className="py-1 px-2 text-right font-mono">{formatRp(b.harga_satuan)}</td>
                                                    <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{formatRp(b.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 text-xs py-2 italic">Belum ada pengeluaran BBM solar pada periode ini.</p>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* ── 4. DETAIL BENGKEL / SERVIS RUTIN (RBL KAS CABANG) ─────────────────── */}
                    {/* ========================================================================= */}
                    {(activeSectionBItem === "all" || activeSectionBItem === "maintenance_rbl") && (
                        <div className="bg-white rounded-lg border border-rose-200 p-3 shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <Wrench className="w-4 h-4 text-rose-600" />
                                    <span className="font-bold text-slate-900 text-xs">
                                        4. Servis Bengkel &amp; Perbaikan Rutin Lapangan (Kas RBL)
                                    </span>
                                    <Badge className="bg-rose-600 text-white text-[9px] px-1.5 py-0 h-4">
                                        RBL KAS
                                    </Badge>
                                </div>
                                <div className="text-[11px] font-mono text-slate-700">
                                    Total Realisasi Bengkel Kas: <strong className="text-rose-900">{formatRp(scorecard.maintenanceRblCost || md?.totalFromRbl || 0)}</strong>
                                </div>
                            </div>

                            {hasRbl ? (
                                <div className="overflow-x-auto max-h-[220px] rounded border border-slate-200">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                            <tr>
                                                <th className="py-1.5 px-2 text-left">Tanggal</th>
                                                <th className="py-1.5 px-2 text-left">Kategori Biaya</th>
                                                <th className="py-1.5 px-2 text-left">Deskripsi Pengeluaran Bengkel</th>
                                                <th className="py-1.5 px-2 text-left">Cabang</th>
                                                <th className="py-1.5 px-2 text-right">Nilai Biaya</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {md.fromRbl.map((r: any) => (
                                                <tr key={r.id} className="hover:bg-slate-50/70">
                                                    <td className="py-1 px-2 whitespace-nowrap text-slate-500">{r.tanggal}</td>
                                                    <td className="py-1 px-2 font-medium text-slate-700">{r.kategori}</td>
                                                    <td className="py-1 px-2 text-slate-800">{r.deskripsi}</td>
                                                    <td className="py-1 px-2 text-slate-500">{r.lokasi}</td>
                                                    <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{formatRp(r.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-xs py-2 italic text-center">
                                    Tidak ada catatan pengeluaran bengkel dari kas RBL pada periode ini.
                                </p>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* ── 5. DETAIL PO SUKU CADANG & PEMELIHARAAN (PO BP) ────────────────────── */}
                    {/* ========================================================================= */}
                    {(activeSectionBItem === "all" || activeSectionBItem === "maintenance_po") && (
                        <div className="bg-white rounded-lg border border-amber-200 p-3 shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <FileCheck className="w-4 h-4 text-indigo-600" />
                                    <span className="font-bold text-slate-900 text-xs">
                                        5. Pengadaan Suku Cadang &amp; Sparepart (PO Khusus BP)
                                    </span>
                                    <Badge className="bg-indigo-600 text-white text-[9px] px-1.5 py-0 h-4">
                                        PO BP
                                    </Badge>
                                </div>
                                <div className="text-[11px] font-mono text-slate-700">
                                    Total PO Sparepart BP: <strong className="text-indigo-900">{formatRp(scorecard.maintenancePoCost || md?.totalFromPo || 0)}</strong>
                                </div>
                            </div>

                            {hasPo ? (
                                <div className="overflow-x-auto max-h-[220px] rounded border border-slate-200">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                            <tr>
                                                <th className="py-1.5 px-2 text-left">No. PO</th>
                                                <th className="py-1.5 px-2 text-left">Tanggal</th>
                                                <th className="py-1.5 px-2 text-left">Nama Sparepart / Barang</th>
                                                <th className="py-1.5 px-2 text-left">Armada / Unit</th>
                                                <th className="py-1.5 px-2 text-left">Cabang BP</th>
                                                <th className="py-1.5 px-2 text-right">Qty</th>
                                                <th className="py-1.5 px-2 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {md.fromPo.map((p: any) => (
                                                <tr key={p.id} className="hover:bg-indigo-50/40">
                                                    <td className="py-1 px-2 font-mono font-bold text-indigo-700 whitespace-nowrap">
                                                        {p.po_number}
                                                        <span className="ml-1 text-[9px] px-1 py-0.2 bg-indigo-100 text-indigo-800 rounded">BP</span>
                                                    </td>
                                                    <td className="py-1 px-2 text-slate-500 whitespace-nowrap">{p.tanggal}</td>
                                                    <td className="py-1 px-2 font-medium text-slate-800">{p.item_name}</td>
                                                    <td className="py-1 px-2 text-slate-600 font-mono text-[10px]">{p.kendaraan}</td>
                                                    <td className="py-1 px-2 text-slate-500">{p.lokasi}</td>
                                                    <td className="py-1 px-2 text-right">{p.quantity} {p.satuan}</td>
                                                    <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{formatRp(p.subtotal)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-xs py-2 italic text-center">
                                    Tidak ada item PO suku cadang dengan peruntukan Batching Plant pada periode ini.
                                </p>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* ── 6. DETAIL UPAH RETASE SUPIR (MIXER & DT) ──────────────────────────── */}
                    {/* ========================================================================= */}
                    {(activeSectionBItem === "all" || activeSectionBItem === "retase") && (
                        <div className="bg-white rounded-lg border border-amber-200 p-3 shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-amber-600" />
                                    <span className="font-bold text-slate-900 text-xs">
                                        6. Upah Langsung Retase Supir (Mixer &amp; DT)
                                    </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-700">
                                    Mixer: <strong className="text-slate-800">{formatRp(drilldown.retaseDetail?.mixerRetaseTotal || 0)}</strong>
                                    &nbsp;|&nbsp;DT: <strong className="text-slate-800">{formatRp(drilldown.retaseDetail?.dtRetaseTotal || 0)}</strong>
                                    &nbsp;|&nbsp;Total: <strong className="text-amber-900">{formatRp(scorecard.retaseCost)}</strong>
                                </div>
                            </div>

                            {drilldown.retaseDetail?.topDrivers && drilldown.retaseDetail.topDrivers.length > 0 ? (
                                <div className="overflow-x-auto max-h-[220px] rounded border border-slate-200">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                                            <tr>
                                                <th className="py-1.5 px-2 text-center">Rank</th>
                                                <th className="py-1.5 px-2 text-left">Nama Supir</th>
                                                <th className="py-1.5 px-2 text-right">Trips</th>
                                                <th className="py-1.5 px-2 text-right">Vol (m³)</th>
                                                <th className="py-1.5 px-2 text-right">Rata-rata/Trip</th>
                                                <th className="py-1.5 px-2 text-right">Total Retase</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {drilldown.retaseDetail.topDrivers.map((d: any) => (
                                                <tr key={d.name} className="hover:bg-slate-50/70">
                                                    <td className="py-1 px-2 text-center font-bold text-slate-500">{d.rank}</td>
                                                    <td className="py-1 px-2 font-medium text-slate-800">{d.name}</td>
                                                    <td className="py-1 px-2 text-right">{d.trips}</td>
                                                    <td className="py-1 px-2 text-right font-bold text-blue-700">{d.volume}</td>
                                                    <td className="py-1 px-2 text-right font-mono text-slate-600">{d.avgLoad} m³</td>
                                                    <td className="py-1 px-2 text-right font-mono font-bold text-amber-900">{formatRp(d.retase)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 text-xs py-2 italic">Belum ada komisi retase supir tercatat pada periode ini.</p>
                            )}
                        </div>
                    )}

                    {/* ITEM 7: Biaya Pokok Langsung Lainnya (Input Manual) */}
                    {activeSectionBItem === "manual_cogs" && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">Biaya Pokok Langsung &amp; Gaji Produksi (Input Manual)</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Data gaji karyawan/operator dan biaya langsung yang diinput secara manual melalui menu Biaya Operasional / Kontrak (diklasifikasikan sebagai Biaya Pokok Langsung).
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[11px] text-slate-500 block uppercase font-medium">Total Biaya Pokok Manual</span>
                                        <span className="text-lg font-bold text-rose-600 font-mono">
                                            {formatRp(scorecard.manualDirectCost ?? 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="py-2.5 px-3 text-left">Nama Biaya / Komponen</th>
                                            <th className="py-2.5 px-3 text-left">Kategori</th>
                                            <th className="py-2.5 px-3 text-left">Keterangan</th>
                                            <th className="py-2.5 px-3 text-right">Nilai Bulanan</th>
                                            <th className="py-2.5 px-3 text-right">Total Kontrak</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(drilldown.manualDirectCostItems && drilldown.manualDirectCostItems.length > 0) ? (
                                            drilldown.manualDirectCostItems.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.name}</td>
                                                    <td className="py-2.5 px-3">
                                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-medium text-[11px]">
                                                            {item.category.replace(/_/g, " ")}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{item.description || "-"}</td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                                                        {formatRp(item.monthlyAmount)}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                                        {formatRp(item.totalContractValue)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="text-center py-6 text-slate-400 italic">
                                                    Tidak ada biaya pokok langsung manual yang dialokasikan pada periode ini. Anda dapat menambahkannya di menu Kontrak & Biaya Operasional dengan memilih klasifikasi "Biaya Pokok Langsung".
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </>
            )}
        </div>
    )
}
