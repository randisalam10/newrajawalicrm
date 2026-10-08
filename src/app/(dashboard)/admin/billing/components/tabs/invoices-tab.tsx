"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    Receipt, Percent, Search, Eye, FileText, FolderTree, TableProperties,
    ChevronsDown, ChevronsUp
} from "lucide-react"
import { fmt, STATUS_CONFIG } from "../../utils/billing-helpers"
import { PaginationBar } from "../pagination-bar"
import { CustomerHierarchyCard } from "./invoices/customer-hierarchy-card"
import { InvoiceFlatTable } from "./invoices/invoice-flat-table"

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
    filteredCustomerHierarchy: any[]
    viewMode: "grouped" | "flat"
    setViewMode: (v: "grouped" | "flat") => void
    isCustomerExpanded: (id: string) => boolean
    toggleCustomer: (id: string) => void
    isProjectExpanded: (id: string) => boolean
    toggleProject: (id: string) => void
    expandAll: () => void
    collapseAll: () => void
    invoicePage: number
    setInvoicePage: (p: number) => void
    customerPage: number
    setCustomerPage: (p: number) => void
    onOpenInvoice: (inv: any) => void
    PAGE_SIZE: number
    CUSTOMER_PAGE_SIZE: number
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
    filteredCustomerHierarchy,
    viewMode,
    setViewMode,
    isCustomerExpanded,
    toggleCustomer,
    isProjectExpanded,
    toggleProject,
    expandAll,
    collapseAll,
    invoicePage,
    setInvoicePage,
    customerPage,
    setCustomerPage,
    onOpenInvoice,
    PAGE_SIZE,
    CUSTOMER_PAGE_SIZE,
}: InvoicesTabProps) {
    // Pagination for Hierarchical View (per customer)
    const custPageStart = (customerPage - 1) * CUSTOMER_PAGE_SIZE
    const custPageEnd = customerPage * CUSTOMER_PAGE_SIZE
    const pageCustomers = filteredCustomerHierarchy.slice(custPageStart, custPageEnd)

    // Pagination for Flat View (per invoice)
    const invPageStart = (invoicePage - 1) * PAGE_SIZE
    const invPageEnd = invoicePage * PAGE_SIZE
    const pageFlatInvoices = filteredFlatInvoices.slice(invPageStart, invPageEnd)

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

                {/* Search & Filter Controls Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Universal Search Input */}
                        <div className="relative w-48 sm:w-60">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari invoice, customer, proyek..."
                                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                value={invoiceSearch}
                                onChange={e => {
                                    setInvoiceSearch(e.target.value)
                                    setInvoicePage(1)
                                    setCustomerPage(1)
                                }}
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <Select value={invoiceSort} onValueChange={setInvoiceSort}>
                            <SelectTrigger className="h-8 w-28 text-xs bg-white border-slate-200">
                                <SelectValue placeholder="Urutkan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Terbaru</SelectItem>
                                <SelectItem value="oldest">Terlama</SelectItem>
                                <SelectItem value="highest">Nominal Tertinggi</SelectItem>
                                <SelectItem value="lowest">Nominal Terendah</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={v => {
                            setStatusFilter(v)
                            setInvoicePage(1)
                            setCustomerPage(1)
                        }}>
                            <SelectTrigger className="h-8 w-36 text-xs bg-white border-slate-200">
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="UNPAID" className="text-rose-600 font-medium">Belum Lunas / Sisa</SelectItem>
                                <SelectItem value="PAID" className="text-emerald-600 font-medium">Lunas</SelectItem>
                                <hr className="my-1 border-slate-100" />
                                {Object.entries(STATUS_CONFIG).filter(([k]) => k !== "PAID").map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* PPN Filter */}
                        <Select value={ppnFilter} onValueChange={v => {
                            setPpnFilter(v as any)
                            setInvoicePage(1)
                            setCustomerPage(1)
                        }}>
                            <SelectTrigger className="h-8 w-40 text-xs bg-white border-slate-200">
                                <SelectValue placeholder="Filter Pajak" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Pajak</SelectItem>
                                <SelectItem value="PPN">Pakai PPN (11%)</SelectItem>
                                <SelectItem value="NON_PPN">Non-PPN (0%)</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Toggle Show Cancelled */}
                        <button
                            type="button"
                            onClick={onToggleShowCancelled}
                            className={`h-8 px-2.5 text-xs rounded border flex items-center gap-1.5 transition-colors cursor-pointer ${showCancelledInvoices
                                    ? "bg-rose-50 border-rose-200 text-rose-700"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                }`}
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{showCancelledInvoices ? "Sembunyikan Dibatal" : "Tampilkan Dibatal"}</span>
                        </button>
                    </div>

                    {/* View Switcher & Accordion Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {/* View Mode Toggle */}
                        <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200/70">
                            <button
                                type="button"
                                onClick={() => setViewMode("grouped")}
                                className={`h-7 px-2.5 text-xs rounded-md flex items-center gap-1.5 font-medium transition-all cursor-pointer ${viewMode === "grouped"
                                        ? "bg-white text-blue-700 shadow-2xs font-semibold"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                                title="Tampilan Hirarki: Group per Customer & Proyek"
                            >
                                <FolderTree className="w-3.5 h-3.5" />
                                <span>Per Customer & Proyek</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode("flat")}
                                className={`h-7 px-2.5 text-xs rounded-md flex items-center gap-1.5 font-medium transition-all cursor-pointer ${viewMode === "flat"
                                        ? "bg-white text-blue-700 shadow-2xs font-semibold"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                                title="Tampilan Tabel Standar Flat"
                            >
                                <TableProperties className="w-3.5 h-3.5" />
                                <span>Tabel Flat</span>
                            </button>
                        </div>

                        {/* Accordion Expand/Collapse All (Only in Grouped View) */}
                        {viewMode === "grouped" && filteredCustomerHierarchy.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-[11px] text-slate-600 cursor-pointer"
                                    onClick={expandAll}
                                    title="Buka semua customer dan proyek"
                                >
                                    <ChevronsDown className="w-3 h-3 mr-1" /> Buka Semua
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-[11px] text-slate-600 cursor-pointer"
                                    onClick={collapseAll}
                                    title="Tutup/minimize semua customer dan proyek"
                                >
                                    <ChevronsUp className="w-3 h-3 mr-1" /> Tutup Semua
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {filteredFlatInvoices.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="text-sm font-medium text-slate-600">Belum ada invoice yang cocok dengan filter / pencarian</p>
                        {invoiceSearch && (
                            <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain atau reset filter</p>
                        )}
                    </CardContent>
                </Card>
            ) : viewMode === "grouped" ? (
                /* VIEW MODE A: Customer -> Project -> Invoices (Accordion Hirarki) */
                <div className="space-y-3">
                    <div className="space-y-2.5">
                        {pageCustomers.map((cust: any) => (
                            <CustomerHierarchyCard
                                key={cust.customerId}
                                customer={cust}
                                isCustomerExpanded={isCustomerExpanded(cust.customerId)}
                                onToggleCustomer={() => toggleCustomer(cust.customerId)}
                                isProjectExpanded={isProjectExpanded}
                                onToggleProject={toggleProject}
                                onOpenInvoice={onOpenInvoice}
                            />
                        ))}
                    </div>

                    {/* Pagination for Customer Hierarchy */}
                    <div className="pt-2">
                        <PaginationBar
                            page={customerPage}
                            total={filteredCustomerHierarchy.length}
                            perPage={CUSTOMER_PAGE_SIZE}
                            onPageChange={setCustomerPage}
                        />
                    </div>
                </div>
            ) : (
                /* VIEW MODE B: Standard Flat Table */
                <div className="space-y-3">
                    <InvoiceFlatTable
                        invoices={pageFlatInvoices}
                        onOpenInvoice={onOpenInvoice}
                    />

                    {/* Pagination for Flat Table */}
                    <div className="pt-2">
                        <PaginationBar
                            page={invoicePage}
                            total={filteredFlatInvoices.length}
                            perPage={PAGE_SIZE}
                            onPageChange={setInvoicePage}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
