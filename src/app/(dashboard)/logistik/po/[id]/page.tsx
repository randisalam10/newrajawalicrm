import { getPurchaseOrderById } from "../actions"
import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft, Printer, Pencil, Building2, Store, Calendar,
    FileText, User, CheckCircle2, Clock, XCircle, ShieldCheck
} from "lucide-react"

export default async function PoDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user?.employeeId) redirect("/login")

    const { id } = await params
    const res = await getPurchaseOrderById(id)

    if (!res?.success || !res?.data) {
        notFound()
    }

    const po = res.data
    const totalAmount = po.items.reduce((acc: number, item: any) => acc + item.subtotal, 0)

    const statusConfig: Record<string, { label: string; badgeCls: string }> = {
        DRAFT: { label: "Draft (Menunggu Persetujuan)", badgeCls: "bg-amber-50 text-amber-800 border-amber-200" },
        APPROVED: { label: "Disetujui", badgeCls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
        CANCELLED: { label: "Dibatalkan", badgeCls: "bg-rose-50 text-rose-800 border-rose-200" },
    }
    const currentStatus = statusConfig[po.status] || statusConfig.DRAFT

    return (
        <div className="space-y-6 pb-12 max-w-6xl mx-auto">
            {/* Top Navigation & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/logistik/po">
                        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                            <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold font-mono tracking-tight text-slate-900">{po.po_number}</h1>
                            <Badge variant="outline" className={`text-xs px-2 py-0.5 border font-semibold ${currentStatus.badgeCls}`}>
                                {currentStatus.label}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Diterbitkan pada {new Date(po.tanggal_terbit).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {po.status === "APPROVED" && (
                        <Link href={`/print/po/${po.id}`} target="_blank">
                            <Button className="h-9 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
                                <Printer className="w-3.5 h-3.5" /> Cetak PO Resmi
                            </Button>
                        </Link>
                    )}
                    {po.status === "DRAFT" && (
                        <>
                            <Link href={`/print/po/${po.id}`} target="_blank">
                                <Button variant="outline" className="h-9 gap-1.5 text-xs">
                                    <Printer className="w-3.5 h-3.5" /> Preview Cetak
                                </Button>
                            </Link>
                            <Link href={`/logistik/po/${po.id}/edit`}>
                                <Button className="h-9 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
                                    <Pencil className="w-3.5 h-3.5" /> Edit PO
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Perusahaan & Proyek */}
                <Card className="border shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b bg-slate-50/50">
                        <CardTitle className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" /> Entitas & Proyek
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-xs">
                        <div>
                            <span className="text-slate-400 block text-[11px]">Perusahaan KOP:</span>
                            <span className="font-semibold text-slate-800 text-sm">{po.companyGroup?.name}</span>
                            <span className="ml-1.5 text-[10px] bg-slate-100 px-1 py-0.2 rounded font-mono text-slate-500">
                                {po.companyGroup?.kode_cabang}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Proyek / Tujuan:</span>
                            <span className="font-medium text-slate-700">{po.project?.name || "-"}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Kategori Belanja:</span>
                            <Badge variant="outline" className="text-[11px] bg-orange-50 text-orange-700 border-orange-200 mt-0.5">
                                {po.category?.name}
                            </Badge>
                        </div>
                        {po.km_hm_kendaraan && (
                            <div>
                                <span className="text-slate-400 block text-[11px]">KM / HM / No. Plat Kendaraan:</span>
                                <span className="font-mono text-slate-800 font-medium">{po.km_hm_kendaraan}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-slate-400 block text-[11px]">Metode Pembayaran:</span>
                            <span className="font-medium text-slate-700">{po.metode_pembayaran}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Rekanan / Supplier */}
                <Card className="border shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b bg-slate-50/50">
                        <CardTitle className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-emerald-600" /> Rekanan / Supplier
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-xs">
                        <div>
                            <span className="text-slate-400 block text-[11px]">Nama Supplier:</span>
                            <span className="font-semibold text-slate-800 text-sm">{po.supplier?.name || "-"}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Alamat:</span>
                            <span className="text-slate-600">{po.supplier?.address || "Tidak ada data alamat"}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Kontak / Telepon:</span>
                            <span className="text-slate-600">{po.supplier?.contact || "-"}</span>
                        </div>
                        {(po.pic_name || po.pic_phone) && (
                            <div className="pt-1.5 border-t border-slate-100">
                                <span className="text-slate-400 block text-[11px]">PIC Lapangan:</span>
                                <span className="font-medium text-slate-700">
                                    {po.pic_name || "-"} {po.pic_phone ? `(${po.pic_phone})` : ""}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Tanda Tangan & Approval */}
                <Card className="border shadow-xs bg-white">
                    <CardHeader className="py-3 px-4 border-b bg-slate-50/50">
                        <CardTitle className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Otorisasi & Tanda Tangan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-xs">
                        <div>
                            <span className="text-slate-400 block text-[11px]">Pembuat (Admin):</span>
                            <span className="font-medium text-slate-800">{po.pembuat_admin}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">{po.jabatan_kepala || "Kepala Peralatan"}:</span>
                            <span className="font-medium text-slate-800">{po.kepala_peralatan}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Pimpinan:</span>
                            <span className="font-medium text-slate-800">{po.pimpinan}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Persetujuan CEO:</span>
                                {po.ceoApprovedAt ? (
                                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disetujui ({new Date(po.ceoApprovedAt).toLocaleDateString('id-ID')})
                                    </span>
                                ) : po.ceoId ? (
                                    <span className="text-amber-600 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Menunggu
                                    </span>
                                ) : (
                                    <span className="text-slate-400">-</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Persetujuan FVP:</span>
                                {po.fvpApprovedAt ? (
                                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disetujui ({new Date(po.fvpApprovedAt).toLocaleDateString('id-ID')})
                                    </span>
                                ) : po.fvpId ? (
                                    <span className="text-amber-600 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Menunggu
                                    </span>
                                ) : (
                                    <span className="text-slate-400">-</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Rincian Barang Pesanan */}
            <Card className="border shadow-xs bg-white overflow-hidden">
                <CardHeader className="py-3 px-4 border-b bg-slate-50/50 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-semibold text-slate-800">Rincian Barang Pesanan</CardTitle>
                        <CardDescription className="text-xs text-slate-500">{po.items.length} item dalam purchase order ini</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50/80 border-b text-slate-500">
                                <tr>
                                    <th className="px-4 py-2.5 text-center w-12 font-semibold">No</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Kode Barang</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Nama Barang</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Merk / Part No</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Satuan</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Harga Satuan (Rp)</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Keterangan</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Subtotal (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {po.items.map((item: any, idx: number) => (
                                    <tr key={item.id} className="hover:bg-slate-50/60">
                                        <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                                        <td className="px-4 py-3 font-mono font-medium text-slate-800">{item.masterItem?.kode_barang}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-900">{item.masterItem?.name}</td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {item.masterItem?.merk || "-"} {item.masterItem?.part_number ? `(${item.masterItem.part_number})` : ""}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">{item.quantity}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.masterItem?.satuan}</td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                                            {item.harga_satuan.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 italic max-w-xs">{item.keterangan || "-"}</td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                            {item.subtotal.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/80 border-t border-slate-200 font-semibold text-slate-800">
                                <tr>
                                    <td colSpan={8} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500">
                                        Total Nilai Purchase Order:
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-mono font-bold text-emerald-700">
                                        Rp {totalAmount.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Catatan Tambahan */}
            {po.notes && (
                <Card className="border shadow-xs bg-white">
                    <CardHeader className="py-2.5 px-4 border-b bg-slate-50/50">
                        <CardTitle className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Catatan Tambahan</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 text-xs text-slate-600 whitespace-pre-line">
                        {po.notes}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
