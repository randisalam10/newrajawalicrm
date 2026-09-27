"use client"

import React, { useState, useEffect, useMemo, useTransition, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    ChevronDown, ChevronRight, AlertTriangle, Clock, CheckCircle2,
    FileText, Plus, Search, Loader2, Upload, Receipt, TrendingUp,
    Package, Tag, DollarSign, X, Eye, Printer, BarChart3,
    ImageIcon, Download, Check, Truck, Wrench, Paperclip,
    Percent, Scale, ShieldAlert
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { createInvoice, recordPayment, updatePaymentProof, cancelInvoice, cancelPayment, addDeposit, getInvoicesGroupedByCustomer, getUnbilledTransactions, getDepositSummary, getInvoiceDetail, getNextInvoiceSeq, getCustomerInvoiceSeq } from "./actions"
import { BillingDashboard } from "./billing-dashboard"
import { compressImage } from "@/lib/image-compress"

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

export function BillingClient({ initialData, locations, userRole, userLocationId, canManage = true }: {
    initialData: any, locations: any[], userRole: string, userLocationId: string, canManage?: boolean
}) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    const isCorporate = userRole === "SuperAdminBP" || ["CEO", "FVP", "Approver"].includes(userRole)
    const [data, setData] = useState(initialData)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState(!isCorporate && userLocationId ? userLocationId : "all")
    const [activeTab, setActiveTab] = useState("dashboard")

    // Unbilled state
    const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set())
    const [unbilledSearch, setUnbilledSearch] = useState("")
    const [unbilledTypeFilter, setUnbilledTypeFilter] = useState<"ALL" | "READYMIX" | "SEWA">("ALL")
    const [filterNoPriceOnly, setFilterNoPriceOnly] = useState(false)
    const [groupBy, setGroupBy] = useState<"flat" | "date" | "mutu" | "customer">("date")
    // Groups are collapsed / minimized by default (empty set).
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    // Invoice list state
    const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
    const [statusFilter, setStatusFilter] = useState("all")
    const [ppnFilter, setPpnFilter] = useState<"all" | "PPN" | "NON_PPN">("all")
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
    const UNBILLED_FLAT_PAGE_SIZE = 50
    const UNBILLED_GROUP_PAGE_SIZE = 15

    // Payment dialog & compression
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [paymentForm, setPaymentForm] = useState({ amount: "", method: "TRANSFER", referenceNo: "", notes: "", proofFile: null as File | null, proofUrl: "" })
    const [compressionInfo, setCompressionInfo] = useState<{ origSize: number; compSize: number; previewUrl: string } | null>(null)
    const [paymentLoading, setPaymentLoading] = useState(false)
    const [uploadingProofPaymentId, setUploadingProofPaymentId] = useState<string | null>(null)
    const [proofPreviewModalUrl, setProofPreviewModalUrl] = useState<string | null>(null)

    // Deposit state
    const [showDepositDialog, setShowDepositDialog] = useState(false)
    const [depositTarget, setDepositTarget] = useState<any>(null)
    const [depositForm, setDepositForm] = useState({ amount: "", description: "", reference: "" })
    const [depositLoading, setDepositLoading] = useState(false)

    // Cancel invoice state
    const [showCancelInvoiceDialog, setShowCancelInvoiceDialog] = useState(false)
    const [cancelInvoiceReason, setCancelInvoiceReason] = useState("")
    const [cancelInvoiceLoading, setCancelInvoiceLoading] = useState(false)

    // Cancel payment state
    const [cancelPaymentTarget, setCancelPaymentTarget] = useState<any>(null)
    const [cancelPaymentReason, setCancelPaymentReason] = useState("")
    const [cancelPaymentLoading, setCancelPaymentLoading] = useState(false)

    // Show/hide cancelled toggles
    const [showCancelledInvoices, setShowCancelledInvoices] = useState(false)
    const [showCancelledPayments, setShowCancelledPayments] = useState(false)

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
            getInvoicesGroupedByCustomer({ locationId: effectiveLocId, showCancelled: showCancelledInvoices }),
            getDepositSummary({ locationId: effectiveLocId }),
        ])
        setData((prev: any) => ({ ...prev, unbilled, grouped, deposits }))
        setIsLoading(false)
    }

    // ── Unbilled Pool ─────────────────────────────────────────────────────────
    const unbilled: any[] = data?.unbilled ?? []

    const noPriceTxCount = useMemo(() => {
        return unbilled.filter((tx: any) => {
            if (tx.itemType === "SEWA") {
                const val = tx.totalPrice || (tx.pricePerDay * (tx.totalDays || tx.volume_cubic || 0)) || 0
                return val <= 0
            }
            const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price || 0
            return !price || price <= 0
        }).length
    }, [unbilled])

    const filteredUnbilled = useMemo(() => {
        const q = unbilledSearch.toLowerCase().trim()
        return unbilled.filter(tx => {
            if (unbilledTypeFilter === "READYMIX" && tx.itemType === "SEWA") return false
            if (unbilledTypeFilter === "SEWA" && tx.itemType !== "SEWA") return false

            if (filterNoPriceOnly) {
                if (tx.itemType === "SEWA") {
                    const val = tx.totalPrice || (tx.pricePerDay * (tx.totalDays || tx.volume_cubic || 0)) || 0
                    if (val > 0) return false
                } else {
                    const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price || 0
                    if (price > 0) return false
                }
            }

            if (!q) return true
            const custName = (tx.customer?.customer_name || tx.project?.customer?.customer_name || "").toLowerCase()
            const projName = (tx.project?.name || tx.lokasi_proyek || "").toLowerCase()
            const mutuName = (tx.concreteQuality?.name || "").toLowerCase()
            const equipName = (tx.equipment?.nama_alat || "").toLowerCase()
            const operName = (tx.operator?.name || "").toLowerCase()
            const doNum = (tx.sewaNumber || "").toLowerCase()
            return custName.includes(q) || projName.includes(q) || mutuName.includes(q) || equipName.includes(q) || operName.includes(q) || doNum.includes(q)
        })
    }, [unbilled, unbilledSearch, unbilledTypeFilter, filterNoPriceOnly])

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
                const key = tx.customer?.id ?? tx.project?.customer?.id ?? "-"
                if (!map.has(key)) map.set(key, [])
                map.get(key)!.push(tx)
            }
            return Array.from(map.entries()).map(([key, items]) => ({
                key,
                label: items[0]?.customer?.customer_name ?? items[0]?.project?.customer?.customer_name ?? key,
                items,
            }))
        }
        // by mutu / alat
        const map = new Map<string, any[]>()
        for (const tx of filteredUnbilled) {
            const key = tx.itemType === "SEWA" ? (tx.equipment?.nama_alat ?? "Sewa Alat") : (tx.concreteQuality?.name ?? "-")
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(tx)
        }
        return Array.from(map.entries()).map(([key, items]) => ({ key, label: key, items }))
    }, [filteredUnbilled, groupBy])

    // Paginated groups or items for rendering
    const displayedGroups = useMemo(() => {
        if (groupBy === "flat") {
            const start = (unbilledPage - 1) * UNBILLED_FLAT_PAGE_SIZE
            const pagedItems = filteredUnbilled.slice(start, start + UNBILLED_FLAT_PAGE_SIZE)
            return [{ key: "all", label: "Semua", items: pagedItems }]
        }
        const start = (unbilledPage - 1) * UNBILLED_GROUP_PAGE_SIZE
        return groupedUnbilled.slice(start, start + UNBILLED_GROUP_PAGE_SIZE)
    }, [groupedUnbilled, filteredUnbilled, groupBy, unbilledPage])

    const selectedTxList = filteredUnbilled.filter(tx => selectedTxIds.has(tx.id))
    const selectedVolume = selectedTxList.filter((tx: any) => tx.itemType !== "SEWA").reduce((s: number, tx: any) => s + (tx.volume_cubic || 0), 0)
    const selectedDays = selectedTxList.filter((tx: any) => tx.itemType === "SEWA").reduce((s: number, tx: any) => s + (tx.totalDays || 0), 0)

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

    const isGroupExpanded = (key: string) => {
        // If user is searching, auto-expand so they see matches immediately
        if (unbilledSearch.trim().length > 0) return true
        return expandedGroups.has(key)
    }

    const toggleGroupExpand = (key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const allGroupKeys = useMemo(() => groupedUnbilled.map(g => g.key), [groupedUnbilled])
    const isAllExpanded = allGroupKeys.length > 0 && allGroupKeys.every(k => expandedGroups.has(k))
    const toggleExpandAll = () => {
        if (isAllExpanded) {
            setExpandedGroups(new Set())
        } else {
            setExpandedGroups(new Set(allGroupKeys))
        }
    }

    // Check if tx has price set for its mutu
    const hasMissingPrices = (txIds: string[]) => {
        return txIds.some(id => {
            const tx = unbilled.find(t => t.id === id)
            if (!tx) return false
            if (tx.itemType === "SEWA") return false // Sewa uses negotiated/direct tariff
            const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)
            return !price
        })
    }

    const handleCreateInvoice = async () => {
        if (selectedTxList.length === 0) return
        const isSewa = selectedTxList.some(tx => tx.itemType === "SEWA")
        const isMix = selectedTxList.some(tx => tx.itemType === "READYMIX")
        const isCombined = isSewa && isMix

        const firstTx = selectedTxList[0]
        const custId = firstTx.customerId || firstTx.customer?.id || firstTx.project?.customerId || firstTx.project?.customer?.id
        const allSameCustomer = selectedTxList.every(tx => {
            const cId = tx.customerId || tx.customer?.id || tx.project?.customerId || tx.project?.customer?.id
            return cId === custId
        })
        if (!allSameCustomer) {
            setCreateError("Pilih transaksi dari 1 customer yang sama.")
            return
        }

        // Validate ReadyMix pricing
        const readyMixTxIds = selectedTxList.filter(tx => tx.itemType === "READYMIX").map(tx => tx.id)
        if (readyMixTxIds.length > 0 && hasMissingPrices(readyMixTxIds)) {
            setCreateError("Ada mutu beton yang belum memiliki harga. Set harga di menu Customer terlebih dahulu.")
            return
        }

        setCreateError("")
        setCreateLoading(true)
        const res = await createInvoice({
            projectId: firstTx.projectId,
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

    const handleProofFileSelected = async (file: File | null) => {
        if (!file) {
            setPaymentForm(f => ({ ...f, proofFile: null, proofUrl: "" }))
            setCompressionInfo(null)
            return
        }

        if (file.type.startsWith("image/")) {
            try {
                const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 })
                const previewUrl = URL.createObjectURL(compressed)
                setCompressionInfo({
                    origSize: file.size,
                    compSize: compressed.size,
                    previewUrl,
                })
                setPaymentForm(f => ({ ...f, proofFile: compressed }))
            } catch {
                setPaymentForm(f => ({ ...f, proofFile: file }))
            }
        } else {
            setPaymentForm(f => ({ ...f, proofFile: file }))
            setCompressionInfo(null)
        }
    }

    const handleDirectProofUpload = async (paymentId: string, file: File) => {
        setUploadingProofPaymentId(paymentId)
        try {
            let fileToUpload = file
            if (file.type.startsWith("image/")) {
                fileToUpload = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 })
            }
            const fd = new FormData()
            fd.append("file", fileToUpload)
            fd.append("folder", "payments")
            const up = await fetch("/api/upload", { method: "POST", body: fd })
            const json = await up.json()
            if (json.url) {
                await updatePaymentProof(paymentId, json.url)
                if (invoiceDetail) {
                    const detail = await getInvoiceDetail(invoiceDetail.id)
                    setInvoiceDetail(detail)
                }
                await reload()
            }
        } catch (e: any) {
            console.error("Gagal mengunggah bukti bayar:", e)
        } finally {
            setUploadingProofPaymentId(null)
        }
    }

    const handleRecordPayment = async () => {
        if (!invoiceDetail) return
        setPaymentLoading(true)
        let proofUrl = paymentForm.proofUrl || undefined
        if (paymentForm.proofFile) {
            const fd = new FormData()
            fd.append("file", paymentForm.proofFile)
            fd.append("folder", "payments")
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
            setCompressionInfo(null)
            const detail = await getInvoiceDetail(invoiceDetail.id)
            setInvoiceDetail(detail)
            await reload()
        }
    }

    const handleCancelInvoice = async () => {
        if (!invoiceDetail) return
        if (!cancelInvoiceReason.trim()) return
        setCancelInvoiceLoading(true)
        await cancelInvoice(invoiceDetail.id, cancelInvoiceReason.trim())
        setCancelInvoiceLoading(false)
        setShowCancelInvoiceDialog(false)
        setCancelInvoiceReason("")
        setSelectedInvoice(null)
        await reload()
    }

    const handleCancelPayment = async () => {
        if (!cancelPaymentTarget || !cancelPaymentReason.trim()) return
        setCancelPaymentLoading(true)
        await cancelPayment(cancelPaymentTarget.id, cancelPaymentReason.trim())
        setCancelPaymentLoading(false)
        setCancelPaymentTarget(null)
        setCancelPaymentReason("")
        // Refresh invoice detail
        if (invoiceDetail) {
            const detail = await getInvoiceDetail(invoiceDetail.id)
            setInvoiceDetail(detail)
        }
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
        let totalPiutang = 0
        let totalInvoice = 0
        let ppnCount = 0
        let nonPpnCount = 0
        let ppnGross = 0
        let ppnPaid = 0
        let ppnPiutang = 0
        let nonPpnGross = 0
        let nonPpnPaid = 0
        let nonPpnPiutang = 0

        for (const cg of grouped) {
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
                        ppnPiutang += remaining
                    } else {
                        nonPpnCount++
                        nonPpnGross += inv.total_amount || 0
                        nonPpnPaid += inv.paid_amount || 0
                        nonPpnPiutang += remaining
                    }
                }
            }
        }

        const nonPpnPaidTaxLiability = nonPpnPaid * 0.11 // Kewajiban setor PPN 11% perusahaan atas kas masuk diterima
        const nonPpnGrossTaxLiability = nonPpnGross * 0.11 // Total potensi PPN 11% perusahaan

        return {
            totalPiutang,
            totalInvoice,
            ppnCount,
            nonPpnCount,
            ppnGross,
            ppnPaid,
            ppnPiutang,
            nonPpnGross,
            nonPpnPaid,
            nonPpnPiutang,
            nonPpnPaidTaxLiability,
            nonPpnGrossTaxLiability,
        }
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

                    const isPpn = inv.include_ppn === true || (inv.tax_amount || 0) > 0
                    let ppnMatch = true
                    if (ppnFilter === "PPN") ppnMatch = isPpn
                    else if (ppnFilter === "NON_PPN") ppnMatch = !isPpn

                    const searchMatch = !invoiceSearch ||
                        inv.invoice_number.toLowerCase().includes(loweredSearch) ||
                        pg.projectName.toLowerCase().includes(loweredSearch) ||
                        cg.customerName.toLowerCase().includes(loweredSearch)
                    if (statusMatch && ppnMatch && searchMatch) {
                        allInvs.push({
                            ...inv,
                            isPpn,
                            projectName: pg.projectName,
                            customerName: cg.customerName,
                            customerId: cg.customerId
                        })
                    }
                }
            }
        }
        allInvs.sort((a, b) => {
            const da = new Date(a.issue_date).getTime()
            const db = new Date(b.issue_date).getTime()
            return invoiceSort === "newest" ? db - da : da - db
        })
        return allInvs
    }, [data, statusFilter, ppnFilter, invoiceSearch, invoiceSort])


    if (!mounted) {
        return (
            <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                <span className="text-sm font-medium">Memuat Tagihan & Invoice...</span>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Location filter for SuperAdmin and Corporate */}
            {isCorporate && (
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

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-slate-100/80 p-1 rounded-lg">
                    <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="unbilled" className="flex items-center gap-1.5 text-xs">
                        <span>Unbilled Pool</span>
                        {unbilled.length > 0 && (
                            <span className="ml-1 bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.2 font-bold">{unbilled.length}</span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="flex items-center gap-1.5 text-xs">
                        <span>Invoice</span>
                        {invoiceSummary.totalInvoice > 0 && (
                            <span className="ml-1 bg-blue-600 text-white text-[10px] rounded-full px-1.5 py-0.2 font-bold">{invoiceSummary.totalInvoice}</span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="deposit" className="text-xs">
                        <span>Deposito</span>
                    </TabsTrigger>
                </TabsList>

                {/* ═══ TAB 0: DASHBOARD ═══════════════════════════════════════════════════ */}
                <TabsContent value="dashboard" className="mt-4">
                    <BillingDashboard
                        unbilled={unbilled}
                        groupedInvoices={data?.grouped ?? []}
                        deposits={data?.deposits ?? []}
                        locations={locations}
                        selectedLocation={selectedLocation}
                        onNavigateTab={(tab, filter) => {
                            setActiveTab(tab)
                            if (filter?.status) {
                                setStatusFilter(filter.status)
                            }
                            if (filter?.type) {
                                setUnbilledTypeFilter(filter.type)
                            }
                            if (filter?.ppnFilter) {
                                setPpnFilter(filter.ppnFilter)
                            }
                            if (filter?.noPriceOnly !== undefined) {
                                setFilterNoPriceOnly(filter.noPriceOnly)
                                if (filter.noPriceOnly) {
                                    setUnbilledTypeFilter("ALL")
                                }
                                setUnbilledPage(1)
                            }
                        }}
                        isCorporate={isCorporate}
                    />
                </TabsContent>

                {/* ═══ TAB 1: UNBILLED POOL ═══════════════════════════════════════════════ */}
                <TabsContent value="unbilled" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center gap-3 justify-between">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <CardTitle className="text-base">Transaksi Belum Ditagih (Unbilled)</CardTitle>
                                    {/* Type filter toggles */}
                                    <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-100 text-xs gap-0.5 shadow-2xs">
                                        <button
                                            type="button"
                                            className={`px-3 py-1 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${unbilledTypeFilter === "ALL" && !filterNoPriceOnly ? "bg-white font-bold text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}
                                            onClick={() => {
                                                setUnbilledTypeFilter("ALL")
                                                setFilterNoPriceOnly(false)
                                                setUnbilledPage(1)
                                            }}
                                        >
                                            <span>Semua</span>
                                            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px] font-mono">{unbilled.length}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`px-3 py-1 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${unbilledTypeFilter === "READYMIX" && !filterNoPriceOnly ? "bg-blue-600 font-bold text-white shadow-xs" : "text-slate-600 hover:text-blue-700"}`}
                                            onClick={() => {
                                                setUnbilledTypeFilter("READYMIX")
                                                setFilterNoPriceOnly(false)
                                                setUnbilledPage(1)
                                            }}
                                        >
                                            <Truck className="w-3.5 h-3.5" />
                                            <span>Cor ReadyMix</span>
                                            <span className={`${unbilledTypeFilter === "READYMIX" && !filterNoPriceOnly ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"} px-1.5 py-0.2 rounded-full text-[10px] font-mono`}>
                                                {unbilled.filter(t => t.itemType !== "SEWA").length}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`px-3 py-1 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${unbilledTypeFilter === "SEWA" && !filterNoPriceOnly ? "bg-purple-600 font-bold text-white shadow-xs" : "text-slate-600 hover:text-purple-700"}`}
                                            onClick={() => {
                                                setUnbilledTypeFilter("SEWA")
                                                setFilterNoPriceOnly(false)
                                                setUnbilledPage(1)
                                            }}
                                        >
                                            <Wrench className="w-3.5 h-3.5" />
                                            <span>Sewa Alat & CP</span>
                                            <span className={`${unbilledTypeFilter === "SEWA" && !filterNoPriceOnly ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"} px-1.5 py-0.2 rounded-full text-[10px] font-mono`}>
                                                {unbilled.filter(t => t.itemType === "SEWA").length}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`px-3 py-1 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${filterNoPriceOnly ? "bg-amber-600 font-bold text-white shadow-xs" : "text-amber-800 hover:text-amber-950"}`}
                                            onClick={() => {
                                                const next = !filterNoPriceOnly
                                                setFilterNoPriceOnly(next)
                                                if (next) setUnbilledTypeFilter("ALL")
                                                setUnbilledPage(1)
                                            }}
                                            title="Filter transaksi yang belum diset harganya di Master Proyek"
                                        >
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Belum Ada Harga</span>
                                            {noPriceTxCount > 0 && (
                                                <span className={`${filterNoPriceOnly ? "bg-white/20 text-white" : "bg-amber-200 text-amber-900"} px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold`}>
                                                    {noPriceTxCount}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                                        <Input
                                            className="pl-8 h-8 w-44 sm:w-52 text-xs"
                                            placeholder="Cari customer/proyek/alat..."
                                            value={unbilledSearch}
                                            onChange={e => setUnbilledSearch(e.target.value)}
                                        />
                                    </div>
                                    <Select value={groupBy} onValueChange={v => setGroupBy(v as any)}>
                                        <SelectTrigger className="h-8 w-40 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="flat">Flat List (Tanpa Grup)</SelectItem>
                                            <SelectItem value="date">Group by Tanggal</SelectItem>
                                            <SelectItem value="customer">Group by Customer</SelectItem>
                                            <SelectItem value="mutu">Group by Mutu / Alat</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {groupBy !== "flat" && groupedUnbilled.length > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs flex items-center gap-1.5 cursor-pointer text-slate-700 hover:bg-slate-100"
                                            onClick={toggleExpandAll}
                                            title={isAllExpanded ? "Ciutkan / minimize semua grup" : "Bentangkan semua grup"}
                                        >
                                            {isAllExpanded ? (
                                                <>
                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                                    <span>Ciutkan Semua</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                                                    <span>Buka Semua</span>
                                                </>
                                            )}
                                        </Button>
                                    )}
                                    {canManage && (
                                        <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer" onClick={selectAll}>
                                            {selectedTxIds.size === filteredUnbilled.length && filteredUnbilled.length > 0 ? "Batal Pilih" : "Pilih Semua"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredUnbilled.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
                                    <p className="text-sm">Tidak ada transaksi yang cocok</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                {canManage && (
                                                    <TableHead className="w-8 px-3">
                                                        <input type="checkbox"
                                                            checked={selectedTxIds.size === filteredUnbilled.length && filteredUnbilled.length > 0}
                                                            onChange={selectAll}
                                                            className="rounded cursor-pointer"
                                                        />
                                                    </TableHead>
                                                )}
                                                <TableHead className="text-xs">Tanggal</TableHead>
                                                <TableHead className="text-xs">Customer / Proyek</TableHead>
                                                <TableHead className="text-xs">Mutu / Alat</TableHead>
                                                <TableHead className="text-xs text-right">TM / Unit</TableHead>
                                                <TableHead className="text-xs text-right">Vol / Durasi</TableHead>
                                                <TableHead className="text-xs text-right">Tarif</TableHead>
                                                <TableHead className="text-xs text-right">Nilai</TableHead>
                                                <TableHead className="text-xs">Cabang/BP</TableHead>
                                                <TableHead className="text-xs">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {displayedGroups.map(group => {
                                                const isExpanded = isGroupExpanded(group.key)
                                                const readyMixItems = group.items.filter((i: any) => i.itemType !== "SEWA")
                                                const sewaItems = group.items.filter((i: any) => i.itemType === "SEWA")
                                                const rmVol = readyMixItems.reduce((s: number, tx: any) => s + (tx.volume_cubic || 0), 0)
                                                const sewaDays = sewaItems.reduce((s: number, tx: any) => s + (tx.totalDays || 0), 0)
                                                const groupSubtotal = group.items.reduce((s: number, tx: any) => {
                                                    if (tx.itemType === "SEWA") {
                                                        return s + (tx.totalPrice || (tx.pricePerDay * tx.totalDays) || 0)
                                                    }
                                                    const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price ?? 0
                                                    return s + (tx.volume_cubic * price)
                                                }, 0)

                                                return (
                                                    <React.Fragment key={group.key}>
                                                        {groupBy !== "flat" && (
                                                            <TableRow
                                                                className="bg-slate-100/75 hover:bg-slate-200/75 cursor-pointer select-none transition-colors border-y border-slate-200"
                                                                onClick={() => toggleGroupExpand(group.key)}
                                                            >
                                                                {canManage && (
                                                                    <TableCell className="px-3 w-8" onClick={e => e.stopPropagation()}>
                                                                        <input type="checkbox"
                                                                            checked={group.items.length > 0 && group.items.every((tx: any) => selectedTxIds.has(tx.id))}
                                                                            onChange={() => selectGroup(group.items)}
                                                                            className="rounded cursor-pointer"
                                                                        />
                                                                    </TableCell>
                                                                )}
                                                                <TableCell colSpan={canManage ? 9 : 9} className="py-2 text-xs">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="p-0.5 rounded text-slate-500">
                                                                                {isExpanded ? (
                                                                                    <ChevronDown className="w-4 h-4 text-blue-600" />
                                                                                ) : (
                                                                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                                                                )}
                                                                            </span>
                                                                            <span className="font-semibold text-slate-800">
                                                                                {groupBy === "date" ? `📅 ${group.label}` : groupBy === "customer" ? `👤 ${group.label}` : `🔷 ${group.label}`}
                                                                            </span>
                                                                            <span className="text-slate-500 font-normal">
                                                                                ({group.items.length} tx
                                                                                {rmVol > 0 ? ` · ${rmVol.toFixed(2)} m³` : ""}
                                                                                {sewaDays > 0 ? ` · ${sewaDays} hari sewa` : ""}
                                                                                {groupSubtotal > 0 ? ` · ${fmt(groupSubtotal)}` : ""})
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mr-2">
                                                                            {!isExpanded ? (
                                                                                <span className="text-[11px] text-slate-500 font-medium bg-slate-200/70 px-2 py-0.5 rounded">
                                                                                    Diciutkan (Klik untuk buka)
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[11px] text-slate-400 font-normal">
                                                                                    Klik baris untuk menciutkan
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        {isExpanded && group.items.map((tx: any) => {
                                                            const isSewa = tx.itemType === "SEWA"
                                                            const price = isSewa
                                                                ? tx.pricePerDay
                                                                : tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price
                                                            const hasNoPrice = isSewa
                                                                ? (!price && !tx.totalPrice)
                                                                : (!price || price <= 0)
                                                            const nilai = isSewa
                                                                ? (tx.totalPrice || (tx.pricePerDay * tx.totalDays))
                                                                : (price ? tx.volume_cubic * price : null)

                                                            return (
                                                                <TableRow
                                                                    key={tx.id}
                                                                    className={`text-xs ${canManage ? "cursor-pointer" : ""} ${selectedTxIds.has(tx.id) ? "bg-blue-50" : hasNoPrice ? "bg-amber-50/60 hover:bg-amber-100/60" : "hover:bg-slate-50/60"}`}
                                                                    onClick={() => canManage && toggleTx(tx.id)}
                                                                >
                                                                    {canManage && (
                                                                        <TableCell className="px-3">
                                                                            <input type="checkbox" checked={selectedTxIds.has(tx.id)} onChange={() => toggleTx(tx.id)} className="rounded cursor-pointer" onClick={e => e.stopPropagation()} />
                                                                        </TableCell>
                                                                    )}
                                                                    <TableCell className="whitespace-nowrap font-mono">{fmtDate(tx.date)}</TableCell>
                                                                    <TableCell>
                                                                        <div className="font-medium text-slate-800">
                                                                            {tx.customer?.customer_name || tx.project?.customer?.customer_name}
                                                                        </div>
                                                                        <div className="text-slate-400">
                                                                            {tx.project?.name || tx.lokasi_proyek || (isSewa ? "Sewa Alat" : "-")}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {isSewa ? (
                                                                            <div className="space-y-0.5">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="font-medium text-slate-800">{tx.equipment?.nama_alat}</span>
                                                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1 py-0 font-semibold">
                                                                                        Sewa
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="text-[11px] text-slate-400">
                                                                                    {tx.sewaNumber && <span className="font-mono text-slate-500 mr-1.5">{tx.sewaNumber}</span>}
                                                                                    {tx.operator?.name && `Op: ${tx.operator.name}`}
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <span>{tx.concreteQuality?.name}</span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-mono">
                                                                        {isSewa ? "1 Unit" : "1 TM"}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-mono font-medium">
                                                                        {isSewa ? `${tx.totalDays} Hari` : `${tx.volume_cubic.toFixed(2)} m³`}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-mono">
                                                                        {price ? (isSewa ? `${fmt(price)}/hr` : fmt(price)) : (
                                                                            <span className="inline-flex items-center gap-1 justify-end text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded font-semibold text-[10px]" title="Harga belum diset di Master Proyek">
                                                                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" /> Belum diset
                                                                            </span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-mono font-medium">{nilai ? fmt(nilai) : "-"}</TableCell>
                                                                    <TableCell>
                                                                        <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{tx.location?.name ?? "-"}</span>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {tx.status === "Pending"
                                                                            ? <span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" />Pending</span>
                                                                            : <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" />Confirmed</span>
                                                                        }
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        })}
                                                    </React.Fragment>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Pagination Bar for Unbilled */}
                            {filteredUnbilled.length > 0 && (
                                <PaginationBar
                                    page={unbilledPage}
                                    total={groupBy === "flat" ? filteredUnbilled.length : groupedUnbilled.length}
                                    perPage={groupBy === "flat" ? UNBILLED_FLAT_PAGE_SIZE : UNBILLED_GROUP_PAGE_SIZE}
                                    onPageChange={setUnbilledPage}
                                />
                            )}

                            {/* Sticky bottom bar */}
                            {canManage && selectedTxIds.size > 0 && (
                                <div className="sticky bottom-0 bg-blue-700 text-white px-4 py-3 flex items-center justify-between rounded-b-lg shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium">
                                            ☑ {selectedTxIds.size} transaksi dipilih
                                            {selectedVolume > 0 && selectedDays === 0 && ` · ${selectedVolume.toFixed(2)} m³`}
                                            {selectedDays > 0 && selectedVolume === 0 && ` · ${selectedDays} hari sewa`}
                                            {selectedVolume > 0 && selectedDays > 0 && ` · ${selectedVolume.toFixed(2)} m³ + ${selectedDays} hari`}
                                        </span>
                                        {selectedTxList.some(tx => tx.itemType === "SEWA") && selectedTxList.some(tx => tx.itemType === "READYMIX") && (
                                            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs border border-white/20 shadow-xs">
                                                ⚡ Siap Digabung: Invoice Terpadu (Cor + Sewa)
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        className="bg-white text-blue-700 hover:bg-blue-50 h-8 font-semibold cursor-pointer shadow-sm"
                                        onClick={async () => {
                                            const first = unbilled.find((t: any) => selectedTxIds.has(t.id))
                                            const custId = first?.customerId || first?.customer?.id || first?.project?.customerId || first?.project?.customer?.id
                                            if (custId) {
                                                const seq = await getCustomerInvoiceSeq(custId)
                                                setCustomerSeqDefault(seq)
                                                setInvoiceForm(f => ({ ...f, customerSeqOverride: String(seq) }))
                                            }
                                            setShowCreateDialog(true)
                                        }}
                                    >
                                        <FileText className="w-4 h-4 mr-1.5" />
                                        {selectedTxList.some(tx => tx.itemType === "SEWA") && selectedTxList.some(tx => tx.itemType === "READYMIX")
                                            ? "Buat Invoice Terpadu"
                                            : "Buat Invoice"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══ TAB 2: INVOICE LIST ═════════════════════════════════════════════════ */}
                <TabsContent value="invoices" className="mt-4 space-y-3">
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

                            {/* Alert Box for Non-PPN Tax Liability */}
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

                                {/* Dropdown Filter Pajak (PPN / Non-PPN) */}
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
                                onClick={async () => {
                                    const next = !showCancelledInvoices
                                    setShowCancelledInvoices(next)
                                    setIsLoading(true)
                                    const effectiveLocId = selectedLocation === "all" ? undefined : selectedLocation
                                    const grouped = await getInvoicesGroupedByCustomer({ locationId: effectiveLocId, showCancelled: next })
                                    setData((prev: any) => ({ ...prev, grouped }))
                                    setIsLoading(false)
                                }}
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
                                                const custNonPpnInvs = invs.filter((i: any) => !i.isPpn && i.status !== "CANCELLED")
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
                                                            const isPpn = inv.isPpn
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
                                                    {canManage && <TableHead className="w-24"></TableHead>}
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
                                                        {canManage && (
                                                            <TableCell>
                                                                <Button size="sm" variant="outline" className="h-7 text-xs"
                                                                    onClick={() => { setDepositTarget(dep); setShowDepositDialog(true) }}>
                                                                    <Plus className="w-3 h-3 mr-1" /> Setor
                                                                </Button>
                                                            </TableCell>
                                                        )}
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
                        const isSewa = selectedTxList.some(tx => tx.itemType === "SEWA")
                        const isMix = selectedTxList.some(tx => tx.itemType === "READYMIX")
                        const isCombined = isSewa && isMix
                        const firstTx = selectedTxList[0]
                        const proj = firstTx.project
                        const cust = firstTx.customer || proj?.customer
                        const custName = cust?.customer_name || "Customer"

                        // Auto-generate initials from customer name
                        const autoInitials = custName
                            .replace(/^(pt\.|pt|cv\.|cv|pak|bu)\s*/i, "")
                            .trim()
                            .split(/\s+/)
                            .map((w: string) => w[0]?.toUpperCase() ?? "")
                            .join("")
                            .slice(0, 4) || "XXX"

                        const displayInitials = invoiceForm.initialsOverride || autoInitials
                        const now = new Date()
                        const month = now.getMonth() + 1
                        const year = now.getFullYear()

                        const rmSubtotal = selectedTxList.filter((t: any) => t.itemType !== "SEWA").reduce((s: number, tx: any) => {
                            const price = proj?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price ?? 0
                            return s + tx.volume_cubic * price
                        }, 0)
                        const sewaSubtotal = selectedTxList.filter((t: any) => t.itemType === "SEWA").reduce((s: number, tx: any) => {
                            return s + (tx.totalPrice || (tx.pricePerDay * tx.totalDays) || 0)
                        }, 0)
                        const subtotal = rmSubtotal + sewaSubtotal
                        const rmTaxRate = (proj?.tax_ppn ?? 0) / 100
                        const sewaTaxRate = 0.11
                        const rmPpn = invoiceForm.includePpn ? rmSubtotal * rmTaxRate : 0
                        const sewaPpn = invoiceForm.includePpn ? sewaSubtotal * sewaTaxRate : 0
                        const ppnTotal = rmPpn + sewaPpn
                        const total = subtotal + ppnTotal

                        return (
                            <div className="space-y-4">
                                {isCombined ? (
                                    <div className="bg-gradient-to-r from-blue-50/70 to-purple-50/70 border border-indigo-200 rounded-lg p-3 text-sm space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="font-bold text-slate-900">{custName}</div>
                                            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px]">
                                                ⚡ Invoice Terpadu (Cor + Sewa)
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-100">
                                            <div className="bg-white/80 p-2 rounded border border-blue-100">
                                                <div className="font-semibold text-blue-900 flex items-center gap-1">
                                                    <Truck className="w-3.5 h-3.5" /> Cor ReadyMix
                                                </div>
                                                <div className="text-slate-600 text-[11px] mt-0.5">
                                                    {selectedTxList.filter((t: any) => t.itemType !== "SEWA").length} transaksi · {selectedVolume.toFixed(2)} m³
                                                </div>
                                            </div>
                                            <div className="bg-white/80 p-2 rounded border border-purple-100">
                                                <div className="font-semibold text-purple-900 flex items-center gap-1">
                                                    <Wrench className="w-3.5 h-3.5" /> Sewa Alat/CP
                                                </div>
                                                <div className="text-slate-600 text-[11px] mt-0.5">
                                                    {selectedTxList.filter((t: any) => t.itemType === "SEWA").length} transaksi · {selectedDays} hari sewa
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : isSewa ? (
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold text-purple-900">{custName}</div>
                                            <Badge className="bg-purple-600 text-white text-[10px]">Invoice Sewa Alat</Badge>
                                        </div>
                                        <div className="text-purple-700 text-xs">
                                            {firstTx.lokasi_proyek || proj?.name || "Penyewaan Alat & Kendaraan"}
                                        </div>
                                        <div className="text-slate-500 text-xs">
                                            {selectedTxList.length} transaksi sewa · {selectedDays} hari sewa
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                                        <div className="font-medium">{custName} — {proj?.name}</div>
                                        <div className="text-slate-500">{selectedTxList.length} transaksi · {selectedVolume.toFixed(2)} m³</div>
                                    </div>
                                )}

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
                                                    className="text-[10px] text-blue-500 hover:underline cursor-pointer"
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
                                            className="rounded cursor-pointer"
                                        />
                                        PPN {isCombined ? `Campuran (Cor: ${proj?.tax_ppn ?? 0}%, Sewa: 11%)` : isSewa ? "11%" : `${proj?.tax_ppn ?? 0}%`}
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
                                    {isCombined && (
                                        <>
                                            <div className="flex justify-between text-xs text-slate-600">
                                                <span>Subtotal ReadyMix ({selectedVolume.toFixed(2)} m³)</span>
                                                <span className="font-mono">{fmt(rmSubtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-600">
                                                <span>Subtotal Sewa Alat ({selectedDays} Hari)</span>
                                                <span className="font-mono">{fmt(sewaSubtotal)}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between"><span className="text-slate-600">Subtotal Tagihan</span><span className="font-mono font-medium">{fmt(subtotal)}</span></div>
                                    {invoiceForm.includePpn && <div className="flex justify-between text-slate-500"><span>PPN {isCombined ? "Campuran" : (isSewa ? "11%" : `${proj?.tax_ppn}%`)}</span><span className="font-mono">{fmt(ppnTotal)}</span></div>}
                                    <div className="flex justify-between font-bold border-t border-blue-200 pt-1 mt-1"><span>Total</span><span className="text-blue-700 font-mono">{fmt(total)}</span></div>
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

            {/* ═══ INVOICE DETAIL MODAL DIALOG ════════════════════════════════════════ */}
            <Dialog open={!!selectedInvoice} onOpenChange={open => { if (!open) setSelectedInvoice(null) }}>
                <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[88vh] overflow-y-auto p-0 z-50">
                    <DialogHeader className="p-4 pb-3 border-b bg-slate-50/80 sticky top-0 z-10">
                        <div className="flex items-center justify-between gap-3 mr-6">
                            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 font-mono flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <span>{invoiceDetail?.invoice_number ?? selectedInvoice?.invoice_number}</span>
                            </DialogTitle>
                            {invoiceDetail && (
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_CONFIG[invoiceDetail.status]?.color ?? ""}`}>
                                    {STATUS_CONFIG[invoiceDetail.status]?.label}
                                </span>
                            )}
                        </div>
                        {invoiceDetail && (
                            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                <span className="font-semibold text-slate-800">
                                    {invoiceDetail.customer?.customer_name || invoiceDetail.project?.customer?.customer_name}
                                </span>
                                <span>·</span>
                                <span>
                                    {invoiceDetail.invoice_type === "SEWA" ? "Kategori: " : "Proyek: "}
                                    <strong className="text-slate-700">{invoiceDetail.project?.name || "Penyewaan Alat & Kendaraan"}</strong>
                                </span>
                                <span>·</span>
                                <span>Terbit: {fmtDate(invoiceDetail.issue_date)}</span>
                                {invoiceDetail.due_date && (
                                    <>
                                        <span>·</span>
                                        <span className={new Date(invoiceDetail.due_date) < new Date() && invoiceDetail.status !== "PAID" ? "text-rose-600 font-bold" : ""}>
                                            Jatuh Tempo: {fmtDate(invoiceDetail.due_date)}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </DialogHeader>

                    {sheetLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                    ) : invoiceDetail ? (
                        <div className="p-5 space-y-4">
                            {/* Summary per date or items */}
                            {(() => {
                                const isSewaInvoice = invoiceDetail.invoice_type === "SEWA" || invoiceDetail.items.some((i: any) => i.item_type === "SEWA" || i.sewaTransaction)

                                if (isSewaInvoice) {
                                    return (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                                    Rincian Penyewaan Alat & Kendaraan
                                                </h3>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    {invoiceDetail.items.length} Item Sewa
                                                </span>
                                            </div>
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50 text-[11px]">
                                                            <TableHead className="text-xs">No. Transaksi / DO</TableHead>
                                                            <TableHead className="text-xs">Alat & Operator</TableHead>
                                                            <TableHead className="text-xs text-right">Durasi</TableHead>
                                                            <TableHead className="text-xs text-right">Tarif / Hari</TableHead>
                                                            <TableHead className="text-xs text-right">Nilai Tagihan</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {invoiceDetail.items.map((item: any) => {
                                                            const stx = item.sewaTransaction
                                                            return (
                                                                <TableRow key={item.id} className="text-xs hover:bg-slate-50/70">
                                                                    <TableCell className="font-mono">{stx?.sewa_number || item.description || "-"}</TableCell>
                                                                    <TableCell>
                                                                        <div className="font-medium text-slate-800">{stx?.equipment?.nama_alat || item.description}</div>
                                                                        {stx?.operator?.name && <div className="text-[11px] text-slate-400">Op: {stx.operator.name}</div>}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-mono">{item.quantity} Hari</TableCell>
                                                                    <TableCell className="text-right font-mono">{fmt(item.unit_price)}</TableCell>
                                                                    <TableCell className="text-right font-mono font-medium">{fmt(item.subtotal)}</TableCell>
                                                                </TableRow>
                                                            )
                                                        })}
                                                        <TableRow className="bg-slate-50 font-bold text-xs">
                                                            <TableCell colSpan={2}>Total Sewa</TableCell>
                                                            <TableCell className="text-right font-mono">{invoiceDetail.items.reduce((s: number, i: any) => s + i.quantity, 0)} Hari</TableCell>
                                                            <TableCell className="text-right font-mono">-</TableCell>
                                                            <TableCell className="text-right font-mono font-bold text-slate-900">{fmt(invoiceDetail.subtotal)}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )
                                }

                                const byDate = new Map<string, { tms: number; volume: number; nilai: number }>()
                                for (const item of invoiceDetail.items) {
                                    const itemDate = item.transaction?.date || item.sewaTransaction?.date || invoiceDetail.issue_date
                                    const key = itemDate ? format(new Date(itemDate), "yyyy-MM-dd") : "Lainnya"
                                    if (!byDate.has(key)) byDate.set(key, { tms: 0, volume: 0, nilai: 0 })
                                    const d = byDate.get(key)!
                                    d.tms += 1
                                    d.volume += item.quantity
                                    d.nilai += item.subtotal
                                }
                                return (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                                Ringkasan per Tanggal Kirim
                                            </h3>
                                            <span className="text-xs text-slate-500 font-mono">
                                                {invoiceDetail.items.length} Total Ritase TM
                                            </span>
                                        </div>
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50 text-[11px]">
                                                        <TableHead className="text-xs">Tanggal</TableHead>
                                                        <TableHead className="text-xs text-right">Total TM</TableHead>
                                                        <TableHead className="text-xs text-right">Kubikasi (m³)</TableHead>
                                                        <TableHead className="text-xs text-right">Nilai Tagihan</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {Array.from(byDate.entries()).map(([date, d]) => (
                                                        <TableRow key={date} className="text-xs hover:bg-slate-50/70">
                                                            <TableCell className="font-mono">{fmtDate(date)}</TableCell>
                                                            <TableCell className="text-right font-mono">{d.tms} TM</TableCell>
                                                            <TableCell className="text-right font-mono">{d.volume.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right font-mono font-medium">{fmt(d.nilai)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="bg-slate-50 font-bold text-xs">
                                                        <TableCell>Total Pengiriman</TableCell>
                                                        <TableCell className="text-right font-mono">{invoiceDetail.items.length} TM</TableCell>
                                                        <TableCell className="text-right font-mono">{invoiceDetail.items.reduce((s: number, i: any) => s + i.quantity, 0).toFixed(2)} m³</TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-slate-900">{fmt(invoiceDetail.subtotal)}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Financial Summary Box */}
                            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal Tagihan</span>
                                    <span className="font-mono font-medium">{fmt(invoiceDetail.subtotal)}</span>
                                </div>
                                {invoiceDetail.include_ppn ? (
                                    <div className="flex justify-between text-slate-600">
                                        <span>PPN (11%)</span>
                                        <span className="font-mono font-medium">{fmt(invoiceDetail.tax_amount)}</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center bg-amber-50 border border-amber-200 text-amber-900 rounded p-1.5 text-xs">
                                        <div className="flex items-center gap-1 font-semibold">
                                            <Percent className="w-3.5 h-3.5 text-amber-700" />
                                            <span>Faktur Non-PPN (Kewajiban Beban PPN 11% Perusahaan)</span>
                                        </div>
                                        <span className="font-mono font-bold">{fmt(invoiceDetail.total_amount * 0.11)}</span>
                                    </div>
                                )}
                                {!invoiceDetail.include_ppn && invoiceDetail.paid_amount > 0 && (
                                    <div className="flex justify-between items-center text-amber-900 bg-amber-100/80 border border-amber-300 rounded p-1.5 text-xs">
                                        <span className="font-bold">Wajib Disetor ke Kas Negara (11% Kas Masuk)</span>
                                        <span className="font-mono font-bold">{fmt(invoiceDetail.paid_amount * 0.11)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-sm border-t border-slate-200 pt-2 text-slate-900">
                                    <span>Total Tagihan</span>
                                    <span className="font-mono">{fmt(invoiceDetail.total_amount)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-700 font-semibold">
                                    <span>Sudah Terbayar</span>
                                    <span className="font-mono">{fmt(invoiceDetail.paid_amount)}</span>
                                </div>
                                <div className={`flex justify-between font-bold text-sm border-t border-dashed border-slate-200 pt-1.5 ${invoiceDetail.total_amount - invoiceDetail.paid_amount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                                    <span>Sisa Tagihan</span>
                                    <span className="font-mono">{fmt(invoiceDetail.total_amount - invoiceDetail.paid_amount)}</span>
                                </div>
                            </div>

                            {/* Riwayat Pembayaran */}
                            {invoiceDetail.payments.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                            Riwayat Pembayaran ({invoiceDetail.payments.length})
                                        </h3>
                                        {invoiceDetail.payments.some((p: any) => p.is_cancelled) && (
                                            <button
                                                onClick={() => setShowCancelledPayments(v => !v)}
                                                className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${showCancelledPayments
                                                        ? 'bg-red-50 border-red-200 text-red-600'
                                                        : 'bg-white border-slate-200 text-slate-500'
                                                    }`}
                                            >
                                                <Eye className="w-3 h-3" />
                                                {showCancelledPayments ? 'Sembunyikan Dibatal' : 'Tampilkan Dibatal'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {invoiceDetail.payments
                                            .filter((p: any) => showCancelledPayments || !p.is_cancelled)
                                            .map((p: any) => (
                                                <div key={p.id} className={`border rounded-lg px-3 py-2 text-xs ${p.is_cancelled
                                                        ? 'bg-red-50 border-red-100 opacity-70'
                                                        : 'bg-emerald-50/50 border-emerald-200'
                                                    }`}>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`font-semibold flex items-center gap-2 ${p.is_cancelled ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                                {fmtDate(p.payment_date)} — {p.method}
                                                                {p.is_cancelled && (
                                                                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold no-underline" style={{ textDecoration: 'none' }}>DIBATAL</span>
                                                                )}
                                                            </div>
                                                            {p.reference_no && <div className="text-slate-500 text-[11px]">No. Ref: {p.reference_no}</div>}
                                                            {p.notes && <div className="text-slate-500 text-[11px]">Catatan: {p.notes}</div>}
                                                            {p.is_cancelled && p.cancel_reason && (
                                                                <div className="text-rose-600 mt-0.5 text-[11px]">Alasan Batal: {p.cancel_reason}</div>
                                                            )}
                                                            {p.proof_url && !p.is_cancelled ? (
                                                                <div className="mt-1 flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setProofPreviewModalUrl(p.proof_url)}
                                                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-[11px] font-medium transition-colors cursor-pointer"
                                                                    >
                                                                        <Paperclip className="w-3 h-3 text-blue-500" />
                                                                        <span>Lihat Lampiran Bukti</span>
                                                                    </button>
                                                                </div>
                                                            ) : !p.is_cancelled && canManage && invoiceDetail.status !== "CANCELLED" ? (
                                                                <div className="mt-1">
                                                                    <label className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-[11px] font-medium transition-colors cursor-pointer">
                                                                        {uploadingProofPaymentId === p.id ? (
                                                                            <>
                                                                                <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                                                                                <span>Mengunggah...</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Upload className="w-3 h-3 text-amber-600" />
                                                                                <span>+ Unggah Bukti Bayar</span>
                                                                            </>
                                                                        )}
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*,application/pdf"
                                                                            className="hidden"
                                                                            disabled={uploadingProofPaymentId === p.id}
                                                                            onChange={e => {
                                                                                const f = e.target.files?.[0]
                                                                                if (f) handleDirectProofUpload(p.id, f)
                                                                            }}
                                                                        />
                                                                    </label>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className={`font-mono font-bold whitespace-nowrap ${p.is_cancelled ? 'text-slate-400 line-through' : 'text-emerald-700'
                                                                }`}>{fmt(p.amount)}</span>
                                                            {!p.is_cancelled && invoiceDetail.status !== "CANCELLED" && canManage && (
                                                                <button
                                                                    onClick={() => { setCancelPaymentTarget(p); setCancelPaymentReason("") }}
                                                                    className="text-red-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                                                                    title="Batalkan pembayaran ini"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions Bar */}
                            <div className="flex items-center justify-between gap-2 flex-wrap pt-3 border-t border-slate-200">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {canManage && invoiceDetail.status !== "PAID" && invoiceDetail.status !== "CANCELLED" && (
                                        <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" onClick={() => setShowPaymentDialog(true)}>
                                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Catat Pembayaran
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer" onClick={() => window.open(`/print/invoice/${invoiceDetail.id}`, "_blank")}>
                                        <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-600" /> Cetak Faktur
                                    </Button>
                                    {canManage && invoiceDetail.status !== "CANCELLED" && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                                            onClick={() => { setCancelInvoiceReason(""); setShowCancelInvoiceDialog(true) }}
                                        >
                                            <X className="w-3.5 h-3.5 mr-1.5" /> Batalkan Invoice
                                        </Button>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedInvoice(null)}
                                    className="h-8 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                                >
                                    Tutup
                                </Button>

                                {invoiceDetail.status === "CANCELLED" && invoiceDetail.cancel_reason && (
                                    <div className="w-full text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-3 py-2 mt-1">
                                        <strong>Alasan dibatalkan:</strong> {invoiceDetail.cancel_reason}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

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
                                        <span>{paymentForm.proofFile ? paymentForm.proofFile.name : "Pilih foto slip / PDF (otomatis dikompres)"}</span>
                                        <input type="file" accept="image/*,application/pdf" className="hidden"
                                            onChange={e => handleProofFileSelected(e.target.files?.[0] ?? null)} />
                                    </label>
                                    {paymentForm.proofFile && (
                                        <div className="mt-2 space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-600 truncate max-w-[200px]">{paymentForm.proofFile.name}</span>
                                                <button type="button" className="text-xs text-red-500 hover:underline"
                                                    onClick={() => handleProofFileSelected(null)}>
                                                    ✕ Hapus file
                                                </button>
                                            </div>
                                            {compressionInfo && (
                                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded p-2 text-[11px] text-emerald-800">
                                                    {compressionInfo.previewUrl && (
                                                        <img src={compressionInfo.previewUrl} alt="Preview" className="w-10 h-10 rounded object-cover border border-emerald-300 flex-shrink-0" />
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-emerald-900">Gambar Berhasil Dikompresi ✨</div>
                                                        <div className="text-[10px] text-emerald-700">
                                                            {(compressionInfo.origSize / 1024).toFixed(0)} KB → {(compressionInfo.compSize / 1024).toFixed(0)} KB
                                                            {compressionInfo.origSize > compressionInfo.compSize && (
                                                                <span className="font-bold ml-1 text-emerald-800">
                                                                    (hemat {Math.round((1 - compressionInfo.compSize / compressionInfo.origSize) * 100)}%)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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

            {/* ═══ CANCEL INVOICE DIALOG ══════════════════════════════════════════ */}
            <Dialog open={showCancelInvoiceDialog} onOpenChange={setShowCancelInvoiceDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle className="text-red-600">Batalkan Invoice</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        {invoiceDetail && (
                            <div className="bg-red-50 border border-red-100 rounded p-3 text-sm text-slate-700">
                                <div className="font-mono font-semibold">{invoiceDetail.invoice_number}</div>
                                <div className="text-slate-500">{invoiceDetail.project?.customer?.customer_name}</div>
                            </div>
                        )}
                        <div>
                            <Label className="text-xs text-red-700 font-semibold">Alasan Pembatalan <span className="text-red-500">*</span></Label>
                            <textarea
                                className="mt-1 w-full border border-red-200 rounded-md p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50"
                                rows={3}
                                placeholder="Tuliskan alasan pembatalan invoice ini..."
                                value={cancelInvoiceReason}
                                onChange={e => setCancelInvoiceReason(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-slate-400">Invoice tidak akan dihapus, hanya dinonaktifkan dan disembunyikan.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelInvoiceDialog(false)}>Batal</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleCancelInvoice}
                            disabled={cancelInvoiceLoading || !cancelInvoiceReason.trim()}
                        >
                            {cancelInvoiceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Batalkan Invoice"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══ CANCEL PAYMENT DIALOG ══════════════════════════════════════════ */}
            <Dialog open={!!cancelPaymentTarget} onOpenChange={open => { if (!open) setCancelPaymentTarget(null) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle className="text-red-600">Batalkan Pembayaran</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        {cancelPaymentTarget && (
                            <div className="bg-red-50 border border-red-100 rounded p-3 text-sm text-slate-700">
                                <div className="font-semibold text-green-700">{fmt(cancelPaymentTarget.amount)}</div>
                                <div className="text-slate-500">{fmtDate(cancelPaymentTarget.payment_date)} — {cancelPaymentTarget.method}</div>
                                {cancelPaymentTarget.reference_no && <div className="text-slate-400">Ref: {cancelPaymentTarget.reference_no}</div>}
                            </div>
                        )}
                        <div>
                            <Label className="text-xs text-red-700 font-semibold">Alasan Pembatalan <span className="text-red-500">*</span></Label>
                            <textarea
                                className="mt-1 w-full border border-red-200 rounded-md p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50"
                                rows={3}
                                placeholder="Tuliskan alasan pembatalan pembayaran ini..."
                                value={cancelPaymentReason}
                                onChange={e => setCancelPaymentReason(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-slate-400">Pembayaran tidak dihapus. Saldo invoice akan otomatis direcalculate.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelPaymentTarget(null)}>Batal</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleCancelPayment}
                            disabled={cancelPaymentLoading || !cancelPaymentReason.trim()}
                        >
                            {cancelPaymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Batalkan Pembayaran"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* ═══ PROOF PREVIEW LIGHTBOX DIALOG ═════════════════════════════════ */}
            <Dialog open={!!proofPreviewModalUrl} onOpenChange={open => { if (!open) setProofPreviewModalUrl(null) }}>
                <DialogContent className="max-w-2xl p-4">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold flex items-center justify-between">
                            <span>Bukti Pembayaran</span>
                            {proofPreviewModalUrl && (
                                <a
                                    href={proofPreviewModalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-normal"
                                >
                                    Buka di Tab Baru ↗
                                </a>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 flex flex-col items-center justify-center bg-slate-950 rounded-lg p-2 min-h-[300px] max-h-[70vh] overflow-hidden">
                        {proofPreviewModalUrl && (
                            proofPreviewModalUrl.toLowerCase().endsWith(".pdf") ? (
                                <iframe
                                    src={proofPreviewModalUrl}
                                    className="w-full h-[60vh] rounded border-0"
                                    title="Bukti Bayar PDF"
                                />
                            ) : (
                                <img
                                    src={proofPreviewModalUrl}
                                    alt="Bukti Pembayaran"
                                    className="max-h-[65vh] w-auto object-contain rounded"
                                />
                            )
                        )}
                    </div>
                    <div className="mt-3 flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => setProofPreviewModalUrl(null)}>
                            Tutup
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
