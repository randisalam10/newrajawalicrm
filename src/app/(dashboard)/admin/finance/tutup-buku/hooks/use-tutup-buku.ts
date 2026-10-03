"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    MonthlyClosingRecord,
    PeriodSummaryStats,
    PeriodOptionItem,
    ClosePeriodPreview,
    ClosingStatusMap,
    ClosePeriodPayload
} from "../types"
import {
    previewClosePeriod,
    executeClosePeriod,
    executeReopenPeriod
} from "../actions"

interface UseTutupBukuProps {
    initialRecords: MonthlyClosingRecord[]
    initialStats: PeriodSummaryStats
    availablePeriods: PeriodOptionItem[]
    closingMap: ClosingStatusMap
    currentYear: number
    locations: Array<{ id: string; name: string }>
}

export function useTutupBuku({
    initialRecords,
    initialStats,
    availablePeriods,
    closingMap,
    currentYear,
    locations
}: UseTutupBukuProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // Filter states
    const [selectedYear, setSelectedYear] = useState<number>(currentYear)
    const [selectedLocationId, setSelectedLocationId] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState<string>("")

    // Modals
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
    const [isReopenModalOpen, setIsReopenModalOpen] = useState(false)
    const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false)

    // Target records
    const [targetRecordForReopen, setTargetRecordForReopen] = useState<MonthlyClosingRecord | null>(null)
    const [targetRecordForSnapshot, setTargetRecordForSnapshot] = useState<MonthlyClosingRecord | null>(null)

    // Close preview state
    const [previewData, setPreviewData] = useState<ClosePeriodPreview | null>(null)
    const [isPreviewLoading, setIsPreviewLoading] = useState(false)

    // Filtered records
    const filteredRecords = useMemo(() => {
        return initialRecords.filter(r => {
            const matchLoc = selectedLocationId === "all" || r.locationId === selectedLocationId || (!r.locationId && selectedLocationId === "all")
            const query = searchQuery.toLowerCase().trim()
            const matchSearch = !query ||
                r.period.toLowerCase().includes(query) ||
                r.locationName.toLowerCase().includes(query) ||
                r.closedByName.toLowerCase().includes(query) ||
                (r.notes && r.notes.toLowerCase().includes(query))
            return matchLoc && matchSearch
        })
    }, [initialRecords, selectedLocationId, searchQuery])

    // Load preview when closing modal selects period & location
    const handleFetchPreview = async (period: string, locationId: string | null) => {
        setIsPreviewLoading(true)
        try {
            const preview = await previewClosePeriod(period, locationId)
            setPreviewData(preview)
        } catch (err: any) {
            toast.error(err.message || "Gagal memuat preview data periode.")
            setPreviewData(null)
        } finally {
            setIsPreviewLoading(false)
        }
    }

    // Submit close period
    const handleExecuteClose = (payload: ClosePeriodPayload) => {
        startTransition(async () => {
            try {
                const res = await executeClosePeriod(payload)
                toast.success(res.message)
                setIsCloseModalOpen(false)
                setPreviewData(null)
                router.refresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal menutup buku periode.")
            }
        })
    }

    // Submit reopen period
    const handleExecuteReopen = (reason: string) => {
        if (!targetRecordForReopen) return
        startTransition(async () => {
            try {
                const res = await executeReopenPeriod({
                    closingId: targetRecordForReopen.id,
                    reason
                })
                toast.success(res.message)
                setIsReopenModalOpen(false)
                setTargetRecordForReopen(null)
                router.refresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal membuka kembali periode.")
            }
        })
    }

    return {
        // State
        selectedYear,
        setSelectedYear,
        selectedLocationId,
        setSelectedLocationId,
        searchQuery,
        setSearchQuery,
        filteredRecords,
        stats: initialStats,
        locations,
        availablePeriods,
        closingMap,
        isPending,

        // Close Modal
        isCloseModalOpen,
        setIsCloseModalOpen,
        previewData,
        isPreviewLoading,
        handleFetchPreview,
        handleExecuteClose,

        // Reopen Modal
        isReopenModalOpen,
        setIsReopenModalOpen,
        targetRecordForReopen,
        setTargetRecordForReopen,
        handleExecuteReopen,

        // Snapshot Modal
        isSnapshotModalOpen,
        setIsSnapshotModalOpen,
        targetRecordForSnapshot,
        setTargetRecordForSnapshot
    }
}
