"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import type { CrusherDailyReportData } from "../../types"
import { upsertCrusherHeader } from "../../actions"
import { calculateHmDifference } from "../../utils/crusher-helpers"
import type { MachineHeaderForm } from "../types"
import { parseDecimal, timeToMinutes } from "../utils/mesin-date"

const DEFAULT_SUNNY_FROM = "08:00"
const DEFAULT_SUNNY_TO = "17:00"

function formFromReport(report: CrusherDailyReportData | null): MachineHeaderForm {
    return {
        hmStart: report ? String(report.hm_start ?? "") : "",
        hmEnd: report ? String(report.hm_end ?? "") : "",
        hmNotes: report?.hm_notes ?? "",
        sunnyFrom: report ? (report.sunny_from ?? "") : DEFAULT_SUNNY_FROM,
        sunnyTo: report ? (report.sunny_to ?? "") : DEFAULT_SUNNY_TO,
        rainFrom: report?.rain_from ?? "",
        rainTo: report?.rain_to ?? "",
    }
}

function validate(form: MachineHeaderForm): string | null {
    const startVal = form.hmStart !== "" ? parseDecimal(form.hmStart) : 0
    const endVal = form.hmEnd !== "" ? parseDecimal(form.hmEnd) : 0
    if (endVal < startVal) return "HM Akhir tidak boleh lebih kecil dari HM Awal"

    const pairs: [string, string, string][] = [
        [form.sunnyFrom, form.sunnyTo, "cerah"],
        [form.rainFrom, form.rainTo, "hujan"],
    ]
    for (const [from, to, label] of pairs) {
        if (Boolean(from) !== Boolean(to)) return `Lengkapi jam ${label} (dari & sampai)`
        const a = timeToMinutes(from)
        const b = timeToMinutes(to)
        if (a !== null && b !== null && b <= a) return `Jam ${label} selesai harus setelah jam mulai`
    }
    return null
}

type Params = {
    report: CrusherDailyReportData | null
    selectedDate: string
    locationId: string
    onSaved: () => void
}

export function useMachineForm({ report, selectedDate, locationId, onSaved }: Params) {
    const [form, setForm] = useState<MachineHeaderForm>(() => formFromReport(report))
    const [isSaving, startSave] = useTransition()

    // Sinkronkan form setiap kali data tanggal berubah / selesai disimpan
    useEffect(() => {
        setForm(formFromReport(report))
    }, [report, selectedDate])

    const baseline = useMemo(() => formFromReport(report), [report])
    const isDirty = useMemo(
        () => (Object.keys(form) as (keyof MachineHeaderForm)[]).some((k) => form[k] !== baseline[k]),
        [form, baseline],
    )

    const totalHm = calculateHmDifference(parseDecimal(form.hmStart), parseDecimal(form.hmEnd))
    const hmInvalid = form.hmStart !== "" && form.hmEnd !== "" && parseDecimal(form.hmEnd) < parseDecimal(form.hmStart)

    const setField = (key: keyof MachineHeaderForm, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }))

    const resetForm = () => setForm(baseline)

    const save = () => {
        if (!locationId) {
            toast.error("Lokasi stone crusher belum dipilih")
            return
        }
        const error = validate(form)
        if (error) {
            toast.error(error)
            return
        }

        startSave(async () => {
            try {
                await upsertCrusherHeader({
                    date: selectedDate,
                    locationId,
                    hm_start: parseDecimal(form.hmStart),
                    hm_end: parseDecimal(form.hmEnd),
                    total_hm: totalHm,
                    hm_notes: form.hmNotes.trim(),
                    sunny_from: form.sunnyFrom,
                    sunny_to: form.sunnyTo,
                    rain_from: form.rainFrom,
                    rain_to: form.rainTo,
                    // Kolom weather_notes dipertahankan agar tidak terhapus
                    weather_notes: report?.weather_notes ?? "",
                })
                toast.success(report ? "Jam mesin diperbarui" : "Jam mesin berhasil disimpan")
                onSaved()
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal menyimpan jam mesin")
            }
        })
    }

    return { form, setField, totalHm, hmInvalid, isDirty, isSaving, save, resetForm }
}
