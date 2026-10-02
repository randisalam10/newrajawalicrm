"use client"

import { useState, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { confirmTransaction, deleteConfirmedTransaction } from "../actions"

interface UseRetaseTransactionsProps {
    pendingTransactions: any[]
    confirmedTransactions: any[]
}

export function useRetaseTransactions({
    pendingTransactions,
    confirmedTransactions,
}: UseRetaseTransactionsProps) {
    const { toast } = useToast()
    const [isConfirming, setIsConfirming] = useState<string | null>(null)
    const [distanceInput, setDistanceInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Filter for Confirmed tab
    const [filterCabang, setFilterCabang] = useState("all")
    const [filterCustomer, setFilterCustomer] = useState("all")
    const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false)

    // Unique customer list derived from confirmedTransactions
    const uniqueCustomers = useMemo(() => {
        const map = new Map<string, string>()
        confirmedTransactions.forEach(t =>
            map.set(
                t.project?.customerId || t.projectId,
                t.project?.customer?.customer_name || t.projectId
            )
        )
        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [confirmedTransactions])

    // Filtered confirmed transactions
    const filteredConfirmed = useMemo(() => {
        return confirmedTransactions.filter(t => {
            if (filterCabang !== "all" && t.locationId !== filterCabang) return false
            if (filterCustomer !== "all" && t.project?.customerId !== filterCustomer) return false
            return true
        })
    }, [confirmedTransactions, filterCabang, filterCustomer])

    const handleOpenConfirm = (t: any) => {
        setIsConfirming(t.id)
        setDistanceInput(t.project?.default_distance?.toString() || "")
    }

    const handleConfirm = async () => {
        if (!isConfirming) return
        if (!distanceInput) return toast({ title: "Jarak wajib diisi", variant: "destructive" })

        setIsLoading(true)
        const res = await confirmTransaction(isConfirming, Number(distanceInput))
        setIsLoading(false)

        if (res.error) {
            toast({ title: "Gagal", description: res.error, variant: "destructive" })
        } else {
            toast({ title: "Berhasil", description: "Transaksi & Retase Dikonfirmasi" })
            setIsConfirming(null)
            setDistanceInput("")
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        setIsLoading(true)
        const res = await deleteConfirmedTransaction(deleteId)
        setIsLoading(false)
        if (res.error) {
            toast({ title: "Gagal Menghapus", description: res.error, variant: "destructive" })
        } else {
            toast({ title: "Dihapus", description: "Transaksi berhasil dihapus ke Audit Log." })
            setDeleteId(null)
        }
    }

    return {
        isConfirming,
        setIsConfirming,
        distanceInput,
        setDistanceInput,
        isLoading,
        deleteId,
        setDeleteId,
        filterCabang,
        setFilterCabang,
        filterCustomer,
        setFilterCustomer,
        customerPopoverOpen,
        setCustomerPopoverOpen,
        uniqueCustomers,
        filteredConfirmed,
        handleOpenConfirm,
        handleConfirm,
        handleDelete,
    }
}
