"use client"

import { useState, useEffect } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Lock, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"
import {
    PeriodOptionItem,
    ClosePeriodPreview,
    ClosingStatusMap,
    ClosePeriodPayload
} from "../../types"

interface ClosePeriodModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    availablePeriods: PeriodOptionItem[]
    locations: Array<{ id: string; name: string }>
    closingMap: ClosingStatusMap
    defaultLocationId?: string
    previewData: ClosePeriodPreview | null
    isPreviewLoading: boolean
    isSubmitting: boolean
    onFetchPreview: (period: string, locationId: string | null) => void
    onConfirmClose: (payload: ClosePeriodPayload) => void
}

function formatRp(val: number): string {
    return "Rp " + Math.round(val || 0).toLocaleString("id-ID")
}

export function ClosePeriodModal({
    open,
    onOpenChange,
    availablePeriods,
    locations,
    closingMap,
    defaultLocationId,
    previewData,
    isPreviewLoading,
    isSubmitting,
    onFetchPreview,
    onConfirmClose
}: ClosePeriodModalProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<string>("")
    const [selectedLocationId, setSelectedLocationId] = useState<string>("all")
    const [closeAllBranches, setCloseAllBranches] = useState<boolean>(true)
    const [notes, setNotes] = useState<string>("")

    // Initialize with selected location from header and first open period for that location
    useEffect(() => {
        if (open) {
            const initialLoc = defaultLocationId && defaultLocationId !== "all" ? defaultLocationId : "all"
            setSelectedLocationId(initialLoc)
            setCloseAllBranches(initialLoc === "all")
            setNotes("")

            const targetKey = (per: string) => `${per}__${initialLoc === "all" ? "ALL" : initialLoc}`
            const firstOpen = availablePeriods.find(p => closingMap[targetKey(p.period)]?.status !== "CLOSED")?.period || availablePeriods[0]?.period || ""
            setSelectedPeriod(firstOpen)

            if (firstOpen) {
                onFetchPreview(firstOpen, initialLoc === "all" ? null : initialLoc)
            }
        }
    }, [open, defaultLocationId])

    const handlePeriodChange = (val: string) => {
        setSelectedPeriod(val)
        onFetchPreview(val, selectedLocationId === "all" ? null : selectedLocationId)
    }

    const handleLocationChange = (val: string) => {
        setSelectedLocationId(val)
        if (val !== "all") {
            setCloseAllBranches(false)
        } else {
            setCloseAllBranches(true)
        }
        onFetchPreview(selectedPeriod, val === "all" ? null : val)
    }

    const handleSubmit = () => {
        if (!selectedPeriod) return
        onConfirmClose({
            period: selectedPeriod,
            locationId: selectedLocationId === "all" ? null : selectedLocationId,
            notes: notes.trim() || undefined,
            closeAllBranches: selectedLocationId === "all" ? closeAllBranches : false
        })
    }

    // Dynamic closing status for the currently selected branch
    const currentScopeKey = `${selectedPeriod}__${selectedLocationId === "all" ? "ALL" : selectedLocationId}`
    const currentClosingRecord = closingMap[currentScopeKey]
    const isAlreadyClosed = currentClosingRecord?.status === "CLOSED"

    const selectedBranchName = selectedLocationId === "all"
        ? "Konsolidasi Pusat"
        : locations.find(l => l.id === selectedLocationId)?.name || "Cabang"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-emerald-700">
                        <Lock className="h-5 w-5" />
                        <DialogTitle className="text-lg">Konfirmasi Tutup Buku Periode</DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-slate-500">
                        Menutup buku akan mengunci seluruh angka laporan bulanan menjadi snapshot permanen. Data di periode ini tidak akan berubah meskipun ada penyesuaian master harga di masa mendatang.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Cabang / Lingkup</Label>
                            <Select value={selectedLocationId} onValueChange={handleLocationChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Cabang (Konsolidasi Pusat)</SelectItem>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Periode Bulan</Label>
                            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Periode" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePeriods.map(p => {
                                        const key = `${p.period}__${selectedLocationId === "all" ? "ALL" : selectedLocationId}`
                                        const closed = closingMap[key]?.status === "CLOSED"
                                        return (
                                            <SelectItem key={p.period} value={p.period}>
                                                {p.label} {closed ? "(Sudah Ditutup)" : "(Terbuka)"}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Scope specific status alert */}
                    {isAlreadyClosed ? (
                        <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                            <span>
                                <strong>Sudah Ditutup Buku:</strong> Periode {selectedPeriod} untuk <em>{selectedBranchName}</em> sudah ditutup oleh {currentClosingRecord.closedByName}. Menutup ulang akan memperbarui snapshot resmi.
                            </span>
                        </div>
                    ) : (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                            <Lock className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                            <span>
                                <strong>Periode Terbuka:</strong> Periode {selectedPeriod} untuk <em>{selectedBranchName}</em> siap ditutup buku dan dikunci permanen.
                            </span>
                        </div>
                    )}

                    {/* Batch All Branches Checkbox (Only for Konsolidasi Pusat) */}
                    {selectedLocationId === "all" && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={closeAllBranches}
                                    onChange={(e) => setCloseAllBranches(e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                />
                                <span>Kunci & tutup buku seluruh cabang aktif sekaligus</span>
                            </label>
                            <p className="text-[11px] text-slate-500 pl-6">
                                Mengunci snapshot resmi untuk Konsolidasi Pusat serta setiap cabang (Youtefa, Sorong, Koya, dll) dalam 1 kali proses.
                            </p>
                        </div>
                    )}

                    {/* Live Preview Box */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 border-b pb-1.5">
                            <span>Ringkasan Angka Final ({selectedBranchName}):</span>
                            {isPreviewLoading && (
                                <span className="flex items-center gap-1 text-slate-500">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Menghitung...
                                </span>
                            )}
                        </div>

                        {previewData ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Volume Beton:</span>
                                    <span className="font-bold text-slate-900">
                                        {previewData.volumeTotal.toLocaleString("id-ID", { maximumFractionDigits: 1 })} m³
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Omset DPP:</span>
                                    <span className="font-bold text-slate-900">{formatRp(previewData.dppRevenue)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Total HPP:</span>
                                    <span className="font-bold text-slate-700">{formatRp(previewData.totalCogs)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Biaya Agregat:</span>
                                    <span className="font-semibold text-slate-800">{formatRp(previewData.pasirCost + previewData.splitCost)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Beban Usaha (RBL):</span>
                                    <span className="font-semibold text-slate-800">{formatRp(previewData.overheadCost)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Laba Bersih Final:</span>
                                    <span className={`font-bold ${previewData.netProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                        {formatRp(previewData.netProfit)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 text-center text-xs text-slate-400">
                                {isPreviewLoading ? "Sedang memuat kalkulasi data..." : "Pilih periode untuk melihat kalkulasi."}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Catatan Auditor / Penutupan Buku (Opsional)</Label>
                        <Textarea
                            placeholder="Contoh: Rekonsiliasi fisik kas dan material selesai disetujui Direktur Keuangan."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="text-xs h-20"
                        />
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <span>
                            <strong>Perhatian:</strong> Periode yang ditutup buku akan dikunci sebagai rekaman resmi. Halaman laporan bulanan akan membaca snapshot ini secara instan tanpa kalkulasi ulang.
                        </span>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Batal
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isSubmitting || isPreviewLoading || !previewData}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        <span>{isAlreadyClosed ? "Perbarui Kunci Buku" : "Kunci & Tutup Buku"}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
