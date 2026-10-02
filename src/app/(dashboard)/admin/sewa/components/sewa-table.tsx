"use client"

import React from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Search,
    Calendar,
    X,
    FileText,
    Plus,
    Printer,
    Eye,
    CheckCircle2,
    Trash2,
    ArrowDown,
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { formatRp, getStatusBadge } from "../helpers"
import { SewaMasters, SewaTransaction } from "../types"

interface SewaTableProps {
    transactions: SewaTransaction[]
    masters: SewaMasters
    isCorp: boolean
    canCreate: boolean
    searchQuery: string
    onSearchChange: (q: string) => void
    filterBranch: string
    onFilterBranchChange: (b: string) => void
    filterStatus: string
    onFilterStatusChange: (s: string) => void
    filterStartDate: string
    onFilterStartDateChange: (d: string) => void
    filterEndDate: string
    onFilterEndDateChange: (d: string) => void
    onResetFilters: () => void
    onSetDateToday: () => void
    onSetDateThisMonth: () => void
    hasActiveFilters: boolean
    todayStr: string
    onOpenInputModal: () => void
    onViewDetail: (tx: SewaTransaction) => void
    onCompleteStatus: (id: string) => void
    onDeleteTransaction: (id: string, sewaNumber: string) => void
}

export function SewaTable({
    transactions,
    masters,
    isCorp,
    canCreate,
    searchQuery,
    onSearchChange,
    filterBranch,
    onFilterBranchChange,
    filterStatus,
    onFilterStatusChange,
    filterStartDate,
    onFilterStartDateChange,
    filterEndDate,
    onFilterEndDateChange,
    onResetFilters,
    onSetDateToday,
    onSetDateThisMonth,
    hasActiveFilters,
    todayStr,
    onOpenInputModal,
    onViewDetail,
    onCompleteStatus,
    onDeleteTransaction,
}: SewaTableProps) {
    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                        <div className="relative min-w-[200px] flex-1 max-w-sm">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Cari No. Surat Jalan, customer, alat, operator..."
                                value={searchQuery}
                                onChange={e => onSearchChange(e.target.value)}
                                className="pl-9 h-8 text-xs"
                            />
                        </div>

                        {isCorp && (
                            <Select value={filterBranch} onValueChange={onFilterBranchChange}>
                                <SelectTrigger className="h-8 text-xs w-[130px]">
                                    <SelectValue placeholder="Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Cabang</SelectItem>
                                    {masters.locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
                            <SelectTrigger className="h-8 text-xs w-[120px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Status</SelectItem>
                                <SelectItem value="Active">Aktif</SelectItem>
                                <SelectItem value="Completed">Selesai</SelectItem>
                                <SelectItem value="Cancelled">Dibatalkan</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date Range Picker */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-[11px] text-slate-500 font-medium">Dari:</span>
                            <input
                                type="date"
                                value={filterStartDate}
                                onChange={e => onFilterStartDateChange(e.target.value)}
                                className="h-7 text-xs bg-transparent border-0 focus:outline-none text-slate-700"
                            />
                            <span className="text-[11px] text-slate-400 font-medium">s/d</span>
                            <input
                                type="date"
                                value={filterEndDate}
                                onChange={e => onFilterEndDateChange(e.target.value)}
                                className="h-7 text-xs bg-transparent border-0 focus:outline-none text-slate-700"
                            />
                        </div>

                        {/* Date Presets */}
                        <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
                            <button
                                type="button"
                                onClick={onSetDateToday}
                                className={`px-2 py-0.5 rounded transition-colors ${filterStartDate === todayStr && filterEndDate === todayStr ? "bg-white font-bold text-blue-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                Hari Ini
                            </button>
                            <button
                                type="button"
                                onClick={onSetDateThisMonth}
                                className={`px-2 py-0.5 rounded transition-colors ${(() => {
                                    const now = new Date()
                                    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
                                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
                                    return filterStartDate === start && filterEndDate === end
                                })() ? "bg-white font-bold text-blue-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                Bulan Ini
                            </button>
                        </div>

                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onResetFilters}
                                className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                                <X className="w-3.5 h-3.5 mr-1" /> Reset
                            </Button>
                        )}
                    </div>

                    <div className="text-xs text-slate-500 font-medium shrink-0">
                        Total: <span className="font-bold text-slate-900">{transactions.length}</span> transaksi
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <Card className="shadow-xs border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 border-b border-slate-200">
                            <TableHead className="w-[135px]">No. DO Sewa</TableHead>
                            <TableHead className="w-[130px]">
                                <div className="flex items-center gap-1 text-slate-800 font-semibold" title="Diurutkan berdasarkan tanggal sewa terbaru (DESC)">
                                    <span>Tanggal Sewa</span>
                                    <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                            </TableHead>
                            <TableHead>Customer & Lokasi Proyek</TableHead>
                            <TableHead>Unit Alat</TableHead>
                            <TableHead>Operator</TableHead>
                            <TableHead className="text-center w-[90px]">Durasi</TableHead>
                            <TableHead className="text-right w-[130px]">Nilai Sewa</TableHead>
                            <TableHead className="text-center w-[100px]">Status</TableHead>
                            <TableHead className="text-center w-[120px]">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12 text-xs text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="w-8 h-8 text-slate-300" />
                                        <p className="font-medium text-slate-600">Belum ada transaksi sewa alat.</p>
                                        {canCreate && (
                                            <Button
                                                size="sm"
                                                onClick={onOpenInputModal}
                                                className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Input Transaksi Baru
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map(tx => (
                                <TableRow key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                                    <TableCell className="font-mono text-xs font-bold text-blue-600">
                                        {tx.sewa_number}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-xs text-slate-800">
                                                {format(new Date(tx.start_date || tx.date), "dd MMM yyyy", { locale: idLocale })}
                                            </span>
                                            {tx.date_mode === "DATES" ? (
                                                <span className="text-[10px] text-blue-600 font-medium">
                                                    {tx.total_days} hari terpilih
                                                </span>
                                            ) : (
                                                (() => {
                                                    const s = new Date(tx.start_date).toISOString().slice(0, 10)
                                                    const e = new Date(tx.end_date).toISOString().slice(0, 10)
                                                    if (s !== e) {
                                                        return (
                                                            <span className="text-[10px] text-slate-400">
                                                                s/d {format(new Date(tx.end_date), "dd MMM yyyy", { locale: idLocale })}
                                                            </span>
                                                        )
                                                    }
                                                    return null
                                                })()
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-semibold text-xs text-slate-900">{tx.customer?.customer_name}</p>
                                        <p className="text-[11px] text-slate-400 line-clamp-1">{tx.lokasi_proyek || tx.customer?.address}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-xs text-slate-800">
                                            {tx.vehicle ? `${tx.vehicle.category?.name || "Unit"} ${tx.vehicle.code}` : (tx.equipment?.nama_alat || "-")}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            {tx.vehicle?.plate_number || tx.equipment?.nomor_seri_plat || tx.equipment?.kode_alat || ""}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-slate-800">{tx.operator?.name}</span>
                                            {tx.operator?.driverCategory && (
                                                <span className="text-[10px] text-blue-600">{tx.operator.driverCategory.name}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                            {tx.total_days} Hari
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                                        <div>{formatRp(tx.total_price)}</div>
                                        {tx.is_ppn && (
                                            <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                {tx.ppn_mode === "INCLUDE" ? "Inc." : "Exc."} PPN {tx.ppn_rate ?? 11}%
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {getStatusBadge(tx.status)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link
                                                href={`/print/sewa/${tx.id}`}
                                                target="_blank"
                                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Cetak Surat Jalan"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => onViewDetail(tx)}
                                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                                title="Lihat Detail Transaksi"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {canCreate && tx.status === "Active" && (
                                                <button
                                                    type="button"
                                                    onClick={() => onCompleteStatus(tx.id)}
                                                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                                    title="Tandai Selesai"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {canCreate && (
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteTransaction(tx.id, tx.sewa_number)}
                                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                                    title="Hapus Transaksi"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
