"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

interface RetasePendingTabProps {
    pendingTransactions: any[]
    isCorporate: boolean
    canConfirm: boolean
    onOpenConfirm: (t: any) => void
}

export function RetasePendingTab({
    pendingTransactions,
    isCorporate,
    canConfirm,
    onOpenConfirm,
}: RetasePendingTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaksi Menunggu Konfirmasi</CardTitle>
                <CardDescription>
                    Masukkan riil jarak tempuh (KM) setelah mobil kembali untuk menghitung Retase otomatis.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <SimpleDataTable<any>
                    data={pendingTransactions}
                    searchKeys={["customer.customer_name", "customer.project_name", "driver.name"]}
                    searchPlaceholder="Cari customer atau sopir..."
                >
                    {(items, sortConfig, toggleSort) => (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead>
                                        <SortableHeader<any> label="Tanggal" sortKey="date" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Customer / Proyek" sortKey="customer.customer_name" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Rit (TM)" sortKey="trip_sequence" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Mutu / Vol" sortKey="concreteQuality.name" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Supir / No Pol" sortKey="driver.name" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    {isCorporate && (
                                        <TableHead>
                                            <SortableHeader<any> label="Cabang" sortKey="location.name" sortConfig={sortConfig} onSort={toggleSort} />
                                        </TableHead>
                                    )}
                                    {canConfirm && <TableHead className="text-right">Aksi</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={(isCorporate ? 1 : 0) + (canConfirm ? 1 : 0) + 5} className="text-center text-slate-500 py-8">
                                            Tidak ada transaksi pending.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {items.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell className="text-xs">
                                            {format(new Date(t.date), "dd MMM yyyy HH:mm", { locale: idLocale })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-xs uppercase">{t.project?.customer?.customer_name ?? '-'}</div>
                                            <div className="text-[10px] text-slate-500 uppercase">{t.project?.name ?? '-'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold bg-slate-50">TM-{t.trip_sequence}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-xs">{t.concreteQuality.name}</div>
                                            <div className="text-[10px] text-slate-500">{t.volume_cubic} M³</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs font-medium">{t.driver.name}</div>
                                            <div className="text-[10px] text-slate-500">{t.vehicle.plate_number}</div>
                                        </TableCell>
                                        {isCorporate && <TableCell className="text-xs">{t.location.name}</TableCell>}
                                        {canConfirm && (
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => onOpenConfirm(t)}>
                                                    Konfirmasi
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </SimpleDataTable>
            </CardContent>
        </Card>
    )
}
