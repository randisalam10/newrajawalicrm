'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// --- SETTINGS ---

export async function getRetaseSettings() {
    const session = await auth()
    if (!session?.user?.employeeId) return null

    let filter = {}
    if (session.user.role !== 'SuperAdminBP' && session.user.locationId) {
        filter = { locationId: session.user.locationId }
    }

    // For SuperAdmin, just fetch all settings to display or let them filter in UI
    // Or simpler: We return the settings alongside the locations they map to
    const settings = await (prisma as any).retaseSetting.findMany({
        where: filter,
        include: { location: true }
    })

    return settings
}

const updateSettingSchema = z.object({
    locationId: z.string().min(1, "Location required"),
    price_per_cubic_km: z.coerce.number().min(0, "Price cannot be negative")
})

export async function upsertRetaseSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { error: "Unauthorized" }

    try {
        const parsed = updateSettingSchema.parse(Object.fromEntries(formData.entries()))
        const isSuperAdmin = session.user.role === 'SuperAdminBP'

        // Anti-tamper check for regular Admins
        if (!isSuperAdmin && session.user.locationId !== parsed.locationId) {
            return { error: "Permission Denied: Cannot change settings for another branch." }
        }

        await (prisma as any).retaseSetting.upsert({
            where: { locationId: parsed.locationId },
            update: { price_per_cubic_km: parsed.price_per_cubic_km },
            create: { locationId: parsed.locationId, price_per_cubic_km: parsed.price_per_cubic_km }
        })

        revalidatePath("/admin/retase")
        return { success: true }
    } catch (e: any) {
        return { error: e.message || "Something went wrong" }
    }
}

// --- PENDING / CONFIRMATIONS ---

export async function getTransactions(status: "Pending" | "Confirmed") {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    let filter: any = { status }
    if (session.user.role !== 'SuperAdminBP' && session.user.locationId) {
        filter.locationId = session.user.locationId
    }

    return await (prisma as any).productionTransaction.findMany({
        where: filter,
        include: {
            customer: true,
            vehicle: true,
            driver: true,
            concreteQuality: true,
            workItem: true,
            location: true,
            retase: true
        },
        orderBy: { date: 'desc' }
    })
}

export async function confirmTransaction(transactionId: string, distance: number) {
    const session = await auth()
    if (!session?.user?.employeeId) return { error: "Unauthorized" }

    try {
        const transaction: any = await prisma.productionTransaction.findUnique({
            where: { id: transactionId },
            include: { vehicle: true }
        })

        if (!transaction) return { error: "Transaction not found" }
        if (transaction.status === "Confirmed") return { error: "Already confirmed" }

        // Needs RetaseSetting based on Transaction's Location
        const setting = await (prisma as any).retaseSetting.findUnique({
            where: { locationId: transaction.locationId }
        })

        if (!setting) {
            return { error: "Belum ada pengaturan Harga Retase untuk cabang pesanan ini! Harap atur di tab Pengaturan terlebih dahulu." }
        }

        const price_per_cubic_km = setting.price_per_cubic_km
        const volume = transaction.volume_cubic
        const calcDistance = Number(distance)
        const income_amount = calcDistance * volume * price_per_cubic_km

        await prisma.$transaction([
            (prisma as any).retase.create({
                data: {
                    transactionId,
                    driverId: transaction.driverId,
                    calculated_distance: calcDistance,
                    volume: volume,
                    price_per_cubic_km: price_per_cubic_km,
                    income_amount: income_amount
                }
            }),
            prisma.productionTransaction.update({
                where: { id: transactionId },
                data: { status: "Confirmed" }
            })
        ])

        revalidatePath("/admin/retase")
        return { success: true }
    } catch (e: any) {
        console.error(e)
        return { error: e.message || "Failed to confirm" }
    }
}

// --- AUDIT LOG & DELETE ---

export async function deleteConfirmedTransaction(transactionId: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { error: "Unauthorized" }

    try {
        const transaction: any = await prisma.productionTransaction.findUnique({
            where: { id: transactionId },
            include: { retase: true }
        })

        if (!transaction) return { error: "Not found" }

        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        if (!isSuperAdmin && session.user.locationId !== transaction.locationId) {
            return { error: "Access Denied" }
        }

        // Create Audit Log and Delete 
        await prisma.$transaction([
            (prisma as any).auditLog.create({
                data: {
                    action: "DELETE",
                    entity: "ProductionTransaction",
                    recordId: transactionId,
                    old_values: JSON.stringify(transaction),
                    userId: session.user.id
                }
            }),
            prisma.productionTransaction.delete({
                where: { id: transactionId }
            })
        ])

        revalidatePath("/admin/retase")
        return { success: true }
    } catch (e: any) {
        console.error(e)
        return { error: e.message || "Failed to delete" }
    }
}
