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
import { MaterialLocation } from "../../types"

interface EditHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    materialName: string
    price: number | string
    onPriceChange: (price: string) => void
    effectiveDate: string
    onEffectiveDateChange: (date: string) => void
    locations: MaterialLocation[]
    locationId: string
    onLocationIdChange: (id: string) => void
    notes: string
    onNotesChange: (notes: string) => void
    isPending: boolean
    onSave: () => void
}

export function EditHistoryDialog({
    open,
    onOpenChange,
    materialName,
    price,
    onPriceChange,
    effectiveDate,
    onEffectiveDateChange,
    locations,
    locationId,
    onLocationIdChange,
    notes,
    onNotesChange,
    isPending,
    onSave,
}: EditHistoryDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold">Koreksi Riwayat Harga</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Perbaiki nilai harga atau tanggal berlaku untuk catatan riwayat: {materialName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3.5 py-2">
                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Harga Satuan (Rp / m³)</Label>
                        <Input
                            type="number"
                            className="h-9 text-xs font-mono font-bold mt-1"
                            value={price}
                            onChange={e => onPriceChange(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Tanggal Mulai Berlaku</Label>
                        <Input
                            type="date"
                            className="h-9 text-xs mt-1"
                            value={effectiveDate}
                            onChange={e => onEffectiveDateChange(e.target.value)}
                        />
                    </div>

                    {locations.length > 1 && (
                        <div>
                            <Label className="text-xs font-semibold text-slate-700">Lingkup Cabang</Label>
                            <Select value={locationId} onValueChange={onLocationIdChange}>
                                <SelectTrigger className="h-9 text-xs mt-1 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Cabang (Global)</SelectItem>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Catatan / Alasan</Label>
                        <Input
                            className="h-9 text-xs mt-1"
                            value={notes}
                            onChange={e => onNotesChange(e.target.value)}
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
                        onClick={onSave}
                        disabled={isPending}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-medium"
                    >
                        {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
