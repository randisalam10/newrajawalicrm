"use client"

import React, { useTransition } from "react"
import { toast } from "sonner"
import {
    CustomerWithProjects,
    LocationItem,
    ConcreteQualityItem,
    CustomerProject,
} from "./types"
import { useCustomer } from "./hooks/use-customer"
import { CustomerStatsCards } from "./components/customer-stats"
import { CustomerFilterBar } from "./components/customer-filter-bar"
import { CustomerTable } from "./components/customer-table"
import { CustomerDialog } from "./components/customer-dialog"
import { ProjectDialog } from "./components/project-dialog"
import {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createProject,
    updateProject,
    deleteProject,
} from "./actions"

interface CustomerClientProps {
    initialData: CustomerWithProjects[]
    locations: LocationItem[]
    userRole: string
    qualities?: ConcreteQualityItem[]
    canCreate?: boolean
    canEdit?: boolean
    canDelete?: boolean
}

export function CustomerClient({
    initialData,
    locations,
    userRole,
    qualities = [],
    canCreate = true,
    canEdit = true,
    canDelete = true,
}: CustomerClientProps) {
    const isCorporate =
        userRole === "SuperAdminBP" || ["CEO", "FVP", "Approver"].includes(userRole)
    const [isPending, startTransition] = useTransition()

    const {
        filteredCount,
        totalCustomers,
        paginated,
        currentPage,
        totalPages,
        setCurrentPage,
        search,
        setSearch,
        locationId,
        setLocationId,
        projectStatus,
        setProjectStatus,
        sortKey,
        sortDir,
        handleSort,
        resetFilters,
        hasActiveFilters,
        stats,
        expandedCustomer,
        setExpandedCustomer,
        expandedProject,
        setExpandedProject,
        dialogMode,
        setDialogMode,
        editData,
        setEditData,
        parentCustomer,
        setParentCustomer,
        selectedSharedLocs,
        toggleSharedLoc,
        priceForm,
        setPriceForm,
        priceLoading,
        setPriceLoading,
    } = useCustomer({ initialData })

    // ── Customer Handlers ──
    async function handleCustomerSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                selectedSharedLocs.forEach((id) => formData.append("sharedLocationIds", id))

                const result =
                    dialogMode === "customerEdit"
                        ? await updateCustomer(editData.id, formData)
                        : await createCustomer(formData)

                if (result.success) {
                    toast.success(
                        dialogMode === "customerEdit"
                            ? "Customer berhasil diperbarui"
                            : "Customer berhasil ditambahkan"
                    )
                    setDialogMode(null)
                    setEditData(null)
                } else {
                    toast.error(
                        typeof result.error === "string"
                            ? result.error
                            : "Gagal menyimpan data customer"
                    )
                }
            } catch (err: any) {
                toast.error(err?.message || "Terjadi kesalahan sistem")
            }
        })
    }

    async function handleCustomerDelete(id: string) {
        if (!confirm("Hapus customer ini? Semua proyek di bawahnya juga akan ikut terhapus."))
            return

        startTransition(async () => {
            try {
                const result = await deleteCustomer(id)
                if (result.success) {
                    toast.success("Customer berhasil dihapus")
                } else {
                    toast.error(result.error || "Gagal menghapus customer")
                }
            } catch (err: any) {
                toast.error("Gagal menghapus customer: " + err?.message)
            }
        })
    }

    // ── Project Handlers ──
    async function handleProjectSubmit(formData: FormData) {
        startTransition(async () => {
            try {
                selectedSharedLocs.forEach((id) => formData.append("sharedLocationIds", id))

                const result =
                    dialogMode === "projectEdit"
                        ? await updateProject(editData.id, formData)
                        : await createProject(formData)

                if (result.success) {
                    toast.success(
                        dialogMode === "projectEdit"
                            ? "Proyek berhasil diperbarui"
                            : "Proyek baru berhasil ditambahkan"
                    )
                    setDialogMode(null)
                    setEditData(null)
                } else {
                    toast.error(
                        typeof result.error === "string"
                            ? result.error
                            : "Gagal menyimpan proyek"
                    )
                }
            } catch (err: any) {
                toast.error(err?.message || "Terjadi kesalahan saat menyimpan proyek")
            }
        })
    }

    async function handleProjectDelete(id: string) {
        if (!confirm("Hapus proyek ini?")) return

        startTransition(async () => {
            try {
                const result = await deleteProject(id)
                if (result.success) {
                    toast.success("Proyek berhasil dihapus")
                } else {
                    toast.error(result.error || "Gagal menghapus proyek")
                }
            } catch (err: any) {
                toast.error("Gagal menghapus proyek: " + err?.message)
            }
        })
    }

    const isCustomerDialogOpen =
        dialogMode === "customerNew" || dialogMode === "customerEdit"
    const isProjectDialogOpen =
        dialogMode === "projectNew" || dialogMode === "projectEdit"

    return (
        <div className="space-y-4">
            {/* 1. Summary Cards */}
            <CustomerStatsCards
                stats={stats}
                currentFilter={projectStatus}
                onSelectFilter={setProjectStatus}
            />

            {/* 2. Filter Bar */}
            <CustomerFilterBar
                search={search}
                onSearchChange={setSearch}
                locationId={locationId}
                onLocationChange={setLocationId}
                projectStatus={projectStatus}
                onProjectStatusChange={setProjectStatus}
                locations={locations}
                isCorporate={isCorporate}
                filteredCount={filteredCount}
                totalCount={totalCustomers}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={resetFilters}
                canCreate={canCreate}
                onOpenCreateCustomer={() => {
                    setEditData(null)
                    setDialogMode("customerNew")
                }}
            />

            {/* 3. Customer & Project Table */}
            <CustomerTable
                customers={paginated}
                isCorporate={isCorporate}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                qualities={qualities}
                expandedCustomer={expandedCustomer}
                setExpandedCustomer={setExpandedCustomer}
                expandedProject={expandedProject}
                setExpandedProject={setExpandedProject}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onOpenEditCustomer={(cust) => {
                    setEditData(cust)
                    setDialogMode("customerEdit")
                }}
                onDeleteCustomer={handleCustomerDelete}
                onOpenCreateProject={(cust) => {
                    setParentCustomer(cust)
                    setEditData(null)
                    setExpandedCustomer(cust.id)
                    setDialogMode("projectNew")
                }}
                onOpenEditProject={(cust, proj) => {
                    setParentCustomer(cust)
                    setEditData(proj)
                    setDialogMode("projectEdit")
                }}
                onDeleteProject={handleProjectDelete}
                priceForm={priceForm}
                setPriceForm={setPriceForm}
                priceLoading={priceLoading}
                setPriceLoading={setPriceLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                totalFiltered={filteredCount}
                onPageChange={setCurrentPage}
            />

            {/* 4. Modals */}
            <CustomerDialog
                open={isCustomerDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setDialogMode(null)
                        setEditData(null)
                    }
                }}
                editData={dialogMode === "customerEdit" ? editData : null}
                locations={locations}
                userRole={userRole}
                selectedSharedLocs={selectedSharedLocs}
                onToggleSharedLoc={toggleSharedLoc}
                onSubmit={handleCustomerSubmit}
            />

            <ProjectDialog
                open={isProjectDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setDialogMode(null)
                        setEditData(null)
                    }
                }}
                editData={dialogMode === "projectEdit" ? editData : null}
                parentCustomer={parentCustomer}
                locations={locations}
                selectedSharedLocs={selectedSharedLocs}
                onToggleSharedLoc={toggleSharedLoc}
                onSubmit={handleProjectSubmit}
            />
        </div>
    )
}
