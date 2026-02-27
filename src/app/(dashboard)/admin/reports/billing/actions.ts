'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface BillingFilter {
    locationId?: string
    customerId?: string
    startDate?: string
    endDate?: string
}

export async function getBillingReport(filterOptions: BillingFilter) {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    // Build the query filter for ProductionTransaction
    let filter: any = { status: "Confirmed" }

    // Branch Access Control
    if (session.user.role !== 'SuperAdminBP' && session.user.locationId) {
        filter.locationId = session.user.locationId
    } else if (filterOptions.locationId) {
        filter.locationId = filterOptions.locationId
    }

    if (filterOptions.customerId) {
        // Filter by project belonging to this customer
        filter.project = { customerId: filterOptions.customerId }
    }

    if (filterOptions.startDate && filterOptions.endDate) {
        filter.date = {
            gte: new Date(filterOptions.startDate),
            lte: new Date(filterOptions.endDate)
        }
    } else if (filterOptions.startDate) {
        filter.date = { gte: new Date(filterOptions.startDate) }
    } else if (filterOptions.endDate) {
        filter.date = { lte: new Date(filterOptions.endDate) }
    }

    // Fetch the transactions
    const transactions = await (prisma as any).productionTransaction.findMany({
        where: filter,
        include: {
            project: { include: { customer: true } },
            concreteQuality: true,
            location: true,
            vehicle: true,
            driver: true,
        },
        orderBy: { date: 'asc' }
    })

    return transactions
}
