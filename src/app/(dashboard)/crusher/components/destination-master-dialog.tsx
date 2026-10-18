"use client"

import { useState, useTransition } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CrusherDestinationItem } from "../types"
import { saveCrusherDestination } from "../actions"
import { toast } from "sonner"
import { MapPin, Plus, Loader2 } from "lucide-react"

type Props = {
    isOpen: boolean
    onClose: () => void
    locationId?: string
    onDestinationAdded?: (newDest: CrusherDestinationItem) => void
    onRefresh?: () => void
}

export function DestinationMasterDialog({
    isOpen,
    onClose,
    locationId,
    onDestinationAdded,
    onRefresh,
}: Props) {
    const [isPending, startTransition] = useTransition()
    const [name, setName] = useState("")
    const [distanceKm, setDistanceKm] = useState("")
    const [address, setAddress] = useState("")
    const [contactPerson, setContactPerson] = useState("")
    const [phone, setPhone] = useState("")
    const [notes, setNotes] = useState("")

    const handleSave = () => {
        if (!name.trim()) {
            toast.error("Nama tujuan / proyek / pembeli wajib diisi")
            return
        }
        const parsedDistance = parseFloat(distanceKm.replace(",", "."))
        if (isNaN(parsedDistance) || parsedDistance < 0) {
            toast.error("Estimasi jarak tempuh (KM) harus berupa angka valid (>= 0)")
            return
        }

        startTransition(async () => {
            try {
                const res = await saveCrusherDestination({
                    name: name.trim(),
                    distance_km: parsedDistance,
                    address: address.trim() || undefined,
                    contact_person: contactPerson.trim() || undefined,
                    phone: phone.trim() || undefined,
                    notes: notes.trim() || undefined,
                    locationId: locationId || undefined,
                })

                toast.success(`Tujuan "${name}" (${parsedDistance} KM) berhasil disimpan`)
                
                if (onDestinationAdded && res?.destination) {
                    onDestinationAdded(res.destination)
                }

                setName("")
                setDistanceKm("")
                setAddress("")
                setContactPerson("")
                setPhone("")
                setNotes("")

                if (onRefresh) onRefresh()
                onClose()
            } catch (err: any) {
                toast.error(err.message || "Gagal menyimpan data tujuan")
            }
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                        Tambah Master Tujuan Non-BP
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3.5 py-2">
                    <p className="text-xs text-slate-500">
                        Simpan titik lokasi atau proyek pengiriman non-BP agar dapat dipilih kembali secara cepat dengan estimasi jarak otomatis.
                    </p>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Nama Tujuan / Proyek / Customer *</Label>
                        <Input
                            placeholder="Contoh: Proyek Jembatan Koya, TB Sinar Sentosa"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-9 text-xs bg-white dark:bg-slate-900"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Estimasi Jarak Tempuh (KM) *</Label>
                        <Input
                            type="number"
                            step="0.5"
                            inputMode="decimal"
                            placeholder="Contoh: 18.5"
                            value={distanceKm}
                            onChange={(e) => setDistanceKm(e.target.value)}
                            className="h-9 text-xs bg-white dark:bg-slate-900 font-bold text-emerald-700 dark:text-emerald-400"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Alamat / Patokan Lokasi (Opsional)</Label>
                        <Input
                            placeholder="Contoh: Jl. Raya Holtekamp KM 9 dekat pos polisi"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="h-9 text-xs bg-white dark:bg-slate-900"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">PIC / Penerima</Label>
                            <Input
                                placeholder="Pak Hasan"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">No. Telepon / WA</Label>
                            <Input
                                placeholder="0812xxxx"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="h-9 text-xs bg-white dark:bg-slate-900"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Catatan (Opsional)</Label>
                        <Textarea
                            placeholder="Catatan kondisi jalan, kapasitas muat, dll."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="text-xs bg-white dark:bg-slate-900"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isPending}
                            className="h-9 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSave}
                            disabled={isPending}
                            className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                        >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            Simpan & Gunakan
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
