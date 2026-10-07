"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil, Loader2, AlertTriangle, History, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { fmt, fmtShortDate, MONTH_NAMES } from "../../utils/rbl-helpers"
import { BudgetUpdatePayload, BudgetAuditLogDTO } from "../../types"

interface EditBudgetDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    budget: any
    onSubmit: (budgetId: string, payload: BudgetUpdatePayload) => Promise<void>
    isPending: boolean
}

export function EditBudgetDialog({
    isOpen,
    onOpenChange,
    budget,
    onSubmit,
    isPending,
}: EditBudgetDialogProps) {
    const [amount, setAmount] = useState("")
    const [receivedDate, setReceivedDate] = useState("")
    const [notes, setNotes] = useState("")
    const [editReason, setEditReason] = useState("")
    const [showHistory, setShowHistory] = useState(false)

    useEffect(() => {
        if (budget && isOpen) {
            const rawAmount = budget.amount ? Math.round(Number(budget.amount)) : 0
            setAmount(rawAmount > 0 ? new Intl.NumberFormat("id-ID").format(rawAmount) : "")
            if (budget.receivedDate) {
                try {
                    setReceivedDate(format(new Date(budget.receivedDate), "yyyy-MM-dd"))
                } catch {
                    setReceivedDate("")
                }
            } else {
                setReceivedDate("")
            }
            setNotes(budget.notes || "")
            setEditReason("")
            setShowHistory(false)
        }
    }, [budget, isOpen])

    const isClosed = budget?.status === "CLOSED"
    const auditLogs: BudgetAuditLogDTO[] = budget?.auditLogs || []

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isClosed || !budget) return

        const cleanAmount = parseFloat(amount.replace(/[^0-9]/g, ""))
        if (!cleanAmount || cleanAmount <= 0) {
            alert("Nominal budget harus lebih dari 0.")
            return
        }

        if (!receivedDate) {
            alert("Tanggal penerimaan dana wajib diisi.")
            return
        }

        if (!editReason.trim()) {
            alert("Alasan perubahan budget wajib diisi sebagai catatan audit.")
            return
        }

        await onSubmit(budget.id, {
            amount: cleanAmount,
            receivedDate,
            notes: notes.trim(),
            editReason: editReason.trim(),
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <DialogHeader className="p-4 border-b bg-slate-50/70 shrink-0">
                        <div className="flex items-center justify-between gap-2">
                            <DialogTitle className="text-base flex items-center gap-2 text-slate-900">
                                <Pencil className="h-4 w-4 text-blue-600" />
                                Edit Budget RBL
                            </DialogTitle>
                            {budget && (
                                <Badge className={isClosed ? "bg-slate-700 text-white text-[10px]" : "bg-emerald-600 text-white text-[10px]"}>
                                    {isClosed ? "CLOSED (Terkunci)" : "OPEN (Aktif)"}
                                </Badge>
                            )}
                        </div>
                        <DialogDescription className="text-xs text-slate-500 mt-1">
                            {budget ? (
                                <span className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-slate-800">{budget.code}</span>
                                    <span>•</span>
                                    <span>🏢 {budget.location?.name || "Cabang"}</span>
                                    <span>•</span>
                                    <span>📅 {MONTH_NAMES[(budget.periodMonth || 1) - 1]} {budget.periodYear}</span>
                                </span>
                            ) : (
                                "Ubah plafon atau data penerimaan budget yang masih aktif."
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                        {isClosed ? (
                            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 flex items-start gap-2.5">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-bold text-xs">Budget Tidak Dapat Diedit</p>
                                    <p className="text-[11px] leading-relaxed">
                                        Budget periode ini telah resmi <strong>DITUTUP (CLOSED)</strong>. Perubahan data, penambahan pengeluaran, atau revisi plafon dinonaktifkan demi integritas pembukuan kas.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Tanggal Penerimaan Dana *</Label>
                                    <Input
                                        type="date"
                                        value={receivedDate}
                                        onChange={e => setReceivedDate(e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        required
                                        disabled={isPending}
                                    />
                                    <p className="text-[10px] text-slate-400">Tanggal riil transfer atau kas diterima oleh cabang dari Head Office.</p>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Nominal Budget yang Diterima (Rp) *</Label>
                                    <Input
                                        type="text"
                                        placeholder="Misal: 15.000.000"
                                        value={amount}
                                        onChange={e => {
                                            const clean = e.target.value.replace(/[^0-9]/g, "")
                                            const formatted = clean ? new Intl.NumberFormat("id-ID").format(parseInt(clean)) : ""
                                            setAmount(formatted)
                                        }}
                                        className="h-9 text-sm font-bold font-mono bg-white text-slate-900"
                                        required
                                        disabled={isPending}
                                    />
                                    {budget && (
                                        <p className="text-[11px] text-slate-500 flex items-center justify-between">
                                            <span>Nominal sebelumnya: <strong className="font-mono text-slate-700">{fmt(budget.amount)}</strong></span>
                                            {amount && (
                                                <span className="font-mono font-medium text-blue-600">
                                                    Revisi: Rp {amount}
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Catatan / Sumber Rekening</Label>
                                    <Input
                                        type="text"
                                        placeholder="Contoh: Transfer Mandiri Rek Cabang / Tambahan kas kasir"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="h-8 text-xs bg-white"
                                        disabled={isPending}
                                    />
                                </div>

                                <div className="space-y-1 bg-amber-50/60 p-3 rounded-lg border border-amber-200/80">
                                    <Label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                        Alasan Perubahan / Revisi *
                                    </Label>
                                    <Textarea
                                        placeholder="Contoh: Koreksi nominal transfer dari HO atau penyesuaian dana kas darurat lapangan..."
                                        value={editReason}
                                        onChange={e => setEditReason(e.target.value)}
                                        className="text-xs min-h-[64px] bg-white border-amber-200 text-slate-800"
                                        required
                                        disabled={isPending}
                                    />
                                    <p className="text-[10px] text-amber-800">
                                        Wajib diisi untuk audit trail riwayat perubahan budget.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* History section if budget was edited before */}
                        {auditLogs.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer py-1"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <History className="h-3.5 w-3.5 text-slate-500" />
                                        Riwayat Perubahan Sebelumnya ({auditLogs.length} revisi)
                                    </span>
                                    <span className="text-blue-600 hover:underline">
                                        {showHistory ? "Sembunyikan" : "Lihat Detail"}
                                    </span>
                                </button>

                                {showHistory && (
                                    <div className="mt-2 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                        {auditLogs.map((log, idx) => (
                                            <div key={log.id || idx} className="p-2.5 rounded-lg border bg-slate-50 text-[11px] space-y-1">
                                                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                                                    <span className="font-semibold text-slate-700">{log.userName}</span>
                                                    <span>{fmtShortDate(log.timestamp)}</span>
                                                </div>
                                                {log.oldValues?.amount !== undefined && log.newValues?.amount !== undefined && (
                                                    <div className="flex items-center gap-1.5 font-mono text-slate-800 text-[10px]">
                                                        <span>{fmt(log.oldValues.amount)}</span>
                                                        <ArrowRight className="h-2.5 w-2.5 text-slate-400" />
                                                        <span className="font-bold text-blue-700">{fmt(log.newValues.amount)}</span>
                                                    </div>
                                                )}
                                                {log.editReason && (
                                                    <p className="text-[10px] text-slate-600 italic bg-white p-1 rounded border border-slate-200/60">
                                                        "{log.editReason}"
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-3 border-t bg-slate-50 shrink-0 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            className="h-8 text-xs cursor-pointer"
                        >
                            {isClosed ? "Tutup" : "Batal"}
                        </Button>
                        {!isClosed && (
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isPending || !amount || !receivedDate || !editReason.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs shadow-xs cursor-pointer gap-1.5"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    "Simpan Perubahan"
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
