"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
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
    reason: z.string().optional(),
})

function canManageMasterBarang(user: any) {
    if (!user) return false
    if (["CEO", "FVP", "Approver"].includes(user.role)) return false
    return user.role === "SuperAdminBP" || user.role === "AdminBP" || user.role === "AdminLogistik"
}

export async function getMasterItems() {
    return await prisma.masterItem.findMany({
        include: {
            supplier: true,
            category: true,
            priceHistories: {
                orderBy: { effectiveDate: 'desc' },
                include: {
                    updatedBy: {
                        select: {
                            id: true,
                            username: true,
                            employee: { select: { name: true } }
                        }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    })
}

export async function createMasterItem(formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageMasterBarang(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola master barang" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = itemSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    const userId = session.user.id

    try {
        const { reason, ...itemData } = parsed.data
        await prisma.masterItem.create({
            data: {
                ...itemData,
                priceHistories: {
                    create: {
                        oldPrice: 0,
                        newPrice: itemData.harga,
                        priceDiff: itemData.harga,
                        percentage: 0,
                        reason: reason || "Harga awal pendaftaran barang",
                        updatedById: userId || null
                    }
                }
            }
        })
        revalidatePath("/logistik/master-barang")
        return { success: true }
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: "Kode barang sudah digunakan." }
        return { success: false, error: e.message }
    }
}

export async function updateMasterItem(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageMasterBarang(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola master barang" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = itemSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    const userId = session.user.id

    try {
        const currentItem = await prisma.masterItem.findUnique({ where: { id } })
        if (!currentItem) return { success: false, error: "Barang tidak ditemukan." }

        const oldPrice = currentItem.harga
        const newPrice = parsed.data.harga
        const priceChanged = Math.abs(oldPrice - newPrice) > 0.001
        const { reason, ...itemData } = parsed.data

        await prisma.$transaction(async (tx) => {
            if (priceChanged) {
                const priceDiff = newPrice - oldPrice
                const percentage = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0
                await tx.masterItemPriceHistory.create({
                    data: {
                        masterItemId: id,
                        oldPrice,
                        newPrice,
                        priceDiff,
                        percentage,
                        reason: reason || (priceDiff > 0 ? "Kenaikan harga barang" : "Penurunan harga barang"),
                        updatedById: userId || null
                    }
                })
            }

            await tx.masterItem.update({
                where: { id },
                data: itemData
            })
        })

        revalidatePath("/logistik/master-barang")
        return { success: true }
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: "Kode barang sudah digunakan." }
        return { success: false, error: e.message }
    }
}

export async function quickUpdateItemPrice(masterItemId: string, newPrice: number, reason?: string) {
    const session = await auth()
    if (!session?.user || !canManageMasterBarang(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengubah harga barang" }
    }
    const userId = session.user.id

    try {
        const currentItem = await prisma.masterItem.findUnique({ where: { id: masterItemId } })
        if (!currentItem) return { success: false, error: "Barang tidak ditemukan." }

        const oldPrice = currentItem.harga
        if (Math.abs(oldPrice - newPrice) <= 0.001) {
            return { success: true, message: "Harga tidak berubah." }
        }

        const priceDiff = newPrice - oldPrice
        const percentage = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0

        await prisma.$transaction([
            prisma.masterItemPriceHistory.create({
                data: {
                    masterItemId,
                    oldPrice,
                    newPrice,
                    priceDiff,
                    percentage,
                    reason: reason || (priceDiff > 0 ? "Kenaikan harga via shortcut PO" : "Penyesuaian harga via shortcut PO"),
                    updatedById: userId || null
                }
            }),
            prisma.masterItem.update({
                where: { id: masterItemId },
                data: { harga: newPrice }
            })
        ])

        revalidatePath("/logistik/master-barang")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteMasterItem(id: string) {
    const session = await auth()
    if (!session?.user || !canManageMasterBarang(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola master barang" }
    }

    try {
        await prisma.masterItem.delete({ where: { id } })
        revalidatePath("/logistik/master-barang")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus. Pastikan tidak ada PO yang menggunakan barang ini." }
    }
}
