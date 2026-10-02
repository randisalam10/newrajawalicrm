"use client"

import React from "react"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import {
    Sparkles,
    Zap,
    Truck,
    AlertTriangle,
    Plus,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface POItemPickerCardProps {
    selectedSupplierId: string
    itemOptions: { value: string; label: string }[]
    selectedItemId: string
    onSelectItem: (val: string) => void
    selectedItem: any
    showPriceEditor: boolean
    setShowPriceEditor: (v: boolean) => void
    inputHarga: number | ""
    setInputHarga: (v: number | "") => void
    inputUpdateMaster: boolean
    setInputUpdateMaster: (v: boolean) => void
    updatingItemId: string | null
    onQuickUpdatePicker: () => Promise<void>
    showVehicleFields: boolean
    selectedVehicle: any
    vehicleOptions: { value: string; label: string }[]
    inputVehicleId: string
    setInputVehicleId: (val: string) => void
    inputKmHm: string
    setInputKmHm: (val: string) => void
    isHM: boolean
    meterUnitLabel: string
    isBackdateAnomaly: boolean
    effectiveLastMeter: number | null
    inputQty: number
    setInputQty: (v: number) => void
    inputKeterangan: string
    setInputKeterangan: (v: string) => void
    onAddItem: () => void
    onOpenShortcutModal: () => void
}

export function POItemPickerCard({
    selectedSupplierId,
    itemOptions,
    selectedItemId,
    onSelectItem,
    selectedItem,
    showPriceEditor,
    setShowPriceEditor,
    inputHarga,
    setInputHarga,
    inputUpdateMaster,
    setInputUpdateMaster,
    updatingItemId,
    onQuickUpdatePicker,
    showVehicleFields,
    selectedVehicle,
    vehicleOptions,
    inputVehicleId,
    setInputVehicleId,
    inputKmHm,
    setInputKmHm,
    isHM,
    meterUnitLabel,
    isBackdateAnomaly,
    effectiveLastMeter,
    inputQty,
    setInputQty,
    inputKeterangan,
    setInputKeterangan,
    onAddItem,
    onOpenShortcutModal,
}: POItemPickerCardProps) {
    return (
        <>
            <CardHeader className="bg-slate-50/50 border-b flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3">
                <div>
                    <CardTitle className="text-lg">Rincian Barang Pesanan</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Pilih barang dari master atau gunakan shortcut ubah harga jika supplier mengubah harga.
                    </p>
                </div>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={onOpenShortcutModal}
                    className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold shadow-xs transition-all w-fit"
                >
                    <Sparkles className="w-4 h-4 mr-1.5 text-amber-600" />
                    ⚡ Shortcut Ubah Harga Master
                </Button>
            </CardHeader>

            <div className="p-4 bg-slate-50 border-b space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
                    <div className="flex-1 space-y-1.5 w-full">
                        <Label className="text-xs font-semibold text-slate-700">Pilih Barang dari Master *</Label>
                        <div className={cn(selectedSupplierId ? "" : "opacity-50 pointer-events-none")}>
                            <Combobox 
                                options={itemOptions} 
                                value={selectedItemId} 
                                onChange={onSelectItem} 
                                placeholder={selectedSupplierId ? "Cari nama barang atau kode..." : "Pilih Toko / Supplier terlebih dahulu"} 
                            />
                        </div>
                    </div>
                </div>

                {selectedItem && (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                            <div>
                                <div className="font-semibold text-slate-900 text-sm">{selectedItem.name}</div>
                                <div className="text-xs text-slate-500">
                                    Part/Tipe: <span className="font-mono">{selectedItem.part_number || "-"}</span> | Merk: <span>{selectedItem.merk || "-"}</span> | Satuan: <span className="font-semibold">{selectedItem.satuan}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-xs bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-medium">
                                    Harga Master: <span className="font-bold text-slate-900">Rp {Number(selectedItem.harga).toLocaleString('id-ID')}</span>
                                </div>
                                <Button
                                    type="button"
                                    variant={showPriceEditor ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => setShowPriceEditor(!showPriceEditor)}
                                    className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-50"
                                >
                                    <Sparkles className="w-3 h-3 mr-1 text-amber-600" />
                                    {showPriceEditor ? "Tutup Ubah Harga" : "Ubah Harga (Opsional)"}
                                </Button>
                            </div>
                        </div>

                        {/* Opsi Ubah Harga: HANYA MUNCUL JIKA DIKLIK */}
                        {showPriceEditor && (
                            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                                        Penyesuaian Harga Satuan
                                    </Label>
                                    {inputHarga !== "" && Number(inputHarga) !== Number(selectedItem.harga) && (
                                        <span className={cn(
                                            "text-[11px] font-bold px-1.5 py-0.5 rounded",
                                            Number(inputHarga) > Number(selectedItem.harga) ? "text-amber-800 bg-amber-100" : "text-blue-800 bg-blue-100"
                                        )}>
                                            {Number(inputHarga) > Number(selectedItem.harga) ? '▲ +' : '▼ '}
                                            {Math.round(((Number(inputHarga) - Number(selectedItem.harga)) / (Number(selectedItem.harga) || 1)) * 100)}%
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-medium">Rp</span>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={inputHarga}
                                            onChange={e => setInputHarga(e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder="Harga satuan baru..."
                                            className="h-9 pl-9 font-semibold text-slate-900 bg-white"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={onQuickUpdatePicker}
                                            disabled={updatingItemId === "picker" || inputHarga === "" || Number(inputHarga) === Number(selectedItem.harga)}
                                            className="h-9 text-xs bg-white hover:bg-amber-100 text-amber-900 border-amber-300 font-semibold"
                                        >
                                            {updatingItemId === "picker" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1 text-amber-600" />}
                                            Update Master Sekarang
                                        </Button>
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer pt-0.5 text-xs text-amber-900">
                                    <input
                                        type="checkbox"
                                        checked={inputUpdateMaster}
                                        onChange={e => setInputUpdateMaster(e.target.checked)}
                                        className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                                    />
                                    <span>Otomatis perbarui master barang saat PO disimpan</span>
                                </label>
                            </div>
                        )}

                        {/* Alokasi Unit Kendaraan / Alat & KM/HM untuk Kategori Sparepart atau Pengadaan Baru */}
                        {showVehicleFields && (
                            <div className="p-3 rounded-lg border space-y-2 bg-slate-50 border-slate-200">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold flex items-center gap-1.5 text-slate-800">
                                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Alokasi Unit Kendaraan / Alat</span>
                                        <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
                                    </span>
                                    {selectedVehicle && (
                                        <span className="text-[10px] font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 font-medium">
                                            {selectedVehicle.category?.name || selectedVehicle.vehicle_type} {selectedVehicle.location?.name ? `• ${selectedVehicle.location.name}` : ""}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                    <div className="md:col-span-8 space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Pilih Kendaraan / Alat (Opsional)</Label>
                                        <Combobox
                                            options={vehicleOptions}
                                            value={inputVehicleId}
                                            onChange={setInputVehicleId}
                                            placeholder="Pilih unit armada, mixer, alat berat, genset (jika ada)..."
                                        />
                                    </div>
                                    <div className="md:col-span-4 space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">{meterUnitLabel} (Opsional)</Label>
                                        <Input
                                            placeholder={isHM ? "Misal: 2.450 HM" : "Misal: 15.000 KM"}
                                            value={inputKmHm}
                                            onChange={e => setInputKmHm(e.target.value)}
                                            className={cn("h-9 text-xs bg-white", isBackdateAnomaly && "border-rose-400 focus:ring-rose-500")}
                                        />
                                    </div>
                                </div>

                                {effectiveLastMeter && (
                                    <div className="flex items-center justify-between flex-wrap gap-1.5 text-[11px] bg-white px-2.5 py-1.5 rounded border border-slate-200 mt-1">
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <span className="font-medium text-slate-500">Catatan Meter Terakhir:</span>
                                            <span className="font-mono font-bold text-slate-900">
                                                {Number(effectiveLastMeter).toLocaleString('id-ID')} {isHM ? "HM" : "KM"}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                ({selectedVehicle?.lastKmSource || "Sistem"}{selectedVehicle?.lastKmDate ? ` • ${new Date(selectedVehicle.lastKmDate).toLocaleDateString('id-ID')}` : ""})
                                            </span>
                                        </div>
                                        {isBackdateAnomaly && (
                                            <div className="flex items-center gap-1 text-rose-700 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                <span>Nilai lebih kecil dari meter terakhir (potensi backdate)</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Baris standar input PO */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-2 space-y-1">
                                <Label className="text-xs font-medium">Qty ({selectedItem.satuan})</Label>
                                <Input 
                                    type="number" 
                                    min="0.01" 
                                    step="any" 
                                    value={inputQty} 
                                    onChange={e => setInputQty(Number(e.target.value))} 
                                    className="h-9"
                                />
                            </div>
                            <div className="md:col-span-7 space-y-1">
                                <Label className="text-xs font-medium">Keterangan Khusus (Opsional)</Label>
                                <Input 
                                    placeholder="Catatan pengerjaan / part number..." 
                                    value={inputKeterangan} 
                                    onChange={e => setInputKeterangan(e.target.value)} 
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <Button type="button" onClick={onAddItem} className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium">
                                    <Plus className="w-4 h-4 mr-1.5" /> Tambah ke PO
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
