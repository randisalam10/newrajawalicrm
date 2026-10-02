"use client"

import React, { useState } from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { PaymentFormState } from "../../types"
import { fmtRp } from "../../utils/kredit-helpers"
import { CreditCard, Loader2, Upload, Paperclip } from "lucide-react"

interface RecordCreditPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    paymentForm: PaymentFormState
    setPaymentForm: React.Dispatch<React.SetStateAction<PaymentFormState>>
    onSubmit: () => void
    isPending: boolean
    maxAmount?: number
}

export function RecordCreditPaymentDialog({
    open,
    onOpenChange,
    paymentForm,
    setPaymentForm,
    onSubmit,
    isPending,
    maxAmount,
}: RecordCreditPaymentDialogProps) {
    const [fileName, setFileName] = useState<string>("")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setFileName(file.name)
            setPaymentForm(prev => ({ ...prev, proofFile: file }))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                        <span>Catat Pembayaran Pelunasan Kredit</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3.5 py-1 text-xs">
                    {/* Sisa Kewajiban Info */}
                    {maxAmount !== undefined && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <span className="text-slate-500">Sisa Kewajiban Saat Ini:</span>
                            <span className="font-mono font-bold text-rose-600 text-sm">{fmtRp(maxAmount)}</span>
                        </div>
                    )}

                    {/* Nominal Pembayaran */}
                    <div>
                        <Label className="text-xs font-semibold">Nominal Pembayaran (Rp) *</Label>
                        <Input
                            type="number"
                            className="mt-1 h-9 text-xs font-mono font-semibold"
                            placeholder="Contoh: 50000000"
                            value={paymentForm.amount}
                            onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                        />
                    </div>

                    {/* Tanggal & Metode */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <Label className="text-xs font-semibold">Tanggal Pembayaran *</Label>
                            <Input
                                type="date"
                                className="mt-1 h-9 text-xs bg-white"
                                value={paymentForm.paymentDate}
                                onChange={e => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold">Metode Pembayaran *</Label>
                            <Select
                                value={paymentForm.method}
                                onValueChange={v => setPaymentForm(prev => ({ ...prev, method: v as any }))}
                            >
                                <SelectTrigger className="mt-1 h-9 text-xs bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                                    <SelectItem value="CASH">Kas Tunai (Cash)</SelectItem>
                                    <SelectItem value="GIRO">Cek / Bilyet Giro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Rekening Sumber & No Referensi */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <Label className="text-xs font-semibold">Rekening / Kas Sumber</Label>
                            <Input
                                className="mt-1 h-9 text-xs"
                                placeholder="Contoh: Mandiri Operasional"
                                value={paymentForm.sourceAccount}
                                onChange={e => setPaymentForm(prev => ({ ...prev, sourceAccount: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold">No. Referensi Transfer / Cek</Label>
                            <Input
                                className="mt-1 h-9 text-xs font-mono"
                                placeholder="Contoh: TRF-982342"
                                value={paymentForm.referenceNo}
                                onChange={e => setPaymentForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Catatan */}
                    <div>
                        <Label className="text-xs font-semibold">Catatan Pembayaran</Label>
                        <Input
                            className="mt-1 h-9 text-xs"
                            placeholder="Keterangan tambahan (misal: Pelunasan termin 1)"
                            value={paymentForm.notes}
                            onChange={e => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    {/* Upload Bukti Slip */}
                    <div>
                        <Label className="text-xs font-semibold">Lampiran Bukti Slip / Resi Transfer</Label>
                        <div className="mt-1 flex items-center gap-2">
                            <label className="flex-1 flex items-center justify-center gap-2 h-9 px-3 border border-dashed border-slate-300 rounded-md bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-600 transition-colors">
                                <Upload className="w-3.5 h-3.5 text-slate-500" />
                                <span className="truncate max-w-[200px] text-xs">
                                    {fileName ? fileName : "Pilih foto bukti slip / voucher..."}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                            {fileName && (
                                <button
                                    type="button"
                                    onClick={() => { setFileName(""); setPaymentForm(prev => ({ ...prev, proofFile: null })); }}
                                    className="text-xs text-rose-500 hover:underline cursor-pointer"
                                >
                                    Hapus
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                        className="h-8 text-xs cursor-pointer"
                    >
                        Batal
                    </Button>
                    <Button
                        size="sm"
                        onClick={onSubmit}
                        disabled={isPending}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Menyimpan...
                            </>
                        ) : (
                            "Simpan Pembayaran"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
