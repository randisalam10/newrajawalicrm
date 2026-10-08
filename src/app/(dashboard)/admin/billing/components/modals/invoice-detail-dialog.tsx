"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    FileText, Loader2, Percent, Paperclip, Upload, X, Plus, Printer, Eye, Truck, Wrench, XCircle, History
} from "lucide-react"
import { fmt, fmtDate, fmtDateTime, STATUS_CONFIG } from "../../utils/billing-helpers"
import { format } from "date-fns"

interface InvoiceDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoiceDetail: any
    selectedInvoice: any
    sheetLoading: boolean
    canManage?: boolean
    showCancelledPayments: boolean
    setShowCancelledPayments: React.Dispatch<React.SetStateAction<boolean>>
    uploadingProofPaymentId: string | null
    onDirectProofUpload: (paymentId: string, file: File) => void
    onOpenPaymentDialog: () => void
    onOpenCancelInvoice: () => void
    onCancelPaymentTarget: (payment: any) => void
    onPreviewProof: (url: string) => void
}

export function InvoiceDetailDialog({
    open,
    onOpenChange,
    invoiceDetail,
    selectedInvoice,
    sheetLoading,
    canManage,
    showCancelledPayments,
    setShowCancelledPayments,
    uploadingProofPaymentId,
    onDirectProofUpload,
    onOpenPaymentDialog,
    onOpenCancelInvoice,
    onCancelPaymentTarget,
    onPreviewProof,
}: InvoiceDetailDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                        {/* Status Batal Banner */}
                        {invoiceDetail.status === "CANCELLED" && (
                            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-900 space-y-1.5">
                                <div className="font-bold flex items-center gap-1.5 text-rose-700">
                                    <XCircle className="w-4 h-4 text-rose-600" />
                                    <span>Invoice ini telah Dibatalkan {invoiceDetail.cancelled_at && `pada ${fmtDateTime(invoiceDetail.cancelled_at)}`}</span>
                                </div>
                                {invoiceDetail.cancel_reason && (
                                    <div className="text-rose-800">
                                        <strong>Alasan Pembatalan:</strong> {invoiceDetail.cancel_reason}
                                    </div>
                                )}
                                <div className="text-[11px] text-rose-600 font-medium">
                                    * Seluruh surat jalan / tiket pengiriman terkait invoice ini telah dikembalikan ke antrean <strong>Unbilled Pool</strong> dan dapat ditagihkan kembali.
                                </div>
                            </div>
                        )}

                        {/* Summary per item type: ReadyMix vs Sewa */}
                        {(() => {
                            const sewaItems = invoiceDetail.items
                                .filter((i: any) => i.item_type === "SEWA" || i.sewaTransaction != null)
                                .sort((a: any, b: any) => {
                                    const dateA = new Date(a.sewaTransaction?.start_date || a.sewaTransaction?.date || invoiceDetail.issue_date).getTime()
                                    const dateB = new Date(b.sewaTransaction?.start_date || b.sewaTransaction?.date || invoiceDetail.issue_date).getTime()
                                    return dateA - dateB
                                })
                            const rmItems = invoiceDetail.items
                                .filter((i: any) => i.item_type !== "SEWA" && i.sewaTransaction == null)
                                .sort((a: any, b: any) => {
                                    const dateA = new Date(a.transaction?.date || invoiceDetail.issue_date).getTime()
                                    const dateB = new Date(b.transaction?.date || invoiceDetail.issue_date).getTime()
                                    if (dateA !== dateB) return dateA - dateB
                                    return (a.transaction?.trip_sequence ?? 0) - (b.transaction?.trip_sequence ?? 0)
                                })
                            const isCombined = sewaItems.length > 0 && rmItems.length > 0

                            // Group ready-mix by date & quality
                            const rmByDate = new Map<string, { tms: number; volume: number; nilai: number; quality: string; date: string }>()
                            for (const item of rmItems) {
                                const itemDate = item.transaction?.date || invoiceDetail.issue_date
                                const quality = item.transaction?.concreteQuality?.name || item.description || "ReadyMix"
                                const dateKey = itemDate ? format(new Date(itemDate), "yyyy-MM-dd") : "Lainnya"
                                const key = `${dateKey}__${quality}`
                                if (!rmByDate.has(key)) {
                                    rmByDate.set(key, { tms: 0, volume: 0, nilai: 0, quality, date: dateKey })
                                }
                                const d = rmByDate.get(key)!
                                d.tms += 1
                                d.volume += item.quantity
                                d.nilai += item.subtotal
                            }

                            return (
                                <div className="space-y-4">
                                    {isCombined && (
                                        <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-2.5 flex items-center justify-between text-xs text-indigo-900">
                                            <span className="font-semibold flex items-center gap-1.5">
                                                ⚡ Tagihan Terpadu (Kombinasi Pengiriman Beton Cor & Sewa Alat)
                                            </span>
                                            <span className="text-[11px] text-indigo-700">
                                                {rmItems.length} Tiket Cor · {sewaItems.length} Transaksi Sewa
                                            </span>
                                        </div>
                                    )}

                                    {/* 1. Seksi Pengiriman Beton Ready-Mix */}
                                    {rmItems.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                                                    Rincian Pengiriman Beton Cor ({rmItems.length} Tiket TM)
                                                </h3>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    Total Vol: {rmItems.reduce((s: number, i: any) => s + i.quantity, 0).toFixed(2)} m³
                                                </span>
                                            </div>
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50 text-[11px]">
                                                            <TableHead className="text-xs">Tanggal Kirim</TableHead>
                                                            <TableHead className="text-xs">Mutu Beton</TableHead>
                                                            <TableHead className="text-xs text-center">Ritase (TM)</TableHead>
                                                            <TableHead className="text-xs text-right">Volume (m³)</TableHead>
                                                            <TableHead className="text-xs text-right">Harga DPP / m³</TableHead>
                                                            <TableHead className="text-xs text-right">Subtotal</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {Array.from(rmByDate.entries())
                                                            .sort(([, a], [, b]) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                            .map(([key, d]) => {
                                                            const unitPrice = d.volume > 0 ? Math.round(d.nilai / d.volume) : 0
                                                            return (
                                                                <TableRow key={key} className="text-xs hover:bg-slate-50/70">
                                                                    <TableCell className="font-mono">{fmtDate(d.date)}</TableCell>
                                                                    <TableCell>
                                                                        <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px] font-mono">
                                                                            {d.quality}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="text-center font-mono">{d.tms} TM</TableCell>
                                                                    <TableCell className="text-right font-mono font-bold text-blue-700">{d.volume.toFixed(2)}</TableCell>
                                                                    <TableCell className="text-right font-mono text-slate-600">{fmt(unitPrice)}</TableCell>
                                                                    <TableCell className="text-right font-mono font-medium text-slate-900">{fmt(d.nilai)}</TableCell>
                                                                </TableRow>
                                                            )
                                                        })}
                                                        <TableRow className="bg-slate-50 font-bold text-xs">
                                                            <TableCell colSpan={2}>Total Cor ReadyMix</TableCell>
                                                            <TableCell className="text-center font-mono">{rmItems.length} TM</TableCell>
                                                            <TableCell className="text-right font-mono text-blue-800">{rmItems.reduce((s: number, i: any) => s + i.quantity, 0).toFixed(2)} m³</TableCell>
                                                            <TableCell className="text-right font-mono">-</TableCell>
                                                            <TableCell className="text-right font-mono font-bold text-slate-900">{fmt(rmItems.reduce((s: number, i: any) => s + i.subtotal, 0))}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Seksi Penyewaan Alat & Kendaraan */}
                                    {sewaItems.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                                    <Wrench className="w-3.5 h-3.5 text-purple-600" />
                                                    Rincian Penyewaan Alat &amp; Kendaraan ({sewaItems.length} Item)
                                                </h3>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    Total Durasi: {sewaItems.reduce((s: number, i: any) => s + i.quantity, 0)} Hari
                                                </span>
                                            </div>
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50 text-[11px]">
                                                            <TableHead className="text-xs">No. Transaksi / DO</TableHead>
                                                            <TableHead className="text-xs">Alat &amp; Operator</TableHead>
                                                            <TableHead className="text-xs text-right">Durasi</TableHead>
                                                            <TableHead className="text-xs text-right">Tarif / Hari</TableHead>
                                                            <TableHead className="text-xs text-right">Nilai Tagihan</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {sewaItems.map((item: any) => {
                                                            const stx = item.sewaTransaction
                                                            return (
                                                                <TableRow key={item.id} className="text-xs hover:bg-slate-50/70">
                                                                    <TableCell className="font-mono font-medium text-slate-700">
                                                                        {stx?.sewa_number || item.description || "-"}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="font-medium text-slate-800">
                                                                            {stx?.equipment?.nama_alat || item.description || "Alat Sewa"}
                                                                        </div>
                                                                        {stx?.operator?.name && (
                                                                            <div className="text-[11px] text-slate-400">Op: {stx.operator.name}</div>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-mono">{item.quantity} Hari</TableCell>
                                                                    <TableCell className="text-right font-mono">{fmt(item.unit_price)}</TableCell>
                                                                    <TableCell className="text-right font-mono font-medium text-slate-900">{fmt(item.subtotal)}</TableCell>
                                                                </TableRow>
                                                            )
                                                        })}
                                                        <TableRow className="bg-slate-50 font-bold text-xs">
                                                            <TableCell colSpan={2}>Total Sewa</TableCell>
                                                            <TableCell className="text-right font-mono">{sewaItems.reduce((s: number, i: any) => s + i.quantity, 0)} Hari</TableCell>
                                                            <TableCell className="text-right font-mono">-</TableCell>
                                                            <TableCell className="text-right font-mono font-bold text-slate-900">{fmt(sewaItems.reduce((s: number, i: any) => s + i.subtotal, 0))}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })()}

                        {/* Financial Summary Box */}
                        <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal Tagihan (DPP)</span>
                                <span className="font-mono font-medium">{fmt(invoiceDetail.subtotal)}</span>
                            </div>
                            {invoiceDetail.include_ppn ? (
                                <div className="flex justify-between text-slate-600">
                                    <span>PPN (11%)</span>
                                    <span className="font-mono font-medium text-indigo-700">{fmt(invoiceDetail.tax_amount)}</span>
                                </div>
                            ) : (
                                <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-2.5 text-xs space-y-1 text-amber-950">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                                            <Percent className="w-3.5 h-3.5 text-amber-700" />
                                            <span>Faktur Non-PPN (Kewajiban Beban PPN 11% Perusahaan)</span>
                                        </div>
                                        <span className="font-mono font-bold text-amber-950">{fmt(invoiceDetail.total_amount * 0.11)}</span>
                                    </div>
                                    {invoiceDetail.paid_amount > 0 && (
                                        <div className="text-[10px] text-amber-800 flex justify-between border-t border-amber-200/70 pt-1 mt-1">
                                            <span>Kas Masuk Diterima: {fmt(invoiceDetail.paid_amount)}</span>
                                            <span>Wajib Setor Kas Negara (11%): <strong className="font-mono">{fmt(invoiceDetail.paid_amount * 0.11)}</strong></span>
                                        </div>
                                    )}
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
                        {invoiceDetail.payments?.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                        Riwayat Pembayaran ({invoiceDetail.payments.length})
                                    </h3>
                                    {invoiceDetail.payments.some((p: any) => p.is_cancelled) && (
                                        <button
                                            onClick={() => setShowCancelledPayments(v => !v)}
                                            className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${showCancelledPayments
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
                                                        <div className={`font-semibold flex flex-wrap items-center gap-2 ${p.is_cancelled ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                            <span>Tgl Bayar: {fmtDate(p.payment_date)}</span>
                                                            <span className="text-slate-400">•</span>
                                                            <span>{p.method}</span>
                                                            {p.is_cancelled && (
                                                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold" style={{ textDecoration: 'none' }}>DIBATAL</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                                            {p.createdAt && (
                                                                <span>Tgl Lapor / Input: <span className="text-slate-700 font-medium">{fmtDateTime(p.createdAt)}</span></span>
                                                            )}
                                                            {p.reference_no && <span>No. Ref: <span className="font-mono text-slate-700">{p.reference_no}</span></span>}
                                                        </div>
                                                        {p.notes && <div className="text-slate-500 text-[11px]">Catatan: {p.notes}</div>}
                                                        {p.is_cancelled && p.cancel_reason && (
                                                            <div className="text-rose-600 mt-0.5 text-[11px]">Alasan Batal: {p.cancel_reason}</div>
                                                        )}
                                                        {p.proof_url && !p.is_cancelled ? (
                                                            <div className="mt-1 flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onPreviewProof(p.proof_url)}
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
                                                                            if (f) onDirectProofUpload(p.id, f)
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
                                                                onClick={() => onCancelPaymentTarget(p)}
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

                        {/* Riwayat Log Audit Billing */}
                        {invoiceDetail.billingLogs && invoiceDetail.billingLogs.length > 0 && (
                            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2 text-xs">
                                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Riwayat Aktivitas &amp; Log Audit</span>
                                </div>
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {invoiceDetail.billingLogs.map((log: any) => (
                                        <div key={log.id} className="bg-white p-2 rounded border border-slate-100 text-[11px] space-y-0.5">
                                            <div className="flex items-center justify-between text-slate-500">
                                                <span className="font-semibold text-slate-700">{log.action}</span>
                                                <span className="text-[10px]">{fmtDateTime(log.createdAt)}</span>
                                            </div>
                                            <div className="text-slate-600">{log.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions Bar */}
                        <div className="flex items-center justify-between gap-2 flex-wrap pt-3 border-t border-slate-200">
                            <div className="flex items-center gap-2 flex-wrap">
                                {canManage && invoiceDetail.status !== "PAID" && invoiceDetail.status !== "CANCELLED" && (
                                    <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" onClick={onOpenPaymentDialog}>
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
                                        onClick={onOpenCancelInvoice}
                                    >
                                        <X className="w-3.5 h-3.5 mr-1.5" /> Batalkan Invoice
                                    </Button>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onOpenChange(false)}
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
    )
}
