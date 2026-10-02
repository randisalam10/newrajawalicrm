"use client"

import { useState, useMemo } from "react"

export const INVOICE_PAGE_SIZE = 25

export function useInvoicesList(groupedInvoices: any[] = []) {
    const [statusFilter, setStatusFilter] = useState("all")
    const [ppnFilter, setPpnFilter] = useState<"all" | "PPN" | "NON_PPN">("all")
    const [invoiceSearch, setInvoiceSearch] = useState("")
    const [invoiceSort, setInvoiceSort] = useState("newest")
    const [showCancelledInvoices, setShowCancelledInvoices] = useState(false)
    const [invoicePage, setInvoicePage] = useState(1)

    const invoiceSummary = useMemo(() => {
        let totalPiutang = 0
        let totalInvoice = 0
        let ppnCount = 0
        let nonPpnCount = 0
        let ppnGross = 0
        let ppnPaid = 0
        let nonPpnGross = 0
        let nonPpnPaid = 0

        for (const cg of groupedInvoices) {
            for (const pg of cg.projects) {
                for (const inv of pg.invoices) {
                    if (inv.status === "CANCELLED") continue
                    totalInvoice++
                    const remaining = Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0))
                    totalPiutang += remaining
                    const isPpn = inv.include_ppn === true || (inv.tax_amount || 0) > 0
                    if (isPpn) {
                        ppnCount++
                        ppnGross += inv.total_amount || 0
                        ppnPaid += inv.paid_amount || 0
                    } else {
                        nonPpnCount++
                        nonPpnGross += inv.total_amount || 0
                        nonPpnPaid += inv.paid_amount || 0
                    }
                }
            }
        }

        const nonPpnPaidTaxLiability = nonPpnPaid * 0.11

        return {
            totalPiutang,
            totalInvoice,
            ppnCount,
            nonPpnCount,
            ppnGross,
            ppnPaid,
            nonPpnGross,
            nonPpnPaid,
            nonPpnPaidTaxLiability,
        }
    }, [groupedInvoices])

    const filteredFlatInvoices = useMemo(() => {
        const list: any[] = []
        for (const cg of groupedInvoices) {
            for (const pg of cg.projects) {
                for (const inv of pg.invoices) {
                    const sisa = (inv.total_amount || 0) - (inv.paid_amount || 0)
                    let statusMatch = true
                    if (statusFilter === "UNPAID") statusMatch = sisa > 0
                    else if (statusFilter === "PAID") statusMatch = sisa <= 0
                    else if (statusFilter !== "all") statusMatch = inv.status === statusFilter

                    let ppnMatch = true
                    const isPpn = inv.include_ppn === true || (inv.tax_amount || 0) > 0
                    if (ppnFilter === "PPN") ppnMatch = isPpn
                    else if (ppnFilter === "NON_PPN") ppnMatch = !isPpn

                    let searchMatch = true
                    if (invoiceSearch.trim()) {
                        const q = invoiceSearch.toLowerCase()
                        searchMatch = (inv.invoice_number?.toLowerCase().includes(q)) ||
                            (cg.customerName?.toLowerCase().includes(q)) ||
                            (pg.projectName?.toLowerCase().includes(q))
                    }

                    if (statusMatch && ppnMatch && searchMatch) {
                        list.push({ ...inv, customerName: cg.customerName, projectName: pg.projectName, isPpn })
                    }
                }
            }
        }

        if (invoiceSort === "newest") list.sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
        else if (invoiceSort === "oldest") list.sort((a, b) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime())
        else if (invoiceSort === "highest") list.sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
        else if (invoiceSort === "lowest") list.sort((a, b) => (a.total_amount || 0) - (b.total_amount || 0))

        return list
    }, [groupedInvoices, statusFilter, ppnFilter, invoiceSearch, invoiceSort])

    return {
        statusFilter,
        setStatusFilter,
        ppnFilter,
        setPpnFilter,
        invoiceSearch,
        setInvoiceSearch,
        invoiceSort,
        setInvoiceSort,
        showCancelledInvoices,
        setShowCancelledInvoices,
        invoicePage,
        setInvoicePage,
        invoiceSummary,
        filteredFlatInvoices,
        INVOICE_PAGE_SIZE,
    }
}
