"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tag, Plus, Fuel, Edit2, Trash2 } from "lucide-react"

interface CategoriesTabProps {
    categories: any[]
    onOpenCreateCategory: () => void
    onOpenEditCategory: (cat: any) => void
    onDeleteCategory: (cat: any) => void
}

export function CategoriesTab({
    categories,
    onOpenCreateCategory,
    onOpenEditCategory,
    onDeleteCategory,
}: CategoriesTabProps) {
    return (
        <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Tag className="h-4 w-4 text-blue-600" />
                            <span>Master Kategori Pengeluaran RBL</span>
                            <Badge variant="outline" className="text-xs bg-white text-blue-700 border-blue-200">
                                {categories.length} Kategori
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Kelola daftar kategori pengeluaran operasional dan penandaan kebutuhan armada kendaraan / KM Odometer.
                        </CardDescription>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={onOpenCreateCategory}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs cursor-pointer shadow-xs"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Kategori Baru
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="text-[11px] text-slate-600">
                                <TableHead className="w-12 text-center">No</TableHead>
                                <TableHead className="min-w-[200px]">Nama Kategori</TableHead>
                                <TableHead className="min-w-[240px]">Deskripsi / Keterangan</TableHead>
                                <TableHead className="w-48 text-center">Armada & Odometer</TableHead>
                                <TableHead className="w-28 text-center">Tipe</TableHead>
                                <TableHead className="w-24 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                                        Belum ada kategori terdaftar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((cat, idx) => (
                                    <TableRow key={cat.id} className="text-xs hover:bg-slate-50/60">
                                        <TableCell className="text-center font-mono text-slate-400 font-semibold">
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <span className="p-1 rounded bg-blue-50 text-blue-600">
                                                    <Tag className="h-3.5 w-3.5" />
                                                </span>
                                                <span>{cat.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {cat.description || <span className="text-slate-300 italic">-</span>}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {cat.requireVehicleKm ? (
                                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-medium">
                                                    <Fuel className="h-2.5 w-2.5 mr-1 text-amber-600" />
                                                    Aktif (Unit & KM)
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200">
                                                    Umum
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {cat.isSystem ? (
                                                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-700">
                                                    Bawaan Sistem
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                                    Kustom
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onOpenEditCategory(cat)}
                                                    className="h-7 w-7 text-slate-500 hover:text-blue-600 cursor-pointer"
                                                    title="Edit Kategori"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                {!cat.isSystem && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDeleteCategory(cat)}
                                                        className="h-7 w-7 text-slate-400 hover:text-rose-600 cursor-pointer"
                                                        title="Hapus Kategori"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
