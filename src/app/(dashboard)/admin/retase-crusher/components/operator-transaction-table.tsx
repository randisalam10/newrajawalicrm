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
import { CrusherOperatorTransactionItem } from "../types"
import { CheckCircle2, Clock, HardHat, Factory, Store } from "lucide-react"

type Props = {
    transactions: CrusherOperatorTransactionItem[]
    onMarkOperatorPaid: (ids: string[], isPaid: boolean) => void
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

export function OperatorTransactionTable({
    transactions,
    onMarkOperatorPaid,
    isPending = false,
}: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const allIds = transactions.map((t) => t.id)
    const isAllSelected = transactions.length > 0 && selectedIds.length === transactions.length
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < transactions.length

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
        onMarkOperatorPaid(selectedIds, isPaid)
        setSelectedIds([])
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                Tidak ada data produksi material keluar untuk filter yang dipilih.
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                        {selectedIds.length} transaksi produksi operator dipilih
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
                            <span>Tandai Belum Lunas</span>
                        </Button>
                    </div>
                </div>
            )}

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HardHat className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Detail Produksi & Insentif Operator ({transactions.length} Transaksi)
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                            <TableRow className="text-xs">
                                <TableHead className="w-[36px] text-center">
                                    <Checkbox
                                        checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                                        onCheckedChange={handleToggleAll}
                                        aria-label="Pilih semua"
                                    />
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700">Tanggal</TableHead>
                                <TableHead className="font-semibold text-slate-700">Operator</TableHead>
                                <TableHead className="font-semibold text-slate-700">Tujuan Pengiriman</TableHead>
                                <TableHead className="font-semibold text-slate-700">Truk & Sopir</TableHead>
                                <TableHead className="font-semibold text-slate-700">Material</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Volume</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Tarif / m³</TableHead>
                                <TableHead className="text-right font-semibold text-slate-900">Insentif Operator</TableHead>
                                <TableHead className="text-center font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="text-center font-semibold text-slate-700">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {transactions.map((t) => {
                                const isSelected = selectedIds.includes(t.id)
                                return (
                                    <TableRow
                                        key={t.id}
                                        className={`hover:bg-slate-50/70 transition-colors ${
                                            isSelected ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                                        }`}
                                    >
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggleOne(t.id)}
                                                aria-label={`Pilih transaksi ${t.id}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono text-slate-600 whitespace-nowrap">
                                            {t.date || "-"}
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                            {t.operatorName}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                {t.destinationType === "BATCHING_PLANT" ? (
                                                    <Factory className="h-3 w-3 text-blue-600 shrink-0" />
                                                ) : (
                                                    <Store className="h-3 w-3 text-purple-600 shrink-0" />
                                                )}
                                                <span>{t.destinationName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-mono text-slate-800">{t.plateNumber}</div>
                                            <div className="text-[11px] text-slate-500">{t.driverName}</div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-800">
                                            {t.materialName}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatNum(t.volumeM3, 1)} m³
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-500">
                                            {formatRp(t.operatorRate)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                                            {formatRp(t.operatorFee)}
                                        </TableCell>
                                        <TableCell className="text-center whitespace-nowrap">
                                            {t.isOperatorPaid ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1 font-semibold">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Lunas
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] gap-1 font-semibold">
                                                    <Clock className="h-3 w-3" />
                                                    Belum Dibayar
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={isPending}
                                                onClick={() => onMarkOperatorPaid([t.id], !t.isOperatorPaid)}
                                                className={`h-6 px-2 text-[10px] font-semibold ${
                                                    t.isOperatorPaid
                                                        ? "text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                                                        : "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                                                }`}
                                            >
                                                {t.isOperatorPaid ? "Batal Lunas" : "Tandai Lunas"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
