"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CrusherMaterialSourceItem } from "../../types"
import type { MaterialInController } from "./use-material-in"
import { FEED_LABEL } from "./use-material-in"
import { DriverPicker } from "./driver-picker"
import { TruckPicker } from "./truck-picker"

type Props = {
    ctl: MaterialInController
    sources: CrusherMaterialSourceItem[]
    canViewWages?: boolean
    onAddTruck: () => void
    onAddDriver: (initialName: string) => void
}

const RIT_PRESETS = [1, 5, 10, 20, 50]

export function MaterialInForm({ ctl, sources, canViewWages = false, onAddTruck, onAddDriver }: Props) {
    return (
        <div className="space-y-2.5">
            {/* Pilih cepat truk dari Master Kendaraan Crusher */}
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Pilih cepat armada truk (master)</span>
                    <button type="button" onClick={onAddTruck} className="text-[11px] font-semibold text-blue-700 hover:underline">
                        + Truk baru
                    </button>
                </div>
                {ctl.truckOptions.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">Belum ada truk di Master Kendaraan Crusher.</p>
                ) : (
                    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible no-scrollbar">
                        {ctl.truckOptions.map((t) => (
                            <button
                                key={t.plate}
                                type="button"
                                onClick={() => ctl.selectTruck(t.plate)}
                                className={cn(
                                    "shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap transition-colors",
                                    ctl.plateNumber === t.plate
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                                )}
                            >
                                {t.plate}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="mi-plate" className="text-[11px] text-slate-600">Plat Truk (Master)</Label>
                        <button type="button" onClick={onAddTruck} className="text-[10px] font-semibold text-blue-700 hover:underline">
                            + Tambah
                        </button>
                    </div>
                    <TruckPicker
                        id="mi-plate"
                        value={ctl.plateNumber}
                        options={ctl.truckOptions}
                        onChange={ctl.selectTruck}
                        onAddNew={(p) => onAddTruck()}
                    />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="mi-driver" className="text-[11px] text-slate-600">Sopir (Master SC)</Label>
                        <button type="button" onClick={() => onAddDriver("")} className="text-[10px] font-semibold text-blue-700 hover:underline">
                            + Tambah
                        </button>
                    </div>
                    <DriverPicker
                        id="mi-driver"
                        value={ctl.driverName}
                        options={ctl.driverOptions}
                        onChange={ctl.setDriverName}
                        onAddNew={onAddDriver}
                    />
                </div>
            </div>

            <div className="grid grid-cols-[1fr_88px] gap-2">
                <div className="space-y-1 min-w-0">
                    <Label className="text-[11px] text-slate-600">Sumber material</Label>
                    <Select value={ctl.sourceId} onValueChange={ctl.changeSource}>
                        <SelectTrigger id="mi-source" className="h-9 text-xs bg-white w-full">
                            <SelectValue placeholder="Pilih sumber" />
                        </SelectTrigger>
                        <SelectContent>
                            {sources.map((s) => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                    {s.name} ({s.default_distance_km} km)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="mi-distance" className="text-[11px] text-slate-600">Jarak (km)</Label>
                    <Input
                        id="mi-distance"
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        value={ctl.distanceKm}
                        onChange={(e) => ctl.setDistanceKm(e.target.value)}
                        className="h-9 text-xs font-semibold bg-white"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <Label htmlFor="mi-ritase" className="text-[11px] text-slate-600">Jumlah retase</Label>
                <div className="flex items-center gap-1.5">
                    <Button type="button" variant="outline" onClick={() => ctl.setRitase(Math.max(1, ctl.ritase - 1))} className="h-9 w-9 p-0 shrink-0" aria-label="Kurangi retase">
                        <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                        id="mi-ritase"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={ctl.ritase || ""}
                        onChange={(e) => {
                            const v = parseInt(e.target.value, 10)
                            ctl.setRitase(Number.isFinite(v) ? v : 0)
                        }}
                        onBlur={() => { if (!ctl.ritase || ctl.ritase < 1) ctl.setRitase(1) }}
                        className="h-9 w-16 text-center text-sm font-bold bg-white shrink-0"
                    />
                    <Button type="button" variant="outline" onClick={() => ctl.setRitase(ctl.ritase + 1)} className="h-9 w-9 p-0 shrink-0" aria-label="Tambah retase">
                        <Plus className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {RIT_PRESETS.map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => ctl.setRitase(n)}
                                className={cn(
                                    "shrink-0 h-9 min-w-9 px-2 rounded-md text-xs font-bold border transition-colors",
                                    ctl.ritase === n ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200",
                                )}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
                {canViewWages ? (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>Tarif Retase Sopir: <b>Rp 4.500 / ret</b></span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Total Upah: Rp {((ctl.ritase || 1) * 4500).toLocaleString("id-ID")}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>Ritase Masuk: <b>{ctl.ritase || 1} Ret</b></span>
                        <span className="text-slate-400 italic">Retase diproses Finance</span>
                    </div>
                )}
            </div>

            <Input
                id="mi-notes"
                placeholder="Catatan (opsional)"
                value={ctl.notes}
                onChange={(e) => ctl.setNotes(e.target.value)}
                className="h-9 text-xs bg-white"
            />

            <Button
                id="mi-submit"
                type="button"
                onClick={ctl.add}
                disabled={ctl.isSaving}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
            >
                {ctl.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Simpan {FEED_LABEL[ctl.feedType].title}
            </Button>
        </div>
    )
}
