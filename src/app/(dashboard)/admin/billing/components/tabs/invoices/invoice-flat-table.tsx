"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Eye, Receipt } from "lucide-react"
import { fmt, fmtDate, STATUS_CONFIG } from "../../../utils/billing-helpers"

interface InvoiceFlatTableProps {
    invoices: any[]
    onOpenInvoice: (invoice: any) => void
}

export function InvoiceFlatTable({
    invoices,
    onOpenInvoice,
}: InvoiceFlatTableProps) {
    return (
        <div className="border border-slate-200/90 rounded-xl bg-white shadow-2xs overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-2xs">
                    <TableRow className="text-[11px]">
                        <TableHead className="text-xs pl-4">No. Invoice</TableHead>
                        <TableHead className="text-xs">Customer</TableHead>
                        <TableHead className="text-xs">Proyek</TableHead>
                        <TableHead className="text-xs">Pajak</TableHead>
                        <TableHead className="text-xs">Tanggal</TableHead>
                        <TableHead className="text-xs text-right">Total Tagihan</TableHead>
                        <TableHead className="text-xs text-right">Terbayar</TableHead>
                        <TableHead className="text-xs text-right">Sisa Piutang</TableHead>
                        <TableHead className="text-xs text-center">Status</TableHead>
                        <TableHead className="w-10 pr-4"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((inv: any) => {
                        const sisa = inv.total_amount - inv.paid_amount
                        const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.DRAFT
                        const isCancelled = inv.status === "CANCELLED"
                        const isPpn = inv.isPpn ?? (inv.include_ppn === true || (inv.tax_amount || 0) > 0)

                        return (
                            <TableRow
                                key={inv.id}
                                className={`text-xs hover:bg-slate-50/80 transition-colors ${isCancelled ? "opacity-50 bg-rose-50/20" : ""}`}
                            >
                                <TableCell className="font-mono font-medium pl-4 text-slate-800 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <span className={isCancelled ? "line-through text-slate-400" : ""}>
                                            {inv.invoice_number}
                                        </span>
                                        {inv.invoice_type === "SEWA" && (
                                            <span className="text-[9px] bg-purple-100 text-purple-700 font-semibold px-1 py-0.2 rounded">
                                                SEWA
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-semibold text-slate-900 whitespace-nowrap max-w-[14rem] truncate" title={inv.customerName}>
                                    {inv.customerName}
                                </TableCell>
                                <TableCell className="text-slate-600 whitespace-nowrap max-w-[14rem] truncate" title={inv.projectName}>
                                    {inv.projectName}
                                </TableCell>
                                <TableCell>
                                    {isPpn ? (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            PPN 11%
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                            Non-PPN
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-slate-600">
                                    {fmtDate(inv.issue_date)}
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium text-slate-900">
                                    {fmt(inv.total_amount)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-emerald-700">
                                    {fmt(inv.paid_amount)}
                                </TableCell>
                                <TableCell className={`text-right font-mono font-bold ${sisa > 0 && !isCancelled ? "text-rose-600" : "text-emerald-700"}`}>
                                    {isCancelled ? "-" : fmt(sisa)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color}`}>
                                        {cfg.label}
                                    </span>
                                </TableCell>
                                <TableCell className="pr-4 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 cursor-pointer hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                                        onClick={() => onOpenInvoice(inv)}
                                        title="Lihat Rincian Faktur"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
