"use client"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Mountain, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

type Props = {
    title: string
    subtitle: string
    selectedDate: string
    onDateChange?: (date: string) => void
    locationName: string
    status?: "DRAFT" | "SUBMITTED" | "APPROVED"
    backHref?: string
    locations?: { id: string; name: string }[]
    selectedLocationId?: string
    onLocationChange?: (locationId: string) => void
}

export function CrusherPageHeader({
    title,
    subtitle,
    selectedDate,
    onDateChange,
    locationName,
    status,
    backHref = "/crusher",
    locations,
    selectedLocationId,
    onLocationChange,
}: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleShift = (days: number) => {
        if (!onDateChange) return
        const d = new Date(`${selectedDate}T12:00:00.000Z`)
        d.setUTCDate(d.getUTCDate() + days)
        onDateChange(d.toISOString().slice(0, 10))
    }

    const handleLocationSelect = (locId: string) => {
        if (onLocationChange) {
            onLocationChange(locId)
            return
        }
        const params = new URLSearchParams(searchParams?.toString() || "")
        params.set("locationId", locId)
        router.push(`${pathname}?${params.toString()}`)
    }

    const todayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date())

    const isToday = selectedDate === todayStr

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm space-y-2.5 sm:space-y-3 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {backHref && (
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
                            <Link href={backHref}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                    <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-700">
                        <Mountain className="h-4 sm:h-5 w-4 sm:w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-tight">
                                {title}
                            </h1>
                            {locations && locations.length > 1 ? (
                                <div className="inline-flex items-center">
                                    <select
                                        value={selectedLocationId || ""}
                                        onChange={(e) => handleLocationSelect(e.target.value)}
                                        className="h-6 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-full px-2 py-0 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                                    {locationName}
                                </span>
                            ) : null}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">{subtitle}</p>
                    </div>
                </div>

                {status && (
                    <div>
                        {status === "APPROVED" ? (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Disetujui</Badge>
                        ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Tercatat</Badge>
                        )}
                    </div>
                )}
            </div>

            {onDateChange && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-1.5 sm:p-2 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white"
                            onClick={() => handleShift(-1)}
                            aria-label="Hari sebelumnya"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-md px-2 h-8">
                            <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => onDateChange(e.target.value)}
                                className="h-7 text-xs border-0 p-0 font-semibold w-[125px] sm:w-[135px] focus-visible:ring-0 shadow-none"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white"
                            onClick={() => handleShift(1)}
                            aria-label="Hari berikutnya"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {!isToday && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onDateChange(todayStr)}
                            className="h-7 text-[11px] font-semibold text-emerald-700 px-2"
                        >
                            Hari Ini
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
