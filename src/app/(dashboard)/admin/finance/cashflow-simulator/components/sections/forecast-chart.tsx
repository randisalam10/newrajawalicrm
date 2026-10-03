"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RollingForecastRow, SimulatorScenarioParams } from "../../types"
import { formatRupiah } from "../../utils/cashflow-math"
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine
} from "recharts"
import { LineChart as ChartIcon } from "lucide-react"

interface ForecastChartProps {
    forecast: RollingForecastRow[]
    params: SimulatorScenarioParams
}

export function ForecastChart({ forecast, params }: ForecastChartProps) {
    const chartData = forecast.map(row => ({
        month: row.monthLabel,
        endingCash: row.endingCash,
        netCashFlow: row.netCashFlow,
        cashInflow: row.cashInflow,
        cashOutflow: row.cashOutflow,
        minBuffer: params.minCashBuffer,
        status: row.bufferStatus
    }))

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-white/95 p-3 rounded-lg shadow-md border border-slate-200 text-xs space-y-1.5 backdrop-blur-xs">
                    <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 flex justify-between gap-4">
                        <span>{label}</span>
                        <Badge
                            className={`text-[10px] ${
                                data.status === "HEALTHY"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : data.status === "BUFFER_DEFICIT"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                            }`}
                        >
                            {data.status === "HEALTHY" ? "Aman" : data.status === "BUFFER_DEFICIT" ? "Di Bawah Buffer" : "Defisit Kas"}
                        </Badge>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4 text-slate-600">
                            <span>Saldo Kas Akhir:</span>
                            <span className="font-bold text-slate-900">{formatRupiah(data.endingCash)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-600">
                            <span>Kas Masuk (Inflow):</span>
                            <span className="font-semibold text-emerald-700">{formatRupiah(data.cashInflow)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-600">
                            <span>Kas Keluar (Outflow):</span>
                            <span className="font-semibold text-rose-700">{formatRupiah(data.cashOutflow)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-600 pt-1 border-t border-slate-100">
                            <span>Net Cash Flow:</span>
                            <span className={`font-bold ${data.netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                {formatRupiah(data.netCashFlow)}
                            </span>
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="border-slate-200 bg-white shadow-xs w-full">
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <ChartIcon className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-bold text-slate-800">
                        Proyeksi Arus Kas 12 Bulan (Ending Cash vs Buffer Aman)
                    </CardTitle>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-block w-3 h-0.5 bg-blue-600 mr-1"></span> Saldo Kas Akhir
                    <span className="inline-block w-3 h-0.5 bg-rose-500 border-dashed border-t-2 mr-1 ml-2"></span> Min Buffer
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={{ stroke: "#cbd5e1" }}
                                tick={{ fontSize: 11, fill: "#64748b" }}
                            />
                            <YAxis
                                tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)} Jt`}
                                tickLine={false}
                                axisLine={{ stroke: "#cbd5e1" }}
                                tick={{ fontSize: 10, fill: "#64748b" }}
                                width={75}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                                iconType="circle"
                            />
                            <ReferenceLine
                                y={params.minCashBuffer}
                                stroke="#f43f5e"
                                strokeDasharray="4 4"
                                label={{ value: `Min Buffer (${formatRupiah(params.minCashBuffer)})`, position: "insideTopRight", fill: "#e11d48", fontSize: 10 }}
                            />
                            <ReferenceLine y={0} stroke="#94a3b8" />
                            <Bar
                                dataKey="netCashFlow"
                                name="Net Cash Flow (Bulanan)"
                                fill="#93c5fd"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={32}
                            />
                            <Line
                                type="monotone"
                                dataKey="endingCash"
                                name="Saldo Kas Akhir (Ending Cash)"
                                stroke="#2563eb"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "#2563eb", strokeWidth: 1, stroke: "#fff" }}
                                activeDot={{ r: 6 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
