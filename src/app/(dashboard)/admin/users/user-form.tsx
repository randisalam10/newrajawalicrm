"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createUser, updateUser } from "./actions"

const userSchema = z.object({
    id: z.string().optional(),
    username: z.string().min(3, "Username minimal 3 karakter"),
    password: z.string().optional(),
    role: z.enum(["AdminBP", "OperatorBP"]),
    employeeId: z.string().min(1, "Pegawai required"),
})

export function UserForm({
    initialData,
    eligibleEmployees = [],
    onSuccess,
    onCancel
}: {
    initialData?: any
    eligibleEmployees?: any[]
    onSuccess: () => void
    onCancel: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: initialData || {
            username: "",
            password: "",
            role: "AdminBP",
            employeeId: "",
        },
    })

    async function onSubmit(values: z.infer<typeof userSchema>) {
        setIsLoading(true)
        const formData = new FormData()
        Object.entries(values).forEach(([key, value]) => {
            if (value !== undefined) formData.append(key, value)
        })

        const result = initialData?.id
            ? await updateUser(initialData.id, formData)
            : await createUser(formData)

        if (result.success) {
            toast({ title: "Success", description: "Data user berhasil disimpan" })
            onSuccess()
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error as string || "Terjadi kesalahan" })
        }
        setIsLoading(false)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    {!initialData ? (
                        <FormField
                            control={form.control}
                            name="employeeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pilih Pegawai *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="-- Pilih Pegawai yg belum memiliki akun --" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {eligibleEmployees.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.name} ({emp.position}) - {emp.location?.name}
                                                </SelectItem>
                                            ))}
                                            {eligibleEmployees.length === 0 && (
                                                <SelectItem value="none" disabled>
                                                    Semua Admin/Operator sudah memiliki akun
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <div className="space-y-2">
                            <FormLabel>Pegawai Terhubung</FormLabel>
                            <Input value={initialData.name || "Tidak diketahui"} disabled />
                            <input type="hidden" {...form.register("employeeId")} value={initialData.employeeId} />
                        </div>
                    )}
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username Login</FormLabel>
                                <FormControl>
                                    <Input placeholder="johndoe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password {initialData && "(Kosongkan jika tidak diubah)"}</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role Sistem</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Role" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="AdminBP">Admin Cabang</SelectItem>
                                        <SelectItem value="OperatorBP">Operator / Kasir</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Menyimpan..." : "Simpan User"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
