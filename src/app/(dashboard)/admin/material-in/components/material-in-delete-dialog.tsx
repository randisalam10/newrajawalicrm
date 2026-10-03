"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MaterialInRow } from "../types"
import { Loader2 } from "lucide-react"

interface MaterialInDeleteDialogProps {
    isOpen: boolean
    onClose: () => void
    item: MaterialInRow | null
    onConfirm: (item: MaterialInRow) => void
    isDeleting: boolean
}

export function MaterialInDeleteDialog({
    isOpen,
    onClose,
    item,
    onConfirm,
    isDeleting,
}: MaterialInDeleteDialogProps) {
    if (!item) return null

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-base font-bold text-slate-900">
                        Hapus Data Semen Masuk?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-slate-500 space-y-2">
                        <span>
                            Anda akan menghapus data penerimaan semen <strong>{item.name}</strong> dari distributor <strong>{item.supplier}</strong> (No Bon: <strong>{item.delivery_note}</strong>) seberat <strong>{item.tonnage.toLocaleString('id-ID')} KG</strong>.
                        </span>
                        <span className="block text-red-600 font-medium">
                            Aksi ini akan mengurangi saldo stok pada Kartu Stok Silo dan tidak dapat dibatalkan.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} className="h-8 text-xs">
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isDeleting}
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm(item)
                        }}
                        className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Menghapus...
                            </>
                        ) : (
                            "Ya, Hapus Data"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
