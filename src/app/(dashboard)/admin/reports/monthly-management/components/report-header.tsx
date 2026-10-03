"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Printer } from "lucide-react"

interface ReportHeaderProps {
    selectedPeriodLabel: string
    onPrint: () => void
}

export function ReportHeader({ selectedPeriodLabel, onPrint }: ReportHeaderProps) {
    return (
        <div className="print:hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl text-white shadow-lg border border-slate-700/50">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold px-2.5 py-0.5 border-none shadow-sm flex items-center gap-1.5 text-xs">
                                <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                                SUPER ADMIN EXCLUSIVE
                            </Badge>
                            <span className="text-xs text-slate-400">Blueprint Standar v2.4.8</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                            Laporan Bulanan Manajemen
                        </h1>
                        <p className="text-slate-300 text-xs md:text-sm max-w-xl">
                            Integrasi Teknik & Finansial: Produksi, Bahan Baku, Armada & BBM, Kas RBL, serta Billing & Piutang.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                            onClick={onPrint}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm gap-2 text-xs font-semibold px-4 py-2 cursor-pointer"
                        >
                            <Printer className="w-4 h-4 text-blue-300" />
                            Cetak Laporan / PDF
                        </Button>
                    </div>
                </div>
        </div>
    )
}

