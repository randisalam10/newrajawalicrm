"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Calculator, ShieldCheck } from "lucide-react"
import { fmt, fmtDate } from "../helpers"
import { MasterMaterialItem, MaterialLocation } from "../types"

interface MaterialSimulatorCardProps {
    materials: MasterMaterialItem[]
    locations: MaterialLocation[]
    simMaterialCode: string
    onSimMaterialCodeChange: (code: string) => void
    simDate: string
    onSimDateChange: (date: string) => void
    simLocationId: string
    onSimLocationIdChange: (locId: string) => void
    simResult: any
    simLoading: boolean
    onRunSimulation: () => void
}

export function MaterialSimulatorCard({
    materials,
    locations,
    simMaterialCode,
    onSimMaterialCodeChange,
    simDate,
    onSimDateChange,
    simLocationId,
    onSimLocationIdChange,
    simResult,
    simLoading,
    onRunSimulation,
}: MaterialSimulatorCardProps) {
    const activeMatName = materials.find(m => m.code === simMaterialCode)?.name

    return (
        <Card className="border-slate-200/80 shadow-2xs bg-white">
            <CardHeader className="p-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-md">
                        <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold text-slate-800">
                            Simulator Validasi Harga Berdasarkan Tanggal (Backdate Safe Checker)
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Uji coba langsung logika tanggal efektif: sistem akan mencari harga yang sah berlaku pada tanggal tersebut tanpa mengganggu harga masa lalu atau masa depan.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Pilih Material</Label>
                        <Select value={simMaterialCode} onValueChange={onSimMaterialCodeChange}>
                            <SelectTrigger className="h-9 text-xs bg-white mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {materials.map(m => (
                                    <SelectItem key={m.code} value={m.code}>{m.name} ({m.code})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Pilih Tanggal Transaksi / Pengeluaran</Label>
                        <Input
                            type="date"
                            className="h-9 text-xs bg-white mt-1"
                            value={simDate}
                            onChange={e => onSimDateChange(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label className="text-xs font-semibold text-slate-700">Cabang (Opsional)</Label>
                        <Select value={simLocationId} onValueChange={onSimLocationIdChange}>
                            <SelectTrigger className="h-9 text-xs bg-white mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang (Global)</SelectItem>
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={onRunSimulation}
                            disabled={simLoading}
                            className="h-9 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs cursor-pointer font-medium"
                        >
                            {simLoading ? "Memeriksa..." : "Cek Harga Berlaku"}
                        </Button>
                    </div>
                </div>

                {/* Simulation Result Box */}
                {simResult && (
                    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2 mt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                Hasil Pengecekan Harga Pada Tanggal: {fmtDate(simDate)}
                            </span>
                            <Badge className="bg-indigo-600 text-white font-mono">
                                {fmt(simResult.matchedPrice)} / m³
                            </Badge>
                        </div>
                        <p className="text-xs text-indigo-950">
                            Untuk material <strong>{activeMatName}</strong> pada tanggal <strong>{fmtDate(simDate)}</strong>, harga dasar pengeluaran yang sah digunakan adalah <strong>{fmt(simResult.matchedPrice)} per m³</strong>.
                        </p>
                        <div className="pt-2 border-t border-indigo-200/80 text-[11px] text-indigo-800 flex items-center gap-4 flex-wrap">
                            <div>
                                Mulai berlaku sejak: <strong>{fmtDate(simResult.matchedEffectiveDate)}</strong>
                            </div>
                            <div>•</div>
                            <div>
                                Lingkup: <strong>{simResult.matchedLocationName}</strong>
                            </div>
                            {simResult.notes && (
                                <>
                                    <div>•</div>
                                    <div>Catatan: <em>{simResult.notes}</em></div>
                                </>
                            )}
                            {simResult.nextPrice && (
                                <>
                                    <div>•</div>
                                    <div className="text-amber-800">
                                        (Perubahan berikutnya: {fmt(simResult.nextPrice)} pada {fmtDate(simResult.nextEffectiveDate)})
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
