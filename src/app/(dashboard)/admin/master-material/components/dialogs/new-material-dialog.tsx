"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { AlertTriangle } from "lucide-react"

interface NewMaterialDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    code: string
    onCodeChange: (code: string) => void
    name: string
    onNameChange: (name: string) => void
    category: string
    onCategoryChange: (category: string) => void
    density: number | string
    onDensityChange: (density: string) => void
    description: string
    onDescriptionChange: (description: string) => void
    initialPrice: number | string
    onInitialPriceChange: (price: string) => void
    effectiveDate: string
    onEffectiveDateChange: (date: string) => void
    error: string
    isPending: boolean
    onSubmit: () => void
}

export function NewMaterialDialog({
    open,
    onOpenChange,
    code,
    onCodeChange,
    name,
    onNameChange,
    category,
    onCategoryChange,
    density,
    onDensityChange,
    description,
    onDescriptionChange,
    initialPrice,
    onInitialPriceChange,
    effectiveDate,
    onEffectiveDateChange,
    error,
    isPending,
    onSubmit,
}: NewMaterialDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold">Tambah Jenis Material Agregat</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Daftarkan material non-semen baru ke dalam katalog harga perusahaan.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3.5 py-2">
                    {error && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Kode Unik</Label>
                            <Input
                                placeholder="Contoh: SIRTU"
                                className="h-9 text-xs font-mono uppercase mt-1"
                                value={code}
                                onChange={e => onCodeChange(e.target.value.toUpperCase())}
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Kategori</Label>
                            <Select value={category} onValueChange={onCategoryChange}>
                                <SelectTrigger className="h-9 text-xs mt-1 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PASIR">Pasir</SelectItem>
                                    <SelectItem value="BATU">Batu / Split</SelectItem>
                                    <SelectItem value="AGREGAT">Agregat Campuran</SelectItem>
                                    <SelectItem value="LAINNYA">Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Nama Material</Label>
                        <Input
                            placeholder="Contoh: Sirtu Urug Jayapura"
                            className="h-9 text-xs mt-1"
                            value={name}
                            onChange={e => onNameChange(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Harga Awal per m³ (Rp)</Label>
                            <Input
                                type="number"
                                placeholder="Contoh: 160000"
                                className="h-9 text-xs font-mono font-bold mt-1"
                                value={initialPrice}
                                onChange={e => onInitialPriceChange(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Mulai Berlaku</Label>
                            <Input
                                type="date"
                                className="h-9 text-xs mt-1"
                                value={effectiveDate}
                                onChange={e => onEffectiveDateChange(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Estimasi Densitas (kg/m³, Opsional)</Label>
                        <Input
                            type="number"
                            placeholder="Contoh: 1400"
                            className="h-9 text-xs font-mono mt-1"
                            value={density}
                            onChange={e => onDensityChange(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Deskripsi / Catatan (Opsional)</Label>
                        <Input
                            placeholder="Keterangan kegunaan material"
                            className="h-9 text-xs mt-1"
                            value={description}
                            onChange={e => onDescriptionChange(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
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
                        onClick={onSubmit}
                        disabled={isPending}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-medium"
                    >
                        {isPending ? "Mendaftarkan..." : "Daftarkan Material"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
