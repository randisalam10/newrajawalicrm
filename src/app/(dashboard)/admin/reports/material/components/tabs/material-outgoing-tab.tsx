"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from "lucide-react"
import { fmt, fmtNum, fmtDate } from "../../helpers"
import { OutgoingMaterialItem } from "../../types"

interface MaterialOutgoingTabProps {
    outgoingList: OutgoingMaterialItem[]
}

export const MaterialOutgoingTab: React.FC<MaterialOutgoingTabProps> = ({
    outgoingList,
}) => {
    return (
        <Card className="border-slate-200/80 shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <ArrowUpRight className="w-4 h-4 text-rose-600" />
                        Daftar Pengeluaran / Penjualan Material Keluar
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                        Menampilkan {outgoingList.length} tiket transaksi material keluar untuk proyek internal maupun penjualan
                    </CardDescription>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table className="text-xs">
                    <TableHeader className="bg-slate-50 text-[11px]">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-700">Tgl Keluar</TableHead>
                            <TableHead className="font-semibold text-slate-700">No Bon</TableHead>
                            <TableHead className="font-semibold text-slate-700">Cabang</TableHead>
                            <TableHead className="font-semibold text-slate-700">Material</TableHead>
                            <TableHead className="font-semibold text-slate-700">Kategori</TableHead>
                            <TableHead className="font-semibold text-slate-700">Penerima / Proyek Tujuan</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Volume (m³)</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Harga Satuan (Rp/m³)</TableHead>
                            <TableHead className="text-right font-bold text-rose-900">Total Nilai (Rp)</TableHead>
                            <TableHead className="font-semibold text-slate-700">Angkutan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {outgoingList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-6 text-slate-400 italic">
                                    Tidak ada data pengeluaran material pada filter yang dipilih.
                                </TableCell>
                            </TableRow>
                        ) : (
                            outgoingList.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50/80">
                                    <TableCell className="font-mono text-slate-700 whitespace-nowrap">
                                        {fmtDate(item.date)}
                                    </TableCell>
                                    <TableCell className="font-mono font-bold text-slate-900 whitespace-nowrap">
                                        {item.no_bon}
                                    </TableCell>
                                    <TableCell className="text-slate-600 whitespace-nowrap">
                                        {item.locationName}
                                    </TableCell>
                                    <TableCell className="font-semibold text-slate-900 whitespace-nowrap">
                                        {item.material_name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                            {item.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-700 max-w-[150px] truncate" title={item.recipient}>
                                        {item.recipient}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-slate-900">
                                        {fmtNum(item.volume_cubic, 2)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-slate-700">
                                        <div className="flex items-center justify-end gap-1">
                                            <span>{fmt(item.unit_price)}</span>
                                            {item.is_from_master_price && (
                                                <Badge variant="outline" className="text-[8px] px-1 py-0 bg-blue-50 text-blue-700 border-blue-200 font-semibold" title="Harga dihitung otomatis dari tarif Master Material">
                                                    Master
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-extrabold text-rose-950">
                                        {fmt(item.total_price)}
                                    </TableCell>
                                    <TableCell className="text-slate-600 whitespace-nowrap">
                                        {item.transport_mode === 'INTERNAL_DT' ? 'DT Internal' : 'Diambil Pembeli'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    )
}
