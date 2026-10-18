"use client"

import { useState, useTransition } from "react"
import { CrusherDailyReportData, CrusherMaterialSourceItem, VehicleOption, EmployeeOption } from "../types"
import { CrusherPageHeader } from "../components/crusher-page-header"
import { TabMaterialIn } from "../components/tabs/tab-material-in"
import { getCrusherDailyReport, getCrusherEmployees, getCrusherVehicles } from "../actions"

type Props = {
    initialReport: CrusherDailyReportData | null
    initialDate: string
    locationId: string
    locationName: string
    sources: CrusherMaterialSourceItem[]
    vehicles: VehicleOption[]
    employees?: EmployeeOption[]
    locations?: { id: string; name: string }[]
    canViewWages?: boolean
}

export function CrusherMaterialInClient({
    initialReport,
    initialDate,
    locationId,
    locationName,
    sources,
    vehicles,
    employees = [],
    locations,
    canViewWages = false,
}: Props) {
    const [selectedDate, setSelectedDate] = useState(initialDate)
    const [report, setReport] = useState<CrusherDailyReportData | null>(initialReport)
    const [vehiclesList, setVehiclesList] = useState<VehicleOption[]>(vehicles)
    const [employeesList, setEmployeesList] = useState<EmployeeOption[]>(employees)
    const [_, startTransition] = useTransition()

    const refreshData = (targetDate = selectedDate) => {
        startTransition(async () => {
            try {
                const [updatedReport, updatedEmps, updatedVehs] = await Promise.all([
                    getCrusherDailyReport(targetDate, locationId),
                    getCrusherEmployees(locationId),
                    getCrusherVehicles(locationId),
                ])
                setReport(updatedReport)
                if (updatedEmps) setEmployeesList(updatedEmps)
                if (updatedVehs) setVehiclesList(updatedVehs)
            } catch (err) {
                console.error("Gagal refresh data material masuk", err)
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
                title="Material Masuk (Quarry & Kolbin)"
                subtitle="Pencatatan truk masuk bawa batu mentah/kali dan feeding ke Kolbin"
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                locationName={locationName}
                status={report?.status}
                locations={locations}
                selectedLocationId={locationId}
            />

            <TabMaterialIn
                report={report}
                selectedDate={selectedDate}
                locationId={locationId}
                sources={sources}
                vehicles={vehiclesList}
                employees={employeesList}
                canViewWages={canViewWages}
                onRefresh={() => refreshData(selectedDate)}
            />
        </div>
    )
}
