"use client"

import React, { useState, useMemo, useTransition, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    ChevronDown, ChevronRight, AlertTriangle, Clock, CheckCircle2,
    FileText, Plus, Search, Loader2, Upload, Receipt, TrendingUp,
    Package, Tag, DollarSign, X, Eye, Printer
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { createInvoice, recordPayment, cancelInvoice, addDeposit, getInvoicesGroupedByCustomer, getUnbilledTransactions, getDepositSummary, getInvoiceDetail, getNextInvoiceSeq, getCustomerInvoiceSeq } from "./actions"

const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n))
const fmtDate = (d: any) => d ? format(new Date(d), "dd MMM yyyy", { locale: idLocale }) : "-"

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Draft", color: "bg-slate-100 text-slate-700" },
    ISSUED: { label: "Terbit", color: "bg-blue-100 text-blue-700" },
    PARTIAL: { label: "Sebagian", color: "bg-amber-100 text-amber-700" },
    PAID: { label: "Lunas", color: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Batalkan", color: "bg-red-100 text-red-700" },
}

function PaginationBar({ page, total, perPage, onPageChange }: { page: number, total: number, perPage: number, onPageChange: (p: number) => void }) {
    const totalPages = Math.ceil(total / perPage)
    if (totalPages <= 1) return null
    return (
        <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-slate-500">
            <span>Menampilkan {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} dari {total}</span>
            <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-2 py-1 rounded border text-slate-600 disabled:opacity-40 hover:bg-slate-100">‹</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                    return <button key={p} onClick={() => onPageChange(p)} className={`px-2 py-1 rounded border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-slate-100'}`}>{p}</button>
                })}
                <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-2 py-1 rounded border text-slate-600 disabled:opacity-40 hover:bg-slate-100">›</button>
            </div>
        </div>
    )
}

export function BillingClient({ initialData, locations, userRole, userLocationId }: {
    initialData: any, locations: any[], userRole: string, userLocationId: string
}) {
    const [data, setData] = useState(initialData)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState(userRole !== "SuperAdminBP" ? userLocationId : "all")

    // Unbilled state
    const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set())
    const [unbilledSearch, setUnbilledSearch] = useState("")
    const [groupBy, setGroupBy] = useState<"flat" | "date" | "mutu" | "customer">("date")
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    // Invoice list state
    const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
    const [statusFilter, setStatusFilter] = useState("all")
    const [invoiceSearch, setInvoiceSearch] = useState("")
    const [invoiceSort, setInvoiceSort] = useState("newest")
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [invoiceDetail, setInvoiceDetail] = useState<any>(null)
    const [sheetLoading, setSheetLoading] = useState(false)

    // Pagination
    const [unbilledPage, setUnbilledPage] = useState(1)
    const [invoicePage, setInvoicePage] = useState(1)
    const [depositPage, setDepositPage] = useState(1)
    const PAGE_SIZE = 25

    // Payment dialog
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [paymentForm, setPaymentForm] = useState({ amount: "", method: "TRANSFER", referenceNo: "", notes: "", proofFile: null as File | null, proofUrl: "" })
    const [paymentLoading, setPaymentLoading] = useState(false)

    // Deposit state
    const [showDepositDialog, setShowDepositDialog] = useState(false)
    const [depositTarget, setDepositTarget] = useState<any>(null)
    const [depositForm, setDepositForm] = useState({ amount: "", description: "", reference: "" })
    const [depositLoading, setDepositLoading] = useState(false)

    // Create invoice form
    const [invoiceForm, setInvoiceForm] = useState({
        initialsOverride: "", customerSeqOverride: "", includePpn: true, dueDate: "", notes: ""
    })
    const [customerSeqDefault, setCustomerSeqDefault] = useState<number | null>(null)
    const [createLoading, setCreateLoading] = useState(false)
    const [createError, setCreateError] = useState("")

    const [, startTransition] = useTransition()

    const reload = async (locId?: string) => {
        setIsLoading(true)
        const effectiveLocId = locId !== undefined ? locId : (selectedLocation === "all" ? undefined : selectedLocation)
        const [unbilled, grouped, deposits] = await Promise.all([
            getUnbilledTransactions({ locationId: effectiveLocId }),
            getInvoicesGroupedByCustomer({ locationId: effectiveLocId }),
            getDepositSummary({ locationId: effectiveLocId }),
        ])
        setData((prev: any) => ({ ...prev, unbilled, grouped, deposits }))
        setIsLoading(false)
    }

    // ── Unbilled Pool ─────────────────────────────────────────────────────────
    const unbilled: any[] = data?.unbilled ?? []

    const filteredUnbilled = useMemo(() => {
        const q = unbilledSearch.toLowerCase()
        return unbilled.filter(tx =>
            !q ||
            tx.project?.name?.toLowerCase().includes(q) ||
            tx.project?.customer?.customer_name?.toLowerCase().includes(q) ||
            tx.concreteQuality?.name?.toLowerCase().includes(q)
        )
    }, [unbilled, unbilledSearch])

    const groupedUnbilled = useMemo(() => {
        if (groupBy === "flat") return [{ key: "all", label: "Semua", items: filteredUnbilled }]
        if (groupBy === "date") {
            const map = new Map<string, any[]>()
            for (const tx of filteredUnbilled) {
                const key = format(new Date(tx.date), "yyyy-MM-dd")
                if (!map.has(key)) map.set(key, [])
                map.get(key)!.push(tx)
            }
            return Array.from(map.entries()).map(([key, items]) => ({
                key,
                label: fmtDate(key),
                items,
            }))
        }
        if (groupBy === "customer") {
            const map = new Map<string, any[]>()
            for (const tx of filteredUnbilled) {
                const key = tx.project?.customer?.id ?? "-"
                if (!map.has(key)) map.set(key, [])
                map.get(key)!.push(tx)
            }
            return Array.from(map.entries()).map(([key, items]) => ({
                key,
                label: items[0]?.project?.customer?.customer_name ?? key,
                items,
            }))
        }
        // by mutu
        const map = new Map<string, any[]>()
        for (const tx of filteredUnbilled) {
            const key = tx.concreteQuality?.name ?? "-"
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(tx)
        }
        return Array.from(map.entries()).map(([key, items]) => ({ key, label: key, items }))
    }, [filteredUnbilled, groupBy])

    const selectedTxList = filteredUnbilled.filter(tx => selectedTxIds.has(tx.id))
    const selectedVolume = selectedTxList.reduce((s: number, tx: any) => s + tx.volume_cubic, 0)

    const toggleTx = (id: string) => {
        setSelectedTxIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }
    const selectGroup = (items: any[]) => {
        setSelectedTxIds(prev => {
            const next = new Set(prev)
            const allSelected = items.every(tx => next.has(tx.id))
            items.forEach(tx => allSelected ? next.delete(tx.id) : next.add(tx.id))
            return next
        })
    }
    const selectAll = () => {
        if (selectedTxIds.size === filteredUnbilled.length) {
            setSelectedTxIds(new Set())
        } else {
            setSelectedTxIds(new Set(filteredUnbilled.map(tx => tx.id)))
        }
    }

    // Check if tx has price set for its mutu
    const hasMissingPrices = (txIds: string[]) => {
        return txIds.some(id => {
            const tx = unbilled.find(t => t.id === id)
            if (!tx) return false
            const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)
            return !price
        })
    }

    const handleCreateInvoice = async () => {
        if (selectedTxList.length === 0) return
        const projectId = selectedTxList[0].projectId
        const allSameProject = selectedTxList.every(tx => tx.projectId === projectId)
        if (!allSameProject) {
            setCreateError("Pilih transaksi dari 1 proyek yang sama.")
            return
        }
        if (hasMissingPrices(selectedTxList.map(tx => tx.id))) {
            setCreateError("Ada mutu yang belum memiliki harga. Set harga di menu Customer terlebih dahulu.")
            return
        }
        setCreateError("")
        setCreateLoading(true)
        const res = await createInvoice({
            projectId,
            transactionIds: selectedTxList.map(tx => tx.id),
            initialsOverride: invoiceForm.initialsOverride || undefined,
            customerSeqOverride: invoiceForm.customerSeqOverride ? Number(invoiceForm.customerSeqOverride) : undefined,
            includePpn: invoiceForm.includePpn,
            dueDate: invoiceForm.dueDate || undefined,
            notes: invoiceForm.notes || undefined,
        })
        setCreateLoading(false)
        if (res.success) {
            setShowCreateDialog(false)
            setSelectedTxIds(new Set())
            await reload()
        } else {
            setCreateError(res.error ?? "Gagal membuat invoice")
        }
    }

    // ── Invoice Detail ────────────────────────────────────────────────────────
    const openInvoice = async (inv: any) => {
        setSelectedInvoice(inv)
        setSheetLoading(true)
        const detail = await getInvoiceDetail(inv.id)
        setInvoiceDetail(detail)
        setSheetLoading(false)
    }

    const handleRecordPayment = async () => {
        if (!invoiceDetail) return
        setPaymentLoading(true)
        let proofUrl = paymentForm.proofUrl || undefined
        if (paymentForm.proofFile) {
            const fd = new FormData()
            fd.append("file", paymentForm.proofFile)
            const up = await fetch("/api/upload", { method: "POST", body: fd })
            const json = await up.json()
            if (json.url) proofUrl = json.url
        }
        const res = await recordPayment({
            invoiceId: invoiceDetail.id,
            amount: Number(paymentForm.amount),
            method: paymentForm.method,
            referenceNo: paymentForm.referenceNo || undefined,
            proofUrl,
            notes: paymentForm.notes || undefined,
            paymentDate: new Date().toISOString(),
        })
        setPaymentLoading(false)
        if (res.success) {
            setShowPaymentDialog(false)
            setPaymentForm({ amount: "", method: "TRANSFER", referenceNo: "", notes: "", proofFile: null, proofUrl: "" })
            const detail = await getInvoiceDetail(invoiceDetail.id)
            setInvoiceDetail(detail)
            await reload()
        }
    }

    const handleCancelInvoice = async () => {
        if (!invoiceDetail) return
        if (!confirm("Batalkan invoice ini?")) return
        await cancelInvoice(invoiceDetail.id)
        setSelectedInvoice(null)
        await reload()
    }

    // ── Deposit ───────────────────────────────────────────────────────────────
    const handleAddDeposit = async () => {
        if (!depositTarget) return
        setDepositLoading(true)
        const res = await addDeposit({
            projectId: depositTarget.projectId,
            amount: Number(depositForm.amount),
            description: depositForm.description,
            reference: depositForm.reference || undefined,
        })
        setDepositLoading(false)
        if (res.success) {
            setShowDepositDialog(false)
            setDepositForm({ amount: "", description: "", reference: "" })
            await reload()
        }
    }

    // ── Per-group summary ─────────────────────────────────────────────────────
    const invoiceSummary = useMemo(() => {
        const grouped: any[] = data?.grouped ?? []
        const totalPiutang = grouped.reduce((s: number, c: any) => s + (c.totalAmount - c.totalPaid), 0)
        const totalInvoice = grouped.reduce((s: number, c: any) => s + c.projects.reduce((ps: number, p: any) => ps + p.invoices.length, 0), 0)
        return { totalPiutang, totalInvoice }
    }, [data])

    // Flat invoice list (filter + sort + paginate globally)
    const filteredFlatInvoices = useMemo(() => {
        const grouped: any[] = data?.grouped ?? []
        const loweredSearch = invoiceSearch.toLowerCase()
        const allInvs: any[] = []
        for (const cg of grouped) {
            for (const pg of cg.projects) {
                for (const inv of pg.invoices) {
                    const sisa = inv.total_amount - inv.paid_amount
                    let statusMatch = true
                    if (statusFilter === "UNPAID") statusMatch = sisa > 0
                    else if (statusFilter === "PAID") statusMatch = sisa <= 0
                    else if (statusFilter !== "all") statusMatch = inv.status === statusFilter
                    const searchMatch = !invoiceSearch ||
                        inv.invoice_number.toLowerCase().includes(loweredSearch) ||
                        pg.projectName.toLowerCase().includes(loweredSearch) ||
                        cg.customerName.toLowerCase().includes(loweredSearch)
                    if (statusMatch && searchMatch) allInvs.push({ ...inv, projectName: pg.projectName, customerName: cg.customerName, customerId: cg.customerId })
                }
            }
        }
        allInvs.sort((a, b) => {
            const da = new Date(a.issue_date).getTime()
            const db = new Date(b.issue_date).getTime()
            return invoiceSort === "newest" ? db - da : da - db
        })
        return allInvs
    }, [data, statusFilter, invoiceSearch, invoiceSort])


    return (
        <div className="space-y-4">
            {/* Location filter for SuperAdmin */}
            {userRole === "SuperAdminBP" && (
                <div className="flex items-center gap-3">
                    <Label className="text-sm whitespace-nowrap">Cabang:</Label>
                    <Select
                        value={selectedLocation}
                        onValueChange={v => {
                            setSelectedLocation(v)
                            const locId = v === "all" ? undefined : v
                            reload(locId)
                        }}
                    >
                        <SelectTrigger className="w-48 h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Cabang</SelectItem>
                            {locations.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                </div>
            )}

            <Tabs defaultValue="unbilled">
                <TabsList className="grid grid-cols-3 w-full max-w-lg">
                    <TabsTrigger value="unbilled">
                        Unbilled Pool
                        {unbilled.length > 0 && (
                            <span className="ml-1.5 bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">{unbilled.length}</span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="invoices">
                        Invoice
                        {invoiceSummary.totalInvoice > 0 && (
                            <span className="ml-1.5 bg-blue-600 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">{invoiceSummary.totalInvoice}</span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="deposit">Deposito</TabsTrigger>
                </TabsList>

                {/* ═══ TAB 1: UNBILLED POOL ═══════════════════════════════════════════════ */}
                <TabsContent value="unbilled" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center gap-2 justify-between">
                                <CardTitle className="text-base">Transaksi Belum Ditagih</CardTitle>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400" />
                                        <Input
                                            className="pl-7 h-8 w-48 text-sm"
                                            placeholder="Cari proyek/mutu..."
                                            value={unbilledSearch}
                                            onChange={e => setUnbilledSearch(e.target.value)}
                                        />
                                    </div>
                                    <Select value={groupBy} onValueChange={v => setGroupBy(v as any)}>
                                        <SelectTrigger className="h-8 w-40 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="flat">Flat List</SelectItem>
                                            <SelectItem value="date">Group by Tanggal</SelectItem>
                                            <SelectItem value="customer">Group by Customer</SelectItem>
                                            <SelectItem value="mutu">Group by Mutu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={selectAll}>
                                        {selectedTxIds.size === filteredUnbilled.length && filteredUnbilled.length > 0 ? "Batal Pilih" : "Pilih Semua"}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredUnbilled.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
                                    <p className="text-sm">Semua transaksi sudah ditagih</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead className="w-8 px-3">
                                                    <input type="checkbox"
                                                        checked={selectedTxIds.size === filteredUnbilled.length && filteredUnbilled.length > 0}
                                                        onChange={selectAll}
                                                        className="rounded"
                                                    />
                                                </TableHead>
                                                <TableHead className="text-xs">Tanggal</TableHead>
                                                <TableHead className="text-xs">Customer / Proyek</TableHead>
                                                <TableHead className="text-xs">Mutu</TableHead>
                                                <TableHead className="text-xs text-right">TM</TableHead>
                                                <TableHead className="text-xs text-right">Vol (m³)</TableHead>
                                                <TableHead className="text-xs text-right">Harga/m³</TableHead>
                                                <TableHead className="text-xs text-right">Nilai</TableHead>
                                                <TableHead className="text-xs">Cabang/BP</TableHead>
                                                <TableHead className="text-xs">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {groupedUnbilled.map(group => (
                                                <React.Fragment key={group.key}>
                                                    {groupBy !== "flat" && (
                                                        <TableRow className="bg-slate-50 hover:bg-slate-100 cursor-pointer" onClick={() => selectGroup(group.items)}>
                                                            <TableCell className="px-3">
                                                                <input type="checkbox"
                                                                    checked={group.items.every((tx: any) => selectedTxIds.has(tx.id))}
                                                                    onChange={() => selectGroup(group.items)}
                                                                    className="rounded"
                                                                    onClick={e => e.stopPropagation()}
                                                                />
                                                            </TableCell>
                                                            <TableCell colSpan={8} className="py-1.5 font-semibold text-xs text-slate-700">
                                                                {groupBy === "date" ? `📅 ${group.label}` : groupBy === "customer" ? `👤 ${group.label}` : `🔷 Mutu ${group.label}`}
                                                                <span className="ml-2 text-slate-400 font-normal">
                                                                    ({group.items.length} tx · {group.items.reduce((s: number, tx: any) => s + tx.volume_cubic, 0).toFixed(2)} m³)
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                    {group.items.map((tx: any) => {
                                                        const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price
                                                        const nilai = price ? tx.volume_cubic * price : null
                                                        return (
                                                            <TableRow
                                                                key={tx.id}
                                                                className={`text-xs cursor-pointer ${selectedTxIds.has(tx.id) ? "bg-blue-50" : ""}`}
                                                                onClick={() => toggleTx(tx.id)}
                                                            >
                                                                <TableCell className="px-3">
                                                                    <input type="checkbox" checked={selectedTxIds.has(tx.id)} onChange={() => toggleTx(tx.id)} className="rounded" onClick={e => e.stopPropagation()} />
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap">{fmtDate(tx.date)}</TableCell>
                                                                <TableCell>
                                                                    <div className="font-medium text-slate-800">{tx.project?.customer?.customer_name}</div>
                                                                    <div className="text-slate-400">{tx.project?.name}</div>
                                                                </TableCell>
                                                                <TableCell>{tx.concreteQuality?.name}</TableCell>
                                                                <TableCell className="text-right">1</TableCell>
                                                                <TableCell className="text-right">{tx.volume_cubic.toFixed(2)}</TableCell>
                                                                <TableCell className="text-right">
                                                                    {price ? fmt(price) : (
                                                                        <span className="flex items-center gap-1 justify-end text-amber-600">
                                                                            <AlertTriangle className="w-3 h-3" /> Belum diset
                                                                        </span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">{nilai ? fmt(nilai) : "-"}</TableCell>
                                                                <TableCell>
                                                                    <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{tx.location?.name ?? "-"}</span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {tx.status === "Pending"
                                                                        ? <span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" />Retase Pending</span>
                                                                        : <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" />Confirmed</span>
                                                                    }
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Sticky bottom bar */}
                            {selectedTxIds.size > 0 && (
                                <div className="sticky bottom-0 bg-blue-700 text-white px-4 py-3 flex items-center justify-between rounded-b-lg">
                                    <span className="text-sm font-medium">
                                        ☑ {selectedTxIds.size} transaksi dipilih &nbsp;·&nbsp; {selectedVolume.toFixed(2)} m³
                                    </span>
                                    <Button
                                        className="bg-white text-blue-700 hover:bg-blue-50 h-8"
                                        onClick={async () => {
                                            // fetch customer seq when opening dialog
                                            const custId = unbilled.find((t: any) => selectedTxIds.has(t.id))?.project?.customer?.id
                                            if (custId) {
                                                const seq = await getCustomerInvoiceSeq(custId)
                                                setCustomerSeqDefault(seq)
                                                setInvoiceForm(f => ({ ...f, customerSeqOverride: String(seq) }))
                                            }
                                            setShowCreateDialog(true)
                                        }}
                                    >
                                        <FileText className="w-4 h-4 mr-1.5" /> Buat Invoice
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══ TAB 2: INVOICE LIST ═════════════════════════════════════════════════ */}
                <TabsContent value="invoices" className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 justify-between">
                        <div className="flex flex-col items-start justify-center">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-slate-800 text-lg">{fmt(invoiceSummary.totalPiutang)}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">TOTAL PIUTANG</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-48">
                                <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari no. invoice/proyek..."
                                    className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    value={invoiceSearch}
                                    onChange={e => setInvoiceSearch(e.target.value)}
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
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                        </div>
                    </div>

                    {filteredFlatInvoices.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-slate-400">
                                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Belum ada invoice yang cocok</p>
                            </CardContent>
                        </Card>
                    ) : (() => {
                        const pageStart = (invoicePage - 1) * PAGE_SIZE
                        const pageEnd = invoicePage * PAGE_SIZE
                        const pageInvs = filteredFlatInvoices.slice(pageStart, pageEnd)
                        // Group by customer for display
                        const customerGroups: Record<string, any[]> = {}
                        const customerOrder: string[] = []
                        for (const inv of pageInvs) {
                            if (!customerGroups[inv.customerId]) { customerGroups[inv.customerId] = []; customerOrder.push(inv.customerId) }
                            customerGroups[inv.customerId].push(inv)
                        }
                        return (
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                            <TableRow>
                                                <TableHead className="text-xs">No. Invoice</TableHead>
                                                <TableHead className="text-xs">Customer / Proyek</TableHead>
                                                <TableHead className="text-xs">Tanggal</TableHead>
                                                <TableHead className="text-xs text-right">Total</TableHead>
                                                <TableHead className="text-xs text-right">Terbayar</TableHead>
                                                <TableHead className="text-xs text-right">Sisa</TableHead>
                                                <TableHead className="text-xs">Status</TableHead>
                                                <TableHead className="w-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customerOrder.map(custId => {
                                                const invs = customerGroups[custId]
                                                const custPiutang = invs.reduce((s: number, i: any) => s + (i.total_amount - i.paid_amount), 0)
                                                return (
                                                    <React.Fragment key={custId}>
                                                        <TableRow className="bg-slate-100/50 hover:bg-slate-100/50">
                                                            <TableCell colSpan={8} className="py-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-xs text-slate-800">👤 {invs[0].customerName}</span>
                                                                        <span className="text-slate-400 text-[10px]">({invs.length} invoice)</span>
                                                                    </div>
                                                                    {custPiutang > 0 && <span className="text-xs font-semibold text-red-600">Piutang: {fmt(custPiutang)}</span>}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                        {invs.map((inv: any) => {
                                                            const sisa = inv.total_amount - inv.paid_amount
                                                            const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.DRAFT
                                                            return (
                                                                <TableRow key={inv.id} className="text-xs hover:bg-blue-50/50">
                                                                    <TableCell className="font-mono font-medium pl-6 text-slate-700">{inv.invoice_number}</TableCell>
                                                                    <TableCell className="text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[12rem]" title={inv.projectName}>{inv.projectName}</TableCell>
                                                                    <TableCell className="whitespace-nowrap">{fmtDate(inv.issue_date)}</TableCell>
                                                                    <TableCell className="text-right">{fmt(inv.total_amount)}</TableCell>
                                                                    <TableCell className="text-right text-green-700">{fmt(inv.paid_amount)}</TableCell>
                                                                    <TableCell className={`text-right font-medium ${sisa > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(sisa)}</TableCell>
                                                                    <TableCell>
                                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openInvoice(inv)}>
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
                                    <PaginationBar page={invoicePage} total={filteredFlatInvoices.length} perPage={PAGE_SIZE} onPageChange={p => setInvoicePage(p)} />
                                </CardContent>
                            </Card>
                        )
                    })()}
                </TabsContent>

                {/* ═══ TAB 3: DEPOSITO ════════════════════════════════════════════════════ */}
                <TabsContent value="deposit" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Saldo Deposito per Proyek</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(data?.deposits ?? []).length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Belum ada deposito</p>
                                </div>
                            ) : (() => {
                                const deps: any[] = data.deposits ?? []
                                const pageDeps = deps.slice((depositPage - 1) * PAGE_SIZE, depositPage * PAGE_SIZE)
                                return (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50">
                                                    <TableHead className="text-xs">Customer / Proyek</TableHead>
                                                    <TableHead className="text-xs text-right">Total Setor</TableHead>
                                                    <TableHead className="text-xs text-right">Sisa</TableHead>
                                                    <TableHead className="w-24"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pageDeps.map((dep: any) => (
                                                    <TableRow key={dep.projectId} className="text-xs">
                                                        <TableCell>
                                                            <div className="font-medium">{dep.customerName}</div>
                                                            <div className="text-slate-400">{dep.projectName}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right">{fmt(dep.totalDeposited)}</TableCell>
                                                        <TableCell className={`text-right font-bold ${dep.totalDeposited > 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                            {fmt(dep.totalDeposited)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button size="sm" variant="outline" className="h-7 text-xs"
                                                                onClick={() => { setDepositTarget(dep); setShowDepositDialog(true) }}>
                                                                <Plus className="w-3 h-3 mr-1" /> Setor
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <PaginationBar page={depositPage} total={deps.length} perPage={PAGE_SIZE} onPageChange={setDepositPage} />
                                    </>
                                )
                            })()}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ═══ CREATE INVOICE DIALOG ═════════════════════════════════════════════ */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Buat Invoice Baru</DialogTitle>
                    </DialogHeader>
                    {selectedTxList.length > 0 && (() => {
                        const projectId = selectedTxList[0].projectId
                        const allSameProject = selectedTxList.every(tx => tx.projectId === projectId)
                        const proj = selectedTxList[0].project
                        const cust = proj?.customer
                        // Auto-generate initials from customer name
                        const autoInitials = cust
                            ? cust.customer_name
                                .replace(/^(pt\.|pt|cv\.|cv|pak|bu)\s*/i, "")
                                .trim()
                                .split(/\s+/)
                                .map((w: string) => w[0]?.toUpperCase() ?? "")
                                .join("")
                                .slice(0, 4)
                            : "XXX"
                        const displayInitials = invoiceForm.initialsOverride || autoInitials
                        const now = new Date()
                        const month = now.getMonth() + 1
                        const year = now.getFullYear()
                        const previewNum = `###/INV/${displayInitials}/${month}/${year}`

                        const subtotal = selectedTxList.reduce((s: number, tx: any) => {
                            const price = proj?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price ?? 0
                            return s + tx.volume_cubic * price
                        }, 0)
                        const taxRate = invoiceForm.includePpn ? (proj?.tax_ppn ?? 0) / 100 : 0
                        const total = subtotal + subtotal * taxRate

                        return (
                            <div className="space-y-4">
                                {!allSameProject && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        Pilih transaksi dari 1 proyek yang sama saja.
                                    </div>
                                )}
                                <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                                    <div className="font-medium">{cust?.customer_name} — {proj?.name}</div>
                                    <div className="text-slate-500">{selectedTxList.length} transaksi · {selectedVolume.toFixed(2)} m³</div>
                                </div>

                                {/* ── Invoice Number Builder ──────────── */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold">Nomor Invoice</Label>
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {/* Sequence — auto, read-only */}
                                        <div className="bg-slate-100 rounded-md px-3 py-2 text-sm font-mono text-slate-400 tracking-wider">###</div>
                                        <span className="text-slate-400">/</span>
                                        {/* INV — fixed */}
                                        {/* INV-X — INV fixed, X editable */}
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-0.5">
                                                <div className="bg-slate-100 rounded-l-md px-2 py-2 text-sm font-mono text-slate-500">INV-</div>
                                                <input
                                                    type="number" min={1}
                                                    className="border border-blue-300 rounded-r-md px-2 py-2 text-sm font-mono w-14 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 [appearance:textfield]"
                                                    value={invoiceForm.customerSeqOverride}
                                                    onChange={e => setInvoiceForm(f => ({ ...f, customerSeqOverride: e.target.value }))}
                                                />
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className="text-[10px] text-slate-400">urutan ke-{invoiceForm.customerSeqOverride || customerSeqDefault}</span>
                                                <button
                                                    type="button"
                                                    className="text-[10px] text-blue-500 hover:underline"
                                                    onClick={() => setInvoiceForm(f => ({ ...f, customerSeqOverride: "1" }))}
                                                >reset ke 1</button>
                                            </div>
                                        </div>
                                        <span className="text-slate-400">/</span>
                                        {/* Initials — editable */}
                                        <div className="flex flex-col items-center">
                                            <input
                                                className="border border-blue-300 rounded-md px-2 py-2 text-sm font-mono uppercase w-20 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                                                placeholder={autoInitials}
                                                maxLength={4}
                                                value={invoiceForm.initialsOverride}
                                                onChange={e => setInvoiceForm(f => ({ ...f, initialsOverride: e.target.value.toUpperCase() }))}
                                            />
                                            <span className="text-[10px] text-blue-400 mt-0.5">singkatan (edit)</span>
                                        </div>
                                        <span className="text-slate-400">/</span>
                                        {/* Month / Year — fixed */}
                                        <div className="bg-slate-100 rounded-md px-2 py-2 text-sm font-mono text-slate-500">{month}/{year}</div>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Preview: <strong className="font-mono text-slate-700">###/INV-{invoiceForm.customerSeqOverride || customerSeqDefault}/{displayInitials}/{month}/{year}</strong>
                                        <span className="ml-1 text-slate-300">(### = nomor urut otomatis)</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={invoiceForm.includePpn}
                                            onChange={e => setInvoiceForm(f => ({ ...f, includePpn: e.target.checked }))}
                                            className="rounded"
                                        />
                                        PPN {proj?.tax_ppn ?? 0}%
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Jatuh Tempo</Label>
                                        <Input type="date" className="h-9 text-sm mt-1"
                                            value={invoiceForm.dueDate}
                                            onChange={e => setInvoiceForm(f => ({ ...f, dueDate: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Catatan</Label>
                                        <Input className="h-9 text-sm mt-1" placeholder="Opsional"
                                            value={invoiceForm.notes}
                                            onChange={e => setInvoiceForm(f => ({ ...f, notes: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>{fmt(subtotal)}</span></div>
                                    {invoiceForm.includePpn && <div className="flex justify-between text-slate-500"><span>PPN {proj?.tax_ppn}%</span><span>{fmt(subtotal * taxRate)}</span></div>}
                                    <div className="flex justify-between font-bold border-t border-blue-200 pt-1 mt-1"><span>Total</span><span className="text-blue-700">{fmt(total)}</span></div>
                                </div>
                                {createError && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {createError}
                                    </div>
                                )}
                            </div>
                        )
                    })()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Batal</Button>
                        <Button onClick={handleCreateInvoice} disabled={createLoading}>
                            {createLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...</> : "Terbitkan Invoice"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══ INVOICE DETAIL SHEET ══════════════════════════════════════════════ */}
            <Sheet open={!!selectedInvoice} onOpenChange={open => { if (!open) setSelectedInvoice(null) }}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader className="pb-4 border-b">
                        <SheetTitle className="flex items-center justify-between">
                            <span className="font-mono text-base">{invoiceDetail?.invoice_number ?? selectedInvoice?.invoice_number}</span>
                            {invoiceDetail && (
                                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_CONFIG[invoiceDetail.status]?.color ?? ""}`}>
                                    {STATUS_CONFIG[invoiceDetail.status]?.label}
                                </span>
                            )}
                        </SheetTitle>
                        {invoiceDetail && (
                            <div className="text-xs text-slate-500 space-y-0.5">
                                <div>{invoiceDetail.project?.customer?.customer_name} — {invoiceDetail.project?.name}</div>
                                <div>Terbit: {fmtDate(invoiceDetail.issue_date)} {invoiceDetail.due_date ? `· Jatuh tempo: ${fmtDate(invoiceDetail.due_date)}` : ""}</div>
                            </div>
                        )}
                    </SheetHeader>

                    {sheetLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : invoiceDetail ? (
                        <div className="space-y-5 py-4">
                            {/* Summary per date */}
                            {(() => {
                                const byDate = new Map<string, { tms: number; volume: number; nilai: number }>()
                                for (const item of invoiceDetail.items) {
                                    const key = format(new Date(item.transaction.date), "yyyy-MM-dd")
                                    if (!byDate.has(key)) byDate.set(key, { tms: 0, volume: 0, nilai: 0 })
                                    const d = byDate.get(key)!
                                    d.tms += 1
                                    d.volume += item.quantity
                                    d.nilai += item.subtotal
                                }
                                return (
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Ringkasan per Tanggal Kirim</h3>
                                        <div className="border rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50">
                                                        <TableHead className="text-xs">Tanggal</TableHead>
                                                        <TableHead className="text-xs text-right">Total TM</TableHead>
                                                        <TableHead className="text-xs text-right">Kubikasi (m³)</TableHead>
                                                        <TableHead className="text-xs text-right">Nilai</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {Array.from(byDate.entries()).map(([date, d]) => (
                                                        <TableRow key={date} className="text-xs">
                                                            <TableCell>{fmtDate(date)}</TableCell>
                                                            <TableCell className="text-right">{d.tms} TM</TableCell>
                                                            <TableCell className="text-right">{d.volume.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">{fmt(d.nilai)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="bg-slate-50 font-bold text-xs">
                                                        <TableCell>Total</TableCell>
                                                        <TableCell className="text-right">{invoiceDetail.items.length} TM</TableCell>
                                                        <TableCell className="text-right">{invoiceDetail.items.reduce((s: number, i: any) => s + i.quantity, 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">{fmt(invoiceDetail.subtotal)}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Footer */}
                            <div className="bg-slate-50 rounded-lg p-4 space-y-1.5 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmt(invoiceDetail.subtotal)}</span></div>
                                {invoiceDetail.include_ppn && <div className="flex justify-between text-slate-500"><span>PPN</span><span>{fmt(invoiceDetail.tax_amount)}</span></div>}
                                <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total Tagihan</span><span>{fmt(invoiceDetail.total_amount)}</span></div>
                                <div className="flex justify-between text-green-700"><span>Terbayar</span><span>{fmt(invoiceDetail.paid_amount)}</span></div>
                                <div className={`flex justify-between font-bold ${invoiceDetail.total_amount - invoiceDetail.paid_amount > 0 ? "text-red-600" : "text-green-600"}`}>
                                    <span>Sisa</span><span>{fmt(invoiceDetail.total_amount - invoiceDetail.paid_amount)}</span>
                                </div>
                            </div>

                            {invoiceDetail.payments.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Riwayat Pembayaran</h3>
                                    <div className="space-y-2">
                                        {invoiceDetail.payments.map((p: any) => (
                                            <div key={p.id} className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="font-medium">{fmtDate(p.payment_date)} — {p.method}</div>
                                                        {p.reference_no && <div className="text-slate-500">Ref: {p.reference_no}</div>}
                                                        {p.notes && <div className="text-slate-500">{p.notes}</div>}
                                                        {p.proof_url && (
                                                            <a href={p.proof_url} target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 mt-1 text-blue-600 hover:underline">
                                                                📎 Lihat Bukti Bayar
                                                            </a>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-green-700 whitespace-nowrap">{fmt(p.amount)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 flex-wrap pt-2 border-t">
                                {invoiceDetail.status !== "PAID" && invoiceDetail.status !== "CANCELLED" && (
                                    <Button className="h-9" onClick={() => setShowPaymentDialog(true)}>
                                        <Plus className="w-4 h-4 mr-1.5" /> Catat Pembayaran
                                    </Button>
                                )}
                                <Button variant="outline" className="h-9" onClick={() => window.open(`/print/invoice/${invoiceDetail.id}`, "_blank")}>
                                    <Printer className="w-4 h-4 mr-1.5" /> Cetak
                                </Button>
                                {invoiceDetail.status !== "CANCELLED" && invoiceDetail.paid_amount === 0 && (
                                    <Button variant="outline" className="h-9 text-red-600 border-red-200 hover:bg-red-50" onClick={handleCancelInvoice}>
                                        <X className="w-4 h-4 mr-1.5" /> Batalkan
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>

            {/* ═══ RECORD PAYMENT DIALOG ═══════════════════════════════════════════ */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Catat Pembayaran</DialogTitle></DialogHeader>
                    {invoiceDetail && (
                        <div className="space-y-3">
                            <div className="bg-slate-50 rounded-lg p-3 text-sm">
                                <div className="text-slater-500">Sisa tagihan:</div>
                                <div className="text-xl font-bold text-red-600">{fmt(invoiceDetail.total_amount - invoiceDetail.paid_amount)}</div>
                            </div>
                            <div><Label className="text-xs">Jumlah Bayar (Rp)</Label>
                                <Input type="number" className="mt-1 h-9" placeholder="0"
                                    value={paymentForm.amount}
                                    onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} />
                            </div>
                            <div><Label className="text-xs">Metode</Label>
                                <Select value={paymentForm.method} onValueChange={v => setPaymentForm(f => ({ ...f, method: v }))}>
                                    <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="GIRO">Giro</SelectItem>
                                        <SelectItem value="DEPOSIT">Potong Deposito</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div><Label className="text-xs">No. Referensi Transfer</Label>
                                <Input className="mt-1 h-9" placeholder="XXXXXX"
                                    value={paymentForm.referenceNo}
                                    onChange={e => setPaymentForm(f => ({ ...f, referenceNo: e.target.value }))} />
                            </div>
                            <div><Label className="text-xs">Catatan</Label>
                                <Input className="mt-1 h-9"
                                    value={paymentForm.notes}
                                    onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>
                            <div>
                                <Label className="text-xs">Bukti Pembayaran (Foto/PDF)</Label>
                                <div className="mt-1">
                                    <label className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50">
                                        <span>📎</span>
                                        <span>{paymentForm.proofFile ? paymentForm.proofFile.name : "Pilih file (JPG, PNG, PDF — maks 5MB)"}</span>
                                        <input type="file" accept="image/*,application/pdf" className="hidden"
                                            onChange={e => {
                                                const f = e.target.files?.[0] ?? null
                                                setPaymentForm(prev => ({ ...prev, proofFile: f, proofUrl: "" }))
                                            }} />
                                    </label>
                                    {paymentForm.proofFile && (
                                        <button type="button" className="text-xs text-red-500 mt-1 hover:underline"
                                            onClick={() => setPaymentForm(f => ({ ...f, proofFile: null }))}>
                                            ✕ Hapus file
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Batal</Button>
                        <Button onClick={handleRecordPayment} disabled={paymentLoading || !paymentForm.amount}>
                            {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══ DEPOSIT DIALOG ══════════════════════════════════════════════════ */}
            <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Tambah Setoran Deposito</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        {depositTarget && <div className="text-sm text-slate-600 bg-slate-50 rounded p-2">{depositTarget.customerName} — {depositTarget.projectName}</div>}
                        <div><Label className="text-xs">Jumlah (Rp)</Label>
                            <Input type="number" className="mt-1 h-9"
                                value={depositForm.amount}
                                onChange={e => setDepositForm(f => ({ ...f, amount: e.target.value }))} />
                        </div>
                        <div><Label className="text-xs">Keterangan</Label>
                            <Input className="mt-1 h-9"
                                value={depositForm.description}
                                onChange={e => setDepositForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div><Label className="text-xs">Referensi</Label>
                            <Input className="mt-1 h-9"
                                value={depositForm.reference}
                                onChange={e => setDepositForm(f => ({ ...f, reference: e.target.value }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDepositDialog(false)}>Batal</Button>
                        <Button onClick={handleAddDeposit} disabled={depositLoading || !depositForm.amount || !depositForm.description}>
                            {depositLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
