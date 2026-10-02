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
    Mountain,
    ShoppingCart,
    RotateCcw,
    AlertCircle,
    Edit,
    Trash2,
} from "lucide-react"
import {
    AggregateInRow,
    AGGREGATE_TYPE_OPTIONS,
} from "../../columns"
import { MATERIAL_COLORS } from "../../utils/material-constants"

interface MaterialMasukTabProps {
    filteredData: AggregateInRow[]
    locations: { id: string; name: string }[]
    showCabang: boolean
    canManage: boolean
    filterCabang: string
    setFilterCabang: (v: string) => void
    filterMaterial: string
    setFilterMaterial: (v: string) => void
    filterSource: string
    setFilterSource: (v: string) => void
    filterDtSize: string
    setFilterDtSize: (v: string) => void
    hasActiveFilters: boolean
    resetFilters: () => void
    totalVol: number
    onEdit: (row: AggregateInRow) => void
    onDelete: (row: AggregateInRow) => void
}

export function MaterialMasukTab({
    filteredData,
    locations,
    showCabang,
    canManage,
    filterCabang,
    setFilterCabang,
    filterMaterial,
    setFilterMaterial,
    filterSource,
    setFilterSource,
    filterDtSize,
    setFilterDtSize,
    hasActiveFilters,
    resetFilters,
    totalVol,
    onEdit,
    onDelete,
}: MaterialMasukTabProps) {
    return (
        <div className="space-y-4">
            {/* FILTER TOOLBAR */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Filter Cabang */}
                    {showCabang && (
                        <div className="w-[180px]">
                            <Select value={filterCabang} onValueChange={setFilterCabang}>
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
                        <Select value={filterMaterial} onValueChange={setFilterMaterial}>
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

                    {/* Filter Sumber */}
                    <div className="w-[160px]">
                        <Select value={filterSource} onValueChange={setFilterSource}>
                            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Semua Sumber" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL" className="text-xs font-semibold">Semua Sumber</SelectItem>
                                <SelectItem value="Internal" className="text-xs">⛰️ Quarry Sendiri</SelectItem>
                                <SelectItem value="External" className="text-xs">🛒 Eksternal Vendor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filter Ukuran DT */}
                    <div className="w-[150px]">
                        <Select value={filterDtSize} onValueChange={setFilterDtSize}>
                            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Semua Ukuran DT" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL" className="text-xs font-semibold">Semua Ukuran DT</SelectItem>
                                <SelectItem value="BESAR" className="text-xs">🚛 DT Besar (Tronton)</SelectItem>
                                <SelectItem value="KECIL" className="text-xs">🚚 DT Kecil (Engkel)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Reset Filter Button */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 font-medium"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Reset Filter
                        </Button>
                    )}
                </div>

                <div className="text-xs text-slate-500 font-medium">
                    Menampilkan <span className="font-bold text-slate-800">{filteredData.length}</span> transaksi
                    (<span className="font-bold font-mono text-slate-800">{totalVol.toFixed(1)} m³</span>)
                </div>
            </div>

            {/* TABLE PENERIMAAN MATERIAL */}
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <SimpleDataTable<AggregateInRow>
                    data={filteredData}
                    searchKeys={["no_bon", "driver_name", "plate_number", "aggregateLabel", "supplier", "notes"]}
                    searchPlaceholder="Cari no. bon, supir, plat nomor, material, atau supplier..."
                    pageSize={15}
                >
                    {(items, sortConfig, toggleSort) => (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 border-b border-slate-200">
                                    <TableHead className="w-[110px]">
                                        <SortableHeader<AggregateInRow>
                                            label="Tanggal"
                                            sortKey="date"
                                            sortConfig={sortConfig}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    {showCabang && (
                                        <TableHead className="w-[120px]">
                                            <SortableHeader<AggregateInRow>
                                                label="Cabang"
                                                sortKey="locationName"
                                                sortConfig={sortConfig}
                                                onSort={toggleSort}
                                            />
                                        </TableHead>
                                    )}
                                    <TableHead className="w-[130px]">
                                        <SortableHeader<AggregateInRow>
                                            label="Material"
                                            sortKey="aggregateLabel"
                                            sortConfig={sortConfig}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[110px]">Sumber</TableHead>
                                    <TableHead className="w-[130px]">
                                        <SortableHeader<AggregateInRow>
                                            label="No. Bon / DO"
                                            sortKey="no_bon"
                                            sortConfig={sortConfig}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[140px]">
                                        <SortableHeader<AggregateInRow>
                                            label="Sopir"
                                            sortKey="driver_name"
                                            sortConfig={sortConfig}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[150px]">Kendaraan / DT</TableHead>
                                    <TableHead className="w-[110px] text-right">
                                        <SortableHeader<AggregateInRow>
                                            label="Volume (m³)"
                                            sortKey="volume_cubic"
                                            sortConfig={sortConfig}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[140px] text-right">
                                        <SortableHeader<AggregateInRow>
                                            label="Nilai Material"
                                            sortKey="total_price"
                                            sortConfig={sortConfig}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[160px]">Retase / Jarak</TableHead>
                                    <TableHead className="min-w-[140px]">Supplier / Catatan</TableHead>
                                    {canManage && (
                                        <TableHead className="w-[80px] text-right text-xs uppercase font-semibold">
                                            Aksi
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={showCabang ? (canManage ? 12 : 11) : (canManage ? 11 : 10)}
                                            className="h-36 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <AlertCircle className="h-6 w-6 text-slate-300" />
                                                <span className="font-medium text-sm">Tidak ada data material masuk yang cocok.</span>
                                                {hasActiveFilters && (
                                                    <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs h-7">
                                                        Reset Filter
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Tanggal */}
                                            <TableCell className="text-xs font-medium text-slate-700 whitespace-nowrap">
                                                {item.date}
                                            </TableCell>

                                            {/* Cabang */}
                                            {showCabang && (
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                        {item.locationName}
                                                    </span>
                                                </TableCell>
                                            )}

                                            {/* Material */}
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${MATERIAL_COLORS[item.aggregate_type] || MATERIAL_COLORS.Other}`}
                                                >
                                                    {item.aggregateLabel}
                                                </span>
                                            </TableCell>

                                            {/* Sumber */}
                                            <TableCell>
                                                {item.source_type === "Internal" ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                        <Mountain className="h-3 w-3 text-emerald-600" /> Quarry
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                        <ShoppingCart className="h-3 w-3 text-amber-600" /> Vendor
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* No Bon */}
                                            <TableCell className="text-xs font-mono font-bold text-slate-800">
                                                {item.no_bon}
                                            </TableCell>

                                            {/* Sopir */}
                                            <TableCell>
                                                <div className="text-xs font-bold text-slate-900 leading-snug">
                                                    {item.driver_name}
                                                </div>
                                                {item.driver && (
                                                    <span className="text-[10px] text-slate-400">Supir Internal</span>
                                                )}
                                            </TableCell>

                                            {/* Plat & Ukuran */}
                                            <TableCell>
                                                <div className="space-y-0.5">
                                                    <div className="text-xs font-mono font-bold text-slate-900">
                                                        {item.plate_number}
                                                    </div>
                                                    {item.dump_truck_size && (
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] px-1.5 py-0 h-4 font-bold ${
                                                                item.dump_truck_size === "KECIL"
                                                                    ? "border-amber-300 text-amber-800 bg-amber-50"
                                                                    : "border-blue-300 text-blue-800 bg-blue-50"
                                                            }`}
                                                        >
                                                            {item.dump_truck_size === "KECIL" ? "DT Kecil" : "DT Besar"}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Volume */}
                                            <TableCell className="text-right">
                                                <span className="font-mono font-black text-sm text-slate-900">
                                                    {item.volume_cubic.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-1">m³</span>
                                            </TableCell>

                                            {/* Nilai Material */}
                                            <TableCell className="text-right">
                                                {item.total_price != null && item.total_price > 0 ? (
                                                    <div className="space-y-0.5">
                                                        <div className="font-mono font-black text-xs text-sky-950">
                                                            Rp {item.total_price.toLocaleString("id-ID")}
                                                        </div>
                                                        {item.unit_price != null && item.unit_price > 0 && (
                                                            <div className="text-[10px] text-slate-500 font-mono">
                                                                @Rp {item.unit_price.toLocaleString("id-ID")}/m³
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-300 font-mono">-</span>
                                                )}
                                            </TableCell>

                                            {/* Retase DT */}
                                            <TableCell>
                                                {item.source_type === "Internal" ? (
                                                    <div className="space-y-0.5">
                                                        {item.retase_amount != null && item.retase_amount > 0 ? (
                                                            <div className="text-xs font-black text-emerald-700 font-mono">
                                                                Rp {item.retase_amount.toLocaleString("id-ID")}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 font-mono">-</span>
                                                        )}
                                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                                                            <span>{item.distance_km ? `${item.distance_km} KM` : "-"}</span>
                                                            {item.rate_price ? <span>• @Rp {item.rate_price.toLocaleString("id-ID")}</span> : null}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">Non-Retase</span>
                                                )}
                                            </TableCell>

                                            {/* Supplier / Catatan */}
                                            <TableCell>
                                                {item.source_type === "External" && item.supplier && (
                                                    <div className="text-xs font-semibold text-slate-800 truncate max-w-[180px]" title={item.supplier}>
                                                        🏢 {item.supplier}
                                                    </div>
                                                )}
                                                {item.notes && (
                                                    <div className="text-[11px] text-slate-500 truncate max-w-[180px]" title={item.notes}>
                                                        {item.notes}
                                                    </div>
                                                )}
                                                {!item.supplier && !item.notes && (
                                                    <span className="text-slate-300 text-xs">-</span>
                                                )}
                                            </TableCell>

                                            {/* Aksi */}
                                            {canManage && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                            onClick={() => onEdit(item)}
                                                            title="Edit transaksi"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => onDelete(item)}
                                                            title="Hapus transaksi"
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
