"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, Loader2 } from "lucide-react"
import { fmt } from "../../utils/rbl-helpers"

interface CloseBudgetDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    activeBudget: any
    closeDate: string
    setCloseDate: (date: string) => void
    closeNotes: string
    setCloseNotes: (notes: string) => void
    onSubmit: () => void
    isPending: boolean
}

export function CloseBudgetDialog({
    isOpen,
    onOpenChange,
    activeBudget,
    closeDate,
    setCloseDate,
    closeNotes,
    setCloseNotes,
    onSubmit,
    isPending,
}: CloseBudgetDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="text-base flex items-center gap-2 text-slate-900">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        Konfirmasi Tutup Buku RBL
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Setelah ditutup, mutasi pengeluaran periode ini akan dikunci dan laporan resmi akan diterbitkan.
                    </DialogDescription>
                </DialogHeader>

                {activeBudget && (
                    <div className="space-y-3 py-2 text-xs">
                        <div className="p-3 bg-slate-50 rounded-lg border space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Kode Periode:</span>
                                <span className="font-bold text-slate-800">{activeBudget.code}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Budget Awal:</span>
                                <span className="font-bold text-slate-900 font-mono">{fmt(activeBudget.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Pengeluaran:</span>
                                <span className="font-bold text-blue-700 font-mono">{fmt(activeBudget.totalExpense)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between items-center">
                                <span className="font-bold text-slate-700">Saldo Akhir:</span>
                                <span className={`font-bold font-mono text-sm ${
                                    activeBudget.remainingBalance > 0 ? "text-emerald-700" : activeBudget.remainingBalance < 0 ? "text-rose-700" : "text-slate-800"
                                }`}>
                                    {activeBudget.remainingBalance >= 0 ? "+" : ""}{fmt(activeBudget.remainingBalance)}
                                </span>
                            </div>
                        </div>

                        <div className={`p-2.5 rounded-md text-xs border ${
                            activeBudget.remainingBalance > 0
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : activeBudget.remainingBalance < 0
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}>
                            {activeBudget.remainingBalance > 0 ? (
                                <span>Terdapat <strong>Sisa Pengembalian Dana (Surplus) sebesar {fmt(activeBudget.remainingBalance)}</strong> yang harus disetorkan kembali ke Head Office.</span>
                            ) : activeBudget.remainingBalance < 0 ? (
                                <span>Terdapat <strong>Defisit / Minus sebesar {fmt(Math.abs(activeBudget.remainingBalance))}</strong> yang akan diajukan sebagai klaim penagihan ke Head Office.</span>
                            ) : (
                                <span>Anggaran terpakai tepat seimbang tanpa sisa dan tanpa minus.</span>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Tanggal Tutup Periode RBL *</Label>
                            <Input
                                type="date"
                                value={closeDate}
                                onChange={e => setCloseDate(e.target.value)}
                                className="h-8 text-xs font-mono bg-white"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Catatan Berita Acara Penutupan / Bukti Transfer Pengembalian</Label>
                            <Textarea
                                rows={2}
                                placeholder="Misal: Sisa dana Rp 1.750.000 telah ditransfer kembali ke rekening HO BCA tgl 31 Mar."
                                value={closeNotes}
                                onChange={e => setCloseNotes(e.target.value)}
                                className="text-xs"
                            />
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={isPending}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Konfirmasi Tutup Buku
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
