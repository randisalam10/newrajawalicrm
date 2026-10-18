"use client"

import { useState, useTransition, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { EmployeeOption, LocationOption, VehicleOption } from "../../types"
import { addOperatorWorkLog, getLastMeterForVehicle } from "../../actions"
import { formatNumber, formatRupiah } from "../../utils/crusher-helpers"
import { toast } from "sonner"
import { HardHat, Plus, Loader2, Gauge, Clock, UserCheck, ShieldCheck, Info } from "lucide-react"

type Props = {
    selectedDate: string
    activeLocationId: string
    activeLocationName: string
    locations: LocationOption[]
    employees: EmployeeOption[]
    vehicles: VehicleOption[]
    masterRates?: Record<string, { normal: number; overtime: number; name?: string }>
    canViewWages?: boolean
    onSuccess: () => void
}

export function OperatorLogForm({
    selectedDate,
    activeLocationId,
    activeLocationName,
    locations,
    employees,
    vehicles,
    masterRates,
    canViewWages = false,
    onSuccess,
}: Props) {
    const [isPending, startTransition] = useTransition()

    const [date, setDate] = useState(selectedDate)
    const [employeeId, setEmployeeId] = useState("")
    const [vehicleId, setVehicleId] = useState("")
    const [hmStart, setHmStart] = useState("")
    const [hmEnd, setHmEnd] = useState("")

    // Jam kerja normal dan lembur (diisi operator/admin)
    const [hoursNormal, setHoursNormal] = useState("")
    const [hoursOvertime, setHoursOvertime] = useState("")
    const [notes, setNotes] = useState("")

    // Filter hanya Operator dan Helper (Sopir TIDAK MASUK di pencatatan operator/helper)
    const eligibleEmployees = useMemo(() => {
        return employees.filter((e) => {
            const pos = (e.position || "").toLowerCase()
            return !pos.includes("sopir") && !pos.includes("driver")
        })
    }, [employees])

    // Karyawan terpilih & auto-mapping peran
    const selectedEmployee = useMemo(() => {
        return eligibleEmployees.find((e) => e.id === employeeId) || null
    }, [eligibleEmployees, employeeId])

    // Filter heavy equipment (Excavator / Loader)
    const equipmentVehicles = useMemo(() => {
        return vehicles.filter((v) => {
            const cat = (v.categoryName || "").toLowerCase()
            const code = (v.code || "").toLowerCase()
            return v.meter_type === "HM" || cat.includes("loader") || cat.includes("excavator") || code.startsWith("exc") || code.startsWith("wl")
        })
    }, [vehicles])

    // Unit terpilih
    const selectedVehicle = useMemo(() => {
        return vehicles.find((v) => v.id === vehicleId) || null
    }, [vehicles, vehicleId])

    // Auto-resolve role berdasarkan mapping karyawan dan unit
    const resolvedRole = useMemo(() => {
        if (!selectedEmployee) return "OPERATOR_EXCAVATOR"
        if (selectedEmployee.position === "Helper") return "HELPER"
        if (selectedVehicle) {
            const cat = (selectedVehicle.categoryName || "").toLowerCase()
            const code = (selectedVehicle.code || "").toLowerCase()
            if (cat.includes("loader") || code.startsWith("wl")) return "OPERATOR_LOADER"
            if (cat.includes("excavator") || code.startsWith("exc")) return "OPERATOR_EXCAVATOR"
            if (cat.includes("crusher") || code.startsWith("cru")) return "OPERATOR_CRUSHER"
        }
        return "OPERATOR_EXCAVATOR"
    }, [selectedEmployee, selectedVehicle])

    // Ambil tarif otomatis dari Master Data (Zero Guesswork & No Manual Rate Typing)
    const currentRate = useMemo(() => {
        const defaultFallback: Record<string, { normal: number; overtime: number }> = {
            OPERATOR_EXCAVATOR: { normal: 15000, overtime: 20000 },
            OPERATOR_LOADER: { normal: 10000, overtime: 15000 },
            HELPER: { normal: 10000, overtime: 15000 },
            OPERATOR_CRUSHER: { normal: 15000, overtime: 20000 },
        }
        if (masterRates && masterRates[resolvedRole]) {
            return masterRates[resolvedRole]
        }
        return defaultFallback[resolvedRole] || { normal: 10000, overtime: 15000 }
    }, [masterRates, resolvedRole])

    const handleSelectEmployee = (eId: string) => {
        setEmployeeId(eId)
        const emp = eligibleEmployees.find((e) => e.id === eId)
        if (emp?.position === "Helper") {
            setVehicleId("")
            setHmStart("")
            setHmEnd("")
        }
    }

    const handleSelectVehicle = async (vId: string) => {
        setVehicleId(vId)
        if (!vId) return

        try {
            const last = await getLastMeterForVehicle(vId)
            if (last && last.last_hm !== null) {
                setHmStart(String(last.last_hm))
            }
        } catch {}
    }

    // Hitung normal hours dari HM jika dimasukkan
    const handleHmEndChange = (endVal: string) => {
        setHmEnd(endVal)
        const start = parseFloat(hmStart)
        const end = parseFloat(endVal)
        if (!isNaN(start) && !isNaN(end) && end >= start) {
            const diff = Math.round((end - start) * 10) / 10
            setHoursNormal(String(diff))
        }
    }

    // Perhitungan upah otomatis dari tarif master
    const numNormal = parseFloat(hoursNormal) || 0
    const numOvertime = parseFloat(hoursOvertime) || 0
    const feeNormal = numNormal * currentRate.normal
    const feeOvertime = numOvertime * currentRate.overtime
    const totalWage = feeNormal + feeOvertime

    const handleSubmit = () => {
        if (!employeeId) return void toast.error("Pilih nama karyawan / operator terlebih dahulu")
        if (selectedEmployee?.position !== "Helper" && !vehicleId) {
            return void toast.error("Pilih unit alat berat yang dioperasikan")
        }
        if (numNormal <= 0 && numOvertime <= 0) {
            return void toast.error("Isi jumlah jam kerja normal atau lembur")
        }

        startTransition(async () => {
            try {
                await addOperatorWorkLog({
                    date,
                    locationId: activeLocationId,
                    employeeId,
                    role_type: resolvedRole,
                    vehicleId: vehicleId || undefined,
                    hm_start: hmStart ? parseFloat(hmStart) : undefined,
                    hm_end: hmEnd ? parseFloat(hmEnd) : undefined,
                    work_hours_normal: numNormal,
                    work_hours_overtime: numOvertime,
                    rate_normal: currentRate.normal,
                    rate_overtime: currentRate.overtime,
                    notes: notes.trim() || undefined,
                })
                if (canViewWages) {
                    toast.success(`Log jam kerja & upah ${formatRupiah(totalWage)} berhasil disimpan`)
                } else {
                    toast.success(`Log jam kerja ${selectedEmployee?.name || ""} berhasil disimpan`)
                }
                setHoursNormal("")
                setHoursOvertime("")
                setHmEnd("")
                setNotes("")
                onSuccess()
            } catch (err: any) {
                toast.error(err.message || "Gagal mencatat jam kerja")
            }
        })
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-2.5">
                <div className="flex items-center gap-2">
                    {selectedEmployee?.position === "Helper" ? (
                        <UserCheck className="h-4 w-4 text-teal-600" />
                    ) : (
                        <HardHat className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Input Log Jam Kerja {canViewWages ? "& Upah Harian" : ""}
                    </span>
                    {selectedEmployee?.position && (
                        <Badge variant="outline" className="text-[10px] bg-white font-semibold">
                            {selectedEmployee.position === "Helper" ? "Helper Perorangan" : "Operator Alat"}
                        </Badge>
                    )}
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <span>Lokasi:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{activeLocationName || "Unit Operasional"}</strong>
                </div>
            </div>

            {/* Pemilihan Personel Langsung (Auto-Mapping Job & Tarif) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pilih Karyawan / Personel *
                    </Label>
                    <Select value={employeeId} onValueChange={handleSelectEmployee}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 font-bold">
                            <SelectValue placeholder="-- Pilih nama orang --" />
                        </SelectTrigger>
                        <SelectContent>
                            {eligibleEmployees.map((e) => (
                                <SelectItem key={e.id} value={e.id} className="text-xs">
                                    <span className="font-semibold">{e.name}</span>{" "}
                                    <span className="text-slate-500">({e.position})</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Pemilihan Unit Alat Berat (Hanya jika posisi bukan Helper) */}
                {selectedEmployee?.position !== "Helper" ? (
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Unit Alat Berat yang Dioperasikan *
                        </Label>
                        <Select value={vehicleId} onValueChange={handleSelectVehicle}>
                            <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 font-semibold">
                                <SelectValue placeholder="Pilih Excavator / Wheel Loader" />
                            </SelectTrigger>
                            <SelectContent>
                                {equipmentVehicles.map((v) => (
                                    <SelectItem key={v.id} value={v.id} className="text-xs">
                                        {v.code ? `[${v.code}] ` : ""}{v.plate_number} {v.merk_model ? `(${v.merk_model})` : ""} - {v.categoryName || "Alat Berat"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="flex items-center p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800">
                        <UserCheck className="h-4 w-4 mr-2 text-amber-600 shrink-0" />
                        <span>Helper adalah tenaga kerja harian perorangan (tanpa unit alat berat).</span>
                    </div>
                )}
            </div>

            {/* HM Awal & Akhir (Hanya jika operator unit) */}
            {selectedEmployee?.position !== "Helper" && vehicleId && (
                <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="space-y-1">
                        <Label className="text-[11px] text-slate-600">HM Awal</Label>
                        <Input
                            type="number"
                            step="0.1"
                            placeholder="HM awal"
                            value={hmStart}
                            onChange={(e) => setHmStart(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-slate-900"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] text-slate-600">HM Akhir (Auto hitung jam kerja)</Label>
                        <Input
                            type="number"
                            step="0.1"
                            placeholder="HM akhir"
                            value={hmEnd}
                            onChange={(e) => handleHmEndChange(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-slate-900 font-bold"
                        />
                    </div>
                </div>
            )}

            {/* Tarif Master Display Strip (Hanya tampil jika memiliki izin RBAC) */}
            {canViewWages && (
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900/80 rounded-lg border border-slate-200/90 dark:border-slate-700 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Tarif Master Data:</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono">
                            {formatRupiah(currentRate.normal)}/jam (Normal)
                        </strong>
                        <span>•</span>
                        <strong className="text-amber-700 dark:text-amber-400 font-mono">
                            {formatRupiah(currentRate.overtime)}/jam (Lembur)
                        </strong>
                    </div>
                    <span className="text-[10px] text-slate-400 italic">Tersinkronisasi dari Master Insentif</span>
                </div>
            )}

            {/* Input Jam Normal & Lembur */}
            <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs text-blue-900 dark:text-blue-300 font-bold">
                            Jam Kerja Normal *
                        </Label>
                        <Input
                            type="number"
                            step="0.5"
                            placeholder="e.g. 7"
                            value={hoursNormal}
                            onChange={(e) => setHoursNormal(e.target.value)}
                            className="h-9 text-xs bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-amber-900 dark:text-amber-300 font-bold">
                            Jam Lembur
                        </Label>
                        <Input
                            type="number"
                            step="0.5"
                            placeholder="e.g. 2"
                            value={hoursOvertime}
                            onChange={(e) => setHoursOvertime(e.target.value)}
                            className="h-9 text-xs bg-white dark:bg-slate-900 font-bold text-amber-700 dark:text-amber-400"
                        />
                    </div>
                </div>

                {/* Rincian Upah Otomatis (Hanya untuk Finance / RBAC Authorized) */}
                {canViewWages && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-1.5 border-t border-blue-200/60 dark:border-blue-900/40 gap-1.5">
                        <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                            Normal: {numNormal} jam × {formatRupiah(currentRate.normal)} = <b>{formatRupiah(feeNormal)}</b> • Lembur: {numOvertime} jam × {formatRupiah(currentRate.overtime)} = <b>{formatRupiah(feeOvertime)}</b>
                        </span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-md border border-emerald-300 text-xs shadow-xs self-start sm:self-auto">
                            Total Upah: {formatRupiah(totalWage)}
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <Input
                    placeholder="Catatan kegiatan / uraian pekerjaan (opsional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-8 text-xs bg-white dark:bg-slate-900"
                />
            </div>

            <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={isPending || !employeeId}
                className="w-full h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-xs"
            >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {canViewWages ? "Simpan Log Jam Kerja & Upah" : "Simpan Log Jam Kerja"}
            </Button>
        </div>
    )
}
