"use client"

import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { updatePendingTransaction } from "../actions"
import { Edit } from "lucide-react"

interface RetaseEditModalProps {
    isOpen: boolean
    onClose: () => void
    transaction: any | null
    productionMasters: any
}

export function RetaseEditModal({
    isOpen,
    onClose,
    transaction,
    productionMasters,
}: RetaseEditModalProps) {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)

    const [tripSequence, setTripSequence] = useState<number>(1)
    const [date, setDate] = useState<string>("")
    const [projectId, setProjectId] = useState<string>("")
    const [qualityId, setQualityId] = useState<string>("")
    const [volumeCubic, setVolumeCubic] = useState<string>("6")
    const [slump, setSlump] = useState<string>("12 ± 2")
    const [vehicleId, setVehicleId] = useState<string>("")
    const [driverId, setDriverId] = useState<string>("")
    const [operatorId, setOperatorId] = useState<string>("")
    const [workItemId, setWorkItemId] = useState<string>("")

    useEffect(() => {
        if (transaction) {
            setTripSequence(transaction.trip_sequence ?? 1)
            setVolumeCubic(String(transaction.volume_cubic ?? 6))
            setSlump(transaction.slump || "12 ± 2")
            setProjectId(transaction.projectId || "")
            setQualityId(transaction.qualityId || "")
            setVehicleId(transaction.vehicleId || "")
            setDriverId(transaction.driverId || "")
            setOperatorId(transaction.operatorId || "")
            setWorkItemId(transaction.workItemId || "")

            if (transaction.date) {
                try {
                    const dt = new Date(transaction.date)
                    const pad = (n: number) => n.toString().padStart(2, "0")
                    const y = dt.getFullYear()
                    const m = pad(dt.getMonth() + 1)
                    const d = pad(dt.getDate())
                    const h = pad(dt.getHours())
                    const min = pad(dt.getMinutes())
                    setDate(`${y}-${m}-${d}T${h}:${min}`)
                } catch {
                    setDate("")
                }
            } else {
                setDate("")
            }
        }
    }, [transaction])

    if (!transaction) return null

    const {
        projects = [],
        qualities = [],
        vehicles = [],
        drivers = [],
        operators = [],
        workItems = [],
    } = productionMasters || {}

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!projectId || !qualityId || !vehicleId || !driverId || !workItemId) {
            toast({
                title: "Data Belum Lengkap",
                description: "Pastikan Proyek, Mutu, Truk Mixer, Supir, dan Item Pekerjaan telah dipilih.",
                variant: "destructive",
            })
            return
        }

        const vol = Number(volumeCubic)
        if (isNaN(vol) || vol <= 0) {
            toast({
                title: "Volume Tidak Valid",
                description: "Volume cor harus lebih besar dari 0 M³.",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)
        const formData = new FormData()
        formData.append("id", transaction.id)
        formData.append("trip_sequence", String(tripSequence))
        if (date) formData.append("date", date)
        formData.append("projectId", projectId)
        formData.append("qualityId", qualityId)
        formData.append("volume_cubic", String(vol))
        formData.append("slump", slump)
        formData.append("vehicleId", vehicleId)
        formData.append("driverId", driverId)
        if (operatorId) formData.append("operatorId", operatorId)
        formData.append("workItemId", workItemId)

        const res = await updatePendingTransaction(formData)
        setIsLoading(false)

        if (res.error) {
            toast({
                title: "Gagal Mengubah Transaksi",
                description: res.error,
                variant: "destructive",
            })
        } else {
            toast({
                title: "Berhasil Diperbarui",
                description: `Transaksi TM-${tripSequence} berhasil disimpan dan dicatat ke Audit Log.`,
            })
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-900">
                        <Edit className="w-5 h-5 text-blue-600" />
                        Edit Transaksi Produksi / Tiket
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Koreksi nomor ritase, mutu, volume, armada, atau supir sebelum surat jalan dikonfirmasi. Perubahan akan dicatat di Audit Log.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Ritase (TM Ke) *</Label>
                            <Input
                                type="number"
                                min={1}
                                value={tripSequence}
                                onChange={(e) => setTripSequence(Number(e.target.value) || 1)}
                                className="h-9 text-sm font-bold"
                                placeholder="Contoh: 1"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Tanggal & Jam *</Label>
                            <Input
                                type="datetime-local"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs font-semibold">Customer & Proyek *</Label>
                            <Select value={projectId} onValueChange={setProjectId}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Pilih Proyek" />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                    {projects.map((p: any) => (
                                        <SelectItem key={p.id} value={p.id} className="text-xs">
                                            {p.customer?.customer_name ? `${p.customer.customer_name} - ` : ""}{p.name}
                                        </SelectItem>
                                    ))}
                                    {projectId && !projects.some((p: any) => p.id === projectId) && (
                                        <SelectItem value={projectId} className="text-xs">
                                            {transaction.project?.customer?.customer_name ? `${transaction.project.customer.customer_name} - ` : ""}
                                            {transaction.project?.name || "Proyek Terpilih"}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Mutu Beton *</Label>
                            <Select value={qualityId} onValueChange={setQualityId}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Pilih Mutu" />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                    {qualities.map((q: any) => (
                                        <SelectItem key={q.id} value={q.id} className="text-xs">
                                            {q.name}
                                        </SelectItem>
                                    ))}
                                    {qualityId && !qualities.some((q: any) => q.id === qualityId) && (
                                        <SelectItem value={qualityId} className="text-xs">
                                            {transaction.concreteQuality?.name || "Mutu Terpilih"}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Volume (M³) *</Label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={volumeCubic}
                                onChange={(e) => setVolumeCubic(e.target.value)}
                                className="h-9 text-xs font-semibold"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Slump *</Label>
                            <Input
                                type="text"
                                value={slump}
                                onChange={(e) => setSlump(e.target.value)}
                                className="h-9 text-xs"
                                placeholder="Contoh: 12 ± 2"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Item Pekerjaan *</Label>
                            <Select value={workItemId} onValueChange={setWorkItemId}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Pilih Item Pekerjaan" />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                    {workItems.map((w: any) => (
                                        <SelectItem key={w.id} value={w.id} className="text-xs">
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                    {workItemId && !workItems.some((w: any) => w.id === workItemId) && (
                                        <SelectItem value={workItemId} className="text-xs">
                                            {transaction.workItem?.name || "Item Terpilih"}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Armada Mixer *</Label>
                            <Select value={vehicleId} onValueChange={setVehicleId}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Pilih Mixer" />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                    {vehicles.map((v: any) => (
                                        <SelectItem key={v.id} value={v.id} className="text-xs">
                                            {v.code} - {v.plate_number}
                                        </SelectItem>
                                    ))}
                                    {vehicleId && !vehicles.some((v: any) => v.id === vehicleId) && (
                                        <SelectItem value={vehicleId} className="text-xs">
                                            {transaction.vehicle?.code} - {transaction.vehicle?.plate_number}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Supir *</Label>
                            <Select value={driverId} onValueChange={setDriverId}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Pilih Supir" />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                    {drivers.map((d: any) => (
                                        <SelectItem key={d.id} value={d.id} className="text-xs">
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                    {driverId && !drivers.some((d: any) => d.id === driverId) && (
                                        <SelectItem value={driverId} className="text-xs">
                                            {transaction.driver?.name || "Supir Terpilih"}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs font-semibold">Operator Batching Plant</Label>
                            <Select value={operatorId} onValueChange={setOperatorId}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Pilih Operator (Opsional)" />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                    {operators.map((o: any) => (
                                        <SelectItem key={o.id} value={o.id} className="text-xs">
                                            {o.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="pt-2 gap-2 sm:gap-0">
                        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                            Batal
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
