"use client"

import React, { useState, useTransition } from "react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Truck, CheckCircle2, Info, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { confirmMaterialReceiptInBP } from "@/app/(dashboard)/crusher/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TransferSCTabProps {
    transfers: any[]
    canManage: boolean
    userLocationId?: string | null
}

export function TransferSCTab({
    transfers,
    canManage,
    userLocationId,
}: TransferSCTabProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null)
    const [noBon, setNoBon] = useState("")
    const [volumeM3, setVolumeM3] = useState("")
    const [notes, setNotes] = useState("")

    const handleOpenReceiveModal = (t: any) => {
        setSelectedTransfer(t)
        setNoBon("")
        setVolumeM3(String(t.volume_m3 || ""))
        setNotes(t.notes || "")
    }

    const handleConfirmReceive = () => {
        if (!selectedTransfer) return

        startTransition(async () => {
            try {
                const res = await confirmMaterialReceiptInBP(selectedTransfer.id, {
                    bpLocationId: userLocationId || undefined,
                    noBon: noBon.trim() || undefined,
                    receivedVolumeM3: parseFloat(volumeM3) || selectedTransfer.volume_m3,
                    notes: notes.trim() || undefined,
                })
                if (res.success) {
                    toast.success("Material berhasil diterima!", {
                        description: `Stok ${selectedTransfer.material_name} telah masuk ke data penerimaan agregat BP.`,
                    })
                    setSelectedTransfer(null)
                    router.refresh()
                }
            } catch (err: any) {
                toast.error("Gagal menerima material", {
                    description: err?.message || "Terjadi kesalahan saat memproses penerimaan.",
                })
            }
        })
    }

    if (transfers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Tidak Ada Pengiriman Masuk Baru</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Semua material agregat dari Stone Crusher sudah tercatat diterima di stok Batching Plant.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>
                        Informasi Pengiriman: Terdapat <strong>{transfers.length}</strong> kiriman material dari Stone Crusher yang siap dicatat ke stok penerimaan BP.
                    </span>
                </div>
                <span className="text-[11px] text-blue-700 font-medium">Klik Terima untuk memasukkan nomor bon fisik</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="text-xs font-semibold">Tgl Kirim</TableHead>
                                <TableHead className="text-xs font-semibold">Asal SC</TableHead>
                                <TableHead className="text-xs font-semibold">Tujuan BP</TableHead>
                                <TableHead className="text-xs font-semibold">Kendaraan & Sopir</TableHead>
                                <TableHead className="text-xs font-semibold">Material</TableHead>
                                <TableHead className="text-xs font-semibold text-right">Volume</TableHead>
                                <TableHead className="text-xs font-semibold text-center">Status Info</TableHead>
                                <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transfers.map((t) => {
                                const sendDate = t.report?.date ? new Date(t.report.date) : new Date(t.createdAt)
                                return (
                                    <TableRow key={t.id} className="hover:bg-slate-50/70 transition-colors">
                                        <TableCell className="text-xs font-medium text-slate-700 whitespace-nowrap">
                                            {format(sendDate, "dd MMM yyyy", { locale: idLocale })}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-600 font-medium">
                                            {t.report?.location?.name || "Stone Crusher"}
                                        </TableCell>
                                        <TableCell className="text-xs font-semibold text-blue-700">
                                            {t.targetLocation?.name || "Batching Plant"}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <div className="font-mono font-medium text-slate-800">{t.plate_number || t.truck_plate || "-"}</div>
                                            <div className="text-[11px] text-slate-500">{t.driver_name || "-"}</div>
                                        </TableCell>
                                        <TableCell className="text-xs font-semibold text-slate-900">
                                            {t.material_name}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono font-bold text-slate-900 text-right">
                                            {Number(t.volume_m3).toLocaleString("id-ID")} m³
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold gap-1">
                                                <Truck className="h-3 w-3" />
                                                Siap Diterima
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {canManage && (
                                                <Button
                                                    size="sm"
                                                    disabled={isPending}
                                                    onClick={() => handleOpenReceiveModal(t)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 gap-1.5 shadow-xs"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Terima Agregat
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Dialog Penerimaan Agregat & Input Nomor Bon */}
            <Dialog open={Boolean(selectedTransfer)} onOpenChange={(open) => { if (!open) setSelectedTransfer(null) }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span>Penerimaan Agregat Stone Crusher</span>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedTransfer && (
                        <div className="space-y-3 py-2 text-xs">
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Material:</span>
                                    <span className="font-bold text-slate-800">{selectedTransfer.material_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Asal Crusher:</span>
                                    <span className="font-medium text-slate-800">{selectedTransfer.report?.location?.name || "Stone Crusher"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Armada / Sopir:</span>
                                    <span className="font-mono text-slate-800">{selectedTransfer.plate_number || "-"} • {selectedTransfer.driver_name || "-"}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="no_bon_input" className="text-xs font-semibold">
                                    Nomor Bon / Surat Jalan Fisik
                                </Label>
                                <Input
                                    id="no_bon_input"
                                    placeholder="Contoh: BON-1234 atau SJ-0045"
                                    value={noBon}
                                    onChange={(e) => setNoBon(e.target.value)}
                                    className="h-8 text-xs font-mono uppercase bg-white"
                                />
                                <span className="text-[10px] text-slate-400">
                                    Masukkan nomor bon fisik yang dibawa oleh sopir saat tiba di plant.
                                </span>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="volume_input" className="text-xs font-semibold">
                                    Volume Riil Diterima (m³)
                                </Label>
                                <Input
                                    id="volume_input"
                                    type="number"
                                    step="0.1"
                                    value={volumeM3}
                                    onChange={(e) => setVolumeM3(e.target.value)}
                                    className="h-8 text-xs font-mono bg-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="notes_input" className="text-xs font-semibold">
                                    Catatan Penerimaan (opsional)
                                </Label>
                                <Input
                                    id="notes_input"
                                    placeholder="Catatan kondisi material atau serah terima..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="h-8 text-xs bg-white"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => setSelectedTransfer(null)}
                            className="h-8 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isPending}
                            onClick={handleConfirmReceive}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                            {isPending ? "Memproses..." : "Terima & Catat ke Stok"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
