"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Sparkles, Check, Loader2 } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

interface POShortcutPriceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shortcutItemId: string
    shortcutItemOptions: { value: string; label: string }[]
    shortcutItem: any
    shortcutNewPrice: number | ""
    setShortcutNewPrice: (v: number | "") => void
    shortcutReason: string
    setShortcutReason: (v: string) => void
    shortcutUpdating: boolean
    shortcutSuccessMsg: string
    onItemSelect: (id: string) => void
    onSave: () => Promise<void>
}

export function POShortcutPriceDialog({
    open,
    onOpenChange,
    shortcutItemId,
    shortcutItemOptions,
    shortcutItem,
    shortcutNewPrice,
    setShortcutNewPrice,
    shortcutReason,
    setShortcutReason,
    shortcutUpdating,
    shortcutSuccessMsg,
    onItemSelect,
    onSave,
}: POShortcutPriceDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-800">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        Shortcut Cepat Ubah Harga Master Barang
                    </DialogTitle>
                    <DialogDescription>
                        Ubah harga master barang secara instan tanpa perlu meninggalkan halaman PO. Perubahan akan otomatis dicatat ke riwayat kenaikan harga master barang.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Pilih Barang</Label>
                        <Combobox
                            options={shortcutItemOptions}
                            value={shortcutItemId}
                            onChange={onItemSelect}
                            placeholder="Ketik untuk mencari barang..."
                        />
                    </div>

                    {shortcutItem && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-xs pb-2 border-b">
                                <div>
                                    <span className="text-slate-500">Satuan:</span> <span className="font-semibold text-slate-800">{shortcutItem.satuan}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Part/Tipe:</span> <span className="font-mono text-slate-800">{shortcutItem.part_number || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Merk:</span> <span className="text-slate-800">{shortcutItem.merk || "-"}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-white p-2.5 rounded border">
                                <span className="text-xs text-slate-500 font-medium">Harga Master Saat Ini:</span>
                                <span className="text-sm font-bold text-slate-900">Rp {Number(shortcutItem.harga).toLocaleString('id-ID')}</span>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Harga Master Baru (Rp) *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={shortcutNewPrice}
                                    onChange={e => setShortcutNewPrice(e.target.value === "" ? "" : Number(e.target.value))}
                                    placeholder="Masukkan harga baru..."
                                    className="font-bold text-slate-900 text-base h-10"
                                />
                                {shortcutNewPrice !== "" && Number(shortcutNewPrice) !== Number(shortcutItem.harga) && (
                                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                                        <span className="text-slate-500">Selisih:</span>
                                        <span className={cn(
                                            "font-bold",
                                            Number(shortcutNewPrice) > Number(shortcutItem.harga) ? "text-amber-600" : "text-blue-600"
                                        )}>
                                            {Number(shortcutNewPrice) > Number(shortcutItem.harga) ? `+Rp ${(Number(shortcutNewPrice) - Number(shortcutItem.harga)).toLocaleString('id-ID')} (+${Math.round(((Number(shortcutNewPrice) - Number(shortcutItem.harga)) / (Number(shortcutItem.harga) || 1)) * 100)}%) ▲ Kenaikan` : `-Rp ${(Number(shortcutItem.harga) - Number(shortcutNewPrice)).toLocaleString('id-ID')} (-${Math.round(((Number(shortcutItem.harga) - Number(shortcutNewPrice)) / (Number(shortcutItem.harga) || 1)) * 100)}%) ▼ Penurunan`}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700">Alasan Perubahan (Opsional)</Label>
                                <Input
                                    value={shortcutReason}
                                    onChange={e => setShortcutReason(e.target.value)}
                                    placeholder="Contoh: Kenaikan harga distributor saat buat PO"
                                    className="text-xs"
                                />
                            </div>

                            {shortcutSuccessMsg && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    {shortcutSuccessMsg}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                    <Button
                        type="button"
                        onClick={onSave}
                        disabled={!shortcutItemId || shortcutNewPrice === "" || Number(shortcutNewPrice) < 0 || shortcutUpdating}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                    >
                        {shortcutUpdating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" /> Simpan & Update Harga Master
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
