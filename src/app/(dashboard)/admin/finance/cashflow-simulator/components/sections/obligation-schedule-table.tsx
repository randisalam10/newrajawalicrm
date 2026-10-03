"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MonthlyObligationRow, SimulatorScenarioParams } from "../../types"
import { formatRupiah } from "../../utils/cashflow-math"
import { CalendarClock, PlusCircle } from "lucide-react"

interface ObligationScheduleTableProps {
    obligations: MonthlyObligationRow[]
    params: SimulatorScenarioParams
    onOpenDebtModal: () => void
}

export function ObligationScheduleTable({
    obligations,
    params,
    onOpenDebtModal
}: ObligationScheduleTableProps) {
    return (
        <Card className="border-slate-200 bg-white shadow-xs w-full">
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-bold text-slate-800">
                        Jadwal Beban &amp; Kewajiban Kas Bulanan (Monthly Obligation Schedule)
                    </CardTitle>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={onOpenDebtModal}
                >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Kelola Cicilan Pinjaman ({params.customDebts.length})
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 text-[11px] text-slate-600 font-semibold">
                                <TableHead className="py-2 px-3 font-semibold">Bulan</TableHead>
                                <TableHead className="py-2 px-3 text-right font-semibold">Payroll (Gaji)</TableHead>
                                <TableHead className="py-2 px-3 text-right font-semibold">Hutang AP Supplier</TableHead>
                                <TableHead className="py-2 px-3 text-right font-semibold">Kas Lapangan (RBL)</TableHead>
                                <TableHead className="py-2 px-3 text-right font-semibold">Sewa Lahan &amp; Izin</TableHead>
                                <TableHead className="py-2 px-3 text-right font-semibold">Cicilan Pinjaman</TableHead>
                                <TableHead className="py-2 px-3 text-right font-semibold">Pajak</TableHead>
                                <TableHead className="py-2 px-3 text-right font-bold text-slate-900 bg-slate-100/60">
                                    Total Kewajiban
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {obligations.slice(0, 6).map((row, idx) => (
                                <TableRow key={row.period} className={idx % 2 === 1 ? "bg-slate-50/30" : ""}>
                                    <TableCell className="py-2 px-3 font-medium text-slate-900">
                                        {row.monthLabel}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right text-slate-700">
                                        {formatRupiah(row.payroll)}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right text-rose-700 font-medium">
                                        {formatRupiah(row.supplierAp)}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right text-slate-700">
                                        {formatRupiah(row.operationalRbl)}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right text-slate-700">
                                        {formatRupiah(row.amortizationFixed)}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right text-slate-700">
                                        {formatRupiah(row.debt)}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right text-slate-700">
                                        {formatRupiah(row.tax)}
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right font-black text-slate-900 bg-slate-100/60">
                                        {formatRupiah(row.totalObligation)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
