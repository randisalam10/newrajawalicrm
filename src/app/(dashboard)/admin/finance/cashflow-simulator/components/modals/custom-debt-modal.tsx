"use client"

import { useState } from "react"
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
import { DebtItem } from "../../types"
import { formatRupiah } from "../../utils/cashflow-math"
import { Trash2, Plus } from "lucide-react"

interface CustomDebtModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    debts: DebtItem[]
    currentPeriodStr: string
    onAddDebt: (debt: Omit<DebtItem, "id">) => void
    onRemoveDebt: (id: string) => void
}

export function CustomDebtModal({
    open,
    onOpenChange,
    debts,
    currentPeriodStr,
    onAddDebt,
    onRemoveDebt
}: CustomDebtModalProps) {
    const [name, setName] = useState("")
    const [amount, setAmount] = useState<number>(15000000)
    const [duration, setDuration] = useState<number>(12)

    const handleAdd = () => {
        if (!name.trim() || amount <= 0) return
        onAddDebt({
            name: name.trim(),
            monthly_amount: amount,
            start_month: currentPeriodStr,
            duration_months: duration
        })
        setName("")
        setAmount(15000000)
        setDuration(12)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold text-slate-900">
                        Kelola Cicilan Pinjaman Bank &amp; Leasing (Non-PO)
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Daftar Cicilan Aktif */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700">
                            Cicilan Aktif Terjadwal ({debts.length})
                        </Label>
                        {debts.length === 0 ? (
                            <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded border border-slate-100">
                                Belum ada cicilan pinjaman tambahan. Tambahkan melalui form di bawah.
                            </p>
                        ) : (
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                {debts.map((debt) => (
                                    <div
                                        key={debt.id}
                                        className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                                    >
                                        <div>
                                            <div className="font-semibold text-slate-800">{debt.name}</div>
                                            <div className="text-[11px] text-slate-500">
                                                {formatRupiah(debt.monthly_amount)} / bln • Durasi {debt.duration_months} bln
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRemoveDebt(debt.id)}
                                            className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Tambah Cicilan */}
                    <div className="border-t border-slate-100 pt-3 space-y-3">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Plus className="h-3.5 w-3.5 text-blue-600" />
                            Tambah Komitmen Pinjaman / Leasing Baru
                        </span>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-slate-600">Nama Fasilitas / Pinjaman</Label>
                            <Input
                                placeholder="e.g. Leasing 5 Dump Truck Hino"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[11px] text-slate-600">Cicilan per Bulan (Rp)</Label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-slate-600">Durasi (Bulan)</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            className="w-full h-8 text-xs bg-slate-800 text-white hover:bg-slate-700"
                            onClick={handleAdd}
                            disabled={!name.trim() || amount <= 0}
                        >
                            Tambahkan ke Jadwal Kewajiban
                        </Button>
                    </div>
                </div>

                <DialogFooter className="pt-2">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onOpenChange(false)}>
                        Selesai
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
