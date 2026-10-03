"use client"

import React, { useTransition } from "react"
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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createSupplier, updateSupplier } from "../actions"
import { SupplierItem } from "../types"

interface SupplierModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData: SupplierItem | null
    onSuccess?: () => void
}

export function SupplierModal({
    open,
    onOpenChange,
    initialData,
    onSuccess
}: SupplierModalProps) {
    const [isPending, startTransition] = useTransition()
    const isEdit = Boolean(initialData)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        startTransition(async () => {
            const res = isEdit && initialData
                ? await updateSupplier(initialData.id, formData)
                : await createSupplier(formData)

            if (res.success) {
                toast.success(isEdit ? "Data toko berhasil diperbarui" : "Toko baru berhasil ditambahkan")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(res.error || "Gagal menyimpan data toko")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold text-slate-900">
                        {isEdit ? "Edit Data Toko / Supplier" : "Tambah Toko / Supplier Baru"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                            Nama Toko / Supplier <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={initialData?.name || ""}
                            placeholder="Contoh: PT Jasindo Trans Papua"
                            required
                            disabled={isPending}
                            className="h-9 text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="contact" className="text-xs font-semibold text-slate-700">
                            Nomor Kontak / WhatsApp
                        </Label>
                        <Input
                            id="contact"
                            name="contact"
                            defaultValue={initialData?.contact || ""}
                            placeholder="Contoh: 081234567890 / 0967-123456"
                            disabled={isPending}
                            className="h-9 text-sm"
                        />
                        <p className="text-[11px] text-slate-500">
                            Nomor telepon atau kontak PIC toko untuk konfirmasi pesanan PO.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
                            Alamat Lengkap
                        </Label>
                        <Textarea
                            id="address"
                            name="address"
                            defaultValue={initialData?.address || ""}
                            placeholder="Contoh: Jl. Raya Abepura No. 12, Jayapura Selatan"
                            disabled={isPending}
                            rows={3}
                            className="text-sm resize-none"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            className="h-9 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-9 text-xs font-semibold"
                        >
                            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            {isEdit ? "Simpan Perubahan" : "Tambah Toko"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
