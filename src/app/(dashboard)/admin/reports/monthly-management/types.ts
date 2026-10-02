export interface MonthlyReportFilters {
    month?: string      // "YYYY-MM", e.g. "2026-09"
    locationId?: string  // "all" or specific uuid
}

export interface ScorecardData {
    productionVolumeM3: number
    productionTargetM3: number
    achievementPct: number

    // DPP Revenue
    readymixRevenue: number
    rentalRevenue: number
    aggregateRevenue: number
    totalDppRevenue: number

    // Tax Liability (PPN Keluaran 11%)
    readymixPpn: number
    rentalPpn: number
    aggregatePpn: number
    totalTaxLiability: number

    // Gross Revenue (DPP + PPN)
    readymixGross: number
    rentalGross: number
    aggregateGross: number
    totalGrossRevenue: number

    // Direct COGS
    materialCost: number
    semenCost: number
    pasirCost: number
    splitCost: number
    split12Cost?: number // Batu Split 1-2 (B12)
    split23Cost?: number // Batu Split 2-3 (B23)
    ciping05Cost?: number // Ciping 0-5
    aggregateCost: number // Pasir + Split (Quarry/Plant)
    totalCementPoCost: number // PO Semen khusus BP
    fuelCost: number // RBL Kas BBM Solar
    retaseCost: number // Upah retase supir mixer & DT
    maintenanceCost: number // Total Pemeliharaan (PO + RBL)
    maintenancePoCost: number // PO Sparepart BP
    maintenanceRblCost: number // RBL Kas Bengkel / Servis Rutin
    totalPoBpCost: number // Total pengadaan via PO BP (Semen + Sparepart)
    totalRblDirectCost: number // Total biaya langsung via RBL Kas (Solar + Bengkel)
    manualDirectCost?: number // Biaya Pokok Langsung Lainnya (Input Manual via Master Biaya)
    totalDirectCost: number
    unitDirectCostPerM3: number
    unitASP?: number

    // Gross Profit & Margin
    grossProfit: number
    grossMarginPercent: number

    // RBL Branch Operating Cash
    rblOpex: number // Beban Kas Cabang Murni (Overhead non-COGS)
    rblTotalDisbursement?: number // Total Realisasi Kas Keluar Fisik RBL
    rblBbmDirect?: number // Alokasi Kas RBL ke BBM Solar (Seksi B)
    rblMaintenanceDirect?: number // Alokasi Kas RBL ke Bengkel (Seksi B)
    rblPlafon: number
    sisaKasRbl: number

    // Fixed Contracts & Amortization
    totalFixedContractMonthly: number
    sewaTanahMonthly: number
    sewaMessMonthly: number
    gajiMonthly: number
    perizinanMonthly: number
    asuransiRetribusiMonthly: number
    vehicleTaxMonthly: number
    vehicleKirMonthly: number
    totalVehicleComplianceMonthly: number
    totalAmortizationMonthly: number

    // Net Field Contribution
    netFieldContribution: number
    fieldContributionMarginPercent: number

    // Realisasi Kas & Arus Kas Pembayaran Pelanggan
    cashflow: {
        totalPaymentReceived: number
        paymentCount: number
        totalDepositReceived: number
        totalCashInflow: number
        totalCashOutflow: number
        netOperatingCashflow: number
        cashCollectionRate: number
    }
}

export interface UnitEconomicsTargets {
    asp: number
    semen: number
    pasir: number
    split: number
    solar: number
    retase: number
    maintenance: number
    other: number
    cogs: number
    grossProfit: number
    labelAsp?: string | null
    labelSemen?: string | null
    labelPasir?: string | null
    labelSplit?: string | null
    labelSolar?: string | null
    labelRetase?: string | null
    labelMaintenance?: string | null
    labelOther?: string | null
    labelCogs?: string | null
    labelGrossProfit?: string | null
}

export interface UnitEconomicsData {
    aspPerM3: number
    semenPerM3: number
    pasirPerM3: number
    splitPerM3: number
    materialPerM3: number
    solarPerM3: number
    retasePerM3: number
    maintenancePerM3: number
    manualDirectPerM3?: number
    cogsPerM3: number
    grossProfitPerM3: number
    targets?: UnitEconomicsTargets
}

export interface MomMetric {
    current: number
    prev: number
    growthPct?: number
    diffPct?: number
}

export interface MomComparisonData {
    volume: MomMetric
    revenue: MomMetric
    asp: MomMetric
    cogs: MomMetric
    grossProfitPerM3: {
        current: number
        prev: number
    }
    grossMarginPct: {
        current: number
        prev: number
        diffPct: number
    }
    fuelRatioPct: {
        current: number
        prev: number
    }
}

export interface ReportAlert {
    type: "danger" | "warning" | "info" | "success"
    title: string
    message: string
}

export interface BranchBenchmarkItem {
    id: string
    name: string
    volume: number
    target: number
    achievementPct: number
    revenue: number
    asp: number
    cogsPerM3: number
    grossMarginPct: number
    trips: number
}

export interface MutuDistributionItem {
    name: string
    volume: number
    revenue: number
    trips: number
    sharePct: number
    asp: number
}

export interface TopCustomerItem {
    customerName: string
    projectName: string
    volume: number
    revenue: number
    trips: number
    billingStatus: string
    sharePct: number
}

export interface FleetStatsData {
    activeMixerCount: number
    totalTrips: number
    tripsPerMixerAvg: number
    loadPerTripAvg: number
    capacityUtilizationPct: number
}

export interface CostCompositionItem {
    name: string
    value: number
    pct: number
}

export interface DriverRetaseItem {
    name: string
    trips: number
    volume: number
    totalVolume: number
    avgLoad: number
    retase: number
    commission: number
    rank?: number
}

export interface DrilldownData {
    maintenanceDetail: {
        fromPo: Array<{
            id: string
            po_number: string
            po_id: string
            tanggal: string
            item_name: string
            satuan: string
            quantity: number
            harga_satuan: number
            subtotal: number
            keterangan: string
            lokasi: string
            kendaraan: string
            km_hm: string
            status: string
        }>
        fromRbl: Array<{
            id: string
            tanggal: string
            kategori: string
            deskripsi: string
            amount: number
            lokasi: string
        }>
        totalFromPo: number
        totalFromRbl: number
        total: number
    }
    fuelDetail: {
        total: number
        totalLitres: number
        items: Array<{
            id: string
            tanggal: string
            deskripsi: string
            liter: number
            harga_satuan: number
            amount: number
            kendaraan: string
            km_hm: string
            lokasi: string
        }>
    }
    retaseDetail: {
        total: number
        mixerRetaseTotal: number
        dtRetaseTotal: number
        mixerCount: number
        topDrivers: DriverRetaseItem[]
    }
    materialDetail: {
        total: number
        semen: {
            totalCost: number
            avgPricePerKg: number
            totalInKg: number
            consumedKg: number
            diffKg: number
            totalPoKg: number
            totalPoVal: number
            totalIncomingVal: number
        }
        pasir: {
            totalCost: number
            avgPricePerM3: number
            totalInM3: number
            consumedM3: number
            diffM3: number
            totalIncomingVal: number
        }
        split: {
            totalCost: number
            avgPricePerM3: number
            totalInM3: number
            consumedM3: number
            diffM3: number
            totalIncomingVal: number
        }
        reconciliation?: {
            totalProcuredVal: number
            totalConsumedVal: number
            totalDiffVal: number
        }
        incomings: Array<{
            id: string
            date: string
            name: string
            supplier: string
            tonnage: number
            unit_price: number
            total_price: number
            delivery_note?: string | null
        }>
        cementPoItems: Array<{
            id: string
            po_number: string
            tanggal: string
            item_name: string
            quantity: number
            satuan: string
            harga_satuan: number
            subtotal: number
            lokasi: string
            companyGroup?: string
            status: string
        }>
    }
    readymixDetail: {
        totalVolume: number
        totalDpp: number
        totalPpn: number
        totalGross: number
        ticketCount: number
        asp: number
        groupedSales?: Array<{
            key: string
            customerId: string
            customer: string
            projectId: string
            project: string
            qualityId: string
            quality: string
            dateRange?: string
            firstDate?: string
            lastDate?: string
            tripsCount: number
            volume: number
            unitPrice: number
            dppTotal: number
            ppnTotal: number
            grossTotal: number
            ppnMode: string
        }>
    }
    rentalDetail: {
        totalDpp: number
        totalPpn: number
        totalGross: number
        count: number
        items: Array<{
            id: string
            sewa_number: string
            date: string
            customer: string
            equipment: string
            operator: string
            days: number
            rate: number
            ppn_mode: string
            total_price: number
            dpp: number
            ppn: number
            status: string
            lokasi: string
        }>
    }
    aggregateSalesDetail: {
        totalRevenue: number
        count: number
        items: Array<{
            id: string
            date: string
            aggregate_type: string
            volume_cubic: number
            unit_price: number
            total_price: number
            recipient: string
            vehicle: string
        }>
    }
    rblOpexDetail: {
        totalBudget: number
        totalRealized: number
        sisaKas: number
        categories: Array<{
            name: string
            count: number
            total: number
            notes: string
        }>
        recentExpenses: Array<{
            id: string
            tanggal: string
            kategori: string
            deskripsi: string
            amount: number
            cabang: string
        }>
    }
    fixedCostContracts: Array<{
        id: string
        name: string
        category: string
        location: string
        vendor: string
        contractNumber: string
        totalAmount: number
        durationMonths: number
        monthlyAmount: number
        startDate: string
        endDate: string
        status: string
    }>
    manualDirectCostItems?: Array<{
        id: string
        name: string
        category: string
        location: string
        vendor: string
        contractNumber: string
        totalAmount: number
        durationMonths: number
        monthlyAmount: number
        startDate: string
        endDate: string
        status: string
        notes?: string | null
    }>
    vehicleCompliance: Array<{
        id: string
        code: string
        plate: string
        category: string
        annualTax: number
        monthlyTax: number
        taxExpiry: string
        taxSource: string
        kirCost: number
        kirPeriodMonths: number
        monthlyKir: number
        kirExpiry: string
        kirSource: string
        totalMonthly: number
        hasHistory: boolean
    }>
    recentTickets: Array<{
        id: string
        date: string
        project: string
        customer: string
        quality: string
        volume: number
        plate: string
        driver: string
        price: number
        total: number
        status: string
    }>
    groupedSales?: Array<{
        key: string
        customerId: string
        customer: string
        projectId: string
        project: string
        qualityId: string
        quality: string
        dateRange?: string
        firstDate?: string
        lastDate?: string
        tripsCount: number
        volume: number
        unitPrice: number
        dppTotal: number
        ppnTotal: number
        grossTotal: number
        ppnMode: string
    }>
    cementIncomings: any[]
    aggregateIncomings: Array<{
        id: string
        date: string
        no_bon: string
        driver_name: string
        plate_number: string
        volume_cubic: number
        aggregate_type: string
        source_type: string
        supplier: string
        notes: string
        location: string
        unit_price: number
        total_price: number
    }>
    totalSemenMasukKg: number
    totalPasirMasukM3: number
    totalSplitMasukM3: number
    sewaList: any[]
    rblCategories: any[]
    poList: Array<{
        id: string
        po_number: string
        date: string
        category: string
        supplier: string
        amount: number
        status: string
        approvalChannel?: string | null
    }>
    topDrivers: DriverRetaseItem[]
    billing: {
        invoicedCount: number
        totalInvoiced: number
        unbilledCount: number
        unbilledVolume: number
        unbilledEstimatedValue: number
        arAging: {
            current: number
            ar31to60: number
            arOver60: number
            totalOutstanding: number
        }
        depositCount: number
        totalDepositAmount: number
        recentPayments: Array<{
            id: string
            date: string
            createdAt?: string | null
            invoiceNumber: string
            customerName: string
            amount: number
            method: string
            notes: string
        }>
    }
}

export interface MonthlyManagementReportResult {
    authorized: boolean
    error?: string
    selectedPeriodStr?: string
    selectedPeriodLabel?: string
    prevPeriodLabel?: string
    selectedLocId?: string
    activeLocationName?: string
    availableLocations?: Array<{ id: string; name: string }>
    availableMonths?: string[]
    scorecard?: ScorecardData
    unitEconomics?: UnitEconomicsData
    momComparison?: MomComparisonData
    alerts?: ReportAlert[]
    branchBenchmark?: BranchBenchmarkItem[]
    mutuDistribution?: MutuDistributionItem[]
    topCustomers?: TopCustomerItem[]
    fleetStats?: FleetStatsData
    costComposition?: CostCompositionItem[]
    drilldown?: DrilldownData
}
