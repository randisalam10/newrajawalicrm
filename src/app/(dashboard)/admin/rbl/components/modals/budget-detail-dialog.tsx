"use client"

import React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Printer, Fuel, Gauge, Pencil, History, ArrowRight } from "lucide-react"
import { fmt, fmtDate, MONTH_NAMES } from "../../utils/rbl-helpers"

interface BudgetDetailDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    budget: any
    isLoading: boolean
    onPreviewImage: (image: { url: string; name: string }) => void
    onEditBudget?: (budget: any) => void
    canEdit?: boolean
}

export function BudgetDetailDialog({
    isOpen,
    onOpenChange,
    budget,
    isLoading,
    onPreviewImage,
    onEditBudget,
    canEdit = true,
}: BudgetDetailDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[850px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b bg-slate-50/70 shrink-0">
                    <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <DialogTitle className="text-base font-bold font-mono text-slate-900">
                                    {budget?.code || "Detail Periode RBL"}
                                </DialogTitle>
                                {budget && (
                                    <>
                                        <Badge className={budget.status === "OPEN" ? "bg-emerald-600 text-white text-xs" : "bg-slate-700 text-white text-xs"}>
                                            {budget.status === "OPEN" ? "OPEN (Aktif)" : "CLOSED (Tutup Buku)"}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs font-semibold bg-white">
                                            🏢 {budget.location?.name}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs bg-white">
                                            📅 {MONTH_NAMES[budget.periodMonth - 1]} {budget.periodYear}
                                        </Badge>
                                    </>
                                )}
                            </div>
                            {budget && (
                                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                                    {budget.status === "OPEN" && canEdit && onEditBudget && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onEditBudget(budget)}
                                            className="h-7 text-xs gap-1.5 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 border-slate-200 cursor-pointer shadow-2xs"
                                        >
                                            <Pencil className="h-3.5 w-3.5 text-blue-600" />
                                            Edit Budget
                                        </Button>
                                    )}
                                    <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1.5 bg-white shadow-2xs">
                                        <Link href={`/admin/rbl/print/${budget.id}`} target="_blank">
                                            <Printer className="h-3.5 w-3.5" />
                                            Cetak PDF
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                        <DialogDescription className="text-xs text-slate-500">
                            {isLoading ? (
                                <span className="inline-flex items-center gap-1.5 text-blue-600 font-medium">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Sedang memuat data detail transaksi dan berkas nota...
                                </span>
                            ) : budget ? (
                                <>
                                    Diterima {fmtDate(budget.receivedDate)} • Diinput oleh {budget.createdBy?.employee?.name || budget.createdBy?.username || "-"}
                                    {budget.status === "CLOSED" && budget.closedAt && (
                                        <span> • Ditutup {fmtDate(budget.closedAt)} oleh {budget.closedBy?.employee?.name || budget.closedBy?.username || "-"}</span>
                                    )}
                                </>
                            ) : (
                                "Detail transaksi pengeluaran dan lampiran foto nota RBL"
                            )}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-slate-500 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <p className="font-medium text-slate-700">Sedang memuat data detail RBL...</p>
                        <p className="text-[11px] text-slate-400">Menghubungkan ke database untuk mengambil rincian mutasi dan lampiran.</p>
                    </div>
                ) : budget ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Timeline Periode Waktu */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-100/70 p-3 rounded-lg border">
                            <div>
                                <span className="text-[11px] text-slate-500 block">1. Tanggal Buka Periode RBL:</span>
                                <span className="font-semibold text-slate-800 font-mono">
                                    {fmtDate(budget.createdAt)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 block">2. Tanggal Ambil / Terima Budget:</span>
                                <span className="font-semibold text-slate-800 font-mono">
                                    {fmtDate(budget.receivedDate)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 block">3. Tanggal Closed / Tutup Buku:</span>
                                <span className="font-semibold font-mono text-slate-800">
                                    {budget.closedAt ? fmtDate(budget.closedAt) : "Masih Berjalan (OPEN)"}
                                </span>
                            </div>
                        </div>

                        {/* Summary strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                            <div className="p-2.5 rounded-lg border bg-slate-50/50">
                                <span className="text-[11px] text-slate-500 font-medium uppercase">Budget Diterima HO</span>
                                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                                    {fmt(budget.amount)}
                                </div>
                            </div>
                            <div className="p-2.5 rounded-lg border bg-blue-50/30">
                                <span className="text-[11px] text-slate-500 font-medium uppercase">Total Pengeluaran</span>
                                <div className="text-base font-bold font-mono text-blue-700 mt-0.5">
                                    {fmt(budget.totalExpense)}
                                </div>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${
                                budget.remainingBalance > 0
                                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                                    : budget.remainingBalance < 0
                                    ? "bg-rose-50 text-rose-900 border-rose-200"
                                    : "bg-slate-50 text-slate-900"
                            }`}>
                                <span className="text-[11px] font-medium uppercase text-slate-600">
                                    {budget.remainingBalance >= 0 ? "Sisa Pengembalian HO" : "Defisit / Minus (Klaim HO)"}
                                </span>
                                <div className="text-base font-bold font-mono mt-0.5">
                                    {budget.remainingBalance >= 0 ? "+" : ""}{fmt(budget.remainingBalance)}
                                </div>
                            </div>
                        </div>

                        {budget.closeNotes && (
                            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900">
                                <span className="font-bold">Catatan Penutupan Buku: </span>
                                <span>{budget.closeNotes}</span>
                            </div>
                        )}

                        {/* Tabs in Modal: Expenses vs Attachments vs History */}
                        <Tabs defaultValue="expenses" className="space-y-3">
                            <TabsList className="bg-slate-100 p-1 h-8 rounded-lg">
                                <TabsTrigger value="expenses" className="text-xs h-6 px-3">
                                    Daftar Pengeluaran ({budget.expenses?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="attachments" className="text-xs h-6 px-3">
                                    Bukti Foto Nota ({budget.attachments?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="history" className="text-xs h-6 px-3">
                                    Riwayat Revisi ({budget.auditLogs?.length || 0})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="expenses">
                                <div className="border rounded-lg overflow-hidden max-h-[350px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                            <TableRow className="text-[11px]">
                                                <TableHead className="w-10 text-center">No</TableHead>
                                                <TableHead className="w-24">Tanggal</TableHead>
                                                <TableHead>Nama Item / Uraian</TableHead>
                                                <TableHead className="w-32">Kategori</TableHead>
                                                <TableHead className="w-20 text-center">Qty</TableHead>
                                                <TableHead className="w-28 text-right">Harga Satuan</TableHead>
                                                <TableHead className="w-28 text-right">Total</TableHead>
                                                <TableHead className="w-20">No. Bon</TableHead>
                                                <TableHead className="min-w-[120px]">Catatan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {budget.expenses?.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center text-xs text-slate-400 py-6">
                                                        Tidak ada data transaksi pengeluaran.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                budget.expenses?.map((exp: any, i: number) => (
                                                    <TableRow key={exp.id} className="text-xs hover:bg-slate-50">
                                                        <TableCell className="text-center font-mono text-slate-400">{i + 1}</TableCell>
                                                        <TableCell className="font-mono text-slate-600 whitespace-nowrap">{format(new Date(exp.date), "dd/MM/yyyy")}</TableCell>
                                                        <TableCell className="font-medium text-slate-900">
                                                            <div>{exp.itemDescription}</div>
                                                            {exp.vehicle && (
                                                                <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-800 border-amber-200 font-medium">
                                                                        <Fuel className="h-2.5 w-2.5 mr-1 text-amber-600" />
                                                                        {exp.vehicle.code} ({exp.vehicle.plate_number || exp.vehicle.plateNumber})
                                                                    </Badge>
                                                                    {exp.kmMeter && (
                                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 text-slate-700 border-slate-200 font-mono">
                                                                            <Gauge className="h-2.5 w-2.5 mr-1 text-slate-500" />
                                                                            {Number(exp.kmMeter).toLocaleString("id-ID")} KM
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell><span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">{exp.category}</span></TableCell>
                                                        <TableCell className="text-center font-mono">{exp.quantity} {exp.unit}</TableCell>
                                                        <TableCell className="text-right font-mono text-slate-600">{fmt(exp.unitPrice)}</TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-slate-900">{fmt(exp.amount)}</TableCell>
                                                        <TableCell className="font-mono text-slate-500 text-[11px]">{exp.receiptNo || "-"}</TableCell>
                                                        <TableCell className="text-slate-500 text-[11px]">{exp.notes || "-"}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="attachments">
                                {budget.attachments?.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400 border rounded-lg bg-slate-50">
                                        Tidak ada foto nota yang diunggah pada periode ini.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[350px] overflow-y-auto p-1">
                                        {budget.attachments?.map((att: any) => (
                                            <div
                                                key={att.id}
                                                onClick={() => onPreviewImage({ url: att.fileUrl, name: att.fileName })}
                                                className="group border rounded-lg overflow-hidden bg-white shadow-2xs hover:shadow-md cursor-pointer transition-all"
                                            >
                                                <div className="aspect-square bg-slate-100 overflow-hidden">
                                                    <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                </div>
                                                <div className="p-1.5 text-[10px] truncate text-slate-700 font-medium" title={att.fileName}>
                                                    {att.fileName}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="history">
                                {(!budget.auditLogs || budget.auditLogs.length === 0) ? (
                                    <div className="p-8 text-center text-xs text-slate-400 border rounded-lg bg-slate-50 space-y-1">
                                        <History className="h-6 w-6 mx-auto text-slate-300 mb-1" />
                                        <p className="font-semibold text-slate-600">Belum Ada Riwayat Perubahan</p>
                                        <p className="text-[11px]">Budget ini belum pernah mengalami revisi setelah pertama kali dibuat.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                        {budget.auditLogs.map((log: any, i: number) => (
                                            <div key={log.id || i} className="border rounded-lg p-3 bg-white shadow-2xs space-y-2">
                                                <div className="flex items-center justify-between border-b pb-2 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] bg-slate-50 font-mono">
                                                            Revisi #{budget.auditLogs.length - i}
                                                        </Badge>
                                                        <span className="font-semibold text-slate-800">
                                                            {log.userName}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 font-mono">
                                                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm")}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                    {log.oldValues?.amount !== undefined && log.newValues?.amount !== undefined && (
                                                        <div className="p-2 bg-slate-50 rounded border text-[11px] space-y-0.5">
                                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Nominal Plafon</span>
                                                            <div className="flex items-center gap-1.5 font-mono">
                                                                <span className="line-through text-slate-400">{fmt(log.oldValues.amount)}</span>
                                                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                                                <span className="font-bold text-blue-700">{fmt(log.newValues.amount)}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {log.oldValues?.receivedDate && log.newValues?.receivedDate && log.oldValues.receivedDate !== log.newValues.receivedDate && (
                                                        <div className="p-2 bg-slate-50 rounded border text-[11px] space-y-0.5">
                                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Tgl Terima Dana</span>
                                                            <div className="flex items-center gap-1.5 font-mono">
                                                                <span className="line-through text-slate-400">{fmtDate(log.oldValues.receivedDate)}</span>
                                                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                                                <span className="font-bold text-slate-800">{fmtDate(log.newValues.receivedDate)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {log.editReason && (
                                                    <div className="p-2 bg-amber-50/70 border border-amber-200/80 rounded text-xs text-amber-950">
                                                        <span className="font-bold text-[11px]">Alasan Perubahan: </span>
                                                        <span className="italic">{log.editReason}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : null}

                <DialogFooter className="p-3 border-t bg-slate-50 shrink-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
