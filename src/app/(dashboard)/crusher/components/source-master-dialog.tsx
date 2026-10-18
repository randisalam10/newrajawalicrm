"use client"

import { useState, useTransition } from "react"
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
import { CrusherMaterialSourceItem } from "../types"
import { saveCrusherMaterialSource, deleteCrusherMaterialSource } from "../actions"
import { toast } from "sonner"
import { Trash2, Plus, MapPin, Loader2 } from "lucide-react"

type Props = {
    isOpen: boolean
    onClose: () => void
    sources: CrusherMaterialSourceItem[]
    onRefresh: () => void
}

export function SourceMasterDialog({ isOpen, onClose, sources, onRefresh }: Props) {
    const [isPending, startTransition] = useTransition()
    const [name, setName] = useState("")
    const [defaultDistance, setDefaultDistance] = useState("")
    const [description, setDescription] = useState("")

    const handleAdd = () => {
        if (!name.trim()) {
            toast.error("Nama sumber material wajib diisi")
            return
        }

        startTransition(async () => {
            try {
                await saveCrusherMaterialSource({
                    name: name.trim(),
                    default_distance_km: Number(defaultDistance) || 0,
                    description: description.trim() || undefined,
                })
                toast.success("Sumber material berhasil disimpan")
                setName("")
                setDefaultDistance("")
                setDescription("")
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal menyimpan sumber")
            }
        })
    }

    const handleDelete = (id: string, sourceName: string) => {
        if (!confirm(`Hapus sumber "${sourceName}"?`)) return
        startTransition(async () => {
            try {
                await deleteCrusherMaterialSource(id)
                toast.success("Sumber material dinonaktifkan")
                onRefresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal menghapus")
            }
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                        Master Sumber Material & Jarak
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Form Tambah Baru */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                        <div className="text-xs font-semibold text-slate-700">Tambah Sumber Baru</div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Nama Titik Ambil / Quarry</Label>
                            <Input
                                placeholder="Contoh: Kali Harapan, Sungai Tami"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-9 text-xs bg-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Default Jarak (KM)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    inputMode="decimal"
                                    placeholder="12.5"
                                    value={defaultDistance}
                                    onChange={(e) => setDefaultDistance(e.target.value)}
                                    className="h-9 text-xs bg-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Catatan (Opsional)</Label>
                                <Input
                                    placeholder="Batu kali bulat"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="h-9 text-xs bg-white"
                                />
                            </div>
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            onClick={handleAdd}
                            disabled={isPending}
                            className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            Simpan Sumber Baru
                        </Button>
                    </div>

                    {/* Daftar Sumber Tersimpan */}
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-600">Daftar Sumber Aktif:</div>
                        {sources.length === 0 ? (
                            <div className="text-xs text-slate-400 py-3 text-center italic">
                                Belum ada data sumber material.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                                {sources.map((s) => (
                                    <div key={s.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50">
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-900 truncate">{s.name}</div>
                                            <div className="text-[11px] text-slate-500">
                                                Jarak: <span className="font-semibold text-emerald-700">{s.default_distance_km} KM</span>
                                                {s.description ? ` • ${s.description}` : ""}
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(s.id, s.name)}
                                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 text-xs w-full">
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
