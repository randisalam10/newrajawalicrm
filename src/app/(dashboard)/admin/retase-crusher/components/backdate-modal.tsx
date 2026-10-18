"use client"

import { useState, useTransition } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CrusherLocationOption } from "../types"
import { recalculateCrusherRetaseBackdate } from "../actions"
import { toast } from "sonner"
import { Calculator, Calendar, Loader2, AlertCircle } from "lucide-react"

type Props = {
    isOpen: boolean
    onClose: () => void
    locations: CrusherLocationOption[]
    currentLocationId?: string
    onCompleted: () => void
}

function formatRp(num: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(num || 0)
}

export function BackdateRecalcModal({
    isOpen,
    onClose,
    locations,
    currentLocationId,
    onCompleted,
}: Props) {
    const [isPending, startTransition] = useTransition()

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const today = now.toISOString().split("T")[0]

    const [startDate, setStartDate] = useState(firstDay)
    const [endDate, setEndDate] = useState(today)
    const [selectedLocation, setSelectedLocation] = useState<string>(currentLocationId || "all")
    const [onlyUnpaid, setOnlyUnpaid] = useState(true)

    const handleExecute = () => {
        if (!startDate || !endDate) {
            toast.error("Tentukan rentang tanggal awal dan akhir")
            return
        }
        if (startDate > endDate) {
            toast.error("Tanggal awal tidak boleh melebihi tanggal akhir")
            return
        }

        startTransition(async () => {
            try {
                const res = await recalculateCrusherRetaseBackdate({
                    startDate,
                    endDate,
                    locationId: selectedLocation === "all" ? undefined : selectedLocation,
                    onlyUnpaid,
                })

                if (res.count === 0) {
                    toast.info("Tidak ada transaksi pengiriman non-BP yang sesuai kriteria filter.")
                } else {
                    toast.success(
                        `Berhasil menghitung ulang ${res.count} pengiriman (Total Retase: ${formatRp(
                            res.totalAmount
                        )})`
                    )
                }

                onCompleted()
                onClose()
            } catch (err: any) {
                toast.error(err.message || "Gagal melakukan hitung ulang backdate")
            }
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md w-full p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        Hitung Ulang & Terapkan Retase (Backdate)
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2 text-xs">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-2 text-blue-900 dark:text-blue-300">
                        <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                            Fitur ini akan menghitung ulang upah retase seluruh transaksi pengiriman non-BP pada rentang tanggal yang dipilih berdasarkan master tarif & rumus yang aktif.
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Dari Tanggal *</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Sampai Tanggal *</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold">Cabang Stone Crusher</Label>
                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                                <SelectValue placeholder="Pilih Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Stone Crusher</SelectItem>
                                {locations.map((l) => (
                                    <SelectItem key={l.id} value={l.id}>
                                        {l.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                        <Checkbox
                            id="onlyUnpaid"
                            checked={onlyUnpaid}
                            onCheckedChange={(checked) => setOnlyUnpaid(Boolean(checked))}
                        />
                        <label
                            htmlFor="onlyUnpaid"
                            className="text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Hanya hitung ulang transaksi yang <b>belum lunas</b> (Abaikan yang sudah dibayarkan)
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={onClose}
                            className="h-9 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isPending}
                            onClick={handleExecute}
                            className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
                        >
                            {isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Calculator className="h-3.5 w-3.5" />
                            )}
                            Terapkan & Hitung Ulang
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
