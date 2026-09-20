"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DollarSign, Receipt, CreditCard, Clock, AlertTriangle,
    ArrowUpRight, CheckCircle2, TrendingUp, Users, Building2,
    Layers, ChevronRight, FileText, Wallet, Calendar, AlertCircle
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
}

export function BillingDashboard({
    unbilled = [],
    groupedInvoices = [],
    deposits = [],
    locations = [],
    selectedLocation = "all",
    onNavigateTab,
    isCorporate = false,
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

    // ─── Key Financial Totals ─────────────────────────────────────────────────
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

    // ─── Unbilled Backlog / Pipeline ──────────────────────────────────────────
    const totalUnbilledCount = unbilled.length
    const totalUnbilledVolume = unbilled.reduce((s, tx) => s + (tx.volume_cubic || 0), 0)
    const totalUnbilledEstValue = unbilled.reduce((s, tx) => {
        const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price || 0
        return s + (tx.volume_cubic * price)
    }, 0)

    const unbilledByCustomer = useMemo(() => {
        const map = new Map<string, { customerName: string; txCount: number; volume: number; estValue: number }>()
        for (const tx of unbilled) {
            const custId = tx.project?.customer?.id || "unknown"
            const custName = tx.project?.customer?.customer_name || "Tanpa Nama"
            const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price || 0
            const val = tx.volume_cubic * price

            if (!map.has(custId)) {
                map.set(custId, { customerName: custName, txCount: 0, volume: 0, estValue: 0 })
            }
            const c = map.get(custId)!
            c.txCount += 1
            c.volume += tx.volume_cubic
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

    return (
        <div className="space-y-4 pt-1">
            {/* ─── Top Executive Summary Banner (5 Core Metrics) ──────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Total Tagihan Terbit */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-blue-50/20">
                    <CardContent className="p-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Total Invoice Terbit
                            </span>
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                <Receipt className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-1 truncate">
                            {fmt(totalInvoiced)}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>{activeInvoices.length} Faktur Aktif</span>
                            <span className="text-blue-600 font-medium">{activeLocName}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Pembayaran Masuk (Cash Collected) */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-emerald-50/20">
                    <CardContent className="p-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Pembayaran Masuk
                            </span>
                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono mt-1 truncate">
                            {fmt(totalPaid)}
                        </div>
                        <div className="mt-1 space-y-1">
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
                    </CardContent>
                </Card>

                {/* 3. Sisa Piutang Usaha */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-amber-50/20">
                    <CardContent className="p-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Sisa Piutang Usaha
                            </span>
                            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                                <CreditCard className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-amber-700 font-mono mt-1 truncate">
                            {fmt(totalOutstanding)}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>Outstanding A/R</span>
                            <button
                                onClick={() => onNavigateTab("invoices", { status: "ISSUED" })}
                                className="text-amber-700 font-medium hover:underline flex items-center gap-0.5"
                            >
                                Periksa <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Potensi Tagihan Unbilled Pool */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-orange-50/20">
                    <CardContent className="p-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Belum Ditagih (Unbilled)
                            </span>
                            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-md">
                                <Layers className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-orange-700 font-mono mt-1 truncate">
                            {totalUnbilledEstValue > 0 ? fmt(totalUnbilledEstValue) : `${totalUnbilledCount} Transaksi`}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>{fmtNum(totalUnbilledVolume, 1)} m³ Beton Cor</span>
                            <button
                                onClick={() => onNavigateTab("unbilled")}
                                className="text-orange-700 font-medium hover:underline flex items-center gap-0.5"
                            >
                                Buat Invoice <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Saldo Deposito Pelanggan */}
                <Card className="border-slate-200/80 shadow-2xs bg-gradient-to-br from-white to-purple-50/20 col-span-2 lg:col-span-1">
                    <CardContent className="p-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Saldo Deposito Aktif
                            </span>
                            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                                <Wallet className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-purple-700 font-mono mt-1 truncate">
                            {fmt(totalDeposits)}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>{deposits.length} Proyek Pelanggan</span>
                            <button
                                onClick={() => onNavigateTab("deposit")}
                                className="text-purple-700 font-medium hover:underline flex items-center gap-0.5"
                            >
                                Kelola <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                                    Pipeline Transaksi Belum Difakturkan
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Pengiriman cor selesai yang siap ditagihkan
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
                                Seluruh pengiriman beton telah berhasil difakturkan.
                            </div>
                        ) : (
                            unbilledByCustomer.map((ub, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                                    <div className="min-w-0 flex-1 mr-2">
                                        <div className="font-semibold text-slate-800 truncate">
                                            {ub.customerName}
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                            {ub.txCount} Transaksi · <span className="font-medium text-slate-700">{fmtNum(ub.volume, 1)} m³</span>
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
