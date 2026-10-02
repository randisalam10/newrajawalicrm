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
import { Receipt, Loader2, ShieldCheck } from "lucide-react"
import { format } from "date-fns"
import { ComplianceType, Vehicle } from "../types"

interface ComplianceRecordFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingRecord: any
    vehicles: Vehicle[]
    compVehicleId: string
    onCompVehicleIdChange: (val: string) => void
    compType: ComplianceType
    onCompTypeChange: (val: ComplianceType) => void
    compPaymentDate: string
    onCompPaymentDateChange: (val: string) => void
    compCost: string
    onCompCostChange: (val: string) => void
    compPeriodMonths: number
    setCompPeriodMonths: (val: number) => void
    compValidFrom: string
    onCompValidFromChange: (val: string) => void
    compValidUntil: string
    onCompValidUntilChange: (val: string) => void
    compReceiptNumber: string
    onCompReceiptNumberChange: (val: string) => void
    compNotes: string
    onCompNotesChange: (val: string) => void
    isSubmitting: boolean
    onSubmit: (e: React.FormEvent) => void
}

export function ComplianceRecordFormDialog({
    open,
    onOpenChange,
    editingRecord,
    vehicles,
    compVehicleId,
    onCompVehicleIdChange,
    compType,
    onCompTypeChange,
    compPaymentDate,
    onCompPaymentDateChange,
    compCost,
    onCompCostChange,
    compPeriodMonths,
    setCompPeriodMonths,
    compValidFrom,
    onCompValidFromChange,
    compValidUntil,
    onCompValidUntilChange,
    compReceiptNumber,
    onCompReceiptNumberChange,
    compNotes,
    onCompNotesChange,
    isSubmitting,
    onSubmit,
}: ComplianceRecordFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-indigo-600" />
                        <span>{editingRecord ? "Edit Catatan Kepatuhan Pajak / KIR" : "Catat Pembayaran Pajak / KIR Baru"}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Masukkan nominal dan masa berlaku agar beban teramortisasi otomatis di laporan bulanan manajemen.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-3.5 text-xs mt-1">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Armada Kendaraan *</Label>
                        <Select value={compVehicleId} onValueChange={onCompVehicleIdChange} disabled={!!editingRecord}>
                            <SelectTrigger className="h-8 text-xs bg-white">
                                <SelectValue placeholder="Pilih Armada" />
                            </SelectTrigger>
                            <SelectContent>
                                {vehicles.map(v => (
                                    <SelectItem key={v.id} value={v.id} className="text-xs">
                                        {v.code} - {v.plate_number} ({v.category?.name || v.vehicle_type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Jenis Pembayaran *</Label>
                            <Select value={compType} onValueChange={(val: any) => onCompTypeChange(val)}>
                                <SelectTrigger className="h-8 text-xs bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PAJAK_STNK" className="text-xs">Pajak STNK Tahunan</SelectItem>
                                    <SelectItem value="UJI_KIR" className="text-xs">Uji KIR Berkala</SelectItem>
                                    <SelectItem value="IZIN_TRAYEK" className="text-xs">Izin Trayek</SelectItem>
                                    <SelectItem value="LAINNYA" className="text-xs">Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Tanggal Pembayaran</Label>
                            <Input
                                type="date"
                                value={compPaymentDate}
                                onChange={e => onCompPaymentDateChange(e.target.value)}
                                className="h-8 text-xs bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Biaya / Nominal Bayar (Rp) *</Label>
                            <Input
                                type="number"
                                placeholder="Contoh: 12000000"
                                value={compCost}
                                onChange={e => onCompCostChange(e.target.value)}
                                required
                                className="h-8 text-xs bg-white font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Durasi Periode (Bulan) *</Label>
                            <Input
                                type="number"
                                value={compPeriodMonths}
                                onChange={e => {
                                    const m = Number(e.target.value) || 1
                                    setCompPeriodMonths(m)
                                    if (compValidFrom) {
                                        const start = new Date(compValidFrom)
                                        start.setMonth(start.getMonth() + m)
                                        onCompValidUntilChange(format(start, "yyyy-MM-dd"))
                                    }
                                }}
                                min={1}
                                required
                                className="h-8 text-xs bg-white font-mono"
                            />
                        </div>
                    </div>

                    <div className="p-2.5 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs">
                        <span className="text-indigo-800 font-medium">Beban Amortisasi Bulanan:</span>
                        <span className="font-mono font-bold text-indigo-900">
                            Rp {compCost && Number(compCost) > 0 ? Math.round(Number(compCost) / (compPeriodMonths || 1)).toLocaleString("id-ID") : "0"} / bln
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Berlaku Mulai *</Label>
                            <Input
                                type="date"
                                value={compValidFrom}
                                onChange={e => onCompValidFromChange(e.target.value)}
                                required
                                className="h-8 text-xs bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Jatuh Tempo *</Label>
                            <Input
                                type="date"
                                value={compValidUntil}
                                onChange={e => onCompValidUntilChange(e.target.value)}
                                required
                                className="h-8 text-xs bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">No. Bukti Pembayaran / No. Seri (Opsional)</Label>
                        <Input
                            placeholder="Contoh: STNK-2026/089 atau KIR-8891"
                            value={compReceiptNumber}
                            onChange={e => onCompReceiptNumberChange(e.target.value)}
                            className="h-8 text-xs bg-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Catatan (Opsional)</Label>
                        <Input
                            placeholder="Contoh: Perpanjangan samsat Jayapura"
                            value={compNotes}
                            onChange={e => onCompNotesChange(e.target.value)}
                            className="h-8 text-xs bg-white"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="text-xs h-8 cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 cursor-pointer"
                        >
                            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            <span>Simpan & Sinkronkan</span>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
