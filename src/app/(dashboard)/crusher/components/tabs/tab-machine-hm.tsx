"use client"

import { useState, useTransition, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CrusherDailyReportData } from "../../types"
import { upsertCrusherHeader, addCrusherDowntime, deleteCrusherDowntime } from "../../actions"
import { calculateHmDifference, calculateDowntimeHours, formatNumber } from "../../utils/crusher-helpers"
import { toast } from "sonner"
import { Clock, AlertTriangle, Sun, CloudRain, Plus, Trash2, Loader2, Save } from "lucide-react"

type Props = {
    report: CrusherDailyReportData | null
    selectedDate: string
    locationId: string
    onRefresh: () => void
}

export function TabMachineHm({ report, selectedDate, locationId, onRefresh }: Props) {
    const [isPendingHeader, startHeaderTransition] = useTransition()
    const [isPendingDown, startDownTransition] = useTransition()

    // Form Header State
    const [hmStart, setHmStart] = useState<string>(report?.hm_start ? String(report.hm_start) : "")
    const [hmEnd, setHmEnd] = useState<string>(report?.hm_end ? String(report.hm_end) : "")
    const [hmNotes, setHmNotes] = useState<string>(report?.hm_notes || "")
    const [sunnyFrom, setSunnyFrom] = useState<string>(report?.sunny_from || "08:00")
    const [sunnyTo, setSunnyTo] = useState<string>(report?.sunny_to || "17:00")
    const [rainFrom, setRainFrom] = useState<string>(report?.rain_from || "")
    const [rainTo, setRainTo] = useState<string>(report?.rain_to || "")
    const [weatherNotes, setWeatherNotes] = useState<string>(report?.weather_notes || "")

    // Downtime Quick Entry Form
    const [downStart, setDownStart] = useState("")
    const [downEnd, setDownEnd] = useState("")
    const [downDesc, setDownDesc] = useState("")
    const [downAction, setDownAction] = useState("")

    useEffect(() => {
        setHmStart(report?.hm_start ? String(report.hm_start) : "")
        setHmEnd(report?.hm_end ? String(report.hm_end) : "")
        setHmNotes(report?.hm_notes || "")
        setSunnyFrom(report?.sunny_from || "08:00")
        setSunnyTo(report?.sunny_to || "17:00")
        setRainFrom(report?.rain_from || "")
        setRainTo(report?.rain_to || "")
        setWeatherNotes(report?.weather_notes || "")
    }, [report])

    const totalHm = calculateHmDifference(Number(hmStart), Number(hmEnd))
    const totalDownHours = calculateDowntimeHours(downStart, downEnd)

    const handleSaveHeader = () => {
        if (!locationId) {
            toast.error("Lokasi stone crusher belum dipilih")
            return
        }

        startHeaderTransition(async () => {
            try {
                await upsertCrusherHeader({
                    date: selectedDate,
                    locationId,
                    hm_start: Number(hmStart) || 0,
                    hm_end: Number(hmEnd) || 0,
                    total_hm: totalHm,
                    hm_notes: hmNotes,
                    sunny_from: sunnyFrom,
                    sunny_to: sunnyTo,
                    rain_from: rainFrom,
                    rain_to: rainTo,
                    weather_notes: weatherNotes,
                })
                toast.success("Jam kerja dan cuaca berhasil disimpan")
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal menyimpan jam kerja")
            }
        })
    }

    const handleAddDowntime = () => {
        const reportTarget = report?.id || { date: selectedDate, locationId }
        if (!downStart || !downEnd || !downDesc.trim()) {
            toast.error("Jam rusak, selesai, dan indikasi kerusakan wajib diisi")
            return
        }

        startDownTransition(async () => {
            try {
                await addCrusherDowntime(reportTarget, {
                    start_time: downStart,
                    end_time: downEnd,
                    total_hours: totalDownHours,
                    problem_desc: downDesc.trim(),
                    action_taken: downAction.trim(),
                })
                toast.success("Catatan kerusakan berhasil ditambahkan")
                setDownStart("")
                setDownEnd("")
                setDownDesc("")
                setDownAction("")
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal menambah downtime")
            }
        })
    }

    const handleDeleteDowntime = (id: string) => {
        startDownTransition(async () => {
            try {
                await deleteCrusherDowntime(id)
                toast.success("Downtime dihapus")
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal menghapus downtime")
            }
        })
    }

    return (
        <div className="space-y-4 w-full">
            {/* SEKSI A: JAM KERJA S. CRUSHER */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>A. Jam Kerja Stone Crusher</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                        Total: <span className="text-blue-700 font-bold text-sm">{formatNumber(totalHm)} Jam</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-600 font-medium">HM Awal</Label>
                        <Input
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            placeholder="024.6"
                            value={hmStart}
                            onChange={(e) => setHmStart(e.target.value)}
                            className="h-10 text-sm font-semibold bg-slate-50"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-600 font-medium">HM Akhir</Label>
                        <Input
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            placeholder="032.8"
                            value={hmEnd}
                            onChange={(e) => setHmEnd(e.target.value)}
                            className="h-10 text-sm font-semibold bg-slate-50"
                        />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                        <Label className="text-xs text-slate-600 font-medium">Total Jam Kerja</Label>
                        <div className="h-10 px-3 flex items-center bg-blue-50 border border-blue-200 rounded-md font-bold text-blue-700 text-sm">
                            {formatNumber(totalHm)} Jam
                        </div>
                    </div>
                </div>

                {/* SEKSI G: KONDISI CUACA */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sun className="h-3.5 w-3.5 text-amber-500" />
                        <span>G. Kondisi Cuaca</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="space-y-1">
                            <span className="text-[11px] text-slate-500">Cerah Dari</span>
                            <Input
                                type="time"
                                value={sunnyFrom}
                                onChange={(e) => setSunnyFrom(e.target.value)}
                                className="h-8 text-xs bg-slate-50"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] text-slate-500">Cerah S/D</span>
                            <Input
                                type="time"
                                value={sunnyTo}
                                onChange={(e) => setSunnyTo(e.target.value)}
                                className="h-8 text-xs bg-slate-50"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] text-slate-500">Hujan Dari</span>
                            <Input
                                type="time"
                                value={rainFrom}
                                onChange={(e) => setRainFrom(e.target.value)}
                                className="h-8 text-xs bg-slate-50"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] text-slate-500">Hujan S/D</span>
                            <Input
                                type="time"
                                value={rainTo}
                                onChange={(e) => setRainTo(e.target.value)}
                                className="h-8 text-xs bg-slate-50"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-slate-600 font-medium">Keterangan Operasional</Label>
                    <Input
                        placeholder="Catatan mesin atau kendala cuaca..."
                        value={hmNotes}
                        onChange={(e) => setHmNotes(e.target.value)}
                        className="h-8 text-xs bg-slate-50"
                    />
                </div>

                <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveHeader}
                    disabled={isPendingHeader}
                    className="w-full h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-semibold"
                >
                    {isPendingHeader ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Simpan Jam Mesin & Cuaca
                </Button>
            </div>

            {/* SEKSI B: JAM RUSAK / PERBAIKAN (DOWNTIME) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span>B. Jam Rusak & Perbaikan Mesin</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                        {report?.downtimes.length ?? 0} Kejadian
                    </span>
                </div>

                {/* Form Tambah Downtime */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[11px]">Jam Rusak</Label>
                            <Input
                                type="time"
                                value={downStart}
                                onChange={(e) => setDownStart(e.target.value)}
                                className="h-8 text-xs bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px]">Selesai</Label>
                            <Input
                                type="time"
                                value={downEnd}
                                onChange={(e) => setDownEnd(e.target.value)}
                                className="h-8 text-xs bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px]">Total Jam</Label>
                            <div className="h-8 px-2 flex items-center bg-white border border-slate-200 rounded text-xs font-bold text-slate-800">
                                {formatNumber(totalDownHours)} Jam
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                            placeholder="Indikasi Kerusakan (misal: conveyor putus)"
                            value={downDesc}
                            onChange={(e) => setDownDesc(e.target.value)}
                            className="h-8 text-xs bg-white"
                        />
                        <Input
                            placeholder="Tindakan / Suku Cadang (opsional)"
                            value={downAction}
                            onChange={(e) => setDownAction(e.target.value)}
                            className="h-8 text-xs bg-white"
                        />
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        onClick={handleAddDowntime}
                        disabled={isPendingDown}
                        className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                    >
                        {isPendingDown ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Tambah Catatan Kerusakan
                    </Button>
                </div>

                {/* List Downtime Tersimpan */}
                {report?.downtimes && report.downtimes.length > 0 && (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                        {report.downtimes.map((d) => (
                            <div key={d.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                                <div>
                                    <div className="font-bold text-slate-900">
                                        {d.start_time} - {d.end_time} ({formatNumber(d.total_hours)} Jam)
                                    </div>
                                    <div className="text-slate-600">{d.problem_desc}</div>
                                    {d.action_taken && <div className="text-[11px] text-slate-400">Tindakan: {d.action_taken}</div>}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDowntime(d.id)}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
