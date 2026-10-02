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
import { LocationItem, CustomerWithProjects, CustomerProject } from "../types"

interface ProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editData: CustomerProject | null
    parentCustomer: CustomerWithProjects | null
    locations: LocationItem[]
    selectedSharedLocs: string[]
    onToggleSharedLoc: (id: string) => void
    onSubmit: (formData: FormData) => Promise<void>
}

export function ProjectDialog({
    open,
    onOpenChange,
    editData,
    parentCustomer,
    locations,
    selectedSharedLocs,
    onToggleSharedLoc,
    onSubmit,
}: ProjectDialogProps) {
    const isEdit = Boolean(editData)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold text-slate-800">
                        {isEdit
                            ? `Edit Proyek — ${editData?.name}`
                            : `Tambah Proyek — ${parentCustomer?.customer_name}`}
                    </DialogTitle>
                </DialogHeader>
                <form
                    key={editData?.id || "new-project"}
                    action={onSubmit}
                    className="space-y-3.5 mt-2"
                >
                    <input
                        type="hidden"
                        name="customerId"
                        value={isEdit ? editData?.customerId : parentCustomer?.id}
                    />

                    <div className="space-y-1.5">
                        <Label htmlFor="proj_name" className="text-xs">
                            Nama Proyek <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="proj_name"
                            name="name"
                            defaultValue={editData?.name}
                            placeholder="Contoh: Pembangunan Jembatan Youtefa"
                            required
                            className="h-9 text-xs"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="proj_address" className="text-xs">
                            Lokasi Pengecoran <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="proj_address"
                            name="address"
                            defaultValue={editData?.address}
                            placeholder="Contoh: Jl. Pantai Holtekamp Km 3"
                            required
                            className="h-9 text-xs"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="default_distance" className="text-xs">
                                Jarak Default (KM) <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="default_distance"
                                name="default_distance"
                                type="number"
                                step="0.1"
                                min="0"
                                defaultValue={editData?.default_distance ?? ""}
                                placeholder="Contoh: 12.5"
                                required
                                className="h-9 text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tax_ppn" className="text-xs">
                                PPN (%) <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="tax_ppn"
                                name="tax_ppn"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                defaultValue={editData?.tax_ppn ?? ""}
                                placeholder="Contoh: 11"
                                required
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <Label className="text-xs">Bagikan Akses Proyek (Opsional)</Label>
                        <p className="text-[11px] text-slate-400">
                            Pilih cabang yang diizinkan untuk mengakses proyek ini secara spesifik.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-1 max-h-[120px] overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50/50">
                            {locations.map((loc) => {
                                const isCustomerShared = parentCustomer?.sharedLocations?.some(
                                    (sl) => sl.id === loc.id
                                )
                                const isDisabled = isCustomerShared
                                return (
                                    <label
                                        key={loc.id}
                                        className={`flex items-center gap-2 text-xs select-none ${
                                            isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={isDisabled ? true : selectedSharedLocs.includes(loc.id)}
                                            onChange={() => {
                                                if (!isDisabled) onToggleSharedLoc(loc.id)
                                            }}
                                            disabled={isDisabled}
                                        />
                                        <span className="flex-1 truncate" title={loc.name}>
                                            {loc.name}{" "}
                                            {isDisabled && (
                                                <span className="text-[10px] text-blue-600 font-medium">
                                                    (Tertagih)
                                                </span>
                                            )}
                                        </span>
                                    </label>
                                )
                            })}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-2 h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isEdit ? "Simpan Perubahan Proyek" : "Buat Proyek"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
