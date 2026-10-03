"use client"

import React from "react"
import { MonthlyManagementReportResult } from "../../../types"

interface SectionDOpexProps {
    data: MonthlyManagementReportResult
}

function formatRp(val: number): string {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}

export function SectionDOpex({ data }: SectionDOpexProps) {
    const sc = data.scorecard || ({} as any)
    const drilldown = data.drilldown || ({} as any)

    const rblOpex = sc.rblOpex || 0
    const totalAmort = sc.totalAmortizationMonthly || ((sc.sewaTanahMonthly || 0) + (sc.sewaMessMonthly || 0) + (sc.totalVehicleComplianceMonthly || 0) + (sc.perizinanMonthly || 0)) || 0

    // Opex D1 categories
    const rblCategories = drilldown.rblOpexDetail?.categories || []

    // Amortization D2 details
    const sewaTanah = sc.sewaTanahMonthly || 0
    const sewaMess = sc.sewaMessMonthly || 0
    const pajakStnk = sc.vehicleTaxMonthly || 0
    const ujiKir = sc.vehicleKirMonthly || 0
    const perizinan = (sc.perizinanMonthly || 0) + (sc.asuransiRetribusiMonthly || 0)

    return (
        <div className="space-y-1.5 print-avoid-break">
            <div className="grid grid-cols-2 gap-2 text-[9px]">
                {/* D1. Branch Operating Expense */}
                <div className="border border-slate-200 rounded bg-white overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="bg-slate-50 border-b border-slate-200 px-2.5 py-1.5 flex justify-between items-center">
                            <span className="font-extrabold text-slate-900 uppercase tracking-wide text-[9px]">
                                D1. Branch Operating Expense
                            </span>
                            <span className="font-bold text-slate-900 font-mono text-[9px]">{formatRp(rblOpex)}</span>
                        </div>

                        <table className="w-full text-left">
                            <thead className="bg-slate-50/70 border-b border-slate-100 font-semibold text-slate-600 text-[8px]">
                                <tr>
                                    <th className="py-0.5 px-2">Expense Category</th>
                                    <th className="py-0.5 px-1.5 text-center">Trx</th>
                                    <th className="py-0.5 px-2 text-right">Amount (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rblCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-2 text-center text-slate-400 italic">
                                            Tidak ada rincian beban operasional cabang.
                                        </td>
                                    </tr>
                                ) : (
                                    rblCategories.slice(0, 4).map((c: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="py-0.5 px-2 text-slate-800">{c.name}</td>
                                            <td className="py-0.5 px-1.5 text-center text-slate-500 font-mono text-[8px]">{c.count || 1}</td>
                                            <td className="py-0.5 px-2 text-right font-medium text-slate-900 font-mono">{formatRp(c.total || 0)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-50 border-t border-slate-200 px-2.5 py-1 flex justify-between font-bold text-slate-900 text-[8.5px]">
                        <span>Subtotal D1 (RBL Opex Murni):</span>
                        <span className="font-mono">{formatRp(rblOpex)}</span>
                    </div>
                </div>

                {/* D2. Amortization & Compliance */}
                <div className="border border-slate-200 rounded bg-white overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="bg-slate-50 border-b border-slate-200 px-2.5 py-1.5 flex justify-between items-center">
                            <span className="font-extrabold text-slate-900 uppercase tracking-wide text-[9px]">
                                D2. Amortization &amp; Compliance
                            </span>
                            <span className="font-bold text-slate-900 font-mono text-[9px]">{formatRp(totalAmort)}</span>
                        </div>

                        <table className="w-full text-left">
                            <thead className="bg-slate-50/70 border-b border-slate-100 font-semibold text-slate-600 text-[8px]">
                                <tr>
                                    <th className="py-0.5 px-2">Komponen Amortisasi</th>
                                    <th className="py-0.5 px-2 text-slate-500">Dasar Alokasi</th>
                                    <th className="py-0.5 px-2 text-right">Beban/Bulan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-0.5 px-2 text-slate-800">Sewa Lahan &amp; Fasilitas Plant</td>
                                    <td className="py-0.5 px-2 text-slate-500 text-[8px]">Prorata Kontrak Tahunan</td>
                                    <td className="py-0.5 px-2 text-right font-medium text-slate-900 font-mono">{formatRp(sewaTanah)}</td>
                                </tr>
                                <tr>
                                    <td className="py-0.5 px-2 text-slate-800">Sewa Mess Karyawan Lapangan</td>
                                    <td className="py-0.5 px-2 text-slate-500 text-[8px]">Akomodasi Kru Batching</td>
                                    <td className="py-0.5 px-2 text-right font-medium text-slate-900 font-mono">{formatRp(sewaMess)}</td>
                                </tr>
                                <tr>
                                    <td className="py-0.5 px-2 text-slate-800">Pajak STNK &amp; KIR Armada</td>
                                    <td className="py-0.5 px-2 text-slate-500 text-[8px]">Kepatuhan Truk Mixer &amp; DT</td>
                                    <td className="py-0.5 px-2 text-right font-medium text-slate-900 font-mono">{formatRp(pajakStnk + ujiKir)}</td>
                                </tr>
                                <tr>
                                    <td className="py-0.5 px-2 text-slate-800">Perizinan AMDAL &amp; Lingkungan</td>
                                    <td className="py-0.5 px-2 text-slate-500 text-[8px]">Legalitas Operasi Plant</td>
                                    <td className="py-0.5 px-2 text-right font-medium text-slate-900 font-mono">{formatRp(perizinan)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-50 border-t border-slate-200 px-2.5 py-1 flex justify-between font-bold text-slate-900 text-[8.5px]">
                        <span>Subtotal D2 (Amortisasi &amp; Kepatuhan):</span>
                        <span className="font-mono">{formatRp(totalAmort)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-slate-100/80 rounded px-2.5 py-1 flex justify-between items-center text-[8.5px] font-bold text-slate-800 border border-slate-200">
                <span>Total Beban Operasional Cabang &amp; Amortisasi (D1 + D2):</span>
                <span className="font-mono text-slate-900">{formatRp(rblOpex + totalAmort)}</span>
            </div>
        </div>
    )
}
