"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ProofPreviewDialogProps {
    proofPreviewModalUrl: string | null
    onClose: () => void
}

export function ProofPreviewDialog({
    proofPreviewModalUrl,
    onClose,
}: ProofPreviewDialogProps) {
    return (
        <Dialog open={!!proofPreviewModalUrl} onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-w-2xl p-4">
                <DialogHeader>
                    <DialogTitle className="text-sm font-semibold flex items-center justify-between">
                        <span>Bukti Pembayaran</span>
                        {proofPreviewModalUrl && (
                            <a
                                href={proofPreviewModalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-normal cursor-pointer"
                            >
                                Buka di Tab Baru ↗
                            </a>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-2 flex flex-col items-center justify-center bg-slate-950 rounded-lg p-2 min-h-[300px] max-h-[70vh] overflow-hidden">
                    {proofPreviewModalUrl && (
                        proofPreviewModalUrl.toLowerCase().endsWith(".pdf") ? (
                            <iframe
                                src={proofPreviewModalUrl}
                                className="w-full h-[60vh] rounded border-0"
                                title="Bukti Bayar PDF"
                            />
                        ) : (
                            <img
                                src={proofPreviewModalUrl}
                                alt="Bukti Pembayaran"
                                className="max-h-[65vh] w-auto object-contain rounded"
                            />
                        )
                    )}
                </div>
                <div className="mt-3 flex justify-end">
                    <Button size="sm" variant="outline" onClick={onClose} className="cursor-pointer">
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
