"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { CreditItemDTO, CreditAllocationType } from "../../types"
import { fmtRp, fmtDate, getCreditStatusBadgeConfig } from "../../utils/kredit-helpers"
import { PaginationBar } from "../pagination-bar"
import { Eye, Plus, CreditCard, FileText, AlertCircle, Building2, Factory, HardHat } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CreditListTabProps {
    credits: CreditItemDTO[]
    currentPage: number
    setCurrentPage: (p: number) => void
    pageSize: number
    onOpenDetail: (credit: CreditItemDTO) => void
    onOpenPayment: (credit: CreditItemDTO) => void
    canManage?: boolean
    currentAllocation?: CreditAllocationType
    onAllocationChange?: (alloc: CreditAllocationType) => void
}

export function CreditListTab({
    credits,
    currentPage,
    setCurrentPage,
    pageSize,
    onOpenDetail,
    onOpenPayment,
    canManage,
    currentAllocation = "ALL",
    onAllocationChange,
}: CreditListTabProps) {
    const totalCount = credits.length
    const pageStart = (currentPage - 1) * pageSize
    const pageEnd = currentPage * pageSize
    const pageItems = credits.slice(pageStart, pageEnd)

    // Calculate quick counts from current loaded set
    const projectCount = credits.filter(c => c.allocation_type === "PROJECT").length
    const bpCount = credits.filter(c => c.allocation_type === "BATCHING_PLANT").length
    const holdingCount = credits.filter(c => c.allocation_type === "HOLDING").length

    return (
        <Card className="border-slate-200/80 shadow-2xs overflow-hidden">
            {/* Quick Allocation Switcher Header */}
            {onAllocationChange && (
                <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
                            Peruntukan:
                        </span>
                        <button
                            type="button"
                            onClick={() => onAllocationChange("ALL")}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                                currentAllocation === "ALL"
                                    ? "bg-white text-slate-900 border-slate-300 shadow-2xs"
                                    : "text-slate-600 border-transparent hover:bg-slate-100"
                            }`}
                        >
                            Semua Alokasi ({totalCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => onAllocationChange("PROJECT")}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                currentAllocation === "PROJECT"
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                    : "text-indigo-800 bg-indigo-50/70 border-indigo-100 hover:bg-indigo-100"
                            }`}
                        >
                            <span>🏗️ Proyek</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                currentAllocation === "PROJECT" ? "bg-white/20 text-white" : "bg-indigo-200/80 text-indigo-900"
                            }`}>
                                {projectCount}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onAllocationChange("BATCHING_PLANT")}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                currentAllocation === "BATCHING_PLANT"
                                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                    : "text-blue-800 bg-blue-50/70 border-blue-100 hover:bg-blue-100"
                            }`}
                        >
                            <span>🏭 Batching Plant</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                currentAllocation === "BATCHING_PLANT" ? "bg-white/20 text-white" : "bg-blue-200/80 text-blue-900"
                            }`}>
                                {bpCount}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onAllocationChange("HOLDING")}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                currentAllocation === "HOLDING"
                                    ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                                    : "text-slate-700 bg-slate-100 border-slate-200 hover:bg-slate-200"
                            }`}
                        >
                            <span>🏢 Kantor Pusat</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                currentAllocation === "HOLDING" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
                            }`}>
                                {holdingCount}
                            </span>
                        </button>
                    </div>
                </div>
            )}

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
                                        <TableHead className="text-xs font-semibold">Peruntukan / Alokasi</TableHead>
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

                                                {/* Peruntukan / Alokasi (Proyek vs BP vs Holding) */}
                                                <TableCell className="whitespace-nowrap">
                                                    {item.allocation_type === "BATCHING_PLANT" ? (
                                                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-semibold px-2 py-0.5 inline-flex items-center gap-1">
                                                            <Factory className="w-3 h-3" />
                                                            <span>{item.allocation_label}</span>
                                                        </Badge>
                                                    ) : item.allocation_type === "PROJECT" ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold px-2 py-0.5 max-w-[210px] truncate inline-flex items-center gap-1"
                                                            title={item.allocation_label}
                                                        >
                                                            <HardHat className="w-3 h-3 shrink-0" />
                                                            <span className="truncate">{item.allocation_label}</span>
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 font-medium px-2 py-0.5 inline-flex items-center gap-1">
                                                            <Building2 className="w-3 h-3" />
                                                            <span>{item.allocation_label}</span>
                                                        </Badge>
                                                    )}
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
