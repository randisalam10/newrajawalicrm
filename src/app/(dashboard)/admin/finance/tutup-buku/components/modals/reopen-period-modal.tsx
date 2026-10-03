"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RotateCcw, AlertTriangle, Loader2 } from "lucide-react"
import { MonthlyClosingRecord } from "../../types"

interface ReopenPeriodModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    record: MonthlyClosingRecord | null
    isSubmitting: boolean
    onConfirmReopen: (reason: string) => void
}

export function ReopenPeriodModal({
    open,
    onOpenChange,
    record,
    isSubmitting,
    onConfirmReopen
}: ReopenPeriodModalProps) {
    const [reason, setReason] = useState<string>("")
    const [error, setError] = useState<string>("")

    if (!record) return null

    const handleConfirm = () => {
        if (!reason || reason.trim().length < 20) {
            setError("Alasan wajib diisi minimal 20 karakter untuk pertanggungjawaban audit.")
            return
        }
        setError("")
        onConfirmReopen(reason.trim())
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-700">
                        <RotateCcw className="h-5 w-5" />
                        <DialogTitle className="text-base">Buka Kembali Tutup Buku</DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-slate-500">
                        Periode: <strong>{record.period}</strong> ({record.locationName})
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 text-xs">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>Peringatan Audit Finansial</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                            Membuka kembali periode ini akan menonaktifkan status terkunci. Seluruh laporan periode {record.period} akan kembali dihitung secara dinamis dan transaksi dapat disesuaikan kembali.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">
                            Alasan Pembukaan Buku <span className="text-rose-500">*</span>
                        </Label>
                        <Textarea
                            placeholder="Jelaskan alasan pembukaan buku (minimal 20 karakter). Contoh: Ada bukti pengeluaran BBM tanggal 28 September terlambat diserahkan dari lapangan."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value)
                                if (error) setError("")
                            }}
                            className="text-xs h-24"
                        />
                        <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Minimal 20 karakter</span>
                            <span className={reason.length < 20 ? "text-rose-500" : "text-emerald-600"}>
                                {reason.length}/20 karakter
                            </span>
                        </div>
                        {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Batal
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleConfirm}
                        disabled={isSubmitting || reason.length < 20}
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                        <span>Buka Kembali Buku</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
