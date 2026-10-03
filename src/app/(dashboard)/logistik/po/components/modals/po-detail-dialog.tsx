"use client"

import React from "react"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Loader2,
    AlertCircle,
    Calendar,
    ExternalLink,
    Printer,
    Pencil,
    X,
    Building2,
    Store,
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    Smartphone,
    Clock,
    FileText,
} from "lucide-react"

interface PODetailDialogProps {
    open: boolean
    onClose: () => void
    selectedPoId: string | null
    detailPo: any | null
    detailLoading: boolean
    detailError: string | null
    canApprove: boolean
    userRole: string
    onRetry: (id: string) => void
    onApprove: (id: string, poNumber: string) => Promise<void>
}

export function PODetailDialog({
    open,
    onClose,
    selectedPoId,
    detailPo,
    detailLoading,
    detailError,
    canApprove,
    userRole,
    onRetry,
    onApprove,
}: PODetailDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
            <DialogContent
                showCloseButton={false}
                className="!max-w-5xl sm:!max-w-5xl md:!max-w-5xl lg:!max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200/90 shadow-2xl bg-white"
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Detail Purchase Order</DialogTitle>
                    <DialogDescription>Rincian data dan barang Purchase Order</DialogDescription>
                </DialogHeader>

                {detailLoading && (
                    <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-slate-600">Memuat rincian Purchase Order...</span>
                    </div>
                )}

                {!detailLoading && detailError && (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 px-6">
                        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800">Gagal Memuat Detail PO</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm">{detailError}</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => selectedPoId && onRetry(selectedPoId)}>
                                Coba Lagi
                            </Button>
                            <Button size="sm" variant="ghost" className="text-xs" onClick={onClose}>
                                Tutup
                            </Button>
                        </div>
                    </div>
                )}

                {!detailLoading && !detailError && !detailPo && (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
                        <p className="text-sm">Data Purchase Order tidak ditemukan atau telah dihapus.</p>
                        <Button size="sm" variant="outline" className="text-xs" onClick={onClose}>
                            Tutup
                        </Button>
                    </div>
                )}

                {!detailLoading && detailPo && (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* ── Top Header Bar ── */}
                        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2.5">
                                    <span className="font-mono font-bold text-lg text-slate-900 tracking-tight">{detailPo.po_number}</span>
                                    <Badge variant="outline" className={`text-xs px-2.5 py-0.5 border font-semibold ${
                                        detailPo.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                        detailPo.status === 'CANCELLED' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                                        'bg-amber-50 text-amber-800 border-amber-300'
                                    }`}>
                                        {detailPo.status === 'APPROVED' ? 'Disetujui' : detailPo.status === 'CANCELLED' ? 'Dibatalkan' : 'Draft'}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[11px] font-medium bg-slate-200/80 text-slate-700">
                                        {detailPo.category?.name}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    Diterbitkan: {new Date(detailPo.tanggal_terbit).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    {detailPo.location?.name && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-600 font-medium">{detailPo.location.name}</span>
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link href={`/logistik/po/${detailPo.id}`} target="_blank">
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-200 hover:bg-slate-100 font-medium">
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Halaman Penuh</span>
                                    </Button>
                                </Link>
                                {detailPo.status === "APPROVED" && (
                                    <Link href={`/print/po/${detailPo.id}`} target="_blank">
                                        <Button size="sm" className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs">
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>Cetak PO</span>
                                        </Button>
                                    </Link>
                                )}
                                {detailPo.status === "DRAFT" && (
                                    <Link href={`/logistik/po/${detailPo.id}/edit`}>
                                        <Button size="sm" className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs">
                                            <Pencil className="w-3.5 h-3.5" />
                                            <span>Edit PO</span>
                                        </Button>
                                    </Link>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 ml-1"
                                    onClick={onClose}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* ── Scrollable Body ── */}
                        <div className="px-6 py-5 overflow-y-auto space-y-5 flex-1 max-h-[calc(90vh-130px)]">
                            {/* 3 Mini Information Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                {/* Card 1: Perusahaan & Proyek */}
                                <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 text-xs space-y-2.5">
                                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                                        <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-blue-700">
                                            <Building2 className="w-3 h-3" />
                                        </div>
                                        <span>Perusahaan & Proyek</span>
                                    </div>
                                    <div className="space-y-1.5 pt-0.5">
                                        <div>
                                            <span className="text-slate-400 block text-[10px] uppercase font-medium">Perusahaan:</span>
                                            <span className="font-semibold text-slate-900 block leading-tight">{detailPo.companyGroup?.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block text-[10px] uppercase font-medium">Proyek:</span>
                                            <span className="text-slate-700 font-medium block leading-tight">{detailPo.project?.name || "-"}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                            <span className="text-slate-500 text-[11px]">Pembayaran:</span>
                                            <span className="font-semibold text-slate-800 text-[11px]">
                                                {detailPo.metode_pembayaran === 'CASH' ? 'Tunai / Cash' : 'Kredit / Tempo'}
                                            </span>
                                        </div>
                                        {detailPo.km_hm_kendaraan && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 text-[11px]">KM / HM:</span>
                                                <span className="font-mono font-medium text-slate-800 text-[11px]">{detailPo.km_hm_kendaraan}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card 2: Rekanan / Supplier */}
                                <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 text-xs space-y-2.5">
                                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                                        <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700">
                                            <Store className="w-3 h-3" />
                                        </div>
                                        <span>Rekanan / Supplier</span>
                                    </div>
                                    <div className="space-y-1.5 pt-0.5">
                                        <div>
                                            <span className="text-slate-400 block text-[10px] uppercase font-medium">Nama Supplier:</span>
                                            <span className="font-semibold text-slate-900 block leading-tight">{detailPo.supplier?.name || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block text-[10px] uppercase font-medium">Kontak / Telepon:</span>
                                            <span className="text-slate-700 block font-medium leading-tight">{detailPo.supplier?.contact || "-"}</span>
                                        </div>
                                        {(detailPo.pic_name || detailPo.pic_phone) && (
                                            <div className="pt-1 border-t border-slate-200/60">
                                                <span className="text-slate-400 block text-[10px] uppercase font-medium">PIC Lapangan:</span>
                                                <span className="text-slate-800 font-medium block leading-tight">
                                                    {detailPo.pic_name} {detailPo.pic_phone ? `(${detailPo.pic_phone})` : ""}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card 3: Otorisasi & Persetujuan */}
                                <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 text-xs space-y-2.5">
                                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                                        <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700">
                                            <ShieldCheck className="w-3 h-3" />
                                        </div>
                                        <span>Otorisasi & Tanda Tangan</span>
                                    </div>
                                    <div className="space-y-1.5 pt-0.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 text-[11px]">1. Menyetujui (Kiri):</span>
                                            <span className="font-medium text-slate-800">{detailPo.pimpinan || "-"}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 text-[11px] truncate max-w-[130px]">2. Mengetahui (Tengah):</span>
                                            <span className="font-medium text-slate-800">
                                                {detailPo.kepala_peralatan && detailPo.kepala_peralatan !== "-" ? detailPo.kepala_peralatan : "— (Kosong)"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 text-[11px]">3. Yang Mengajukan (Kanan):</span>
                                            <span className="font-medium text-slate-800">{detailPo.pembuat_admin}</span>
                                        </div>
                                        {/* Status Approval Section */}
                                        {detailPo.status === 'APPROVED' ? (
                                            detailPo.isBypassed ? (
                                                <div className="mt-2 p-2 rounded-lg bg-amber-50/90 border border-amber-200 text-[11px] space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-amber-900 flex items-center gap-1">
                                                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                            Bypass Admin ({detailPo.approvalChannel || 'WEB'})
                                                        </span>
                                                        <span className="text-[10px] text-amber-700 font-medium bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                                            Bypass
                                                        </span>
                                                    </div>
                                                    <div className="text-slate-700 text-[10.5px]">
                                                        Disetujui oleh: <span className="font-semibold text-slate-900">{detailPo.approvedBy?.employee?.name || detailPo.approvedBy?.username || "Admin"}</span>
                                                        {detailPo.approvedBy?.role && <span className="text-slate-500"> ({detailPo.approvedBy.role})</span>}
                                                    </div>
                                                    {(detailPo.ceoApprovedAt || detailPo.fvpApprovedAt) && (
                                                        <div className="text-[10px] text-slate-500">
                                                            Waktu: {new Date((detailPo.ceoApprovedAt || detailPo.fvpApprovedAt)!).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mt-2 p-2 rounded-lg bg-emerald-50/90 border border-emerald-200 text-[11px] space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-emerald-900 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                            Persetujuan Pimpinan
                                                        </span>
                                                        <span className="text-[10px] text-emerald-700 font-medium bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                                            {detailPo.approvalChannel === 'MOBILE' ? 'Mobile App' : detailPo.approvalChannel || 'Mobile'}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1 pt-0.5 text-[10.5px]">
                                                        {detailPo.ceoApprovedAt && (
                                                            <div className="flex items-center justify-between text-slate-700">
                                                                <span className="flex items-center gap-1">
                                                                    <Smartphone className="w-3 3-3 text-slate-400 shrink-0" />
                                                                    CEO ({detailPo.ceoApprovedBy?.employee?.name || detailPo.ceo?.employee?.name || detailPo.ceo?.username || detailPo.pimpinan || "Pimpinan"}):
                                                                </span>
                                                                <span className="font-medium text-emerald-700">
                                                                    {new Date(detailPo.ceoApprovedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {detailPo.fvpApprovedAt && (
                                                            <div className="flex items-center justify-between text-slate-700">
                                                                <span className="flex items-center gap-1">
                                                                    <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                    FVP ({detailPo.fvpApprovedBy?.employee?.name || detailPo.fvp?.employee?.name || detailPo.fvp?.username || "FVP"}):
                                                                </span>
                                                                <span className="font-medium text-emerald-700">
                                                                    {new Date(detailPo.fvpApprovedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        ) : (detailPo.ceoApprovedAt || detailPo.fvpApprovedAt) ? (
                                            <div className="mt-2 p-2 rounded-lg bg-blue-50/90 border border-blue-200 text-[11px] space-y-1">
                                                <span className="font-semibold text-blue-900 flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                    Disetujui Sebagian (Pending)
                                                </span>
                                                {detailPo.ceoApprovedAt && (
                                                    <div className="text-[10.5px] text-slate-700">
                                                        CEO: Disetujui ({detailPo.ceoApprovedBy?.employee?.name || detailPo.ceo?.employee?.name || detailPo.pimpinan})
                                                    </div>
                                                )}
                                                {detailPo.fvpApprovedAt && (
                                                    <div className="text-[10.5px] text-slate-700">
                                                        FVP: Disetujui ({detailPo.fvpApprovedBy?.employee?.name || detailPo.fvp?.employee?.name || "FVP"})
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            {/* ── Table of Items ── */}
                            <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-xs bg-white">
                                <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                                    <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                                        Daftar Rincian Barang Pesanan ({detailPo.items?.length || 0} Item)
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50/50 border-b border-slate-200/80 text-slate-600 font-semibold">
                                            <tr>
                                                <th className="px-3 py-2.5 text-center w-10">No</th>
                                                <th className="px-3 py-2.5 text-left w-24">Kode</th>
                                                <th className="px-3 py-2.5 text-left min-w-[200px]">Nama Barang Pesanan</th>
                                                <th className="px-3 py-2.5 text-left min-w-[140px]">Unit Kendaraan / Alat</th>
                                                <th className="px-3 py-2.5 text-center w-24">KM / HM</th>
                                                <th className="px-3 py-2.5 text-right w-20">Qty</th>
                                                <th className="px-3 py-2.5 text-center w-20">Satuan</th>
                                                <th className="px-3 py-2.5 text-right w-32">Harga Satuan</th>
                                                <th className="px-3 py-2.5 text-left min-w-[140px]">Keterangan</th>
                                                <th className="px-3 py-2.5 text-right w-36">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {detailPo.items?.map((item: any, i: number) => (
                                                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="px-3 py-2.5 text-center text-slate-400 font-mono">{i + 1}</td>
                                                    <td className="px-3 py-2.5 font-mono text-slate-700 font-medium">{item.masterItem?.kode_barang}</td>
                                                    <td className="px-3 py-2.5">
                                                        <div className="font-semibold text-slate-900">{item.masterItem?.name}</div>
                                                        {(item.masterItem?.part_number || item.masterItem?.merk) && (
                                                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                                {item.masterItem?.merk && <span>Merk: {item.masterItem.merk}</span>}
                                                                {item.masterItem?.part_number && <span>Part: {item.masterItem.part_number}</span>}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        {item.vehicle ? (
                                                            <div>
                                                                <span className="font-semibold text-slate-800 font-mono text-xs block">
                                                                    {item.vehicle.code}
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                                                                    {item.vehicle.plate_number} {item.vehicle.category?.name ? `(${item.vehicle.category.name})` : ""}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center font-mono">
                                                        {item.km_hm ? (
                                                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold text-slate-700 text-[11px]">
                                                                {item.km_hm}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{item.quantity}</td>
                                                    <td className="px-3 py-2.5 text-center text-slate-600 font-medium">{item.masterItem?.satuan}</td>
                                                    <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                                        Rp {item.harga_satuan.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-slate-500 italic">{item.keterangan || "-"}</td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                                                        Rp {item.subtotal.toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold">
                                            <tr>
                                                <td colSpan={9} className="px-4 py-3 text-right text-slate-600 uppercase tracking-wider text-xs">
                                                    Total Nilai Pembelian:
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-base text-emerald-700">
                                                    Rp {(detailPo.items?.reduce((s: number, it: any) => s + it.subtotal, 0) || 0).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Catatan jika ada */}
                            {detailPo.notes && (
                                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold text-amber-950 block mb-0.5">Catatan PO:</span>
                                        <span>{detailPo.notes}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Bottom Footer Bar ── */}
                        <div className="px-6 py-3 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between shrink-0">
                            <div className="text-[11px] text-slate-400 font-mono">
                                ID: {detailPo.id}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs px-4"
                                    onClick={onClose}
                                >
                                    Tutup
                                </Button>
                                {detailPo.status === "SUBMITTED" && canApprove && (
                                    <Button
                                        size="sm"
                                        className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                                        onClick={() => onApprove(detailPo.id, detailPo.po_number)}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Setujui PO (Bypass Admin)
                                    </Button>
                                )}
                                {detailPo.status === "APPROVED" && (
                                    <Link href={`/print/po/${detailPo.id}`} target="_blank">
                                        <Button size="sm" className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                                            <Printer className="w-3.5 h-3.5" /> Cetak PO
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
