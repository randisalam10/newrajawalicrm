"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Gauge, AlertTriangle, Info, CheckCircle2 } from "lucide-react"

interface FuelMeterSectionProps {
    meterType: "KM" | "HM"
    currentMeter: string
    onCurrentMeterChange: (val: string) => void
    lastMeter: number | null
    lastMeterSource: string
    lastMeterDate?: string | null
    hasSelectedVehicle: boolean
    isBackdateMeter: boolean
    isSpikeMeter: boolean
    meterDiff: number | null
    currentMeterVal: number | null
}

export function FuelMeterSection({
    meterType,
    currentMeter,
    onCurrentMeterChange,
    lastMeter,
    lastMeterSource,
    lastMeterDate,
    hasSelectedVehicle,
    isBackdateMeter,
    isSpikeMeter,
    meterDiff,
    currentMeterVal,
}: FuelMeterSectionProps) {
    const isHM = meterType === "HM"
    const hasHistory = lastMeter !== null && lastMeter > 0

    return (
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 space-y-2">
            {/* Header Status Meter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Gauge className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{isHM ? "HM (Hour Meter) Saat Pengisian *" : "KM Odometer Saat Pengisian *"}</span>
                </div>

                {!hasSelectedVehicle ? (
                    <span className="text-[10px] text-slate-400 italic">
                        Pilih unit di atas untuk cek meter terakhir
                    </span>
                ) : hasHistory ? (
                    <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
                        <Badge
                            variant="outline"
                            className="text-[11px] font-mono px-2 py-0.5 border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold"
                        >
                            Meter Terakhir: <b className="ml-1 font-bold">{lastMeter.toLocaleString("id-ID")} {meterType}</b>
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-medium">
                            ({lastMeterSource}{lastMeterDate ? ` • ${lastMeterDate}` : ""})
                        </span>
                    </div>
                ) : (
                    <Badge
                        variant="outline"
                        className="text-[11px] px-2 py-0.5 border-slate-300 bg-white dark:bg-slate-900 text-slate-600 font-normal self-start sm:self-auto"
                    >
                        Belum ada riwayat (Meter Awal)
                    </Badge>
                )}
            </div>

            {/* Input Odometer */}
            <div className="space-y-1.5">
                <div className="relative">
                    <Input
                        type="number"
                        step={isHM ? "0.1" : "1"}
                        inputMode="decimal"
                        placeholder={
                            hasSelectedVehicle
                                ? `Ketik angka ${meterType} saat isi${hasHistory ? ` (Terakhir: ${lastMeter})` : ""}`
                                : "Pilih armada di atas terlebih dahulu..."
                        }
                        value={currentMeter}
                        onChange={(e) => onCurrentMeterChange(e.target.value)}
                        className={`h-9 text-xs bg-white dark:bg-slate-900 font-mono font-bold pr-14 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            isBackdateMeter ? "border-amber-500 text-amber-700 focus-visible:ring-amber-400" : ""
                        }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-xs">
                        {meterType}
                    </div>
                </div>

                {/* Status Kalkulasi Selisih */}
                {hasSelectedVehicle && hasHistory && meterDiff !== null && meterDiff >= 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 inline-flex">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>+{meterDiff.toLocaleString("id-ID")} {isHM ? "Jam" : "KM"} sejak isi sebelumnya ({lastMeterSource})</span>
                    </div>
                )}

                {hasSelectedVehicle && !hasHistory && (
                    <p className="text-[10px] text-slate-500">
                        Unit ini belum memiliki riwayat kilometer di RBL maupun BBM. Angka yang Anda masukkan akan menjadi meter acuan awal.
                    </p>
                )}
            </div>

            {/* Alert Mundur / Backdate */}
            {isBackdateMeter && (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                        <b>Perhatian:</b> Angka {meterType} saat ini ({currentMeterVal}) lebih kecil dari meter terakhir ({lastMeter} dari {lastMeterSource}). Pastikan urutan pengisian atau angka odometer sudah tepat.
                    </span>
                </div>
            )}

            {/* Alert Lonjakan */}
            {isSpikeMeter && (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                        <b>Perhatian Lonjakan:</b> Selisih <b>+{meterDiff} {isHM ? "Jam" : "KM"}</b> cukup tinggi. Pastikan angka tidak salah ketik digit.
                    </span>
                </div>
            )}
        </div>
    )
}
