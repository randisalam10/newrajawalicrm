"use client"

import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { AlertTriangle, Loader2, Sparkles, History, Tag, Check } from "lucide-react"
import { fmt, fmtDateInput } from "../../helpers"
import { MasterMaterialItem, MaterialLocation } from "../../types"

export type PriceDialogMode = "NEW_PRICE" | "CORRECTION"

interface UnifiedPriceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    material: MasterMaterialItem | null
    locations: MaterialLocation[]
    selectedLocation: string
    isPending: boolean
    onSaveNewPrice: (payload: {
        materialId: string
        price_per_m3: number
        effective_date: string
        locationIds: string[]
        notes?: string
    }) => Promise<void>
    onSaveCorrection: (payload: {
        id: string
        price_per_m3: number
        effective_date: string
        locationId?: string | null
        notes?: string
    }) => Promise<void>
}

export function UnifiedPriceDialog({
    open,
    onOpenChange,
    material,
    locations,
    selectedLocation,
    isPending,
    onSaveNewPrice,
    onSaveCorrection
}: UnifiedPriceDialogProps) {
    const [mode, setMode] = useState<PriceDialogMode>("NEW_PRICE")
    const [priceValue, setPriceValue] = useState<string>("")
    const [effectiveDate, setEffectiveDate] = useState<string>("")
    const [targetLocationId, setTargetLocationId] = useState<string>("all")
    const [notes, setNotes] = useState<string>("")
    const [errorMessage, setErrorMessage] = useState<string>("")

    // Inisialisasi saat dialog dibuka atau material berubah
    useEffect(() => {
        if (open && material) {
            setMode("NEW_PRICE")
            const currentP = material.displayPrice ?? material.currentPrice ?? 0
            setPriceValue(currentP > 0 ? String(currentP) : "")
            setEffectiveDate(fmtDateInput(new Date()))
            
            // Lokasi default: ikuti filter aktif jika spesifik cabang, atau "all"
            const initLoc = selectedLocation && selectedLocation !== "all" ? selectedLocation : "all"
            setTargetLocationId(initLoc)
            setNotes("")
            setErrorMessage("")
        }
    }, [open, material, selectedLocation])

    // Saat mode beralih ke CORRECTION, isi dengan tanggal & lokasi data aktif saat ini
    const handleModeChange = (newMode: PriceDialogMode) => {
        setMode(newMode)
        setErrorMessage("")
        if (newMode === "CORRECTION" && material) {
            const currentP = material.displayPrice ?? material.currentPrice ?? 0
            setPriceValue(currentP > 0 ? String(currentP) : "")
            if (material.displayEffectiveDate || material.currentEffectiveDate) {
                setEffectiveDate(fmtDateInput(material.displayEffectiveDate || material.currentEffectiveDate || new Date()))
            }
            setTargetLocationId(material.currentLocationId || (selectedLocation !== "all" ? selectedLocation : "all"))
        } else if (newMode === "NEW_PRICE") {
            setEffectiveDate(fmtDateInput(new Date()))
            setTargetLocationId(selectedLocation && selectedLocation !== "all" ? selectedLocation : "all")
        }
    }

    const handleSubmit = async () => {
        setErrorMessage("")
        const numPrice = Number(priceValue)
        if (!numPrice || numPrice <= 0) {
            setErrorMessage("Nominal harga per kubik (m³) harus lebih besar dari 0.")
            return
        }
        if (!effectiveDate) {
            setErrorMessage("Tanggal mulai berlaku wajib dipilih.")
            return
        }
        if (!material) return

        try {
            if (mode === "NEW_PRICE") {
                await onSaveNewPrice({
                    materialId: material.id,
                    price_per_m3: numPrice,
                    effective_date: effectiveDate,
                    locationIds: [targetLocationId],
                    notes: notes.trim() || undefined
                })
            } else {
                // Mode Koreksi Data
                const historyId = material.currentHistoryId || material.histories?.[0]?.id
                if (!historyId) {
                    setErrorMessage("Record riwayat aktif tidak ditemukan untuk dikoreksi.")
                    return
                }
                await onSaveCorrection({
                    id: historyId,
                    price_per_m3: numPrice,
                    effective_date: effectiveDate,
                    locationId: targetLocationId === "all" ? null : targetLocationId,
                    notes: notes.trim() || undefined
                })
            }
            onOpenChange(false)
        } catch (err: any) {
            setErrorMessage(err.message || "Gagal menyimpan perubahan harga.")
        }
    }

    if (!material) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg bg-white">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-slate-900">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                            <Tag className="w-4 h-4" />
                        </div>
                        <DialogTitle className="text-base font-bold">
                            Kelola Harga Material: {material.name}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-slate-500">
                        Kode: <span className="font-mono font-semibold text-slate-700">{material.code}</span> • Satuan: 1 {material.unit} {material.defaultDensity ? `(±${material.defaultDensity} kg)` : ""}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-1">
                    {errorMessage && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Mode Selector: Tetapkan Tarif Baru vs Koreksi Data */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Jenis Tindakan</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Option 1: New Price */}
                            <button
                                type="button"
                                onClick={() => handleModeChange("NEW_PRICE")}
                                className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                                    mode === "NEW_PRICE"
                                        ? "bg-blue-50/70 border-blue-500 ring-1 ring-blue-500 text-blue-950"
                                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Tetapkan Tarif Baru</span>
                                    </span>
                                    {mode === "NEW_PRICE" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug">
                                    Berlaku mulai tanggal baru. Transaksi masa lalu sebelum tanggal ini tetap aman menggunakan harga lama.
                                </p>
                            </button>

                            {/* Option 2: Correction */}
                            <button
                                type="button"
                                onClick={() => handleModeChange("CORRECTION")}
                                className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                                    mode === "CORRECTION"
                                        ? "bg-amber-50/70 border-amber-500 ring-1 ring-amber-500 text-amber-950"
                                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold flex items-center gap-1.5 text-amber-900">
                                        <History className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Koreksi Data Ini</span>
                                    </span>
                                    {mode === "CORRECTION" && <Check className="w-3.5 h-3.5 text-amber-600" />}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug">
                                    Perbaiki salah ketik nominal atau tanggal pada data tarif aktif saat ini tanpa membuat riwayat baru.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Harga Satuan per m³ (Rp)</Label>
                            <Input
                                type="number"
                                placeholder="Contoh: 350000"
                                value={priceValue}
                                onChange={(e) => setPriceValue(e.target.value)}
                                className="h-9 text-xs font-mono font-bold"
                            />
                            {Number(priceValue) > 0 && (
                                <p className="text-[11px] text-blue-600 font-mono font-medium">
                                    = {fmt(Number(priceValue))} / m³
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">
                                {mode === "NEW_PRICE" ? "Mulai Berlaku Sejak" : "Tanggal Berlaku Efektif"}
                            </Label>
                            <Input
                                type="date"
                                value={effectiveDate}
                                onChange={(e) => setEffectiveDate(e.target.value)}
                                className="h-9 text-xs font-mono"
                            />
                            <p className="text-[11px] text-slate-400">
                                {mode === "NEW_PRICE" ? "Tanggal aktif berlakunya harga baru ini" : "Koreksi tanggal efektif data ini"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Lingkup Cabang / Plant</Label>
                        <Select value={targetLocationId} onValueChange={setTargetLocationId}>
                            <SelectTrigger className="h-9 text-xs bg-white">
                                <SelectValue placeholder="Pilih Lingkup Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang (Standar Global)</SelectItem>
                                {locations.map((loc) => (
                                    <SelectItem key={loc.id} value={loc.id}>
                                        Khusus Cabang: {loc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-slate-400">
                            {targetLocationId === "all"
                                ? "Harga acuan ini berlaku umum untuk seluruh cabang yang tidak memiliki tarif khusus."
                                : `Harga acuan ini hanya berlaku khusus untuk transaksi di plant terpilih.`}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Catatan / Alasan Perubahan (Opsional)</Label>
                        <Textarea
                            placeholder="Contoh: Kenaikan biaya quarry dari supplier per awal kuartal."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="text-xs h-16 resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Batal
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isPending || !priceValue}
                        className={mode === "NEW_PRICE" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        ) : mode === "NEW_PRICE" ? (
                            <Sparkles className="w-4 h-4 mr-1.5" />
                        ) : (
                            <Check className="w-4 h-4 mr-1.5" />
                        )}
                        <span>{mode === "NEW_PRICE" ? "Simpan Tarif Baru" : "Simpan Koreksi"}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
