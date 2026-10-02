"use client"

import React from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Plus, Trash2, Calendar, Check, AlertTriangle, CheckCircle2,
    Lock, Fuel, Gauge, Loader2
} from "lucide-react"
import { BatchRow, BudgetDateRange } from "../../types"
import { CategorySelector } from "../selectors/category-selector"
import { VehicleSelector } from "../selectors/vehicle-selector"
import { fmt } from "../../utils/rbl-helpers"

interface InputBatchTabProps {
    activeBudget: any
    adminBranchName: string
    canCreate?: boolean
    budgetDateRange: BudgetDateRange
    batchRows: BatchRow[]
    categories: any[]
    branchVehicles: any[]
    isHeadOfficeBudget: boolean
    isPending: boolean
    onOpenCreateBudget: () => void
    onOpenHistoryTab: () => void
    onSetAllRowsDate: (date: string) => void
    onRowChange: (id: string, field: keyof BatchRow, value: any) => void
    onCategorySelect: (rowId: string, cat: any) => void
    onOpenQuickCategory: (rowId?: string) => void
    onRemoveBatchRow: (id: string) => void
    onAddBatchRow: (customDate?: string) => void
    onSaveBatchExpenses: () => void
    getVehiclePreviousKmInfo: (vehicleId: string | null | undefined, currentRowIndex?: number) => { km: number; source: string; date: string } | null
}

export function InputBatchTab({
    activeBudget,
    adminBranchName,
    canCreate,
    budgetDateRange,
    batchRows,
    categories,
    branchVehicles,
    isHeadOfficeBudget,
    isPending,
    onOpenCreateBudget,
    onOpenHistoryTab,
    onSetAllRowsDate,
    onRowChange,
    onCategorySelect,
    onOpenQuickCategory,
    onRemoveBatchRow,
    onAddBatchRow,
    onSaveBatchExpenses,
    getVehiclePreviousKmInfo,
}: InputBatchTabProps) {
    if (!activeBudget) {
        return (
            <Card className="border border-amber-200 bg-amber-50/40 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                            <Lock className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-slate-900">
                                    Anggaran Belum Dibuka untuk {adminBranchName}
                                </h3>
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold">
                                    Form Terkunci
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                                Sistem memerlukan anggaran periode berjalan dibuka terlebih dahulu sebelum menginput pengeluaran harian dan mengunggah foto nota kas.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        {canCreate && (
                            <Button
                                size="sm"
                                onClick={onOpenCreateBudget}
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-8 shadow-xs cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Buka Budget Baru
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onOpenHistoryTab}
                            className="text-xs h-8 text-slate-700 bg-white cursor-pointer"
                        >
                            <Calendar className="h-3.5 w-3.5 mr-1 text-slate-500" />
                            Lihat Riwayat
                        </Button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <span>Input RBL</span>
                            <Badge variant="outline" className="text-xs bg-white text-blue-700 border-blue-200">
                                Periode: {budgetDateRange.label}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Tanggal ditentukan per baris untuk mencegah mis-input. Setiap baris baru otomatis melanjutkan tanggal sebelumnya.
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-2xs">
                        <Label className="text-xs text-slate-600 whitespace-nowrap">Set Semua Baris:</Label>
                        <Input
                            type="date"
                            min={budgetDateRange.min}
                            max={budgetDateRange.max}
                            defaultValue={budgetDateRange.defaultDate}
                            onChange={e => e.target.value && onSetAllRowsDate(e.target.value)}
                            className="h-7 text-xs w-36 bg-slate-50"
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="text-[11px]">
                                <TableHead className="w-10 text-center">#</TableHead>
                                <TableHead className="w-36">Tanggal Transaksi *</TableHead>
                                <TableHead className="min-w-[200px]">Nama Item / Uraian (Free Text) *</TableHead>
                                <TableHead className="min-w-[160px]">Kategori</TableHead>
                                <TableHead className="w-20">Qty</TableHead>
                                <TableHead className="w-24">Satuan</TableHead>
                                <TableHead className="w-32">Harga Satuan (Rp)</TableHead>
                                <TableHead className="w-32 text-right">Total (Rp)</TableHead>
                                <TableHead className="w-28">No. Bon / Ref</TableHead>
                                <TableHead className="min-w-[140px]">Catatan (Opsional)</TableHead>
                                <TableHead className="w-10 text-center"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batchRows.map((row, idx) => {
                                const subtotal = (row.quantity || 0) * (row.unitPrice || 0)
                                const currentCat = categories.find(c => c.id === row.categoryId || c.name?.toLowerCase() === (row.category || "").toLowerCase())
                                const showVehicleSubrow = Boolean(currentCat?.requireVehicleKm || row.vehicleId)

                                return (
                                    <React.Fragment key={row.id}>
                                        <TableRow className="hover:bg-slate-50/70">
                                            <TableCell className="text-center text-xs text-slate-400 font-mono">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="date"
                                                    min={budgetDateRange.min}
                                                    max={budgetDateRange.max}
                                                    value={row.date}
                                                    onChange={e => onRowChange(row.id, "date", e.target.value)}
                                                    className="h-8 text-xs font-mono"
                                                    required
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    placeholder="Misal: Beli Solar Mixer 01"
                                                    value={row.itemDescription}
                                                    onChange={e => onRowChange(row.id, "itemDescription", e.target.value)}
                                                    className="h-8 text-xs"
                                                    autoFocus={idx === batchRows.length - 1 && idx > 0}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <CategorySelector
                                                    selectedCategoryName={row.category}
                                                    categories={categories}
                                                    onSelect={(cat) => onCategorySelect(row.id, cat)}
                                                    onOpenQuickCreate={() => onOpenQuickCategory(row.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    value={row.quantity || ""}
                                                    onChange={e => onRowChange(row.id, "quantity", parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-xs text-center"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    placeholder="Liter/Pcs"
                                                    value={row.unit}
                                                    onChange={e => onRowChange(row.id, "unit", e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={row.unitPrice || ""}
                                                    onChange={e => onRowChange(row.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-xs text-right font-mono"
                                                    placeholder="0"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-xs text-slate-800">
                                                {fmt(subtotal)}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    placeholder="No. Struk"
                                                    value={row.receiptNo}
                                                    onChange={e => onRowChange(row.id, "receiptNo", e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    placeholder="Catatan..."
                                                    value={row.notes}
                                                    onChange={e => onRowChange(row.id, "notes", e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onRemoveBatchRow(row.id)}
                                                    className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>

                                        {showVehicleSubrow && (() => {
                                            const prevKmInfo = getVehiclePreviousKmInfo(row.vehicleId, idx)
                                            const currentKm = row.kmMeter !== null && row.kmMeter !== undefined && !isNaN(Number(row.kmMeter)) ? Number(row.kmMeter) : null
                                            const prevKm = prevKmInfo?.km ?? null
                                            const hasDelta = currentKm !== null && prevKm !== null
                                            const deltaKm = hasDelta ? currentKm! - prevKm! : null
                                            const isNegative = deltaKm !== null && deltaKm < 0
                                            const isZero = deltaKm !== null && deltaKm === 0
                                            const isPositive = deltaKm !== null && deltaKm > 0
                                            const fuelConsumption = (isPositive && row.quantity && row.quantity > 0)
                                                ? (deltaKm! / row.quantity).toFixed(1)
                                                : null

                                            return (
                                                <TableRow className={`border-b transition-colors ${
                                                    isNegative
                                                        ? "bg-rose-50/90 border-rose-200"
                                                        : isPositive
                                                            ? "bg-emerald-50/50 border-emerald-200/70"
                                                            : "bg-amber-50/50 border-amber-200/60"
                                                }`}>
                                                    <TableCell className="text-center font-mono text-[11px] text-amber-600 font-bold">
                                                        ↳
                                                    </TableCell>
                                                    <TableCell colSpan={3} className="py-2">
                                                        <div className="flex items-center gap-2 text-xs text-slate-800">
                                                            <Fuel className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                                            <span className="font-semibold text-[11px] whitespace-nowrap text-slate-700">Unit Armada:</span>
                                                            <div className="flex-1 min-w-[200px]">
                                                                <VehicleSelector
                                                                    selectedVehicleId={row.vehicleId}
                                                                    vehicles={branchVehicles}
                                                                    isHeadOfficeBudget={isHeadOfficeBudget}
                                                                    onSelect={vId => onRowChange(row.id, "vehicleId", vId)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell colSpan={2} className="py-2">
                                                        <div className="flex items-center gap-1.5 text-xs">
                                                            <Gauge className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                                            <span className="font-semibold text-[11px] whitespace-nowrap text-slate-700">KM Odo:</span>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                placeholder="Contoh: 124500"
                                                                value={row.kmMeter ?? ""}
                                                                onChange={e => onRowChange(row.id, "kmMeter", e.target.value ? parseFloat(e.target.value) : null)}
                                                                className={`h-7 text-xs font-mono font-bold w-full transition-all ${
                                                                    isNegative
                                                                        ? "border-rose-500 bg-rose-50/80 text-rose-900 focus-visible:ring-rose-400"
                                                                        : isPositive
                                                                            ? "border-emerald-500 bg-white text-emerald-900 focus-visible:ring-emerald-400"
                                                                            : "border-amber-300 bg-white"
                                                                }`}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell colSpan={5} className="py-2">
                                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] shadow-2xs">
                                                                <span className="text-slate-400 font-medium">KM Lalu:</span>
                                                                <span className="font-mono font-bold">
                                                                    {prevKmInfo ? `${prevKmInfo.km.toLocaleString("id-ID")} KM` : "Belum Ada (Awal)"}
                                                                </span>
                                                                {prevKmInfo?.source && (
                                                                    <span className="text-[10px] text-slate-400">({prevKmInfo.source})</span>
                                                                )}
                                                            </div>

                                                            {isNegative && (
                                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-semibold animate-pulse">
                                                                    <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
                                                                    <span>⚠️ KM Sekarang lebih kecil dari KM sebelumnya! Selisih: {deltaKm!.toLocaleString("id-ID")} KM</span>
                                                                </div>
                                                            )}

                                                            {isZero && (
                                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-[11px]">
                                                                    <span>⚠️ Odometer sama dengan KM sebelumnya (Jarak 0 KM)</span>
                                                                </div>
                                                            )}

                                                            {isPositive && (
                                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-semibold">
                                                                    <CheckCircle2 className="h-3 w-3 text-emerald-700 shrink-0" />
                                                                    <span>Jarak Tempuh: +{deltaKm!.toLocaleString("id-ID")} KM</span>
                                                                    {fuelConsumption && (
                                                                        <span className="font-normal text-emerald-800 ml-1 pl-1.5 border-l border-emerald-300">
                                                                            Rasio: <strong>{fuelConsumption} KM/L</strong> ({row.quantity} L)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {!hasDelta && (
                                                                <span className="text-[11px] text-slate-400 italic">
                                                                    Masukkan KM Odo untuk menghitung jarak tempuh
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })()}
                                    </React.Fragment>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t bg-slate-50/50 gap-3">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onAddBatchRow()}
                            className="gap-1.5 h-8 text-xs bg-white"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Baris
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const today = format(new Date(), "yyyy-MM-dd")
                                onAddBatchRow(today)
                            }}
                            className="h-8 text-xs text-slate-600 hover:text-blue-600"
                        >
                            + Baris Hari Ini
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-xs text-slate-600">
                            Total Form Ini:{" "}
                            <span className="font-bold text-sm text-slate-900 font-mono">
                                {fmt(batchRows.reduce((s, r) => s + (r.quantity || 0) * (r.unitPrice || 0), 0))}
                            </span>
                        </div>
                        <Button
                            onClick={onSaveBatchExpenses}
                            disabled={isPending || !activeBudget}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-8 text-xs shadow-xs"
                        >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Simpan Semua Baris
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
