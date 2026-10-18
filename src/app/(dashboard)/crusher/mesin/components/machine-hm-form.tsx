"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Save, RotateCcw, History } from "lucide-react"
import { formatNumber } from "../../utils/crusher-helpers"
import type { CrusherEditLogItem } from "../../types"
import type { MachineHeaderForm, PreviousHm } from "../types"
import { formatDayShort } from "../utils/mesin-date"

type Props = {
    form: MachineHeaderForm
    setField: (key: keyof MachineHeaderForm, value: string) => void
    totalHm: number
    hmInvalid: boolean
    isDirty: boolean
    isSaving: boolean
    isLoading: boolean
    hasRecord: boolean
    prevHm: PreviousHm
    editLogs?: CrusherEditLogItem[]
    onSave: () => void
    onReset: () => void
}

const TIME_FIELDS: { key: keyof MachineHeaderForm; label: string }[] = [
    { key: "sunnyFrom", label: "Cerah dari" },
    { key: "sunnyTo", label: "Cerah s/d" },
    { key: "rainFrom", label: "Hujan dari" },
    { key: "rainTo", label: "Hujan s/d" },
]

export function MachineHmForm(props: Props) {
    const { form, setField, totalHm, hmInvalid, isDirty, isSaving, isLoading, hasRecord, prevHm, onSave, onReset } = props
    const canUsePrev = prevHm !== null && form.hmStart !== String(prevHm.hm_end)

    return (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">A. Jam Kerja Crusher & Cuaca</h2>
                    <p className="text-xs text-slate-500">Hour meter crusher dan kondisi cuaca harian</p>
                </div>
                <div className="flex items-center gap-1.5">
                    {props.editLogs && props.editLogs.length > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Revisi {props.editLogs.length}x
                        </span>
                    )}
                    {isDirty && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Belum disimpan
                        </span>
                    )}
                </div>
            </header>

            {isLoading ? (
                <div className="p-4 space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <div className="p-4 space-y-4 flex-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="mesin-hm-start" className="text-xs text-slate-600">HM Awal</Label>
                            <Input
                                id="mesin-hm-start"
                                type="number"
                                step="0.1"
                                inputMode="decimal"
                                placeholder="0,0"
                                value={form.hmStart}
                                onChange={(e) => setField("hmStart", e.target.value)}
                                className="h-10 text-sm font-semibold tabular-nums"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="mesin-hm-end" className="text-xs text-slate-600">HM Akhir</Label>
                            <Input
                                id="mesin-hm-end"
                                type="number"
                                step="0.1"
                                inputMode="decimal"
                                placeholder="0,0"
                                value={form.hmEnd}
                                onChange={(e) => setField("hmEnd", e.target.value)}
                                aria-invalid={hmInvalid}
                                className={`h-10 text-sm font-semibold tabular-nums ${hmInvalid ? "border-rose-300 focus-visible:ring-rose-300" : ""}`}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1 space-y-1">
                            <span className="text-xs font-medium text-slate-600">Total Jam Kerja</span>
                            <div className="h-10 px-3 flex items-center rounded-md border border-blue-200 bg-blue-50 text-blue-700 font-bold text-sm tabular-nums">
                                {formatNumber(totalHm)} Jam
                            </div>
                        </div>
                    </div>

                    {hmInvalid && (
                        <p className="text-xs text-rose-600 -mt-2">HM Akhir lebih kecil dari HM Awal.</p>
                    )}

                    {!hasRecord && prevHm && canUsePrev && (
                        <button
                            id="mesin-use-prev-hm"
                            type="button"
                            onClick={() => setField("hmStart", String(prevHm.hm_end))}
                            className="w-full text-left text-xs px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                            HM akhir terakhir <b>{formatNumber(prevHm.hm_end)}</b> ({formatDayShort(prevHm.date)}) — klik untuk
                            gunakan sebagai HM Awal
                        </button>
                    )}

                    <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kondisi Cuaca</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {TIME_FIELDS.map((f) => (
                                <div key={f.key} className="space-y-1">
                                    <Label htmlFor={`mesin-${f.key}`} className="text-[11px] text-slate-500 font-normal">
                                        {f.label}
                                    </Label>
                                    <Input
                                        id={`mesin-${f.key}`}
                                        type="time"
                                        value={form[f.key]}
                                        onChange={(e) => setField(f.key, e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="mesin-notes" className="text-xs text-slate-600">Keterangan Operasional</Label>
                        <Input
                            id="mesin-notes"
                            placeholder="Catatan mesin atau kendala cuaca..."
                            value={form.hmNotes}
                            onChange={(e) => setField("hmNotes", e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>

                    {props.editLogs && props.editLogs.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <History className="h-3.5 w-3.5 text-blue-600" />
                                <span>Riwayat Perubahan Data ({props.editLogs.length}x):</span>
                            </div>
                            <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                {props.editLogs.map((log) => (
                                    <div key={log.id} className="text-[11px] p-2 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 flex flex-col gap-0.5">
                                        <div className="flex items-center justify-between text-slate-500 font-medium">
                                            <span>Oleh: <strong className="text-slate-800 dark:text-slate-200">{log.userName}</strong></span>
                                            <span>{log.createdAt ? new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                                        </div>
                                        <div className="text-slate-700 dark:text-slate-300 text-[11px] font-mono leading-tight">
                                            {log.changes}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <footer className="flex gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                {isDirty && hasRecord && (
                    <Button id="mesin-reset" type="button" variant="outline" size="sm" onClick={onReset} disabled={isSaving} className="h-9 gap-1.5">
                        <RotateCcw className="h-4 w-4" />
                        Batal
                    </Button>
                )}
                <Button
                    id="mesin-save"
                    type="button"
                    size="sm"
                    onClick={onSave}
                    disabled={isSaving || isLoading || (hasRecord && !isDirty)}
                    className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-semibold"
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {hasRecord ? (isDirty ? "Simpan Perubahan" : "Tersimpan") : "Simpan Jam Mesin"}
                </Button>
            </footer>
        </section>
    )
}
