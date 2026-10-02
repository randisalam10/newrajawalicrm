"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Calendar, Edit3, Plus } from "lucide-react"
import { fmt, fmtDate } from "../helpers"
import { MasterMaterialItem } from "../types"

interface MaterialActiveTableProps {
    materials: MasterMaterialItem[]
    selectedLocation: string
    canManage: boolean
    onQuickEditActivePrice: (mat: MasterMaterialItem) => void
    onOpenSetPrice: (mat: MasterMaterialItem) => void
}

export function MaterialActiveTable({
    materials,
    selectedLocation,
    canManage,
    onQuickEditActivePrice,
    onOpenSetPrice,
}: MaterialActiveTableProps) {
    return (
        <Card className="border-slate-200/80 shadow-2xs">
            <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Daftar Material Agregat & Harga Acuan Berlaku
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                        Harga acuan per meter kubik (m³) yang sedang aktif digunakan untuk estimasi pengeluaran
                    </CardDescription>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table className="text-xs">
                    <TableHeader className="bg-slate-50 text-[11px]">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-700">Kode</TableHead>
                            <TableHead className="font-semibold text-slate-700">Nama Material</TableHead>
                            <TableHead className="font-semibold text-slate-700">Kategori</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">Satuan</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Densitas Standar</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Harga per m³</TableHead>
                            <TableHead className="font-semibold text-slate-700">Mulai Berlaku</TableHead>
                            <TableHead className="font-semibold text-slate-700">Lingkup Cabang</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">Riwayat</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {materials.map((mat) => (
                            <TableRow key={mat.id} className="hover:bg-slate-50/80">
                                <TableCell className="font-mono font-bold text-slate-800">
                                    {mat.code}
                                </TableCell>
                                <TableCell className="font-semibold text-slate-900">
                                    {mat.name}
                                    {mat.description && (
                                        <div className="text-[10px] text-slate-400 font-normal">
                                            {mat.description}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        {mat.category}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center font-mono">
                                    1 {mat.unit}
                                </TableCell>
                                <TableCell className="text-right font-mono text-slate-600">
                                    {mat.defaultDensity ? `${mat.defaultDensity} kg/m³` : "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-slate-900">
                                    {fmt(mat.displayPrice ?? 0)}
                                </TableCell>
                                <TableCell className="font-medium text-slate-700">
                                    {canManage ? (
                                        <button
                                            type="button"
                                            onClick={() => onQuickEditActivePrice(mat)}
                                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-blue-700 cursor-pointer transition-colors group text-left"
                                            title="Klik untuk koreksi tanggal mulai berlaku ini"
                                        >
                                            <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                                            <span className="font-mono text-xs">{fmtDate(mat.displayEffectiveDate)}</span>
                                            <Edit3 className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600 opacity-60 group-hover:opacity-100 shrink-0" />
                                        </button>
                                    ) : (
                                        <span>{fmtDate(mat.displayEffectiveDate)}</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-slate-600">
                                    {selectedLocation !== "all" ? (
                                        <div>
                                            <Badge variant={mat.isBranchOverride ? "default" : "outline"} className={`text-[10px] px-1.5 py-0 ${
                                                mat.isBranchOverride ? "bg-blue-600 text-white" : "text-slate-600 border-slate-300"
                                            }`}>
                                                {mat.displayLocationName}
                                            </Badge>
                                        </div>
                                    ) : (
                                        <div>
                                            <span className="text-xs font-medium text-slate-800">Semua Cabang (Global)</span>
                                            {mat.branchOverrides && mat.branchOverrides.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {mat.branchOverrides.map((b: any) => (
                                                        <span key={b.locationId} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                            {b.locationName}: {fmt(b.price)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary" className="font-mono text-[10px]">
                                        {mat.historyCount}x revisi
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {canManage ? (
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onQuickEditActivePrice(mat)}
                                                className="h-7 text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-blue-700 font-medium cursor-pointer"
                                                title="Koreksi tanggal mulai berlaku atau harga aktif ini"
                                            >
                                                <Edit3 className="w-3 h-3 mr-1 text-slate-500" />
                                                <span>Koreksi Tanggal/Tarif</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => onOpenSetPrice(mat)}
                                                className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer"
                                                title="Tetapkan jadwal tarif baru di masa depan"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                <span>Tetapkan Baru</span>
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic">Lihat Saja</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    )
}
