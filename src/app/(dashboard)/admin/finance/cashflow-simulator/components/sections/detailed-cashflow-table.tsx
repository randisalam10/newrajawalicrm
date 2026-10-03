"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RollingForecastRow } from "../../types"
import { formatRupiah, formatNumber } from "../../utils/cashflow-math"
import { SplitSquareVertical } from "lucide-react"

interface DetailedCashflowTableProps {
    forecast: RollingForecastRow[]
}

export function DetailedCashflowTable({ forecast }: DetailedCashflowTableProps) {
    return (
        <Card className="border-slate-200 bg-white shadow-xs w-full">
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <SplitSquareVertical className="h-4 w-4 text-slate-700" />
                    <CardTitle className="text-sm font-bold text-slate-800">
                        Komparasi 12 Bulan: Perspektif Laba Akrual (P&amp;L) vs Arus Kas Riil (Cash Flow)
                    </CardTitle>
                </div>
                <div className="text-[11px] text-slate-500">
                    Akrual mengakui pendapatan beton terkirim • Arus kas mengakui dana nyata masuk/keluar
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-100/70 text-[11px] text-slate-700">
                                <TableHead className="py-2.5 px-3 font-semibold" rowSpan={2}>Bulan</TableHead>
                                <TableHead className="py-2.5 px-3 text-center font-bold bg-blue-50/50 text-blue-900 border-x border-slate-200" colSpan={4}>
                                    A. Perspektif Akrual &amp; Profitabilitas (P&amp;L)
                                </TableHead>
                                <TableHead className="py-2.5 px-3 text-center font-bold bg-emerald-50/50 text-emerald-900" colSpan={5}>
                                    B. Perspektif Arus Kas Riil (Cash Flow)
                                </TableHead>
                                <TableHead className="py-2.5 px-3 text-center font-semibold" rowSpan={2}>Status Buffer</TableHead>
                            </TableRow>
                            <TableRow className="bg-slate-50 text-[10px] text-slate-500 border-b border-slate-200">
                                {/* P&L columns */}
                                <TableHead className="py-1 px-2 text-right bg-blue-50/30">Volume</TableHead>
                                <TableHead className="py-1 px-2 text-right bg-blue-50/30">Revenue</TableHead>
                                <TableHead className="py-1 px-2 text-right bg-blue-50/30">Gross Profit</TableHead>
                                <TableHead className="py-1 px-2 text-right bg-blue-50/30 border-r border-slate-200 font-bold text-slate-800">Net Profit</TableHead>
                                {/* Cash columns */}
                                <TableHead className="py-1 px-2 text-right bg-emerald-50/30">Opening</TableHead>
                                <TableHead className="py-1 px-2 text-right bg-emerald-50/30 text-emerald-700">Inflow</TableHead>
                                <TableHead className="py-1 px-2 text-right bg-emerald-50/30 text-rose-700">Outflow</TableHead>
                                <TableHead className="py-1 px-2 text-right bg-emerald-50/30 font-semibold">Net Cash</TableHead>
                                <TableHead className="py-1 px-2 text-right bg-emerald-50/30 font-black text-slate-900">Ending Cash</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {forecast.map((row, idx) => (
                                <TableRow key={row.period} className={idx % 2 === 1 ? "bg-slate-50/20" : ""}>
                                    <TableCell className="py-2 px-3 font-semibold text-slate-900">
                                        {row.monthLabel}
                                    </TableCell>
                                    
                                    {/* P&L */}
                                    <TableCell className="py-2 px-2 text-right text-slate-600 bg-blue-50/10">
                                        {formatNumber(row.volume)} m³
                                    </TableCell>
                                    <TableCell className="py-2 px-2 text-right text-slate-700 bg-blue-50/10">
                                        {formatRupiah(row.revenue)}
                                    </TableCell>
                                    <TableCell className="py-2 px-2 text-right text-emerald-700 bg-blue-50/10 font-medium">
                                        {formatRupiah(row.grossProfit)}
                                    </TableCell>
                                    <TableCell className="py-2 px-2 text-right font-bold text-slate-900 bg-blue-50/20 border-r border-slate-200">
                                        {formatRupiah(row.netAccountingProfit)}
                                    </TableCell>

                                    {/* Cash */}
                                    <TableCell className="py-2 px-2 text-right text-slate-500 bg-emerald-50/10">
                                        {formatRupiah(row.openingCash)}
                                    </TableCell>
                                    <TableCell className="py-2 px-2 text-right text-emerald-700 font-semibold bg-emerald-50/10">
                                        {formatRupiah(row.cashInflow)}
                                    </TableCell>
                                    <TableCell className="py-2 px-2 text-right text-rose-700 font-semibold bg-emerald-50/10">
                                        {formatRupiah(row.cashOutflow)}
                                    </TableCell>
                                    <TableCell className={`py-2 px-2 text-right font-bold bg-emerald-50/10 ${row.netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                        {formatRupiah(row.netCashFlow)}
                                    </TableCell>
                                    <TableCell className={`py-2 px-2 text-right font-black bg-emerald-50/20 ${row.endingCash >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                                        {formatRupiah(row.endingCash)}
                                    </TableCell>

                                    {/* Buffer Status */}
                                    <TableCell className="py-2 px-3 text-center">
                                        {row.bufferStatus === "HEALTHY" && (
                                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Aman</Badge>
                                        )}
                                        {row.bufferStatus === "BUFFER_DEFICIT" && (
                                            <Badge className="bg-amber-100 text-amber-800 text-[10px]">Buffer Kurang</Badge>
                                        )}
                                        {row.bufferStatus === "CASH_DEFICIT" && (
                                            <Badge className="bg-rose-100 text-rose-800 text-[10px]">Defisit Kas</Badge>
                                        )}
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
