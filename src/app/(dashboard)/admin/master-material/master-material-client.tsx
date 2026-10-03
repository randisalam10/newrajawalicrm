"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Tag,
    Plus,
    Layers,
    History,
    Calculator
} from "lucide-react"

import { MasterMaterialItem, MaterialLocation, MaterialPriceHistoryItem } from "./types"
import { useMasterMaterialFilter } from "./hooks/use-master-material-filter"
import { useMasterMaterialDialogs } from "./hooks/use-master-material-dialogs"
import { useMaterialSimulator } from "./hooks/use-material-simulator"

import { MaterialIntegrationBanner } from "./components/material-integration-banner"
import { MaterialFilterBar } from "./components/material-filter-bar"
import { MaterialActiveTable } from "./components/material-active-table"
import { MaterialHistoryTable } from "./components/material-history-table"
import { MaterialSimulatorCard } from "./components/material-simulator-card"

import { UnifiedPriceDialog } from "./components/dialogs/unified-price-dialog"
import { MaterialHistoryModal } from "./components/dialogs/material-history-modal"
import { NewMaterialDialog } from "./components/dialogs/new-material-dialog"
import { EditHistoryDialog } from "./components/dialogs/edit-history-dialog"
import { DeleteHistoryDialog } from "./components/dialogs/delete-history-dialog"

interface MasterMaterialClientProps {
    initialMaterials: MasterMaterialItem[]
    initialHistories: MaterialPriceHistoryItem[]
    locations: MaterialLocation[]
    userRole: string
    userLocationId?: string | null
    isCorporate?: boolean
}

export function MasterMaterialClient({
    initialMaterials = [],
    initialHistories = [],
    locations = [],
    userRole,
    userLocationId,
    isCorporate = true,
}: MasterMaterialClientProps) {
    const isSuperAdmin = userRole === "SuperAdminBP" || ["CEO", "FVP"].includes(userRole)
    const isAdmin = isSuperAdmin || userRole === "AdminBP" || userRole === "Admin" || userRole === "AdminLogistik"
    const canManage = isSuperAdmin || isAdmin

    const initialLoc = (!isCorporate && userLocationId) ? userLocationId : "all"

    const [materials] = useState<MasterMaterialItem[]>(initialMaterials)
    const [histories] = useState<MaterialPriceHistoryItem[]>(initialHistories)

    // 1. Filter and search hook
    const {
        selectedLocation,
        setSelectedLocation,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredMaterials,
        filteredHistories,
    } = useMasterMaterialFilter(materials, histories, locations, initialLoc)

    // 2. Dialogs and actions hook
    const {
        isPending,
        // Unified Price Dialog
        showUnifiedPriceDialog,
        setShowUnifiedPriceDialog,
        selectedMaterialForPrice,
        handleOpenManagePrice,
        handleSaveNewPrice,
        handleSaveCorrection,
        // Material History Modal
        showMaterialHistoryModal,
        setShowMaterialHistoryModal,
        selectedMaterialForHistory,
        handleOpenMaterialHistory,
        // New Material Dialog
        showNewMaterialDialog,
        setShowNewMaterialDialog,
        newMatCode,
        setNewMatCode,
        newMatName,
        setNewMatName,
        newMatCategory,
        setNewMatCategory,
        newMatDensity,
        setNewMatDensity,
        newMatDescription,
        setNewMatDescription,
        newMatInitialPrice,
        setNewMatInitialPrice,
        newMatEffectiveDate,
        setNewMatEffectiveDate,
        newMatLocationId,
        setNewMatLocationId,
        newMatError,
        handleOpenNewMaterial,
        handleCreateMaterial,
        // Edit History Entry Dialog
        showEditHistoryDialog,
        setShowEditHistoryDialog,
        editHistoryMaterialName,
        editHistoryPrice,
        setEditHistoryPrice,
        editHistoryDate,
        setEditHistoryDate,
        editHistoryLocationId,
        setEditHistoryLocationId,
        editHistoryNotes,
        setEditHistoryNotes,
        handleOpenEditHistory,
        handleSaveEditHistory,
        // Delete Confirm Dialog
        showDeleteConfirm,
        setShowDeleteConfirm,
        deleteTargetText,
        handleOpenDeleteConfirm,
        handleConfirmDelete,
    } = useMasterMaterialDialogs(selectedLocation)

    // 3. Backdate simulator hook
    const {
        simMaterialCode,
        setSimMaterialCode,
        simDate,
        setSimDate,
        simLocationId,
        setSimLocationId,
        simResult,
        simLoading,
        handleRunSimulation,
    } = useMaterialSimulator(materials[0]?.code || "PASIR")

    return (
        <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                            <Tag className="w-4 h-4" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Master Harga Material per Kubik (m³)
                        </h1>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                            Non-Semen (Agregat)
                        </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Kelola acuan harga dasar Pasir Cor, Batu Split, dan Agregat per m³ dengan riwayat tanggal efektif untuk kalkulasi HPP beton.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOpenNewMaterial}
                        className="h-8 text-xs cursor-pointer border-slate-300 hover:bg-slate-50 font-medium"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1 text-slate-600" />
                        Tambah Material Baru
                    </Button>
                </div>
            </div>

            {/* Operational Pricing Integration Banner */}
            <MaterialIntegrationBanner />

            {/* Unified Single Filter Bar: Batching Plant & Search */}
            <MaterialFilterBar
                locations={locations}
                selectedLocation={selectedLocation}
                onSelectLocation={setSelectedLocation}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                isCorporate={isCorporate}
                userLocationId={userLocationId}
            />

            {/* Main Tabs Navigation */}
            <div className="border-b border-slate-200 pb-2">
                <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 text-slate-600">
                    <button
                        type="button"
                        onClick={() => setActiveTab("active")}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                            activeTab === "active"
                                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Daftar Material & Harga Aktif</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("history")}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                            activeTab === "history"
                                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                        }`}
                    >
                        <History className="w-3.5 h-3.5" />
                        <span>Log Riwayat Global ({histories.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("simulator")}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                            activeTab === "simulator"
                                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                        }`}
                    >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Simulator Cek Backdate</span>
                    </button>
                </div>
            </div>

            {/* Tab 1: Active Materials Main Table */}
            {activeTab === "active" && (
                <div className="mt-3 space-y-4">
                    <MaterialActiveTable
                        materials={filteredMaterials}
                        selectedLocation={selectedLocation}
                        canManage={canManage}
                        onOpenManagePrice={handleOpenManagePrice}
                        onOpenHistoryModal={handleOpenMaterialHistory}
                    />
                </div>
            )}

            {/* Tab 2: Global Price History Timeline */}
            {activeTab === "history" && (
                <div className="mt-3 space-y-4">
                    <MaterialHistoryTable
                        histories={filteredHistories}
                        onEditHistory={handleOpenEditHistory}
                        onOpenDeleteConfirm={handleOpenDeleteConfirm}
                    />
                </div>
            )}

            {/* Tab 3: Backdate Safe Simulator */}
            {activeTab === "simulator" && (
                <div className="mt-3">
                    <MaterialSimulatorCard
                        materials={materials}
                        locations={locations}
                        simMaterialCode={simMaterialCode}
                        onSimMaterialCodeChange={setSimMaterialCode}
                        simDate={simDate}
                        onSimDateChange={setSimDate}
                        simLocationId={simLocationId}
                        onSimLocationIdChange={setSimLocationId}
                        simResult={simResult}
                        simLoading={simLoading}
                        onRunSimulation={handleRunSimulation}
                    />
                </div>
            )}

            {/* 1. Unified Price Dialog (Single Source of Pricing Actions) */}
            <UnifiedPriceDialog
                open={showUnifiedPriceDialog}
                onOpenChange={setShowUnifiedPriceDialog}
                material={selectedMaterialForPrice}
                locations={locations}
                selectedLocation={selectedLocation}
                isPending={isPending}
                onSaveNewPrice={handleSaveNewPrice}
                onSaveCorrection={handleSaveCorrection}
            />

            {/* 2. Isolated Material-Specific History Modal */}
            <MaterialHistoryModal
                open={showMaterialHistoryModal}
                onOpenChange={setShowMaterialHistoryModal}
                material={selectedMaterialForHistory}
                canManage={canManage}
                onEditHistoryItem={handleOpenEditHistory}
                onDeleteHistoryItem={handleOpenDeleteConfirm}
            />

            {/* 3. New Material Dialog */}
            <NewMaterialDialog
                open={showNewMaterialDialog}
                onOpenChange={setShowNewMaterialDialog}
                code={newMatCode}
                onCodeChange={setNewMatCode}
                name={newMatName}
                onNameChange={setNewMatName}
                category={newMatCategory}
                onCategoryChange={setNewMatCategory}
                density={newMatDensity}
                onDensityChange={setNewMatDensity}
                description={newMatDescription}
                onDescriptionChange={setNewMatDescription}
                initialPrice={newMatInitialPrice}
                onInitialPriceChange={setNewMatInitialPrice}
                effectiveDate={newMatEffectiveDate}
                onEffectiveDateChange={setNewMatEffectiveDate}
                error={newMatError}
                isPending={isPending}
                onSubmit={handleCreateMaterial}
            />

            {/* 4. Edit Specific History Entry Dialog */}
            <EditHistoryDialog
                open={showEditHistoryDialog}
                onOpenChange={setShowEditHistoryDialog}
                materialName={editHistoryMaterialName}
                price={editHistoryPrice}
                onPriceChange={setEditHistoryPrice}
                effectiveDate={editHistoryDate}
                onEffectiveDateChange={setEditHistoryDate}
                locations={locations}
                locationId={editHistoryLocationId}
                onLocationIdChange={setEditHistoryLocationId}
                notes={editHistoryNotes}
                onNotesChange={setEditHistoryNotes}
                isPending={isPending}
                onSave={handleSaveEditHistory}
            />

            {/* 5. Delete History Confirm Dialog */}
            <DeleteHistoryDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                targetText={deleteTargetText}
                isPending={isPending}
                onConfirm={handleConfirmDelete}
            />
        </div>
    )
}
