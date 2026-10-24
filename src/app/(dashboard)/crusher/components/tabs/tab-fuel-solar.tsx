"use client"

import { useState, useTransition, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CrusherDailyReportData, VehicleOption } from "../../types"
import { addCrusherFuelLog, deleteCrusherFuelLog, getLastMeterForVehicle } from "../../actions"
import { formatNumber } from "../../utils/crusher-helpers"
import { toast } from "sonner"
import { Fuel, Plus, Trash2, Loader2, Gauge, Truck, AlertTriangle, Info } from "lucide-react"

type Props = {
    report: CrusherDailyReportData | null
    selectedDate?: string
    locationId?: string
    vehicles: VehicleOption[]
    onRefresh: () => void
}

export function TabFuelSolar({ report, selectedDate, locationId, vehicles, onRefresh }: Props) {
    const [isPending, startTransition] = useTransition()

    const STORAGE_KEY_FUEL_PRICE = "rajawali_crusher_fuel_price"

    const [unitName, setUnitName] = useState("")
    const [unitCategory, setUnitCategory] = useState<"EXCAVATOR" | "GENSET" | "DUMP_TRUCK" | "LAINNYA">("EXCAVATOR")
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
    const [liters, setLiters] = useState("")
    const [meterType, setMeterType] = useState<"HM" | "KM">("HM")
    const [currentHm, setCurrentHm] = useState("")
    const [currentKm, setCurrentKm] = useState("")
    const [lastMeter, setLastMeter] = useState<number | null>(null)
    const [lastMeterSource, setLastMeterSource] = useState<string>("")
    const [lastMeterDate, setLastMeterDate] = useState<string>("")
    const [notes, setNotes] = useState("")
    const [fuelSource, setFuelSource] = useState<"NON_RBL" | "RBL">("NON_RBL")
    const [costPerLiter, setCostPerLiter] = useState<string>("")
    const [totalCost, setTotalCost] = useState<string>("")

    // Muat harga tersimpan dari localStorage / cache saat halaman dibuka
    useEffect(() => {
        if (typeof window !== "undefined") {
            const cached = localStorage.getItem(STORAGE_KEY_FUEL_PRICE)
            if (cached && !costPerLiter) {
                setCostPerLiter(cached)
            } else if (!costPerLiter && report?.fuelLogs && report.fuelLogs.length > 0) {
                const lastWithCost = report.fuelLogs.find(f => f.cost_per_liter && f.cost_per_liter > 0)
                if (lastWithCost?.cost_per_liter) {
                    setCostPerLiter(String(lastWithCost.cost_per_liter))
                    localStorage.setItem(STORAGE_KEY_FUEL_PRICE, String(lastWithCost.cost_per_liter))
                }
            }
        }
    }, [report?.fuelLogs])

    // Group vehicles into heavy equipment vs dump trucks
    const { heavyEquipments, dumpTrucks } = useMemo(() => {
        const heavy: VehicleOption[] = []
        const trucks: VehicleOption[] = []
        vehicles.forEach((v) => {
            const isHm = v.meter_type === "HM" || (v.code && (v.code.startsWith("EXC") || v.code.startsWith("WL") || v.code.startsWith("GS") || v.code.startsWith("CRU")))
            if (isHm) {
                heavy.push(v)
            } else {
                trucks.push(v)
            }
        })
        return { heavyEquipments: heavy, dumpTrucks: trucks }
    }, [vehicles])

    const handleSelectVehicle = async (vehicleId: string) => {
        if (!vehicleId || vehicleId === "MANUAL") {
            setSelectedVehicleId("")
            setLastMeter(null)
            setLastMeterSource("")
            setLastMeterDate("")
            return
        }

        const v = vehicles.find((item) => item.id === vehicleId)
        if (!v) return

        setSelectedVehicleId(v.id)
        const displayName = v.code ? `${v.code} - ${v.plate_number}` : v.plate_number
        setUnitName(displayName)

        // Tentukan kategori & meter type
        const isEquipment = v.meter_type === "HM" || (v.code && (v.code.startsWith("EXC") || v.code.startsWith("WL") || v.code.startsWith("GS") || v.code.startsWith("CRU")))
        if (isEquipment) {
            setMeterType("HM")
            if (v.code?.startsWith("EXC")) setUnitCategory("EXCAVATOR")
            else if (v.code?.startsWith("GS") || v.code?.startsWith("GEN")) setUnitCategory("GENSET")
            else setUnitCategory("LAINNYA")
        } else {
            setMeterType("KM")
            setUnitCategory("DUMP_TRUCK")
        }

        // Ambil meter terakhir dari semua sumber data (BBM, RBL, Operator, PO)
        try {
            const last: any = await getLastMeterForVehicle(v.id)
            if (last) {
                if (last.meter_type === "HM" && last.last_hm !== null) {
                    setLastMeter(last.last_hm)
                } else if (last.last_km !== null) {
                    setLastMeter(last.last_km)
                } else {
                    setLastMeter(null)
                }
                setLastMeterSource(last.source || "")
                setLastMeterDate(last.date || "")
            }
        } catch {
            setLastMeter(null)
            setLastMeterSource("")
            setLastMeterDate("")
        }
    }

    const currentMeterVal = useMemo(() => {
        const val = meterType === "HM" ? parseFloat(currentHm) : parseFloat(currentKm)
        return isNaN(val) ? null : val
    }, [meterType, currentHm, currentKm])

    const meterDiff = useMemo(() => {
        if (currentMeterVal === null || lastMeter === null) return null
        return Math.round((currentMeterVal - lastMeter) * 10) / 10
    }, [currentMeterVal, lastMeter])

    const isBackdateMeter = currentMeterVal !== null && lastMeter !== null && currentMeterVal < lastMeter
    const isSpikeMeter = currentMeterVal !== null && lastMeter !== null && meterDiff !== null && (
        meterType === "HM" ? meterDiff > 24 : meterDiff > 1000
    )

    const handleMeterChange = (val: string, type: "HM" | "KM") => {
        if (type === "HM") {
            setCurrentHm(val)
        } else {
            setCurrentKm(val)
        }
    }

    const handleCostChange = (val: string) => {
        setCostPerLiter(val)
        if (typeof window !== "undefined") {
            if (val) localStorage.setItem(STORAGE_KEY_FUEL_PRICE, val)
            else localStorage.removeItem(STORAGE_KEY_FUEL_PRICE)
        }
        if (liters && val) {
            setTotalCost(String(Math.round(Number(liters) * Number(val))))
        } else if (!val) {
            setTotalCost("")
        }
    }

    const handleLitersChange = (val: string) => {
        setLiters(val)
        if (costPerLiter && val) {
            setTotalCost(String(Math.round(Number(val) * Number(costPerLiter))))
        } else if (!val) {
            setTotalCost("")
        }
    }

    const handleAdd = () => {
        const targetDate = selectedDate || report?.date || new Date().toISOString().split("T")[0]
        const targetLoc = locationId || report?.locationId
        const reportTarget = report?.id || { date: targetDate, locationId: targetLoc }

        if (!unitName.trim()) {
            toast.error("Pilih kendaraan / alat berat dari master")
            return
        }
        if (!liters || Number(liters) <= 0) {
            toast.error("Volume solar (liter) wajib diisi lebih dari 0")
            return
        }

        // VALIDASI MANDATORY KM / HM
        if (meterType === "KM") {
            if (!currentKm || isNaN(Number(currentKm)) || Number(currentKm) <= 0) {
                toast.error("KM Odometer Truk saat pengisian wajib diisi!")
                return
            }
        } else {
            if (!currentHm || isNaN(Number(currentHm)) || Number(currentHm) <= 0) {
                toast.error("Hour Meter (HM) Alat Berat saat pengisian wajib diisi!")
                return
            }
        }

        if (isBackdateMeter) {
            toast.error(`Nilai ${meterType} saat ini (${currentMeterVal}) tidak boleh lebih kecil dari ${meterType} sebelumnya (${lastMeter}). Hindari backdate!`)
            return
        }

        startTransition(async () => {
            try {
                const litersNum = Number(liters)
                const cplNum = costPerLiter ? Number(costPerLiter) : 0
                const totNum = totalCost ? Number(totalCost) : (litersNum * cplNum)

                await addCrusherFuelLog(reportTarget, {
                    unit_name: unitName.trim(),
                    unit_category: unitCategory,
                    vehicleId: selectedVehicleId || undefined,
                    liters: litersNum,
                    current_hm: currentHm ? Number(currentHm) : undefined,
                    current_km: currentKm ? Number(currentKm) : undefined,
                    notes: notes.trim() || undefined,
                    fuel_source: fuelSource,
                    cost_per_liter: cplNum,
                    total_cost: totNum,
                })
                toast.success(`BBM solar ${unitName} (${liters} L) berhasil dicatat`)
                setUnitName("")
                setLiters("")
                setCurrentHm("")
                setCurrentKm("")
                // Pertahankan costPerLiter agar admin tidak perlu input ulang harga!
                setTotalCost("")
                setNotes("")
                setSelectedVehicleId("")
                setLastMeter(null)
                setLastMeterSource("")
                setLastMeterDate("")
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal mencatat pengisian BBM")
            }
        })
    }

    const handleDelete = (id: string, name: string) => {
        startTransition(async () => {
            try {
                await deleteCrusherFuelLog(id)
                toast.success(`Catatan BBM ${name} dihapus`)
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal menghapus catatan BBM")
            }
        })
    }

    const totalLiters = report?.fuelLogs.reduce((acc, f) => acc + (f.liters ?? 0), 0) ?? 0

    return (
        <div className="space-y-4 w-full">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                        <Fuel className="h-4 w-4 text-amber-600" />
                        <span>C. Monitoring Pengisian BBM (Solar)</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                        Total Hari Ini: <span className="text-amber-700 dark:text-amber-400 font-bold text-sm">{formatNumber(totalLiters, 0)} Liter</span>
                    </div>
                </div>

                {/* Quick Chips: Alat Berat Utama Stone Crusher */}
                <div className="space-y-1.5">
                    <Label className="text-[11px] text-slate-500 font-medium">Pilih Cepat Alat Berat / Armada:</Label>
                    <div className="flex flex-wrap gap-1.5">
                        {heavyEquipments.map((v) => (
                            <button
                                key={v.id}
                                type="button"
                                onClick={() => handleSelectVehicle(v.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    selectedVehicleId === v.id
                                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200"
                                }`}
                            >
                                <span className="font-bold">{v.code || v.plate_number}</span>
                                {v.merk_model && <span className="text-[10px] opacity-80 ml-1">({v.merk_model})</span>}
                            </button>
                        ))}

                        {dumpTrucks.slice(0, 4).map((v) => (
                            <button
                                key={v.id}
                                type="button"
                                onClick={() => handleSelectVehicle(v.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    selectedVehicleId === v.id
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200"
                                }`}
                            >
                                <Truck className="h-3 w-3 inline mr-1" />
                                {v.plate_number}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form Input BBM */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs font-medium">Master Kendaraan / Alat Berat *</Label>
                            <Select value={selectedVehicleId} onValueChange={handleSelectVehicle}>
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 font-semibold">
                                    <SelectValue placeholder="-- Pilih dari Master Kendaraan / Alat --" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MANUAL">Input Manual / Lainnya</SelectItem>
                                    {vehicles.map((v) => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.code ? `[${v.code}] ` : ""}{v.plate_number} {v.merk_model ? `(${v.merk_model})` : ""} - {v.meter_type || "KM"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Jumlah Solar (Liter) *</Label>
                            <Input
                                type="number"
                                step="1"
                                inputMode="numeric"
                                placeholder="e.g. 50"
                                value={liters}
                                onChange={(e) => handleLitersChange(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900 font-bold text-amber-700 dark:text-amber-400"
                            />
                        </div>
                    </div>

                    {/* Sumber BBM & Harga Manual */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Sumber BBM</Label>
                            <Select value={fuelSource} onValueChange={(val: any) => setFuelSource(val)}>
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 font-semibold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NON_RBL">Non-RBL (Tangki Duduk / Vendor)</SelectItem>
                                    <SelectItem value="RBL">RBL (Kas Kecil Cabang)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Harga per Liter (Rp)</Label>
                                {costPerLiter && (
                                    <span className="text-[9px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 font-medium">
                                        Tersimpan di Cache
                                    </span>
                                )}
                            </div>
                            <Input
                                type="number"
                                step="100"
                                inputMode="numeric"
                                placeholder="e.g. 13500 (Free Input / Tersimpan)"
                                value={costPerLiter}
                                onChange={(e) => handleCostChange(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900 font-mono"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Total Biaya (Rp)</Label>
                            <Input
                                type="number"
                                step="1000"
                                inputMode="numeric"
                                placeholder="Total Biaya"
                                value={totalCost}
                                onChange={(e) => setTotalCost(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900 font-mono font-semibold"
                            />
                        </div>
                    </div>

                    {!selectedVehicleId && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[11px] text-slate-500">Nama Unit (Manual)</Label>
                                <Input
                                    placeholder="Contoh: Exc. Kali, Genset Harapan"
                                    value={unitName}
                                    onChange={(e) => setUnitName(e.target.value)}
                                    className="h-8 text-xs bg-white dark:bg-slate-900"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-slate-500">Kategori Unit</Label>
                                <Select value={unitCategory} onValueChange={(val: any) => setUnitCategory(val)}>
                                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EXCAVATOR">Excavator</SelectItem>
                                        <SelectItem value="GENSET">Genset</SelectItem>
                                        <SelectItem value="DUMP_TRUCK">Dump Truck</SelectItem>
                                        <SelectItem value="LAINNYA">Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Meter Saat Isi */}
                    <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                        {meterType === "HM" ? "HM Unit Saat Pengisian" : "KM Odometer Truk Saat Pengisian"}{" "}
                                        <span className="text-rose-500 font-bold">* Wajib</span>
                                    </Label>
                                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                        {lastMeter !== null ? (
                                            <>
                                                {meterType} Lalu: <b className="text-slate-900 dark:text-slate-100">{formatNumber(lastMeter, meterType === "HM" ? 1 : 0)}</b>
                                                {lastMeterSource ? ` • ${lastMeterSource}` : ""}
                                            </>
                                        ) : (
                                            <span className="text-slate-400 italic">{meterType} Lalu: 0 (Awal / Baru)</span>
                                        )}
                                    </span>
                                </div>
                                <Input
                                    type="number"
                                    step={meterType === "HM" ? "0.1" : "1"}
                                    inputMode="decimal"
                                    placeholder={`Wajib diisi: angka ${meterType} saat isi`}
                                    value={meterType === "HM" ? currentHm : currentKm}
                                    onChange={(e) => handleMeterChange(e.target.value, meterType)}
                                    className={`h-9 text-xs bg-white dark:bg-slate-900 font-bold ${
                                        isBackdateMeter ? "border-rose-500 text-rose-600 focus-visible:ring-rose-400" : ""
                                    }`}
                                />
                                {meterDiff !== null && !isBackdateMeter && (
                                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center justify-between mt-1">
                                        <span>
                                            Pemakaian: <b>+{formatNumber(meterDiff, meterType === "HM" ? 1 : 0)} {meterType}</b>
                                        </span>
                                        {liters && Number(liters) > 0 && meterDiff > 0 && (
                                            <span>
                                                Rasio: <b>{(Number(liters) / meterDiff).toFixed(2)} L/{meterType}</b>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] text-slate-600">No Bon / Ref BBM (opsional)</Label>
                                <Input
                                    placeholder="No Bon Solar / Struk BBM"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                            </div>
                        </div>

                        {/* Indikator Peringatan Backdate (Cegah Backdate KM / HM) */}
                        {isBackdateMeter && (
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                                <span>
                                    <b>Peringatan Backdate:</b> {meterType} sekarang (<b>{currentMeterVal}</b>) lebih kecil dari {meterType} sebelumnya (<b>{lastMeter}</b>). Simpan dinonaktifkan untuk mencegah error.
                                </span>
                            </div>
                        )}

                        {/* Indikator Lonjakan Tidak Wajar */}
                        {isSpikeMeter && !isBackdateMeter && (
                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                                <Info className="h-4 w-4 shrink-0 text-amber-600" />
                                <span>
                                    <b>Perhatian Lonjakan:</b> Selisih <b>+{meterDiff} {meterType === "HM" ? "jam" : "km"}</b> cukup tinggi. Pastikan pembacaan meter benar dan tidak salah ketik angka 0.
                                </span>
                            </div>
                        )}
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        onClick={handleAdd}
                        disabled={isPending || isBackdateMeter}
                        className="w-full h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-xs"
                    >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Catat Pengisian Solar
                    </Button>
                </div>

                {/* List Pengisian BBM Hari Ini */}
                {report?.fuelLogs && report.fuelLogs.length > 0 && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        {report.fuelLogs.map((f) => (
                            <div key={f.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <span>{f.unit_name}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-900">
                                            {formatNumber(f.liters, 0)} Liter
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-2.5 gap-y-0.5 mt-0.5">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            {f.fuel_source === "RBL" ? "Kas RBL" : "Non-RBL"}
                                        </span>
                                        {f.cost_per_liter ? <span>@ Rp {formatNumber(f.cost_per_liter, 0)}/L</span> : null}
                                        {f.total_cost ? <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">(Rp {formatNumber(f.total_cost, 0)})</span> : null}
                                        {f.current_hm ? <span>HM: <b>{formatNumber(f.current_hm, 1)}</b></span> : null}
                                        {f.current_km ? <span>KM: <b>{formatNumber(f.current_km, 0)}</b></span> : null}
                                        {f.notes ? <span>• {f.notes}</span> : null}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(f.id, f.unit_name)}
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
