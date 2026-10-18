"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CrusherOperatorRetaseSummary } from "../types"
import { CheckCircle2, HardHat, ArrowRight } from "lucide-react"

type Props = {
    summaries: CrusherOperatorRetaseSummary[]
    onSelectOperator: (operatorName: string) => void
    onMarkOperatorPaid?: (operatorId: string | null, operatorName: string) => void
}

function formatRp(num: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(num || 0)
}

function formatNum(num: number, decimals = 1): string {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(num || 0)
}

export function OperatorSummaryTable({ summaries, onSelectOperator, onMarkOperatorPaid }: Props) {
    if (summaries.length === 0) {
        return (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                Belum ada data produksi material keluar stone crusher pada periode yang dipilih.
            </div>
        )
    }

    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HardHat className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Rekap Insentif Operator Stone Crusher ({summaries.length} Orang)
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                        <TableRow className="text-xs">
                            <TableHead className="font-semibold text-slate-700">Nama Operator</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">Total Transaksi</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Total Volume (m³)</TableHead>
                            <TableHead className="text-right font-semibold text-amber-700">Belum Dibayar</TableHead>
                            <TableHead className="text-right font-semibold text-emerald-700">Sudah Lunas</TableHead>
                            <TableHead className="text-right font-semibold text-slate-900">Total Insentif (Rp 5.000/m³)</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                        {summaries.map((s, idx) => {
                            const isAllPaid = s.unpaidCount === 0 && s.totalOperatorFee > 0
                            return (
                                <TableRow key={idx} className="hover:bg-slate-50/70 transition-colors">
                                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                        <div className="flex items-center gap-1.5">
                                            <span>{s.operatorName}</span>
                                            {isAllPaid && (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] h-4 px-1">
                                                    Lunas
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {s.totalTransactions} Pengiriman
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatNum(s.totalVolumeM3, 1)} m³
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-amber-700 dark:text-amber-400">
                                        {s.totalUnpaidAmount > 0 ? formatRp(s.totalUnpaidAmount) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-emerald-700 dark:text-emerald-400">
                                        {s.totalPaidAmount > 0 ? formatRp(s.totalPaidAmount) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                                        {formatRp(s.totalOperatorFee)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onSelectOperator(s.operatorName)}
                                                className="h-7 px-2 text-[11px] gap-1"
                                            >
                                                <span>Detail</span>
                                                <ArrowRight className="h-3 w-3" />
                                            </Button>
                                            {onMarkOperatorPaid && s.unpaidCount > 0 && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => onMarkOperatorPaid(s.operatorId, s.operatorName)}
                                                    className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                                >
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    <span>Bayar</span>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
