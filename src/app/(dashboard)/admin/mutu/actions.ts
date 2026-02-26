"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const mutuSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama Mutu required"),
    composition_sand: z.coerce.number().min(0),
    composition_stone_05: z.coerce.number().min(0),
    composition_stone_12: z.coerce.number().min(0),
    composition_stone_23: z.coerce.number().min(0),
    composition_cement: z.coerce.number().min(0),
})

export async function getMutu() {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    return await prisma.concreteQuality.findMany({
        where: { createdById: session.user.employeeId },
        orderBy: { name: 'asc' }
    })
}

export async function createMutu(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = mutuSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        await prisma.concreteQuality.create({
            data: {
                ...parsed.data,
                createdById: session.user.employeeId
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
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = mutuSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const existing = await prisma.concreteQuality.findUnique({ where: { id } })
        if (existing?.createdById !== session.user.employeeId) return { success: false, error: "Unauthorized" }

        await prisma.concreteQuality.update({
            where: { id },
            data: parsed.data
        })
        revalidatePath("/admin/mutu")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteMutu(id: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        const existing = await prisma.concreteQuality.findUnique({ where: { id } })
        if (existing?.createdById !== session.user.employeeId) return { success: false, error: "Unauthorized" }

        await prisma.concreteQuality.delete({
            where: { id }
        })
        revalidatePath("/admin/mutu")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Failed to delete mutu" }
    }
}
