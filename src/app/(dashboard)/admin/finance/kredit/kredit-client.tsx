"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KreditClientProps } from "./types"
import { useKreditFilters } from "./hooks/use-kredit-filters"
import { useKreditData } from "./hooks/use-kredit-data"
import { CreditKpiSummary } from "./components/sections/credit-kpi-summary"
import { CreditFilterBar } from "./components/sections/credit-filter-bar"
import { CreditListTab } from "./components/tabs/credit-list-tab"
import { CreditDashboardTab } from "./components/tabs/credit-dashboard-tab"
import { CreditDetailDialog } from "./components/modals/credit-detail-dialog"
import { RecordCreditPaymentDialog } from "./components/modals/record-credit-payment-dialog"
import { CancelCreditPaymentDialog } from "./components/modals/cancel-credit-payment-dialog"
import { CreateCreditDialog } from "./components/modals/create-credit-dialog"
import { LayoutDashboard, Receipt, Landmark } from "lucide-react"

export function KreditClient({
    initialCredits,
    initialStats,
    companies,
    suppliers,
    locations,
    projects,
    userRole,
    userPermissions,
}: KreditClientProps) {
    const [activeTab, setActiveTab] = useState<string>("list")

    // Filter Hook
    const {
        filters,
        setFilters,
        setDatePreset,
        resetFilters,
        isFiltered,
    } = useKreditFilters()

    // Data & Operations Hook
    const {
        credits,
        stats,
        isPending,
        currentPage,
        setCurrentPage,
        pageSize,
        selectedCreditId,
        creditDetail,
        detailLoading,
        openDetail,
        closeDetail,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        paymentForm,
        setPaymentForm,
        openRecordPayment,
        handleRecordPaymentSubmit,
        cancelPaymentTarget,
        setCancelPaymentTarget,
        cancelReason,
        setCancelReason,
        handleCancelPaymentSubmit,
        isCreateModalOpen,
        setIsCreateModalOpen,
        createForm,
        setCreateForm,
        handleCreateCreditSubmit,
        handleSyncPos,
        refreshData,
    } = useKreditData(initialCredits, initialStats)

    // User permissions check
    const isSuperAdmin = userRole === "SuperAdminBP"
    const canManage = isSuperAdmin || userPermissions.includes("FINANCE_CREDIT_PAY") || userPermissions.includes("FINANCE_CREDIT_MANAGE")

    const handleApplyFilters = () => {
        refreshData(filters)
    }

    const handleAllocationQuickSwitch = (alloc: typeof filters.allocationType) => {
        const nextFilters = {
            ...filters,
            allocationType: alloc,
            companyProjectId: alloc === "BATCHING_PLANT" || alloc === "HOLDING" ? "ALL" : filters.companyProjectId,
            locationId: alloc === "PROJECT" || alloc === "HOLDING" ? "ALL" : filters.locationId,
        }
        setFilters(nextFilters)
        refreshData(nextFilters)
    }

    return (
        <div className="space-y-4 w-full pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-blue-600" />
                        <span>Manajemen Keuangan: Kredit & Kewajiban</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Pencatatan, pemantauan jatuh tempo, dan pelunasan kewajiban kredit pengadaan serta beban usaha perusahaan.
                    </p>
                </div>
            </div>

            {/* Top KPI Stat Summary Cards */}
            <CreditKpiSummary stats={stats} />

            {/* Filter Bar */}
            <CreditFilterBar
                filters={filters}
                setFilters={setFilters}
                setDatePreset={setDatePreset}
                resetFilters={resetFilters}
                isFiltered={isFiltered}
                companies={companies}
                suppliers={suppliers}
                locations={locations}
                projects={projects}
                onApply={handleApplyFilters}
                onSyncPos={handleSyncPos}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                isPending={isPending}
                canManage={canManage}
            />

            {/* Main Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
                <TabsList className="bg-slate-100/90 p-1 border border-slate-200 rounded-lg">
                    <TabsTrigger value="list" className="text-xs font-semibold gap-1.5 cursor-pointer">
                        <Receipt className="w-3.5 h-3.5" />
                        Daftar Kewajiban Kredit ({credits.length})
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" className="text-xs font-semibold gap-1.5 cursor-pointer">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Executive Dashboard
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Credit List Table */}
                <TabsContent value="list" className="mt-0">
                    <CreditListTab
                        credits={credits}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        pageSize={pageSize}
                        onOpenDetail={openDetail}
                        onOpenPayment={openRecordPayment}
                        canManage={canManage}
                        currentAllocation={filters.allocationType}
                        onAllocationChange={handleAllocationQuickSwitch}
                    />
                </TabsContent>

                {/* Tab 2: Executive Dashboard */}
                <TabsContent value="dashboard" className="mt-0">
                    <CreditDashboardTab stats={stats} />
                </TabsContent>
            </Tabs>

            {/* Modals & Dialogs */}
            <CreditDetailDialog
                open={Boolean(selectedCreditId)}
                onOpenChange={open => { if (!open) closeDetail(); }}
                creditDetail={creditDetail}
                detailLoading={detailLoading}
                onOpenPayment={openRecordPayment}
                onCancelPaymentTarget={payment => setCancelPaymentTarget(payment)}
                canManage={canManage}
            />

            <RecordCreditPaymentDialog
                open={isPaymentModalOpen}
                onOpenChange={setIsPaymentModalOpen}
                paymentForm={paymentForm}
                setPaymentForm={setPaymentForm}
                onSubmit={handleRecordPaymentSubmit}
                isPending={isPending}
                maxAmount={creditDetail?.id === paymentForm.creditId ? creditDetail.outstanding : undefined}
            />

            <CancelCreditPaymentDialog
                payment={cancelPaymentTarget}
                open={Boolean(cancelPaymentTarget)}
                onOpenChange={open => { if (!open) { setCancelPaymentTarget(null); setCancelReason(""); } }}
                reason={cancelReason}
                setReason={setCancelReason}
                onSubmit={handleCancelPaymentSubmit}
                isPending={isPending}
            />

            <CreateCreditDialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                createForm={createForm}
                setCreateForm={setCreateForm}
                companies={companies}
                locations={locations}
                projects={projects}
                onSubmit={handleCreateCreditSubmit}
                isPending={isPending}
            />
        </div>
    )
}
