"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"
import { isCorporateUser, hasPermission, resolveTargetLocationId } from "@/lib/rbac"

const workItemSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama Item Pekerjaan required"),
    locationId: z.string().optional(), // For SuperAdmin Branch Assignment
})

function canManageWorkItem(user: any) {
    if (!user) return false
    return hasPermission(user, "ITEM_PEKERJAAN", "CREATE") || hasPermission(user, "ITEM_PEKERJAAN", "EDIT")
}

export async function getWorkItems() {
    const session = await auth()
    if (!session?.user) return []

    const canView = hasPermission(session.user, "ITEM_PEKERJAAN", "VIEW")
    if (!canView) return []

    const isCorp = isCorporateUser(session.user)
    const filter = isCorp ? {} : (session.user.locationId ? { locationId: session.user.locationId } : {})

    return await prisma.workItem.findMany({
        where: filter,
        include: { location: true },
        orderBy: { name: 'asc' }
    })
}

export async function createWorkItem(formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageWorkItem(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data item pekerjaan" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = workItemSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        let finalLocationId: string
        try {
            finalLocationId = resolveTargetLocationId(session.user, parsed.data.locationId)
        } catch (locErr: any) {
            return { success: false, error: locErr.message || "Location is required" }
        }

        const { locationId, ...insertData } = parsed.data

        await prisma.workItem.create({
            data: {
                ...insertData,
                locationId: finalLocationId
            }
        })
        revalidatePath("/admin/item-pekerjaan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateWorkItem(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageWorkItem(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data item pekerjaan" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = workItemSchema.safeParse({
        ...data,
        id
    })

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isCorp = isCorporateUser(session.user)
        const existing = await prisma.workItem.findUnique({ where: { id } })

        if (!isCorp && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        const finalLocationId = isCorp && parsed.data.locationId ? parsed.data.locationId : existing?.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        const { locationId, ...updateData } = parsed.data

        await prisma.workItem.update({
            where: { id },
            data: {
                ...updateData,
                locationId: finalLocationId
            }
        })
        revalidatePath("/admin/item-pekerjaan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteWorkItem(id: string) {
    const session = await auth()
    if (!session?.user || !canManageWorkItem(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data item pekerjaan" }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.workItem.findUnique({ where: { id } })

        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        await prisma.workItem.delete({
            where: { id }
        })
        revalidatePath("/admin/item-pekerjaan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Failed to delete item pekerjaan" }
    }
}
