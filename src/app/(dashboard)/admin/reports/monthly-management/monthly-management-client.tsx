"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Lock, ChevronRight } from "lucide-react"
import { MonthlyManagementReportResult } from "./types"
import { ReportHeader } from "./components/report-header"
import { ReportFilterBar } from "./components/report-filter-bar"
import { SummaryTab } from "./components/tabs/summary-tab"
import { MacroTab } from "./components/tabs/macro-tab"
import { DetailTab } from "./components/tabs/detail-tab"
import { ExecutivePrintDocument } from "./components/print/executive-print-document"

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
        <>
            {/* ── PRINT VIEW: DOKUMEN RESMI EKSEKUTIF MULTI-PAGE (A4) ── */}
            <ExecutivePrintDocument data={initialData} />

            {/* ── SCREEN VIEW: INTERACTIVE DASHBOARD (HIDDEN ON PRINT) ── */}
            <div className="space-y-6 pb-12 print:hidden">
                {/* Header (Screen Title Banner) */}
                <ReportHeader
                    selectedPeriodLabel={selectedPeriodLabel}
                    onPrint={handlePrint}
                />

                {/* Banner Status Tutup Buku (Jika Periode Telah Dikunci Permanen) */}
                {initialData.isClosed && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                        <div className="flex items-start sm:items-center gap-2.5">
                            <div className="p-1.5 bg-emerald-100 rounded-md text-emerald-700 shrink-0 mt-0.5 sm:mt-0">
                                <Lock className="h-4 w-4" />
                            </div>
                            <div>
                                <span className="font-bold text-emerald-800">Periode Ditutup Buku (Final Snapshot):</span>{" "}
                                <span>
                                    Laporan bulan {selectedPeriodLabel} telah dikunci permanen oleh{" "}
                                    <strong>{initialData.closingInfo?.closedByName || "Super Admin"}</strong>
                                    {initialData.closingInfo?.closedAt ? ` pada ${new Date(initialData.closingInfo.closedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}.
                                </span>
                                {initialData.closingInfo?.notes && (
                                    <p className="text-[11px] text-emerald-700 italic mt-0.5">
                                        Catatan: "{initialData.closingInfo.notes}"
                                    </p>
                                )}
                            </div>
                        </div>
                        <Link
                            href="/admin/finance/tutup-buku"
                            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 bg-white px-3 py-1.5 rounded border border-emerald-300 hover:bg-emerald-100 transition-colors shrink-0 self-start sm:self-auto"
                        >
                            <span>Kelola Tutup Buku</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                )}

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
        </>
    )
}

