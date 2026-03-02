"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const itemSchema = z.object({
    kode_barang: z.string().min(1, "Kode barang wajib diisi"),
    name: z.string().min(1, "Nama barang wajib diisi"),
    satuan: z.string().min(1, "Satuan wajib diisi"),
    harga: z.coerce.number().min(0, "Harga tidak boleh negatif"),
    supplierId: z.string().min(1, "Supplier wajib dipilih"),
    categoryId: z.string().min(1, "Kategori wajib dipilih"),
    part_number: z.string().optional(),
    merk: z.string().optional(),
})

export async function getMasterItems() {
    return await prisma.masterItem.findMany({
        include: { supplier: true, category: true },
        orderBy: { name: 'asc' }
    })
}

export async function createMasterItem(formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    const parsed = itemSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    try {
        await prisma.masterItem.create({ data: parsed.data })
        revalidatePath("/logistik/master-barang")
        return { success: true }
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: "Kode barang sudah digunakan." }
        return { success: false, error: e.message }
    }
}

export async function updateMasterItem(id: string, formData: FormData) {
    const data = Object.fromEntries(formData.entries())
    const parsed = itemSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    try {
        await prisma.masterItem.update({ where: { id }, data: parsed.data })
        revalidatePath("/logistik/master-barang")
        return { success: true }
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: "Kode barang sudah digunakan." }
        return { success: false, error: e.message }
    }
}

export async function deleteMasterItem(id: string) {
    try {
        await prisma.masterItem.delete({ where: { id } })
        revalidatePath("/logistik/master-barang")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus. Pastikan tidak ada PO yang menggunakan barang ini." }
    }
}
