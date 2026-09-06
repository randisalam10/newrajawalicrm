"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const categorySchema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    kode_kategori: z.string().min(1).max(10).transform(v => v.toUpperCase()),
    require_hm_km: z.string().optional().transform(v => v === "on"),
})

function canManageCategory(user: any) {
    if (!user) return false
    if (["CEO", "FVP", "Approver"].includes(user.role)) return false
    return user.role === "SuperAdminBP" || user.role === "AdminBP" || user.role === "AdminLogistik"
}

export async function getPoCategories() {
    return await prisma.poCategory.findMany({ orderBy: { name: 'asc' } })
}

export async function createPoCategory(formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageCategory(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola kategori PO" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = categorySchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    try {
        await prisma.poCategory.create({ data: parsed.data })
        revalidatePath("/logistik/kategori")
        return { success: true }
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: "Kode kategori sudah digunakan." }
        return { success: false, error: e.message }
    }
}

export async function updatePoCategory(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageCategory(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola kategori PO" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = categorySchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    try {
        await prisma.poCategory.update({ where: { id }, data: parsed.data })
        revalidatePath("/logistik/kategori")
        return { success: true }
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: "Kode kategori sudah digunakan." }
        return { success: false, error: e.message }
    }
}

export async function deletePoCategory(id: string) {
    const session = await auth()
    if (!session?.user || !canManageCategory(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola kategori PO" }
    }

    try {
        await prisma.poCategory.delete({ where: { id } })
        revalidatePath("/logistik/kategori")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus. Pastikan tidak ada barang atau PO terkait." }
    }
}
