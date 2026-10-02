"use client"

import React, { useState } from "react"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Plus,
    Calendar,
    CalendarRange,
    CalendarDays,
    CheckCircle2,
    Loader2,
    ChevronsUpDown,
    Check,
    X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { formatRp } from "../helpers"
import { DateMode, PpnMode, SewaMasters } from "../types"

interface SewaInputDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    isCorp: boolean
    masters: SewaMasters
    selectedLocationId: string
    onLocationChange: (locId: string) => void
    selectedCustomerId: string
    onCustomerChange: (custId: string) => void
    selectedProjectId: string
    onProjectChange: (projId: string) => void
    lokasiProyek: string
    onLokasiProyekChange: (loc: string) => void
    selectedEquipmentId: string
    onEquipmentChange: (eqId: string) => void
    selectedOperatorId: string
    onOperatorChange: (opId: string) => void
    dateMode: DateMode
    onDateModeChange: (mode: DateMode) => void
    rangeStart: string
    onRangeStartChange: (d: string) => void
    rangeEnd: string
    onRangeEndChange: (d: string) => void
    specificDates: string[]
    dateInputVal: string
    onDateInputValChange: (d: string) => void
    onAddSpecificDate: () => void
    onRemoveSpecificDate: (d: string) => void
    calculatedDays: number
    pricePerDayInput: string
    onDailyRateChange: (rate: string) => void
    numPricePerDay: number
    totalPriceInput: string
    onTotalPriceChange: (val: string) => void
    isTotalPriceManual: boolean
    onResetManualPrice: () => void
    rawBaseTotal: number
    ppnMode: PpnMode
    onPpnModeChange: (mode: PpnMode) => void
    ppnRate: number
    onPpnRateChange: (rate: number) => void
    dppAmount: number
    ppnAmount: number
    grandTotal: number
    notes: string
    onNotesChange: (notes: string) => void
    isPending: boolean
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
}

export function SewaInputDialog({
    open,
    onOpenChange,
    isCorp,
    masters,
    selectedLocationId,
    onLocationChange,
    selectedCustomerId,
    onCustomerChange,
    selectedProjectId,
    onProjectChange,
    lokasiProyek,
    onLokasiProyekChange,
    selectedEquipmentId,
    onEquipmentChange,
    selectedOperatorId,
    onOperatorChange,
    dateMode,
    onDateModeChange,
    rangeStart,
    onRangeStartChange,
    rangeEnd,
    onRangeEndChange,
    specificDates,
    dateInputVal,
    onDateInputValChange,
    onAddSpecificDate,
    onRemoveSpecificDate,
    calculatedDays,
    pricePerDayInput,
    onDailyRateChange,
    numPricePerDay,
    totalPriceInput,
    onTotalPriceChange,
    isTotalPriceManual,
    onResetManualPrice,
    rawBaseTotal,
    ppnMode,
    onPpnModeChange,
    ppnRate,
    onPpnRateChange,
    dppAmount,
    ppnAmount,
    grandTotal,
    notes,
    onNotesChange,
    isPending,
    onSubmit,
}: SewaInputDialogProps) {
    const [openCustomer, setOpenCustomer] = useState(false)
    const [openProject, setOpenProject] = useState(false)
    const [openEquipment, setOpenEquipment] = useState(false)
    const [openOperator, setOpenOperator] = useState(false)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[840px] max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-600" />
                        Input Transaksi Sewa Baru
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4 py-1 text-xs">
                    {/* Cabang (if corporate) */}
                    {isCorp && (
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">Cabang Penyelenggara *</Label>
                            <Select value={selectedLocationId} onValueChange={onLocationChange}>
                                <SelectTrigger className="h-9 text-xs bg-white">
                                    <SelectValue placeholder="Pilih Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    {masters.locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Customer & Proyek */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1 flex flex-col">
                            <Label className="text-xs font-semibold text-slate-700">Customer / Penyewa *</Label>
                            <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCustomer}
                                        className="w-full justify-between h-9 text-xs font-normal bg-white border-slate-200 hover:bg-slate-50"
                                    >
                                        <span className="truncate">
                                            {selectedCustomerId
                                                ? (masters.customers.find(c => c.id === selectedCustomerId)?.customer_name ?? "Pilih Customer")
                                                : <span className="text-slate-400">Pilih Customer</span>}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60]" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cari nama customer..." className="h-8 text-xs" />
                                        <CommandList className="max-h-[220px]">
                                            <CommandEmpty className="py-3 text-center text-xs text-slate-500">Customer tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {masters.customers.map(c => (
                                                    <CommandItem
                                                        key={c.id}
                                                        value={`${c.customer_name} ${c.address || ""}`}
                                                        onSelect={() => {
                                                            onCustomerChange(c.id)
                                                            setOpenCustomer(false)
                                                        }}
                                                        className="text-xs cursor-pointer py-1.5"
                                                    >
                                                        <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600 shrink-0", selectedCustomerId === c.id ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-medium text-slate-900 truncate">{c.customer_name}</span>
                                                            {c.address && <span className="text-[10px] text-slate-400 truncate">{c.address}</span>}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1 flex flex-col">
                            <Label className="text-xs font-semibold text-slate-700">Proyek (Opsional)</Label>
                            <Popover open={openProject} onOpenChange={setOpenProject}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openProject}
                                        disabled={!selectedCustomerId}
                                        className="w-full justify-between h-9 text-xs font-normal bg-white border-slate-200 hover:bg-slate-50"
                                    >
                                        <span className="truncate">
                                            {selectedProjectId && selectedProjectId !== "NONE"
                                                ? (() => {
                                                    const cust = masters.customers.find(c => c.id === selectedCustomerId)
                                                    const prj = cust?.projects?.find((p: any) => p.id === selectedProjectId)
                                                    return prj ? prj.name : "-- Tanpa Proyek Terdaftar --"
                                                })()
                                                : (selectedCustomerId ? "-- Tanpa Proyek Terdaftar --" : <span className="text-slate-400">Pilih customer dulu</span>)}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60]" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cari nama proyek..." className="h-8 text-xs" />
                                        <CommandList className="max-h-[200px]">
                                            <CommandEmpty className="py-2 text-center text-xs text-slate-500">Proyek tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="Tanpa Proyek Terdaftar None"
                                                    onSelect={() => {
                                                        onProjectChange("NONE")
                                                        setOpenProject(false)
                                                    }}
                                                    className="text-xs cursor-pointer py-1.5 italic text-slate-500"
                                                >
                                                    <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600 shrink-0", selectedProjectId === "NONE" ? "opacity-100" : "opacity-0")} />
                                                    -- Tanpa Proyek Terdaftar --
                                                </CommandItem>
                                                {masters.customers
                                                    .find(c => c.id === selectedCustomerId)
                                                    ?.projects?.map((p: any) => (
                                                        <CommandItem
                                                            key={p.id}
                                                            value={`${p.name} ${p.address || ""}`}
                                                            onSelect={() => {
                                                                onProjectChange(p.id)
                                                                setOpenProject(false)
                                                            }}
                                                            className="text-xs cursor-pointer py-1.5"
                                                        >
                                                            <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600 shrink-0", selectedProjectId === p.id ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-medium text-slate-900 truncate">{p.name}</span>
                                                                {p.address && <span className="text-[10px] text-slate-400 truncate">{p.address}</span>}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Alamat Kerja */}
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Lokasi / Alamat Kerja Alat *</Label>
                        <Input
                            placeholder="Contoh: Jl. Trans Seram Km 12, Pengecoran Jembatan"
                            value={lokasiProyek}
                            onChange={e => onLokasiProyekChange(e.target.value)}
                            className="h-9 text-xs"
                            required
                        />
                    </div>

                    {/* Alat & Operator */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1 flex flex-col">
                            <Label className="text-xs font-semibold text-slate-700">Unit Alat / Kendaraan Sewa *</Label>
                            <Popover open={openEquipment} onOpenChange={setOpenEquipment}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openEquipment}
                                        className="w-full justify-between h-9 text-xs font-normal bg-white border-slate-200 hover:bg-slate-50"
                                    >
                                        <span className="truncate">
                                            {selectedEquipmentId
                                                ? (() => {
                                                    const eq = masters.equipments.find(e => e.id === selectedEquipmentId)
                                                    return eq ? `${eq.nama_alat} (${eq.kode_alat})` : "Pilih Alat / Kendaraan"
                                                })()
                                                : <span className="text-slate-400">Pilih Alat / Kendaraan</span>}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60]" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cari nama atau kode alat..." className="h-8 text-xs" />
                                        <CommandList className="max-h-[220px]">
                                            <CommandEmpty className="py-3 text-center text-xs text-slate-500">Alat/kendaraan tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {masters.equipments.map(eq => (
                                                    <CommandItem
                                                        key={eq.id}
                                                        value={`${eq.nama_alat} ${eq.kode_alat} ${eq.kategori || ""}`}
                                                        onSelect={() => {
                                                            onEquipmentChange(eq.id)
                                                            setOpenEquipment(false)
                                                        }}
                                                        className="text-xs cursor-pointer py-1.5"
                                                    >
                                                        <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600 shrink-0", selectedEquipmentId === eq.id ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex items-center justify-between w-full min-w-0">
                                                            <div className="truncate">
                                                                <span className="font-medium text-slate-900">{eq.nama_alat}</span>
                                                                <span className="ml-1 text-[11px] text-slate-400">({eq.kode_alat})</span>
                                                            </div>
                                                            {eq.status !== "Tersedia" && (
                                                                <span className="ml-2 shrink-0 text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                                                                    {eq.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1 flex flex-col">
                            <Label className="text-xs font-semibold text-slate-700">Nama Operator *</Label>
                            <Popover open={openOperator} onOpenChange={setOpenOperator}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openOperator}
                                        className="w-full justify-between h-9 text-xs font-normal bg-white border-slate-200 hover:bg-slate-50"
                                    >
                                        <span className="truncate">
                                            {selectedOperatorId
                                                ? (() => {
                                                    const op = masters.operators.find(o => o.id === selectedOperatorId)
                                                    return op ? `${op.name} ${op.driverCategory ? `• [${op.driverCategory.name}]` : `[${op.position}]`}` : "Pilih Operator Bertugas"
                                                })()
                                                : <span className="text-slate-400">Pilih Operator Bertugas</span>}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60]" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cari nama operator / sopir..." className="h-8 text-xs" />
                                        <CommandList className="max-h-[240px]">
                                            <CommandEmpty className="py-3 text-center text-xs text-slate-500">Operator tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {masters.operators.map(op => (
                                                    <CommandItem
                                                        key={op.id}
                                                        value={`${op.name} ${op.driverCategory?.name || ""} ${op.position || ""}`}
                                                        onSelect={() => {
                                                            onOperatorChange(op.id)
                                                            setOpenOperator(false)
                                                        }}
                                                        className="text-xs cursor-pointer py-1.5"
                                                    >
                                                        <Check className={cn("mr-2 h-3.5 w-3.5 text-blue-600 shrink-0", selectedOperatorId === op.id ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex items-center justify-between w-full min-w-0">
                                                            <span className="font-medium text-slate-900 truncate">{op.name}</span>
                                                            {op.driverCategory ? (
                                                                <span className="ml-2 shrink-0 text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                                                                    {op.driverCategory.name}
                                                                </span>
                                                            ) : (
                                                                <span className="ml-2 shrink-0 text-[10px] text-slate-400">
                                                                    {op.position}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Perhitungan Hari Sewa */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                Metode Jadwal Sewa
                            </Label>

                            <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
                                <button
                                    type="button"
                                    onClick={() => onDateModeChange("RANGE")}
                                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                                        dateMode === "RANGE"
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <CalendarRange className="w-3 h-3 inline mr-1" />
                                    Rentang Tanggal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDateModeChange("DATES")}
                                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                                        dateMode === "DATES"
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <CalendarDays className="w-3 h-3 inline mr-1" />
                                    Tanggal Tertentu (Acak)
                                </button>
                            </div>
                        </div>

                        {/* Mode Rentang Tanggal */}
                        {dateMode === "RANGE" ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[11px] text-slate-600">Dari Tanggal *</Label>
                                    <Input
                                        type="date"
                                        value={rangeStart}
                                        onChange={e => onRangeStartChange(e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px] text-slate-600">Sampai Tanggal *</Label>
                                    <Input
                                        type="date"
                                        value={rangeEnd}
                                        min={rangeStart}
                                        onChange={e => onRangeEndChange(e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="date"
                                        value={dateInputVal}
                                        onChange={e => onDateInputValChange(e.target.value)}
                                        className="h-8 text-xs bg-white flex-1"
                                    />
                                    <Button
                                        type="button"
                                        onClick={onAddSpecificDate}
                                        size="sm"
                                        className="h-8 text-xs bg-slate-800 hover:bg-slate-900"
                                    >
                                        + Tambah
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded border border-slate-200 min-h-[38px] items-center">
                                    {specificDates.map(d => (
                                        <span
                                            key={d}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                                        >
                                            <span>{format(new Date(d), "dd/MM/yyyy")}</span>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveSpecificDate(d)}
                                                className="text-blue-400 hover:text-rose-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Live Badge Durasi */}
                        <div className="flex items-center justify-between p-2 bg-blue-50/70 border border-blue-200 rounded">
                            <span className="text-xs font-semibold text-blue-900">Total Durasi Terhitung:</span>
                            <span className="font-extrabold text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-300">
                                {calculatedDays} HARI
                            </span>
                        </div>
                    </div>

                    {/* Biaya */}
                    <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Tarif / Hari (Rp)</Label>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Contoh: 3.500.000 atau 3153153,15"
                                    value={pricePerDayInput}
                                    onChange={e => onDailyRateChange(e.target.value)}
                                    className="h-8 text-xs bg-white font-mono"
                                />
                                <span className="text-[10px] text-slate-500">
                                    {numPricePerDay > 0 ? formatRp(numPricePerDay, true) : "Opsional / Tarif harian"}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-slate-700">
                                        {ppnMode === "INCLUDE" ? "Nilai Sewa (Gross/Include PPN) *" : "Nilai Dasar Sewa (DPP) *"}
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={onResetManualPrice}
                                        className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                                    >
                                        Hitung Ulang
                                    </button>
                                </div>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Total biaya sewa"
                                    value={isTotalPriceManual ? totalPriceInput : (rawBaseTotal > 0 ? String(rawBaseTotal) : "")}
                                    onChange={e => onTotalPriceChange(e.target.value)}
                                    className="h-8 text-xs bg-white font-mono font-bold text-slate-800"
                                    required
                                />
                                <span className="text-[10px] text-slate-500">
                                    {rawBaseTotal > 0 ? formatRp(rawBaseTotal, true) : "Free input nilai sewa"}
                                </span>
                            </div>
                        </div>

                        {/* Opsi PPN */}
                        <div className="pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs font-semibold text-slate-800">Opsi Pajak (PPN)</Label>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-slate-500">Tarif PPN:</span>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            value={ppnRate}
                                            onChange={e => onPpnRateChange(Number(e.target.value) || 0)}
                                            disabled={ppnMode === "NON_PPN"}
                                            className="h-7 w-14 text-xs font-mono text-center bg-white"
                                        />
                                        <span className="text-xs text-slate-600 font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => onPpnModeChange("NON_PPN")}
                                    className={`px-2 py-1.5 rounded-md text-xs font-medium border text-center transition-all cursor-pointer ${
                                        ppnMode === "NON_PPN"
                                            ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    Non-PPN
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPpnModeChange("INCLUDE")}
                                    className={`px-2 py-1.5 rounded-md text-xs font-medium border text-center transition-all cursor-pointer ${
                                        ppnMode === "INCLUDE"
                                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    Include PPN (Sudah PPN)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPpnModeChange("EXCLUDE")}
                                    className={`px-2 py-1.5 rounded-md text-xs font-medium border text-center transition-all cursor-pointer ${
                                        ppnMode === "EXCLUDE"
                                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    Exclude PPN (+ PPN)
                                </button>
                            </div>

                            {/* Live Breakdown Preview */}
                            <div className="mt-2.5 p-2 bg-white rounded border border-slate-200 grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <span className="text-[10px] text-slate-400 block">Dasar Pajak (DPP)</span>
                                    <span className="text-xs font-semibold font-mono text-slate-800">{formatRp(dppAmount, true)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block">PPN ({ppnMode === "NON_PPN" ? "0%" : `${ppnRate}%`})</span>
                                    <span className="text-xs font-semibold font-mono text-blue-700">{formatRp(ppnAmount, true)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block">Total Tagihan</span>
                                    <span className="text-xs font-extrabold font-mono text-emerald-700">{formatRp(grandTotal, true)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Catatan */}
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Catatan / Keterangan</Label>
                        <Textarea
                            placeholder="Catatan instruksi sewa..."
                            value={notes}
                            onChange={e => onNotesChange(e.target.value)}
                            rows={2}
                            className="text-xs resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" size="sm" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 cursor-pointer">
                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Simpan Transaksi Sewa
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
