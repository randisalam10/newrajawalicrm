export interface DebtItem {
    id: string
    name: string
    monthly_amount: number
    start_month: string // "YYYY-MM"
    duration_months: number
}

export interface FixedContractSnapshot {
    id: string
    name: string
    category: string
    monthly_amount: number
    start_date: string
    end_date: string
}

export interface ApScheduleBucket {
    period: string // "YYYY-MM"
    monthLabel: string
    amount: number
    count: number
}

export interface HistoricalBaselineData {
    activeLocations: { id: string; name: string }[]
    selectedLocationId: string | null
    currentMonthLabel: string
    currentPeriodStr: string

    // Real-time Balance & Working Capital
    outstandingArTotal: number
    unpaidInvoicesCount: number
    outstandingApTotal: number
    unpaidCreditsCount: number
    
    // Cost Structure Baseline (from database)
    currentMonthlyVolume: number
    currentAsp: number
    currentDirectCogsPerM3: number
    targetVolume: number
    targetAsp: number
    targetCogsPerM3: number

    // Fixed & Obligation Baseline
    monthlyPayrollBase: number
    monthlyFixedContractsTotal: number
    fixedContractsList: FixedContractSnapshot[]
    monthlyRblOpexAverage: number
    apDueSchedule: ApScheduleBucket[]
    
    // Notes on Data Limitations
    dataGapNotes: DataGapNote[]
}

export interface SimulatorScenarioParams {
    scenarioName: "BASE" | "CONSERVATIVE" | "OPTIMISTIC" | "CUSTOM"
    startingCash: number
    minCashBuffer: number
    targetMonthlyVolume: number
    aspPerM3: number
    variableCogsPerM3: number
    dsoDays: number // 15, 30, 45, 60
    dpoDays: number // 15, 30, 45, 60
    payrollGrowthPct: number // 0, 5, 10
    opexGrowthPct: number // 0, 5, 10
    monthlyTaxReserve: number
    customDebts: DebtItem[]
}

export interface MonthlyObligationRow {
    period: string // "YYYY-MM"
    monthLabel: string
    payroll: number
    supplierAp: number
    operationalRbl: number
    amortizationFixed: number
    debt: number
    tax: number
    totalObligation: number
}

export interface RollingForecastRow {
    period: string // "YYYY-MM"
    monthLabel: string
    volume: number
    revenue: number
    cogs: number
    grossProfit: number
    netAccountingProfit: number
    
    // Cash Flow Engine
    openingCash: number
    cashInflow: number
    cashOutflow: number
    netCashFlow: number
    endingCash: number

    // Liquidity & Risk Status
    bufferStatus: "HEALTHY" | "BUFFER_DEFICIT" | "CASH_DEFICIT"
    coveragePct: number
    deficitAmount: number
}

export interface BreakEvenAnalysisResult {
    // Accounting Perspective
    accountingBepVolume: number
    accountingBepRevenue: number
    totalFixedAccountingCost: number

    // Cash Perspective
    cashBepVolume: number
    cashBepRevenue: number
    totalFixedCashObligation: number

    // Margins
    unitContributionMargin: number
    grossMarginPercent: number

    // Horizon Milestones
    cashPositiveMonth: string | null
    breakEvenMonth: string | null
    minimumCashProjected: number
    maximumCashDeficit: number
    cashRunwayMonths: number
    current30DayCoveragePct: number

    // Warning Flags
    isProfitableButDeficit: boolean
    alertType: "HEALTHY" | "DEFICIT_RISK" | "CRITICAL_DEFICIT"
    alertHeadline: string
    alertDescription: string
}

export interface DataGapNote {
    title: string
    currentStatus: string
    impact: string
    simulatorMitigation: string
}
