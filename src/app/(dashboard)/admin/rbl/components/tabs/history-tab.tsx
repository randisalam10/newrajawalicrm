"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Printer } from "lucide-react"
import { fmt, fmtShortDate, MONTH_NAMES } from "../../utils/rbl-helpers"

interface HistoryTabProps {
    filteredHistory: any[]
    historyTotalCount: number
    historySearch: string
    setHistorySearch: (q: string) => void
    historyStatusFilter: string
    setHistoryStatusFilter: (status: string) => void
    historyYearFilter: string
    setHistoryYearFilter: (year: string) => void
    historyAvailableYears: number[]
    onOpenDetail: (budgetId: string) => void
}

export function HistoryTab({
    filteredHistory,
    historyTotalCount,
    historySearch,
    setHistorySearch,
    historyStatusFilter,
    setHistoryStatusFilter,
    historyYearFilter,
    setHistoryYearFilter,
    historyAvailableYears,
    onOpenDetail,
}: HistoryTabProps) {
    return (
        <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base">Riwayat Periode RBL Cabang</CardTitle>
                        <CardDescription className="text-xs">
                            Arsip periode anggaran sebelumnya yang telah ditutup atau sedang berjalan.
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Cari kode / cabang / catatan..."
                                value={historySearch}
                                onChange={e => setHistorySearch(e.target.value)}
                                className="h-8 text-xs pl-8 w-44 md:w-56 bg-white"
                            />
                        </div>

                        <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                            <SelectTrigger className="h-8 text-xs w-32 bg-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                                <SelectItem value="OPEN" className="text-xs">OPEN (Aktif)</SelectItem>
                                <SelectItem value="CLOSED" className="text-xs">CLOSED (Tutup Buku)</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={historyYearFilter} onValueChange={setHistoryYearFilter}>
                            <SelectTrigger className="h-8 text-xs w-28 bg-white">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL" className="text-xs">Semua Tahun</SelectItem>
                                {historyAvailableYears.map(yr => (
                                    <SelectItem key={yr} value={String(yr)} className="text-xs">{yr}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="text-[11px]">
                            <TableHead>Kode RBL</TableHead>
                            <TableHead>Cabang</TableHead>
                            <TableHead>Periode</TableHead>
                            <TableHead className="w-24">Tgl Buka</TableHead>
                            <TableHead className="w-28">Tgl Terima Dana</TableHead>
                            <TableHead className="w-24">Tgl Tutup</TableHead>
                            <TableHead className="text-right">Budget HO</TableHead>
                            <TableHead className="text-right">Pengeluaran</TableHead>
                            <TableHead className="text-right">Sisa / Minus</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistory.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center text-xs text-slate-400 py-6">
                                    {historyTotalCount === 0 ? "Belum ada riwayat RBL." : "Tidak ada riwayat yang sesuai dengan filter pencarian."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredHistory.map(b => (
                                <TableRow key={b.id} className="text-xs hover:bg-slate-50/50">
                                    <TableCell className="font-mono font-bold text-slate-800">
                                        {b.code}
                                    </TableCell>
                                    <TableCell>{b.location?.name}</TableCell>
                                    <TableCell>
                                        {MONTH_NAMES[b.periodMonth - 1]} {b.periodYear}
                                    </TableCell>
                                    <TableCell className="font-mono text-slate-600 text-xs whitespace-nowrap">
                                        {fmtShortDate(b.createdAt)}
                                    </TableCell>
                                    <TableCell className="font-mono text-slate-800 font-medium text-xs whitespace-nowrap">
                                        {fmtShortDate(b.receivedDate)}
                                    </TableCell>
                                    <TableCell className="font-mono text-slate-600 text-xs whitespace-nowrap">
                                        {b.closedAt ? fmtShortDate(b.closedAt) : (
                                            <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                                                Aktif
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-semibold">
                                        {fmt(b.amount)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-slate-600">
                                        {fmt(b.totalExpense)}
                                    </TableCell>
                                    <TableCell className={`text-right font-mono font-bold ${
                                        b.remainingBalance > 0 ? "text-emerald-700" : b.remainingBalance < 0 ? "text-rose-700" : "text-slate-600"
                                    }`}>
                                        {b.remainingBalance >= 0 ? "+" : ""}{fmt(b.remainingBalance)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            className={b.status === "OPEN" ? "bg-emerald-600 text-white text-[10px]" : "bg-slate-200 text-slate-700 text-[10px]"}
                                        >
                                            {b.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onOpenDetail(b.id)}
                                                className="h-7 text-xs gap-1 text-slate-700 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Detail
                                            </Button>
                                            <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 text-slate-600 hover:text-slate-900">
                                                <Link href={`/admin/rbl/print/${b.id}`} target="_blank">
                                                    <Printer className="h-3.5 w-3.5" />
                                                    Cetak
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
