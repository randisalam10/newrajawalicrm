import {
    UnitEconomicsData,
    MomComparisonData,
    ReportAlert,
    BranchBenchmarkItem,
    MutuDistributionItem,
    TopCustomerItem,
    FleetStatsData,
    DriverRetaseItem
} from "../types"

export interface AnalyticsCalculationParams {
    currentASP: number
    prevASP: number
    currentVolumeTotal: number
    prevVolumeTotal: number
    totalSemenCost: number
    totalPasirCost: number
    totalSplitCost: number
    totalMaterialCost: number
    totalFuelCost: number
    prevTotalFuelCost?: number       // Biaya BBM bulan sebelumnya untuk MoM fuel ratio
    totalRetaseCost: number
    totalMaintenanceCost: number
    manualDirectCost?: number
    unitDirectCostPerM3: number
    totalGrossRevenue: number
    prevTotalGrossRevenue: number
    grossMarginPercent: number
    branchTargetVolume?: number      // Target volume per cabang dari OperationalTargetSetting
    allLocations: any[]
    allMonthTxnsKonsolidasi: any[]
    currentTxns: any[]
    mixerRetaseList: any[]
    allUnpaidInvoices: any[]
    totalRblBudgetPlafon: number
    totalRblOpex: number
    now: Date
}

export function calculateReportAnalytics(params: AnalyticsCalculationParams) {
    const {
        currentASP,
        prevASP,
        currentVolumeTotal,
        prevVolumeTotal,
        totalSemenCost,
        totalPasirCost,
        totalSplitCost,
        totalMaterialCost,
        totalFuelCost,
        prevTotalFuelCost = 0,
        totalRetaseCost,
        totalMaintenanceCost,
        manualDirectCost = 0,
        unitDirectCostPerM3,
        totalGrossRevenue,
        prevTotalGrossRevenue,
        grossMarginPercent,
        branchTargetVolume = 0,   // default 0 jika tidak ada target dari DB
        allLocations,
        allMonthTxnsKonsolidasi,
        currentTxns,
        mixerRetaseList,
        allUnpaidInvoices,
        totalRblBudgetPlafon,
        totalRblOpex,
        now
    } = params

    // 1. Unit Economics
    const unitEconomics: UnitEconomicsData = {
        aspPerM3: currentASP,
        semenPerM3: currentVolumeTotal > 0 ? Math.round(totalSemenCost / currentVolumeTotal) : 0,
        pasirPerM3: currentVolumeTotal > 0 ? Math.round(totalPasirCost / currentVolumeTotal) : 0,
        splitPerM3: currentVolumeTotal > 0 ? Math.round(totalSplitCost / currentVolumeTotal) : 0,
        materialPerM3: currentVolumeTotal > 0 ? Math.round(totalMaterialCost / currentVolumeTotal) : 0,
        solarPerM3: currentVolumeTotal > 0 ? Math.round(totalFuelCost / currentVolumeTotal) : 0,
        retasePerM3: currentVolumeTotal > 0 ? Math.round(totalRetaseCost / currentVolumeTotal) : 0,
        maintenancePerM3: currentVolumeTotal > 0 ? Math.round(totalMaintenanceCost / currentVolumeTotal) : 0,
        manualDirectPerM3: currentVolumeTotal > 0 ? Math.round(manualDirectCost / currentVolumeTotal) : 0,
        cogsPerM3: unitDirectCostPerM3,
        grossProfitPerM3: currentASP - unitDirectCostPerM3,
    }

    // 2. MoM Comparison
    const prevDirectCostEst = Math.round(prevVolumeTotal * unitDirectCostPerM3)
    const prevGrossProfit = prevTotalGrossRevenue - prevDirectCostEst
    const prevGrossMargin = prevTotalGrossRevenue > 0 ? (prevGrossProfit / prevTotalGrossRevenue) * 100 : 0

    const momComparison: MomComparisonData = {
        volume: {
            current: currentVolumeTotal,
            prev: prevVolumeTotal,
            growthPct: prevVolumeTotal > 0 ? ((currentVolumeTotal - prevVolumeTotal) / prevVolumeTotal) * 100 : 0
        },
        revenue: {
            current: totalGrossRevenue,
            prev: prevTotalGrossRevenue,
            growthPct: prevTotalGrossRevenue > 0 ? ((totalGrossRevenue - prevTotalGrossRevenue) / prevTotalGrossRevenue) * 100 : 0
        },
        asp: {
            current: currentASP,
            prev: prevASP,
            growthPct: prevASP > 0 ? ((currentASP - prevASP) / prevASP) * 100 : 0
        },
        cogs: {
            current: unitDirectCostPerM3,
            prev: prevVolumeTotal > 0 && prevDirectCostEst > 0 ? Math.round(prevDirectCostEst / prevVolumeTotal) : 0,
            growthPct: prevDirectCostEst > 0 ? ((unitDirectCostPerM3 - (prevDirectCostEst / prevVolumeTotal)) / (prevDirectCostEst / prevVolumeTotal)) * 100 : 0
        },
        grossProfitPerM3: {
            current: unitEconomics.grossProfitPerM3,
            prev: prevASP - (prevVolumeTotal > 0 && prevDirectCostEst > 0 ? Math.round(prevDirectCostEst / prevVolumeTotal) : 0),
        },
        grossMarginPct: {
            current: grossMarginPercent,
            prev: prevGrossMargin,
            diffPct: grossMarginPercent - prevGrossMargin
        },
        fuelRatioPct: {
            current: totalGrossRevenue > 0 ? (totalFuelCost / totalGrossRevenue) * 100 : 0,
            prev: prevTotalGrossRevenue > 0 && prevTotalFuelCost > 0
                ? (prevTotalFuelCost / prevTotalGrossRevenue) * 100
                : 0 // Tidak membagi silang biaya BBM bulan ini ke pendapatan bulan lalu
        }
    }

    // 3. AR Aging
    let arCurrent = 0      // <= 30 days
    let ar31to60 = 0       // 31-60 days
    let arOver60 = 0       // > 60 days

    allUnpaidInvoices.forEach(inv => {
        const outstanding = (inv.total_amount || 0) - (inv.paid_amount || 0)
        const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(inv.issue_date)
        const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays <= 30) {
            arCurrent += outstanding
        } else if (diffDays <= 60) {
            ar31to60 += outstanding
        } else {
            arOver60 += outstanding
        }
    })
    const totalOutstandingAR = arCurrent + ar31to60 + arOver60

    // Cek transaksi unpriced (belum ada harga di project)
    const unpricedTxns = currentTxns.filter(t => {
        const p = t.project?.prices?.find((pr: any) => 
            pr.qualityId === t.qualityId || 
            (pr.concreteQuality?.name && t.concreteQuality?.name && pr.concreteQuality.name.toLowerCase() === t.concreteQuality.name.toLowerCase())
        )?.price
        return !p || p <= 0
    })

    // 4. Alerts
    const alerts: ReportAlert[] = [
        ...(unpricedTxns.length > 0 ? [{
            type: "danger" as const,
            title: "Transaksi Belum Memiliki Tarif Harga",
            message: `Terdapat ${unpricedTxns.length} surat jalan pengiriman beton yang belum memiliki tarif harga mutu di proyek pelanggan. Transaksi ini dinilai Rp 0 agar tidak mendistorsi omset aktual.`
        }] : []),
        {
            type: unitEconomics.solarPerM3 > 75000 ? "danger" : "info",
            title: "BBM Solar Ratio",
            message: `Biaya solar armada rata-rata Rp ${unitEconomics.solarPerM3.toLocaleString("id-ID")}/m³ (${momComparison.fuelRatioPct.current.toFixed(1)}% dari revenue usaha).`
        },
        {
            type: "warning",
            title: "Material Reconciliation",
            message: `Estimasi biaya material Rp ${unitEconomics.materialPerM3.toLocaleString("id-ID")}/m³ (${unitEconomics.cogsPerM3 > 0 ? ((unitEconomics.materialPerM3 / unitEconomics.cogsPerM3) * 100).toFixed(1) : 0}% porsi biaya pokok).`
        },
        {
            type: arOver60 > 100000000 ? "danger" : "warning",
            title: "Piutang Usaha >60 Hari",
            message: `Terdapat piutang menunggak di atas 60 hari sebesar Rp ${arOver60.toLocaleString("id-ID")}. Prioritaskan tindak lanjut penagihan.`
        },
        {
            type: totalRblBudgetPlafon > 0 && (totalRblOpex / totalRblBudgetPlafon) > 0.9 ? "warning" : "success",
            title: "Status Budget Kas Cabang (RBL)",
            message: `Realisasi kas cabang mencapai Rp ${totalRblOpex.toLocaleString("id-ID")} (${totalRblBudgetPlafon > 0 ? ((totalRblOpex / totalRblBudgetPlafon) * 100).toFixed(1) : 0}% dari plafon).`
        }
    ]

    // 5. Branch Benchmark
    const branchBenchmark: BranchBenchmarkItem[] = allLocations.map(loc => {
        const locTxns = allMonthTxnsKonsolidasi.filter(t => t.locationId === loc.id)
        const vol = locTxns.reduce((s, t) => s + (t.volume_cubic || 0), 0)
        let rev = 0
        locTxns.forEach(t => {
            const p = t.project?.prices?.find((pr: any) => 
                pr.qualityId === t.qualityId || 
                (pr.concreteQuality?.name && t.concreteQuality?.name && pr.concreteQuality.name.toLowerCase() === t.concreteQuality.name.toLowerCase())
            )?.price || 0
            rev += (t.volume_cubic * p)
        })
        const asp = vol > 0 ? Math.round(rev / vol) : 0
        const cogs = Math.round(vol * unitDirectCostPerM3)
        const margin = rev > 0 ? ((rev - cogs) / rev) * 100 : 0

        return {
            id: loc.id,
            name: loc.name,
            volume: vol,
            target: branchTargetVolume,
            achievementPct: branchTargetVolume > 0 ? Math.round((vol / branchTargetVolume) * 100) : 0,
            revenue: rev,
            asp,
            cogsPerM3: cogs > 0 && vol > 0 ? Math.round(cogs / vol) : 0,
            grossMarginPct: margin,
            trips: locTxns.length
        }
    }).sort((a, b) => b.volume - a.volume)

    // 6. Mutu Distribution
    const mutuMap: Record<string, { name: string; volume: number; revenue: number; trips: number; unpricedTrips: number }> = {}
    currentTxns.forEach(t => {
        const name = t.concreteQuality?.name || "Mutu Standar"
        const matchedPrice = t.project?.prices?.find((pr: any) => 
            pr.qualityId === t.qualityId || 
            (pr.concreteQuality?.name && t.concreteQuality?.name && pr.concreteQuality.name.toLowerCase() === t.concreteQuality.name.toLowerCase())
        )?.price
        const p = matchedPrice ?? 0
        const val = t.volume_cubic * p

        if (!mutuMap[name]) {
            mutuMap[name] = { name, volume: 0, revenue: 0, trips: 0, unpricedTrips: 0 }
        }
        mutuMap[name].volume += t.volume_cubic
        mutuMap[name].revenue += val
        mutuMap[name].trips++
        if (!matchedPrice || matchedPrice <= 0) {
            mutuMap[name].unpricedTrips++
        }
    })

    const mutuDistribution: MutuDistributionItem[] = Object.values(mutuMap).map(m => ({
        ...m,
        sharePct: currentVolumeTotal > 0 ? (m.volume / currentVolumeTotal) * 100 : 0,
        asp: m.volume > 0 ? Math.round(m.revenue / m.volume) : 0
    })).sort((a, b) => b.volume - a.volume)

    // 7. Top Customers
    const customerProjectMap: Record<string, {
        customerName: string;
        projectName: string;
        volume: number;
        revenue: number;
        trips: number;
        billingStatus: string;
    }> = {}

    currentTxns.forEach(t => {
        const custName = t.project?.customer?.customer_name || "Pelanggan Umum"
        const projName = t.project?.name || "Proyek Lapangan"
        const key = `${custName}-${projName}`
        const matchedPrice = t.project?.prices?.find((pr: any) => 
            pr.qualityId === t.qualityId || 
            (pr.concreteQuality?.name && t.concreteQuality?.name && pr.concreteQuality.name.toLowerCase() === t.concreteQuality.name.toLowerCase())
        )?.price
        const p = matchedPrice ?? 0
        const val = t.volume_cubic * p
        const isUnpriced = !matchedPrice || matchedPrice <= 0

        if (!customerProjectMap[key]) {
            customerProjectMap[key] = {
                customerName: custName,
                projectName: projName,
                volume: 0,
                revenue: 0,
                trips: 0,
                billingStatus: isUnpriced ? "Perlu Setting Harga" : "Aktif Berjalan"
            }
        }
        customerProjectMap[key].volume += t.volume_cubic
        customerProjectMap[key].revenue += val
        customerProjectMap[key].trips++
        if (isUnpriced) {
            customerProjectMap[key].billingStatus = "Perlu Setting Harga"
        }
    })

    const topCustomers: TopCustomerItem[] = Object.values(customerProjectMap)
        .map(c => ({
            ...c,
            sharePct: totalGrossRevenue > 0 ? (c.revenue / totalGrossRevenue) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

    // 8. Fleet & Plant Capacity
    const activeMixers = new Set(currentTxns.map(t => t.vehicleId).filter(Boolean))
    const totalTrips = currentTxns.length
    const installedCapacity = 12480 // 60 m3/hr * 8 hr * 26 days
    const capacityUtilizationPct = installedCapacity > 0 ? (currentVolumeTotal / installedCapacity) * 100 : 0

    const fleetStats: FleetStatsData = {
        activeMixerCount: activeMixers.size,
        totalTrips,
        tripsPerMixerAvg: activeMixers.size > 0 ? Number((totalTrips / activeMixers.size).toFixed(1)) : 0,
        loadPerTripAvg: totalTrips > 0 ? Number((currentVolumeTotal / totalTrips).toFixed(2)) : 0,
        capacityUtilizationPct: Number(capacityUtilizationPct.toFixed(1))
    }

    // 9. Driver Commission & Retase
    const driverCommissionMap: Record<string, { name: string; trips: number; totalVolume: number; commission: number }> = {}
    mixerRetaseList.forEach(r => {
        const name = r.driver?.name || "Sopir Mixer"
        if (!driverCommissionMap[name]) {
            driverCommissionMap[name] = { name, trips: 0, totalVolume: 0, commission: 0 }
        }
        driverCommissionMap[name].trips++
        driverCommissionMap[name].totalVolume += (r.volume || 0)
        driverCommissionMap[name].commission += (r.income_amount || 0)
    })

    if (mixerRetaseList.length === 0) {
        currentTxns.forEach(t => {
            if (t.driver?.name) {
                const name = t.driver.name
                if (!driverCommissionMap[name]) {
                    driverCommissionMap[name] = { name, trips: 0, totalVolume: 0, commission: 0 }
                }
                driverCommissionMap[name].trips++
                driverCommissionMap[name].totalVolume += (t.volume_cubic || 0)
            }
        })
    }

    const topDrivers: DriverRetaseItem[] = Object.values(driverCommissionMap)
        .map(d => ({
            name: d.name,
            trips: d.trips,
            volume: Number(d.totalVolume.toFixed(1)),
            totalVolume: Number(d.totalVolume.toFixed(1)),
            avgLoad: d.trips > 0 ? Number((d.totalVolume / d.trips).toFixed(1)) : 0,
            retase: d.commission,
            commission: d.commission,
        }))
        .sort((a, b) => b.retase - a.retase)
        .map((d, idx) => ({ ...d, rank: idx + 1 }))

    return {
        unitEconomics,
        momComparison,
        alerts,
        branchBenchmark,
        mutuDistribution,
        topCustomers,
        fleetStats,
        topDrivers,
        arAging: {
            current: arCurrent,
            ar31to60,
            arOver60,
            totalOutstanding: totalOutstandingAR
        }
    }
}
