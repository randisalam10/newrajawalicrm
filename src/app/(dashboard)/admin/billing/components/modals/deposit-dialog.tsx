"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { DepositFormState } from "../../types"

interface DepositDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    depositTarget: any
    depositForm: DepositFormState
    setDepositForm: React.Dispatch<React.SetStateAction<DepositFormState>>
    depositLoading: boolean
    onSubmit: () => void
}

export function DepositDialog({
    open,
    onOpenChange,
    depositTarget,
    depositForm,
    setDepositForm,
    depositLoading,
    onSubmit,
}: DepositDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Setor Deposito Proyek</DialogTitle></DialogHeader>
                {depositTarget && (
                    <div className="space-y-3">
                        <div className="bg-slate-50 border rounded p-2.5 text-xs">
                            <div className="font-semibold text-slate-800">{depositTarget.customerName}</div>
                            <div className="text-slate-500">{depositTarget.projectName}</div>
                        </div>
                        <div>
                            <Label className="text-xs">Jumlah Setoran (Rp) *</Label>
                            <Input
                                type="number"
                                className="mt-1 h-9 font-mono"
                                placeholder="0"
                                value={depositForm.amount}
                                onChange={e => setDepositForm(f => ({ ...f, amount: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Keterangan / Berita Acara</Label>
                            <Input
                                className="mt-1 h-9 text-xs"
                                placeholder="Misal: Uang Muka DP Proyek"
                                value={depositForm.description}
                                onChange={e => setDepositForm(f => ({ ...f, description: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">No. Referensi / Bukti Transfer</Label>
                            <Input
                                className="mt-1 h-9 text-xs"
                                placeholder="No. Resi / Ref Bank"
                                value={depositForm.reference}
                                onChange={e => setDepositForm(f => ({ ...f, reference: e.target.value }))}
                            />
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={onSubmit}
                        disabled={depositLoading || !depositForm.amount}
                    >
                        {depositLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                        Simpan Deposito
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
