import { useState, useMemo, useCallback } from "react"
import {
    getUnbilledTransactions,
    getInvoicesGroupedByCustomer,
    getDepositSummary,
} from "../actions"

interface UseBillingFilterProps {
    initialData: any
    isCorporate: boolean
    userLocationId?: string
    showCancelledInvoices: boolean
}

export function useBillingFilter({
    initialData,
    isCorporate,
    userLocationId,
    showCancelledInvoices,
}: UseBillingFilterProps) {
    const [data, setData] = useState(initialData)
    const [isLoading, setIsLoading] = useState(false)
    const defaultLocation = !isCorporate && userLocationId ? userLocationId : "all"
    const [selectedLocation, setSelectedLocation] = useState(defaultLocation)

    // Periode & Customer Filter State
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [selectedCustomerId, setSelectedCustomerId] = useState("all")

    // Unique customer options for filter bar
    const customerOptions = useMemo(() => {
        const map = new Map<string, string>()
        for (const tx of data?.unbilled || []) {
            const id = tx.customerId || tx.customer?.id || tx.project?.customerId || tx.project?.customer?.id
            const name = tx.customer?.customer_name || tx.project?.customer?.customer_name
            if (id && name) map.set(id, name)
        }
        for (const cust of data?.grouped || []) {
            if (cust.customerId && cust.customerName) map.set(cust.customerId, cust.customerName)
        }
        return Array.from(map.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [data])

    const reload = useCallback(async (locId?: string, sDate?: string, eDate?: string, custId?: string, showCancelled?: boolean) => {
        setIsLoading(true)
        const effectiveLocId = locId !== undefined ? locId : (selectedLocation === "all" ? undefined : selectedLocation)
        const effectiveStartDate = sDate !== undefined ? sDate : (startDate || undefined)
        const effectiveEndDate = eDate !== undefined ? eDate : (endDate || undefined)
        const effectiveCustId = custId !== undefined ? custId : (selectedCustomerId === "all" ? undefined : selectedCustomerId)
        const effectiveShowCancelled = showCancelled !== undefined ? showCancelled : showCancelledInvoices

        try {
            const [unbilled, grouped, deposits] = await Promise.all([
                getUnbilledTransactions({
                    locationId: effectiveLocId,
                    startDate: effectiveStartDate,
                    endDate: effectiveEndDate,
                    customerId: effectiveCustId,
                }),
                getInvoicesGroupedByCustomer({
                    locationId: effectiveLocId,
                    showCancelled: effectiveShowCancelled,
                    startDate: effectiveStartDate,
                    endDate: effectiveEndDate,
                    customerId: effectiveCustId,
                }),
                getDepositSummary({ locationId: effectiveLocId }),
            ])
            setData((prev: any) => ({ ...prev, unbilled, grouped, deposits }))
        } catch (error) {
            console.error("Gagal memuat ulang data billing:", error)
        } finally {
            setIsLoading(false)
        }
    }, [selectedLocation, startDate, endDate, selectedCustomerId, showCancelledInvoices])

    const handleApplyFilter = useCallback(() => {
        reload(selectedLocation, startDate, endDate, selectedCustomerId)
    }, [reload, selectedLocation, startDate, endDate, selectedCustomerId])

    const handleResetFilter = useCallback(() => {
        setSelectedLocation(defaultLocation)
        setStartDate("")
        setEndDate("")
        setSelectedCustomerId("all")
        reload(defaultLocation, "", "", "all")
    }, [defaultLocation, reload])

    return {
        data,
        setData,
        isLoading,
        selectedLocation,
        setSelectedLocation,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        selectedCustomerId,
        setSelectedCustomerId,
        customerOptions,
        reload,
        handleApplyFilter,
        handleResetFilter,
    }
}
