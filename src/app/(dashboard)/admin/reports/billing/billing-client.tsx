"use client"

import { useState, useEffect, useMemo } from "react"
import { getBillingReport } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Download, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { SimpleDataTable, SortableHeader } from "@/components/ui/simple-data-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function BillingReportClient({ locations, customers, userRole, userLocationId }: any) {
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Filters
    const [selectedLocation, setSelectedLocation] = useState<string>(userRole !== 'SuperAdminBP' ? userLocationId : "all")
    const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
    const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
        to: new Date() // Today
    })

    const fetchReport = async () => {
        setIsLoading(true)
        try {
            const data = await getBillingReport({
                locationId: selectedLocation === "all" ? undefined : selectedLocation,
                customerId: selectedCustomer === "all" ? undefined : selectedCustomer,
                startDate: date.from ? date.from.toISOString() : undefined,
                endDate: date.to ? date.to.toISOString() : undefined
            })
            setTransactions(data)
        } catch (error) {
            console.error("Error fetching report:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-fetch on mount
    useEffect(() => {
        fetchReport()
    }, [])

    // Aggregate Data Calculation
    const aggregatedData = useMemo(() => {
        if (!transactions.length) return { totalVolume: 0, customersMap: new Map() }

        let totalVol = 0
        const cMap = new Map<string, {
            name: string,
            projectName: string,
            volume: number,
            txCount: number,
            records: any[]
        }>()

        transactions.forEach(tx => {
            totalVol += tx.volume_cubic

            const cId = tx.customerId
            if (!cMap.has(cId)) {
                cMap.set(cId, {
                    name: tx.customer?.customer_name || "Unknown",
                    projectName: tx.customer?.project_name || "-",
                    volume: 0,
                    txCount: 0,
                    records: []
                })
            }

            const cData = cMap.get(cId)!
            cData.volume += tx.volume_cubic
            cData.txCount += 1
            // Pre-format some fields for easier searching
            cData.records.push({
                ...tx,
                sj_number: `SJ/${tx.id.split('-')[0].toUpperCase()}`
            })
        })

        return { totalVolume: totalVol, customersMap: cMap }
    }, [transactions])

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-4 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" /> Filter Laporan
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {userRole === 'SuperAdminBP' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cabang</label>
                                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Cabang</SelectItem>
                                        {locations.map((loc: any) => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Customer / Proyek</label>
                            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Customer</SelectItem>
                                    {customers.map((cust: any) => (
                                        <SelectItem key={cust.id} value={cust.id}>
                                            {cust.customer_name} - {cust.project_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Dari Tanggal</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !date.from && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date.from ? format(date.from, "PPP", { locale: idLocale }) : <span>Pilih Tanggal</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date.from}
                                        onSelect={(d) => setDate({ ...date, from: d })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sampai Tanggal</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !date.to && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date.to ? format(date.to, "PPP", { locale: idLocale }) : <span>Pilih Tanggal</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date.to}
                                        onSelect={(d) => setDate({ ...date, to: d })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2 md:col-span-4 flex justify-end mt-4">
                            <Button onClick={fetchReport} className="w-full sm:w-auto" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Tampilkan Laporan"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Blocks & Data Tables */}
            <div className="grid gap-6">
                {Array.from(aggregatedData.customersMap.values()).map((cData, idx) => (
                    <Card key={idx} className="overflow-hidden shadow-sm">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg text-primary">{cData.name}</CardTitle>
                                    <CardDescription className="text-sm font-medium mt-1">Proyek: {cData.projectName}</CardDescription>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm text-slate-500 block">Total Pengiriman</span>
                                    <span className="text-2xl font-black text-slate-800">{cData.volume.toFixed(2)} M³</span>
                                </div>
                            </div>
                        </CardHeader>
                        <div className="p-0 overflow-x-auto">
                            <SimpleDataTable<any>
                                data={cData.records}
                                searchKeys={["sj_number", "concreteQuality.name"]}
                                searchPlaceholder="Cari no. SJ atau mutu..."
                                showSearch={cData.records.length > 5}
                            >
                                {(items, sortConfig, toggleSort) => (
                                    <Table>
                                        <TableHeader className="bg-slate-100/50">
                                            <TableRow>
                                                <TableHead>
                                                    <SortableHeader<any> label="No. SJ" sortKey="sj_number" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="Tanggal / Waktu" sortKey="date" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="Mutu Beton" sortKey="concreteQuality.name" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead>
                                                    <SortableHeader<any> label="Kendaraan" sortKey="vehicle.plate_number" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    <SortableHeader<any> label="Volume (M³)" sortKey="volume_cubic" sortConfig={sortConfig} onSort={toggleSort} />
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y">
                                            {items.map((tx) => (
                                                <TableRow key={tx.id} className="hover:bg-slate-50">
                                                    <TableCell className="px-4 py-3 font-medium text-slate-900">{tx.sj_number}</TableCell>
                                                    <TableCell className="px-4 py-3">{format(new Date(tx.date), "dd MMM yyyy HH:mm", { locale: idLocale })}</TableCell>
                                                    <TableCell className="px-4 py-3">{tx.concreteQuality?.name}</TableCell>
                                                    <TableCell className="px-4 py-3">{tx.vehicle?.plate_number}</TableCell>
                                                    <TableCell className="px-4 py-3 text-right font-bold">{tx.volume_cubic}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </SimpleDataTable>
                        </div>
                    </Card>
                ))}

                {aggregatedData.customersMap.size === 0 && !isLoading && (
                    <div className="text-center p-12 border-2 border-dashed rounded-xl text-slate-500">
                        Tidak ada data transaksi yang ditemukan pada filter ini.
                    </div>
                )}
            </div>
        </div>
    )
}
