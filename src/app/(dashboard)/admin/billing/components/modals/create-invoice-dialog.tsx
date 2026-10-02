"use client"

import React from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Loader2, Truck, Wrench } from "lucide-react"
import { InvoiceFormState } from "../../types"
import { fmt } from "../../utils/billing-helpers"

interface CreateInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedTxList: any[]
    selectedVolume: number
    selectedDays: number
    invoiceForm: InvoiceFormState
    setInvoiceForm: React.Dispatch<React.SetStateAction<InvoiceFormState>>
    customerSeqDefault: number | null
    createLoading: boolean
    createError: string
    onSubmit: () => void
}

export function CreateInvoiceDialog({
    open,
    onOpenChange,
    selectedTxList,
    selectedVolume,
    selectedDays,
    invoiceForm,
    setInvoiceForm,
    customerSeqDefault,
    createLoading,
    createError,
    onSubmit,
}: CreateInvoiceDialogProps) {
    if (selectedTxList.length === 0) return null

    const isSewa = selectedTxList.some(tx => tx.itemType === "SEWA")
    const isMix = selectedTxList.some(tx => tx.itemType === "READYMIX")
    const isCombined = isSewa && isMix
    const firstTx = selectedTxList[0]
    const proj = firstTx.project
    const cust = firstTx.customer || proj?.customer
    const custName = cust?.customer_name || "Customer"

    const autoInitials = custName
        .replace(/^(pt\.|pt|cv\.|cv|pak|bu)\s*/i, "")
        .trim()
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 4) || "XXX"

    const displayInitials = invoiceForm.initialsOverride || autoInitials
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const rmSubtotal = selectedTxList.filter((t: any) => t.itemType !== "SEWA").reduce((s: number, tx: any) => {
        const priceEntry = proj?.prices?.find((p: any) => p.qualityId === tx.qualityId)
        const rawPrice = priceEntry?.price ?? 0
        const rmPpnMode = priceEntry?.ppn_mode || "NON_PPN"
        const rmPpnRate = priceEntry?.ppn_rate ?? 11
        const dppPrice = rmPpnMode === "INCLUDE"
            ? rawPrice / (1 + rmPpnRate / 100)
            : rawPrice
        return s + tx.volume_cubic * dppPrice
    }, 0)

    const sewaSubtotal = selectedTxList.filter((t: any) => t.itemType === "SEWA").reduce((s: number, tx: any) => {
        if (tx.ppn_mode === "INCLUDE") {
            return s + (tx.dpp_amount ?? ((tx.totalPrice || (tx.pricePerDay * tx.totalDays)) / (1 + (tx.ppn_rate ?? 11) / 100)))
        }
        return s + (tx.totalPrice || (tx.pricePerDay * tx.totalDays) || 0)
    }, 0)

    const subtotal = rmSubtotal + sewaSubtotal
    const rmTaxRate = (proj?.tax_ppn !== undefined && proj?.tax_ppn !== null ? proj.tax_ppn : 11) / 100
    const rmPpn = invoiceForm.includePpn ? rmSubtotal * rmTaxRate : 0
    const sewaPpn = invoiceForm.includePpn
        ? selectedTxList.filter((t: any) => t.itemType === "SEWA").reduce((s: number, tx: any) => {
            const sRate = (tx.ppn_rate ?? 11) / 100
            const txDpp = tx.ppn_mode === "INCLUDE"
                ? (tx.dpp_amount ?? ((tx.totalPrice || (tx.pricePerDay * tx.totalDays)) / (1 + sRate)))
                : (tx.totalPrice || (tx.pricePerDay * tx.totalDays) || 0)
            return s + (txDpp * sRate)
        }, 0)
        : 0
    const ppnTotal = rmPpn + sewaPpn
    const total = subtotal + ppnTotal

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Buat Invoice Baru</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {isCombined ? (
                        <div className="bg-gradient-to-r from-blue-50/70 to-purple-50/70 border border-indigo-200 rounded-lg p-3 text-sm space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="font-bold text-slate-900">{custName}</div>
                                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px]">
                                    ⚡ Invoice Terpadu (Cor + Sewa)
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-100">
                                <div className="bg-white/80 p-2 rounded border border-blue-100">
                                    <div className="font-semibold text-blue-900 flex items-center gap-1">
                                        <Truck className="w-3.5 h-3.5" /> Cor ReadyMix
                                    </div>
                                    <div className="text-slate-600 text-[11px] mt-0.5">
                                        {selectedTxList.filter((t: any) => t.itemType !== "SEWA").length} transaksi · {selectedVolume.toFixed(2)} m³
                                    </div>
                                </div>
                                <div className="bg-white/80 p-2 rounded border border-purple-100">
                                    <div className="font-semibold text-purple-900 flex items-center gap-1">
                                        <Wrench className="w-3.5 h-3.5" /> Sewa Alat/CP
                                    </div>
                                    <div className="text-slate-600 text-[11px] mt-0.5">
                                        {selectedTxList.filter((t: any) => t.itemType === "SEWA").length} transaksi · {selectedDays} hari sewa
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : isSewa ? (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold text-purple-900">{custName}</div>
                                <Badge className="bg-purple-600 text-white text-[10px]">Invoice Sewa Alat</Badge>
                            </div>
                            <div className="text-purple-700 text-xs">
                                {firstTx.lokasi_proyek || proj?.name || "Penyewaan Alat & Kendaraan"}
                            </div>
                            <div className="text-slate-500 text-xs">
                                {selectedTxList.length} transaksi sewa · {selectedDays} hari sewa
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                            <div className="font-medium">{custName} — {proj?.name}</div>
                            <div className="text-slate-500">{selectedTxList.length} transaksi · {selectedVolume.toFixed(2)} m³</div>
                        </div>
                    )}

                    {/* Invoice Number Builder */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Nomor Invoice</Label>
                        <div className="flex items-center gap-1 flex-wrap">
                            <div className="bg-slate-100 rounded-md px-3 py-2 text-sm font-mono text-slate-400 tracking-wider">###</div>
                            <span className="text-slate-400">/</span>
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-0.5">
                                    <div className="bg-slate-100 rounded-l-md px-2 py-2 text-sm font-mono text-slate-500">INV-</div>
                                    <input
                                        type="number" min={1}
                                        className="border border-blue-300 rounded-r-md px-2 py-2 text-sm font-mono w-14 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 [appearance:textfield]"
                                        value={invoiceForm.customerSeqOverride}
                                        onChange={e => setInvoiceForm(f => ({ ...f, customerSeqOverride: e.target.value }))}
                                    />
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[10px] text-slate-400">urutan ke-{invoiceForm.customerSeqOverride || customerSeqDefault}</span>
                                    <button
                                        type="button"
                                        className="text-[10px] text-blue-500 hover:underline cursor-pointer"
                                        onClick={() => setInvoiceForm(f => ({ ...f, customerSeqOverride: "1" }))}
                                    >reset ke 1</button>
                                </div>
                            </div>
                            <span className="text-slate-400">/</span>
                            <div className="flex flex-col items-center">
                                <input
                                    className="border border-blue-300 rounded-md px-2 py-2 text-sm font-mono uppercase w-20 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                                    placeholder={autoInitials}
                                    maxLength={4}
                                    value={invoiceForm.initialsOverride}
                                    onChange={e => setInvoiceForm(f => ({ ...f, initialsOverride: e.target.value.toUpperCase() }))}
                                />
                                <span className="text-[10px] text-blue-400 mt-0.5">singkatan (edit)</span>
                            </div>
                            <span className="text-slate-400">/</span>
                            <div className="bg-slate-100 rounded-md px-2 py-2 text-sm font-mono text-slate-500">{month}/{year}</div>
                        </div>
                        <p className="text-xs text-slate-400">
                            Preview: <strong className="font-mono text-slate-700">###/INV-{invoiceForm.customerSeqOverride || customerSeqDefault}/{displayInitials}/{month}/{year}</strong>
                            <span className="ml-1 text-slate-300">(### = nomor urut otomatis)</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-slate-800">
                            <input type="checkbox" checked={invoiceForm.includePpn}
                                onChange={e => setInvoiceForm(f => ({ ...f, includePpn: e.target.checked }))}
                                className="rounded cursor-pointer h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Kenakan PPN {isCombined ? `(Cor: ${proj?.tax_ppn ?? 11}%, Sewa: 11%)` : isSewa ? `${selectedTxList.find((t: any) => t.itemType === "SEWA")?.ppn_rate ?? 11}%` : `${proj?.tax_ppn ?? 11}%`}</span>
                        </label>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-normal border ${invoiceForm.includePpn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {invoiceForm.includePpn ? "Faktur PPN Aktif" : "Non-PPN (Bebas Pajak)"}
                        </span>
                        {isSewa && selectedTxList.some((t: any) => t.ppn_mode === "INCLUDE") && (
                            <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                                Sewa inc. PPN — DPP dihitung otomatis
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">Jatuh Tempo</Label>
                            <Input type="date" className="h-9 text-sm mt-1"
                                value={invoiceForm.dueDate}
                                onChange={e => setInvoiceForm(f => ({ ...f, dueDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Catatan</Label>
                            <Input className="h-9 text-sm mt-1" placeholder="Opsional"
                                value={invoiceForm.notes}
                                onChange={e => setInvoiceForm(f => ({ ...f, notes: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1 text-sm">
                        {isCombined && (
                            <>
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span>DPP ReadyMix ({selectedVolume.toFixed(2)} m³)</span>
                                    <span className="font-mono">{fmt(rmSubtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span>DPP Sewa Alat ({selectedDays} Hari)</span>
                                    <span className="font-mono">{fmt(sewaSubtotal)}</span>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between"><span className="text-slate-600">DPP (Dasar Pengenaan Pajak)</span><span className="font-mono font-medium">{fmt(subtotal)}</span></div>
                        {invoiceForm.includePpn && <div className="flex justify-between text-slate-500"><span>PPN {isCombined ? "Campuran" : (isSewa ? `${selectedTxList.find((t: any) => t.itemType === "SEWA")?.ppn_rate ?? 11}%` : `${proj?.tax_ppn}%`)}</span><span className="font-mono">{fmt(ppnTotal)}</span></div>}
                        <div className="flex justify-between font-bold border-t border-blue-200 pt-1 mt-1"><span>Total</span><span className="text-blue-700 font-mono">{fmt(total)}</span></div>
                    </div>

                    {createError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {createError}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                    <Button onClick={onSubmit} disabled={createLoading}>
                        {createLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...</> : "Terbitkan Invoice"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
