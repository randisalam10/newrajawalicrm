"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    Tag, Plus, Layers, History, Calculator, Building2, Search
} from "lucide-react"

import { MasterMaterialItem, MaterialLocation, MaterialPriceHistoryItem } from "./types"
import { useMasterMaterialFilter } from "./hooks/use-master-material-filter"
import { useMasterMaterialDialogs } from "./hooks/use-master-material-dialogs"
import { useMaterialSimulator } from "./hooks/use-material-simulator"

import { MaterialIntegrationBanner } from "./components/material-integration-banner"
import { MaterialHighlightCards } from "./components/material-highlight-cards"
import { MaterialActiveTable } from "./components/material-active-table"
import { MaterialHistoryTable } from "./components/material-history-table"
import { MaterialSimulatorCard } from "./components/material-simulator-card"

import { SetPriceDialog } from "./components/dialogs/set-price-dialog"
import { NewMaterialDialog } from "./components/dialogs/new-material-dialog"
import { EditHistoryDialog } from "./components/dialogs/edit-history-dialog"
import { DeleteHistoryDialog } from "./components/dialogs/delete-history-dialog"

interface MasterMaterialClientProps {
    initialMaterials: MasterMaterialItem[]
    initialHistories: MaterialPriceHistoryItem[]
    locations: MaterialLocation[]
    userRole: string
    userLocationId?: string | null
}

export function MasterMaterialClient({
    initialMaterials = [],
    initialHistories = [],
    locations = [],
    userRole,
}: MasterMaterialClientProps) {
    const isSuperAdmin = userRole === "SuperAdminBP" || ["CEO", "FVP"].includes(userRole)
    const isAdmin = isSuperAdmin || userRole === "AdminBP" || userRole === "Admin" || userRole === "AdminLogistik"
    const canManage = isSuperAdmin || isAdmin

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
    } = useMasterMaterialFilter(materials, histories, locations)

    // 2. Dialogs and actions hook
    const {
        isPending,
        // Price Dialog
        showPriceDialog,
        setShowPriceDialog,
        priceFormMaterialId,
        setPriceFormMaterialId,
        priceFormValue,
        setPriceFormValue,
        priceFormEffectiveDate,
        setPriceFormEffectiveDate,
        priceFormLocationIds,
        setPriceFormLocationIds,
        priceFormNotes,
        setPriceFormNotes,
        priceError,
        handleOpenSetPrice,
        handleSavePrice,
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
        // Edit History Dialog
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
        handleQuickEditActivePrice,
        handleSaveEditHistory,
        // Delete Confirm Dialog
        showDeleteConfirm,
        setShowDeleteConfirm,
        deleteTargetText,
        handleOpenDeleteConfirm,
        handleConfirmDelete,
    } = useMasterMaterialDialogs(selectedLocation)

    // 3. Backdate safe price simulator hook
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
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
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
                        Kelola harga acuan dasar Pasir Cor, Batu Split, dan Agregat per m³ dengan pencatatan riwayat tanggal efektif (backdate safe).
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOpenNewMaterial}
                        className="h-8 text-xs cursor-pointer border-slate-300 hover:bg-slate-50 font-medium"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1 text-slate-600" />
                        Tambah Material Baru
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => {
                            if (materials.length > 0) {
                                handleOpenSetPrice(materials[0])
                            }
                        }}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-medium"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Tetapkan Harga Baru
                    </Button>
                </div>
            </div>

            {/* Operational Pricing Integration Banner */}
            <MaterialIntegrationBanner />

            {/* Material Highlight Cards */}
            <MaterialHighlightCards
                materials={materials}
                selectedLocation={selectedLocation}
                canManage={canManage}
                onQuickEditActivePrice={handleQuickEditActivePrice}
                onOpenSetPrice={handleOpenSetPrice}
            />

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
                    <TabsList className="bg-slate-100 p-0.5">
                        <TabsTrigger value="active" className="text-xs">
                            <Layers className="w-3.5 h-3.5 mr-1" />
                            <span>Daftar Material & Harga Aktif</span>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="text-xs">
                            <History className="w-3.5 h-3.5 mr-1" />
                            <span>Riwayat Perubahan Harga ({histories.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="simulator" className="text-xs">
                            <Calculator className="w-3.5 h-3.5 mr-1" />
                            <span>Simulator Cek Backdate</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Filter controls */}
                    <div className="flex items-center gap-2">
                        {locations.length > 1 && (
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger className="h-8 text-xs w-48 bg-white">
                                    <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                    <SelectValue placeholder="Lingkup Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Cabang (Global)</SelectItem>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <div className="relative w-44 sm:w-56">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari material..."
                                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Tab 1: Active Materials */}
                <TabsContent value="active" className="mt-4 space-y-4">
                    <MaterialActiveTable
                        materials={filteredMaterials}
                        selectedLocation={selectedLocation}
                        canManage={canManage}
                        onQuickEditActivePrice={handleQuickEditActivePrice}
                        onOpenSetPrice={handleOpenSetPrice}
                    />
                </TabsContent>

                {/* Tab 2: Price History Timeline */}
                <TabsContent value="history" className="mt-4 space-y-4">
                    <MaterialHistoryTable
                        histories={filteredHistories}
                        onEditHistory={handleOpenEditHistory}
                        onOpenDeleteConfirm={handleOpenDeleteConfirm}
                    />
                </TabsContent>

                {/* Tab 3: Backdate Safe Simulator */}
                <TabsContent value="simulator" className="mt-4">
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
                </TabsContent>
            </Tabs>

            {/* Set Price Dialog */}
            <SetPriceDialog
                open={showPriceDialog}
                onOpenChange={setShowPriceDialog}
                materials={materials}
                locations={locations}
                materialId={priceFormMaterialId}
                onMaterialIdChange={setPriceFormMaterialId}
                priceValue={priceFormValue}
                onPriceValueChange={setPriceFormValue}
                effectiveDate={priceFormEffectiveDate}
                onEffectiveDateChange={setPriceFormEffectiveDate}
                locationIds={priceFormLocationIds}
                onLocationIdsChange={setPriceFormLocationIds}
                notes={priceFormNotes}
                onNotesChange={setPriceFormNotes}
                error={priceError}
                isPending={isPending}
                onSave={handleSavePrice}
            />

            {/* New Material Dialog */}
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

            {/* Edit History Dialog */}
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

            {/* Delete History Dialog */}
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
