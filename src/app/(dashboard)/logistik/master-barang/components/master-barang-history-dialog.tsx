"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { History } from "lucide-react"

interface MasterBarangHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: any
}

export function MasterBarangHistoryDialog({
    open,
    onOpenChange,
    item,
}: MasterBarangHistoryDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg flex items-center gap-2">
                                <History className="w-5 h-5 text-blue-600" />
                                Riwayat Perubahan Harga
                            </DialogTitle>
                            <p className="text-xs text-slate-500 mt-1">
                                <span className="font-semibold text-slate-800">{item?.name}</span> ({item?.kode_barang}) • {item?.supplier?.name}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-400">Harga Saat Ini:</span>
                            <div className="text-sm font-bold text-green-700">
                                Rp {Number(item?.harga || 0).toLocaleString('id-ID')} /{item?.satuan}
                            </div>
                        </div>
                    </div>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 p-1">
                    {(!item?.priceHistories || item.priceHistories.length === 0) ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Belum ada riwayat perubahan harga tercatat untuk barang ini.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 text-xs">
                                    <TableHead className="py-2 text-xs">Tanggal</TableHead>
                                    <TableHead className="py-2 text-right text-xs">Harga Lama</TableHead>
                                    <TableHead className="py-2 text-right text-xs">Harga Baru</TableHead>
                                    <TableHead className="py-2 text-center text-xs">Perubahan</TableHead>
                                    <TableHead className="py-2 text-xs">Diubah Oleh</TableHead>
                                    <TableHead className="py-2 text-xs">Keterangan / Alasan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {item.priceHistories.map((h: any, idx: number) => {
                                    const isIncrease = h.priceDiff > 0
                                    const isDecrease = h.priceDiff < 0
                                    return (
                                        <TableRow key={h.id || idx} className="text-xs hover:bg-slate-50">
                                            <TableCell className="py-2 font-mono whitespace-nowrap text-slate-600">
                                                {new Date(h.effectiveDate || h.createdAt).toLocaleDateString('id-ID', {
                                                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </TableCell>
                                            <TableCell className="py-2 text-right text-slate-500 whitespace-nowrap">
                                                {h.oldPrice > 0 ? `Rp ${Number(h.oldPrice).toLocaleString('id-ID')}` : '-'}
                                            </TableCell>
                                            <TableCell className="py-2 text-right font-bold text-slate-900 whitespace-nowrap">
                                                Rp {Number(h.newPrice).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell className="py-2 text-center whitespace-nowrap">
                                                {h.oldPrice === 0 ? (
                                                    <span className="inline-flex text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        Harga Awal
                                                    </span>
                                                ) : isIncrease ? (
                                                    <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                                        ▲ +Rp {Math.abs(h.priceDiff).toLocaleString('id-ID')} (+{h.percentage.toFixed(1)}%)
                                                    </span>
                                                ) : isDecrease ? (
                                                    <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                        ▼ -Rp {Math.abs(h.priceDiff).toLocaleString('id-ID')} ({h.percentage.toFixed(1)}%)
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400">Tetap</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-2 text-slate-700 whitespace-nowrap">
                                                {h.updatedBy?.employee?.name || h.updatedBy?.username || "Sistem"}
                                            </TableCell>
                                            <TableCell className="py-2 text-slate-600 max-w-[200px] truncate" title={h.reason || "-"}>
                                                {h.reason || "-"}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
                <DialogFooter className="border-t pt-3">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
