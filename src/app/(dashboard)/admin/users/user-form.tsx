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
    role: z.string().min(1, "Role required"),
    employeeId: z.string().min(1, "Pegawai required"),
    isPoApprover: z.boolean().default(false),
    poApproverRole: z.enum(["FVP", "CEO", "BOTH"]).default("FVP"),
})

export function UserForm({
    initialData,
    eligibleEmployees = [],
    roles = [],
    onSuccess,
    onCancel
}: {
    initialData?: any
    eligibleEmployees?: any[]
    roles?: Array<{ id: string; name: string; label: string; scope: string; description?: string | null }>
    onSuccess: () => void
    onCancel: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const form = useForm<any>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            id: initialData?.id,
            username: initialData?.username || "",
            password: "",
            role: initialData?.role || "AdminBP",
            employeeId: initialData?.employeeId || "",
            isPoApprover: Boolean(initialData?.isPoApprover),
            poApproverRole: initialData?.poApproverRole || "FVP",
        },
    })

    async function onSubmit(values: z.infer<typeof userSchema>) {
        setIsLoading(true)
        const formData = new FormData()
        Object.entries(values).forEach(([key, value]) => {
            if (value !== undefined) formData.append(key, String(value))
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
                                        {roles.length > 0 ? (
                                            roles.map((r) => (
                                                <SelectItem key={r.id} value={r.name}>
                                                    <span className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                                            r.scope === 'ALL_BRANCHES' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {r.scope === 'ALL_BRANCHES' ? 'ALL' : 'CABANG'}
                                                        </span>
                                                        <span>{r.label || r.name}</span>
                                                    </span>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="SuperAdminBP">Super Admin (Head Office)</SelectItem>
                                                <SelectItem value="AdminBP">Admin Cabang</SelectItem>
                                                <SelectItem value="OperatorBP">Operator / Kasir</SelectItem>
                                                <SelectItem value="AdminLogistik">Admin Logistik & Peralatan</SelectItem>
                                                <SelectItem value="CEO">CEO</SelectItem>
                                                <SelectItem value="FVP">FVP</SelectItem>
                                                <SelectItem value="Approver">Approver</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* PO Approver Designation */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-lg space-y-3">
                        <FormField
                            control={form.control}
                            name="isPoApprover"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between space-y-0">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-xs font-semibold text-slate-800 cursor-pointer">
                                            Penugasan Approver PO
                                        </FormLabel>
                                        <p className="text-[11px] text-slate-500">
                                            Aktifkan agar user ini dapat dipilih sebagai penandatangan Purchase Order (PO).
                                        </p>
                                    </div>
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {form.watch("isPoApprover") && (
                            <FormField
                                control={form.control}
                                name="poApproverRole"
                                render={({ field }) => (
                                    <FormItem className="pt-2 border-t border-slate-200">
                                        <FormLabel className="text-xs font-semibold text-slate-700">
                                            Peran Penandatangan di PO
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || "CEO"}>
                                            <FormControl>
                                                <SelectTrigger className="h-8 text-xs bg-white">
                                                    <SelectValue placeholder="Pilih Peran Penandatangan" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CEO">Pimpinan / CEO (Menyetujui — Kiri)</SelectItem>
                                                <SelectItem value="FVP">Approver / Mengetahui (Tengah — Opsional)</SelectItem>
                                                <SelectItem value="BOTH">Keduanya (Bisa CEO & Mengetahui Tengah)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            * Posisi kanan (&ldquo;Yang Mengajukan&rdquo;) otomatis diisi oleh akun Admin yang membuat PO.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Menyimpan..." : "Simpan User"}
                    </Button>
                </div>
            </form>
        </Form >
    )
}
