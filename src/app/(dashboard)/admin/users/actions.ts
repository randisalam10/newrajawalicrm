"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

const userCreateSchema = z.object({
    username: z.string().min(3, "Username minimal 3 karakter"),
    password: z.string().min(5, "Password minimal 5 karakter"),
    role: z.enum(["SuperAdminBP", "AdminBP", "OperatorBP", "AdminLogistik", "CEO", "FVP"]),
    employeeId: z.string().min(1, "Pegawai required"),
})

const userUpdateSchema = z.object({
    id: z.string(),
    username: z.string().min(3, "Username minimal 3 karakter"),
    password: z.string().min(5, "Password minimal 5 karakter").optional().or(z.literal("")),
    role: z.enum(["SuperAdminBP", "AdminBP", "OperatorBP", "AdminLogistik", "CEO", "FVP"]),
})

export async function getEligibleEmployees() {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return []

    // For SuperAdminBP role, allow all positions except Sopir
    return await prisma.employee.findMany({
        where: { user: null, position: { not: "Sopir" } },
        include: { location: true },
        orderBy: { name: 'asc' }
    })
}

export async function getUsers() {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return []

    return await prisma.user.findMany({
        include: {
            employee: { include: { location: true } }
        },
        orderBy: [
            { role: 'asc' },
            { username: 'asc' }
        ]
    })
}

export async function createUser(formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = userCreateSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const hashedPassword = await bcrypt.hash(parsed.data.password, 10)

        await prisma.user.create({
            data: {
                username: parsed.data.username,
                password: hashedPassword,
                role: parsed.data.role,
                employeeId: parsed.data.employeeId
            }
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: "Username sudah digunakan!" }
        return { success: false, error: e.message }
    }
}

export async function updateUser(id: string, formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = userUpdateSchema.safeParse({ ...data, id })

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const updateData: any = {
            username: parsed.data.username,
            role: parsed.data.role,
        }

        if (parsed.data.password) {
            updateData.password = await bcrypt.hash(parsed.data.password, 10)
        }

        await prisma.user.update({
            where: { id },
            data: updateData
        })

        revalidatePath("/admin/users")
        return { success: true }
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: "Username sudah digunakan!" }
        return { success: false, error: e.message }
    }
}

export async function deleteUser(id: string) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return { success: false, error: "Unauthorized" }

    try {
        const user = await prisma.user.findUnique({ where: { id } })
        if (!user) return { success: false, error: "User not found" }

        await prisma.user.delete({ where: { id } })

        revalidatePath("/admin/users")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus! Pastikan user ini belum memiliki riwayat transaksi/data." }
    }
}
