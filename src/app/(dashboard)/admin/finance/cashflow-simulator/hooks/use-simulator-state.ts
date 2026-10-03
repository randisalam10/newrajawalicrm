"use client"

import { useState, useMemo, useCallback } from "react"
import {
    HistoricalBaselineData,
    SimulatorScenarioParams,
    DebtItem
} from "../types"
import {
    calculateObligationSchedule,
    generateRollingForecast,
    calculateBreakEvenMetrics
} from "../utils/cashflow-math"

export function useSimulatorState(baseline: HistoricalBaselineData) {
    const defaultParams: SimulatorScenarioParams = useMemo(() => ({
        scenarioName: "BASE",
        startingCash: 250000000, // Default 250 Jt
        minCashBuffer: 100000000, // Default 100 Jt
        targetMonthlyVolume: baseline.currentMonthlyVolume || baseline.targetVolume || 550,
        aspPerM3: baseline.currentAsp || baseline.targetAsp || 2000000,
        variableCogsPerM3: baseline.currentDirectCogsPerM3 || baseline.targetCogsPerM3 || 630000,
        dsoDays: 30,
        dpoDays: 30,
        payrollGrowthPct: 0,
        opexGrowthPct: 0,
        monthlyTaxReserve: 10000000,
        customDebts: [
            {
                id: "debt-leasing-1",
                name: "Leasing Dump Truck & Mixer",
                monthly_amount: 25000000,
                start_month: baseline.currentPeriodStr,
                duration_months: 12
            }
        ]
    }), [baseline])

    const [params, setParams] = useState<SimulatorScenarioParams>(defaultParams)

    const updateParam = useCallback(<K extends keyof SimulatorScenarioParams>(
        key: K,
        val: SimulatorScenarioParams[K]
    ) => {
        setParams(prev => ({
            ...prev,
            scenarioName: "CUSTOM",
            [key]: val
        }))
    }, [])

    const applyPreset = useCallback((preset: "BASE" | "CONSERVATIVE" | "OPTIMISTIC") => {
        const baseVol = baseline.currentMonthlyVolume || 550
        const baseAsp = baseline.currentAsp || 2000000
        const baseCogs = baseline.currentDirectCogsPerM3 || 630000

        if (preset === "BASE") {
            setParams({
                ...defaultParams,
                scenarioName: "BASE"
            })
        } else if (preset === "CONSERVATIVE") {
            setParams(prev => ({
                ...prev,
                scenarioName: "CONSERVATIVE",
                targetMonthlyVolume: Math.round(baseVol * 0.8), // -20% volume
                aspPerM3: Math.round(baseAsp * 0.95), // -5% ASP
                variableCogsPerM3: Math.round(baseCogs * 1.05), // +5% biaya bahan
                dsoDays: 60, // Penagihan lambat 60 hari
                payrollGrowthPct: 5,
                opexGrowthPct: 5
            }))
        } else if (preset === "OPTIMISTIC") {
            setParams(prev => ({
                ...prev,
                scenarioName: "OPTIMISTIC",
                targetMonthlyVolume: Math.round(baseVol * 1.25), // +25% volume
                aspPerM3: Math.round(baseAsp * 1.03),
                variableCogsPerM3: baseCogs,
                dsoDays: 15, // Penagihan cepat 15 hari
                payrollGrowthPct: 0,
                opexGrowthPct: 0
            }))
        }
    }, [baseline, defaultParams])

    const addCustomDebt = useCallback((debt: Omit<DebtItem, "id">) => {
        const newDebt: DebtItem = {
            ...debt,
            id: `debt-${Date.now()}`
        }
        setParams(prev => ({
            ...prev,
            scenarioName: "CUSTOM",
            customDebts: [...prev.customDebts, newDebt]
        }))
    }, [])

    const removeCustomDebt = useCallback((id: string) => {
        setParams(prev => ({
            ...prev,
            scenarioName: "CUSTOM",
            customDebts: prev.customDebts.filter(d => d.id !== id)
        }))
    }, [])

    const resetToDefaults = useCallback(() => {
        setParams(defaultParams)
    }, [defaultParams])

    // Reactive calculations
    const obligations = useMemo(() => {
        return calculateObligationSchedule(baseline, params, 12)
    }, [baseline, params])

    const forecast = useMemo(() => {
        return generateRollingForecast(baseline, params, obligations)
    }, [baseline, params, obligations])

    const breakEven = useMemo(() => {
        return calculateBreakEvenMetrics(baseline, params, forecast, obligations)
    }, [baseline, params, forecast, obligations])

    return {
        params,
        updateParam,
        applyPreset,
        addCustomDebt,
        removeCustomDebt,
        resetToDefaults,
        obligations,
        forecast,
        breakEven
    }
}
