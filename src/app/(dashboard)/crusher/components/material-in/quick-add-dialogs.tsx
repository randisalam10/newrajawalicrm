"use client"

import { useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { quickAddDriver, quickAddVehicle } from "../../actions"

type DriverProps = {
    open: boolean
    initialName: string
    locationId?: string
    onOpenChange: (open: boolean) => void
    onCreated: (name: string) => void
}

export function QuickAddDriverDialog({ open, initialName, locationId, onOpenChange, onCreated }: DriverProps) {
    const [name, setName] = useState(initialName)
    const [isPending, start] = useTransition()

    useEffect(() => {
        if (open) setName(initialName)
    }, [open, initialName])

    const save = () => {
        if (!name.trim()) return void toast.error("Nama sopir wajib diisi")
        start(async () => {
            try {
                const res = await quickAddDriver(name.trim(), locationId)
                toast.success(`Sopir "${res.driver.name}" ditambahkan ke master`)
                onCreated(res.driver.name)
                onOpenChange(false)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal menambah sopir")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm p-4">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">Tambah Sopir ke Master</DialogTitle>
                </DialogHeader>
                <div className="space-y-1 py-1">
                    <Label htmlFor="qa-driver-name" className="text-xs">Nama lengkap sopir</Label>
                    <Input id="qa-driver-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Hendrik" className="h-9 text-sm" />
                </div>
                <DialogFooter className="flex-row gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="flex-1">Batal</Button>
                    <Button type="button" size="sm" onClick={save} disabled={isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Sopir"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

type VehicleProps = {
    open: boolean
    locationId?: string
    onOpenChange: (open: boolean) => void
    onCreated: (plate: string) => void
}

export function QuickAddVehicleDialog({ open, locationId, onOpenChange, onCreated }: VehicleProps) {
    const [plate, setPlate] = useState("")
    const [size, setSize] = useState<"BESAR" | "KECIL">("BESAR")
    const [isPending, start] = useTransition()

    const save = () => {
        if (!plate.trim()) return void toast.error("Plat nomor wajib diisi")
        start(async () => {
            try {
                const res = await quickAddVehicle({ plate_number: plate.trim(), dump_truck_size: size, locationId })
                toast.success(`Truk "${res.vehicle.plate_number}" ditambahkan ke master`)
                onCreated(res.vehicle.plate_number)
                setPlate("")
                onOpenChange(false)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal menambah truk")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm p-4">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold">Tambah Truk ke Master</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-1">
                    <div className="space-y-1">
                        <Label htmlFor="qa-plate" className="text-xs">Plat nomor</Label>
                        <Input id="qa-plate" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Contoh: DA 9041 AD" className="h-9 text-sm uppercase" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Ukuran dump truck</Label>
                        <Select value={size} onValueChange={(v) => setSize(v === "KECIL" ? "KECIL" : "BESAR")}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BESAR">Dump Truck Besar</SelectItem>
                                <SelectItem value="KECIL">Dump Truck Kecil</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="flex-row gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="flex-1">Batal</Button>
                    <Button type="button" size="sm" onClick={save} disabled={isPending} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Truk"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
