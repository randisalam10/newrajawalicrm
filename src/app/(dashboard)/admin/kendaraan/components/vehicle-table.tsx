"use client"

import React, { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { FileClock, Pencil, Trash2, CheckCircle2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { FilterTab, Vehicle, getCategoryBadgeClass } from "../types"

interface VehicleTableProps {
    data: Vehicle[]
    isCorporate: boolean
    canManage: boolean
    onOpenComplianceForVehicle: (vehicle: Vehicle) => void
    onOpenEdit: (vehicle: Vehicle) => void
    onDelete: (id: string) => void
}

export function VehicleTable({
    data,
    isCorporate,
    canManage,
    onOpenComplianceForVehicle,
    onOpenEdit,
    onDelete,
}: VehicleTableProps) {
    const [filterTab, setFilterTab] = useState<FilterTab>("ALL")

    const operationalCount = data.filter(d => !d.is_for_rent).length
    const rentalCount = data.filter(d => d.is_for_rent).length
    const complianceCount = data.filter(d => (d.annual_tax_cost || 0) > 0 || (d.kir_cost || 0) > 0 || (d.complianceRecords?.length || 0) > 0).length

    const filteredData = filterTab === "OPERASIONAL"
        ? data.filter(d => !d.is_for_rent)
        : filterTab === "SEWA"
        ? data.filter(d => d.is_for_rent)
        : filterTab === "KEPATUHAN"
        ? data.filter(d => (d.annual_tax_cost || 0) > 0 || (d.kir_cost || 0) > 0 || (d.complianceRecords?.length || 0) > 0)
        : data

    return (
        <div className="space-y-3">
            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit text-xs border border-slate-200 flex-wrap">
                <button
                    type="button"
                    onClick={() => setFilterTab("ALL")}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                        filterTab === "ALL"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    Semua Unit ({data.length})
                </button>
                <button
                    type="button"
                    onClick={() => setFilterTab("OPERASIONAL")}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                        filterTab === "OPERASIONAL"
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    Operasional Internal ({operationalCount})
                </button>
                <button
                    type="button"
                    onClick={() => setFilterTab("SEWA")}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                        filterTab === "SEWA"
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    Unit Sewa ({rentalCount})
                </button>
                <button
                    type="button"
                    onClick={() => setFilterTab("KEPATUHAN")}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                        filterTab === "KEPATUHAN"
                            ? "bg-white text-indigo-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    Kepatuhan Pajak & KIR ({complianceCount})
                </button>
            </div>

            <SimpleDataTable
                data={filteredData}
                searchKeys={["code", "plate_number", "vehicle_type", "merk_model"]}
                searchPlaceholder="Cari kode unit, nomor plat, merk/tipe, atau kategori alat..."
            >
                {(items, sortConfig, toggleSort) => (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/70 text-xs">
                                {isCorporate && (
                                    <TableHead>
                                        <SortableHeader label="Cabang" sortKey="locationId" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                )}
                                <TableHead>
                                    <SortableHeader label="Kode Unit" sortKey="code" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Plat / No. Seri" sortKey="plate_number" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead>
                                    <SortableHeader label="Kategori Unit" sortKey="vehicle_type" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="text-center w-20">
                                    <SortableHeader label="Meter" sortKey="meter_type" sortConfig={sortConfig} onSort={toggleSort} />
                                </TableHead>
                                <TableHead className="min-w-[170px]">Pajak STNK & KIR</TableHead>
                                {canManage && <TableHead className="w-[90px] text-center">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={(isCorporate ? 1 : 0) + 5 + (canManage ? 1 : 0)} className="text-center text-muted-foreground h-24 text-xs">
                                        Data kendaraan & alat tidak ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.map((item) => {
                                const categoryName = item.category?.name || item.vehicle_type
                                const badgeClass = getCategoryBadgeClass(categoryName)
                                const isHM = item.meter_type === "HM"

                                return (
                                    <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors text-xs">
                                        {isCorporate && (
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                    {item.location?.name || "N/A"}
                                                </span>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <div className="font-bold text-slate-900 font-mono text-xs">
                                                {item.code}
                                            </div>
                                            {item.merk_model && (
                                                <div className="text-[10px] text-slate-500 font-sans truncate max-w-[170px]" title={item.merk_model}>
                                                    {item.merk_model}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-700 font-mono text-xs">
                                            {item.plate_number}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
                                                    {categoryName}
                                                </span>
                                                {item.dump_truck_size && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        {item.dump_truck_size === "BESAR" ? "DT Besar" : "DT Kecil"}
                                                        {item.capacity_cubic ? ` • ${item.capacity_cubic} m³` : ""}
                                                    </span>
                                                )}
                                                {item.is_for_rent && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                        <span>Unit Sewa</span>
                                                        {Number(item.default_day_rate || 0) > 0 && (
                                                            <span className="font-mono text-slate-900 font-semibold">
                                                                • Rp {Number(item.default_day_rate).toLocaleString("id-ID")}/hr
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                                {item.is_for_rent && (
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                                        item.rental_status === "Disewa"
                                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                                            : item.rental_status === "Maintenance"
                                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    }`}>
                                                        {item.rental_status === "Disewa" ? "Sedang Disewa" : item.rental_status === "Maintenance" ? "Maintenance" : "Tersedia"}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${isHM ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-800 border-blue-200"}`}>
                                                {isHM ? "HM" : "KM"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1 text-[11px]">
                                                {Number(item.annual_tax_cost || 0) > 0 ? (
                                                    <div className="flex items-center gap-1 text-slate-700 flex-wrap">
                                                        <span className="text-slate-400 font-medium">Pajak:</span>
                                                        <span className="font-mono font-semibold text-slate-900">
                                                            Rp {Number(item.annual_tax_cost).toLocaleString("id-ID")}
                                                        </span>
                                                        <span className="text-[10px] text-indigo-600 font-mono">
                                                            (~Rp {Math.round(Number(item.annual_tax_cost) / 12).toLocaleString("id-ID")}/bln)
                                                        </span>
                                                        {item.tax_expiry_date && (
                                                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                Exp: {format(new Date(item.tax_expiry_date), "dd/MM/yy")}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : null}
                                                {Number(item.kir_cost || 0) > 0 ? (
                                                    <div className="flex items-center gap-1 text-slate-700 flex-wrap">
                                                        <span className="text-slate-400 font-medium">KIR:</span>
                                                        <span className="font-mono font-semibold text-slate-900">
                                                            Rp {Number(item.kir_cost).toLocaleString("id-ID")}
                                                        </span>
                                                        <span className="text-[10px] text-indigo-600 font-mono">
                                                            (~Rp {Math.round(Number(item.kir_cost) / (item.kir_period_months || 6)).toLocaleString("id-ID")}/bln)
                                                        </span>
                                                        {item.kir_expiry_date && (
                                                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                Exp: {format(new Date(item.kir_expiry_date), "dd/MM/yy")}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : null}
                                                {item.complianceRecords && item.complianceRecords.length > 0 ? (
                                                    <div className="pt-0.5">
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                                            <span>{item.complianceRecords.length} Riwayat Tercatat</span>
                                                        </span>
                                                    </div>
                                                ) : (Number(item.annual_tax_cost || 0) > 0 || Number(item.kir_cost || 0) > 0) ? (
                                                    <div className="pt-0.5">
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                            <AlertCircle className="w-2.5 h-2.5" />
                                                            <span>Estimasi Master (Belum ada Riwayat)</span>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 italic">- Belum diset -</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        {canManage && (
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                                        title="Buka Riwayat Pajak & KIR Unit Ini"
                                                        onClick={() => onOpenComplianceForVehicle(item)}
                                                    >
                                                        <FileClock className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-blue-600" onClick={() => onOpenEdit(item)}>
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => onDelete(item.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </SimpleDataTable>
        </div>
    )
}
