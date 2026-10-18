"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CrusherMaterialOutDelivery } from "../types"
import { CheckCircle2, Clock, MapPin, Truck } from "lucide-react"

type Props = {
    deliveries: CrusherMaterialOutDelivery[]
    onMarkPaid: (ids: string[], isPaid: boolean) => void
    isPending?: boolean
}

function formatRp(num: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(num || 0)
}

function formatNum(num: number, decimals = 1): string {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(num || 0)
}

export function TripDetailTable({ deliveries, onMarkPaid, isPending = false }: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const allIds = deliveries.map((d) => d.id)
    const isAllSelected = deliveries.length > 0 && selectedIds.length === deliveries.length
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < deliveries.length

    const handleToggleAll = () => {
        if (isAllSelected) {
            setSelectedIds([])
        } else {
            setSelectedIds(allIds)
        }
    }

    const handleToggleOne = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        )
    }

    const handleBulkMark = (isPaid: boolean) => {
        if (selectedIds.length === 0) return
        onMarkPaid(selectedIds, isPaid)
        setSelectedIds([])
    }

    if (deliveries.length === 0) {
        return (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                Tidak ada data rincian pengiriman untuk filter yang dipilih.
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {/* Action Bar saat ada item dipilih */}
            {selectedIds.length > 0 && (
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-900 dark:text-blue-200">
                        {selectedIds.length} pengiriman dipilih
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleBulkMark(true)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Tandai Lunas</span>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleBulkMark(false)}
                            className="h-7 text-xs"
                        >
                            Tandai Belum Lunas
                        </Button>
                    </div>
                </div>
            )}

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                            <TableRow className="text-xs">
                                <TableHead className="w-8">
                                    <Checkbox
                                        checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                                        onCheckedChange={handleToggleAll}
                                    />
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700">Tanggal</TableHead>
                                <TableHead className="font-semibold text-slate-700">Jenis</TableHead>
                                <TableHead className="font-semibold text-slate-700">Armada & Ukuran</TableHead>
                                <TableHead className="font-semibold text-slate-700">Sopir</TableHead>
                                <TableHead className="font-semibold text-slate-700">Material & Vol</TableHead>
                                <TableHead className="font-semibold text-slate-700">Lokasi / Tujuan</TableHead>
                                <TableHead className="text-center font-semibold text-slate-700">Jarak (KM)</TableHead>
                                <TableHead className="text-center font-semibold text-slate-700">Rit</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Tarif</TableHead>
                                <TableHead className="text-right font-semibold text-slate-900">Upah Retase</TableHead>
                                <TableHead className="text-center font-semibold text-slate-700">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {deliveries.map((d) => (
                                <TableRow key={d.id} className="hover:bg-slate-50/70 transition-colors">
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(d.id)}
                                            onCheckedChange={() => handleToggleOne(d.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {d.date}
                                    </TableCell>
                                    <TableCell>
                                        {d.category === "MATERIAL_IN" ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] whitespace-nowrap">
                                                Masuk (Quarry)
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] whitespace-nowrap">
                                                Keluar (Non-BP)
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                                <Truck className="h-3 w-3 text-slate-400" />
                                                {d.plateNumber}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] h-4 px-1 ${
                                                    d.dumpTruckSize === "KECIL"
                                                        ? "border-amber-300 text-amber-700 bg-amber-50"
                                                        : "border-slate-300 text-slate-700 bg-slate-50"
                                                }`}
                                            >
                                                {d.dumpTruckSize === "KECIL" ? "DT Kecil" : "DT Besar"}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                                        {d.driverName}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <span className="font-medium">{d.materialName}</span>
                                            {d.volumeM3 > 0 && (
                                                <span className="ml-1 font-bold text-emerald-700 dark:text-emerald-400">
                                                    ({formatNum(d.volumeM3, 1)} m³)
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                            <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                                            <span className="truncate max-w-[150px] font-medium">{d.destinationName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {d.distanceKm > 0 ? `${formatNum(d.distanceKm, 1)} km` : "-"}
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {d.ritase}
                                    </TableCell>
                                    <TableCell className="text-right text-slate-500 text-[11px]">
                                        {d.retaseRate > 0 ? formatRp(d.retaseRate) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                                        {formatRp(d.retaseAmount)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {d.isRetasePaid ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] inline-flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                <span>Lunas</span>
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] inline-flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>Belum</span>
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
