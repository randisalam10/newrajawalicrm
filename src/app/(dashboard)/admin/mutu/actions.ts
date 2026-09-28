"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"
import { isCorporateUser } from "@/lib/rbac"

const mutuSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama Mutu required"),
    composition_sand: z.coerce.number().min(0),
    composition_stone_05: z.coerce.number().min(0),
    composition_stone_12: z.coerce.number().min(0),
    composition_stone_23: z.coerce.number().min(0),
    composition_cement: z.coerce.number().min(0),
    density_sand: z.coerce.number().min(0).default(1400),
    density_stone_05: z.coerce.number().min(0).default(1400),
    density_stone_12: z.coerce.number().min(0).default(1450),
    density_stone_23: z.coerce.number().min(0).default(1450),
    locationId: z.string().optional(), // For SuperAdmin Branch Assignment
})

function normalizeDensity(val: number | undefined, fallback: number): number {
    if (!val || val <= 0) return fallback
    if (val < 10) return Math.round(val * 1000) // Support ton/m³ input e.g. 1.4 -> 1400 kg/m³
    return val
}

function canManageMutu(user: any) {
    if (!user) return false
    if (user.role === "SuperAdminBP") return true
    if (["CEO", "FVP", "Approver"].includes(user.role)) return false
    const perms: string[] = user.permissions || []
    return user.role === "AdminBP" || perms.includes("MUTU_CREATE") || perms.includes("MUTU_EDIT")
}

export async function getMutu() {
    const session = await auth()
    if (!session?.user) return []

    const userRole = session.user.role || ""
    const perms: string[] = session.user.permissions || []
    const canView = userRole === "SuperAdminBP" ||
        perms.includes("MUTU_VIEW") ||
        (["AdminBP", "CEO", "FVP"].includes(userRole) && userRole !== "AdminLogistik")

    if (!canView) return []

    const isCorp = isCorporateUser(session.user)
    const filter = isCorp ? {} : (session.user.locationId ? { locationId: session.user.locationId } : {})

    return await prisma.concreteQuality.findMany({
        where: filter,
        include: { location: true },
        orderBy: { name: 'asc' }
    })
}

export async function createMutu(formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageMutu(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data mutu beton" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = mutuSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : session.user.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        const { locationId, ...rawInsert } = parsed.data
        const insertData = {
            ...rawInsert,
            density_sand: normalizeDensity(rawInsert.density_sand, 1400),
            density_stone_05: normalizeDensity(rawInsert.density_stone_05, 1400),
            density_stone_12: normalizeDensity(rawInsert.density_stone_12, 1450),
            density_stone_23: normalizeDensity(rawInsert.density_stone_23, 1450),
        }

        await prisma.concreteQuality.create({
            data: {
                ...insertData,
                locationId: finalLocationId
            }
        })
        revalidatePath("/admin/mutu")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateMutu(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageMutu(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data mutu beton" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = mutuSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.concreteQuality.findUnique({ where: { id } })

        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : existing?.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        const { locationId, ...rawUpdate } = parsed.data
        const updateData = {
            ...rawUpdate,
            density_sand: normalizeDensity(rawUpdate.density_sand, 1400),
            density_stone_05: normalizeDensity(rawUpdate.density_stone_05, 1400),
            density_stone_12: normalizeDensity(rawUpdate.density_stone_12, 1450),
            density_stone_23: normalizeDensity(rawUpdate.density_stone_23, 1450),
        }

        await prisma.concreteQuality.update({
            where: { id },
            data: {
                ...updateData,
                locationId: finalLocationId
            }
        })
        revalidatePath("/admin/mutu")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteMutu(id: string) {
    const session = await auth()
    if (!session?.user || !canManageMutu(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data mutu beton" }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.concreteQuality.findUnique({ where: { id } })

        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        await prisma.concreteQuality.delete({
            where: { id }
        })
        revalidatePath("/admin/mutu")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Failed to delete mutu" }
    }
}
