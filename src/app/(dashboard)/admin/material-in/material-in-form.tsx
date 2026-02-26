"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createIncomingMaterial, updateIncomingMaterial } from "./actions"
import { MaterialInRow } from "./columns"

const formSchema = z.object({
    date: z.string().min(1, "Tanggal wajib diisi"),
    name: z.string().min(1, "Nama Semen wajib diisi"),
    supplier: z.string().min(1, "Distributor wajib diisi"),
    tonnage: z.coerce.number().min(1, "Berat harus lebih dari 0 KG"),
    delivery_note: z.string().min(1, "No Bon / Surat Jalan wajib diisi"),
    locationId: z.string().optional()
})

export function MaterialInForm({
    isOpen,
    initialData,
    locations,
    userRole,
    onSuccess,
    onCancel
}: {
    isOpen: boolean
    initialData?: MaterialInRow | null
    locations: any[]
    userRole: string
    onSuccess: () => void
    onCancel: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
            name: "",
            supplier: "",
            tonnage: 0,
            delivery_note: "",
            locationId: ""
        } as any,
    })

    useEffect(() => {
        if (initialData && isOpen) {
            form.reset({
                date: new Date(initialData.date).toISOString().slice(0, 16),
                name: initialData.name,
                supplier: initialData.supplier,
                tonnage: initialData.tonnage,
                delivery_note: initialData.delivery_note,
                locationId: initialData.locationId
            })
        } else if (isOpen) {
            form.reset({
                date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
                name: "",
                supplier: "",
                tonnage: 0,
                delivery_note: "",
                locationId: ""
            })
        }
    }, [initialData, isOpen, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        const formData = new FormData()
        formData.append("date", values.date)
        formData.append("name", values.name)
        formData.append("supplier", values.supplier)
        formData.append("tonnage", values.tonnage.toString())
        formData.append("delivery_note", values.delivery_note)

        if (userRole === "SuperAdminBP" && values.locationId) {
            formData.append("locationId", values.locationId)
        }

        let result
        if (initialData) {
            result = await updateIncomingMaterial(initialData.id, formData)
        } else {
            result = await createIncomingMaterial(formData)
        }

        setIsLoading(false)
        if (result?.error) {
            alert(result.error)
        } else {
            onSuccess()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Data Semen Masuk" : "Tambah Data Semen Masuk"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tanggal & Waktu Masuk</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Semen (Merek)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Semen Tonasa 50kg" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="supplier"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Distributor / Supplier</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nama Toko/Distributor" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tonnage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jumlah (KG)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="delivery_note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>No. Bon / Order</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ABC-123" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {userRole === "SuperAdminBP" && (
                            <FormField
                                control={form.control}
                                name="locationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pilih Cabang (Hak SuperAdmin)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Cabang" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {locations.map((loc) => (
                                                    <SelectItem key={loc.id} value={loc.id}>
                                                        {loc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Menyimpan..." : "Simpan Data"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
