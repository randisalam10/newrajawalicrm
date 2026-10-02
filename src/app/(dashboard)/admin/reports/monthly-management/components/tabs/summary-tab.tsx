"use client"

import React, { useState } from "react"
import {
    ScorecardData,
    UnitEconomicsData,
    MomComparisonData,
    ReportAlert,
    DrilldownData,
} from "../../types"
import { SectionBItemType } from "../drilldowns/section-b-drilldown"
import { ExecutiveScorecard } from "../summary/executive-scorecard"
import { CashflowSection } from "../summary/cashflow-section"
import { UnitEconomicsTable } from "../summary/unit-economics-table"
import { MomAlertsSection } from "../summary/mom-alerts-section"
import { PrintSignatureBlock } from "../summary/print-signature-block"

interface SummaryTabProps {
    scorecard: ScorecardData
    unitEconomics: UnitEconomicsData
    momComparison: MomComparisonData
    alerts: ReportAlert[]
    drilldown: DrilldownData
    selectedPeriodLabel: string
    prevPeriodLabel: string
}

export function SummaryTab({
    scorecard,
    unitEconomics,
    momComparison,
    alerts,
    drilldown,
    selectedPeriodLabel,
    prevPeriodLabel,
}: SummaryTabProps) {
    const [activeSummarySection, setActiveSummarySection] = useState<"all" | "A" | "B" | "C" | "D">("all")
    const [activeSectionAItem, setActiveSectionAItem] = useState<"all" | "readymix" | "rental" | "aggregate">("all")
    const [activeSectionBItem, setActiveSectionBItem] = useState<SectionBItemType>("all")
    const [activeSectionDItem, setActiveSectionDItem] = useState<"all" | "rbl" | "fixed_contract" | "vehicle">("all")
    const [isDrilldownMinimized, setIsDrilldownMinimized] = useState<boolean>(false)

    return (
        <div className="space-y-6">
            {/* 1.1 Executive Performance Scorecard & Managerial Breakdown (Sections A-E) */}
            <ExecutiveScorecard
                scorecard={scorecard}
                unitEconomics={unitEconomics}
                drilldown={drilldown}
                selectedPeriodLabel={selectedPeriodLabel}
                activeSummarySection={activeSummarySection}
                setActiveSummarySection={setActiveSummarySection}
                activeSectionAItem={activeSectionAItem}
                setActiveSectionAItem={setActiveSectionAItem}
                activeSectionBItem={activeSectionBItem}
                setActiveSectionBItem={setActiveSectionBItem}
                activeSectionDItem={activeSectionDItem}
                setActiveSectionDItem={setActiveSectionDItem}
                isDrilldownMinimized={isDrilldownMinimized}
                setIsDrilldownMinimized={setIsDrilldownMinimized}
            />

            {/* 1.2 Realisasi Arus Kas & Penerimaan Pembayaran Beton (Operating Cash Flow) */}
            <CashflowSection scorecard={scorecard} drilldown={drilldown} />

            {/* 1.3 Breakdown Finansial & Biaya Pokok Produksi per 1 m³ */}
            <UnitEconomicsTable unitEconomics={unitEconomics} />

            {/* 1.3 MoM Comparison & 1.4 Critical Alerts */}
            <MomAlertsSection
                momComparison={momComparison}
                alerts={alerts}
                prevPeriodLabel={prevPeriodLabel}
            />

            {/* Kolom Tanda Tangan Cetak Resmi */}
            <PrintSignatureBlock />
        </div>
    )
}
