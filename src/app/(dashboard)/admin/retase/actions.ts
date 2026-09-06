'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

function isCorporate(session: any): boolean {
    if (!session?.user) return false
    const role = session.user.role || ""
    const scope = session.user.roleScope || ""
    return role === "SuperAdminBP" || scope === "ALL_BRANCHES" || ["CEO", "FVP", "Approver"].includes(role)
}

function canManageRetase(session: any): boolean {
    if (!session?.user) return false
    const role = session.user.role || ""
    if (["CEO", "FVP", "Approver"].includes(role)) return false
    return role === "SuperAdminBP" || role === "AdminBP"
}

// --- SETTINGS ---

export async function getRetaseSettings() {
    const session = await auth()
    if (!session?.user?.employeeId) return null

    let filter = {}
    if (!isCorporate(session) && session.user.locationId) {
        filter = { locationId: session.user.locationId }
    }

    const settings = await (prisma as any).retaseSetting.findMany({
        where: filter,
        include: { location: true }
    })

    return settings
}

const updateSettingSchema = z.object({
    locationId: z.string().min(1, "Location required"),
    price_per_cubic_km: z.coerce.number().min(0, "Price cannot be negative"),
    calculation_mode: z.enum(["DISTANCE_ONLY", "DISTANCE_AND_VOLUME"]).default("DISTANCE_ONLY"),
    apply_mode: z.enum(["FUTURE", "BACKDATE"]).default("FUTURE"),
    effective_date: z.string().optional()
})

export async function upsertRetaseSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user?.employeeId) return { error: "Unauthorized" }
    if (!canManageRetase(session)) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

    try {
        const parsed = updateSettingSchema.parse(Object.fromEntries(formData.entries()))
        const isSuperAdmin = session.user.role === 'SuperAdminBP'

        // Anti-tamper check for regular Admins
        if (!isSuperAdmin && session.user.locationId !== parsed.locationId) {
            return { error: "Permission Denied: Cannot change settings for another branch." }
        }

        // Fetch existing setting to know old values for audit log
        const oldSetting = await (prisma as any).retaseSetting.findUnique({
            where: { locationId: parsed.locationId },
            include: { location: true }
        })

        const effectiveFrom = parsed.apply_mode === 'BACKDATE' && parsed.effective_date
            ? new Date(parsed.effective_date)
            : new Date()

        // 1. Upsert RetaseSetting
        const newSetting = await (prisma as any).retaseSetting.upsert({
            where: { locationId: parsed.locationId },
            update: {
                price_per_cubic_km: parsed.price_per_cubic_km,
                calculation_mode: parsed.calculation_mode,
                effective_from: effectiveFrom,
            },
            create: {
                locationId: parsed.locationId,
                price_per_cubic_km: parsed.price_per_cubic_km,
                calculation_mode: parsed.calculation_mode,
                effective_from: effectiveFrom,
            }
        })

        let revisedCount = 0

        // 2. If BACKDATE: recalculate past confirmed transactions from effective_date
        if (parsed.apply_mode === 'BACKDATE' && parsed.effective_date) {
            const startOfEffectiveDate = new Date(`${parsed.effective_date}T00:00:00.000Z`)

            // Find all confirmed transactions for this branch on or after startOfEffectiveDate that have retase
            const pastTransactions = await (prisma as any).productionTransaction.findMany({
                where: {
                    locationId: parsed.locationId,
                    date: { gte: startOfEffectiveDate },
                    retase: { isNot: null }
                },
                include: { retase: true }
            })

            if (pastTransactions.length > 0) {
                const updateOps: any[] = []
                const recalculationLogs: any[] = []

                for (const tx of pastTransactions) {
                    if (!tx.retase) continue
                    const oldRetase = tx.retase
                    const distance = oldRetase.calculated_distance
                    const volume = tx.volume_cubic ?? oldRetase.volume

                    const newIncome = parsed.calculation_mode === "DISTANCE_ONLY"
                        ? distance * parsed.price_per_cubic_km
                        : distance * volume * parsed.price_per_cubic_km

                    updateOps.push(
                        (prisma as any).retase.update({
                            where: { id: oldRetase.id },
                            data: {
                                price_per_cubic_km: parsed.price_per_cubic_km,
                                calculation_mode: parsed.calculation_mode,
                                income_amount: newIncome
                            }
                        })
                    )

                    recalculationLogs.push({
                        transactionId: tx.id,
                        retaseId: oldRetase.id,
                        distance,
                        volume,
                        oldIncome: oldRetase.income_amount,
                        newIncome,
                        oldPrice: oldRetase.price_per_cubic_km,
                        newPrice: parsed.price_per_cubic_km,
                        oldMode: oldRetase.calculation_mode,
                        newMode: parsed.calculation_mode
                    })
                }

                if (updateOps.length > 0) {
                    await prisma.$transaction(updateOps)
                    revisedCount = updateOps.length
                }

                // Record audit log for backdate revision
                await (prisma as any).auditLog.create({
                    data: {
                        action: "REVISE_RETROACTIVE",
                        entity: "RetaseSetting",
                        recordId: newSetting.id,
                        old_values: JSON.stringify({
                            oldSetting,
                            recalculatedItems: recalculationLogs.map(i => ({
                                transactionId: i.transactionId,
                                oldIncome: i.oldIncome,
                                oldMode: i.oldMode,
                                oldPrice: i.oldPrice
                            }))
                        }),
                        new_values: JSON.stringify({
                            newSetting,
                            effectiveDate: parsed.effective_date,
                            revisedTransactionsCount: revisedCount,
                            recalculatedItems: recalculationLogs.map(i => ({
                                transactionId: i.transactionId,
                                newIncome: i.newIncome,
                                newMode: i.newMode,
                                newPrice: i.newPrice
                            }))
                        }),
                        userId: session.user.id
                    }
                })
            }
        } else {
            // Normal update: log setting change
            await (prisma as any).auditLog.create({
                data: {
                    action: "EDIT",
                    entity: "RetaseSetting",
                    recordId: newSetting.id,
                    old_values: oldSetting ? JSON.stringify(oldSetting) : null,
                    new_values: JSON.stringify(newSetting),
                    userId: session.user.id
                }
            })
        }

        revalidatePath("/admin/retase")
        revalidatePath("/admin/reports/retase")
        return {
            success: true,
            revisedCount,
            message: revisedCount > 0
                ? `Pengaturan disimpan dan ${revisedCount} transaksi sebelumnya telah dihitung ulang.`
                : "Pengaturan harga retase berhasil disimpan."
        }
    } catch (e: any) {
        return { error: e.message || "Something went wrong" }
    }
}

// --- PENDING / CONFIRMATIONS ---

export async function getTransactions(status: "Pending" | "Confirmed") {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    let filter: any = { status }
    if (!isCorporate(session) && session.user.locationId) {
        filter.locationId = session.user.locationId
    }

    return await (prisma as any).productionTransaction.findMany({
        where: filter,
        include: {
            project: { include: { customer: true } },
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
    if (!canManageRetase(session)) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

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

        const calcMode = setting.calculation_mode || "DISTANCE_ONLY"
        const price_per_cubic_km = setting.price_per_cubic_km
        const volume = transaction.volume_cubic
        const calcDistance = Number(distance)

        const income_amount = calcMode === "DISTANCE_ONLY"
            ? calcDistance * price_per_cubic_km
            : calcDistance * volume * price_per_cubic_km

        await prisma.$transaction([
            (prisma as any).retase.create({
                data: {
                    transactionId,
                    driverId: transaction.driverId,
                    calculated_distance: calcDistance,
                    volume: volume,
                    price_per_cubic_km: price_per_cubic_km,
                    income_amount: income_amount,
                    calculation_mode: calcMode
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
    if (!canManageRetase(session)) return { error: "Akses ditolak: Anda hanya memiliki hak akses lihat." }

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
