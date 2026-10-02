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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Truck, Plus, ShieldAlert } from "lucide-react"
import { DumpTruckSize, MeterType, Vehicle, VehicleCategory } from "../types"

interface VehicleFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editData: Vehicle | null
    categories: VehicleCategory[]
    selectedCategoryId: string
    onCategoryChange: (catId: string) => void
    onOpenQuickCategory: () => void
    meterType: MeterType
    onMeterTypeChange: (val: MeterType) => void
    merkModel: string
    onMerkModelChange: (val: string) => void
    locations: any[]
    userRole: string
    isCorporate: boolean
    dumpTruckSize: DumpTruckSize
    onDumpTruckSizeChange: (val: DumpTruckSize) => void
    capacityCubic: string
    onCapacityCubicChange: (val: string) => void
    isForRent: boolean
    onIsForRentChange: (val: boolean) => void
    defaultDayRate: string
    onDefaultDayRateChange: (val: string) => void
    rentalStatus: string
    onRentalStatusChange: (val: string) => void
    rentalNotes: string
    onRentalNotesChange: (val: string) => void
    annualTaxCost: string
    onAnnualTaxCostChange: (val: string) => void
    taxExpiryDate: string
    onTaxExpiryDateChange: (val: string) => void
    kirCost: string
    onKirCostChange: (val: string) => void
    kirExpiryDate: string
    onKirExpiryDateChange: (val: string) => void
    kirPeriodMonths: string
    onKirPeriodMonthsChange: (val: string) => void
    onSubmit: (formData: FormData) => Promise<void>
}

export function VehicleFormDialog({
    open,
    onOpenChange,
    editData,
    categories,
    selectedCategoryId,
    onCategoryChange,
    onOpenQuickCategory,
    meterType,
    onMeterTypeChange,
    merkModel,
    onMerkModelChange,
    locations,
    userRole,
    isCorporate,
    dumpTruckSize,
    onDumpTruckSizeChange,
    capacityCubic,
    onCapacityCubicChange,
    isForRent,
    onIsForRentChange,
    defaultDayRate,
    onDefaultDayRateChange,
    rentalStatus,
    onRentalStatusChange,
    rentalNotes,
    onRentalNotesChange,
    annualTaxCost,
    onAnnualTaxCostChange,
    taxExpiryDate,
    onTaxExpiryDateChange,
    kirCost,
    onKirCostChange,
    kirExpiryDate,
    onKirExpiryDateChange,
    kirPeriodMonths,
    onKirPeriodMonthsChange,
    onSubmit,
}: VehicleFormDialogProps) {
    const activeCat = categories.find(c => c.id === selectedCategoryId)
    const isDT = activeCat?.name?.toLowerCase().includes("dump") || (editData && editData.dump_truck_size != null)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <span>{editData ? "Edit Unit Kendaraan / Alat" : "Tambah Unit Kendaraan & Alat Baru"}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Informasi data armada, alat berat, batching plant, genset, dan spesifikasi unit.
                    </DialogDescription>
                </DialogHeader>

                <form key={editData?.id || "new"} action={onSubmit} className="space-y-4 mt-2 text-xs">
                    {editData && <input type="hidden" name="id" value={editData.id} />}

                    {/* Identitas Unit (2 Kolom) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                            <Label htmlFor="code" className="text-xs font-semibold text-slate-700">Kode Unit *</Label>
                            <Input
                                id="code"
                                name="code"
                                placeholder="Misal: MX-01, BP-01, GS-02"
                                defaultValue={editData?.code}
                                required
                                className="h-8 text-xs font-mono font-bold"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="plate_number" className="text-xs font-semibold text-slate-700">Plat Nomor / No. Seri *</Label>
                            <Input
                                id="plate_number"
                                name="plate_number"
                                placeholder="PA 8821 AB atau No. Seri Unit"
                                defaultValue={editData?.plate_number}
                                required
                                className="h-8 text-xs font-mono uppercase"
                            />
                        </div>
                    </div>

                    {/* Kategori & Merk / Model (2 Kolom) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-700">
                                    Kategori / Jenis Unit *
                                </Label>
                                <button
                                    type="button"
                                    onClick={onOpenQuickCategory}
                                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="h-3 w-3" />
                                    <span>Kategori Baru</span>
                                </button>
                            </div>

                            <Select
                                value={selectedCategoryId}
                                onValueChange={onCategoryChange}
                            >
                                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Pilih Kategori Kendaraan / Alat" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-800">{cat.name}</span>
                                                {cat.code && (
                                                    <span className="text-[10px] text-slate-400 font-mono">({cat.code})</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="merk_model" className="text-xs font-semibold text-slate-700">Merk / Model / Spesifikasi</Label>
                            <Input
                                id="merk_model"
                                placeholder="Sicoma 60m³, Perkins 150kVA, Sany SY5290THB"
                                value={merkModel}
                                onChange={e => onMerkModelChange(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>

                    {/* Satuan Meter & Cabang (2 Kolom) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Satuan Meter Unit *</Label>
                            <Select value={meterType} onValueChange={(val: MeterType) => onMeterTypeChange(val)}>
                                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Pilih Satuan Meter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="KM" className="text-xs font-medium">
                                        KM (Kilometer - Kendaraan)
                                    </SelectItem>
                                    <SelectItem value="HM" className="text-xs font-medium">
                                        HM (Hour Meter - Alat/Mesin)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(userRole === "SuperAdminBP" || isCorporate || !editData?.locationId) ? (
                            <div className="space-y-1">
                                <Label htmlFor="locationId" className="text-xs font-semibold text-slate-700">Cabang Pangkalan *</Label>
                                <Select name="locationId" defaultValue={editData?.locationId || locations[0]?.id || ""}>
                                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Pilih Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((loc) => (
                                            <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                                {loc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : <div />}
                    </div>

                    {/* Dump Truck Specific Configuration */}
                    {isDT && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                    <Truck className="h-3.5 w-3.5 text-slate-600" />
                                    <span>Konfigurasi Dump Truck</span>
                                </div>
                                <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.5 rounded">
                                    Internal Quarry
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <Label htmlFor="dump_truck_size" className="text-[11px] font-medium text-slate-700">
                                        Tipe Ukuran DT *
                                    </Label>
                                    <Select value={dumpTruckSize} onValueChange={(val: DumpTruckSize) => onDumpTruckSizeChange(val)}>
                                        <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                                            <SelectValue placeholder="Pilih Tipe Ukuran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BESAR" className="text-xs font-medium">
                                                DT Besar (Tronton)
                                            </SelectItem>
                                            <SelectItem value="KECIL" className="text-xs font-medium">
                                                DT Kecil (Engkel)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="capacity_cubic" className="text-[11px] font-medium text-slate-700">
                                        Kapasitas Bak Spec (m³)
                                    </Label>
                                    <Input
                                        id="capacity_cubic"
                                        name="capacity_cubic"
                                        type="number"
                                        step="0.1"
                                        placeholder="Misal: 8 atau 10"
                                        value={capacityCubic}
                                        onChange={e => onCapacityCubicChange(e.target.value)}
                                        className="h-8 text-xs bg-white border-slate-300"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sewa & Rental Tagging Configuration */}
                    <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={isForRent}
                                onChange={e => onIsForRentChange(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                            />
                            <span className="font-semibold text-xs text-slate-800">
                                Daftarkan sebagai Unit yang Bisa Disewa
                            </span>
                        </label>

                        {isForRent && (
                            <div className="pt-2.5 border-t border-slate-200 space-y-2.5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="default_day_rate" className="text-[11px] font-medium text-slate-700">
                                            Tarif Acuan Sewa / Hari (Rp)
                                        </Label>
                                        <Input
                                            id="default_day_rate"
                                            type="number"
                                            placeholder="Contoh: 3500000"
                                            value={defaultDayRate}
                                            onChange={e => onDefaultDayRateChange(e.target.value)}
                                            className="h-8 text-xs bg-white border-slate-300 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="rental_status" className="text-[11px] font-medium text-slate-700">
                                            Status Ketersediaan Sewa
                                        </Label>
                                        <Select value={rentalStatus} onValueChange={onRentalStatusChange}>
                                            <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                                                <SelectValue placeholder="Pilih Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Tersedia" className="text-xs font-medium">
                                                    Tersedia
                                                </SelectItem>
                                                <SelectItem value="Disewa" className="text-xs font-medium">
                                                    Sedang Disewa
                                                </SelectItem>
                                                <SelectItem value="Maintenance" className="text-xs font-medium">
                                                    Perawatan / Maintenance
                                                </SelectItem>
                                                <SelectItem value="Nonaktif" className="text-xs font-medium">
                                                    Nonaktif
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="rental_notes" className="text-[11px] font-medium text-slate-700">
                                        Catatan / Spesifikasi Sewa (Opsional)
                                    </Label>
                                    <Input
                                        id="rental_notes"
                                        placeholder="Contoh: Boom reach 37m, output 120m3/h"
                                        value={rentalNotes}
                                        onChange={e => onRentalNotesChange(e.target.value)}
                                        className="h-8 text-xs bg-white border-slate-300"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Legalitas, Pajak STNK & Uji KIR Section */}
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <ShieldAlert className="h-4 w-4 text-indigo-600" />
                                <span className="text-xs font-semibold text-slate-900">Legalitas, Pajak STNK & Uji KIR (Amortisasi Bulanan)</span>
                            </div>
                            <span className="text-[10px] text-indigo-700 font-medium bg-indigo-100/70 px-2 py-0.5 rounded">
                                Beban Operasional
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="annual_tax_cost" className="text-[11px] font-medium text-slate-700">
                                    Pajak STNK Tahunan (Rp)
                                </Label>
                                <Input
                                    id="annual_tax_cost"
                                    type="number"
                                    placeholder="Contoh: 12000000"
                                    value={annualTaxCost}
                                    onChange={e => onAnnualTaxCostChange(e.target.value)}
                                    className="h-8 text-xs bg-white border-slate-300 font-mono"
                                />
                                <span className="text-[10px] text-slate-500 font-mono block">
                                    Amortisasi: Rp {annualTaxCost && Number(annualTaxCost) > 0 ? Math.round(Number(annualTaxCost) / 12).toLocaleString("id-ID") : "0"} / bln
                                </span>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="tax_expiry_date" className="text-[11px] font-medium text-slate-700">
                                    Jatuh Tempo Pajak STNK
                                </Label>
                                <Input
                                    id="tax_expiry_date"
                                    type="date"
                                    value={taxExpiryDate}
                                    onChange={e => onTaxExpiryDateChange(e.target.value)}
                                    className="h-8 text-xs bg-white border-slate-300"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="kir_cost" className="text-[11px] font-medium text-slate-700">
                                    Biaya Uji KIR (Rp)
                                </Label>
                                <Input
                                    id="kir_cost"
                                    type="number"
                                    placeholder="Contoh: 350000"
                                    value={kirCost}
                                    onChange={e => onKirCostChange(e.target.value)}
                                    className="h-8 text-xs bg-white border-slate-300 font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="kir_period_months" className="text-[11px] font-medium text-slate-700">
                                    Periode Uji KIR
                                </Label>
                                <Select value={kirPeriodMonths} onValueChange={onKirPeriodMonthsChange}>
                                    <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                                        <SelectValue placeholder="Periode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="6" className="text-xs">Per 6 Bulan</SelectItem>
                                        <SelectItem value="12" className="text-xs">Per 12 Bulan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="kir_expiry_date" className="text-[11px] font-medium text-slate-700">
                                    Jatuh Tempo KIR
                                </Label>
                                <Input
                                    id="kir_expiry_date"
                                    type="date"
                                    value={kirExpiryDate}
                                    onChange={e => onKirExpiryDateChange(e.target.value)}
                                    className="h-8 text-xs bg-white border-slate-300"
                                />
                            </div>
                        </div>

                        {(Number(annualTaxCost) > 0 || Number(kirCost) > 0) && (
                            <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-indigo-100/70 border border-indigo-200 text-indigo-900 text-xs">
                                <span className="font-medium">Total Estimasi Beban Bulanan Unit:</span>
                                <span className="font-bold font-mono">
                                    Rp {Math.round((Number(annualTaxCost || 0) / 12) + (Number(kirCost || 0) / Number(kirPeriodMonths || 6))).toLocaleString("id-ID")} / bulan
                                </span>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs h-8">
                            Batal
                        </Button>
                        <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                            Simpan Kendaraan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
