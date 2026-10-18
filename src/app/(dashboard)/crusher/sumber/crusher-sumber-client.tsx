"use client"

import { useState, useTransition } from "react"
import { CrusherMaterialSourceItem } from "../types"
import { CrusherPageHeader } from "../components/crusher-page-header"
import { saveCrusherMaterialSource, deleteCrusherMaterialSource, getCrusherMaterialSources } from "../actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { MapPin, Plus, Trash2, Loader2 } from "lucide-react"

type Props = {
    initialSources: CrusherMaterialSourceItem[]
    locationName: string
    locations?: { id: string; name: string }[]
    locationId?: string
}

export function CrusherSumberClient({ initialSources, locationName, locations, locationId }: Props) {
    const [sources, setSources] = useState<CrusherMaterialSourceItem[]>(initialSources)
    const [isPending, startTransition] = useTransition()

    const [name, setName] = useState("")
    const [defaultDistance, setDefaultDistance] = useState("")
    const [description, setDescription] = useState("")

    const refreshSources = async () => {
        try {
            const updated = await getCrusherMaterialSources()
            setSources(updated)
        } catch (err) {
            console.error("Gagal refresh master sumber", err)
        }
    }

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
                toast.success(`Sumber "${name}" berhasil disimpan`)
                setName("")
                setDefaultDistance("")
                setDescription("")
                await refreshSources()
            } catch (err: any) {
                toast.error(err.message || "Gagal menyimpan sumber")
            }
        })
    }

    const handleDelete = (id: string, sName: string) => {
        if (!confirm(`Hapus sumber material "${sName}"?`)) return

        startTransition(async () => {
            try {
                await deleteCrusherMaterialSource(id)
                toast.success(`Sumber "${sName}" dinonaktifkan`)
                await refreshSources()
            } catch (err: any) {
                toast.error(err.message || "Gagal menghapus")
            }
        })
    }

    return (
        <div className="space-y-3.5 w-full">
            <CrusherPageHeader
                title="Master Sumber Material & Jarak"
                subtitle="Daftar lokasi pengambilan (quarry/kali) dengan default jarak KM untuk shortcut input cepat"
                selectedDate=""
                locationName={locationName}
                locations={locations}
                selectedLocationId={locationId}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Form Tambah Sumber */}
                <div className="md:col-span-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 h-fit">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Plus className="h-4 w-4 text-emerald-600" />
                        <span>Tambah Sumber Baru</span>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Nama Titik Ambil / Quarry</Label>
                        <Input
                            placeholder="Contoh: Kali Harapan, Sungai Tami"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Default Jarak Tempuh (KM)</Label>
                        <Input
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            placeholder="12.5"
                            value={defaultDistance}
                            onChange={(e) => setDefaultDistance(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Catatan / Jenis Material Mentah</Label>
                        <Input
                            placeholder="Batu kali bulat / boulder"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>

                    <Button
                        type="button"
                        onClick={handleAdd}
                        disabled={isPending}
                        className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                    >
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Simpan Sumber Material
                    </Button>
                </div>

                {/* List Sumber Material Tersimpan */}
                <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <MapPin className="h-4 w-4 text-emerald-600" />
                            <span>Daftar Sumber Material Aktif</span>
                        </div>
                        <span className="text-xs text-slate-500 font-semibold">{sources.length} Sumber</span>
                    </div>

                    {sources.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-lg">
                            Belum ada sumber material yang terdaftar.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                            {sources.map((s) => (
                                <div key={s.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-900">{s.name}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            Default Jarak: <span className="font-bold text-emerald-700">{s.default_distance_km} KM</span>
                                            {s.description ? ` • ${s.description}` : ""}
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(s.id, s.name)}
                                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
