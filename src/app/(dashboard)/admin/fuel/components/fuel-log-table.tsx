"use client"

import { useState, useTransition } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { VehicleFuelLogItem } from "../types"
import { deleteVehicleFuelLog } from "../actions"
import { Trash2, Loader2, Gauge } from "lucide-react"

interface Props {
    items: VehicleFuelLogItem[]
    canDelete?: boolean
    onSuccess: () => void
}

export function FuelLogTable({ items, canDelete = true, onSuccess }: Props) {
    const [isPending, startTransition] = useTransition()
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null)

    const formatRp = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val || 0)
    }

    const formatNum = (val: number, decimals = 1) => {
        return new Intl.NumberFormat("id-ID", {
            maximumFractionDigits: decimals,
        }).format(val || 0)
    }

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr)
            return d.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
        } catch {
            return dateStr
        }
    }

    const handleDelete = () => {
        if (!selectedDeleteId) return
        startTransition(async () => {
            try {
                await deleteVehicleFuelLog(selectedDeleteId)
                toast.success("Catatan BBM berhasil dihapus")
                setSelectedDeleteId(null)
                onSuccess()
            } catch (err: any) {
                toast.error(err.message || "Gagal menghapus log BBM")
            }
        })
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50">
                            <TableHead className="w-[100px] text-xs font-semibold">Tanggal</TableHead>
                            <TableHead className="w-[110px] text-xs font-semibold">Cabang</TableHead>
                            <TableHead className="min-w-[150px] text-xs font-semibold">Kendaraan / Unit</TableHead>
                            <TableHead className="min-w-[130px] text-xs font-semibold">Odometer (KM/HM)</TableHead>
                            <TableHead className="text-right w-[110px] text-xs font-semibold">Volume (L)</TableHead>
                            <TableHead className="w-[110px] text-xs font-semibold">Sumber BBM</TableHead>
                            <TableHead className="text-right min-w-[120px] text-xs font-semibold">Harga Manual</TableHead>
                            <TableHead className="text-right min-w-[130px] text-xs font-semibold">Total Biaya</TableHead>
                            <TableHead className="min-w-[130px] text-xs font-semibold">Driver / Bon</TableHead>
                            {canDelete && <TableHead className="w-[60px] text-center text-xs font-semibold">Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={canDelete ? 10 : 9}
                                    className="h-32 text-center text-xs text-slate-500"
                                >
                                    Belum ada data pengisian BBM pada periode/filter ini.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id} className="text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                                    <TableCell className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                        {formatDate(item.date)}
                                    </TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                        {item.locationName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                            <span>{item.vehicleCode ? `[${item.vehicleCode}]` : ""} {item.plateNumber}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            {item.vehicleType} • Meter: {item.meterType}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                            <Gauge className="h-3 w-3 text-slate-400" />
                                            <span>{formatNum(item.currentMeter, item.meterType === "HM" ? 1 : 0)} {item.meterType}</span>
                                        </div>
                                        {item.meterDelta !== null && item.meterDelta !== undefined && (
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                +{formatNum(item.meterDelta, item.meterType === "HM" ? 1 : 0)} {item.meterType}
                                            </div>
                                        )}
                                        {item.isMeterReset && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-300 text-amber-700 bg-amber-50">
                                                Speedo Baru
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-bold font-mono text-amber-700 dark:text-amber-400">
                                        {formatNum(item.liters, 1)} L
                                    </TableCell>
                                    <TableCell>
                                        {item.fuelSource === "RBL" ? (
                                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold text-[10px]">
                                                Kas RBL
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-sky-50 text-sky-700 border-sky-200 font-semibold text-[10px]">
                                                Non-RBL
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-slate-600 dark:text-slate-400">
                                        {item.costPerLiter > 0 ? `${formatRp(item.costPerLiter)}/L` : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-bold font-mono text-slate-900 dark:text-slate-100">
                                        {item.totalCost > 0 ? formatRp(item.totalCost) : "-"}
                                    </TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-400">
                                        <div className="font-medium text-slate-800 dark:text-slate-200">
                                            {item.driverName || "-"}
                                        </div>
                                        {item.receiptNo && (
                                            <div className="text-[10px] text-slate-500 font-mono">
                                                Bon: {item.receiptNo}
                                            </div>
                                        )}
                                        {item.notes && (
                                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                                {item.notes}
                                            </div>
                                        )}
                                    </TableCell>
                                    {canDelete && (
                                        <TableCell className="text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedDeleteId(item.id)}
                                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Konfirmasi Hapus */}
            <AlertDialog
                open={Boolean(selectedDeleteId)}
                onOpenChange={(open) => !open && setSelectedDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Catatan Pengisian BBM?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Data catatan BBM dan riwayat odometer ini akan dihapus dari sistem. Laporan efisiensi armada akan diperbarui secara otomatis.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ya, Hapus Data"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
