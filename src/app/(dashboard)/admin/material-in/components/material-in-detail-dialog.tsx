"use client"

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
import { MaterialInRow } from "../types"
import {
    Building2,
    Calendar,
    FileText,
    Receipt,
    Scale,
    Tag,
    Pencil,
    ShieldCheck,
    AlertCircle,
    Info,
    Hash,
} from "lucide-react"

function formatRp(val?: number | null): string {
    return "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(val || 0)
}

function getUnitLabel(u?: string): string {
    if (!u) return ""
    if (u === "KAPSUL") return "Kapsul"
    if (u === "TON") return "Ton"
    if (u === "ZAK_50") return "Zak (50kg)"
    if (u === "ZAK_40") return "Zak (40kg)"
    if (u === "KG") return "KG"
    return u
}

interface MaterialInDetailDialogProps {
    isOpen: boolean
    onClose: () => void
    item: MaterialInRow | null
    onEdit?: (item: MaterialInRow) => void
    canManage?: boolean
}

export function MaterialInDetailDialog({
    isOpen,
    onClose,
    item,
    onEdit,
    canManage = false,
}: MaterialInDetailDialogProps) {
    if (!item) return null

    const hasPo = Boolean(item.purchaseOrderId || item.poNumber)
    const effectivePerKg = item.effectivePricePerKg || (item.tonnage > 0 && item.total_price > 0 ? item.total_price / item.tonnage : 0)

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader className="space-y-2 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-blue-600" />
                            Detail Tracing Penerimaan Semen
                        </DialogTitle>
                        <div className="flex items-center gap-1.5">
                            {hasPo ? (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
                                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                    Terverifikasi PO
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 text-xs font-normal">
                                    Pencatatan Lapangan
                                </Badge>
                            )}
                            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium">
                                {item.locationName}
                            </Badge>
                        </div>
                    </div>
                    <DialogDescription className="text-xs text-slate-500">
                        Audit trail fisik timbangan silo, dokumen surat jalan, dan penelusuran harga pengadaan material.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* SECTION 1: Informasi Dokumen & Vendor */}
                    <div className="rounded-lg border border-slate-200/90 bg-slate-50/40 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            <FileText className="h-4 w-4 text-slate-500" />
                            Dokumen & Identitas Material
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-xs text-slate-500 block">Nama Material Semen</span>
                                <span className="font-semibold text-slate-900">{item.name}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Distributor / Vendor</span>
                                <span className="font-medium text-slate-800">{item.supplier}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">No Bon / Surat Jalan Vendor</span>
                                <span className="font-mono font-semibold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 inline-block mt-0.5">
                                    {item.delivery_note}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Waktu Penerimaan</span>
                                <span className="text-slate-800">
                                    {item.formattedDate} {item.formattedTime && item.formattedTime !== "-" ? `• ${item.formattedTime} WIB` : ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Fisik & Timbangan Silo */}
                    <div className="rounded-lg border border-slate-200/90 bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            <Scale className="h-4 w-4 text-slate-500" />
                            Fisik & Timbangan Silo
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-slate-50 rounded-md p-3">
                                <span className="text-xs text-slate-500 block">Berat Bersih (KG)</span>
                                <span className="text-lg font-bold font-mono text-slate-900">
                                    {item.tonnage.toLocaleString("id-ID")}
                                </span>
                                <span className="text-xs text-slate-500 ml-1">KG</span>
                            </div>
                            <div className="bg-slate-50 rounded-md p-3">
                                <span className="text-xs text-slate-500 block">Kubikasi / Berat (Ton)</span>
                                <span className="text-lg font-bold font-mono text-slate-900">
                                    {(item.tonnage / 1000).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs text-slate-500 ml-1">Ton</span>
                            </div>
                            <div className="bg-slate-50 rounded-md p-3">
                                <span className="text-xs text-slate-500 block">Satuan Pembelian</span>
                                <span className="text-base font-semibold text-slate-800">
                                    {item.purchase_qty || 1} {getUnitLabel(item.purchase_unit)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Informasi Harga & Tracing Nilai */}
                    <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                                <Tag className="h-4 w-4 text-emerald-600" />
                                Informasi Harga & Biaya (Price Tracing)
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]">
                                Realisasi Biaya
                            </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-white border border-emerald-100 rounded-md p-3">
                                <span className="text-xs text-slate-500 block">Harga Satuan Pembelian</span>
                                <div className="text-base font-bold font-mono text-slate-900">
                                    {formatRp(item.unit_price)}
                                </div>
                                <span className="text-[11px] text-slate-400">
                                    per {getUnitLabel(item.purchase_unit)}
                                </span>
                            </div>
                            <div className="bg-white border border-emerald-100 rounded-md p-3">
                                <span className="text-xs text-slate-500 block">Total Nilai Pembelian</span>
                                <div className="text-base font-bold font-mono text-emerald-700">
                                    {formatRp(item.total_price)}
                                </div>
                                <span className="text-[11px] text-slate-400">
                                    Total DPP / Beban Pembelian
                                </span>
                            </div>
                        </div>

                        {/* Cost per KG Breakdown */}
                        <div className="bg-white/80 border border-slate-200 rounded-md p-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <span className="text-xs font-medium text-slate-600 block">Biaya Efektif per Kilogram (HPP Riil)</span>
                                <span className="text-[11px] text-slate-400">Dihitung dari Total Nilai dibagi Total KG Timbangan</span>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-extrabold font-mono text-blue-700">
                                    {formatRp(Math.round(effectivePerKg))}
                                </span>
                                <span className="text-xs font-medium text-slate-500 ml-1">/ KG</span>
                                <div className="text-[10px] font-mono text-slate-500">
                                    (~{formatRp(Math.round(effectivePerKg * 1000))} / Ton)
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: Tracing PO (Purchase Order) */}
                    <div className="rounded-lg border border-slate-200/90 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                <Building2 className="h-4 w-4 text-slate-500" />
                                Tracing Dokumen Pengadaan (PO Logistik)
                            </div>
                            {item.poStatus && (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                                    {item.poStatus}
                                </Badge>
                            )}
                        </div>

                        {hasPo ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-blue-50/30 border border-blue-100 rounded-md p-3">
                                <div>
                                    <span className="text-xs text-slate-500 block">Nomor PO Terhubung</span>
                                    <span className="font-mono font-bold text-blue-700 text-sm">
                                        {item.poNumber}
                                    </span>
                                </div>
                                {item.poDate && (
                                    <div>
                                        <span className="text-xs text-slate-500 block">Tanggal Terbit PO</span>
                                        <span className="text-slate-800">{item.poDate}</span>
                                    </div>
                                )}
                                {item.poCompany && (
                                    <div>
                                        <span className="text-xs text-slate-500 block">Perusahaan Pemesan</span>
                                        <span className="text-slate-800">{item.poCompany}</span>
                                    </div>
                                )}
                                {item.poItemName && (
                                    <div>
                                        <span className="text-xs text-slate-500 block">Katalog Item PO</span>
                                        <span className="text-slate-800">{item.poItemName}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/60 p-3.5 flex items-start gap-2.5">
                                <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                <div className="text-xs text-slate-600 leading-relaxed">
                                    <p className="font-medium text-slate-700">Pencatatan Non-PO (Input Manual Lapangan)</p>
                                    Material ini dicatat langsung dari Surat Jalan vendor oleh admin cabang tanpa melalui alur Purchase Order logistik terpusat.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Metadata Debug / System ID */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span className="flex items-center gap-1 font-mono">
                            <Hash className="h-3 w-3" /> ID: {item.id}
                        </span>
                        <span>Lokasi ID: {item.locationId}</span>
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between pt-3 border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={onClose} className="h-9 text-xs">
                        Tutup
                    </Button>
                    {canManage && onEdit && (
                        <Button
                            size="sm"
                            onClick={() => {
                                onClose()
                                onEdit(item)
                            }}
                            className="h-9 gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Transaksi
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
