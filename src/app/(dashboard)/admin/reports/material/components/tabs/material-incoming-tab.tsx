"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowDownLeft, FileSpreadsheet } from "lucide-react"
import { fmt, fmtNum, fmtDate } from "../../helpers"
import { IncomingMaterialItem } from "../../types"

interface MaterialIncomingTabProps {
    incomingList: IncomingMaterialItem[]
    onExportCSV: () => void
}

export const MaterialIncomingTab: React.FC<MaterialIncomingTabProps> = ({
    incomingList,
    onExportCSV,
}) => {
    return (
        <Card className="border-slate-200/80 shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                        Daftar Surat Jalan Penerimaan Material Masuk
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                        Menampilkan {incomingList.length} tiket transaksi material masuk beserta rincian kubikasi, harga satuan, dan retase
                    </CardDescription>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onExportCSV}
                    className="h-7 text-xs bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                >
                    <FileSpreadsheet className="w-3 h-3 mr-1" />
                    <span>Ekspor Data</span>
                </Button>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table className="text-xs">
                    <TableHeader className="bg-slate-50 text-[11px]">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-700">Tgl Bon</TableHead>
                            <TableHead className="font-semibold text-slate-700">No Bon</TableHead>
                            <TableHead className="font-semibold text-slate-700">Cabang</TableHead>
                            <TableHead className="font-semibold text-slate-700">Material</TableHead>
                            <TableHead className="font-semibold text-slate-700">Sumber / Supplier</TableHead>
                            <TableHead className="font-semibold text-slate-700">Sopir & Plat</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Volume (m³)</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Harga Pokok/m³</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Nilai Pokok (Rp)</TableHead>
                            <TableHead className="text-right font-semibold text-amber-800">Retase DT (Rp)</TableHead>
                            <TableHead className="text-right font-bold text-blue-900 bg-blue-50/50">Landed Cost (Rp)</TableHead>
                            <TableHead className="text-right font-bold text-emerald-800">Landed/m³</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {incomingList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={12} className="text-center py-6 text-slate-400 italic">
                                    Tidak ada data penerimaan material masuk pada filter yang dipilih.
                                </TableCell>
                            </TableRow>
                        ) : (
                            incomingList.map((item) => (
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
                                    <TableCell className="text-slate-600 max-w-[140px] truncate" title={item.supplier}>
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${item.source_type === 'Internal' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                                        {item.supplier}
                                    </TableCell>
                                    <TableCell className="text-slate-700 whitespace-nowrap">
                                        <div>{item.driver_name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{item.plate_number}</div>
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
                                    <TableCell className="text-right font-mono font-semibold text-slate-900">
                                        {fmt(item.material_cost)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-amber-900 font-semibold">
                                        {fmt(item.retase_cost)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-extrabold text-blue-900 bg-blue-50/30">
                                        {fmt(item.landed_cost)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-emerald-800">
                                        {fmt(item.landed_per_m3)}
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
