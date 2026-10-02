"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ImagePreviewDialogProps {
    previewImage: { url: string; name: string } | null
    onClose: () => void
}

export function ImagePreviewDialog({
    previewImage,
    onClose,
}: ImagePreviewDialogProps) {
    return (
        <Dialog open={!!previewImage} onOpenChange={open => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] p-2">
                <DialogHeader className="px-3 pt-2 pb-1">
                    <DialogTitle className="text-xs truncate font-mono text-slate-700">
                        {previewImage?.name || "Pratinjau Foto Bukti"}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Pratinjau lampiran foto nota transaksi RBL
                    </DialogDescription>
                </DialogHeader>
                {previewImage && (
                    <div className="max-h-[80vh] overflow-auto flex items-center justify-center bg-slate-950/5 rounded-lg p-2">
                        <img
                            src={previewImage.url}
                            alt={previewImage.name}
                            className="max-w-full max-h-[75vh] object-contain rounded"
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
