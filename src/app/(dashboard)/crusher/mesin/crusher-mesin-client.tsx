"use client"

import type { CrusherDailyReportData } from "../types"
import { CrusherPageHeader } from "../components/crusher-page-header"
import type { MachineHistoryRow, PreviousHm } from "./types"
import { useMachineData } from "./hooks/use-machine-data"
import { useMachineForm } from "./hooks/use-machine-form"
import { useDowntime } from "./hooks/use-downtime"
import { DateNavigator } from "./components/date-navigator"
import { MachineHmForm } from "./components/machine-hm-form"
import { DowntimeSection } from "./components/downtime-section"
import { MachineSummaryCards } from "./components/machine-summary-cards"
import { MachineHistoryTable } from "./components/machine-history-table"

type Props = {
    initialReport: CrusherDailyReportData | null
    initialHistory: MachineHistoryRow[]
    initialPrevHm: PreviousHm
    initialDate: string
    locationId: string
    locationName: string
    locations?: { id: string; name: string }[]
}

export function CrusherMesinClient({
    initialReport,
    initialHistory,
    initialPrevHm,
    initialDate,
    locationId,
    locationName,
    locations,
}: Props) {
    const data = useMachineData({ initialReport, initialHistory, initialPrevHm, initialDate, locationId })
    const hasRecord = data.report !== null

    const hmForm = useMachineForm({
        report: data.report,
        selectedDate: data.selectedDate,
        locationId,
        onSaved: data.refresh,
    })

    const downtime = useDowntime({
        reportId: data.report?.id ?? null,
        selectedDate: data.selectedDate,
        locationId,
        onChanged: data.refresh,
    })

    return (
        <div className="space-y-4 w-full">
            <CrusherPageHeader
                title="Jam Mesin & Downtime"
                subtitle="Pencatatan HM mesin crusher, jam breakdown/kerusakan, dan kondisi cuaca"
                selectedDate={data.selectedDate}
                locationName={locationName}
                status={data.report?.status}
                locations={locations}
                selectedLocationId={locationId}
            />

            <DateNavigator
                selectedDate={data.selectedDate}
                today={data.today}
                hasRecord={hasRecord}
                isLoading={data.isLoadingDay}
                onChangeDate={data.changeDate}
                onShift={data.shiftDate}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
                <MachineHmForm
                    form={hmForm.form}
                    setField={hmForm.setField}
                    totalHm={hmForm.totalHm}
                    hmInvalid={hmForm.hmInvalid}
                    isDirty={hmForm.isDirty}
                    isSaving={hmForm.isSaving}
                    isLoading={data.isLoadingDay}
                    hasRecord={hasRecord}
                    prevHm={data.prevHm}
                    editLogs={data.report?.editLogs}
                    onSave={hmForm.save}
                    onReset={hmForm.resetForm}
                />
                <DowntimeSection
                    downtimes={data.report?.downtimes ?? []}
                    hasRecord={hasRecord}
                    isLoading={data.isLoadingDay}
                    ctl={downtime}
                />
            </div>

            <MachineSummaryCards summary={data.summary} />

            <MachineHistoryTable
                month={data.historyMonth}
                today={data.today}
                rows={data.dayRows}
                selectedDate={data.selectedDate}
                isLoading={data.isLoadingHistory}
                onSelectDate={(date) => {
                    data.changeDate(date)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                onChangeMonth={data.changeMonth}
            />
        </div>
    )
}
