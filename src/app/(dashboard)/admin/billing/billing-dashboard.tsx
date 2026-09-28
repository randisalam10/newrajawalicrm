"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DollarSign, Receipt, CreditCard, Clock, AlertTriangle,
    ArrowUpRight, CheckCircle2, TrendingUp, Users, Building2,
    Layers, ChevronRight, FileText, Wallet, Calendar, AlertCircle,
    Truck, Wrench, Landmark, ShieldAlert, Percent, Scale, Tag
} from "lucide-react"

const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n || 0))
const fmtNum = (n: number, dec: number = 0) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: dec }).format(n || 0)

interface BillingDashboardProps {
    unbilled: any[]
    groupedInvoices: any[]
    deposits: any[]
    locations: any[]
    selectedLocation: string
    onNavigateTab: (tab: string, filter?: any) => void
    isCorporate?: boolean
    isSuperAdmin?: boolean
}

export function BillingDashboard({
    unbilled = [],
    groupedInvoices = [],
    deposits = [],
    locations = [],
    selectedLocation = "all",
    onNavigateTab,
    isCorporate = false,
    isSuperAdmin = false,
}: BillingDashboardProps) {
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
            const isCombined = inv.invoice_type === "COMBINED" || (!isSewaOnly && !isRmOnly)

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

        // Beban PPN 11% yang wajib disetor sendiri oleh perusahaan untuk transaksi Non-PPN:
        const nonPpnEstimatedTaxTotal = nonPpnGross * 0.11 // Total potensi PPN 11% dari omzet non-ppn
        const nonPpnPaidTaxLiability = nonPpnPaid * 0.11 // PPN 11% riil dari pembayaran yang sudah diterima
        const nonPpnOutstandingTaxPending = nonPpnOutstanding * 0.11 // PPN 11% dari piutang yang belum lunas

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

    // ─── ADMIN OPERATIONAL DASHBOARD (Non-SuperAdmin: Cabang & Lapangan) ───────
    if (!isSuperAdmin) {
        return (
            <div className="space-y-4 pt-1">
                {/* Header Operasional Cabang */}
                <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                                    DASHBOARD OPERASIONAL PENAGIHAN
                                </span>
                                <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px] bg-slate-800">
                                    📍 {activeLocName}
                                </Badge>
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                                Alur Penagihan & Antrean Pengiriman Cabang
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Fokus pada pemrosesan antrean surat jalan siap invoice, kelengkapan harga mutu, dan monitoring status faktur cabang.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 cursor-pointer font-medium"
                                onClick={() => onNavigateTab("unbilled")}
                            >
                                <Truck className="w-3.5 h-3.5 mr-1.5" />
                                Buka Antrean & Buat Faktur
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Peringatan Transaksi Tanpa Harga (jika ada) */}
                {unbilledBreakdown.missingPriceCount > 0 && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-start gap-2.5">
                            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg mt-0.5 shrink-0">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-amber-950">
                                    Perhatian: {unbilledBreakdown.missingPriceCount} Transaksi Belum Memiliki Harga Kesepakatan ({fmtNum(unbilledBreakdown.missingPriceVolume, 1)} m³ beton cor)
                                </h4>
                                <p className="text-[11px] text-amber-800 mt-0.5">
                                    Tiket pengiriman ini tertahan dan belum bisa dibuatkan invoice sampai harga satuan mutu diisi di Master Proyek.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100/60 shrink-0 font-medium cursor-pointer shadow-2xs"
                            onClick={() => onNavigateTab("unbilled", { noPriceOnly: true })}
                        >
                            Lihat Transaksi Tanpa Harga <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </div>
                )}

                {/* 4 Kartu KPI Operasional Lapangan (Khusus Admin Cabang - Bebas Angka Finansial Sensitif) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* 1. Antrean Siap Ditagih */}
                    <Card className="border-slate-200/80 shadow-2xs bg-white">
                        <CardContent className="p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Antrean Siap Ditagih
                                </span>
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                    <Truck className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-xl font-bold text-slate-900 font-mono">
                                {unbilledBreakdown.totalCount} Tiket
                            </div>
                            <div className="text-[11px] text-slate-500">
                                Surat jalan & sewa selesai kirim
                            </div>
                            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-blue-500" /> Cor ReadyMix:</span>
                                    <span className="font-semibold text-slate-800 font-mono">{fmtNum(unbilledBreakdown.rmVolume, 1)} m³</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span className="flex items-center gap-1"><Wrench className="w-3 h-3 text-purple-500" /> Sewa Alat:</span>
                                    <span className="font-semibold text-purple-700 font-mono">{unbilledBreakdown.sewaDays} Hari</span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 p-0 cursor-pointer justify-between"
                                onClick={() => onNavigateTab("unbilled")}
                            >
                                <span>Proses Buat Faktur</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 2. Kelengkapan Harga Mutu */}
                    <Card className="border-slate-200/80 shadow-2xs bg-white">
                        <CardContent className="p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Validasi Harga Mutu
                                </span>
                                <div className={`p-1.5 rounded-md ${unbilledBreakdown.missingPriceCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {unbilledBreakdown.missingPriceCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                </div>
                            </div>
                            <div className={`text-xl font-bold font-mono ${unbilledBreakdown.missingPriceCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {unbilledBreakdown.missingPriceCount > 0 ? `${unbilledBreakdown.missingPriceCount} Belum Ada` : "100% Lengkap"}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                                {unbilledBreakdown.missingPriceCount > 0
                                    ? `${fmtNum(unbilledBreakdown.missingPriceVolume, 1)} m³ perlu diset di Master Proyek`
                                    : "Seluruh tiket memiliki harga mutu valid"}
                            </div>
                            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Tiket Berharga:</span>
                                    <span className="font-semibold text-emerald-700 font-mono">{unbilledBreakdown.pricedCount} Siap</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Tiket Tanpa Harga:</span>
                                    <span className={`font-semibold font-mono ${unbilledBreakdown.missingPriceCount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                        {unbilledBreakdown.missingPriceCount} Tiket
                                    </span>
                                </div>
                            </div>
                            {unbilledBreakdown.missingPriceCount > 0 ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 h-7 p-0 cursor-pointer justify-between"
                                    onClick={() => onNavigateTab("unbilled", { noPriceOnly: true })}
                                >
                                    <span>Periksa Tiket Tertahan</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Button>
                            ) : (
                                <div className="h-7 flex items-center text-[10px] text-emerald-700 font-medium">
                                    ✓ Siap difakturkan seluruhnya
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 3. Status Faktur Cabang */}
                    <Card className="border-slate-200/80 shadow-2xs bg-white">
                        <CardContent className="p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Faktur Cabang
                                </span>
                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                                    <Receipt className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-xl font-bold text-slate-900 font-mono">
                                {allInvoices.length} Faktur
                            </div>
                            <div className="text-[11px] text-slate-500">
                                Total faktur aktif cabang
                            </div>
                            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Terbit (Issued):</span>
                                    <span className="font-semibold text-blue-600 font-mono">{statusCounts.issued} Faktur</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Lunas (Paid):</span>
                                    <span className="font-semibold text-emerald-600 font-mono">{statusCounts.paid} Faktur</span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-7 p-0 cursor-pointer justify-between"
                                onClick={() => onNavigateTab("invoices")}
                            >
                                <span>Buka Daftar Faktur</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 4. Monitoring Jatuh Tempo */}
                    <Card className="border-slate-200/80 shadow-2xs bg-white">
                        <CardContent className="p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Monitoring Jatuh Tempo
                                </span>
                                <div className={`p-1.5 rounded-md ${overdueInvoices.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                                    <Clock className="w-4 h-4" />
                                </div>
                            </div>
                            <div className={`text-xl font-bold font-mono ${overdueInvoices.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                                {overdueInvoices.length > 0 ? `${overdueInvoices.length} Faktur` : "Tertib"}
                            </div>
                            <div className="text-[11px] text-slate-500">
                                {overdueInvoices.length > 0 ? "Melewati batas jatuh tempo" : "Tidak ada faktur lewat tempo"}
                            </div>
                            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Sebagian (Partial):</span>
                                    <span className="font-semibold text-amber-600 font-mono">{statusCounts.partial} Faktur</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Draft:</span>
                                    <span className="font-semibold text-slate-600 font-mono">{statusCounts.draft} Faktur</span>
                                </div>
                            </div>
                            {overdueInvoices.length > 0 ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 h-7 p-0 cursor-pointer justify-between"
                                    onClick={() => onNavigateTab("invoices", { status: "ISSUED" })}
                                >
                                    <span>Tindak Lanjut Penagihan</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Button>
                            ) : (
                                <div className="h-7 flex items-center text-[10px] text-slate-500 font-medium">
                                    ✓ Penagihan cabang tertib
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Overdue alert jika ada */}
                {overdueInvoices.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-rose-600 text-white rounded-md shrink-0">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                    <span>Ada {overdueInvoices.length} Faktur Melewati Jatuh Tempo di Cabang Ini</span>
                                </div>
                                <div className="text-[11px] text-rose-700 mt-0.5">
                                    Silakan hubungi pelaksana proyek atau PIC penagihan customer untuk follow up fisik / konfirmasi pembayaran.
                                </div>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNavigateTab("invoices", { status: "ISSUED" })}
                            className="h-7 text-xs bg-white text-rose-700 border-rose-300 hover:bg-rose-100/50 self-start sm:self-auto cursor-pointer"
                        >
                            Tampilkan Faktur Jatuh Tempo
                        </Button>
                    </div>
                )}

                {/* Worklist Operasional: Antrean Surat Jalan per Pelanggan */}
                <Card className="border-slate-200/80 shadow-2xs bg-white">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-600" />
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Antrean Surat Jalan & Sewa per Pelanggan (Siap Difakturkan)
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Daftar pelanggan dengan pengiriman cor atau alat sewa yang belum dibuatkan faktur
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigateTab("unbilled")}
                            className="h-7 text-xs px-2 text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer"
                        >
                            Buka Semua Antrean →
                        </Button>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-2">
                        {unbilledByCustomer.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs italic">
                                Semua surat jalan telah selesai dibuatkan faktur. Tidak ada antrean pending.
                            </div>
                        ) : (
                            unbilledByCustomer.map((ub, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 gap-2 text-xs hover:bg-slate-100/60 transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-slate-800 truncate flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className="truncate">{ub.customerName}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-1 ml-7">
                                            <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 text-[10px] px-1.5 py-0 font-medium">
                                                {ub.txCount} Tiket Pengiriman
                                            </Badge>
                                            {ub.hasRm && (
                                                <span className="font-medium text-blue-700 flex items-center gap-1 font-mono">
                                                    <Truck className="w-3 h-3" /> {fmtNum(ub.rmVolume, 1)} m³ Cor
                                                </span>
                                            )}
                                            {ub.hasSewa && (
                                                <span className="font-medium text-purple-700 flex items-center gap-1 font-mono">
                                                    <Wrench className="w-3 h-3" /> {ub.sewaDays} Hari Sewa
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="self-end sm:self-center shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onNavigateTab("unbilled", { search: ub.customerName })}
                                            className="h-7 text-xs bg-white text-blue-700 border-blue-300 hover:bg-blue-50 font-medium cursor-pointer"
                                        >
                                            Buat Faktur Pelanggan Ini →
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Daftar Faktur Lewat Jatuh Tempo (jika ada) */}
                {overdueInvoices.length > 0 && (
                    <Card className="border-rose-200/80 shadow-2xs bg-white">
                        <CardHeader className="p-3.5 pb-2 border-b border-rose-100 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                <div>
                                    <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                        Daftar Faktur Cabang Melewati Batas Jatuh Tempo ({overdueInvoices.length} Faktur)
                                    </CardTitle>
                                    <span className="text-[11px] text-slate-500">
                                        Prioritas konfirmasi dan penagihan lapangan kepada penanggung jawab proyek
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onNavigateTab("invoices", { status: "ISSUED" })}
                                className="h-7 text-xs text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer"
                            >
                                Kelola Semua Faktur →
                            </Button>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-rose-50/50 text-[11px] border-b border-rose-100 text-slate-600">
                                    <tr>
                                        <th className="text-left p-2.5 font-semibold">No. Invoice</th>
                                        <th className="text-left p-2.5 font-semibold">Pelanggan & Proyek</th>
                                        <th className="text-left p-2.5 font-semibold">Tgl Jatuh Tempo</th>
                                        <th className="text-center p-2.5 font-semibold">Status</th>
                                        <th className="text-right p-2.5 font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {overdueInvoices.slice(0, 5).map((inv: any, idx: number) => {
                                        const dueDate = inv.due_date ? new Date(inv.due_date) : null
                                        const diffDays = dueDate ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
                                        return (
                                            <tr key={idx} className="hover:bg-rose-50/30">
                                                <td className="p-2.5 font-mono font-semibold text-slate-800">
                                                    {inv.invoice_number}
                                                </td>
                                                <td className="p-2.5">
                                                    <div className="font-semibold text-slate-800">{inv.customerName || "-"}</div>
                                                    <div className="text-[10px] text-slate-500">{inv.projectName || "-"}</div>
                                                </td>
                                                <td className="p-2.5">
                                                    <div className="text-slate-700 font-medium">
                                                        {dueDate ? dueDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                                                    </div>
                                                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 mt-0.5">
                                                        Lewat {diffDays} hari
                                                    </span>
                                                </td>
                                                <td className="p-2.5 text-center">
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                                                        {inv.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-2.5 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => onNavigateTab("invoices", { search: inv.invoice_number })}
                                                        className="h-6 text-[11px] text-blue-600 hover:text-blue-800 p-0 font-medium cursor-pointer"
                                                    >
                                                        Buka Faktur →
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        )
    }

    // ─── SUPERADMIN EXECUTIVE FINANCIAL DASHBOARD ──────────────────────────────
    return (
        <div className="space-y-4 pt-1">
            {/* ─── Consolidated Total Business Potential Banner (ALL = Invoiced + Unbilled) ─── */}
            <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                                KONSOLIDASI TOTAL OMZET & PRODUKSI (ALL)
                            </span>
                            <span className="text-xs text-slate-400">Total Transaksi Sudah Terbit Invoice + Masih Antre Unbilled</span>
                        </div>
                        <div className="mt-1.5 flex items-baseline gap-2.5 flex-wrap">
                            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                                {fmt(consolidatedAll.totalGrossValue)}
                            </span>
                            <span className="text-xs text-slate-300 font-medium bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                                Total: {fmtNum(consolidatedAll.totalVolumeAll, 1)} m³ beton cor · {consolidatedAll.totalSewaDaysAll} hari sewa
                            </span>
                        </div>
                        {/* Rincian Komponen Konsolidasi (Faktur Terbit vs Antrean Unbilled) */}
                        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-3 flex-wrap">
                            <span>
                                <strong className="text-slate-300">Rincian Cor:</strong> Faktur {fmtNum(revenueBreakdown.rmVolume, 1)} m³ + Antrean {fmtNum(unbilledBreakdown.rmVolume, 1)} m³ = <strong className="text-white">{fmtNum(consolidatedAll.totalVolumeAll, 1)} m³</strong>
                            </span>
                            <span>•</span>
                            <span>
                                <strong className="text-slate-300">Rincian Sewa:</strong> Faktur {revenueBreakdown.sewaDays} Hari + Antrean {unbilledBreakdown.sewaDays} Hari = <strong className="text-white">{consolidatedAll.totalSewaDaysAll} Hari</strong>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs flex-wrap sm:flex-nowrap">
                        <div className="bg-slate-800/90 px-3.5 py-2 rounded-lg border border-slate-700/80 min-w-[150px]">
                            <div className="text-slate-400 text-[10px] uppercase font-semibold">Sudah Ditagihkan (Invoice)</div>
                            <div className="text-blue-400 font-mono font-bold text-sm">
                                {fmt(totalInvoiced)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                                {consolidatedAll.invoicedValueShare.toFixed(1)}% dari total omzet
                            </div>
                        </div>
                        <div className="bg-slate-800/90 px-3.5 py-2 rounded-lg border border-slate-700/80 min-w-[150px]">
                            <div className="text-slate-400 text-[10px] uppercase font-semibold">Antrean Belum Ditagih</div>
                            <div className="text-orange-400 font-mono font-bold text-sm">
                                {fmt(unbilledBreakdown.totalEstValue)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                                {consolidatedAll.unbilledValueShare.toFixed(1)}% dari total omzet
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Missing Price Alert Banner ─── */}
            {unbilledBreakdown.missingPriceCount > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg mt-0.5 shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-amber-950">
                                Perhatian: {unbilledBreakdown.missingPriceCount} Transaksi Belum Memiliki Harga Kesepakatan ({fmtNum(unbilledBreakdown.missingPriceVolume, 1)} m³ beton cor)
                            </h4>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                                Transaksi ini sementara dihitung Rp 0 pada estimasi unbilled. Silakan lengkapi harga mutu di Master Proyek agar nilai tagihan akurat.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100/60 shrink-0 font-medium cursor-pointer shadow-2xs"
                        onClick={() => onNavigateTab("unbilled", { noPriceOnly: true })}
                    >
                        Lihat Transaksi Tanpa Harga <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                </div>
            )}

            {/* ─── Top Executive Summary Banner (5 Core Metrics with ReadyMix & Sewa Breakdown) ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Total Tagihan Terbit (Gross) */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-blue-50/20">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Total Invoice Terbit (Gross)
                            </span>
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                <Receipt className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-slate-900 font-mono truncate">
                            {fmt(totalInvoiced)}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{activeInvoices.length} Faktur Aktif</span>
                            <span className="text-blue-600 font-medium">{activeLocName}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-blue-500" /> Cor ReadyMix</span>
                                <span className="font-mono font-semibold text-slate-800">{fmt(revenueBreakdown.rmGross)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1"><Wrench className="w-3 h-3 text-purple-500" /> Sewa Alat/CP</span>
                                <span className="font-mono font-semibold text-purple-700">{fmt(revenueBreakdown.sewaGross)}</span>
                            </div>
                            <div className="flex items-center justify-between pt-0.5 border-t border-dashed border-slate-100">
                                <span className="text-emerald-700 font-medium">✓ Pakai PPN (11%)</span>
                                <span className="font-mono font-bold text-emerald-800">{fmt(ppnBreakdown.ppnGross)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-amber-700 font-medium">⚠ Non-PPN (0%)</span>
                                <span className="font-mono font-bold text-amber-800">{fmt(ppnBreakdown.nonPpnGross)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Pembayaran Masuk (Cash Collected) */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-emerald-50/20">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Pembayaran Masuk
                            </span>
                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono truncate">
                            {fmt(totalPaid)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Kolektibilitas</span>
                                <span className="font-bold text-emerald-700 font-mono">{collectionRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, collectionRate)}%` }}
                                />
                            </div>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Kas PPN ({ppnBreakdown.ppnCollectionRate.toFixed(0)}%)</span>
                                <span className="font-mono font-semibold text-emerald-800">{fmt(ppnBreakdown.ppnPaid)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Kas Non-PPN ({ppnBreakdown.nonPpnCollectionRate.toFixed(0)}%)</span>
                                <span className="font-mono font-semibold text-amber-800">{fmt(ppnBreakdown.nonPpnPaid)}</span>
                            </div>
                            <div className="flex items-center justify-between text-amber-900 bg-amber-50/80 rounded px-1 py-0.5 mt-0.5 font-medium border border-amber-200/50">
                                <span>Beban PPN 11%:</span>
                                <span className="font-mono font-bold text-amber-800">{fmt(ppnBreakdown.nonPpnPaidTaxLiability)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Sisa Piutang Usaha */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-amber-50/20">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Sisa Piutang Usaha
                            </span>
                            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                                <CreditCard className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-amber-700 font-mono truncate">
                            {fmt(totalOutstanding)}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Outstanding A/R</span>
                            <button
                                onClick={() => onNavigateTab("invoices", { status: "ISSUED" })}
                                className="text-amber-700 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                                Periksa <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Cor ReadyMix</span>
                                <span className="font-mono font-semibold text-amber-800">{fmt(revenueBreakdown.rmOutstanding)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Sewa Alat</span>
                                <span className="font-mono font-semibold text-purple-800">{fmt(revenueBreakdown.sewaOutstanding)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Potensi Tagihan Unbilled Pool */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-orange-50/20">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Belum Ditagih (Unbilled)
                            </span>
                            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-md">
                                <Layers className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-orange-700 font-mono truncate">
                            {unbilledBreakdown.totalEstValue > 0 ? fmt(unbilledBreakdown.totalEstValue) : `${unbilledBreakdown.totalCount} Transaksi`}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{unbilledBreakdown.totalCount} Transaksi Siap</span>
                            <button
                                onClick={() => onNavigateTab("unbilled")}
                                className="text-orange-700 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                                Proses <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                        {unbilledBreakdown.missingPriceCount > 0 ? (
                            <div
                                onClick={() => onNavigateTab("unbilled", { noPriceOnly: true })}
                                className="text-[10px] text-amber-800 font-medium bg-amber-100/70 hover:bg-amber-100 rounded px-1.5 py-0.5 border border-amber-200/80 flex items-center justify-between cursor-pointer transition-colors"
                                title="Klik untuk filter transaksi yang belum ada harga kesepakatan"
                            >
                                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-600" /> Belum Ada Harga:</span>
                                <span className="font-bold underline">{unbilledBreakdown.missingPriceCount} tx ({fmtNum(unbilledBreakdown.missingPriceVolume, 1)} m³) ↗</span>
                            </div>
                        ) : (
                            <div className="text-[10px] text-emerald-800 font-medium bg-emerald-50 rounded px-1.5 py-0.5 border border-emerald-200/60 flex items-center justify-between">
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Semua Berharga:</span>
                                <span className="font-bold">{unbilledBreakdown.pricedCount} tx Siap</span>
                            </div>
                        )}
                        <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10px]">
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-blue-500" /> Cor: {fmtNum(unbilledBreakdown.rmVolume, 1)} m³</span>
                                <span className="font-mono font-semibold text-slate-700">{fmt(unbilledBreakdown.rmEstValue)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1"><Wrench className="w-3 h-3 text-purple-500" /> Sewa: {unbilledBreakdown.sewaDays} Hari</span>
                                <span className="font-mono font-semibold text-slate-700">{fmt(unbilledBreakdown.sewaEstValue)}</span>
                            </div>
                            <div
                                onClick={() => onNavigateTab("unbilled", { unbilledPpnFilter: "PPN" })}
                                className="flex items-center justify-between text-slate-500 pt-0.5 border-t border-slate-100/60 hover:text-emerald-700 cursor-pointer group"
                                title="Klik untuk filter antrean unbilled Pakai PPN (11%)"
                            >
                                <span className="flex items-center gap-1 text-emerald-600 font-medium group-hover:underline">✓ Pakai PPN (11%)</span>
                                <span className="font-mono font-medium text-emerald-700">{fmt(unbilledBreakdown.ppnEstValue)}</span>
                            </div>
                            <div
                                onClick={() => onNavigateTab("unbilled", { unbilledPpnFilter: "NON_PPN" })}
                                className="flex items-center justify-between text-slate-500 hover:text-amber-700 cursor-pointer group"
                                title="Klik untuk filter antrean unbilled Non-PPN (0%)"
                            >
                                <span className="flex items-center gap-1 text-amber-600 font-medium group-hover:underline">⚠ Non-PPN (0%)</span>
                                <span className="font-mono font-medium text-amber-700">{fmt(unbilledBreakdown.nonPpnEstValue)}</span>
                            </div>
                            {unbilledBreakdown.nonPpnEstimatedTaxTotal > 0 && (
                                <div className="flex items-center justify-between text-[9px] text-amber-800/80 bg-amber-50/70 px-1.5 py-0.5 rounded mt-0.5 border border-amber-200/50">
                                    <span>Beban PPN 11%:</span>
                                    <span className="font-mono font-bold text-amber-900">{fmt(unbilledBreakdown.nonPpnEstimatedTaxTotal)}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Saldo Deposito Pelanggan */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-purple-50/20 col-span-2 lg:col-span-1">
                    <CardContent className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Saldo Deposito Aktif
                            </span>
                            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                                <Wallet className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-purple-700 font-mono truncate">
                            {fmt(totalDeposits)}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{deposits.length} Proyek Pelanggan</span>
                            <button
                                onClick={() => onNavigateTab("deposit")}
                                className="text-purple-700 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                                Kelola <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                            Dapat dipotong langsung saat pelunasan tagihan
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Komposisi Pendapatan Usaha: Beton ReadyMix vs Sewa Alat ─── */}
            <Card className="border-slate-200/80 shadow-2xs bg-white overflow-hidden">
                <CardHeader className="p-3.5 pb-2.5 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-md shadow-xs">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Komposisi Pendapatan Usaha: Beton ReadyMix vs Sewa Alat & Kendaraan
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Perbandingan perolehan gross invoice, realisasi kas, piutang, serta volume (m³) vs durasi sewa
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500 text-[11px]">Total Omset Usaha:</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{fmt(totalInvoiced)}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {/* Visual Segmented Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                                <span className="font-semibold text-slate-800">Beton ReadyMix</span>
                                <span className="font-mono text-blue-600 font-bold">{revenueBreakdown.rmSharePct.toFixed(1)}%</span>
                                <span className="text-slate-400 text-[11px]">({fmt(revenueBreakdown.rmGross)})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-[11px]">({fmt(revenueBreakdown.sewaGross)})</span>
                                <span className="font-mono text-purple-600 font-bold">{revenueBreakdown.sewaSharePct.toFixed(1)}%</span>
                                <span className="font-semibold text-slate-800">Sewa Alat & CP</span>
                                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden p-0.5 shadow-inner">
                            <div
                                style={{ width: `${revenueBreakdown.rmSharePct || (totalInvoiced === 0 ? 100 : 0)}%` }}
                                className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-l-full transition-all duration-500"
                                title={`ReadyMix: ${fmt(revenueBreakdown.rmGross)}`}
                            />
                            <div
                                style={{ width: `${revenueBreakdown.sewaSharePct || 0}%` }}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-r-full transition-all duration-500"
                                title={`Sewa Alat: ${fmt(revenueBreakdown.sewaGross)}`}
                            />
                        </div>
                    </div>

                    {/* Comparative Cards: ReadyMix vs Sewa */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Column 1: ReadyMix */}
                        <div className="p-3.5 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/40 via-white to-blue-50/10 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                                        <Truck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs text-blue-950 uppercase tracking-wide">Divisi Produksi Beton Cor</div>
                                        <div className="text-[11px] text-slate-500">ReadyMix batching plant & pengiriman mixer</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-mono text-[10px]">
                                    {revenueBreakdown.rmInvoiceCount} Faktur
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tagihan Gross</span>
                                    <span className="text-sm font-bold font-mono text-slate-900 block mt-0.5">{fmt(revenueBreakdown.rmGross)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Kas Diterima</span>
                                    <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">{fmt(revenueBreakdown.rmPaid)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Sisa Piutang</span>
                                    <span className="text-sm font-bold font-mono text-amber-700 block mt-0.5">{fmt(revenueBreakdown.rmOutstanding)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Kubikasi</span>
                                    <span className="text-sm font-bold font-mono text-blue-700 block mt-0.5">{fmtNum(revenueBreakdown.rmVolume, 1)} m³</span>
                                </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-blue-100/40 border border-blue-200 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[10px] font-semibold text-blue-900 uppercase block">Antrean Siap Tagih (Unbilled)</span>
                                    <span className="text-slate-600 text-[11px]">
                                        {unbilledBreakdown.rmCount} Pengiriman · {fmtNum(unbilledBreakdown.rmVolume, 1)} m³
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold font-mono text-blue-900 text-xs block">{fmt(unbilledBreakdown.rmEstValue)}</span>
                                    <button
                                        onClick={() => onNavigateTab("unbilled", { type: "READYMIX" })}
                                        className="text-[10px] text-blue-700 font-semibold hover:underline cursor-pointer"
                                    >
                                        Buka Cor →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Sewa Alat & Kendaraan */}
                        <div className="p-3.5 rounded-xl border border-purple-200/80 bg-gradient-to-br from-purple-50/40 via-white to-purple-50/10 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                                        <Wrench className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs text-purple-950 uppercase tracking-wide">Divisi Sewa Alat & Kendaraan</div>
                                        <div className="text-[11px] text-slate-500">Concrete Pump, Excavator, Crane & Alat Berat</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 font-mono text-[10px]">
                                    {revenueBreakdown.sewaInvoiceCount} Faktur
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tagihan Gross</span>
                                    <span className="text-sm font-bold font-mono text-purple-950 block mt-0.5">{fmt(revenueBreakdown.sewaGross)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Kas Diterima</span>
                                    <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">{fmt(revenueBreakdown.sewaPaid)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Sisa Piutang</span>
                                    <span className="text-sm font-bold font-mono text-amber-700 block mt-0.5">{fmt(revenueBreakdown.sewaOutstanding)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Durasi Sewa</span>
                                    <span className="text-sm font-bold font-mono text-purple-700 block mt-0.5">{revenueBreakdown.sewaDays} Hari</span>
                                </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-purple-100/40 border border-purple-200 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[10px] font-semibold text-purple-900 uppercase block">Antrean Siap Tagih (Unbilled)</span>
                                    <span className="text-slate-600 text-[11px]">
                                        {unbilledBreakdown.sewaCount} Transaksi · {unbilledBreakdown.sewaDays} Hari Kerja
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold font-mono text-purple-900 text-xs block">{fmt(unbilledBreakdown.sewaEstValue)}</span>
                                    <button
                                        onClick={() => onNavigateTab("unbilled", { type: "SEWA" })}
                                        className="text-[10px] text-purple-700 font-semibold hover:underline cursor-pointer"
                                    >
                                        Buka Sewa →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Monitoring Pajak PPN: Pakai PPN vs Non-PPN & Kewajiban Pajak 11% ─── */}
            <Card className="border-slate-200/80 shadow-2xs bg-white overflow-hidden">
                <CardHeader className="p-3.5 pb-2.5 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-md shadow-xs">
                                <Scale className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                    <span>Monitoring Kepatuhan Pajak: Tagihan Pakai PPN vs Non-PPN</span>
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Pemisahan omzet, realisasi pembayaran, dan estimasi beban PPN 11% yang wajib disetor perusahaan untuk transaksi Non-PPN
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 text-[11px]">Beban PPN Non-PPN (Wajib Setor Kas):</span>
                            <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-mono font-bold text-xs">
                                {fmt(ppnBreakdown.nonPpnPaidTaxLiability)}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {/* Visual Segmented Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                                <span className="font-semibold text-slate-800">Pakai PPN (11%)</span>
                                <span className="font-mono text-emerald-700 font-bold">{ppnBreakdown.ppnSharePct.toFixed(1)}%</span>
                                <span className="text-slate-400 text-[11px]">({fmt(ppnBreakdown.ppnGross)})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-[11px]">({fmt(ppnBreakdown.nonPpnGross)})</span>
                                <span className="font-mono text-amber-700 font-bold">{ppnBreakdown.nonPpnSharePct.toFixed(1)}%</span>
                                <span className="font-semibold text-slate-800">Non-PPN (Bebas PPN)</span>
                                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden p-0.5 shadow-inner">
                            <div
                                style={{ width: `${ppnBreakdown.ppnSharePct || (totalInvoiced === 0 ? 100 : 0)}%` }}
                                className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-l-full transition-all duration-500"
                                title={`Pakai PPN: ${fmt(ppnBreakdown.ppnGross)}`}
                            />
                            <div
                                style={{ width: `${ppnBreakdown.nonPpnSharePct || 0}%` }}
                                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-r-full transition-all duration-500"
                                title={`Non-PPN: ${fmt(ppnBreakdown.nonPpnGross)}`}
                            />
                        </div>
                    </div>

                    {/* Comparative Columns: Pakai PPN vs Non-PPN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Column 1: Pakai PPN */}
                        <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/10 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                                        <Landmark className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs text-emerald-950 uppercase tracking-wide">Faktur Kena Pajak (PPN 11%)</div>
                                        <div className="text-[11px] text-slate-500">Customer membayar PPN resmi (Faktur Pajak Standar)</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-[10px]">
                                    {ppnBreakdown.ppnInvoiceCount} Faktur
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tagihan Gross (DPP+PPN)</span>
                                    <span className="text-sm font-bold font-mono text-slate-900 block mt-0.5">{fmt(ppnBreakdown.ppnGross)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Nilai PPN 11% Terbit</span>
                                    <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">{fmt(ppnBreakdown.ppnTaxAmount)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Kas Masuk Diterima</span>
                                    <span className="text-sm font-bold font-mono text-emerald-800 block mt-0.5">
                                        {fmt(ppnBreakdown.ppnPaid)}
                                        <span className="text-[10px] text-slate-400 font-normal ml-1">({ppnBreakdown.ppnCollectionRate.toFixed(0)}%)</span>
                                    </span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Sisa Piutang Ber-PPN</span>
                                    <span className="text-sm font-bold font-mono text-amber-700 block mt-0.5">{fmt(ppnBreakdown.ppnOutstanding)}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-emerald-900 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                                <span className="font-medium">Antrean Belum Ditagih (Pakai PPN):</span>
                                <button
                                    onClick={() => onNavigateTab("unbilled", { unbilledPpnFilter: "PPN" })}
                                    className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                                    title="Klik untuk lihat transaksi unbilled PPN"
                                >
                                    {unbilledBreakdown.ppnCount} tx ({fmt(unbilledBreakdown.ppnEstValue)}) <ArrowUpRight className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="p-2.5 rounded-lg bg-emerald-100/40 border border-emerald-200 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[10px] font-semibold text-emerald-900 uppercase block">Kepatuhan Pajak PPN Masuk</span>
                                    <span className="text-slate-600 text-[11px]">
                                        PPN telah dibebankan kepada customer pemesan cor/sewa.
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onNavigateTab("invoices", { ppnFilter: "PPN" })}
                                    className="h-7 text-xs bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 cursor-pointer font-medium"
                                >
                                    Filter Faktur PPN →
                                </Button>
                            </div>
                        </div>

                        {/* Column 2: Non-PPN */}
                        <div className="p-3.5 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/10 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-600 text-white rounded-lg">
                                        <Percent className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs text-amber-950 uppercase tracking-wide">Faktur Non-PPN (Bebas Pajak Pelanggan)</div>
                                        <div className="text-[11px] text-slate-500">Customer tidak ditagih PPN (Harga Bersih DPP)</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-mono text-[10px]">
                                    {ppnBreakdown.nonPpnInvoiceCount} Faktur
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tagihan Gross DPP</span>
                                    <span className="text-sm font-bold font-mono text-slate-900 block mt-0.5">{fmt(ppnBreakdown.nonPpnGross)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Kas Masuk Diterima</span>
                                    <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">
                                        {fmt(ppnBreakdown.nonPpnPaid)}
                                        <span className="text-[10px] text-slate-400 font-normal ml-1">({ppnBreakdown.nonPpnCollectionRate.toFixed(0)}%)</span>
                                    </span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Sisa Piutang Non-PPN</span>
                                    <span className="text-sm font-bold font-mono text-amber-700 block mt-0.5">{fmt(ppnBreakdown.nonPpnOutstanding)}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                                    <span className="text-[10px] text-amber-800 block uppercase font-bold">Total Potensi PPN 11%</span>
                                    <span className="text-sm font-bold font-mono text-amber-900 block mt-0.5">{fmt(ppnBreakdown.nonPpnEstimatedTaxTotal)}</span>
                                </div>
                            </div>

                            {/* ALERT BOX: Kewajiban Beban Pajak 11% Perusahaan */}
                            <div className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-300 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                                        <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                                        <span>Kewajiban Setor PPN 11% Perusahaan:</span>
                                    </div>
                                    <span className="font-mono font-black text-amber-900 text-sm">
                                        {fmt(ppnBreakdown.nonPpnPaidTaxLiability)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
                                    <span>Dari kas masuk {fmt(ppnBreakdown.nonPpnPaid)} (wajib disetor sendiri 11%)</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onNavigateTab("invoices", { ppnFilter: "NON_PPN" })}
                                        className="h-6 text-[10px] bg-white text-amber-900 border-amber-300 hover:bg-amber-100/50 cursor-pointer font-semibold px-2"
                                    >
                                        Filter Non-PPN →
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-amber-900 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200">
                                <div>
                                    <span className="font-medium block">Antrean Belum Ditagih (Non-PPN):</span>
                                    <span className="text-[10px] text-amber-700">Potensi beban PPN 11%: {fmt(unbilledBreakdown.nonPpnEstimatedTaxTotal)}</span>
                                </div>
                                <button
                                    onClick={() => onNavigateTab("unbilled", { unbilledPpnFilter: "NON_PPN" })}
                                    className="font-mono font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                                    title="Klik untuk lihat transaksi unbilled Non-PPN"
                                >
                                    {unbilledBreakdown.nonPpnCount} tx ({fmt(unbilledBreakdown.nonPpnEstValue)}) <ArrowUpRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Overdue Alert Bar (If any overdue invoices exist) ──────────── */}
            {overdueInvoices.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-rose-600 text-white rounded-md shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                <span>Perhatian: Ada {overdueInvoices.length} Invoice Melewati Jatuh Tempo!</span>
                                <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                                    Total: {fmt(totalOverdueAmount)}
                                </Badge>
                            </div>
                            <div className="text-[11px] text-rose-700 mt-0.5">
                                Segera lakukan tindak lanjut penagihan pada customer terkait untuk menjaga arus kas perusahaan.
                            </div>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateTab("invoices", { status: "ISSUED" })}
                        className="h-7 text-xs bg-white text-rose-700 border-rose-300 hover:bg-rose-100/50 self-start sm:self-auto cursor-pointer"
                    >
                        Tampilkan Invoice Jatuh Tempo
                    </Button>
                </div>
            )}

            {/* ─── Corporate Financial Analysis: Aging & Status Distribution ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                {/* 1. Analisis Umur Piutang (A/R Aging) */}
                <Card className="border-slate-200/80 shadow-2xs lg:col-span-2">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Analisis Umur Piutang Usaha (A/R Aging)
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Distribusi nilai tagihan belum terbayar berdasarkan jatuh tempo
                                </span>
                            </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700">
                            Total: {fmt(totalOutstanding)}
                        </span>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {/* Bucket 1: Belum Jatuh Tempo */}
                            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60">
                                <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                                    Lancar / Belum Tempo
                                </span>
                                <span className="text-sm font-bold text-slate-900 font-mono block mt-1">
                                    {fmt(aging.current)}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {totalOutstanding > 0 ? ((aging.current / totalOutstanding) * 100).toFixed(0) : 0}% dari total
                                </span>
                            </div>

                            {/* Bucket 2: 1 - 30 Hari */}
                            <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/40">
                                <span className="text-[10px] font-bold text-blue-700 block uppercase">
                                    1 – 30 Hari
                                </span>
                                <span className="text-sm font-bold text-slate-900 font-mono block mt-1">
                                    {fmt(aging.age1to30)}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {totalOutstanding > 0 ? ((aging.age1to30 / totalOutstanding) * 100).toFixed(0) : 0}% dari total
                                </span>
                            </div>

                            {/* Bucket 3: 31 - 60 Hari */}
                            <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40">
                                <span className="text-[10px] font-bold text-amber-700 block uppercase">
                                    31 – 60 Hari
                                </span>
                                <span className="text-sm font-bold text-slate-900 font-mono block mt-1">
                                    {fmt(aging.age31to60)}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {totalOutstanding > 0 ? ((aging.age31to60 / totalOutstanding) * 100).toFixed(0) : 0}% dari total
                                </span>
                            </div>

                            {/* Bucket 4: > 60 Hari */}
                            <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/40">
                                <span className="text-[10px] font-bold text-rose-700 block uppercase">
                                    &gt; 60 Hari (Kritis)
                                </span>
                                <span className="text-sm font-bold text-rose-700 font-mono block mt-1">
                                    {fmt(aging.ageOver60)}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {totalOutstanding > 0 ? ((aging.ageOver60 / totalOutstanding) * 100).toFixed(0) : 0}% dari total
                                </span>
                            </div>
                        </div>

                        {/* Multi-segment visual bar */}
                        <div className="space-y-1">
                            <div className="w-full bg-slate-100 rounded-full h-2.5 flex overflow-hidden">
                                {totalOutstanding > 0 && (
                                    <>
                                        <div style={{ width: `${(aging.current / totalOutstanding) * 100}%` }} className="bg-emerald-500 h-full" title={`Lancar: ${fmt(aging.current)}`} />
                                        <div style={{ width: `${(aging.age1to30 / totalOutstanding) * 100}%` }} className="bg-blue-500 h-full" title={`1-30 Hari: ${fmt(aging.age1to30)}`} />
                                        <div style={{ width: `${(aging.age31to60 / totalOutstanding) * 100}%` }} className="bg-amber-500 h-full" title={`31-60 Hari: ${fmt(aging.age31to60)}`} />
                                        <div style={{ width: `${(aging.ageOver60 / totalOutstanding) * 100}%` }} className="bg-rose-500 h-full" title={`>60 Hari: ${fmt(aging.ageOver60)}`} />
                                    </>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Lancar</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> 1–30 Hari</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 31–60 Hari</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> &gt;60 Hari</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Distribusi Status Invoice */}
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
                            <span>Status Faktur Terbit</span>
                            <span className="font-mono text-slate-500 text-[11px] font-normal">{allInvoices.length} Total</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                <span className="font-medium text-slate-700">Lunas (Paid)</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-slate-900 font-mono">{statusCounts.paid}</span>
                                <span className="text-[10px] text-slate-400 ml-1">Faktur</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                <span className="font-medium text-slate-700">Sebagian (Partial)</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-slate-900 font-mono">{statusCounts.partial}</span>
                                <span className="text-[10px] text-slate-400 ml-1">Faktur</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="font-medium text-slate-700">Terbit (Issued)</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-slate-900 font-mono">{statusCounts.issued}</span>
                                <span className="text-[10px] text-slate-400 ml-1">Faktur</span>
                            </div>
                        </div>

                        {statusCounts.draft > 0 && (
                            <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                    <span className="font-medium text-slate-700">Draft</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-slate-900 font-mono">{statusCounts.draft}</span>
                                    <span className="text-[10px] text-slate-400 ml-1">Faktur</span>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onNavigateTab("invoices")}
                                className="h-6 text-[11px] text-blue-600 hover:text-blue-700 p-0 font-medium cursor-pointer"
                            >
                                Buka Daftar Semua Invoice →
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Corporate Customer Exposure: Top Debtors & Unbilled Pipeline ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {/* Top 5 Debitur Terbesar */}
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-600" />
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Top 5 Pelanggan dengan Piutang Terbesar
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Prioritas penagihan & monitoring batas kredit
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-2.5">
                        {topDebtors.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs italic">
                                Tidak ada piutang outstanding saat ini.
                            </div>
                        ) : (
                            topDebtors.map((deb, idx) => (
                                <div key={deb.customerId} className="space-y-1 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                                            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className="font-semibold text-slate-800 truncate" title={deb.customerName}>
                                                {deb.customerName}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0 font-mono">
                                            <span className="font-bold text-amber-700">{fmt(deb.remaining)}</span>
                                            <span className="text-[10px] text-slate-400 ml-1">
                                                ({deb.rate.toFixed(0)}% terbayar)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-amber-500 h-1.5 rounded-full"
                                            style={{ width: `${Math.min(100, (deb.remaining / (totalOutstanding || 1)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Unbilled Pipeline by Customer */}
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-orange-600" />
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Pipeline Transaksi Belum Difakturkan (Cor & Sewa)
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Pengiriman cor & sewa alat operasional yang siap ditagihkan
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigateTab("unbilled")}
                            className="h-6 text-[11px] px-2 text-orange-700 border-orange-200 hover:bg-orange-50 cursor-pointer"
                        >
                            Proses Penagihan
                        </Button>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-2.5">
                        {unbilledByCustomer.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs italic">
                                Seluruh pengiriman beton dan sewa alat telah berhasil difakturkan.
                            </div>
                        ) : (
                            unbilledByCustomer.map((ub, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                                    <div className="min-w-0 flex-1 mr-2">
                                        <div className="font-semibold text-slate-800 truncate">
                                            {ub.customerName}
                                        </div>
                                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                                            <span>{ub.txCount} Transaksi</span>
                                            <span>·</span>
                                            {ub.hasRm && (
                                                <span className="font-medium text-slate-700">{fmtNum(ub.rmVolume, 1)} m³</span>
                                            )}
                                            {ub.hasRm && ub.hasSewa && <span>+</span>}
                                            {ub.hasSewa && (
                                                <span className="font-medium text-purple-700">{ub.sewaDays} Hari Sewa</span>
                                            )}
                                            {ub.hasSewa && !ub.hasRm && (
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] px-1 py-0">Sewa Alat</Badge>
                                            )}
                                            {ub.hasRm && ub.hasSewa && (
                                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] px-1 py-0">Cor + Sewa</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-bold text-slate-900 font-mono">
                                            {ub.estValue > 0 ? fmt(ub.estValue) : "-"}
                                        </div>
                                        <div className="text-[10px] text-orange-600 font-medium">
                                            Siap Difakturkan
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ─── Konsolidasi Antar Cabang (Multi-Branch Breakdown) ─────────── */}
            {branchBreakdown.length > 0 && (
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Kinerja Penagihan Antar Cabang (Batching Plant)
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Perbandingan omset faktur terbit, realisasi penerimaan kas, dan sisa piutang per lokasi
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-[11px] border-b border-slate-200">
                                <tr>
                                    <th className="text-left p-2.5 font-semibold text-slate-600">Cabang / Batching Plant</th>
                                    <th className="text-right p-2.5 font-semibold text-slate-600">Total Invoice (Rp)</th>
                                    <th className="text-right p-2.5 font-semibold text-slate-600">Kas Diterima (Rp)</th>
                                    <th className="text-right p-2.5 font-semibold text-slate-600">Sisa Piutang (Rp)</th>
                                    <th className="text-center p-2.5 font-semibold text-slate-600">Kolektibilitas</th>
                                    <th className="text-right p-2.5 font-semibold text-slate-600">Antrean Unbilled</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {branchBreakdown.map((b, idx) => {
                                    const rate = b.invoiced > 0 ? (b.paid / b.invoiced) * 100 : 0
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-2.5 font-semibold text-slate-800">
                                                📍 {b.name}
                                            </td>
                                            <td className="p-2.5 text-right font-mono text-slate-700">
                                                {fmt(b.invoiced)}
                                            </td>
                                            <td className="p-2.5 text-right font-mono text-emerald-700 font-semibold">
                                                {fmt(b.paid)}
                                            </td>
                                            <td className="p-2.5 text-right font-mono text-amber-700 font-semibold">
                                                {fmt(b.outstanding)}
                                            </td>
                                            <td className="p-2.5 text-center">
                                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                                    {rate.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="p-2.5 text-right font-mono">
                                                {b.unbilledCount > 0 ? (
                                                    <span className="text-orange-700 font-bold">{b.unbilledCount} tx</span>
                                                ) : (
                                                    <span className="text-slate-400">0</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    )
}
