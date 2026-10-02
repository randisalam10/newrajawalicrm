"use client"

import React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Settings,
    MapPin,
    Calculator,
} from "lucide-react"

interface TarifRetaseTabProps {
    locations: { id: string; name: string }[]
    retaseSettings: any[]
    tarifLocationId: string
    onTarifLocationSelect: (id: string) => void
    priceDtBesar: string
    setPriceDtBesar: (v: string) => void
    priceDtKecil: string
    setPriceDtKecil: (v: string) => void
    defaultDistanceKm: string
    setDefaultDistanceKm: (v: string) => void
    isSavingTarif: boolean
    onSaveTarif: (e: React.FormEvent) => void
}

export function TarifRetaseTab({
    locations,
    retaseSettings,
    tarifLocationId,
    onTarifLocationSelect,
    priceDtBesar,
    setPriceDtBesar,
    priceDtKecil,
    setPriceDtKecil,
    defaultDistanceKm,
    setDefaultDistanceKm,
    isSavingTarif,
    onSaveTarif,
}: TarifRetaseTabProps) {
    const getExistingSetting = (locId: string) => retaseSettings.find((s: any) => s.locationId === locId)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* FORM KONFIGURASI TARIF PER CABANG (7 Cols) */}
            <Card className="lg:col-span-7 border-emerald-200/80 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
                    <div className="flex items-center gap-2 text-emerald-950">
                        <div className="p-2 bg-emerald-600 text-white rounded-lg">
                            <Settings className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold">
                                Konfigurasi Tarif Retase Dump Truck Quarry
                            </CardTitle>
                            <CardDescription className="text-xs text-emerald-800">
                                Atur tarif retase per m³·km armada Dump Truck Besar (Tronton) & DT Kecil (Engkel) serta jarak acuan quarry per pangkalan.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-6">
                    <form onSubmit={onSaveTarif} className="space-y-5">
                        {/* PILIH CABANG */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                <span>Pilih Cabang Pangkalan Batching Plant *</span>
                            </Label>
                            <select
                                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                                value={tarifLocationId}
                                onChange={(e) => onTarifLocationSelect(e.target.value)}
                                required
                            >
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        📍 {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* RUMUS INFO CARD */}
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                                <Calculator className="h-4 w-4 text-emerald-600" />
                                <span>Rumus Baku Perhitungan Retase Dump Truck:</span>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-emerald-200 font-mono font-bold text-emerald-900 text-center text-xs shadow-2xs">
                                Total Retase = Tarif DT (Rp/m³·km) × Jarak Riil (KM) × Kubikasi Muatan (m³)
                            </div>
                            <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                                Komisi sopir DT internal dihitung proporsional terhadap jarak tempuh dari tambang quarry ke pangkalan dan volume agregat yang diangkut.
                            </p>
                        </div>

                        {/* INPUT HARGA DT BESAR & DT KECIL */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* DT BESAR */}
                            <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-900">
                                        Tarif DT Besar (Rp / m³·km) *
                                    </Label>
                                    <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">Tronton</Badge>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={priceDtBesar}
                                        onChange={(e) => setPriceDtBesar(e.target.value)}
                                        placeholder="Misal: 1500"
                                        required
                                        className="pl-9 h-9 text-xs font-bold font-mono bg-white"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500">
                                    Khusus armada Dump Truck 10 roda / Tronton.
                                </p>
                            </div>

                            {/* DT KECIL */}
                            <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-900">
                                        Tarif DT Kecil (Rp / m³·km) *
                                    </Label>
                                    <Badge className="bg-amber-600 text-white text-[10px] px-1.5 py-0">Engkel</Badge>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={priceDtKecil}
                                        onChange={(e) => setPriceDtKecil(e.target.value)}
                                        placeholder="Misal: 1800"
                                        required
                                        className="pl-9 h-9 text-xs font-bold font-mono bg-white"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500">
                                    Khusus armada Dump Truck 6 roda / Engkel.
                                </p>
                            </div>
                        </div>

                        {/* JARAK DEFAULT */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-900">
                                Default Jarak Rute Quarry ke Batching Plant (KM) *
                            </Label>
                            <div className="relative max-w-sm">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={defaultDistanceKm}
                                    onChange={(e) => setDefaultDistanceKm(e.target.value)}
                                    placeholder="Misal: 25.0"
                                    required
                                    className="h-9 text-xs font-bold font-mono pr-12 bg-white"
                                />
                                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">KM</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Jarak standar rute quarry cabang ini. Operator saat input penerimaan dapat menggunakan jarak ini otomatis atau mengetik jarak riil.
                            </p>
                        </div>

                        {/* SIMULASI LIVE */}
                        <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200 space-y-2">
                            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                                <span>Simulasi Komisi (Contoh: Jarak {defaultDistanceKm || "25"} KM, Muatan 8 m³)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <div className="text-[10px] text-slate-500 font-semibold">Komisi DT Besar:</div>
                                    <div className="text-sm font-black text-blue-700 font-mono mt-0.5">
                                        Rp {Math.round((Number(priceDtBesar) || 0) * (Number(defaultDistanceKm) || 0) * 8).toLocaleString("id-ID")}
                                    </div>
                                </div>
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <div className="text-[10px] text-slate-500 font-semibold">Komisi DT Kecil:</div>
                                    <div className="text-sm font-black text-amber-700 font-mono mt-0.5">
                                        Rp {Math.round((Number(priceDtKecil) || 0) * (Number(defaultDistanceKm) || 0) * 8).toLocaleString("id-ID")}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            disabled={isSavingTarif}
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-xs"
                        >
                            {isSavingTarif ? "Menyimpan Tarif Dump Truck..." : "Simpan Konfigurasi Tarif"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* TABEL MASTER TARIF SELURUH CABANG (5 Cols) */}
            <Card className="lg:col-span-5 border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/80 border-b border-slate-200 pb-3">
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>Daftar Tarif Seluruh Cabang</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                        Perbandingan tarif retase aktif per batching plant.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="text-xs">Cabang</TableHead>
                                <TableHead className="text-xs">DT Besar</TableHead>
                                <TableHead className="text-xs">DT Kecil</TableHead>
                                <TableHead className="text-xs">Jarak</TableHead>
                                <TableHead className="text-xs text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {locations.map((loc) => {
                                const s = getExistingSetting(loc.id)
                                const isSelected = loc.id === tarifLocationId
                                return (
                                    <TableRow
                                        key={loc.id}
                                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? "bg-emerald-50/40 font-semibold" : ""}`}
                                        onClick={() => onTarifLocationSelect(loc.id)}
                                    >
                                        <TableCell className="text-xs font-bold text-slate-800">
                                            {loc.name}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">
                                            {s?.price_dt_besar ? `Rp ${s.price_dt_besar.toLocaleString("id-ID")}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">
                                            {s?.price_dt_kecil ? `Rp ${s.price_dt_kecil.toLocaleString("id-ID")}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-slate-500">
                                            {s?.default_distance_km ? `${s.default_distance_km} KM` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant={isSelected ? "default" : "outline"}
                                                size="sm"
                                                className={`h-6 text-[10px] px-2 ${isSelected ? "bg-emerald-600 text-white" : ""}`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onTarifLocationSelect(loc.id)
                                                }}
                                            >
                                                {isSelected ? "Aktif" : "Edit"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
