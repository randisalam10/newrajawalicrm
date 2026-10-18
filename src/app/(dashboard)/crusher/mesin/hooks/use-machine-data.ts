"use client"

import { useCallback, useMemo, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import type { CrusherDailyReportData } from "../../types"
import { getCrusherDailyReport } from "../../actions"
import { getCrusherMachineHistory, getPreviousCrusherHm } from "../actions"
import type { MachineHistoryRow, PreviousHm } from "../types"
import { shiftDateStr, shiftMonthStr, todayJakarta } from "../utils/mesin-date"
import { buildMonthDays, summarizeMonth } from "../utils/mesin-summary"

type Params = {
    initialReport: CrusherDailyReportData | null
    initialHistory: MachineHistoryRow[]
    initialPrevHm: PreviousHm
    initialDate: string
    locationId: string
}

/** Orkestrasi data harian + riwayat bulanan Jam Mesin */
export function useMachineData({ initialReport, initialHistory, initialPrevHm, initialDate, locationId }: Params) {
    const [selectedDate, setSelectedDate] = useState(initialDate)
    const [report, setReport] = useState<CrusherDailyReportData | null>(initialReport)
    const [prevHm, setPrevHm] = useState<PreviousHm>(initialPrevHm)
    const [historyMonth, setHistoryMonth] = useState(initialDate.slice(0, 7))
    const [history, setHistory] = useState<MachineHistoryRow[]>(initialHistory)

    const [isLoadingDay, startDayTransition] = useTransition()
    const [isLoadingHistory, startHistoryTransition] = useTransition()

    // Mencegah race condition saat user berpindah tanggal dengan cepat
    const dayReqRef = useRef(0)
    const historyReqRef = useRef(0)

    const today = todayJakarta()

    const loadDay = useCallback((date: string) => {
        const reqId = ++dayReqRef.current
        startDayTransition(async () => {
            try {
                const [r, p] = await Promise.all([
                    getCrusherDailyReport(date, locationId),
                    getPreviousCrusherHm(date, locationId),
                ])
                if (reqId !== dayReqRef.current) return
                setReport(r)
                setPrevHm(p)
            } catch (err) {
                console.error("Gagal memuat jam mesin", err)
                toast.error("Gagal memuat data tanggal ini")
            }
        })
    }, [locationId])

    const loadHistory = useCallback((month: string) => {
        const reqId = ++historyReqRef.current
        startHistoryTransition(async () => {
            try {
                const rows = await getCrusherMachineHistory(month, locationId)
                if (reqId !== historyReqRef.current) return
                setHistory(rows)
            } catch (err) {
                console.error("Gagal memuat riwayat jam mesin", err)
                toast.error("Gagal memuat riwayat jam mesin")
            }
        })
    }, [locationId])

    const changeDate = useCallback((date: string) => {
        if (!date) return
        setSelectedDate(date)
        loadDay(date)
        const month = date.slice(0, 7)
        if (month !== historyMonth) {
            setHistoryMonth(month)
            loadHistory(month)
        }
    }, [historyMonth, loadDay, loadHistory])

    const shiftDate = useCallback((days: number) => {
        const next = shiftDateStr(selectedDate, days)
        if (next > today) return
        changeDate(next)
    }, [selectedDate, today, changeDate])

    const changeMonth = useCallback((delta: number) => {
        const month = shiftMonthStr(historyMonth, delta)
        if (month > today.slice(0, 7)) return
        setHistoryMonth(month)
        loadHistory(month)
    }, [historyMonth, today, loadHistory])

    /** Dipanggil setelah simpan/hapus agar form & daftar riwayat sinkron */
    const refresh = useCallback(() => {
        loadDay(selectedDate)
        loadHistory(historyMonth)
    }, [selectedDate, historyMonth, loadDay, loadHistory])

    const dayRows = useMemo(() => buildMonthDays(historyMonth, history, today), [historyMonth, history, today])
    const summary = useMemo(() => summarizeMonth(history, dayRows.length), [history, dayRows.length])

    return {
        today,
        selectedDate,
        report,
        prevHm,
        historyMonth,
        dayRows,
        summary,
        isLoadingDay,
        isLoadingHistory,
        changeDate,
        shiftDate,
        changeMonth,
        refresh,
    }
}
