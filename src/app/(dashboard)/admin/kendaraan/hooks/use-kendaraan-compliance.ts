"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
    createVehicleComplianceRecord,
    updateVehicleComplianceRecord,
    deleteVehicleComplianceRecord
} from "../actions"
import { ComplianceType, Vehicle, VehicleComplianceRecord } from "../types"

export function useKendaraanCompliance(initialData: Vehicle[] = []) {
    // ─── Riwayat Kepatuhan Pajak & KIR State ───
    const [isComplianceOpen, setIsComplianceOpen] = useState(false)
    const [selectedVehicleForCompliance, setSelectedVehicleForCompliance] = useState<Vehicle | null>(null)
    const [complianceFilterType, setComplianceFilterType] = useState<string>("ALL")
    const [isAddRecordOpen, setIsAddRecordOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<any>(null)
    const [isSubmittingRecord, setIsSubmittingRecord] = useState(false)

    // Form inputs for recording compliance payment
    const [compVehicleId, setCompVehicleId] = useState<string>("")
    const [compType, setCompType] = useState<ComplianceType>("PAJAK_STNK")
    const [compCost, setCompCost] = useState<string>("")
    const [compPaymentDate, setCompPaymentDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
    const [compValidFrom, setCompValidFrom] = useState<string>(format(new Date(), "yyyy-MM-dd"))
    const [compValidUntil, setCompValidUntil] = useState<string>("")
    const [compPeriodMonths, setCompPeriodMonths] = useState<number>(12)
    const [compReceiptNumber, setCompReceiptNumber] = useState<string>("")
    const [compNotes, setCompNotes] = useState<string>("")

    // Memoized flat compliance records & stats
    const allComplianceRecords = useMemo(() => {
        const records: VehicleComplianceRecord[] = []
        initialData.forEach(v => {
            if (v.complianceRecords && Array.isArray(v.complianceRecords)) {
                v.complianceRecords.forEach((r: any) => {
                    records.push({
                        ...r,
                        vehicleCode: v.code,
                        plateNumber: v.plate_number,
                        vehicleCategory: v.category?.name || v.vehicle_type,
                        locationName: v.location?.name
                    })
                })
            }
        })
        return records.sort((a, b) => new Date(b.valid_until).getTime() - new Date(a.valid_until).getTime())
    }, [initialData])

    const complianceStats = useMemo(() => {
        let totalActive = 0
        let totalExpiringSoon = 0
        let totalExpired = 0
        const now = new Date()
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        allComplianceRecords.forEach(r => {
            const until = new Date(r.valid_until)
            if (until < now) totalExpired++
            else if (until <= thirtyDaysFromNow) totalExpiringSoon++
            else totalActive++
        })

        return {
            totalRecords: allComplianceRecords.length,
            totalActive,
            totalExpiringSoon,
            totalExpired
        }
    }, [allComplianceRecords])

    const handleOpenComplianceForVehicle = (vehicle: Vehicle) => {
        setSelectedVehicleForCompliance(vehicle)
        setCompVehicleId(vehicle.id)
        setIsComplianceOpen(true)
    }

    const handleOpenAllCompliance = () => {
        setSelectedVehicleForCompliance(null)
        setCompVehicleId("")
        setIsComplianceOpen(true)
    }

    const handleOpenAddRecordModal = (vId?: string) => {
        setEditingRecord(null)
        const targetId = vId || selectedVehicleForCompliance?.id || initialData[0]?.id || ""
        setCompVehicleId(targetId)
        setCompType("PAJAK_STNK")
        setCompCost("")
        setCompPaymentDate(format(new Date(), "yyyy-MM-dd"))
        const todayStr = format(new Date(), "yyyy-MM-dd")
        setCompValidFrom(todayStr)
        const nextYear = new Date()
        nextYear.setFullYear(nextYear.getFullYear() + 1)
        setCompValidUntil(format(nextYear, "yyyy-MM-dd"))
        setCompPeriodMonths(12)
        setCompReceiptNumber("")
        setCompNotes("")
        setIsAddRecordOpen(true)
    }

    const handleEditRecordModal = (rec: any) => {
        setEditingRecord(rec)
        setCompVehicleId(rec.vehicleId)
        setCompType(rec.type)
        setCompCost(rec.cost.toString())
        setCompPaymentDate(rec.payment_date ? format(new Date(rec.payment_date), "yyyy-MM-dd") : "")
        setCompValidFrom(format(new Date(rec.valid_from), "yyyy-MM-dd"))
        setCompValidUntil(format(new Date(rec.valid_until), "yyyy-MM-dd"))
        setCompPeriodMonths(rec.period_months || (rec.type === "UJI_KIR" ? 6 : 12))
        setCompReceiptNumber(rec.receipt_number || "")
        setCompNotes(rec.notes || "")
        setIsAddRecordOpen(true)
    }

    const handleTypeChange = (newType: ComplianceType) => {
        setCompType(newType)
        const months = newType === "UJI_KIR" ? 6 : 12
        setCompPeriodMonths(months)
        if (compValidFrom) {
            const start = new Date(compValidFrom)
            start.setMonth(start.getMonth() + months)
            setCompValidUntil(format(start, "yyyy-MM-dd"))
        }
    }

    const handleValidFromChange = (newFrom: string) => {
        setCompValidFrom(newFrom)
        if (newFrom) {
            const start = new Date(newFrom)
            start.setMonth(start.getMonth() + (compPeriodMonths || 12))
            setCompValidUntil(format(start, "yyyy-MM-dd"))
        }
    }

    const handleSubmitComplianceRecord = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!compVehicleId) {
            toast.error("Pilih kendaraan terlebih dahulu.")
            return
        }
        if (!compCost || Number(compCost) < 0) {
            toast.error("Biaya pembayaran wajib diisi.")
            return
        }
        if (!compValidFrom || !compValidUntil) {
            toast.error("Tanggal masa berlaku wajib diisi.")
            return
        }

        setIsSubmittingRecord(true)
        try {
            const formData = new FormData()
            formData.append("vehicleId", compVehicleId)
            formData.append("type", compType)
            formData.append("cost", compCost)
            if (compPaymentDate) formData.append("payment_date", compPaymentDate)
            formData.append("valid_from", compValidFrom)
            formData.append("valid_until", compValidUntil)
            formData.append("period_months", compPeriodMonths.toString())
            if (compReceiptNumber) formData.append("receipt_number", compReceiptNumber)
            if (compNotes) formData.append("notes", compNotes)

            let res: any
            if (editingRecord) {
                res = await updateVehicleComplianceRecord(editingRecord.id, formData)
            } else {
                res = await createVehicleComplianceRecord(formData)
            }

            if (res.success) {
                toast.success(editingRecord ? "Riwayat kepatuhan berhasil diperbarui" : "Pembayaran Pajak / KIR berhasil dicatat & disinkronkan ke master armada!")
                setIsAddRecordOpen(false)
                setEditingRecord(null)
            } else {
                toast.error("Gagal menyimpan: " + (typeof res.error === "object" ? JSON.stringify(res.error) : res.error))
            }
        } catch (err: any) {
            toast.error("Terjadi kendala: " + err.message)
        } finally {
            setIsSubmittingRecord(false)
        }
    }

    const handleDeleteComplianceRecord = async (id: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus data riwayat pembayaran ini? Status data master akan disinkronkan ulang.")) {
            try {
                const res = await deleteVehicleComplianceRecord(id)
                if (res.success) {
                    toast.success("Riwayat berhasil dihapus dan master armada telah disinkronkan")
                } else {
                    toast.error("Gagal menghapus: " + res.error)
                }
            } catch (err: any) {
                toast.error("Error: " + err.message)
            }
        }
    }

    return {
        isComplianceOpen,
        setIsComplianceOpen,
        selectedVehicleForCompliance,
        setSelectedVehicleForCompliance,
        complianceFilterType,
        setComplianceFilterType,
        isAddRecordOpen,
        setIsAddRecordOpen,
        editingRecord,
        setEditingRecord,
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
        complianceStats,
        handleOpenComplianceForVehicle,
        handleOpenAllCompliance,
        handleOpenAddRecordModal,
        handleEditRecordModal,
        handleTypeChange,
        handleValidFromChange,
        handleSubmitComplianceRecord,
        handleDeleteComplianceRecord
    }
}
