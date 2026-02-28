"use client"

import { useEffect, useState, useTransition } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Mountain, ShoppingCart } from "lucide-react"
import { createAggregateIncoming, updateAggregateIncoming } from "./actions"
import { AggregateInRow, AGGREGATE_TYPE_OPTIONS } from "./columns"
import { cn } from "@/lib/utils"

type Props = {
    isOpen: boolean
    initialData: AggregateInRow | null
    locations: { id: string; name: string }[]
    userRole: string
    onSuccess: () => void
    onCancel: () => void
}

export function MaterialAgregatForm({
    isOpen,
    initialData,
    locations,
    userRole,
    onSuccess,
    onCancel,
}: Props) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [sourceType, setSourceType] = useState<string>("Internal")

    useEffect(() => {
        if (isOpen) {
            setError(null)
            setSourceType(initialData?.source_type ?? "Internal")
        }
    }, [isOpen, initialData])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        const form = e.currentTarget
        const formData = new FormData(form)

        startTransition(async () => {
            const result = initialData
                ? await updateAggregateIncoming(initialData.id, formData)
                : await createAggregateIncoming(formData)

            if (result?.error) {
                setError(result.error)
            } else {
                onSuccess()
            }
        })
    }

    const isEdit = !!initialData

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Data Material" : "Tambah Material Masuk"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tanggal & Jenis Material */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="date">Tanggal *</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                defaultValue={initialData?.date ?? new Date().toISOString().split("T")[0]}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Jenis Material *</Label>
                            <Select name="aggregate_type" defaultValue={initialData?.aggregate_type ?? "SplitHalfOne"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {AGGREGATE_TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Sumber Material */}
                    <div className="space-y-1.5">
                        <Label>Sumber Material *</Label>
                        <input type="hidden" name="source_type" value={sourceType} />
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setSourceType("Internal")}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                                    sourceType === "Internal"
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                                )}
                            >
                                <Mountain className="h-4 w-4" />
                                <span>Internal (Quarry)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSourceType("External")}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                                    sourceType === "External"
                                        ? "border-amber-500 bg-amber-50 text-amber-700"
                                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                                )}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                <span>Eksternal (Beli)</span>
                            </button>
                        </div>
                    </div>

                    {/* Supplier — only when External */}
                    {sourceType === "External" && (
                        <div className="space-y-1.5">
                            <Label htmlFor="supplier">Nama Supplier *</Label>
                            <Input
                                id="supplier"
                                name="supplier"
                                placeholder="Nama pemasok / supplier"
                                defaultValue={initialData?.supplier ?? ""}
                                required
                            />
                        </div>
                    )}

                    {/* No Bon & Volume */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="no_bon">No Bon / DO *</Label>
                            <Input
                                id="no_bon"
                                name="no_bon"
                                placeholder="Nomor bon / surat jalan"
                                defaultValue={initialData?.no_bon ?? ""}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="volume_cubic">Volume (m³) *</Label>
                            <Input
                                id="volume_cubic"
                                name="volume_cubic"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                defaultValue={initialData?.volume_cubic ?? ""}
                                required
                            />
                        </div>
                    </div>

                    {/* Sopir & Plat */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="driver_name">Nama Sopir *</Label>
                            <Input
                                id="driver_name"
                                name="driver_name"
                                placeholder="Nama sopir"
                                defaultValue={initialData?.driver_name ?? ""}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="plate_number">Plat Kendaraan *</Label>
                            <Input
                                id="plate_number"
                                name="plate_number"
                                placeholder="DD 1234 AB"
                                defaultValue={initialData?.plate_number ?? ""}
                                required
                            />
                        </div>
                    </div>

                    {/* Cabang — SuperAdmin only */}
                    {userRole === "SuperAdminBP" && (
                        <div className="space-y-1.5">
                            <Label>Cabang *</Label>
                            <Select name="locationId" defaultValue={initialData?.locationId ?? ""}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih cabang..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Catatan */}
                    <div className="space-y-1.5">
                        <Label htmlFor="notes">Catatan</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Catatan tambahan (opsional)"
                            rows={2}
                            defaultValue={initialData?.notes ?? ""}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Simpan Perubahan" : "Tambah Data"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
