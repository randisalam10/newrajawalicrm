"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { 
    Search, CheckCircle, XCircle, Printer, Pencil, 
    ChevronLeft, ChevronRight, FilterX, Eye, Loader2,
    Building2, Store, Calendar, FileText, CheckCircle2,
    Clock, ShieldCheck, AlertCircle, ExternalLink, X,
    MapPin, CreditCard, ShieldAlert, Smartphone, Send
} from "lucide-react"
import { updatePoStatus, getPurchaseOrders, getPurchaseOrderById, submitPurchaseOrder } from "./actions"
import Link from "next/link"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const statusConfig: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 border border-slate-200" },
    SUBMITTED: { label: "Menunggu Approval", className: "bg-amber-50 text-amber-700 border border-amber-200" },
    APPROVED: { label: "Disetujui", className: "bg-green-50 text-green-700 border border-green-200" },
    REJECTED: { label: "Ditolak", className: "bg-red-50 text-red-700 border border-red-200" },
    CANCELLED: { label: "Dibatalkan", className: "bg-rose-50 text-rose-700 border border-rose-200" },
}

export function POListClient({ 
    initialData, 
    totalCount: initialTotal, 
    totalPages: initialTotalPages,
    userRole,
    companies,
    categories
}: { 
    initialData: any[], 
    totalCount: number,
    totalPages: number,
    userRole: string,
    companies: any[],
    categories: any[]
}) {
    const [orders, setOrders] = useState(initialData)
    const [totalCount, setTotalCount] = useState(initialTotal)
    const [totalPages, setTotalPages] = useState(initialTotalPages)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [companyId, setCompanyId] = useState("ALL")
    const [categoryId, setCategoryId] = useState("ALL")
    const [paymentMethod, setPaymentMethod] = useState("ALL")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [dateMode, setDateMode] = useState<"ALL" | "SPECIFIC" | "RANGE">("ALL")
    const [specificDate, setSpecificDate] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // Detail Dialog State
    const [selectedPoId, setSelectedPoId] = useState<string | null>(null)
    const [detailPo, setDetailPo] = useState<any | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState<string | null>(null)

    const canApprove = ['SuperAdminBP', 'CEO', 'FVP', 'AdminLogistik', 'Approver'].includes(userRole)
    const canManagePo = !['CEO', 'FVP', 'Approver'].includes(userRole) && ['SuperAdminBP', 'AdminLogistik', 'AdminBP'].includes(userRole)

    const fetchData = async (
        p: number, 
        s: string, 
        cid: string, 
        catid: string,
        pm: string,
        st: string,
        dm: "ALL" | "SPECIFIC" | "RANGE",
        sd: string,
        ed: string,
        spDate: string
    ) => {
        setIsLoading(true)
        try {
            let startArg: string | undefined = undefined
            let endArg: string | undefined = undefined

            if (dm === "SPECIFIC" && spDate) {
                startArg = spDate
                endArg = spDate
            } else if (dm === "RANGE") {
                startArg = sd || undefined
                endArg = ed || undefined
            }

            const result = await getPurchaseOrders({
                page: p,
                pageSize: 10,
                search: s || undefined,
                companyGroupId: cid === "ALL" ? undefined : cid,
                categoryId: catid === "ALL" ? undefined : catid,
                paymentMethod: pm === "ALL" ? undefined : pm,
                status: st === "ALL" ? undefined : st,
                startDate: startArg,
                endDate: endArg,
            })
            setOrders(result.orders)
            setTotalCount(result.totalCount)
            setTotalPages(result.totalPages)
        } catch (error) {
            console.error("Fetch orders error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            fetchData(page, search, companyId, categoryId, paymentMethod, statusFilter, dateMode, startDate, endDate, specificDate)
        }, 350)
        return () => clearTimeout(timeout)
    }, [page, search, companyId, categoryId, paymentMethod, statusFilter, dateMode, startDate, endDate, specificDate])

    const resetFilters = () => {
        setSearch("")
        setCompanyId("ALL")
        setCategoryId("ALL")
        setPaymentMethod("ALL")
        setStatusFilter("ALL")
        setDateMode("ALL")
        setSpecificDate("")
        setStartDate("")
        setEndDate("")
        setPage(1)
    }

    const hasActiveFilters = search || companyId !== "ALL" || categoryId !== "ALL" || paymentMethod !== "ALL" || statusFilter !== "ALL" || dateMode !== "ALL"

    const openDetail = async (id: string) => {
        setSelectedPoId(id)
        setDetailLoading(true)
        setDetailError(null)
        try {
            const res = await getPurchaseOrderById(id)
            if (res.success && res.data) {
                setDetailPo(res.data)
            } else {
                setDetailError(res.error || "Gagal memuat rincian PO")
            }
        } catch (err: any) {
            console.error("Failed to load PO detail", err)
            setDetailError(err?.message || "Terjadi kesalahan saat memuat data")
        } finally {
            setDetailLoading(false)
        }
    }

    return (
        <div className="space-y-3.5 p-4">
            {/* ── FILTER & SEARCH SECTION ── */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-2.5 shadow-2xs">
                {/* Baris 1: Search & Filter Utama */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Cari no PO, nama barang, supplier, proyek..."
                            className="pl-8 text-xs h-8 bg-white border-slate-200"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    {/* Perusahaan */}
                    <Select value={companyId} onValueChange={v => { setCompanyId(v); setPage(1); }}>
                        <SelectTrigger className="w-[170px] text-xs h-8 bg-white border-slate-200">
                            <SelectValue placeholder="Semua Perusahaan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="text-xs">Semua Perusahaan</SelectItem>
                            {companies.map(c => (
                                <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Kategori */}
                    <Select value={categoryId} onValueChange={v => { setCategoryId(v); setPage(1); }}>
                        <SelectTrigger className="w-[145px] text-xs h-8 bg-white border-slate-200">
                            <SelectValue placeholder="Semua Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="text-xs">Semua Kategori</SelectItem>
                            {categories.map(c => (
                                <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Metode Pembayaran: Tunai / Kredit */}
                    <Select value={paymentMethod} onValueChange={v => { setPaymentMethod(v); setPage(1); }}>
                        <SelectTrigger className="w-[135px] text-xs h-8 bg-white border-slate-200">
                            <SelectValue placeholder="Pembayaran" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="text-xs">Semua Bayar</SelectItem>
                            <SelectItem value="CASH" className="text-xs">Tunai (Cash)</SelectItem>
                            <SelectItem value="CREDIT" className="text-xs">Kredit (Tempo)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Status Approval */}
                    <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-[145px] text-xs h-8 bg-white border-slate-200">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                            <SelectItem value="SUBMITTED" className="text-xs">Menunggu Approval</SelectItem>
                            <SelectItem value="APPROVED" className="text-xs">Disetujui</SelectItem>
                            <SelectItem value="DRAFT" className="text-xs">Draft (Belum Diajukan)</SelectItem>
                            <SelectItem value="REJECTED" className="text-xs">Ditolak</SelectItem>
                            <SelectItem value="CANCELLED" className="text-xs">Dibatalkan</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Buat PO Baru */}
                    {canManagePo && (
                        <div className="ml-auto shrink-0">
                            <Link href="/logistik/po/create">
                                <Button size="sm" className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs font-medium">
                                    <span>+ Buat PO Baru</span>
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Baris 2: Filter Tanggal & Reset */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs mr-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Filter Tanggal:</span>
                    </div>

                    <Select value={dateMode} onValueChange={(v: "ALL" | "SPECIFIC" | "RANGE") => { setDateMode(v); setPage(1); }}>
                        <SelectTrigger className="w-[145px] text-xs h-7 bg-white border-slate-200">
                            <SelectValue placeholder="Mode Tanggal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="text-xs">Semua Waktu</SelectItem>
                            <SelectItem value="SPECIFIC" className="text-xs">Tanggal Spesifik</SelectItem>
                            <SelectItem value="RANGE" className="text-xs">Rentang Tanggal</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Tanggal Spesifik Input */}
                    {dateMode === "SPECIFIC" && (
                        <div className="flex items-center gap-1.5">
                            <Input
                                type="date"
                                className="h-7 text-xs w-[140px] bg-white border-slate-200 py-0.5 px-2"
                                value={specificDate}
                                onChange={e => { setSpecificDate(e.target.value); setPage(1); }}
                                title="Pilih Tanggal Spesifik"
                            />
                        </div>
                    )}

                    {/* Rentang Tanggal Inputs */}
                    {dateMode === "RANGE" && (
                        <div className="flex items-center gap-1.5">
                            <Input
                                type="date"
                                className="h-7 text-xs w-[135px] bg-white border-slate-200 py-0.5 px-2"
                                value={startDate}
                                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                                title="Dari Tanggal"
                            />
                            <span className="text-slate-400 text-xs">s/d</span>
                            <Input
                                type="date"
                                className="h-7 text-xs w-[135px] bg-white border-slate-200 py-0.5 px-2"
                                value={endDate}
                                onChange={e => { setEndDate(e.target.value); setPage(1); }}
                                title="Sampai Tanggal"
                            />
                        </div>
                    )}

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1 ml-1">
                        <button
                            type="button"
                            onClick={() => {
                                setDateMode("SPECIFIC")
                                setSpecificDate(new Date().toISOString().split('T')[0])
                                setPage(1)
                            }}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200/70 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                            Hari Ini
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date()
                                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
                                setDateMode("RANGE")
                                setStartDate(firstDay)
                                setEndDate(lastDay)
                                setPage(1)
                            }}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200/70 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                            Bulan Ini
                        </button>
                    </div>

                    {/* Reset Button */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            title="Reset Semua Filter"
                            className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 gap-1 ml-auto"
                        >
                            <FilterX className="w-3.5 h-3.5" />
                            <span>Reset Filter</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* ── COMPACT PO TABLE ── */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden relative shadow-2xs">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                                <TableHead className="py-2.5 px-3 w-[150px]">Nomor PO</TableHead>
                                <TableHead className="py-2.5 px-3 min-w-[170px]">Perusahaan & Proyek</TableHead>
                                <TableHead className="py-2.5 px-3 min-w-[130px]">Supplier</TableHead>
                                <TableHead className="py-2.5 px-3 w-[100px]">Tgl Dibuat</TableHead>
                                <TableHead className="py-2.5 px-3 w-[110px]">Tgl Approve</TableHead>
                                <TableHead className="py-2.5 px-3 w-[85px] text-center">Jml Item</TableHead>
                                <TableHead className="py-2.5 px-3 w-[80px] text-center">Bayar</TableHead>
                                <TableHead className="py-2.5 px-3 w-[125px] text-center">Status</TableHead>
                                <TableHead className="py-2.5 px-3 w-[120px] text-right">Total Nilai</TableHead>
                                <TableHead className="py-2.5 px-3 w-[110px] text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center text-muted-foreground h-28 text-xs">
                                        {hasActiveFilters
                                            ? "Tidak ada PO yang cocok dengan filter / pencarian yang dipilih." 
                                            : "Belum ada data Purchase Order."}
                                    </TableCell>
                                </TableRow>
                            )}
                            {orders.map((po) => {
                                const total = po.items?.reduce((acc: number, item: any) => acc + item.subtotal, 0) ?? 0
                                const itemCount = po.items?.length || 0
                                const totalQty = po.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) ?? 0
                                const approvedDate = po.ceoApprovedAt || po.fvpApprovedAt || (po.status === 'APPROVED' ? po.updatedAt : null)

                                let cfg = statusConfig[po.status] ?? statusConfig.DRAFT
                                
                                if (po.status === 'SUBMITTED') {
                                    let required = 0
                                    let approved = 0
                                    if (po.ceoId) required++
                                    if (po.fvpId) required++
                                    if (po.ceoApprovedAt) approved++
                                    if (po.fvpApprovedAt) approved++

                                    if (required > 0) {
                                        const pending = required - approved
                                        if (pending > 0) {
                                            cfg = { 
                                                label: `Menunggu (${pending})`, 
                                                className: pending === 2 ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-blue-50 text-blue-700 border border-blue-200" 
                                            }
                                        } else {
                                            cfg = { label: "Disetujui", className: "bg-green-50 text-green-700 border border-green-200" }
                                        }
                                    } else {
                                        cfg = { label: "Menunggu Approval", className: "bg-amber-50 text-amber-700 border border-amber-200" }
                                    }
                                } else if (po.status === 'DRAFT') {
                                    cfg = { label: "Draft", className: "bg-slate-100 text-slate-700 border border-slate-200" }
                                } else if (po.status === 'APPROVED') {
                                    cfg = { label: "Disetujui", className: "bg-green-50 text-green-700 border border-green-200" }
                                } else if (po.status === 'REJECTED') {
                                    cfg = { label: "Ditolak", className: "bg-red-50 text-red-700 border border-red-200" }
                                } else if (po.status === 'CANCELLED') {
                                    cfg = { label: "Dibatalkan", className: "bg-rose-50 text-rose-700 border border-rose-200" }
                                }

                                return (
                                    <TableRow key={po.id} className="hover:bg-slate-50/75 transition-colors border-b border-slate-100 text-xs">
                                        {/* 1. Nomor PO */}
                                        <TableCell className="py-2 px-3">
                                            <div 
                                                className="font-mono font-bold text-xs text-blue-600 hover:text-blue-800 cursor-pointer hover:underline inline-block"
                                                onClick={() => openDetail(po.id)} 
                                                title="Klik untuk melihat detail PO"
                                            >
                                                {po.po_number}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                                {po.category?.name}
                                            </div>
                                        </TableCell>

                                        {/* 2. Perusahaan & Proyek */}
                                        <TableCell className="py-2 px-3 max-w-[180px]">
                                            <div className="font-medium text-slate-800 truncate leading-tight" title={po.companyGroup?.name}>
                                                {po.companyGroup?.name}
                                            </div>
                                            <div className="text-[11px] text-slate-500 truncate leading-tight mt-0.5" title={po.proyek_nama || "-"}>
                                                {po.proyek_nama || "-"}
                                            </div>
                                        </TableCell>

                                        {/* 3. Supplier */}
                                        <TableCell className="py-2 px-3 max-w-[140px]">
                                            <div className="text-slate-800 truncate leading-tight font-medium" title={po.supplier_nama || "-"}>
                                                {po.supplier_nama || "-"}
                                            </div>
                                        </TableCell>

                                        {/* 4. Tgl Dibuat */}
                                        <TableCell className="py-2 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                                            {po.tanggal_terbit 
                                                ? new Date(po.tanggal_terbit).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : "-"
                                            }
                                        </TableCell>

                                        {/* 5. Tgl Approve */}
                                        <TableCell className="py-2 px-3 whitespace-nowrap text-[11px]">
                                            {approvedDate ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-emerald-700 font-medium inline-flex items-center gap-1" title={`Disetujui: ${new Date(approvedDate).toLocaleString('id-ID')}`}>
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                                        {new Date(approvedDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    {po.isBypassed ? (
                                                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 rounded px-1 py-0.2 w-fit inline-flex items-center gap-0.5" title={`Bypass Admin: ${po.approvedBy?.employee?.name || po.approvedBy?.username || 'Admin'}`}>
                                                            <ShieldAlert className="w-2.5 h-2.5 text-amber-600" /> Bypass Admin
                                                        </span>
                                                    ) : po.approvalChannel === 'MOBILE' ? (
                                                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded px-1 py-0.2 w-fit inline-flex items-center gap-0.5" title="Disetujui via Mobile Pimpinan">
                                                            <Smartphone className="w-2.5 h-2.5 text-emerald-600" /> Mobile
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-mono text-[11px]">-</span>
                                            )}
                                        </TableCell>

                                        {/* 6. Jml Item */}
                                        <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                                            <span className="font-semibold text-slate-800">{itemCount}</span>
                                            <span className="text-[10px] text-slate-400 ml-1">({totalQty})</span>
                                        </TableCell>

                                        {/* 7. Bayar */}
                                        <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${
                                                po.metode_pembayaran === 'CASH'
                                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {po.metode_pembayaran === 'CASH' ? 'Tunai' : 'Kredit'}
                                            </span>
                                        </TableCell>

                                        {/* 8. Status */}
                                        <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                                                {cfg.label}
                                            </span>
                                        </TableCell>

                                        {/* 9. Total Nilai */}
                                        <TableCell className="py-2 px-3 text-right font-mono font-bold text-xs text-slate-900 whitespace-nowrap">
                                            Rp {total.toLocaleString('id-ID')}
                                        </TableCell>

                                        {/* 10. Aksi */}
                                        <TableCell className="py-2 px-3 text-center">
                                            <div className="flex items-center justify-center gap-0.5">
                                                {/* Detail Button */}
                                                <Button
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-blue-50" 
                                                    title="Lihat Detail PO"
                                                    onClick={() => openDetail(po.id)}
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>

                                                {/* Print Button */}
                                                {po.status === "APPROVED" && (
                                                    <Link href={`/print/po/${po.id}`} target="_blank">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-blue-50" title="Cetak PO">
                                                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                                                        </Button>
                                                    </Link>
                                                )}

                                                {/* Submit / Ajukan Button for DRAFT */}
                                                {canManagePo && po.status === "DRAFT" && (
                                                    <Button
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-7 w-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50" 
                                                        title="Ajukan PO untuk Persetujuan"
                                                        onClick={async () => {
                                                            if (!confirm(`Ajukan PO "${po.po_number}" untuk persetujuan pimpinan / approver?`)) return
                                                            const res = await submitPurchaseOrder(po.id)
                                                            if (res.success) {
                                                                fetchData(page, search, companyId, categoryId, paymentMethod, statusFilter, dateMode, startDate, endDate, specificDate)
                                                            } else {
                                                                alert(`Gagal mengajukan: ${res.error}`)
                                                            }
                                                        }}
                                                    >
                                                        <Send className="w-3.5 h-3.5 text-blue-600" />
                                                    </Button>
                                                )}

                                                {/* Edit Button */}
                                                {canManagePo && (po.status === "DRAFT" || po.status === "SUBMITTED") && (
                                                    <Link href={`/logistik/po/${po.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-blue-50" title="Edit PO">
                                                            <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                                        </Button>
                                                    </Link>
                                                )}

                                                {/* Approve Button (Only for SUBMITTED, never DRAFT) */}
                                                {po.status === "SUBMITTED" && canApprove && (
                                                    <Button
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-7 w-7 hover:bg-green-50 text-green-600 hover:text-green-800" 
                                                        title="Setujui PO (Bypass Administratif)"
                                                        onClick={async () => {
                                                            if (!confirm(`Setujui PO "${po.po_number}" sebagai ${userRole}?`)) return
                                                            const res = await updatePoStatus(po.id, "APPROVED")
                                                            if (res.success) {
                                                                fetchData(page, search, companyId, categoryId, paymentMethod, statusFilter, dateMode, startDate, endDate, specificDate)
                                                            } else {
                                                                alert(`Gagal: ${res.error}`)
                                                            }
                                                        }}
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                                    </Button>
                                                )}

                                                {/* Cancel / Reject Button */}
                                                {po.status !== "CANCELLED" && po.status !== "REJECTED" && canApprove && (
                                                    <Button
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-7 w-7 hover:bg-red-50 text-red-500 hover:text-red-700" 
                                                        title="Batalkan / Tolak PO"
                                                        onClick={async () => {
                                                            const reason = prompt("Masukkan alasan pembatalan / penolakan:")
                                                            if (reason === null) return
                                                            const res = await updatePoStatus(po.id, "CANCELLED", { notes: reason })
                                                            if (res.success) {
                                                                fetchData(page, search, companyId, categoryId, paymentMethod, statusFilter, dateMode, startDate, endDate, specificDate)
                                                            } else {
                                                                alert(`Gagal: ${res.error}`)
                                                            }
                                                        }}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <div className="text-xs text-slate-500">
                    Menampilkan <span className="font-semibold text-slate-800">{orders.length}</span> dari <span className="font-semibold text-slate-800">{totalCount}</span> PO
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                        className="gap-1 h-8 text-xs"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
                    </Button>
                    <div className="text-xs font-medium text-slate-700">
                        Halaman {page} dari {totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || isLoading}
                        className="gap-1 h-8 text-xs"
                    >
                        Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* ── DETAIL MODAL DIALOG ── */}
            <Dialog open={!!selectedPoId} onOpenChange={(open) => { if (!open) { setSelectedPoId(null); setDetailPo(null); setDetailError(null); } }}>
                <DialogContent 
                    showCloseButton={false}
                    className="!max-w-5xl sm:!max-w-5xl md:!max-w-5xl lg:!max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xl bg-white"
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>Detail Purchase Order</DialogTitle>
                        <DialogDescription>Rincian data dan barang Purchase Order</DialogDescription>
                    </DialogHeader>

                    {detailLoading && (
                        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
                            <span className="text-sm font-medium text-slate-600">Memuat rincian Purchase Order...</span>
                        </div>
                    )}

                    {!detailLoading && detailError && (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 px-6">
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-800">Gagal Memuat Detail PO</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm">{detailError}</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button size="sm" variant="outline" className="text-xs" onClick={() => selectedPoId && openDetail(selectedPoId)}>
                                    Coba Lagi
                                </Button>
                                <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setSelectedPoId(null); setDetailPo(null); setDetailError(null); }}>
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    )}

                    {!detailLoading && !detailError && !detailPo && (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
                            <p className="text-sm">Data Purchase Order tidak ditemukan atau telah dihapus.</p>
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => { setSelectedPoId(null); setDetailPo(null); }}>
                                Tutup
                            </Button>
                        </div>
                    )}

                    {!detailLoading && detailPo && (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* ── Top Header Bar ── */}
                            <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-mono font-bold text-lg text-slate-900 tracking-tight">{detailPo.po_number}</span>
                                        <Badge variant="outline" className={`text-xs px-2.5 py-0.5 border font-semibold ${
                                            detailPo.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                            detailPo.status === 'CANCELLED' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                                            'bg-amber-50 text-amber-800 border-amber-300'
                                        }`}>
                                            {detailPo.status === 'APPROVED' ? 'Disetujui' : detailPo.status === 'CANCELLED' ? 'Dibatalkan' : 'Draft'}
                                        </Badge>
                                        <Badge variant="secondary" className="text-[11px] font-medium bg-slate-200/80 text-slate-700">
                                            {detailPo.category?.name}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        Diterbitkan: {new Date(detailPo.tanggal_terbit).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        {detailPo.location?.name && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-slate-600 font-medium">{detailPo.location.name}</span>
                                            </>
                                        )}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link href={`/logistik/po/${detailPo.id}`} target="_blank">
                                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-200 hover:bg-slate-100 font-medium">
                                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Halaman Penuh</span>
                                        </Button>
                                    </Link>
                                    {detailPo.status === "APPROVED" && (
                                        <Link href={`/print/po/${detailPo.id}`} target="_blank">
                                            <Button size="sm" className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs">
                                                <Printer className="w-3.5 h-3.5" />
                                                <span>Cetak PO</span>
                                            </Button>
                                        </Link>
                                    )}
                                    {detailPo.status === "DRAFT" && (
                                        <Link href={`/logistik/po/${detailPo.id}/edit`}>
                                            <Button size="sm" className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs">
                                                <Pencil className="w-3.5 h-3.5" />
                                                <span>Edit PO</span>
                                            </Button>
                                        </Link>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 ml-1"
                                        onClick={() => { setSelectedPoId(null); setDetailPo(null); setDetailError(null); }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* ── Scrollable Body ── */}
                            <div className="px-6 py-5 overflow-y-auto space-y-5 flex-1 max-h-[calc(90vh-130px)]">
                                {/* 3 Mini Information Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                    {/* Card 1: Perusahaan & Proyek */}
                                    <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 text-xs space-y-2.5">
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                                            <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-blue-700">
                                                <Building2 className="w-3 h-3" />
                                            </div>
                                            <span>Perusahaan & Proyek</span>
                                        </div>
                                        <div className="space-y-1.5 pt-0.5">
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-medium">Perusahaan:</span>
                                                <span className="font-semibold text-slate-900 block leading-tight">{detailPo.companyGroup?.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-medium">Proyek:</span>
                                                <span className="text-slate-700 font-medium block leading-tight">{detailPo.project?.name || "-"}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                                <span className="text-slate-500 text-[11px]">Pembayaran:</span>
                                                <span className="font-semibold text-slate-800 text-[11px]">
                                                    {detailPo.metode_pembayaran === 'CASH' ? 'Tunai / Cash' : 'Kredit / Tempo'}
                                                </span>
                                            </div>
                                            {detailPo.km_hm_kendaraan && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500 text-[11px]">KM / HM:</span>
                                                    <span className="font-mono font-medium text-slate-800 text-[11px]">{detailPo.km_hm_kendaraan}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card 2: Rekanan / Supplier */}
                                    <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 text-xs space-y-2.5">
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                                            <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700">
                                                <Store className="w-3 h-3" />
                                            </div>
                                            <span>Rekanan / Supplier</span>
                                        </div>
                                        <div className="space-y-1.5 pt-0.5">
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-medium">Nama Supplier:</span>
                                                <span className="font-semibold text-slate-900 block leading-tight">{detailPo.supplier?.name || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-medium">Kontak / Telepon:</span>
                                                <span className="text-slate-700 block font-medium leading-tight">{detailPo.supplier?.contact || "-"}</span>
                                            </div>
                                            {(detailPo.pic_name || detailPo.pic_phone) && (
                                                <div className="pt-1 border-t border-slate-200/60">
                                                    <span className="text-slate-400 block text-[10px] uppercase font-medium">PIC Lapangan:</span>
                                                    <span className="text-slate-800 font-medium block leading-tight">
                                                        {detailPo.pic_name} {detailPo.pic_phone ? `(${detailPo.pic_phone})` : ""}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card 3: Otorisasi & Persetujuan */}
                                    <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 text-xs space-y-2.5">
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                                            <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700">
                                                <ShieldCheck className="w-3 h-3" />
                                            </div>
                                            <span>Otorisasi & Tanda Tangan</span>
                                        </div>
                                        <div className="space-y-1.5 pt-0.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 text-[11px]">Admin Pembuat:</span>
                                                <span className="font-medium text-slate-800">{detailPo.pembuat_admin}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 text-[11px] truncate max-w-[110px]">{detailPo.jabatan_kepala || "Kepala Alat"}:</span>
                                                <span className="font-medium text-slate-800">{detailPo.kepala_peralatan}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 text-[11px]">Pimpinan:</span>
                                                <span className="font-medium text-slate-800">{detailPo.pimpinan}</span>
                                            </div>
                                            {/* Status Approval Section */}
                                            {detailPo.status === 'APPROVED' ? (
                                                detailPo.isBypassed ? (
                                                    <div className="mt-2 p-2 rounded-lg bg-amber-50/90 border border-amber-200 text-[11px] space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-amber-900 flex items-center gap-1">
                                                                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                                Bypass Admin ({detailPo.approvalChannel || 'WEB'})
                                                            </span>
                                                            <span className="text-[10px] text-amber-700 font-medium bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                                                Bypass
                                                            </span>
                                                        </div>
                                                        <div className="text-slate-700 text-[10.5px]">
                                                            Disetujui oleh: <span className="font-semibold text-slate-900">{detailPo.approvedBy?.employee?.name || detailPo.approvedBy?.username || "Admin"}</span>
                                                            {detailPo.approvedBy?.role && <span className="text-slate-500"> ({detailPo.approvedBy.role})</span>}
                                                        </div>
                                                        {(detailPo.ceoApprovedAt || detailPo.fvpApprovedAt) && (
                                                            <div className="text-[10px] text-slate-500">
                                                                Waktu: {new Date((detailPo.ceoApprovedAt || detailPo.fvpApprovedAt)!).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 p-2 rounded-lg bg-emerald-50/90 border border-emerald-200 text-[11px] space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-emerald-900 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                Persetujuan Pimpinan
                                                            </span>
                                                            <span className="text-[10px] text-emerald-700 font-medium bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                                                {detailPo.approvalChannel === 'MOBILE' ? 'Mobile App' : detailPo.approvalChannel || 'Mobile'}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 pt-0.5 text-[10.5px]">
                                                            {detailPo.ceoApprovedAt && (
                                                                <div className="flex items-center justify-between text-slate-700">
                                                                    <span className="flex items-center gap-1">
                                                                        <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                                                                        CEO ({detailPo.ceoApprovedBy?.employee?.name || detailPo.ceo?.employee?.name || detailPo.ceo?.username || detailPo.pimpinan || "Pimpinan"}):
                                                                    </span>
                                                                    <span className="font-medium text-emerald-700">
                                                                        {new Date(detailPo.ceoApprovedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {detailPo.fvpApprovedAt && (
                                                                <div className="flex items-center justify-between text-slate-700">
                                                                    <span className="flex items-center gap-1">
                                                                        <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                                                                        FVP ({detailPo.fvpApprovedBy?.employee?.name || detailPo.fvp?.employee?.name || detailPo.fvp?.username || "FVP"}):
                                                                    </span>
                                                                    <span className="font-medium text-emerald-700">
                                                                        {new Date(detailPo.fvpApprovedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            ) : (detailPo.ceoApprovedAt || detailPo.fvpApprovedAt) ? (
                                                <div className="mt-2 p-2 rounded-lg bg-blue-50/90 border border-blue-200 text-[11px] space-y-1">
                                                    <span className="font-semibold text-blue-900 flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                        Disetujui Sebagian (Pending)
                                                    </span>
                                                    {detailPo.ceoApprovedAt && (
                                                        <div className="text-[10.5px] text-slate-700">
                                                            CEO: Disetujui ({detailPo.ceoApprovedBy?.employee?.name || detailPo.ceo?.employee?.name || detailPo.pimpinan})
                                                        </div>
                                                    )}
                                                    {detailPo.fvpApprovedAt && (
                                                        <div className="text-[10.5px] text-slate-700">
                                                            FVP: Disetujui ({detailPo.fvpApprovedBy?.employee?.name || detailPo.fvp?.employee?.name || "FVP"})
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Table of Items ── */}
                                <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-xs bg-white">
                                    <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                                        <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                                            Daftar Rincian Barang Pesanan ({detailPo.items?.length || 0} Item)
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-50/50 border-b border-slate-200/80 text-slate-600 font-semibold">
                                                <tr>
                                                    <th className="px-3 py-2.5 text-center w-10">No</th>
                                                    <th className="px-3 py-2.5 text-left w-24">Kode</th>
                                                    <th className="px-3 py-2.5 text-left min-w-[220px]">Nama Barang Pesanan</th>
                                                    <th className="px-3 py-2.5 text-right w-20">Qty</th>
                                                    <th className="px-3 py-2.5 text-center w-20">Satuan</th>
                                                    <th className="px-3 py-2.5 text-right w-32">Harga Satuan</th>
                                                    <th className="px-3 py-2.5 text-left min-w-[140px]">Keterangan</th>
                                                    <th className="px-3 py-2.5 text-right w-36">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {detailPo.items?.map((item: any, i: number) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-3 py-2.5 text-center text-slate-400 font-mono">{i + 1}</td>
                                                        <td className="px-3 py-2.5 font-mono text-slate-700 font-medium">{item.masterItem?.kode_barang}</td>
                                                        <td className="px-3 py-2.5">
                                                            <div className="font-semibold text-slate-900">{item.masterItem?.name}</div>
                                                            {(item.masterItem?.part_number || item.masterItem?.merk) && (
                                                                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                                    {item.masterItem?.merk && <span>Merk: {item.masterItem.merk}</span>}
                                                                    {item.masterItem?.part_number && <span>Part: {item.masterItem.part_number}</span>}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{item.quantity}</td>
                                                        <td className="px-3 py-2.5 text-center text-slate-600 font-medium">{item.masterItem?.satuan}</td>
                                                        <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                                            Rp {item.harga_satuan.toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-slate-500 italic">{item.keterangan || "-"}</td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                                                            Rp {item.subtotal.toLocaleString('id-ID')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold">
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-3 text-right text-slate-600 uppercase tracking-wider text-xs">
                                                        Total Nilai Pembelian:
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-base text-emerald-700">
                                                        Rp {(detailPo.items?.reduce((s: number, it: any) => s + it.subtotal, 0) || 0).toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Catatan jika ada */}
                                {detailPo.notes && (
                                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                                        <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold text-amber-950 block mb-0.5">Catatan PO:</span>
                                            <span>{detailPo.notes}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Bottom Footer Bar ── */}
                            <div className="px-6 py-3 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between shrink-0">
                                <div className="text-[11px] text-slate-400 font-mono">
                                    ID: {detailPo.id}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs px-4"
                                        onClick={() => { setSelectedPoId(null); setDetailPo(null); setDetailError(null); }}
                                    >
                                        Tutup
                                    </Button>
                                    {detailPo.status === "APPROVED" && (
                                        <Link href={`/print/po/${detailPo.id}`} target="_blank">
                                            <Button size="sm" className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                                                <Printer className="w-3.5 h-3.5" /> Cetak PO
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
