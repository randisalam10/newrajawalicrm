"use client"

import React, { useState, useEffect } from "react"
import { updatePoStatus, getPurchaseOrders, getPurchaseOrderById, submitPurchaseOrder } from "./actions"
import { POListClientProps, PODateFilterMode } from "./types"
import { POFilterBar } from "./components/po-filter-bar"
import { POTable } from "./components/po-table"
import { POPagination } from "./components/po-pagination"
import { PODetailDialog } from "./components/modals/po-detail-dialog"

export function POListClient({ 
    initialData, 
    totalCount: initialTotal, 
    totalPages: initialTotalPages,
    userRole,
    userPermissions = [],
    companies,
    categories
}: POListClientProps) {
    const [orders, setOrders] = useState(initialData)
    const [totalCount, setTotalCount] = useState(initialTotal)
    const [totalPages, setTotalPages] = useState(initialTotalPages)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [companyId, setCompanyId] = useState("ALL")
    const [categoryId, setCategoryId] = useState("ALL")
    const [paymentMethod, setPaymentMethod] = useState("ALL")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [dateMode, setDateMode] = useState<PODateFilterMode>("ALL")
    const [specificDate, setSpecificDate] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // Detail Dialog State
    const [selectedPoId, setSelectedPoId] = useState<string | null>(null)
    const [detailPo, setDetailPo] = useState<any | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState<string | null>(null)

    const canApprove = ['SuperAdminBP', 'AdminBP', 'AdminLogistik', 'CEO', 'FVP', 'Approver'].includes(userRole) || userPermissions.includes('LOGISTIK_APPROVE')
    const canManagePo = ['SuperAdminBP', 'AdminLogistik', 'AdminBP'].includes(userRole) || userPermissions.includes('LOGISTIK_CREATE') || userPermissions.includes('LOGISTIK_EDIT')

    const fetchData = async (
        p: number, 
        s: string, 
        cid: string, 
        catid: string,
        pm: string,
        st: string,
        dm: PODateFilterMode,
        sd: string,
        ed: string,
        spDate: string
    ) => {
        setIsLoading(true)
        try {
            let startArg: string | undefined = undefined
            let endArg: string | undefined = undefined

            if (dm === "SPECIFIC" && spDate) {
                startArg = spDate
                endArg = spDate
            } else if (dm === "RANGE") {
                startArg = sd || undefined
                endArg = ed || undefined
            }

            const result = await getPurchaseOrders({
                page: p,
                pageSize: 10,
                search: s || undefined,
                companyGroupId: cid === "ALL" ? undefined : cid,
                categoryId: catid === "ALL" ? undefined : catid,
                paymentMethod: pm === "ALL" ? undefined : pm,
                status: st === "ALL" ? undefined : st,
                startDate: startArg,
                endDate: endArg,
            })
            setOrders(result.orders)
            setTotalCount(result.totalCount)
            setTotalPages(result.totalPages)
        } catch (error) {
            console.error("Fetch orders error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const reloadData = () => {
        fetchData(page, search, companyId, categoryId, paymentMethod, statusFilter, dateMode, startDate, endDate, specificDate)
    }

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchData(page, search, companyId, categoryId, paymentMethod, statusFilter, dateMode, startDate, endDate, specificDate)
        }, 350)
        return () => clearTimeout(timeout)
    }, [page, search, companyId, categoryId, paymentMethod, statusFilter, dateMode, startDate, endDate, specificDate])

    const resetFilters = () => {
        setSearch("")
        setCompanyId("ALL")
        setCategoryId("ALL")
        setPaymentMethod("ALL")
        setStatusFilter("ALL")
        setDateMode("ALL")
        setSpecificDate("")
        setStartDate("")
        setEndDate("")
        setPage(1)
    }

    const hasActiveFilters = search || companyId !== "ALL" || categoryId !== "ALL" || paymentMethod !== "ALL" || statusFilter !== "ALL" || dateMode !== "ALL"

    const openDetail = async (id: string) => {
        setSelectedPoId(id)
        setDetailLoading(true)
        setDetailError(null)
        try {
            const res = await getPurchaseOrderById(id)
            if (res.success && res.data) {
                setDetailPo(res.data)
            } else {
                setDetailError(res.error || "Gagal memuat rincian PO")
            }
        } catch (err: any) {
            console.error("Failed to load PO detail", err)
            setDetailError(err?.message || "Terjadi kesalahan saat memuat data")
        } finally {
            setDetailLoading(false)
        }
    }

    const handleSubmitPo = async (id: string, poNumber: string) => {
        if (!confirm(`Ajukan PO "${poNumber}" untuk persetujuan pimpinan / approver?`)) return
        const res = await submitPurchaseOrder(id)
        if (res.success) {
            reloadData()
        } else {
            alert(`Gagal mengajukan: ${res.error}`)
        }
    }

    const handleApprovePo = async (id: string, poNumber: string) => {
        if (!confirm(`Setujui PO "${poNumber}" (Bypass Administratif) sebagai ${userRole}?`)) return
        const res = await updatePoStatus(id, "APPROVED")
        if (res.success) {
            setSelectedPoId(null)
            setDetailPo(null)
            reloadData()
        } else {
            alert(`Gagal: ${res.error}`)
        }
    }

    const handleCancelPo = async (id: string) => {
        const reason = prompt("Masukkan alasan pembatalan / penolakan:")
        if (reason === null) return
        const res = await updatePoStatus(id, "CANCELLED", { notes: reason })
        if (res.success) {
            reloadData()
        } else {
            alert(`Gagal: ${res.error}`)
        }
    }

    return (
        <div className="space-y-3.5 p-4">
            {/* ── FILTER & SEARCH SECTION ── */}
            <POFilterBar
                search={search}
                setSearch={setSearch}
                companyId={companyId}
                setCompanyId={setCompanyId}
                categoryId={categoryId}
                setCategoryId={setCategoryId}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                dateMode={dateMode}
                setDateMode={setDateMode}
                specificDate={specificDate}
                setSpecificDate={setSpecificDate}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                setPage={setPage}
                companies={companies}
                categories={categories}
                canManagePo={canManagePo}
                hasActiveFilters={!!hasActiveFilters}
                resetFilters={resetFilters}
            />

            {/* ── COMPACT PO TABLE ── */}
            <POTable
                orders={orders}
                isLoading={isLoading}
                hasActiveFilters={!!hasActiveFilters}
                canManagePo={canManagePo}
                canApprove={canApprove}
                userRole={userRole}
                onOpenDetail={openDetail}
                onSubmitPo={handleSubmitPo}
                onApprovePo={handleApprovePo}
                onCancelPo={handleCancelPo}
            />

            {/* ── PAGINATION BAR ── */}
            <POPagination
                page={page}
                totalPages={totalPages}
                currentCount={orders.length}
                totalCount={totalCount}
                isLoading={isLoading}
                onPageChange={setPage}
            />

            {/* ── DETAIL MODAL DIALOG ── */}
            <PODetailDialog
                open={!!selectedPoId}
                onClose={() => {
                    setSelectedPoId(null)
                    setDetailPo(null)
                    setDetailError(null)
                }}
                selectedPoId={selectedPoId}
                detailPo={detailPo}
                detailLoading={detailLoading}
                detailError={detailError}
                canApprove={canApprove}
                userRole={userRole}
                onRetry={openDetail}
                onApprove={handleApprovePo}
            />
        </div>
    )
}
