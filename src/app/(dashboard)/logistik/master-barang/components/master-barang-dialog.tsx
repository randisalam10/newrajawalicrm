"use client"

import React, { useState, useEffect } from "react"
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
import { Combobox } from "@/components/ui/combobox"
import { ShieldCheck, Globe, Building2 } from "lucide-react"

interface MasterBarangDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editData: any
    suppliers: any[]
    categories: any[]
    locations?: { id: string; name: string; type: string }[]
    isCentral?: boolean
    userLocationId?: string | null
    onSubmit: (formData: FormData) => Promise<void>
}

export function MasterBarangDialog({
    open,
    onOpenChange,
    editData,
    suppliers,
    categories,
    locations = [],
    isCentral = false,
    userLocationId = null,
    onSubmit,
}: MasterBarangDialogProps) {
    const [formSupplierId, setFormSupplierId] = useState("")
    const [formCategoryId, setFormCategoryId] = useState("")
    const [isGlobal, setIsGlobal] = useState(false)
    const [selectedLocationId, setSelectedLocationId] = useState("")
    const [selectedTargetBusiness, setSelectedTargetBusiness] = useState<"ALL" | "BP" | "CRUSHER">("ALL")
    const [sharedLocationIds, setSharedLocationIds] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            if (editData) {
                setFormSupplierId(editData.supplierId || "")
                setFormCategoryId(editData.categoryId || "")
                setIsGlobal(Boolean(editData.is_global))
                setSelectedLocationId(editData.locationId || "")
                setSelectedTargetBusiness(editData.target_business || "ALL")
                setSharedLocationIds(editData.sharedLocations?.map((l: any) => l.id) || [])
            } else {
                setFormSupplierId("")
                setFormCategoryId("")
                setIsGlobal(isCentral ? true : false)
                setSelectedLocationId(userLocationId || "")
                setSelectedTargetBusiness("ALL")
                setSharedLocationIds([])
            }
        }
    }, [open, editData, isCentral, userLocationId])

    const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }))
    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))

    const handleToggleShared = (locId: string) => {
        setSharedLocationIds(prev =>
            prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
        )
    }

    const handleSubmitInternal = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        formData.set("supplierId", formSupplierId)
        formData.set("categoryId", formCategoryId)

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

        setIsSubmitting(true)
        try {
            await onSubmit(formData)
        } finally {
            setIsSubmitting(false)
        }
    }

    const userLocName = locations.find(l => l.id === userLocationId)?.name || "Cabang Anda"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-3 border-b">
                    <DialogTitle className="text-xl">
                        {editData ? "Edit Data Barang" : "Tambah Barang Baru"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmitInternal} className="space-y-5 pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                        <div className="md:col-span-2 p-3.5 bg-slate-50/80 rounded-lg border border-slate-200">
                            <h3 className="text-xs font-semibold text-slate-700 mb-2.5">Supplier & Kategori PO</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Toko / Supplier *</Label>
                                    <Combobox
                                        options={supplierOptions}
                                        value={formSupplierId}
                                        onChange={setFormSupplierId}
                                        placeholder="Pilih Toko..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Kategori PO *</Label>
                                    <Combobox
                                        options={categoryOptions}
                                        value={formCategoryId}
                                        onChange={setFormCategoryId}
                                        placeholder="Pilih Kategori..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Kode Barang *</Label>
                            <Input
                                name="kode_barang"
                                defaultValue={editData?.kode_barang}
                                placeholder="BRG-001"
                                required
                                disabled={isSubmitting}
                                className="h-8.5 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Nama Barang *</Label>
                            <Input
                                name="name"
                                defaultValue={editData?.name}
                                placeholder="Nama lengkap barang"
                                required
                                disabled={isSubmitting}
                                className="h-8.5 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Part Number / Tipe</Label>
                            <Input
                                name="part_number"
                                defaultValue={editData?.part_number}
                                placeholder="Opsional"
                                disabled={isSubmitting}
                                className="h-8.5 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Merk</Label>
                            <Input
                                name="merk"
                                defaultValue={editData?.merk}
                                placeholder="GITI / Pertamina"
                                disabled={isSubmitting}
                                className="h-8.5 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Satuan *</Label>
                            <Input
                                name="satuan"
                                defaultValue={editData?.satuan}
                                placeholder="PCS / SET / LTR"
                                required
                                disabled={isSubmitting}
                                className="h-8.5 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Harga Satuan (Rp) *</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-medium">Rp</span>
                                <Input
                                    type="number"
                                    name="harga"
                                    defaultValue={editData?.harga}
                                    className="pl-8 h-8.5 text-xs"
                                    placeholder="0"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {editData && (
                            <div className="md:col-span-2 space-y-1">
                                <Label className="text-xs font-medium">Catatan / Alasan Perubahan Harga (Opsional)</Label>
                                <Input
                                    name="reason"
                                    placeholder="Contoh: Kenaikan harga pabrik / supplier"
                                    disabled={isSubmitting}
                                    className="h-8.5 text-xs"
                                />
                            </div>
                        )}
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
                                        disabled={isSubmitting}
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
                                            disabled={isSubmitting}
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
                                        <Label className="text-[11px] text-slate-600 font-medium">Cabang Pemilik Utama</Label>
                                        <select
                                            className="w-full mt-1 h-8 text-xs bg-white border border-slate-200 rounded-md px-2"
                                            value={selectedLocationId}
                                            onChange={e => setSelectedLocationId(e.target.value)}
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Pilih Cabang Utama...</option>
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>
                                                    {loc.name} ({loc.type})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label className="text-[11px] text-slate-600 font-medium">
                                            Bagikan Juga ke Cabang Lain (Shared Branches):
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
                                                                disabled={isSubmitting}
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
                                    Barang ini otomatis terdaftar untuk operasional cabang Anda dan dapat dipantau oleh Admin Logistik.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="border-t pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="h-8.5 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={!formSupplierId || !formCategoryId || isSubmitting}
                            className="h-8.5 text-xs font-semibold"
                        >
                            Simpan Data Barang
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
