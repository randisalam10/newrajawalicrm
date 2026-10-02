"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tag, Loader2 } from "lucide-react"

interface CategoryModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    mode: "create" | "edit"
    form: {
        id?: string
        name: string
        description: string
        requireVehicleKm: boolean
    }
    setForm: React.Dispatch<React.SetStateAction<{
        id?: string
        name: string
        description: string
        requireVehicleKm: boolean
    }>>
    onSave: () => void
    isSubmitting: boolean
}

export function CategoryModal({
    isOpen,
    onOpenChange,
    mode,
    form,
    setForm,
    onSave,
    isSubmitting,
}: CategoryModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="text-base flex items-center gap-2">
                        <Tag className="h-4 w-4 text-blue-600" />
                        {mode === "create" ? "Tambah Kategori RBL Baru" : "Edit Kategori RBL"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        {mode === "create"
                            ? "Kategori baru akan langsung dapat dipilih pada form input RBL."
                            : "Perbarui nama atau preferensi unit armada kategori ini."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 text-xs">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold">Nama Kategori *</Label>
                        <Input
                            placeholder="Contoh: Oli Hidrolik & Transmisi"
                            value={form.name}
                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                            className="h-8 text-xs font-medium"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Deskripsi / Peruntukan (Opsional)</Label>
                        <Input
                            placeholder="Contoh: Penggantian oli berkala truck mixer dan loader"
                            value={form.description}
                            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                            className="h-8 text-xs"
                        />
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="requireVehicleKmCheck"
                                checked={form.requireVehicleKm}
                                onChange={e => setForm(prev => ({ ...prev, requireVehicleKm: e.target.checked }))}
                                className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer h-4 w-4"
                            />
                            <label htmlFor="requireVehicleKmCheck" className="text-xs text-amber-900 font-medium cursor-pointer leading-tight">
                                Aktifkan Input Unit Armada & KM Odometer
                                <span className="block text-[11px] text-amber-700 font-normal mt-0.5">
                                    Cocok untuk BBM, solar, pelumas oli, atau sparepart armada agar form otomatis memunculkan pilihan unit kendaraan & odometer.
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={onSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                    >
                        {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        {mode === "create" ? "Buat Kategori" : "Simpan Perubahan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
