"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { addCrusherDowntime, deleteCrusherDowntime } from "../../actions"
import { calculateDowntimeHours } from "../../utils/crusher-helpers"
import type { DowntimeForm } from "../types"
import { timeToMinutes } from "../utils/mesin-date"

const EMPTY: DowntimeForm = { start: "", end: "", desc: "", action: "" }

type Params = {
    reportId: string | null
    selectedDate: string
    locationId?: string
    onChanged: () => void
}

export function useDowntime({ reportId, selectedDate, locationId, onChanged }: Params) {
    const [form, setForm] = useState<DowntimeForm>(EMPTY)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isSaving, startSave] = useTransition()
    const [isDeleting, startDelete] = useTransition()

    // Bersihkan input saat pindah tanggal
    useEffect(() => {
        setForm(EMPTY)
    }, [selectedDate])

    const totalHours = calculateDowntimeHours(form.start, form.end)

    const setField = (key: keyof DowntimeForm, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }))

    const add = () => {
        const reportTarget = reportId || { date: selectedDate, locationId }
        if (!form.start || !form.end || !form.desc.trim()) {
            toast.error("Jam rusak, jam selesai, dan indikasi kerusakan wajib diisi")
            return
        }
        const a = timeToMinutes(form.start)
        const b = timeToMinutes(form.end)
        if (a === null || b === null || b <= a) {
            toast.error("Jam selesai harus setelah jam rusak")
            return
        }

        startSave(async () => {
            try {
                await addCrusherDowntime(reportTarget, {
                    start_time: form.start,
                    end_time: form.end,
                    total_hours: totalHours,
                    problem_desc: form.desc.trim(),
                    action_taken: form.action.trim(),
                })
                toast.success("Catatan kerusakan ditambahkan")
                setForm(EMPTY)
                onChanged()
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal menambah downtime")
            }
        })
    }

    const confirmDelete = () => {
        if (!deleteId) return
        const id = deleteId
        startDelete(async () => {
            try {
                await deleteCrusherDowntime(id)
                toast.success("Catatan kerusakan dihapus")
                setDeleteId(null)
                onChanged()
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal menghapus downtime")
            }
        })
    }

    return {
        form,
        setField,
        totalHours,
        isSaving,
        isDeleting,
        add,
        deleteId,
        setDeleteId,
        confirmDelete,
    }
}
