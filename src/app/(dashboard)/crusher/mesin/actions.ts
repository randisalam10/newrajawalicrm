"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import type { MachineHistoryRow, PreviousHm, ReportStatus } from "./types"
import { monthRange, toMiddayUtc } from "./utils/mesin-date"

/** Riwayat jam mesin per bulan (YYYY-MM) untuk satu lokasi */
export async function getCrusherMachineHistory(month: string, locationId: string): Promise<MachineHistoryRow[]> {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    if (!locationId || !/^\d{4}-\d{2}$/.test(month)) return []

    const { start, end } = monthRange(month)

    const reports = await prisma.crusherDailyReport.findMany({
        where: { locationId, date: { gte: start, lt: end } },
        orderBy: { date: "desc" },
        select: {
            id: true,
            date: true,
            hm_start: true,
            hm_end: true,
            total_hm: true,
            hm_notes: true,
            sunny_from: true,
            sunny_to: true,
            rain_from: true,
            rain_to: true,
            status: true,
            downtimes: { select: { total_hours: true } },
        },
    })

    return reports.map((r) => ({
        reportId: r.id,
        date: r.date.toISOString().slice(0, 10),
        hm_start: r.hm_start ?? 0,
        hm_end: r.hm_end ?? 0,
        total_hm: r.total_hm ?? 0,
        downtime_count: r.downtimes.length,
        downtime_hours: Math.round(r.downtimes.reduce((s, d) => s + (d.total_hours ?? 0), 0) * 10) / 10,
        sunny_from: r.sunny_from,
        sunny_to: r.sunny_to,
        rain_from: r.rain_from,
        rain_to: r.rain_to,
        hm_notes: r.hm_notes,
        status: ((r.status as ReportStatus) ?? "DRAFT"),
    }))
}

/** HM akhir terakhir sebelum tanggal terpilih (untuk saran HM awal) */
export async function getPreviousCrusherHm(dateStr: string, locationId: string): Promise<PreviousHm> {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    if (!locationId || !dateStr) return null

    const prev = await prisma.crusherDailyReport.findFirst({
        where: { locationId, date: { lt: toMiddayUtc(dateStr) } },
        orderBy: { date: "desc" },
        select: { date: true, hm_end: true },
    })

    if (!prev) return null
    return { date: prev.date.toISOString().slice(0, 10), hm_end: prev.hm_end ?? 0 }
}
