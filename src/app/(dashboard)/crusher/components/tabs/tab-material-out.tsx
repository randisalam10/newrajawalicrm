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
import {
    CrusherDailyReportData,
    LocationOption,
    VehicleOption,
    EmployeeOption,
    CrusherDestinationItem,
} from "../../types"
import { addCrusherMaterialOut, deleteCrusherMaterialOut, getCrusherDestinations } from "../../actions"
import { DestinationMasterDialog } from "../destination-master-dialog"
import { CrusherTruckSelector, CrusherDriverSelector, CrusherOperatorSelector } from "../crusher-selectors"
import { formatNumber, formatRupiah, CRUSHER_DEFAULT_MATERIALS } from "../../utils/crusher-helpers"
import { computeOperatorFee, isStoneFractionMaterial } from "@/lib/crusher-calc"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    Mountain,
    Plus,
    Trash2,
    Loader2,
    Factory,
    Store,
    Truck,
    CheckCircle2,
    Clock,
    Info,
    MapPin,
    HardHat,
} from "lucide-react"

type Props = {
    report: CrusherDailyReportData | null
    selectedDate?: string
    locationId?: string
    locations: LocationOption[]
    vehicles?: VehicleOption[]
    employees?: EmployeeOption[]
    destinations?: CrusherDestinationItem[]
    canViewWages?: boolean
    onRefresh: () => void
}

export function TabMaterialOut({
    report,
    selectedDate,
    locationId,
    locations,
    vehicles = [],
    employees = [],
    destinations = [],
    canViewWages = false,
    onRefresh,
}: Props) {
    const [isPending, startTransition] = useTransition()

    const [materialName, setMaterialName] = useState<string>(CRUSHER_DEFAULT_MATERIALS[0])
    const [volumeM3, setVolumeM3] = useState("")
    const [destinationType, setDestinationType] = useState<"BATCHING_PLANT" | "PENJUALAN_BEBAS">("BATCHING_PLANT")

    // Find Youtefa as default quick location if available
    const defaultTargetLoc = useMemo(() => {
        const youtefa = locations.find((l) => l.name.toLowerCase().includes("youtefa"))
        return youtefa?.id || locations[0]?.id || ""
    }, [locations])

    const [targetLocationId, setTargetLocationId] = useState<string>(defaultTargetLoc)

    const targetLocation = useMemo(() => {
        return locations.find((l) => l.id === targetLocationId) || null
    }, [locations, targetLocationId])

    // Master Destination Non-BP State
    const [destinationsList, setDestinationsList] = useState<CrusherDestinationItem[]>(destinations)
    const [selectedDestinationId, setSelectedDestinationId] = useState<string>("")
    const [customerName, setCustomerName] = useState("")
    const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false)

    // Sync destinations if prop changes or fetch if empty
    useEffect(() => {
        if (destinations && destinations.length > 0) {
            setDestinationsList(destinations)
        } else {
            getCrusherDestinations(locationId).then(setDestinationsList).catch(() => { })
        }
    }, [destinations, locationId])

    // Vehicle selection (Master or Manual)
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
    const [plateNumber, setPlateNumber] = useState("")
    const [isManualVehicle, setIsManualVehicle] = useState(false)
    const [manualPlateNumber, setManualPlateNumber] = useState("")
    const [dumpTruckSize, setDumpTruckSize] = useState<"BESAR" | "KECIL">("BESAR")

    // Driver selection (Master or Manual)
    const [driverId, setDriverId] = useState<string>("")
    const [driverName, setDriverName] = useState("")
    const [isManualDriver, setIsManualDriver] = useState(false)
    const [manualDriverName, setManualDriverName] = useState("")

    // Operator Crusher (Penerima Insentif Rp 5.000/m³ atas material batu keluar)
    const [operatorId, setOperatorId] = useState<string>("")
    const [operatorName, setOperatorName] = useState<string>("")

    // Retase distance & ritase fields
    const [distanceKm, setDistanceKm] = useState("0")
    const [ritase, setRitase] = useState("1")
    const [notes, setNotes] = useState("")

    // Filter drivers, operators, and dump trucks from master data
    const drivers = useMemo(() => {
        return employees.filter((e) => {
            const pos = (e.position || "").toLowerCase()
            return pos.includes("sopir") || pos.includes("driver")
        })
    }, [employees])
    const operators = useMemo(() => {
        return employees.filter((e) => (e.position || "").toLowerCase().includes("operator"))
    }, [employees])
    const dumpTruckVehicles = useMemo(() => {
        const filtered = vehicles.filter((v) => {
            const cat = (v.categoryName || "").toLowerCase()
            return Boolean(v.dump_truck_size) || cat.includes("truck") || cat.includes("dump")
        })
        return filtered.length > 0 ? filtered : vehicles.filter((v) => Boolean(v.plate_number))
    }, [vehicles])

    // Auto set default operator crusher jika belum dipilih
    useEffect(() => {
        if (!operatorId && operators.length > 0) {
            setOperatorId(operators[0].id)
            setOperatorName(operators[0].name)
        }
    }, [operators, operatorId])

    const isStoneFraction = useMemo(() => isStoneFractionMaterial(materialName), [materialName])

    const parsedVolume = parseFloat(volumeM3.replace(",", ".")) || 0
    const parsedDistance = parseFloat(distanceKm.replace(",", ".")) || 0
    const parsedRitase = parseInt(ritase, 10) || 1
    // B1: gunakan fungsi insentif terpusat (hanya pecahan batu) agar konsisten dengan server.
    const operatorFee = computeOperatorFee(materialName, parsedVolume)

    const handleSelectVehicle = (vId: string) => {
        if (!vId) {
            setSelectedVehicleId("")
            setPlateNumber("")
            return
        }
        if (vId === "MANUAL") {
            setIsManualVehicle(true)
            setSelectedVehicleId("")
            setPlateNumber("")
            return
        }
        const v = vehicles.find((item) => item.id === vId)
        if (!v) return

        setIsManualVehicle(false)
        setSelectedVehicleId(v.id)
        setPlateNumber(v.plate_number)
        const size = (v.dump_truck_size as "BESAR" | "KECIL") || "BESAR"
        setDumpTruckSize(size)
    }

    const handleSelectDriver = (dId: string) => {
        if (dId === "MANUAL") {
            setIsManualDriver(true)
            setDriverId("")
            setDriverName("")
            return
        }
        setIsManualDriver(false)
        setDriverId(dId)
        const d = employees.find((item) => item.id === dId)
        if (d) setDriverName(d.name)
    }

    const handleSelectDestination = (destId: string) => {
        setSelectedDestinationId(destId)
        if (!destId || destId === "MANUAL") return
        const d = destinationsList.find((item) => item.id === destId)
        if (d) {
            setCustomerName(d.name)
            setDistanceKm(String(d.distance_km ?? 0))
        }
    }

    const handleDestinationAdded = (newDest: CrusherDestinationItem) => {
        setDestinationsList((prev) => [newDest, ...prev])
        setSelectedDestinationId(newDest.id)
        setCustomerName(newDest.name)
        setDistanceKm(String(newDest.distance_km ?? 0))
    }

    const handleAdd = () => {
        if (!volumeM3 || Number(volumeM3) <= 0) {
            toast.error("Volume material (m³) wajib diisi lebih dari 0")
            return
        }
        if (destinationType === "BATCHING_PLANT" && !targetLocationId) {
            toast.error("Pilih Batching Plant tujuan")
            return
        }
        if (destinationType === "PENJUALAN_BEBAS" && !customerName.trim()) {
            toast.error("Nama pembeli / tujuan proyek non-BP wajib diisi")
            return
        }

        const finalPlate = isManualVehicle ? manualPlateNumber.trim().toUpperCase() : plateNumber.trim()
        const finalDriver = isManualDriver ? manualDriverName.trim() : driverName.trim()
        const finalVehicleId = isManualVehicle ? undefined : (selectedVehicleId || undefined)
        const finalDriverId = isManualDriver ? undefined : (driverId || undefined)

        startTransition(async () => {
            try {
                const targetDate = selectedDate || report?.date || new Date().toISOString().split("T")[0]
                const targetLoc = locationId || report?.locationId
                await addCrusherMaterialOut(report?.id || { date: targetDate, locationId: targetLoc }, {
                    material_name: materialName,
                    volume_m3: Number(volumeM3),
                    vehicleId: finalVehicleId,
                    plate_number: finalPlate || undefined,
                    driverId: finalDriverId,
                    driver_name: finalDriver || undefined,
                    operatorId: operatorId || undefined,
                    operator_name: operatorName || undefined,
                    operator_rate: 5000,
                    dump_truck_size: dumpTruckSize,
                    ritase: parsedRitase,
                    distance_km: parsedDistance,
                    destination_type: destinationType,
                    destinationId: selectedDestinationId && selectedDestinationId !== "MANUAL" ? selectedDestinationId : undefined,
                    targetLocationId: destinationType === "BATCHING_PLANT" ? targetLocationId : undefined,
                    customer_name: destinationType === "PENJUALAN_BEBAS" ? customerName.trim() : undefined,
                    unit_price: 0,
                    total_price: 0,
                    payment_method: "TEMPO",
                    payment_status: "PENDING_HO",
                    notes: notes.trim() || undefined,
                })
                toast.success(`${materialName} (${volumeM3} m³) berhasil dicatat`)
                setVolumeM3("")
                setCustomerName("")
                setSelectedDestinationId("")
                setManualPlateNumber("")
                setManualDriverName("")
                setNotes("")
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal mencatat material keluar")
            }
        })
    }

    const handleDelete = (id: string, mat: string) => {
        startTransition(async () => {
            try {
                await deleteCrusherMaterialOut(id)
                toast.success(`Pengeluaran ${mat} dihapus`)
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal menghapus data")
            }
        })
    }

    const totalVolume = report?.materialsOut.reduce((acc, m) => acc + (m.volume_m3 ?? 0), 0) ?? 0

    return (
        <div className="space-y-4 w-full">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                        <Mountain className="h-4 w-4 text-emerald-600" />
                        <span>F. Material Keluar (Pengiriman & Penjualan)</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                        Total Keluar: <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">{formatNumber(totalVolume, 1)} m³</span>
                    </div>
                </div>

                {/* Tab Pilihan Tujuan: BP vs Penjualan Bebas */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setDestinationType("BATCHING_PLANT")}
                        className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${destinationType === "BATCHING_PLANT"
                            ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        <Factory className="h-3.5 w-3.5" />
                        Transfer ke Batching Plant
                    </button>
                    <button
                        type="button"
                        onClick={() => setDestinationType("PENJUALAN_BEBAS")}
                        className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${destinationType === "PENJUALAN_BEBAS"
                            ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        <Store className="h-3.5 w-3.5" />
                        Pengiriman Non BP
                    </button>
                </div>

                {/* Form Input Material Keluar */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Jenis Material *</Label>
                            <Select value={materialName} onValueChange={setMaterialName}>
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 font-semibold">
                                    <SelectValue placeholder="Pilih Material" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CRUSHER_DEFAULT_MATERIALS.map((m) => (
                                        <SelectItem key={m} value={m} className="text-xs">
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Volume Kubikasi (m³) *</Label>
                            <Input
                                type="number"
                                step="0.5"
                                inputMode="decimal"
                                placeholder="Contoh: 8.0"
                                value={volumeM3}
                                onChange={(e) => setVolumeM3(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900 font-bold text-emerald-700 dark:text-emerald-400"
                            />
                        </div>
                    </div>

                    {/* Jika Kirim ke Batching Plant */}
                    {destinationType === "BATCHING_PLANT" ? (
                        <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                            <Label className="text-xs font-medium flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                <Factory className="h-3.5 w-3.5 text-blue-600" />
                                Pilih Batching Plant Tujuan:
                            </Label>
                            <div className="flex flex-wrap items-center gap-2">
                                {locations.map((l) => {
                                    const isYoutefa = l.name.toLowerCase().includes("youtefa")
                                    const isSelected = targetLocationId === l.id
                                    return (
                                        <button
                                            key={l.id}
                                            type="button"
                                            onClick={() => setTargetLocationId(l.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isSelected
                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {isYoutefa ? "★ " : ""}{l.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Jika Pengiriman Non BP */
                        <div className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-slate-700">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                        Tujuan / Proyek Non-BP *
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => setIsDestinationModalOpen(true)}
                                        className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="h-3 w-3" />
                                        <span>+ Tambah Tujuan Baru</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <Select value={selectedDestinationId} onValueChange={handleSelectDestination}>
                                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 font-medium">
                                            <SelectValue placeholder="Pilih dari Master Tujuan..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MANUAL">Input Bebas / Manual</SelectItem>
                                            {destinationsList.map((d) => (
                                                <SelectItem key={d.id} value={d.id} className="text-xs">
                                                    {d.name} ({d.distance_km} KM)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        placeholder="Nama Pembeli / Proyek..."
                                        value={customerName}
                                        onChange={(e) => {
                                            setCustomerName(e.target.value)
                                            if (selectedDestinationId !== "MANUAL") setSelectedDestinationId("MANUAL")
                                        }}
                                        className="h-9 text-xs bg-white dark:bg-slate-900 font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Armada Pengangkut & Operator Crusher */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {/* Pilih Cepat Armada Truk Master */}
                        {!isManualVehicle && dumpTruckVehicles.length > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-medium text-slate-500">Pilih cepat armada truk (master)</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsManualVehicle(true)
                                            setSelectedVehicleId("")
                                            setPlateNumber("")
                                        }}
                                        className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                                    >
                                        + Input Plat Sendiri
                                    </button>
                                </div>
                                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap no-scrollbar">
                                    {dumpTruckVehicles.map((v) => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => handleSelectVehicle(v.id)}
                                            className={cn(
                                                "shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap transition-colors cursor-pointer",
                                                selectedVehicleId === v.id
                                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                                            )}
                                        >
                                            {v.plate_number}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Kolom 1: Truk Pengangkut */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Truk Pengangkut</Label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = !isManualVehicle
                                            setIsManualVehicle(next)
                                            if (next) {
                                                setSelectedVehicleId("")
                                                setPlateNumber("")
                                            } else {
                                                setManualPlateNumber("")
                                            }
                                        }}
                                        className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                    >
                                        {isManualVehicle ? "← Pilih dari Master" : "+ Plat Sendiri"}
                                    </button>
                                </div>

                                {isManualVehicle ? (
                                    <div className="space-y-1.5">
                                        <Input
                                            placeholder="Contoh: DS 9123 AB"
                                            value={manualPlateNumber}
                                            onChange={(e) => setManualPlateNumber(e.target.value.toUpperCase())}
                                            className="h-9 text-xs bg-white dark:bg-slate-900 font-bold uppercase"
                                        />
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-slate-500">Ukuran:</span>
                                            <button
                                                type="button"
                                                onClick={() => setDumpTruckSize("BESAR")}
                                                className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer",
                                                    dumpTruckSize === "BESAR"
                                                        ? "bg-slate-800 text-white border-slate-800"
                                                        : "bg-white text-slate-600 border-slate-200"
                                                )}
                                            >
                                                DT Besar (8 m³)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDumpTruckSize("KECIL")}
                                                className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer",
                                                    dumpTruckSize === "KECIL"
                                                        ? "bg-amber-600 text-white border-amber-600"
                                                        : "bg-white text-slate-600 border-slate-200"
                                                )}
                                            >
                                                DT Kecil (4 m³)
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <CrusherTruckSelector
                                        selectedVehicleId={selectedVehicleId}
                                        vehicles={dumpTruckVehicles}
                                        onSelectVehicle={(v) => {
                                            if (v) {
                                                handleSelectVehicle(v.id)
                                            } else {
                                                setSelectedVehicleId("")
                                                setPlateNumber("")
                                            }
                                        }}
                                        onManualToggle={(initPlate) => {
                                            setIsManualVehicle(true)
                                            setSelectedVehicleId("")
                                            setPlateNumber("")
                                            if (initPlate) setManualPlateNumber(initPlate)
                                        }}
                                    />
                                )}
                            </div>

                            {/* Kolom 2: Sopir Pengantar */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Sopir</Label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = !isManualDriver
                                            setIsManualDriver(next)
                                            if (next) {
                                                setDriverId("")
                                                setDriverName("")
                                            } else {
                                                setManualDriverName("")
                                            }
                                        }}
                                        className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                    >
                                        {isManualDriver ? "← Pilih dari Master" : "+ Nama Bebas"}
                                    </button>
                                </div>

                                {isManualDriver ? (
                                    <Input
                                        placeholder="Nama Sopir Luar..."
                                        value={manualDriverName}
                                        onChange={(e) => setManualDriverName(e.target.value)}
                                        className="h-9 text-xs bg-white dark:bg-slate-900"
                                    />
                                ) : (
                                    <CrusherDriverSelector
                                        selectedDriverId={driverId}
                                        drivers={drivers}
                                        targetLocationName={destinationType === "BATCHING_PLANT" ? targetLocation?.name : undefined}
                                        onSelectDriver={(d) => {
                                            if (d) {
                                                setIsManualDriver(false)
                                                setDriverId(d.id)
                                                setDriverName(d.name)
                                            } else {
                                                setDriverId("")
                                                setDriverName("")
                                            }
                                        }}
                                        onManualToggle={(initName) => {
                                            setIsManualDriver(true)
                                            setDriverId("")
                                            setDriverName("")
                                            if (initName) setManualDriverName(initName)
                                        }}
                                    />
                                )}
                            </div>

                            {/* Kolom 3: Operator Crusher */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                                        Operator Crusher
                                    </Label>
                                    {isStoneFraction && (
                                        <span className="text-[10px] text-emerald-600 font-bold">
                                            Rp 5.000/m³
                                        </span>
                                    )}
                                </div>
                                <CrusherOperatorSelector
                                    selectedOperatorId={operatorId}
                                    operators={operators}
                                    onSelectOperator={(op) => {
                                        if (op) {
                                            setOperatorId(op.id)
                                            setOperatorName(op.name)
                                        } else {
                                            setOperatorId("")
                                            setOperatorName("")
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Parameter Jarak Tempuh & Ritase untuk Pengiriman Non-BP (Informasi Rute) */}
                        {destinationType === "PENJUALAN_BEBAS" && (
                            <div className="p-2.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-emerald-600" />
                                        Estimasi Jarak Tempuh (KM)
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        value={distanceKm}
                                        onChange={(e) => setDistanceKm(e.target.value)}
                                        className="h-7 text-xs bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold">Jumlah Rit</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={ritase}
                                        onChange={(e) => setRitase(e.target.value)}
                                        className="h-7 text-xs bg-white dark:bg-slate-900 font-bold"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Kalkulasi Insentif Operator Crusher */}
                        {isStoneFraction && (
                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <HardHat className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>
                                        Insentif Operator Crusher ({operatorName || "Markus Kogoya"}):
                                    </span>
                                </div>
                                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                    {formatRupiah(operatorFee)} ({formatNumber(parsedVolume, 1)} m³ × Rp 5.000)
                                </span>
                            </div>
                        )}



                        <div className="space-y-1">
                            <Input
                                placeholder="Catatan / No Surat Jalan (opsional)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="h-8 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        onClick={handleAdd}
                        disabled={isPending}
                        className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                    >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Catat Material Keluar
                    </Button>
                </div>

                {/* List Material Keluar Hari Ini */}
                {report?.materialsOut && report.materialsOut.length > 0 && (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        {report.materialsOut.map((m) => (
                            <div key={m.id} className="p-3 flex items-center justify-between gap-2 text-xs">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-slate-900 dark:text-slate-100">{m.material_name}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900">
                                            {formatNumber(m.volume_m3, 1)} m³
                                        </span>
                                        {m.destination_type === "BATCHING_PLANT" ? (
                                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                                <Factory className="h-3 w-3" />
                                                BP: {m.targetLocationName || "Internal"}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                                <Store className="h-3 w-3" />
                                                {m.customer_name || m.destinationName || "Penjualan Bebas"} {m.distance_km ? `(${m.distance_km} KM)` : ""}
                                            </span>
                                        )}
                                        {/* Status Penerimaan di BP */}
                                        {m.destination_type === "BATCHING_PLANT" && (
                                            <span className={cn(
                                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border",
                                                m.receipt_status === "RECEIVED"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                            )}>
                                                {m.receipt_status === "RECEIVED" ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Factory className="h-3 w-3 text-blue-600" />}
                                                {m.receipt_status === "RECEIVED"
                                                    ? `Diterima di ${m.targetLocationName || "BP"}`
                                                    : `Terkirim ke ${m.targetLocationName || "BP"}`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                                        {m.plate_number && <span>Truk: <b>{m.plate_number}</b></span>}
                                        {m.driver_name && <span>Sopir: {m.driver_name}</span>}
                                        {canViewWages && m.retase_amount ? (
                                            <span className="text-amber-700 dark:text-amber-400 font-semibold">
                                                Retase: {formatRupiah(m.retase_amount)}
                                            </span>
                                        ) : null}
                                        {canViewWages && m.operator_fee ? (
                                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                                <HardHat className="h-3 w-3" />
                                                Insentif Op ({m.operator_name || "Operator"}): {formatRupiah(m.operator_fee)}
                                            </span>
                                        ) : null}
                                        {m.notes && <span>• {m.notes}</span>}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(m.id, m.material_name)}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 shrink-0"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Tambah Master Tujuan Baru (Inline Shortcut) */}
            <DestinationMasterDialog
                isOpen={isDestinationModalOpen}
                onClose={() => setIsDestinationModalOpen(false)}
                locationId={locationId}
                onDestinationAdded={handleDestinationAdded}
            />
        </div>
    )
}
