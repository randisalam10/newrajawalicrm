"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Calendar, TrendingUp, TrendingDown, Edit3, Trash2 } from "lucide-react"
import { fmt, fmtDate } from "../helpers"
import { MaterialPriceHistoryItem } from "../types"

interface MaterialHistoryTableProps {
    histories: MaterialPriceHistoryItem[]
    onEditHistory: (h: MaterialPriceHistoryItem) => void
    onOpenDeleteConfirm: (id: string, text: string) => void
}

export function MaterialHistoryTable({
    histories,
    onEditHistory,
    onOpenDeleteConfirm,
}: MaterialHistoryTableProps) {
    return (
        <Card className="border-slate-200/80 shadow-2xs">
            <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Riwayat Kronologis Penetapan Harga Material
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                        Catatan riwayat tanggal mulai berlaku, selisih kenaikan/penurunan harga, dan penanggung jawab
                    </CardDescription>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table className="text-xs">
                    <TableHeader className="bg-slate-50 text-[11px]">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-700">Tgl Berlaku (Effective)</TableHead>
                            <TableHead className="font-semibold text-slate-700">Material</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Harga Satuan (Rp/m³)</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Perubahan</TableHead>
                            <TableHead className="font-semibold text-slate-700">Lingkup Cabang</TableHead>
                            <TableHead className="font-semibold text-slate-700">Keterangan / Alasan</TableHead>
                            <TableHead className="font-semibold text-slate-700">Dicatat Oleh</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {histories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-6 text-slate-400 italic">
                                    Belum ada riwayat perubahan harga.
                                </TableCell>
                            </TableRow>
                        ) : (
                            histories.map((h) => {
                                const isIncrease = h.price_diff > 0
                                const isDecrease = h.price_diff < 0
                                return (
                                    <TableRow key={h.id} className="hover:bg-slate-50/80">
                                        <TableCell className="font-mono font-medium text-slate-800">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                <span>{fmtDate(h.effective_date)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-900">
                                            {h.material_name}
                                            <span className="text-[10px] text-slate-400 ml-1 font-mono">({h.material_code})</span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-900">
                                            {fmt(h.price_per_m3)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {h.old_price && h.old_price > 0 ? (
                                                <span className={`inline-flex items-center gap-0.5 font-semibold text-[11px] ${
                                                    isIncrease ? "text-rose-600" : isDecrease ? "text-emerald-600" : "text-slate-500"
                                                }`}>
                                                    {isIncrease ? <TrendingUp className="w-3 h-3" /> : isDecrease ? <TrendingDown className="w-3 h-3" /> : null}
                                                    {isIncrease ? "+" : ""}{fmt(h.price_diff)} ({h.percentage.toFixed(1)}%)
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-[10px]">Harga Dasar Awal</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {h.locationName}
                                        </TableCell>
                                        <TableCell className="text-slate-600 max-w-[200px] truncate" title={h.notes || ""}>
                                            {h.notes || "-"}
                                        </TableCell>
                                        <TableCell className="text-slate-500">
                                            {h.createdByName}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onEditHistory(h)}
                                                    className="h-6 w-6 p-0 text-slate-600 hover:text-blue-600 cursor-pointer"
                                                    title="Edit riwayat ini"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const text = `${h.material_name} - ${fmt(h.price_per_m3)} (Berlaku: ${fmtDate(h.effective_date)})`
                                                        onOpenDeleteConfirm(h.id, text)
                                                    }}
                                                    className="h-6 w-6 p-0 text-slate-600 hover:text-rose-600 cursor-pointer"
                                                    title="Hapus riwayat ini"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    )
}
