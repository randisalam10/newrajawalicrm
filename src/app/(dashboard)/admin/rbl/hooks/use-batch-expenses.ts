"use client"

import { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { addExpenseBatch } from "../actions"
import { BatchRow, BudgetDateRange } from "../types"
import { fmtShortDate } from "../utils/rbl-helpers"

interface UseBatchExpensesProps {
    activeBudget: any
    categories: any[]
    vehicles: any[]
    budgetDateRange: BudgetDateRange
    selectedLocation: string
    reloadData: (locId: string) => void
}

export function useBatchExpenses({
    activeBudget,
    categories,
    vehicles,
    budgetDateRange,
    selectedLocation,
    reloadData,
}: UseBatchExpensesProps) {
    const [, startTransition] = useTransition()
    const [batchRows, setBatchRows] = useState<BatchRow[]>([])

    useEffect(() => {
        const firstCat = categories[0] || { id: null, name: "BBM / Solar", requireVehicleKm: true }
        setBatchRows([
            {
                id: `row-${Date.now()}`,
                date: budgetDateRange.defaultDate,
                itemDescription: "",
                categoryId: firstCat.id || null,
                category: firstCat.name,
                vehicleId: null,
                kmMeter: null,
                quantity: 1,
                unit: firstCat.name?.toLowerCase().includes("bbm") ? "Liter" : "Pcs",
                unitPrice: 0,
                receiptNo: "",
                notes: "",
            }
        ])
    }, [budgetDateRange, categories])

    // Helper to find previous recorded KM for a vehicle
    const getVehiclePreviousKmInfo = (vehicleId: string | null | undefined, currentRowIndex?: number) => {
        if (!vehicleId) return null

        if (currentRowIndex !== undefined && currentRowIndex > 0) {
            for (let i = currentRowIndex - 1; i >= 0; i--) {
                const prevRow = batchRows[i]
                if (prevRow.vehicleId === vehicleId && prevRow.kmMeter !== null && prevRow.kmMeter !== undefined && prevRow.kmMeter > 0) {
                    return {
                        km: prevRow.kmMeter,
                        source: `Baris #${i + 1} (${fmtShortDate(prevRow.date)})`,
                        date: prevRow.date
                    }
                }
            }
        }

        if (activeBudget?.expenses && activeBudget.expenses.length > 0) {
            const matchExpenses = activeBudget.expenses
                .filter((e: any) => (e.vehicleId === vehicleId || e.vehicle?.id === vehicleId) && e.kmMeter && e.kmMeter > 0)
                .sort((a: any, b: any) => {
                    const dDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
                    if (dDiff !== 0) return dDiff
                    return (b.kmMeter || 0) - (a.kmMeter || 0)
                })

            if (matchExpenses.length > 0) {
                const latestExp = matchExpenses[0]
                return {
                    km: latestExp.kmMeter,
                    source: `RBL Aktif (${fmtShortDate(latestExp.date)})`,
                    date: latestExp.date
                }
            }
        }

        const foundVehicle = vehicles.find((v: any) => v.id === vehicleId)
        if (foundVehicle?.lastKmMeter && foundVehicle.lastKmMeter > 0) {
            const srcLabel = foundVehicle.lastKmSource ? `Riwayat ${foundVehicle.lastKmSource}` : "Riwayat"
            return {
                km: foundVehicle.lastKmMeter,
                source: foundVehicle.lastKmDate ? `${srcLabel} (${fmtShortDate(foundVehicle.lastKmDate)})` : `${srcLabel} Sistem`,
                date: foundVehicle.lastKmDate
            }
        }

        return null
    }

    const handleAddBatchRow = (customDate?: string) => {
        const lastRow = batchRows[batchRows.length - 1]
        const nextDate = customDate || lastRow?.date || budgetDateRange.defaultDate
        const firstCat = categories[0] || { id: null, name: "BBM / Solar", requireVehicleKm: true }

        setBatchRows(prev => [
            ...prev,
            {
                id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                date: nextDate,
                itemDescription: "",
                categoryId: firstCat.id || null,
                category: firstCat.name,
                vehicleId: null,
                kmMeter: null,
                quantity: 1,
                unit: firstCat.name?.toLowerCase().includes("bbm") ? "Liter" : "Pcs",
                unitPrice: 0,
                receiptNo: "",
                notes: "",
            }
        ])
    }

    const handleRemoveBatchRow = (id: string) => {
        if (batchRows.length === 1) {
            toast.info("Minimal harus ada satu baris pengeluaran.")
            return
        }
        setBatchRows(prev => prev.filter(r => r.id !== id))
    }

    const handleRowChange = (id: string, field: keyof BatchRow, value: any) => {
        setBatchRows(prev => prev.map(r => {
            if (r.id !== id) return r
            return { ...r, [field]: value }
        }))
    }

    const handleCategorySelect = (rowId: string, cat: any) => {
        setBatchRows(prev => prev.map(r => {
            if (r.id !== rowId) return r
            const isFuel = cat.name.toLowerCase().includes("bbm") || cat.name.toLowerCase().includes("solar")
            return {
                ...r,
                categoryId: cat.id,
                category: cat.name,
                vehicleId: cat.requireVehicleKm ? r.vehicleId : null,
                kmMeter: cat.requireVehicleKm ? r.kmMeter : null,
                unit: isFuel ? "Liter" : (r.unit === "Liter" ? "Pcs" : r.unit),
            }
        }))
    }

    const handleSetAllRowsDate = (newDate: string) => {
        setBatchRows(prev => prev.map(r => ({ ...r, date: newDate })))
        toast.info(`Tanggal seluruh baris diset ke: ${fmtShortDate(newDate)}`)
    }

    const handleSaveBatchExpenses = async () => {
        if (!activeBudget) {
            toast.error("Belum ada Budget yang aktif. Buka budget terlebih dahulu.")
            return
        }

        const validRows = batchRows.filter(r => r.itemDescription.trim().length > 0)
        if (validRows.length === 0) {
            toast.error("Nama Item / Uraian pengeluaran wajib diisi minimal 1 baris.")
            return
        }

        for (const r of validRows) {
            if (r.date < budgetDateRange.min || r.date > budgetDateRange.max) {
                toast.error(`Tanggal ${r.date} berada di luar periode budget aktif (${budgetDateRange.label})!`)
                return
            }
        }

        for (let i = 0; i < validRows.length; i++) {
            const r = validRows[i]
            if (r.vehicleId && r.kmMeter !== null && r.kmMeter !== undefined && r.kmMeter > 0) {
                const prevInfo = getVehiclePreviousKmInfo(r.vehicleId, i)
                if (prevInfo && prevInfo.km && r.kmMeter < prevInfo.km) {
                    const vehicleObj = vehicles.find((v: any) => v.id === r.vehicleId)
                    const vName = vehicleObj ? `${vehicleObj.code} (${vehicleObj.plate_number || vehicleObj.plateNumber})` : "Armada"
                    const proceed = window.confirm(
                        `⚠️ PERINGATAN ODOMETER:\n` +
                        `Unit: ${vName}\n` +
                        `KM Input Sekarang: ${r.kmMeter.toLocaleString("id-ID")} KM\n` +
                        `KM Sebelumnya: ${prevInfo.km.toLocaleString("id-ID")} KM (${prevInfo.source})\n` +
                        `Selisih: ${(r.kmMeter - prevInfo.km).toLocaleString("id-ID")} KM (MUNDUR / LEBIH KECIL)\n\n` +
                        `Apakah Anda yakin data ini sudah benar dan ingin tetap menyimpannya?`
                    )
                    if (!proceed) return
                }
            }
        }

        startTransition(async () => {
            const res = await addExpenseBatch(activeBudget.id, validRows)
            if (res.success) {
                toast.success(`Berhasil menyimpan ${res.count} item pengeluaran!`)
                const lastDate = validRows[validRows.length - 1].date
                const firstCat = categories[0] || { id: null, name: "BBM / Solar", requireVehicleKm: true }
                setBatchRows([{
                    id: `row-${Date.now()}`,
                    date: lastDate,
                    itemDescription: "",
                    categoryId: firstCat.id || null,
                    category: firstCat.name,
                    vehicleId: null,
                    kmMeter: null,
                    quantity: 1,
                    unit: firstCat.name?.toLowerCase().includes("bbm") ? "Liter" : "Pcs",
                    unitPrice: 0,
                    receiptNo: "",
                    notes: "",
                }])
                reloadData(selectedLocation)
            } else {
                toast.error(res.error || "Gagal menyimpan pengeluaran.")
            }
        })
    }

    return {
        batchRows,
        setBatchRows,
        getVehiclePreviousKmInfo,
        handleAddBatchRow,
        handleRemoveBatchRow,
        handleRowChange,
        handleCategorySelect,
        handleSetAllRowsDate,
        handleSaveBatchExpenses,
    }
}
