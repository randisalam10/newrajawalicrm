"use server"

import { prisma } from "@/lib/prisma"
import { CrusherPoStats } from "./types"

export async function getCrusherPoStats(locationId: string): Promise<CrusherPoStats> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const posThisMonth = await prisma.purchaseOrder.findMany({
        where: {
            is_for_crusher: true,
            locationId,
            tanggal_terbit: { gte: monthStart, lte: monthEnd },
            status: { not: "CANCELLED" },
        },
        include: { items: { select: { subtotal: true } } },
    })

    const pendingCount = await prisma.purchaseOrder.count({
        where: {
            is_for_crusher: true,
            locationId,
            status: "SUBMITTED",
        },
    })

    const approvedCount = posThisMonth.filter(p => p.status === "APPROVED").length
    const totalAmountThisMonth = posThisMonth.reduce((total, p) => {
        return total + p.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    }, 0)

    return {
        totalPoCount: posThisMonth.length,
        pendingCount,
        approvedCount,
        totalAmountThisMonth,
    }
}
