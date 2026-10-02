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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileClock, Plus, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Vehicle, VehicleComplianceRecord } from "../types"

interface ComplianceHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedVehicle: Vehicle | null
    onClearSelectedVehicle: () => void
    canManage: boolean
    records: VehicleComplianceRecord[]
    filterType: string
    onFilterTypeChange: (type: string) => void
    onOpenAddRecord: (vehicleId?: string) => void
    onEditRecord: (record: any) => void
    onDeleteRecord: (id: string) => void
}

export function ComplianceHistoryDialog({
    open,
    onOpenChange,
    selectedVehicle,
    onClearSelectedVehicle,
    canManage,
    records,
    filterType,
    onFilterTypeChange,
    onOpenAddRecord,
    onEditRecord,
    onDeleteRecord,
}: ComplianceHistoryDialogProps) {
    const recordsToDisplay = records.filter(r => {
        if (selectedVehicle && r.vehicleId !== selectedVehicle.id) return false
        if (filterType !== "ALL" && r.type !== filterType) return false
        return true
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2 pr-6">
                        <DialogTitle className="text-base flex items-center gap-2">
                            <FileClock className="h-5 w-5 text-indigo-600" />
                            <span>
                                {selectedVehicle
                                    ? `Riwayat Pajak & KIR: ${selectedVehicle.code} (${selectedVehicle.plate_number})`
                                    : "Buku Riwayat Kepatuhan Armada (Pajak STNK & Uji KIR)"}
                            </span>
                        </DialogTitle>
                        {canManage && (
                            <Button
                                size="sm"
                                onClick={() => onOpenAddRecord(selectedVehicle?.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 shadow-xs cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Catat Pembayaran Pajak / KIR</span>
                            </Button>
                        )}
                    </div>
                    <DialogDescription className="text-xs text-slate-500">
                        Pencatatan riwayat resmi pembayaran pajak tahunan STNK dan berkala uji KIR per armada yang sinkron dengan laporan bulanan manajemen.
                    </DialogDescription>
                </DialogHeader>

                {/* Quick Filter inside Dialog */}
                <div className="flex items-center justify-between gap-2 py-2 border-b text-xs flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">Filter Jenis:</span>
                        <button
                            type="button"
                            onClick={() => onFilterTypeChange("ALL")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${filterType === "ALL" ? "bg-indigo-100 text-indigo-800" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                            Semua ({records.filter(r => !selectedVehicle || r.vehicleId === selectedVehicle.id).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => onFilterTypeChange("PAJAK_STNK")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${filterType === "PAJAK_STNK" ? "bg-indigo-100 text-indigo-800" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                            Pajak STNK
                        </button>
                        <button
                            type="button"
                            onClick={() => onFilterTypeChange("UJI_KIR")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${filterType === "UJI_KIR" ? "bg-indigo-100 text-indigo-800" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                            Uji KIR
                        </button>
                    </div>
                    {selectedVehicle && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearSelectedVehicle}
                            className="text-xs text-slate-500 hover:text-slate-900 h-7 cursor-pointer"
                        >
                            Tampilkan Semua Armada
                        </Button>
                    )}
                </div>

                {/* Table Records */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 text-[11px]">
                                {!selectedVehicle && <TableHead>Armada</TableHead>}
                                <TableHead>Jenis Kepatuhan</TableHead>
                                <TableHead>Tgl Bayar</TableHead>
                                <TableHead>Masa Berlaku</TableHead>
                                <TableHead className="text-right">Biaya (Rp)</TableHead>
                                <TableHead className="text-right">Beban/Bulan</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                {canManage && <TableHead className="text-center w-16">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recordsToDisplay.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-8 text-center text-slate-400 text-xs italic">
                                        Belum ada riwayat pembayaran tercatat untuk kriteria ini.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recordsToDisplay.map((r) => {
                                    const isExpired = new Date(r.valid_until) < new Date()
                                    const thirtyDays = new Date()
                                    thirtyDays.setDate(thirtyDays.getDate() + 30)
                                    const isExpiringSoon = !isExpired && new Date(r.valid_until) <= thirtyDays

                                    return (
                                        <TableRow key={r.id} className="text-xs hover:bg-slate-50/60">
                                            {!selectedVehicle && (
                                                <TableCell>
                                                    <div className="font-bold font-mono text-slate-900">{r.vehicleCode}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">{r.plateNumber}</div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                                    r.type === "PAJAK_STNK"
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : r.type === "UJI_KIR"
                                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                                }`}>
                                                    {r.type === "PAJAK_STNK" ? "Pajak STNK Tahunan" : r.type === "UJI_KIR" ? "Uji KIR Berkala" : r.type}
                                                </span>
                                                {r.receipt_number && (
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                        Bukti: {r.receipt_number}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-slate-700">
                                                {r.payment_date ? format(new Date(r.payment_date), "dd/MM/yyyy") : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-mono text-slate-800">
                                                    {format(new Date(r.valid_from), "dd/MM/yy")} - {format(new Date(r.valid_until), "dd/MM/yy")}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {r.period_months} Bulan
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-slate-900">
                                                Rp {Number(r.cost).toLocaleString("id-ID")}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-indigo-700 bg-indigo-50/40">
                                                Rp {Number(r.monthly_amount).toLocaleString("id-ID")}/bln
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isExpired ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                        Kedaluwarsa
                                                    </span>
                                                ) : isExpiringSoon ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                        Hampir Habis (&lt;30hr)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Aktif
                                                    </span>
                                                )}
                                            </TableCell>
                                            {canManage && (
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-slate-400 hover:text-blue-600"
                                                            onClick={() => onEditRecord(r)}
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-slate-400 hover:text-rose-600"
                                                            onClick={() => onDeleteRecord(r.id)}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter className="mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs h-8 cursor-pointer"
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
