"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calculator, Truck, Calendar } from "lucide-react"
import { RetaseLocation } from "../types"

interface RetaseSettingsTabProps {
    userRole: string
    locations: RetaseLocation[]
    settingLocation: string
    onLocationChange: (val: string) => void
    resolveRate: (locId: string, role: string, fallback: number) => number
    // Mixer State
    mixerPrice: string
    onMixerPriceChange: (val: string) => void
    mixerCalcMode: "DISTANCE_ONLY" | "DISTANCE_AND_VOLUME"
    onMixerCalcModeChange: (val: "DISTANCE_ONLY" | "DISTANCE_AND_VOLUME") => void
    mixerApplyScope: "FUTURE" | "BACKDATE"
    onMixerApplyScopeChange: (val: "FUTURE" | "BACKDATE") => void
    mixerEffectiveDate: string
    onMixerEffectiveDateChange: (val: string) => void
    isSavingMixer: boolean
    onSaveMixer: (e: React.FormEvent) => void
    // Operator BP State
    operatorRate: string
    onOperatorRateChange: (val: string) => void
    operatorApplyScope: "FUTURE" | "BACKDATE"
    onOperatorApplyScopeChange: (val: "FUTURE" | "BACKDATE") => void
    operatorEffectiveDate: string
    onOperatorEffectiveDateChange: (val: string) => void
    isSavingOperator: boolean
    onSaveOperator: (e: React.FormEvent) => void
}

export function RetaseSettingsTab({
    userRole,
    locations,
    settingLocation,
    onLocationChange,
    resolveRate,
    mixerPrice,
    onMixerPriceChange,
    mixerCalcMode,
    onMixerCalcModeChange,
    mixerApplyScope,
    onMixerApplyScopeChange,
    mixerEffectiveDate,
    onMixerEffectiveDateChange,
    isSavingMixer,
    onSaveMixer,
    operatorRate,
    onOperatorRateChange,
    operatorApplyScope,
    onOperatorApplyScopeChange,
    operatorEffectiveDate,
    onOperatorEffectiveDateChange,
    isSavingOperator,
    onSaveOperator,
}: RetaseSettingsTabProps) {
    return (
        <div className="space-y-4">
            {/* Banner Akses Data Master Insentif Terpusat */}
            <div className="max-w-2xl bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-sm text-slate-900">Pusat Data Master Insentif & Tarif Operasional</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Pengaturan seluruh peran operasional (Operator BP, Operator Concrete Pump, Operator Excavator, Sopir Mixer, dan Dump Truck) kini tersedia lengkap di Data Master.
                    </p>
                </div>
                <a
                    href="/admin/master-insentif"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors shrink-0"
                >
                    Buka Data Master ↗
                </a>
            </div>

            {/* Ringkasan Tarif Aktif Cabang Terpilih */}
            <div className="max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Operator BP</span>
                    <span className="text-sm font-bold text-slate-800">
                        {resolveRate(settingLocation, "OPERATOR_BP", 0) > 0
                            ? `Rp ${resolveRate(settingLocation, "OPERATOR_BP", 0).toLocaleString("id-ID")}`
                            : "Belum Diset"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">/ m³ beton</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Operator CP</span>
                    <span className="text-sm font-bold text-slate-800">
                        {resolveRate(settingLocation, "OPERATOR_CP", 0) > 0
                            ? `Rp ${resolveRate(settingLocation, "OPERATOR_CP", 0).toLocaleString("id-ID")}`
                            : "Belum Diset"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">/ trip cor</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Operator Exca</span>
                    <span className="text-sm font-bold text-slate-800">
                        {resolveRate(settingLocation, "OPERATOR_ALAT_BERAT", 0) > 0
                            ? `Rp ${resolveRate(settingLocation, "OPERATOR_ALAT_BERAT", 0).toLocaleString("id-ID")}`
                            : "Belum Diset"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">/ jam HM</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Sopir DT</span>
                    <span className="text-sm font-bold text-slate-800">
                        {resolveRate(settingLocation, "SOPIR_DT", 0) > 0
                            ? `Rp ${resolveRate(settingLocation, "SOPIR_DT", 0).toLocaleString("id-ID")}`
                            : "Belum Diset"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">agregat</span>
                </div>
            </div>

            {/* Selector Cabang untuk SuperAdmin */}
            {userRole === 'SuperAdminBP' && (
                <Card className="border-slate-200 bg-white">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <Label className="font-bold text-slate-800 text-sm">Pilih Cabang Operasional</Label>
                            <p className="text-xs text-slate-500">Pilih cabang yang ingin diatur tarif komisi Sopir Mixer dan insentif Operator BP-nya</p>
                        </div>
                        <select
                            className="flex h-10 w-full sm:w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                            value={settingLocation}
                            onChange={(e) => onLocationChange(e.target.value)}
                            required
                        >
                            {locations.map((loc: any) => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </CardContent>
                </Card>
            )}

            {/* Dua Kartu Pengaturan Terpisah 100%: Sopir Mixer & Operator BP */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                {/* KARTU 1: PENGATURAN KOMISI SOPIR TRUK MIXER */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base text-slate-900">
                                        1. Komisi Sopir Truk Mixer
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Pengaturan khusus komisi pengiriman armada Mixer
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge className="bg-blue-600 text-white text-[11px]">Sopir Mixer</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <form onSubmit={onSaveMixer} className="space-y-5">
                            {/* PILIHAN RUMUS PERHITUNGAN MIXER */}
                            <div className="space-y-2.5">
                                <Label className="font-semibold text-slate-800 text-xs">Metode & Rumus Perhitungan</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div
                                        onClick={() => onMixerCalcModeChange("DISTANCE_ONLY")}
                                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            mixerCalcMode === "DISTANCE_ONLY"
                                                ? "border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-slate-900 text-xs">Harga × Jarak (KM)</span>
                                                    <Badge className="bg-blue-600 text-white text-[9px] px-1 py-0">Default</Badge>
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-tight">
                                                    Dihitung per kilometer jarak tempuh. Volume tidak mempengaruhi.
                                                </p>
                                            </div>
                                            <input
                                                type="radio"
                                                checked={mixerCalcMode === "DISTANCE_ONLY"}
                                                onChange={() => onMixerCalcModeChange("DISTANCE_ONLY")}
                                                className="mt-0.5 accent-blue-600"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => onMixerCalcModeChange("DISTANCE_AND_VOLUME")}
                                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            mixerCalcMode === "DISTANCE_AND_VOLUME"
                                                ? "border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-slate-900 text-xs">Harga × Jarak × M³</span>
                                                    <Badge variant="outline" className="text-[9px] text-slate-600 px-1 py-0">Rumus Lama</Badge>
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-tight">
                                                    Dihitung proporsional jarak tempuh dan kubikasi (Rp/M³/KM).
                                                </p>
                                            </div>
                                            <input
                                                type="radio"
                                                checked={mixerCalcMode === "DISTANCE_AND_VOLUME"}
                                                onChange={() => onMixerCalcModeChange("DISTANCE_AND_VOLUME")}
                                                className="mt-0.5 accent-blue-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* INPUT HARGA DASAR MIXER */}
                            <div className="space-y-1.5">
                                <Label className="font-semibold text-slate-800 text-xs">
                                    {mixerCalcMode === "DISTANCE_ONLY"
                                        ? "Harga Dasar Retase per KM (Rp/KM) *"
                                        : "Harga Dasar Retase per M³ per KM (Rp/M³/KM) *"}
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">Rp</span>
                                    <Input
                                        type="number"
                                        required
                                        min="0"
                                        step="any"
                                        value={mixerPrice}
                                        onChange={(e) => onMixerPriceChange(e.target.value)}
                                        placeholder={mixerCalcMode === "DISTANCE_ONLY" ? "Misal: 10000" : "Misal: 1500"}
                                        className="pl-10 text-base font-semibold"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Rumus aktif:{" "}
                                    <span className="font-semibold text-slate-700">
                                        {mixerCalcMode === "DISTANCE_ONLY"
                                            ? "Jarak Tempuh (KM) × Rp " + (Number(mixerPrice) || 0).toLocaleString("id-ID")
                                            : "Jarak (KM) × M³ × Rp " + (Number(mixerPrice) || 0).toLocaleString("id-ID")}
                                    </span>
                                </p>
                            </div>

                            {/* SIMULASI LIVE MIXER */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                    <Calculator className="w-3.5 h-3.5 text-blue-600" />
                                    Simulasi Live (Contoh: Jarak 10 KM, Muatan 7 M³)
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs text-slate-600">
                                        {mixerCalcMode === "DISTANCE_ONLY"
                                            ? `10 KM × Rp ${(Number(mixerPrice) || 0).toLocaleString("id-ID")}`
                                            : `10 KM × 7 M³ × Rp ${(Number(mixerPrice) || 0).toLocaleString("id-ID")}`}
                                    </span>
                                    <div className="text-sm font-black text-blue-700">
                                        Rp{" "}
                                        {(
                                            mixerCalcMode === "DISTANCE_ONLY"
                                                ? 10 * (Number(mixerPrice) || 0)
                                                : 10 * 7 * (Number(mixerPrice) || 0)
                                        ).toLocaleString("id-ID")}
                                    </div>
                                </div>
                            </div>

                            {/* CAKUPAN KEBERLAKUAN MIXER */}
                            <div className="space-y-2.5 pt-2 border-t">
                                <Label className="font-semibold text-slate-800 text-xs">Cakupan Keberlakuan Tarif Mixer</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div
                                        onClick={() => onMixerApplyScopeChange("FUTURE")}
                                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            mixerApplyScope === "FUTURE"
                                                ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                                                    <span>Mulai Sekarang</span>
                                                    <Badge variant="outline" className="text-[9px] text-emerald-700 border-emerald-300">Default</Badge>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                                    Hanya transaksi mendatang.
                                                </p>
                                            </div>
                                            <input
                                                type="radio"
                                                checked={mixerApplyScope === "FUTURE"}
                                                onChange={() => onMixerApplyScopeChange("FUTURE")}
                                                className="mt-0.5 accent-emerald-600"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => onMixerApplyScopeChange("BACKDATE")}
                                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            mixerApplyScope === "BACKDATE"
                                                ? "border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                                                    <span>Tanggal Tertentu</span>
                                                    <Badge variant="outline" className="text-[9px] text-blue-700 border-blue-300">Backdate</Badge>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                                    Berlaku dari tanggal pilihan.
                                                </p>
                                            </div>
                                            <input
                                                type="radio"
                                                checked={mixerApplyScope === "BACKDATE"}
                                                onChange={() => onMixerApplyScopeChange("BACKDATE")}
                                                className="mt-0.5 accent-blue-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {mixerApplyScope === "BACKDATE" && (
                                    <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 space-y-1.5 mt-2">
                                        <div className="flex items-center gap-1.5 text-blue-900 text-xs font-semibold">
                                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                            Pilih Tanggal Mulai Berlaku Tarif Mixer
                                        </div>
                                        <Input
                                            type="date"
                                            value={mixerEffectiveDate}
                                            onChange={(e) => onMixerEffectiveDateChange(e.target.value)}
                                            className="bg-white text-sm"
                                            required
                                        />
                                        <span className="text-[11px] text-blue-800 leading-tight block">
                                            Tarif Mixer baru berlaku untuk transaksi pada tanggal tersebut ke depan.
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                                ℹ️ <strong>Isolasi Aman:</strong> Menyimpan form ini <strong>hanya mengubah tarif Sopir Mixer</strong> dan tidak menyentuh tarif Operator BP.
                            </div>

                            <Button disabled={isSavingMixer} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                                {isSavingMixer ? "Menyimpan Tarif Mixer..." : "Simpan Tarif Sopir Mixer"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* KARTU 2: PENGATURAN INSENTIF OPERATOR BP */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                                    <Calculator className="w-4 h-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base text-slate-900">
                                        2. Insentif Operator BP
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Pengaturan insentif produksi Operator Batching Plant
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge className="bg-emerald-600 text-white text-[11px]">Operator BP</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <form onSubmit={onSaveOperator} className="space-y-5">
                            {/* INFO METODE OPERATOR BP */}
                            <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 space-y-1">
                                <span className="text-xs font-semibold text-emerald-950 block">
                                    Metode Perhitungan Volume (M³)
                                </span>
                                <p className="text-[11px] text-emerald-800 leading-relaxed">
                                    Insentif Operator BP dihitung murni berdasarkan total volume kubikasi beton yang diproduksi (Rp/M³).
                                </p>
                            </div>

                            {/* INPUT TARIF INSENTIF OPERATOR BP */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold text-slate-800 text-xs">
                                        Tarif Insentif Operator BP per M³ (Rp/M³) *
                                    </Label>
                                    <span className="text-[10px] text-slate-400">
                                        (Peran lain diatur di Data Master)
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">Rp</span>
                                    <Input
                                        type="number"
                                        required
                                        min="0"
                                        step="any"
                                        value={operatorRate}
                                        onChange={(e) => onOperatorRateChange(e.target.value)}
                                        placeholder="Misal: 1500"
                                        className="pl-10 text-base font-semibold"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Rumus aktif:{" "}
                                    <span className="font-semibold text-slate-700">
                                        Total Kubikasi Produksi (M³) × Rp {(Number(operatorRate) || 0).toLocaleString("id-ID")}
                                    </span>
                                </p>
                            </div>

                            {/* SIMULASI LIVE OPERATOR BP */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                    <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                                    Simulasi Live (Contoh: Produksi 100 M³ Beton)
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs text-slate-600">
                                        100 M³ × Rp {(Number(operatorRate) || 0).toLocaleString("id-ID")}
                                    </span>
                                    <div className="text-sm font-black text-emerald-700">
                                        Rp {(100 * (Number(operatorRate) || 0)).toLocaleString("id-ID")}
                                    </div>
                                </div>
                            </div>

                            {/* CAKUPAN KEBERLAKUAN OPERATOR BP */}
                            <div className="space-y-2.5 pt-2 border-t">
                                <Label className="font-semibold text-slate-800 text-xs">Cakupan Keberlakuan Insentif Operator</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div
                                        onClick={() => onOperatorApplyScopeChange("FUTURE")}
                                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            operatorApplyScope === "FUTURE"
                                                ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                                                    <span>Mulai Sekarang</span>
                                                    <Badge variant="outline" className="text-[9px] text-emerald-700 border-emerald-300">Default</Badge>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                                    Hanya produksi mendatang.
                                                </p>
                                            </div>
                                            <input
                                                type="radio"
                                                checked={operatorApplyScope === "FUTURE"}
                                                onChange={() => onOperatorApplyScopeChange("FUTURE")}
                                                className="mt-0.5 accent-emerald-600"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => onOperatorApplyScopeChange("BACKDATE")}
                                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            operatorApplyScope === "BACKDATE"
                                                ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                                                    <span>Tanggal Tertentu</span>
                                                    <Badge variant="outline" className="text-[9px] text-emerald-700 border-emerald-300">Backdate</Badge>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                                    Berlaku dari tanggal pilihan.
                                                </p>
                                            </div>
                                            <input
                                                type="radio"
                                                checked={operatorApplyScope === "BACKDATE"}
                                                onChange={() => onOperatorApplyScopeChange("BACKDATE")}
                                                className="mt-0.5 accent-emerald-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {operatorApplyScope === "BACKDATE" && (
                                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 space-y-1.5 mt-2">
                                        <div className="flex items-center gap-1.5 text-emerald-900 text-xs font-semibold">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                            Pilih Tanggal Mulai Berlaku Insentif Operator
                                        </div>
                                        <Input
                                            type="date"
                                            value={operatorEffectiveDate}
                                            onChange={(e) => onOperatorEffectiveDateChange(e.target.value)}
                                            className="bg-white text-sm"
                                            required
                                        />
                                        <span className="text-[11px] text-emerald-800 leading-tight block">
                                            Tarif Operator baru berlaku untuk produksi pada tanggal tersebut ke depan.
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                                ℹ️ <strong>Isolasi Aman:</strong> Menyimpan form ini <strong>hanya mengubah tarif Operator BP</strong> dan tidak menyentuh tarif atau transaksi Sopir Mixer.
                            </div>

                            <Button disabled={isSavingOperator} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                                {isSavingOperator ? "Menyimpan Insentif Operator..." : "Simpan Insentif Operator BP"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
