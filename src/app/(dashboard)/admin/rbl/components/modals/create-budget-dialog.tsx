"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WalletCards, Loader2 } from "lucide-react"
import { MONTH_NAMES } from "../../utils/rbl-helpers"

interface CreateBudgetDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    budgetForm: {
        locationId: string
        periodMonth: number
        periodYear: number
        receivedDate: string
        amount: string
        notes: string
    }
    setBudgetForm: React.Dispatch<React.SetStateAction<{
        locationId: string
        periodMonth: number
        periodYear: number
        receivedDate: string
        amount: string
        notes: string
    }>>
    onSubmit: (e: React.FormEvent) => void
    isSuperAdmin: boolean
    adminBranchName: string
    locations: any[]
    isPending: boolean
}

export function CreateBudgetDialog({
    isOpen,
    onOpenChange,
    budgetForm,
    setBudgetForm,
    onSubmit,
    isSuperAdmin,
    adminBranchName,
    locations,
    isPending,
}: CreateBudgetDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-base flex items-center gap-2">
                            <WalletCards className="h-5 w-5 text-blue-600" />
                            Buka Budget RBL Baru
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Input penerimaan anggaran operasional dari Head Office untuk periode berjalan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 py-4 text-xs">
                        {isSuperAdmin ? (
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Pilih Cabang *</Label>
                                <Select
                                    value={budgetForm.locationId}
                                    onValueChange={v => setBudgetForm(prev => ({ ...prev, locationId: v }))}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Pilih Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map(l => (
                                            <SelectItem key={l.id} value={l.id} className="text-xs">
                                                {l.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Cabang Terdaftar</Label>
                                <Input value={adminBranchName} disabled className="h-8 text-xs bg-slate-100 font-semibold" />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Bulan Periode *</Label>
                                <Select
                                    value={String(budgetForm.periodMonth)}
                                    onValueChange={v => setBudgetForm(prev => ({ ...prev, periodMonth: parseInt(v) }))}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTH_NAMES.map((m, i) => (
                                            <SelectItem key={i} value={String(i + 1)} className="text-xs">
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Tahun *</Label>
                                <Input
                                    type="number"
                                    value={budgetForm.periodYear}
                                    onChange={e => setBudgetForm(prev => ({ ...prev, periodYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Tanggal Penerimaan Dana *</Label>
                            <Input
                                type="date"
                                value={budgetForm.receivedDate}
                                onChange={e => setBudgetForm(prev => ({ ...prev, receivedDate: e.target.value }))}
                                className="h-8 text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Nominal Budget yang Diterima (Rp) *</Label>
                            <Input
                                type="text"
                                placeholder="Misal: 15.000.000"
                                value={budgetForm.amount}
                                onChange={e => {
                                    const clean = e.target.value.replace(/[^0-9]/g, "")
                                    const formatted = clean ? new Intl.NumberFormat("id-ID").format(parseInt(clean)) : ""
                                    setBudgetForm(prev => ({ ...prev, amount: formatted }))
                                }}
                                className="h-9 text-sm font-bold font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Catatan / Sumber Transfer (Opsional)</Label>
                            <Input
                                placeholder="Misal: Transfer BCA HO ke Rekening Operasional"
                                value={budgetForm.notes}
                                onChange={e => setBudgetForm(prev => ({ ...prev, notes: e.target.value }))}
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isPending} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            Buka Budget RBL
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
