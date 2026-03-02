"use client"

import React, { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { getPOReport } from "./actions"
import { FileText, Printer, Loader2, TrendingUp } from "lucide-react"

const MONTHS = [
    { value: "1", label: "Januari" }, { value: "2", label: "Februari" },
    { value: "3", label: "Maret" }, { value: "4", label: "April" },
    { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
    { value: "7", label: "Juli" }, { value: "8", label: "Agustus" },
    { value: "9", label: "September" }, { value: "10", label: "Oktober" },
    { value: "11", label: "November" }, { value: "12", label: "Desember" },
]

const YEARS = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - 2 + i
    return { value: String(y), label: String(y) }
})

const STATUS_OPTIONS = [
    { value: "ALL", label: "Semua Status" },
    { value: "APPROVED", label: "Disetujui" },
    { value: "DRAFT", label: "Draft" },
    { value: "CANCELLED", label: "Dibatalkan" },
]

type ReportResult = Awaited<ReturnType<typeof getPOReport>>

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")
const fmtDate = (d: Date) => new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })

const statusBadge: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700",
    APPROVED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
}

export function POReportClient({
    companies, categories
}: {
    companies: any[]
    categories: any[]
}) {
    const now = new Date()
    const [bulan, setBulan] = useState(String(now.getMonth() + 1))
    const [tahun, setTahun] = useState(String(now.getFullYear()))
    const [grupBy, setGrupBy] = useState<"kategori" | "perusahaan" | "metode_pembayaran">("kategori")
    const [categoryId, setCategoryId] = useState("")
    const [companyGroupId, setCompanyGroupId] = useState("")
    const [status, setStatus] = useState("ALL")
    const [result, setResult] = useState<ReportResult | null>(null)
    const [pending, startTransition] = useTransition()

    const companyOptions = [{ value: "", label: "Semua Perusahaan" }, ...companies.map((c: any) => ({ value: c.id, label: c.name }))]
    const categoryOptions = [{ value: "", label: "Semua Kategori" }, ...categories.map((c: any) => ({ value: c.id, label: `${c.name} (${c.kode_kategori})` }))]

    function handleGenerate() {
        startTransition(async () => {
            const data = await getPOReport({
                bulan: Number(bulan),
                tahun: Number(tahun),
                grupBy,
                categoryId: categoryId || undefined,
                companyGroupId: companyGroupId || undefined,
                status: status as any,
            })
            setResult(data)
        })
    }

    function buildPrintUrl() {
        const params = new URLSearchParams({
            bulan, tahun, grupBy,
            ...(categoryId && { categoryId }),
            ...(companyGroupId && { companyGroupId }),
            ...(status !== "ALL" && { status }),
        })
        return `/print/po/laporan?${params.toString()}`
    }

    const monthLabel = MONTHS.find(m => m.value === bulan)?.label || bulan

    return (
        <div className="space-y-5 p-4">
            {/* Filter Card */}
            <Card className="shadow-sm border-blue-100">
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bulan</Label>
                            <Combobox options={MONTHS} value={bulan} onChange={setBulan} placeholder="Bulan..." />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tahun</Label>
                            <Combobox options={YEARS} value={tahun} onChange={setTahun} placeholder="Tahun..." />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grup Berdasarkan</Label>
                            <Combobox
                                options={[
                                    { value: "kategori", label: "Kategori" },
                                    { value: "perusahaan", label: "Perusahaan" },
                                    { value: "metode_pembayaran", label: "Metode Pembayaran" },
                                ]}
                                value={grupBy}
                                onChange={v => setGrupBy(v as any)}
                                placeholder="Grup..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Perusahaan</Label>
                            <Combobox options={companyOptions} value={companyGroupId} onChange={setCompanyGroupId} placeholder="Semua..." />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kategori</Label>
                            <Combobox options={categoryOptions} value={categoryId} onChange={setCategoryId} placeholder="Semua..." />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status PO</Label>
                            <Combobox options={STATUS_OPTIONS} value={status} onChange={setStatus} placeholder="Status..." />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleGenerate} disabled={pending} className="gap-2">
                            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                            {pending ? "Memuat..." : "Tampilkan Laporan"}
                        </Button>
                        {result && result.totalPO > 0 && (
                            <Button variant="outline" className="gap-2"
                                onClick={() => window.open(buildPrintUrl(), "_blank")}>
                                <Printer className="w-4 h-4" />
                                Print / Ekspor PDF
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {result === null && !pending && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                    <FileText className="w-12 h-12 opacity-30" />
                    <p className="text-sm">Pilih filter di atas lalu klik <strong>"Tampilkan Laporan"</strong></p>
                </div>
            )}

            {result !== null && result.totalPO === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                    <FileText className="w-10 h-10 opacity-30" />
                    <p className="text-sm">Tidak ada PO ditemukan untuk filter yang dipilih.</p>
                </div>
            )}

            {result !== null && result.totalPO > 0 && (
                <div className="space-y-4">
                    {/* Summary strip */}
                    <div className="flex items-center gap-6 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                        <div>
                            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Periode</p>
                            <p className="font-semibold text-slate-800">{monthLabel} {tahun}</p>
                        </div>
                        <div className="w-px h-8 bg-blue-200" />
                        <div>
                            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Total PO</p>
                            <p className="font-semibold text-slate-800">{result.totalPO} PO</p>
                        </div>
                        <div className="w-px h-8 bg-blue-200" />
                        <div>
                            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Grand Total</p>
                            <p className="font-bold text-green-700 text-lg">{fmt(result.grandTotal)}</p>
                        </div>
                    </div>

                    {/* Grouped Tables */}
                    {result.groups.map((group, gi) => (
                        <div key={gi} className="rounded-lg border overflow-hidden bg-white shadow-sm">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-700 text-white">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        {grupBy === "kategori" ? "Kategori" : "Perusahaan"}
                                    </span>
                                    <span className="font-bold text-sm">{group.label}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-300 mr-2">{group.items.length} PO</span>
                                    <span className="font-bold text-green-300 text-sm">{fmt(group.subtotal)}</span>
                                </div>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500 w-8">No</th>
                                        <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500">No. PO</th>
                                        <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500">Tanggal</th>
                                        {grupBy === "kategori" && (
                                            <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500">Perusahaan</th>
                                        )}
                                        {grupBy === "perusahaan" && (
                                            <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500">Kategori</th>
                                        )}
                                        {grupBy === "metode_pembayaran" && (
                                            <>
                                                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500">Perusahaan</th>
                                                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500">Kategori</th>
                                            </>
                                        )}
                                        <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500">Proyek</th>
                                        <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500">Supplier</th>
                                        <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500">Status</th>
                                        <th className="py-2 px-3 text-right text-xs font-semibold text-slate-500">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.items.map((po, idx) => (
                                        <tr key={po.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                                            <td className="py-2 px-3 text-slate-400 text-xs">{idx + 1}</td>
                                            <td className="py-2 px-3 font-mono text-xs font-semibold text-slate-800">{po.po_number}</td>
                                            <td className="py-2 px-3 text-xs text-slate-600">{fmtDate(po.tanggal_terbit)}</td>
                                            {grupBy === "kategori" && (
                                                <td className="py-2 px-3 text-xs text-slate-700">{po.perusahaan_nama}</td>
                                            )}
                                            {grupBy === "perusahaan" && (
                                                <td className="py-2 px-3 text-xs">
                                                    <span className="inline-flex items-center rounded bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                                                        {po.kategori_nama}
                                                    </span>
                                                </td>
                                            )}
                                            {grupBy === "metode_pembayaran" && (
                                                <>
                                                    <td className="py-2 px-3 text-xs text-slate-700">{po.perusahaan_nama}</td>
                                                    <td className="py-2 px-3 text-xs">
                                                        <span className="inline-flex items-center rounded bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700">{po.kategori_nama}</span>
                                                    </td>
                                                </>
                                            )}
                                            <td className="py-2 px-3 text-xs text-slate-500 italic">{(po as any).proyek_nama || "-"}</td>
                                            <td className="py-2 px-3 text-xs text-slate-700">{po.supplier_nama}</td>
                                            <td className="py-2 px-3 text-xs text-slate-600">{po.metode_pembayaran}</td>
                                            <td className="py-2 px-3">
                                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${statusBadge[po.status] || statusBadge.DRAFT}`}>
                                                    {po.status === "APPROVED" ? "Disetujui" : po.status === "CANCELLED" ? "Dibatalkan" : "Draft"}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-right text-xs font-semibold text-green-700">
                                                {fmt(po.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100 border-t border-slate-200">
                                        <td colSpan={grupBy === "kategori" ? 7 : 7} className="py-2 px-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wide">
                                            Subtotal {group.label}
                                        </td>
                                        <td className="py-2 px-3 text-right text-sm font-bold text-green-700">
                                            {fmt(group.subtotal)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ))}

                    {/* Grand Total */}
                    <div className="flex justify-end">
                        <div className="bg-slate-800 text-white rounded-lg px-6 py-3 flex items-center gap-8">
                            <span className="text-sm font-semibold uppercase tracking-wide">Grand Total ({result.totalPO} PO)</span>
                            <span className="text-xl font-bold text-green-300">{fmt(result.grandTotal)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
