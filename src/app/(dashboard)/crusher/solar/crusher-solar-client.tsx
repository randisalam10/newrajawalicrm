"use client"

import { useState, useTransition } from "react"
import { CrusherDailyReportData, VehicleOption } from "../types"
import { CrusherPageHeader } from "../components/crusher-page-header"
import { TabFuelSolar } from "../components/tabs/tab-fuel-solar"
import { getCrusherDailyReport } from "../actions"

type Props = {
    initialReport: CrusherDailyReportData | null
    initialDate: string
    locationId: string
    locationName: string
    vehicles: VehicleOption[]
    locations?: { id: string; name: string }[]
}

export function CrusherSolarClient({
    initialReport,
    initialDate,
    locationId,
    locationName,
    vehicles,
    locations,
}: Props) {
    const [selectedDate, setSelectedDate] = useState(initialDate)
    const [report, setReport] = useState<CrusherDailyReportData | null>(initialReport)
    const [_, startTransition] = useTransition()

    const refreshData = (targetDate = selectedDate) => {
        startTransition(async () => {
            try {
                const updated = await getCrusherDailyReport(targetDate, locationId)
                setReport(updated)
            } catch (err) {
                console.error("Gagal refresh data solar", err)
            }
        })
    }

    const handleDateChange = (newDate: string) => {
        setSelectedDate(newDate)
        refreshData(newDate)
    }

    return (
        <div className="space-y-3.5 w-full">
            <CrusherPageHeader
                title="Pengisian BBM (Solar)"
                subtitle="Pencatatan konsumsi solar harian alat berat dan armada dump truck"
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                locationName={locationName}
                status={report?.status}
                locations={locations}
                selectedLocationId={locationId}
            />

            <TabFuelSolar
                report={report}
                selectedDate={selectedDate}
                locationId={locationId}
                vehicles={vehicles}
                onRefresh={() => refreshData(selectedDate)}
            />
        </div>
    )
}
