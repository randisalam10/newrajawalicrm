"use client"

import React from "react"
import { useBillingDashboardMetrics } from "./hooks/use-billing-dashboard-metrics"
import { BranchOperationalDashboard } from "./components/dashboard/branch-operational-dashboard"
import { ExecutiveKpiSummary } from "./components/dashboard/executive-kpi-summary"
import { RevenueAndTaxAnalysis } from "./components/dashboard/revenue-and-tax-analysis"
import { AgingAndOverdueAnalysis } from "./components/dashboard/aging-and-overdue-analysis"
import { CustomerExposureAndBranch } from "./components/dashboard/customer-exposure-and-branch"

interface BillingDashboardProps {
    unbilled: any[]
    groupedInvoices: any[]
    deposits: any[]
    locations: any[]
    selectedLocation: string
    onNavigateTab: (tab: string, filter?: any) => void
    isCorporate?: boolean
    isSuperAdmin?: boolean
}

export function BillingDashboard({
    unbilled = [],
    groupedInvoices = [],
    deposits = [],
    locations = [],
    selectedLocation = "all",
    onNavigateTab,
    isCorporate = false,
    isSuperAdmin = false,
}: BillingDashboardProps) {
    const metrics = useBillingDashboardMetrics({
        unbilled,
        groupedInvoices,
        deposits,
        locations,
        selectedLocation,
    })

    // ─── ADMIN OPERATIONAL DASHBOARD (Non-SuperAdmin: Cabang & Lapangan) ───────
    if (!isSuperAdmin) {
        return (
            <BranchOperationalDashboard
                activeLocName={metrics.activeLocName}
                unbilledBreakdown={metrics.unbilledBreakdown}
                allInvoices={metrics.allInvoices}
                statusCounts={metrics.statusCounts}
                overdueInvoices={metrics.overdueInvoices}
                unbilledByCustomer={metrics.unbilledByCustomer}
                onNavigateTab={onNavigateTab}
            />
        )
    }

    // ─── SUPERADMIN EXECUTIVE FINANCIAL DASHBOARD ──────────────────────────────
    return (
        <div className="space-y-4 pt-1">
            {/* 1. Consolidated Business Potential & 5 Core KPI Summary */}
            <ExecutiveKpiSummary
                consolidatedAll={metrics.consolidatedAll}
                revenueBreakdown={metrics.revenueBreakdown}
                unbilledBreakdown={metrics.unbilledBreakdown}
                totalInvoiced={metrics.totalInvoiced}
                totalPaid={metrics.totalPaid}
                totalOutstanding={metrics.totalOutstanding}
                collectionRate={metrics.collectionRate}
                ppnBreakdown={metrics.ppnBreakdown}
                activeInvoices={metrics.activeInvoices}
                activeLocName={metrics.activeLocName}
                totalDeposits={metrics.totalDeposits}
                deposits={deposits}
                onNavigateTab={onNavigateTab}
            />

            {/* 2. Composition: ReadyMix vs Sewa & PPN Tax Monitoring */}
            <RevenueAndTaxAnalysis
                revenueBreakdown={metrics.revenueBreakdown}
                ppnBreakdown={metrics.ppnBreakdown}
                unbilledBreakdown={metrics.unbilledBreakdown}
                totalInvoiced={metrics.totalInvoiced}
                onNavigateTab={onNavigateTab}
            />

            {/* 3. A/R Aging Analysis & Status Distribution */}
            <AgingAndOverdueAnalysis
                overdueInvoices={metrics.overdueInvoices}
                totalOverdueAmount={metrics.totalOverdueAmount}
                totalOutstanding={metrics.totalOutstanding}
                aging={metrics.aging}
                statusCounts={metrics.statusCounts}
                allInvoices={metrics.allInvoices}
                onNavigateTab={onNavigateTab}
            />

            {/* 4. Top Debtors, Customer Unbilled Pipeline, & Branch Breakdown */}
            <CustomerExposureAndBranch
                topDebtors={metrics.topDebtors}
                totalOutstanding={metrics.totalOutstanding}
                unbilledByCustomer={metrics.unbilledByCustomer}
                branchBreakdown={metrics.branchBreakdown}
                onNavigateTab={onNavigateTab}
            />
        </div>
    )
}
