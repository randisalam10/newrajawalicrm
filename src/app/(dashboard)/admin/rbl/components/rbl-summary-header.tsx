"use client"

import React from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WalletCards, Plus, CheckCircle2, Building2, Printer, Fuel, Pencil } from "lucide-react"
import { fmt, fmtShortDate, MONTH_NAMES } from "../utils/rbl-helpers"

interface RblSummaryHeaderProps {
    activeBudget: any
    adminBranchName: string
    isSuperAdmin: boolean
    canCreate?: boolean
    canEdit?: boolean
    canClose?: boolean
    locations: any[]
    selectedLocation: string
    onSelectLocation: (locId: string) => void
    onOpenCreateBudget: () => void
    onOpenEditBudget?: () => void
    onOpenCloseBudget: () => void
    onOpenCategoryReport: () => void
    activeTab: string
    balanceStatus: { label: string; color: string }
    utilizationRate: number
}

export function RblSummaryHeader({
    activeBudget,
    adminBranchName,
    isSuperAdmin,
    canCreate,
    canEdit = true,
    canClose,
    locations,
    selectedLocation,
    onSelectLocation,
    onOpenCreateBudget,
    onOpenEditBudget,
    onOpenCloseBudget,
    onOpenCategoryReport,
    activeTab,
    balanceStatus,
    utilizationRate,
}: RblSummaryHeaderProps) {
    return (
        <div className="space-y-6">
            {/* Header: Title & Prominent Branch Indicator */}
            <div className="flex flex-col gap-2.5 border-b pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-600 rounded-lg text-white shadow-xs">
                            <WalletCards className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                    Rekap Bulanan (RBL)
                                </h1>
                                {!isSuperAdmin && (
                                    <Badge variant="outline" className="text-xs bg-slate-50 border-slate-300 font-semibold text-slate-800">
                                        📍 {adminBranchName}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-500">
                                Anggaran operasional cabang, input pengeluaran harian, armada BBM, dan nota kas.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!activeBudget && canCreate && (
                            <Button
                                size="sm"
                                onClick={onOpenCreateBudget}
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs shadow-xs cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Buka Budget Baru
                            </Button>
                        )}

                        {activeBudget && canClose && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onOpenCloseBudget}
                                className="border-rose-200 text-rose-700 hover:bg-rose-50 gap-1.5 h-8 text-xs cursor-pointer"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Tutup Buku (Close RBL)
                            </Button>
                        )}
                    </div>
                </div>

                {/* HO Branch Switcher for Super Admin */}
                {isSuperAdmin && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            Cabang (HO):
                        </span>
                        <button
                            onClick={() => onSelectLocation("all")}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                selectedLocation === "all"
                                    ? "bg-blue-600 text-white shadow-2xs font-semibold"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            🏢 Semua Cabang
                        </button>
                        {locations.map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => onSelectLocation(loc.id)}
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                    selectedLocation === loc.id
                                        ? "bg-blue-600 text-white shadow-2xs font-semibold"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                📍 {loc.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Budget Executive Summary Card */}
            {activeBudget && (
                <Card className="border border-slate-200/90 shadow-xs overflow-hidden bg-white">
                    <div className="bg-slate-50/90 px-4 py-2 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs px-2.5 py-0.5 shadow-2xs">
                                {activeBudget.code}
                            </Badge>
                            <Badge variant="outline" className="text-slate-700 font-semibold bg-white border-slate-200">
                                🏢 {activeBudget.location?.name}
                            </Badge>
                            <Badge variant="outline" className="text-slate-700 bg-white border-slate-200">
                                📅 {MONTH_NAMES[activeBudget.periodMonth - 1]} {activeBudget.periodYear}
                            </Badge>
                            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                                Diterima: {fmtShortDate(activeBudget.receivedDate)}
                            </span>
                            {activeBudget.auditLogs?.length > 0 && (
                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200 font-medium">
                                    Revisi {activeBudget.auditLogs.length}x
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {activeBudget.status === "OPEN" && canEdit && onOpenEditBudget && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onOpenEditBudget}
                                    className="h-7 text-xs gap-1.5 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 border-slate-200 shadow-2xs cursor-pointer"
                                >
                                    <Pencil className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Edit Budget</span>
                                </Button>
                            )}
                            <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs cursor-pointer">
                                <Link href={`/admin/rbl/print/${activeBudget.id}`} target="_blank">
                                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Cetak PDF</span>
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onOpenCategoryReport}
                                className={`h-7 text-xs gap-1.5 shadow-2xs transition-all cursor-pointer ${
                                    activeTab === "category-report"
                                        ? "bg-amber-100 text-amber-950 border-amber-300 font-semibold"
                                        : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                                }`}
                            >
                                <Fuel className="h-3.5 w-3.5 text-amber-600" />
                                <span>Laporan Kategori</span>
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 p-3 sm:p-4">
                        <div className="p-2 sm:px-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span className="uppercase tracking-wider text-[10px] text-slate-400 font-bold">Plafon Anggaran</span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">HO Budget</span>
                            </div>
                            <div className="font-mono font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                                {fmt(activeBudget.amount)}
                            </div>
                            <p className="text-[11px] text-slate-400">Pagu operasional disetujui</p>
                        </div>

                        <div className="p-2 sm:px-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span className="uppercase tracking-wider text-[10px] text-slate-400 font-bold">Total Realisasi</span>
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                                    {activeBudget.expenses?.length || 0} Item
                                </span>
                            </div>
                            <div className="font-mono font-bold text-lg sm:text-xl text-blue-700 tracking-tight">
                                {fmt(activeBudget.totalExpense)}
                            </div>
                            <p className="text-[11px] text-slate-400">Total terpakai dilaporkan</p>
                        </div>

                        <div className="p-2 sm:px-4 space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span className="uppercase tracking-wider text-[10px] text-slate-400 font-bold">
                                    {balanceStatus.label}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                                    activeBudget.remainingBalance >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                }`}>
                                    {activeBudget.remainingBalance >= 0 ? "SURPLUS" : "DEFISIT"}
                                </span>
                            </div>
                            <div className={`font-mono font-bold text-lg sm:text-xl tracking-tight ${balanceStatus.color}`}>
                                {activeBudget.remainingBalance >= 0 ? "+" : ""}{fmt(activeBudget.remainingBalance)}
                            </div>
                            <p className="text-[11px] text-slate-400">
                                {activeBudget.remainingBalance >= 0 ? "Sisa kas belum terpakai" : "Pengeluaran melebihi plafon"}
                            </p>
                        </div>

                        <div className="p-2 sm:px-4 space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span className="uppercase tracking-wider text-[10px] text-slate-400 font-bold">Serapan Anggaran</span>
                                <span className={`font-mono font-bold text-xs ${
                                    utilizationRate > 100 ? "text-rose-600" : utilizationRate > 85 ? "text-amber-600" : "text-emerald-600"
                                }`}>
                                    {utilizationRate.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                        utilizationRate > 100 ? "bg-rose-600" : utilizationRate > 85 ? "bg-amber-500" : "bg-emerald-600"
                                    }`}
                                    style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>Status:</span>
                                <span className={`font-medium ${
                                    utilizationRate > 100 ? "text-rose-600 font-semibold" : utilizationRate > 85 ? "text-amber-600 font-semibold" : "text-emerald-700 font-medium"
                                }`}>
                                    {utilizationRate > 100 ? "⚠️ Overbudget" : utilizationRate > 85 ? "⚠️ Waspada (>85%)" : "✓ Terkendali"}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    )
}
