"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatRupiah } from "../../utils/cashflow-math"

interface StartingCashModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    startingCash: number
    minBuffer: number
    onSave: (startingCash: number, minBuffer: number) => void
}

export function StartingCashModal({
    open,
    onOpenChange,
    startingCash,
    minBuffer,
    onSave
}: StartingCashModalProps) {
    const [cash, setCash] = useState<number>(startingCash)
    const [buffer, setBuffer] = useState<number>(minBuffer)

    const handleSave = () => {
        onSave(cash, buffer)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold text-slate-900">
                        Atur Posisi Kas Awal &amp; Batas Buffer Aman
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2 text-xs">
                    <div className="space-y-1.5">
                        <Label htmlFor="startingCash" className="font-semibold text-slate-700">
                            Saldo Kas &amp; Bank Awal Saat Ini (Rp)
                        </Label>
                        <Input
                            id="startingCash"
                            type="number"
                            value={cash}
                            onChange={(e) => setCash(Number(e.target.value))}
                            className="h-9 text-sm"
                        />
                        <p className="text-[11px] text-slate-500">
                            Pratinjau: <span className="font-bold text-slate-800">{formatRupiah(cash)}</span> (Kombinasi saldo kas operasional &amp; rekening bank)
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="minBuffer" className="font-semibold text-slate-700">
                            Batas Minimum Kas Buffer Aman (Rp)
                        </Label>
                        <Input
                            id="minBuffer"
                            type="number"
                            value={buffer}
                            onChange={(e) => setBuffer(Number(e.target.value))}
                            className="h-9 text-sm"
                        />
                        <p className="text-[11px] text-slate-500">
                            Pratinjau: <span className="font-bold text-rose-700">{formatRupiah(buffer)}</span> (Batas peringatan darurat jika kas di bawah nilai ini)
                        </p>
                    </div>
                </div>
                <DialogFooter className="pt-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>
                        Terapkan ke Simulator
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
