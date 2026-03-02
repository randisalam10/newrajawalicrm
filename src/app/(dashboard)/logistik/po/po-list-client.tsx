"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Search, CheckCircle, XCircle, Eye } from "lucide-react"
import { updatePoStatus, deletePurchaseOrder } from "./actions"
import Link from "next/link"

const statusConfig: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700" },
    APPROVED: { label: "Disetujui", className: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Dibatalkan", className: "bg-red-100 text-red-700" },
}

export function POListClient({ initialData }: { initialData: any[] }) {
    const [search, setSearch] = useState("")

    const filtered = initialData.filter(po =>
        !search ||
        po.po_number.toLowerCase().includes(search.toLowerCase()) ||
        po.companyGroup?.name?.toLowerCase().includes(search.toLowerCase()) ||
        po.category?.name?.toLowerCase().includes(search.toLowerCase())
    )

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
                            <TableHead>Nomor PO</TableHead>
                            <TableHead>Perusahaan</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Metode</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[130px] text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
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
                                            <Link href={`/print/po/${po.id}`} target="_blank">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Print PO">
                                                    <Eye className="w-4 h-4 text-blue-500" />
                                                </Button>
                                            </Link>
                                            {po.status === "DRAFT" && (
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
                                            {po.status !== "CANCELLED" && (
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
