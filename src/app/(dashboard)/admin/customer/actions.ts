"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

function isUserSuperAdmin(session: any): boolean {
    if (!session?.user) return false
    const role = session.user.role || ""
    const scope = session.user.roleScope || ""
    return role === "SuperAdminBP" || scope === "ALL_BRANCHES" || ["CEO", "FVP"].includes(role)
}

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
    try {
        const session = await auth()
        if (!session?.user?.employeeId) return []

        const isSuperAdmin = isUserSuperAdmin(session)
        const userLocId = session.user.locationId

        const filter = isSuperAdmin
            ? {}
            : userLocId
                ? {
                    OR: [
                        { locationId: userLocId },
                        { sharedLocations: { some: { id: userLocId } } }
                    ]
                }
                : {}

        return await prisma.customer.findMany({
            where: filter,
            include: { location: true, sharedLocations: true },
            orderBy: { customer_name: 'asc' }
        })
    } catch (err: any) {
        console.error("Error in getCustomers:", err)
        return []
    }
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
        const isSuperAdmin = isUserSuperAdmin(session)
        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : session.user.locationId

        if (!finalLocationId) {
            return { success: false, error: "Cabang (Lokasi) wajib dipilih." }
        }

        // Exclude locationId and sharedLocationIds from the actual insert data
        const { locationId, sharedLocationIds, ...insertData } = parsed.data

        const validSharedIds = (sharedLocationIds || []).filter(id => Boolean(id) && id.trim().length > 0)
        const sharedLocationsQuery = validSharedIds.length > 0
            ? { connect: validSharedIds.map(id => ({ id })) }
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
        console.error("createCustomer error:", e)
        return { success: false, error: e.message || "Gagal membuat data customer." }
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
        const isSuperAdmin = isUserSuperAdmin(session)
        const existing = await prisma.customer.findUnique({ where: { id } })

        // Verify ownership if not SuperAdmin
        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : existing?.locationId

        if (!finalLocationId) {
            return { success: false, error: "Cabang (Lokasi) wajib dipilih." }
        }

        const { locationId, sharedLocationIds, ...updateData } = parsed.data

        const validSharedIds = (sharedLocationIds || []).filter(id => Boolean(id) && id.trim().length > 0)
        const sharedLocationsQuery = {
            set: validSharedIds.map(id => ({ id }))
        }

        await prisma.customer.update({
            where: { id },
            data: {
                ...updateData,
                locationId: finalLocationId,
                sharedLocations: sharedLocationsQuery
            }
        })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        console.error("updateCustomer error:", e)
        return { success: false, error: e.message || "Gagal memperbarui data customer." }
    }
}

export async function deleteCustomer(id: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        const isSuperAdmin = isUserSuperAdmin(session)
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
        console.error("deleteCustomer error:", e)
        return { success: false, error: "Gagal menghapus customer. Pastikan tidak ada transaksi yang terikat." }
    }
}

export async function getCustomersWithProjects() {
    try {
        const session = await auth()
        if (!session?.user?.employeeId) return []

        const isSuperAdmin = isUserSuperAdmin(session)
        const userLocId = session.user.locationId

        const filter = isSuperAdmin
            ? {}
            : userLocId
                ? {
                    OR: [
                        { locationId: userLocId },
                        { sharedLocations: { some: { id: userLocId } } }
                    ]
                }
                : {}

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
    } catch (err: any) {
        console.error("Error in getCustomersWithProjects:", err)
        return []
    }
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
        const validSharedIds = (sharedLocationIds || []).filter(id => Boolean(id) && id.trim().length > 0)
        const sharedLocationsQuery = validSharedIds.length > 0
            ? { connect: validSharedIds.map(id => ({ id })) }
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
        console.error("createProject error:", e)
        return { success: false, error: e.message || "Gagal membuat proyek." }
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
        const validSharedIds = (sharedLocationIds || []).filter(id => Boolean(id) && id.trim().length > 0)
        const sharedLocationsQuery = {
            set: validSharedIds.map(id => ({ id }))
        }

        await prisma.project.update({
            where: { id },
            data: {
                ...projectData,
                sharedLocations: sharedLocationsQuery
            }
        })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        console.error("updateProject error:", e)
        return { success: false, error: e.message || "Gagal memperbarui proyek." }
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
        console.error("deleteProject error:", e)
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
        console.error("upsertProjectPrice error:", e)
        return { success: false, error: e.message || "Gagal menyimpan harga mutu proyek." }
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
        console.error("deleteProjectPrice error:", e)
        return { success: false, error: e.message || "Gagal menghapus harga mutu proyek." }
    }
}

export async function getConcreteQualitiesForLocation() {
    try {
        const session = await auth()
        if (!session?.user?.employeeId) return []

        const isSuperAdmin = isUserSuperAdmin(session)
        const userLocId = session.user.locationId

        const filter = isSuperAdmin
            ? {}
            : userLocId
                ? { locationId: userLocId }
                : {}

        return await prisma.concreteQuality.findMany({ where: filter, orderBy: { name: 'asc' } })
    } catch (err: any) {
        console.error("Error in getConcreteQualitiesForLocation:", err)
        return []
    }
}
