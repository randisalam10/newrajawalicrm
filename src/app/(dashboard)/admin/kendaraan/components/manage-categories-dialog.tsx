"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tag, Plus, Trash2 } from "lucide-react"
import { VehicleCategory } from "../types"

interface ManageCategoriesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: VehicleCategory[]
    onOpenQuickCategory: () => void
    onDeleteCategory: (id: string, name: string) => void
}

export function ManageCategoriesDialog({
    open,
    onOpenChange,
    categories,
    onOpenQuickCategory,
    onDeleteCategory,
}: ManageCategoriesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px]">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                        <Tag className="h-5 w-5 text-amber-600" />
                        <span>Master Kategori Kendaraan</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Kelola kategori armada dan jenis alat operasional yang tersedia di seluruh cabang.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">
                            Total <strong>{categories.length}</strong> kategori terdaftar
                        </span>
                        <Button
                            type="button"
                            size="sm"
                            onClick={onOpenQuickCategory}
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 cursor-pointer"
                        >
                            <Plus className="h-3 w-3" />
                            <span>Tambah Kategori</span>
                        </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 text-[11px]">
                                <TableRow>
                                    <TableHead className="w-12 text-center">#</TableHead>
                                    <TableHead>Nama Kategori</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead className="text-center">Jumlah Unit</TableHead>
                                    <TableHead className="w-12 text-center"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="text-xs">
                                {categories.map((cat, idx) => {
                                    const unitCount = cat._count?.vehicles || cat.vehicles?.length || 0
                                    return (
                                        <TableRow key={cat.id} className="hover:bg-slate-50/70">
                                            <TableCell className="text-center font-mono text-slate-400 text-[11px]">
                                                {idx + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-slate-800">{cat.name}</div>
                                                {cat.description && (
                                                    <div className="text-[10px] text-slate-400">{cat.description}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-slate-600 text-[11px]">
                                                {cat.code || "-"}
                                            </TableCell>
                                            <TableCell className="text-center font-mono">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-semibold text-slate-700">
                                                    {unitCount} unit
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {!cat.isSystem && unitCount === 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDeleteCategory(cat.id, cat.name)}
                                                        className="h-6 w-6 text-slate-400 hover:text-rose-600"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs h-8"
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
