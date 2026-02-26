"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const customerSchema = z.object({
    id: z.string().optional(),
    customer_name: z.string().min(1, "Nama Customer required"),
    project_name: z.string().min(1, "Nama Proyek required"),
    default_distance: z.coerce.number().min(0),
    tax_ppn: z.coerce.number().min(0).max(100),
    location: z.string().min(1, "Lokasi required"),
    status: z.enum(["Active", "Inactive"]).default("Active"),
})

export async function getCustomers() {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    return await prisma.customer.findMany({
        where: { createdById: session.user.employeeId },
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
        await prisma.customer.create({
            data: {
                ...parsed.data,
                createdById: session.user.employeeId
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
        // Verify ownership
        const existing = await prisma.customer.findUnique({ where: { id } })
        if (existing?.createdById !== session.user.employeeId) return { success: false, error: "Unauthorized" }

        await prisma.customer.update({
            where: { id },
            data: parsed.data
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
        // Verify ownership
        const existing = await prisma.customer.findUnique({ where: { id } })
        if (existing?.createdById !== session.user.employeeId) return { success: false, error: "Unauthorized" }

        await prisma.customer.delete({
            where: { id }
        })
        revalidatePath("/admin/customer")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Failed to delete customer" }
    }
}
