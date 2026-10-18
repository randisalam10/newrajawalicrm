"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import type { CrusherDailyReportData, CrusherMaterialSourceItem, EmployeeOption, VehicleOption } from "../../types"
import { addCrusherMaterialIn, deleteCrusherMaterialIn } from "../../actions"

export type FeedType = "QUARRY_RAW" | "COLD_BIN"

export const FEED_LABEL: Record<FeedType, { code: string; title: string }> = {
    QUARRY_RAW: { code: "D", title: "Material Masuk" },
    COLD_BIN: { code: "E", title: "Material Masuk Kolbin" },
}

type Params = {
    report: CrusherDailyReportData | null
    sources: CrusherMaterialSourceItem[]
    vehicles: VehicleOption[]
    employees: EmployeeOption[]
    selectedDate?: string
    locationId?: string
    onRefresh: () => void
}

function isTruck(v: VehicleOption): boolean {
    const cat = (v.categoryName ?? "").toLowerCase()
    return Boolean(v.dump_truck_size) || cat.includes("truck") || cat.includes("truk") || cat.includes("dump")
}

export function useMaterialIn({ report, sources, vehicles, employees, selectedDate, locationId, onRefresh }: Params) {
    const [feedType, setFeedType] = useState<FeedType>("QUARRY_RAW")
    const [plateNumber, setPlateNumber] = useState("")
    const [driverName, setDriverName] = useState("")
    const [sourceId, setSourceId] = useState("")
    const [distanceKm, setDistanceKm] = useState("")
    const [ritase, setRitase] = useState(1)
    const [notes, setNotes] = useState("")
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; plate: string } | null>(null)

    const [isSaving, startSave] = useTransition()
    const [isDeleting, startDelete] = useTransition()

    // Pilih sumber pertama dari master saat data sumber tersedia
    useEffect(() => {
        if (!sourceId && sources.length > 0) {
            setSourceId(sources[0].id)
            setDistanceKm(String(sources[0].default_distance_km ?? 0))
        }
    }, [sources, sourceId])

    /** Truk pilih cepat: hanya dari Master Kendaraan Crusher (prioritas dump truck) */
    const truckOptions = useMemo(() => {
        const trucks = vehicles.filter(isTruck)
        return (trucks.length > 0 ? trucks : vehicles).map((v) => ({
            plate: v.plate_number,
            size: v.dump_truck_size ?? null,
        }))
    }, [vehicles])

    /** Sopir dari Master Karyawan Crusher (posisi Sopir diprioritaskan) */
    const driverOptions = useMemo(() => {
        const drivers = employees.filter((e) => e.position === "Sopir")
        return (drivers.length > 0 ? drivers : employees).map((e) => ({ id: e.id, name: e.name }))
    }, [employees])

    const records = report?.materialsIn ?? []
    const rawList = records.filter((m) => m.feed_type === "QUARRY_RAW")
    const coldList = records.filter((m) => m.feed_type === "COLD_BIN")
    const totals = {
        QUARRY_RAW: rawList.reduce((s, m) => s + (m.ritase ?? 0), 0),
        COLD_BIN: coldList.reduce((s, m) => s + (m.ritase ?? 0), 0),
    }
    const activeList = feedType === "QUARRY_RAW" ? rawList : coldList

    const selectTruck = (plate: string) => {
        setPlateNumber(plate)
        // Isi otomatis sopir terakhir yang tercatat membawa truk ini (data aktual hari ini)
        const last = records.find((m) => m.plate_number === plate)
        if (last?.driver_name) setDriverName(last.driver_name)
    }

    const changeSource = (id: string) => {
        setSourceId(id)
        const matched = sources.find((s) => s.id === id)
        if (matched) setDistanceKm(String(matched.default_distance_km ?? 0))
    }

    const add = () => {
        if (!plateNumber.trim()) return void toast.error("Pilih atau isi plat nomor truk")
        if (!driverName.trim()) return void toast.error("Pilih sopir dari master")
        if (!sourceId) return void toast.error("Pilih sumber material")
        if (!Number.isFinite(ritase) || ritase <= 0) return void toast.error("Jumlah retase wajib lebih dari 0")

        const source = sources.find((s) => s.id === sourceId)
        const parsedDistance = parseFloat(distanceKm.replace(",", "."))

        const matchedEmp = employees.find((e) => e.name.toLowerCase() === driverName.trim().toLowerCase())
        const cleanP = plateNumber.replace(/\s+/g, "").toUpperCase()
        const matchedVeh = vehicles.find((v) => v.plate_number.replace(/\s+/g, "").toUpperCase() === cleanP)

        startSave(async () => {
            try {
                await addCrusherMaterialIn(
                    {
                        reportId: report?.id,
                        date: selectedDate,
                        locationId: locationId || report?.locationId,
                    },
                    {
                        feed_type: feedType,
                        vehicleId: matchedVeh?.id,
                        plate_number: plateNumber.trim(),
                        driverId: matchedEmp?.id,
                        driver_name: driverName.trim(),
                        sourceId,
                        source_name: source?.name ?? "",
                        distance_km: Number.isFinite(parsedDistance) ? parsedDistance : 0,
                        ritase,
                        notes: notes.trim() || undefined,
                    }
                )
                toast.success(`${plateNumber.toUpperCase()} • ${ritase} Ret ditambahkan`)
                setNotes("")
                setRitase(1)
                onRefresh()
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal menambah material masuk")
            }
        })
    }

    const confirmDelete = () => {
        if (!deleteTarget) return
        const target = deleteTarget
        startDelete(async () => {
            try {
                await deleteCrusherMaterialIn(target.id)
                toast.success(`Data ${target.plate} dihapus`)
                setDeleteTarget(null)
                onRefresh()
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Gagal menghapus data")
            }
        })
    }

    return {
        hasReport: Boolean(report?.id),
        feedType, setFeedType,
        plateNumber, setPlateNumber, selectTruck,
        driverName, setDriverName,
        sourceId, changeSource,
        distanceKm, setDistanceKm,
        ritase, setRitase,
        notes, setNotes,
        truckOptions, driverOptions,
        totals, activeList,
        isSaving, add,
        deleteTarget, setDeleteTarget, isDeleting, confirmDelete,
    }
}

export type MaterialInController = ReturnType<typeof useMaterialIn>
