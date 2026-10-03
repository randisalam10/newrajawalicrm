"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface POFormMetaSignersProps {
    tanggalTerbit: string
    setTanggalTerbit: (val: string) => void
    signers?: any[]
    selectedCeoId?: string
    onCeoChange?: (val: string) => void
    selectedFvpId?: string
    onFvpChange?: (val: string) => void
    pimpinan?: string
    setPimpinan?: (val: string) => void
    kepalaPeralatan?: string
    setKepalaPeralatan?: (val: string) => void
    jabatanKepala?: string
    setJabatanKepala?: (val: string) => void
    pembuatAdmin: string
    notes: string
    setNotes: (val: string) => void
    picName: string
    setPicName: (val: string) => void
    picPhone: string
    setPicPhone: (val: string) => void
}

export function POFormMetaSigners({
    tanggalTerbit,
    setTanggalTerbit,
    signers = [],
    selectedCeoId,
    onCeoChange,
    selectedFvpId,
    onFvpChange,
    pimpinan,
    setPimpinan,
    kepalaPeralatan,
    setKepalaPeralatan,
    jabatanKepala,
    setJabatanKepala,
    pembuatAdmin,
    notes,
    setNotes,
    picName,
    setPicName,
    picPhone,
    setPicPhone,
}: POFormMetaSignersProps) {
    const hasSignerSelect = signers && signers.length > 0

    return (
        <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
                <CardTitle className="text-lg">Penandatangan & Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label>Tanggal Terbit PO</Label>
                    <Input
                        type="date"
                        value={tanggalTerbit}
                        onChange={e => setTanggalTerbit(e.target.value)}
                        required
                    />
                </div>

                {hasSignerSelect ? (
                    <div className="space-y-3 border-t pt-4">
                        <div>
                            <Label className="text-sm font-semibold text-slate-800">Penandatangan Dokumen PO</Label>
                            <p className="text-xs text-slate-500">
                                Sesuai format dokumen PO: Kiri (Menyetujui), Tengah (Mengetahui - Opsional), Kanan (Yang Mengajukan).
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                            {/* KIRI: Menyetujui */}
                            <div className="space-y-1.5 p-2.5 bg-white rounded-md border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">1. Menyetujui (Kiri)</span>
                                    <span className="text-[10px] text-rose-600 font-semibold">* Wajib</span>
                                </div>
                                <Label className="text-xs text-slate-500">Pimpinan / CEO</Label>
                                <Select value={selectedCeoId} onValueChange={onCeoChange}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Pilih CEO" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Pilih CEO --</SelectItem>
                                        {signers.filter(s => s.role === 'CEO' || (s.isPoApprover && (s.poApproverRole === 'CEO' || s.poApproverRole === 'BOTH'))).map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {(s as any).employee?.name || s.username}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* TENGAH: Mengetahui */}
                            <div className="space-y-1.5 p-2.5 bg-white rounded-md border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">2. Mengetahui (Tengah)</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Biasa Kosong</span>
                                </div>
                                <Label className="text-xs text-slate-500">Approver / FVP</Label>
                                <Select value={selectedFvpId} onValueChange={onFvpChange}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="-- Kosongkan --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Kosongkan (Tanpa Verifikator) --</SelectItem>
                                        {signers.filter(s => s.role === 'FVP' || s.role === 'Approver' || (s.isPoApprover && (s.poApproverRole === 'FVP' || s.poApproverRole === 'BOTH' || !s.poApproverRole))).map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {(s as any).employee?.name || s.username}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* KANAN: Yang Mengajukan */}
                            <div className="space-y-1.5 p-2.5 bg-white rounded-md border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">3. Yang Mengajukan (Kanan)</span>
                                    <span className="text-[10px] text-emerald-600 font-semibold">Otomatis</span>
                                </div>
                                <Label className="text-xs text-slate-500">Admin Pembuat PO</Label>
                                <Input value={pembuatAdmin} disabled className="h-8 text-xs bg-slate-50 text-slate-600 font-medium" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 border-t pt-4">
                        <Label className="text-sm font-semibold text-slate-800">Penandatangan Dokumen PO</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                            {/* KIRI */}
                            <div className="space-y-1.5 p-2.5 bg-white rounded-md border border-slate-200 shadow-xs">
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">1. Menyetujui (Kiri) *</span>
                                <Label className="text-xs text-slate-500">Nama Pimpinan / CEO</Label>
                                <Input
                                    value={pimpinan || ""}
                                    onChange={e => setPimpinan?.(e.target.value)}
                                    placeholder="Nama Pimpinan"
                                    className="h-8 text-xs"
                                    required
                                />
                            </div>

                            {/* TENGAH */}
                            <div className="space-y-1.5 p-2.5 bg-white rounded-md border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">2. Mengetahui (Tengah)</span>
                                    <span className="text-[10px] text-slate-400">Biasa Kosong</span>
                                </div>
                                <Label className="text-xs text-slate-500">Nama Approver (Opsional)</Label>
                                <Input
                                    value={kepalaPeralatan || ""}
                                    onChange={e => setKepalaPeralatan?.(e.target.value)}
                                    placeholder="Kosongkan jika tidak ada"
                                    className="h-8 text-xs"
                                />
                                <Label className="text-xs text-slate-500 mt-1 block">Jabatan</Label>
                                <Input
                                    value={jabatanKepala || ""}
                                    onChange={e => setJabatanKepala?.(e.target.value)}
                                    placeholder="Contoh: Kepala Peralatan"
                                    className="h-8 text-xs"
                                />
                            </div>

                            {/* KANAN */}
                            <div className="space-y-1.5 p-2.5 bg-white rounded-md border border-slate-200 shadow-xs">
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">3. Yang Mengajukan (Kanan)</span>
                                <Label className="text-xs text-slate-500">Admin Pembuat PO</Label>
                                <Input value={pembuatAdmin} disabled className="h-8 text-xs bg-slate-50 text-slate-600 font-medium" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Catatan (Opsional)</Label>
                    <Input
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Catatan tambahan..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div className="space-y-2">
                        <Label>Nama PIC / Penanggungjawab</Label>
                        <Input
                            value={picName}
                            onChange={e => setPicName(e.target.value)}
                            placeholder="Nama PIC..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>No. HP PIC</Label>
                        <Input
                            value={picPhone}
                            onChange={e => setPicPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder="No. HP..."
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
