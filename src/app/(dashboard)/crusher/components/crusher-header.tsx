"use client"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatNumber } from "../utils/crusher-helpers"
import { CrusherDailyReportData } from "../types"
import { Calendar, Fuel, Layers, Mountain, Clock, Settings2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

type Props = {
    selectedDate: string
    onDateChange: (date: string) => void
    report: CrusherDailyReportData | null
    locationName: string
    onOpenSourceMaster: () => void
    locations?: { id: string; name: string }[]
    selectedLocationId?: string
    onLocationChange?: (locationId: string) => void
}

export function CrusherHeader({
    selectedDate,
    onDateChange,
    report,
    locationName,
    onOpenSourceMaster,
    locations,
    selectedLocationId,
    onLocationChange,
}: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleLocationSelect = (locId: string) => {
        if (onLocationChange) {
            onLocationChange(locId)
            return
        }
        const params = new URLSearchParams(searchParams?.toString() || "")
        params.set("locationId", locId)
        router.push(`${pathname}?${params.toString()}`)
    }

    const totalHm = report?.total_hm ?? 0
    const totalSolar = report?.fuelLogs.reduce((acc, f) => acc + (f.liters ?? 0), 0) ?? 0
    const totalRitase = report?.materialsIn.reduce((acc, m) => acc + (m.ritase ?? 0), 0) ?? 0
    const totalVolumeOut = report?.materialsOut.reduce((acc, o) => acc + (o.volume_m3 ?? 0), 0) ?? 0

    const isSubmitted = report?.status === "SUBMITTED"
    const isApproved = report?.status === "APPROVED"

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-3 md:p-4 shadow-sm space-y-3 w-full">
            {/* Top Bar: Title, Location, Master Source Button */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                        <Mountain className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-base md:text-lg font-bold text-slate-900 leading-tight">
                                Stone Crusher
                            </h1>
                            {locations && locations.length > 1 ? (
                                <div className="inline-flex items-center">
                                    <select
                                        value={selectedLocationId || ""}
                                        onChange={(e) => handleLocationSelect(e.target.value)}
                                        className="h-6 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-full px-2 py-0 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        aria-label="Pilih Stone Crusher"
                                    >
                                        {locations.map((loc) => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : locationName ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                                    {locationName}
                                </span>
                            ) : null}
                        </div>
                        <p className="text-xs text-slate-500">Laporan harian & monitoring produksi quarry</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isApproved ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Disetujui</Badge>
                    ) : isSubmitted ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200">Terkirim</Badge>
                    ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200">Draft</Badge>
                    )}

                    <Link href={`/crusher/po${selectedLocationId ? `?locationId=${selectedLocationId}` : ''}`}>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 gap-1.5 text-slate-600 hover:text-slate-900 border-slate-300"
                        >
                            <ShoppingCart className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">PO Crusher</span>
                        </Button>
                    </Link>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onOpenSourceMaster}
                        className="text-xs h-8 gap-1.5 text-slate-600 hover:text-slate-900"
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Master Sumber</span>
                    </Button>
                </div>
            </div>

            {/* Date Picker Mobile-Friendly */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-xs font-medium text-slate-600 shrink-0">Tanggal:</span>
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="h-8 text-xs bg-white border-slate-300 font-semibold max-w-[170px]"
                />
            </div>

            {/* Quick Metrics Bar (Touch-friendly cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Jam Mesin</div>
                        <div className="text-sm font-bold text-slate-900 truncate">{formatNumber(totalHm)} Jam</div>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex items-center gap-2.5">
                    <Fuel className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Solar Terisi</div>
                        <div className="text-sm font-bold text-slate-900 truncate">{formatNumber(totalSolar, 0)} L</div>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex items-center gap-2.5">
                    <Layers className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Batu Masuk</div>
                        <div className="text-sm font-bold text-slate-900 truncate">{totalRitase} Rit</div>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex items-center gap-2.5">
                    <Mountain className="h-4 w-4 text-rose-600 shrink-0" />
                    <div className="min-w-0">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Batu Keluar</div>
                        <div className="text-sm font-bold text-slate-900 truncate">{formatNumber(totalVolumeOut)} m³</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
