"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const workItemSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama Item Pekerjaan required"),
})

export async function getWorkItems() {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    return await prisma.workItem.findMany({
        where: { createdById: session.user.employeeId },
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
        await prisma.workItem.create({
            data: {
                ...parsed.data,
                createdById: session.user.employeeId
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
        const existing = await prisma.workItem.findUnique({ where: { id } })
        if (existing?.createdById !== session.user.employeeId) return { success: false, error: "Unauthorized" }

        await prisma.workItem.update({
            where: { id },
            data: parsed.data
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
        const existing = await prisma.workItem.findUnique({ where: { id } })
        if (existing?.createdById !== session.user.employeeId) return { success: false, error: "Unauthorized" }

        await prisma.workItem.delete({
            where: { id }
        })
        revalidatePath("/admin/item-pekerjaan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Failed to delete item pekerjaan" }
    }
}
