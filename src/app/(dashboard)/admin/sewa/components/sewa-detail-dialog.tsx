"use client"

import React from "react"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Printer } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { formatRp, getStatusBadge } from "../helpers"
import { SewaTransaction } from "../types"

interface SewaDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tx: SewaTransaction | null
}

export function SewaDetailDialog({
    open,
    onOpenChange,
    tx,
}: SewaDetailDialogProps) {
    if (!tx) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Detail Transaksi Sewa
                        </span>
                        {getStatusBadge(tx.status)}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-1 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
                        <div>
                            <span className="text-[11px] text-slate-400">No. Surat Jalan:</span>
                            <p className="font-mono text-xs font-bold text-blue-700">{tx.sewa_number}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[11px] text-slate-400">Tanggal Sewa:</span>
                            <p className="font-semibold text-slate-800">
                                {format(new Date(tx.start_date || tx.date), "dd MMMM yyyy", { locale: idLocale })}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-2.5 border border-slate-200 rounded space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Penyewa (Customer)</span>
                            <p className="font-semibold text-slate-900">{tx.customer?.customer_name}</p>
                            <p className="text-[11px] text-slate-400">{tx.lokasi_proyek || tx.customer?.address}</p>
                        </div>

                        <div className="p-2.5 border border-slate-200 rounded space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Unit & Operator</span>
                            <p className="font-semibold text-slate-900">
                                {tx.vehicle ? `${tx.vehicle.category?.name || "Unit"} ${tx.vehicle.code}` : (tx.equipment?.nama_alat || "-")}
                            </p>
                            <p className="text-[11px] text-slate-500">
                                Operator: {tx.operator?.name}
                                {(tx.vehicle?.plate_number || tx.equipment?.nomor_seri_plat) && ` • ${tx.vehicle?.plate_number || tx.equipment?.nomor_seri_plat}`}
                            </p>
                        </div>
                    </div>

                    {/* Jadwal & Perhitungan Hari */}
                    <div className="p-2.5 border border-blue-200 bg-blue-50/50 rounded space-y-1.5">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-blue-900">Perhitungan Hari:</span>
                            <span className="font-extrabold text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-300">
                                {tx.total_days} HARI
                            </span>
                        </div>

                        {tx.date_mode === "RANGE" ? (
                            <p className="text-slate-700 text-[11px]">
                                Periode: <strong>{format(new Date(tx.start_date), "dd/MM/yyyy")}</strong> s/d <strong>{format(new Date(tx.end_date), "dd/MM/yyyy")}</strong>
                            </p>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-slate-700 text-[11px]">Tanggal Sewa ({tx.total_days} Hari):</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {(() => {
                                        try {
                                            const dates = JSON.parse(tx.rental_dates || "[]")
                                            return dates.map((d: string) => (
                                                <span key={d} className="px-1.5 py-0.5 bg-white border border-blue-200 text-blue-800 rounded font-semibold text-[10px]">
                                                    {format(new Date(d), "dd/MM/yyyy")}
                                                </span>
                                            ))
                                        } catch {
                                            return <span>-</span>
                                        }
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Biaya */}
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Tarif Satuan / Hari:</span>
                            <span className="font-semibold text-slate-800">{formatRp(tx.price_per_day, true)}</span>
                        </div>
                        {tx.is_ppn && (
                            <>
                                <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-1.5">
                                    <span className="text-slate-500">Dasar Pengenaan Pajak (DPP):</span>
                                    <span className="font-mono text-slate-700">{formatRp(tx.dpp_amount || tx.total_price, true)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">PPN ({tx.ppn_mode === "INCLUDE" ? "Include" : "Exclude"} {tx.ppn_rate ?? 11}%):</span>
                                    <span className="font-mono text-blue-700 font-semibold">{formatRp(tx.ppn_amount || 0, true)}</span>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-1.5">
                            <span className="font-bold text-slate-900">Total Nilai Tagihan Sewa:</span>
                            <span className="font-extrabold text-sm text-emerald-700 font-mono">{formatRp(tx.total_price, true)}</span>
                        </div>
                    </div>

                    {tx.notes && (
                        <div className="p-2 bg-slate-100 rounded text-slate-600 text-[11px]">
                            <span className="font-semibold">Catatan:</span> {tx.notes}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <Link
                            href={`/print/sewa/${tx.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                        >
                            <Printer className="w-3.5 h-3.5" /> Cetak Surat Jalan PDF
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
