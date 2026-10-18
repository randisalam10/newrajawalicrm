import type { MachineDayRow, MachineHistoryRow, MachineMonthSummary } from "../types"
import { daysInMonth } from "./mesin-date"

/**
 * Bangun daftar hari dalam satu bulan (terbaru di atas).
 * Untuk bulan berjalan hanya sampai hari ini; bulan depan dikosongkan.
 */
export function buildMonthDays(month: string, history: MachineHistoryRow[], today: string): MachineDayRow[] {
    const todayMonth = today.slice(0, 7)
    if (month > todayMonth) return []

    const lastDay = month === todayMonth ? Number(today.slice(8, 10)) : daysInMonth(month)
    const byDate = new Map(history.map((h) => [h.date, h]))
    const rows: MachineDayRow[] = []

    for (let day = lastDay; day >= 1; day--) {
        const date = `${month}-${String(day).padStart(2, "0")}`
        rows.push({ date, record: byDate.get(date) ?? null })
    }
    return rows
}

export function summarizeMonth(history: MachineHistoryRow[], expectedDays: number): MachineMonthSummary {
    const totalHm = history.reduce((s, h) => s + (h.total_hm ?? 0), 0)
    const totalDowntime = history.reduce((s, h) => s + (h.downtime_hours ?? 0), 0)
    const rainDays = history.filter((h) => h.rain_from && h.rain_to).length
    const recordedDays = history.length

    return {
        recordedDays,
        expectedDays,
        totalHm: Math.round(totalHm * 10) / 10,
        totalDowntime: Math.round(totalDowntime * 10) / 10,
        avgHm: recordedDays > 0 ? Math.round((totalHm / recordedDays) * 10) / 10 : 0,
        rainDays,
    }
}
