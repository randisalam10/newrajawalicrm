"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { fmtRp, fmtDate, fmtDateTime, getCreditStatusBadgeConfig } from "../../utils/kredit-helpers"
import {
    FileText, CreditCard, Clock, X, Paperclip, CheckCircle2, AlertTriangle, Box, ShieldCheck, History
} from "lucide-react"

interface CreditDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    creditDetail: any
    detailLoading: boolean
    onOpenPayment: (credit: any) => void
    onCancelPaymentTarget: (payment: any) => void
    canManage?: boolean
}

export function CreditDetailDialog({
    open,
    onOpenChange,
    creditDetail,
    detailLoading,
    onOpenPayment,
    onCancelPaymentTarget,
    canManage,
}: CreditDetailDialogProps) {
    if (!creditDetail && !detailLoading) return null

    const badge = creditDetail ? getCreditStatusBadgeConfig(creditDetail.status, creditDetail.due_date, creditDetail.outstanding) : { label: "", className: "" }
    const po = creditDetail?.purchaseOrder
    const poItems = po?.items || []
    const payments = creditDetail?.payments || []
    const auditLogs = creditDetail?.auditLogs || []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 z-50">
                <DialogHeader className="p-4 pb-3 border-b bg-slate-50 sticky top-0 z-10">
                    <div className="flex items-center justify-between gap-3 mr-6">
                        <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 font-mono flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span>{creditDetail?.credit_number}</span>
                        </DialogTitle>
                        {creditDetail && (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${badge.className}`}>
                                {badge.label}
                            </span>
                        )}
                    </div>
                    {creditDetail && (
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span>Supplier: <strong className="text-slate-800">{creditDetail.supplier_name}</strong></span>
                            <span>•</span>
                            <span>Perusahaan: <strong className="text-slate-800">{creditDetail.company_name}</strong></span>
                            {po && (
                                <>
                                    <span>•</span>
                                    <span>No. PO: <strong className="text-blue-700 font-mono">{po.po_number}</strong></span>
                                </>
                            )}
                        </div>
                    )}
                </DialogHeader>

                {detailLoading ? (
                    <div className="py-16 text-center text-slate-400 text-xs">
                        Memuat rincian kewajiban kredit...
                    </div>
                ) : creditDetail ? (
                    <div className="p-5 space-y-5">
                        {/* 1. Ringkasan Finansial Card */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                            <div>
                                <div className="text-slate-500 text-[11px]">Total Nilai Kredit</div>
                                <div className="font-mono font-bold text-slate-900 text-base mt-0.5">
                                    {fmtRp(creditDetail.total_amount)}
                                </div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-[11px]">Telah Dilunasi</div>
                                <div className="font-mono font-bold text-emerald-700 text-base mt-0.5">
                                    {fmtRp(creditDetail.paid_amount)}
                                </div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-[11px]">Sisa Kewajiban</div>
                                <div className={`font-mono font-bold text-base mt-0.5 ${creditDetail.outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                    {fmtRp(creditDetail.outstanding)}
                                </div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-[11px]">Jatuh Tempo</div>
                                <div className="font-semibold text-slate-800 text-sm mt-0.5">
                                    {fmtDate(creditDetail.due_date)}
                                </div>
                            </div>
                        </div>

                        {/* 2. Rincian Item Barang (jika dari PO) */}
                        {poItems.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                        <Box className="w-3.5 h-3.5 text-blue-600" />
                                        Rincian Barang Pemesanan PO ({poItems.length} Item)
                                    </h4>
                                    <span className="text-[11px] text-slate-500">Tgl Terbit PO: {fmtDate(po.tanggal_terbit)}</span>
                                </div>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="text-xs">Nama Barang & Kode</TableHead>
                                                <TableHead className="text-xs text-right">Kuantitas</TableHead>
                                                <TableHead className="text-xs text-right">Harga Satuan</TableHead>
                                                <TableHead className="text-xs text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {poItems.map((item: any) => (
                                                <TableRow key={item.id} className="text-xs">
                                                    <TableCell className="font-medium text-slate-800">
                                                        <div>{item.masterItem?.name || "Barang"}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">{item.masterItem?.kode_barang}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {item.quantity} {item.masterItem?.satuan || "Pcs"}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {fmtRp(item.harga_satuan)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-semibold text-slate-900">
                                                        {fmtRp(item.subtotal)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {/* 3. Riwayat Pembayaran (Histori Cicilan / Pelunasan) */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                    Riwayat Pembayaran & Pelunasan ({payments.length} Transaksi)
                                </h4>
                                {canManage && creditDetail.outstanding > 0 && creditDetail.status !== "CANCELLED" && (
                                    <Button
                                        size="sm"
                                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                        onClick={() => onOpenPayment(creditDetail)}
                                    >
                                        <CreditCard className="w-3 h-3 mr-1" />
                                        Catat Pembayaran
                                    </Button>
                                )}
                            </div>

                            {payments.length === 0 ? (
                                <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
                                    Belum ada pembayaran yang dicatat untuk kewajiban kredit ini.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {payments.map((p: any) => (
                                        <div
                                            key={p.id}
                                            className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                                                p.is_cancelled
                                                    ? "bg-rose-50/40 border-rose-200 opacity-60 line-through"
                                                    : "bg-white border-slate-200 shadow-2xs"
                                            }`}
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="font-semibold text-slate-800 flex items-center gap-2">
                                                    <span>{fmtDate(p.payment_date)}</span>
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                                                        {p.method}
                                                    </span>
                                                    {p.is_cancelled && (
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold no-underline">
                                                            DIBATALKAN
                                                        </span>
                                                    )}
                                                </div>
                                                {p.source_account && (
                                                    <div className="text-slate-500 text-[11px]">
                                                        Rekening Sumber: <strong className="text-slate-700">{p.source_account}</strong>
                                                    </div>
                                                )}
                                                {p.reference_no && (
                                                    <div className="text-slate-500 text-[11px]">
                                                        No. Ref/Cek: <span className="font-mono text-slate-700">{p.reference_no}</span>
                                                    </div>
                                                )}
                                                {p.notes && (
                                                    <div className="text-slate-500 text-[11px]">
                                                        Catatan: {p.notes}
                                                    </div>
                                                )}
                                                {p.is_cancelled && p.cancel_reason && (
                                                    <div className="text-rose-600 text-[11px] font-medium no-underline">
                                                        Alasan Batal: {p.cancel_reason} ({fmtDateTime(p.cancelled_at)})
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-slate-400">
                                                    Dicatat oleh: {p.recordedBy?.employee?.name || p.recordedBy?.username || "Admin"} • {fmtDateTime(p.createdAt)}
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0 space-y-1">
                                                <div className={`font-mono font-bold text-sm ${p.is_cancelled ? "text-slate-400" : "text-emerald-700"}`}>
                                                    {fmtRp(p.amount)}
                                                </div>

                                                {p.proof_url && (
                                                    <a
                                                        href={p.proof_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline cursor-pointer"
                                                    >
                                                        <Paperclip className="w-3 h-3" />
                                                        Lihat Bukti Slip
                                                    </a>
                                                )}

                                                {canManage && !p.is_cancelled && (
                                                    <div>
                                                        <button
                                                            type="button"
                                                            onClick={() => onCancelPaymentTarget(p)}
                                                            className="text-[11px] text-rose-600 hover:underline cursor-pointer font-medium"
                                                        >
                                                            Batalkan Bayar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 4. Audit Trail Linimasa */}
                        {auditLogs.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5 text-slate-600" />
                                    Audit Trail & Linimasa Log ({auditLogs.length})
                                </h4>
                                <div className="space-y-1.5">
                                    {auditLogs.map((log: any) => (
                                        <div key={log.id} className="p-2 rounded bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                                            <div>
                                                <span className="font-semibold text-slate-700">{log.action}: </span>
                                                <span className="text-slate-600">{log.description}</span>
                                                <span className="text-slate-400 text-[10px] ml-1">oleh {log.actorName}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 shrink-0 font-mono">
                                                {fmtDateTime(log.createdAt)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
