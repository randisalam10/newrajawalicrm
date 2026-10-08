"use client"

import { useState, useMemo } from "react"

export const INVOICE_PAGE_SIZE = 25
export const CUSTOMER_PAGE_SIZE = 10

export function useInvoicesList(
    groupedInvoices: any[] = [],
    externalShowCancelled?: boolean,
    externalSetShowCancelled?: (val: boolean) => void
) {
    const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped")
    const [statusFilter, setStatusFilter] = useState("all")
    const [ppnFilter, setPpnFilter] = useState<"all" | "PPN" | "NON_PPN">("all")
    const [invoiceSearch, setInvoiceSearch] = useState("")
    const [invoiceSort, setInvoiceSort] = useState("newest")
    const [internalShowCancelled, setInternalShowCancelled] = useState(false)
    const [invoicePage, setInvoicePage] = useState(1)
    const [customerPage, setCustomerPage] = useState(1)

    const showCancelledInvoices = externalShowCancelled !== undefined ? externalShowCancelled : internalShowCancelled
    const setShowCancelledInvoices = externalSetShowCancelled || setInternalShowCancelled

    // Minimize / Expand states for Customer & Project (default is empty = MINIMIZED)
    const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

    // Summary KPI calculation across all invoices
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
            for (const pg of cg.projects || []) {
                for (const inv of pg.invoices || []) {
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

    // Filtered flat invoices
    const filteredFlatInvoices = useMemo(() => {
        const list: any[] = []
        const q = invoiceSearch.toLowerCase().trim()

        for (const cg of groupedInvoices) {
            for (const pg of cg.projects || []) {
                for (const inv of pg.invoices || []) {
                    const sisa = (inv.total_amount || 0) - (inv.paid_amount || 0)
                    let statusMatch = true
                    if (statusFilter === "UNPAID") statusMatch = sisa > 0 && inv.status !== "CANCELLED"
                    else if (statusFilter === "PAID") statusMatch = sisa <= 0 && inv.status !== "CANCELLED"
                    else if (statusFilter !== "all") statusMatch = inv.status === statusFilter

                    let ppnMatch = true
                    const isPpn = inv.include_ppn === true || (inv.tax_amount || 0) > 0
                    if (ppnFilter === "PPN") ppnMatch = isPpn
                    else if (ppnFilter === "NON_PPN") ppnMatch = !isPpn

                    let searchMatch = true
                    if (q) {
                        const invNo = String(inv.invoice_number || "").toLowerCase()
                        const cust = String(cg.customerName || "").toLowerCase()
                        const proj = String(pg.projectName || "").toLowerCase()
                        const totalStr = String(inv.total_amount || "")
                        const statusStr = String(inv.status || "").toLowerCase()
                        searchMatch = invNo.includes(q) || cust.includes(q) || proj.includes(q) || totalStr.includes(q) || statusStr.includes(q)
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

    // Filtered hierarchical structure: Customer -> Projects -> Invoices
    const filteredCustomerHierarchy = useMemo(() => {
        const q = invoiceSearch.toLowerCase().trim()
        const customers: any[] = []

        for (const cg of groupedInvoices) {
            const matchingProjects: any[] = []
            let custTotalAmount = 0
            let custTotalPaid = 0
            let custTotalRemaining = 0
            let custTotalInvoices = 0

            for (const pg of cg.projects || []) {
                const matchingInvoices: any[] = []
                let projTotalAmount = 0
                let projTotalPaid = 0
                let projTotalRemaining = 0

                for (const inv of pg.invoices || []) {
                    const sisa = (inv.total_amount || 0) - (inv.paid_amount || 0)
                    let statusMatch = true
                    if (statusFilter === "UNPAID") statusMatch = sisa > 0 && inv.status !== "CANCELLED"
                    else if (statusFilter === "PAID") statusMatch = sisa <= 0 && inv.status !== "CANCELLED"
                    else if (statusFilter !== "all") statusMatch = inv.status === statusFilter

                    let ppnMatch = true
                    const isPpn = inv.include_ppn === true || (inv.tax_amount || 0) > 0
                    if (ppnFilter === "PPN") ppnMatch = isPpn
                    else if (ppnFilter === "NON_PPN") ppnMatch = !isPpn

                    let searchMatch = true
                    if (q) {
                        const invNo = String(inv.invoice_number || "").toLowerCase()
                        const cust = String(cg.customerName || "").toLowerCase()
                        const proj = String(pg.projectName || "").toLowerCase()
                        const totalStr = String(inv.total_amount || "")
                        const statusStr = String(inv.status || "").toLowerCase()
                        searchMatch = invNo.includes(q) || cust.includes(q) || proj.includes(q) || totalStr.includes(q) || statusStr.includes(q)
                    }

                    if (statusMatch && ppnMatch && searchMatch) {
                        matchingInvoices.push({ ...inv, customerName: cg.customerName, projectName: pg.projectName, isPpn })
                        projTotalAmount += inv.total_amount || 0
                        projTotalPaid += inv.paid_amount || 0
                        if (inv.status !== "CANCELLED") {
                            projTotalRemaining += Math.max(0, sisa)
                        }
                    }
                }

                if (matchingInvoices.length > 0) {
                    if (invoiceSort === "newest") matchingInvoices.sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
                    else if (invoiceSort === "oldest") matchingInvoices.sort((a, b) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime())
                    else if (invoiceSort === "highest") matchingInvoices.sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
                    else if (invoiceSort === "lowest") matchingInvoices.sort((a, b) => (a.total_amount || 0) - (b.total_amount || 0))

                    matchingProjects.push({
                        projectId: pg.projectId,
                        projectName: pg.projectName,
                        invoices: matchingInvoices,
                        invoiceCount: matchingInvoices.length,
                        totalAmount: projTotalAmount,
                        paidAmount: projTotalPaid,
                        remainingAmount: projTotalRemaining,
                    })

                    custTotalAmount += projTotalAmount
                    custTotalPaid += projTotalPaid
                    custTotalRemaining += projTotalRemaining
                    custTotalInvoices += matchingInvoices.length
                }
            }

            if (matchingProjects.length > 0) {
                customers.push({
                    customerId: cg.customerId,
                    customerName: cg.customerName,
                    projects: matchingProjects,
                    projectCount: matchingProjects.length,
                    totalInvoices: custTotalInvoices,
                    totalAmount: custTotalAmount,
                    paidAmount: custTotalPaid,
                    remainingAmount: custTotalRemaining,
                })
            }
        }

        return customers
    }, [groupedInvoices, statusFilter, ppnFilter, invoiceSearch, invoiceSort])

    // Toggle customer collapse/expand
    const toggleCustomer = (customerId: string) => {
        setExpandedCustomers(prev => {
            const next = new Set(prev)
            if (next.has(customerId)) next.delete(customerId)
            else next.add(customerId)
            return next
        })
    }

    // Toggle project collapse/expand
    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev)
            if (next.has(projectId)) next.delete(projectId)
            else next.add(projectId)
            return next
        })
    }

    // Expand all customers & projects
    const expandAll = () => {
        const allCusts = new Set<string>()
        const allProjs = new Set<string>()
        for (const c of filteredCustomerHierarchy) {
            allCusts.add(c.customerId)
            for (const p of c.projects) {
                allProjs.add(p.projectId)
            }
        }
        setExpandedCustomers(allCusts)
        setExpandedProjects(allProjs)
    }

    // Collapse all (minimize by default)
    const collapseAll = () => {
        setExpandedCustomers(new Set())
        setExpandedProjects(new Set())
    }

    // Auto-expand matching when search query is active
    const isSearching = Boolean(invoiceSearch.trim())
    const isCustomerExpanded = (customerId: string) => isSearching || expandedCustomers.has(customerId)
    const isProjectExpanded = (projectId: string) => isSearching || expandedProjects.has(projectId)

    return {
        viewMode,
        setViewMode,
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
        customerPage,
        setCustomerPage,
        invoiceSummary,
        filteredFlatInvoices,
        filteredCustomerHierarchy,
        isCustomerExpanded,
        toggleCustomer,
        isProjectExpanded,
        toggleProject,
        expandAll,
        collapseAll,
        INVOICE_PAGE_SIZE,
        CUSTOMER_PAGE_SIZE,
    }
}
