"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getLocationFilter } from "@/lib/rbac"

export async function getMaterialUsageData() {
    const session = await auth()
    if (!session?.user) return []

    const locationFilter = getLocationFilter(session.user)

    const transactions = await prisma.productionTransaction.findMany({
        where: {
            status: "Confirmed",
            ...locationFilter
        },
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
