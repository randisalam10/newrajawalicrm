"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const supplierSchema = z.object({
    name: z.string().min(1, "Nama toko wajib diisi"),
    address: z.string().optional(),
    contact: z.string().optional(),
})

function canManageSupplier(user: any) {
    if (!user) return false
    if (["CEO", "FVP", "Approver"].includes(user.role)) return false
    return user.role === "SuperAdminBP" || user.role === "AdminBP" || user.role === "AdminLogistik"
}

export async function getSuppliers() {
    return await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
}

export async function createSupplier(formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageSupplier(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data toko/supplier" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = supplierSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    try {
        await prisma.supplier.create({ data: parsed.data })
        revalidatePath("/logistik/supplier")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateSupplier(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageSupplier(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data toko/supplier" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = supplierSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    try {
        await prisma.supplier.update({ where: { id }, data: parsed.data })
        revalidatePath("/logistik/supplier")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteSupplier(id: string) {
    const session = await auth()
    if (!session?.user || !canManageSupplier(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data toko/supplier" }
    }

    try {
        await prisma.supplier.delete({ where: { id } })
        revalidatePath("/logistik/supplier")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus. Pastikan tidak ada barang terkait supplier ini." }
    }
}
