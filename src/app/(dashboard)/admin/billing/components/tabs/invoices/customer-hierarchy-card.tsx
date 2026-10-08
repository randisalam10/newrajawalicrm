"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    ChevronDown, ChevronRight, Building2, FolderGit2, Eye, Receipt
} from "lucide-react"
import { fmt, fmtDate, STATUS_CONFIG } from "../../../utils/billing-helpers"

interface CustomerHierarchyCardProps {
    customer: any
    isCustomerExpanded: boolean
    onToggleCustomer: () => void
    isProjectExpanded: (projectId: string) => boolean
    onToggleProject: (projectId: string) => void
    onOpenInvoice: (invoice: any) => void
}

export function CustomerHierarchyCard({
    customer,
    isCustomerExpanded,
    onToggleCustomer,
    isProjectExpanded,
    onToggleProject,
    onOpenInvoice,
}: CustomerHierarchyCardProps) {
    const hasRemaining = customer.remainingAmount > 0

    return (
        <div className="border border-slate-200/90 rounded-xl bg-white shadow-2xs overflow-hidden transition-all">
            {/* Level 1: Customer Header (Clickable Accordion) */}
            <div
                onClick={onToggleCustomer}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/90 transition-colors cursor-pointer select-none bg-white"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        className="p-1 rounded hover:bg-slate-200/60 text-slate-500 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleCustomer()
                        }}
                    >
                        {isCustomerExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-700" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                    </button>

                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <Building2 className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-bold text-slate-900 text-sm truncate">
                            {customer.customerName}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/80">
                                {customer.projectCount} Proyek
                            </span>
                            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/70">
                                {customer.totalInvoices} Invoice
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Tagihan</div>
                        <div className="text-xs font-mono font-medium text-slate-800">{fmt(customer.totalAmount)}</div>
                    </div>

                    <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Sisa Piutang</div>
                        {hasRemaining ? (
                            <span className="text-xs font-bold font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                {fmt(customer.remainingAmount)}
                            </span>
                        ) : (
                            <span className="text-xs font-semibold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Lunas
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Level 2: Project Accordion List (Visible when Customer is Expanded) */}
            {isCustomerExpanded && (
                <div className="p-3 bg-slate-50/70 space-y-2.5 border-t border-slate-100">
                    {customer.projects.map((proj: any) => {
                        const isProjOpen = isProjectExpanded(proj.projectId)
                        const projHasRemaining = proj.remainingAmount > 0

                        return (
                            <div
                                key={proj.projectId}
                                className="border border-slate-200/80 rounded-lg bg-white overflow-hidden shadow-2xs transition-all"
                            >
                                {/* Level 2 Header: Project (Clickable Accordion) */}
                                <div
                                    onClick={() => onToggleProject(proj.projectId)}
                                    className="w-full flex items-center justify-between p-2.5 hover:bg-blue-50/30 transition-colors cursor-pointer select-none bg-white"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <button
                                            type="button"
                                            className="p-1 rounded hover:bg-slate-200/60 text-slate-500 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onToggleProject(proj.projectId)
                                            }}
                                        >
                                            {isProjOpen ? (
                                                <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                                            ) : (
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                        </button>

                                        <FolderGit2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                                        <span className="font-semibold text-slate-800 text-xs truncate max-w-xs sm:max-w-md">
                                            {proj.projectName}
                                        </span>

                                        {/* Counter Badge: Shows number of invoices in this project */}
                                        <Badge
                                            variant="secondary"
                                            className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.2 shrink-0"
                                        >
                                            {proj.invoiceCount} Invoice
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 ml-2">
                                        <div className="text-right text-[11px] font-mono text-slate-500 hidden md:block">
                                            {fmt(proj.totalAmount)}
                                        </div>
                                        <div>
                                            {projHasRemaining ? (
                                                <span className="text-[11px] font-bold font-mono text-rose-600">
                                                    Sisa: {fmt(proj.remainingAmount)}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-medium font-mono text-emerald-600">
                                                    Lunas
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Level 3: Table of Invoices under this Project (Visible when Project is Expanded) */}
                                {isProjOpen && (
                                    <div className="border-t border-slate-100 p-0 overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50/90">
                                                <TableRow className="text-[11px]">
                                                    <TableHead className="text-xs py-2 pl-4">No. Invoice</TableHead>
                                                    <TableHead className="text-xs py-2">Tanggal</TableHead>
                                                    <TableHead className="text-xs py-2">Pajak (PPN)</TableHead>
                                                    <TableHead className="text-xs py-2 text-right">Total Tagihan</TableHead>
                                                    <TableHead className="text-xs py-2 text-right">Terbayar</TableHead>
                                                    <TableHead className="text-xs py-2 text-right">Sisa Piutang</TableHead>
                                                    <TableHead className="text-xs py-2 text-center">Status</TableHead>
                                                    <TableHead className="w-10 py-2 pr-4"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {proj.invoices.map((inv: any) => {
                                                    const sisa = inv.total_amount - inv.paid_amount
                                                    const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.DRAFT
                                                    const isCancelled = inv.status === "CANCELLED"
                                                    const isPpn = inv.isPpn ?? (inv.include_ppn === true || (inv.tax_amount || 0) > 0)

                                                    return (
                                                        <TableRow
                                                            key={inv.id}
                                                            className={`text-xs hover:bg-slate-50/80 transition-colors ${isCancelled ? "opacity-50 bg-rose-50/20" : ""}`}
                                                        >
                                                            <TableCell className="font-mono font-medium pl-4 text-slate-800">
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
                                                            <TableCell className="whitespace-nowrap text-slate-600">
                                                                {fmtDate(inv.issue_date)}
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
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
