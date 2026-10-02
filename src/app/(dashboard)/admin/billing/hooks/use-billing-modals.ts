import { useState, useCallback } from "react"
import { format } from "date-fns"
import {
    createInvoice, recordPayment, updatePaymentProof,
    cancelInvoice, cancelPayment, addDeposit,
    getInvoiceDetail, getCustomerInvoiceSeq
} from "../actions"
import { compressImage } from "@/lib/image-compress"
import { PaymentFormState, CompressionInfo, DepositFormState, InvoiceFormState } from "../types"

function extractInitials(customerName: string): string {
    const stripped = customerName
        .replace(/^(pt\.|pt|cv\.|cv|pak|bu)\s*/i, "")
        .trim()
    return stripped
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 4)
}

interface UseBillingModalsProps {
    selectedTxList: any[]
    clearSelectedTx: () => void
    reload: () => Promise<void>
    allUnbilled: any[]
}

export function useBillingModals({
    selectedTxList,
    clearSelectedTx,
    reload,
    allUnbilled,
}: UseBillingModalsProps) {
    // 1. Invoice Detail Sheet
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [invoiceDetail, setInvoiceDetail] = useState<any>(null)
    const [sheetLoading, setSheetLoading] = useState(false)

    const openInvoice = useCallback(async (inv: any) => {
        setSelectedInvoice(inv)
        setSheetLoading(true)
        try {
            const detail = await getInvoiceDetail(inv.id)
            setInvoiceDetail(detail)
        } catch (e) {
            console.error("Gagal mengambil detail invoice:", e)
        } finally {
            setSheetLoading(false)
        }
    }, [])

    // 2. Create Invoice Dialog
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState>({
        initialsOverride: "", customerSeqOverride: "", includePpn: true, dueDate: "", notes: ""
    })
    const [customerSeqDefault, setCustomerSeqDefault] = useState<number | null>(null)
    const [createLoading, setCreateLoading] = useState(false)
    const [createError, setCreateError] = useState("")

    const handleOpenCreateDialog = useCallback(async () => {
        setCreateError("")
        const firstTx = selectedTxList[0]
        const custId = firstTx?.customerId || firstTx?.customer?.id || firstTx?.project?.customerId || firstTx?.project?.customer?.id
        const custName = firstTx?.customer?.customer_name || firstTx?.project?.customer?.customer_name || ""
        
        // Auto-detect PPN from selected transactions
        const hasPpn = selectedTxList.some((tx: any) => {
            if (tx.itemType === "SEWA") {
                return tx.is_ppn === true || (tx.ppn_mode && tx.ppn_mode !== "NON_PPN")
            }
            return Boolean(tx.project?.tax_ppn && tx.project.tax_ppn > 0)
        })

        if (custId) {
            const seq = await getCustomerInvoiceSeq(custId)
            setCustomerSeqDefault(seq)
            setInvoiceForm(f => ({
                ...f,
                includePpn: hasPpn,
                initialsOverride: extractInitials(custName),
                customerSeqOverride: String(seq),
            }))
        } else {
            setInvoiceForm(f => ({
                ...f,
                includePpn: hasPpn,
            }))
        }
        setShowCreateDialog(true)
    }, [selectedTxList])

    const handleCreateInvoice = useCallback(async () => {
        if (selectedTxList.length === 0) return
        const firstTx = selectedTxList[0]
        const custId = firstTx.customerId || firstTx.customer?.id || firstTx.project?.customerId || firstTx.project?.customer?.id
        const allSameCustomer = selectedTxList.every(tx => {
            const cId = tx.customerId || tx.customer?.id || tx.project?.customerId || tx.project?.customer?.id
            return cId === custId
        })
        if (!allSameCustomer) {
            setCreateError("Pilih transaksi dari 1 customer yang sama.")
            return
        }

        const readyMixTxIds = selectedTxList.filter(tx => tx.itemType === "READYMIX").map(tx => tx.id)
        const hasMissingPrices = readyMixTxIds.some(id => {
            const tx = allUnbilled.find((t: any) => t.id === id)
            if (!tx || tx.itemType === "SEWA") return false
            const price = tx.project?.prices?.find((p: any) => p.qualityId === tx.qualityId)
            return !price
        })

        if (readyMixTxIds.length > 0 && hasMissingPrices) {
            setCreateError("Ada mutu beton yang belum memiliki harga. Set harga di menu Customer terlebih dahulu.")
            return
        }

        setCreateError("")
        setCreateLoading(true)
        const res = await createInvoice({
            projectId: firstTx.projectId,
            transactionIds: selectedTxList.map(tx => tx.id),
            initialsOverride: invoiceForm.initialsOverride || undefined,
            customerSeqOverride: invoiceForm.customerSeqOverride ? Number(invoiceForm.customerSeqOverride) : undefined,
            includePpn: invoiceForm.includePpn,
            dueDate: invoiceForm.dueDate || undefined,
            notes: invoiceForm.notes || undefined,
        })
        setCreateLoading(false)
        if (res.success) {
            setShowCreateDialog(false)
            clearSelectedTx()
            await reload()
        } else {
            setCreateError(res.error ?? "Gagal membuat invoice")
        }
    }, [selectedTxList, allUnbilled, invoiceForm, clearSelectedTx, reload])

    // 3. Record Payment & Proof
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
        amount: "",
        method: "TRANSFER",
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        referenceNo: "",
        notes: "",
        proofFile: null,
        proofUrl: ""
    })
    const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null)
    const [paymentLoading, setPaymentLoading] = useState(false)
    const [uploadingProofPaymentId, setUploadingProofPaymentId] = useState<string | null>(null)
    const [proofPreviewModalUrl, setProofPreviewModalUrl] = useState<string | null>(null)

    const handleProofFileSelected = useCallback(async (file: File | null) => {
        if (!file) {
            setPaymentForm(f => ({ ...f, proofFile: null, proofUrl: "" }))
            setCompressionInfo(null)
            return
        }

        if (file.type.startsWith("image/")) {
            try {
                const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 })
                const previewUrl = URL.createObjectURL(compressed)
                setCompressionInfo({
                    origSize: file.size,
                    compSize: compressed.size,
                    previewUrl,
                })
                setPaymentForm(f => ({ ...f, proofFile: compressed }))
            } catch {
                setPaymentForm(f => ({ ...f, proofFile: file }))
            }
        } else {
            setPaymentForm(f => ({ ...f, proofFile: file }))
            setCompressionInfo(null)
        }
    }, [])

    const handleDirectProofUpload = useCallback(async (paymentId: string, file: File) => {
        setUploadingProofPaymentId(paymentId)
        try {
            let fileToUpload = file
            if (file.type.startsWith("image/")) {
                fileToUpload = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 })
            }
            const fd = new FormData()
            fd.append("file", fileToUpload)
            fd.append("folder", "payments")
            const up = await fetch("/api/upload", { method: "POST", body: fd })
            const json = await up.json()
            if (json.url) {
                await updatePaymentProof(paymentId, json.url)
                if (invoiceDetail) {
                    const detail = await getInvoiceDetail(invoiceDetail.id)
                    setInvoiceDetail(detail)
                }
                await reload()
            }
        } catch (e: any) {
            console.error("Gagal mengunggah bukti bayar:", e)
        } finally {
            setUploadingProofPaymentId(null)
        }
    }, [invoiceDetail, reload])

    const handleRecordPayment = useCallback(async () => {
        if (!invoiceDetail) return
        setPaymentLoading(true)
        let proofUrl = paymentForm.proofUrl || undefined
        if (paymentForm.proofFile) {
            const fd = new FormData()
            fd.append("file", paymentForm.proofFile)
            fd.append("folder", "payments")
            const up = await fetch("/api/upload", { method: "POST", body: fd })
            const json = await up.json()
            if (json.url) proofUrl = json.url
        }
        const res = await recordPayment({
            invoiceId: invoiceDetail.id,
            amount: Number(paymentForm.amount),
            method: paymentForm.method,
            referenceNo: paymentForm.referenceNo || undefined,
            proofUrl,
            notes: paymentForm.notes || undefined,
            paymentDate: paymentForm.paymentDate || format(new Date(), "yyyy-MM-dd"),
        })
        setPaymentLoading(false)
        if (res.success) {
            setShowPaymentDialog(false)
            setPaymentForm({
                amount: "",
                method: "TRANSFER",
                paymentDate: format(new Date(), "yyyy-MM-dd"),
                referenceNo: "",
                notes: "",
                proofFile: null,
                proofUrl: ""
            })
            setCompressionInfo(null)
            const detail = await getInvoiceDetail(invoiceDetail.id)
            setInvoiceDetail(detail)
            await reload()
        }
    }, [invoiceDetail, paymentForm, reload])

    // 4. Cancel Invoice & Payment
    const [showCancelInvoiceDialog, setShowCancelInvoiceDialog] = useState(false)
    const [cancelInvoiceReason, setCancelInvoiceReason] = useState("")
    const [cancelInvoiceLoading, setCancelInvoiceLoading] = useState(false)
    const [cancelPaymentTarget, setCancelPaymentTarget] = useState<any>(null)
    const [cancelPaymentReason, setCancelPaymentReason] = useState("")
    const [cancelPaymentLoading, setCancelPaymentLoading] = useState(false)
    const [showCancelledPayments, setShowCancelledPayments] = useState(false)

    const handleCancelInvoice = useCallback(async () => {
        if (!invoiceDetail || !cancelInvoiceReason.trim()) return
        setCancelInvoiceLoading(true)
        await cancelInvoice(invoiceDetail.id, cancelInvoiceReason.trim())
        setCancelInvoiceLoading(false)
        setShowCancelInvoiceDialog(false)
        setCancelInvoiceReason("")
        setSelectedInvoice(null)
        await reload()
    }, [invoiceDetail, cancelInvoiceReason, reload])

    const handleCancelPayment = useCallback(async () => {
        if (!cancelPaymentTarget || !cancelPaymentReason.trim()) return
        setCancelPaymentLoading(true)
        await cancelPayment(cancelPaymentTarget.id, cancelPaymentReason.trim())
        setCancelPaymentLoading(false)
        setCancelPaymentTarget(null)
        setCancelPaymentReason("")
        if (invoiceDetail) {
            const detail = await getInvoiceDetail(invoiceDetail.id)
            setInvoiceDetail(detail)
        }
        await reload()
    }, [cancelPaymentTarget, cancelPaymentReason, invoiceDetail, reload])

    // 5. Deposit Dialog
    const [depositPage, setDepositPage] = useState(1)
    const [showDepositDialog, setShowDepositDialog] = useState(false)
    const [depositTarget, setDepositTarget] = useState<any>(null)
    const [depositForm, setDepositForm] = useState<DepositFormState>({ amount: "", description: "", reference: "" })
    const [depositLoading, setDepositLoading] = useState(false)

    const handleAddDeposit = useCallback(async () => {
        if (!depositTarget) return
        setDepositLoading(true)
        const res = await addDeposit({
            projectId: depositTarget.projectId,
            amount: Number(depositForm.amount),
            description: depositForm.description,
            reference: depositForm.reference || undefined,
        })
        setDepositLoading(false)
        if (res.success) {
            setShowDepositDialog(false)
            setDepositForm({ amount: "", description: "", reference: "" })
            await reload()
        }
    }, [depositTarget, depositForm, reload])

    return {
        // Invoice Detail
        selectedInvoice,
        setSelectedInvoice,
        invoiceDetail,
        setInvoiceDetail,
        sheetLoading,
        openInvoice,

        // Create Dialog
        showCreateDialog,
        setShowCreateDialog,
        invoiceForm,
        setInvoiceForm,
        customerSeqDefault,
        createLoading,
        createError,
        handleOpenCreateDialog,
        handleCreateInvoice,

        // Payment Dialog & Proof
        showPaymentDialog,
        setShowPaymentDialog,
        paymentForm,
        setPaymentForm,
        compressionInfo,
        paymentLoading,
        uploadingProofPaymentId,
        proofPreviewModalUrl,
        setProofPreviewModalUrl,
        handleProofFileSelected,
        handleDirectProofUpload,
        handleRecordPayment,

        // Cancel Invoice
        showCancelInvoiceDialog,
        setShowCancelInvoiceDialog,
        cancelInvoiceReason,
        setCancelInvoiceReason,
        cancelInvoiceLoading,
        handleCancelInvoice,

        // Cancel Payment
        cancelPaymentTarget,
        setCancelPaymentTarget,
        cancelPaymentReason,
        setCancelPaymentReason,
        cancelPaymentLoading,
        showCancelledPayments,
        setShowCancelledPayments,
        handleCancelPayment,

        // Deposit
        depositPage,
        setDepositPage,
        showDepositDialog,
        setShowDepositDialog,
        depositTarget,
        setDepositTarget,
        depositForm,
        setDepositForm,
        depositLoading,
        handleAddDeposit,
    }
}
