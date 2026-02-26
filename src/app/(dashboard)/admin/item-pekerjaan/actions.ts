"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const workItemSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama Item Pekerjaan required"),
    locationId: z.string().optional(), // For SuperAdmin Branch Assignment
})

export async function getWorkItems() {
    const session = await auth()
    if (!session?.user?.employeeId || (!session.user.locationId && session.user.role !== 'SuperAdminBP')) return []

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const filter = isSuperAdmin ? {} : { locationId: session.user.locationId! }

    return await prisma.workItem.findMany({
        where: filter,
        include: { location: true },
        orderBy: { name: 'asc' }
    })
}

export async function createWorkItem(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = workItemSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : session.user.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

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
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = workItemSchema.safeParse({
        ...data,
        id
    })

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.workItem.findUnique({ where: { id } })

        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : existing?.locationId

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
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

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
