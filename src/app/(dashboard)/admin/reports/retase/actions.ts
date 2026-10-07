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
    if (!session?.user) return { mixer: [], dumpTruck: [], operatorBP: [] }

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

    const aggregateWhere: any = {
        source_type: "Internal",
        retase_amount: { gt: 0 },
        date: { gte: monthStart, lte: monthEnd }
    }

    const outgoingAggregateWhere: any = {
        transport_mode: "INTERNAL_DT",
        retase_amount: { gt: 0 },
        date: { gte: monthStart, lte: monthEnd }
    }

    const opWhere: any = {
        status: "Confirmed",
        date: { gte: monthStart, lte: monthEnd }
    }

    // Access control per cabang
    if (session.user.role !== 'SuperAdminBP' && session.user.locationId) {
        where.locationId = session.user.locationId
        aggregateWhere.locationId = session.user.locationId
        outgoingAggregateWhere.locationId = session.user.locationId
        opWhere.locationId = session.user.locationId
    } else if (filter.locationId) {
        where.locationId = filter.locationId
        aggregateWhere.locationId = filter.locationId
        outgoingAggregateWhere.locationId = filter.locationId
        opWhere.locationId = filter.locationId
    }

    const [transactions, dumpTruckIncomings, dumpTruckOutgoings, opTransactions, branchOperators, retaseSettings, masterIncentives] = await Promise.all([
        (prisma as any).productionTransaction.findMany({
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
        }),
        prisma.aggregateIncoming.findMany({
            where: aggregateWhere,
            include: {
                driver: true,
                location: true,
                vehicle: true,
            },
            orderBy: [{ driver_name: 'asc' }, { date: 'asc' }]
        }),
        prisma.aggregateOutgoing.findMany({
            where: outgoingAggregateWhere,
            include: {
                driver: true,
                location: true,
                vehicle: true,
            },
            orderBy: [{ driver_name: 'asc' }, { date: 'asc' }]
        }),
        (prisma as any).productionTransaction.findMany({
            where: opWhere,
            include: {
                operator: true,
                createdBy: true,
                location: true,
                project: { include: { customer: true } },
                vehicle: true,
                concreteQuality: true,
            },
            orderBy: [{ date: 'asc' }]
        }),
        prisma.employee.findMany({
            where: {
                position: "Operator",
                status: "Active",
                ...(session.user.role !== 'SuperAdminBP' && session.user.locationId
                    ? { locationId: session.user.locationId }
                    : filter.locationId ? { locationId: filter.locationId } : {})
            },
            include: { location: true },
            orderBy: { name: 'asc' }
        }),
        (prisma as any).retaseSetting.findMany(),
        (prisma as any).masterIncentiveRate.findMany({
            where: { isActive: true },
            orderBy: [{ effective_date: 'desc' }, { createdAt: 'desc' }]
        }).catch(() => [])
    ])

    // Map active operators per cabang untuk auto-mapping
    const branchOperatorsMap = new Map<string, any[]>()
    branchOperators.forEach((op: any) => {
        if (op.locationId) {
            if (!branchOperatorsMap.has(op.locationId)) branchOperatorsMap.set(op.locationId, [])
            branchOperatorsMap.get(op.locationId)!.push(op)
        }
    })

    // Resolver tarif insentif operator BP berdasarkan tanggal transaksi (Effective Date Rule)
    const resolveOpRate = (locId: string, txDate: Date): number => {
        const txDateObj = new Date(txDate)
        // 1. Cari di MasterIncentiveRate yang effective_date <= txDate
        const matchingRates = (masterIncentives || []).filter((r: any) =>
            r.kategori_peran === "OPERATOR_BP" &&
            new Date(r.effective_date) <= txDateObj &&
            (r.locationId === locId || r.locationId === null)
        )
        if (matchingRates.length > 0) {
            // Prioritaskan cabang spesifik
            const branchSpecific = matchingRates.find((r: any) => r.locationId === locId)
            if (branchSpecific) return Number(branchSpecific.tarif_utama) || 0
            return Number(matchingRates[0].tarif_utama) || 0
        }

        // 2. Fallback ke RetaseSetting jika ada
        const fallback = (retaseSettings || []).find((s: any) => s.locationId === locId)
        if (fallback) {
            const effDate = fallback.effective_from ? new Date(fallback.effective_from) : null
            if (!effDate || txDateObj >= effDate) {
                return Number(fallback.operator_rate_per_cubic) || 0
            }
        }
        return 0
    }

    // Proses data transaksi operator BP
    const operatorRecords: any[] = []
    opTransactions.forEach((tx: any) => {
        const locRate = resolveOpRate(tx.locationId, tx.date)
        const locOperators = branchOperatorsMap.get(tx.locationId) || []

        // Resolusi operator:
        // 1. tx.operator eksplisit
        // 2. tx.createdBy jika jabatannya Operator
        // 3. Jika hanya ada 1 operator aktif di BP tersebut, auto-map ke operator tersebut
        let op = tx.operator || null
        if (!op && tx.createdBy?.position === "Operator") {
            op = tx.createdBy
        }
        if (!op && locOperators.length === 1) {
            op = locOperators[0]
        }

        const opId = op ? op.id : (locOperators.length > 0 ? locOperators[0].id : `unassigned_${tx.locationId}`)
        const opName = op ? op.name : (locOperators.length > 0 ? locOperators[0].name : `Operator ${tx.location?.name || 'BP'}`)
        const income = (tx.volume_cubic || 0) * locRate

        operatorRecords.push({
            id: tx.id,
            date: tx.date,
            operatorId: opId,
            operatorName: opName,
            locationId: tx.locationId,
            locationName: tx.location?.name || "-",
            volume_cubic: tx.volume_cubic || 0,
            trip_sequence: tx.trip_sequence,
            rate_price: locRate,
            income_amount: income,
            project: tx.project,
            customer: tx.project?.customer,
            vehicle: tx.vehicle,
            concreteQuality: tx.concreteQuality
        })
    })

    const allDumpTruck = [
        ...dumpTruckIncomings.map((tx: any) => ({ ...tx, movement_type: "INCOMING" as const })),
        ...dumpTruckOutgoings.map((tx: any) => ({ ...tx, movement_type: "OUTGOING" as const })),
    ].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
        mixer: transactions,
        dumpTruck: allDumpTruck,
        operatorBP: operatorRecords
    }
}

/**
 * Ambil daftar tahun yang memiliki data retase confirmed (untuk dropdown).
 */
export async function getRetaseAvailableYears() {
    const session = await auth()
    if (!session?.user) return []

    const where: any = { status: "Confirmed", retase: { isNot: null } }
    const aggWhere: any = { source_type: "Internal", retase_amount: { gt: 0 } }
    const aggOutWhere: any = { transport_mode: "INTERNAL_DT", retase_amount: { gt: 0 } }
    if (session.user.role !== 'SuperAdminBP' && session.user.locationId) {
        where.locationId = session.user.locationId
        aggWhere.locationId = session.user.locationId
        aggOutWhere.locationId = session.user.locationId
    }

    const [txs, aggTxs, aggOutTxs] = await Promise.all([
        prisma.productionTransaction.findMany({
            where,
            select: { date: true },
            orderBy: { date: 'asc' }
        }),
        prisma.aggregateIncoming.findMany({
            where: aggWhere,
            select: { date: true },
            orderBy: { date: 'asc' }
        }),
        prisma.aggregateOutgoing.findMany({
            where: aggOutWhere,
            select: { date: true },
            orderBy: { date: 'asc' }
        })
    ])

    const allDates = [...txs.map(t => t.date), ...aggTxs.map(t => t.date), ...aggOutTxs.map(t => t.date)]
    const years = [...new Set(allDates.map(d => new Date(d).getFullYear()))].sort((a, b) => b - a)
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

    const startObj = new Date(filters.dateFrom.includes("T") ? filters.dateFrom : `${filters.dateFrom}T00:00:00.000+07:00`)
    const endObj = new Date(filters.dateTo.includes("T") ? filters.dateTo : `${filters.dateTo}T23:59:59.999+07:00`)

    const where: any = {
        status: "Confirmed",
        date: {
            gte: startObj,
            lte: endObj,
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
