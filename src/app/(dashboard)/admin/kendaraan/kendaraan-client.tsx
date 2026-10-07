"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Plus, Tag, FileClock } from "lucide-react"

import { Vehicle, VehicleCategory } from "./types"
import { useKendaraanCategories } from "./hooks/use-kendaraan-categories"
import { useKendaraanForm } from "./hooks/use-kendaraan-form"
import { useKendaraanCompliance } from "./hooks/use-kendaraan-compliance"

import { VehicleTable } from "./components/vehicle-table"
import { VehicleFormDialog } from "./components/vehicle-form-dialog"
import { QuickCategoryDialog } from "./components/quick-category-dialog"
import { ManageCategoriesDialog } from "./components/manage-categories-dialog"
import { ComplianceHistoryDialog } from "./components/compliance-history-dialog"
import { ComplianceRecordFormDialog } from "./components/compliance-record-form-dialog"

export function KendaraanClient({
    initialData = [],
    locations = [],
    initialCategories = [],
    userRole,
    canManage = true,
    isCorporate = false,
}: {
    initialData: Vehicle[]
    locations: any[]
    initialCategories?: VehicleCategory[]
    userRole: string
    canManage?: boolean
    isCorporate?: boolean
}) {
    // 1. Categories Management Hook
    const {
        categories,
        isQuickCategoryOpen,
        setIsQuickCategoryOpen,
        quickCategoryName,
        setQuickCategoryName,
        quickCategoryCode,
        setQuickCategoryCode,
        quickCategoryDesc,
        setQuickCategoryDesc,
        isSavingCategory,
        isManageCategoriesOpen,
        setIsManageCategoriesOpen,
        handleSaveQuickCategory,
        handleDeleteCategory,
    } = useKendaraanCategories(initialCategories)

    // 2. Vehicle Form & Action Hook
    const {
        open,
        setOpen,
        editData,
        selectedCategoryId,
        setSelectedCategoryId,
        meterType,
        setMeterType,
        merkModel,
        setMerkModel,
        dumpTruckSize,
        setDumpTruckSize,
        capacityCubic,
        setCapacityCubic,
        isForRent,
        setIsForRent,
        defaultDayRate,
        setDefaultDayRate,
        rentalStatus,
        setRentalStatus,
        rentalNotes,
        setRentalNotes,
        annualTaxCost,
        setAnnualTaxCost,
        taxExpiryDate,
        setTaxExpiryDate,
        kirCost,
        setKirCost,
        kirExpiryDate,
        setKirExpiryDate,
        kirPeriodMonths,
        setKirPeriodMonths,
        handleCategoryChange,
        handleOpenNew,
        handleOpenEdit,
        handleSubmit,
        handleDelete,
        isSubmitting,
    } = useKendaraanForm(categories)

    // 3. Vehicle Compliance Hook
    const {
        isComplianceOpen,
        setIsComplianceOpen,
        selectedVehicleForCompliance,
        setSelectedVehicleForCompliance,
        complianceFilterType,
        setComplianceFilterType,
        isAddRecordOpen,
        setIsAddRecordOpen,
        editingRecord,
        isSubmittingRecord,
        compVehicleId,
        setCompVehicleId,
        compType,
        setCompType,
        compCost,
        setCompCost,
        compPaymentDate,
        setCompPaymentDate,
        compValidFrom,
        setCompValidFrom,
        compValidUntil,
        setCompValidUntil,
        compPeriodMonths,
        setCompPeriodMonths,
        compReceiptNumber,
        setCompReceiptNumber,
        compNotes,
        setCompNotes,
        allComplianceRecords,
        handleOpenComplianceForVehicle,
        handleOpenAllCompliance,
        handleOpenAddRecordModal,
        handleEditRecordModal,
        handleTypeChange,
        handleValidFromChange,
        handleSubmitComplianceRecord,
        handleDeleteComplianceRecord,
    } = useKendaraanCompliance(initialData)

    return (
        <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsManageCategoriesOpen(true)}
                        className="h-9 text-xs gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                    >
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>Kategori Kendaraan ({categories.length})</span>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenAllCompliance}
                        className="h-9 text-xs gap-1.5 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 cursor-pointer shadow-2xs font-medium"
                    >
                        <FileClock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Riwayat Pajak & KIR ({allComplianceRecords.length})</span>
                    </Button>
                </div>

                {canManage && (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleOpenNew}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 gap-1.5 shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Kendaraan & Alat</span>
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Vehicle Table */}
            <VehicleTable
                data={initialData}
                isCorporate={isCorporate}
                canManage={canManage}
                onOpenComplianceForVehicle={handleOpenComplianceForVehicle}
                onOpenEdit={handleOpenEdit}
                onDelete={handleDelete}
            />

            {/* Dialog: Tambah / Edit Kendaraan & Alat */}
            <VehicleFormDialog
                open={open}
                onOpenChange={setOpen}
                editData={editData}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={handleCategoryChange}
                onOpenQuickCategory={() => setIsQuickCategoryOpen(true)}
                meterType={meterType}
                onMeterTypeChange={setMeterType}
                merkModel={merkModel}
                onMerkModelChange={setMerkModel}
                locations={locations}
                userRole={userRole}
                isCorporate={isCorporate}
                dumpTruckSize={dumpTruckSize}
                onDumpTruckSizeChange={setDumpTruckSize}
                capacityCubic={capacityCubic}
                onCapacityCubicChange={setCapacityCubic}
                isForRent={isForRent}
                onIsForRentChange={setIsForRent}
                defaultDayRate={defaultDayRate}
                onDefaultDayRateChange={setDefaultDayRate}
                rentalStatus={rentalStatus}
                onRentalStatusChange={setRentalStatus}
                rentalNotes={rentalNotes}
                onRentalNotesChange={setRentalNotes}
                annualTaxCost={annualTaxCost}
                onAnnualTaxCostChange={setAnnualTaxCost}
                taxExpiryDate={taxExpiryDate}
                onTaxExpiryDateChange={setTaxExpiryDate}
                kirCost={kirCost}
                onKirCostChange={setKirCost}
                kirExpiryDate={kirExpiryDate}
                onKirExpiryDateChange={setKirExpiryDate}
                kirPeriodMonths={kirPeriodMonths}
                onKirPeriodMonthsChange={setKirPeriodMonths}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
            />

            {/* Shortcut Dialog: Quick Add Vehicle Category */}
            <QuickCategoryDialog
                open={isQuickCategoryOpen}
                onOpenChange={setIsQuickCategoryOpen}
                categoryName={quickCategoryName}
                onCategoryNameChange={setQuickCategoryName}
                categoryCode={quickCategoryCode}
                onCategoryCodeChange={setQuickCategoryCode}
                categoryDesc={quickCategoryDesc}
                onCategoryDescChange={setQuickCategoryDesc}
                isSaving={isSavingCategory}
                onSubmit={(e) => handleSaveQuickCategory(e, (newId) => setSelectedCategoryId(newId))}
            />

            {/* Dialog: Master Kategori Kendaraan Management */}
            <ManageCategoriesDialog
                open={isManageCategoriesOpen}
                onOpenChange={setIsManageCategoriesOpen}
                categories={categories}
                onOpenQuickCategory={() => setIsQuickCategoryOpen(true)}
                onDeleteCategory={handleDeleteCategory}
            />

            {/* Dialog: Riwayat Kepatuhan Pajak STNK & Uji KIR */}
            <ComplianceHistoryDialog
                open={isComplianceOpen}
                onOpenChange={setIsComplianceOpen}
                selectedVehicle={selectedVehicleForCompliance}
                onClearSelectedVehicle={() => setSelectedVehicleForCompliance(null)}
                canManage={canManage}
                records={allComplianceRecords}
                filterType={complianceFilterType}
                onFilterTypeChange={setComplianceFilterType}
                onOpenAddRecord={handleOpenAddRecordModal}
                onEditRecord={handleEditRecordModal}
                onDeleteRecord={handleDeleteComplianceRecord}
            />

            {/* Sub-Dialog: Catat / Edit Pembayaran Pajak & KIR */}
            <ComplianceRecordFormDialog
                open={isAddRecordOpen}
                onOpenChange={setIsAddRecordOpen}
                editingRecord={editingRecord}
                vehicles={initialData}
                compVehicleId={compVehicleId}
                onCompVehicleIdChange={setCompVehicleId}
                compType={compType}
                onCompTypeChange={handleTypeChange}
                compPaymentDate={compPaymentDate}
                onCompPaymentDateChange={setCompPaymentDate}
                compCost={compCost}
                onCompCostChange={setCompCost}
                compPeriodMonths={compPeriodMonths}
                setCompPeriodMonths={setCompPeriodMonths}
                compValidFrom={compValidFrom}
                onCompValidFromChange={handleValidFromChange}
                compValidUntil={compValidUntil}
                onCompValidUntilChange={setCompValidUntil}
                compReceiptNumber={compReceiptNumber}
                onCompReceiptNumberChange={setCompReceiptNumber}
                compNotes={compNotes}
                onCompNotesChange={setCompNotes}
                isSubmitting={isSubmittingRecord}
                onSubmit={handleSubmitComplianceRecord}
            />
        </div>
    )
}
