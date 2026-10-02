"use client"

import React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Truck,
    Tag,
    BarChart3,
    Download,
    PackageMinus,
    Plus,
} from "lucide-react"

interface HeaderActionBarProps {
    isReadOnly?: boolean
    canManage?: boolean
    onExportCSV: () => void
    onOpenInForm: () => void
    onOpenOutForm: () => void
}

export function HeaderActionBar({
    isReadOnly = false,
    canManage = true,
    onExportCSV,
    onOpenInForm,
    onOpenOutForm,
}: HeaderActionBarProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                        <Truck className="h-5 w-5" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        Penerimaan Material & Agregat
                    </h1>
                    {isReadOnly && (
                        <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 text-xs px-2.5 py-0.5">
                            Mode Pemantauan
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-slate-500">
                    Pencatatan pasokan batu split, pasir, kontrol stok batching plant, dan sistem perhitungan retase dump truck quarry.
                </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <Link
                    href="/admin/master-material"
                    className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-all"
                    title="Atur harga dasar material agregat per m³ dan kelola riwayat harga"
                >
                    <Tag className="h-3.5 w-3.5 text-blue-600" />
                    <span>Master Harga</span>
                </Link>

                <Link
                    href="/admin/reports/material"
                    className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 rounded-lg shadow-2xs transition-all"
                    title="Lihat akumulasi biaya material, retase dump truck, dan biaya mendarat (landed cost)"
                >
                    <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                    <span>Laporan Biaya Material</span>
                </Link>

                <Button
                    onClick={onExportCSV}
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Ekspor CSV</span>
                </Button>

                {canManage && (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={onOpenOutForm}
                            variant="outline"
                            size="sm"
                            className="h-9 gap-1.5 text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 shadow-xs"
                        >
                            <PackageMinus className="h-4 w-4 text-rose-600" />
                            <span>Input Material Keluar</span>
                        </Button>
                        <Button
                            onClick={onOpenInForm}
                            size="sm"
                            className="h-9 gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Input Penerimaan Material</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
