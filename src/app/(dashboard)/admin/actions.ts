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
    // 2. PRODUKSI BULAN INI & ESTIMASI OMSET
    // ============================================
    const monthTransactions = await prisma.productionTransaction.findMany({
        where: {
            ...locationFilter,
            date: { gte: monthStart, lte: monthEnd }
        },
        include: {
            concreteQuality: true,
            project: {
                include: { customer: true, prices: true }
            },
            location: true
        }
    })

    const monthVolumeTotal = monthTransactions.reduce((s, t) => s + t.volume_cubic, 0)
    const monthTrips = monthTransactions.length

    // Estimasi Nilai Omset Produksi Bulan Ini (Volume x Harga Mutu Proyek)
    let estimatedOmsetBulanIni = 0
    monthTransactions.forEach(t => {
        const matchedPrice = t.project?.prices?.find((p: any) => p.qualityId === t.qualityId)?.price || 0
        estimatedOmsetBulanIni += (t.volume_cubic * matchedPrice)
    })

    // Armada & Sopir Aktif Hari Ini
    const todayActiveVehicles = new Set(todayTransactions.map(t => t.vehicleId)).size
    const todayActiveDrivers = new Set(todayTransactions.map(t => t.driverId)).size

    // ============================================
    // 3. PENDING KONFIRMASI (semua waktu)
    // ============================================
    const pendingCount = await prisma.productionTransaction.count({
        where: { ...locationFilter, status: 'Pending' }
    })

    // ============================================
    // 4. ESTIMASI STOK SEMEN & COVERAGE
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
    const stokSemenTon = estimasiStokSemen > 0 ? estimasiStokSemen / 1000 : 0
    const stokStatus: 'SAFE' | 'WARNING' | 'CRITICAL' = stokSemenTon >= 50
        ? 'SAFE'
        : stokSemenTon >= 20
            ? 'WARNING'
            : 'CRITICAL'

    // ============================================
    // 5. TREND 7 HARI & PERBANDINGAN MINGGU LALU
    // ============================================
    const sevenDaysAgo = startOfDay(subDays(now, 6))
    const fourteenDaysAgo = startOfDay(subDays(now, 13))

    const [lastSevenDaysTx, prevSevenDaysTx] = await Promise.all([
        prisma.productionTransaction.findMany({
            where: {
                ...locationFilter,
                date: { gte: sevenDaysAgo, lte: todayEnd }
            },
            select: { date: true, volume_cubic: true, status: true }
        }),
        prisma.productionTransaction.findMany({
            where: {
                ...locationFilter,
                date: { gte: fourteenDaysAgo, lt: sevenDaysAgo }
            },
            select: { volume_cubic: true }
        })
    ])

    const current7DaysVolume = lastSevenDaysTx.reduce((s, t) => s + t.volume_cubic, 0)
    const prev7DaysVolume = prevSevenDaysTx.reduce((s, t) => s + t.volume_cubic, 0)
    const weekGrowthRate = prev7DaysVolume > 0
        ? Math.round(((current7DaysVolume - prev7DaysVolume) / prev7DaysVolume) * 100)
        : null

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

    // ============================================
    // 12. LOGISTIK & PENGADAAN (PO, Material Masuk)
    // ============================================
    const userRole = session.user.role || ""
    const userName = (session.user as any).name || session.user.username || "Pengguna"
    const isCorporate = isSuperAdmin || ["CEO", "FVP", "Approver"].includes(userRole)
    let locationName = "Semua Cabang (Konsolidasi)"
    if (userLocationId) {
        const userLoc = await prisma.location.findUnique({ where: { id: userLocationId }, select: { name: true } })
        if (userLoc) locationName = userLoc.name
    }

    const poLocationFilter = (!isCorporate && userLocationId) ? { locationId: userLocationId } : {}

    const [posMonth, pendingPos, recentPos, aggregateIncomingAgg] = await Promise.all([
        prisma.purchaseOrder.findMany({
            where: {
                ...poLocationFilter,
                tanggal_terbit: { gte: monthStart, lte: monthEnd },
                status: { not: "CANCELLED" }
            },
            include: {
                items: true,
                category: true,
                companyGroup: true,
                location: true,
            },
            orderBy: { tanggal_terbit: 'desc' }
        }),
        prisma.purchaseOrder.findMany({
            where: {
                ...poLocationFilter,
                status: { in: ["DRAFT", "SUBMITTED"] }
            },
            include: {
                items: true,
                category: true,
                companyGroup: true
            },
            orderBy: { tanggal_terbit: 'desc' },
            take: 5
        }),
        prisma.purchaseOrder.findMany({
            where: { ...poLocationFilter },
            include: {
                items: true,
                category: true,
                companyGroup: true,
                location: true,
            },
            orderBy: { tanggal_terbit: 'desc' },
            take: 5
        }),
        prisma.aggregateIncoming.aggregate({
            where: {
                ...locationFilter,
                date: { gte: monthStart, lte: monthEnd }
            },
            _sum: { volume_cubic: true }
        })
    ])

    let totalNilaiPoBulanIni = 0
    let totalPoItemsBulanIni = 0
    posMonth.forEach(po => {
        const sum = po.items.reduce((acc, item) => acc + (item.subtotal || 0), 0)
        totalNilaiPoBulanIni += sum
        totalPoItemsBulanIni += po.items.length
    })

    const poPendingApprovalCount = pendingPos.length
    const poApprovedCount = posMonth.filter(p => p.status === "APPROVED").length
    const poDraftCount = posMonth.filter(p => p.status === "DRAFT").length
    const totalAgregatMasukBulanIni = aggregateIncomingAgg._sum.volume_cubic || 0

    // ============================================
    // 13. KEUANGAN & BILLING (Unbilled Pool & A/R)
    // ============================================
    const [unbilledTx, activeInvoices] = await Promise.all([
        prisma.productionTransaction.findMany({
            where: {
                ...locationFilter,
                invoiceItem: null,
            },
            include: {
                project: { include: { prices: true } },
            }
        }),
        prisma.invoice.findMany({
            where: {
                ...locationFilter,
                status: { not: "CANCELLED" },
            },
            select: {
                id: true,
                total_amount: true,
                paid_amount: true,
                status: true,
                due_date: true
            }
        })
    ])

    const unbilledCount = unbilledTx.length
    const unbilledVolumeTotal = unbilledTx.reduce((s, t) => s + (t.volume_cubic || 0), 0)
    let unbilledEstimatedValue = 0
    unbilledTx.forEach(t => {
        const matchedPrice = t.project?.prices?.find((p: any) => p.qualityId === t.qualityId)?.price || 0
        unbilledEstimatedValue += (t.volume_cubic * matchedPrice)
    })

    const totalInvoiced = activeInvoices.reduce((s, i) => s + (i.total_amount || 0), 0)
    const totalInvoicePaid = activeInvoices.reduce((s, i) => s + (i.paid_amount || 0), 0)
    const totalOutstandingReceivables = Math.max(0, totalInvoiced - totalInvoicePaid)

    // ============================================
    // 14. KAS OPERASIONAL RBL & PENGGUNAAN SOLAR
    // ============================================
    const activeBudget = await prisma.rblBudget.findFirst({
        where: {
            ...(userLocationId ? { locationId: userLocationId } : {}),
            status: "OPEN"
        },
        include: {
            location: true,
            expenses: {
                select: { amount: true, category: true, quantity: true }
            }
        }
    })

    const rblBudgetAmount = activeBudget?.amount || 0
    const rblExpensesTotal = (activeBudget?.expenses || []).reduce((s, e) => s + (e.amount || 0), 0)
    const rblRemainingBalance = rblBudgetAmount - rblExpensesTotal

    let totalSolarLitersRbl = 0
    let totalSolarCostRbl = 0
    ;(activeBudget?.expenses || []).forEach(e => {
        const cat = (e.category || "").toLowerCase()
        if (cat.includes("bbm") || cat.includes("solar") || cat.includes("bakar")) {
            totalSolarLitersRbl += (e.quantity || 0)
            totalSolarCostRbl += (e.amount || 0)
        }
    })

    // ============================================
    // 15. ARMADA & KENDARAAN
    // ============================================
    const totalVehiclesCount = await prisma.vehicle.count({ where: locationFilter })

    return {
        // User & Role Context
        userContext: {
            role: userRole,
            name: userName,
            locationId: userLocationId || "",
            locationName,
            isSuperAdmin,
            isCorporate
        },
        isSuperAdmin,

        // 1. Operasional & Produksi
        todayVolumeTotal,
        todayTrips,
        todayPending,
        todayConfirmed,
        todayActiveVehicles,
        todayActiveDrivers,
        monthVolumeTotal,
        monthTrips,
        estimatedOmsetBulanIni,
        estimasiStokSemen,
        stokStatus,
        trendData,
        weekGrowthRate,
        mutuDistribution,
        topCustomers,
        recentActivity,
        todayPlans,
        pendingCount,
        branchBreakdown,
        totalRetaseBulanIni,

        // 2. Logistik & Pengadaan
        logistik: {
            totalPoBulanIni: posMonth.length,
            totalNilaiPoBulanIni,
            poPendingApprovalCount,
            poApprovedCount,
            poDraftCount,
            recentPos: recentPos.map(p => ({
                id: p.id,
                po_number: p.po_number,
                tanggal_terbit: p.tanggal_terbit,
                status: p.status,
                categoryName: p.category?.name || "General",
                companyGroupName: p.companyGroup?.name || "-",
                totalAmount: p.items.reduce((s, it) => s + (it.subtotal || 0), 0),
                itemCount: p.items.length
            })),
            pendingPos: pendingPos.map(p => ({
                id: p.id,
                po_number: p.po_number,
                tanggal_terbit: p.tanggal_terbit,
                status: p.status,
                categoryName: p.category?.name || "General",
                companyGroupName: p.companyGroup?.name || "-",
                totalAmount: p.items.reduce((s, it) => s + (it.subtotal || 0), 0)
            })),
            totalSemenMasukTon: totalSemenMasuk > 0 ? totalSemenMasuk / 1000 : 0,
            totalAgregatMasukM3: totalAgregatMasukBulanIni,
            estimatedMaterialConsumption: {
                semenKg: totalSemenKeluar,
                semenTon: totalSemenKeluar / 1000
            }
        },

        // 3. Keuangan & Billing
        keuangan: {
            unbilledCount,
            unbilledVolumeTotal,
            unbilledEstimatedValue,
            totalInvoiced,
            totalInvoicePaid,
            totalOutstandingReceivables,
            rblBudgetAmount,
            rblExpensesTotal,
            rblRemainingBalance,
            totalSolarLitersRbl,
            totalSolarCostRbl,
            hasActiveRbl: !!activeBudget
        },

        // 4. Armada
        armada: {
            totalVehiclesCount,
            activeVehiclesToday: todayActiveVehicles
        }
    }
}
