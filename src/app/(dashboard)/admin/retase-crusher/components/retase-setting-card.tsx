"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    CrusherRetaseSettingDTO,
    CrusherRetaseFormulaType,
    CrusherLocationOption,
} from "../types"
import { saveCrusherRetaseSetting } from "../actions"
import { toast } from "sonner"
import { Settings, Save, Loader2, Info } from "lucide-react"

type Props = {
    initialSetting: CrusherRetaseSettingDTO | null
    locations: CrusherLocationOption[]
    onSaved: () => void
}

export function RetaseSettingCard({ initialSetting, locations, onSaved }: Props) {
    const [isPending, startTransition] = useTransition()

    const [locationId, setLocationId] = useState<string>(initialSetting?.locationId || "all")
    const [formulaType, setFormulaType] = useState<CrusherRetaseFormulaType>(
        initialSetting?.formula_type || "PER_KM_TIERED"
    )
    const [rateDtKecil, setRateDtKecil] = useState(String(initialSetting?.rate_dt_kecil ?? 320))
    const [rateDtBesar, setRateDtBesar] = useState(String(initialSetting?.rate_dt_besar ?? 0))
    const [ratePerKm, setRatePerKm] = useState(String(initialSetting?.rate_per_km ?? 0))
    const [ratePerM3Km, setRatePerM3Km] = useState(String(initialSetting?.rate_per_m3_km ?? 0))
    const [rateFlatRit, setRateFlatRit] = useState(String(initialSetting?.rate_flat_rit ?? 0))
    const [effectiveDate, setEffectiveDate] = useState(initialSetting?.effective_date || "")
    const [notes, setNotes] = useState(initialSetting?.notes || "")

    const handleSave = () => {
        startTransition(async () => {
            try {
                await saveCrusherRetaseSetting({
                    id: initialSetting?.id,
                    locationId: locationId === "all" ? null : locationId,
                    formula_type: formulaType,
                    rate_dt_kecil: parseFloat(rateDtKecil.replace(",", ".")) || 0,
                    rate_dt_besar: parseFloat(rateDtBesar.replace(",", ".")) || 0,
                    rate_per_km: parseFloat(ratePerKm.replace(",", ".")) || 0,
                    rate_per_m3_km: parseFloat(ratePerM3Km.replace(",", ".")) || 0,
                    rate_flat_rit: parseFloat(rateFlatRit.replace(",", ".")) || 0,
                    effective_date: effectiveDate || null,
                    notes: notes.trim() || null,
                })
                toast.success("Pengaturan rumus & tarif retase stone crusher berhasil disimpan")
                onSaved()
            } catch (err: any) {
                toast.error(err.message || "Gagal menyimpan pengaturan tarif")
            }
        })
    }

    return (
        <Card className="shadow-none border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Settings className="h-4 w-4 text-blue-600" />
                        <span>Pengaturan Rumus & Tarif Retase Non-BP (SuperAdmin / Finance)</span>
                    </CardTitle>
                    <span className="text-xs text-slate-500">
                        Tarif ini tidak dapat dilihat/diedit oleh operator crusher
                    </span>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold">Cabang Stone Crusher</Label>
                        <Select value={locationId} onValueChange={setLocationId}>
                            <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                                <SelectValue placeholder="Pilih Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Stone Crusher (Universal)</SelectItem>
                                {locations.map((l) => (
                                    <SelectItem key={l.id} value={l.id}>
                                        {l.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold">Jenis Rumus Perhitungan</Label>
                        <Select
                            value={formulaType}
                            onValueChange={(val) => setFormulaType(val as CrusherRetaseFormulaType)}
                        >
                            <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 font-bold">
                                <SelectValue placeholder="Pilih Rumus" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PER_KM_TIERED">
                                    Berdasarkan Ukuran DT (DT Kecil vs DT Besar) × KM × Rit
                                </SelectItem>
                                <SelectItem value="PER_KM_FLAT">
                                    Flat Tarif per KM (Tarif × KM × Rit)
                                </SelectItem>
                                <SelectItem value="PER_M3_KM">
                                    Tarif per m³ per KM (Tarif × Volume × KM)
                                </SelectItem>
                                <SelectItem value="PER_RIT_FLAT">
                                    Flat per Ritase (Tarif × Rit)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Input Fields Sesuai Rumus */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    {formulaType === "PER_KM_TIERED" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                                    Tarif DT Kecil (Rp / KM / Rit)
                                </Label>
                                <Input
                                    type="number"
                                    step="10"
                                    value={rateDtKecil}
                                    onChange={(e) => setRateDtKecil(e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-slate-900 font-bold text-amber-700"
                                    placeholder="Contoh: 320"
                                />
                                <span className="text-[11px] text-slate-500">
                                    Rumus: Rp {rateDtKecil} × Jarak (KM) × Rit
                                </span>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Tarif DT Besar (Rp / KM / Rit)
                                </Label>
                                <Input
                                    type="number"
                                    step="10"
                                    value={rateDtBesar}
                                    onChange={(e) => setRateDtBesar(e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-slate-900 font-bold"
                                    placeholder="Contoh: 0 jika tidak ada upah khusus"
                                />
                                <span className="text-[11px] text-slate-500">
                                    Masukkan 0 jika dump truck besar tidak diberikan retase
                                </span>
                            </div>
                        </div>
                    )}

                    {formulaType === "PER_KM_FLAT" && (
                        <div className="space-y-1 max-w-sm">
                            <Label className="text-xs font-semibold">Tarif Flat per KM (Rp / KM / Rit)</Label>
                            <Input
                                type="number"
                                step="10"
                                value={ratePerKm}
                                onChange={(e) => setRatePerKm(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900 font-bold"
                                placeholder="Contoh: 350"
                            />
                        </div>
                    )}

                    {formulaType === "PER_M3_KM" && (
                        <div className="space-y-1 max-w-sm">
                            <Label className="text-xs font-semibold">Tarif per m³ per KM (Rp / m³ / KM)</Label>
                            <Input
                                type="number"
                                step="10"
                                value={ratePerM3Km}
                                onChange={(e) => setRatePerM3Km(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900 font-bold"
                                placeholder="Contoh: 50"
                            />
                        </div>
                    )}

                    {formulaType === "PER_RIT_FLAT" && (
                        <div className="space-y-1 max-w-sm">
                            <Label className="text-xs font-semibold">Tarif Flat per Rit (Rp / Rit)</Label>
                            <Input
                                type="number"
                                step="1000"
                                value={rateFlatRit}
                                onChange={(e) => setRateFlatRit(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900 font-bold"
                                placeholder="Contoh: 50000"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="space-y-1">
                            <Label className="text-xs">Tanggal Efektif Berlaku (Opsional)</Label>
                            <Input
                                type="date"
                                value={effectiveDate}
                                onChange={(e) => setEffectiveDate(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Keterangan / Catatan Kebijakan</Label>
                            <Input
                                placeholder="Contoh: Berlaku untuk pengiriman proyek Holtekamp & Koya"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>Untuk menerapkan tarif ini ke data transaksi yang sudah lalu, gunakan fitur <b>Hitung Ulang (Backdate)</b> di atas.</span>
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        disabled={isPending}
                        onClick={handleSave}
                        className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shrink-0"
                    >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Simpan Pengaturan
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
