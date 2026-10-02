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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    PackageMinus,
    Edit,
    Trash2,
} from "lucide-react"
import {
    AggregateOutRow,
    AGGREGATE_TYPE_OPTIONS,
    OUTGOING_CATEGORY_OPTIONS,
} from "../../columns"
import { MATERIAL_COLORS } from "../../utils/material-constants"

interface MaterialKeluarTabProps {
    filteredOutData: AggregateOutRow[]
    locations: { id: string; name: string }[]
    showCabang: boolean
    canManage: boolean
    filterOutCabang: string
    setFilterOutCabang: (v: string) => void
    filterOutMaterial: string
    setFilterOutMaterial: (v: string) => void
    filterOutCategory: string
    setFilterOutCategory: (v: string) => void
    onOpenOutForm: () => void
    onEditOut: (row: AggregateOutRow) => void
    onDeleteOut: (row: AggregateOutRow) => void
}

export function MaterialKeluarTab({
    filteredOutData,
    locations,
    showCabang,
    canManage,
    filterOutCabang,
    setFilterOutCabang,
    filterOutMaterial,
    setFilterOutMaterial,
    filterOutCategory,
    setFilterOutCategory,
    onOpenOutForm,
    onEditOut,
    onDeleteOut,
}: MaterialKeluarTabProps) {
    return (
        <div className="space-y-4">
            {/* FILTER TOOLBAR KELUAR */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Filter Cabang */}
                    {showCabang && (
                        <div className="w-[180px]">
                            <Select value={filterOutCabang} onValueChange={setFilterOutCabang}>
                                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Semua Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL" className="text-xs font-semibold">Semua Cabang BP</SelectItem>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                            📍 {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Filter Jenis Material */}
                    <div className="w-[170px]">
                        <Select value={filterOutMaterial} onValueChange={setFilterOutMaterial}>
                            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Semua Material" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL" className="text-xs font-semibold">Semua Jenis Material</SelectItem>
                                {AGGREGATE_TYPE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filter Kategori */}
                    <div className="w-[180px]">
                        <Select value={filterOutCategory} onValueChange={setFilterOutCategory}>
                            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Semua Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL" className="text-xs font-semibold">Semua Kategori</SelectItem>
                                {OUTGOING_CATEGORY_OPTIONS.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value} className="text-xs">
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">
                        Total: <strong className="font-mono text-slate-800">{filteredOutData.reduce((acc, r) => acc + r.volume_cubic, 0).toFixed(1)} m³</strong> ({filteredOutData.length} transaksi)
                    </span>
                    {canManage && (
                        <Button
                            onClick={onOpenOutForm}
                            size="sm"
                            className="h-8 gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            <PackageMinus className="h-3.5 w-3.5" />
                            <span>+ Catat Material Keluar</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* TABLE MATERIAL KELUAR */}
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <SimpleDataTable<AggregateOutRow>
                    data={filteredOutData}
                    searchKeys={["no_bon", "recipient", "driver_name", "plate_number", "notes", "aggregateLabel", "categoryLabel"]}
                    searchPlaceholder="Cari no. bon, penerima, supir, plat nomor, material, atau keperluan..."
                    pageSize={15}
                >
                    {(items, sortConfig, toggleSort) => (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 border-b border-slate-200">
                                    <TableHead className="w-[110px]">
                                        <SortableHeader<AggregateOutRow>
                                            label="Tanggal"
                                            sortKey="date"
                                            sortConfig={sortConfig}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    {showCabang && (
                                        <TableHead className="w-[120px]">
                                            <SortableHeader<AggregateOutRow>
                                                label="Cabang"
                                                sortKey="locationName"
                                                sortConfig={sortConfig}
                                                onSort={toggleSort}
                                            />
                                        </TableHead>
                                    )}
                                    <TableHead className="w-[120px]">Jenis Material</TableHead>
                                    <TableHead className="w-[130px]">Kategori</TableHead>
                                    <TableHead className="w-[110px]">No. Bon</TableHead>
                                    <TableHead className="min-w-[130px]">Penerima / Tujuan</TableHead>
                                    <TableHead className="w-[145px]">Armada & Sopir</TableHead>
                                    <TableHead className="w-[105px] text-right">
                                        <SortableHeader<AggregateOutRow>
                                            label="Volume / Qty"
                                            sortKey="volume_cubic"
                                            sortConfig={sortConfig}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[130px] text-right">Nilai Material (Rp)</TableHead>
                                    <TableHead className="w-[110px] text-right">Retase DT (Rp)</TableHead>
                                    <TableHead className="min-w-[120px]">Catatan</TableHead>
                                    {canManage && <TableHead className="w-[75px] text-right">Aksi</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={showCabang ? 12 : 11} className="h-24 text-center text-muted-foreground text-xs">
                                            Tidak ada data pengeluaran material agregat yang sesuai filter.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((row) => (
                                        <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="text-xs font-mono whitespace-nowrap text-slate-700">
                                                {row.date}
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
                                                <Badge variant="outline" className="text-[10px] font-medium border-slate-300">
                                                    {row.categoryLabel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-slate-700">
                                                {row.no_bon || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-800">
                                                {row.recipient || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600">
                                                {row.transport_mode === "INTERNAL_DT" ? (
                                                    <div>
                                                        <span className="font-mono font-bold text-blue-700">{row.plate_number}</span>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <Badge className="bg-blue-600 text-white text-[9px] px-1 py-0 h-3.5">DT Internal</Badge>
                                                            {row.driver_name && <span className="text-[10px] text-slate-500">{row.driver_name}</span>}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="font-mono font-medium text-slate-700">{row.plate_number || "-"}</span>
                                                        <div className="text-[10px] text-slate-400">Pembeli: {row.driver_name || "Ambil Sendiri"}</div>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-xs text-rose-700">
                                                -{row.volume_cubic.toLocaleString("id-ID", { maximumFractionDigits: 2 })} {row.unit || "m³"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">
                                                {row.total_price && row.total_price > 0 ? (
                                                    <div>
                                                        <span className="font-bold text-slate-900">
                                                            Rp {row.total_price.toLocaleString("id-ID")}
                                                        </span>
                                                        {row.unit_price ? (
                                                            <div className="text-[10px] text-slate-500 font-mono">
                                                                @Rp {row.unit_price.toLocaleString("id-ID")}/{row.unit || "m³"}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">
                                                {row.retase_amount && row.retase_amount > 0 ? (
                                                    <div>
                                                        <span className="font-bold text-blue-800">
                                                            Rp {row.retase_amount.toLocaleString("id-ID")}
                                                        </span>
                                                        <div className="text-[9px] text-slate-400">
                                                            {row.distance_km ? `${row.distance_km} KM` : ""}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 max-w-[130px] truncate" title={row.notes || ""}>
                                                {row.notes || "-"}
                                            </TableCell>
                                            {canManage && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                            onClick={() => onEditOut(row)}
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => onDeleteOut(row)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </SimpleDataTable>
            </Card>
        </div>
    )
}
