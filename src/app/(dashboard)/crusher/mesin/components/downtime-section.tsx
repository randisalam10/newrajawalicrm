"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Plus, Trash2 } from "lucide-react"
import type { CrusherDowntimeItem } from "../../types"
import { formatNumber } from "../../utils/crusher-helpers"
import type { useDowntime } from "../hooks/use-downtime"

type Props = {
    downtimes: CrusherDowntimeItem[]
    hasRecord: boolean
    isLoading: boolean
    ctl: ReturnType<typeof useDowntime>
}

export function DowntimeSection({ downtimes, hasRecord, isLoading, ctl }: Props) {
    const totalHours = downtimes.reduce((s, d) => s + (d.total_hours ?? 0), 0)
    const disabled = isLoading

    return (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">B. Jam Rusak & Perbaikan</h2>
                    <p className="text-xs text-slate-500">Catatan breakdown mesin pada tanggal terpilih</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-bold text-rose-700 tabular-nums">{formatNumber(totalHours)} Jam</div>
                    <div className="text-[11px] text-slate-500">{downtimes.length} kejadian</div>
                </div>
            </header>

            <div className="p-4 space-y-3 flex-1">
                <fieldset disabled={disabled} className="space-y-2.5 disabled:opacity-60">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <Label htmlFor="down-start" className="text-[11px] text-slate-500 font-normal">Jam rusak</Label>
                            <Input id="down-start" type="time" value={ctl.form.start} onChange={(e) => ctl.setField("start", e.target.value)} className="h-9 text-xs" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="down-end" className="text-[11px] text-slate-500 font-normal">Selesai</Label>
                            <Input id="down-end" type="time" value={ctl.form.end} onChange={(e) => ctl.setField("end", e.target.value)} className="h-9 text-xs" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] text-slate-500">Durasi</span>
                            <div className="h-9 px-2 flex items-center rounded-md border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 tabular-nums">
                                {formatNumber(ctl.totalHours)} Jam
                            </div>
                        </div>
                    </div>
                    <Input
                        id="down-desc"
                        placeholder="Indikasi kerusakan (misal: conveyor putus)"
                        value={ctl.form.desc}
                        onChange={(e) => ctl.setField("desc", e.target.value)}
                        className="h-9 text-xs"
                    />
                    <Input
                        id="down-action"
                        placeholder="Tindakan / suku cadang (opsional)"
                        value={ctl.form.action}
                        onChange={(e) => ctl.setField("action", e.target.value)}
                        className="h-9 text-xs"
                    />
                    <Button
                        id="down-add"
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={ctl.add}
                        disabled={disabled || ctl.isSaving}
                        className="w-full h-9 gap-1.5 font-semibold border-slate-300"
                    >
                        {ctl.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Tambah Catatan Kerusakan
                    </Button>
                </fieldset>

                {downtimes.length > 0 ? (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                        {downtimes.map((d) => (
                            <li key={d.id} className="px-3 py-2.5 flex items-start justify-between gap-2 text-xs">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                            {d.start_time} – {d.end_time}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                                            {formatNumber(d.total_hours)} jam
                                        </span>
                                    </div>
                                    <div className="text-slate-700 dark:text-slate-300 mt-0.5">{d.problem_desc}</div>
                                    {d.action_taken && <div className="text-[11px] text-slate-500">Tindakan: {d.action_taken}</div>}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => ctl.setDeleteId(d.id)}
                                    className="h-7 w-7 p-0 shrink-0 text-slate-400 hover:text-rose-600"
                                    aria-label="Hapus catatan kerusakan"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    !isLoading && (
                        <p className="text-center text-xs text-slate-500 py-4 border border-dashed border-slate-200 rounded-lg">
                            Belum ada kerusakan tercatat untuk tanggal ini.
                        </p>
                    )
                )}
            </div>

            <AlertDialog open={ctl.deleteId !== null} onOpenChange={(open) => !open && ctl.setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus catatan kerusakan?</AlertDialogTitle>
                        <AlertDialogDescription>Data downtime ini akan dihapus permanen dari laporan harian.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={ctl.isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                ctl.confirmDelete()
                            }}
                            disabled={ctl.isDeleting}
                            className="bg-rose-600 hover:bg-rose-700"
                        >
                            {ctl.isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    )
}
