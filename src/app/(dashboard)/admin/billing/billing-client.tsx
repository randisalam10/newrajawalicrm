"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3 } from "lucide-react"
import { BillingDashboard } from "./billing-dashboard"
import { BillingFilterBar } from "./components/billing-filter-bar"
import { UnbilledTab } from "./components/tabs/unbilled-tab"
import { InvoicesTab } from "./components/tabs/invoices-tab"
import { DepositTab } from "./components/tabs/deposit-tab"
import { BillingModalsContainer } from "./components/modals/billing-modals-container"
import { useBillingFilter } from "./hooks/use-billing-filter"
import { useUnbilledPool } from "./hooks/use-unbilled-pool"
import { useInvoicesList } from "./hooks/use-invoices-list"
import { useBillingModals } from "./hooks/use-billing-modals"
import { BillingClientProps } from "./types"

export function BillingClient({
    initialData,
    locations,
    userRole,
    userLocationId,
    canManage = true
}: BillingClientProps) {
    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState("dashboard")

    const isCorporate = userRole === "SuperAdminBP" || ["CEO", "FVP", "Approver"].includes(userRole)
    const isSuperAdmin = userRole === "SuperAdminBP" || ["CEO", "FVP"].includes(userRole)

    const [showCancelledInvoices, setShowCancelledInvoices] = useState(false)

    // 1. Billing Filter & Data Synchronization Hook
    const filter = useBillingFilter({
        initialData,
        isCorporate,
        userLocationId,
        showCancelledInvoices,
    })

    // 2. Invoices List Hook (receives live filter.data.grouped)
    const invoicesHook = useInvoicesList(
        filter.data?.grouped ?? initialData?.grouped ?? [],
        showCancelledInvoices,
        setShowCancelledInvoices
    )

    // 3. Unbilled Pool Selection Hook
    const unbilledHook = useUnbilledPool(filter.data?.unbilled ?? [])

    // 4. Modals and Mutation Actions Hook
    const modals = useBillingModals({
        selectedTxList: unbilledHook.selectedTxList,
        clearSelectedTx: unbilledHook.clearSelectedTx,
        reload: filter.reload,
        allUnbilled: filter.data?.unbilled ?? [],
    })

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="space-y-4">
            {/* Filter Bar: Periode, Customer, Cabang */}
            <BillingFilterBar
                locations={locations}
                selectedLocation={filter.selectedLocation}
                onLocationChange={v => {
                    filter.setSelectedLocation(v)
                    filter.reload(v === "all" ? undefined : v, filter.startDate, filter.endDate, filter.selectedCustomerId)
                }}
                customerOptions={filter.customerOptions}
                selectedCustomerId={filter.selectedCustomerId}
                onCustomerChange={v => {
                    filter.setSelectedCustomerId(v)
                    filter.reload(filter.selectedLocation, filter.startDate, filter.endDate, v === "all" ? undefined : v)
                }}
                startDate={filter.startDate}
                endDate={filter.endDate}
                onDateChange={(s, e) => {
                    filter.setStartDate(s)
                    filter.setEndDate(e)
                }}
                onApply={filter.handleApplyFilter}
                onReset={filter.handleResetFilter}
                isLoading={filter.isLoading}
                isCorporate={isCorporate}
            />

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-slate-100/80 p-1 rounded-lg">
                    <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="unbilled" className="flex items-center gap-1.5 text-xs">
                        <span>Unbilled Pool</span>
                        {unbilledHook.filteredUnbilled.length > 0 && (
                            <span className="ml-1 bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.2 font-bold">
                                {unbilledHook.filteredUnbilled.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="flex items-center gap-1.5 text-xs">
                        <span>Invoice</span>
                        {invoicesHook.invoiceSummary.totalInvoice > 0 && (
                            <span className="ml-1 bg-blue-600 text-white text-[10px] rounded-full px-1.5 py-0.2 font-bold">
                                {invoicesHook.invoiceSummary.totalInvoice}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="deposit" className="text-xs">
                        <span>Deposito</span>
                    </TabsTrigger>
                </TabsList>

                {/* TAB 0: DASHBOARD */}
                <TabsContent value="dashboard" className="mt-4">
                    <BillingDashboard
                        unbilled={filter.data?.unbilled ?? []}
                        groupedInvoices={filter.data?.grouped ?? []}
                        deposits={filter.data?.deposits ?? []}
                        locations={locations}
                        selectedLocation={filter.selectedLocation}
                        onNavigateTab={(tab, navFilter) => {
                            setActiveTab(tab)
                            if (navFilter?.status) invoicesHook.setStatusFilter(navFilter.status)
                            if (navFilter?.type) unbilledHook.setUnbilledTypeFilter(navFilter.type)
                            if (navFilter?.ppnFilter) invoicesHook.setPpnFilter(navFilter.ppnFilter)
                            if (navFilter?.unbilledPpnFilter) {
                                unbilledHook.setUnbilledPpnFilter(navFilter.unbilledPpnFilter)
                                unbilledHook.setFilterNoPriceOnly(false)
                                unbilledHook.setUnbilledPage(1)
                            }
                            if (navFilter?.noPriceOnly !== undefined) {
                                unbilledHook.setFilterNoPriceOnly(navFilter.noPriceOnly)
                                if (navFilter.noPriceOnly) {
                                    unbilledHook.setUnbilledTypeFilter("ALL")
                                    unbilledHook.setUnbilledPpnFilter("all")
                                }
                                unbilledHook.setUnbilledPage(1)
                            }
                            if (navFilter?.search) {
                                if (tab === "unbilled") {
                                    unbilledHook.setUnbilledSearch(navFilter.search)
                                    unbilledHook.setUnbilledPage(1)
                                } else if (tab === "invoices") {
                                    invoicesHook.setInvoiceSearch(navFilter.search)
                                    invoicesHook.setInvoicePage(1)
                                }
                            }
                        }}
                        isCorporate={isCorporate}
                        isSuperAdmin={isSuperAdmin}
                    />
                </TabsContent>

                {/* TAB 1: UNBILLED POOL */}
                <TabsContent value="unbilled" className="mt-4">
                    <UnbilledTab
                        unbilled={filter.data?.unbilled ?? []}
                        filteredUnbilled={unbilledHook.filteredUnbilled}
                        groupedUnbilled={unbilledHook.groupedUnbilled}
                        displayedGroups={unbilledHook.displayedGroups}
                        selectedTxIds={unbilledHook.selectedTxIds}
                        unbilledSearch={unbilledHook.unbilledSearch}
                        setUnbilledSearch={unbilledHook.setUnbilledSearch}
                        unbilledTypeFilter={unbilledHook.unbilledTypeFilter}
                        setUnbilledTypeFilter={unbilledHook.setUnbilledTypeFilter}
                        unbilledPpnFilter={unbilledHook.unbilledPpnFilter}
                        setUnbilledPpnFilter={unbilledHook.setUnbilledPpnFilter}
                        filterNoPriceOnly={unbilledHook.filterNoPriceOnly}
                        setFilterNoPriceOnly={unbilledHook.setFilterNoPriceOnly}
                        groupBy={unbilledHook.groupBy}
                        setGroupBy={unbilledHook.setGroupBy}
                        unbilledPage={unbilledHook.unbilledPage}
                        setUnbilledPage={unbilledHook.setUnbilledPage}
                        unbilledPpnCount={unbilledHook.unbilledPpnCount}
                        unbilledNonPpnCount={unbilledHook.unbilledNonPpnCount}
                        noPriceTxCount={unbilledHook.noPriceTxCount}
                        isAllExpanded={unbilledHook.isAllExpanded}
                        toggleExpandAll={unbilledHook.toggleExpandAll}
                        isGroupExpanded={unbilledHook.isGroupExpanded}
                        toggleGroupExpand={unbilledHook.toggleGroupExpand}
                        selectGroup={unbilledHook.selectGroup}
                        selectAll={unbilledHook.selectAll}
                        toggleTx={unbilledHook.toggleTx}
                        canManage={canManage}
                        selectedTxList={unbilledHook.selectedTxList}
                        selectedVolume={unbilledHook.selectedVolume}
                        selectedDays={unbilledHook.selectedDays}
                        onOpenCreateDialog={modals.handleOpenCreateDialog}
                        UNBILLED_FLAT_PAGE_SIZE={unbilledHook.UNBILLED_FLAT_PAGE_SIZE}
                        UNBILLED_GROUP_PAGE_SIZE={unbilledHook.UNBILLED_GROUP_PAGE_SIZE}
                    />
                </TabsContent>

                {/* TAB 2: INVOICES */}
                <TabsContent value="invoices" className="mt-4">
                    <InvoicesTab
                        invoiceSummary={invoicesHook.invoiceSummary}
                        isSuperAdmin={isSuperAdmin}
                        invoiceSearch={invoicesHook.invoiceSearch}
                        setInvoiceSearch={invoicesHook.setInvoiceSearch}
                        invoiceSort={invoicesHook.invoiceSort}
                        setInvoiceSort={invoicesHook.setInvoiceSort}
                        statusFilter={invoicesHook.statusFilter}
                        setStatusFilter={invoicesHook.setStatusFilter}
                        ppnFilter={invoicesHook.ppnFilter}
                        setPpnFilter={invoicesHook.setPpnFilter}
                        showCancelledInvoices={showCancelledInvoices}
                        onToggleShowCancelled={() => {
                            const next = !showCancelledInvoices
                            setShowCancelledInvoices(next)
                            filter.reload(filter.selectedLocation, filter.startDate, filter.endDate, filter.selectedCustomerId, next)
                        }}
                        filteredFlatInvoices={invoicesHook.filteredFlatInvoices}
                        filteredCustomerHierarchy={invoicesHook.filteredCustomerHierarchy}
                        viewMode={invoicesHook.viewMode}
                        setViewMode={invoicesHook.setViewMode}
                        isCustomerExpanded={invoicesHook.isCustomerExpanded}
                        toggleCustomer={invoicesHook.toggleCustomer}
                        isProjectExpanded={invoicesHook.isProjectExpanded}
                        toggleProject={invoicesHook.toggleProject}
                        expandAll={invoicesHook.expandAll}
                        collapseAll={invoicesHook.collapseAll}
                        invoicePage={invoicesHook.invoicePage}
                        setInvoicePage={invoicesHook.setInvoicePage}
                        customerPage={invoicesHook.customerPage}
                        setCustomerPage={invoicesHook.setCustomerPage}
                        onOpenInvoice={modals.openInvoice}
                        PAGE_SIZE={invoicesHook.INVOICE_PAGE_SIZE}
                        CUSTOMER_PAGE_SIZE={invoicesHook.CUSTOMER_PAGE_SIZE}
                    />
                </TabsContent>

                {/* TAB 3: DEPOSIT */}
                <TabsContent value="deposit" className="mt-4">
                    <DepositTab
                        deposits={filter.data?.deposits ?? []}
                        depositPage={modals.depositPage}
                        setDepositPage={modals.setDepositPage}
                        canManage={canManage}
                        onOpenDepositDialog={dep => {
                            modals.setDepositTarget(dep)
                            modals.setShowDepositDialog(true)
                        }}
                        PAGE_SIZE={25}
                    />
                </TabsContent>
            </Tabs>

            {/* MODALS CONTAINER */}
            <BillingModalsContainer
                showCreateDialog={modals.showCreateDialog}
                setShowCreateDialog={modals.setShowCreateDialog}
                selectedTxList={unbilledHook.selectedTxList}
                selectedVolume={unbilledHook.selectedVolume}
                selectedDays={unbilledHook.selectedDays}
                invoiceForm={modals.invoiceForm}
                setInvoiceForm={modals.setInvoiceForm}
                customerSeqDefault={modals.customerSeqDefault}
                createLoading={modals.createLoading}
                createError={modals.createError}
                onCreateInvoiceSubmit={modals.handleCreateInvoice}

                selectedInvoice={modals.selectedInvoice}
                setSelectedInvoice={modals.setSelectedInvoice}
                invoiceDetail={modals.invoiceDetail}
                sheetLoading={modals.sheetLoading}
                canManage={canManage}
                showCancelledPayments={modals.showCancelledPayments}
                setShowCancelledPayments={modals.setShowCancelledPayments}
                uploadingProofPaymentId={modals.uploadingProofPaymentId}
                onDirectProofUpload={modals.handleDirectProofUpload}
                onOpenPaymentDialog={() => modals.setShowPaymentDialog(true)}
                onOpenCancelInvoice={() => modals.setShowCancelInvoiceDialog(true)}
                onCancelPaymentTarget={payment => {
                    modals.setCancelPaymentTarget(payment)
                    modals.setCancelPaymentReason("")
                }}
                onPreviewProof={url => modals.setProofPreviewModalUrl(url)}

                showPaymentDialog={modals.showPaymentDialog}
                setShowPaymentDialog={modals.setShowPaymentDialog}
                paymentForm={modals.paymentForm}
                setPaymentForm={modals.setPaymentForm}
                compressionInfo={modals.compressionInfo}
                paymentLoading={modals.paymentLoading}
                onProofFileSelected={modals.handleProofFileSelected}
                onRecordPaymentSubmit={modals.handleRecordPayment}

                showCancelInvoiceDialog={modals.showCancelInvoiceDialog}
                setShowCancelInvoiceDialog={modals.setShowCancelInvoiceDialog}
                cancelInvoiceReason={modals.cancelInvoiceReason}
                setCancelInvoiceReason={modals.setCancelInvoiceReason}
                cancelInvoiceLoading={modals.cancelInvoiceLoading}
                onCancelInvoiceSubmit={modals.handleCancelInvoice}

                cancelPaymentTarget={modals.cancelPaymentTarget}
                onCloseCancelPayment={() => modals.setCancelPaymentTarget(null)}
                cancelPaymentReason={modals.cancelPaymentReason}
                setCancelPaymentReason={modals.setCancelPaymentReason}
                cancelPaymentLoading={modals.cancelPaymentLoading}
                onCancelPaymentSubmit={modals.handleCancelPayment}

                showDepositDialog={modals.showDepositDialog}
                setShowDepositDialog={modals.setShowDepositDialog}
                depositTarget={modals.depositTarget}
                depositForm={modals.depositForm}
                setDepositForm={modals.setDepositForm}
                depositLoading={modals.depositLoading}
                onDepositSubmit={modals.handleAddDeposit}

                proofPreviewModalUrl={modals.proofPreviewModalUrl}
                onCloseProofPreview={() => modals.setProofPreviewModalUrl(null)}
            />
        </div>
    )
}
