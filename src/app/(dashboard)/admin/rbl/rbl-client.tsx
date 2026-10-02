"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    FileText,
    Image as ImageIcon,
    Calendar,
    Tag,
    Fuel,
    Lock,
} from "lucide-react"
import { format } from "date-fns"

// Types
import { RblClientProps } from "./types"

// Hooks
import { useRbl } from "./hooks/use-rbl"

// Subcomponents
import { RblSummaryHeader } from "./components/rbl-summary-header"
import { InputBatchTab } from "./components/tabs/input-batch-tab"
import { DailyListTab } from "./components/tabs/daily-list-tab"
import { BulkUploadTab } from "./components/tabs/bulk-upload-tab"
import { HistoryTab } from "./components/tabs/history-tab"
import { CategoriesTab } from "./components/tabs/categories-tab"
import { RblCategoryReport } from "./rbl-category-report"

// Modals
import { CreateBudgetDialog } from "./components/modals/create-budget-dialog"
import { CloseBudgetDialog } from "./components/modals/close-budget-dialog"
import { EditExpenseDialog } from "./components/modals/edit-expense-dialog"
import { CategoryModal } from "./components/modals/category-modal"
import { BudgetDetailDialog } from "./components/modals/budget-detail-dialog"
import { ImagePreviewDialog } from "./components/modals/image-preview-dialog"

export function RblClient(props: RblClientProps) {
    const {
        locations,
        vehicles = [],
        userLocationId,
        isSuperAdmin,
        canCreate = true,
        canEdit = true,
        canDelete = true,
        canClose = true,
    } = props

    const rbl = useRbl(props)
    const { categoriesHook, batchExpensesHook, bulkReceiptsHook } = rbl

    return (
        <div className="space-y-6">
            {/* Header & Active Budget Summary Cards */}
            <RblSummaryHeader
                activeBudget={rbl.activeBudget}
                adminBranchName={rbl.adminBranchName}
                isSuperAdmin={isSuperAdmin}
                canCreate={canCreate}
                canClose={canClose}
                locations={locations}
                selectedLocation={rbl.selectedLocation}
                onSelectLocation={(locId) => {
                    rbl.setSelectedLocation(locId)
                    rbl.reloadData(locId)
                }}
                onOpenCreateBudget={() => {
                    rbl.setBudgetForm((prev) => ({
                        ...prev,
                        locationId: rbl.selectedLocation !== "all" ? rbl.selectedLocation : (userLocationId || locations[0]?.id || "")
                    }))
                    rbl.setIsCreateBudgetOpen(true)
                }}
                onOpenCloseBudget={() => rbl.setIsCloseBudgetOpen(true)}
                onOpenCategoryReport={() => rbl.setActiveTab("category-report")}
                activeTab={rbl.activeTab}
                balanceStatus={rbl.balanceStatus}
                utilizationRate={rbl.utilizationRate}
            />

            {/* Main Tabs Navigation */}
            <Tabs value={rbl.activeTab} onValueChange={rbl.setActiveTab} className="space-y-4">
                <TabsList className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 h-auto flex flex-wrap gap-1">
                    {canEdit && (
                        <TabsTrigger value="input-batch" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Input RBL</span>
                            {!rbl.activeBudget && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-medium flex items-center gap-0.5">
                                    <Lock className="h-2.5 w-2.5" /> Terkunci
                                </span>
                            )}
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="daily-list" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Daftar Pengeluaran</span>
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono h-4 bg-slate-200/70 text-slate-700">
                            {rbl.activeBudget?.expenses?.length || 0}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="category-report" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-amber-800 data-[state=active]:shadow-2xs text-amber-900 font-medium">
                        <Fuel className="h-3.5 w-3.5 text-amber-600" />
                        <span>Laporan Kategori</span>
                        <Badge className="ml-1 px-1.5 py-0 text-[10px] bg-amber-100 text-amber-800 border-none font-sans">
                            BBM/Export
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="bulk-upload" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Nota Kas</span>
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono h-4 bg-slate-200/70 text-slate-700">
                            {rbl.activeBudget?.attachments?.length || 0}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Riwayat Periode</span>
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-1.5 text-xs rounded-lg py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-2xs">
                        <Tag className="h-3.5 w-3.5" />
                        <span>Master Kategori</span>
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono h-4 bg-slate-200/70 text-slate-700">
                            {categoriesHook.categories.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Input Batch */}
                <TabsContent value="input-batch" className="space-y-4">
                    <InputBatchTab
                        activeBudget={rbl.activeBudget}
                        adminBranchName={rbl.adminBranchName}
                        canCreate={canCreate}
                        budgetDateRange={rbl.budgetDateRange}
                        batchRows={batchExpensesHook.batchRows}
                        categories={categoriesHook.categories}
                        branchVehicles={rbl.branchVehicles}
                        isHeadOfficeBudget={rbl.isHeadOfficeBudget}
                        isPending={rbl.isPending}
                        onOpenCreateBudget={() => {
                            rbl.setBudgetForm((prev) => ({
                                ...prev,
                                locationId: rbl.selectedLocation !== "all" ? rbl.selectedLocation : (userLocationId || locations[0]?.id || "")
                            }))
                            rbl.setIsCreateBudgetOpen(true)
                        }}
                        onOpenHistoryTab={() => rbl.setActiveTab("history")}
                        onSetAllRowsDate={batchExpensesHook.handleSetAllRowsDate}
                        onRowChange={batchExpensesHook.handleRowChange}
                        onCategorySelect={batchExpensesHook.handleCategorySelect}
                        onOpenQuickCategory={categoriesHook.handleOpenQuickCategory}
                        onRemoveBatchRow={batchExpensesHook.handleRemoveBatchRow}
                        onAddBatchRow={batchExpensesHook.handleAddBatchRow}
                        onSaveBatchExpenses={batchExpensesHook.handleSaveBatchExpenses}
                        getVehiclePreviousKmInfo={batchExpensesHook.getVehiclePreviousKmInfo}
                    />
                </TabsContent>

                {/* Tab 2: Daily List */}
                <TabsContent value="daily-list" className="space-y-4">
                    <DailyListTab
                        activeBudget={rbl.activeBudget}
                        expenseViewMode={rbl.expenseViewMode}
                        setExpenseViewMode={rbl.setExpenseViewMode}
                        expensesByDate={rbl.expensesByDate}
                        sortedAllExpenses={rbl.sortedAllExpenses}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onOpenCategoryReport={() => rbl.setActiveTab("category-report")}
                        onOpenCreateBudget={() => {
                            rbl.setBudgetForm((prev) => ({
                                ...prev,
                                locationId: rbl.selectedLocation !== "all" ? rbl.selectedLocation : (userLocationId || locations[0]?.id || "")
                            }))
                            rbl.setIsCreateBudgetOpen(true)
                        }}
                        onEditExpense={(item) => {
                            rbl.setEditingExpense({
                                ...item,
                                date: format(new Date(item.date), "yyyy-MM-dd")
                            })
                            rbl.setIsEditExpenseOpen(true)
                        }}
                        onDeleteExpense={rbl.handleDeleteExpense}
                    />
                </TabsContent>

                {/* Tab 3: Bulk Upload Foto Nota */}
                <TabsContent value="bulk-upload" className="space-y-4">
                    <BulkUploadTab
                        activeBudget={rbl.activeBudget}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        stagedFiles={bulkReceiptsHook.stagedFiles}
                        setStagedFiles={bulkReceiptsHook.setStagedFiles}
                        compressionStats={bulkReceiptsHook.compressionStats}
                        isCompressing={bulkReceiptsHook.isCompressing}
                        isUploading={bulkReceiptsHook.isUploading}
                        fileInputRef={bulkReceiptsHook.fileInputRef}
                        onFilesSelected={bulkReceiptsHook.handleFilesSelected}
                        onExecuteBulkUpload={bulkReceiptsHook.handleExecuteBulkUpload}
                        onDeleteAttachment={bulkReceiptsHook.handleDeleteAttachment}
                        onPreviewImage={rbl.setPreviewImage}
                        onOpenCreateBudget={() => {
                            rbl.setBudgetForm((prev) => ({
                                ...prev,
                                locationId: rbl.selectedLocation !== "all" ? rbl.selectedLocation : (userLocationId || locations[0]?.id || "")
                            }))
                            rbl.setIsCreateBudgetOpen(true)
                        }}
                    />
                </TabsContent>

                {/* Tab 4: Riwayat Periode */}
                <TabsContent value="history" className="space-y-4">
                    <HistoryTab
                        filteredHistory={rbl.filteredHistory}
                        historyTotalCount={rbl.history.length}
                        historySearch={rbl.historySearch}
                        setHistorySearch={rbl.setHistorySearch}
                        historyStatusFilter={rbl.historyStatusFilter}
                        setHistoryStatusFilter={rbl.setHistoryStatusFilter}
                        historyYearFilter={rbl.historyYearFilter}
                        setHistoryYearFilter={rbl.setHistoryYearFilter}
                        historyAvailableYears={rbl.historyAvailableYears}
                        onOpenDetail={rbl.handleOpenDetail}
                    />
                </TabsContent>

                {/* Tab 5: Master Kategori */}
                <TabsContent value="categories" className="space-y-4">
                    <CategoriesTab
                        categories={categoriesHook.categories}
                        onOpenCreateCategory={() => categoriesHook.handleOpenQuickCategory()}
                        onOpenEditCategory={categoriesHook.handleOpenEditCategory}
                        onDeleteCategory={categoriesHook.handleDeleteCategory}
                    />
                </TabsContent>

                {/* Tab 6: Laporan Kategori */}
                <TabsContent value="category-report" className="space-y-4">
                    <RblCategoryReport
                        categories={categoriesHook.categories}
                        locations={locations}
                        vehicles={vehicles}
                        userLocationId={userLocationId}
                        isSuperAdmin={isSuperAdmin}
                        embedded={true}
                    />
                </TabsContent>
            </Tabs>

            {/* Modal Dialogs */}
            <CreateBudgetDialog
                isOpen={rbl.isCreateBudgetOpen}
                onOpenChange={rbl.setIsCreateBudgetOpen}
                budgetForm={rbl.budgetForm}
                setBudgetForm={rbl.setBudgetForm}
                onSubmit={rbl.handleCreateBudgetSubmit}
                isSuperAdmin={isSuperAdmin}
                adminBranchName={rbl.adminBranchName}
                locations={locations}
                isPending={rbl.isPending}
            />

            <CloseBudgetDialog
                isOpen={rbl.isCloseBudgetOpen}
                onOpenChange={rbl.setIsCloseBudgetOpen}
                activeBudget={rbl.activeBudget}
                closeDate={rbl.closeDate}
                setCloseDate={rbl.setCloseDate}
                closeNotes={rbl.closeNotes}
                setCloseNotes={rbl.setCloseNotes}
                onSubmit={rbl.handleCloseBudgetSubmit}
                isPending={rbl.isPending}
            />

            <EditExpenseDialog
                isOpen={rbl.isEditExpenseOpen}
                onOpenChange={rbl.setIsEditExpenseOpen}
                editingExpense={rbl.editingExpense}
                setEditingExpense={rbl.setEditingExpense}
                budgetDateRange={rbl.budgetDateRange}
                categories={categoriesHook.categories}
                branchVehicles={rbl.branchVehicles}
                isHeadOfficeBudget={rbl.isHeadOfficeBudget}
                getVehiclePreviousKmInfo={batchExpensesHook.getVehiclePreviousKmInfo}
                onOpenQuickCategory={() => categoriesHook.handleOpenQuickCategory()}
                onSubmit={rbl.handleEditExpenseSubmit}
                isPending={rbl.isPending}
            />

            <CategoryModal
                isOpen={categoriesHook.isQuickCategoryOpen}
                onOpenChange={categoriesHook.setIsQuickCategoryOpen}
                mode={categoriesHook.categoryModalMode}
                form={categoriesHook.quickCategoryForm}
                setForm={categoriesHook.setQuickCategoryForm}
                onSave={categoriesHook.handleSaveCategory}
                isSubmitting={categoriesHook.isCategorySubmitting}
            />

            <BudgetDetailDialog
                isOpen={rbl.isDetailOpen}
                onOpenChange={rbl.setIsDetailOpen}
                budget={rbl.selectedDetailBudget}
                isLoading={rbl.isLoadingDetail}
                onPreviewImage={rbl.setPreviewImage}
            />

            <ImagePreviewDialog
                previewImage={rbl.previewImage}
                onClose={() => rbl.setPreviewImage(null)}
            />
        </div>
    )
}
