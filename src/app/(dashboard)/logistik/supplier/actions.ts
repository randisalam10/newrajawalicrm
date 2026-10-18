"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"
import type { LogistikBusinessUnit } from "@/lib/logistik-scoping"
import { SupplierItem, SupplierStats, BulkUpdateSupplierScopePayload } from "./types"
import {
    buildSupplierBranchFilter,
    isLogistikCentralUser,
    LogistikFilterParams
} from "@/lib/logistik-scoping"

const supplierSchema = z.object({
    name: z.string().trim().min(1, "Nama toko wajib diisi"),
    address: z.string().trim().optional().or(z.literal("")),
    contact: z.string().trim().optional().or(z.literal("")),
    target_business: z.enum(["BP", "CRUSHER", "ALL"]).optional().default("ALL"),
    is_global: z.string().optional().transform(v => v === "true" || v === "on"),
    locationId: z.string().optional().or(z.literal("")),
})

function canManageSupplier(user: any) {
    if (!user) return false
    if (["CEO", "FVP", "Approver"].includes(user.role)) return false
    if (["SuperAdminBP", "AdminBP", "AdminLogistik", "OperatorCrusher", "AdminCrusher"].includes(user.role)) return true
    const perms: string[] = user.permissions || []
    return perms.includes("LOGISTIK_CREATE") || perms.includes("LOGISTIK_EDIT") || perms.includes("CRUSHER_VIEW")
}

export async function getLocationsForLogistik() {
    return await prisma.location.findMany({
        select: { id: true, name: true, type: true },
        orderBy: { name: 'asc' }
    })
}

export async function getSuppliers(params?: LogistikFilterParams) {
    const session = await auth()
    const where = buildSupplierBranchFilter(session?.user, params)
    return await prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' }
    })
}

export async function getSuppliersData(params?: LogistikFilterParams): Promise<{ suppliers: SupplierItem[]; stats: SupplierStats }> {
    const session = await auth()
    const where = buildSupplierBranchFilter(session?.user, params)

    const [rawSuppliers, poCounts] = await Promise.all([
        prisma.supplier.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                location: { select: { id: true, name: true } },
                sharedLocations: { select: { id: true, name: true } },
                _count: {
                    select: { masterItems: true }
                }
            }
        }),
        prisma.purchaseOrder.groupBy({
            by: ['supplierId'],
            _count: { id: true }
        })
    ])

    const poMap = new Map<string, number>()
    poCounts.forEach(p => {
        if (p.supplierId) poMap.set(p.supplierId, p._count.id)
    })

    let totalItems = 0
    let withContactCount = 0
    let activeSuppliers = 0

    const suppliers: SupplierItem[] = rawSuppliers.map(s => {
        const itemCount = s._count?.masterItems || 0
        const poCount = poMap.get(s.id) || 0

        totalItems += itemCount
        if (s.contact && s.contact.trim() !== "") withContactCount++
        if (poCount > 0 || itemCount > 0) activeSuppliers++

        return {
            id: s.id,
            name: s.name,
            address: s.address || null,
            contact: s.contact || null,
            target_business: s.target_business,
            is_global: s.is_global,
            locationId: s.locationId || null,
            location: s.location || null,
            sharedLocations: s.sharedLocations || [],
            itemCount,
            poCount,
            createdAt: s.createdAt.toISOString()
        }
    })

    const stats: SupplierStats = {
        totalSuppliers: suppliers.length,
        totalItems,
        activeSuppliers,
        withContactCount
    }

    return { suppliers, stats }
}

export async function createSupplier(formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageSupplier(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data toko/supplier" }
    }

    const data = Object.fromEntries(formData.entries())
    const sharedLocationIds = formData.getAll("sharedLocationIds") as string[]
    const parsed = supplierSchema.safeParse(data)
    if (!parsed.success) {
        const firstError = Object.values(parsed.error.format())[0]
        return { success: false, error: typeof firstError === 'object' && '_errors' in firstError ? (firstError as any)._errors[0] : "Data tidak valid" }
    }

    const isCentral = isLogistikCentralUser(session.user)
    const isCrusher = session.user.role === "OperatorCrusher" || session.user.role === "AdminCrusher"

    // Default peruntukan & lokasi:
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
        await prisma.supplier.create({
            data: {
                name: parsed.data.name,
                address: parsed.data.address || null,
                contact: parsed.data.contact || null,
                target_business,
                is_global,
                locationId,
                ...(validSharedIds.length > 0 && {
                    sharedLocations: { connect: validSharedIds.map(id => ({ id })) }
                })
            }
        })
        revalidatePath("/logistik/supplier")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal menambahkan toko baru" }
    }
}

export async function updateSupplier(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageSupplier(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data toko/supplier" }
    }

    const data = Object.fromEntries(formData.entries())
    const sharedLocationIds = formData.getAll("sharedLocationIds") as string[]
    const parsed = supplierSchema.safeParse(data)
    if (!parsed.success) {
        const firstError = Object.values(parsed.error.format())[0]
        return { success: false, error: typeof firstError === 'object' && '_errors' in firstError ? (firstError as any)._errors[0] : "Data tidak valid" }
    }

    const isCentral = isLogistikCentralUser(session.user)
    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing) return { success: false, error: "Data toko tidak ditemukan" }

    // Jika bukan central admin, pastikan toko adalah milik cabang yang sama
    if (!isCentral && existing.locationId && existing.locationId !== session.user.locationId) {
        return { success: false, error: "Akses ditolak: Anda hanya dapat mengubah toko milik cabang Anda." }
    }

    let target_business = existing.target_business
    let is_global = existing.is_global
    let locationId = existing.locationId

    if (isCentral) {
        target_business = parsed.data.target_business
        is_global = parsed.data.is_global ?? false
        locationId = parsed.data.locationId && parsed.data.locationId.trim() !== "" ? parsed.data.locationId : null
    }

    const validSharedIds = isCentral
        ? sharedLocationIds.filter(id => Boolean(id) && id.trim().length > 0 && id !== locationId)
        : []

    const syncItems = formData.get("syncItems") !== "false"

    try {
        await prisma.$transaction(async (tx) => {
            await tx.supplier.update({
                where: { id },
                data: {
                    name: parsed.data.name,
                    address: parsed.data.address || null,
                    contact: parsed.data.contact || null,
                    target_business,
                    is_global,
                    locationId,
                    sharedLocations: isCentral
                        ? { set: validSharedIds.map(locId => ({ id: locId })) }
                        : undefined
                }
            })

            // Sinkronkan barang jika dipilih atau jika toko diubah status cakupannya
            if (syncItems) {
                await tx.masterItem.updateMany({
                    where: { supplierId: id },
                    data: {
                        is_global,
                        target_business,
                        locationId,
                    }
                })

                if (isCentral) {
                    await tx.$executeRaw`
                        DELETE FROM "_MasterItemSharedLocations" 
                        WHERE "B" IN (SELECT id FROM "MasterItem" WHERE "supplierId" = ${id})
                    `
                    if (validSharedIds.length > 0) {
                        for (const locId of validSharedIds) {
                            await tx.$executeRaw`
                                INSERT INTO "_MasterItemSharedLocations" ("A", "B")
                                SELECT ${locId}, id FROM "MasterItem" WHERE "supplierId" = ${id}
                                ON CONFLICT DO NOTHING
                            `
                        }
                    }
                }
            }
        }, { timeout: 15000 })

        revalidatePath("/logistik/supplier")
        revalidatePath("/logistik/master-barang")
        revalidatePath("/logistik/po")
        revalidatePath("/crusher/po")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal memperbarui data toko" }
    }
}

/**
 * Memperbarui cakupan (Global / Cabang / Peruntukan) untuk banyak toko sekaligus (Bulk Action)
 * serta otomatis menyinkronkan seluruh barang katalog yang berelasi dengan toko-toko tersebut.
 */
export async function bulkUpdateSuppliersScope(payload: BulkUpdateSupplierScopePayload) {
    const session = await auth()
    if (!session?.user || !canManageSupplier(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data toko/supplier" }
    }

    const {
        supplierIds,
        is_global,
        target_business = "ALL",
        locationId = null,
        sharedLocationIds = [],
        syncItems = true,
    } = payload

    if (!supplierIds || supplierIds.length === 0) {
        return { success: false, error: "Pilih setidaknya satu toko untuk diperbarui" }
    }

    const isCentral = isLogistikCentralUser(session.user)

    // Ambil data supplier beserta cabang asalnya masing-masing
    const allowedSuppliers = await prisma.supplier.findMany({
        where: {
            id: { in: supplierIds },
            ...(!isCentral ? { locationId: session.user.locationId } : {})
        },
        select: { id: true, name: true, locationId: true }
    })

    if (allowedSuppliers.length === 0) {
        return { success: false, error: "Tidak ada toko valid yang dapat diubah sesuai hak akses cabang Anda." }
    }

    const effectiveShared = (!is_global && isCentral && sharedLocationIds)
        ? sharedLocationIds.filter(id => Boolean(id) && id.trim().length > 0)
        : []

    const validSupplierIds = allowedSuppliers.map(s => s.id)

    try {
        await prisma.$transaction(async (tx) => {
            if (is_global) {
                // 1. Jadikan seluruh toko terpilih menjadi Global
                await tx.supplier.updateMany({
                    where: { id: { in: validSupplierIds } },
                    data: {
                        is_global: true,
                        target_business,
                        locationId: null,
                    }
                })

                // Hapus shared locations pada toko-toko ini
                await tx.$executeRaw`DELETE FROM "_SupplierSharedLocations" WHERE "B" = ANY(${validSupplierIds})`

                // 2. Jika syncItems, jadikan seluruh barang katalognya juga Global
                if (syncItems) {
                    await tx.masterItem.updateMany({
                        where: { supplierId: { in: validSupplierIds } },
                        data: {
                            is_global: true,
                            target_business,
                            locationId: null,
                        }
                    })

                    await tx.$executeRaw`
                        DELETE FROM "_MasterItemSharedLocations" 
                        WHERE "B" IN (SELECT id FROM "MasterItem" WHERE "supplierId" = ANY(${validSupplierIds}))
                    `
                }
            } else {
                // 1. Jadikan Lokal: Jika ada lokasi spesifik maka gunakan itu, jika tidak pertahankan cabang pembuatnya
                if (locationId && locationId.trim() !== "") {
                    await tx.supplier.updateMany({
                        where: { id: { in: validSupplierIds } },
                        data: {
                            is_global: false,
                            target_business,
                            locationId,
                        }
                    })

                    if (syncItems) {
                        await tx.masterItem.updateMany({
                            where: { supplierId: { in: validSupplierIds } },
                            data: {
                                is_global: false,
                                target_business,
                                locationId,
                            }
                        })
                    }
                } else {
                    // Pertahankan cabang pembuat masing-masing toko
                    await tx.supplier.updateMany({
                        where: { id: { in: validSupplierIds } },
                        data: {
                            is_global: false,
                            target_business,
                        }
                    })

                    if (syncItems) {
                        // Sinkronkan barang ke cabang pembuat tokonya masing-masing via single SQL query
                        await tx.$executeRaw`
                            UPDATE "MasterItem" m
                            SET "is_global" = false,
                                "target_business" = ${target_business}::"LogistikBusinessUnit",
                                "locationId" = s."locationId"
                            FROM "Supplier" s
                            WHERE m."supplierId" = s.id
                              AND s.id = ANY(${validSupplierIds})
                        `
                    }
                }

                // Kelola Shared Locations
                await tx.$executeRaw`DELETE FROM "_SupplierSharedLocations" WHERE "B" = ANY(${validSupplierIds})`
                if (syncItems) {
                    await tx.$executeRaw`
                        DELETE FROM "_MasterItemSharedLocations" 
                        WHERE "B" IN (SELECT id FROM "MasterItem" WHERE "supplierId" = ANY(${validSupplierIds}))
                    `
                }

                if (isCentral && effectiveShared.length > 0) {
                    for (const locId of effectiveShared) {
                        await tx.$executeRaw`
                            INSERT INTO "_SupplierSharedLocations" ("A", "B")
                            SELECT ${locId}, id FROM "Supplier" WHERE id = ANY(${validSupplierIds})
                            ON CONFLICT DO NOTHING
                        `
                        if (syncItems) {
                            await tx.$executeRaw`
                                INSERT INTO "_MasterItemSharedLocations" ("A", "B")
                                SELECT ${locId}, id FROM "MasterItem" WHERE "supplierId" = ANY(${validSupplierIds})
                                ON CONFLICT DO NOTHING
                            `
                        }
                    }
                }
            }
        }, { timeout: 30000 })

        revalidatePath("/logistik/supplier")
        revalidatePath("/logistik/master-barang")
        revalidatePath("/logistik/po")
        revalidatePath("/crusher/po")

        const count = allowedSuppliers.length
        return {
            success: true,
            updatedCount: count,
            message: `${count} toko berhasil diatur menjadi ${is_global ? 'Global' : 'Lokal Cabang'}${syncItems ? ' dan seluruh barang katalognya telah disinkronkan' : ''}.`
        }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal memperbarui cakupan toko secara massal" }
    }
}

export async function deleteSupplier(id: string) {
    const session = await auth()
    if (!session?.user || !canManageSupplier(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data toko/supplier" }
    }

    const isCentral = isLogistikCentralUser(session.user)
    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing) return { success: false, error: "Data toko tidak ditemukan" }

    if (!isCentral && existing.locationId && existing.locationId !== session.user.locationId) {
        return { success: false, error: "Akses ditolak: Anda hanya dapat menghapus toko milik cabang Anda." }
    }

    try {
        const [itemCount, poCount] = await Promise.all([
            prisma.masterItem.count({ where: { supplierId: id } }),
            prisma.purchaseOrder.count({ where: { supplierId: id } })
        ])

        if (itemCount > 0 || poCount > 0) {
            return {
                success: false,
                error: `Tidak dapat menghapus toko ini karena masih terhubung dengan ${itemCount} item katalog barang dan ${poCount} riwayat Purchase Order (PO).`
            }
        }

        await prisma.supplier.delete({ where: { id } })
        revalidatePath("/logistik/supplier")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus toko. Pastikan tidak ada transaksi terkait." }
    }
}
