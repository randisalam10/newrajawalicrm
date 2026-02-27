"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const projectSchema = z.object({
    customerId: z.string().min(1, "Customer required"),
    name: z.string().min(1, "Nama Proyek required"),
    address: z.string().min(1, "Lokasi Proyek required"),
    default_distance: z.coerce.number().min(0, "Jarak minimal 0"),
    tax_ppn: z.coerce.number().min(0).max(100, "PPN max 100%"),
})

const customerSchema = z.object({
    id: z.string().optional(),
    customer_name: z.string().min(1, "Nama Customer required"),
    address: z.string().min(1, "Alamat Tagih required"),
    status: z.enum(["Active", "Inactive"]).default("Active"),
    locationId: z.string().optional(), // For SuperAdmin Branch Assignment
})

export async function getCustomers() {
    const session = await auth()
    if (!session?.user?.employeeId || (!session.user.locationId && session.user.role !== 'SuperAdminBP')) return []

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const filter = isSuperAdmin ? {} : { locationId: session.user.locationId! }

    return await prisma.customer.findMany({
        where: filter,
        include: { location: true },
        orderBy: { customer_name: 'asc' }
    })
}

export async function createCustomer(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = customerSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : session.user.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        // Exclude locationId from the actual insert data
        const { locationId, ...insertData } = parsed.data

        await prisma.customer.create({
            data: {
                ...insertData,
                locationId: finalLocationId
            }
        })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateCustomer(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = customerSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.customer.findUnique({ where: { id } })

        // Verify ownership if not SuperAdmin
        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : existing?.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        const { locationId, ...updateData } = parsed.data

        await prisma.customer.update({
            where: { id },
            data: {
                ...updateData,
                locationId: finalLocationId
            }
        })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteCustomer(id: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.customer.findUnique({ where: { id } })

        // Verify ownership if not SuperAdmin
        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        await prisma.customer.delete({
            where: { id }
        })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Failed to delete customer" }
    }
}

export async function getCustomersWithProjects() {
    const session = await auth()
    if (!session?.user?.employeeId || (!session.user.locationId && session.user.role !== 'SuperAdminBP')) return []

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const filter = isSuperAdmin ? {} : { locationId: session.user.locationId! }

    return await prisma.customer.findMany({
        where: filter,
        include: {
            location: true,
            projects: {
                include: { prices: { include: { concreteQuality: true } } },
                orderBy: { name: 'asc' }
            }
        },
        orderBy: { customer_name: 'asc' }
    })
}

export async function createProject(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = projectSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        await prisma.project.create({ data: parsed.data })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateProject(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = Object.fromEntries(formData.entries())
    const parsed = projectSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        await prisma.project.update({ where: { id }, data: parsed.data })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteProject(id: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        await prisma.project.delete({ where: { id } })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus proyek. Pastikan tidak ada transaksi aktif." }
    }
}
