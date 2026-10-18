"use client"

import React, { useState, useTransition } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Globe, Building2, Loader2, Layers, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { bulkUpdateSuppliersScope } from "../actions"
import { SupplierItem } from "../types"

interface SupplierBulkDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedSuppliers: SupplierItem[]
    locations: { id: string; name: string; type: string }[]
    isCentral?: boolean
    onSuccess?: () => void
}

export function SupplierBulkDialog({
    open,
    onOpenChange,
    selectedSuppliers,
    locations = [],
    isCentral = false,
    onSuccess,
}: SupplierBulkDialogProps) {
    const [isPending, startTransition] = useTransition()
    const [scopeMode, setScopeMode] = useState<"GLOBAL" | "LOCAL">("GLOBAL")
    const [targetBusiness, setTargetBusiness] = useState<"ALL" | "BP" | "CRUSHER">("ALL")
    const [sharedLocationIds, setSharedLocationIds] = useState<string[]>([])
    const [syncItems, setSyncItems] = useState(true)

    const totalItems = selectedSuppliers.reduce((acc, s) => acc + (s.itemCount || 0), 0)

    const handleToggleShared = (locId: string) => {
        setSharedLocationIds(prev =>
            prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
        )
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const isGlobal = scopeMode === "GLOBAL"

        startTransition(async () => {
            const res = await bulkUpdateSuppliersScope({
                supplierIds: selectedSuppliers.map(s => s.id),
                is_global: isGlobal,
                target_business: targetBusiness,
                // Tidak mengubah cabang pemilik aslinya, biarkan masing-masing toko tetap di cabang pembuatnya
                sharedLocationIds: isGlobal ? [] : sharedLocationIds,
                syncItems,
            })

            if (res.success) {
                toast.success(res.message || "Cakupan toko berhasil diperbarui")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(res.error || "Gagal memperbarui cakupan toko")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-4.5 h-4.5 text-blue-600" />
                        Atur Cakupan Massal ({selectedSuppliers.length} Toko)
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Pilih apakah toko-toko ini berlaku Global untuk semua cabang atau Lokal untuk cabang pembuatnya masing-masing.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Ringkasan Seleksi */}
                    <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">
                                {selectedSuppliers.length} Toko Terpilih • {totalItems} Barang Katalog Terkait
                            </p>
                            <p className="text-[11px] text-blue-700/90 mt-0.5">
                                Cabang pembuat toko akan tetap menjadi pemilik aslinya secara otomatis.
                            </p>
                        </div>
                    </div>

                    {/* Pilihan Cakupan Toko */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-800">Cakupan Akses Toko</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setScopeMode("GLOBAL")}
                                className={`p-3 rounded-lg border text-left transition-all ${
                                    scopeMode === "GLOBAL"
                                        ? "bg-emerald-50/80 border-emerald-400 text-emerald-950 ring-1 ring-emerald-500/30"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <div className="flex items-center gap-1.5 font-semibold text-xs">
                                    <Globe className={`w-3.5 h-3.5 ${scopeMode === "GLOBAL" ? "text-emerald-600" : "text-slate-400"}`} />
                                    Jadikan Global
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                    Dapat diakses oleh <strong>semua cabang</strong> BP dan Stone Crusher.
                                </p>
                            </button>

                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setScopeMode("LOCAL")}
                                className={`p-3 rounded-lg border text-left transition-all ${
                                    scopeMode === "LOCAL"
                                        ? "bg-blue-50/80 border-blue-400 text-blue-950 ring-1 ring-blue-500/30"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <div className="flex items-center gap-1.5 font-semibold text-xs">
                                    <Building2 className={`w-3.5 h-3.5 ${scopeMode === "LOCAL" ? "text-blue-600" : "text-slate-400"}`} />
                                    Lokal (Cabang Pembuat)
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                    Hanya untuk cabang pembuat masing-masing, tidak dibagikan.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Jika Lokal & Admin Logistik: Opsi Berbagi ke Cabang Tambahan */}
                    {scopeMode === "LOCAL" && isCentral && locations.length > 0 && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                            <Label className="text-[11px] font-semibold text-slate-700">
                                Bagikan juga akses ke cabang tambahan (Opsional):
                            </Label>
                            <p className="text-[10px] text-slate-500">
                                Centang cabang yang diizinkan ikut memesan dari toko-toko ini (selain cabang pembuatnya).
                            </p>
                            <div className="grid grid-cols-2 gap-1.5 mt-1.5 p-2 bg-white border border-slate-200 rounded-md max-h-32 overflow-y-auto">
                                {locations.map(loc => {
                                    const checked = sharedLocationIds.includes(loc.id)
                                    return (
                                        <label
                                            key={loc.id}
                                            className="flex items-center gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer text-xs"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleToggleShared(loc.id)}
                                                disabled={isPending}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className="truncate">{loc.name}</span>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Peruntukan Unit Bisnis */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-800">Peruntukan Unit Bisnis</Label>
                        <select
                            className="w-full h-8.5 text-xs bg-white border border-slate-200 rounded-md px-2 focus:ring-1 focus:ring-blue-500"
                            value={targetBusiness}
                            onChange={e => setTargetBusiness(e.target.value as any)}
                            disabled={isPending}
                        >
                            <option value="ALL">Semua Unit (Batching Plant & Stone Crusher)</option>
                            <option value="BP">Khusus Batching Plant (BP)</option>
                            <option value="CRUSHER">Khusus Stone Crusher (SC)</option>
                        </select>
                    </div>

                    {/* Relasi Otomatis ke Barang Katalog */}
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg">
                        <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-emerald-950">
                            <input
                                type="checkbox"
                                checked={syncItems}
                                onChange={e => setSyncItems(e.target.checked)}
                                disabled={isPending}
                                className="h-4 w-4 mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <div>
                                <span>Otomatis Sinkronkan Seluruh Barang Katalog Terkait</span>
                                <p className="text-[11px] font-normal text-emerald-800/80 mt-0.5">
                                    {totalItems > 0
                                        ? `Seluruh ${totalItems} item barang dari ${selectedSuppliers.length} toko ini akan ikut diatur menjadi ${scopeMode === "GLOBAL" ? 'Global' : 'Lokal Cabang'}.`
                                        : "Barang-barang yang nantinya terdaftar di toko ini akan mengikuti cakupan yang sama."}
                                </p>
                            </div>
                        </label>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            className="h-8.5 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-8.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Terapkan ke {selectedSuppliers.length} Toko
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
