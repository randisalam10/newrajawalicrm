"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const karyawanSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama Karyawan required"),
    position: z.enum(["Sopir", "Operator", "Admin"]),
    status: z.enum(["Active", "Inactive"]).default("Active"),
    join_date: z.string().min(1, "Tanggal Bergabung required"),
})

export async function getKaryawans() {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    return await prisma.employee.findMany({
        where: { createdById: session.user.employeeId },
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
        await prisma.employee.create({
            data: {
                name: parsed.data.name,
                position: parsed.data.position,
                status: parsed.data.status,
                join_date: new Date(parsed.data.join_date),
                createdById: session.user.employeeId
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
        const existing = await prisma.employee.findUnique({ where: { id } })
        if (existing?.createdById !== session.user.employeeId) return { success: false, error: "Unauthorized" }

        await prisma.employee.update({
            where: { id },
            data: {
                name: parsed.data.name,
                position: parsed.data.position,
                status: parsed.data.status,
                join_date: new Date(parsed.data.join_date)
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
        const existing = await prisma.employee.findUnique({ where: { id } })
        if (existing?.createdById !== session.user.employeeId) return { success: false, error: "Unauthorized" }

        await prisma.employee.delete({
            where: { id }
        })
        revalidatePath("/admin/karyawan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Failed to delete karyawan" }
    }
}
