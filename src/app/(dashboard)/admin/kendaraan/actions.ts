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
    locationId: z.string().optional(), // For SuperAdmin Branch Assignment
})

export async function getKendaraan() {
    const session = await auth()
    if (!session?.user?.employeeId || (!session.user.locationId && session.user.role !== 'SuperAdminBP')) return []

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const filter = isSuperAdmin ? {} : { locationId: session.user.locationId! }

    return await prisma.vehicle.findMany({
        where: filter,
        include: { location: true },
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
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : session.user.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        // Exclude locationId from the actual insert data
        const { locationId, ...insertData } = parsed.data

        await prisma.vehicle.create({
            data: {
                ...insertData,
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
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.vehicle.findUnique({ where: { id } })

        // Verify ownership if not SuperAdmin
        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : existing?.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        const { locationId, ...updateData } = parsed.data

        await prisma.vehicle.update({
            where: { id },
            data: {
                ...updateData,
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
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

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
