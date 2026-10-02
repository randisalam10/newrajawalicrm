import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock } from "lucide-react"
import { fmt } from "../../utils/billing-helpers"

interface AgingAndOverdueAnalysisProps {
    overdueInvoices: any[]
    totalOverdueAmount: number
    totalOutstanding: number
    aging: any
    statusCounts: any
    allInvoices: any[]
    onNavigateTab: (tab: string, filter?: any) => void
}

export function AgingAndOverdueAnalysis({
    overdueInvoices,
    totalOverdueAmount,
    totalOutstanding,
    aging,
    statusCounts,
    allInvoices,
    onNavigateTab,
}: AgingAndOverdueAnalysisProps) {
    return (
        <div className="space-y-4">
            {/* ─── Overdue Alert Bar (If any overdue invoices exist) ──────────── */}
            {overdueInvoices.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-rose-600 text-white rounded-md shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                <span>Perhatian: Ada {overdueInvoices.length} Invoice Melewati Jatuh Tempo!</span>
                                <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                                    Total: {fmt(totalOverdueAmount)}
                                </Badge>
                            </div>
                            <div className="text-[11px] text-rose-700 mt-0.5">
                                Segera lakukan tindak lanjut penagihan pada customer terkait untuk menjaga arus kas perusahaan.
                            </div>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateTab("invoices", { status: "ISSUED" })}
                        className="h-7 text-xs bg-white text-rose-700 border-rose-300 hover:bg-rose-100/50 self-start sm:self-auto cursor-pointer"
                    >
                        Tampilkan Invoice Jatuh Tempo
                    </Button>
                </div>
            )}

            {/* ─── Corporate Financial Analysis: Aging & Status Distribution ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                {/* 1. Analisis Umur Piutang (A/R Aging) */}
                <Card className="border-slate-200/80 shadow-2xs lg:col-span-2">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <div>
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Analisis Umur Piutang Usaha (A/R Aging)
                                </CardTitle>
                                <span className="text-[11px] text-slate-500">
                                    Distribusi nilai tagihan belum terbayar berdasarkan jatuh tempo
                                </span>
                            </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700">
                            Total: {fmt(totalOutstanding)}
                        </span>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {/* Bucket 1: Belum Jatuh Tempo */}
                            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60">
                                <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                                    Lancar / Belum Tempo
                                </span>
                                <span className="text-sm font-bold text-slate-900 font-mono block mt-1">
                                    {fmt(aging.current)}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {totalOutstanding > 0 ? ((aging.current / totalOutstanding) * 100).toFixed(0) : 0}% dari total
                                </span>
                            </div>

                            {/* Bucket 2: 1 - 30 Hari */}
                            <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/40">
                                <span className="text-[10px] font-bold text-blue-700 block uppercase">
                                    1 – 30 Hari
                                </span>
                                <span className="text-sm font-bold text-slate-900 font-mono block mt-1">
                                    {fmt(aging.age1to30)}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {totalOutstanding > 0 ? ((aging.age1to30 / totalOutstanding) * 100).toFixed(0) : 0}% dari total
                                </span>
                            </div>

                            {/* Bucket 3: 31 - 60 Hari */}
                            <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40">
                                <span className="text-[10px] font-bold text-amber-700 block uppercase">
                                    31 – 60 Hari
                                </span>
                                <span className="text-sm font-bold text-slate-900 font-mono block mt-1">
                                    {fmt(aging.age31to60)}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {totalOutstanding > 0 ? ((aging.age31to60 / totalOutstanding) * 100).toFixed(0) : 0}% dari total
                                </span>
                            </div>

                            {/* Bucket 4: > 60 Hari */}
                            <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/40">
                                <span className="text-[10px] font-bold text-rose-700 block uppercase">
                                    &gt; 60 Hari (Kritis)
                                </span>
                                <span className="text-sm font-bold text-rose-700 font-mono block mt-1">
                                    {fmt(aging.ageOver60)}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {totalOutstanding > 0 ? ((aging.ageOver60 / totalOutstanding) * 100).toFixed(0) : 0}% dari total
                                </span>
                            </div>
                        </div>

                        {/* Multi-segment visual bar */}
                        <div className="space-y-1">
                            <div className="w-full bg-slate-100 rounded-full h-2.5 flex overflow-hidden">
                                {totalOutstanding > 0 && (
                                    <>
                                        <div style={{ width: `${(aging.current / totalOutstanding) * 100}%` }} className="bg-emerald-500 h-full" title={`Lancar: ${fmt(aging.current)}`} />
                                        <div style={{ width: `${(aging.age1to30 / totalOutstanding) * 100}%` }} className="bg-blue-500 h-full" title={`1-30 Hari: ${fmt(aging.age1to30)}`} />
                                        <div style={{ width: `${(aging.age31to60 / totalOutstanding) * 100}%` }} className="bg-amber-500 h-full" title={`31-60 Hari: ${fmt(aging.age31to60)}`} />
                                        <div style={{ width: `${(aging.ageOver60 / totalOutstanding) * 100}%` }} className="bg-rose-500 h-full" title={`>60 Hari: ${fmt(aging.ageOver60)}`} />
                                    </>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Lancar</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> 1–30 Hari</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 31–60 Hari</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> &gt;60 Hari</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Distribusi Status Invoice */}
                <Card className="border-slate-200/80 shadow-2xs">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
                            <span>Status Faktur Terbit</span>
                            <span className="font-mono text-slate-500 text-[11px] font-normal">{allInvoices.length} Total</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                <span className="font-medium text-slate-700">Lunas (Paid)</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-slate-900 font-mono">{statusCounts.paid}</span>
                                <span className="text-[10px] text-slate-400 ml-1">Faktur</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                <span className="font-medium text-slate-700">Sebagian (Partial)</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-slate-900 font-mono">{statusCounts.partial}</span>
                                <span className="text-[10px] text-slate-400 ml-1">Faktur</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="font-medium text-slate-700">Terbit (Issued)</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-slate-900 font-mono">{statusCounts.issued}</span>
                                <span className="text-[10px] text-slate-400 ml-1">Faktur</span>
                            </div>
                        </div>

                        {statusCounts.draft > 0 && (
                            <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                    <span className="font-medium text-slate-700">Draft</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-slate-900 font-mono">{statusCounts.draft}</span>
                                    <span className="text-[10px] text-slate-400 ml-1">Faktur</span>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onNavigateTab("invoices")}
                                className="h-6 text-[11px] text-blue-600 hover:text-blue-700 p-0 font-medium cursor-pointer"
                            >
                                Buka Daftar Semua Invoice →
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
