"use client"

import React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { BarChart2, Loader2 } from "lucide-react"
import {
    AggregateLedgerRow,
    AGGREGATE_TYPE_OPTIONS,
} from "../../columns"

interface KartuStokTabProps {
    showCabang: boolean
    ledgerType: string
    ledgerData: AggregateLedgerRow[]
    ledgerLoading: boolean
    ledgerLoaded: boolean
    onLedgerTypeChange: (val: string) => void
}

export function KartuStokTab({
    showCabang,
    ledgerType,
    ledgerData,
    ledgerLoading,
    ledgerLoaded,
    onLedgerTypeChange,
}: KartuStokTabProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-700">Tampilkan stok untuk:</span>
                    <Select value={ledgerType} onValueChange={onLedgerTypeChange}>
                        <SelectTrigger className="w-[220px] h-8 text-xs bg-slate-50 border-slate-200 font-medium">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {AGGREGATE_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <p className="text-xs text-slate-500">
                    Menghitung mutasi masuk (penerimaan material) vs mutasi keluar (pemakaian produksi batching)
                </p>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                {ledgerLoading ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-xs gap-2">
                        <Loader2 className="animate-spin h-4 w-4 text-blue-600" />
                        <span>Memuat mutasi kartu stok...</span>
                    </div>
                ) : !ledgerLoaded ? (
                    <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                        <BarChart2 className="h-8 w-8 text-slate-300" />
                        <p>Pilih material untuk memuat kartu stok mutasi</p>
                    </div>
                ) : (
                    <SimpleDataTable<AggregateLedgerRow>
                        data={ledgerData}
                        searchKeys={["description", "reference"]}
                        searchPlaceholder="Cari keterangan atau referensi surat jalan..."
                        pageSize={15}
                    >
                        {(items, sortConfig, toggleSort) => (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 border-b border-slate-200">
                                        <TableHead className="w-[140px]">
                                            <SortableHeader
                                                label="Tanggal & Jam"
                                                sortKey="formattedDate"
                                                sortConfig={sortConfig}
                                                onSort={toggleSort}
                                            />
                                        </TableHead>
                                        {showCabang && <TableHead className="w-[120px]">Cabang</TableHead>}
                                        <TableHead className="w-[80px]">Tipe</TableHead>
                                        <TableHead className="min-w-[200px]">Keterangan Transaksi</TableHead>
                                        <TableHead className="w-[140px]">Referensi</TableHead>
                                        <TableHead className="w-[110px] text-right">
                                            <SortableHeader
                                                label="Masuk (m³)"
                                                sortKey="qty_in"
                                                sortConfig={sortConfig}
                                                onSort={toggleSort}
                                            />
                                        </TableHead>
                                        <TableHead className="w-[110px] text-right">
                                            <SortableHeader
                                                label="Keluar (m³)"
                                                sortKey="qty_out"
                                                sortConfig={sortConfig}
                                                onSort={toggleSort}
                                            />
                                        </TableHead>
                                        <TableHead className="w-[120px] text-right">
                                            <SortableHeader
                                                label="Sisa Stok (m³)"
                                                sortKey="balance"
                                                sortConfig={sortConfig}
                                                onSort={toggleSort}
                                            />
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={showCabang ? 8 : 7}
                                                className="h-24 text-center text-muted-foreground text-xs"
                                            >
                                                Belum ada rekaman mutasi stok untuk jenis material ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item) => {
                                            const isOut = item.type === "OUT"
                                            return (
                                                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <TableCell className="text-xs font-mono whitespace-nowrap text-slate-700">
                                                        {item.formattedDate}
                                                    </TableCell>
                                                    {showCabang && (
                                                        <TableCell>
                                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                                {item.locationName}
                                                            </span>
                                                        </TableCell>
                                                    )}
                                                    <TableCell>
                                                        <Badge
                                                            variant={isOut ? "destructive" : "default"}
                                                            className="text-[10px] uppercase font-bold py-0 h-4"
                                                        >
                                                            {isOut ? "OUT" : "IN"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-xs max-w-[260px] text-slate-800">
                                                        <div>{item.description}</div>
                                                        {item.detail_conversion && (
                                                            <span className="text-[10px] text-slate-500 font-normal block font-mono">
                                                                Konversi: {item.detail_conversion}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-mono text-slate-500 max-w-[160px] truncate">
                                                        {item.reference}
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs font-mono">
                                                        {item.qty_in > 0 ? (
                                                            <span className="font-bold text-emerald-600">
                                                                +{item.qty_in.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs font-mono">
                                                        {item.qty_out > 0 ? (
                                                            <span className="font-bold text-rose-600">
                                                                -{item.qty_out.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-xs text-slate-900 border-l border-slate-100 pl-3 bg-slate-50/50 font-mono">
                                                        {item.balance.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </SimpleDataTable>
                )}
            </Card>
        </div>
    )
}
