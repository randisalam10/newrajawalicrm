"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Calendar, Tag, History, Info } from "lucide-react"
import { fmt, fmtDate } from "../helpers"
import { MasterMaterialItem } from "../types"

interface MaterialActiveTableProps {
    materials: MasterMaterialItem[]
    selectedLocation: string
    canManage: boolean
    onOpenManagePrice: (mat: MasterMaterialItem) => void
    onOpenHistoryModal: (mat: MasterMaterialItem) => void
}

export function MaterialActiveTable({
    materials,
    selectedLocation,
    canManage,
    onOpenManagePrice,
    onOpenHistoryModal
}: MaterialActiveTableProps) {
    return (
        <Card className="border-slate-200/80 shadow-2xs bg-white">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <span>Daftar Material Agregat & Harga Acuan Berlaku</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                        Harga acuan per meter kubik (m³) yang aktif digunakan untuk estimasi biaya HPP pengiriman beton
                    </CardDescription>
                </div>
            </CardHeader>

            <div className="overflow-x-auto">
                <Table className="text-xs">
                    <TableHeader className="bg-slate-50 text-[11px]">
                        <TableRow>
                            <TableHead className="w-[100px] font-semibold text-slate-700">Kode</TableHead>
                            <TableHead className="font-semibold text-slate-700">Nama Material</TableHead>
                            <TableHead className="w-[110px] font-semibold text-slate-700">Kategori</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700 w-[90px]">Satuan</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 w-[120px]">Densitas</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 w-[140px]">Harga per m³</TableHead>
                            <TableHead className="font-semibold text-slate-700 w-[130px]">Mulai Berlaku</TableHead>
                            <TableHead className="font-semibold text-slate-700 w-[180px]">Lingkup Cabang</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700 w-[110px]">Riwayat</TableHead>
                            {canManage && <TableHead className="text-right font-semibold text-slate-700 w-[130px]">Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {materials.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={canManage ? 10 : 9} className="text-center py-8 text-slate-400">
                                    Tidak ada material yang cocok dengan pencarian atau filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            materials.map((mat) => {
                                const isSand = mat.code.includes("PASIR") || mat.category === "PASIR"
                                const isStone = mat.code.includes("SPLIT") || mat.category === "BATU"

                                return (
                                    <TableRow key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                                        <TableCell className="font-mono font-bold text-slate-800">
                                            {mat.code}
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-900">
                                            <div>{mat.name}</div>
                                            {mat.description && (
                                                <div className="text-[11px] text-slate-400 font-normal mt-0.5 line-clamp-1">
                                                    {mat.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider ${
                                                    isSand
                                                        ? "bg-amber-50 text-amber-800 border-amber-300"
                                                        : isStone
                                                        ? "bg-blue-50 text-blue-800 border-blue-300"
                                                        : "bg-slate-50 text-slate-700 border-slate-300"
                                                }`}
                                            >
                                                {mat.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-slate-700">
                                            1 {mat.unit}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-600">
                                            {mat.defaultDensity ? `${mat.defaultDensity} kg/m³` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-900 text-[13px]">
                                            {fmt(mat.displayPrice ?? 0)}
                                        </TableCell>
                                        <TableCell className="text-slate-700">
                                            <div className="flex items-center gap-1.5 font-medium text-[11px]">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span>{fmtDate(mat.displayEffectiveDate)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {selectedLocation !== "all" ? (
                                                <Badge
                                                    variant={mat.isBranchOverride ? "default" : "outline"}
                                                    className={`text-[10px] px-2 py-0.5 font-medium ${
                                                        mat.isBranchOverride
                                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                                            : "bg-slate-50 text-slate-600 border-slate-300"
                                                    }`}
                                                >
                                                    {mat.displayLocationName}
                                                </Badge>
                                            ) : (
                                                <div className="space-y-1">
                                                    <span className="text-[11px] font-medium text-slate-800 block">
                                                        Semua Cabang (Global)
                                                    </span>
                                                    {mat.branchOverrides && mat.branchOverrides.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {mat.branchOverrides.map((b: any) => (
                                                                <span
                                                                    key={b.locationId}
                                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                                                >
                                                                    {b.locationName}: {fmt(b.price)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <button
                                                type="button"
                                                onClick={() => onOpenHistoryModal(mat)}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors cursor-pointer"
                                                title="Klik untuk melihat riwayat perubahan harga"
                                            >
                                                <History className="w-3 h-3 text-slate-400" />
                                                <span>{mat.historyCount ?? 0}x revisi</span>
                                            </button>
                                        </TableCell>
                                        {canManage && (
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => onOpenManagePrice(mat)}
                                                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs gap-1.5 cursor-pointer"
                                                    title="Tetapkan tarif baru atau koreksi harga material ini"
                                                >
                                                    <Tag className="w-3.5 h-3.5" />
                                                    <span>Atur Harga</span>
                                                </Button>
                                            </TableCell>
                                        )}
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
