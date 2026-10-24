"use client"

import React, { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Vehicle } from "../types"
import { Trash2, ShieldAlert, AlertTriangle, FileLock2, Loader2 } from "lucide-react"

export interface DeleteDialogVehicle {
    id: string
    plate_number: string
    code?: string | null
    usageCounts?: { total: number }
}

interface VehicleDeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vehicle: DeleteDialogVehicle | null
    onConfirmDelete: (id: string, reason: string) => Promise<void>
    isDeleting?: boolean
}

export function VehicleDeleteDialog({
    open,
    onOpenChange,
    vehicle,
    onConfirmDelete,
    isDeleting = false,
}: VehicleDeleteDialogProps) {
    const [reason, setReason] = useState("")

    if (!vehicle) return null

    const totalUsage = vehicle.usageCounts?.total || 0
    const isBlocked = totalUsage > 0

    const handleDelete = async () => {
        if (!reason.trim()) return
        await onConfirmDelete(vehicle.id, reason.trim())
        setReason("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-full p-5">
                {isBlocked ? (
                    // ⛔ BLOCKED STATE: Unit has existing records
                    <>
                        <DialogHeader className="space-y-1">
                            <div className="flex items-center gap-2 text-rose-700">
                                <div className="p-2 bg-rose-100 rounded-full">
                                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-sm font-bold text-slate-900">
                                        Unit Tidak Dapat Dihapus
                                    </DialogTitle>
                                    <div className="text-[11px] text-rose-600 font-semibold">
                                        Perlindungan Integritas Data & Audit Trail
                                    </div>
                                </div>
                            </div>
                            <DialogDescription className="text-xs text-slate-600 pt-2 leading-relaxed">
                                Unit armada <strong className="text-slate-900 font-bold">{vehicle.plate_number} ({vehicle.code})</strong> telah memiliki total <strong className="text-rose-700 font-bold">{totalUsage} catatan transaksi aktif</strong> di sistem.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-lg space-y-2 mt-1">
                            <div className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                                <FileLock2 className="w-4 h-4 text-rose-600" />
                                <span>Mengapa unit ini tidak boleh dihapus?</span>
                            </div>
                            <p className="text-[11px] text-rose-800 leading-relaxed">
                                Menghapus kendaraan yang sudah memiliki catatan transaksi akan merusak relasi data keuangan, laporan ritase, kas kecil RBL, maupun surat jalan pengiriman beton yang telah tercatat sebelumnya.
                            </p>
                            <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                                👉 <strong>Saran Solusi:</strong> Jika unit ini sudah tidak beroperasi lagi, ubah status unit menjadi <em>&ldquo;Nonaktif&rdquo;</em> atau <em>&ldquo;Maintenance&rdquo;</em> melalui tombol <strong>Edit</strong> alih-alih menghapusnya.
                            </p>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="text-xs w-full"
                            >
                                Mengerti & Tutup
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    // ✅ SAFE DELETE STATE: Unit has 0 records
                    <>
                        <DialogHeader className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-900">
                                <div className="p-2 bg-amber-100 rounded-full">
                                    <Trash2 className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-sm font-bold text-slate-900">
                                        Hapus Unit Master Kendaraan
                                    </DialogTitle>
                                    <div className="text-[11px] text-slate-500">
                                        Pencatatan Audit Log Wajib
                                    </div>
                                </div>
                            </div>
                            <DialogDescription className="text-xs text-slate-600 pt-2">
                                Unit <strong className="text-slate-900">{vehicle.plate_number} ({vehicle.code})</strong> belum memiliki catatan riwayat transaksi dan <strong>aman untuk dihapus</strong> (misal data duplikat atau salah input).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                                <span className="text-slate-600">Status Penggunaan Unit:</span>
                                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold text-[10px]">
                                    0 Catatan (Unit Bersih)
                                </Badge>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">
                                    Alasan Penghapusan * (Wajib Diisi)
                                </Label>
                                <Input
                                    placeholder="Contoh: Data duplikat salah input, unit uji coba/dummy..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="h-9 text-xs"
                                    autoFocus
                                />
                                <p className="text-[10px] text-slate-400">
                                    Alasan ini akan disimpan permanen ke dalam tabel Audit Log sistem bersama nama akun login Anda.
                                </p>
                            </div>

                            <div className="flex items-start gap-2 p-2 bg-amber-50 rounded border border-amber-200 text-[10px] text-amber-800">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                                <span>Aksi ini bersifat permanen dan tidak dapat dibatalkan.</span>
                            </div>
                        </div>

                        <DialogFooter className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setReason("")
                                    onOpenChange(false)
                                }}
                                disabled={isDeleting}
                                className="text-xs flex-1"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleDelete}
                                disabled={isDeleting || reason.trim().length < 3}
                                className="text-xs bg-rose-600 hover:bg-rose-700 text-white flex-1"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                                        Menghapus...
                                    </>
                                ) : (
                                    "Hapus & Catat Log"
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
