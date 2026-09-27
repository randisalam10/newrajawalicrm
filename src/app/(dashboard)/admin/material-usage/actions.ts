"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getLocationFilter } from "@/lib/rbac"

export async function getMaterialUsageData(startDate?: Date | string, endDate?: Date | string) {
    const session = await auth()
    if (!session?.user) return []

    const locationFilter = getLocationFilter(session.user)

    const dateFilter: any = {}
    if (startDate) {
        dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
        dateFilter.lte = new Date(endDate)
    }

    // Default to last 90 days if no date filter is passed, preventing unbounded memory spikes
    // while comfortably covering current month, recent weeks, and quarterly analysis
    if (!startDate && !endDate) {
        const defaultStart = new Date()
        defaultStart.setDate(defaultStart.getDate() - 90)
        dateFilter.gte = defaultStart
    }

    const transactions = await prisma.productionTransaction.findMany({
        where: {
            status: "Confirmed",
            ...locationFilter,
            ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
        },
        select: {
            id: true,
            date: true,
            volume_cubic: true,
            slump: true,
            trip_sequence: true,
            locationId: true,
            location: { select: { id: true, name: true } },
            concreteQuality: {
                select: {
                    id: true,
                    name: true,
                    composition_cement: true,
                    composition_sand: true,
                    composition_stone_05: true,
                    composition_stone_12: true,
                    composition_stone_23: true
                }
            },
            vehicle: { select: { id: true, code: true, plate_number: true } },
            driver: { select: { id: true, name: true } },
            project: {
                select: {
                    id: true,
                    name: true,
                    customer: { select: { id: true, customer_name: true } }
                }
            },
            workItem: { select: { id: true, name: true } }
        },
        orderBy: { date: 'desc' }
    })

    return transactions
}
