import type { CrusherDailyReportData } from "../types"

export type ReportStatus = CrusherDailyReportData["status"]

/** Ringkasan satu hari jam mesin untuk daftar riwayat */
export type MachineHistoryRow = {
    reportId: string
    date: string // YYYY-MM-DD
    hm_start: number
    hm_end: number
    total_hm: number
    downtime_count: number
    downtime_hours: number
    sunny_from: string | null
    sunny_to: string | null
    rain_from: string | null
    rain_to: string | null
    hm_notes: string | null
    status: ReportStatus
}

/** Satu baris kalender bulanan (bisa kosong jika belum diisi) */
export type MachineDayRow = {
    date: string
    record: MachineHistoryRow | null
}

export type MachineMonthSummary = {
    recordedDays: number
    expectedDays: number
    totalHm: number
    totalDowntime: number
    avgHm: number
    rainDays: number
}

/** HM akhir terakhir yang tercatat sebelum tanggal terpilih */
export type PreviousHm = {
    date: string
    hm_end: number
} | null

export type MachineHeaderForm = {
    hmStart: string
    hmEnd: string
    hmNotes: string
    sunnyFrom: string
    sunnyTo: string
    rainFrom: string
    rainTo: string
}

export type DowntimeForm = {
    start: string
    end: string
    desc: string
    action: string
}
