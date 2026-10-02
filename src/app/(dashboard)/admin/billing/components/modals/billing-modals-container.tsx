"use client"

import React from "react"
import { CreateInvoiceDialog } from "./create-invoice-dialog"
import { InvoiceDetailDialog } from "./invoice-detail-dialog"
import { RecordPaymentDialog } from "./record-payment-dialog"
import { CancelInvoiceDialog } from "./cancel-invoice-dialog"
import { CancelPaymentDialog } from "./cancel-payment-dialog"
import { DepositDialog } from "./deposit-dialog"
import { ProofPreviewDialog } from "./proof-preview-dialog"
import { InvoiceFormState, PaymentFormState, CompressionInfo, DepositFormState } from "../../types"

interface BillingModalsContainerProps {
    // Create Invoice
    showCreateDialog: boolean
    setShowCreateDialog: (open: boolean) => void
    selectedTxList: any[]
    selectedVolume: number
    selectedDays: number
    invoiceForm: InvoiceFormState
    setInvoiceForm: React.Dispatch<React.SetStateAction<InvoiceFormState>>
    customerSeqDefault: number | null
    createLoading: boolean
    createError: string
    onCreateInvoiceSubmit: () => void

    // Invoice Detail
    selectedInvoice: any
    setSelectedInvoice: (inv: any) => void
    invoiceDetail: any
    sheetLoading: boolean
    canManage?: boolean
    showCancelledPayments: boolean
    setShowCancelledPayments: React.Dispatch<React.SetStateAction<boolean>>
    uploadingProofPaymentId: string | null
    onDirectProofUpload: (paymentId: string, file: File) => void
    onOpenPaymentDialog: () => void
    onOpenCancelInvoice: () => void
    onCancelPaymentTarget: (payment: any) => void
    onPreviewProof: (url: string) => void

    // Record Payment
    showPaymentDialog: boolean
    setShowPaymentDialog: (open: boolean) => void
    paymentForm: PaymentFormState
    setPaymentForm: React.Dispatch<React.SetStateAction<PaymentFormState>>
    compressionInfo: CompressionInfo | null
    paymentLoading: boolean
    onProofFileSelected: (file: File | null) => void
    onRecordPaymentSubmit: () => void

    // Cancel Invoice
    showCancelInvoiceDialog: boolean
    setShowCancelInvoiceDialog: (open: boolean) => void
    cancelInvoiceReason: string
    setCancelInvoiceReason: (reason: string) => void
    cancelInvoiceLoading: boolean
    onCancelInvoiceSubmit: () => void

    // Cancel Payment
    cancelPaymentTarget: any
    onCloseCancelPayment: () => void
    cancelPaymentReason: string
    setCancelPaymentReason: (reason: string) => void
    cancelPaymentLoading: boolean
    onCancelPaymentSubmit: () => void

    // Deposit
    showDepositDialog: boolean
    setShowDepositDialog: (open: boolean) => void
    depositTarget: any
    depositForm: DepositFormState
    setDepositForm: React.Dispatch<React.SetStateAction<DepositFormState>>
    depositLoading: boolean
    onDepositSubmit: () => void

    // Proof Preview
    proofPreviewModalUrl: string | null
    onCloseProofPreview: () => void
}

export function BillingModalsContainer({
    showCreateDialog,
    setShowCreateDialog,
    selectedTxList,
    selectedVolume,
    selectedDays,
    invoiceForm,
    setInvoiceForm,
    customerSeqDefault,
    createLoading,
    createError,
    onCreateInvoiceSubmit,

    selectedInvoice,
    setSelectedInvoice,
    invoiceDetail,
    sheetLoading,
    canManage,
    showCancelledPayments,
    setShowCancelledPayments,
    uploadingProofPaymentId,
    onDirectProofUpload,
    onOpenPaymentDialog,
    onOpenCancelInvoice,
    onCancelPaymentTarget,
    onPreviewProof,

    showPaymentDialog,
    setShowPaymentDialog,
    paymentForm,
    setPaymentForm,
    compressionInfo,
    paymentLoading,
    onProofFileSelected,
    onRecordPaymentSubmit,

    showCancelInvoiceDialog,
    setShowCancelInvoiceDialog,
    cancelInvoiceReason,
    setCancelInvoiceReason,
    cancelInvoiceLoading,
    onCancelInvoiceSubmit,

    cancelPaymentTarget,
    onCloseCancelPayment,
    cancelPaymentReason,
    setCancelPaymentReason,
    cancelPaymentLoading,
    onCancelPaymentSubmit,

    showDepositDialog,
    setShowDepositDialog,
    depositTarget,
    depositForm,
    setDepositForm,
    depositLoading,
    onDepositSubmit,

    proofPreviewModalUrl,
    onCloseProofPreview,
}: BillingModalsContainerProps) {
    return (
        <>
            <CreateInvoiceDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                selectedTxList={selectedTxList}
                selectedVolume={selectedVolume}
                selectedDays={selectedDays}
                invoiceForm={invoiceForm}
                setInvoiceForm={setInvoiceForm}
                customerSeqDefault={customerSeqDefault}
                createLoading={createLoading}
                createError={createError}
                onSubmit={onCreateInvoiceSubmit}
            />

            <InvoiceDetailDialog
                open={!!selectedInvoice}
                onOpenChange={open => { if (!open) setSelectedInvoice(null) }}
                invoiceDetail={invoiceDetail}
                selectedInvoice={selectedInvoice}
                sheetLoading={sheetLoading}
                canManage={canManage}
                showCancelledPayments={showCancelledPayments}
                setShowCancelledPayments={setShowCancelledPayments}
                uploadingProofPaymentId={uploadingProofPaymentId}
                onDirectProofUpload={onDirectProofUpload}
                onOpenPaymentDialog={onOpenPaymentDialog}
                onOpenCancelInvoice={onOpenCancelInvoice}
                onCancelPaymentTarget={onCancelPaymentTarget}
                onPreviewProof={onPreviewProof}
            />

            <RecordPaymentDialog
                open={showPaymentDialog}
                onOpenChange={setShowPaymentDialog}
                invoiceDetail={invoiceDetail}
                paymentForm={paymentForm}
                setPaymentForm={setPaymentForm}
                compressionInfo={compressionInfo}
                paymentLoading={paymentLoading}
                onProofFileSelected={onProofFileSelected}
                onSubmit={onRecordPaymentSubmit}
            />

            <CancelInvoiceDialog
                open={showCancelInvoiceDialog}
                onOpenChange={setShowCancelInvoiceDialog}
                invoiceDetail={invoiceDetail}
                cancelInvoiceReason={cancelInvoiceReason}
                setCancelInvoiceReason={setCancelInvoiceReason}
                cancelInvoiceLoading={cancelInvoiceLoading}
                onSubmit={onCancelInvoiceSubmit}
            />

            <CancelPaymentDialog
                cancelPaymentTarget={cancelPaymentTarget}
                onClose={onCloseCancelPayment}
                cancelPaymentReason={cancelPaymentReason}
                setCancelPaymentReason={setCancelPaymentReason}
                cancelPaymentLoading={cancelPaymentLoading}
                onSubmit={onCancelPaymentSubmit}
            />

            <DepositDialog
                open={showDepositDialog}
                onOpenChange={setShowDepositDialog}
                depositTarget={depositTarget}
                depositForm={depositForm}
                setDepositForm={setDepositForm}
                depositLoading={depositLoading}
                onSubmit={onDepositSubmit}
            />

            <ProofPreviewDialog
                proofPreviewModalUrl={proofPreviewModalUrl}
                onClose={onCloseProofPreview}
            />
        </>
    )
}
