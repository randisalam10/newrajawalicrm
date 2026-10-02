export const MUTU_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B']

export type DashboardData = {
    isSuperAdmin: boolean
    selectedMonth?: string
    selectedMonthLabel?: string
    userContext: {
        role: string
        name: string
        locationId: string
        locationName: string
        isSuperAdmin: boolean
        isCorporate: boolean
    }
    todayVolumeTotal: number
    todayTrips: number
    todayPending: number
    todayConfirmed: number
    todayActiveVehicles: number
    todayActiveDrivers: number
    monthVolumeTotal: number
    monthTrips: number
    estimatedOmsetBulanIni: number
    estimasiStokSemen: number
    stokStatus: 'SAFE' | 'WARNING' | 'CRITICAL'
    trendData: Array<{ date: string; volume: number; confirmed: number }>
    weekGrowthRate: number | null
    mutuDistribution: Array<{ name: string; volume: number }>
    topCustomers: Array<{ name: string; project: string; volume: number; trips: number }>
    recentActivity: any[]
    pendingCount: number
    branchBreakdown: Array<{
        locationId: string; locationName: string
        volume: number; trips: number; pending: number; confirmed: number
    }>
    totalRetaseBulanIni: number
    todayPlans: Array<{
        id: string
        volume_plan: number
        status: string
        project: { name: string; customer: { customer_name: string } }
        concreteQuality: { name: string }
        workItem: { name: string }
    }>
    logistik: {
        totalPoBulanIni: number
        totalNilaiPoBulanIni: number
        poPendingApprovalCount: number
        poApprovedCount: number
        poDraftCount: number
        recentPos: Array<{
            id: string
            po_number: string
            tanggal_terbit: Date | string
            status: string
            categoryName: string
            companyGroupName: string
            totalAmount: number
            itemCount: number
        }>
        pendingPos: Array<{
            id: string
            po_number: string
            tanggal_terbit: Date | string
            status: string
            categoryName: string
            companyGroupName: string
            totalAmount: number
        }>
        totalSemenMasukTon: number
        totalAgregatMasukM3: number
        estimatedMaterialConsumption: {
            semenKg: number
            semenTon: number
        }
    }
    keuangan: {
        unbilledCount: number
        unbilledVolumeTotal: number
        unbilledEstimatedValue: number
        totalInvoiced: number
        totalInvoicePaid: number
        totalOutstandingReceivables: number
        rblBudgetAmount: number
        rblExpensesTotal: number
        rblRemainingBalance: number
        totalSolarLitersRbl: number
        totalSolarCostRbl: number
        hasActiveRbl: boolean
    }
    armada: {
        totalVehiclesCount: number
        activeVehiclesToday: number
    }
}

export type Perspective = "all" | "operasional" | "logistik" | "keuangan"
