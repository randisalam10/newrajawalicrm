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
import { RateFormState } from "../../types"

interface OperatorRateModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    operatorForm: RateFormState
    setOperatorForm: React.Dispatch<React.SetStateAction<RateFormState>>
    isSavingOperator: boolean
    canManageRate: boolean
    onSave: (e: React.FormEvent) => Promise<void>
}

export const OperatorRateModal: React.FC<OperatorRateModalProps> = ({
    isOpen,
    onOpenChange,
    operatorForm,
    setOperatorForm,
    isSavingOperator,
    canManageRate,
    onSave,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold text-slate-900">
                        Pengaturan Tarif Operator BP
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Khusus tarif produksi operator batching plant (per m³). Tanggal mulai berlaku ini hanya berlaku untuk operator BP dan tidak mempengaruhi sopir mixer.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSave} className="space-y-3.5 py-1">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">
                            Tarif Operator BP (Rp / m³)
                        </Label>
                        <Input
                            type="number"
                            min="0"
                            disabled={!canManageRate}
                            value={operatorForm.tarif_utama}
                            onChange={(e) => setOperatorForm((f) => ({ ...f, tarif_utama: e.target.value }))}
                            className="h-8 text-xs font-mono"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Mulai Berlaku Tanggal</Label>
                        <Input
                            type="date"
                            disabled={!canManageRate}
                            value={operatorForm.effective_date}
                            onChange={(e) => setOperatorForm((f) => ({ ...f, effective_date: e.target.value }))}
                            className="h-8 text-xs"
                            required
                        />
                        <span className="text-[11px] text-slate-400">
                            Transaksi BP sebelum tanggal ini tetap aman menggunakan tarif terdahulu.
                        </span>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Catatan (Opsional)</Label>
                        <Input
                            disabled={!canManageRate}
                            placeholder="Misal: Penyesuaian tarif shift BP..."
                            value={operatorForm.keterangan}
                            onChange={(e) => setOperatorForm((f) => ({ ...f, keterangan: e.target.value }))}
                            className="h-8 text-xs"
                        />
                    </div>

                    {!canManageRate && (
                        <div className="rounded bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-500">
                            Mode lihat saja. Hanya SuperAdmin atau Admin Cabang yang dapat mengubah tarif.
                        </div>
                    )}

                    {/* Akses Cepat Master Data Terkait */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-xs text-slate-500">
                        <div className="font-medium text-slate-600">Akses Master Terkait:</div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
                            <a href="/admin/master-insentif" target="_blank" className="hover:text-slate-900 underline">
                                Master Insentif Lengkap ↗
                            </a>
                            <a href="/admin/karyawan" target="_blank" className="hover:text-slate-900 underline">
                                Master Karyawan (Operator) ↗
                            </a>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 text-xs"
                        >
                            Tutup
                        </Button>
                        {canManageRate && (
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSavingOperator}
                                className="h-8 text-xs cursor-pointer font-medium"
                            >
                                {isSavingOperator ? "Menyimpan..." : "Simpan Tarif Operator"}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
