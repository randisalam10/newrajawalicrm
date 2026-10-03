"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Building2, Check, X, ShieldCheck, Calendar, FileText } from "lucide-react"

function formatRp(val?: number): string {
    return "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(val || 0)
}

interface SearchablePoSelectorProps {
    availablePos: any[]
    selectedPoId: string
    selectedPoItemId: string
    onSelectPo: (po: any, item: any) => void
    onClearPo: () => void
    locations: any[]
    branchFilter: string
    onBranchFilterChange: (locId: string) => void
    isSuperAdmin: boolean
}

export function SearchablePoSelector({
    availablePos,
    selectedPoId,
    selectedPoItemId,
    onSelectPo,
    onClearPo,
    locations,
    branchFilter,
    onBranchFilterChange,
    isSuperAdmin,
}: SearchablePoSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("")

    // Filter POs based on branch filter and search query
    const filteredPos = useMemo(() => {
        return availablePos.filter((po) => {
            // Filter Cabang (jika dipilih)
            if (branchFilter && branchFilter !== "ALL" && po.locationId !== branchFilter) {
                return false
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const matchPo = po.po_number?.toLowerCase().includes(q)
                const matchSupplier = po.supplierName?.toLowerCase().includes(q)
                const matchLocation = po.locationName?.toLowerCase().includes(q)
                const matchItem = po.items.some((it: any) =>
                    it.itemName?.toLowerCase().includes(q)
                )

                if (!matchPo && !matchSupplier && !matchLocation && !matchItem) {
                    return false
                }
            }

            return true
        })
    }, [availablePos, branchFilter, searchQuery])

    const selectedPo = useMemo(() => {
        return availablePos.find((p) => p.id === selectedPoId)
    }, [availablePos, selectedPoId])

    const selectedItem = useMemo(() => {
        if (!selectedPo) return null
        return selectedPo.items.find((it: any) => it.id === selectedPoItemId) || selectedPo.items[0]
    }, [selectedPo, selectedPoItemId])

    return (
        <div className="space-y-2.5 rounded-lg border border-blue-200/90 bg-blue-50/20 p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Pilih Purchase Order (PO Semen Approved)
                </label>

                {/* Filter Cabang untuk SuperAdmin */}
                {isSuperAdmin && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 whitespace-nowrap">Filter Cabang:</span>
                        <Select value={branchFilter} onValueChange={onBranchFilterChange}>
                            <SelectTrigger className="h-7 w-[140px] text-xs bg-white border-slate-200">
                                <SelectValue placeholder="Semua Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL" className="text-xs">Semua Cabang</SelectItem>
                                {locations.map((loc) => (
                                    <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                        {loc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Selected PO Summary (jika sudah terpilih) */}
            {selectedPo ? (
                <div className="rounded-md border border-blue-300 bg-white p-3 shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-blue-700">
                                    {selectedPo.po_number}
                                </span>
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0">
                                    {selectedPo.locationName}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                                Vendor: <strong className="text-slate-800">{selectedPo.supplierName}</strong> • Terbit: {selectedPo.tanggal_terbit}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClearPo}
                            className="h-7 px-2 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Ganti PO
                        </Button>
                    </div>

                    {/* Jika PO punya lebih dari 1 item semen */}
                    {selectedPo.items.length > 1 ? (
                        <div className="pt-2 border-t border-slate-100">
                            <label className="text-[11px] font-medium text-slate-600 block mb-1">
                                Pilih Item Semen dari PO:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {selectedPo.items.map((it: any) => {
                                    const isItemActive = selectedPoItemId === it.id
                                    return (
                                        <button
                                            key={it.id}
                                            type="button"
                                            onClick={() => onSelectPo(selectedPo, it)}
                                            className={`text-left p-2 rounded border text-xs transition-colors cursor-pointer ${
                                                isItemActive
                                                    ? "border-blue-500 bg-blue-50/60 font-medium text-blue-900"
                                                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                                            }`}
                                        >
                                            <div className="font-semibold">{it.itemName}</div>
                                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                                Sisa: <strong className="text-blue-700">{it.remainingQty} {it.satuan}</strong> @ {formatRp(it.harga_satuan)}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        selectedItem && (
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 p-2 rounded font-mono">
                                <div>
                                    <span className="font-semibold text-slate-800">{selectedItem.itemName}</span>
                                    <span className="text-slate-500 ml-1.5 font-normal">
                                        (Total Pesan: {selectedItem.quantity} {selectedItem.satuan})
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-blue-700 font-bold">
                                        Sisa: {selectedItem.remainingQty} {selectedItem.satuan}
                                    </span>
                                </div>
                            </div>
                        )
                    )}
                </div>
            ) : (
                /* Search Box & PO List */
                <div className="space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="Ketik nomor PO (misal: 928), nama vendor, atau jenis semen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8 text-xs bg-white border-slate-200"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* PO List */}
                    <div className="max-h-[190px] overflow-y-auto space-y-1.5 pr-1">
                        {filteredPos.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-500 bg-white rounded border border-dashed border-slate-200">
                                {availablePos.length === 0
                                    ? "Tidak ada PO Semen Approved dengan sisa penerimaan."
                                    : "Tidak ada PO yang cocok dengan kriteria pencarian / filter cabang."}
                            </div>
                        ) : (
                            filteredPos.map((po) => {
                                const firstItem = po.items[0]
                                return (
                                    <div
                                        key={po.id}
                                        onClick={() => onSelectPo(po, firstItem)}
                                        className="p-2.5 rounded-md border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer shadow-2xs space-y-1"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-xs font-bold text-slate-900">
                                                    {po.po_number}
                                                </span>
                                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0">
                                                    {po.locationName}
                                                </Badge>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                {po.tanggal_terbit}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600 truncate max-w-[280px]">
                                                {po.supplierName} • {firstItem?.itemName || "Semen"}
                                            </span>
                                            {firstItem && (
                                                <span className="font-mono font-semibold text-blue-700 whitespace-nowrap">
                                                    Sisa: {firstItem.remainingQty} {firstItem.satuan}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
