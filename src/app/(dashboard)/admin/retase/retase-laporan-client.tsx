"use client"

import React, { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { getTransactionReport } from "@/app/(dashboard)/admin/reports/retase/actions"
import { FileText, Printer, Loader2, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

type ReportRow = {
    id: string
    date: Date | string
    project?: { name?: string; customer?: { customer_name?: string } }
    concreteQuality?: { name?: string }
    volume_cubic?: number
    cumulative_volume?: number
    trip_sequence?: number
    driver?: { name?: string }
    vehicle?: { plate_number?: string; code?: string }
    retase?: { calculated_distance?: number; income_amount?: number } | null
    location?: { name?: string }
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")
const fmtDate = (d: Date | string) => format(new Date(d), "dd MMM yyyy HH:mm", { locale: idLocale })

export function RetaseLaporanClient({
    locations, customers, userRole
}: {
    locations: any[]
    customers: any[]
    userRole: string
}) {
    const now = new Date()
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    const today = now.toISOString().slice(0, 10)

    const [dateFrom, setDateFrom] = useState(firstOfMonth)
    const [dateTo, setDateTo] = useState(today)
    const [customerId, setCustomerId] = useState("")
    const [locationId, setLocationId] = useState("")
    const [rows, setRows] = useState<ReportRow[] | null>(null)
    const [pembuat, setPembuat] = useState("-")
    const [pending, startTransition] = useTransition()

    const locationOptions = [{ value: "", label: "Semua Cabang" }, ...locations.map((l: any) => ({ value: l.id, label: l.name }))]
    const customerOptions = [{ value: "", label: "Semua Customer" }, ...customers.map((c: any) => ({ value: c.id, label: c.name }))]

    function handleGenerate() {
        startTransition(async () => {
            const result = await getTransactionReport({
                dateFrom,
                dateTo,
                customerId: customerId || undefined,
                locationId: locationId || undefined,
            })
            setRows(result.rows)
            setPembuat(result.pembuat)
        })
    }

    function buildPrintUrl() {
        const params = new URLSearchParams({
            dateFrom, dateTo,
            ...(customerId && { customerId }),
            ...(locationId && { locationId }),
            pembuat,
        })
        return `/print/retase/laporan?${params.toString()}`
    }

    const totalVolume = rows?.reduce((acc, r) => acc + (r.volume_cubic || 0), 0) || 0
    const totalRetase = rows?.reduce((acc, r) => acc + (r.retase?.income_amount || 0), 0) || 0

    return (
        <div className="space-y-5 p-4">
            {/* Filter */}
            <Card className="shadow-sm border-blue-100">
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dari Tanggal</Label>
                            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sampai Tanggal</Label>
                            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</Label>
                            <Combobox options={customerOptions} value={customerId} onChange={setCustomerId} placeholder="Semua Customer..." />
                        </div>
                        {userRole === "SuperAdminBP" && (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cabang</Label>
                                <Combobox options={locationOptions} value={locationId} onChange={setLocationId} placeholder="Semua Cabang..." />
                            </div>
                        )}
                        <div className="self-end">
                            <Button onClick={handleGenerate} disabled={pending} className="w-full gap-2">
                                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                                {pending ? "Memuat..." : "Tampilkan"}
                            </Button>
                        </div>
                    </div>
                    {rows !== null && rows.length > 0 && (
                        <div className="mt-3 flex justify-end">
                            <Button variant="outline" size="sm" className="gap-2"
                                onClick={() => window.open(buildPrintUrl(), "_blank")}>
                                <Printer className="w-4 h-4" />Print / Ekspor PDF
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Empty state */}
            {rows === null && !pending && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                    <FileText className="w-12 h-12 opacity-30" />
                    <p className="text-sm">Pilih range tanggal lalu klik <strong>"Tampilkan"</strong></p>
                </div>
            )}

            {rows !== null && rows.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                    <FileText className="w-10 h-10 opacity-30" />
                    <p className="text-sm">Tidak ada transaksi ditemukan untuk periode ini.</p>
                </div>
            )}

            {rows !== null && rows.length > 0 && (
                <div className="space-y-3">
                    {/* Summary */}
                    <div className="flex items-center gap-6 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                        <div>
                            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Periode</p>
                            <p className="font-semibold text-slate-800">{dateFrom} s/d {dateTo}</p>
                        </div>
                        <div className="w-px h-8 bg-blue-200" />
                        <div>
                            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Jumlah Trip (SJ)</p>
                            <p className="font-semibold text-slate-800">{rows.length} SJ</p>
                        </div>
                        <div className="w-px h-8 bg-blue-200" />
                        <div>
                            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Total Volume</p>
                            <p className="font-semibold text-slate-800">{totalVolume.toFixed(2)} M³</p>
                        </div>
                        <div className="w-px h-8 bg-blue-200" />
                        <div>
                            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Total Retase</p>
                            <p className="font-bold text-green-700 text-lg">{fmt(totalRetase)}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-700 text-white">
                                <tr>
                                    <th className="py-2 px-3 text-left text-xs font-semibold w-8">No</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Tanggal</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Customer / Proyek</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Mutu</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Vol (M³)</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Sopir / Kend</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">KM</th>
                                    <th className="py-2 px-3 text-right text-xs font-semibold">Retase</th>
                                    {userRole === "SuperAdminBP" && <th className="py-2 px-3 text-left text-xs font-semibold">Cabang</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, idx) => (
                                    <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                                        <td className="py-2 px-3 text-slate-400 text-xs">{idx + 1}</td>
                                        <td className="py-2 px-3 text-xs text-slate-600">{fmtDate(r.date)}</td>
                                        <td className="py-2 px-3">
                                            <div className="text-xs font-semibold text-slate-800 uppercase">{r.project?.customer?.customer_name || "-"}</div>
                                            <div className="text-[11px] text-slate-500">{r.project?.name || ""}</div>
                                        </td>
                                        <td className="py-2 px-3 text-xs">{r.concreteQuality?.name || "-"}</td>
                                        <td className="py-2 px-3 text-xs font-semibold">{r.volume_cubic?.toFixed(2)}</td>
                                        <td className="py-2 px-3">
                                            <div className="text-xs font-medium">{r.driver?.name || "-"}</div>
                                            <div className="text-[11px] text-slate-500">{r.vehicle?.plate_number}</div>
                                        </td>
                                        <td className="py-2 px-3 text-xs text-slate-600">{r.retase?.calculated_distance ?? "-"}</td>
                                        <td className="py-2 px-3 text-right text-xs font-semibold text-green-700">
                                            {r.retase?.income_amount != null ? fmt(r.retase.income_amount) : "-"}
                                        </td>
                                        {userRole === "SuperAdminBP" && <td className="py-2 px-3 text-xs text-slate-600">{r.location?.name || "-"}</td>}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-700 text-white">
                                    <td colSpan={userRole === "SuperAdminBP" ? 4 : 3} className="py-2 px-3 text-xs font-bold text-right uppercase tracking-wide">
                                        Grand Total
                                    </td>
                                    <td className="py-2 px-3 text-xs font-bold">{totalVolume.toFixed(2)} M³</td>
                                    <td colSpan={2} />
                                    <td className="py-2 px-3 text-right text-sm font-bold text-green-300">{fmt(totalRetase)}</td>
                                    {userRole === "SuperAdminBP" && <td />}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
