"use client"

import { useState, useTransition, useMemo, useCallback } from "react"
import { toast } from "sonner"
import { CreditItemDTO, CreditKPIStats, PaymentFormState, CreateCreditFormState } from "../types"
import {
    getCreditPageData,
    getCreditDetail,
    recordCreditPayment,
    cancelCreditPayment,
    createManualCreditObligation,
    syncApprovedCreditPurchaseOrders,
} from "../actions"

export function useKreditData(initialCredits: CreditItemDTO[], initialStats: CreditKPIStats) {
    const [credits, setCredits] = useState<CreditItemDTO[]>(initialCredits)
    const [stats, setStats] = useState<CreditKPIStats>(initialStats)
    const [isPending, startTransition] = useTransition()

    // Pagination
    const [currentPage, setCurrentPage] = useState<number>(1)
    const pageSize = 15

    // Modal States
    const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null)
    const [creditDetail, setCreditDetail] = useState<any | null>(null)
    const [detailLoading, setDetailLoading] = useState<boolean>(false)

    // Payment Form Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false)
    const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
        creditId: "",
        amount: "",
        paymentDate: new Date().toISOString().slice(0, 10),
        method: "TRANSFER",
        sourceAccount: "Rekening Operasional",
        referenceNo: "",
        notes: "",
        proofFile: null,
        proofUrl: "",
    })

    // Cancel Payment Dialog State
    const [cancelPaymentTarget, setCancelPaymentTarget] = useState<any | null>(null)
    const [cancelReason, setCancelReason] = useState<string>("")

    // Create Manual Credit Dialog State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
    const [createForm, setCreateForm] = useState<CreateCreditFormState>({
        supplierName: "",
        companyGroupId: "",
        allocationType: "BATCHING_PLANT",
        companyProjectId: "",
        locationId: "",
        totalAmount: "",
        creditDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        termDays: 30,
        notes: "",
        sourceAccount: "",
    })

    // Refresh data with current filters
    const refreshData = useCallback((activeFilters?: any) => {
        startTransition(async () => {
            const res = await getCreditPageData(activeFilters)
            if (res) {
                setCredits(res.credits)
                setStats(res.stats)
                setCurrentPage(1)
            }
        })
    }, [])

    // Open detail dialog & fetch fresh details
    const openDetail = useCallback(async (credit: CreditItemDTO) => {
        setSelectedCreditId(credit.id)
        setDetailLoading(true)
        const res = await getCreditDetail(credit.id)
        setDetailLoading(false)
        if (res.success) {
            setCreditDetail(res.data)
        } else {
            toast.error(res.error || "Gagal memuat detail kredit")
        }
    }, [])

    const closeDetail = useCallback(() => {
        setSelectedCreditId(null)
        setCreditDetail(null)
    }, [])

    // Open record payment modal
    const openRecordPayment = useCallback((credit: CreditItemDTO | any) => {
        setPaymentForm({
            creditId: credit.id,
            amount: String(credit.outstanding ?? ""),
            paymentDate: new Date().toISOString().slice(0, 10),
            method: "TRANSFER",
            sourceAccount: "Rekening Operasional Mandiri",
            referenceNo: "",
            notes: "",
            proofFile: null,
            proofUrl: "",
        })
        setIsPaymentModalOpen(true)
    }, [])

    // Handle Submit Payment
    const handleRecordPaymentSubmit = useCallback(async () => {
        const amt = parseFloat(paymentForm.amount)
        if (isNaN(amt) || amt <= 0) {
            toast.error("Nominal pembayaran tidak valid")
            return
        }

        startTransition(async () => {
            const res = await recordCreditPayment({
                creditId: paymentForm.creditId,
                amount: amt,
                paymentDate: paymentForm.paymentDate,
                method: paymentForm.method,
                sourceAccount: paymentForm.sourceAccount,
                referenceNo: paymentForm.referenceNo,
                proofUrl: paymentForm.proofUrl,
                notes: paymentForm.notes,
            })

            if (res.success) {
                toast.success("Pembayaran kredit berhasil dicatat!")
                setIsPaymentModalOpen(false)
                // Refresh detail if open
                if (selectedCreditId) {
                    const freshDetail = await getCreditDetail(selectedCreditId)
                    if (freshDetail.success) setCreditDetail(freshDetail.data)
                }
                refreshData()
            } else {
                toast.error(res.error || "Gagal mencatat pembayaran")
            }
        })
    }, [paymentForm, selectedCreditId, refreshData])

    // Handle Submit Cancel Payment
    const handleCancelPaymentSubmit = useCallback(async () => {
        if (!cancelPaymentTarget) return
        if (!cancelReason.trim()) {
            toast.error("Alasan pembatalan wajib diisi")
            return
        }

        startTransition(async () => {
            const res = await cancelCreditPayment(cancelPaymentTarget.id, cancelReason.trim())
            if (res.success) {
                toast.success("Pembayaran berhasil dibatalkan!")
                setCancelPaymentTarget(null)
                setCancelReason("")
                if (selectedCreditId) {
                    const freshDetail = await getCreditDetail(selectedCreditId)
                    if (freshDetail.success) setCreditDetail(freshDetail.data)
                }
                refreshData()
            } else {
                toast.error(res.error || "Gagal membatalkan pembayaran")
            }
        })
    }, [cancelPaymentTarget, cancelReason, selectedCreditId, refreshData])

    // Handle Manual Credit Submit
    const handleCreateCreditSubmit = useCallback(async () => {
        const amt = parseFloat(createForm.totalAmount)
        if (!createForm.supplierName.trim()) {
            toast.error("Nama supplier wajib diisi")
            return
        }
        if (!createForm.companyGroupId) {
            toast.error("Perusahaan penanggung wajib dipilih")
            return
        }
        if (isNaN(amt) || amt <= 0) {
            toast.error("Nominal kredit harus lebih besar dari 0")
            return
        }

        startTransition(async () => {
            const res = await createManualCreditObligation({
                supplierName: createForm.supplierName,
                companyGroupId: createForm.companyGroupId,
                allocationType: createForm.allocationType,
                companyProjectId: createForm.companyProjectId || undefined,
                locationId: createForm.locationId || undefined,
                totalAmount: amt,
                creditDate: createForm.creditDate,
                dueDate: createForm.dueDate || undefined,
                termDays: createForm.termDays,
                notes: createForm.notes,
            })

            if (res.success) {
                toast.success("Kewajiban kredit non-PO berhasil dibuat!")
                setIsCreateModalOpen(false)
                refreshData()
            } else {
                toast.error(res.error || "Gagal membuat kredit")
            }
        })
    }, [createForm, refreshData])

    // Trigger sync PO manually
    const handleSyncPos = useCallback(async () => {
        startTransition(async () => {
            const res = await syncApprovedCreditPurchaseOrders()
            if (res.success) {
                toast.success(`Sinkronisasi selesai! ${res.count ?? 0} PO baru terdaftar ke kredit.`)
                refreshData()
            } else {
                toast.error(res.error || "Gagal menyinkronkan PO")
            }
        })
    }, [refreshData])

    return {
        credits,
        stats,
        isPending,
        currentPage,
        setCurrentPage,
        pageSize,
        // Detail
        selectedCreditId,
        creditDetail,
        detailLoading,
        openDetail,
        closeDetail,
        // Payment
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        paymentForm,
        setPaymentForm,
        openRecordPayment,
        handleRecordPaymentSubmit,
        // Cancel
        cancelPaymentTarget,
        setCancelPaymentTarget,
        cancelReason,
        setCancelReason,
        handleCancelPaymentSubmit,
        // Create
        isCreateModalOpen,
        setIsCreateModalOpen,
        createForm,
        setCreateForm,
        handleCreateCreditSubmit,
        // Sync
        handleSyncPos,
        refreshData,
    }
}
