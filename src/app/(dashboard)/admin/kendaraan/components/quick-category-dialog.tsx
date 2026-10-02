"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tag, Sparkles, Loader2 } from "lucide-react"

interface QuickCategoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    categoryName: string
    onCategoryNameChange: (val: string) => void
    categoryCode: string
    onCategoryCodeChange: (val: string) => void
    categoryDesc: string
    onCategoryDescChange: (val: string) => void
    isSaving: boolean
    onSubmit: (e: React.FormEvent) => void
}

export function QuickCategoryDialog({
    open,
    onOpenChange,
    categoryName,
    onCategoryNameChange,
    categoryCode,
    onCategoryCodeChange,
    categoryDesc,
    onCategoryDescChange,
    isSaving,
    onSubmit,
}: QuickCategoryDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[380px] z-[60]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
                            <Tag className="h-4 w-4 text-amber-600" />
                            <span>Tambah Kategori Kendaraan</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Buat jenis/kategori armada baru untuk langsung digunakan pada form.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-3 text-xs">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Nama Kategori *</Label>
                            <Input
                                placeholder="Misal: Concrete Pump, Dump Truck, dll."
                                value={categoryName}
                                onChange={e => onCategoryNameChange(e.target.value)}
                                className="h-8 text-xs"
                                autoFocus
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Kode Singkatan (Opsional)</Label>
                            <Input
                                placeholder="Contoh: CP, DT, OPS"
                                value={categoryCode}
                                onChange={e => onCategoryCodeChange(e.target.value)}
                                className="h-8 text-xs uppercase font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Keterangan (Opsional)</Label>
                            <Input
                                placeholder="Keterangan singkat fungsi armada..."
                                value={categoryDesc}
                                onChange={e => onCategoryDescChange(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-7 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSaving}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            <span>Simpan & Pilih</span>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
