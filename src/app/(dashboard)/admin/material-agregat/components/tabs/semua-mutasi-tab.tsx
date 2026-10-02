"use client"

import React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownLeft, ArrowUpRight, Edit, Trash2 } from "lucide-react"
import { AggregateCombinedRow, AggregateInRow, AggregateOutRow } from "../../columns"
import { MATERIAL_COLORS } from "../../utils/material-constants"

interface SemuaMutasiTabProps {
    combinedData: AggregateCombinedRow[]
    showCabang: boolean
    canManage: boolean
    onEditIn: (row: AggregateInRow) => void
    onDeleteIn: (row: AggregateInRow) => void
    onEditOut: (row: AggregateOutRow) => void
    onDeleteOut: (row: AggregateOutRow) => void
}

export function SemuaMutasiTab({
    combinedData,
    showCabang,
    canManage,
    onEditIn,
    onDeleteIn,
    onEditOut,
    onDeleteOut,
}: SemuaMutasiTabProps) {
    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <SimpleDataTable<AggregateCombinedRow>
                data={combinedData}
                searchKeys={["no_bon", "party", "vehicleInfo", "notes", "aggregateLabel", "categoryOrSource"]}
                searchPlaceholder="Cari surat jalan, supplier/pembeli, kendaraan, sopir, atau keperluan..."
                pageSize={15}
            >
                {(items, sortConfig, toggleSort) => (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-200">
                                <TableHead className="w-[105px]">
                                    <SortableHeader<AggregateCombinedRow>
                                        label="Tanggal"
                                        sortKey="date"
                                        sortConfig={sortConfig}
                                        onSort={toggleSort}
                                    />
                                </TableHead>
                                <TableHead className="w-[100px] text-center">Arah Mutasi</TableHead>
                                {showCabang && <TableHead className="w-[110px]">Cabang</TableHead>}
                                <TableHead className="w-[115px]">Material</TableHead>
                                <TableHead className="w-[130px]">Kategori / Sumber</TableHead>
                                <TableHead className="w-[105px]">No. Surat Jalan</TableHead>
                                <TableHead className="min-w-[130px]">Pihak / Rekanan</TableHead>
                                <TableHead className="w-[140px]">Armada & Sopir</TableHead>
                                <TableHead className="w-[110px] text-right">
                                    <SortableHeader<AggregateCombinedRow>
                                        label="Volume / Qty"
                                        sortKey="volume"
                                        sortConfig={sortConfig}
                                        onSort={toggleSort}
                                    />
                                </TableHead>
                                <TableHead className="w-[125px] text-right">Nilai / Retase</TableHead>
                                <TableHead className="min-w-[120px]">Catatan</TableHead>
                                {canManage && <TableHead className="w-[75px] text-right">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={showCabang ? 12 : 11} className="h-24 text-center text-muted-foreground text-xs">
                                        Belum ada transaksi mutasi material agregat.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((row) => {
                                    const isIncoming = row.direction === "IN"
                                    return (
                                        <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="text-xs font-mono whitespace-nowrap text-slate-700">
                                                {row.date}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isIncoming ? (
                                                    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] px-1.5 py-0.5 font-bold gap-1">
                                                        <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                                                        MASUK
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-800 text-[10px] px-1.5 py-0.5 font-bold gap-1">
                                                        <ArrowUpRight className="w-3 h-3 text-rose-600" />
                                                        KELUAR
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            {showCabang && (
                                                <TableCell className="text-xs font-medium text-slate-800">
                                                    {row.locationName}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${MATERIAL_COLORS[row.aggregate_type] || "bg-slate-100 text-slate-700"}`}>
                                                    {row.aggregateLabel}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-[10px] font-medium ${isIncoming ? "border-emerald-200 bg-emerald-50/30 text-emerald-900" : "border-slate-300"}`}>
                                                    {row.categoryOrSource}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-slate-700">
                                                {row.no_bon}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-800">
                                                {row.party}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600">
                                                <div className="font-mono text-[11px]">{row.vehicleInfo}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-xs">
                                                {isIncoming ? (
                                                    <span className="text-emerald-700 font-black">
                                                        +{row.volume.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {row.unit}
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-700 font-black">
                                                        -{row.volume.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {row.unit}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-mono">
                                                {row.financialInfo ? (
                                                    <span className="font-bold text-slate-900 text-[11px]">
                                                        {row.financialInfo}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 max-w-[140px] truncate" title={row.notes || ""}>
                                                {row.notes || "-"}
                                            </TableCell>
                                            {canManage && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                            onClick={() => {
                                                                if (isIncoming && row.rawIn) {
                                                                    onEditIn(row.rawIn)
                                                                } else if (!isIncoming && row.rawOut) {
                                                                    onEditOut(row.rawOut)
                                                                }
                                                            }}
                                                            title="Edit transaksi"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                if (isIncoming && row.rawIn) {
                                                                    onDeleteIn(row.rawIn)
                                                                } else if (!isIncoming && row.rawOut) {
                                                                    onDeleteOut(row.rawOut)
                                                                }
                                                            }}
                                                            title="Hapus transaksi"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                )}
            </SimpleDataTable>
        </Card>
    )
}
