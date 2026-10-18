"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatNumber } from "../../utils/crusher-helpers"
import type { MachineDayRow, MachineHistoryRow } from "../types"
import { formatDayShort, formatMonthLabel } from "../utils/mesin-date"

type Props = {
    month: string
    today: string
    rows: MachineDayRow[]
    selectedDate: string
    isLoading: boolean
    onSelectDate: (date: string) => void
    onChangeMonth: (delta: number) => void
}

function weatherLabel(r: MachineHistoryRow): string {
    if (r.rain_from && r.rain_to) return `Hujan ${r.rain_from}–${r.rain_to}`
    if (r.sunny_from && r.sunny_to) return `Cerah ${r.sunny_from}–${r.sunny_to}`
    return "-"
}

const STATUS_STYLE: Record<MachineHistoryRow["status"], { label: string; cls: string }> = {
    DRAFT: { label: "Tercatat", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    SUBMITTED: { label: "Tercatat", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    APPROVED: { label: "Disetujui", cls: "bg-blue-50 text-blue-700 border-blue-200" },
}

export function MachineHistoryTable({ month, today, rows, selectedDate, isLoading, onSelectDate, onChangeMonth }: Props) {
    const isCurrentMonth = month >= today.slice(0, 7)

    return (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Daftar Kerja Harian</h2>
                    <p className="text-xs text-slate-500">Klik baris untuk membuka / mengisi data tanggal tersebut</p>
                </div>
                <div className="flex items-center gap-1">
                    <Button id="history-prev-month" type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onChangeMonth(-1)} aria-label="Bulan sebelumnya">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[130px] text-center text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize">
                        {formatMonthLabel(month)}
                    </span>
                    <Button id="history-next-month" type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onChangeMonth(1)} disabled={isCurrentMonth} aria-label="Bulan berikutnya">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                        <TableRow>
                            <TableHead className="text-xs">Tanggal</TableHead>
                            <TableHead className="text-xs text-right">HM Awal</TableHead>
                            <TableHead className="text-xs text-right">HM Akhir</TableHead>
                            <TableHead className="text-xs text-right">Jam Kerja</TableHead>
                            <TableHead className="text-xs text-right">Downtime</TableHead>
                            <TableHead className="text-xs">Cuaca</TableHead>
                            <TableHead className="text-xs">Keterangan</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={8}><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-xs text-slate-500 py-8">
                                    Tidak ada hari pada periode ini.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map(({ date, record }) => {
                                const isSelected = date === selectedDate
                                return (
                                    <TableRow
                                        key={date}
                                        onClick={() => onSelectDate(date)}
                                        data-state={isSelected ? "selected" : undefined}
                                        className={`cursor-pointer text-xs ${isSelected ? "bg-blue-50 hover:bg-blue-50 dark:bg-blue-950/40" : ""}`}
                                    >
                                        <TableCell className={`whitespace-nowrap font-medium capitalize ${isSelected ? "text-blue-700 border-l-2 border-blue-600" : "text-slate-800 dark:text-slate-200"}`}>
                                            {formatDayShort(date)}
                                            {date === today && <span className="ml-1.5 text-[10px] text-blue-600 font-semibold">(Hari ini)</span>}
                                        </TableCell>
                                        {record ? (
                                            <>
                                                <TableCell className="text-right tabular-nums">{formatNumber(record.hm_start)}</TableCell>
                                                <TableCell className="text-right tabular-nums">{formatNumber(record.hm_end)}</TableCell>
                                                <TableCell className="text-right tabular-nums font-bold text-blue-700">{formatNumber(record.total_hm)} j</TableCell>
                                                <TableCell className={`text-right tabular-nums ${record.downtime_hours > 0 ? "text-rose-700 font-semibold" : "text-slate-400"}`}>
                                                    {record.downtime_hours > 0 ? `${formatNumber(record.downtime_hours)} j (${record.downtime_count}x)` : "-"}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-slate-600">{weatherLabel(record)}</TableCell>
                                                <TableCell className="max-w-[220px] truncate text-slate-600" title={record.hm_notes ?? ""}>
                                                    {record.hm_notes || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS_STYLE[record.status].cls}`}>
                                                        {STATUS_STYLE[record.status].label}
                                                    </span>
                                                </TableCell>
                                            </>
                                        ) : (
                                            <TableCell colSpan={7} className="text-slate-400 italic">
                                                Belum diisi — klik untuk mencatat
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </section>
    )
}
