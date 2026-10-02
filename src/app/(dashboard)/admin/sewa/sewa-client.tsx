"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { updateSewaStatus, deleteSewaTransaction } from "./actions"
import { SewaMasters, SewaTransaction } from "./types"
import { useSewaFilter } from "./hooks/use-sewa-filter"
import { useSewaForm } from "./hooks/use-sewa-form"
import { SewaTable } from "./components/sewa-table"
import { SewaInputDialog } from "./components/sewa-input-dialog"
import { SewaDetailDialog } from "./components/sewa-detail-dialog"

export function SewaClient({
    masters,
    initialTransactions,
    userRole,
    canCreate = true,
}: {
    masters: SewaMasters
    initialTransactions: SewaTransaction[]
    masterEquipments?: any[]
    userRole: string
    canCreate?: boolean
}) {
    const isCorp = userRole === "SuperAdminBP" || ["CEO", "FVP", "Approver"].includes(userRole)
    const [transactions, setTransactions] = useState<SewaTransaction[]>(initialTransactions)
    const [selectedTxDetail, setSelectedTxDetail] = useState<SewaTransaction | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const filter = useSewaFilter(transactions)
    const form = useSewaForm(masters, (newTx) => {
        setTransactions(prev => [newTx, ...prev])
    })

    const handleCompleteStatus = async (id: string) => {
        if (!confirm("Tandai transaksi sewa ini sebagai Selesai?")) return
        const res = await updateSewaStatus(id, "Completed")
        if (res.success) {
            toast.success("Status sewa diubah menjadi Selesai")
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: "Completed" } : t))
        } else {
            toast.error(res.error || "Gagal mengubah status")
        }
    }

    const handleDeleteTransaction = async (id: string, sewaNumber: string) => {
        if (!confirm(`Hapus transaksi sewa "${sewaNumber}"?`)) return
        const res = await deleteSewaTransaction(id)
        if (res.success) {
            toast.success("Transaksi sewa berhasil dihapus")
            setTransactions(prev => prev.filter(t => t.id !== id))
        } else {
            toast.error(res.error || "Gagal menghapus transaksi")
        }
    }

    const handleViewDetail = (tx: SewaTransaction) => {
        setSelectedTxDetail(tx)
        setIsDetailOpen(true)
    }

    return (
        <div className="space-y-4">
            {/* Header Toolbar: Title & Add Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Sewa Alat & Kendaraan
                </h1>

                {canCreate && (
                    <Button
                        onClick={form.handleOpenInputModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 gap-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Input Sewa Baru</span>
                    </Button>
                )}
            </div>

            {/* Transactions Table & Filters */}
            <SewaTable
                transactions={filter.filteredTransactions}
                masters={masters}
                isCorp={isCorp}
                canCreate={canCreate}
                searchQuery={filter.searchQuery}
                onSearchChange={filter.setSearchQuery}
                filterBranch={filter.filterBranch}
                onFilterBranchChange={filter.setFilterBranch}
                filterStatus={filter.filterStatus}
                onFilterStatusChange={filter.setFilterStatus}
                filterStartDate={filter.filterStartDate}
                onFilterStartDateChange={filter.setFilterStartDate}
                filterEndDate={filter.filterEndDate}
                onFilterEndDateChange={filter.setFilterEndDate}
                onResetFilters={filter.handleResetFilters}
                onSetDateToday={filter.setDatePresetToday}
                onSetDateThisMonth={filter.setDatePresetThisMonth}
                hasActiveFilters={filter.hasActiveFilters}
                todayStr={filter.todayStr}
                onOpenInputModal={form.handleOpenInputModal}
                onViewDetail={handleViewDetail}
                onCompleteStatus={handleCompleteStatus}
                onDeleteTransaction={handleDeleteTransaction}
            />

            {/* Modal Input Sewa Baru */}
            <SewaInputDialog
                open={form.isInputModalOpen}
                onOpenChange={form.setIsInputModalOpen}
                isCorp={isCorp}
                masters={masters}
                selectedLocationId={form.selectedLocationId}
                onLocationChange={form.setSelectedLocationId}
                selectedCustomerId={form.selectedCustomerId}
                onCustomerChange={form.handleCustomerChange}
                selectedProjectId={form.selectedProjectId}
                onProjectChange={form.setSelectedProjectId}
                lokasiProyek={form.lokasiProyek}
                onLokasiProyekChange={form.setLokasiProyek}
                selectedEquipmentId={form.selectedEquipmentId}
                onEquipmentChange={form.handleEquipmentChange}
                selectedOperatorId={form.selectedOperatorId}
                onOperatorChange={form.setSelectedOperatorId}
                dateMode={form.dateMode}
                onDateModeChange={form.setDateMode}
                rangeStart={form.rangeStart}
                onRangeStartChange={form.setRangeStart}
                rangeEnd={form.rangeEnd}
                onRangeEndChange={form.setRangeEnd}
                specificDates={form.specificDates}
                dateInputVal={form.dateInputVal}
                onDateInputValChange={form.setDateInputVal}
                onAddSpecificDate={form.handleAddSpecificDate}
                onRemoveSpecificDate={form.handleRemoveSpecificDate}
                calculatedDays={form.calculatedDays}
                pricePerDayInput={form.pricePerDayInput}
                onDailyRateChange={form.handleDailyRateChange}
                numPricePerDay={form.numPricePerDay}
                totalPriceInput={form.totalPriceInput}
                onTotalPriceChange={form.handleTotalPriceChange}
                isTotalPriceManual={form.isTotalPriceManual}
                onResetManualPrice={form.handleResetManualPrice}
                rawBaseTotal={form.rawBaseTotal}
                ppnMode={form.ppnMode}
                onPpnModeChange={form.setPpnMode}
                ppnRate={form.ppnRate}
                onPpnRateChange={form.setPpnRate}
                dppAmount={form.dppAmount}
                ppnAmount={form.ppnAmount}
                grandTotal={form.grandTotal}
                notes={form.notes}
                onNotesChange={form.setNotes}
                isPending={form.isPending}
                onSubmit={form.handleCreateSubmit}
            />

            {/* Modal Detail Sewa */}
            <SewaDetailDialog
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                tx={selectedTxDetail}
            />
        </div>
    )
}
