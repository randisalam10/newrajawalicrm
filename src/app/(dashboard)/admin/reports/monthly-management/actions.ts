"use server"

import { auth } from "@/auth"
import { startOfMonth, endOfMonth, subMonths, format, parse } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { MonthlyReportFilters, MonthlyManagementReportResult } from "./types"
import {
    fetchMonthlyReportRawData,
    calculateReadymixRevenue,
    computeSewaDetailed,
    calculateDirectCogs,
    calculateOverheadAndAmortization,
    calculateReportAnalytics,
    isDirectCogsCategory,
} from "./services"
import { getOperationalTargetSetting } from "@/app/(dashboard)/admin/fixed-costs/actions"

export async function getMonthlyManagementReportData(
    filters: MonthlyReportFilters = {}
): Promise<MonthlyManagementReportResult> {
    const session = await auth()

    // ── STRICT SECURITY: ONLY SUPERADMIN IS ALLOWED ──
    if (session?.user?.role !== "SuperAdminBP") {
        return {
            authorized: false,
            error: "Akses Ditolak: Laporan Bulanan Manajemen ini bersifat rahasia dan hanya dapat diakses oleh Super Admin / Direksi Eksekutif."
        }
    }

    try {
        // 1. Determine Selected Month & Previous Month
        const now = new Date()
        let targetDate = now

        if (filters.month) {
            try {
                targetDate = parse(filters.month, "yyyy-MM", new Date())
            } catch {
                targetDate = now
            }
        }

        const monthStart = startOfMonth(targetDate)
        const monthEnd = endOfMonth(targetDate)
        const prevMonthDate = subMonths(targetDate, 1)
        const prevMonthStart = startOfMonth(prevMonthDate)
        const prevMonthEnd = endOfMonth(prevMonthDate)

        const selectedPeriodStr = format(targetDate, "yyyy-MM")
        const selectedPeriodLabel = format(targetDate, "MMMM yyyy", { locale: idLocale })
        const prevPeriodLabel = format(prevMonthDate, "MMMM yyyy", { locale: idLocale })

        // 2. Location Scoping
        const selectedLocId = filters.locationId && filters.locationId !== "all" ? filters.locationId : null

        // 3. Fetch Raw Data in Parallel Batches
        const raw = await fetchMonthlyReportRawData({
            monthStart,
            monthEnd,
            prevMonthStart,
            prevMonthEnd,
            selectedLocId,
            targetMonthNum: targetDate.getMonth() + 1,
            targetYearNum: targetDate.getFullYear()
        })

        const activeLocationName = selectedLocId
            ? (raw.allLocations.find(l => l.id === selectedLocId)?.name || "Cabang Terpilih")
            : "Semua Cabang (Konsolidasi Pusat)"

        // 4. Calculate Revenues (Readymix, Sewa, and Aggregate)
        const currentReadymix = calculateReadymixRevenue(raw.currentTxns)
        const prevReadymix = calculateReadymixRevenue(raw.prevTxns)

        const currentSewa = computeSewaDetailed(raw.currentSewaTxns, monthStart, monthEnd)
        const prevSewa = computeSewaDetailed(raw.prevSewaTxns, prevMonthStart, prevMonthEnd)

        const currentAggRevenue = raw.currentAggOutgoing.reduce((sum, a) => sum + (a.total_price || 0), 0)
        const prevAggRevenue = raw.prevAggOutgoing.reduce((sum, a) => sum + (a.total_price || 0), 0)

        const currentAggDPP = currentAggRevenue
        const currentAggPPN = 0
        const currentAggGross = currentAggRevenue

        const prevAggDPP = prevAggRevenue
        const prevAggPPN = 0
        const prevAggGross = prevAggRevenue

        // TOTAL REVENUE BREAKDOWN
        const totalDppRevenue = currentReadymix.dpp + currentSewa.dppTotal + currentAggDPP
        const prevTotalDppRevenue = prevReadymix.dpp + prevSewa.dppTotal + prevAggDPP

        const totalTaxLiability = currentReadymix.ppn + currentSewa.ppnTotal + currentAggPPN
        const prevTotalTaxLiability = prevReadymix.ppn + prevSewa.ppnTotal + prevAggPPN

        const totalGrossRevenue = totalDppRevenue + totalTaxLiability
        const prevTotalGrossRevenue = prevTotalDppRevenue + prevTotalTaxLiability

        // 5. Calculate Direct COGS
        const cogs = calculateDirectCogs({
            currentTxns: raw.currentTxns,
            activePrices: raw.activePrices,
            currentBbmExpenses: raw.currentBbmExpenses,
            mixerRetaseList: raw.mixerRetaseList,
            dtRetaseIncoming: raw.dtRetaseIncoming,
            dtRetaseOutgoing: raw.dtRetaseOutgoing,
            maintenancePoItems: raw.maintenancePoItems,
            rblMaintenance: raw.rblMaintenance,
            cementPoItems: raw.cementPoItems,
            cementIncomings: raw.cementIncomings,
            currentVolumeTotal: currentReadymix.volumeTotal,
            activeFixedContracts: raw.activeFixedContracts
        })

        // 6. Gross Profit
        const grossProfit = totalDppRevenue - cogs.totalDirectCost
        const grossMarginPercent = totalDppRevenue > 0 ? ((grossProfit / totalDppRevenue) * 100) : 0

        // 7. Calculate Overhead & Amortization
        const overhead = calculateOverheadAndAmortization({
            rblBudgets: raw.rblBudgets,
            rblExpensesAll: raw.rblExpensesAll,
            activeFixedContracts: raw.activeFixedContracts,
            activeVehicles: raw.activeVehicles,
            monthStart,
            monthEnd
        })

        // 8. Net Field Contribution
        const netFieldContribution = grossProfit - overhead.totalRblOpex - overhead.totalAmortizationMonthly
        const fieldContributionMarginPercent = totalDppRevenue > 0 ? ((netFieldContribution / totalDppRevenue) * 100) : 0

        // 8.1 Realisasi Kas Pembayaran Pelanggan vs Kas Keluar Operasional
        const paymentsInMonth = raw.paymentsInMonth || []
        const totalPaymentReceived = paymentsInMonth.reduce((s: number, p: any) => s + (p.amount || 0), 0)
        const paymentCount = paymentsInMonth.length
        const totalDepositReceived = (raw.activeDeposits || []).reduce((s: number, d: any) => s + (d.amount || 0), 0)
        const totalCashInflow = totalPaymentReceived + totalDepositReceived
        const totalCashOutflow = overhead.totalRblCashDisbursement || overhead.totalRblOpex
        const netOperatingCashflow = totalCashInflow - totalCashOutflow
        const cashCollectionRate = totalDppRevenue > 0 ? (totalPaymentReceived / totalDppRevenue) * 100 : 0

        // 9. Fetch Operational Target Setting (dipindahkan ke sini agar tersedia saat analytics)
        const targetSetting = await getOperationalTargetSetting(selectedLocId)
        const isSpecificBranch = Boolean(selectedLocId && selectedLocId !== "all")
        const productionTargetM3 = isSpecificBranch
            ? (targetSetting.target_branch_volume ? Number(targetSetting.target_branch_volume) : 0)
            : (targetSetting.target_monthly_volume ? Number(targetSetting.target_monthly_volume) : 0)
        const achievementPct = productionTargetM3 > 0
            ? Number(((currentReadymix.volumeTotal / productionTargetM3) * 100).toFixed(1))
            : 0

        // 9.1 Analytics & Indicators
        // Hitung biaya BBM bulan sebelumnya untuk MoM fuel ratio yang akurat
        const prevTotalFuelCost = (raw.prevBbmExpenses || []).reduce((s: number, e: any) => s + (e.amount || 0), 0)

        const analytics = calculateReportAnalytics({
            currentASP: currentReadymix.asp,
            prevASP: prevReadymix.asp,
            currentVolumeTotal: currentReadymix.volumeTotal,
            prevVolumeTotal: prevReadymix.volumeTotal,
            totalSemenCost: cogs.totalSemenCost,
            totalPasirCost: cogs.totalPasirCost,
            totalSplitCost: cogs.totalSplitCost,
            totalMaterialCost: cogs.totalMaterialCost,
            totalFuelCost: cogs.totalFuelCost,
            prevTotalFuelCost,
            totalRetaseCost: cogs.totalRetaseCost,
            totalMaintenanceCost: cogs.totalMaintenanceCost,
            manualDirectCost: cogs.manualDirectCost,
            unitDirectCostPerM3: cogs.unitDirectCostPerM3,
            totalGrossRevenue,
            prevTotalGrossRevenue,
            grossMarginPercent,
            branchTargetVolume: targetSetting.target_branch_volume ? Number(targetSetting.target_branch_volume) : 0,
            allLocations: raw.allLocations,
            allMonthTxnsKonsolidasi: raw.allMonthTxnsKonsolidasi,
            currentTxns: raw.currentTxns,
            mixerRetaseList: raw.mixerRetaseList,
            allUnpaidInvoices: raw.allUnpaidInvoices,
            totalRblBudgetPlafon: overhead.totalRblBudgetPlafon,
            totalRblOpex: overhead.totalRblOpex,
            now
        })

        // Billing aggregations
        const totalInvoicedMonth = raw.invoicesIssuedInMonth.reduce((s, i) => s + (i.total_amount || 0), 0)
        const unbilledVolume = raw.unbilledTxns.reduce((s, t) => s + (t.volume_cubic || 0), 0)
        let unbilledEstimatedValue = 0
        let unbilledUnpricedCount = 0
        raw.unbilledTxns.forEach((t: any) => {
            const matched = t.project?.prices?.find((pr: any) => 
                pr.qualityId === t.qualityId || 
                (pr.concreteQuality?.name && t.concreteQuality?.name && pr.concreteQuality.name.toLowerCase() === t.concreteQuality.name.toLowerCase())
            )
            const p = matched?.price ?? 0
            if (p <= 0) {
                unbilledUnpricedCount++
            }
            unbilledEstimatedValue += (t.volume_cubic * p)
        })

        // Alerts untuk missing prices
        if (cogs.isSemenPriceMissing) {
            analytics.alerts.unshift({
                type: "danger",
                title: "Harga Semen Belum Ditetapkan",
                message: "Tidak ditemukan data penerimaan Silo maupun master harga semen untuk periode ini. Biaya semen dihitung Rp 0. Segera catat penerimaan Silo atau master harga semen."
            })
        }
        if (cogs.isPasirPriceMissing || cogs.isSplitPriceMissing) {
            analytics.alerts.unshift({
                type: "warning",
                title: "Master Harga Agregat Belum Lengkap",
                message: `Harga master untuk ${[cogs.isPasirPriceMissing ? "Pasir" : "", cogs.isSplitPriceMissing ? "Batu Split" : ""].filter(Boolean).join(" & ")} belum diatur. Biaya terkait dihitung Rp 0.`
            })
        }
        if (unbilledUnpricedCount > 0) {
            analytics.alerts.unshift({
                type: "warning",
                title: "Surat Jalan Belum Memiliki Tarif Proyek",
                message: `Terdapat ${unbilledUnpricedCount} surat jalan terkirim yang belum memiliki tarif mutu proyek. Nilai estimasi tagihan dihitung Rp 0 untuk transaksi tersebut.`
            })
        }

        const totalSemenMasukKg = raw.cementIncomings.reduce((s, c) => s + (c.tonnage || 0), 0)
        const totalSemenIncomingVal = raw.cementIncomings.reduce((s, c) => s + (c.total_price || 0), 0)
        const totalSemenPoVal = raw.cementPoItems.reduce((s, p) => s + (p.subtotal || 0), 0)
        let totalSemenPoKg = 0
        raw.cementPoItems.forEach(p => {
            const qty = p.quantity || 0
            const sat = (p.masterItem?.satuan || "").toLowerCase()
            const name = (p.masterItem?.name || "").toLowerCase()
            const ket = (p.keterangan || "").toLowerCase()
            if (sat.includes("ton") || name.includes("1 ton") || ket.includes("1 ton")) {
                totalSemenPoKg += qty * 1000
            } else if (sat.includes("zak") || name.includes("zak") || name.includes("50kg")) {
                totalSemenPoKg += qty * 50
            } else if (sat.includes("kg") || name.includes("kg")) {
                totalSemenPoKg += qty
            } else {
                totalSemenPoKg += qty * 1000
            }
        })

        const totalPasirMasukM3 = raw.aggIncomings.filter(a => a.aggregate_type === "Pasir").reduce((s, a) => s + (a.volume_cubic || 0), 0)
        const totalPasirIncomingVal = raw.aggIncomings.filter(a => a.aggregate_type === "Pasir").reduce((s, a) => s + (a.total_price || 0), 0)

        const totalSplitMasukM3 = raw.aggIncomings.filter(a => a.aggregate_type.toString().includes("Split")).reduce((s, a) => s + (a.volume_cubic || 0), 0)
        const totalSplitIncomingVal = raw.aggIncomings.filter(a => a.aggregate_type.toString().includes("Split")).reduce((s, a) => s + (a.total_price || 0), 0)

        const supplierMap = new Map(raw.allSuppliers.map(s => [s.id, s.name]))

        // 9.5 Unit Economics Targets (dari OperationalTargetSetting tanpa fallback angka fiktif)
        const unitEconomicsTargets = {
            asp: Number(targetSetting.target_asp || 0),
            semen: Number(targetSetting.target_semen_cost || 0),
            pasir: Number(targetSetting.target_pasir_cost || 0),
            split: Number(targetSetting.target_split_cost || 0),
            solar: Number(targetSetting.target_solar_cost || 0),
            retase: Number(targetSetting.target_retase_cost || 0),
            maintenance: Number(targetSetting.target_maintenance_cost || 0),
            other: Number(targetSetting.target_other_cogs || 0),
            cogs: Number(targetSetting.target_cogs || 0),
            grossProfit: Number(targetSetting.target_gross_profit || 0),
            labelAsp: targetSetting.label_asp || null,
            labelSemen: targetSetting.label_semen || null,
            labelPasir: targetSetting.label_pasir || null,
            labelSplit: targetSetting.label_split || null,
            labelSolar: targetSetting.label_solar || null,
            labelRetase: targetSetting.label_retase || null,
            labelMaintenance: targetSetting.label_maintenance || null,
            labelOther: targetSetting.label_other || null,
            labelCogs: targetSetting.label_cogs || null,
            labelGrossProfit: targetSetting.label_gross_profit || null,
        }

        // 10. Assemble and Return Complete Result
        return {
            authorized: true,
            selectedPeriodStr,
            selectedPeriodLabel,
            prevPeriodLabel,
            selectedLocId: selectedLocId || "all",
            activeLocationName,
            availableLocations: raw.allLocations,
            availableMonths: [
                "2026-10", "2026-09", "2026-08", "2026-07", "2026-06",
                "2026-05", "2026-04", "2026-03", "2026-02", "2026-01"
            ],
            scorecard: {
                productionVolumeM3: currentReadymix.volumeTotal,
                productionTargetM3,
                achievementPct,

                readymixRevenue: currentReadymix.dpp,
                rentalRevenue: currentSewa.dppTotal,
                aggregateRevenue: currentAggDPP,
                totalDppRevenue,

                readymixPpn: currentReadymix.ppn,
                rentalPpn: currentSewa.ppnTotal,
                aggregatePpn: currentAggPPN,
                totalTaxLiability,

                readymixGross: currentReadymix.gross,
                rentalGross: currentSewa.grossTotal,
                aggregateGross: currentAggGross,
                totalGrossRevenue,

                materialCost: cogs.totalMaterialCost,
                semenCost: cogs.totalSemenCost,
                pasirCost: cogs.totalPasirCost,
                splitCost: cogs.totalSplitCost,
                split12Cost: cogs.totalSplit12Cost,
                split23Cost: cogs.totalSplit23Cost,
                ciping05Cost: cogs.totalCiping05Cost,
                aggregateCost: cogs.totalAggregateCost,
                totalCementPoCost: cogs.totalCementPoCost,
                fuelCost: cogs.totalFuelCost,
                retaseCost: cogs.totalRetaseCost,
                maintenanceCost: cogs.totalMaintenanceCost,
                maintenancePoCost: cogs.maintenancePoCost,
                maintenanceRblCost: cogs.maintenanceRblCost,
                totalPoBpCost: cogs.totalPoBpCost,
                totalRblDirectCost: cogs.totalRblDirectCost,
                manualDirectCost: cogs.manualDirectCost || 0,
                totalDirectCost: cogs.totalDirectCost,
                unitDirectCostPerM3: cogs.unitDirectCostPerM3,
                unitASP: currentReadymix.asp,

                grossProfit,
                grossMarginPercent: Number(grossMarginPercent.toFixed(2)),

                rblOpex: overhead.totalRblOpex,
                rblTotalDisbursement: overhead.totalRblCashDisbursement,
                rblBbmDirect: overhead.rblBbmDirect,
                rblMaintenanceDirect: overhead.rblMaintenanceDirect,
                rblPlafon: overhead.totalRblBudgetPlafon,
                sisaKasRbl: overhead.sisaKasRbl,

                totalFixedContractMonthly: overhead.totalFixedContractMonthly,
                sewaTanahMonthly: overhead.totalSewaTanahCost,
                sewaMessMonthly: overhead.totalSewaMessCost,
                gajiMonthly: overhead.totalGajiCost,
                perizinanMonthly: overhead.totalPerizinanCost,
                asuransiRetribusiMonthly: overhead.totalAsuransiRetribusiCost,
                vehicleTaxMonthly: overhead.totalMonthlyVehicleTax,
                vehicleKirMonthly: overhead.totalMonthlyVehicleKir,
                totalVehicleComplianceMonthly: overhead.totalVehicleComplianceMonthly,
                totalAmortizationMonthly: overhead.totalAmortizationMonthly,

                netFieldContribution,
                fieldContributionMarginPercent: Number(fieldContributionMarginPercent.toFixed(2)),

                cashflow: {
                    totalPaymentReceived,
                    paymentCount,
                    totalDepositReceived,
                    totalCashInflow,
                    totalCashOutflow,
                    netOperatingCashflow,
                    cashCollectionRate: Number(cashCollectionRate.toFixed(2))
                }
            },
            unitEconomics: {
                ...analytics.unitEconomics,
                targets: unitEconomicsTargets
            },
            momComparison: analytics.momComparison,
            alerts: analytics.alerts,
            branchBenchmark: analytics.branchBenchmark,
            mutuDistribution: analytics.mutuDistribution,
            topCustomers: analytics.topCustomers,
            fleetStats: analytics.fleetStats,
            costComposition: [
                { name: "Semen Curah & Zak", value: cogs.totalSemenCost, pct: cogs.totalDirectCost > 0 ? (cogs.totalSemenCost / cogs.totalDirectCost) * 100 : 0 },
                { name: "Pasir Cor", value: cogs.totalPasirCost, pct: cogs.totalDirectCost > 0 ? (cogs.totalPasirCost / cogs.totalDirectCost) * 100 : 0 },
                { name: "Batu Split (1/2 & 2/3)", value: cogs.totalSplitCost, pct: cogs.totalDirectCost > 0 ? (cogs.totalSplitCost / cogs.totalDirectCost) * 100 : 0 },
                { name: "Retase Supir (Mixer & DT)", value: cogs.totalRetaseCost, pct: cogs.totalDirectCost > 0 ? (cogs.totalRetaseCost / cogs.totalDirectCost) * 100 : 0 },
                { name: "BBM Solar Armada", value: cogs.totalFuelCost, pct: cogs.totalDirectCost > 0 ? (cogs.totalFuelCost / cogs.totalDirectCost) * 100 : 0 },
                { name: "Suku Cadang & Bengkel", value: cogs.totalMaintenanceCost, pct: cogs.totalDirectCost > 0 ? (cogs.totalMaintenanceCost / cogs.totalDirectCost) * 100 : 0 },
                { name: "Sewa Tanah & Mess (Amortisasi)", value: overhead.totalFixedContractMonthly, pct: cogs.totalDirectCost > 0 ? (overhead.totalFixedContractMonthly / cogs.totalDirectCost) * 100 : 0 },
                { name: "Pajak & KIR Armada (Amortisasi)", value: overhead.totalVehicleComplianceMonthly, pct: cogs.totalDirectCost > 0 ? (overhead.totalVehicleComplianceMonthly / cogs.totalDirectCost) * 100 : 0 }
            ],
            drilldown: {
                maintenanceDetail: {
                    fromPo: raw.maintenancePoItems.map(item => ({
                        id: item.id,
                        po_number: item.purchaseOrder?.po_number || "-",
                        po_id: item.purchaseOrder?.id || "-",
                        tanggal: item.purchaseOrder?.tanggal_terbit
                            ? format(new Date(item.purchaseOrder.tanggal_terbit), "dd/MM/yyyy")
                            : "-",
                        item_name: item.masterItem?.name || "-",
                        satuan: item.masterItem?.satuan || "pcs",
                        quantity: item.quantity,
                        harga_satuan: item.harga_satuan,
                        subtotal: item.subtotal,
                        keterangan: item.keterangan || "-",
                        lokasi: item.purchaseOrder?.location?.name || "Semua Cabang",
                        kendaraan: item.purchaseOrder?.vehicle?.plate_number || item.purchaseOrder?.vehicle?.code || "-",
                        km_hm: item.purchaseOrder?.km_hm_kendaraan || "-",
                        status: item.purchaseOrder?.status || "-",
                    })),
                    fromRbl: raw.rblMaintenance.map(r => ({
                        id: r.id,
                        tanggal: r.date ? format(new Date(r.date), "dd/MM/yyyy") : "-",
                        kategori: r.category || "Pemeliharaan",
                        deskripsi: (r as any).itemDescription || (r as any).notes || "-",
                        amount: r.amount,
                        lokasi: (r.budget as any)?.location?.name || "Semua Cabang",
                    })),
                    totalFromPo: raw.maintenancePoItems.reduce((s, p) => s + (p.subtotal || 0), 0),
                    totalFromRbl: raw.rblMaintenance.reduce((s, r) => s + (r.amount || 0), 0),
                    total: cogs.totalMaintenanceCost,
                },
                fuelDetail: {
                    total: cogs.totalFuelCost,
                    totalLitres: raw.currentBbmExpenses.reduce((s, b) => s + (b.quantity || 0), 0),
                    items: raw.currentBbmExpenses.map(b => ({
                        id: b.id,
                        tanggal: b.date ? format(new Date(b.date), "dd/MM/yyyy") : "-",
                        deskripsi: b.itemDescription || b.notes || "BBM Solar",
                        liter: b.quantity || 0,
                        harga_satuan: b.unitPrice || 0,
                        amount: b.amount,
                        kendaraan: b.vehicle?.plate_number || b.vehicle?.code || "-",
                        km_hm: b.kmMeter ? `${b.kmMeter.toLocaleString("id-ID")} KM/HM` : "-",
                        lokasi: (b.budget as any)?.location?.name || "Semua Cabang",
                    })),
                },
                retaseDetail: {
                    total: cogs.totalRetaseCost,
                    mixerRetaseTotal: cogs.mixerRetaseTotal,
                    dtRetaseTotal: cogs.dtRetaseTotal,
                    mixerCount: raw.mixerRetaseList.length,
                    topDrivers: analytics.topDrivers,
                },
                materialDetail: {
                    total: cogs.totalMaterialCost,
                    semen: {
                        totalCost: cogs.totalSemenCost,
                        avgPricePerKg: cogs.semenPricePerKg,
                        totalInKg: totalSemenMasukKg,
                        consumedKg: cogs.totalSemenConsumedKg,
                        diffKg: totalSemenMasukKg - cogs.totalSemenConsumedKg,
                        totalPoKg: totalSemenPoKg,
                        totalPoVal: totalSemenPoVal,
                        totalIncomingVal: totalSemenIncomingVal,
                    },
                    pasir: {
                        totalCost: cogs.totalPasirCost,
                        avgPricePerM3: cogs.pasirPricePerM3,
                        totalInM3: totalPasirMasukM3,
                        consumedM3: cogs.totalPasirConsumedM3,
                        diffM3: Math.round((totalPasirMasukM3 - cogs.totalPasirConsumedM3) * 10) / 10,
                        totalIncomingVal: totalPasirIncomingVal,
                    },
                    split: {
                        totalCost: cogs.totalSplitCost,
                        avgPricePerM3: cogs.splitPricePerM3,
                        totalInM3: totalSplitMasukM3,
                        consumedM3: cogs.totalSplitConsumedM3,
                        diffM3: Math.round((totalSplitMasukM3 - cogs.totalSplitConsumedM3) * 10) / 10,
                        totalIncomingVal: totalSplitIncomingVal,
                    },
                    reconciliation: {
                        totalProcuredVal: totalSemenIncomingVal + totalPasirIncomingVal + totalSplitIncomingVal,
                        totalConsumedVal: cogs.totalMaterialCost,
                        totalDiffVal: (totalSemenIncomingVal + totalPasirIncomingVal + totalSplitIncomingVal) - cogs.totalMaterialCost,
                    },
                    incomings: raw.cementIncomings.slice(0, 20).map(c => ({
                        id: c.id,
                        date: format(new Date(c.date), "dd/MM/yyyy"),
                        name: c.name,
                        supplier: c.supplier,
                        tonnage: c.tonnage,
                        unit_price: c.unit_price || 0,
                        total_price: c.total_price || 0,
                        delivery_note: c.delivery_note
                    })),
                    cementPoItems: raw.cementPoItems.map(p => ({
                        id: p.id,
                        po_number: p.purchaseOrder?.po_number || "-",
                        tanggal: p.purchaseOrder?.tanggal_terbit ? format(new Date(p.purchaseOrder.tanggal_terbit), "dd/MM/yyyy") : "-",
                        item_name: p.masterItem?.name || "Semen",
                        quantity: p.quantity,
                        satuan: p.masterItem?.satuan || "zak/ton",
                        harga_satuan: p.harga_satuan,
                        subtotal: p.subtotal,
                        lokasi: p.purchaseOrder?.location?.name || "Semua Cabang",
                        companyGroup: p.purchaseOrder?.companyGroup?.name || "-",
                        status: p.purchaseOrder?.status || "-"
                    })),
                },
                readymixDetail: {
                    totalVolume: currentReadymix.volumeTotal,
                    totalDpp: currentReadymix.dpp,
                    totalPpn: currentReadymix.ppn,
                    totalGross: currentReadymix.gross,
                    ticketCount: raw.currentTxns.length,
                    asp: currentReadymix.asp,
                    groupedSales: currentReadymix.groupedSales,
                },
                rentalDetail: {
                    totalDpp: currentSewa.dppTotal,
                    totalPpn: currentSewa.ppnTotal,
                    totalGross: currentSewa.grossTotal,
                    count: raw.currentSewaTxns.length,
                    items: raw.currentSewaTxns.map((s: any) => ({
                        id: s.id,
                        sewa_number: s.sewa_number,
                        date: format(new Date(s.start_date || s.date), "dd/MM/yyyy"),
                        customer: s.customer?.customer_name || "-",
                        equipment: s.equipment?.nama_alat || s.vehicle?.code || "-",
                        operator: s.operator?.name || "-",
                        days: s.total_days,
                        rate: s.price_per_day,
                        ppn_mode: s.ppn_mode,
                        total_price: s.total_price,
                        dpp: s.dpp_amount || s.total_price,
                        ppn: s.ppn_amount || 0,
                        status: s.status,
                        lokasi: s.location?.name || "Semua Cabang"
                    })),
                },
                aggregateSalesDetail: {
                    totalRevenue: currentAggRevenue,
                    count: raw.currentAggOutgoing.length,
                    items: raw.currentAggOutgoing.map((a: any) => ({
                        id: a.id,
                        date: a.date ? format(new Date(a.date), "dd/MM/yyyy") : "-",
                        aggregate_type: a.aggregate_type || "Agregat",
                        volume_cubic: a.volume_cubic || 0,
                        unit_price: a.unit_price || 0,
                        total_price: a.total_price || 0,
                        recipient: a.recipient || "-",
                        vehicle: a.vehicle || "-"
                    })),
                },
                rblOpexDetail: {
                    totalBudget: overhead.totalRblBudgetPlafon,
                    totalRealized: overhead.totalRblOpex,
                    sisaKas: overhead.sisaKasRbl,
                    categories: Object.values(overhead.pureOverheadCategoryBreakdown || overhead.rblCategoryBreakdown).sort((a: any, b: any) => b.total - a.total),
                    recentExpenses: raw.rblExpensesAll.map(e => ({
                        id: e.id,
                        tanggal: e.date ? format(new Date(e.date), "dd/MM/yyyy") : "-",
                        kategori: e.categoryRef?.name || e.category || "Operasional",
                        deskripsi: e.itemDescription || e.notes || "-",
                        amount: e.amount,
                        cabang: e.budget?.location?.name || "-",
                    })),
                },
                fixedCostContracts: raw.activeFixedContracts.filter(c => !isDirectCogsCategory(c.category)).map(c => ({
                    id: c.id,
                    name: c.name,
                    category: c.category,
                    location: c.location?.name || "Semua Cabang / HO",
                    vendor: c.vendor_name || "-",
                    contractNumber: c.contract_number || "-",
                    totalAmount: c.total_amount,
                    durationMonths: c.duration_months,
                    monthlyAmount: c.monthly_amount,
                    startDate: format(new Date(c.start_date), "dd/MM/yyyy"),
                    endDate: format(new Date(c.end_date), "dd/MM/yyyy"),
                    status: c.payment_status || "LUNAS"
                })),
                manualDirectCostItems: (cogs.manualDirectContracts || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    category: c.category,
                    location: c.location?.name || "Semua Cabang / HO",
                    vendor: c.vendor_name || "-",
                    contractNumber: c.contract_number || "-",
                    totalAmount: c.total_amount,
                    durationMonths: c.duration_months,
                    monthlyAmount: c.monthly_amount,
                    startDate: format(new Date(c.start_date), "dd/MM/yyyy"),
                    endDate: format(new Date(c.end_date), "dd/MM/yyyy"),
                    status: c.payment_status || "LUNAS",
                    notes: c.notes || null,
                })),
                vehicleCompliance: overhead.vehicleComplianceDetails,
                recentTickets: raw.currentTxns.slice(0, 30).map(t => ({
                    id: t.id,
                    date: format(new Date(t.date), "dd/MM/yyyy"),
                    project: t.project?.name || "-",
                    customer: t.project?.customer?.customer_name || "-",
                    quality: t.concreteQuality?.name || "-",
                    volume: t.volume_cubic,
                    plate: t.vehicle?.plate_number || t.vehicle?.code || "-",
                    driver: t.driver?.name || "-",
                    price: t.project?.prices?.find((p: any) => 
                        p.qualityId === t.qualityId || 
                        (p.concreteQuality?.name && t.concreteQuality?.name && p.concreteQuality.name.toLowerCase() === t.concreteQuality.name.toLowerCase())
                    )?.price || currentReadymix.asp,
                    total: (t.volume_cubic || 0) * (t.project?.prices?.find((p: any) => 
                        p.qualityId === t.qualityId || 
                        (p.concreteQuality?.name && t.concreteQuality?.name && p.concreteQuality.name.toLowerCase() === t.concreteQuality.name.toLowerCase())
                    )?.price || currentReadymix.asp),
                    status: t.status
                })),
                groupedSales: currentReadymix.groupedSales,
                cementIncomings: raw.cementIncomings.map(c => ({
                    id: c.id,
                    date: format(new Date(c.date), "dd/MM/yyyy"),
                    name: c.name,
                    supplier: c.supplier,
                    tonnage: c.tonnage,
                    unit_price: c.unit_price || 0,
                    total_price: c.total_price || 0,
                    delivery_note: c.delivery_note
                })),
                aggregateIncomings: raw.aggIncomings.map(a => ({
                    id: a.id,
                    date: format(new Date(a.date), "dd/MM/yyyy"),
                    no_bon: a.no_bon || "-",
                    driver_name: a.driver_name || a.driver?.name || "-",
                    plate_number: a.plate_number || a.vehicle?.plate_number || "-",
                    volume_cubic: a.volume_cubic || 0,
                    aggregate_type: a.aggregate_type || "Pasir/Split",
                    source_type: a.source_type || "External",
                    supplier: a.supplier || "-",
                    notes: a.notes || "-",
                    location: a.location?.name || "Semua Cabang",
                    unit_price: a.unit_price || 0,
                    total_price: a.total_price || 0,
                })),
                totalSemenMasukKg,
                totalPasirMasukM3,
                totalSplitMasukM3,
                sewaList: raw.currentSewaTxns.map(s => ({
                    id: s.id,
                    sewa_number: s.sewa_number,
                    date: format(new Date(s.start_date || s.date), "dd/MM/yyyy"),
                    customer: s.customer?.customer_name || "-",
                    equipment: s.equipment?.nama_alat || s.vehicle?.code || "-",
                    operator: s.operator?.name || "-",
                    days: s.total_days,
                    rate: s.price_per_day,
                    ppn_mode: s.ppn_mode,
                    total_price: s.total_price,
                    status: s.status
                })),
                rblCategories: Object.values(overhead.pureOverheadCategoryBreakdown || overhead.rblCategoryBreakdown).sort((a: any, b: any) => b.total - a.total),
                poList: raw.poList.map(p => ({
                    id: p.id,
                    po_number: p.po_number,
                    date: format(new Date(p.tanggal_terbit), "dd/MM/yyyy"),
                    category: p.category?.name || "Umum",
                    supplier: supplierMap.get(p.supplierId) || p.pic_name || "-",
                    amount: p.items.reduce((s: number, it: any) => s + (it.subtotal || 0), 0),
                    status: p.status,
                    approvalChannel: p.approvalChannel
                })),
                topDrivers: analytics.topDrivers,
                billing: {
                    invoicedCount: raw.invoicesIssuedInMonth.length,
                    totalInvoiced: totalInvoicedMonth,
                    unbilledCount: raw.unbilledTxns.length,
                    unbilledVolume,
                    unbilledEstimatedValue,
                    arAging: analytics.arAging,
                    depositCount: raw.activeDeposits.length,
                    totalDepositAmount: raw.activeDeposits.reduce((s: number, d: any) => s + (d.amount || 0), 0),
                    recentPayments: paymentsInMonth.map((p: any) => ({
                        id: p.id,
                        date: format(new Date(p.payment_date), "dd/MM/yyyy"),
                        createdAt: p.createdAt ? format(new Date(p.createdAt), "dd/MM/yyyy HH:mm") : null,
                        invoiceNumber: p.invoice?.invoice_number || "-",
                        customerName: p.invoice?.customer?.customer_name || "Pelanggan Umum",
                        amount: p.amount,
                        method: p.method,
                        notes: p.notes || "-"
                    }))
                }
            }
        }
    } catch (error: any) {
        console.error("Error generating monthly management report:", error)
        return {
            authorized: false,
            error: "Gagal memproses Laporan Bulanan Manajemen: " + error.message
        }
    }
}
