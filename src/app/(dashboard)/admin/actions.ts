'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from "date-fns"


export async function getDashboardData() {
    const session = await auth()
    if (!session?.user?.employeeId) return null

    const isSuperAdmin = session.user.role === 'SuperAdminBP'
    const userLocationId = session.user.locationId

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Base filter for location scoping
    const locationFilter = (!isSuperAdmin && userLocationId) ? { locationId: userLocationId } : {}

    // ============================================
    // 1. PRODUKSI HARI INI
    // ============================================
    const todayTransactions = await prisma.productionTransaction.findMany({
        where: {
            ...locationFilter,
            date: { gte: todayStart, lte: todayEnd }
        },
        include: { concreteQuality: true, project: { include: { customer: true } }, vehicle: true, driver: true, location: true }
    })

    const todayVolumeTotal = todayTransactions.reduce((s, t) => s + t.volume_cubic, 0)
    const todayTrips = todayTransactions.length
    const todayPending = todayTransactions.filter(t => t.status === 'Pending').length
    const todayConfirmed = todayTransactions.filter(t => t.status === 'Confirmed').length

    // ============================================
    // 2. PRODUKSI BULAN INI
    // ============================================
    const monthTransactions = await prisma.productionTransaction.findMany({
        where: {
            ...locationFilter,
            date: { gte: monthStart, lte: monthEnd }
        },
        include: { concreteQuality: true, project: { include: { customer: true } }, location: true }
    })

    const monthVolumeTotal = monthTransactions.reduce((s, t) => s + t.volume_cubic, 0)
    const monthTrips = monthTransactions.length

    // ============================================
    // 3. PENDING KONFIRMASI (semua waktu)
    // ============================================
    const pendingCount = await prisma.productionTransaction.count({
        where: { ...locationFilter, status: 'Pending' }
    })

    // ============================================
    // 4. ESTIMASI STOK SEMEN
    // ============================================
    // Stok = Total Semen Masuk - Pemakaian dari transaksi confirmed
    const [semenMasukAgg, confirmedTransactionsForStock] = await Promise.all([
        (prisma as any).materialIncoming.aggregate({
            where: { ...locationFilter },
            _sum: { tonnage: true }
        }),
        prisma.productionTransaction.findMany({
            where: { ...locationFilter, status: 'Confirmed' },
            include: { concreteQuality: true }
        })
    ])
    const totalSemenMasuk = semenMasukAgg._sum.tonnage || 0
    const totalSemenKeluar = confirmedTransactionsForStock.reduce((s, t) => {
        return s + (t.volume_cubic * (t.concreteQuality.composition_cement || 0))
    }, 0)
    const estimasiStokSemen = totalSemenMasuk - totalSemenKeluar

    // ============================================
    // 5. TREND 7 HARI (production daily)
    // ============================================
    const sevenDaysAgo = startOfDay(subDays(now, 6))
    const lastSevenDaysTx = await prisma.productionTransaction.findMany({
        where: {
            ...locationFilter,
            date: { gte: sevenDaysAgo, lte: todayEnd }
        },
        select: { date: true, volume_cubic: true, status: true }
    })

    const trendMap: Record<string, { date: string, volume: number, confirmed: number }> = {}
    for (let i = 6; i >= 0; i--) {
        const d = subDays(now, i)
        const key = format(d, 'yyyy-MM-dd')
        trendMap[key] = { date: format(d, 'dd/MM'), volume: 0, confirmed: 0 }
    }
    lastSevenDaysTx.forEach(t => {
        const key = format(new Date(t.date), 'yyyy-MM-dd')
        if (trendMap[key]) {
            trendMap[key].volume += t.volume_cubic
            if (t.status === 'Confirmed') trendMap[key].confirmed += t.volume_cubic
        }
    })
    const trendData = Object.values(trendMap)

    // ============================================
    // 6. DISTRIBUSI MUTU BETON bulan ini
    // ============================================
    const mutuMap: Record<string, { name: string, volume: number }> = {}
    monthTransactions.forEach(t => {
        const name = t.concreteQuality.name
        if (!mutuMap[name]) mutuMap[name] = { name, volume: 0 }
        mutuMap[name].volume += t.volume_cubic
    })
    const mutuDistribution = Object.values(mutuMap).sort((a, b) => b.volume - a.volume)

    // ============================================
    // 7. TOP 5 CUSTOMER bulan ini
    // ============================================
    const customerMap: Record<string, { name: string, project: string, volume: number, trips: number }> = {}
    monthTransactions.forEach(t => {
        if (!t.project || !t.project.customer) return; // Skip if no project/customer
        const id = t.project.customerId
        if (!customerMap[id]) {
            customerMap[id] = { name: t.project.customer.customer_name, project: t.project.name, volume: 0, trips: 0 }
        }
        customerMap[id].volume += t.volume_cubic
        customerMap[id].trips++
    })
    const topCustomers = Object.values(customerMap).sort((a, b) => b.volume - a.volume).slice(0, 5)

    // ============================================
    // 8. AKTIVITAS TERBARU (10 transaksi terbaru)
    // ============================================
    const recentActivity = await prisma.productionTransaction.findMany({
        where: { ...locationFilter },
        include: { project: { include: { customer: true } }, concreteQuality: true, driver: true, vehicle: true, location: true },
        orderBy: { date: 'desc' },
        take: 10
    })

    // ============================================
    // 9. SUPERADMIN ONLY: Per-branch breakdown bulan ini
    // ============================================
    let branchBreakdown: Array<{
        locationId: string, locationName: string,
        volume: number, trips: number, pending: number, confirmed: number
    }> = []

    if (isSuperAdmin) {
        const allLocations = await prisma.location.findMany()
        const allMonthTx = await prisma.productionTransaction.findMany({
            where: { date: { gte: monthStart, lte: monthEnd } },
            include: { location: true }
        })

        branchBreakdown = allLocations.map(loc => {
            const txns = allMonthTx.filter(t => t.locationId === loc.id)
            return {
                locationId: loc.id,
                locationName: loc.name,
                volume: txns.reduce((s, t) => s + t.volume_cubic, 0),
                trips: txns.length,
                pending: txns.filter(t => t.status === 'Pending').length,
                confirmed: txns.filter(t => t.status === 'Confirmed').length,
            }
        }).sort((a, b) => b.volume - a.volume)
    }

    // ============================================
    // 10. SUPERADMIN ONLY: Total retase bulan ini
    // ============================================
    let totalRetaseBulanIni = 0
    if (isSuperAdmin) {
        const retaseAgg = await (prisma as any).retase.aggregate({
            where: {
                transaction: {
                    date: { gte: monthStart, lte: monthEnd }
                }
            },
            _sum: { income_amount: true }
        })
        totalRetaseBulanIni = retaseAgg._sum.income_amount || 0
    }

    // ============================================
    // 11. PLANNING HARI INI
    // ============================================
    const todayPlans = await prisma.concretePlan.findMany({
        where: {
            ...locationFilter,
            date: { gte: todayStart, lte: todayEnd },
        },
        include: {
            project: { include: { customer: { select: { customer_name: true } } } },
            concreteQuality: { select: { name: true } },
            workItem: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
    })

    return {
        isSuperAdmin,
        // Today
        todayVolumeTotal,
        todayTrips,
        todayPending,
        todayConfirmed,
        // Month
        monthVolumeTotal,
        monthTrips,
        // Stock
        estimasiStokSemen,
        // Charts
        trendData,
        mutuDistribution,
        // Tables
        topCustomers,
        recentActivity,
        // SuperAdmin extras
        pendingCount,
        branchBreakdown,
        totalRetaseBulanIni,
        // Planning
        todayPlans,
    }
}
