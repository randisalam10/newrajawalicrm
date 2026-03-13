import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from "date-fns"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    // Allowed roles for Beton Dashboard
    if (!['AdminBP', 'SuperAdminBP', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const isSuperAdmin = ['SuperAdminBP', 'CEO', 'FVP'].includes(user.role)
    const userLocationId = user.locationId

    try {
        const url = new URL(req.url)
        const dateStartQuery = url.searchParams.get('startDate')
        const dateEndQuery = url.searchParams.get('endDate')
        const mutuIdQuery = url.searchParams.get('mutuId')
        const customerIdQuery = url.searchParams.get('customerId')
        const branchIdQuery = url.searchParams.get('branchId')

        const now = new Date()
        const todayStart = startOfDay(now)
        const todayEnd = endOfDay(now)
        const monthStart = dateStartQuery ? new Date(dateStartQuery) : startOfMonth(now)
        const monthEnd = dateEndQuery ? new Date(dateEndQuery) : endOfMonth(now)

        // Custom Filters object for scoped queries
        const customFilter: any = {}
        if (mutuIdQuery) customFilter.concreteQualityId = mutuIdQuery
        if (customerIdQuery) customFilter.customerId = customerIdQuery

        // Base filter for location scoping
        const locationFilter: any = {}
        if (isSuperAdmin && branchIdQuery) {
            locationFilter.locationId = branchIdQuery
        } else if (!isSuperAdmin && userLocationId) {
            locationFilter.locationId = userLocationId
        }

        // ============================================
        // 1. PRODUKSI HARI INI
        // ============================================
        const todayTransactions = await prisma.productionTransaction.findMany({
            where: {
                ...locationFilter,
                ...customFilter,
                date: { gte: todayStart, lte: todayEnd }
            },
            select: { volume_cubic: true, status: true }
        })

        const todayVolumeTotal = todayTransactions.reduce((s: number, t: any) => s + t.volume_cubic, 0)
        const todayTrips = todayTransactions.length
        const todayPending = todayTransactions.filter((t: any) => t.status === 'Pending').length
        const todayConfirmed = todayTransactions.filter((t: any) => t.status === 'Confirmed').length

        // ============================================
        // 2. PRODUKSI RENTANG WAKTU (Default Bulan Ini)
        // ============================================
        const monthTransactions = await prisma.productionTransaction.findMany({
            where: {
                ...locationFilter,
                ...customFilter,
                date: { gte: monthStart, lte: monthEnd }
            },
            select: {
                volume_cubic: true,
                date: true,
                status: true,
                concreteQuality: { select: { name: true } },
                project: { select: { customer: { select: { customer_name: true } } } }
            }
        })

        const monthVolumeTotal = monthTransactions.reduce((s: number, t: any) => s + t.volume_cubic, 0)
        const monthTrips = monthTransactions.length

        // ============================================
        // 3. TREND 30 HARI TERAKHIR (production daily)
        // ============================================
        const thirtyDaysAgo = startOfDay(subDays(now, 29))
        const lastThirtyDaysTx = await prisma.productionTransaction.findMany({
            where: {
                ...locationFilter,
                ...customFilter,
                date: { gte: thirtyDaysAgo, lte: todayEnd }
            },
            select: { date: true, volume_cubic: true, status: true }
        })

        const trendMap: Record<string, { date: string, volume: number, confirmed: number }> = {}
        for (let i = 29; i >= 0; i--) {
            const d = subDays(now, i)
            const key = format(d, 'yyyy-MM-dd')
            trendMap[key] = { date: format(d, 'dd/MM'), volume: 0, confirmed: 0 }
        }
        lastThirtyDaysTx.forEach((t: any) => {
            const key = format(new Date(t.date), 'yyyy-MM-dd')
            if (trendMap[key]) {
                trendMap[key].volume += t.volume_cubic
                if (t.status === 'Confirmed') trendMap[key].confirmed += t.volume_cubic
            }
        })
        const trendData = Object.values(trendMap)

        // ============================================
        // 4. DISTRIBUSI MUTU BETON & CUSTOMER ORDERS (7 HARI TERAKHIR)
        // ============================================
        const mutuMap: Record<string, { name: string, volume: number, trips: number }> = {}
        const customerMap: Record<string, { name: string, volume: number, trips: number, date: string }> = {}

        const sevenDaysAgo = startOfDay(subDays(now, 6))

        monthTransactions.forEach((t: any) => {
            // Process Mutu Distribution for selected Date Range
            const mutuName = t.concreteQuality?.name || 'Tidak Diketahui'
            if (!mutuMap[mutuName]) mutuMap[mutuName] = { name: mutuName, volume: 0, trips: 0 }
            mutuMap[mutuName].volume += t.volume_cubic
            mutuMap[mutuName].trips += 1

            // Process Last 7 Days Customer Orders
            if (new Date(t.date) >= sevenDaysAgo) {
                const custName = t.project?.customer?.customer_name || 'Tidak Diketahui'
                if (!customerMap[custName]) customerMap[custName] = { name: custName, volume: 0, trips: 0, date: format(new Date(t.date), 'dd MMM') }
                customerMap[custName].volume += t.volume_cubic
                customerMap[custName].trips += 1
                // keep the latest date
                if (new Date(t.date) > new Date(customerMap[custName].date)) customerMap[custName].date = format(new Date(t.date), 'dd MMM')
            }
        })
        const mutuDistribution = Object.values(mutuMap).sort((a: any, b: any) => b.volume - a.volume)
        const last7DaysCustomers = Object.values(customerMap).sort((a: any, b: any) => b.volume - a.volume).slice(0, 10)

        // ============================================
        // 5. SUPERADMIN ONLY: Per-branch breakdown bulan ini
        // ============================================
        let branchBreakdown: Array<{
            locationId: string, locationName: string,
            volume: number, trips: number, pending: number, confirmed: number
        }> = []

        if (isSuperAdmin) {
            const allLocations = await prisma.location.findMany()
            const allMonthTx = await prisma.productionTransaction.findMany({
                where: { date: { gte: monthStart, lte: monthEnd } },
                select: { locationId: true, volume_cubic: true, status: true }
            })

            branchBreakdown = allLocations.map((loc: any) => {
                const txns = allMonthTx.filter((t: any) => t.locationId === loc.id)
                return {
                    locationId: loc.id,
                    locationName: loc.name,
                    volume: txns.reduce((s: number, t: any) => s + t.volume_cubic, 0),
                    trips: txns.length,
                    pending: txns.filter((t: any) => t.status === 'Pending').length,
                    confirmed: txns.filter((t: any) => t.status === 'Confirmed').length,
                }
            }).sort((a: any, b: any) => b.volume - a.volume)
        }

        return NextResponse.json({
            success: true,
            data: {
                today: {
                    volumeTotal: todayVolumeTotal,
                    trips: todayTrips,
                    pending: todayPending,
                    confirmed: todayConfirmed
                },
                month: {
                    volumeTotal: monthVolumeTotal,
                    trips: monthTrips
                },
                trendData,
                mutuDistribution,
                last7DaysCustomers,
                branchBreakdown: isSuperAdmin ? branchBreakdown : null,
                filterOptions: {
                    companies: await prisma.poCompanyGroup.findMany({ select: { id: true, name: true } }), // In case needed, keeping format aligned
                    locations: isSuperAdmin ? await prisma.location.findMany({ select: { id: true, name: true } }) : [],
                    mutu: await prisma.concreteQuality.findMany({ select: { id: true, name: true } }),
                    customers: await prisma.customer.findMany({ select: { id: true, customer_name: true } })
                }
            }
        })

    } catch (error: any) {
        console.error("Mobile Beton Dashboard Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
