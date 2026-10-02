"use client"

import React, { useState, useTransition, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CalendarClock } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { createPlan, updatePlan } from "../actions"
import { Masters, Plan } from "../types"

interface PlanFormDialogProps {
    open: boolean
    onClose: () => void
    masters: Masters
    editData?: Plan | null
    defaultDate?: string
}

export function PlanFormDialog({
    open,
    onClose,
    masters,
    editData,
    defaultDate,
}: PlanFormDialogProps) {
    const { toast } = useToast()
    const [isPending, startTransition] = useTransition()

    const [form, setForm] = useState({
        date: editData?.date
            ? format(new Date(editData.date), "yyyy-MM-dd")
            : (defaultDate || format(new Date(), "yyyy-MM-dd")),
        projectId: editData?.projectId || "",
        qualityId: editData?.qualityId || "",
        workItemId: editData?.workItemId || "",
        volume_plan: editData?.volume_plan?.toString() || "",
        notes: editData?.notes || "",
    })

    useEffect(() => {
        setForm({
            date: editData?.date
                ? format(new Date(editData.date), "yyyy-MM-dd")
                : (defaultDate || format(new Date(), "yyyy-MM-dd")),
            projectId: editData?.projectId || "",
            qualityId: editData?.qualityId || "",
            workItemId: editData?.workItemId || "",
            volume_plan: editData?.volume_plan?.toString() || "",
            notes: editData?.notes || "",
        })
    }, [editData, defaultDate])

    const isEdit = !!editData

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.projectId || !form.qualityId || !form.workItemId || !form.date || !form.volume_plan) {
            toast({ title: "Lengkapi semua field wajib", variant: "destructive" })
            return
        }
        startTransition(async () => {
            try {
                const payload = {
                    date: form.date,
                    projectId: form.projectId,
                    qualityId: form.qualityId,
                    workItemId: form.workItemId,
                    volume_plan: parseFloat(form.volume_plan),
                    notes: form.notes,
                }
                if (isEdit && editData) {
                    await updatePlan(editData.id, payload)
                    toast({ title: "Planning berhasil diperbarui" })
                } else {
                    await createPlan(payload)
                    toast({ title: "Planning berhasil dibuat" })
                }
                onClose()
            } catch (err: any) {
                toast({ title: "Terjadi kesalahan", description: err?.message, variant: "destructive" })
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-primary" />
                        {isEdit ? "Edit Planning" : "Tambah Planning Pengecoran"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="plan-date">Tanggal Rencana <span className="text-red-500">*</span></Label>
                        <Input
                            id="plan-date"
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Proyek <span className="text-red-500">*</span></Label>
                        <Select value={form.projectId} onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}>
                            <SelectTrigger id="plan-project">
                                <SelectValue placeholder="Pilih proyek..." />
                            </SelectTrigger>
                            <SelectContent>
                                {masters?.projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <span className="font-medium">{p.name}</span>
                                        <span className="text-slate-400 ml-1.5 text-xs">— {p.customer.customer_name}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Mutu Beton <span className="text-red-500">*</span></Label>
                            <Select value={form.qualityId} onValueChange={(v) => setForm((f) => ({ ...f, qualityId: v }))}>
                                <SelectTrigger id="plan-quality"><SelectValue placeholder="Pilih mutu..." /></SelectTrigger>
                                <SelectContent>
                                    {masters?.qualities.map((q) => (
                                        <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Item Pekerjaan <span className="text-red-500">*</span></Label>
                            <Select value={form.workItemId} onValueChange={(v) => setForm((f) => ({ ...f, workItemId: v }))}>
                                <SelectTrigger id="plan-workitem"><SelectValue placeholder="Pilih item..." /></SelectTrigger>
                                <SelectContent>
                                    {masters?.workItems.map((w) => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="plan-volume">Volume Rencana (m³) <span className="text-red-500">*</span></Label>
                        <Input
                            id="plan-volume"
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="Contoh: 24.5"
                            value={form.volume_plan}
                            onChange={(e) => setForm((f) => ({ ...f, volume_plan: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="plan-notes">Catatan (opsional)</Label>
                        <Textarea
                            id="plan-notes"
                            rows={2}
                            placeholder="Informasi tambahan..."
                            value={form.notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Planning"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
