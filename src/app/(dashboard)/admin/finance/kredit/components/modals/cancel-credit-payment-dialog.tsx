"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fmtRp } from "../../utils/kredit-helpers"
import { AlertTriangle, Loader2 } from "lucide-react"

interface CancelCreditPaymentDialogProps {
    payment: any
    open: boolean
    onOpenChange: (open: boolean) => void
    reason: string
    setReason: (reason: string) => void
    onSubmit: () => void
    isPending: boolean
}

export function CancelCreditPaymentDialog({
    payment,
    open,
    onOpenChange,
    reason,
    setReason,
    onSubmit,
    isPending,
}: CancelCreditPaymentDialogProps) {
    if (!payment) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                        <span>Batalkan Catatan Pembayaran</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-1 text-xs">
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                        <div className="font-semibold">Perhatian:</div>
                        <p>
                            Pembayaran senilai <strong className="font-mono">{fmtRp(payment.amount)}</strong> akan dibatalkan.
                            Sisa kewajiban kredit akan bertambah kembali dan tindakan ini akan dicatat ke dalam audit trail.
                        </p>
                    </div>

                    <div>
                        <Label className="text-xs font-semibold">Alasan Pembatalan *</Label>
                        <Input
                            className="mt-1 h-9 text-xs"
                            placeholder="Contoh: Salah transfer / salah input nominal"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
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
                        Kembali
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onSubmit}
                        disabled={isPending || !reason.trim()}
                        className="h-8 text-xs cursor-pointer"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Membatalkan...
                            </>
                        ) : (
                            "Ya, Batalkan Pembayaran"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
