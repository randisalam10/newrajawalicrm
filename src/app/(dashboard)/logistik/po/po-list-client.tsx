"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Search, CheckCircle, XCircle, Printer, Pencil, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { updatePoStatus, deletePurchaseOrder } from "./actions"
import Link from "next/link"

const statusConfig: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700" },
    APPROVED: { label: "Disetujui", className: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Dibatalkan", className: "bg-red-100 text-red-700" },
}

type SortKey = "po_number" | "company" | "category" | "tanggal" | "status" | "total" | "created_at"
type SortDir = "asc" | "desc"

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
    if (col !== sortKey) return <ArrowUpDown className="ml-1 w-3 h-3 inline opacity-40" />
    return sortDir === "asc"
        ? <ArrowUp className="ml-1 w-3 h-3 inline text-blue-600" />
        : <ArrowDown className="ml-1 w-3 h-3 inline text-blue-600" />
}

export function POListClient({ initialData, userRole }: { initialData: any[], userRole: string }) {
    const [search, setSearch] = useState("")
    const [sortKey, setSortKey] = useState<SortKey>("created_at")
    const [sortDir, setSortDir] = useState<SortDir>("desc")
    const canApprove = ['SuperAdminBP', 'CEO', 'FVP', 'AdminLogistik'].includes(userRole)

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc")
        } else {
            setSortKey(key)
            setSortDir("desc")
        }
    }

    const filtered = useMemo(() => {
        const searched = initialData.filter(po =>
            !search ||
            po.po_number.toLowerCase().includes(search.toLowerCase()) ||
            po.companyGroup?.name?.toLowerCase().includes(search.toLowerCase()) ||
            po.category?.name?.toLowerCase().includes(search.toLowerCase())
        )

        return [...searched].sort((a, b) => {
            let valA: any, valB: any
            const total = (po: any) => po.items?.reduce((acc: number, item: any) => acc + item.subtotal, 0) ?? 0

            switch (sortKey) {
                case "po_number":
                    valA = a.po_number; valB = b.po_number; break
                case "company":
                    valA = a.companyGroup?.name ?? ""; valB = b.companyGroup?.name ?? ""; break
                case "category":
                    valA = a.category?.name ?? ""; valB = b.category?.name ?? ""; break
                case "created_at":
                    valA = new Date(a.createdAt).getTime()
                    valB = new Date(b.createdAt).getTime(); break
                case "tanggal":
                    valA = new Date(a.tanggal_terbit).getTime()
                    valB = new Date(b.tanggal_terbit).getTime(); break
                case "status":
                    valA = a.status; valB = b.status; break
                case "total":
                    valA = total(a); valB = total(b); break
                default:
                    return 0
            }

            if (valA < valB) return sortDir === "asc" ? -1 : 1
            if (valA > valB) return sortDir === "asc" ? 1 : -1
            return 0
        })
    }, [initialData, search, sortKey, sortDir])

    const thClass = "cursor-pointer select-none hover:bg-slate-100 transition-colors"

    return (
        <div className="space-y-4 p-4">
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari nomor PO, perusahaan, kategori..."
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Link href="/logistik/po/create">
                    <Button>+ Buat PO Baru</Button>
                </Link>
            </div>

            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead className={thClass} onClick={() => handleSort("po_number")}>
                                Nomor PO <SortIcon col="po_number" sortKey={sortKey} sortDir={sortDir} />
                            </TableHead>
                            <TableHead className={thClass} onClick={() => handleSort("company")}>
                                Perusahaan <SortIcon col="company" sortKey={sortKey} sortDir={sortDir} />
                            </TableHead>
                            <TableHead className={thClass} onClick={() => handleSort("category")}>
                                Kategori <SortIcon col="category" sortKey={sortKey} sortDir={sortDir} />
                            </TableHead>
                            <TableHead className={thClass} onClick={() => handleSort("tanggal")}>
                                Tgl Cetak PO <SortIcon col="tanggal" sortKey={sortKey} sortDir={sortDir} />
                            </TableHead>
                            <TableHead className={thClass} onClick={() => handleSort("created_at")}>
                                Waktu Dibuat <SortIcon col="created_at" sortKey={sortKey} sortDir={sortDir} />
                            </TableHead>
                            <TableHead>Metode</TableHead>
                            <TableHead className={thClass} onClick={() => handleSort("status")}>
                                Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
                            </TableHead>
                            <TableHead className={`text-right ${thClass}`} onClick={() => handleSort("total")}>
                                Total <SortIcon col="total" sortKey={sortKey} sortDir={sortDir} />
                            </TableHead>
                            <TableHead className="w-[130px] text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground h-24">
                                    {search ? "Tidak ada PO yang cocok." : "Belum ada Purchase Order."}
                                </TableCell>
                            </TableRow>
                        )}
                        {filtered.map((po) => {
                            const total = po.items?.reduce((acc: number, item: any) => acc + item.subtotal, 0) ?? 0
                            const cfg = statusConfig[po.status] ?? statusConfig.DRAFT
                            return (
                                <TableRow key={po.id} className="hover:bg-slate-50/70">
                                    <TableCell className="font-mono font-semibold text-sm">{po.po_number}</TableCell>
                                    <TableCell className="text-sm">{po.companyGroup?.name}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                                            {po.category?.name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {new Date(po.tanggal_terbit).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {new Date(po.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}<br />
                                        {new Date(po.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
                                                        await updatePoStatus(po.id, "APPROVED")
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
                                                        await updatePoStatus(po.id, "CANCELLED")
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
        </div>
    )
}
