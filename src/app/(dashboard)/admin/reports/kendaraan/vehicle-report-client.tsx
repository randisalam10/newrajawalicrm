"use client"

import React from "react"
import { useVehicleReport } from "./hooks/use-vehicle-report"
import { exportVehicleReportToCSV } from "./helpers"
import { VehicleReportHeader } from "./components/vehicle-report-header"
import { VehicleReportFilter } from "./components/vehicle-report-filter"
import { VehicleReportSummaryCards } from "./components/vehicle-report-summary-cards"
import { VehicleDetailInspection } from "./components/vehicle-detail-inspection"
import { VehicleMasterTable } from "./components/vehicle-master-table"
import { VehicleReportClientProps } from "./types"

export function VehicleReportClient({
    initialVehicles = [],
    categories = [],
    locations = [],
    userLocationId = "",
    isSuperAdmin = false,
}: VehicleReportClientProps) {
    const {
        mounted,
        isPending,
        selectedLocation,
        setSelectedLocation,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedVehicleId,
        setSelectedVehicleId,
        searchQuery,
        setSearchQuery,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        overall,
        activeLocationName,
        availableVehicles,
        filteredAnalytics,
        singleVehicleData,
        isFiltered,
        handleResetFilters,
        setDatePresetThisMonth,
        setDatePresetLastMonth,
        setDatePresetThisYear,
        activeDetailTab,
        setActiveDetailTab,
        loadData,
    } = useVehicleReport({
        initialVehicles,
        categories,
        locations,
        userLocationId,
        isSuperAdmin,
    })

    const handleExportCSV = () => {
        exportVehicleReportToCSV({
            vehicleAnalytics: filteredAnalytics,
            activeLocationName,
            startDate,
            endDate,
        })
    }

    return (
        <div className="space-y-3.5">
            {/* Header: Letterhead (print) & Action Toolbar (web) */}
            <VehicleReportHeader
                mounted={mounted}
                activeLocationName={activeLocationName}
                availableCount={availableVehicles.length}
                isPending={isPending}
                onRefresh={loadData}
                onExportCSV={handleExportCSV}
            />

            {/* High-Density Filters */}
            <VehicleReportFilter
                locations={locations}
                categories={categories}
                availableVehicles={availableVehicles}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={setSelectedCategoryId}
                selectedVehicleId={selectedVehicleId}
                onVehicleChange={setSelectedVehicleId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                isSuperAdmin={isSuperAdmin}
                isFiltered={isFiltered}
                onResetFilters={handleResetFilters}
                onSetThisMonth={setDatePresetThisMonth}
                onSetLastMonth={setDatePresetLastMonth}
                onSetThisYear={setDatePresetThisYear}
                filteredCount={filteredAnalytics.length}
            />

            {/* Executive Summary Grid (6 Cards) */}
            <VehicleReportSummaryCards
                overall={overall}
                activeLocationName={activeLocationName}
            />

            {/* Focused Single Vehicle Detail View */}
            {singleVehicleData && (
                <VehicleDetailInspection
                    data={singleVehicleData}
                    activeTab={activeDetailTab}
                    onTabChange={setActiveDetailTab}
                    onClose={() => setSelectedVehicleId("all")}
                />
            )}

            {/* Master Fleet Summary Table */}
            <VehicleMasterTable
                filteredAnalytics={filteredAnalytics}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
                onShowAll={() => setSelectedVehicleId("all")}
            />
        </div>
    )
}
