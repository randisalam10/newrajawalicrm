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
    sharedLocationIds: z.array(z.string()).optional(),
})

const customerSchema = z.object({
    id: z.string().optional(),
    customer_name: z.string().min(1, "Nama Customer required"),
    address: z.string().min(1, "Alamat Tagih required"),
    status: z.enum(["Active", "Inactive"]).default("Active"),
    locationId: z.string().optional(), // For SuperAdmin Branch Assignment
    sharedLocationIds: z.array(z.string()).optional(),
})

export async function getCustomers() {
    const session = await auth()
    if (!session?.user?.employeeId || (!session.user.locationId && session.user.role !== 'SuperAdminBP')) return []

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const filter = isSuperAdmin ? {} : {
        OR: [
            { locationId: session.user.locationId! },
            { sharedLocations: { some: { id: session.user.locationId! } } }
        ]
    }

    return await prisma.customer.findMany({
        where: filter,
        include: { location: true, sharedLocations: true },
        orderBy: { customer_name: 'asc' }
    })
}

export async function createCustomer(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = {
        ...Object.fromEntries(formData.entries()),
        sharedLocationIds: formData.getAll("sharedLocationIds")
    }
    const parsed = customerSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : session.user.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        // Exclude locationId and sharedLocationIds from the actual insert data
        const { locationId, sharedLocationIds, ...insertData } = parsed.data

        const sharedLocationsQuery = sharedLocationIds && sharedLocationIds.length > 0
            ? { connect: sharedLocationIds.map(id => ({ id })) }
            : undefined

        await prisma.customer.create({
            data: {
                ...insertData,
                locationId: finalLocationId,
                ...(sharedLocationsQuery && { sharedLocations: sharedLocationsQuery })
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

    const data = {
        ...Object.fromEntries(formData.entries()),
        sharedLocationIds: formData.getAll("sharedLocationIds")
    }
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

        const { locationId, sharedLocationIds, ...updateData } = parsed.data

        const sharedLocationsQuery = sharedLocationIds
            ? { set: sharedLocationIds.map(id => ({ id })) }
            : undefined

        await prisma.customer.update({
            where: { id },
            data: {
                ...updateData,
                locationId: finalLocationId,
                ...(sharedLocationsQuery && { sharedLocations: sharedLocationsQuery })
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
    const filter = isSuperAdmin ? {} : {
        OR: [
            { locationId: session.user.locationId! },
            { sharedLocations: { some: { id: session.user.locationId! } } }
        ]
    }

    return await prisma.customer.findMany({
        where: filter,
        include: {
            location: true,
            sharedLocations: true,
            projects: {
                include: {
                    prices: { include: { concreteQuality: true } },
                    sharedLocations: true
                },
                orderBy: { name: 'asc' }
            }
        },
        orderBy: { customer_name: 'asc' }
    })
}

export async function createProject(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = {
        ...Object.fromEntries(formData.entries()),
        sharedLocationIds: formData.getAll("sharedLocationIds")
    }
    const parsed = projectSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const { sharedLocationIds, ...projectData } = parsed.data
        const sharedLocationsQuery = sharedLocationIds && sharedLocationIds.length > 0
            ? { connect: sharedLocationIds.map(id => ({ id })) }
            : undefined

        await prisma.project.create({
            data: {
                ...projectData,
                ...(sharedLocationsQuery && { sharedLocations: sharedLocationsQuery })
            }
        })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateProject(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    const data = {
        ...Object.fromEntries(formData.entries()),
        sharedLocationIds: formData.getAll("sharedLocationIds")
    }
    const parsed = projectSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const { sharedLocationIds, ...projectData } = parsed.data
        const sharedLocationsQuery = sharedLocationIds
            ? { set: sharedLocationIds.map(id => ({ id })) }
            : undefined

        await prisma.project.update({
            where: { id },
            data: {
                ...projectData,
                ...(sharedLocationsQuery && { sharedLocations: sharedLocationsQuery })
            }
        })
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

export async function upsertProjectPrice(projectId: string, qualityId: string, price: number) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }
    try {
        await prisma.projectPrice.upsert({
            where: { projectId_qualityId: { projectId, qualityId } },
            create: { projectId, qualityId, price },
            update: { price },
        })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteProjectPrice(projectId: string, qualityId: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }
    try {
        await prisma.projectPrice.delete({
            where: { projectId_qualityId: { projectId, qualityId } },
        })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function getConcreteQualitiesForLocation() {
    const session = await auth()
    if (!session?.user?.employeeId) return []
    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const filter = isSuperAdmin ? {} : { locationId: session.user.locationId! }
    return prisma.concreteQuality.findMany({ where: filter, orderBy: { name: 'asc' } })
}
