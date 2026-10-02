"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Trash2,
    Truck,
    Sparkles,
    Zap,
    Loader2,
    Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface POItemsTableCardProps {
    selectedSupplierId: string
    poItems: any[]
    setPoItems: React.Dispatch<React.SetStateAction<any[]>>
    totalHarga: number
    updatingItemId: string | null
    onQuickUpdateFromRow: (item: any) => Promise<void>
    onOpenShortcutModalWithItem: (item: any) => void
}

export function POItemsTableCard({
    selectedSupplierId,
    poItems,
    setPoItems,
    totalHarga,
    updatingItemId,
    onQuickUpdateFromRow,
    onOpenShortcutModalWithItem,
}: POItemsTableCardProps) {
    if (!selectedSupplierId) {
        return (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <Info className="w-8 h-8 mb-2 opacity-50" />
                <p>Pilih Toko / Supplier pada form di atas terlebih dahulu.</p>
            </div>
        )
    }

    if (poItems.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500">
                Belum ada rincian barang. Silakan pilih dan tambah barang di atas.
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                    <tr>
                        <th className="py-2.5 px-4 text-left font-semibold text-slate-600">Info Barang</th>
                        <th className="py-2.5 px-4 text-left font-semibold text-slate-600 w-44">Unit Kendaraan / Alat</th>
                        <th className="py-2.5 px-4 text-center font-semibold text-slate-600 w-28">KM / HM</th>
                        <th className="py-2.5 px-4 text-center font-semibold text-slate-600 w-20">Qty</th>
                        <th className="py-2.5 px-4 text-left font-semibold text-slate-600 w-16">Satuan</th>
                        <th className="py-2.5 px-4 text-right font-semibold text-slate-600 w-36">Harga Satuan</th>
                        <th className="py-2.5 px-4 text-left font-semibold text-slate-600">Keterangan</th>
                        <th className="py-2.5 px-4 text-right font-semibold text-slate-600 w-32">Total Harga</th>
                        <th className="py-2.5 px-4 w-10"></th>
                    </tr>
                </thead>
                <tbody>
                    {poItems.map((item) => (
                        <tr key={item.cartId} className="border-b hover:bg-slate-50/50 text-xs">
                            <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900">{item.name}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                    Part: {item.part_number || "-"} | Merk: {item.merk || "-"}
                                </div>
                            </td>
                            <td className="py-2 px-4">
                                {item.vehicleCode ? (
                                    <div>
                                        <div className="font-bold text-slate-800 font-mono flex items-center gap-1 text-xs">
                                            <Truck className="w-3 h-3 text-blue-600" />
                                            {item.vehicleCode}
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                            {item.vehiclePlate} {item.vehicleCategory ? `(${item.vehicleCategory})` : ""}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                )}
                            </td>
                            <td className="py-2 px-4 text-center font-mono">
                                {item.km_hm ? (
                                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold text-slate-700 text-[11px]">
                                        {item.km_hm}
                                    </span>
                                ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                )}
                            </td>
                            <td className="py-2 px-4">
                                <Input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value={item.quantity}
                                    onChange={e => setPoItems(poItems.map(i => i.cartId === item.cartId ? { ...i, quantity: Number(e.target.value) } : i))}
                                    className="w-16 text-center h-8 mx-auto"
                                />
                            </td>
                            <td className="py-2 px-4 text-slate-600">{item.satuan}</td>
                            <td className="py-2 px-4">
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <span className="text-xs text-slate-400 font-medium">Rp</span>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={item.harga}
                                            onChange={e => {
                                                const val = Number(e.target.value) || 0
                                                setPoItems(poItems.map(i => i.cartId === item.cartId ? { ...i, harga: val } : i))
                                            }}
                                            className="w-28 text-right h-8 font-semibold text-xs text-slate-800"
                                        />
                                    </div>
                                    {Math.abs(item.harga - (item.masterHarga ?? item.harga)) > 0.001 ? (
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                item.harga > (item.masterHarga ?? 0) ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                                            )}>
                                                Master: Rp {Number(item.masterHarga).toLocaleString('id-ID')} ({item.harga > (item.masterHarga ?? 0) ? `▲ +${Math.round(((item.harga - (item.masterHarga ?? 1)) / (item.masterHarga ?? 1)) * 100)}%` : '▼ Turun'})
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <label className="flex items-center gap-1 text-[10px] bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-100 transition-colors whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.updateMasterPrice || false}
                                                        onChange={e => {
                                                            setPoItems(poItems.map(i => i.cartId === item.cartId ? { ...i, updateMasterPrice: e.target.checked } : i))
                                                        }}
                                                        className="rounded text-amber-600 focus:ring-amber-500 h-3 w-3"
                                                    />
                                                    <span>Auto-update di PO</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => onQuickUpdateFromRow(item)}
                                                    disabled={updatingItemId === item.cartId}
                                                    className="text-[10px] font-semibold bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded shadow-xs flex items-center gap-1 transition-all"
                                                    title="Langsung update database Master Barang sekarang"
                                                >
                                                    {updatingItemId === item.cartId ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                                                    Update Master
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => onOpenShortcutModalWithItem(item)}
                                            className="text-[10px] text-slate-400 hover:text-amber-600 flex items-center gap-0.5 font-medium transition-colors"
                                            title="Buka shortcut ubah harga master untuk barang ini"
                                        >
                                            <Sparkles className="w-2.5 h-2.5" /> Ubah Master
                                        </button>
                                    )}
                                </div>
                            </td>
                            <td className="py-2 px-4">
                                <Input
                                    placeholder="Contoh: Plat DT 8258 RI"
                                    value={item.keterangan}
                                    onChange={e => setPoItems(poItems.map(i => i.cartId === item.cartId ? { ...i, keterangan: e.target.value } : i))}
                                    className="h-8 text-xs"
                                />
                            </td>
                            <td className="py-2 px-4 text-right font-semibold whitespace-nowrap">
                                Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500"
                                    onClick={() => setPoItems(poItems.filter(i => i.cartId !== item.cartId))}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-slate-50/80">
                    <tr>
                        <td colSpan={5} className="py-4 px-4 text-right font-bold text-slate-700">TOTAL HARGA:</td>
                        <td className="py-4 px-4 text-right font-bold text-lg text-green-700 whitespace-nowrap">
                            Rp {totalHarga.toLocaleString('id-ID')}
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    )
}
