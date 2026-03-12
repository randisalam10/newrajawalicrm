"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { 
    Search, CheckCircle, XCircle, Printer, Pencil, 
    ChevronLeft, ChevronRight, FilterX 
} from "lucide-react"
import { updatePoStatus, getPurchaseOrders } from "./actions"
import Link from "next/link"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const statusConfig: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700" },
    APPROVED: { label: "Disetujui", className: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Dibatalkan", className: "bg-red-100 text-red-700" },
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
    const [isLoading, setIsLoading] = useState(false)

    const canApprove = ['SuperAdminBP', 'CEO', 'FVP', 'AdminLogistik'].includes(userRole)

    const fetchData = async (p: number, s: string, cid: string, catid: string) => {
        setIsLoading(true)
        try {
            const result = await getPurchaseOrders({
                page: p,
                pageSize: 10,
                search: s || undefined,
                companyGroupId: cid === "ALL" ? undefined : cid,
                categoryId: catid === "ALL" ? undefined : catid
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
            fetchData(page, search, companyId, categoryId)
        }, 500)
        return () => clearTimeout(timeout)
    }, [page, search, companyId, categoryId])

    const resetFilters = () => {
        setSearch("")
        setCompanyId("ALL")
        setCategoryId("ALL")
        setPage(1)
    }

    return (
        <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari nomor PO..."
                        className="pl-9"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                <Select value={companyId} onValueChange={v => { setCompanyId(v); setPage(1); }}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Semua Perusahaan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Semua Perusahaan</SelectItem>
                        {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={categoryId} onValueChange={v => { setCategoryId(v); setPage(1); }}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Semua Kategori</SelectItem>
                        {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button variant="ghost" size="icon" onClick={resetFilters} title="Reset Filter">
                    <FilterX className="w-4 h-4" />
                </Button>

                <div className="ml-auto">
                    <Link href="/logistik/po/create">
                        <Button>+ Buat PO Baru</Button>
                    </Link>
                </div>
            </div>

            <div className="rounded-md border bg-white overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead>Nomor PO</TableHead>
                            <TableHead>Perusahaan</TableHead>
                            <TableHead>Proyek</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Tgl Cetak</TableHead>
                            <TableHead>Metode</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[130px] text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground h-24">
                                    {search || companyId !== "ALL" || categoryId !== "ALL" 
                                        ? "Tidak ada PO yang cocok." 
                                        : "Belum ada Purchase Order."}
                                </TableCell>
                            </TableRow>
                        )}
                        {orders.map((po) => {
                            const total = po.items?.reduce((acc: number, item: any) => acc + item.subtotal, 0) ?? 0
                            const cfg = statusConfig[po.status] ?? statusConfig.DRAFT
                            return (
                                <TableRow key={po.id} className="hover:bg-slate-50/70">
                                    <TableCell className="font-mono font-semibold text-sm">{po.po_number}</TableCell>
                                    <TableCell className="text-sm">{po.companyGroup?.name}</TableCell>
                                    <TableCell className="text-sm italic text-slate-500">{po.proyek_nama || "-"}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                                            {po.category?.name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {new Date(po.tanggal_terbit).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-sm">{po.metode_pembayaran}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                                            {cfg.label}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-700">
                                        Rp {total.toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            {po.status === "APPROVED" && (
                                                <Link href={`/print/po/${po.id}`} target="_blank">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Print PO">
                                                        <Printer className="w-4 h-4 text-blue-500" />
                                                    </Button>
                                                </Link>
                                            )}
                                            {po.status === "DRAFT" && (
                                                <Link href={`/logistik/po/${po.id}/edit`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit PO">
                                                        <Pencil className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                </Link>
                                            )}
                                            {po.status === "DRAFT" && canApprove && (
                                                <Button
                                                    variant="ghost" size="icon" className="h-8 w-8" title="Setujui"
                                                    onClick={async () => {
                                                        if (!confirm("Setujui PO ini?")) return
                                                        const res = await updatePoStatus(po.id, "APPROVED")
                                                        if (res.success) fetchData(page, search, companyId, categoryId)
                                                    }}
                                                >
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                </Button>
                                            )}
                                            {po.status !== "CANCELLED" && canApprove && (
                                                <Button
                                                    variant="ghost" size="icon" className="h-8 w-8" title="Batalkan"
                                                    onClick={async () => {
                                                        if (!confirm("Batalkan PO ini?")) return
                                                        const res = await updatePoStatus(po.id, "CANCELLED")
                                                        if (res.success) fetchData(page, search, companyId, categoryId)
                                                    }}
                                                >
                                                    <XCircle className="w-4 h-4 text-red-500" />
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

            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-slate-500">
                    Menampilkan <span className="font-medium text-slate-800">{orders.length}</span> dari <span className="font-medium text-slate-800">{totalCount}</span> PO
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                        className="gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" /> Sebelumnya
                    </Button>
                    <div className="text-sm font-medium text-slate-700">
                        Halaman {page} dari {totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || isLoading}
                        className="gap-1"
                    >
                        Selanjutnya <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
