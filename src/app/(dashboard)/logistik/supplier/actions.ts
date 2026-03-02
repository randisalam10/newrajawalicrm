"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const supplierSchema = z.object({
    name: z.string().min(1, "Nama toko wajib diisi"),
    address: z.string().optional(),
    contact: z.string().optional(),
})

export async function getSuppliers() {
    return await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
}

export async function createSupplier(formData: FormData) {
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
    try {
        await prisma.supplier.delete({ where: { id } })
        revalidatePath("/logistik/supplier")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus. Pastikan tidak ada barang terkait supplier ini." }
    }
}
