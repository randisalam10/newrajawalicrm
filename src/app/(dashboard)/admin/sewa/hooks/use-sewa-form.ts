"use client"

import { useState, useMemo, useTransition } from "react"
import { differenceInCalendarDays } from "date-fns"
import { toast } from "sonner"
import { parseDecimal } from "../helpers"
import { createSewaTransaction } from "../actions"
import { DateMode, PpnMode, SewaMasters, SewaTransaction } from "../types"

export function useSewaForm(masters: SewaMasters, onTransactionCreated: (tx: SewaTransaction) => void) {
    const todayStr = new Date().toISOString().split("T")[0]
    const [isPending, startTransition] = useTransition()
    const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false)

    // Combobox popover open states
    const [openCustomer, setOpenCustomer] = useState<boolean>(false)
    const [openProject, setOpenProject] = useState<boolean>(false)
    const [openEquipment, setOpenEquipment] = useState<boolean>(false)
    const [openOperator, setOpenOperator] = useState<boolean>(false)

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
    const [selectedProjectId, setSelectedProjectId] = useState<string>("NONE")
    const [lokasiProyek, setLokasiProyek] = useState<string>("")
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("")
    const [selectedOperatorId, setSelectedOperatorId] = useState<string>("")
    const [selectedLocationId, setSelectedLocationId] = useState<string>(
        masters.locations[0]?.id || ""
    )

    // Date Mode: "RANGE" vs "DATES"
    const [dateMode, setDateMode] = useState<DateMode>("RANGE")
    const [rangeStart, setRangeStart] = useState<string>(todayStr)
    const [rangeEnd, setRangeEnd] = useState<string>(todayStr)

    // Specific discrete dates
    const [specificDates, setSpecificDates] = useState<string[]>([todayStr])
    const [dateInputVal, setDateInputVal] = useState<string>(todayStr)

    // Pricing & PPN
    const [pricePerDayInput, setPricePerDayInput] = useState<string>("")
    const [totalPriceInput, setTotalPriceInput] = useState<string>("")
    const [isTotalPriceManual, setIsTotalPriceManual] = useState<boolean>(false)
    const [ppnMode, setPpnMode] = useState<PpnMode>("NON_PPN")
    const [ppnRate, setPpnRate] = useState<number>(11)
    const [notes, setNotes] = useState<string>("")

    // Auto-calculate Days
    const calculatedDays = useMemo(() => {
        if (dateMode === "RANGE") {
            if (!rangeStart || !rangeEnd) return 1
            const d1 = new Date(rangeStart)
            const d2 = new Date(rangeEnd)
            const diff = differenceInCalendarDays(d2, d1)
            return Math.max(1, diff + 1)
        } else {
            return Math.max(1, specificDates.length)
        }
    }, [dateMode, rangeStart, rangeEnd, specificDates])

    const numPricePerDay = useMemo(() => parseDecimal(pricePerDayInput), [pricePerDayInput])
    const rawBaseTotal = useMemo(() => {
        if (isTotalPriceManual) {
            return parseDecimal(totalPriceInput)
        }
        return numPricePerDay * calculatedDays
    }, [isTotalPriceManual, totalPriceInput, numPricePerDay, calculatedDays])

    const { dppAmount, ppnAmount, grandTotal } = useMemo(() => {
        if (ppnMode === "INCLUDE") {
            const factor = 1 + (ppnRate / 100)
            const dpp = factor > 0 ? (rawBaseTotal / factor) : rawBaseTotal
            const ppn = rawBaseTotal - dpp
            return { dppAmount: dpp, ppnAmount: ppn, grandTotal: rawBaseTotal }
        } else if (ppnMode === "EXCLUDE") {
            const ppn = rawBaseTotal * (ppnRate / 100)
            return { dppAmount: rawBaseTotal, ppnAmount: ppn, grandTotal: rawBaseTotal + ppn }
        } else {
            return { dppAmount: rawBaseTotal, ppnAmount: 0, grandTotal: rawBaseTotal }
        }
    }, [rawBaseTotal, ppnMode, ppnRate])

    const handleDailyRateChange = (rateStr: string) => {
        setPricePerDayInput(rateStr)
        const rate = parseDecimal(rateStr)
        if (!isTotalPriceManual) {
            setTotalPriceInput(rate > 0 ? String(rate * calculatedDays) : "")
        }
    }

    const handleDaysChanged = (days: number) => {
        if (!isTotalPriceManual && numPricePerDay > 0) {
            setTotalPriceInput(String(numPricePerDay * days))
        }
    }

    const handleCustomerChange = (customerId: string) => {
        setSelectedCustomerId(customerId)
        const cust = masters.customers.find(c => c.id === customerId)
        if (cust) {
            if (cust.projects && cust.projects.length > 0) {
                setSelectedProjectId(cust.projects[0].id)
                setLokasiProyek(cust.projects[0].address || cust.address || "")
            } else {
                setSelectedProjectId("NONE")
                setLokasiProyek(cust.address || "")
            }
        }
    }

    const handleEquipmentChange = (equipmentId: string) => {
        setSelectedEquipmentId(equipmentId)
        const eq = masters.equipments.find(e => e.id === equipmentId)
        if (eq && eq.default_day_rate && eq.default_day_rate > 0) {
            handleDailyRateChange(String(eq.default_day_rate))
        }
    }

    const handleAddSpecificDate = () => {
        if (!dateInputVal) return
        if (specificDates.includes(dateInputVal)) {
            toast.info("Tanggal ini sudah dipilih")
            return
        }
        const updated = [...specificDates, dateInputVal].sort()
        setSpecificDates(updated)
        handleDaysChanged(updated.length)
    }

    const handleRemoveSpecificDate = (dToRemove: string) => {
        if (specificDates.length <= 1) {
            toast.warning("Minimal harus ada 1 tanggal sewa")
            return
        }
        const updated = specificDates.filter(d => d !== dToRemove)
        setSpecificDates(updated)
        handleDaysChanged(updated.length)
    }

    const handleResetForm = () => {
        setSelectedCustomerId("")
        setSelectedProjectId("NONE")
        setLokasiProyek("")
        setSelectedEquipmentId("")
        setSelectedOperatorId("")
        setDateMode("RANGE")
        setRangeStart(todayStr)
        setRangeEnd(todayStr)
        setSpecificDates([todayStr])
        setPricePerDayInput("")
        setTotalPriceInput("")
        setIsTotalPriceManual(false)
        setPpnMode("NON_PPN")
        setPpnRate(11)
        setNotes("")
        setOpenCustomer(false)
        setOpenProject(false)
        setOpenEquipment(false)
        setOpenOperator(false)
    }

    const handleOpenInputModal = () => {
        handleResetForm()
        setIsInputModalOpen(true)
    }

    const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedCustomerId) {
            toast.error("Customer wajib dipilih")
            return
        }
        if (!selectedEquipmentId) {
            toast.error("Unit alat / kendaraan wajib dipilih")
            return
        }
        if (!selectedOperatorId) {
            toast.error("Operator wajib dipilih")
            return
        }

        const formData = new FormData()
        formData.append("customerId", selectedCustomerId)
        if (selectedProjectId && selectedProjectId !== "NONE") {
            formData.append("projectId", selectedProjectId)
        }
        formData.append("lokasi_proyek", lokasiProyek || "")
        formData.append("equipmentId", selectedEquipmentId)
        formData.append("operatorId", selectedOperatorId)
        formData.append("date_mode", dateMode)

        if (dateMode === "RANGE") {
            formData.append("date", rangeStart)
            formData.append("start_date", rangeStart)
            formData.append("end_date", rangeEnd)
            const daysArr: string[] = []
            let curr = new Date(rangeStart)
            const stop = new Date(rangeEnd)
            while (curr <= stop) {
                daysArr.push(curr.toISOString().split("T")[0])
                curr.setDate(curr.getDate() + 1)
            }
            formData.append("rental_dates", JSON.stringify(daysArr))
            formData.append("total_days", String(calculatedDays))
        } else {
            const sorted = [...specificDates].sort()
            formData.append("date", sorted[0])
            formData.append("start_date", sorted[0])
            formData.append("end_date", sorted[sorted.length - 1])
            formData.append("rental_dates", JSON.stringify(sorted))
            formData.append("total_days", String(sorted.length))
        }

        formData.append("price_per_day", String(numPricePerDay))
        formData.append("total_price", String(grandTotal))
        formData.append("is_ppn", String(ppnMode !== "NON_PPN"))
        formData.append("ppn_mode", ppnMode)
        formData.append("ppn_rate", String(ppnRate))
        formData.append("dpp_amount", String(dppAmount))
        formData.append("ppn_amount", String(ppnAmount))
        formData.append("notes", notes)
        if (selectedLocationId) {
            formData.append("locationId", selectedLocationId)
        }

        startTransition(async () => {
            const res = await createSewaTransaction(formData)
            if (res.success && res.sewa) {
                toast.success(`Transaksi Sewa No. ${res.sewa.sewa_number} berhasil dibuat!`)
                onTransactionCreated(res.sewa)
                setIsInputModalOpen(false)
            } else {
                toast.error(res.error || "Gagal membuat transaksi sewa")
            }
        })
    }

    const handleTotalPriceChange = (val: string) => {
        setIsTotalPriceManual(true)
        setTotalPriceInput(val)
    }

    const handleResetManualPrice = () => {
        setIsTotalPriceManual(false)
        setTotalPriceInput(numPricePerDay > 0 ? String(numPricePerDay * calculatedDays) : "")
    }

    return {
        isPending,
        isInputModalOpen,
        setIsInputModalOpen,
        handleOpenInputModal,
        openCustomer,
        setOpenCustomer,
        openProject,
        setOpenProject,
        openEquipment,
        setOpenEquipment,
        openOperator,
        setOpenOperator,
        selectedCustomerId,
        selectedProjectId,
        setSelectedProjectId,
        lokasiProyek,
        setLokasiProyek,
        selectedEquipmentId,
        selectedOperatorId,
        setSelectedOperatorId,
        selectedLocationId,
        setSelectedLocationId,
        dateMode,
        setDateMode,
        rangeStart,
        setRangeStart,
        rangeEnd,
        setRangeEnd,
        specificDates,
        dateInputVal,
        setDateInputVal,
        calculatedDays,
        pricePerDayInput,
        numPricePerDay,
        totalPriceInput,
        setTotalPriceInput,
        handleTotalPriceChange,
        isTotalPriceManual,
        setIsTotalPriceManual,
        handleResetManualPrice,
        rawBaseTotal,
        ppnMode,
        setPpnMode,
        ppnRate,
        setPpnRate,
        dppAmount,
        ppnAmount,
        grandTotal,
        notes,
        setNotes,
        handleDailyRateChange,
        handleDaysChanged,
        handleCustomerChange,
        handleEquipmentChange,
        handleAddSpecificDate,
        handleRemoveSpecificDate,
        handleCreateSubmit,
    }
}
