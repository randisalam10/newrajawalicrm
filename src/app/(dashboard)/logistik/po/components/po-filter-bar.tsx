"use client"

import React from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, Calendar, FilterX } from "lucide-react"
import { PODateFilterMode } from "../types"

interface POFilterBarProps {
    search: string
    setSearch: (s: string) => void
    companyId: string
    setCompanyId: (v: string) => void
    categoryId: string
    setCategoryId: (v: string) => void
    paymentMethod: string
    setPaymentMethod: (v: string) => void
    statusFilter: string
    setStatusFilter: (v: string) => void
    dateMode: PODateFilterMode
    setDateMode: (v: PODateFilterMode) => void
    specificDate: string
    setSpecificDate: (v: string) => void
    startDate: string
    setStartDate: (v: string) => void
    endDate: string
    setEndDate: (v: string) => void
    setPage: (p: number | ((p: number) => number)) => void
    companies: any[]
    categories: any[]
    canManagePo: boolean
    hasActiveFilters: boolean
    resetFilters: () => void
}

export function POFilterBar({
    search,
    setSearch,
    companyId,
    setCompanyId,
    categoryId,
    setCategoryId,
    paymentMethod,
    setPaymentMethod,
    statusFilter,
    setStatusFilter,
    dateMode,
    setDateMode,
    specificDate,
    setSpecificDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    setPage,
    companies,
    categories,
    canManagePo,
    hasActiveFilters,
    resetFilters,
}: POFilterBarProps) {
    return (
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-2.5 shadow-2xs">
            {/* Baris 1: Search & Filter Utama */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Cari no PO, nama barang, supplier, proyek..."
                        className="pl-8 text-xs h-8 bg-white border-slate-200"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                {/* Perusahaan */}
                <Select value={companyId} onValueChange={v => { setCompanyId(v); setPage(1); }}>
                    <SelectTrigger className="w-[170px] text-xs h-8 bg-white border-slate-200">
                        <SelectValue placeholder="Semua Perusahaan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL" className="text-xs">Semua Perusahaan</SelectItem>
                        {companies.map(c => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Kategori */}
                <Select value={categoryId} onValueChange={v => { setCategoryId(v); setPage(1); }}>
                    <SelectTrigger className="w-[145px] text-xs h-8 bg-white border-slate-200">
                        <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL" className="text-xs">Semua Kategori</SelectItem>
                        {categories.map(c => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Metode Pembayaran: Tunai / Kredit */}
                <Select value={paymentMethod} onValueChange={v => { setPaymentMethod(v); setPage(1); }}>
                    <SelectTrigger className="w-[135px] text-xs h-8 bg-white border-slate-200">
                        <SelectValue placeholder="Pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL" className="text-xs">Semua Bayar</SelectItem>
                        <SelectItem value="CASH" className="text-xs">Tunai (Cash)</SelectItem>
                        <SelectItem value="CREDIT" className="text-xs">Kredit (Tempo)</SelectItem>
                    </SelectContent>
                </Select>

                {/* Status Approval */}
                <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-[145px] text-xs h-8 bg-white border-slate-200">
                        <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                        <SelectItem value="SUBMITTED" className="text-xs">Menunggu Approval</SelectItem>
                        <SelectItem value="APPROVED" className="text-xs">Disetujui</SelectItem>
                        <SelectItem value="DRAFT" className="text-xs">Draft (Belum Diajukan)</SelectItem>
                        <SelectItem value="REJECTED" className="text-xs">Ditolak</SelectItem>
                        <SelectItem value="CANCELLED" className="text-xs">Dibatalkan</SelectItem>
                    </SelectContent>
                </Select>

                {/* Buat PO Baru */}
                {canManagePo && (
                    <div className="ml-auto shrink-0">
                        <Link href="/logistik/po/create">
                            <Button size="sm" className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs font-medium">
                                <span>+ Buat PO Baru</span>
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Baris 2: Filter Tanggal & Reset */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs mr-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Filter Tanggal:</span>
                </div>

                <Select value={dateMode} onValueChange={(v: PODateFilterMode) => { setDateMode(v); setPage(1); }}>
                    <SelectTrigger className="w-[145px] text-xs h-7 bg-white border-slate-200">
                        <SelectValue placeholder="Mode Tanggal" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL" className="text-xs">Semua Waktu</SelectItem>
                        <SelectItem value="SPECIFIC" className="text-xs">Tanggal Spesifik</SelectItem>
                        <SelectItem value="RANGE" className="text-xs">Rentang Tanggal</SelectItem>
                    </SelectContent>
                </Select>

                {/* Tanggal Spesifik Input */}
                {dateMode === "SPECIFIC" && (
                    <div className="flex items-center gap-1.5">
                        <Input
                            type="date"
                            className="h-7 text-xs w-[140px] bg-white border-slate-200 py-0.5 px-2"
                            value={specificDate}
                            onChange={e => { setSpecificDate(e.target.value); setPage(1); }}
                            title="Pilih Tanggal Spesifik"
                        />
                    </div>
                )}

                {/* Rentang Tanggal Inputs */}
                {dateMode === "RANGE" && (
                    <div className="flex items-center gap-1.5">
                        <Input
                            type="date"
                            className="h-7 text-xs w-[135px] bg-white border-slate-200 py-0.5 px-2"
                            value={startDate}
                            onChange={e => { setStartDate(e.target.value); setPage(1); }}
                            title="Dari Tanggal"
                        />
                        <span className="text-slate-400 text-xs">s/d</span>
                        <Input
                            type="date"
                            className="h-7 text-xs w-[135px] bg-white border-slate-200 py-0.5 px-2"
                            value={endDate}
                            onChange={e => { setEndDate(e.target.value); setPage(1); }}
                            title="Sampai Tanggal"
                        />
                    </div>
                )}

                {/* Quick Presets */}
                <div className="flex items-center gap-1 ml-1">
                    <button
                        type="button"
                        onClick={() => {
                            setDateMode("SPECIFIC")
                            setSpecificDate(new Date().toISOString().split('T')[0])
                            setPage(1)
                        }}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200/70 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                        Hari Ini
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const now = new Date()
                            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
                            setDateMode("RANGE")
                            setStartDate(firstDay)
                            setEndDate(lastDay)
                            setPage(1)
                        }}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200/70 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                        Bulan Ini
                    </button>
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        title="Reset Semua Filter"
                        className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 gap-1 ml-auto"
                    >
                        <FilterX className="w-3.5 h-3.5" />
                        <span>Reset Filter</span>
                    </Button>
                )}
            </div>
        </div>
    )
}
