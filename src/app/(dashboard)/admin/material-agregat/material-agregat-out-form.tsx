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
import {
    PackageMinus,
    Truck,
    User,
    Calculator,
    Coins,
    DollarSign,
    MapPin,
    AlertCircle,
    Building2,
    Calendar,
    FileText,
} from "lucide-react"
import { createAggregateOutgoing, updateAggregateOutgoing, getEffectiveAggregatePrice } from "./actions"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
    AggregateOutRow,
    AGGREGATE_TYPE_OPTIONS,
    OUTGOING_CATEGORY_OPTIONS,
    OUTGOING_CATEGORY_LABELS,
} from "./columns"

type Props = {
    isOpen: boolean
    initialData: AggregateOutRow | null
    locations: { id: string; name: string }[]
    vehicles?: any[]
    drivers?: any[]
    retaseSettings?: any[]
    userRole: string
    userLocationId?: string | null
    onSuccess: () => void
    onCancel: () => void
}

export function MaterialAgregatOutForm({
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

    const getDefaultLocation = () => {
        if (initialData?.locationId) return initialData.locationId
        if (userLocationId && locations.some(l => l.id === userLocationId)) return userLocationId
        return locations[0]?.id || ""
    }

    const [selectedLocationId, setSelectedLocationId] = useState<string>(getDefaultLocation())
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0])
    const [noBon, setNoBon] = useState<string>("")
    const [aggregateType, setAggregateType] = useState<string>("SplitHalfOne")
    const [volumeCubic, setVolumeCubic] = useState<string>("")
    const [unit, setUnit] = useState<string>("m³")
    const [unitPrice, setUnitPrice] = useState<string>("")
    const [totalPrice, setTotalPrice] = useState<string>("")
    const [isTotalManual, setIsTotalManual] = useState<boolean>(false)
    const [category, setCategory] = useState<string>("PENJUALAN")
    const [recipient, setRecipient] = useState<string>("")

    // Master Material Pricing state
    const [masterPriceInfo, setMasterPriceInfo] = useState<{
        unitPrice: number
        effectiveDate: string | null
        matchedLocationName: string
        notes: string | null
        isHistorical: boolean
    } | null>(null)
    const [isPriceManual, setIsPriceManual] = useState<boolean>(false)
    const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(false)

    // Transport & Retase state
    const [transportMode, setTransportMode] = useState<"INTERNAL_DT" | "BUYER">("BUYER")
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
    const [selectedDriverId, setSelectedDriverId] = useState<string>("")
    const [dumpTruckSize, setDumpTruckSize] = useState<"BESAR" | "KECIL">("BESAR")
    const [distanceKm, setDistanceKm] = useState<string>("")
    const [plateNumber, setPlateNumber] = useState<string>("")
    const [driverName, setDriverName] = useState<string>("")
    const [notes, setNotes] = useState<string>("")

    useEffect(() => {
        if (isOpen) {
            setError(null)
            setIsTotalManual(false)
            if (initialData) {
                const locId = initialData.locationId
                setSelectedLocationId(locId)
                setDate(initialData.date)
                setNoBon(initialData.no_bon || "")
                setAggregateType(initialData.aggregate_type)
                setVolumeCubic(String(initialData.volume_cubic))
                setUnit(initialData.unit || "m³")
                setUnitPrice(initialData.unit_price ? String(initialData.unit_price) : "")
                setTotalPrice(initialData.total_price ? String(initialData.total_price) : "")
                setIsPriceManual(true)
                setCategory(initialData.category)
                setRecipient(initialData.recipient || "")

                const mode = (initialData.transport_mode as "INTERNAL_DT" | "BUYER") || (initialData.vehicleId ? "INTERNAL_DT" : "BUYER")
                setTransportMode(mode)
                setSelectedVehicleId(initialData.vehicleId || "")
                setSelectedDriverId(initialData.driverId || "")
                setDumpTruckSize((initialData.dump_truck_size as "BESAR" | "KECIL") || "BESAR")
                setDistanceKm(initialData.distance_km != null ? String(initialData.distance_km) : "")
                setPlateNumber(initialData.plate_number || "")
                setDriverName(initialData.driver_name || "")
                setNotes(initialData.notes || "")
            } else {
                const locId = getDefaultLocation()
                setSelectedLocationId(locId)
                setDate(new Date().toISOString().split("T")[0])
                setNoBon("")
                setAggregateType("SplitHalfOne")
                setVolumeCubic("")
                setUnit("m³")
                setUnitPrice("")
                setTotalPrice("")
                setIsPriceManual(false)
                setCategory("PENJUALAN")
                setRecipient("")
                setTransportMode("BUYER")
                setSelectedVehicleId("")
                setSelectedDriverId("")
                setDumpTruckSize("BESAR")
                setPlateNumber("")
                setDriverName("")
                setNotes("")

                const branchSetting = retaseSettings.find((s: any) => s.locationId === locId)
                setDistanceKm(branchSetting?.default_distance_km ? String(branchSetting.default_distance_km) : "")
            }
        }
    }, [isOpen, initialData, locations, retaseSettings, userLocationId])

    // Live lookup of master material rate
    useEffect(() => {
        if (!isOpen) return
        if (aggregateType === "Semen") {
            setMasterPriceInfo(null)
            return
        }

        let isMounted = true
        setIsLoadingPrice(true)
        getEffectiveAggregatePrice(aggregateType, date, selectedLocationId)
            .then((res) => {
                if (!isMounted) return
                setMasterPriceInfo(res)
                if (!isPriceManual && res.unitPrice > 0) {
                    setUnitPrice(String(res.unitPrice))
                    const v = parseFloat(volumeCubic.replace(/,/g, ".")) || 0
                    if (!isTotalManual && v > 0) {
                        setTotalPrice(String(Math.round(v * res.unitPrice)))
                    }
                }
            })
            .catch((err) => {
                console.error("Gagal mengambil harga acuan master material:", err)
            })
            .finally(() => {
                if (isMounted) setIsLoadingPrice(false)
            })

        return () => {
            isMounted = false
        }
    }, [aggregateType, date, selectedLocationId, isOpen, isPriceManual])

    const handleApplyMasterPrice = () => {
        if (!masterPriceInfo || !masterPriceInfo.unitPrice) return
        setIsPriceManual(false)
        setUnitPrice(String(masterPriceInfo.unitPrice))
        const v = parseFloat(volumeCubic.replace(/,/g, ".")) || 0
        if (!isTotalManual && v > 0) {
            setTotalPrice(String(Math.round(v * masterPriceInfo.unitPrice)))
        }
    }

    // Update default distance on location change
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
                setDumpTruckSize(v.dump_truck_size as "BESAR" | "KECIL")
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

    // Auto-calculate total price when unit price or volume changes
    const handleVolumeChange = (val: string) => {
        setVolumeCubic(val)
        if (!isTotalManual) {
            const v = parseFloat(val.replace(/,/g, ".")) || 0
            const p = parseFloat(unitPrice.replace(/,/g, ".")) || 0
            if (v > 0 && p > 0) {
                setTotalPrice(String(Math.round(v * p)))
            }
        }
    }

    const handleUnitPriceChange = (val: string) => {
        setIsPriceManual(true)
        setUnitPrice(val)
        if (!isTotalManual) {
            const v = parseFloat(volumeCubic.replace(/,/g, ".")) || 0
            const p = parseFloat(val.replace(/,/g, ".")) || 0
            if (v > 0 && p > 0) {
                setTotalPrice(String(Math.round(v * p)))
            } else if (p === 0) {
                setTotalPrice("")
            }
        }
    }

    // Sort dump truck vehicles: matching selected location first
    const sortedVehicles = [...vehicles].sort((a, b) => {
        const aMatch = a.locationId === selectedLocationId ? 1 : 0
        const bMatch = b.locationId === selectedLocationId ? 1 : 0
        if (aMatch !== bMatch) return bMatch - aMatch
        return (a.code || "").localeCompare(b.code || "")
    })

    // Retase calculation
    const activeSetting = retaseSettings.find((s: any) => s.locationId === selectedLocationId)
    const unitRate = activeSetting
        ? (dumpTruckSize === "BESAR" ? activeSetting.price_dt_besar : activeSetting.price_dt_kecil) || 0
        : 0

    const dist = parseFloat(distanceKm.replace(/,/g, ".")) || 0
    const vol = parseFloat(volumeCubic.replace(/,/g, ".")) || 0
    const calculatedRetase = transportMode === "INTERNAL_DT" ? Math.round(unitRate * dist * vol) : 0

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const v = parseFloat(volumeCubic.replace(/,/g, "."))
        if (isNaN(v) || v <= 0) {
            setError("Jumlah volume / kuantitas keluar harus lebih dari 0")
            return
        }

        if (transportMode === "INTERNAL_DT") {
            if (!selectedVehicleId && !plateNumber) {
                setError("Silakan pilih armada Dump Truck internal atau isi plat nomor")
                return
            }
        }

        const formData = new FormData()
        formData.append("date", date)
        if (noBon.trim()) formData.append("no_bon", noBon.trim())
        formData.append("aggregate_type", aggregateType)
        formData.append("volume_cubic", String(v))
        formData.append("unit", unit)

        const uPrice = parseFloat(unitPrice.replace(/,/g, ".")) || 0
        const tPrice = parseFloat(totalPrice.replace(/,/g, ".")) || (uPrice > 0 ? Math.round(uPrice * v) : 0)
        formData.append("unit_price", String(uPrice))
        formData.append("total_price", String(tPrice))

        formData.append("category", category)
        if (recipient.trim()) formData.append("recipient", recipient.trim())
        formData.append("transport_mode", transportMode)

        if (transportMode === "INTERNAL_DT") {
            if (selectedVehicleId) formData.append("vehicleId", selectedVehicleId)
            if (selectedDriverId) formData.append("driverId", selectedDriverId)
            formData.append("dump_truck_size", dumpTruckSize)
            formData.append("distance_km", String(dist))
            formData.append("rate_price", String(unitRate))
            formData.append("retase_amount", String(calculatedRetase))
        }

        if (plateNumber.trim()) formData.append("plate_number", plateNumber.trim().toUpperCase())
        if (driverName.trim()) formData.append("driver_name", driverName.trim())
        if (notes.trim()) formData.append("notes", notes.trim())
        formData.append("locationId", selectedLocationId)

        startTransition(async () => {
            const res = initialData
                ? await updateAggregateOutgoing(initialData.id, formData)
                : await createAggregateOutgoing(formData)

            if (res.error) {
                setError(res.error)
            } else {
                onSuccess()
            }
        })
    }

    const showCabang = userRole === "SuperAdminBP" || ["CEO", "FVP"].includes(userRole)

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onCancel()}>
            <DialogContent className="sm:max-w-[850px] lg:max-w-[950px] max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-linear-to-r from-rose-50/60 via-white to-slate-50">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
                                    <PackageMinus className="w-5 h-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-bold text-slate-900">
                                        {initialData ? "Edit Pengeluaran Material" : "Input Pengeluaran Material (Agregat / Semen)"}
                                    </DialogTitle>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Catat penjualan bebas / eceran, transfer antar plant, atau pemakaian internal non-BP (proyek) beserta armada & retase.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ═══ KOLOM KIRI: DATA TRANSAKSI & HARGA JUAL ═══ */}
                        <div className="space-y-4">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>Informasi Pengeluaran & Finansial</span>
                            </div>

                            {/* Cabang */}
                            {showCabang && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Cabang BP Asal *</Label>
                                    <Select value={selectedLocationId} onValueChange={handleLocationChange}>
                                        <SelectTrigger className="h-9 text-xs bg-slate-50/50 border-slate-200">
                                            <SelectValue placeholder="Pilih Cabang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>
                                                    📍 {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Tanggal & No Bon */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Tanggal Keluar *</Label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="h-9 text-xs bg-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">No. Surat Jalan / DO</Label>
                                    <Input
                                        placeholder="SJ-OUT/001 (Opsional)"
                                        value={noBon}
                                        onChange={e => setNoBon(e.target.value)}
                                        className="h-9 text-xs bg-white font-mono"
                                    />
                                </div>
                            </div>

                            {/* Jenis Material, Satuan & Volume */}
                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="space-y-1 col-span-1">
                                    <Label className="text-xs font-semibold text-slate-700">Material *</Label>
                                    <Select value={aggregateType} onValueChange={setAggregateType}>
                                        <SelectTrigger className="h-9 text-xs bg-white font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AGGREGATE_TYPE_OPTIONS.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1 col-span-1">
                                    <Label className="text-xs font-semibold text-slate-700">Jumlah Keluar *</Label>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Mis: 10 / 12.5"
                                        value={volumeCubic}
                                        onChange={e => handleVolumeChange(e.target.value)}
                                        className="h-9 text-xs bg-white font-mono font-bold text-rose-700"
                                        required
                                    />
                                </div>

                                <div className="space-y-1 col-span-1">
                                    <Label className="text-xs font-semibold text-slate-700">Satuan *</Label>
                                    <Select value={unit} onValueChange={setUnit}>
                                        <SelectTrigger className="h-9 text-xs bg-white font-mono">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="m³">m³ (Kubik)</SelectItem>
                                            <SelectItem value="zak">Zak (Semen)</SelectItem>
                                            <SelectItem value="ton">Ton</SelectItem>
                                            <SelectItem value="kg">Kg</SelectItem>
                                            <SelectItem value="rit">Rit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Kategori Pengeluaran & Penerima */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Kategori Pengeluaran *</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="h-9 text-xs bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {OUTGOING_CATEGORY_OPTIONS.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Penerima / Lokasi Proyek</Label>
                                    <Input
                                        placeholder="Contoh: CV. Mandiri / Proyek Jembatan"
                                        value={recipient}
                                        onChange={e => setRecipient(e.target.value)}
                                        className="h-9 text-xs bg-white"
                                    />
                                </div>
                            </div>

                            {/* Nilai Finansial (Harga Satuan & Total Penjualan / Valuasi Proyek) */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                                        <span>
                                            {category === "PENJUALAN" ? "Nilai Penjualan Komersial" : "Nilai Valuasi Material"}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className={`text-[10px] font-semibold ${
                                        category === "PENJUALAN"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                            : "bg-blue-50 text-blue-800 border-blue-300"
                                    }`}>
                                        {category === "PENJUALAN"
                                            ? "Eksternal / Komersial"
                                            : (OUTGOING_CATEGORY_LABELS[category] || "Internal / Proyek")}
                                    </Badge>
                                </div>

                                {/* Reference to Master Material */}
                                {aggregateType !== "Semen" && (
                                    <div className="p-2.5 rounded-lg bg-white border border-blue-100 flex items-center justify-between text-[11px] gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap text-slate-700">
                                            <span className="font-semibold text-blue-700">💡 Acuan Master:</span>
                                            {isLoadingPrice ? (
                                                <span className="text-blue-500 animate-pulse">Mengecek harga...</span>
                                            ) : masterPriceInfo && masterPriceInfo.unitPrice > 0 ? (
                                                <>
                                                    <span className="font-mono font-bold text-slate-900">
                                                        Rp {masterPriceInfo.unitPrice.toLocaleString("id-ID")}/{unit}
                                                    </span>
                                                    {masterPriceInfo.effectiveDate && (
                                                        <span className="text-slate-500 text-[10px]">
                                                            • Berlaku sejak: {format(new Date(masterPriceInfo.effectiveDate), "dd MMM yyyy", { locale: idLocale })}
                                                        </span>
                                                    )}
                                                    {masterPriceInfo.matchedLocationName && (
                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-slate-50 border-slate-200 text-slate-600">
                                                            {masterPriceInfo.matchedLocationName}
                                                        </Badge>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-amber-700 italic">Belum ada harga di Master Material</span>
                                            )}
                                        </div>
                                        {masterPriceInfo && masterPriceInfo.unitPrice > 0 && isPriceManual && (
                                            <button
                                                type="button"
                                                onClick={handleApplyMasterPrice}
                                                className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold shrink-0"
                                            >
                                                Gunakan Master
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-slate-600">
                                            {category === "PENJUALAN" ? "Harga Jual Satuan" : "Harga Satuan Dasar"} (Rp / {unit})
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">Rp</span>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="0"
                                                value={unitPrice}
                                                onChange={e => handleUnitPriceChange(e.target.value)}
                                                className="h-8 pl-8 text-xs bg-white font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[11px] text-slate-600">Total Nilai (Rp)</Label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsTotalManual(false)
                                                    const v = parseFloat(volumeCubic.replace(/,/g, ".")) || 0
                                                    const p = parseFloat(unitPrice.replace(/,/g, ".")) || 0
                                                    setTotalPrice(v > 0 && p > 0 ? String(Math.round(v * p)) : "")
                                                }}
                                                className="text-[10px] text-blue-600 hover:underline"
                                            >
                                                Hitung Ulang
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">Rp</span>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder={category === "PENJUALAN" ? "Total penjualan" : "Total nilai"}
                                                value={totalPrice}
                                                onChange={e => {
                                                    setIsTotalManual(true)
                                                    setTotalPrice(e.target.value)
                                                }}
                                                className="h-8 pl-8 text-xs bg-white font-mono font-bold text-emerald-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {parseFloat(totalPrice.replace(/,/g, ".")) > 0 && (
                                    <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50/70 p-2 rounded border border-emerald-200/80 flex items-center justify-between">
                                        <span>Total Nilai Transaksi:</span>
                                        <strong>Rp {Math.round(parseFloat(totalPrice.replace(/,/g, "."))).toLocaleString("id-ID")}</strong>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ═══ KOLOM KANAN: METODE PENGANGKUTAN & RETASE DT ═══ */}
                        <div className="space-y-4">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Metode Pengangkutan & Retase Sopir DT</span>
                            </div>

                            {/* Pilihan Metode Pengangkutan */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setTransportMode("BUYER")}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        transportMode === "BUYER"
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "text-slate-500 hover:text-slate-900"
                                    }`}
                                >
                                    <span>🏢 Angkutan Pembeli / Luar</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTransportMode("INTERNAL_DT")}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        transportMode === "INTERNAL_DT"
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "text-slate-500 hover:text-slate-900"
                                    }`}
                                >
                                    <span>🚚 DT Internal (Ada Retase)</span>
                                </button>
                            </div>

                            {/* MODE 1: INTERNAL DT (DENGAN HITUNGAN RETASE) */}
                            {transportMode === "INTERNAL_DT" ? (
                                <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3.5">
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-blue-950 flex items-center gap-1.5">
                                            <Calculator className="w-4 h-4 text-blue-600" />
                                            <span>Kalkulasi Retase Sopir DT Internal</span>
                                        </div>
                                        <Badge className="bg-blue-600 text-white text-[10px]">Komisi Otomatis</Badge>
                                    </div>

                                    {/* Pilih Unit DT & Sopir */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-slate-700">Armada Dump Truck *</Label>
                                            <Select value={selectedVehicleId} onValueChange={handleVehicleChange}>
                                                <SelectTrigger className="h-9 text-xs bg-white">
                                                    <SelectValue placeholder="Pilih Dump Truck" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sortedVehicles.map((v: any) => (
                                                        <SelectItem key={v.id} value={v.id} className="text-xs">
                                                            {v.code} - {v.plate_number} {v.dump_truck_size ? `(${v.dump_truck_size})` : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-slate-700">Sopir Bertugas *</Label>
                                            <Select value={selectedDriverId} onValueChange={handleDriverChange}>
                                                <SelectTrigger className="h-9 text-xs bg-white">
                                                    <SelectValue placeholder="Pilih Sopir" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {drivers.map((d: any) => (
                                                        <SelectItem key={d.id} value={d.id} className="text-xs">
                                                            {d.name} {d.driverCategory?.name ? `(${d.driverCategory.name})` : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Ukuran DT & Jarak Tempuh */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-slate-700">Ukuran Dump Truck</Label>
                                            <Select
                                                value={dumpTruckSize}
                                                onValueChange={(val: "BESAR" | "KECIL") => setDumpTruckSize(val)}
                                            >
                                                <SelectTrigger className="h-8 text-xs bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BESAR">DT Besar (Tronton)</SelectItem>
                                                    <SelectItem value="KECIL">DT Kecil (Engkel)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-slate-700">Jarak Tempuh (KM) *</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="Misal: 15"
                                                value={distanceKm}
                                                onChange={e => setDistanceKm(e.target.value)}
                                                className="h-8 text-xs bg-white font-mono"
                                                required={transportMode === "INTERNAL_DT"}
                                            />
                                        </div>
                                    </div>

                                    {/* Rincian Tarif & Retase */}
                                    <div className="p-3 bg-white rounded-lg border border-blue-200/80 space-y-1.5">
                                        <div className="flex items-center justify-between text-slate-600 text-[11px]">
                                            <span>Tarif Retase ({dumpTruckSize}):</span>
                                            <span className="font-mono font-bold text-slate-900">
                                                Rp {unitRate.toLocaleString("id-ID")} / m³·km
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-slate-600 text-[11px]">
                                            <span>Volume × Jarak × Tarif:</span>
                                            <span className="font-mono text-slate-700">
                                                {vol} m³ × {dist} KM × Rp {unitRate}
                                            </span>
                                        </div>
                                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                            <span className="font-bold text-blue-950 text-xs">Total Komisi Retase:</span>
                                            <span className="font-black text-sm font-mono text-emerald-700">
                                                Rp {calculatedRetase.toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* MODE 2: ANGKUTAN PEMBELI / LUAR */
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <div className="text-slate-600 text-[11px]">
                                        Material diambil sendiri oleh pembeli menggunakan kendaraan luar. Tidak ada perhitungan komisi retase internal.
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-slate-700">Plat Nomor Kendaraan</Label>
                                            <Input
                                                placeholder="Contoh: DE 8921 AB"
                                                value={plateNumber}
                                                onChange={e => setPlateNumber(e.target.value)}
                                                className="h-8 text-xs bg-white font-mono uppercase"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-slate-700">Nama Sopir Pembeli</Label>
                                            <Input
                                                placeholder="Nama pengemudi (Opsional)"
                                                value={driverName}
                                                onChange={e => setDriverName(e.target.value)}
                                                className="h-8 text-xs bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Catatan / Keterangan Keperluan */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Catatan / Keterangan Keperluan</Label>
                                <Textarea
                                    placeholder="Contoh: Keperluan cor lantai kantor / Pembelian tunai oleh Pak Budi..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="min-h-[70px] text-xs bg-white resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isPending}
                            className="text-xs font-semibold"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-2 px-5"
                        >
                            {isPending ? (
                                <>
                                    <span className="inline-block animate-spin mr-1">⏳</span>
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <PackageMinus className="w-4 h-4" />
                                    <span>{initialData ? "Simpan Perubahan" : "Catat Material Keluar"}</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
