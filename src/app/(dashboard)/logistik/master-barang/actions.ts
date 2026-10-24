"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { LogistikBusinessUnit } from "@/lib/logistik-scoping"
import {
    buildMasterItemBranchFilter,
    isLogistikCentralUser,
    LogistikFilterParams
} from "@/lib/logistik-scoping"

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
    target_business: z.enum(["BP", "CRUSHER", "ALL"]).optional().default("ALL"),
    is_global: z.string().optional().transform(v => v === "true" || v === "on"),
    locationId: z.string().optional().or(z.literal("")),
})

import { hasPermission } from "@/lib/rbac"

function canManageMasterBarang(user: any) {
    if (!user) return false
    return hasPermission(user, "LOGISTIK", "CREATE") ||
        hasPermission(user, "LOGISTIK", "EDIT") ||
        hasPermission(user, "CRUSHER", "EDIT")
}

export async function getMasterItems(params?: LogistikFilterParams) {
    const session = await auth()
    const where = buildMasterItemBranchFilter(session?.user, params)

    return await prisma.masterItem.findMany({
        where,
        include: {
            supplier: true,
            category: true,
            location: { select: { id: true, name: true } },
            sharedLocations: { select: { id: true, name: true } },
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
    const sharedLocationIds = formData.getAll("sharedLocationIds") as string[]
    const parsed = itemSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    const userId = session.user.id
    const isCentral = isLogistikCentralUser(session.user)
    const isCrusher = session.user.locationType === "STONE_CRUSHER" || session.user.role === "OperatorCrusher" || session.user.role === "AdminCrusher"

    let target_business = parsed.data.target_business
    let is_global = isCentral ? (parsed.data.is_global ?? false) : false
    let locationId = session.user.locationId || null

    if (isCentral) {
        locationId = parsed.data.locationId && parsed.data.locationId.trim() !== "" ? parsed.data.locationId : null
    } else {
        target_business = isCrusher ? "CRUSHER" : "BP"
    }

    const validSharedIds = isCentral
        ? sharedLocationIds.filter(id => Boolean(id) && id.trim().length > 0 && id !== locationId)
        : []

    try {
        const { reason, target_business: _tb, is_global: _ig, locationId: _locId, ...itemData } = parsed.data
        await prisma.masterItem.create({
            data: {
                ...itemData,
                target_business,
                is_global,
                locationId,
                ...(validSharedIds.length > 0 && {
                    sharedLocations: { connect: validSharedIds.map(id => ({ id })) }
                }),
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
    const sharedLocationIds = formData.getAll("sharedLocationIds") as string[]
    const parsed = itemSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: parsed.error.format() }

    const isCentral = isLogistikCentralUser(session.user)
    const currentItem = await prisma.masterItem.findUnique({ where: { id } })
    if (!currentItem) return { success: false, error: "Barang tidak ditemukan." }

    if (!isCentral && currentItem.locationId && currentItem.locationId !== session.user.locationId) {
        return { success: false, error: "Akses ditolak: Anda hanya dapat mengubah barang milik cabang Anda." }
    }

    const userId = session.user.id
    const oldPrice = currentItem.harga
    const newPrice = parsed.data.harga
    const priceChanged = Math.abs(oldPrice - newPrice) > 0.001

    let target_business = currentItem.target_business
    let is_global = currentItem.is_global
    let locationId = currentItem.locationId

    if (isCentral) {
        target_business = parsed.data.target_business
        is_global = parsed.data.is_global ?? false
        locationId = parsed.data.locationId && parsed.data.locationId.trim() !== "" ? parsed.data.locationId : null
    }

    const validSharedIds = isCentral
        ? sharedLocationIds.filter(id => Boolean(id) && id.trim().length > 0 && id !== locationId)
        : []

    try {
        const { reason, target_business: _tb, is_global: _ig, locationId: _locId, ...itemData } = parsed.data

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
                data: {
                    ...itemData,
                    target_business,
                    is_global,
                    locationId,
                    sharedLocations: isCentral
                        ? { set: validSharedIds.map(locId => ({ id: locId })) }
                        : undefined
                }
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

    const isCentral = isLogistikCentralUser(session.user)
    const existing = await prisma.masterItem.findUnique({ where: { id } })
    if (!existing) return { success: false, error: "Barang tidak ditemukan." }

    if (!isCentral && existing.locationId && existing.locationId !== session.user.locationId) {
        return { success: false, error: "Akses ditolak: Anda hanya dapat menghapus barang milik cabang Anda." }
    }

    try {
        await prisma.masterItem.delete({ where: { id } })
        revalidatePath("/logistik/master-barang")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus. Pastikan tidak ada PO yang menggunakan barang ini." }
    }
}
