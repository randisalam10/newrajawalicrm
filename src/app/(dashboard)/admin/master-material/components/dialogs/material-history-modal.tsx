"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { History, Calendar, ArrowUpRight, ArrowDownRight, Edit3, Trash2 } from "lucide-react"
import { fmt, fmtDate } from "../../helpers"
import { MasterMaterialItem, MaterialPriceHistoryItem } from "../../types"

interface MaterialHistoryModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    material: MasterMaterialItem | null
    canManage: boolean
    onEditHistoryItem: (item: MaterialPriceHistoryItem) => void
    onDeleteHistoryItem: (id: string, text: string) => void
}

export function MaterialHistoryModal({
    open,
    onOpenChange,
    material,
    canManage,
    onEditHistoryItem,
    onDeleteHistoryItem
}: MaterialHistoryModalProps) {
    if (!material) return null

    const histories = material.histories || []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-slate-900">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                            <History className="w-4 h-4" />
                        </div>
                        <DialogTitle className="text-base font-bold">
                            Riwayat Perubahan Harga: {material.name}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-slate-500">
                        Log perubahan tarif per m³ material <span className="font-mono font-semibold">{material.code}</span> dari waktu ke waktu.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    {histories.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                            Belum ada catatan riwayat perubahan harga untuk material ini.
                        </div>
                    ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <Table className="text-xs">
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-semibold text-slate-700">Mulai Berlaku</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Lingkup Cabang</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700">Harga per m³</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Perubahan</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Catatan</TableHead>
                                        {canManage && <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {histories.map((h, idx) => {
                                        const isIncrease = (h.price_diff || 0) > 0
                                        const isDecrease = (h.price_diff || 0) < 0
                                        const hasChange = h.old_price && h.old_price > 0 && h.price_diff !== 0

                                        return (
                                            <TableRow key={h.id} className="hover:bg-slate-50/80">
                                                <TableCell className="font-medium text-slate-800 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{fmtDate(h.effective_date)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] ${
                                                            h.locationId
                                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                : "bg-slate-50 text-slate-600 border-slate-200"
                                                        }`}
                                                    >
                                                        {h.locationName || "Semua Cabang (Global)"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                                    {fmt(h.price_per_m3)}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {hasChange ? (
                                                        <span
                                                            className={`inline-flex items-center text-[10px] font-semibold ${
                                                                isIncrease ? "text-rose-600" : isDecrease ? "text-emerald-600" : "text-slate-500"
                                                            }`}
                                                        >
                                                            {isIncrease ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                                            {isIncrease ? "+" : ""}{fmt(h.price_diff)} ({h.percentage.toFixed(1)}%)
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 italic">Harga Awal</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-slate-600 text-[11px] max-w-[180px] truncate" title={h.notes || ""}>
                                                    {h.notes || "-"}
                                                </TableCell>
                                                {canManage && (
                                                    <TableCell className="text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    onOpenChange(false)
                                                                    onEditHistoryItem(h)
                                                                }}
                                                                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                                                                title="Koreksi Riwayat Ini"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </Button>
                                                            {histories.length > 1 && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        onOpenChange(false)
                                                                        onDeleteHistoryItem(
                                                                            h.id,
                                                                            `${material.name} - ${fmt(h.price_per_m3)} (${fmtDate(h.effective_date)})`
                                                                        )
                                                                    }}
                                                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                                                    title="Hapus Entri Riwayat"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
