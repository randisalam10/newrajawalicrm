"use client"

import React, { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Globe, Building2, Settings2, X, Loader2, CheckSquare } from "lucide-react"
import { toast } from "sonner"
import { bulkUpdateSuppliersScope } from "../actions"
import { SupplierItem } from "../types"

interface SupplierBulkBarProps {
    selectedSuppliers: SupplierItem[]
    onClearSelection: () => void
    onOpenCustomBulk: () => void
    onSuccess?: () => void
}

export function SupplierBulkBar({
    selectedSuppliers,
    onClearSelection,
    onOpenCustomBulk,
    onSuccess,
}: SupplierBulkBarProps) {
    const [confirmGlobalOpen, setConfirmGlobalOpen] = useState(false)
    const [confirmLocalOpen, setConfirmLocalOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const count = selectedSuppliers.length
    if (count === 0) return null

    const totalItems = selectedSuppliers.reduce((acc, s) => acc + (s.itemCount || 0), 0)

    const handleQuickSetGlobal = () => {
        startTransition(async () => {
            const res = await bulkUpdateSuppliersScope({
                supplierIds: selectedSuppliers.map(s => s.id),
                is_global: true,
                target_business: "ALL",
                syncItems: true,
            })

            if (res.success) {
                toast.success(res.message || `${count} toko & ${totalItems} barang katalog berhasil diatur menjadi Global`)
                setConfirmGlobalOpen(false)
                onClearSelection()
                onSuccess?.()
            } else {
                toast.error(res.error || "Gagal mengubah ke Global")
            }
        })
    }

    const handleQuickSetLocal = () => {
        startTransition(async () => {
            const res = await bulkUpdateSuppliersScope({
                supplierIds: selectedSuppliers.map(s => s.id),
                is_global: false,
                target_business: "ALL",
                syncItems: true,
            })

            if (res.success) {
                toast.success(res.message || `${count} toko & ${totalItems} barang katalog berhasil dikembalikan ke cabang pembuatnya`)
                setConfirmLocalOpen(false)
                onClearSelection()
                onSuccess?.()
            } else {
                toast.error(res.error || "Gagal mengubah ke Lokal")
            }
        })
    }

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[94vw] sm:w-auto bg-slate-900/95 text-white shadow-2xl rounded-xl px-4 py-2.5 flex items-center justify-between sm:justify-start gap-2.5 border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-400/40 text-xs px-2 py-0.5 font-semibold gap-1">
                        <CheckSquare className="w-3.5 h-3.5" />
                        {count} Toko Terpilih
                    </Badge>
                    {totalItems > 0 && (
                        <span className="hidden md:inline text-[11px] text-slate-400">
                            ({totalItems} barang terkait)
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Quick Button: Jadikan Global */}
                    <Button
                        size="sm"
                        onClick={() => setConfirmGlobalOpen(true)}
                        disabled={isPending}
                        className="h-7.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
                    >
                        <Globe className="w-3.5 h-3.5" />
                        Jadikan Global
                    </Button>

                    {/* Quick Button: Jadikan Lokal */}
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setConfirmLocalOpen(true)}
                        disabled={isPending}
                        className="h-7.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 gap-1"
                    >
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        Jadikan Lokal
                    </Button>

                    {/* Button: Opsi Lainnya */}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onOpenCustomBulk}
                        disabled={isPending}
                        className="h-7.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1"
                    >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Opsi Lain</span>
                    </Button>

                    {/* Button: Batal */}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClearSelection}
                        disabled={isPending}
                        className="h-7.5 w-7.5 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md"
                        title="Batal Pilih"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Alert Dialog Konfirmasi Jadikan Global */}
            <AlertDialog open={confirmGlobalOpen} onOpenChange={setConfirmGlobalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Globe className="w-4.5 h-4.5 text-emerald-600" />
                            Jadikan {count} Toko Berlaku Global?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-600 space-y-2">
                            <p>
                                Seluruh {count} toko yang dipilih akan diatur menjadi <strong className="text-emerald-700">Global (Berlaku Nasional)</strong> sehingga dapat diakses oleh semua cabang Batching Plant dan Stone Crusher.
                            </p>
                            <p className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900 font-medium">
                                ✨ <strong>Otomatis Sinkron Relasi:</strong> Sebanyak <strong>{totalItems} barang katalog</strong> dari {count} toko ini otomatis ikut menjadi Global agar tidak ada data yang tidak sinkron.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending} className="h-8.5 text-xs">
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleQuickSetGlobal}
                            disabled={isPending}
                            className="h-8.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Ya, Jadikan Global
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alert Dialog Konfirmasi Jadikan Lokal */}
            <AlertDialog open={confirmLocalOpen} onOpenChange={setConfirmLocalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-4.5 h-4.5 text-blue-600" />
                            Kembalikan {count} Toko ke Cabang Pembuat (Lokal)?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-600 space-y-2">
                            <p>
                                Status Global akan dicabut. Toko-toko ini akan kembali menjadi <strong className="text-blue-700">Lokal</strong> dan hanya dapat diakses oleh cabang yang membuatnya masing-masing.
                            </p>
                            <p className="p-2.5 bg-blue-50 border border-blue-200 rounded-md text-blue-900 font-medium">
                                ✨ <strong>Otomatis Sinkron Relasi:</strong> Seluruh <strong>{totalItems} barang katalog</strong> dari {count} toko ini juga otomatis kembali ke cabang pembuatnya.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending} className="h-8.5 text-xs">
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleQuickSetLocal}
                            disabled={isPending}
                            className="h-8.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Ya, Jadikan Lokal
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
