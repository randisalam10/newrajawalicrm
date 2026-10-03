"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lock, Unlock, Eye, RotateCcw, Calendar, FileText } from "lucide-react"
import { MonthlyClosingRecord } from "../../types"
import Link from "next/link"

interface ClosedPeriodsTableProps {
    records: MonthlyClosingRecord[]
    onOpenReopenModal: (record: MonthlyClosingRecord) => void
    onOpenSnapshotModal: (record: MonthlyClosingRecord) => void
}

function formatRp(val: number): string {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}

export function ClosedPeriodsTable({
    records,
    onOpenReopenModal,
    onOpenSnapshotModal
}: ClosedPeriodsTableProps) {
    if (records.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Belum Ada Periode Ditutup Buku</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                    Silakan gunakan tombol "Tutup Buku Periode Baru" di atas untuk mengunci dan memfinalisasi laporan bulanan yang telah selesai diverifikasi.
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-slate-800">
                        Daftar Periode Akuntansi & Snapshot Resmi
                    </h2>
                    <p className="text-xs text-slate-500">
                        Total {records.length} periode tercatat dalam arsip sistem.
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table className="w-full text-xs">
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[120px]">Periode</TableHead>
                            <TableHead className="w-[180px]">Cabang / Lingkup</TableHead>
                            <TableHead className="w-[110px] text-center">Status</TableHead>
                            <TableHead className="text-right">Volume (m³)</TableHead>
                            <TableHead className="text-right">Omset DPP</TableHead>
                            <TableHead className="text-right">Total HPP</TableHead>
                            <TableHead className="text-right">Laba Bersih</TableHead>
                            <TableHead className="w-[180px]">Auditor & Tanggal Tutup</TableHead>
                            <TableHead className="w-[140px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.map(record => {
                            const isClosed = record.status === "CLOSED"
                            const closedDateStr = record.closedAt ? new Date(record.closedAt).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            }) : "-"

                            return (
                                <TableRow key={record.id} className="hover:bg-slate-50/80 transition-colors">
                                    <TableCell className="font-semibold text-slate-900">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                            <span>{record.period}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-700 font-medium">
                                        {record.locationName}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {isClosed ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px] font-medium">
                                                <Lock className="h-3 w-3" /> Ditutup Buku
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-[11px] font-medium">
                                                <Unlock className="h-3 w-3" /> Dibuka Kembali
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-slate-800">
                                        {record.totalVolume.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                                    </TableCell>
                                    <TableCell className="text-right text-slate-900 font-medium">
                                        {formatRp(record.totalRevenue)}
                                    </TableCell>
                                    <TableCell className="text-right text-slate-700">
                                        {formatRp(record.totalCogs)}
                                    </TableCell>
                                    <TableCell className={`text-right font-semibold ${record.totalNetProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                        {formatRp(record.totalNetProfit)}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        <div className="flex flex-col text-[11px]">
                                            <span className="font-medium text-slate-800">{record.closedByName}</span>
                                            <span className="text-slate-400">{closedDateStr}</span>
                                            {record.reopenedAt && (
                                                <span className="text-amber-600 text-[10px] mt-0.5" title={`Alasan: ${record.reopenReason}`}>
                                                    Dibuka oleh {record.reopenedByName}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onOpenSnapshotModal(record)}
                                                className="h-8 px-2 text-slate-600 hover:text-slate-900"
                                                title="Lihat Detail Snapshot"
                                            >
                                                <Eye className="h-3.5 w-3.5 mr-1" /> Snapshot
                                            </Button>

                                            <Link
                                                href={`/admin/reports/monthly-management?month=${record.period}${record.locationId ? `&locationId=${record.locationId}` : ""}`}
                                                target="_blank"
                                                className="inline-flex items-center justify-center h-8 px-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                title="Buka Halaman Laporan Bulanan"
                                            >
                                                <FileText className="h-3.5 w-3.5 mr-1" /> Laporan
                                            </Link>

                                            {isClosed && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onOpenReopenModal(record)}
                                                    className="h-8 px-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                                    title="Buka Kembali Periode Ini"
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" />
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
