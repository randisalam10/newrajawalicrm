"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Loader2, Calendar, Clock } from "lucide-react"
import { fmt } from "../../utils/billing-helpers"
import { PaymentFormState, CompressionInfo } from "../../types"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

interface RecordPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoiceDetail: any
    paymentForm: PaymentFormState
    setPaymentForm: React.Dispatch<React.SetStateAction<PaymentFormState>>
    compressionInfo: CompressionInfo | null
    paymentLoading: boolean
    onProofFileSelected: (file: File | null) => void
    onSubmit: () => void
}

export function RecordPaymentDialog({
    open,
    onOpenChange,
    invoiceDetail,
    paymentForm,
    setPaymentForm,
    compressionInfo,
    paymentLoading,
    onProofFileSelected,
    onSubmit,
}: RecordPaymentDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Catat Pembayaran</DialogTitle></DialogHeader>
                {invoiceDetail && (
                    <div className="space-y-3.5">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-sm flex items-center justify-between">
                            <div>
                                <div className="text-slate-500 text-xs">Total Tagihan:</div>
                                <div className="font-semibold text-slate-800">{fmt(invoiceDetail.total_amount)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-slate-500 text-xs">Sisa Tagihan:</div>
                                <div className="text-lg font-bold text-red-600">{fmt(invoiceDetail.total_amount - invoiceDetail.paid_amount)}</div>
                            </div>
                        </div>

                        {/* Tanggal Bayar (Bisa Backdate) & Tanggal Lapor */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Tanggal Bayar</span>
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    className="mt-1 h-9 bg-white text-xs"
                                    value={paymentForm.paymentDate}
                                    onChange={e => setPaymentForm(f => ({ ...f, paymentDate: e.target.value }))}
                                />
                                <span className="text-[10px] text-slate-500 block mt-0.5">
                                    Tanggal transfer riil (bisa backdate)
                                </span>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Tanggal Lapor / Input</span>
                                </Label>
                                <div className="mt-1 h-9 px-2.5 py-1.5 bg-slate-100/90 border border-slate-200 rounded-md text-xs text-slate-700 flex items-center justify-between">
                                    <span className="font-mono text-[11px] truncate">
                                        {format(new Date(), "dd/MM/yyyy HH:mm")}
                                    </span>
                                    <span className="text-[9px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded font-semibold uppercase shrink-0 ml-1">
                                        Sistem
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-500 block mt-0.5">
                                    Waktu pencatatan di sistem
                                </span>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Jumlah Bayar (Rp) *</Label>
                            <Input
                                type="number"
                                className="mt-1 h-9 font-semibold text-slate-900"
                                placeholder="0"
                                value={paymentForm.amount}
                                onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Metode</Label>
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
                        <div>
                            <Label className="text-xs">No. Referensi Transfer</Label>
                            <Input
                                className="mt-1 h-9"
                                placeholder="XXXXXX"
                                value={paymentForm.referenceNo}
                                onChange={e => setPaymentForm(f => ({ ...f, referenceNo: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Catatan</Label>
                            <Input
                                className="mt-1 h-9"
                                value={paymentForm.notes}
                                onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Bukti Pembayaran (Foto/PDF)</Label>
                            <div className="mt-1">
                                <label className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50">
                                    <span>📎</span>
                                    <span>{paymentForm.proofFile ? paymentForm.proofFile.name : "Pilih foto slip / PDF (otomatis dikompres)"}</span>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={e => onProofFileSelected(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                                {paymentForm.proofFile && (
                                    <div className="mt-2 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600 truncate max-w-[200px]">{paymentForm.proofFile.name}</span>
                                            <button
                                                type="button"
                                                className="text-xs text-red-500 hover:underline cursor-pointer"
                                                onClick={() => onProofFileSelected(null)}
                                            >
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                    <Button onClick={onSubmit} disabled={paymentLoading || !paymentForm.amount}>
                        {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
