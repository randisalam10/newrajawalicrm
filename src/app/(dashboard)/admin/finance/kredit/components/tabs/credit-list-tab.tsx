"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { CreditItemDTO } from "../../types"
import { fmtRp, fmtDate, getCreditStatusBadgeConfig } from "../../utils/kredit-helpers"
import { PaginationBar } from "../pagination-bar"
import { Eye, Plus, CreditCard, FileText, AlertCircle } from "lucide-react"

interface CreditListTabProps {
    credits: CreditItemDTO[]
    currentPage: number
    setCurrentPage: (p: number) => void
    pageSize: number
    onOpenDetail: (credit: CreditItemDTO) => void
    onOpenPayment: (credit: CreditItemDTO) => void
    canManage?: boolean
}

export function CreditListTab({
    credits,
    currentPage,
    setCurrentPage,
    pageSize,
    onOpenDetail,
    onOpenPayment,
    canManage,
}: CreditListTabProps) {
    const totalCount = credits.length
    const pageStart = (currentPage - 1) * pageSize
    const pageEnd = currentPage * pageSize
    const pageItems = credits.slice(pageStart, pageEnd)

    return (
        <Card className="border-slate-200/80 shadow-2xs overflow-hidden">
            <CardContent className="p-0">
                {totalCount === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">Tidak ada data kewajiban kredit yang cocok dengan filter</p>
                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter atau klik tombol "Sinkronkan PO" untuk menarik PO terbaru.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="text-xs font-semibold">No. PO & Kredit</TableHead>
                                        <TableHead className="text-xs font-semibold">Supplier / Rekanan</TableHead>
                                        <TableHead className="text-xs font-semibold">Entitas Perusahaan</TableHead>
                                        <TableHead className="text-xs font-semibold">Tgl Terbit</TableHead>
                                        <TableHead className="text-xs font-semibold">Jatuh Tempo</TableHead>
                                        <TableHead className="text-xs font-semibold text-right">Total Nilai</TableHead>
                                        <TableHead className="text-xs font-semibold text-right">Sudah Dibayar</TableHead>
                                        <TableHead className="text-xs font-semibold text-right">Sisa Kewajiban</TableHead>
                                        <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                                        <TableHead className="w-24 text-center text-xs font-semibold">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pageItems.map(item => {
                                        const badge = getCreditStatusBadgeConfig(item.status, item.due_date, item.outstanding)
                                        const isSettled = item.status === "PAID"
                                        const isCancelled = item.status === "CANCELLED"
                                        const poNumber = item.purchaseOrder?.po_number || item.credit_number
                                        const catName = item.purchaseOrder?.category?.name

                                        return (
                                            <TableRow
                                                key={item.id}
                                                className={`text-xs hover:bg-slate-50/80 transition-colors ${
                                                    isCancelled ? "opacity-50 bg-rose-50/20" : ""
                                                }`}
                                            >
                                                {/* No. PO & Kredit */}
                                                <TableCell className="font-mono font-medium text-slate-800">
                                                    <div>
                                                        <span className="text-blue-700 font-semibold">{poNumber}</span>
                                                        {catName && (
                                                            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                                                                {catName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Supplier */}
                                                <TableCell className="font-medium text-slate-800 max-w-[12rem] truncate" title={item.supplier_name}>
                                                    {item.supplier_name}
                                                </TableCell>

                                                {/* Perusahaan Group */}
                                                <TableCell className="text-slate-600 max-w-[11rem] truncate" title={item.company_name}>
                                                    {item.company_name}
                                                </TableCell>

                                                {/* Tanggal Terbit */}
                                                <TableCell className="whitespace-nowrap text-slate-600">
                                                    {fmtDate(item.credit_date)}
                                                </TableCell>

                                                {/* Jatuh Tempo */}
                                                <TableCell className="whitespace-nowrap">
                                                    <span className={badge.className.includes("text-rose-700") ? "text-rose-600 font-bold" : "text-slate-600"}>
                                                        {fmtDate(item.due_date)}
                                                    </span>
                                                </TableCell>

                                                {/* Total Nilai Kredit */}
                                                <TableCell className="text-right font-mono font-semibold text-slate-900">
                                                    {fmtRp(item.total_amount)}
                                                </TableCell>

                                                {/* Sudah Terbayar */}
                                                <TableCell className="text-right font-mono font-medium text-emerald-700">
                                                    {fmtRp(item.paid_amount)}
                                                </TableCell>

                                                {/* Sisa Kewajiban */}
                                                <TableCell className={`text-right font-mono font-bold ${item.outstanding > 0 ? "text-rose-600" : "text-slate-400"}`}>
                                                    {fmtRp(item.outstanding)}
                                                </TableCell>

                                                {/* Status Badge */}
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className}`}>
                                                        {badge.label}
                                                    </span>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                                            onClick={() => onOpenDetail(item)}
                                                            title="Lihat Detail Kewajiban & Histori"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Button>

                                                        {canManage && !isSettled && !isCancelled && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 px-2 text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer font-medium"
                                                                onClick={() => onOpenPayment(item)}
                                                                title="Catat Pembayaran"
                                                            >
                                                                <CreditCard className="w-3 h-3 mr-1" />
                                                                Bayar
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

                        <PaginationBar
                            page={currentPage}
                            total={totalCount}
                            perPage={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </CardContent>
        </Card>
    )
}
