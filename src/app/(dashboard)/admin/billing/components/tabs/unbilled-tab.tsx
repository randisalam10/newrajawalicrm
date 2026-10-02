"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    Search, Truck, Wrench, AlertTriangle, ChevronRight, ChevronDown,
    CheckCircle2, Clock, FileText
} from "lucide-react"
import { fmt, fmtDate } from "../../utils/billing-helpers"
import { PaginationBar } from "../pagination-bar"

interface UnbilledTabProps {
    unbilled: any[]
    filteredUnbilled: any[]
    groupedUnbilled: any[]
    displayedGroups: any[]
    selectedTxIds: Set<string>
    unbilledSearch: string
    setUnbilledSearch: (s: string) => void
    unbilledTypeFilter: "ALL" | "READYMIX" | "SEWA"
    setUnbilledTypeFilter: (f: "ALL" | "READYMIX" | "SEWA") => void
    unbilledPpnFilter: "all" | "PPN" | "NON_PPN"
    setUnbilledPpnFilter: (f: "all" | "PPN" | "NON_PPN") => void
    filterNoPriceOnly: boolean
    setFilterNoPriceOnly: (f: boolean) => void
    groupBy: "flat" | "date" | "mutu" | "customer"
    setGroupBy: (g: "flat" | "date" | "mutu" | "customer") => void
    unbilledPage: number
    setUnbilledPage: (p: number) => void
    unbilledPpnCount: number
    unbilledNonPpnCount: number
    noPriceTxCount: number
    isAllExpanded: boolean
    toggleExpandAll: () => void
    isGroupExpanded: (key: string) => boolean
    toggleGroupExpand: (key: string) => void
    selectGroup: (items: any[]) => void
    selectAll: () => void
    toggleTx: (id: string) => void
    canManage?: boolean
    selectedTxList: any[]
    selectedVolume: number
    selectedDays: number
    onOpenCreateDialog: () => void
    UNBILLED_FLAT_PAGE_SIZE: number
    UNBILLED_GROUP_PAGE_SIZE: number
}

export function UnbilledTab({
    unbilled,
    filteredUnbilled,
    groupedUnbilled,
    displayedGroups,
    selectedTxIds,
    unbilledSearch,
    setUnbilledSearch,
    unbilledTypeFilter,
    setUnbilledTypeFilter,
    unbilledPpnFilter,
    setUnbilledPpnFilter,
    filterNoPriceOnly,
    setFilterNoPriceOnly,
    groupBy,
    setGroupBy,
    unbilledPage,
    setUnbilledPage,
    unbilledPpnCount,
    unbilledNonPpnCount,
    noPriceTxCount,
    isAllExpanded,
    toggleExpandAll,
    isGroupExpanded,
    toggleGroupExpand,
    selectGroup,
    selectAll,
    toggleTx,
    canManage,
    selectedTxList,
    selectedVolume,
    selectedDays,
    onOpenCreateDialog,
    UNBILLED_FLAT_PAGE_SIZE,
    UNBILLED_GROUP_PAGE_SIZE,
}: UnbilledTabProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-base">Transaksi Belum Ditagih (Unbilled)</CardTitle>
                        {/* Type filter toggles */}
                        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-100 text-xs gap-0.5 shadow-2xs flex-wrap">
                            <button
                                type="button"
                                className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 cursor-pointer ${unbilledTypeFilter === "ALL" && unbilledPpnFilter === "all" && !filterNoPriceOnly ? "bg-white font-bold text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}
                                onClick={() => {
                                    setUnbilledTypeFilter("ALL")
                                    setUnbilledPpnFilter("all")
                                    setFilterNoPriceOnly(false)
                                    setUnbilledPage(1)
                                }}
                            >
                                <span>Semua</span>
                                <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px] font-mono">{unbilled.length}</span>
                            </button>
                            <button
                                type="button"
                                className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 cursor-pointer ${unbilledTypeFilter === "READYMIX" && !filterNoPriceOnly ? "bg-blue-600 font-bold text-white shadow-xs" : "text-slate-600 hover:text-blue-700"}`}
                                onClick={() => {
                                    setUnbilledTypeFilter("READYMIX")
                                    setFilterNoPriceOnly(false)
                                    setUnbilledPage(1)
                                }}
                            >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Cor</span>
                                <span className={`${unbilledTypeFilter === "READYMIX" && !filterNoPriceOnly ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"} px-1.5 py-0.2 rounded-full text-[10px] font-mono`}>
                                    {unbilled.filter(t => t.itemType !== "SEWA").length}
                                </span>
                            </button>
                            <button
                                type="button"
                                className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 cursor-pointer ${unbilledTypeFilter === "SEWA" && !filterNoPriceOnly ? "bg-purple-600 font-bold text-white shadow-xs" : "text-slate-600 hover:text-purple-700"}`}
                                onClick={() => {
                                    setUnbilledTypeFilter("SEWA")
                                    setFilterNoPriceOnly(false)
                                    setUnbilledPage(1)
                                }}
                            >
                                <Wrench className="w-3.5 h-3.5" />
                                <span>Sewa</span>
                                <span className={`${unbilledTypeFilter === "SEWA" && !filterNoPriceOnly ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"} px-1.5 py-0.2 rounded-full text-[10px] font-mono`}>
                                    {unbilled.filter(t => t.itemType === "SEWA").length}
                                </span>
                            </button>
                            <button
                                type="button"
                                className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 cursor-pointer ${unbilledPpnFilter === "PPN" && !filterNoPriceOnly ? "bg-emerald-600 font-bold text-white shadow-xs" : "text-emerald-700 hover:text-emerald-900"}`}
                                onClick={() => {
                                    const next = unbilledPpnFilter === "PPN" ? "all" : "PPN"
                                    setUnbilledPpnFilter(next)
                                    setFilterNoPriceOnly(false)
                                    setUnbilledPage(1)
                                }}
                                title="Filter transaksi unbilled yang dikenakan PPN (11%)"
                            >
                                <span>✓ PPN (11%)</span>
                                <span className={`${unbilledPpnFilter === "PPN" && !filterNoPriceOnly ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"} px-1.5 py-0.2 rounded-full text-[10px] font-mono`}>
                                    {unbilledPpnCount}
                                </span>
                            </button>
                            <button
                                type="button"
                                className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 cursor-pointer ${unbilledPpnFilter === "NON_PPN" && !filterNoPriceOnly ? "bg-amber-600 font-bold text-white shadow-xs" : "text-amber-800 hover:text-amber-950"}`}
                                onClick={() => {
                                    const next = unbilledPpnFilter === "NON_PPN" ? "all" : "NON_PPN"
                                    setUnbilledPpnFilter(next)
                                    setFilterNoPriceOnly(false)
                                    setUnbilledPage(1)
                                }}
                                title="Filter transaksi unbilled Non-PPN (Bebas PPN Pelanggan)"
                            >
                                <span>⚠ Non-PPN (0%)</span>
                                <span className={`${unbilledPpnFilter === "NON_PPN" && !filterNoPriceOnly ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900"} px-1.5 py-0.2 rounded-full text-[10px] font-mono`}>
                                    {unbilledNonPpnCount}
                                </span>
                            </button>
                            <button
                                type="button"
                                className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 cursor-pointer ${filterNoPriceOnly ? "bg-rose-600 font-bold text-white shadow-xs" : "text-rose-700 hover:text-rose-900"}`}
                                onClick={() => {
                                    const next = !filterNoPriceOnly
                                    setFilterNoPriceOnly(next)
                                    if (next) {
                                        setUnbilledTypeFilter("ALL")
                                        setUnbilledPpnFilter("all")
                                    }
                                    setUnbilledPage(1)
                                }}
                                title="Filter transaksi yang belum diset harganya di Master Proyek"
                            >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                <span>Belum Ada Harga</span>
                                {noPriceTxCount > 0 && (
                                    <span className={`${filterNoPriceOnly ? "bg-white/20 text-white" : "bg-rose-100 text-rose-900"} px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold`}>
                                        {noPriceTxCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                            <Input
                                className="pl-8 h-8 w-44 sm:w-52 text-xs"
                                placeholder="Cari customer/proyek/alat..."
                                value={unbilledSearch}
                                onChange={e => setUnbilledSearch(e.target.value)}
                            />
                        </div>
                        <Select value={groupBy} onValueChange={v => setGroupBy(v as any)}>
                            <SelectTrigger className="h-8 w-40 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="flat">Flat List (Tanpa Grup)</SelectItem>
                                <SelectItem value="date">Group by Tanggal</SelectItem>
                                <SelectItem value="customer">Group by Customer</SelectItem>
                                <SelectItem value="mutu">Group by Mutu / Alat</SelectItem>
                            </SelectContent>
                        </Select>
                        {groupBy !== "flat" && groupedUnbilled.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs flex items-center gap-1.5 cursor-pointer text-slate-700 hover:bg-slate-100"
                                onClick={toggleExpandAll}
                                title={isAllExpanded ? "Ciutkan / minimize semua grup" : "Bentangkan semua grup"}
                            >
                                {isAllExpanded ? (
                                    <>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Ciutkan Semua</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Buka Semua</span>
                                    </>
                                )}
                            </Button>
                        )}
                        {canManage && (
                            <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer" onClick={selectAll}>
                                {selectedTxIds.size === filteredUnbilled.length && filteredUnbilled.length > 0 ? "Batal Pilih" : "Pilih Semua"}
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {filteredUnbilled.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
                        <p className="text-sm">Tidak ada transaksi yang cocok</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    {canManage && (
                                        <TableHead className="w-8 px-3">
                                            <input type="checkbox"
                                                checked={selectedTxIds.size === filteredUnbilled.length && filteredUnbilled.length > 0}
                                                onChange={selectAll}
                                                className="rounded cursor-pointer"
                                            />
                                        </TableHead>
                                    )}
                                    <TableHead className="text-xs">Tanggal</TableHead>
                                    <TableHead className="text-xs">Customer / Proyek</TableHead>
                                    <TableHead className="text-xs">Mutu / Alat</TableHead>
                                    <TableHead className="text-xs text-right">TM / Unit</TableHead>
                                    <TableHead className="text-xs text-right">Vol / Durasi</TableHead>
                                    <TableHead className="text-xs text-right">Tarif</TableHead>
                                    <TableHead className="text-xs text-right">Nilai</TableHead>
                                    <TableHead className="text-xs">Cabang/BP</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedGroups.map(group => {
                                    const isExpanded = isGroupExpanded(group.key)
                                    const readyMixItems = group.items.filter((i: any) => i.itemType !== "SEWA")
                                    const sewaItems = group.items.filter((i: any) => i.itemType === "SEWA")
                                    const rmVol = readyMixItems.reduce((s: number, tx: any) => s + (tx.volume_cubic || 0), 0)
                                    const sewaDays = sewaItems.reduce((s: number, tx: any) => s + (tx.totalDays || 0), 0)
                                    const groupSubtotal = group.items.reduce((s: number, tx: any) => {
                                        if (tx.itemType === "SEWA") {
                                            return s + (tx.totalPrice || (tx.pricePerDay * tx.totalDays) || 0)
                                        }
                                        const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price ?? 0
                                        return s + (tx.volume_cubic * price)
                                    }, 0)

                                    return (
                                        <React.Fragment key={group.key}>
                                            {groupBy !== "flat" && (
                                                <TableRow
                                                    className="bg-slate-100/75 hover:bg-slate-200/75 cursor-pointer select-none transition-colors border-y border-slate-200"
                                                    onClick={() => toggleGroupExpand(group.key)}
                                                >
                                                    {canManage && (
                                                        <TableCell className="px-3 w-8" onClick={e => e.stopPropagation()}>
                                                            <input type="checkbox"
                                                                checked={group.items.length > 0 && group.items.every((tx: any) => selectedTxIds.has(tx.id))}
                                                                onChange={() => selectGroup(group.items)}
                                                                className="rounded cursor-pointer"
                                                            />
                                                        </TableCell>
                                                    )}
                                                    <TableCell colSpan={canManage ? 9 : 9} className="py-2 text-xs">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="p-0.5 rounded text-slate-500">
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="w-4 h-4 text-blue-600" />
                                                                    ) : (
                                                                        <ChevronRight className="w-4 h-4 text-slate-600" />
                                                                    )}
                                                                </span>
                                                                <span className="font-semibold text-slate-800">
                                                                    {groupBy === "date" ? `📅 ${group.label}` : groupBy === "customer" ? `👤 ${group.label}` : `🔷 ${group.label}`}
                                                                </span>
                                                                <span className="text-slate-500 font-normal">
                                                                    ({group.items.length} tx
                                                                    {rmVol > 0 ? ` · ${rmVol.toFixed(2)} m³` : ""}
                                                                    {sewaDays > 0 ? ` · ${sewaDays} hari sewa` : ""}
                                                                    {groupSubtotal > 0 ? ` · ${fmt(groupSubtotal)}` : ""})
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mr-2">
                                                                {!isExpanded ? (
                                                                    <span className="text-[11px] text-slate-500 font-medium bg-slate-200/70 px-2 py-0.5 rounded">
                                                                        Diciutkan (Klik untuk buka)
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[11px] text-slate-400 font-normal">
                                                                        Klik baris untuk menciutkan
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {isExpanded && group.items.map((tx: any) => {
                                                const isSewa = tx.itemType === "SEWA"
                                                const isPpn = isSewa
                                                    ? (tx.is_ppn === true || (tx.ppn_mode && tx.ppn_mode !== "NON_PPN"))
                                                    : Boolean(tx.project?.tax_ppn && tx.project.tax_ppn > 0)
                                                const price = isSewa
                                                    ? tx.pricePerDay
                                                    : tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)?.price
                                                const hasNoPrice = isSewa
                                                    ? (!price && !tx.totalPrice)
                                                    : (!price || price <= 0)
                                                const nilai = isSewa
                                                    ? (tx.totalPrice || (tx.pricePerDay * tx.totalDays))
                                                    : (price ? tx.volume_cubic * price : null)

                                                return (
                                                    <TableRow
                                                        key={tx.id}
                                                        className={`text-xs ${canManage ? "cursor-pointer" : ""} ${selectedTxIds.has(tx.id) ? "bg-blue-50" : hasNoPrice ? "bg-amber-50/60 hover:bg-amber-100/60" : "hover:bg-slate-50/60"}`}
                                                        onClick={() => canManage && toggleTx(tx.id)}
                                                    >
                                                        {canManage && (
                                                            <TableCell className="px-3">
                                                                <input type="checkbox" checked={selectedTxIds.has(tx.id)} onChange={() => toggleTx(tx.id)} className="rounded cursor-pointer" onClick={e => e.stopPropagation()} />
                                                            </TableCell>
                                                        )}
                                                        <TableCell className="whitespace-nowrap font-mono">{fmtDate(tx.date)}</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium text-slate-800">
                                                                {tx.customer?.customer_name || tx.project?.customer?.customer_name}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-slate-400">
                                                                    {tx.project?.name || tx.lokasi_proyek || (isSewa ? "Sewa Alat" : "-")}
                                                                </span>
                                                                {isPpn ? (
                                                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Dikenakan PPN (11%)">
                                                                        PPN 11%
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Non-PPN (Bebas Pajak Pelanggan)">
                                                                        Non-PPN
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {isSewa ? (
                                                                <div className="space-y-0.5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-medium text-slate-800">{tx.equipment?.nama_alat}</span>
                                                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1 py-0 font-semibold">
                                                                            Sewa
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-400">
                                                                        {tx.sewaNumber && <span className="font-mono text-slate-500 mr-1.5">{tx.sewaNumber}</span>}
                                                                        {tx.operator?.name && `Op: ${tx.operator.name}`}
                                                                    </div>
                                                                </div>
                            ) : (
                                <span>{tx.concreteQuality?.name}</span>
                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {isSewa ? "1 Unit" : "1 TM"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-medium">
                                                            {isSewa ? `${tx.totalDays} Hari` : `${tx.volume_cubic.toFixed(2)} m³`}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {price ? (isSewa ? `${fmt(price)}/hr` : fmt(price)) : (
                                                                <span className="inline-flex items-center gap-1 justify-end text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded font-semibold text-[10px]" title="Harga belum diset di Master Proyek">
                                                                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" /> Belum diset
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-medium">{nilai ? fmt(nilai) : "-"}</TableCell>
                                                        <TableCell>
                                                            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{tx.location?.name ?? "-"}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {tx.status === "Pending"
                                                                ? <span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" />Pending</span>
                                                                : <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" />Confirmed</span>
                                                            }
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </React.Fragment>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {filteredUnbilled.length > 0 && (
                    <PaginationBar
                        page={unbilledPage}
                        total={groupBy === "flat" ? filteredUnbilled.length : groupedUnbilled.length}
                        perPage={groupBy === "flat" ? UNBILLED_FLAT_PAGE_SIZE : UNBILLED_GROUP_PAGE_SIZE}
                        onPageChange={setUnbilledPage}
                    />
                )}

                {canManage && selectedTxIds.size > 0 && (
                    <div className="sticky bottom-0 bg-blue-700 text-white px-4 py-3 flex items-center justify-between rounded-b-lg shadow-lg">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">
                                ☑ {selectedTxIds.size} transaksi dipilih
                                {selectedVolume > 0 && selectedDays === 0 && ` · ${selectedVolume.toFixed(2)} m³`}
                                {selectedDays > 0 && selectedVolume === 0 && ` · ${selectedDays} hari sewa`}
                                {selectedVolume > 0 && selectedDays > 0 && ` · ${selectedVolume.toFixed(2)} m³ + ${selectedDays} hari`}
                            </span>
                            {selectedTxList.some(tx => tx.itemType === "SEWA") && selectedTxList.some(tx => tx.itemType === "READYMIX") && (
                                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs border border-white/20 shadow-xs">
                                    ⚡ Siap Digabung: Invoice Terpadu (Cor + Sewa)
                                </Badge>
                            )}
                        </div>
                        <Button
                            className="bg-white text-blue-700 hover:bg-blue-50 h-8 font-semibold cursor-pointer shadow-sm"
                            onClick={onOpenCreateDialog}
                        >
                            <FileText className="w-4 h-4 mr-1.5" />
                            {selectedTxList.some(tx => tx.itemType === "SEWA") && selectedTxList.some(tx => tx.itemType === "READYMIX")
                                ? "Buat Invoice Terpadu"
                                : "Buat Invoice"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
