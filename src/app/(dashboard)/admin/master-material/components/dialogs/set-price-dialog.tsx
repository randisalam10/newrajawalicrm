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
import { AlertTriangle, Info } from "lucide-react"
import { fmt } from "../../helpers"
import { MasterMaterialItem, MaterialLocation } from "../../types"

interface SetPriceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    materials: MasterMaterialItem[]
    locations: MaterialLocation[]
    materialId: string
    onMaterialIdChange: (id: string) => void
    priceValue: number | string
    onPriceValueChange: (val: string) => void
    effectiveDate: string
    onEffectiveDateChange: (date: string) => void
    locationIds: string[]
    onLocationIdsChange: (ids: string[]) => void
    notes: string
    onNotesChange: (notes: string) => void
    error: string
    isPending: boolean
    onSave: () => void
}

export function SetPriceDialog({
    open,
    onOpenChange,
    materials,
    locations,
    materialId,
    onMaterialIdChange,
    priceValue,
    onPriceValueChange,
    effectiveDate,
    onEffectiveDateChange,
    locationIds,
    onLocationIdsChange,
    notes,
    onNotesChange,
    error,
    isPending,
    onSave,
}: SetPriceDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold">Tetapkan Harga Acuan Material</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Tentukan harga per kubik (m³) dan tanggal mulai berlakunya. Harga lama sebelum tanggal ini tidak akan berubah (backdate safe).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3.5 py-2">
                    {error && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Material Agregat</Label>
                        <Select value={materialId} onValueChange={onMaterialIdChange}>
                            <SelectTrigger className="h-9 text-xs mt-1 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {materials.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.code})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Harga Satuan per Kubik (Rp / m³)</Label>
                        <Input
                            type="number"
                            placeholder="Contoh: 185000"
                            className="h-9 text-xs font-mono font-bold mt-1"
                            value={priceValue}
                            onChange={e => onPriceValueChange(e.target.value)}
                        />
                        {Number(priceValue) > 0 && (
                            <p className="text-[11px] text-blue-600 font-mono mt-0.5">
                                = {fmt(Number(priceValue))} per m³
                            </p>
                        )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Perhatikan Tanggal Mulai Berlaku (Backdate)</span>
                        </div>
                        <p className="leading-relaxed">
                            Pastikan <strong>Tanggal Mulai Berlaku</strong> di bawah ini diisi sesuai tanggal awal berlakunya harga (contoh: 01 September). Jika Anda hanya ingin memperbaiki tanggal harga yang barusan disimpan, gunakan tombol <strong>"Koreksi Tanggal/Tarif"</strong>.
                        </p>
                    </div>

                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Tanggal Mulai Berlaku (Effective Date)</Label>
                        <Input
                            type="date"
                            className="h-9 text-xs mt-1"
                            value={effectiveDate}
                            onChange={e => onEffectiveDateChange(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-500 mt-0.5">
                            Seluruh transaksi pada tanggal ini dan setelahnya akan menggunakan harga ini. Transaksi sebelum tanggal ini tetap menggunakan harga sebelumnya.
                        </p>
                    </div>

                    {locations.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-700">Lingkup Cabang Berlaku</Label>
                                <div className="flex items-center gap-2 text-[10px]">
                                    <button
                                        type="button"
                                        onClick={() => onLocationIdsChange(["all"])}
                                        className="text-blue-600 hover:underline cursor-pointer"
                                    >
                                        Pilih Global
                                    </button>
                                    <span>•</span>
                                    <button
                                        type="button"
                                        onClick={() => onLocationIdsChange(locations.map(l => l.id))}
                                        className="text-blue-600 hover:underline cursor-pointer"
                                    >
                                        Pilih Semua Cabang
                                    </button>
                                </div>
                            </div>
                            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                        checked={locationIds.includes("all")}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                onLocationIdsChange(["all"])
                                            } else {
                                                onLocationIdsChange([])
                                            }
                                        }}
                                    />
                                    <span>Semua Cabang (Global Default)</span>
                                </label>
                                <div className="border-t border-slate-200/60 pt-2 grid grid-cols-2 gap-1.5">
                                    {locations.map((loc) => {
                                        const isChecked = locationIds.includes(loc.id)
                                        return (
                                            <label key={loc.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-blue-700">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        let next = locationIds.filter(id => id !== "all")
                                                        if (e.target.checked) {
                                                            next.push(loc.id)
                                                        } else {
                                                            next = next.filter(id => id !== loc.id)
                                                        }
                                                        if (next.length === 0) {
                                                            next = ["all"]
                                                        }
                                                        onLocationIdsChange(next)
                                                    }}
                                                />
                                                <span className="truncate" title={loc.name}>{loc.name}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500">
                                {locationIds.includes("all")
                                    ? "Harga berlaku serentak sebagai acuan umum semua cabang."
                                    : `Harga berlaku khusus untuk ${locationIds.length} cabang terpilih.`}
                            </p>
                        </div>
                    )}

                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Keterangan / Alasan Perubahan (Opsional)</Label>
                        <Input
                            placeholder="Contoh: Kenaikan harga solar, penyesuaian tambang galian C"
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
                        {isPending ? "Menyimpan..." : "Simpan Harga"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
