"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const karyawanSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama Karyawan required"),
    position: z.enum(["Sopir", "Operator", "Admin", "AdminLogistik", "CEO", "FVP"]),
    status: z.enum(["Active", "Inactive"]).default("Active"),
    join_date: z.string().min(1, "Tanggal Bergabung required"),
    locationId: z.string().optional(), // For SuperAdmin Branch Assignment
})

export async function getKaryawans() {
    const session = await auth()
    if (!session?.user?.employeeId || (!session.user.locationId && session.user.role !== 'SuperAdminBP')) return []

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const filter = isSuperAdmin ? {} : { locationId: session.user.locationId! }

    return await prisma.employee.findMany({
        where: filter,
        include: { location: true },
        orderBy: { name: 'asc' }
    })
}

export async function createKaryawan(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = karyawanSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const finalLocationId = (isSuperAdmin && parsed.data.locationId) ? parsed.data.locationId : session.user.locationId

        const isCorporateLevel = ["AdminLogistik", "CEO", "FVP"].includes(parsed.data.position)
        if (!finalLocationId && !isCorporateLevel) {
            return { success: false, error: "Location is required for this position." }
        }

        const { locationId, ...insertData } = parsed.data

        await prisma.employee.create({
            data: {
                name: insertData.name,
                position: insertData.position,
                status: insertData.status,
                join_date: new Date(insertData.join_date),
                locationId: isCorporateLevel ? null : finalLocationId
            }
        })
        revalidatePath("/admin/karyawan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateKaryawan(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = karyawanSchema.safeParse({
        ...data,
        id
    })

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.employee.findUnique({ where: { id } })

        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        const finalLocationId = (isSuperAdmin && parsed.data.locationId) ? parsed.data.locationId : existing?.locationId

        const isCorporateLevel = ["AdminLogistik", "CEO", "FVP"].includes(parsed.data.position)
        if (!finalLocationId && !isCorporateLevel) {
            return { success: false, error: "Location is required for this position." }
        }

        const { locationId, ...updateData } = parsed.data

        await prisma.employee.update({
            where: { id },
            data: {
                name: updateData.name,
                position: updateData.position,
                status: updateData.status,
                join_date: new Date(updateData.join_date),
                locationId: isCorporateLevel ? null : finalLocationId
            }
        })
        revalidatePath("/admin/karyawan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteKaryawan(id: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.employee.findUnique({ where: { id } })

        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        await prisma.employee.delete({
            where: { id }
        })
        revalidatePath("/admin/karyawan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Failed to delete karyawan" }
    }
}
