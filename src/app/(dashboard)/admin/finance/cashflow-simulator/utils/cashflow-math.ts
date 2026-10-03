import {
    SimulatorScenarioParams,
    HistoricalBaselineData,
    MonthlyObligationRow,
    RollingForecastRow,
    BreakEvenAnalysisResult
} from "../types"
import { addMonths, format, parse } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export function formatRupiah(value: number): string {
    const safeVal = Math.round(value ?? 0)
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(safeVal)
}

export function formatNumber(value: number, decimals: number = 0): string {
    const safeVal = value ?? 0
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(safeVal)
}

export function calculateObligationSchedule(
    baseline: HistoricalBaselineData,
    params: SimulatorScenarioParams,
    monthsCount: number = 12
): MonthlyObligationRow[] {
    const startDate = parse(baseline.currentPeriodStr, "yyyy-MM", new Date())
    const rows: MonthlyObligationRow[] = []

    const payrollFactor = 1 + ((params.payrollGrowthPct ?? 0) / 100)
    const opexFactor = 1 + ((params.opexGrowthPct ?? 0) / 100)

    const basePayroll = (baseline.monthlyPayrollBase ?? 0) * payrollFactor
    const baseOpex = (baseline.monthlyRblOpexAverage ?? 0) * opexFactor
    const fixedAmortization = baseline.monthlyFixedContractsTotal ?? 0
    const taxReserve = params.monthlyTaxReserve ?? 0

    // Map AP due schedule from database
    const apMap = new Map<string, number>()
    baseline.apDueSchedule.forEach(item => {
        apMap.set(item.period, item.amount)
    })

    // Fallback: If AP due dates are clustered or 0 in future months, distribute remaining AP
    const totalKnownAp = baseline.outstandingApTotal ?? 0
    const scheduledApSum = baseline.apDueSchedule.reduce((sum, item) => sum + item.amount, 0)
    const unallocatedAp = Math.max(0, totalKnownAp - scheduledApSum)
    const extraApPerMonth = unallocatedAp > 0 ? Math.round(unallocatedAp / 4) : 0

    for (let i = 0; i < monthsCount; i++) {
        const currentDate = addMonths(startDate, i)
        const period = format(currentDate, "yyyy-MM")
        const monthLabel = format(currentDate, "MMM yyyy", { locale: idLocale })

        // AP from DB for this period + spread of unallocated AP in first 4 months
        let monthAp = apMap.get(period) ?? 0
        if (i < 4 && extraApPerMonth > 0) {
            monthAp += extraApPerMonth
        }

        // Custom debts active in this month
        let monthDebt = 0
        params.customDebts.forEach(debt => {
            const debtStart = parse(debt.start_month, "yyyy-MM", new Date())
            const debtEnd = addMonths(debtStart, debt.duration_months)
            if (currentDate >= debtStart && currentDate < debtEnd) {
                monthDebt += debt.monthly_amount
            }
        })

        const totalObligation = basePayroll + monthAp + baseOpex + fixedAmortization + monthDebt + taxReserve

        rows.push({
            period,
            monthLabel,
            payroll: basePayroll,
            supplierAp: monthAp,
            operationalRbl: baseOpex,
            amortizationFixed: fixedAmortization,
            debt: monthDebt,
            tax: taxReserve,
            totalObligation
        })
    }

    return rows
}

export function generateRollingForecast(
    baseline: HistoricalBaselineData,
    params: SimulatorScenarioParams,
    obligations: MonthlyObligationRow[]
): RollingForecastRow[] {
    const rows: RollingForecastRow[] = []
    let currentCash = params.startingCash ?? 0

    const volume = params.targetMonthlyVolume ?? 0
    const asp = params.aspPerM3 ?? 0
    const varCogs = params.variableCogsPerM3 ?? 0

    const monthlyRevenue = volume * asp
    const monthlyCogs = volume * varCogs
    const monthlyGrossProfit = monthlyRevenue - monthlyCogs

    // Distribute existing AR based on DSO
    const existingAr = baseline.outstandingArTotal ?? 0
    const arInflowMonth1 = existingAr * 0.55
    const arInflowMonth2 = existingAr * 0.30
    const arInflowMonth3 = existingAr * 0.15

    for (let i = 0; i < obligations.length; i++) {
        const ob = obligations[i]
        const openingCash = currentCash

        // Accounting View
        const netAccountingProfit = monthlyGrossProfit - ob.operationalRbl - ob.amortizationFixed - ob.payroll

        // Cash View: Collection from new revenue
        let newRevCollection = 0
        if (params.dsoDays <= 15) {
            newRevCollection = monthlyRevenue * 0.85
        } else if (params.dsoDays <= 30) {
            newRevCollection = i === 0 ? monthlyRevenue * 0.40 : monthlyRevenue * 0.85
        } else if (params.dsoDays <= 45) {
            newRevCollection = i === 0 ? monthlyRevenue * 0.25 : (i === 1 ? monthlyRevenue * 0.65 : monthlyRevenue * 0.90)
        } else {
            newRevCollection = i < 2 ? monthlyRevenue * 0.20 : monthlyRevenue * 0.85
        }

        // Additional collection from historical AR in first 3 months
        let historicalArInflow = 0
        if (i === 0) historicalArInflow = arInflowMonth1
        else if (i === 1) historicalArInflow = arInflowMonth2
        else if (i === 2) historicalArInflow = arInflowMonth3

        const cashInflow = newRevCollection + historicalArInflow
        const cashOutflow = ob.totalObligation
        const netCashFlow = cashInflow - cashOutflow
        const endingCash = openingCash + netCashFlow
        currentCash = endingCash

        const minBuffer = params.minCashBuffer ?? 0
        let bufferStatus: "HEALTHY" | "BUFFER_DEFICIT" | "CASH_DEFICIT" = "HEALTHY"
        let deficitAmount = 0

        if (endingCash < 0) {
            bufferStatus = "CASH_DEFICIT"
            deficitAmount = Math.abs(endingCash)
        } else if (endingCash < minBuffer) {
            bufferStatus = "BUFFER_DEFICIT"
            deficitAmount = minBuffer - endingCash
        }

        const coveragePct = cashOutflow > 0 ? (cashInflow / cashOutflow) * 100 : 100

        rows.push({
            period: ob.period,
            monthLabel: ob.monthLabel,
            volume,
            revenue: monthlyRevenue,
            cogs: monthlyCogs,
            grossProfit: monthlyGrossProfit,
            netAccountingProfit,
            openingCash,
            cashInflow,
            cashOutflow,
            netCashFlow,
            endingCash,
            bufferStatus,
            coveragePct,
            deficitAmount
        })
    }

    return rows
}

export function calculateBreakEvenMetrics(
    baseline: HistoricalBaselineData,
    params: SimulatorScenarioParams,
    forecast: RollingForecastRow[],
    obligations: MonthlyObligationRow[]
): BreakEvenAnalysisResult {
    const asp = params.aspPerM3 ?? 0
    const varCogs = params.variableCogsPerM3 ?? 0
    const unitCm = Math.max(0, asp - varCogs)
    const grossMarginPercent = asp > 0 ? (unitCm / asp) * 100 : 0

    const month1Ob = obligations[0] || {
        payroll: baseline.monthlyPayrollBase,
        operationalRbl: baseline.monthlyRblOpexAverage,
        amortizationFixed: baseline.monthlyFixedContractsTotal,
        totalObligation: 300000000
    }

    // Fixed Accounting Costs (Overhead + Amortization + Gaji)
    const totalFixedAccountingCost = month1Ob.payroll + month1Ob.operationalRbl + month1Ob.amortizationFixed

    // Fixed Cash Obligations (Payroll + AP + Opex + Debt + Tax)
    const totalFixedCashObligation = month1Ob.totalObligation

    // BEP Calculations
    const accountingBepVolume = unitCm > 0 ? Math.ceil(totalFixedAccountingCost / unitCm) : 0
    const accountingBepRevenue = accountingBepVolume * asp

    const cashBepVolume = unitCm > 0 ? Math.ceil(totalFixedCashObligation / unitCm) : 0
    const cashBepRevenue = cashBepVolume * asp

    // Find Milestones
    let cashPositiveMonth: string | null = null
    let breakEvenMonth: string | null = null
    let minCash = params.startingCash ?? 0
    let maxDeficit = 0

    let cumProfit = 0
    forecast.forEach(row => {
        cumProfit += row.netAccountingProfit
        if (!breakEvenMonth && cumProfit >= 0) {
            breakEvenMonth = row.monthLabel
        }
        if (!cashPositiveMonth && row.endingCash >= params.minCashBuffer && row.netCashFlow >= 0) {
            cashPositiveMonth = row.monthLabel
        }
        if (row.endingCash < minCash) {
            minCash = row.endingCash
        }
        if (row.endingCash < 0 && Math.abs(row.endingCash) > maxDeficit) {
            maxDeficit = Math.abs(row.endingCash)
        }
    })

    // Current 30-Day Liquidity Coverage
    const firstMonthOutflow = forecast[0]?.cashOutflow ?? 1
    const availableCash = params.startingCash ?? 0
    const current30DayCoveragePct = firstMonthOutflow > 0
        ? Number(((availableCash / firstMonthOutflow) * 100).toFixed(1))
        : 100

    // Cash Runway
    const firstMonthBurn = forecast[0]?.netCashFlow < 0 ? Math.abs(forecast[0].netCashFlow) : 0
    const cashRunwayMonths = firstMonthBurn > 0
        ? Number((availableCash / firstMonthBurn).toFixed(1))
        : 12

    // Deficit Detection Logic
    const isProfitableButDeficit = (forecast[0]?.netAccountingProfit > 0) && (forecast[0]?.endingCash < params.minCashBuffer)

    let alertType: "HEALTHY" | "DEFICIT_RISK" | "CRITICAL_DEFICIT" = "HEALTHY"
    let alertHeadline = "Likuiditas Kas Aman"
    let alertDescription = "Kas operasional diproyeksikan mencukupi seluruh kewajiban bulanan dan berada di atas batas buffer."

    if (maxDeficit > 0 || forecast[0]?.endingCash < 0) {
        alertType = "CRITICAL_DEFICIT"
        alertHeadline = "PERINGATAN: RISIKO DEFISIT KAS RIIL"
        alertDescription = `Perusahaan diproyeksikan mengalami defisit kas hingga ${formatRupiah(maxDeficit)}. Kewajiban jatuh tempo melampaui kas masuk nyata.`
    } else if (isProfitableButDeficit) {
        alertType = "DEFICIT_RISK"
        alertHeadline = "PROFITABLE — BUT CASH DEFICIT RISK"
        alertDescription = `Laporan P&L membukukan laba bersih ${formatRupiah(forecast[0]?.netAccountingProfit)}, tetapi saldo kas berada di bawah batas aman ${formatRupiah(params.minCashBuffer)} karena penagihan piutang belum masuk.`
    }

    return {
        accountingBepVolume,
        accountingBepRevenue,
        totalFixedAccountingCost,
        cashBepVolume,
        cashBepRevenue,
        totalFixedCashObligation,
        unitContributionMargin: unitCm,
        grossMarginPercent,
        cashPositiveMonth,
        breakEvenMonth,
        minimumCashProjected: minCash,
        maximumCashDeficit: maxDeficit,
        cashRunwayMonths,
        current30DayCoveragePct,
        isProfitableButDeficit,
        alertType,
        alertHeadline,
        alertDescription
    }
}
