"use client"

import React, { useTransition, useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Globe, Building2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { createSupplier, updateSupplier } from "../actions"
import { SupplierItem } from "../types"

interface SupplierModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData: SupplierItem | null
    onSuccess?: () => void
    locations?: { id: string; name: string; type: string }[]
    isCentral?: boolean
    userLocationId?: string | null
}

export function SupplierModal({
    open,
    onOpenChange,
    initialData,
    onSuccess,
    locations = [],
    isCentral = false,
    userLocationId = null,
}: SupplierModalProps) {
    const [isPending, startTransition] = useTransition()
    const isEdit = Boolean(initialData)

    const [isGlobal, setIsGlobal] = useState(false)
    const [selectedLocationId, setSelectedLocationId] = useState("")
    const [selectedTargetBusiness, setSelectedTargetBusiness] = useState<"ALL" | "BP" | "CRUSHER">("ALL")
    const [sharedLocationIds, setSharedLocationIds] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            if (initialData) {
                setIsGlobal(Boolean(initialData.is_global))
                setSelectedLocationId(initialData.locationId || "")
                setSelectedTargetBusiness(initialData.target_business || "ALL")
                setSharedLocationIds(initialData.sharedLocations?.map(l => l.id) || [])
            } else {
                setIsGlobal(isCentral ? true : false)
                setSelectedLocationId(userLocationId || "")
                setSelectedTargetBusiness("ALL")
                setSharedLocationIds([])
            }
        }
    }, [open, initialData, isCentral, userLocationId])

    const handleToggleShared = (locId: string) => {
        setSharedLocationIds(prev =>
            prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
        )
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        if (isCentral) {
            formData.set("is_global", isGlobal ? "true" : "false")
            formData.set("target_business", selectedTargetBusiness)
            formData.set("locationId", isGlobal ? "" : selectedLocationId)
            formData.delete("sharedLocationIds")
            if (!isGlobal) {
                sharedLocationIds.forEach(id => {
                    if (id !== selectedLocationId) {
                        formData.append("sharedLocationIds", id)
                    }
                })
            }
        }

        startTransition(async () => {
            const res = isEdit && initialData
                ? await updateSupplier(initialData.id, formData)
                : await createSupplier(formData)

            if (res.success) {
                toast.success(isEdit ? "Data toko berhasil diperbarui" : "Toko baru berhasil ditambahkan")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(res.error || "Gagal menyimpan data toko")
            }
        })
    }

    const userLocName = locations.find(l => l.id === userLocationId)?.name || "Cabang Anda"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold text-slate-900">
                        {isEdit ? "Edit Data Toko / Supplier" : "Tambah Toko / Supplier Baru"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                            Nama Toko / Supplier <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={initialData?.name || ""}
                            placeholder="Contoh: PT Jasindo Trans Papua"
                            required
                            disabled={isPending}
                            className="h-9 text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="contact" className="text-xs font-semibold text-slate-700">
                            Nomor Kontak / WhatsApp
                        </Label>
                        <Input
                            id="contact"
                            name="contact"
                            defaultValue={initialData?.contact || ""}
                            placeholder="Contoh: 081234567890 / 0967-123456"
                            disabled={isPending}
                            className="h-9 text-sm"
                        />
                        <p className="text-[11px] text-slate-500">
                            Nomor telepon atau kontak PIC toko untuk konfirmasi pesanan PO.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
                            Alamat Lengkap
                        </Label>
                        <Textarea
                            id="address"
                            name="address"
                            defaultValue={initialData?.address || ""}
                            placeholder="Contoh: Jl. Raya Abepura No. 12, Jayapura Selatan"
                            disabled={isPending}
                            rows={2}
                            className="text-sm resize-none"
                        />
                    </div>

                    {/* Scoping Section */}
                    {isCentral ? (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-slate-800">
                                    Pengaturan Distribusi & Sharing Cabang (Admin Logistik)
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-[11px] text-slate-600 font-medium">Peruntukan Unit</Label>
                                    <select
                                        className="w-full mt-1 h-8 text-xs bg-white border border-slate-200 rounded-md px-2 focus:ring-1 focus:ring-blue-500"
                                        value={selectedTargetBusiness}
                                        onChange={e => setSelectedTargetBusiness(e.target.value as any)}
                                        disabled={isPending}
                                    >
                                        <option value="ALL">Semua Unit (BP & Crusher)</option>
                                        <option value="BP">Khusus Batching Plant</option>
                                        <option value="CRUSHER">Khusus Stone Crusher</option>
                                    </select>
                                </div>
                                <div className="flex flex-col justify-end pb-1">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                                        <input
                                            type="checkbox"
                                            checked={isGlobal}
                                            onChange={e => setIsGlobal(e.target.checked)}
                                            disabled={isPending}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="flex items-center gap-1">
                                            <Globe className="w-3.5 h-3.5 text-emerald-600" />
                                            Berlaku Nasional (Global)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {!isGlobal && (
                                <div className="space-y-2 pt-2 border-t border-slate-200">
                                    <div>
                                        <Label className="text-[11px] text-slate-700 font-semibold">Cabang Asal / Pembuat Toko</Label>
                                        <select
                                            className="w-full mt-1 h-8 text-xs bg-white border border-slate-200 rounded-md px-2"
                                            value={selectedLocationId}
                                            onChange={e => setSelectedLocationId(e.target.value)}
                                            disabled={isPending}
                                        >
                                            <option value="">Pilih Cabang Pembuat...</option>
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>
                                                    {loc.name} ({loc.type})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label className="text-[11px] text-slate-700 font-semibold">
                                            Beri Akses Tambahan ke Cabang Lain (Opsional):
                                        </Label>
                                        <div className="grid grid-cols-2 gap-1.5 mt-1.5 p-2 bg-white border border-slate-200 rounded-md max-h-32 overflow-y-auto">
                                            {locations
                                                .filter(l => l.id !== selectedLocationId)
                                                .map(loc => {
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
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-md text-xs text-blue-900 flex items-start gap-2">
                            <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Pendaftaran Khusus {userLocName}</p>
                                <p className="text-[11px] text-blue-700/80 mt-0.5">
                                    Toko ini otomatis terdaftar untuk operasional cabang Anda dan dapat dipantau oleh Admin Logistik.
                                </p>
                            </div>
                        </div>
                    )}

                    {isEdit && isCentral && (
                        <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-md">
                            <label className="flex items-start gap-2 cursor-pointer text-xs font-semibold text-emerald-950">
                                <input
                                    type="checkbox"
                                    name="syncItems"
                                    value="true"
                                    defaultChecked={true}
                                    className="h-4 w-4 mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                    <span>Sinkronkan cakupan ke seluruh barang katalog toko ini</span>
                                    <p className="text-[11px] font-normal text-emerald-800/80 mt-0.5">
                                        Seluruh katalog barang yang terdaftar di toko ini otomatis mengikuti status cakupan (Global / Cabang) toko.
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            className="h-9 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-9 text-xs font-semibold"
                        >
                            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            {isEdit ? "Simpan Perubahan" : "Tambah Toko"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
