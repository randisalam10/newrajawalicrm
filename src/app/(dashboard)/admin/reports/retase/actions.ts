'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { startOfMonth, endOfMonth } from "date-fns"

export interface RetaseMonthFilter {
    year: number
    month: number // 1-12
    locationId?: string
}

/**
 * Ambil rekap retase per supir untuk bulan & tahun tertentu.
 * HANYA transaksi berstatus "Confirmed" yang punya record Retase yang dihitung.
 */
export async function getRetaseReportByMonth(filter: RetaseMonthFilter) {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    // Hitung batas bulan (WIB-aware: gunakan UTC exact range)
    const monthDate = new Date(filter.year, filter.month - 1, 1)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    // Base filter: HANYA Confirmed (Retase sudah dikonfirmasi admin)
    const where: any = {
        status: "Confirmed",
        retase: { isNot: null }, // hanya yang punya record retase
        date: { gte: monthStart, lte: monthEnd }
    }

    // Access control per cabang
    if (session.user.role !== 'SuperAdminBP' && session.user.locationId) {
        where.locationId = session.user.locationId
    } else if (filter.locationId) {
        where.locationId = filter.locationId
    }

    const transactions = await (prisma as any).productionTransaction.findMany({
        where,
        include: {
            driver: true,
            location: true,
            retase: true,
            project: { include: { customer: true } },
            vehicle: true,
            concreteQuality: true,
        },
        orderBy: [{ driverId: 'asc' }, { date: 'asc' }]
    })

    return transactions
}

/**
 * Ambil daftar tahun yang memiliki data retase confirmed (untuk dropdown).
 */
export async function getRetaseAvailableYears() {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    const where: any = { status: "Confirmed", retase: { isNot: null } }
    if (session.user.role !== 'SuperAdminBP' && session.user.locationId) {
        where.locationId = session.user.locationId
    }

    const txs = await prisma.productionTransaction.findMany({
        where,
        select: { date: true },
        orderBy: { date: 'asc' }
    })

    const years = [...new Set(txs.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a)
    // Pastikan tahun sekarang selalu ada
    const currentYear = new Date().getFullYear()
    if (!years.includes(currentYear)) years.unshift(currentYear)
    return years
}

/**
 * Ambil rekap transaksi dengan range tanggal bebas untuk laporan.
 */
export async function getTransactionReport(filters: {
    dateFrom: string   // ISO date string
    dateTo: string
    customerId?: string
    locationId?: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return { rows: [], pembuat: "-" }

    const where: any = {
        status: "Confirmed",
        date: {
            gte: new Date(filters.dateFrom + "T00:00:00"),
            lte: new Date(filters.dateTo + "T23:59:59"),
        }
    }
    if (filters.customerId) {
        where.project = { customerId: filters.customerId }
    }
    // Access control cabang
    if (session.user.role !== 'SuperAdminBP' && session.user.locationId) {
        where.locationId = session.user.locationId
    } else if (filters.locationId) {
        where.locationId = filters.locationId
    }

    const transactions = await (prisma as any).productionTransaction.findMany({
        where,
        include: {
            driver: true,
            location: true,
            retase: true,
            project: { include: { customer: true, prices: true } },
            vehicle: true,
            concreteQuality: true,
        },
        orderBy: [{ date: 'asc' }]
    })

    return {
        rows: transactions,
        pembuat: session.user.username || "-",
    }
}

/**
 * Ambil daftar customer yang punya transaksi confirmed (untuk dropdown filter laporan).
 */
export async function getCustomersForReport(locationId?: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    const where: any = { status: "Confirmed" }
    if (session.user.role !== 'SuperAdminBP' && session.user.locationId) {
        where.locationId = session.user.locationId
    } else if (locationId) {
        where.locationId = locationId
    }

    const txs = await (prisma as any).productionTransaction.findMany({
        where,
        select: { project: { select: { customer: { select: { id: true, customer_name: true } } } } },
        distinct: ['projectId'],
    })

    const customerMap = new Map<string, string>()
    txs.forEach((t: any) => {
        if (t.project?.customer) {
            customerMap.set(t.project.customer.id, t.project.customer.customer_name)
        }
    })
    return Array.from(customerMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name))
}
