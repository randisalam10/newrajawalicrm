"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    targetText: string
    isPending: boolean
    onConfirm: () => void
}

export function DeleteHistoryDialog({
    open,
    onOpenChange,
    targetText,
    isPending,
    onConfirm,
}: DeleteHistoryDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm bg-white">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Konfirmasi Hapus Riwayat
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-600 mt-1">
                        Apakah Anda yakin ingin menghapus catatan riwayat harga:
                        <br />
                        <strong className="text-slate-900 block mt-1">{targetText}</strong>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-8 text-xs cursor-pointer"
                    >
                        Batal
                    </Button>
                    <Button
                        size="sm"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer font-medium"
                    >
                        {isPending ? "Menghapus..." : "Ya, Hapus"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
