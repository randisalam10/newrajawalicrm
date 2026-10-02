"use client"

import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { createKendaraan, updateKendaraan, deleteKendaraan } from "../actions"
import { DumpTruckSize, MeterType, Vehicle, VehicleCategory } from "../types"

export function useKendaraanForm(categories: VehicleCategory[] = []) {
    const [open, setOpen] = useState(false)
    const [editData, setEditData] = useState<Vehicle | null>(null)
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
    const [meterType, setMeterType] = useState<MeterType>("KM")
    const [merkModel, setMerkModel] = useState<string>("")

    // Dump Truck Form State
    const [dumpTruckSize, setDumpTruckSize] = useState<DumpTruckSize>("BESAR")
    const [capacityCubic, setCapacityCubic] = useState<string>("")

    // Rental / Sewa Configuration State
    const [isForRent, setIsForRent] = useState<boolean>(false)
    const [defaultDayRate, setDefaultDayRate] = useState<string>("")
    const [rentalStatus, setRentalStatus] = useState<string>("Tersedia")
    const [rentalNotes, setRentalNotes] = useState<string>("")

    // Pajak STNK & Uji KIR State
    const [annualTaxCost, setAnnualTaxCost] = useState<string>("")
    const [taxExpiryDate, setTaxExpiryDate] = useState<string>("")
    const [kirCost, setKirCost] = useState<string>("")
    const [kirExpiryDate, setKirExpiryDate] = useState<string>("")
    const [kirPeriodMonths, setKirPeriodMonths] = useState<string>("6")

    const handleCategoryChange = (catId: string) => {
        setSelectedCategoryId(catId)
        const cat = categories.find(c => c.id === catId)
        const catName = cat?.name?.toLowerCase() || ""
        if (
            catName.includes("batching") ||
            catName.includes("genset") ||
            catName.includes("loader") ||
            catName.includes("excavator") ||
            catName.includes("pump") ||
            catName.includes("crane")
        ) {
            setMeterType("HM")
        } else if (
            catName.includes("mixer") ||
            catName.includes("dump") ||
            catName.includes("mobil") ||
            catName.includes("motor")
        ) {
            setMeterType("KM")
        }
    }

    const handleOpenNew = () => {
        setEditData(null)
        const firstCatId = categories[0]?.id || ""
        setSelectedCategoryId(firstCatId)
        setMeterType("KM")
        setMerkModel("")
        setDumpTruckSize("BESAR")
        setCapacityCubic("")
        setIsForRent(false)
        setDefaultDayRate("")
        setRentalStatus("Tersedia")
        setRentalNotes("")
        setAnnualTaxCost("")
        setTaxExpiryDate("")
        setKirCost("")
        setKirExpiryDate("")
        setKirPeriodMonths("6")
        setOpen(true)
    }

    const handleOpenEdit = (data: Vehicle) => {
        setEditData(data)
        setSelectedCategoryId(
            data.categoryId ||
            categories.find(c => c.name.toLowerCase() === (data.vehicle_type || "").toLowerCase())?.id ||
            ""
        )
        setMeterType(data.meter_type || "KM")
        setMerkModel(data.merk_model || "")
        setDumpTruckSize(data.dump_truck_size || "BESAR")
        setCapacityCubic(data.capacity_cubic != null ? String(data.capacity_cubic) : "")
        setIsForRent(Boolean(data.is_for_rent))
        setDefaultDayRate(data.default_day_rate != null && data.default_day_rate > 0 ? String(data.default_day_rate) : "")
        setRentalStatus(data.rental_status || "Tersedia")
        setRentalNotes(data.rental_notes || "")
        setAnnualTaxCost(data.annual_tax_cost != null && data.annual_tax_cost > 0 ? String(data.annual_tax_cost) : "")
        setTaxExpiryDate(data.tax_expiry_date ? format(new Date(data.tax_expiry_date), "yyyy-MM-dd") : "")
        setKirCost(data.kir_cost != null && data.kir_cost > 0 ? String(data.kir_cost) : "")
        setKirExpiryDate(data.kir_expiry_date ? format(new Date(data.kir_expiry_date), "yyyy-MM-dd") : "")
        setKirPeriodMonths(data.kir_period_months ? String(data.kir_period_months) : "6")
        setOpen(true)
    }

    async function handleSubmit(formData: FormData) {
        formData.set("meter_type", meterType)
        if (merkModel.trim()) {
            formData.set("merk_model", merkModel.trim())
        } else {
            formData.delete("merk_model")
        }

        formData.set("is_for_rent", isForRent ? "true" : "false")
        if (isForRent) {
            formData.set("default_day_rate", defaultDayRate || "0")
            formData.set("rental_status", rentalStatus || "Tersedia")
            if (rentalNotes.trim()) {
                formData.set("rental_notes", rentalNotes.trim())
            } else {
                formData.delete("rental_notes")
            }
        } else {
            formData.set("default_day_rate", "0")
            formData.delete("rental_notes")
        }

        formData.set("annual_tax_cost", annualTaxCost || "0")
        if (taxExpiryDate) {
            formData.set("tax_expiry_date", taxExpiryDate)
        } else {
            formData.delete("tax_expiry_date")
        }
        formData.set("kir_cost", kirCost || "0")
        if (kirExpiryDate) {
            formData.set("kir_expiry_date", kirExpiryDate)
        } else {
            formData.delete("kir_expiry_date")
        }
        formData.set("kir_period_months", kirPeriodMonths || "6")

        if (selectedCategoryId) {
            formData.set("categoryId", selectedCategoryId)
            const activeCat = categories.find(c => c.id === selectedCategoryId)
            const isDT = activeCat?.name?.toLowerCase().includes("dump") || (editData && editData.dump_truck_size != null)
            if (isDT) {
                formData.set("dump_truck_size", dumpTruckSize)
                if (capacityCubic) {
                    formData.set("capacity_cubic", capacityCubic)
                } else {
                    formData.delete("capacity_cubic")
                }
            }
        }

        let result: any
        if (editData) {
            result = await updateKendaraan(editData.id, formData)
        } else {
            result = await createKendaraan(formData)
        }

        if (result.success) {
            toast.success(editData ? "Data unit berhasil diperbarui" : "Unit kendaraan / alat baru berhasil ditambahkan")
            setOpen(false)
            setEditData(null)
        } else {
            toast.error("Error: " + (typeof result.error === "object" ? JSON.stringify(result.error) : result.error))
        }
    }

    async function handleDelete(id: string) {
        if (confirm("Apakah Anda yakin ingin menghapus data kendaraan ini?")) {
            const result = await deleteKendaraan(id)
            if (result.success) {
                toast.success("Data kendaraan berhasil dihapus")
            } else {
                toast.error(result.error || "Gagal menghapus kendaraan")
            }
        }
    }

    return {
        open,
        setOpen,
        editData,
        selectedCategoryId,
        setSelectedCategoryId,
        meterType,
        setMeterType,
        merkModel,
        setMerkModel,
        dumpTruckSize,
        setDumpTruckSize,
        capacityCubic,
        setCapacityCubic,
        isForRent,
        setIsForRent,
        defaultDayRate,
        setDefaultDayRate,
        rentalStatus,
        setRentalStatus,
        rentalNotes,
        setRentalNotes,
        annualTaxCost,
        setAnnualTaxCost,
        taxExpiryDate,
        setTaxExpiryDate,
        kirCost,
        setKirCost,
        kirExpiryDate,
        setKirExpiryDate,
        kirPeriodMonths,
        setKirPeriodMonths,
        handleCategoryChange,
        handleOpenNew,
        handleOpenEdit,
        handleSubmit,
        handleDelete
    }
}
