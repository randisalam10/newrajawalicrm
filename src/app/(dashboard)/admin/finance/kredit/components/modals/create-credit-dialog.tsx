"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { CreateCreditFormState } from "../../types"
import { Landmark, Loader2 } from "lucide-react"

interface CreateCreditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    createForm: CreateCreditFormState
    setCreateForm: React.Dispatch<React.SetStateAction<CreateCreditFormState>>
    companies: Array<{ id: string; name: string }>
    locations: Array<{ id: string; name: string }>
    onSubmit: () => void
    isPending: boolean
}

export function CreateCreditDialog({
    open,
    onOpenChange,
    createForm,
    setCreateForm,
    companies,
    locations,
    onSubmit,
    isPending,
}: CreateCreditDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-blue-600" />
                        <span>Daftarkan Kewajiban Kredit Non-PO</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-1 text-xs">
                    {/* Supplier / Pihak Pemberi Kredit */}
                    <div>
                        <Label className="text-xs font-semibold">Nama Rekanan / Pemberi Kredit *</Label>
                        <Input
                            className="mt-1 h-9 text-xs"
                            placeholder="Contoh: Bank Mandiri / PT. Sany Leasing / Pemilik Lahan"
                            value={createForm.supplierName}
                            onChange={e => setCreateForm(prev => ({ ...prev, supplierName: e.target.value }))}
                        />
                    </div>

                    {/* Perusahaan Penanggung */}
                    <div>
                        <Label className="text-xs font-semibold">Entitas Perusahaan Penanggung *</Label>
                        <Select
                            value={createForm.companyGroupId}
                            onValueChange={v => setCreateForm(prev => ({ ...prev, companyGroupId: v }))}
                        >
                            <SelectTrigger className="mt-1 h-9 text-xs bg-white">
                                <SelectValue placeholder="Pilih Perusahaan" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Nominal Kredit */}
                    <div>
                        <Label className="text-xs font-semibold">Total Nilai Kredit (Rp) *</Label>
                        <Input
                            type="number"
                            className="mt-1 h-9 text-xs font-mono font-semibold"
                            placeholder="Contoh: 150000000"
                            value={createForm.totalAmount}
                            onChange={e => setCreateForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                        />
                    </div>

                    {/* Tanggal & Tenor */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <Label className="text-xs font-semibold">Tanggal Kredit *</Label>
                            <Input
                                type="date"
                                className="mt-1 h-9 text-xs bg-white"
                                value={createForm.creditDate}
                                onChange={e => setCreateForm(prev => ({ ...prev, creditDate: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold">Jatuh Tempo (Opsional)</Label>
                            <Input
                                type="date"
                                className="mt-1 h-9 text-xs bg-white"
                                value={createForm.dueDate}
                                onChange={e => setCreateForm(prev => ({ ...prev, dueDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Cabang (Opsional) */}
                    <div>
                        <Label className="text-xs font-semibold">Cabang / Proyek Terkait (Opsional)</Label>
                        <Select
                            value={createForm.locationId}
                            onValueChange={v => setCreateForm(prev => ({ ...prev, locationId: v }))}
                        >
                            <SelectTrigger className="mt-1 h-9 text-xs bg-white">
                                <SelectValue placeholder="Pilih Cabang (Opsional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">-- Konsolidasi Pusat / Semua Cabang --</SelectItem>
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Catatan */}
                    <div>
                        <Label className="text-xs font-semibold">Catatan & Keterangan</Label>
                        <Input
                            className="mt-1 h-9 text-xs"
                            placeholder="Klausul / referensi nomor perjanjian kontrak"
                            value={createForm.notes}
                            onChange={e => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                        className="h-8 text-xs cursor-pointer"
                    >
                        Batal
                    </Button>
                    <Button
                        size="sm"
                        onClick={onSubmit}
                        disabled={isPending}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Mendaftarkan...
                            </>
                        ) : (
                            "Daftarkan Kredit"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
