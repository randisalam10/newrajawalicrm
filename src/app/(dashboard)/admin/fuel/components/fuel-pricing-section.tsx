"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface FuelPricingSectionProps {
    liters: string
    onLitersChange: (val: string) => void
    costPerLiter: string
    onCostPerLiterChange: (val: string) => void
    totalCost: string
    onTotalCostChange: (val: string) => void
}

export function FuelPricingSection({
    liters,
    onLitersChange,
    costPerLiter,
    onCostPerLiterChange,
    totalCost,
    onTotalCostChange,
}: FuelPricingSectionProps) {
    const formatRp = (val: number | string) => {
        const n = typeof val === "string" ? parseFloat(val) : val
        if (isNaN(n) || n <= 0) return "Rp 0"
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(n)
    }

    const calculatedTotal = liters && costPerLiter ? Math.round(Number(liters) * Number(costPerLiter)) : 0
    const displayTotal = totalCost ? Number(totalCost) : calculatedTotal

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-3">
            {/* Indikator Sumber Non-RBL (Compact) */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Sumber BBM: Non-RBL
                    </span>
                    <span className="text-[11px] text-slate-400">
                        (Tangki Duduk BP / Vendor / PO Pusat)
                    </span>
                </div>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-sky-300 text-sky-700 bg-sky-50 dark:bg-sky-950/40">
                    Bebas Kas RBL
                </Badge>
            </div>

            {/* Grid 2 Kolom: Volume Solar & Harga Satuan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Volume Solar (Liter) *
                    </Label>
                    <div className="relative">
                        <Input
                            type="number"
                            step="0.5"
                            inputMode="decimal"
                            placeholder="Contoh: 80"
                            value={liters}
                            onChange={(e) => onLitersChange(e.target.value)}
                            className="h-9 text-xs font-bold text-amber-700 dark:text-amber-400 font-mono pr-14 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                            Liter
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Harga per Liter (Rp)
                        </Label>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-medium">
                            {costPerLiter ? "Tersimpan di Cache" : "Input Manual"}
                        </span>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-semibold text-xs">
                            Rp
                        </div>
                        <Input
                            type="number"
                            step="100"
                            inputMode="numeric"
                            placeholder="Contoh: 13500"
                            value={costPerLiter}
                            onChange={(e) => onCostPerLiterChange(e.target.value)}
                            className="h-9 text-xs pl-9 font-mono font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                </div>
            </div>

            {/* Total Biaya Card */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2.5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Total Nilai Biaya BBM (Rp)
                        </div>
                        <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                            {formatRp(displayTotal)}
                        </div>
                        {liters && costPerLiter ? (
                            <div className="text-[10px] text-slate-400">
                                {liters} Liter &times; {formatRp(costPerLiter)}/Liter
                            </div>
                        ) : null}
                    </div>

                    <div className="sm:text-right">
                        <span className="text-[10px] text-sky-700 dark:text-sky-400 font-medium bg-sky-50 dark:bg-sky-950/50 px-2 py-1 rounded border border-sky-200 dark:border-sky-900 inline-block">
                            Tidak Memotong Saldo Kas RBL
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                            Dicatat untuk kalkulasi HPP & efisiensi BBM unit
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
