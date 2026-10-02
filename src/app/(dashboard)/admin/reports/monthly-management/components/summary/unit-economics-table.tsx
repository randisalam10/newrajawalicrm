"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatRp } from "../formatters"
import { UnitEconomicsData } from "../../types"

interface UnitEconomicsTableProps {
    unitEconomics: UnitEconomicsData
}

function getCostEfficiencyStatus(actual: number, target: number) {
    if (!target || target <= 0) {
        return { label: "Input Riil", color: "text-slate-600" }
    }
    const diff = actual - target
    const pct = Math.round((diff / target) * 100)

    if (diff <= 0) {
        return {
            label: pct === 0 ? "On Target" : `Efisien (Hemat ${Math.abs(pct)}%)`,
            color: "text-emerald-700 font-semibold"
        }
    } else if (pct <= 10) {
        return {
            label: `Toleransi (+${pct}%)`,
            color: "text-amber-700 font-semibold"
        }
    } else {
        return {
            label: `Over Budget (+${pct}%)`,
            color: "text-rose-700 font-bold"
        }
    }
}

function getRevenueEfficiencyStatus(actual: number, target: number) {
    if (!target || target <= 0) {
        return { label: "Harga Pasar", color: "text-blue-700" }
    }
    const diff = actual - target
    const pct = Math.round((diff / target) * 100)

    if (diff >= 0) {
        return {
            label: pct === 0 ? "On Target" : `Di Atas Target (+${pct}%)`,
            color: "text-blue-700 font-semibold"
        }
    } else {
        return {
            label: `Di Bawah Target (${pct}%)`,
            color: "text-amber-700 font-semibold"
        }
    }
}

function getProfitEfficiencyStatus(actual: number, target: number) {
    if (actual <= 0) {
        return { label: "Rugi Operasional", color: "text-rose-700 font-bold" }
    }
    if (!target || target <= 0) {
        return { label: "Margin Positif", color: "text-emerald-700 font-semibold" }
    }
    const diff = actual - target
    const pct = Math.round((diff / target) * 100)

    if (actual >= target) {
        return {
            label: "Target Tercapai (Sehat)",
            color: "text-emerald-700 font-bold"
        }
    } else if (actual >= target * 0.7) {
        return {
            label: `Margin Cukup (${pct}%)`,
            color: "text-amber-700 font-semibold"
        }
    } else {
        return {
            label: `Di Bawah Target (${pct}%)`,
            color: "text-rose-700 font-semibold"
        }
    }
}

export const UnitEconomicsTable: React.FC<UnitEconomicsTableProps> = ({ unitEconomics }) => {
    const targets = unitEconomics.targets || {
        asp: 835000,
        semen: 300000,
        pasir: 95000,
        split: 75000,
        solar: 60000,
        retase: 70000,
        maintenance: 30000,
        other: 0,
        cogs: 640000,
        grossProfit: 195000,
        labelAsp: "Harga Jual Pasar",
        labelSemen: "Standar SNI",
        labelPasir: "On Target",
        labelSplit: "Efisiensi Crushing Quarry",
        labelSolar: "Tergantung radius jobsite",
        labelRetase: "On Target Sesuai KM",
        labelMaintenance: "Maintenance Rutin",
        labelOther: "Input Manual COGS",
        labelCogs: "Biaya Standar Operasional",
        labelGrossProfit: "Margin Bersih Sehat",
    }

    const aspStatus = getRevenueEfficiencyStatus(unitEconomics.aspPerM3, targets.asp)
    const semenStatus = getCostEfficiencyStatus(unitEconomics.semenPerM3, targets.semen)
    const pasirStatus = getCostEfficiencyStatus(unitEconomics.pasirPerM3, targets.pasir)
    const splitStatus = getCostEfficiencyStatus(unitEconomics.splitPerM3, targets.split)
    const solarStatus = getCostEfficiencyStatus(unitEconomics.solarPerM3, targets.solar)
    const retaseStatus = getCostEfficiencyStatus(unitEconomics.retasePerM3, targets.retase)
    const maintenanceStatus = getCostEfficiencyStatus(unitEconomics.maintenancePerM3, targets.maintenance)
    const cogsStatus = getCostEfficiencyStatus(unitEconomics.cogsPerM3, targets.cogs)
    const grossProfitStatus = getProfitEfficiencyStatus(unitEconomics.grossProfitPerM3, targets.grossProfit)

    return (
        <Card className="border border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="py-3 px-4 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                    1.3 Unit Economics (Analisis Finansial per 1 m³ Beton)
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500">
                    Harga jual rata-rata (ASP), komponen biaya langsung, dan kontribusi margin per meter kubik
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                        <tr>
                            <th className="py-2 px-4 text-left">Komponen Finansial</th>
                            <th className="py-2 px-4 text-right">Nilai Riil / m³</th>
                            <th className="py-2 px-4 text-right">Standard / Target</th>
                            <th className="py-2 px-4 text-right">Porsi Biaya</th>
                            <th className="py-2 px-4 text-left">Status Efisiensi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr className="bg-blue-50/40 font-semibold">
                            <td className="py-2.5 px-4 text-blue-900">Harga Jual Rata-rata (ASP / m³) DPP</td>
                            <td className="py-2.5 px-4 text-right font-bold text-blue-700">{formatRp(unitEconomics.aspPerM3)}</td>
                            <td className="py-2.5 px-4 text-right text-slate-700 font-mono font-medium">{formatRp(targets.asp)}</td>
                            <td className="py-2.5 px-4 text-right">—</td>
                            <td className={`py-2.5 px-4 ${aspStatus.color}`}>{aspStatus.label}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4 pl-8 text-slate-700">1. Semen Curah &amp; Zak</td>
                            <td className="py-2 px-4 text-right font-medium">{formatRp(unitEconomics.semenPerM3)}</td>
                            <td className="py-2 px-4 text-right text-slate-600 font-mono">{formatRp(targets.semen)}</td>
                            <td className="py-2 px-4 text-right">
                                {unitEconomics.cogsPerM3 > 0 ? ((unitEconomics.semenPerM3 / unitEconomics.cogsPerM3) * 100).toFixed(1) : 0}%
                            </td>
                            <td className={`py-2 px-4 ${semenStatus.color}`}>{semenStatus.label}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4 pl-8 text-slate-700">2. Pasir Cor</td>
                            <td className="py-2 px-4 text-right font-medium">{formatRp(unitEconomics.pasirPerM3)}</td>
                            <td className="py-2 px-4 text-right text-slate-600 font-mono">{formatRp(targets.pasir)}</td>
                            <td className="py-2 px-4 text-right">
                                {unitEconomics.cogsPerM3 > 0 ? ((unitEconomics.pasirPerM3 / unitEconomics.cogsPerM3) * 100).toFixed(1) : 0}%
                            </td>
                            <td className={`py-2 px-4 ${pasirStatus.color}`}>{pasirStatus.label}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4 pl-8 text-slate-700">3. Batu Split (1/2 &amp; 2/3)</td>
                            <td className="py-2 px-4 text-right font-medium">{formatRp(unitEconomics.splitPerM3)}</td>
                            <td className="py-2 px-4 text-right text-slate-600 font-mono">{formatRp(targets.split)}</td>
                            <td className="py-2 px-4 text-right">
                                {unitEconomics.cogsPerM3 > 0 ? ((unitEconomics.splitPerM3 / unitEconomics.cogsPerM3) * 100).toFixed(1) : 0}%
                            </td>
                            <td className={`py-2 px-4 ${splitStatus.color}`}>{splitStatus.label}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4 pl-8 text-slate-700">4. Bahan Bakar Solar Armada</td>
                            <td className="py-2 px-4 text-right font-medium">{formatRp(unitEconomics.solarPerM3)}</td>
                            <td className="py-2 px-4 text-right text-slate-600 font-mono">{formatRp(targets.solar)}</td>
                            <td className="py-2 px-4 text-right">
                                {unitEconomics.cogsPerM3 > 0 ? ((unitEconomics.solarPerM3 / unitEconomics.cogsPerM3) * 100).toFixed(1) : 0}%
                            </td>
                            <td className={`py-2 px-4 ${solarStatus.color}`}>{solarStatus.label}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4 pl-8 text-slate-700">5. Retase Supir Truk Mixer</td>
                            <td className="py-2 px-4 text-right font-medium">{formatRp(unitEconomics.retasePerM3)}</td>
                            <td className="py-2 px-4 text-right text-slate-600 font-mono">{formatRp(targets.retase)}</td>
                            <td className="py-2 px-4 text-right">
                                {unitEconomics.cogsPerM3 > 0 ? ((unitEconomics.retasePerM3 / unitEconomics.cogsPerM3) * 100).toFixed(1) : 0}%
                            </td>
                            <td className={`py-2 px-4 ${retaseStatus.color}`}>{retaseStatus.label}</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-4 pl-8 text-slate-700">6. Suku Cadang &amp; Bengkel PO</td>
                            <td className="py-2 px-4 text-right font-medium">{formatRp(unitEconomics.maintenancePerM3)}</td>
                            <td className="py-2 px-4 text-right text-slate-600 font-mono">{formatRp(targets.maintenance)}</td>
                            <td className="py-2 px-4 text-right">
                                {unitEconomics.cogsPerM3 > 0 ? ((unitEconomics.maintenancePerM3 / unitEconomics.cogsPerM3) * 100).toFixed(1) : 0}%
                            </td>
                            <td className={`py-2 px-4 ${maintenanceStatus.color}`}>{maintenanceStatus.label}</td>
                        </tr>
                        {((unitEconomics.manualDirectPerM3 ?? 0) > 0 || (targets.other ?? 0) > 0) && (
                            <tr>
                                <td className="py-2 px-4 pl-8 text-slate-700">7. Biaya Pokok Langsung Lainnya (Manual)</td>
                                <td className="py-2 px-4 text-right font-medium text-rose-600">{formatRp(unitEconomics.manualDirectPerM3 ?? 0)}</td>
                                <td className="py-2 px-4 text-right text-slate-600 font-mono">
                                    {(targets.other ?? 0) > 0 ? formatRp(targets.other) : "—"}
                                </td>
                                <td className="py-2 px-4 text-right font-mono">
                                    {unitEconomics.cogsPerM3 > 0 ? (((unitEconomics.manualDirectPerM3 ?? 0) / unitEconomics.cogsPerM3) * 100).toFixed(1) : 0}%
                                </td>
                                <td className="py-2 px-4 text-slate-600">Input Manual COGS</td>
                            </tr>
                        )}
                        <tr className="bg-slate-100 font-bold">
                            <td className="py-2.5 px-4 text-slate-900">Total Biaya Langsung (COGS / m³)</td>
                            <td className="py-2.5 px-4 text-right text-red-700">{formatRp(unitEconomics.cogsPerM3)}</td>
                            <td className="py-2.5 px-4 text-right text-slate-700 font-mono font-bold">{formatRp(targets.cogs)}</td>
                            <td className="py-2.5 px-4 text-right">100,0%</td>
                            <td className={`py-2.5 px-4 ${cogsStatus.color}`}>{cogsStatus.label}</td>
                        </tr>
                        <tr className="bg-emerald-50/60 font-bold border-t-2 border-emerald-200">
                            <td className="py-2.5 px-4 text-emerald-900">Gross Profit per 1 m³</td>
                            <td className="py-2.5 px-4 text-right text-emerald-700">{formatRp(unitEconomics.grossProfitPerM3)}</td>
                            <td className="py-2.5 px-4 text-right text-emerald-800 font-mono font-bold">{formatRp(targets.grossProfit)}</td>
                            <td className="py-2.5 px-4 text-right">—</td>
                            <td className={`py-2.5 px-4 ${grossProfitStatus.color}`}>{grossProfitStatus.label}</td>
                        </tr>
                    </tbody>
                </table>
            </CardContent>
        </Card>
    )
}

