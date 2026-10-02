"use client"

import React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BarChart3, Truck, ArrowDownLeft, ArrowUpRight } from "lucide-react"

import { MaterialReportClientProps } from "./types"
import { exportMaterialReportToCSV } from "./helpers"
import { useMaterialReport } from "./hooks/use-material-report"

import { MaterialReportHeader } from "./components/material-report-header"
import { MaterialReportFilters } from "./components/material-report-filters"
import { MaterialReportKpiCards } from "./components/material-report-kpi-cards"
import { MaterialSummaryTab } from "./components/tabs/material-summary-tab"
import { MaterialRetaseTab } from "./components/tabs/material-retase-tab"
import { MaterialIncomingTab } from "./components/tabs/material-incoming-tab"
import { MaterialOutgoingTab } from "./components/tabs/material-outgoing-tab"
import { MaterialSyncModal } from "./components/material-sync-modal"

export function MaterialReportClient({
    locations = [],
    userRole,
    userLocationId = null,
}: MaterialReportClientProps) {
    const {
        isSuperAdmin,
        canManagePrices,
        isPending,
        mounted,
        isSyncModalOpen,
        setIsSyncModalOpen,
        syncMode,
        setSyncMode,
        isSyncing,
        handleSyncPrices,
        datePreset,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        handlePresetChange,
        selectedLocation,
        setSelectedLocation,
        selectedMaterialType,
        setSelectedMaterialType,
        selectedSourceType,
        setSelectedSourceType,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        loadReportData,
        handleResetFilters,
        kpis,
        byMaterial,
        bySource,
        byDriver,
        incomingList,
        outgoingList,
    } = useMaterialReport({
        locations,
        userRole,
        userLocationId,
    })

    const handleExportCSV = () => {
        exportMaterialReportToCSV({
            incomingList,
            startDate,
            endDate,
        })
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-4 print:space-y-2 p-1">
            {/* Header with Title and Action buttons */}
            <MaterialReportHeader
                mounted={mounted}
                startDate={startDate}
                endDate={endDate}
                isPending={isPending}
                canManagePrices={canManagePrices}
                onPrint={handlePrint}
                onExportCSV={handleExportCSV}
                onRefresh={loadReportData}
                onOpenSyncModal={() => setIsSyncModalOpen(true)}
            />

            {/* Filter Section */}
            <MaterialReportFilters
                locations={locations}
                isSuperAdmin={isSuperAdmin}
                userLocationId={userLocationId}
                datePreset={datePreset}
                onPresetChange={handlePresetChange}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                selectedMaterialType={selectedMaterialType}
                onMaterialTypeChange={setSelectedMaterialType}
                selectedSourceType={selectedSourceType}
                onSourceTypeChange={setSelectedSourceType}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSearchSubmit={loadReportData}
                onResetFilters={handleResetFilters}
            />

            {/* Executive KPIs */}
            <MaterialReportKpiCards kpis={kpis} />

            {/* Main Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <TabsList className="bg-slate-100 p-0.5 print:hidden">
                    <TabsTrigger value="summary" className="text-xs">
                        <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                        <span>Akumulasi per Material ({byMaterial.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="retase" className="text-xs">
                        <Truck className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                        <span>Analisa Sumber & Retase DT ({byDriver.length} Sopir)</span>
                    </TabsTrigger>
                    <TabsTrigger value="incoming" className="text-xs">
                        <ArrowDownLeft className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        <span>Log Detail Material Masuk ({incomingList.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="outgoing" className="text-xs">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                        <span>Log Detail Material Keluar ({outgoingList.length})</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-4 space-y-4">
                    <MaterialSummaryTab byMaterial={byMaterial} kpis={kpis} />
                </TabsContent>

                <TabsContent value="retase" className="mt-4 space-y-4">
                    <MaterialRetaseTab bySource={bySource} byDriver={byDriver} />
                </TabsContent>

                <TabsContent value="incoming" className="mt-4 space-y-4">
                    <MaterialIncomingTab
                        incomingList={incomingList}
                        onExportCSV={handleExportCSV}
                    />
                </TabsContent>

                <TabsContent value="outgoing" className="mt-4 space-y-4">
                    <MaterialOutgoingTab outgoingList={outgoingList} />
                </TabsContent>
            </Tabs>

            {/* Price Master Correction & Sync Dialog */}
            <MaterialSyncModal
                isOpen={isSyncModalOpen}
                onOpenChange={setIsSyncModalOpen}
                startDate={startDate}
                endDate={endDate}
                selectedLocation={selectedLocation}
                locations={locations}
                syncMode={syncMode}
                setSyncMode={setSyncMode}
                isSyncing={isSyncing}
                onSync={handleSyncPrices}
            />
        </div>
    )
}
