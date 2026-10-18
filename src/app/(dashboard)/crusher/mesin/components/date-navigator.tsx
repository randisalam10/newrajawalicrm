"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { formatDayLong } from "../utils/mesin-date"

type Props = {
    selectedDate: string
    today: string
    hasRecord: boolean
    isLoading: boolean
    onChangeDate: (date: string) => void
    onShift: (days: number) => void
}

export function DateNavigator({ selectedDate, today, hasRecord, isLoading, onChangeDate, onShift }: Props) {
    const isToday = selectedDate === today

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
                <Button
                    id="mesin-prev-day"
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => onShift(-1)}
                    aria-label="Hari sebelumnya"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                    id="mesin-date-input"
                    type="date"
                    value={selectedDate}
                    max={today}
                    onChange={(e) => onChangeDate(e.target.value)}
                    className="h-9 w-[160px] text-sm font-semibold"
                />
                <Button
                    id="mesin-next-day"
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => onShift(1)}
                    disabled={isToday}
                    aria-label="Hari berikutnya"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                {!isToday && (
                    <Button
                        id="mesin-today"
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 text-xs font-semibold text-blue-700"
                        onClick={() => onChangeDate(today)}
                    >
                        Hari Ini
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize">
                    {formatDayLong(selectedDate)}
                </span>
                {isLoading ? (
                    <Badge variant="outline" className="gap-1 text-slate-600 bg-slate-50 border-slate-200">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Memuat
                    </Badge>
                ) : hasRecord ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Sudah Tercatat
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                        Belum Diisi
                    </Badge>
                )}
            </div>
        </div>
    )
}
