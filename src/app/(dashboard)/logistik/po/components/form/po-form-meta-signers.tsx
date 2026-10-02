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
                    <div className="space-y-2 border-t pt-4">
                        <Label>Pilih Penandatangan (Approval)</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">CEO Signer</Label>
                                <Select value={selectedCeoId} onValueChange={onCeoChange}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Pilih CEO" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Kosongkan --</SelectItem>
                                        {signers.filter(s => s.role === 'CEO').map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {(s as any).employee?.name || s.username}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Approver / FVP Signer</Label>
                                <Select value={selectedFvpId} onValueChange={onFvpChange}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Pilih Approver / FVP" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Kosongkan --</SelectItem>
                                        {signers.filter(s => s.role === 'FVP' || s.role === 'Approver').map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {(s as any).employee?.name || s.username} ({s.role})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label>Nama Pimpinan (Kiri)</Label>
                                <Input
                                    value={pimpinan || ""}
                                    onChange={e => setPimpinan?.(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nama Kepala/Pengaju (Kanan)</Label>
                                <Input
                                    value={kepalaPeralatan || ""}
                                    onChange={e => setKepalaPeralatan?.(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Jabatan Pengaju (Kanan)</Label>
                            <Input
                                value={jabatanKepala || ""}
                                onChange={e => setJabatanKepala?.(e.target.value)}
                                required
                            />
                        </div>
                    </>
                )}

                <div className="space-y-2 border-t pt-4">
                    <Label>Pembuat PO (Sistem)</Label>
                    <Input value={pembuatAdmin} disabled className="bg-slate-50 text-slate-500" />
                </div>

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
