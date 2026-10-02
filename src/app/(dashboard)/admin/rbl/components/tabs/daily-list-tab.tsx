"use client"

import React from "react"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Calendar, FileText, Fuel, Gauge } from "lucide-react"
import { fmt, fmtDate } from "../../utils/rbl-helpers"

interface DailyListTabProps {
    activeBudget: any
    expenseViewMode: "grouped" | "flat"
    setExpenseViewMode: (mode: "grouped" | "flat") => void
    expensesByDate: Array<{ date: string; items: any[]; subtotal: number }>
    sortedAllExpenses: any[]
    canEdit?: boolean
    canDelete?: boolean
    onOpenCategoryReport: () => void
    onOpenCreateBudget: () => void
    onEditExpense: (item: any) => void
    onDeleteExpense: (id: string) => void
}

export function DailyListTab({
    activeBudget,
    expenseViewMode,
    setExpenseViewMode,
    expensesByDate,
    sortedAllExpenses,
    canEdit,
    canDelete,
    onOpenCategoryReport,
    onOpenCreateBudget,
    onEditExpense,
    onDeleteExpense,
}: DailyListTabProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                        Total <span className="font-bold text-slate-800 font-mono">{activeBudget?.expenses?.length || 0}</span> transaksi pengeluaran tercatat
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onOpenCategoryReport}
                        className="h-7 text-xs gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 cursor-pointer shadow-2xs font-medium"
                    >
                        <Fuel className="h-3.5 w-3.5 text-amber-600" />
                        <span>Ekspor & Laporan Kategori</span>
                    </Button>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border">
                        <button
                            type="button"
                            onClick={() => setExpenseViewMode("grouped")}
                            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                                expenseViewMode === "grouped"
                                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                    : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            Per Tanggal
                        </button>
                        <button
                            type="button"
                            onClick={() => setExpenseViewMode("flat")}
                            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                                expenseViewMode === "flat"
                                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                    : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            Tabel Lengkap (1 — {activeBudget?.expenses?.length || 0})
                        </button>
                    </div>
                </div>
            </div>

            {!activeBudget ? (
                <Card className="p-10 text-center text-slate-500 text-xs border rounded-xl bg-slate-50/60 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="font-semibold text-slate-700 text-sm">Tidak Ada Budget Aktif</div>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Daftar pengeluaran terikat pada periode budget yang aktif. Buka budget baru terlebih dahulu untuk mulai mencatat transaksi.
                    </p>
                    <Button
                        size="sm"
                        onClick={onOpenCreateBudget}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Buka Budget Sekarang
                    </Button>
                </Card>
            ) : (!activeBudget.expenses || activeBudget.expenses.length === 0) ? (
                <Card className="p-8 text-center text-slate-500 text-sm">
                    Belum ada pengeluaran yang dicatat pada budget aktif ini.
                </Card>
            ) : expenseViewMode === "grouped" ? (
                expensesByDate.map(group => (
                    <Card key={group.date} className="border shadow-xs overflow-hidden">
                        <div className="bg-slate-100/70 px-4 py-2.5 flex items-center justify-between border-b text-xs">
                            <div className="flex items-center gap-2 font-bold text-slate-800">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span>{fmtDate(group.date)}</span>
                                <Badge variant="outline" className="text-[10px] bg-white">
                                    {group.items.length} item
                                </Badge>
                            </div>
                            <div className="font-mono font-bold text-sm text-slate-900">
                                Subtotal Hari Ini: {fmt(group.subtotal)}
                            </div>
                        </div>

                        <Table>
                            <TableHeader className="bg-white">
                                <TableRow className="text-[11px] text-slate-500">
                                    <TableHead className="w-12 text-center">No</TableHead>
                                    <TableHead>Nama Item / Uraian</TableHead>
                                    <TableHead className="w-36">Kategori</TableHead>
                                    <TableHead className="w-24 text-center">Qty / Satuan</TableHead>
                                    <TableHead className="w-28 text-right">Harga Satuan</TableHead>
                                    <TableHead className="w-32 text-right">Total</TableHead>
                                    <TableHead className="w-24">No. Bon</TableHead>
                                    <TableHead className="w-16 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {group.items.map((item, itemIdx) => (
                                    <TableRow key={item.id} className="text-xs hover:bg-slate-50/50">
                                        <TableCell className="text-center font-mono text-slate-400 font-semibold text-xs">
                                            {itemIdx + 1}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            <div>{item.itemDescription}</div>
                                            {item.vehicle && (
                                                <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-800 border-amber-200 font-medium">
                                                        <Fuel className="h-2.5 w-2.5 mr-1 text-amber-600" />
                                                        {item.vehicle.code} ({item.vehicle.plate_number || item.vehicle.plateNumber})
                                                    </Badge>
                                                    {item.kmMeter && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 text-slate-700 border-slate-200 font-mono">
                                                            <Gauge className="h-2.5 w-2.5 mr-1 text-slate-500" />
                                                            {Number(item.kmMeter).toLocaleString("id-ID")} KM
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                            {item.notes && (
                                                <span className="block text-[10px] text-slate-400">{item.notes}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                                {item.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center font-mono">
                                            {item.quantity} {item.unit}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-600">
                                            {fmt(item.unitPrice)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-900">
                                            {fmt(item.amount)}
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-mono text-[11px]">
                                            {item.receiptNo || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {canEdit && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onEditExpense(item)}
                                                        className="h-7 w-7 text-slate-500 hover:text-blue-600"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDeleteExpense(item.id)}
                                                        className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                ))
            ) : (
                <Card className="border shadow-xs overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="text-[11px] text-slate-500">
                                <TableHead className="w-12 text-center">No</TableHead>
                                <TableHead className="w-28">Tanggal</TableHead>
                                <TableHead>Nama Item / Uraian</TableHead>
                                <TableHead className="w-36">Kategori</TableHead>
                                <TableHead className="w-24 text-center">Qty / Satuan</TableHead>
                                <TableHead className="w-28 text-right">Harga Satuan</TableHead>
                                <TableHead className="w-32 text-right">Total</TableHead>
                                <TableHead className="w-24">No. Bon</TableHead>
                                <TableHead className="w-16 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedAllExpenses.map((item: any, idx: number) => (
                                <TableRow key={item.id} className="text-xs hover:bg-slate-50/50">
                                    <TableCell className="text-center font-mono text-slate-400 font-semibold text-xs">
                                        {idx + 1}
                                    </TableCell>
                                    <TableCell className="font-mono text-slate-600 text-xs whitespace-nowrap">
                                        {format(new Date(item.date), "dd/MM/yyyy")}
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900">
                                        <div>{item.itemDescription}</div>
                                        {item.vehicle && (
                                            <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-800 border-amber-200 font-medium">
                                                    <Fuel className="h-2.5 w-2.5 mr-1 text-amber-600" />
                                                    {item.vehicle.code} ({item.vehicle.plate_number || item.vehicle.plateNumber})
                                                </Badge>
                                                {item.kmMeter && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 text-slate-700 border-slate-200 font-mono">
                                                        <Gauge className="h-2.5 w-2.5 mr-1 text-slate-500" />
                                                        {Number(item.kmMeter).toLocaleString("id-ID")} KM
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                        {item.notes && (
                                            <span className="block text-[10px] text-slate-400">{item.notes}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                            {item.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center font-mono">
                                        {item.quantity} {item.unit}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-slate-600">
                                        {fmt(item.unitPrice)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-slate-900">
                                        {fmt(item.amount)}
                                    </TableCell>
                                    <TableCell className="text-slate-500 font-mono text-[11px]">
                                        {item.receiptNo || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {canEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onEditExpense(item)}
                                                    className="h-7 w-7 text-slate-500 hover:text-blue-600"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onDeleteExpense(item.id)}
                                                    className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    )
}
