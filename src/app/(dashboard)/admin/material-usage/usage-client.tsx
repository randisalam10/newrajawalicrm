"use client"

import { useMemo, useState } from "react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getUsageColumns, UsageRow } from "./columns"
import { Factory, Package, Weight, Layers } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MaterialUsageClient({
    initialData,
    locations,
    userRole
}: {
    initialData: any[]
    locations: any[]
    userRole: string
}) {
    const [selectedLocation, setSelectedLocation] = useState<string>("all")

    // Filter by location if SuperAdmin
    const filteredSourceData = useMemo(() => {
        if (selectedLocation === "all" || userRole !== "SuperAdminBP") return initialData
        return initialData.filter(item => item.locationId === selectedLocation)
    }, [initialData, selectedLocation, userRole])

    // Format Data & Calculate Usages
    const tableData = useMemo(() => {
        return filteredSourceData.map((t: any) => {
            const vol = t.volume_cubic || 0
            const q = t.concreteQuality || {}
            return {
                id: t.id,
                date: new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                rawDate: new Date(t.date).toISOString().split('T')[0],
                vehicleCode: t.vehicle?.code || '-',
                driverName: t.driver?.name || '-',
                customerName: t.customer?.customer_name || '-',
                mutuName: q.name || '-',
                volume: vol,
                semen: vol * (q.composition_cement || 0),
                pasir: vol * (q.composition_sand || 0),
                batu05: vol * (q.composition_stone_05 || 0),
                batu12: vol * (q.composition_stone_12 || 0),
                batu23: vol * (q.composition_stone_23 || 0),
                batuTotal: vol * ((q.composition_stone_05 || 0) + (q.composition_stone_12 || 0) + (q.composition_stone_23 || 0)),
                locationName: t.location?.name || 'N/A'
            }
        })
    }, [filteredSourceData])

    // Summary Metrics
    const metrics = useMemo(() => {
        return tableData.reduce((acc, row) => ({
            volume: acc.volume + row.volume,
            semen: acc.semen + row.semen,
            pasir: acc.pasir + row.pasir,
            batu: acc.batu + row.batuTotal,
        }), { volume: 0, semen: 0, pasir: 0, batu: 0 })
    }, [tableData])

    // Chart Data (Group by Date)
    const chartData = useMemo(() => {
        const groups: Record<string, any> = {}
        tableData.forEach(row => {
            if (!groups[row.date]) {
                groups[row.date] = { date: row.date, semen: 0, pasir: 0, batu: 0, volume: 0, sortDate: row.rawDate }
            }
            groups[row.date].semen += row.semen
            groups[row.date].pasir += row.pasir
            groups[row.date].batu += row.batuTotal
            groups[row.date].volume += row.volume
        })
        return Object.values(groups).sort((a: any, b: any) => a.sortDate.localeCompare(b.sortDate)).slice(-14) // Last 14 active days
    }, [tableData])


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Penggunaan Material</h1>
                    <p className="text-muted-foreground">Analisa konsumsi Semen, Pasir, dan Batu berdasarkan Transaksi Produksi.</p>
                </div>
                {userRole === "SuperAdminBP" && (
                    <div className="w-full sm:w-64">
                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Pilih Cabang (Semua)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang</SelectItem>
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Volume Produksi</CardTitle>
                        <Factory className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">{metrics.volume.toFixed(1)} <span className="text-sm font-normal text-slate-500">m³</span></div>
                        <p className="text-xs text-muted-foreground mt-1">Total beton cor terkirim</p>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-l-4 border-l-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Penggunaan Semen</CardTitle>
                        <Package className="h-4 w-4 text-slate-700" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">{metrics.semen.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-500">kg</span></div>
                        <p className="text-xs text-muted-foreground mt-1">~{(metrics.semen / 50).toFixed(0)} Sak (50kg)</p>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Penggunaan Pasir</CardTitle>
                        <Layers className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">{metrics.pasir.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-500">kg</span></div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-l-4 border-l-stone-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Batu (Split/Koral)</CardTitle>
                        <Weight className="h-4 w-4 text-stone-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">{metrics.batu.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-500">kg</span></div>
                        <p className="text-xs text-muted-foreground mt-1">Akumulasi Batu 0.5, 1-2, 2-3</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Section */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardHeader className="border-b pb-4">
                    <CardTitle>Grafik Penggunaan Material (14 Hari Transaksi Terakhir)</CardTitle>
                    <CardDescription>Tren harian penggunaan Semen, Pasir, dan Batu Split</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[350px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                    <Tooltip
                                        cursor={{ fill: '#F1F5F9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="semen" name="Semen (kg)" fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="pasir" name="Pasir (kg)" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="batu" name="Batu Total (kg)" fill="#78716C" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                Tidak ada data transaksi yang Confirmed
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <SimpleDataTable<any>
                    data={tableData}
                    searchKeys={["customerName", "vehicleCode", "driverName", "mutuName"]}
                    searchPlaceholder="Cari customer, kendaraan, sopir, atau mutu..."
                >
                    {(items, sortConfig, toggleSort) => (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead>
                                        <SortableHeader<any> label="Tanggal" sortKey="rawDate" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    {userRole === "SuperAdminBP" && (
                                        <TableHead>
                                            <SortableHeader<any> label="Cabang" sortKey="locationName" sortConfig={sortConfig} onSort={toggleSort} />
                                        </TableHead>
                                    )}
                                    <TableHead>
                                        <SortableHeader<any> label="Kendaraan" sortKey="vehicleCode" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Customer" sortKey="customerName" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Mutu" sortKey="mutuName" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Vol (m³)" sortKey="volume" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Semen (Kg)" sortKey="semen" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Pasir (Kg)" sortKey="pasir" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader<any> label="Batu (Kg)" sortKey="batuTotal" sortConfig={sortConfig} onSort={toggleSort} />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={userRole === "SuperAdminBP" ? 9 : 8} className="h-24 text-center text-muted-foreground">
                                            Tidak ada data penggunaan material.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {items.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="text-xs font-medium">{row.date}</TableCell>
                                        {userRole === "SuperAdminBP" && (
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold text-blue-600 border-blue-200">
                                                    {row.locationName}
                                                </Badge>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-slate-900">{row.vehicleCode}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{row.driverName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-slate-700 max-w-[200px] truncate">{row.customerName}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px] font-bold">{row.mutuName}</Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-sm text-blue-600">{row.volume.toFixed(1)}</TableCell>
                                        <TableCell className="text-sm font-semibold">{row.semen.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</TableCell>
                                        <TableCell className="text-sm">{row.pasir.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</TableCell>
                                        <TableCell className="text-sm">{row.batuTotal.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </SimpleDataTable>
            </Card>
        </div>
    )
}
