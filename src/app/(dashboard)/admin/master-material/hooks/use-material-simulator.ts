"use client"

import { useState } from "react"
import { simulatePriceAtDate } from "../actions"

export function useMaterialSimulator(defaultMaterialCode: string = "PASIR") {
    const [simMaterialCode, setSimMaterialCode] = useState(defaultMaterialCode)
    const [simDate, setSimDate] = useState(new Date().toISOString().split("T")[0])
    const [simLocationId, setSimLocationId] = useState("all")
    const [simResult, setSimResult] = useState<any>(null)
    const [simLoading, setSimLoading] = useState(false)

    const handleRunSimulation = async () => {
        setSimLoading(true)
        try {
            const res = await simulatePriceAtDate({
                materialCode: simMaterialCode,
                targetDate: simDate,
                locationId: simLocationId === "all" ? null : simLocationId,
            })
            setSimResult(res)
        } catch (err) {
            console.error("Simulation error:", err)
        } finally {
            setSimLoading(false)
        }
    }

    return {
        simMaterialCode,
        setSimMaterialCode,
        simDate,
        setSimDate,
        simLocationId,
        setSimLocationId,
        simResult,
        simLoading,
        handleRunSimulation,
    }
}
