"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface CancelInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invoiceDetail: any
    cancelInvoiceReason: string
    setCancelInvoiceReason: (reason: string) => void
    cancelInvoiceLoading: boolean
    onSubmit: () => void
}

export function CancelInvoiceDialog({
    open,
    onOpenChange,
    invoiceDetail,
    cancelInvoiceReason,
    setCancelInvoiceReason,
    cancelInvoiceLoading,
    onSubmit,
}: CancelInvoiceDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle className="text-red-600">Batalkan Invoice</DialogTitle></DialogHeader>
                <div className="space-y-3">
                    {invoiceDetail && (
                        <div className="bg-red-50 border border-red-100 rounded p-3 text-sm text-slate-700">
                            <div className="font-mono font-semibold">{invoiceDetail.invoice_number}</div>
                            <div className="text-slate-500">{invoiceDetail.project?.customer?.customer_name}</div>
                        </div>
                    )}
                    <div>
                        <Label className="text-xs text-red-700 font-semibold">Alasan Pembatalan <span className="text-red-500">*</span></Label>
                        <textarea
                            className="mt-1 w-full border border-red-200 rounded-md p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50"
                            rows={3}
                            placeholder="Tuliskan alasan pembatalan invoice ini..."
                            value={cancelInvoiceReason}
                            onChange={e => setCancelInvoiceReason(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-slate-400">Invoice tidak akan dihapus, hanya dinonaktifkan dan disembunyikan.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={onSubmit}
                        disabled={cancelInvoiceLoading || !cancelInvoiceReason.trim()}
                    >
                        {cancelInvoiceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Batalkan Invoice"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
