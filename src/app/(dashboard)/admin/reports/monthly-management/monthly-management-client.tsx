"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MonthlyManagementReportResult } from "./types"
import { ReportHeader } from "./components/report-header"
import { ReportFilterBar } from "./components/report-filter-bar"
import { SummaryTab } from "./components/tabs/summary-tab"
import { MacroTab } from "./components/tabs/macro-tab"
import { DetailTab } from "./components/tabs/detail-tab"

interface MonthlyManagementClientProps {
    initialData: MonthlyManagementReportResult
}

export function MonthlyManagementClient({ initialData }: MonthlyManagementClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState<"summary" | "macro" | "detail">("summary")
    const [selectedMonth, setSelectedMonth] = useState<string>(initialData?.selectedPeriodStr || "2026-09")
    const [selectedLoc, setSelectedLoc] = useState<string>(initialData?.selectedLocId || "all")

    useEffect(() => {
        setMounted(true)
        if (initialData?.selectedLocId) {
            setSelectedLoc(initialData.selectedLocId)
        }
        if (initialData?.selectedPeriodStr) {
            setSelectedMonth(initialData.selectedPeriodStr)
        }
    }, [initialData?.selectedLocId, initialData?.selectedPeriodStr])

    if (!initialData || !initialData.authorized || initialData.error) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200 m-6">
                <h2 className="text-lg font-bold mb-2">Terjadi Kendala Memuat Laporan</h2>
                <p className="text-sm">{initialData?.error || "Akses tidak diizinkan atau data tidak ditemukan."}</p>
            </div>
        )
    }

    const {
        selectedPeriodLabel = "",
        prevPeriodLabel = "",
        availableLocations = [],
        availableMonths = [],
        scorecard = {} as any,
        unitEconomics = {} as any,
        momComparison = {} as any,
        alerts = [],
        branchBenchmark = [],
        mutuDistribution = [],
        topCustomers = [],
        fleetStats = {} as any,
        costComposition = [],
        drilldown = {} as any
    } = initialData || {}

    const handleFilterChange = (newMonth: string, newLoc: string) => {
        setSelectedMonth(newMonth)
        setSelectedLoc(newLoc)
        startTransition(() => {
            router.push(`/admin/reports/monthly-management?month=${newMonth}&locationId=${newLoc}`)
        })
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6 pb-12 print:p-0 print:m-0 print:space-y-4">
            {/* Header (Official Print Letterhead + Screen Title Banner) */}
            <ReportHeader
                selectedPeriodLabel={selectedPeriodLabel}
                onPrint={handlePrint}
            />

            {/* Filter Controls & Navigation Tab Pills */}
            <ReportFilterBar
                selectedMonth={selectedMonth}
                selectedLoc={selectedLoc}
                availableMonths={availableMonths}
                availableLocations={availableLocations}
                isPending={isPending}
                activeTab={activeTab}
                onFilterChange={handleFilterChange}
                onTabChange={setActiveTab}
            />

            {/* Tab 1: Ringkasan Eksekutif */}
            {(!mounted || activeTab === "summary") && (
                <SummaryTab
                    scorecard={scorecard}
                    unitEconomics={unitEconomics}
                    momComparison={momComparison}
                    alerts={alerts}
                    drilldown={drilldown}
                    selectedPeriodLabel={selectedPeriodLabel}
                    prevPeriodLabel={prevPeriodLabel}
                />
            )}

            {/* Tab 2: Gambaran Makro */}
            {(mounted && activeTab === "macro") && (
                <MacroTab
                    branchBenchmark={branchBenchmark}
                    mutuDistribution={mutuDistribution}
                    topCustomers={topCustomers}
                    fleetStats={fleetStats}
                    costComposition={costComposition}
                    selectedPeriodLabel={selectedPeriodLabel}
                />
            )}

            {/* Tab 3: Detail Operasional */}
            {(mounted && activeTab === "detail") && (
                <DetailTab
                    drilldown={drilldown}
                    scorecard={scorecard}
                />
            )}
        </div>
    )
}
