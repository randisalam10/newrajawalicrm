"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wrench, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react"
import { fmtDate } from "../helpers"
import { MaterialLocation } from "../types"

interface MaterialSyncModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    startDate: string
    endDate: string
    selectedLocation: string
    locations: MaterialLocation[]
    syncMode: "missing_only" | "force_all"
    setSyncMode: (mode: "missing_only" | "force_all") => void
    isSyncing: boolean
    onSync: () => void
}

export const MaterialSyncModal: React.FC<MaterialSyncModalProps> = ({
    isOpen,
    onOpenChange,
    startDate,
    endDate,
    selectedLocation,
    locations,
    syncMode,
    setSyncMode,
    isSyncing,
    onSync,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-900">
                        <Wrench className="w-5 h-5 text-amber-600" />
                        <span>Koreksi & Sinkronisasi Harga Material</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-600">
                        Sesuaikan harga per m³ dan total nilai transaksi material (masuk & keluar) dengan tarif Master Material yang berlaku pada tanggal masing-masing transaksi.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 text-xs">
                    {/* Context Info */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between text-slate-600">
                            <span>Periode Diproses:</span>
                            <strong className="text-slate-900">{fmtDate(startDate)} s/d {fmtDate(endDate)}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Cabang / Lokasi:</span>
                            <strong className="text-slate-900">
                                {selectedLocation === "all" ? "Semua Cabang (Global)" : (locations.find((l) => l.id === selectedLocation)?.name || selectedLocation)}
                            </strong>
                        </div>
                    </div>

                    {/* Sync Mode Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-800">Pilih Metode Koreksi:</Label>
                        <div className="space-y-2">
                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${syncMode === 'missing_only' ? 'border-blue-500 bg-blue-50/40 text-blue-950 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
                                <input
                                    type="radio"
                                    name="syncMode"
                                    checked={syncMode === 'missing_only'}
                                    onChange={() => setSyncMode('missing_only')}
                                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="space-y-0.5">
                                    <div className="font-semibold text-xs flex items-center gap-1.5">
                                        <span>Koreksi Transaksi Tanpa Harga (Rp 0)</span>
                                        <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 font-bold">Rekomendasi</Badge>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        Hanya mengisi transaksi yang harga satuannya masih Rp 0 atau kosong. Transaksi yang sengaja diisi harga manual dari invoice vendor tidak akan diubah.
                                    </p>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${syncMode === 'force_all' ? 'border-amber-500 bg-amber-50/40 text-amber-950 ring-1 ring-amber-500' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
                                <input
                                    type="radio"
                                    name="syncMode"
                                    checked={syncMode === 'force_all'}
                                    onChange={() => setSyncMode('force_all')}
                                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                                />
                                <div className="space-y-0.5">
                                    <div className="font-semibold text-xs text-amber-900">
                                        Sinkronkan Ulang Semua Transaksi Sesuai Master
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        Memperbarui seluruh transaksi material (masuk & keluar) dalam periode terpilih mengikuti tarif Master Material per tanggal transaksi.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="p-2.5 rounded-md bg-amber-50/70 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                            Operasi ini akan menyimpan pembaruan nilai kubikasi × harga satuan riil ke database secara permanen.
                        </span>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isSyncing}
                        className="text-xs"
                    >
                        Batal
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onSync}
                        disabled={isSyncing}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                        {isSyncing ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                <span>Memproses Koreksi...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                <span>Jalankan Koreksi Sekarang</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
