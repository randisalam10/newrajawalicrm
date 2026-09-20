"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"
import { isCorporateUser } from "@/lib/rbac"

const kendaraanSchema = z.object({
    id: z.string().optional(),
    plate_number: z.string().min(1, "Plat Nomor required"),
    vehicle_type: z.enum(["Mixer", "Loader"]).optional(),
    categoryId: z.string().optional().nullable(),
    code: z.string().min(1, "Kode Kendaraan required"),
    locationId: z.string().optional(), // For SuperAdmin Branch Assignment
    dump_truck_size: z.preprocess(val => (val === "" || val === "NONE" ? null : val), z.enum(["BESAR", "KECIL"]).nullable().optional()),
    capacity_cubic: z.preprocess(val => (val === "" || val === undefined || val === null ? null : Number(val)), z.number().nullable().optional()),
})

function canManageKendaraan(user: any) {
    if (!user) return false
    if (["CEO", "FVP", "Approver"].includes(user.role)) return false
    return user.role === "SuperAdminBP" || user.role === "AdminBP"
}

// ─── Vehicle Category Server Actions ─────────────────────────────────────────

export async function getVehicleCategories() {
    const existing = await prisma.vehicleCategory.findMany({
        orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
        include: {
            _count: { select: { vehicles: true } }
        }
    })

    // Ensure standard category "Dump Truck" exists
    const hasDT = existing.some(c => c.name.toLowerCase().includes("dump"))
    if (!hasDT) {
        try {
            await prisma.vehicleCategory.create({
                data: {
                    name: "Dump Truck",
                    code: "DT",
                    description: "Armada pengangkut material agregat / pasir / batu",
                    isSystem: true
                }
            })
            return await prisma.vehicleCategory.findMany({
                orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
                include: {
                    _count: { select: { vehicles: true } }
                }
            })
        } catch {
            // ignore if concurrent insert
        }
    }

    return existing
}

export async function createVehicleCategory(data: { name: string; code?: string; description?: string }) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola kategori kendaraan" }
    }
    if (!data.name || !data.name.trim()) {
        return { success: false, error: "Nama kategori kendaraan wajib diisi" }
    }

    try {
        const cleanName = data.name.trim()
        const existing = await prisma.vehicleCategory.findUnique({
            where: { name: cleanName }
        })
        if (existing) {
            return { success: true, category: existing }
        }

        const category = await prisma.vehicleCategory.create({
            data: {
                name: cleanName,
                code: data.code?.trim().toUpperCase() || cleanName.slice(0, 3).toUpperCase(),
                description: data.description?.trim() || null,
                isSystem: false
            }
        })
        revalidatePath("/admin/kendaraan")
        return { success: true, category }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateVehicleCategory(id: string, data: { name: string; code?: string; description?: string }) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola kategori kendaraan" }
    }

    try {
        const category = await prisma.vehicleCategory.update({
            where: { id },
            data: {
                name: data.name.trim(),
                code: data.code?.trim().toUpperCase() || null,
                description: data.description?.trim() || null
            }
        })
        revalidatePath("/admin/kendaraan")
        return { success: true, category }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteVehicleCategory(id: string) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola kategori kendaraan" }
    }

    try {
        const count = await prisma.vehicle.count({ where: { categoryId: id } })
        if (count > 0) {
            return { success: false, error: `Kategori ini masih digunakan oleh ${count} kendaraan.` }
        }

        await prisma.vehicleCategory.delete({ where: { id } })
        revalidatePath("/admin/kendaraan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

// ─── Vehicle CRUD Actions ───────────────────────────────────────────────────

export async function getKendaraan() {
    const session = await auth()
    if (!session?.user) return []

    const isCorp = isCorporateUser(session.user)
    const filter = isCorp ? {} : (session.user.locationId ? { locationId: session.user.locationId } : {})

    return await prisma.vehicle.findMany({
        where: filter,
        include: { 
            location: true,
            category: true
        },
        orderBy: { code: 'asc' }
    })
}

export async function createKendaraan(formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data kendaraan" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = kendaraanSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : session.user.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        const { locationId, categoryId, vehicle_type, ...insertData } = parsed.data

        // Auto determine vehicle_type for backward compatibility with Produksi
        let resolvedType = vehicle_type || "Mixer"
        let finalCategoryId = categoryId || null

        if (finalCategoryId) {
            const cat = await prisma.vehicleCategory.findUnique({ where: { id: finalCategoryId } })
            if (cat) {
                resolvedType = cat.name.toLowerCase().includes("mixer") ? "Mixer" : "Loader"
            }
        }

        await prisma.vehicle.create({
            data: {
                ...insertData,
                vehicle_type: resolvedType,
                categoryId: finalCategoryId,
                locationId: finalLocationId
            }
        })
        revalidatePath("/admin/kendaraan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateKendaraan(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data kendaraan" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = kendaraanSchema.safeParse({
        ...data,
        id
    })

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.vehicle.findUnique({ where: { id } })

        // Verify ownership if not SuperAdmin
        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : existing?.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        const { locationId, categoryId, vehicle_type, ...updateData } = parsed.data

        let resolvedType = vehicle_type || existing?.vehicle_type || "Mixer"
        let finalCategoryId = categoryId !== undefined ? categoryId : existing?.categoryId

        if (finalCategoryId) {
            const cat = await prisma.vehicleCategory.findUnique({ where: { id: finalCategoryId } })
            if (cat) {
                resolvedType = cat.name.toLowerCase().includes("mixer") ? "Mixer" : "Loader"
            }
        }

        await prisma.vehicle.update({
            where: { id },
            data: {
                ...updateData,
                vehicle_type: resolvedType,
                categoryId: finalCategoryId,
                locationId: finalLocationId
            }
        })
        revalidatePath("/admin/kendaraan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteKendaraan(id: string) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data kendaraan" }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.vehicle.findUnique({ where: { id } })

        // Verify ownership if not SuperAdmin
        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        await prisma.vehicle.delete({
            where: { id }
        })
        revalidatePath("/admin/kendaraan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Failed to delete kendaraan" }
    }
}
