"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const kendaraanSchema = z.object({
    id: z.string().optional(),
    plate_number: z.string().min(1, "Plat Nomor required"),
    vehicle_type: z.enum(["Mixer", "Loader"]),
    code: z.string().min(1, "Kode Kendaraan required"),
})

export async function getKendaraan() {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    return await prisma.vehicle.findMany({
        where: { createdById: session.user.employeeId },
        orderBy: { code: 'asc' }
    })
}

export async function createKendaraan(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = kendaraanSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        await prisma.vehicle.create({
            data: {
                ...parsed.data,
                createdById: session.user.employeeId
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
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = kendaraanSchema.safeParse({
        ...data,
        id
    })

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const existing = await prisma.vehicle.findUnique({ where: { id } })
        if (existing?.createdById !== session.user.employeeId) return { success: false, error: "Unauthorized" }

        await prisma.vehicle.update({
            where: { id },
            data: parsed.data
        })
        revalidatePath("/admin/kendaraan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteKendaraan(id: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        const existing = await prisma.vehicle.findUnique({ where: { id } })
        if (existing?.createdById !== session.user.employeeId) return { success: false, error: "Unauthorized" }

        await prisma.vehicle.delete({
            where: { id }
        })
        revalidatePath("/admin/kendaraan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Failed to delete kendaraan" }
    }
}
