"use client"

import { useState } from "react"
import { HistoricalBaselineData } from "./types"
import { useSimulatorState } from "./hooks/use-simulator-state"
import { ExecutiveKpiBar } from "./components/sections/executive-kpi-bar"
import { ScenarioControls } from "./components/sections/scenario-controls"
import { ForecastChart } from "./components/sections/forecast-chart"
import { BreakEvenCard } from "./components/sections/breakeven-card"
import { ObligationScheduleTable } from "./components/sections/obligation-schedule-table"
import { DetailedCashflowTable } from "./components/sections/detailed-cashflow-table"
import { MethodologyAndNotes } from "./components/sections/methodology-and-notes"
import { StartingCashModal } from "./components/modals/starting-cash-modal"
import { CustomDebtModal } from "./components/modals/custom-debt-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Landmark } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface CashflowSimulatorClientProps {
    baseline: HistoricalBaselineData
}

export function CashflowSimulatorClient({ baseline }: CashflowSimulatorClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const {
        params,
        updateParam,
        applyPreset,
        addCustomDebt,
        removeCustomDebt,
        resetToDefaults,
        obligations,
        forecast,
        breakEven
    } = useSimulatorState(baseline)

    const [startingCashModalOpen, setStartingCashModalOpen] = useState(false)
    const [debtModalOpen, setDebtModalOpen] = useState(false)

    const handleLocationChange = (locId: string) => {
        const query = new URLSearchParams(searchParams?.toString() || "")
        if (locId === "all") {
            query.delete("locationId")
        } else {
            query.set("locationId", locId)
        }
        router.push(`?${query.toString()}`)
    }

    return (
        <div className="space-y-5 w-full pb-10">
            {/* ── HEADER MODUL & SCOPING CABANG ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                        <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-slate-900 tracking-tight">
                            Financial Break-Even &amp; Cashflow Simulator
                        </h1>
                        <p className="text-xs text-slate-500">
                            Evaluasi Likuiditas, Titik Impas Kas Riil, dan Proyeksi 12 Bulan PT Rajawali Perkasa Jaya
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <span className="text-xs font-semibold text-slate-500 shrink-0">Cabang Operasional:</span>
                    <Select
                        value={baseline.selectedLocationId || "all"}
                        onValueChange={handleLocationChange}
                    >
                        <SelectTrigger className="h-8 text-xs w-[200px] bg-slate-50">
                            <SelectValue placeholder="Pilih Cabang" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Cabang (Konsolidasi)</SelectItem>
                            {baseline.activeLocations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>
                                    {loc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ── SEKSI 1: EXECUTIVE KPI & DEFICIT WARNING ── */}
            <ExecutiveKpiBar
                baseline={baseline}
                params={params}
                breakEven={breakEven}
                onOpenStartingCashModal={() => setStartingCashModalOpen(true)}
            />

            {/* ── SEKSI 2: KONTROL PARAMETER WHAT-IF SLIDERS ── */}
            <ScenarioControls
                params={params}
                onUpdateParam={updateParam}
                onApplyPreset={applyPreset}
                onReset={resetToDefaults}
            />

            {/* ── SEKSI 3: TITIK IMPAS AKRUAL VS CASH BREAK-EVEN ── */}
            <BreakEvenCard
                breakEven={breakEven}
                params={params}
            />

            {/* ── SEKSI 4: GRAFIK PROYEKSI ARUS KAS 12 BULAN ── */}
            <ForecastChart
                forecast={forecast}
                params={params}
            />

            {/* ── SEKSI 5: JADWAL KEWAJIBAN BULANAN (OBLIGATION SCHEDULE) ── */}
            <ObligationScheduleTable
                obligations={obligations}
                params={params}
                onOpenDebtModal={() => setDebtModalOpen(true)}
            />

            {/* ── SEKSI 6: KOMPARASI LENGKAP P&L AKRUAL VS ARUS KAS RIIL ── */}
            <DetailedCashflowTable
                forecast={forecast}
            />

            {/* ── SEKSI 7: TRANSPARANSI METODOLOGI & KETERBATASAN DATA (GAP DISCLOSURE) ── */}
            <MethodologyAndNotes
                dataGapNotes={baseline.dataGapNotes}
            />

            {/* ── MODALS ── */}
            <StartingCashModal
                open={startingCashModalOpen}
                onOpenChange={setStartingCashModalOpen}
                startingCash={params.startingCash}
                minBuffer={params.minCashBuffer}
                onSave={(cash, buffer) => {
                    updateParam("startingCash", cash)
                    updateParam("minCashBuffer", buffer)
                }}
            />

            <CustomDebtModal
                open={debtModalOpen}
                onOpenChange={setDebtModalOpen}
                debts={params.customDebts}
                currentPeriodStr={baseline.currentPeriodStr}
                onAddDebt={addCustomDebt}
                onRemoveDebt={removeCustomDebt}
            />
        </div>
    )
}
