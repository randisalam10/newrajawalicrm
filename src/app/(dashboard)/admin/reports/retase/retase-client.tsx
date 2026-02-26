"use client"

import { useState, useEffect, useMemo } from "react"
import { getRetaseReportByMonth } from "./actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Loader2, Search, Printer, User, TrendingUp, Truck, ChevronRight, Building2 } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

type DriverSummary = {
    driverId: string
    name: string
    vehicleCode: string
    totalTrip: number
    totalVolume: number
    totalKm: number
    totalIncome: number
    records: any[]
}

export function RetaseReportClient({ locations, availableYears, userRole, userLocationId }: any) {
    const now = new Date()
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)
    const [selectedLocation, setSelectedLocation] = useState<string>(
        userRole !== 'SuperAdminBP' ? userLocationId : "all"
    )
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasFetched, setHasFetched] = useState(false)
    const [viewingDriver, setViewingDriver] = useState<DriverSummary | null>(null)

    // Aggregate per-driver
    const driverSummaries: DriverSummary[] = useMemo(() => {
        const map = new Map<string, DriverSummary>()
        transactions.forEach(tx => {
            if (!tx.retase) return
            if (!map.has(tx.driverId)) {
                map.set(tx.driverId, {
                    driverId: tx.driverId,
                    name: tx.driver?.name || "-",
                    vehicleCode: tx.vehicle?.code || "-",
                    totalTrip: 0,
                    totalVolume: 0,
                    totalKm: 0,
                    totalIncome: 0,
                    records: []
                })
            }
            const d = map.get(tx.driverId)!
            d.totalTrip++
            d.totalVolume += tx.volume_cubic
            d.totalKm += tx.retase.calculated_distance
            d.totalIncome += tx.retase.income_amount
            d.records.push(tx)
        })
        return Array.from(map.values()).sort((a, b) => b.totalIncome - a.totalIncome)
    }, [transactions])

    const grandTotal = useMemo(() => ({
        trip: driverSummaries.reduce((s, d) => s + d.totalTrip, 0),
        volume: driverSummaries.reduce((s, d) => s + d.totalVolume, 0),
        income: driverSummaries.reduce((s, d) => s + d.totalIncome, 0),
    }), [driverSummaries])

    const fetchReport = async () => {
        setIsLoading(true)
        setHasFetched(false)
        try {
            const data = await getRetaseReportByMonth({
                year: selectedYear,
                month: selectedMonth,
                locationId: selectedLocation === "all" ? undefined : selectedLocation,
            })
            setTransactions(data)
        } finally {
            setIsLoading(false)
            setHasFetched(true)
        }
    }

    const handlePrintDriver = (driver: DriverSummary) => {
        const printContent = buildPrintContent(driver, selectedYear, selectedMonth)
        const win = window.open('', '_blank')
        if (win) {
            win.document.write(printContent)
            win.document.close()
            win.print()
        }
    }

    return (
        <div className="space-y-6">
            {/* Hero Filter Card */}
            <Card className="border-none shadow-md bg-gradient-to-r from-slate-800 to-slate-700 text-white overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Rekap Gaji / Ritase Supir</h2>
                            <p className="text-slate-300 text-sm">Hanya transaksi yang sudah dikonfirmasi admin</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                        {/* Tahun */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tahun</label>
                            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/30 hover:bg-white/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(availableYears || [now.getFullYear()]).map((y: number) => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bulan */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Bulan</label>
                            <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/30 hover:bg-white/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTH_NAMES.map((m, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cabang (SuperAdmin only) */}
                        {userRole === 'SuperAdminBP' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Cabang</label>
                                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/30 hover:bg-white/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Cabang</SelectItem>
                                        {locations?.map((loc: any) => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Tombol */}
                        <div className={userRole !== 'SuperAdminBP' ? "col-span-2 md:col-span-2" : ""}>
                            <Button
                                onClick={fetchReport}
                                disabled={isLoading}
                                className="w-full bg-white text-slate-800 hover:bg-slate-100 font-bold gap-2"
                            >
                                {isLoading
                                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Memuat...</>
                                    : <><Search className="h-4 w-4" /> Tampilkan Laporan</>
                                }
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {isLoading && (
                <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">Memuat data retase...</span>
                </div>
            )}

            {!isLoading && hasFetched && (
                <>
                    {/* Summary Banner */}
                    {driverSummaries.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            <Card className="border-l-4 border-l-blue-500 shadow-sm bg-white">
                                <CardContent className="p-4">
                                    <div className="text-xs text-slate-500 mb-1">Total Pengiriman</div>
                                    <div className="text-2xl font-bold text-slate-800">{grandTotal.trip} <span className="text-sm font-normal">trip</span></div>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-violet-500 shadow-sm bg-white">
                                <CardContent className="p-4">
                                    <div className="text-xs text-slate-500 mb-1">Total Volume</div>
                                    <div className="text-2xl font-bold text-slate-800">{grandTotal.volume.toFixed(1)} <span className="text-sm font-normal">m³</span></div>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-white">
                                <CardContent className="p-4">
                                    <div className="text-xs text-slate-500 mb-1">Total Komisi Supir</div>
                                    <div className="text-xl font-bold text-emerald-700">Rp {grandTotal.income.toLocaleString('id-ID')}</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Driver List */}
                    {driverSummaries.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-xl text-slate-400">
                            <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Tidak ada data retase yang sudah dikonfirmasi</p>
                            <p className="text-sm mt-1">untuk {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</p>
                        </div>
                    ) : (
                        <Card className="border-none shadow-md overflow-hidden bg-white">
                            <CardHeader className="border-b pb-4 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">Daftar Sopir — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</CardTitle>
                                        <CardDescription>{driverSummaries.length} sopir aktif dengan retase terkonfirmasi</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">{driverSummaries.length} Supir</Badge>
                                </div>
                            </CardHeader>
                            <div className="divide-y divide-slate-100">
                                {driverSummaries.map((driver, i) => (
                                    <div
                                        key={driver.driverId}
                                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                                        onClick={() => setViewingDriver(driver)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Rank */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-300'}`}>
                                                {i + 1}
                                            </div>
                                            {/* Info */}
                                            <div>
                                                <div className="font-semibold text-slate-800 flex items-center gap-2">
                                                    {driver.name}
                                                    <Badge variant="outline" className="text-[10px] text-slate-500">{driver.vehicleCode}</Badge>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                                                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {driver.totalTrip} trip</span>
                                                    <span>{driver.totalVolume.toFixed(1)} m³</span>
                                                    <span>{driver.totalKm.toFixed(0)} km total</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="font-bold text-emerald-700 text-base">
                                                    Rp {driver.totalIncome.toLocaleString('id-ID')}
                                                </div>
                                                <div className="text-[10px] text-slate-400">Total komisi</div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!viewingDriver} onOpenChange={o => { if (!o) setViewingDriver(null) }}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    {viewingDriver && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center justify-between pr-6">
                                    <div>
                                        <span className="text-lg">{viewingDriver.name}</span>
                                        <span className="text-sm text-slate-400 font-normal ml-2">— {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 flex-shrink-0"
                                        onClick={() => handlePrintDriver(viewingDriver)}
                                    >
                                        <Printer className="h-4 w-4" /> Cetak / Print
                                    </Button>
                                </DialogTitle>
                            </DialogHeader>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-4 gap-3 my-2">
                                {[
                                    { label: "Total Trip", value: `${viewingDriver.totalTrip}×` },
                                    { label: "Total Volume", value: `${viewingDriver.totalVolume.toFixed(1)} m³` },
                                    { label: "Total Jarak", value: `${viewingDriver.totalKm.toFixed(0)} km` },
                                    { label: "Total Komisi", value: `Rp ${viewingDriver.totalIncome.toLocaleString('id-ID')}`, highlight: true },
                                ].map(s => (
                                    <div key={s.label} className={`p-3 rounded-lg text-center ${s.highlight ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50'}`}>
                                        <div className={`font-bold text-base ${s.highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{s.value}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Detail Table */}
                            <div className="overflow-auto flex-1 border rounded-lg">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-xs">Tgl / Waktu</TableHead>
                                            <TableHead className="text-xs">Customer / Proyek</TableHead>
                                            <TableHead className="text-xs">Mutu</TableHead>
                                            <TableHead className="text-xs text-right">Vol (m³)</TableHead>
                                            <TableHead className="text-xs text-right">Jarak (KM)</TableHead>
                                            <TableHead className="text-xs text-right">Rate</TableHead>
                                            <TableHead className="text-xs text-right text-emerald-700">Komisi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {viewingDriver.records.map((tx: any, idx: number) => (
                                            <TableRow key={tx.id} className="hover:bg-slate-50 text-xs">
                                                <TableCell className="py-2">
                                                    <div>{format(new Date(tx.date), "dd MMM", { locale: idLocale })}</div>
                                                    <div className="text-slate-400">{format(new Date(tx.date), "HH:mm")}</div>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <div className="font-medium text-slate-800">{tx.customer?.customer_name}</div>
                                                    <div className="text-slate-400 text-[10px]">{tx.customer?.project_name}</div>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Badge variant="secondary" className="text-[10px] font-bold">{tx.concreteQuality?.name || "-"}</Badge>
                                                </TableCell>
                                                <TableCell className="py-2 text-right font-semibold">{tx.volume_cubic}</TableCell>
                                                <TableCell className="py-2 text-right">{tx.retase?.calculated_distance}</TableCell>
                                                <TableCell className="py-2 text-right text-slate-500">
                                                    {tx.retase?.price_per_cubic_km?.toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="py-2 text-right font-bold text-emerald-700">
                                                    {tx.retase?.income_amount?.toLocaleString('id-ID')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Footer Total */}
                            <div className="flex justify-between items-center pt-2 border-t text-sm">
                                <span className="text-slate-500">{viewingDriver.totalTrip} pengiriman terkonfirmasi</span>
                                <div className="font-black text-emerald-700 text-lg">
                                    Total: Rp {viewingDriver.totalIncome.toLocaleString('id-ID')}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ── Print Helper ──────────────────────────────────────────────────────────────
function buildPrintContent(driver: DriverSummary, year: number, month: number): string {
    const monthName = MONTH_NAMES[month - 1]
    const rows = driver.records.map((tx: any, i: number) => `
        <tr>
            <td>${i + 1}</td>
            <td>${new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
            <td>${tx.customer?.customer_name || '-'}</td>
            <td>${tx.customer?.project_name || '-'}</td>
            <td>${tx.concreteQuality?.name || '-'}</td>
            <td style="text-align:right">${tx.volume_cubic}</td>
            <td style="text-align:right">${tx.retase?.calculated_distance || 0}</td>
            <td style="text-align:right">Rp ${(tx.retase?.income_amount || 0).toLocaleString('id-ID')}</td>
        </tr>
    `).join('')

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Rekap Retase — ${driver.name} — ${monthName} ${year}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; color: #111; }
            h1 { font-size: 16px; font-weight: bold; text-transform: uppercase; }
            h2 { font-size: 13px; margin-top: 2px; color: #444; font-weight: normal; }
            .header { border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
            .summary-card { border: 1px solid #ddd; padding: 8px 12px; border-radius: 4px; }
            .summary-card .val { font-size: 15px; font-weight: bold; }
            .summary-card .lbl { font-size: 9px; color: #666; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f1f5f9; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; border: 1px solid #ddd; }
            td { padding: 5px 8px; border: 1px solid #ddd; }
            tr:nth-child(even) td { background: #fafafa; }
            .total-row td { font-weight: bold; background: #f1f5f9; }
            .footer { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .sign { text-align: center; }
            .sign-line { border-bottom: 1px solid #111; margin: 50px 20px 4px; }
            @media print { @page { margin: 1cm; } }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h1>PT. New Rajawali</h1>
                <h2>Rekap Gaji Retase Supir — ${monthName} ${year}</h2>
            </div>
            <div style="text-align:right">
                <div style="font-size:14px;font-weight:bold;">SLIP RETASE</div>
                <div style="color:#555;">Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
        </div>

        <div style="margin-bottom:14px">
            <strong>Nama Sopir:</strong> ${driver.name} &nbsp;&nbsp;&nbsp;
            <strong>No. Kendaraan:</strong> ${driver.vehicleCode}
        </div>

        <div class="summary">
            <div class="summary-card"><div class="val">${driver.totalTrip}×</div><div class="lbl">Total Trip</div></div>
            <div class="summary-card"><div class="val">${driver.totalVolume.toFixed(1)} m³</div><div class="lbl">Total Volume</div></div>
            <div class="summary-card"><div class="val">${driver.totalKm.toFixed(0)} km</div><div class="lbl">Total Jarak</div></div>
            <div class="summary-card" style="border-color:#10b981;"><div class="val" style="color:#059669;">Rp ${driver.totalIncome.toLocaleString('id-ID')}</div><div class="lbl">Total Komisi</div></div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th><th>Tanggal</th><th>Customer</th><th>Proyek</th>
                    <th>Mutu</th><th style="text-align:right">Vol (m³)</th>
                    <th style="text-align:right">Jarak (KM)</th>
                    <th style="text-align:right">Komisi</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
                <tr class="total-row">
                    <td colspan="5" style="text-align:right">TOTAL</td>
                    <td style="text-align:right">${driver.totalVolume.toFixed(1)}</td>
                    <td style="text-align:right">${driver.totalKm.toFixed(0)}</td>
                    <td style="text-align:right">Rp ${driver.totalIncome.toLocaleString('id-ID')}</td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            <div class="sign">
                <p>Mengetahui,</p>
                <div class="sign-line"></div>
                <p>( Admin / Manager )</p>
            </div>
            <div class="sign">
                <p>Penerima,</p>
                <div class="sign-line"></div>
                <p>( ${driver.name} )</p>
            </div>
        </div>
    </body>
    </html>`
}
