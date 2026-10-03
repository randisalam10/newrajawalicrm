"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Store, Package, ShoppingCart, PhoneCall } from "lucide-react"
import { SupplierStats as StatsType } from "../types"

interface SupplierStatsProps {
    stats: StatsType
}

export function SupplierStats({ stats }: SupplierStatsProps) {
    const contactPercent = stats.totalSuppliers > 0
        ? Math.round((stats.withContactCount / stats.totalSuppliers) * 100)
        : 0

    const activePercent = stats.totalSuppliers > 0
        ? Math.round((stats.activeSuppliers / stats.totalSuppliers) * 100)
        : 0

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* 1. Total Supplier */}
            <Card className="border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Total Toko / Vendor</span>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <Store className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">{stats.totalSuppliers.toLocaleString('id-ID')}</span>
                        <span className="text-xs text-slate-500">rekanan</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>Database master logistik</span>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Total Katalog Barang */}
            <Card className="border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Katalog Barang</span>
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <Package className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">{stats.totalItems.toLocaleString('id-ID')}</span>
                        <span className="text-xs text-slate-500">item terdaftar</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                        <span>Tersedia untuk pembuatan PO</span>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Supplier Aktif */}
            <Card className="border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Supplier Aktif</span>
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                            <ShoppingCart className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">{stats.activeSuppliers.toLocaleString('id-ID')}</span>
                        <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                            {activePercent}%
                        </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Memiliki barang atau riwayat PO
                    </div>
                </CardContent>
            </Card>

            {/* 4. Kelengkapan Kontak */}
            <Card className="border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Kontak Tersedia</span>
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                            <PhoneCall className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">{stats.withContactCount.toLocaleString('id-ID')}</span>
                        <span className="text-xs text-slate-500">({contactPercent}%)</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Nomor HP / Telepon aktif
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
