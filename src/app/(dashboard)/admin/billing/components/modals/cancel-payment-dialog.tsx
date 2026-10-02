"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { fmt, fmtDate } from "../../utils/billing-helpers"

interface CancelPaymentDialogProps {
    cancelPaymentTarget: any
    onClose: () => void
    cancelPaymentReason: string
    setCancelPaymentReason: (reason: string) => void
    cancelPaymentLoading: boolean
    onSubmit: () => void
}

export function CancelPaymentDialog({
    cancelPaymentTarget,
    onClose,
    cancelPaymentReason,
    setCancelPaymentReason,
    cancelPaymentLoading,
    onSubmit,
}: CancelPaymentDialogProps) {
    return (
        <Dialog open={!!cancelPaymentTarget} onOpenChange={open => { if (!open) onClose() }}>
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
                    <Button variant="outline" onClick={onClose}>Batal</Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={onSubmit}
                        disabled={cancelPaymentLoading || !cancelPaymentReason.trim()}
                    >
                        {cancelPaymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Batalkan Pembayaran"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
