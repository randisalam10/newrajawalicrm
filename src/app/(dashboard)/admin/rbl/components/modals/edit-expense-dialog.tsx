"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, CheckCircle2, Fuel, Loader2 } from "lucide-react"
import { CategorySelector } from "../selectors/category-selector"
import { VehicleSelector } from "../selectors/vehicle-selector"
import { BudgetDateRange } from "../../types"

interface EditExpenseDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    editingExpense: any
    setEditingExpense: React.Dispatch<React.SetStateAction<any>>
    budgetDateRange: BudgetDateRange
    categories: any[]
    branchVehicles: any[]
    isHeadOfficeBudget: boolean
    getVehiclePreviousKmInfo: (vehicleId: string | null | undefined) => { km: number; date: string } | null
    onOpenQuickCategory: () => void
    onSubmit: (e: React.FormEvent) => void
    isPending: boolean
}

export function EditExpenseDialog({
    isOpen,
    onOpenChange,
    editingExpense,
    setEditingExpense,
    budgetDateRange,
    categories,
    branchVehicles,
    isHeadOfficeBudget,
    getVehiclePreviousKmInfo,
    onOpenQuickCategory,
    onSubmit,
    isPending,
}: EditExpenseDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="text-base">Edit Pengeluaran</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Perbarui rincian item pengeluaran RBL terpilih.
                    </DialogDescription>
                </DialogHeader>

                {editingExpense && (
                    <form onSubmit={onSubmit}>
                        <div className="grid gap-3 py-3 text-xs">
                            <div className="space-y-1">
                                <Label className="text-xs">Tanggal</Label>
                                <Input
                                    type="date"
                                    min={budgetDateRange.min}
                                    max={budgetDateRange.max}
                                    value={editingExpense.date}
                                    onChange={e => setEditingExpense((prev: any) => ({ ...prev, date: e.target.value }))}
                                    className="h-8 text-xs font-mono"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Nama Item / Uraian</Label>
                                <Input
                                    value={editingExpense.itemDescription}
                                    onChange={e => setEditingExpense((prev: any) => ({ ...prev, itemDescription: e.target.value }))}
                                    className="h-8 text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Kategori</Label>
                                <CategorySelector
                                    selectedCategoryName={editingExpense.category}
                                    categories={categories}
                                    onSelect={(cat) => {
                                        const isFuel = cat.name.toLowerCase().includes("bbm") || cat.name.toLowerCase().includes("solar")
                                        setEditingExpense((prev: any) => ({
                                            ...prev,
                                            categoryId: cat.id,
                                            category: cat.name,
                                            unit: isFuel ? "Liter" : (prev.unit === "Liter" ? "Pcs" : prev.unit),
                                            vehicleId: cat.requireVehicleKm ? prev.vehicleId : null,
                                            kmMeter: cat.requireVehicleKm ? prev.kmMeter : null,
                                        }))
                                    }}
                                    onOpenQuickCreate={onOpenQuickCategory}
                                />
                            </div>

                            {/* Conditional Vehicle & KM Meter if category requires vehicle or has vehicleId */}
                            {(categories.find(c => c.id === editingExpense.categoryId || c.name?.toLowerCase() === (editingExpense.category || "").toLowerCase())?.requireVehicleKm || editingExpense.vehicleId) && (() => {
                                const prevKmInfo = getVehiclePreviousKmInfo(editingExpense.vehicleId)
                                const currentKm = editingExpense.kmMeter !== null && editingExpense.kmMeter !== undefined && !isNaN(Number(editingExpense.kmMeter)) ? Number(editingExpense.kmMeter) : null
                                const prevKm = prevKmInfo?.km ?? null
                                const hasDelta = currentKm !== null && prevKm !== null
                                const deltaKm = hasDelta ? currentKm! - prevKm! : null
                                const isNegative = deltaKm !== null && deltaKm < 0
                                const isPositive = deltaKm !== null && deltaKm > 0

                                return (
                                    <div className={`p-2.5 rounded-lg border space-y-2 transition-colors ${
                                        isNegative ? "bg-rose-50 border-rose-300" : isPositive ? "bg-emerald-50/60 border-emerald-200" : "bg-amber-50/70 border-amber-200"
                                    }`}>
                                        <div className="flex items-center justify-between gap-1 text-xs font-semibold">
                                            <div className="flex items-center gap-1 text-amber-900">
                                                <Fuel className="h-3.5 w-3.5 text-amber-600" />
                                                <span>Rincian Kendaraan & Odometer</span>
                                            </div>
                                            {prevKmInfo && (
                                                <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border text-slate-600 font-normal">
                                                    KM Lalu: <strong>{prevKmInfo.km.toLocaleString("id-ID")}</strong>
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-slate-700">Unit Kendaraan / Alat</Label>
                                                <VehicleSelector
                                                    selectedVehicleId={editingExpense.vehicleId}
                                                    vehicles={branchVehicles}
                                                    isHeadOfficeBudget={isHeadOfficeBudget}
                                                    onSelect={vId => setEditingExpense((prev: any) => ({
                                                        ...prev,
                                                        vehicleId: vId
                                                    }))}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-slate-700">KM Odometer Sekarang</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Contoh: 124500"
                                                    value={editingExpense.kmMeter ?? ""}
                                                    onChange={e => setEditingExpense((prev: any) => ({
                                                        ...prev,
                                                        kmMeter: e.target.value ? parseFloat(e.target.value) : null
                                                    }))}
                                                    className={`h-8 text-xs font-mono font-bold bg-white ${
                                                        isNegative ? "border-rose-500 text-rose-900 bg-rose-50" : "border-amber-200"
                                                    }`}
                                                />
                                            </div>
                                        </div>

                                        {/* Real-time distance calculation in Edit Dialog */}
                                        {hasDelta && (
                                            <div className="text-[11px] pt-1 border-t">
                                                {isNegative ? (
                                                    <div className="text-rose-700 font-semibold flex items-center gap-1">
                                                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                                        <span>⚠️ KM Sekarang lebih kecil dari KM sebelumnya! Selisih: {deltaKm!.toLocaleString("id-ID")} KM</span>
                                                    </div>
                                                ) : isPositive ? (
                                                    <div className="text-emerald-800 font-medium flex items-center gap-1">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                        <span>Jarak Tempuh: <strong>+{deltaKm!.toLocaleString("id-ID")} KM</strong></span>
                                                        {editingExpense.quantity > 0 && (
                                                            <span className="text-slate-500 ml-1">
                                                                (Rasio: <strong>{(deltaKm! / editingExpense.quantity).toFixed(1)} KM/L</strong>)
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-amber-800">⚠️ KM sama dengan KM sebelumnya (0 KM)</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">Qty</Label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={editingExpense.quantity}
                                        onChange={e => setEditingExpense((prev: any) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Satuan</Label>
                                    <Input
                                        value={editingExpense.unit}
                                        onChange={e => setEditingExpense((prev: any) => ({ ...prev, unit: e.target.value }))}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Harga (Rp)</Label>
                                    <Input
                                        type="number"
                                        value={editingExpense.unitPrice}
                                        onChange={e => setEditingExpense((prev: any) => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">No. Bon / Struk</Label>
                                <Input
                                    value={editingExpense.receiptNo || ""}
                                    onChange={e => setEditingExpense((prev: any) => ({ ...prev, receiptNo: e.target.value }))}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Catatan (Opsional)</Label>
                                <Input
                                    placeholder="Keterangan tambahan..."
                                    value={editingExpense.notes || ""}
                                    onChange={e => setEditingExpense((prev: any) => ({ ...prev, notes: e.target.value }))}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isPending} size="sm" className="bg-blue-600 text-white">
                                {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
