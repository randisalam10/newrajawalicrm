"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getMaterialUsageData() {
    const session = await auth()
    if (!session?.user) return []

    // Base filter: only Confirmed transactions
    const baseFilter: any = {
        status: "Confirmed"
    }

    // Role isolation: AdminBP only sees their own branch data
    if (session.user.role === "AdminBP") {
        baseFilter.locationId = session.user.locationId
    }

    const transactions = await prisma.productionTransaction.findMany({
        where: baseFilter,
        include: {
            concreteQuality: true,
            vehicle: true,
            project: { include: { customer: true } },
            location: true,
            driver: true,
            workItem: true
        },
        orderBy: { date: 'desc' }
    })

    return transactions
}
