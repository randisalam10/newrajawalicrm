"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, FileText, Calendar, Building2, User, ExternalLink } from "lucide-react"
import { MonthlyClosingRecord } from "../../types"
import Link from "next/link"

interface SnapshotDetailModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    record: MonthlyClosingRecord | null
}

function formatRp(val: number): string {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}

export function SnapshotDetailModal({
    open,
    onOpenChange,
    record
}: SnapshotDetailModalProps) {
    if (!record) return null

    const sc = record.snapshotData?.scorecard
    const ue = record.snapshotData?.unitEconomics
    const closedDateStr = record.closedAt ? new Date(record.closedAt).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }) : "-"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Lock className="h-4 w-4" />
                            </div>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Snapshot Arsip Laporan Periode {record.period}
                            </DialogTitle>
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Terkunci Permanen
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-2 text-xs">
                    {/* Metadata Header */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                        <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <div>
                                <span className="text-[10px] text-slate-400 block">Cabang / Lingkup</span>
                                <span className="font-semibold text-slate-800">{record.locationName}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <div>
                                <span className="text-[10px] text-slate-400 block">Waktu Tutup Buku</span>
                                <span className="font-semibold text-slate-800">{closedDateStr}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <div>
                                <span className="text-[10px] text-slate-400 block">Auditor / Super Admin</span>
                                <span className="font-semibold text-slate-800">{record.closedByName}</span>
                            </div>
                        </div>
                    </div>

                    {record.notes && (
                        <div className="p-2.5 rounded bg-blue-50/50 border border-blue-100 text-slate-700">
                            <span className="font-semibold text-blue-800 block text-[11px] mb-0.5">Catatan Auditor:</span>
                            <p className="text-[11px] italic">{record.notes}</p>
                        </div>
                    )}

                    {/* Ringkasan Finansial Utama */}
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-2">Ringkasan Laba Rugi Terkunci (Snapshot Final)</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                <span className="text-[11px] text-slate-500 block">Volume Beton</span>
                                <span className="text-sm font-bold text-slate-900">
                                    {record.totalVolume.toLocaleString("id-ID", { maximumFractionDigits: 1 })} m³
                                </span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                <span className="text-[11px] text-slate-500 block">Omset DPP</span>
                                <span className="text-sm font-bold text-slate-900">{formatRp(record.totalRevenue)}</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                <span className="text-[11px] text-slate-500 block">Total HPP (COGS)</span>
                                <span className="text-sm font-bold text-slate-700">{formatRp(record.totalCogs)}</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                <span className="text-[11px] text-slate-500 block">Laba Bersih</span>
                                <span className={`text-sm font-bold ${record.totalNetProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                    {formatRp(record.totalNetProfit)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Rincian Komponen Biaya HPP */}
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-2">Rincian Biaya Pokok Langsung (COGS)</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div className="p-2 bg-white rounded border border-slate-200">
                                <span className="text-slate-500 block text-[11px]">Bahan Semen Silo</span>
                                <span className="font-semibold text-slate-800">{formatRp(record.semenCost)}</span>
                            </div>
                            <div className="p-2 bg-white rounded border border-slate-200">
                                <span className="text-slate-500 block text-[11px]">Pasir Cor</span>
                                <span className="font-semibold text-slate-800">{formatRp(record.pasirCost)}</span>
                            </div>
                            <div className="p-2 bg-white rounded border border-slate-200">
                                <span className="text-slate-500 block text-[11px]">Batu Split (1-2 & 2-3)</span>
                                <span className="font-semibold text-slate-800">{formatRp(record.split12Cost + record.split23Cost)}</span>
                            </div>
                            <div className="p-2 bg-white rounded border border-slate-200">
                                <span className="text-slate-500 block text-[11px]">Solar BBM Armada</span>
                                <span className="font-semibold text-slate-800">{formatRp(record.solarCost)}</span>
                            </div>
                            <div className="p-2 bg-white rounded border border-slate-200">
                                <span className="text-slate-500 block text-[11px]">Upah Retase Supir</span>
                                <span className="font-semibold text-slate-800">{formatRp(record.retaseCost)}</span>
                            </div>
                            <div className="p-2 bg-white rounded border border-slate-200">
                                <span className="text-slate-500 block text-[11px]">Suku Cadang & Bengkel</span>
                                <span className="font-semibold text-slate-800">{formatRp(record.maintenanceCost)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Unit Economics jika tersedia di snapshot */}
                    {ue && (
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-2">Unit Economics Terkunci (per m³)</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                    <span className="text-slate-500 block text-[11px]">Harga Jual (ASP)</span>
                                    <span className="font-semibold text-slate-900">{formatRp(ue.aspPerM3)}/m³</span>
                                </div>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                    <span className="text-slate-500 block text-[11px]">HPP per m³</span>
                                    <span className="font-semibold text-slate-700">{formatRp(ue.cogsPerM3)}/m³</span>
                                </div>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                    <span className="text-slate-500 block text-[11px]">Laba Kotor per m³</span>
                                    <span className="font-semibold text-emerald-700">{formatRp(ue.grossProfitPerM3)}/m³</span>
                                </div>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                    <span className="text-slate-500 block text-[11px]">Beban Usaha Total</span>
                                    <span className="font-semibold text-slate-700">{formatRp(record.totalOverhead)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t pt-3 mt-2">
                    <span className="text-[11px] text-slate-400">
                        ID Kunci: <code className="text-slate-600">{record.closingKey}</code>
                    </span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Tutup
                        </Button>
                        <Link
                            href={`/admin/reports/monthly-management?month=${record.period}${record.locationId ? `&locationId=${record.locationId}` : ""}`}
                            target="_blank"
                            className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded gap-1.5 shadow-sm"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Buka Laporan Penuh</span>
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
