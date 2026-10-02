"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table"
import { Truck, Fuel, Layers, Wrench, Gauge, Tag, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { fmt, fmtDate, fmtNum, getCategoryBadgeClass } from "../helpers"
import { VehicleAnalyticsItem } from "../types"

interface VehicleDetailInspectionProps {
    data: VehicleAnalyticsItem
    activeTab: string
    onTabChange: (tab: string) => void
    onClose: () => void
}

export function VehicleDetailInspection({
    data,
    activeTab,
    onTabChange,
    onClose,
}: VehicleDetailInspectionProps) {
    const { vehicle, stats, recentExpenses, recentTransactions, recentPoItems, recentSewaTransactions, meterEvents } = data
    const categoryName = vehicle.category?.name || vehicle.vehicle_type || ""
    const isHM = (vehicle.meter_type || "").toUpperCase() === "HM"

    return (
        <div className="border border-blue-200 rounded-lg bg-blue-50/20 overflow-hidden shadow-2xs">
            {/* Header Strip */}
            <div className="p-3 bg-white border-b border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-600 text-white rounded-lg shadow-2xs shrink-0">
                        <Truck className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900 font-mono">
                                {vehicle.code}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {vehicle.plate_number}
                            </span>
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClass(
                                    categoryName
                                )}`}
                            >
                                {categoryName}
                            </span>
                            <span className="text-xs text-slate-500">
                                {vehicle.location?.name || "-"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick metrics in header */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                    <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                        <span className="text-[9px] text-slate-500 block uppercase font-medium">Jarak / Jam Tempuh</span>
                        <span className="font-mono font-bold text-slate-900">
                            {stats.kmDistance > 0 ? `${fmtNum(stats.kmDistance)} ${isHM ? "HM" : "KM"}` : "-"}
                        </span>
                    </div>
                    <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                        <span className="text-[9px] text-slate-500 block uppercase font-medium">Rentang Meter</span>
                        <span className="font-mono font-bold text-slate-900">
                            {stats.minKm !== null && stats.maxKm !== null ? `${fmtNum(stats.minKm)} - ${fmtNum(stats.maxKm)}` : "-"}
                        </span>
                    </div>
                    <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                        <span className="text-[9px] text-slate-500 block uppercase font-medium">Solar Terpakai</span>
                        <span className="font-mono font-bold text-amber-700">
                            {fmtNum(stats.fuelLiters)} L
                        </span>
                    </div>
                    <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                        <span className="text-[9px] text-slate-500 block uppercase font-medium">Ritase / Volume</span>
                        <span className="font-mono font-bold text-indigo-700">
                            {stats.totalTrips}x ({fmtNum(stats.totalVolume, 1)} m³)
                        </span>
                    </div>
                    <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                        <span className="text-[9px] text-slate-500 block uppercase font-medium">Total Biaya TCO</span>
                        <span className="font-mono font-bold text-emerald-700">
                            {fmt(stats.grandTotalCost || stats.totalCost)}
                        </span>
                    </div>
                    {(stats.rentalRevenue && stats.rentalRevenue > 0 || vehicle.is_for_rent) && (
                        <>
                            <div className="px-2 py-1 bg-teal-50/70 rounded border border-teal-200 text-right">
                                <span className="text-[9px] text-teal-700 block uppercase font-semibold">Pendapatan Sewa</span>
                                <span className="font-mono font-bold text-teal-800">
                                    {fmt(stats.rentalRevenue || 0)}
                                </span>
                            </div>
                            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-200 text-right">
                                <span className="text-[9px] text-slate-500 block uppercase font-medium">Profit Bersih</span>
                                <span
                                    className={`font-mono font-bold ${
                                        (stats.netProfit || 0) >= 0 ? "text-emerald-700" : "text-rose-600"
                                    }`}
                                >
                                    {fmt(stats.netProfit || 0)}
                                </span>
                            </div>
                        </>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="h-7 text-xs px-2 gap-1 text-slate-600 hover:text-slate-900 bg-white border-slate-300 ml-1 cursor-pointer"
                    >
                        <X className="h-3.5 w-3.5" />
                        <span>Tutup Detail</span>
                    </Button>
                </div>
            </div>

            {/* Tabs Log */}
            <div className="p-3 space-y-2.5">
                <Tabs value={activeTab} onValueChange={onTabChange}>
                    <TabsList className="bg-slate-100/90 p-0.5 rounded-md h-7">
                        <TabsTrigger value="expenses" className="text-xs h-6 px-2.5 gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-2xs">
                            <Fuel className="h-3 w-3 text-amber-600" />
                            <span>Log BBM & Pengeluaran RBL ({recentExpenses.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="trips" className="text-xs h-6 px-2.5 gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-2xs">
                            <Layers className="h-3 w-3 text-indigo-600" />
                            <span>Log Pengiriman & Ritase ({recentTransactions.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="spareparts" className="text-xs h-6 px-2.5 gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-2xs">
                            <Wrench className="h-3 w-3 text-slate-600" />
                            <span>Suku Cadang & PO ({recentPoItems?.length || 0})</span>
                        </TabsTrigger>
                        <TabsTrigger value="meter" className="text-xs h-6 px-2.5 gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-2xs">
                            <Gauge className="h-3 w-3 text-slate-700" />
                            <span>Audit Meter (RBL + PO) ({meterEvents?.length || 0})</span>
                            {stats.hasBackdateAnomaly && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-300 ml-1">
                                    Backdate!
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="sewa" className="text-xs h-6 px-2.5 gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-2xs">
                            <Tag className="h-3 w-3 text-teal-600" />
                            <span>Log Sewa & Pendapatan ({recentSewaTransactions?.length || 0})</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: Expenses Log */}
                    <TabsContent value="expenses" className="mt-2">
                        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                            <Table>
                                <TableHeader className="bg-slate-50/80 text-[11px]">
                                    <TableRow className="h-7">
                                        <TableHead className="w-9 text-center">#</TableHead>
                                        <TableHead className="w-24">Tanggal</TableHead>
                                        <TableHead className="w-28">No. Bukti / Ref</TableHead>
                                        <TableHead className="w-28">Kategori</TableHead>
                                        <TableHead>Uraian Kebutuhan</TableHead>
                                        <TableHead className="text-right w-24">KM Odometer</TableHead>
                                        <TableHead className="text-right w-20">Qty</TableHead>
                                        <TableHead className="text-right w-24">Harga (Rp)</TableHead>
                                        <TableHead className="text-right w-28 font-bold">Total (Rp)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="text-xs">
                                    {recentExpenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="py-6 text-center text-slate-400 italic">
                                                Belum ada log transaksi pengeluaran RBL untuk armada ini pada periode yang dipilih.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentExpenses.map((exp: any, idx: number) => (
                                            <TableRow key={exp.id} className="h-8 hover:bg-slate-50/70">
                                                <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="font-mono text-slate-700 py-1">
                                                    {fmtDate(exp.date)}
                                                </TableCell>
                                                <TableCell className="font-mono text-slate-600 text-[11px] py-1">
                                                    {exp.receiptNo || "-"}
                                                </TableCell>
                                                <TableCell className="py-1">
                                                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                        {exp.categoryRef?.name || exp.category || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-900 py-1">
                                                    {exp.itemDescription}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-slate-700 py-1 font-semibold">
                                                    {exp.kmMeter !== null && exp.kmMeter !== undefined ? exp.kmMeter.toLocaleString("id-ID") : "-"}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-medium py-1">
                                                    {exp.quantity ? `${exp.quantity} ${exp.unit || ""}` : "-"}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-slate-600 py-1">
                                                    {exp.unitPrice ? fmt(exp.unitPrice) : "-"}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-slate-900 py-1">
                                                    {fmt(exp.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                                {recentExpenses.length > 0 && (
                                    <TableFooter className="bg-slate-50/80 font-semibold text-xs">
                                        <TableRow className="h-8">
                                            <TableCell colSpan={6} className="text-right text-slate-600">
                                                Total Pengeluaran:
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-amber-700">
                                                {fmtNum(stats.fuelLiters)} L
                                            </TableCell>
                                            <TableCell className="text-right"></TableCell>
                                            <TableCell className="text-right font-mono text-emerald-700 font-bold">
                                                {fmt(stats.totalCost)}
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                )}
                            </Table>
                        </div>
                    </TabsContent>

                    {/* TAB 2: Trips Log */}
                    <TabsContent value="trips" className="mt-2">
                        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                            <Table>
                                <TableHeader className="bg-slate-50/80 text-[11px]">
                                    <TableRow className="h-7">
                                        <TableHead className="w-9 text-center">#</TableHead>
                                        <TableHead className="w-24">Tanggal</TableHead>
                                        <TableHead className="w-16 text-center">Rit Ke</TableHead>
                                        <TableHead>Proyek</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Mutu Beton</TableHead>
                                        <TableHead className="text-right w-24">Volume (m³)</TableHead>
                                        <TableHead>Supir</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="text-xs">
                                    {recentTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-6 text-center text-slate-400 italic">
                                                Belum ada catatan pengiriman beton oleh unit ini pada periode yang dipilih.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentTransactions.map((tx: any, idx: number) => (
                                            <TableRow key={tx.id} className="h-8 hover:bg-slate-50/70">
                                                <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="font-mono text-slate-700 py-1">
                                                    {fmtDate(tx.date)}
                                                </TableCell>
                                                <TableCell className="text-center font-mono font-bold text-slate-800 py-1">
                                                    #{tx.trip_sequence}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-900 py-1">
                                                    {tx.project?.name || "-"}
                                                </TableCell>
                                                <TableCell className="text-slate-600 py-1">
                                                    {tx.project?.customer?.customer_name || "-"}
                                                </TableCell>
                                                <TableCell className="py-1">
                                                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-100">
                                                        {tx.concreteQuality?.name || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-blue-700 py-1">
                                                    {tx.volume_cubic ? `${tx.volume_cubic} m³` : "-"}
                                                </TableCell>
                                                <TableCell className="text-slate-700 py-1">
                                                    {tx.driver?.name || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                                {recentTransactions.length > 0 && (
                                    <TableFooter className="bg-slate-50/80 font-semibold text-xs">
                                        <TableRow className="h-8">
                                            <TableCell colSpan={6} className="text-right text-slate-600">
                                                Total Ritase & Volume:
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-blue-700 font-bold">
                                                {fmtNum(stats.totalVolume, 1)} m³
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-normal text-[11px]">
                                                {stats.totalTrips} Ritase
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                )}
                            </Table>
                        </div>
                    </TabsContent>

                    {/* TAB 3: PO Spareparts & Equipment Log */}
                    <TabsContent value="spareparts" className="mt-2">
                        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                            <Table>
                                <TableHeader className="bg-slate-50/80 text-[11px]">
                                    <TableRow className="h-7">
                                        <TableHead className="w-9 text-center">#</TableHead>
                                        <TableHead className="w-24">Tanggal PO</TableHead>
                                        <TableHead className="w-28">No. PO</TableHead>
                                        <TableHead className="w-32">Supplier</TableHead>
                                        <TableHead>Nama Suku Cadang / Barang</TableHead>
                                        <TableHead className="w-28">Part No / Merk</TableHead>
                                        <TableHead className="text-center w-24">KM / HM</TableHead>
                                        <TableHead className="text-right w-16">Qty</TableHead>
                                        <TableHead className="w-16">Satuan</TableHead>
                                        <TableHead className="text-right w-24">Harga (Rp)</TableHead>
                                        <TableHead className="text-right w-28 font-bold">Total (Rp)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="text-xs">
                                    {(!recentPoItems || recentPoItems.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="py-6 text-center text-slate-400 italic">
                                                Belum ada riwayat pembelian suku cadang / sparepart melalui PO untuk unit ini pada periode yang dipilih.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentPoItems.map((item: any, idx: number) => {
                                            const itemSubtotal = item.subtotal || ((item.harga_satuan || 0) * (item.quantity || 0))
                                            return (
                                                <TableRow key={item.id} className="h-8 hover:bg-slate-50/70">
                                                    <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-slate-700 py-1">
                                                        {fmtDate(item.purchaseOrder?.tanggal_terbit)}
                                                    </TableCell>
                                                    <TableCell className="font-mono font-semibold text-blue-700 py-1 text-[11px]">
                                                        <div>{item.purchaseOrder?.po_number || "-"}</div>
                                                        {item.purchaseOrder?.status && (
                                                            <span
                                                                className={`inline-block px-1 py-0.2 rounded text-[9px] font-semibold border mt-0.5 ${
                                                                    item.purchaseOrder.status === 'APPROVED'
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                }`}
                                                            >
                                                                {item.purchaseOrder.status === 'APPROVED' ? 'Disetujui' : 'Menunggu Approval'}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-slate-600 py-1 truncate max-w-[130px]">
                                                        {item.supplierName || item.purchaseOrder?.supplier?.name || "-"}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-900 py-1">
                                                        {item.masterItem?.name || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 py-1 text-[11px]">
                                                        {[item.masterItem?.merk, item.masterItem?.part_number].filter(Boolean).join(" / ") || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono py-1">
                                                        {item.km_hm ? (
                                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px]">
                                                                {item.km_hm}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold text-slate-900 py-1">
                                                        {item.quantity}
                                                    </TableCell>
                                                    <TableCell className="text-slate-600 py-1 text-[11px]">
                                                        {item.masterItem?.satuan || "PCS"}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-slate-600 py-1">
                                                        {fmt(item.harga_satuan)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold text-slate-900 py-1">
                                                        {fmt(itemSubtotal)}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                                {recentPoItems && recentPoItems.length > 0 && (
                                    <TableFooter className="bg-slate-50/80 font-semibold text-xs">
                                        <TableRow className="h-8">
                                            <TableCell colSpan={10} className="text-right text-slate-600">
                                                Total Biaya Suku Cadang (PO):
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-slate-900 font-bold">
                                                {fmt(stats.sparepartCost || 0)}
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                )}
                            </Table>
                        </div>
                    </TabsContent>

                    {/* TAB 4: Sewa & Pendapatan Log */}
                    <TabsContent value="sewa" className="mt-2">
                        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                            <Table>
                                <TableHeader className="bg-slate-50/80 text-[11px]">
                                    <TableRow className="h-7">
                                        <TableHead className="w-9 text-center">#</TableHead>
                                        <TableHead className="w-24">Tanggal</TableHead>
                                        <TableHead className="w-32">No. Surat Jalan</TableHead>
                                        <TableHead>Penyewa / Customer</TableHead>
                                        <TableHead>Lokasi Kerja</TableHead>
                                        <TableHead className="w-28">Operator</TableHead>
                                        <TableHead className="text-center w-20">Durasi</TableHead>
                                        <TableHead className="text-right w-24">Tarif/Hari</TableHead>
                                        <TableHead className="text-right w-28 font-bold text-teal-800">Total Sewa</TableHead>
                                        <TableHead className="w-20 text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="text-xs">
                                    {(!recentSewaTransactions || recentSewaTransactions.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="py-6 text-center text-slate-400 italic">
                                                Belum ada riwayat transaksi penyewaan untuk unit ini pada periode yang dipilih.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentSewaTransactions.map((item: any, idx: number) => (
                                            <TableRow key={item.id} className="h-8 hover:bg-slate-50/70">
                                                <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="font-mono text-slate-700 py-1">
                                                    {fmtDate(item.date)}
                                                </TableCell>
                                                <TableCell className="font-mono font-semibold text-blue-700 py-1 text-[11px]">
                                                    {item.sewa_number}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-900 py-1">
                                                    {item.customer?.customer_name || "-"}
                                                </TableCell>
                                                <TableCell className="text-slate-500 py-1 truncate max-w-[150px]">
                                                    {item.lokasi_proyek || "-"}
                                                </TableCell>
                                                <TableCell className="text-slate-700 py-1">
                                                    {item.operator?.name || "-"}
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-blue-700 py-1">
                                                    {item.total_days} Hari
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-slate-600 py-1">
                                                    {fmt(item.price_per_day)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-teal-700 py-1">
                                                    {fmt(item.total_price)}
                                                </TableCell>
                                                <TableCell className="text-center py-1">
                                                    <span
                                                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                                            item.status === 'Completed'
                                                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                                                : item.status === 'Active'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}
                                                    >
                                                        {item.status === 'Active' ? 'Aktif' : item.status === 'Completed' ? 'Selesai' : item.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                                {recentSewaTransactions && recentSewaTransactions.length > 0 && (
                                    <TableFooter className="bg-slate-50/80 font-semibold text-xs">
                                        <TableRow className="h-8">
                                            <TableCell colSpan={8} className="text-right text-slate-600">
                                                Total Pendapatan Sewa:
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-teal-700 font-bold">
                                                {fmt(stats.rentalRevenue || 0)}
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableFooter>
                                )}
                            </Table>
                        </div>
                    </TabsContent>

                    {/* TAB 5: Unified Meter Audit Trail (RBL + PO) */}
                    <TabsContent value="meter" className="mt-2">
                        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                            <Table>
                                <TableHeader className="bg-slate-50/80 text-[11px]">
                                    <TableRow className="h-7">
                                        <TableHead className="w-9 text-center">#</TableHead>
                                        <TableHead className="w-24">Tanggal</TableHead>
                                        <TableHead className="w-28">Sumber</TableHead>
                                        <TableHead className="w-28">No. Referensi</TableHead>
                                        <TableHead>Keterangan Transaksi</TableHead>
                                        <TableHead className="text-right w-28">Nilai Meter ({isHM ? "HM" : "KM"})</TableHead>
                                        <TableHead className="text-right w-24">Selisih (Δ)</TableHead>
                                        <TableHead className="w-28 text-center">Status Urutan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="text-xs">
                                    {(!meterEvents || meterEvents.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-6 text-center text-slate-400 italic">
                                                Belum ada catatan pembacaan meter (KM/HM) dari transaksi RBL ataupun PO untuk unit ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        meterEvents.map((evt: any, idx: number) => {
                                            const prevEvt = idx > 0 ? meterEvents[idx - 1] : null
                                            const delta = prevEvt ? evt.meter - prevEvt.meter : 0
                                            return (
                                                <TableRow
                                                    key={evt.id}
                                                    className={cn("h-8 hover:bg-slate-50/70", evt.isBackdateAnomaly && "bg-rose-50/40")}
                                                >
                                                    <TableCell className="text-center font-mono text-slate-400 text-[11px] py-1">
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-slate-700 py-1">
                                                        {fmtDate(evt.date)}
                                                    </TableCell>
                                                    <TableCell className="py-1">
                                                        <span
                                                            className={cn(
                                                                "inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border",
                                                                evt.type === "RBL"
                                                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                                                    : "bg-blue-50 text-blue-800 border-blue-200"
                                                            )}
                                                        >
                                                            {evt.type === "RBL" ? "RBL BBM/Operasional" : "PO Suku Cadang"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-slate-600 text-[11px] py-1">
                                                        {evt.referenceNo}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-900 py-1">
                                                        {evt.description}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold text-slate-900 py-1">
                                                        {fmtNum(evt.meter)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono py-1">
                                                        {prevEvt ? (
                                                            <span
                                                                className={cn(
                                                                    "font-semibold text-[11px]",
                                                                    delta >= 0 ? "text-emerald-700" : "text-rose-600 font-bold"
                                                                )}
                                                            >
                                                                {delta >= 0 ? `+${fmtNum(delta)}` : fmtNum(delta)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-[11px]">Awal</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center py-1">
                                                        {evt.isBackdateAnomaly ? (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                                                ⚠️ Backdate
                                                            </span>
                                                        ) : (
                                                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                Normal
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
