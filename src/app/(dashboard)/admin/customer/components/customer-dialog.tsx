"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
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
import { LocationItem, CustomerWithProjects } from "../types"

interface CustomerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editData: CustomerWithProjects | null
    locations: LocationItem[]
    userRole: string
    selectedSharedLocs: string[]
    onToggleSharedLoc: (id: string) => void
    onSubmit: (formData: FormData) => Promise<void>
}

export function CustomerDialog({
    open,
    onOpenChange,
    editData,
    locations,
    userRole,
    selectedSharedLocs,
    onToggleSharedLoc,
    onSubmit,
}: CustomerDialogProps) {
    const isEdit = Boolean(editData)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold text-slate-800">
                        {isEdit ? "Edit Customer" : "Tambah Customer Baru"}
                    </DialogTitle>
                </DialogHeader>
                <form
                    key={editData?.id || "new-customer"}
                    action={onSubmit}
                    className="space-y-4 mt-2"
                >
                    <div className="space-y-1.5">
                        <Label htmlFor="customer_name" className="text-xs">
                            Nama Customer <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="customer_name"
                            name="customer_name"
                            defaultValue={editData?.customer_name}
                            placeholder="PT / CV / Nama Pelanggan"
                            required
                            className="h-9 text-xs"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="address" className="text-xs">
                            Alamat Tagih <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="address"
                            name="address"
                            defaultValue={editData?.address}
                            placeholder="Kota / Alamat Tagihan"
                            required
                            className="h-9 text-xs"
                        />
                    </div>

                    {userRole === "SuperAdminBP" && (
                        <div className="space-y-1.5">
                            <Label className="text-xs">
                                Cabang (Lokasi) <span className="text-rose-500">*</span>
                            </Label>
                            <Select name="locationId" defaultValue={editData?.locationId || undefined}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Pilih Cabang" />
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

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <Label className="text-xs">Bagikan Akses Referensi (Opsional)</Label>
                        <p className="text-[11px] text-slate-400">
                            Pilih cabang lain yang diizinkan untuk melihat & menggunakan customer ini.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-1.5 max-h-[120px] overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50/50">
                            {locations.map((loc) => (
                                <label
                                    key={loc.id}
                                    className="flex items-center gap-2 text-xs cursor-pointer select-none"
                                >
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedSharedLocs.includes(loc.id)}
                                        onChange={() => onToggleSharedLoc(loc.id)}
                                    />
                                    <span className="truncate">{loc.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <Button type="submit" className="w-full mt-2 h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                        {isEdit ? "Simpan Perubahan" : "Buat Customer"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
