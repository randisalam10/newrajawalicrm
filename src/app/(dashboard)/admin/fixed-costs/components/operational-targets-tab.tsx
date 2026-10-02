"use client"

import React, { useState, useTransition, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Save, RefreshCw, Calculator, Target, Info, CheckCircle2, TrendingUp } from "lucide-react"
import { OperationalTargetSettingData } from "../types"
import { saveOperationalTargetSetting, getOperationalTargetSetting } from "../actions"

interface OperationalTargetsTabProps {
    initialTargetSetting?: OperationalTargetSettingData
    locations: any[]
    isCorporate?: boolean
    canManage?: boolean
}

export const OperationalTargetsTab: React.FC<OperationalTargetsTabProps> = ({
    initialTargetSetting,
    locations = [],
    isCorporate = false,
    canManage = true,
}) => {
    const [selectedLocation, setSelectedLocation] = useState<string>(
        initialTargetSetting?.locationId || "all"
    )
    const [isPending, startTransition] = useTransition()
    const [isFetching, setIsFetching] = useState(false)

    // Form State
    const [formData, setFormData] = useState<OperationalTargetSettingData>({
        id: initialTargetSetting?.id,
        name: initialTargetSetting?.name || "Standar Target Operasional",
        target_monthly_volume: initialTargetSetting?.target_monthly_volume ?? 0,
        target_branch_volume: initialTargetSetting?.target_branch_volume ?? 0,
        target_asp: initialTargetSetting?.target_asp ?? 0,
        target_semen_cost: initialTargetSetting?.target_semen_cost ?? 0,
        target_pasir_cost: initialTargetSetting?.target_pasir_cost ?? 0,
        target_split_cost: initialTargetSetting?.target_split_cost ?? 0,
        target_solar_cost: initialTargetSetting?.target_solar_cost ?? 0,
        target_retase_cost: initialTargetSetting?.target_retase_cost ?? 0,
        target_maintenance_cost: initialTargetSetting?.target_maintenance_cost ?? 0,
        target_other_cogs: initialTargetSetting?.target_other_cogs ?? 0,
        target_cogs: initialTargetSetting?.target_cogs ?? 0,
        target_gross_profit: initialTargetSetting?.target_gross_profit ?? 0,
        label_asp: initialTargetSetting?.label_asp || "",
        label_semen: initialTargetSetting?.label_semen || "",
        label_pasir: initialTargetSetting?.label_pasir || "",
        label_split: initialTargetSetting?.label_split || "",
        label_solar: initialTargetSetting?.label_solar || "",
        label_retase: initialTargetSetting?.label_retase || "",
        label_maintenance: initialTargetSetting?.label_maintenance || "",
        label_other: initialTargetSetting?.label_other || "",
        label_cogs: initialTargetSetting?.label_cogs || "",
        label_gross_profit: initialTargetSetting?.label_gross_profit || "",
        locationId: initialTargetSetting?.locationId || null,
    })

    // Kalkulasi Dinamis Target COGS & Gross Profit
    const computedCogs = useMemo(() => {
        return (
            (Number(formData.target_semen_cost) || 0) +
            (Number(formData.target_pasir_cost) || 0) +
            (Number(formData.target_split_cost) || 0) +
            (Number(formData.target_solar_cost) || 0) +
            (Number(formData.target_retase_cost) || 0) +
            (Number(formData.target_maintenance_cost) || 0) +
            (Number(formData.target_other_cogs) || 0)
        )
    }, [
        formData.target_semen_cost,
        formData.target_pasir_cost,
        formData.target_split_cost,
        formData.target_solar_cost,
        formData.target_retase_cost,
        formData.target_maintenance_cost,
        formData.target_other_cogs,
    ])

    const computedGrossProfit = useMemo(() => {
        return (Number(formData.target_asp) || 0) - computedCogs
    }, [formData.target_asp, computedCogs])

    const computedMarginPct = useMemo(() => {
        const asp = Number(formData.target_asp) || 0
        return asp > 0 ? (computedGrossProfit / asp) * 100 : 0
    }, [formData.target_asp, computedGrossProfit])

    // Handler pergantian lokasi
    const handleLocationChange = async (newLocId: string) => {
        setSelectedLocation(newLocId)
        setIsFetching(true)
        try {
            const locParam = newLocId === "all" ? null : newLocId
            const fetched = await getOperationalTargetSetting(locParam)
            if (fetched) {
                setFormData({
                    id: fetched.id,
                    name: fetched.name || "Standar Target Operasional",
                    target_monthly_volume: Number(fetched.target_monthly_volume) || 0,
                    target_branch_volume: Number(fetched.target_branch_volume) || 0,
                    target_asp: Number(fetched.target_asp) || 0,
                    target_semen_cost: Number(fetched.target_semen_cost) || 0,
                    target_pasir_cost: Number(fetched.target_pasir_cost) || 0,
                    target_split_cost: Number(fetched.target_split_cost) || 0,
                    target_solar_cost: Number(fetched.target_solar_cost) || 0,
                    target_retase_cost: Number(fetched.target_retase_cost) || 0,
                    target_maintenance_cost: Number(fetched.target_maintenance_cost) || 0,
                    target_other_cogs: Number(fetched.target_other_cogs) || 0,
                    target_cogs: Number(fetched.target_cogs) || 0,
                    target_gross_profit: Number(fetched.target_gross_profit) || 0,
                    label_asp: fetched.label_asp || "",
                    label_semen: fetched.label_semen || "",
                    label_pasir: fetched.label_pasir || "",
                    label_split: fetched.label_split || "",
                    label_solar: fetched.label_solar || "",
                    label_retase: fetched.label_retase || "",
                    label_maintenance: fetched.label_maintenance || "",
                    label_other: fetched.label_other || "",
                    label_cogs: fetched.label_cogs || "",
                    label_gross_profit: fetched.label_gross_profit || "",
                    locationId: locParam,
                })
            }
        } catch (err: any) {
            toast.error("Gagal memuat target cabang: " + err.message)
        } finally {
            setIsFetching(false)
        }
    }

    const handleChange = (field: keyof OperationalTargetSettingData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSave = () => {
        if (!canManage) {
            toast.error("Anda tidak memiliki hak akses mengubah standar target.")
            return
        }

        startTransition(async () => {
            const payload = {
                ...formData,
                target_cogs: computedCogs,
                target_gross_profit: computedGrossProfit,
                locationId: selectedLocation === "all" ? null : selectedLocation,
            }

            const res = await saveOperationalTargetSetting(payload)
            if (res.success) {
                toast.success("Standar Target Operasional berhasil disimpan dan disinkronkan ke seluruh laporan.")
            } else {
                toast.error("Gagal menyimpan target: " + (res.error || "Terjadi kesalahan"))
            }
        })
    }

    const formatRp = (num: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(num || 0)
    }

    return (
        <div className="space-y-6">
            {/* Top Toolbar / Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                            <Target className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Standar &amp; Target Operasional (Unit Economics)
                            </h2>
                            <p className="text-xs text-slate-500">
                                Konfigurasi acuan harga jual (ASP), batas biaya komponen per m³, dan target volume yang menjadi dasar penilaian efisiensi di Laporan Manajemen.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {locations && locations.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-slate-500 whitespace-nowrap">Lingkup Target:</Label>
                            <Select value={selectedLocation} onValueChange={handleLocationChange} disabled={isFetching || isPending}>
                                <SelectTrigger className="w-[200px] h-9 text-xs bg-slate-50 border-slate-200 font-medium">
                                    <SelectValue placeholder="Pilih Cabang / Global" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs font-semibold text-emerald-800">
                                        Standar Global (Semua Cabang)
                                    </SelectItem>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                            Cabang {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {canManage && (
                        <Button
                            onClick={handleSave}
                            disabled={isPending || isFetching}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs font-semibold gap-2 shadow-2xs cursor-pointer"
                        >
                            {isPending ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            <span>Simpan Standar Target</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Target Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border border-slate-200/80 shadow-2xs bg-white">
                    <CardContent className="p-4 space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Target Harga Jual (ASP)</span>
                        <div className="text-xl font-bold text-blue-700 font-mono">
                            {formatRp(Number(formData.target_asp) || 0)} <span className="text-xs font-sans text-slate-500">/ m³</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span className="font-semibold text-slate-700">DPP Murni</span> • {formData.label_asp || "Harga Pasar"}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200/80 shadow-2xs bg-white">
                    <CardContent className="p-4 space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Target Biaya Langsung (COGS)</span>
                        <div className="text-xl font-bold text-rose-700 font-mono">
                            {formatRp(computedCogs)} <span className="text-xs font-sans text-slate-500">/ m³</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Total 7 Komponen Biaya Pokok
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200/80 shadow-2xs bg-white">
                    <CardContent className="p-4 space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Target Gross Profit</span>
                        <div className="text-xl font-bold text-emerald-700 font-mono">
                            {formatRp(computedGrossProfit)} <span className="text-xs font-sans text-slate-500">/ m³</span>
                        </div>
                        <div className="text-[11px] font-medium text-emerald-800">
                            Margin Target: {computedMarginPct.toFixed(1)}%
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200/80 shadow-2xs bg-white">
                    <CardContent className="p-4 space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Target Volume Produksi</span>
                        <div className="text-xl font-bold text-slate-900 font-mono">
                            {Number(formData.target_monthly_volume).toLocaleString("id-ID")} <span className="text-xs font-sans text-slate-500">m³ / bln</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                            Cabang: {Number(formData.target_branch_volume).toLocaleString("id-ID")} m³
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Form Setting Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Form Input Komponen Target */}
                <div className="lg:col-span-7 space-y-4">
                    <Card className="border border-slate-200/80 shadow-2xs bg-white">
                        <CardHeader className="py-3 px-4 border-b border-slate-100">
                            <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-emerald-600" />
                                Parameter Target Unit Economics (Biaya Pokok Langsung per m³)
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">
                                Sesuaikan angka standard per meter kubik. Angka ini akan otomatis mengkalkulasi selisih variansi dan status efisiensi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3.5">
                            {/* ASP */}
                            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/60 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                <div className="sm:col-span-5">
                                    <Label className="text-xs font-semibold text-blue-950">Harga Jual Rata-rata (ASP / m³) DPP</Label>
                                    <p className="text-[10px] text-blue-800">Target pendapatan rata-rata sebelum PPN</p>
                                </div>
                                <div className="sm:col-span-4">
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                                        <Input
                                            type="number"
                                            value={formData.target_asp}
                                            onChange={e => handleChange("target_asp", Number(e.target.value))}
                                            className="h-8 pl-8 text-xs font-mono font-bold bg-white"
                                            disabled={!canManage}
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-3">
                                    <Input
                                        type="text"
                                        placeholder="Label Status"
                                        value={formData.label_asp || ""}
                                        onChange={e => handleChange("label_asp", e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        disabled={!canManage}
                                    />
                                </div>
                            </div>

                            {/* 1. Semen Curah & Zak */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-1">
                                <div className="sm:col-span-5">
                                    <Label className="text-xs font-medium text-slate-700">1. Semen Curah &amp; Zak</Label>
                                </div>
                                <div className="sm:col-span-4">
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                                        <Input
                                            type="number"
                                            value={formData.target_semen_cost}
                                            onChange={e => handleChange("target_semen_cost", Number(e.target.value))}
                                            className="h-8 pl-8 text-xs font-mono bg-white"
                                            disabled={!canManage}
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-3">
                                    <Input
                                        type="text"
                                        value={formData.label_semen || ""}
                                        onChange={e => handleChange("label_semen", e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        disabled={!canManage}
                                    />
                                </div>
                            </div>

                            {/* 2. Pasir Cor */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                <div className="sm:col-span-5">
                                    <Label className="text-xs font-medium text-slate-700">2. Pasir Cor</Label>
                                </div>
                                <div className="sm:col-span-4">
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                                        <Input
                                            type="number"
                                            value={formData.target_pasir_cost}
                                            onChange={e => handleChange("target_pasir_cost", Number(e.target.value))}
                                            className="h-8 pl-8 text-xs font-mono bg-white"
                                            disabled={!canManage}
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-3">
                                    <Input
                                        type="text"
                                        value={formData.label_pasir || ""}
                                        onChange={e => handleChange("label_pasir", e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        disabled={!canManage}
                                    />
                                </div>
                            </div>

                            {/* 3. Batu Split */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                <div className="sm:col-span-5">
                                    <Label className="text-xs font-medium text-slate-700">3. Batu Split (1/2 &amp; 2/3)</Label>
                                </div>
                                <div className="sm:col-span-4">
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                                        <Input
                                            type="number"
                                            value={formData.target_split_cost}
                                            onChange={e => handleChange("target_split_cost", Number(e.target.value))}
                                            className="h-8 pl-8 text-xs font-mono bg-white"
                                            disabled={!canManage}
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-3">
                                    <Input
                                        type="text"
                                        value={formData.label_split || ""}
                                        onChange={e => handleChange("label_split", e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        disabled={!canManage}
                                    />
                                </div>
                            </div>

                            {/* 4. Bahan Bakar Solar */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                <div className="sm:col-span-5">
                                    <Label className="text-xs font-medium text-slate-700">4. Bahan Bakar Solar Armada</Label>
                                </div>
                                <div className="sm:col-span-4">
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                                        <Input
                                            type="number"
                                            value={formData.target_solar_cost}
                                            onChange={e => handleChange("target_solar_cost", Number(e.target.value))}
                                            className="h-8 pl-8 text-xs font-mono bg-white"
                                            disabled={!canManage}
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-3">
                                    <Input
                                        type="text"
                                        value={formData.label_solar || ""}
                                        onChange={e => handleChange("label_solar", e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        disabled={!canManage}
                                    />
                                </div>
                            </div>

                            {/* 5. Retase Supir */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                <div className="sm:col-span-5">
                                    <Label className="text-xs font-medium text-slate-700">5. Retase Supir Truk Mixer</Label>
                                </div>
                                <div className="sm:col-span-4">
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                                        <Input
                                            type="number"
                                            value={formData.target_retase_cost}
                                            onChange={e => handleChange("target_retase_cost", Number(e.target.value))}
                                            className="h-8 pl-8 text-xs font-mono bg-white"
                                            disabled={!canManage}
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-3">
                                    <Input
                                        type="text"
                                        value={formData.label_retase || ""}
                                        onChange={e => handleChange("label_retase", e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        disabled={!canManage}
                                    />
                                </div>
                            </div>

                            {/* 6. Suku Cadang & Bengkel PO */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                <div className="sm:col-span-5">
                                    <Label className="text-xs font-medium text-slate-700">6. Suku Cadang &amp; Bengkel PO</Label>
                                </div>
                                <div className="sm:col-span-4">
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                                        <Input
                                            type="number"
                                            value={formData.target_maintenance_cost}
                                            onChange={e => handleChange("target_maintenance_cost", Number(e.target.value))}
                                            className="h-8 pl-8 text-xs font-mono bg-white"
                                            disabled={!canManage}
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-3">
                                    <Input
                                        type="text"
                                        value={formData.label_maintenance || ""}
                                        onChange={e => handleChange("label_maintenance", e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        disabled={!canManage}
                                    />
                                </div>
                            </div>

                            {/* 7. Biaya Pokok Langsung Lainnya */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                <div className="sm:col-span-5">
                                    <Label className="text-xs font-medium text-slate-700">7. Biaya Pokok Lainnya (Manual)</Label>
                                </div>
                                <div className="sm:col-span-4">
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                                        <Input
                                            type="number"
                                            value={formData.target_other_cogs}
                                            onChange={e => handleChange("target_other_cogs", Number(e.target.value))}
                                            className="h-8 pl-8 text-xs font-mono bg-white"
                                            disabled={!canManage}
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-3">
                                    <Input
                                        type="text"
                                        value={formData.label_other || ""}
                                        onChange={e => handleChange("label_other", e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        disabled={!canManage}
                                    />
                                </div>
                            </div>

                            {/* Volume Produksi Targets */}
                            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-semibold text-slate-800">Target Volume Bulanan (Konsolidasi)</Label>
                                    <div className="relative mt-1">
                                        <Input
                                            type="number"
                                            value={formData.target_monthly_volume}
                                            onChange={e => handleChange("target_monthly_volume", Number(e.target.value))}
                                            className="h-8 text-xs font-mono font-medium bg-white"
                                            disabled={!canManage}
                                        />
                                        <span className="absolute right-3 top-2 text-xs text-slate-400">m³</span>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-slate-800">Target Volume per Cabang</Label>
                                    <div className="relative mt-1">
                                        <Input
                                            type="number"
                                            value={formData.target_branch_volume}
                                            onChange={e => handleChange("target_branch_volume", Number(e.target.value))}
                                            className="h-8 text-xs font-mono font-medium bg-white"
                                            disabled={!canManage}
                                        />
                                        <span className="absolute right-3 top-2 text-xs text-slate-400">m³</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Kolom Kanan: Live Preview Tabel Unit Economics (1:1 dengan Monthly Management Report) */}
                <div className="lg:col-span-5 space-y-4">
                    <Card className="border border-slate-200/80 shadow-2xs bg-white">
                        <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center justify-between">
                                <span>Preview Tabel 1.3 Unit Economics</span>
                                <Badge variant="outline" className="text-[10px] bg-white border-slate-300">
                                    Sinkronisasi Aktif
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">
                                Tampilan kolom "Standard / Target" di Laporan Manajemen Bulanan berdasarkan konfigurasi di samping:
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                                    <tr>
                                        <th className="py-2 px-3 text-left">Komponen Finansial</th>
                                        <th className="py-2 px-3 text-right">Standard / Target</th>
                                        <th className="py-2 px-3 text-left">Porsi / Catatan Acuan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[11px]">
                                    <tr className="bg-blue-50/50 font-semibold">
                                        <td className="py-2 px-3 text-blue-900">Harga Jual Rata-rata (ASP / m³) DPP</td>
                                        <td className="py-2 px-3 text-right font-bold text-blue-800 font-mono">
                                            {formatRp(Number(formData.target_asp) || 0)}
                                        </td>
                                        <td className="py-2 px-3 text-blue-700 font-medium">
                                            Harga Jual Dasar (DPP)
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1.5 px-3 pl-5 text-slate-700">1. Semen Curah &amp; Zak</td>
                                        <td className="py-1.5 px-3 text-right text-slate-600 font-mono">
                                            {formatRp(Number(formData.target_semen_cost) || 0)}
                                        </td>
                                        <td className="py-1.5 px-3 text-slate-600 font-mono">
                                            {computedCogs > 0 ? ((Number(formData.target_semen_cost) / computedCogs) * 100).toFixed(1) : 0}% COGS
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1.5 px-3 pl-5 text-slate-700">2. Pasir Cor</td>
                                        <td className="py-1.5 px-3 text-right text-slate-600 font-mono">
                                            {formatRp(Number(formData.target_pasir_cost) || 0)}
                                        </td>
                                        <td className="py-1.5 px-3 text-slate-600 font-mono">
                                            {computedCogs > 0 ? ((Number(formData.target_pasir_cost) / computedCogs) * 100).toFixed(1) : 0}% COGS
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1.5 px-3 pl-5 text-slate-700">3. Batu Split (1/2 &amp; 2/3)</td>
                                        <td className="py-1.5 px-3 text-right text-slate-600 font-mono">
                                            {formatRp(Number(formData.target_split_cost) || 0)}
                                        </td>
                                        <td className="py-1.5 px-3 text-slate-600 font-mono">
                                            {computedCogs > 0 ? ((Number(formData.target_split_cost) / computedCogs) * 100).toFixed(1) : 0}% COGS
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1.5 px-3 pl-5 text-slate-700">4. Bahan Bakar Solar Armada</td>
                                        <td className="py-1.5 px-3 text-right text-slate-600 font-mono">
                                            {formatRp(Number(formData.target_solar_cost) || 0)}
                                        </td>
                                        <td className="py-1.5 px-3 text-slate-600 font-mono">
                                            {computedCogs > 0 ? ((Number(formData.target_solar_cost) / computedCogs) * 100).toFixed(1) : 0}% COGS
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1.5 px-3 pl-5 text-slate-700">5. Retase Supir Truk Mixer</td>
                                        <td className="py-1.5 px-3 text-right text-slate-600 font-mono">
                                            {formatRp(Number(formData.target_retase_cost) || 0)}
                                        </td>
                                        <td className="py-1.5 px-3 text-slate-600 font-mono">
                                            {computedCogs > 0 ? ((Number(formData.target_retase_cost) / computedCogs) * 100).toFixed(1) : 0}% COGS
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1.5 px-3 pl-5 text-slate-700">6. Suku Cadang &amp; Bengkel PO</td>
                                        <td className="py-1.5 px-3 text-right text-slate-600 font-mono">
                                            {formatRp(Number(formData.target_maintenance_cost) || 0)}
                                        </td>
                                        <td className="py-1.5 px-3 text-slate-600 font-mono">
                                            {computedCogs > 0 ? ((Number(formData.target_maintenance_cost) / computedCogs) * 100).toFixed(1) : 0}% COGS
                                        </td>
                                    </tr>
                                    {(Number(formData.target_other_cogs) || 0) > 0 && (
                                        <tr>
                                            <td className="py-1.5 px-3 pl-5 text-slate-700">7. Biaya Pokok Lainnya (Manual)</td>
                                            <td className="py-1.5 px-3 text-right text-slate-600 font-mono">
                                                {formatRp(Number(formData.target_other_cogs) || 0)}
                                            </td>
                                            <td className="py-1.5 px-3 text-slate-600 font-mono">
                                                {computedCogs > 0 ? ((Number(formData.target_other_cogs) / computedCogs) * 100).toFixed(1) : 0}% COGS
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="bg-slate-100 font-bold border-t">
                                        <td className="py-2 px-3 text-slate-900">Total Biaya Langsung (COGS / m³)</td>
                                        <td className="py-2 px-3 text-right text-red-700 font-mono">
                                            {formatRp(computedCogs)}
                                        </td>
                                        <td className="py-2 px-3 text-slate-800">
                                            100,0% HPP Baku
                                        </td>
                                    </tr>
                                    <tr className="bg-emerald-50/70 font-bold border-t-2 border-emerald-200">
                                        <td className="py-2 px-3 text-emerald-900">Gross Profit per 1 m³</td>
                                        <td className="py-2 px-3 text-right text-emerald-700 font-mono">
                                            {formatRp(computedGrossProfit)}
                                        </td>
                                        <td className="py-2 px-3 text-emerald-800 font-bold">
                                            Target Margin: {computedMarginPct.toFixed(1)}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                            <Info className="h-4 w-4 text-amber-700" />
                            <span>Keterangan Rumus &amp; Standar Target:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 pl-1">
                            <li><strong>Target COGS</strong> = Penjumlahan biaya Semen + Pasir + Split + Solar + Retase + Bengkel + Lainnya.</li>
                            <li><strong>Gross Profit / m³</strong> = Target ASP dikurangi Target COGS.</li>
                            <li>Standar Global berlaku jika cabang tidak memiliki standar khusus tersendiri.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
