"use client"

import { useState, useTransition } from "react"
import { CrusherDailyReportData, LocationOption, VehicleOption, EmployeeOption, CrusherDestinationItem } from "../types"
import { CrusherPageHeader } from "../components/crusher-page-header"
import { TabMaterialOut } from "../components/tabs/tab-material-out"
import { getCrusherDailyReport } from "../actions"

type Props = {
    initialReport: CrusherDailyReportData | null
    initialDate: string
    locationId: string
    locationName: string
    locations: LocationOption[]
    crusherLocations?: LocationOption[]
    vehicles?: VehicleOption[]
    employees?: EmployeeOption[]
    destinations?: CrusherDestinationItem[]
    canViewWages?: boolean
}

export function CrusherMaterialOutClient({
    initialReport,
    initialDate,
    locationId,
    locationName,
    locations,
    crusherLocations,
    vehicles = [],
    employees = [],
    destinations = [],
    canViewWages = false,
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
                console.error("Gagal refresh data material keluar", err)
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
                title="Material Keluar (Tanpa Surat Jalan)"
                subtitle="Transfer batu ke Batching Plant internal atau Penjualan Bebas ke pembeli umum"
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                locationName={locationName}
                status={report?.status}
                locations={crusherLocations}
                selectedLocationId={locationId}
            />

            <TabMaterialOut
                report={report}
                selectedDate={selectedDate}
                locationId={locationId}
                locations={locations}
                vehicles={vehicles}
                employees={employees}
                destinations={destinations}
                canViewWages={canViewWages}
                onRefresh={() => refreshData(selectedDate)}
            />
        </div>
    )
}
