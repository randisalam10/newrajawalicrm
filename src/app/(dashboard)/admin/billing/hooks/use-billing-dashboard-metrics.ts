import { useMemo } from "react"

interface UseBillingDashboardMetricsProps {
    unbilled: any[]
    groupedInvoices: any[]
    deposits: any[]
    locations: any[]
    selectedLocation: string
}

export function useBillingDashboardMetrics({
    unbilled = [],
    groupedInvoices = [],
    deposits = [],
    locations = [],
    selectedLocation = "all",
}: UseBillingDashboardMetricsProps) {
    // ─── Extract All Invoices ──────────────────────────────────────────────────
    const allInvoices = useMemo(() => {
        const list: any[] = []
        for (const cust of groupedInvoices) {
            for (const proj of cust.projects) {
                for (const inv of proj.invoices) {
                    list.push({
                        ...inv,
                        customerId: cust.customerId,
                        customerName: cust.customerName,
                        projectId: proj.projectId,
                        projectName: proj.projectName,
                    })
                }
            }
        }
        return list
    }, [groupedInvoices])

    const activeInvoices = useMemo(() => {
        return allInvoices.filter(i => i.status !== "CANCELLED")
    }, [allInvoices])

    // ─── Key Financial Totals (All Gross & Breakdown) ─────────────────────────
    const totalInvoiced = useMemo(() => {
        return activeInvoices.reduce((s, i) => s + (i.total_amount || 0), 0)
    }, [activeInvoices])

    const totalPaid = useMemo(() => {
        return activeInvoices.reduce((s, i) => {
            const activePayments = (i.payments || []).filter((p: any) => !p.is_cancelled)
            return s + activePayments.reduce((ps: number, p: any) => ps + (p.amount || 0), 0)
        }, 0)
    }, [activeInvoices])

    const totalOutstanding = Math.max(0, totalInvoiced - totalPaid)
    const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0

    // ─── Revenue Breakdown: ReadyMix (Cor) vs Sewa Alat ───────────────────────
    const revenueBreakdown = useMemo(() => {
        let rmGross = 0
        let rmPaid = 0
        let rmVolume = 0
        let rmInvoiceCount = 0

        let sewaGross = 0
        let sewaPaid = 0
        let sewaDays = 0
        let sewaInvoiceCount = 0

        for (const inv of activeInvoices) {
            const isSewaOnly = inv.invoice_type === "SEWA"
            const isRmOnly = inv.invoice_type === "READYMIX" || (!inv.invoice_type && !inv.items?.some((i: any) => i.item_type === "SEWA" || i.sewaTransaction))

            const total = inv.total_amount || 0
            const paid = (inv.payments || []).filter((p: any) => !p.is_cancelled).reduce((s: number, p: any) => s + (p.amount || 0), 0)

            if (isSewaOnly) {
                sewaGross += total
                sewaPaid += paid
                sewaInvoiceCount += 1
                for (const it of inv.items || []) {
                    sewaDays += it.quantity || 0
                }
            } else if (isRmOnly) {
                rmGross += total
                rmPaid += paid
                rmInvoiceCount += 1
                for (const it of inv.items || []) {
                    rmVolume += it.quantity || 0
                }
            } else {
                // COMBINED Invoice
                let invRmSub = 0
                let invSewaSub = 0
                for (const it of inv.items || []) {
                    if (it.item_type === "SEWA" || it.sewaTransaction) {
                        invSewaSub += it.subtotal || (it.quantity * it.unit_price) || 0
                        sewaDays += it.quantity || 0
                    } else {
                        invRmSub += it.subtotal || (it.quantity * it.unit_price) || 0
                        rmVolume += it.quantity || 0
                    }
                }
                const totalSub = (invRmSub + invSewaSub) || 1
                const rmShare = invRmSub / totalSub
                const sewaShare = invSewaSub / totalSub

                const invRmGross = total * rmShare
                const invSewaGross = total * sewaShare

                rmGross += invRmGross
                sewaGross += invSewaGross
                rmPaid += paid * rmShare
                sewaPaid += paid * sewaShare
                rmInvoiceCount += 1
                sewaInvoiceCount += 1
            }
        }

        const rmOutstanding = Math.max(0, rmGross - rmPaid)
        const sewaOutstanding = Math.max(0, sewaGross - sewaPaid)
        const totalGross = rmGross + sewaGross
        const rmSharePct = totalGross > 0 ? (rmGross / totalGross) * 100 : 0
        const sewaSharePct = totalGross > 0 ? (sewaGross / totalGross) * 100 : 0

        return {
            rmGross,
            rmPaid,
            rmOutstanding,
            rmVolume,
            rmInvoiceCount,
            rmSharePct,
            sewaGross,
            sewaPaid,
            sewaOutstanding,
            sewaDays,
            sewaInvoiceCount,
            sewaSharePct,
        }
    }, [activeInvoices])

    // ─── PPN Breakdown: Pakai PPN (11%) vs Non-PPN (0%) ──────────────────────
    const ppnBreakdown = useMemo(() => {
        let ppnInvoiceCount = 0
        let ppnSubtotal = 0
        let ppnTaxAmount = 0
        let ppnGross = 0
        let ppnPaid = 0

        let nonPpnInvoiceCount = 0
        let nonPpnGross = 0
        let nonPpnPaid = 0

        for (const inv of activeInvoices) {
            const isPpn = inv.include_ppn === true || (inv.tax_amount || 0) > 0
            const total = inv.total_amount || 0
            const subtotal = inv.subtotal || (isPpn ? total - (inv.tax_amount || 0) : total)
            const tax = inv.tax_amount || 0
            const paid = (inv.payments || []).filter((p: any) => !p.is_cancelled).reduce((s: number, p: any) => s + (p.amount || 0), 0)

            if (isPpn) {
                ppnInvoiceCount += 1
                ppnSubtotal += subtotal
                ppnTaxAmount += tax
                ppnGross += total
                ppnPaid += paid
            } else {
                nonPpnInvoiceCount += 1
                nonPpnGross += total
                nonPpnPaid += paid
            }
        }

        const ppnOutstanding = Math.max(0, ppnGross - ppnPaid)
        const nonPpnOutstanding = Math.max(0, nonPpnGross - nonPpnPaid)

        const nonPpnEstimatedTaxTotal = nonPpnGross * 0.11
        const nonPpnPaidTaxLiability = nonPpnPaid * 0.11
        const nonPpnOutstandingTaxPending = nonPpnOutstanding * 0.11

        const totalGross = ppnGross + nonPpnGross
        const ppnSharePct = totalGross > 0 ? (ppnGross / totalGross) * 100 : 0
        const nonPpnSharePct = totalGross > 0 ? (nonPpnGross / totalGross) * 100 : 0

        const ppnCollectionRate = ppnGross > 0 ? (ppnPaid / ppnGross) * 100 : 0
        const nonPpnCollectionRate = nonPpnGross > 0 ? (nonPpnPaid / nonPpnGross) * 100 : 0

        return {
            ppnInvoiceCount,
            ppnSubtotal,
            ppnTaxAmount,
            ppnGross,
            ppnPaid,
            ppnOutstanding,
            ppnSharePct,
            ppnCollectionRate,

            nonPpnInvoiceCount,
            nonPpnGross,
            nonPpnPaid,
            nonPpnOutstanding,
            nonPpnSharePct,
            nonPpnCollectionRate,
            nonPpnEstimatedTaxTotal,
            nonPpnPaidTaxLiability,
            nonPpnOutstandingTaxPending,
        }
    }, [activeInvoices])

    // ─── Overdue & Aging Analysis ─────────────────────────────────────────────
    const now = new Date()

    const overdueInvoices = useMemo(() => {
        return activeInvoices.filter(i => {
            if (i.status === "PAID") return false
            const rem = (i.total_amount || 0) - (i.paid_amount || 0)
            if (rem <= 0) return false
            if (!i.due_date) return false
            return new Date(i.due_date) < now
        })
    }, [activeInvoices])

    const totalOverdueAmount = useMemo(() => {
        return overdueInvoices.reduce((s, i) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0)
    }, [overdueInvoices])

    const aging = useMemo(() => {
        let current = 0
        let age1to30 = 0
        let age31to60 = 0
        let ageOver60 = 0

        for (const inv of activeInvoices) {
            const rem = (inv.total_amount || 0) - (inv.paid_amount || 0)
            if (rem <= 0) continue

            const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(inv.issue_date)
            const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays <= 0) {
                current += rem
            } else if (diffDays <= 30) {
                age1to30 += rem
            } else if (diffDays <= 60) {
                age31to60 += rem
            } else {
                ageOver60 += rem
            }
        }

        return { current, age1to30, age31to60, ageOver60 }
    }, [activeInvoices])

    // ─── Status Breakdown ─────────────────────────────────────────────────────
    const statusCounts = useMemo(() => {
        let paid = 0, partial = 0, issued = 0, draft = 0
        let paidVal = 0, partialVal = 0, issuedVal = 0, draftVal = 0

        for (const inv of allInvoices) {
            if (inv.status === "PAID") { paid++; paidVal += inv.total_amount }
            else if (inv.status === "PARTIAL") { partial++; partialVal += (inv.total_amount - inv.paid_amount) }
            else if (inv.status === "ISSUED") { issued++; issuedVal += inv.total_amount }
            else if (inv.status === "DRAFT") { draft++; draftVal += inv.total_amount }
        }

        return { paid, partial, issued, draft, paidVal, partialVal, issuedVal, draftVal }
    }, [allInvoices])

    // ─── Unbilled Backlog / Pipeline (Cor & Sewa & Pajak) ───────────────────────
    const unbilledBreakdown = useMemo(() => {
        let rmCount = 0
        let rmVolume = 0
        let rmEstValue = 0

        let sewaCount = 0
        let sewaDays = 0
        let sewaEstValue = 0

        let pricedCount = 0
        let pricedVolume = 0

        let missingPriceCount = 0
        let missingPriceVolume = 0

        let ppnCount = 0
        let ppnVolume = 0
        let ppnEstValue = 0
        let ppnTaxEstimate = 0

        let nonPpnCount = 0
        let nonPpnVolume = 0
        let nonPpnEstValue = 0
        let nonPpnEstimatedTaxTotal = 0

        for (const tx of unbilled) {
            const isSewa = tx.itemType === "SEWA"
            const isPpn = isSewa
                ? (tx.is_ppn === true || (tx.ppn_mode && tx.ppn_mode !== "NON_PPN"))
                : Boolean(tx.project?.tax_ppn && tx.project.tax_ppn > 0)

            if (isSewa) {
                sewaCount += 1
                const days = tx.totalDays || tx.volume_cubic || 0
                sewaDays += days
                const val = tx.totalPrice || (tx.pricePerDay * days) || 0
                sewaEstValue += val

                if (val > 0) {
                    pricedCount += 1
                    if (isPpn) {
                        ppnCount += 1
                        ppnEstValue += val
                        const taxRate = (tx.ppn_rate || 11) / 100
                        ppnTaxEstimate += val * taxRate
                    } else {
                        nonPpnCount += 1
                        nonPpnEstValue += val
                        nonPpnEstimatedTaxTotal += val * 0.11
                    }
                } else {
                    missingPriceCount += 1
                    if (isPpn) ppnCount += 1
                    else nonPpnCount += 1
                }
            } else {
                rmCount += 1
                const vol = tx.volume_cubic || 0
                rmVolume += vol
                const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price || 0

                if (price > 0) {
                    const val = vol * price
                    rmEstValue += val
                    pricedCount += 1
                    pricedVolume += vol

                    if (isPpn) {
                        ppnCount += 1
                        ppnVolume += vol
                        ppnEstValue += val
                        const taxRate = (tx.project?.tax_ppn || 11) / 100
                        ppnTaxEstimate += val * taxRate
                    } else {
                        nonPpnCount += 1
                        nonPpnVolume += vol
                        nonPpnEstValue += val
                        nonPpnEstimatedTaxTotal += val * 0.11
                    }
                } else {
                    missingPriceCount += 1
                    missingPriceVolume += vol
                    if (isPpn) ppnCount += 1
                    else nonPpnCount += 1
                }
            }
        }

        const totalEstValue = rmEstValue + sewaEstValue
        const ppnSharePct = totalEstValue > 0 ? (ppnEstValue / totalEstValue) * 100 : 0
        const nonPpnSharePct = totalEstValue > 0 ? (nonPpnEstValue / totalEstValue) * 100 : 0

        return {
            rmCount,
            rmVolume,
            rmEstValue,
            sewaCount,
            sewaDays,
            sewaEstValue,
            pricedCount,
            pricedVolume,
            missingPriceCount,
            missingPriceVolume,
            ppnCount,
            ppnVolume,
            ppnEstValue,
            ppnTaxEstimate,
            ppnSharePct,
            nonPpnCount,
            nonPpnVolume,
            nonPpnEstValue,
            nonPpnEstimatedTaxTotal,
            nonPpnSharePct,
            totalEstValue,
            totalCount: unbilled.length,
        }
    }, [unbilled])

    const totalUnbilledCount = unbilledBreakdown.totalCount
    const totalUnbilledVolume = unbilledBreakdown.rmVolume
    const totalUnbilledEstValue = unbilledBreakdown.totalEstValue

    // ─── Consolidated All Pipeline (Invoiced + Unbilled) ──────────────────────
    const consolidatedAll = useMemo(() => {
        const totalGrossValue = totalInvoiced + unbilledBreakdown.totalEstValue
        const totalVolumeAll = revenueBreakdown.rmVolume + unbilledBreakdown.rmVolume
        const totalSewaDaysAll = revenueBreakdown.sewaDays + unbilledBreakdown.sewaDays
        const totalTxCountAll = activeInvoices.length + unbilledBreakdown.totalCount

        const invoicedValueShare = totalGrossValue > 0 ? (totalInvoiced / totalGrossValue) * 100 : 0
        const unbilledValueShare = totalGrossValue > 0 ? (unbilledBreakdown.totalEstValue / totalGrossValue) * 100 : 0

        return {
            totalGrossValue,
            totalVolumeAll,
            totalSewaDaysAll,
            totalTxCountAll,
            invoicedValueShare,
            unbilledValueShare,
        }
    }, [totalInvoiced, unbilledBreakdown, revenueBreakdown, activeInvoices])

    const unbilledByCustomer = useMemo(() => {
        const map = new Map<string, {
            customerName: string
            txCount: number
            rmVolume: number
            sewaDays: number
            estValue: number
            hasSewa: boolean
            hasRm: boolean
        }>()
        for (const tx of unbilled) {
            const isSewa = tx.itemType === "SEWA"
            const custId = tx.customer?.id || tx.project?.customer?.id || "unknown"
            const custName = tx.customer?.customer_name || tx.project?.customer?.customer_name || "Tanpa Nama"

            let val = 0
            if (isSewa) {
                const days = tx.totalDays || tx.volume_cubic || 0
                val = tx.totalPrice || (tx.pricePerDay * days) || 0
            } else {
                const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price || 0
                val = (tx.volume_cubic || 0) * price
            }

            if (!map.has(custId)) {
                map.set(custId, {
                    customerName: custName,
                    txCount: 0,
                    rmVolume: 0,
                    sewaDays: 0,
                    estValue: 0,
                    hasSewa: false,
                    hasRm: false,
                })
            }
            const c = map.get(custId)!
            c.txCount += 1
            if (isSewa) {
                c.sewaDays += (tx.totalDays || tx.volume_cubic || 0)
                c.hasSewa = true
            } else {
                c.rmVolume += (tx.volume_cubic || 0)
                c.hasRm = true
            }
            c.estValue += val
        }
        return Array.from(map.values()).sort((a, b) => b.estValue - a.estValue).slice(0, 5)
    }, [unbilled])

    // ─── Top Debtors (Highest Unpaid Receivables) ──────────────────────────────
    const topDebtors = useMemo(() => {
        return groupedInvoices
            .map(c => {
                const rem = Math.max(0, c.totalAmount - c.totalPaid)
                return {
                    customerId: c.customerId,
                    customerName: c.customerName,
                    totalAmount: c.totalAmount,
                    totalPaid: c.totalPaid,
                    remaining: rem,
                    rate: c.totalAmount > 0 ? (c.totalPaid / c.totalAmount) * 100 : 0
                }
            })
            .filter(c => c.remaining > 0)
            .sort((a, b) => b.remaining - a.remaining)
            .slice(0, 5)
    }, [groupedInvoices])

    // ─── Customer Deposits ────────────────────────────────────────────────────
    const totalDeposits = deposits.reduce((s, d) => s + (d.totalDeposited || 0), 0)

    // ─── Branch Performance ───────────────────────────────────────────────────
    const branchBreakdown = useMemo(() => {
        if (selectedLocation !== "all" || locations.length <= 1) return []
        const map = new Map<string, { name: string; invoiced: number; paid: number; outstanding: number; unbilledCount: number }>()
        for (const loc of locations) {
            map.set(loc.id, { name: loc.name, invoiced: 0, paid: 0, outstanding: 0, unbilledCount: 0 })
        }
        for (const inv of activeInvoices) {
            if (inv.locationId && map.has(inv.locationId)) {
                const b = map.get(inv.locationId)!
                b.invoiced += inv.total_amount || 0
                b.paid += inv.paid_amount || 0
                b.outstanding += Math.max(0, (inv.total_amount || 0) - (inv.paid_amount || 0))
            }
        }
        for (const tx of unbilled) {
            if (tx.locationId && map.has(tx.locationId)) {
                map.get(tx.locationId)!.unbilledCount += 1
            }
        }
        return Array.from(map.values()).filter(b => b.invoiced > 0 || b.unbilledCount > 0)
    }, [selectedLocation, locations, activeInvoices, unbilled])

    const activeLocName = useMemo(() => {
        if (selectedLocation === "all") return "Konsolidasi Seluruh Cabang"
        return locations.find(l => l.id === selectedLocation)?.name || "Cabang"
    }, [selectedLocation, locations])

    return {
        allInvoices,
        activeInvoices,
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        collectionRate,
        revenueBreakdown,
        ppnBreakdown,
        overdueInvoices,
        totalOverdueAmount,
        aging,
        statusCounts,
        unbilledBreakdown,
        totalUnbilledCount,
        totalUnbilledVolume,
        totalUnbilledEstValue,
        consolidatedAll,
        unbilledByCustomer,
        topDebtors,
        totalDeposits,
        branchBreakdown,
        activeLocName,
    }
}
