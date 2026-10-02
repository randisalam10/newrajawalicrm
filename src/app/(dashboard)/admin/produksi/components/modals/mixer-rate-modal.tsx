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

interface MixerRateModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    mixerForm: RateFormState
    setMixerForm: React.Dispatch<React.SetStateAction<RateFormState>>
    isSavingMixer: boolean
    canManageRate: boolean
    onSave: (e: React.FormEvent) => Promise<void>
}

export const MixerRateModal: React.FC<MixerRateModalProps> = ({
    isOpen,
    onOpenChange,
    mixerForm,
    setMixerForm,
    isSavingMixer,
    canManageRate,
    onSave,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold text-slate-900">
                        Pengaturan Tarif Retase Sopir Mixer
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Khusus tarif retase jarak tempuh sopir truk mixer (per KM). Tanggal mulai berlaku ini hanya berlaku untuk sopir dan tidak mempengaruhi operator BP.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSave} className="space-y-3.5 py-1">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">
                            Tarif Retase Mixer (Rp / KM)
                        </Label>
                        <Input
                            type="number"
                            min="0"
                            disabled={!canManageRate}
                            value={mixerForm.tarif_utama}
                            onChange={(e) => setMixerForm((f) => ({ ...f, tarif_utama: e.target.value }))}
                            className="h-8 text-xs font-mono"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Mulai Berlaku Tanggal</Label>
                        <Input
                            type="date"
                            disabled={!canManageRate}
                            value={mixerForm.effective_date}
                            onChange={(e) => setMixerForm((f) => ({ ...f, effective_date: e.target.value }))}
                            className="h-8 text-xs"
                            required
                        />
                        <span className="text-[11px] text-slate-400">
                            Transaksi pengiriman mixer sebelum tanggal ini tetap aman menggunakan tarif terdahulu.
                        </span>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Catatan (Opsional)</Label>
                        <Input
                            disabled={!canManageRate}
                            placeholder="Misal: Penyesuaian rute jarak..."
                            value={mixerForm.keterangan}
                            onChange={(e) => setMixerForm((f) => ({ ...f, keterangan: e.target.value }))}
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
                            <a href="/admin/kendaraan" target="_blank" className="hover:text-slate-900 underline">
                                Master Armada (Mixer) ↗
                            </a>
                            <a href="/admin/karyawan" target="_blank" className="hover:text-slate-900 underline">
                                Master Karyawan (Sopir) ↗
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
                                disabled={isSavingMixer}
                                className="h-8 text-xs cursor-pointer font-medium"
                            >
                                {isSavingMixer ? "Menyimpan..." : "Simpan Tarif Mixer"}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
