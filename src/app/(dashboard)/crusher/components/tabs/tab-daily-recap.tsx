"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CrusherDailyReportData } from "../../types"
import { submitCrusherReport } from "../../actions"
import { formatNumber, formatRupiah, formatDateIndo } from "../../utils/crusher-helpers"
import { toast } from "sonner"
import { CheckCircle2, Clock, Fuel, Layers, Mountain, Send, Undo2, Loader2, AlertCircle } from "lucide-react"

type Props = {
    report: CrusherDailyReportData | null
    selectedDate: string
    onRefresh: () => void
}

export function TabDailyRecap({ report, selectedDate, onRefresh }: Props) {
    const [isPending, startTransition] = useTransition()

    if (!report) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                <div className="text-sm font-semibold">Belum Ada Aktivitas Terinput</div>
                <p className="text-xs text-slate-400">
                    Belum ada catatan aktivitas untuk tanggal {formatDateIndo(selectedDate)}. Anda dapat mulai mencatat jam kerja mesin, perbaikan, pengisian solar, maupun transaksi material.
                </p>
            </div>
        )
    }

    const totalHm = report.total_hm ?? 0
    const totalSolar = report.fuelLogs.reduce((acc, f) => acc + (f.liters ?? 0), 0)
    const totalRitase = report.materialsIn.reduce((acc, m) => acc + (m.ritase ?? 0), 0)
    const totalVolumeOut = report.materialsOut.reduce((acc, o) => acc + (o.volume_m3 ?? 0), 0)
    const totalPenjualanRupiah = report.materialsOut
        .filter((o) => o.destination_type === "PENJUALAN_BEBAS")
        .reduce((acc, o) => acc + (o.total_price ?? 0), 0)

    const isSubmitted = report.status === "SUBMITTED"

    const handleSubmit = (targetStatus: "SUBMITTED" | "DRAFT") => {
        startTransition(async () => {
            try {
                await submitCrusherReport(report.id, targetStatus)
                toast.success(
                    targetStatus === "SUBMITTED"
                        ? "Laporan harian berhasil dikirim!"
                        : "Laporan dikembalikan ke status Draft"
                )
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal mengubah status laporan")
            }
        })
    }

    return (
        <div className="space-y-4 w-full">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Rekapitulasi Laporan Harian</h2>
                        <p className="text-xs text-slate-500">{formatDateIndo(selectedDate)}</p>
                    </div>
                    {isSubmitted ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200">Terkirim</Badge>
                    ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200">Draft</Badge>
                    )}
                </div>

                {/* Grid Summary Cards */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 space-y-1">
                        <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-[11px]">
                            <Clock className="h-3.5 w-3.5" />
                            Jam Mesin Crusher
                        </div>
                        <div className="text-base font-bold text-blue-900">{formatNumber(totalHm)} Jam</div>
                        <div className="text-[10px] text-slate-500">
                            HM: {report.hm_start} s/d {report.hm_end}
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100 space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-[11px]">
                            <Fuel className="h-3.5 w-3.5" />
                            Total BBM Solar
                        </div>
                        <div className="text-base font-bold text-amber-900">{formatNumber(totalSolar, 0)} Liter</div>
                        <div className="text-[10px] text-slate-500">
                            {report.fuelLogs.length} Unit terisi
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                            <Layers className="h-3.5 w-3.5" />
                            Batu Mentah Masuk
                        </div>
                        <div className="text-base font-bold text-emerald-900">{totalRitase} Ret</div>
                        <div className="text-[10px] text-slate-500">
                            {report.materialsIn.length} Ritase truk
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-100 space-y-1">
                        <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-[11px]">
                            <Mountain className="h-3.5 w-3.5" />
                            Total Batu Keluar
                        </div>
                        <div className="text-base font-bold text-rose-900">{formatNumber(totalVolumeOut)} m³</div>
                        <div className="text-[10px] text-slate-500">
                            {report.materialsOut.length} Transaksi keluar
                        </div>
                    </div>
                </div>

                {/* Ringkasan Penjualan Komersial */}
                {totalPenjualanRupiah > 0 && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Total Penjualan Bebas:</span>
                        <span className="text-sm font-bold text-emerald-700">{formatRupiah(totalPenjualanRupiah)}</span>
                    </div>
                )}

                {/* Submit Action */}
                <div className="pt-2 border-t border-slate-100">
                    {!isSubmitted ? (
                        <Button
                            type="button"
                            onClick={() => handleSubmit("SUBMITTED")}
                            disabled={isPending}
                            className="w-full h-10 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Kirim Laporan Harian ke Manajemen
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span>Laporan harian sudah terkirim dan tercatat di sistem.</span>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSubmit("DRAFT")}
                                disabled={isPending}
                                className="w-full h-8 text-xs text-slate-600 gap-1.5"
                            >
                                <Undo2 className="h-3.5 w-3.5" />
                                Buka Kembali untuk Koreksi
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
