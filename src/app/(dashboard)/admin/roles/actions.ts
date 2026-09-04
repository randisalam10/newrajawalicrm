"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const roleSchema = z.object({
    name: z.string().min(2, "Kode role minimal 2 karakter").regex(/^[A-Za-z0-9_]+$/, "Hanya huruf, angka, dan underscore"),
    label: z.string().min(2, "Nama role minimal 2 karakter"),
    description: z.string().optional(),
    scope: z.enum(["ALL_BRANCHES", "OWN_BRANCH"]),
})

export async function getRoles() {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return []

    return await prisma.role.findMany({
        include: {
            _count: {
                select: {
                    permissions: true,
                    users: true,
                },
            },
        },
        orderBy: [
            { isSystem: 'desc' },
            { createdAt: 'asc' },
        ],
    })
}

export async function getRoleDetails(roleId: string) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return null

    return await prisma.role.findUnique({
        where: { id: roleId },
        include: {
            permissions: {
                include: {
                    permission: true,
                },
            },
            users: {
                select: {
                    id: true,
                    username: true,
                    employee: {
                        select: {
                            name: true,
                            location: { select: { name: true } },
                        },
                    },
                },
            },
        },
    })
}

export async function getAllPermissions() {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return []

    const permissions = await prisma.permission.findMany({
        orderBy: [
            { module: 'asc' },
            { action: 'asc' },
        ],
    })

    // Group by module
    const grouped: Record<string, typeof permissions> = {}
    for (const p of permissions) {
        if (!grouped[p.module]) grouped[p.module] = []
        grouped[p.module].push(p)
    }

    return grouped
}

export async function createRole(formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return { success: false, error: "Unauthorized" }

    const rawData = {
        name: formData.get("name"),
        label: formData.get("label"),
        description: formData.get("description") || undefined,
        scope: formData.get("scope"),
    }

    const parsed = roleSchema.safeParse(rawData)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Validasi gagal" }
    }

    try {
        const existing = await prisma.role.findUnique({ where: { name: parsed.data.name } })
        if (existing) {
            return { success: false, error: "Kode role sudah digunakan. Gunakan kode lain." }
        }

        const role = await prisma.role.create({
            data: {
                name: parsed.data.name,
                label: parsed.data.label,
                description: parsed.data.description,
                scope: parsed.data.scope,
                isSystem: false,
            },
        })

        revalidatePath("/admin/roles")
        return { success: true, role }
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal membuat role" }
    }
}

export async function updateRole(roleId: string, formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return { success: false, error: "Unauthorized" }

    const rawData = {
        name: formData.get("name"),
        label: formData.get("label"),
        description: formData.get("description") || undefined,
        scope: formData.get("scope"),
    }

    const parsed = roleSchema.safeParse(rawData)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Validasi gagal" }
    }

    try {
        const role = await prisma.role.findUnique({ where: { id: roleId } })
        if (!role) return { success: false, error: "Role tidak ditemukan" }

        // Cannot change name of system roles
        const updatedName = role.isSystem ? role.name : parsed.data.name

        await prisma.role.update({
            where: { id: roleId },
            data: {
                name: updatedName,
                label: parsed.data.label,
                description: parsed.data.description,
                scope: parsed.data.scope,
            },
        })

        revalidatePath("/admin/roles")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal mengupdate role" }
    }
}

export async function deleteRole(roleId: string) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return { success: false, error: "Unauthorized" }

    try {
        const role = await prisma.role.findUnique({
            where: { id: roleId },
            include: { users: true },
        })

        if (!role) return { success: false, error: "Role tidak ditemukan" }
        if (role.isSystem) return { success: false, error: "Role sistem bawaan tidak dapat dihapus." }
        if (role.users.length > 0) {
            return { success: false, error: `Role ini masih digunakan oleh ${role.users.length} user. Pindahkan user terlebih dahulu.` }
        }

        await prisma.role.delete({ where: { id: roleId } })
        revalidatePath("/admin/roles")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal menghapus role" }
    }
}

export async function updateRolePermissions(roleId: string, permissionCodes: string[]) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") return { success: false, error: "Unauthorized" }

    try {
        const role = await prisma.role.findUnique({ where: { id: roleId } })
        if (!role) return { success: false, error: "Role tidak ditemukan" }

        const allPermissions = await prisma.permission.findMany({
            where: { code: { in: permissionCodes } },
        })

        // Transaction: delete old and insert new
        await prisma.$transaction([
            prisma.rolePermission.deleteMany({ where: { roleId } }),
            prisma.rolePermission.createMany({
                data: allPermissions.map(p => ({
                    roleId,
                    permissionId: p.id,
                })),
                skipDuplicates: true,
            }),
        ])

        revalidatePath("/admin/roles")
        return { success: true, count: allPermissions.length }
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal memperbarui hak akses role" }
    }
}
