"use client"

import { useTutupBuku } from "./hooks/use-tutup-buku"
import { TutupBukuHeader } from "./components/sections/tutup-buku-header"
import { PeriodSummaryCards } from "./components/sections/period-summary-cards"
import { ClosedPeriodsTable } from "./components/sections/closed-periods-table"
import { ClosePeriodModal } from "./components/modals/close-period-modal"
import { ReopenPeriodModal } from "./components/modals/reopen-period-modal"
import { SnapshotDetailModal } from "./components/modals/snapshot-detail-modal"
import {
    MonthlyClosingRecord,
    PeriodSummaryStats,
    PeriodOptionItem,
    ClosingStatusMap
} from "./types"

interface TutupBukuClientProps {
    initialRecords: MonthlyClosingRecord[]
    initialStats: PeriodSummaryStats
    availablePeriods: PeriodOptionItem[]
    closingMap: ClosingStatusMap
    currentYear: number
    locations: Array<{ id: string; name: string }>
}

export function TutupBukuClient({
    initialRecords,
    initialStats,
    availablePeriods,
    closingMap,
    currentYear,
    locations
}: TutupBukuClientProps) {
    const {
        selectedYear,
        setSelectedYear,
        selectedLocationId,
        setSelectedLocationId,
        searchQuery,
        setSearchQuery,
        filteredRecords,
        stats,
        isPending,

        // Modals & Handlers
        isCloseModalOpen,
        setIsCloseModalOpen,
        previewData,
        isPreviewLoading,
        handleFetchPreview,
        handleExecuteClose,

        isReopenModalOpen,
        setIsReopenModalOpen,
        targetRecordForReopen,
        setTargetRecordForReopen,
        handleExecuteReopen,

        isSnapshotModalOpen,
        setIsSnapshotModalOpen,
        targetRecordForSnapshot,
        setTargetRecordForSnapshot
    } = useTutupBuku({
        initialRecords,
        initialStats,
        availablePeriods,
        closingMap,
        currentYear,
        locations
    })

    return (
        <div className="space-y-6 w-full">
            {/* Header with Title and Search/Filters */}
            <TutupBukuHeader
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                selectedLocationId={selectedLocationId}
                onLocationChange={setSelectedLocationId}
                locations={locations}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenCloseModal={() => setIsCloseModalOpen(true)}
            />

            {/* Quick Stat Summary Cards */}
            <PeriodSummaryCards stats={stats} />

            {/* Main Table of Closed & Archived Periods */}
            <ClosedPeriodsTable
                records={filteredRecords}
                onOpenReopenModal={(record) => {
                    setTargetRecordForReopen(record)
                    setIsReopenModalOpen(true)
                }}
                onOpenSnapshotModal={(record) => {
                    setTargetRecordForSnapshot(record)
                    setIsSnapshotModalOpen(true)
                }}
            />

            {/* Modal: Close Period */}
            <ClosePeriodModal
                open={isCloseModalOpen}
                onOpenChange={setIsCloseModalOpen}
                availablePeriods={availablePeriods}
                locations={locations}
                closingMap={closingMap}
                defaultLocationId={selectedLocationId}
                previewData={previewData}
                isPreviewLoading={isPreviewLoading}
                isSubmitting={isPending}
                onFetchPreview={handleFetchPreview}
                onConfirmClose={handleExecuteClose}
            />

            {/* Modal: Reopen Period */}
            <ReopenPeriodModal
                open={isReopenModalOpen}
                onOpenChange={setIsReopenModalOpen}
                record={targetRecordForReopen}
                isSubmitting={isPending}
                onConfirmReopen={handleExecuteReopen}
            />

            {/* Modal: Snapshot Detail View */}
            <SnapshotDetailModal
                open={isSnapshotModalOpen}
                onOpenChange={setIsSnapshotModalOpen}
                record={targetRecordForSnapshot}
            />
        </div>
    )
}
