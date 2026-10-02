"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Truck, Calculator } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { RetaseSettingItem } from "../types"

interface RetaseDialogsProps {
    // Confirm Dialog
    isConfirming: string | null
    onCloseConfirm: () => void
    pendingTransactions: any[]
    settings: RetaseSettingItem[]
    distanceInput: string
    onDistanceInputChange: (val: string) => void
    isLoading: boolean
    onConfirm: () => void

    // Delete Dialog
    deleteId: string | null
    onCloseDelete: () => void
    onDelete: () => void

    // Mixer Backdate Dialog
    showMixerBackdateAlert: boolean
    onCloseMixerBackdateAlert: () => void
    mixerPrice: string
    mixerCalcMode: "DISTANCE_ONLY" | "DISTANCE_AND_VOLUME"
    mixerEffectiveDate: string
    isSavingMixer: boolean
    onExecuteSaveMixer: () => void

    // Operator Backdate Dialog
    showOperatorBackdateAlert: boolean
    onCloseOperatorBackdateAlert: () => void
    operatorRate: string
    operatorEffectiveDate: string
    isSavingOperator: boolean
    onExecuteSaveOperator: () => void
}

export function RetaseDialogs({
    isConfirming,
    onCloseConfirm,
    pendingTransactions,
    settings,
    distanceInput,
    onDistanceInputChange,
    isLoading,
    onConfirm,
    deleteId,
    onCloseDelete,
    onDelete,
    showMixerBackdateAlert,
    onCloseMixerBackdateAlert,
    mixerPrice,
    mixerCalcMode,
    mixerEffectiveDate,
    isSavingMixer,
    onExecuteSaveMixer,
    showOperatorBackdateAlert,
    onCloseOperatorBackdateAlert,
    operatorRate,
    operatorEffectiveDate,
    isSavingOperator,
    onExecuteSaveOperator,
}: RetaseDialogsProps) {
    const selectedTx = pendingTransactions.find(tx => tx.id === isConfirming)

    return (
        <>
            {/* 1. Dialog Konfirmasi Jarak & Retase Sopir */}
            <Dialog
                open={!!isConfirming}
                onOpenChange={(o) => {
                    if (!o) onCloseConfirm()
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Retase Sopir</DialogTitle>
                        <DialogDescription>
                            Pastikan data riil jarak tempuh sudah benar untuk menghitung komisi Retase supir.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTx && (() => {
                        const locSetting = settings.find((s: any) => s.locationId === selectedTx.locationId)
                        const mode = locSetting?.calculation_mode || "DISTANCE_ONLY"
                        const unitPrice = Number(locSetting?.price_per_cubic_km) || 0
                        const dist = Number(distanceInput) || 0
                        const vol = selectedTx.volume_cubic || 0
                        const estimatedCommission =
                            mode === "DISTANCE_ONLY" ? dist * unitPrice : dist * vol * unitPrice

                        return (
                            <div className="space-y-3 my-2">
                                <div className="bg-blue-50/50 p-4 rounded-lg text-sm space-y-2 border border-blue-100">
                                    <div className="grid grid-cols-3 gap-1">
                                        <span className="text-slate-500">Customer</span>
                                        <span className="col-span-2 font-medium">
                                            {selectedTx.project?.customer?.customer_name ?? '-'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <span className="text-slate-500">Proyek</span>
                                        <span className="col-span-2">{selectedTx.project?.name ?? '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <span className="text-slate-500">Lokasi Cor</span>
                                        <span className="col-span-2">{selectedTx.project?.address ?? '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <span className="text-slate-500">Volume Muatan</span>
                                        <span className="col-span-2 font-semibold">{selectedTx.volume_cubic} M³</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <span className="text-slate-500">Jarak Default Rute</span>
                                        <span className="col-span-2">{selectedTx.project?.default_distance ?? '-'} KM</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t">
                                        <span className="text-slate-500">Supir / Truk</span>
                                        <span className="col-span-2 font-medium">
                                            {selectedTx.driver.name} ({selectedTx.vehicle.plate_number})
                                        </span>
                                    </div>
                                </div>

                                {/* Preview Estimasi Komisi & Rumus Aktif */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Rumus Cabang:</span>
                                        <Badge variant="secondary" className="text-[11px] font-semibold">
                                            {mode === "DISTANCE_ONLY"
                                                ? "Jarak Saja (KM × Tarif)"
                                                : "Jarak & Kubikasi (KM × M³ × Tarif)"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Tarif Dasar Cabang:</span>
                                        <span className="font-semibold text-slate-800">
                                            Rp {unitPrice.toLocaleString("id-ID")}{" "}
                                            {mode === "DISTANCE_ONLY" ? "/ KM" : "/ M³ / KM"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t">
                                        <span className="font-bold text-slate-700">Estimasi Komisi Sopir:</span>
                                        <span className="font-black text-emerald-700 text-sm">
                                            Rp {estimatedCommission.toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })()}

                    <div className="py-2">
                        <Label>Jarak Pengiriman (KM) Aktual *</Label>
                        <Input
                            type="number"
                            step="0.1"
                            value={distanceInput}
                            onChange={(e) => onDistanceInputChange(e.target.value)}
                            placeholder="Contoh: 12.5"
                            className="mt-2 text-lg font-bold"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onCloseConfirm}>Batal</Button>
                        <Button disabled={isLoading} onClick={onConfirm}>
                            {isLoading ? "Memproses..." : "Konfirmasi & Hitung"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. Dialog Hapus Transaksi Terkonfirmasi */}
            <Dialog open={!!deleteId} onOpenChange={(o) => !o && onCloseDelete()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Hapus Transaksi & Surat Jalan?</DialogTitle>
                        <DialogDescription>
                            Tindakan ini akan menghapus permanen transaksi dan riwayat retase sopir dari database.
                            <strong> Namun, log rekam jejak penghapusan (Audit Log) akan tetap tersimpan secara abadi di server sebagai bukti.</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={onCloseDelete}>Batal</Button>
                        <Button disabled={isLoading} variant="destructive" onClick={onDelete}>
                            {isLoading ? "Menghapus..." : "Setuju Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. Dialog Alert Konfirmasi Backdate Sopir Mixer */}
            <Dialog open={showMixerBackdateAlert} onOpenChange={onCloseMixerBackdateAlert}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 text-blue-600">
                            <Truck className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-slate-900">Konfirmasi Tanggal Berlaku Tarif Mixer</DialogTitle>
                        <DialogDescription className="text-sm text-slate-600 leading-relaxed pt-2">
                            Tarif Sopir Mixer <strong>Rp {Number(mixerPrice).toLocaleString("id-ID")}</strong>{" "}
                            ({mixerCalcMode === "DISTANCE_ONLY" ? "Jarak Saja" : "Jarak & Kubikasi"}) akan mulai berlaku untuk pengiriman per tanggal{" "}
                            <span className="font-bold text-slate-900">
                                {mixerEffectiveDate ? format(new Date(mixerEffectiveDate), "dd MMMM yyyy", { locale: idLocale }) : "-"}
                            </span>{" "}
                            ke depan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-700 space-y-1.5 my-2">
                        <p className="font-semibold text-slate-900">Isolasi Keberlakuan Sistem:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                            <li>Transaksi Mixer pada atau setelah tanggal tersebut akan menggunakan tarif baru ini.</li>
                            <li>Transaksi Mixer sebelum tanggal tersebut tetap aman dan menggunakan tarif lama.</li>
                            <li><strong>Tarif Operator BP tidak akan tersentuh sama sekali.</strong></li>
                            <li>Tersinkronisasi otomatis ke Data Master Insentif (Peran Sopir Mixer).</li>
                        </ul>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={onCloseMixerBackdateAlert}>
                            Batal
                        </Button>
                        <Button
                            disabled={isSavingMixer}
                            onClick={onExecuteSaveMixer}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                            {isSavingMixer ? "Menyimpan..." : "Simpan & Terapkan Mixer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 4. Dialog Alert Konfirmasi Backdate Operator BP */}
            <Dialog open={showOperatorBackdateAlert} onOpenChange={onCloseOperatorBackdateAlert}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2 text-emerald-600">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-slate-900">Konfirmasi Tanggal Berlaku Insentif Operator BP</DialogTitle>
                        <DialogDescription className="text-sm text-slate-600 leading-relaxed pt-2">
                            Insentif Operator BP <strong>Rp {Number(operatorRate).toLocaleString("id-ID")}/M³</strong> akan mulai berlaku untuk produksi per tanggal{" "}
                            <span className="font-bold text-slate-900">
                                {operatorEffectiveDate ? format(new Date(operatorEffectiveDate), "dd MMMM yyyy", { locale: idLocale }) : "-"}
                            </span>{" "}
                            ke depan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-700 space-y-1.5 my-2">
                        <p className="font-semibold text-slate-900">Isolasi Keberlakuan Sistem:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                            <li>Produksi pada atau setelah tanggal tersebut akan menggunakan tarif insentif baru ini.</li>
                            <li>Produksi sebelum tanggal tersebut tetap menggunakan tarif insentif lama.</li>
                            <li><strong>Tarif dan transaksi Sopir Mixer tidak akan tersentuh sama sekali.</strong></li>
                            <li>Tersinkronisasi otomatis ke Data Master Insentif (Peran Operator BP).</li>
                        </ul>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={onCloseOperatorBackdateAlert}>
                            Batal
                        </Button>
                        <Button
                            disabled={isSavingOperator}
                            onClick={onExecuteSaveOperator}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                            {isSavingOperator ? "Menyimpan..." : "Simpan & Terapkan Operator"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
