"use client"

import { useState, useTransition, useMemo } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
    DriverOptionItem,
    LocationOptionItem,
    VehicleOptionItem,
} from "../types"
import { addVehicleFuelLog, getLastMeterForVehicleUniversal } from "../actions"
import { FuelMeterSection } from "./fuel-meter-section"
import { FuelPricingSection } from "./fuel-pricing-section"
import { Loader2, Plus, Fuel } from "lucide-react"

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    locations: LocationOptionItem[]
    vehicles: VehicleOptionItem[]
    drivers: DriverOptionItem[]
    currentLocationId?: string
    isCorporate: boolean
    onSuccess: () => void
}

export function FuelLogFormDialog({
    open,
    onOpenChange,
    locations,
    vehicles,
    drivers,
    currentLocationId = "",
    isCorporate,
    onSuccess,
}: Props) {
    const [isPending, startTransition] = useTransition()

    // Form States
    const todayStr = new Date().toISOString().split("T")[0]
    const [date, setDate] = useState(todayStr)
    const [selectedLocationId, setSelectedLocationId] = useState(currentLocationId || (locations[0]?.id || ""))
    const [selectedVehicleId, setSelectedVehicleId] = useState("")
    const [selectedDriverId, setSelectedDriverId] = useState("")
    const [customDriverName, setCustomDriverName] = useState("")

    // Odometer
    const [meterType, setMeterType] = useState<"KM" | "HM">("KM")
    const [currentMeter, setCurrentMeter] = useState("")
    const [lastMeter, setLastMeter] = useState<number | null>(null)
    const [lastMeterSource, setLastMeterSource] = useState<string>("")
    const [lastMeterDate, setLastMeterDate] = useState<string>("")

    // Fuel & Pricing (Strictly Non-RBL with Manual Free Input)
    const [liters, setLiters] = useState("")
    const [costPerLiter, setCostPerLiter] = useState<string>("")
    const [totalCost, setTotalCost] = useState<string>("")

    // Notes
    const [receiptNo, setReceiptNo] = useState("")
    const [notes, setNotes] = useState("")

    // Filter vehicles by selected location
    const availableVehicles = useMemo(() => {
        if (!selectedLocationId) return vehicles
        return vehicles.filter((v) => !v.locationId || v.locationId === selectedLocationId)
    }, [vehicles, selectedLocationId])

    // Filter drivers by selected location
    const availableDrivers = useMemo(() => {
        if (!selectedLocationId) return drivers
        return drivers.filter((d) => !d.locationId || d.locationId === selectedLocationId)
    }, [drivers, selectedLocationId])

    const handleSelectVehicle = async (vehId: string) => {
        setSelectedVehicleId(vehId)
        const v = vehicles.find((item) => item.id === vehId)
        if (!v) {
            setLastMeter(null)
            setLastMeterSource("")
            setLastMeterDate("")
            return
        }

        const type = (v.meter_type as "KM" | "HM") || "KM"
        setMeterType(type)

        // Langsung pasang meter terakhir preloaded (instan tanpa delay network)
        if (v.lastMeter !== undefined && v.lastMeter !== null) {
            setLastMeter(v.lastMeter)
            setLastMeterSource(v.lastMeterSource || "Riwayat Unit")
            setLastMeterDate(v.lastMeterDate || "")
        } else {
            setLastMeter(null)
            setLastMeterSource("")
            setLastMeterDate("")
        }

        // Fetch meter universal terbaru dari database (RBL, Stone Crusher, PO, BBM)
        try {
            const res = await getLastMeterForVehicleUniversal(v.id)
            if (res && res.lastMeter !== null) {
                setLastMeter(res.lastMeter)
                setLastMeterSource(res.source)
                setLastMeterDate(res.date || "")
            }
        } catch {
            // Jika network fetch gagal, tetap gunakan data preloaded
        }
    }

    const currentMeterVal = useMemo(() => {
        const val = parseFloat(currentMeter)
        return isNaN(val) ? null : val
    }, [currentMeter])

    const meterDiff = useMemo(() => {
        if (currentMeterVal === null || lastMeter === null) return null
        return Math.round((currentMeterVal - lastMeter) * 10) / 10
    }, [currentMeterVal, lastMeter])

    const isBackdateMeter = currentMeterVal !== null && lastMeter !== null && currentMeterVal < lastMeter

    const isSpikeMeter = currentMeterVal !== null && lastMeter !== null && meterDiff !== null && (
        meterType === "HM" ? meterDiff > 24 : meterDiff > 1000
    )

    const handleLitersChange = (val: string) => {
        setLiters(val)
        if (costPerLiter && val) {
            const calculated = Math.round(Number(val) * Number(costPerLiter))
            setTotalCost(String(calculated))
        }
    }

    const handleCostPerLiterChange = (val: string) => {
        setCostPerLiter(val)
        if (liters && val) {
            const calculated = Math.round(Number(liters) * Number(val))
            setTotalCost(String(calculated))
        }
    }

    const resetForm = () => {
        setDate(todayStr)
        setSelectedVehicleId("")
        setSelectedDriverId("")
        setCustomDriverName("")
        setCurrentMeter("")
        setLastMeter(null)
        setLastMeterSource("")
        setLastMeterDate("")
        setLiters("")
        setCostPerLiter("")
        setTotalCost("")
        setReceiptNo("")
        setNotes("")
    }

    const handleSubmit = () => {
        if (!selectedVehicleId) {
            toast.error("Pilih unit kendaraan / alat berat terlebih dahulu")
            return
        }
        if (!liters || Number(liters) <= 0) {
            toast.error("Volume liter wajib diisi lebih dari 0")
            return
        }
        if (currentMeterVal === null) {
            toast.error(`Angka ${meterType} saat pengisian wajib diisi`)
            return
        }

        const litersNum = Number(liters)
        const costPerLiterNum = costPerLiter ? Number(costPerLiter) : 0
        const totalCostNum = totalCost ? Number(totalCost) : (litersNum * costPerLiterNum)

        startTransition(async () => {
            try {
                await addVehicleFuelLog({
                    date,
                    locationId: selectedLocationId,
                    vehicleId: selectedVehicleId,
                    driverId: selectedDriverId || undefined,
                    driver_name: customDriverName.trim() || undefined,
                    meter_type: meterType,
                    current_meter: currentMeterVal,
                    is_meter_reset: false,
                    liters: litersNum,
                    fuel_source: "NON_RBL",
                    cost_per_liter: costPerLiterNum,
                    total_cost: totalCostNum,
                    receipt_no: receiptNo.trim() || undefined,
                    notes: notes.trim() || undefined,
                })
                toast.success("Data pengisian BBM Non-RBL berhasil dicatat!")
                resetForm()
                onOpenChange(false)
                onSuccess()
            } catch (err: any) {
                toast.error(err.message || "Gagal mencatat pengisian BBM")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[96vh] overflow-y-auto p-4 sm:p-5">
                <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                    <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <Fuel className="h-5 w-5 text-amber-600 shrink-0" />
                        <span>Catat Pengisian BBM Armada & Alat</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-1 text-xs">
                    {/* BAGIAN 1: Unit & Waktu Pengisian */}
                    <div className="space-y-2.5 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Tanggal Pengisian *
                                </Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-slate-900"
                                />
                            </div>

                            {isCorporate ? (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Cabang / Plant *
                                    </Label>
                                    <Select
                                        value={selectedLocationId}
                                        onValueChange={(val) => {
                                            setSelectedLocationId(val)
                                            setSelectedVehicleId("")
                                            setLastMeter(null)
                                            setLastMeterSource("")
                                            setLastMeterDate("")
                                        }}
                                    >
                                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 font-medium">
                                            <SelectValue placeholder="Pilih Cabang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map((loc) => (
                                                <SelectItem key={loc.id} value={loc.id}>
                                                    {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Status Operasional
                                    </Label>
                                    <div className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center text-xs text-slate-600 font-medium">
                                        Siap Operasi (Batching Plant)
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Pilih Kendaraan / Alat Berat *
                            </Label>
                            <Select value={selectedVehicleId} onValueChange={handleSelectVehicle}>
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 font-medium">
                                    <SelectValue placeholder="-- Pilih Unit Armada / Truk Mixer / Alat --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableVehicles.map((v) => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.code ? `[${v.code}] ` : ""}{v.plate_number} {v.merk_model ? `(${v.merk_model})` : ""} - {v.meter_type || "KM"}
                                            {v.lastMeter ? ` • Odo: ${v.lastMeter.toLocaleString("id-ID")} ${v.meter_type || "KM"}` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* BAGIAN 2: Odometer (HM / KM) */}
                    <FuelMeterSection
                        meterType={meterType}
                        currentMeter={currentMeter}
                        onCurrentMeterChange={setCurrentMeter}
                        lastMeter={lastMeter}
                        lastMeterSource={lastMeterSource}
                        lastMeterDate={lastMeterDate}
                        hasSelectedVehicle={Boolean(selectedVehicleId)}
                        isBackdateMeter={isBackdateMeter}
                        isSpikeMeter={isSpikeMeter}
                        meterDiff={meterDiff}
                        currentMeterVal={currentMeterVal}
                    />

                    {/* BAGIAN 3: Konsumsi & Harga BBM (Strictly Non-RBL) */}
                    <FuelPricingSection
                        liters={liters}
                        onLitersChange={handleLitersChange}
                        costPerLiter={costPerLiter}
                        onCostPerLiterChange={handleCostPerLiterChange}
                        totalCost={totalCost}
                        onTotalCostChange={setTotalCost}
                    />

                    {/* BAGIAN 4: Pengemudi & Bukti Transaksi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Driver / Operator
                            </Label>
                            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                                    <SelectValue placeholder="-- Pilih Driver / Operator --" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MANUAL">Ketik Nama Manual</SelectItem>
                                    {availableDrivers.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.name} {d.position ? `(${d.position})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                No Bon / Struk / DO Solar
                            </Label>
                            <Input
                                placeholder="Contoh: SPBU-1234 atau DO-SOLAR-09"
                                value={receiptNo}
                                onChange={(e) => setReceiptNo(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>
                    </div>

                    {selectedDriverId === "MANUAL" && (
                        <div className="space-y-1">
                            <Label className="text-[11px] text-slate-600">Ketik Nama Lengkap Pengemudi</Label>
                            <Input
                                placeholder="Nama pengemudi / operator"
                                value={customDriverName}
                                onChange={(e) => setCustomDriverName(e.target.value)}
                                className="h-8 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>
                    )}

                    {/* Catatan Tambahan */}
                    <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">
                            Catatan / Rute (opsional)
                        </Label>
                        <Input
                            placeholder="Catatan keperluan, rute pengiriman, atau keterangan BBM"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-slate-900"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-9 text-xs px-4"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="h-9 text-xs px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-xs"
                    >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        <span>Simpan Catatan BBM</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
