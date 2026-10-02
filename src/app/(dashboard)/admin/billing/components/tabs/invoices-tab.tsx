"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    Receipt, Percent, Search, Eye, FileText
} from "lucide-react"
import { fmt, fmtDate, STATUS_CONFIG } from "../../utils/billing-helpers"
import { PaginationBar } from "../pagination-bar"

interface InvoicesTabProps {
    invoiceSummary: {
        totalPiutang: number
        ppnCount: number
        ppnGross: number
        nonPpnCount: number
        nonPpnGross: number
        nonPpnPaidTaxLiability: number
    }
    isSuperAdmin: boolean
    invoiceSearch: string
    setInvoiceSearch: (s: string) => void
    invoiceSort: string
    setInvoiceSort: (s: string) => void
    statusFilter: string
    setStatusFilter: (s: string) => void
    ppnFilter: "all" | "PPN" | "NON_PPN"
    setPpnFilter: (f: "all" | "PPN" | "NON_PPN") => void
    showCancelledInvoices: boolean
    onToggleShowCancelled: () => void
    filteredFlatInvoices: any[]
    invoicePage: number
    setInvoicePage: (p: number) => void
    onOpenInvoice: (inv: any) => void
    PAGE_SIZE: number
}

export function InvoicesTab({
    invoiceSummary,
    isSuperAdmin,
    invoiceSearch,
    setInvoiceSearch,
    invoiceSort,
    setInvoiceSort,
    statusFilter,
    setStatusFilter,
    ppnFilter,
    setPpnFilter,
    showCancelledInvoices,
    onToggleShowCancelled,
    filteredFlatInvoices,
    invoicePage,
    setInvoicePage,
    onOpenInvoice,
    PAGE_SIZE,
}: InvoicesTabProps) {
    const pageStart = (invoicePage - 1) * PAGE_SIZE
    const pageEnd = invoicePage * PAGE_SIZE
    const pageInvs = filteredFlatInvoices.slice(pageStart, pageEnd)

    const customerGroups: Record<string, any[]> = {}
    const customerOrder: string[] = []
    for (const inv of pageInvs) {
        if (!customerGroups[inv.customerId]) {
            customerGroups[inv.customerId] = []
            customerOrder.push(inv.customerId)
        }
        customerGroups[inv.customerId].push(inv)
    }

    return (
        <div className="space-y-3">
            {/* Summary & Filters Header */}
            <div className="flex flex-col gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                {/* Metrics Bar */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                <Receipt className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Piutang Usaha</div>
                                <div className="font-bold text-slate-900 text-sm font-mono">{fmt(invoiceSummary.totalPiutang)}</div>
                            </div>
                        </div>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                            <div>
                                <div className="text-[10px] text-slate-500 font-semibold uppercase">Pakai PPN (11%)</div>
                                <div className="font-bold text-emerald-700 text-xs font-mono">
                                    {invoiceSummary.ppnCount} Faktur · {fmt(invoiceSummary.ppnGross)}
                                </div>
                            </div>
                        </div>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                            <div>
                                <div className="text-[10px] text-amber-800 font-semibold uppercase">Non-PPN (0%)</div>
                                <div className="font-bold text-amber-900 text-xs font-mono">
                                    {invoiceSummary.nonPpnCount} Faktur · {fmt(invoiceSummary.nonPpnGross)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alert Box for Non-PPN Tax Liability (Khusus SuperAdmin / C-Level) */}
                    {isSuperAdmin && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/90 rounded-lg px-2.5 py-1 text-xs">
                            <div className="p-1 bg-amber-100 text-amber-800 rounded">
                                <Percent className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <div className="text-[10px] text-amber-900 font-bold uppercase">
                                    Kewajiban Setor PPN 11% (Kas Masuk)
                                </div>
                                <div className="font-mono font-bold text-amber-900 text-xs">
                                    {fmt(invoiceSummary.nonPpnPaidTaxLiability)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search & Filter Controls */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative w-44 sm:w-52">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari no. invoice/proyek..."
                                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                value={invoiceSearch}
                                onChange={e => { setInvoiceSearch(e.target.value); setInvoicePage(1); }}
                            />
                        </div>
                        <Select value={invoiceSort} onValueChange={setInvoiceSort}>
                            <SelectTrigger className="h-8 w-28 text-xs bg-white border-slate-200">
                                <SelectValue placeholder="Urutkan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Terbaru</SelectItem>
                                <SelectItem value="oldest">Terlama</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setInvoicePage(1); }}>
                            <SelectTrigger className="h-8 w-36 text-xs">
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="UNPAID" className="text-red-600 font-medium">Belum Lunas / Sisa</SelectItem>
                                <SelectItem value="PAID" className="text-green-600 font-medium">Lunas</SelectItem>
                                <hr className="my-1 border-slate-100" />
                                {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'PAID').map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={ppnFilter} onValueChange={v => { setPpnFilter(v as any); setInvoicePage(1); }}>
                            <SelectTrigger className="h-8 w-44 text-xs bg-white border-slate-200">
                                <SelectValue placeholder="Filter Pajak" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Pajak (PPN & Non-PPN)</SelectItem>
                                <SelectItem value="PPN">
                                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        Pakai PPN (11%)
                                    </div>
                                </SelectItem>
                                <SelectItem value="NON_PPN">
                                    <div className="flex items-center gap-1.5 text-amber-800 font-medium">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        Non-PPN (0% - Wajib Setor)
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <button
                        onClick={onToggleShowCancelled}
                        className={`h-8 px-2.5 text-xs rounded border flex items-center gap-1.5 transition-colors cursor-pointer ${showCancelledInvoices
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        {showCancelledInvoices ? "Sembunyikan Dibatal" : "Tampilkan Dibatal"}
                    </button>
                </div>
            </div>

            {filteredFlatInvoices.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Belum ada invoice yang cocok dengan filter</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="text-xs">No. Invoice</TableHead>
                                    <TableHead className="text-xs">Customer / Proyek</TableHead>
                                    <TableHead className="text-xs">Pajak (PPN)</TableHead>
                                    <TableHead className="text-xs">Tanggal</TableHead>
                                    <TableHead className="text-xs text-right">Total Tagihan</TableHead>
                                    <TableHead className="text-xs text-right">Terbayar</TableHead>
                                    <TableHead className="text-xs text-right">Sisa Piutang</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customerOrder.map(custId => {
                                    const invs = customerGroups[custId]
                                    const custPiutang = invs.reduce((s: number, i: any) => s + (i.total_amount - i.paid_amount), 0)
                                    const hasPpn = (i: any) => i.isPpn ?? (i.include_ppn === true || (i.tax_amount || 0) > 0)
                                    const custNonPpnInvs = invs.filter((i: any) => !hasPpn(i) && i.status !== "CANCELLED")
                                    const custNonPpnPaid = custNonPpnInvs.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0)
                                    const custNonPpnLiability = custNonPpnPaid * 0.11

                                    return (
                                        <React.Fragment key={custId}>
                                            <TableRow className="bg-slate-100/50 hover:bg-slate-100/50">
                                                <TableCell colSpan={9} className="py-2">
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-xs text-slate-800">👤 {invs[0].customerName}</span>
                                                            <span className="text-slate-400 text-[10px]">({invs.length} invoice)</span>
                                                            {custNonPpnInvs.length > 0 && (
                                                                <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[10px] py-0 font-medium">
                                                                    ⚠️ {custNonPpnInvs.length} Non-PPN (Beban PPN Kas Masuk: {fmt(custNonPpnLiability)})
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {custPiutang > 0 && <span className="text-xs font-semibold text-red-600">Piutang: {fmt(custPiutang)}</span>}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {invs.map((inv: any) => {
                                                const sisa = inv.total_amount - inv.paid_amount
                                                const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.DRAFT
                                                const isCancelled = inv.status === "CANCELLED"
                                                const isPpn = hasPpn(inv)
                                                const nonPpnTax = (!isPpn && !isCancelled) ? (inv.paid_amount * 0.11) : 0

                                                return (
                                                    <TableRow key={inv.id} className={`text-xs hover:bg-blue-50/50 ${isCancelled ? 'opacity-50 bg-red-50/30' : ''}`}>
                                                        <TableCell className={`font-mono font-medium pl-6 text-slate-700 ${isCancelled ? 'line-through' : ''}`}>
                                                            <div className="flex items-center gap-1.5">
                                                                <span>{inv.invoice_number}</span>
                                                                {inv.invoice_type === "SEWA" && (
                                                                    <span className="text-[9px] bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.5 rounded">SEWA</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[12rem]" title={inv.projectName}>{inv.projectName}</TableCell>
                                                        <TableCell>
                                                            {isPpn ? (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                    PPN 11%
                                                                </span>
                                                            ) : (
                                                                <div className="inline-flex flex-col">
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                                                        Non-PPN
                                                                    </span>
                                                                    {inv.paid_amount > 0 && !isCancelled && (
                                                                        <span className="text-[9px] text-amber-700 font-mono font-medium mt-0.5" title="Wajib setor PPN 11% mandiri oleh perusahaan dari kas masuk diterima">
                                                                            Beban: {fmt(nonPpnTax)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">{fmtDate(inv.issue_date)}</TableCell>
                                                        <TableCell className="text-right">{fmt(inv.total_amount)}</TableCell>
                                                        <TableCell className="text-right text-green-700">{fmt(inv.paid_amount)}</TableCell>
                                                        <TableCell className={`text-right font-medium ${sisa > 0 && !isCancelled ? 'text-red-600' : 'text-green-600'}`}>{isCancelled ? '-' : fmt(sisa)}</TableCell>
                                                        <TableCell>
                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer" onClick={() => onOpenInvoice(inv)}>
                                                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </React.Fragment>
                                    )
                                })}
                            </TableBody>
                        </Table>
                        <PaginationBar page={invoicePage} total={filteredFlatInvoices.length} perPage={PAGE_SIZE} onPageChange={setInvoicePage} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
