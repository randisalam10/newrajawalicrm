"use client"

import React from "react"
import { MonthlyManagementReportResult } from "../../../types"

interface SectionBDirectCostProps {
    data: MonthlyManagementReportResult
}

function formatRp(val: number): string {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}

export function SectionBDirectCost({ data }: SectionBDirectCostProps) {
    const sc = data.scorecard || ({} as any)

    const vol = sc.productionVolumeM3 || 0
    const totalDpp = sc.totalDppRevenue || sc.totalGrossRevenue || 0
    const totalCost = sc.totalDirectCost || 0
    const actCogs = vol > 0 ? totalCost / vol : 0

    const semenCost = sc.semenCost || 0
    const pasirCost = sc.pasirCost || 0
    const split12Cost = sc.split12Cost || (sc.splitCost ? sc.splitCost * 0.5 : 0)
    const split23Cost = sc.split23Cost || (sc.splitCost ? sc.splitCost * 0.35 : 0)
    const cipingCost = sc.ciping05Cost || (sc.splitCost ? sc.splitCost * 0.15 : 0)
    const totalMaterialCost = sc.materialCost || (semenCost + pasirCost + split12Cost + split23Cost + cipingCost)

    const fuelCost = sc.fuelCost || 0
    const maintPoCost = sc.maintenancePoCost || (sc.maintenanceCost ? sc.maintenanceCost * 0.65 : 0)
    const maintRblCost = sc.maintenanceRblCost || (sc.maintenanceCost ? sc.maintenanceCost * 0.35 : 0)
    const totalBranchOpsCost = fuelCost + maintPoCost + maintRblCost

    const retaseCost = sc.retaseCost || 0
    const manualDirectCost = sc.manualDirectCost || 0

    return (
        <div className="border border-slate-200 rounded bg-white overflow-hidden text-[9px] print-avoid-break">
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex justify-between items-center">
                <span className="font-extrabold text-slate-900 uppercase tracking-wide text-[9.5px]">
                    B. Direct Cost (Biaya Pokok Produksi Langsung)
                </span>
                <div className="flex items-center gap-3 text-[9px]">
                    <span>Total: <strong className="text-slate-900">{formatRp(totalCost)}</strong></span>
                    <span>•</span>
                    <span>Biaya per m³: <strong className="text-slate-900">{formatRp(actCogs)}/m³</strong></span>
                    <span>•</span>
                    <span>Rasio Beban: <strong className="text-slate-900">{totalDpp > 0 ? ((totalCost / totalDpp) * 100).toFixed(2) : 0}%</strong></span>
                </div>
            </div>

            <table className="w-full text-left">
                <thead className="bg-slate-50/70 border-b border-slate-200 font-semibold text-slate-600 text-[8.5px]">
                    <tr>
                        <th className="py-1 px-2.5">Cost Category</th>
                        <th className="py-1 px-2">Description &amp; Detail Komponen</th>
                        <th className="py-1 px-2 text-right">Biaya / m³</th>
                        <th className="py-1 px-2 text-right">Amount (Rp)</th>
                        <th className="py-1 px-2 text-right">% Biaya</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {/* 1. Raw Material Subtotal Header */}
                    <tr className="bg-slate-50/40 font-semibold text-slate-900">
                        <td className="py-0.5 px-2.5">Raw Material</td>
                        <td className="py-0.5 px-2 text-slate-600">Semen, Pasir, Split &amp; Ciping (Resep Konsumsi Batching)</td>
                        <td className="py-0.5 px-2 text-right font-mono">{formatRp(vol > 0 ? totalMaterialCost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right font-bold text-slate-900 font-mono">{formatRp(totalMaterialCost)}</td>
                        <td className="py-0.5 px-2 text-right font-medium">
                            {totalCost > 0 ? ((totalMaterialCost / totalCost) * 100).toFixed(1) : 0}%
                        </td>
                    </tr>
                    {/* Indented Material Items */}
                    <tr className="text-slate-700">
                        <td className="py-0.5 pl-6 pr-2 text-slate-500 font-mono text-[8px]">↳ Semen Portland</td>
                        <td className="py-0.5 px-2 text-slate-500">PO Semen Batching Plant &amp; Silo Utama</td>
                        <td className="py-0.5 px-2 text-right text-slate-500 font-mono">{formatRp(vol > 0 ? semenCost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-700 font-mono">{formatRp(semenCost)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-400">{totalCost > 0 ? ((semenCost / totalCost) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr className="text-slate-700">
                        <td className="py-0.5 pl-6 pr-2 text-slate-500 font-mono text-[8px]">↳ Pasir Cor Pasang</td>
                        <td className="py-0.5 px-2 text-slate-500">Agregat Halus Quarry Lokal (BJ 1.400 kg/m³)</td>
                        <td className="py-0.5 px-2 text-right text-slate-500 font-mono">{formatRp(vol > 0 ? pasirCost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-700 font-mono">{formatRp(pasirCost)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-400">{totalCost > 0 ? ((pasirCost / totalCost) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr className="text-slate-700">
                        <td className="py-0.5 pl-6 pr-2 text-slate-500 font-mono text-[8px]">↳ Batu Split 1-2 (B12)</td>
                        <td className="py-0.5 px-2 text-slate-500">Agregat Kasar 10-20 mm (BJ 1.450 kg/m³)</td>
                        <td className="py-0.5 px-2 text-right text-slate-500 font-mono">{formatRp(vol > 0 ? split12Cost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-700 font-mono">{formatRp(split12Cost)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-400">{totalCost > 0 ? ((split12Cost / totalCost) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr className="text-slate-700">
                        <td className="py-0.5 pl-6 pr-2 text-slate-500 font-mono text-[8px]">↳ Batu Split 2-3 (B23)</td>
                        <td className="py-0.5 px-2 text-slate-500">Agregat Kasar 20-30 mm (BJ 1.450 kg/m³)</td>
                        <td className="py-0.5 px-2 text-right text-slate-500 font-mono">{formatRp(vol > 0 ? split23Cost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-700 font-mono">{formatRp(split23Cost)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-400">{totalCost > 0 ? ((split23Cost / totalCost) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr className="text-slate-700">
                        <td className="py-0.5 pl-6 pr-2 text-slate-500 font-mono text-[8px]">↳ Ciping 0-5</td>
                        <td className="py-0.5 px-2 text-slate-500">Batu Abu Screening Quarry (BJ 1.400 kg/m³)</td>
                        <td className="py-0.5 px-2 text-right text-slate-500 font-mono">{formatRp(vol > 0 ? cipingCost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-700 font-mono">{formatRp(cipingCost)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-400">{totalCost > 0 ? ((cipingCost / totalCost) * 100).toFixed(1) : 0}%</td>
                    </tr>

                    {/* 2. Branch Operation & Equipment Header */}
                    <tr className="bg-slate-50/40 font-semibold text-slate-900">
                        <td className="py-0.5 px-2.5">Branch Operation</td>
                        <td className="py-0.5 px-2 text-slate-600">BBM Solar Armada &amp; Pemeliharaan Rutin / Suku Cadang</td>
                        <td className="py-0.5 px-2 text-right font-mono">{formatRp(vol > 0 ? totalBranchOpsCost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right font-bold text-slate-900 font-mono">{formatRp(totalBranchOpsCost)}</td>
                        <td className="py-0.5 px-2 text-right font-medium">
                            {totalCost > 0 ? ((totalBranchOpsCost / totalCost) * 100).toFixed(1) : 0}%
                        </td>
                    </tr>
                    {/* Indented Operation Items */}
                    <tr className="text-slate-700">
                        <td className="py-0.5 pl-6 pr-2 text-slate-500 font-mono text-[8px]">↳ Kas Solar BBM Armada</td>
                        <td className="py-0.5 px-2 text-slate-500">BBM Solar Truk Mixer &amp; Dump Truck (Realisasi Kas RBL)</td>
                        <td className="py-0.5 px-2 text-right text-slate-500 font-mono">{formatRp(vol > 0 ? fuelCost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-700 font-mono">{formatRp(fuelCost)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-400">{totalCost > 0 ? ((fuelCost / totalCost) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr className="text-slate-700">
                        <td className="py-0.5 pl-6 pr-2 text-slate-500 font-mono text-[8px]">↳ Sparepart Plant &amp; Mixer (PO)</td>
                        <td className="py-0.5 px-2 text-slate-500">Pengadaan Suku Cadang via PO Resmi Batching Plant</td>
                        <td className="py-0.5 px-2 text-right text-slate-500 font-mono">{formatRp(vol > 0 ? maintPoCost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-700 font-mono">{formatRp(maintPoCost)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-400">{totalCost > 0 ? ((maintPoCost / totalCost) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr className="text-slate-700">
                        <td className="py-0.5 pl-6 pr-2 text-slate-500 font-mono text-[8px]">↳ Bengkel Lapangan (RBL)</td>
                        <td className="py-0.5 px-2 text-slate-500">Perbaikan Cepat &amp; Servis Darurat Bengkel Kas Cabang</td>
                        <td className="py-0.5 px-2 text-right text-slate-500 font-mono">{formatRp(vol > 0 ? maintRblCost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-700 font-mono">{formatRp(maintRblCost)}</td>
                        <td className="py-0.5 px-2 text-right text-slate-400">{totalCost > 0 ? ((maintRblCost / totalCost) * 100).toFixed(1) : 0}%</td>
                    </tr>

                    {/* 3. Retase Pengemudi */}
                    <tr className="font-semibold text-slate-900">
                        <td className="py-0.5 px-2.5">Retase Supir</td>
                        <td className="py-0.5 px-2 text-slate-600 font-normal">Upah Ritase Supir Mixer &amp; Dump Truck (Operasional Cor)</td>
                        <td className="py-0.5 px-2 text-right font-mono">{formatRp(vol > 0 ? retaseCost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right font-bold text-slate-900 font-mono">{formatRp(retaseCost)}</td>
                        <td className="py-0.5 px-2 text-right font-medium">
                            {totalCost > 0 ? ((retaseCost / totalCost) * 100).toFixed(1) : 0}%
                        </td>
                    </tr>

                    {/* 4. Manual / Other Direct Cost */}
                    <tr className="font-semibold text-slate-900">
                        <td className="py-0.5 px-2.5">Manual / Other Cost</td>
                        <td className="py-0.5 px-2 text-slate-600 font-normal">Biaya Pokok Langsung Khusus Lapangan (Input Manual Terverifikasi)</td>
                        <td className="py-0.5 px-2 text-right font-mono">{formatRp(vol > 0 ? manualDirectCost / vol : 0)}</td>
                        <td className="py-0.5 px-2 text-right font-bold text-slate-900 font-mono">{formatRp(manualDirectCost)}</td>
                        <td className="py-0.5 px-2 text-right font-medium">
                            {totalCost > 0 ? ((manualDirectCost / totalCost) * 100).toFixed(1) : 0}%
                        </td>
                    </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900 text-[9px]">
                    <tr>
                        <td colSpan={2} className="py-1 px-2.5 uppercase">Total Direct Cost (HPP):</td>
                        <td className="py-1 px-2 text-right text-slate-900 font-mono">{formatRp(actCogs)}/m³</td>
                        <td className="py-1 px-2 text-right text-slate-950 font-mono">{formatRp(totalCost)}</td>
                        <td className="py-1 px-2 text-right">100.0%</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    )
}
