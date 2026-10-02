"use client"

import React from "react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Eye,
    Printer,
    Pencil,
    Send,
    CheckCircle,
    XCircle,
    CheckCircle2,
    ShieldAlert,
    Smartphone,
} from "lucide-react"
import { getPOStatusBadgeConfig } from "../types"

interface POTableProps {
    orders: any[]
    isLoading: boolean
    hasActiveFilters: boolean
    canManagePo: boolean
    canApprove: boolean
    userRole: string
    onOpenDetail: (id: string) => void
    onSubmitPo: (id: string, poNumber: string) => Promise<void>
    onApprovePo: (id: string, poNumber: string) => Promise<void>
    onCancelPo: (id: string) => Promise<void>
}

export function POTable({
    orders,
    isLoading,
    hasActiveFilters,
    canManagePo,
    canApprove,
    userRole,
    onOpenDetail,
    onSubmitPo,
    onApprovePo,
    onCancelPo,
}: POTableProps) {
    return (
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
                            const cfg = getPOStatusBadgeConfig(po)

                            return (
                                <TableRow key={po.id} className="hover:bg-slate-50/75 transition-colors border-b border-slate-100 text-xs">
                                    {/* 1. Nomor PO */}
                                    <TableCell className="py-2 px-3">
                                        <div 
                                            className="font-mono font-bold text-xs text-blue-600 hover:text-blue-800 cursor-pointer hover:underline inline-block"
                                            onClick={() => onOpenDetail(po.id)} 
                                            title="Klik untuk melihat detail PO"
                                        >
                                            {po.po_number}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-slate-400">{po.category?.name}</span>
                                            {po.is_for_bp && (
                                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-blue-200 bg-blue-50 text-blue-700 font-semibold">
                                                    BP {po.location?.name ? `• ${po.location.name}` : ''}
                                                </Badge>
                                            )}
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
                                                onClick={() => onOpenDetail(po.id)}
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
                                                    onClick={() => onSubmitPo(po.id, po.po_number)}
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
                                                    title={`Setujui PO (Bypass Administratif sebagai ${userRole})`}
                                                    onClick={() => onApprovePo(po.id, po.po_number)}
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
                                                    onClick={() => onCancelPo(po.id)}
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
    )
}
