"use client"

import { useEffect, useState, useTransition } from "react"
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
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Mountain, ShoppingCart, Truck, Calendar, MapPin, Layers, Coins, Tag } from "lucide-react"
import { createAggregateIncoming, updateAggregateIncoming, getEffectiveAggregatePrice, getCustomMaterialsList } from "./actions"
import { AggregateInRow, AGGREGATE_TYPE_OPTIONS } from "./columns"
import { cn } from "@/lib/utils"

type Props = {
    isOpen: boolean
    initialData: AggregateInRow | null
    locations: { id: string; name: string }[]
    vehicles?: any[]
    drivers?: any[]
    retaseSettings?: any[]
    userRole: string
    userLocationId?: string | null
    onSuccess: () => void
    onCancel: () => void
}

export function MaterialAgregatForm({
    isOpen,
    initialData,
    locations,
    vehicles = [],
    drivers = [],
    retaseSettings = [],
    userRole,
    userLocationId,
    onSuccess,
    onCancel,
}: Props) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [sourceType, setSourceType] = useState<string>("Internal")

    // Helper to determine initial location: initialData -> userLocationId -> location with vehicles -> first location
    const getDefaultLocation = () => {
        if (initialData?.locationId) return initialData.locationId
        if (userLocationId && locations.some(l => l.id === userLocationId)) return userLocationId
        const locWithVehicles = locations.find(l => vehicles.some(v => v.locationId === l.id))
        if (locWithVehicles) return locWithVehicles.id
        return locations[0]?.id || ""
    }

    // Location
    const [selectedLocationId, setSelectedLocationId] = useState<string>(getDefaultLocation())

    // Controlled Material Type & Transaction Date (triggers dynamic master price lookup)
    const [aggregateType, setAggregateType] = useState<string>(initialData?.aggregate_type ?? "SplitHalfOne")
    const [customMaterialName, setCustomMaterialName] = useState<string>(initialData?.custom_material_name || "")
    const [customMaterialList, setCustomMaterialList] = useState<{ id: string; name: string; code: string }[]>([])
    const [transactionDate, setTransactionDate] = useState<string>(
        initialData?.date 
            ? (initialData.date.includes("T") ? initialData.date.split("T")[0] : initialData.date)
            : new Date().toISOString().split("T")[0]
    )

    // Master Material Pricing per m³
    const [unitPrice, setUnitPrice] = useState<string>(
        initialData?.unit_price != null && initialData.unit_price > 0 ? String(initialData.unit_price) : ""
    )
    const [isManualPrice, setIsManualPrice] = useState<boolean>(
        initialData?.unit_price != null && initialData.unit_price > 0
    )
    const [masterPriceInfo, setMasterPriceInfo] = useState<{
        unitPrice: number
        effectiveDate: string | null
        materialCode: string | null
        matchedLocationName: string
        notes: string | null
        isHistorical?: boolean
    } | null>(null)
    const [isFetchingPrice, setIsFetchingPrice] = useState<boolean>(false)

    // Dump Truck internal configuration state
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialData?.vehicleId || "")
    const [selectedDriverId, setSelectedDriverId] = useState<string>(initialData?.driverId || "")
    const [driverName, setDriverName] = useState<string>(initialData?.driver_name || "")
    const [plateNumber, setPlateNumber] = useState<string>(initialData?.plate_number || "")
    const [dumpTruckSize, setDumpTruckSize] = useState<"BESAR" | "KECIL">(
        (initialData?.dump_truck_size as "BESAR" | "KECIL") || "BESAR"
    )
    const [specCapacity, setSpecCapacity] = useState<number | null>(null)
    const [volumeCubic, setVolumeCubic] = useState<string>(
        initialData?.volume_cubic != null ? String(initialData.volume_cubic) : ""
    )
    const [distanceKm, setDistanceKm] = useState<string>(
        initialData?.distance_km != null ? String(initialData.distance_km) : ""
    )

    // Reset or populate on open
    useEffect(() => {
        if (isOpen) {
            setError(null)
            const src = initialData?.source_type ?? "Internal"
            setSourceType(src)

            const locId = getDefaultLocation()
            setSelectedLocationId(locId)

            const curType = initialData?.aggregate_type ?? "SplitHalfOne"
            setAggregateType(curType)
            setCustomMaterialName(initialData?.custom_material_name || "")

            // Fetch custom materials for autocomplete
            getCustomMaterialsList().then(list => {
                setCustomMaterialList(list as any)
            }).catch(console.error)

            const curDate = initialData?.date 
                ? (initialData.date.includes("T") ? initialData.date.split("T")[0] : initialData.date)
                : new Date().toISOString().split("T")[0]
            setTransactionDate(curDate)

            if (initialData?.unit_price != null && initialData.unit_price > 0) {
                setUnitPrice(String(initialData.unit_price))
                setIsManualPrice(true)
            } else {
                setUnitPrice("")
                setIsManualPrice(false)
            }

            const initVehicleId = initialData?.vehicleId || (initialData?.plate_number ? vehicles.find(v => v.plate_number?.toLowerCase() === initialData.plate_number?.toLowerCase())?.id : "") || ""
            const initDriverId = initialData?.driverId || (initialData?.driver_name ? drivers.find(d => d.name?.toLowerCase() === initialData.driver_name?.toLowerCase())?.id : "") || ""
            setSelectedVehicleId(initVehicleId)
            setSelectedDriverId(initDriverId)
            setDriverName(initialData?.driver_name || "")
            setPlateNumber(initialData?.plate_number || "")
            setDumpTruckSize((initialData?.dump_truck_size as "BESAR" | "KECIL") || "BESAR")
            setVolumeCubic(initialData?.volume_cubic != null ? String(initialData.volume_cubic) : "")

            const branchSetting = retaseSettings.find((s: any) => s.locationId === locId)
            if (initialData?.distance_km != null) {
                setDistanceKm(String(initialData.distance_km))
            } else if (branchSetting?.default_distance_km) {
                setDistanceKm(String(branchSetting.default_distance_km))
            } else {
                setDistanceKm("")
            }
        }
    }, [isOpen, initialData, locations, retaseSettings, userLocationId, vehicles])

    // Dynamic Master Material Price Lookup whenever material, custom name, date, or branch changes
    useEffect(() => {
        let isMounted = true
        async function fetchPrice() {
            if (!isOpen) return
            if (aggregateType === "Semen") {
                setMasterPriceInfo(null)
                return
            }
            setIsFetchingPrice(true)
            try {
                const res = await getEffectiveAggregatePrice(
                    aggregateType,
                    transactionDate,
                    selectedLocationId,
                    aggregateType === "Other" ? customMaterialName : undefined
                )
                if (isMounted) {
                    setMasterPriceInfo(res)
                    // If user has not manually overridden the price or price was empty, auto-fill with master price
                    if (!isManualPrice || !unitPrice || unitPrice === "0") {
                        if (res.unitPrice > 0) {
                            setUnitPrice(String(res.unitPrice))
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch effective price", err)
            } finally {
                if (isMounted) setIsFetchingPrice(false)
            }
        }

        fetchPrice()
        return () => {
            isMounted = false
        }
    }, [isOpen, aggregateType, customMaterialName, transactionDate, selectedLocationId])

    // When location changes, update default distance if distance is currently empty or matching old default
    const handleLocationChange = (locId: string) => {
        setSelectedLocationId(locId)
        const branchSetting = retaseSettings.find((s: any) => s.locationId === locId)
        if (branchSetting?.default_distance_km && (!distanceKm || distanceKm === "0")) {
            setDistanceKm(String(branchSetting.default_distance_km))
        }
    }

    // When vehicle is chosen
    const handleVehicleChange = (vId: string) => {
        setSelectedVehicleId(vId)
        const v = vehicles.find((item: any) => item.id === vId)
        if (v) {
            setPlateNumber(v.plate_number || "")
            if (v.dump_truck_size) {
                setDumpTruckSize(v.dump_truck_size)
            }
            setSpecCapacity(v.capacity_cubic || null)
            if (v.locationId && v.locationId !== selectedLocationId) {
                const curLoc = locations.find(l => l.id === selectedLocationId)
                if (!selectedLocationId || curLoc?.name?.toLowerCase().includes("head office")) {
                    handleLocationChange(v.locationId)
                }
            }
        }
    }

    // When driver is chosen
    const handleDriverChange = (dId: string) => {
        setSelectedDriverId(dId)
        const d = drivers.find((item: any) => item.id === dId)
        if (d) {
            setDriverName(d.name)
        }
    }

    // Sort all vehicles: matching selected location first, then alphabetical by code
    const sortedVehicles = [...vehicles].sort((a, b) => {
        const aMatch = a.locationId === selectedLocationId ? 1 : 0
        const bMatch = b.locationId === selectedLocationId ? 1 : 0
        if (aMatch !== bMatch) return bMatch - aMatch
        return (a.code || "").localeCompare(b.code || "")
    })

    // Active Retase Setting for current branch
    const activeSetting = retaseSettings.find((s: any) => s.locationId === selectedLocationId)
    const unitRate = activeSetting
        ? (dumpTruckSize === "BESAR" ? activeSetting.price_dt_besar : activeSetting.price_dt_kecil) || 0
        : 0

    const dist = parseFloat(distanceKm) || 0
    const vol = parseFloat(volumeCubic) || 0
    const calculatedRetase = Math.round(unitRate * dist * vol)

    const matUnitPriceNum = parseFloat(unitPrice) || (masterPriceInfo?.unitPrice ?? 0)
    const calculatedMaterialTotal = Math.round(vol * matUnitPriceNum)
    const grandTotalEstimatedExpense = calculatedMaterialTotal + (sourceType === "Internal" ? calculatedRetase : 0)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        const form = e.currentTarget
        const formData = new FormData(form)

        if (aggregateType === "Other" && !customMaterialName.trim()) {
            setError("Silakan isi nama material khusus terlebih dahulu")
            return
        }

        formData.set("locationId", selectedLocationId)
        formData.set("source_type", sourceType)
        formData.set("volume_cubic", volumeCubic)
        formData.set("date", transactionDate)
        formData.set("aggregate_type", aggregateType)
        if (customMaterialName.trim()) {
            formData.set("custom_material_name", customMaterialName.trim())
        }
        formData.set("unit_price", String(matUnitPriceNum))
        formData.set("total_price", String(calculatedMaterialTotal))

        if (sourceType === "Internal") {
            if (!selectedVehicleId) {
                setError("Silakan pilih armada Dump Truck internal terlebih dahulu")
                return
            }
            const selVehicle = vehicles.find((v: any) => v.id === selectedVehicleId)
            const finalPlate = selVehicle?.plate_number || plateNumber
            if (!finalPlate) {
                setError("Plat nomor kendaraan tidak ditemukan pada armada terpilih")
                return
            }

            if (!selectedDriverId && !driverName) {
                setError("Silakan pilih sopir internal terlebih dahulu")
                return
            }
            const selDriver = drivers.find((d: any) => d.id === selectedDriverId)
            const finalDriver = selDriver?.name || driverName

            formData.set("vehicleId", selectedVehicleId)
            if (selectedDriverId) formData.set("driverId", selectedDriverId)
            formData.set("driver_name", finalDriver)
            formData.set("plate_number", finalPlate)
            formData.set("dump_truck_size", dumpTruckSize)
            formData.set("distance_km", distanceKm)
            formData.set("rate_price", String(unitRate))
            formData.set("retase_amount", String(calculatedRetase))
        } else {
            if (!driverName.trim()) {
                setError("Nama sopir pengantar vendor wajib diisi")
                return
            }
            if (!plateNumber.trim()) {
                setError("Plat nomor kendaraan vendor wajib diisi")
                return
            }
            formData.set("driver_name", driverName.trim())
            formData.set("plate_number", plateNumber.trim().toUpperCase())
        }

        startTransition(async () => {
            const result = initialData
                ? await updateAggregateIncoming(initialData.id, formData)
                : await createAggregateIncoming(formData)

            if (result?.error) {
                setError(result.error)
            } else {
                onSuccess()
            }
        })
    }

    const isEdit = !!initialData

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="pb-3 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                                <Truck className="h-5 w-5" />
                            </div>
                            <span>{isEdit ? "Edit Penerimaan Material Agregat" : "Input Penerimaan Material Agregat Masuk"}</span>
                        </DialogTitle>
                        {sourceType === "Internal" ? (
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 font-semibold">
                                ⛰️ Pengambilan Quarry Internal
                            </Badge>
                        ) : (
                            <Badge className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 font-semibold">
                                🛒 Pembelian Eksternal Vendor
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="overflow-y-auto py-4 px-1 space-y-5 flex-1">
                        {/* ── ROW 1: Data Pokok Transaksi ── */}
                        <div className={`grid gap-4 ${locations.length > 1 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
                            {/* Cabang — Multi-branch or SuperAdmin */}
                            {locations.length > 1 && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Cabang Pangkalan *</span>
                                    </Label>
                                    <Select
                                        value={selectedLocationId}
                                        onValueChange={handleLocationChange}
                                        disabled={userRole !== "SuperAdminBP" && locations.length <= 1}
                                    >
                                        <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 font-medium">
                                            <SelectValue placeholder="Pilih cabang..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map((loc) => (
                                                <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                                    📍 {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Tanggal */}
                            <div className="space-y-1.5">
                                <Label htmlFor="date" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Tanggal Transaksi *</span>
                                </Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    value={transactionDate}
                                    onChange={(e) => setTransactionDate(e.target.value)}
                                    required
                                    className="h-9 text-xs bg-slate-50 font-medium"
                                />
                            </div>

                            {/* Jenis Material */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Jenis Material Agregat *</span>
                                </Label>
                                <Select
                                    name="aggregate_type"
                                    value={aggregateType}
                                    onValueChange={(val) => {
                                        setAggregateType(val)
                                        setIsManualPrice(false)
                                    }}
                                >
                                    <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 font-medium">
                                        <SelectValue placeholder="Pilih jenis material..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AGGREGATE_TYPE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Free text custom material input when Other is selected */}
                            {aggregateType === "Other" && (
                                <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 col-span-full">
                                    <Label htmlFor="custom_material_name" className="text-xs font-semibold text-amber-900 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Nama Material Khusus / Bebas *</span>
                                        </span>
                                        <span className="text-[10px] text-amber-700 font-normal">
                                            Ketik nama baru atau pilih material yang sudah ada
                                        </span>
                                    </Label>
                                    <Input
                                        id="custom_material_name"
                                        name="custom_material_name"
                                        list="custom-materials-datalist"
                                        placeholder="Contoh: Sirtu Ayak, Base Course A, Batu Belah..."
                                        value={customMaterialName}
                                        onChange={(e) => {
                                            setCustomMaterialName(e.target.value)
                                            setIsManualPrice(false)
                                        }}
                                        required
                                        className="h-9 text-xs bg-white border-amber-300 font-medium"
                                    />
                                    <datalist id="custom-materials-datalist">
                                        {customMaterialList.map((m) => (
                                            <option key={m.id} value={m.name}>
                                                {m.name} ({m.code})
                                            </option>
                                        ))}
                                    </datalist>
                                    <p className="text-[11px] text-amber-700/90">
                                        💡 Material ini otomatis tersimpan ke Master Material & harga satuan cabang ini.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ── ROW 2: Sumber Pengambilan Material ── */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-700">Sumber Pengambilan Material *</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div
                                    onClick={() => setSourceType("Internal")}
                                    className={cn(
                                        "flex items-center gap-3.5 rounded-xl border-2 p-3.5 cursor-pointer transition-all",
                                        sourceType === "Internal"
                                            ? "border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500"
                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2.5 rounded-lg shrink-0",
                                        sourceType === "Internal" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                                    )}>
                                        <Mountain className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">Internal (Quarry Sendiri)</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Armada Dump Truck PT. Rajawali dengan komisi retase</div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => setSourceType("External")}
                                    className={cn(
                                        "flex items-center gap-3.5 rounded-xl border-2 p-3.5 cursor-pointer transition-all",
                                        sourceType === "External"
                                            ? "border-amber-500 bg-amber-50/80 shadow-xs ring-1 ring-amber-500"
                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2.5 rounded-lg shrink-0",
                                        sourceType === "External" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-500"
                                    )}>
                                        <ShoppingCart className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">Eksternal (Pembelian Luar)</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Pengiriman oleh vendor / supplier pihak ketiga</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── ROW 3: No Bon & Volume Kubikasi Riil ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="no_bon" className="text-xs font-semibold text-slate-700">
                                    No. Bon / Surat Jalan / DO *
                                </Label>
                                <Input
                                    id="no_bon"
                                    name="no_bon"
                                    placeholder="Nomor surat jalan / tiket timbangan"
                                    defaultValue={initialData?.no_bon ?? ""}
                                    required
                                    className="h-9 text-xs font-mono font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="volume_cubic" className="text-xs font-semibold text-slate-700">
                                        Volume Kubikasi Riil (m³) *
                                    </Label>
                                    {specCapacity && (
                                        <Badge variant="outline" className="text-[10px] text-slate-500 font-normal">
                                            Kapasitas bak acuan: {specCapacity} m³
                                        </Badge>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        id="volume_cubic"
                                        name="volume_cubic"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="Contoh: 8.5"
                                        value={volumeCubic}
                                        onChange={e => setVolumeCubic(e.target.value)}
                                        required
                                        className="h-9 text-xs font-bold font-mono pr-10"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">m³</span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Diinput manual berdasarkan kuantitas muatan riil yang diterima (bisa berbeda dari kapasitas bak).
                                </p>
                            </div>
                        </div>

                        {/* ── ROW 3.5: Estimasi Nilai Beban Pokok Material (Master Material) ── */}
                        <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-sky-950 uppercase tracking-wide">
                                    <Coins className="h-4 w-4 text-sky-600" />
                                    <span>Kalkulasi Beban Pokok Material Masuk (Master Harga)</span>
                                </div>
                                {masterPriceInfo && masterPriceInfo.unitPrice > 0 ? (
                                    <Badge className="bg-sky-600 text-white text-[10px] font-semibold">
                                        ✓ Acuan Master Terhubung
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] text-slate-500 bg-white">
                                        Harga Mandiri / Manual
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                {/* Input Harga Satuan */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="unit_price" className="text-xs font-semibold text-sky-950">
                                            Harga Satuan Material (Rp / m³) *
                                        </Label>
                                        {masterPriceInfo && masterPriceInfo.unitPrice > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUnitPrice(String(masterPriceInfo.unitPrice))
                                                    setIsManualPrice(false)
                                                }}
                                                className="text-[11px] text-sky-700 hover:text-sky-900 underline font-semibold cursor-pointer"
                                                title="Reset ke harga master acuan sesuai tanggal transaksi"
                                            >
                                                Gunakan Master: Rp {masterPriceInfo.unitPrice.toLocaleString("id-ID")}
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                                        <Input
                                            id="unit_price"
                                            name="unit_price"
                                            type="number"
                                            min="0"
                                            step="500"
                                            placeholder="Contoh: 185000"
                                            value={unitPrice}
                                            onChange={(e) => {
                                                setUnitPrice(e.target.value)
                                                setIsManualPrice(true)
                                            }}
                                            required
                                            className="h-9 text-xs font-mono font-bold pl-9 pr-14 bg-white border-sky-300"
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">/ m³</span>
                                    </div>
                                    {masterPriceInfo && masterPriceInfo.unitPrice > 0 ? (
                                        <div className="flex items-center gap-1.5 text-[11px] text-sky-800 flex-wrap">
                                            <span>Acuan Master: <strong className="font-mono">Rp {masterPriceInfo.unitPrice.toLocaleString("id-ID")}/m³</strong></span>
                                            {masterPriceInfo.matchedLocationName && (
                                                <Badge variant="outline" className="text-[10px] border-sky-300 text-sky-700 bg-sky-100/50 py-0">
                                                    📍 {masterPriceInfo.matchedLocationName}
                                                </Badge>
                                            )}
                                            {masterPriceInfo.effectiveDate && (
                                                <span className="text-slate-500">
                                                    (sejak {new Date(masterPriceInfo.effectiveDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})
                                                </span>
                                            )}
                                            {isManualPrice && (
                                                <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 text-[9px] px-1 py-0 font-medium">
                                                    Disesuaikan
                                                </Badge>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-500">
                                            {aggregateType === "Semen" 
                                                ? "Material semen tidak menggunakan master harga agregat per m³."
                                                : isFetchingPrice ? "Memeriksa harga acuan master..." : "Belum ada acuan master harga untuk tanggal ini."}
                                        </p>
                                    )}
                                </div>

                                {/* Subtotal Nilai Material */}
                                <div className="p-3 bg-white border border-sky-200 rounded-lg flex flex-col justify-center">
                                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                        Subtotal Nilai Material:
                                    </span>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                        <span className="text-lg font-black font-mono text-sky-950">
                                            Rp {calculatedMaterialTotal.toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                                        <span>
                                            {vol > 0 && matUnitPriceNum > 0
                                                ? `(${vol} m³ × Rp ${matUnitPriceNum.toLocaleString("id-ID")})`
                                                : "Menunggu volume riil & harga"}
                                        </span>
                                        {sourceType === "Internal" && calculatedRetase > 0 && (
                                            <span className="text-emerald-700 font-medium">
                                                + Retase: Rp {calculatedRetase.toLocaleString("id-ID")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── ROW 4: PANEL INTERNAL QUARRY ── */}
                        {sourceType === "Internal" && (
                            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-wide">
                                        <Truck className="h-4 w-4 text-emerald-600" />
                                        <span>Konfigurasi Armada Dump Truck & Retase Supir</span>
                                    </div>
                                    <Badge className="bg-emerald-600 text-white text-[10px]">Internal BP</Badge>
                                </div>

                                {/* Row 1: Armada & Ukuran */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-emerald-950">
                                            Pilih Armada Dump Truck *
                                        </Label>
                                        <Select value={selectedVehicleId} onValueChange={handleVehicleChange}>
                                            <SelectTrigger className="h-9 text-xs bg-white border-emerald-300">
                                                <SelectValue placeholder="Pilih armada DT..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-56">
                                                {sortedVehicles.map((v: any) => (
                                                    <SelectItem key={v.id} value={v.id} className="text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold font-mono text-slate-900">{v.code}</span>
                                                            <span className="text-slate-500 font-mono">({v.plate_number})</span>
                                                            {v.location && (
                                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-medium">
                                                                    📍 {v.location.name}
                                                                </span>
                                                            )}
                                                            <span className={cn(
                                                                "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                                                                v.dump_truck_size === "KECIL" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                                                            )}>
                                                                {v.dump_truck_size === "KECIL" ? "DT Kecil" : "DT Besar"}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-emerald-950">
                                            Klasifikasi Ukuran DT *
                                        </Label>
                                        <Select
                                            value={dumpTruckSize}
                                            onValueChange={(val: "BESAR" | "KECIL") => setDumpTruckSize(val)}
                                        >
                                            <SelectTrigger className="h-9 text-xs bg-white border-emerald-300 font-medium">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BESAR" className="text-xs font-semibold">
                                                    🚛 DT Besar (Tronton / 10 Roda)
                                                </SelectItem>
                                                <SelectItem value="KECIL" className="text-xs font-semibold">
                                                    🚚 DT Kecil (Engkel / 6 Roda)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Row 2: Sopir & Jarak Tempuh */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-emerald-950">
                                            Pilih Sopir Internal
                                        </Label>
                                        <Select value={selectedDriverId} onValueChange={handleDriverChange}>
                                            <SelectTrigger className="h-9 text-xs bg-white border-emerald-300">
                                                <SelectValue placeholder="Pilih sopir..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-56">
                                                {drivers.map((d: any) => (
                                                    <SelectItem key={d.id} value={d.id} className="text-xs">
                                                        👤 {d.name} {d.position ? `(${d.position})` : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold text-emerald-950">
                                                Jarak Tempuh Quarry (KM) *
                                            </Label>
                                            {activeSetting?.default_distance_km > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDistanceKm(String(activeSetting.default_distance_km))}
                                                    className="text-[11px] text-emerald-700 hover:text-emerald-900 underline cursor-pointer font-semibold"
                                                    title="Gunakan jarak default rute cabang"
                                                >
                                                    Gunakan Default: {activeSetting.default_distance_km} KM
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                placeholder="Contoh: 25"
                                                value={distanceKm}
                                                onChange={e => setDistanceKm(e.target.value)}
                                                required
                                                className="h-9 text-xs bg-white border-emerald-300 font-mono font-bold pr-10"
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">KM</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Ringkas Kendaraan & Sopir Terpilih (Otomatis dari Master Data) */}
                                {(plateNumber || driverName) && (
                                    <div className="flex items-center gap-3 pt-2.5 border-t border-emerald-200/70 text-xs text-emerald-900 font-medium">
                                        <span className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider">Terpilih:</span>
                                        {plateNumber && (
                                            <span>Plat Nomor: <strong className="font-mono font-bold text-emerald-950">{plateNumber}</strong></span>
                                        )}
                                        {driverName && (
                                            <span>• Sopir: <strong className="font-bold text-emerald-950">{driverName}</strong></span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── ROW 4: PANEL EKSTERNAL SUPPLIER ── */}
                        {sourceType === "External" && (
                            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-4">
                                <div className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                                    Informasi Supplier & Vendor Luar
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="supplier" className="text-xs font-semibold text-amber-950">
                                        Nama Supplier / Vendor Pengirim *
                                    </Label>
                                    <Input
                                        id="supplier"
                                        name="supplier"
                                        placeholder="Misal: CV Mitra Pasir Berkah"
                                        defaultValue={initialData?.supplier ?? ""}
                                        required={sourceType === "External"}
                                        className="h-9 text-xs bg-white border-amber-300"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="driver_name_ext" className="text-xs font-semibold text-slate-700">
                                            Nama Sopir Pengantar *
                                        </Label>
                                        <Input
                                            id="driver_name_ext"
                                            placeholder="Nama supir pengantar"
                                            value={driverName}
                                            onChange={e => setDriverName(e.target.value)}
                                            required
                                            className="h-9 text-xs bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="plate_number_ext" className="text-xs font-semibold text-slate-700">
                                            Plat Nomor Kendaraan *
                                        </Label>
                                        <Input
                                            id="plate_number_ext"
                                            placeholder="Contoh: B 1234 XY"
                                            value={plateNumber}
                                            onChange={e => setPlateNumber(e.target.value)}
                                            required
                                            className="h-9 text-xs uppercase font-mono bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── ROW 5: Catatan Tambahan ── */}
                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">
                                Catatan Tambahan (Opsional)
                            </Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Keterangan kondisi fisik material, asal quarry, atau catatan penerimaan lainnya..."
                                rows={2}
                                defaultValue={initialData?.notes ?? ""}
                                className="text-xs"
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5 font-medium">
                                ⚠️ {error}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onCancel}
                            disabled={isPending}
                            className="text-xs h-9 px-4 font-semibold"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isPending}
                            className="text-xs h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                        >
                            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                            <span>{isEdit ? "Simpan Perubahan" : "Simpan Penerimaan Material"}</span>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
