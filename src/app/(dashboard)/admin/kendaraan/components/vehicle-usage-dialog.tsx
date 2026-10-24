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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Vehicle, VehicleUsageCounts } from "../types"
import { FileText, Truck, AlertCircle, CheckCircle2 } from "lucide-react"

export interface DialogVehicle {
    id: string
    plate_number: string
    code?: string | null
    category?: { id?: string; name?: string } | null
    categoryName?: string | null
    location?: { id?: string; name?: string } | null
    locationName?: string | null
    meter_type?: string | null
    usageCounts?: {
        total: number
        transactions?: number
        rblExpenses?: number
        aggregateIncomings?: number
        aggregateOutgoings?: number
        purchaseOrders?: number
        poItems?: number
        sewaTransactions?: number
        complianceRecords?: number
        crusherMaterialsIn?: number
        crusherMaterialsOut?: number
        crusherFuelLogs?: number
        operatorWorkLogs?: number
        vehicleFuelLogs?: number
    }
}

interface VehicleUsageDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vehicle: DialogVehicle | null
}

export function VehicleUsageDialog({
    open,
    onOpenChange,
    vehicle,
}: VehicleUsageDialogProps) {
    if (!vehicle) return null

    const counts = {
        transactions: 0,
        rblExpenses: 0,
        aggregateIncomings: 0,
        aggregateOutgoings: 0,
        purchaseOrders: 0,
        poItems: 0,
        sewaTransactions: 0,
        complianceRecords: 0,
        crusherMaterialsIn: 0,
        crusherMaterialsOut: 0,
        crusherFuelLogs: 0,
        operatorWorkLogs: 0,
        vehicleFuelLogs: 0,
        total: 0,
        ...(vehicle.usageCounts || {}),
    }

    const usageItems = [
        { label: "Surat Jalan Pengiriman Beton Cor", count: counts.transactions, desc: "Modul Produksi / Batching Plant" },
        { label: "Pengeluaran Kas Kecil (RBL)", count: counts.rblExpenses, desc: "Bon BBM / Servis Lapangan" },
        { label: "Log BBM Kendaraan Plant", count: counts.vehicleFuelLogs, desc: "Modul Logistik Bahan Bakar" },
        { label: "Log Pengisian Solar Crusher", count: counts.crusherFuelLogs, desc: "BBM Alat Berat Stone Crusher" },
        { label: "Log Kerja Operator & Alat", count: counts.operatorWorkLogs, desc: "HM & Ritase Kerja Operator" },
        { label: "Transaksi Sewa Alat", count: counts.sewaTransactions, desc: "Modul Penyewaan Armada" },
        { label: "PO & Pembelian Suku Cadang", count: counts.purchaseOrders + counts.poItems, desc: "Pengadaan Logistik & Sparepart" },
        { label: "Penerimaan Material / Agregat", count: counts.aggregateIncomings + counts.crusherMaterialsIn, desc: "Batu Pecah / Raw Quarry Masuk" },
        { label: "Pengiriman Material / Agregat", count: counts.aggregateOutgoings + counts.crusherMaterialsOut, desc: "Pengeluaran Material Crusher" },
        { label: "Riwayat Pajak STNK & Uji KIR", count: counts.complianceRecords, desc: "Kepatuhan Legalitas Unit" },
    ].filter(item => item.count > 0)

    const isUsed = counts.total > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-full p-5">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Rincian Catatan Riwayat Unit</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Rekapitulasi riwayat data transaksi yang terhubung dengan unit armada ini.
                    </DialogDescription>
                </DialogHeader>

                {/* Info Card Unit */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 mt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-slate-600" />
                            <span className="font-bold text-sm text-slate-900">{vehicle.plate_number}</span>
                            <Badge variant="outline" className="text-[10px] font-mono bg-white">
                                {vehicle.code}
                            </Badge>
                        </div>
                        <Badge
                            className={`text-[10px] font-semibold border ${
                                isUsed
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                        >
                            {isUsed ? `${counts.total} Catatan Riwayat` : "0 Catatan (Kosong)"}
                        </Badge>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                        <span>Kategori: <strong>{vehicle.category?.name || vehicle.categoryName || "Dump Truck"}</strong></span>
                        <span>•</span>
                        <span>Lokasi: <strong>{vehicle.location?.name || vehicle.locationName || "-"}</strong></span>
                        <span>•</span>
                        <span>Meter: <strong>{vehicle.meter_type || "KM"}</strong></span>
                    </div>
                </div>

                {/* List Catatan Transaksi */}
                <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto pr-1">
                    {usageItems.length === 0 ? (
                        <div className="p-4 text-center bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex flex-col items-center gap-1.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="font-semibold">Unit Bersih Tanpa Catatan Riwayat</span>
                            <span className="text-[11px] text-emerald-700">
                                Unit ini belum pernah digunakan pada transaksi produksi, pengeluaran RBL, log kerja, maupun BBM. Unit ini aman untuk dihapus jika merupakan data duplikat atau salah input.
                            </span>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                            {usageItems.map((item, idx) => (
                                <div key={idx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                                    <div className="space-y-0.5">
                                        <div className="text-xs font-semibold text-slate-800">{item.label}</div>
                                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-200">
                                        {item.count} Record
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isUsed && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                            <strong>Perhatian Integritas Audit:</strong> Karena unit ini telah memiliki riwayat data resmi, sistem memblokir penghapusan unit agar laporan keuangan dan operasional tidak rusak.
                        </div>
                    </div>
                )}

                <DialogFooter className="pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs w-full"
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
