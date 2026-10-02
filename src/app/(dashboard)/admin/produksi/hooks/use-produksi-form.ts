"use client"

import { useState, useEffect, useMemo } from "react"
import { createProduction } from "../actions"
import {
    ProductionMasters,
    ProduksiCustomer,
    IncentiveRateItem,
    ProduksiProject,
} from "../types"
import { useRateShortcutModals } from "./use-rate-shortcut-modals"

interface UseProduksiFormProps {
    masters: ProductionMasters
    userRole?: string
    canCreate?: boolean
}

export function useProduksiForm({
    masters,
    userRole,
    canCreate = true,
}: UseProduksiFormProps) {
    const {
        projects = [],
        vehicles = [],
        drivers = [],
        qualities = [],
        workItems = [],
        operators = [],
        incentiveRates = [],
        retaseSettings = [],
    } = masters || {}

    const [localIncentives, setLocalIncentives] = useState<IncentiveRateItem[]>(incentiveRates)
    const [loading, setLoading] = useState(false)

    // Master Cabang state (for SuperAdmin)
    const [openLocation, setOpenLocation] = useState(false)
    const [selectedLocationId, setSelectedLocationId] = useState<string>("")

    // Filter masters (guard against projects with missing customer relation)
    const validProjects = useMemo(() => {
        return (projects || []).filter((p) => p.customer != null)
    }, [projects])

    const activeProjects = useMemo(() => {
        return userRole === "SuperAdminBP" && selectedLocationId
            ? validProjects.filter((p) => p.customer?.locationId === selectedLocationId)
            : validProjects
    }, [userRole, selectedLocationId, validProjects])

    const activeVehicles = useMemo(() => {
        return userRole === "SuperAdminBP" && selectedLocationId
            ? (vehicles || []).filter((v) => v.locationId === selectedLocationId)
            : vehicles || []
    }, [userRole, selectedLocationId, vehicles])

    const activeDrivers = useMemo(() => {
        return userRole === "SuperAdminBP" && selectedLocationId
            ? (drivers || []).filter((d) => d.locationId === selectedLocationId)
            : drivers || []
    }, [userRole, selectedLocationId, drivers])

    const activeQualities = useMemo(() => {
        return userRole === "SuperAdminBP" && selectedLocationId
            ? (qualities || []).filter((q) => q.locationId === selectedLocationId)
            : qualities || []
    }, [userRole, selectedLocationId, qualities])

    const activeWorkItems = useMemo(() => {
        return userRole === "SuperAdminBP" && selectedLocationId
            ? (workItems || []).filter((w) => w.locationId === selectedLocationId)
            : workItems || []
    }, [userRole, selectedLocationId, workItems])

    const activeOperators = useMemo(() => {
        return userRole === "SuperAdminBP" && selectedLocationId
            ? (operators || []).filter((o) => o.locationId === selectedLocationId)
            : operators || []
    }, [userRole, selectedLocationId, operators])

    // Combobox states
    const [openCustomer, setOpenCustomer] = useState(false)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")

    const [openProject, setOpenProject] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")

    const [openVehicle, setOpenVehicle] = useState(false)
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")

    const [openDriver, setOpenDriver] = useState(false)
    const [selectedDriverId, setSelectedDriverId] = useState<string>("")

    const [openOperator, setOpenOperator] = useState(false)
    const [selectedOperatorId, setSelectedOperatorId] = useState<string>("")

    const [openQuality, setOpenQuality] = useState(false)
    const [selectedQualityId, setSelectedQualityId] = useState<string>("")

    const [openWorkItem, setOpenWorkItem] = useState(false)
    const [selectedWorkItemId, setSelectedWorkItemId] = useState<string>("")

    const canManageRate = userRole === "SuperAdminBP" || userRole === "AdminBP"
    const activeLocId = userRole === "SuperAdminBP" && selectedLocationId ? selectedLocationId : null

    // Live active rate lookup with fallback to actual branch RetaseSetting
    const activeLocRetase = useMemo(() => {
        if (!activeLocId) return retaseSettings[0] || null
        return (retaseSettings || []).find((s) => s.locationId === activeLocId) || retaseSettings[0] || null
    }, [retaseSettings, activeLocId])

    const activeOpRateItem = useMemo(() => {
        return (localIncentives || []).find((r) =>
            r.kategori_peran === "OPERATOR_BP" &&
            r.isActive &&
            (activeLocId ? r.locationId === activeLocId || !r.locationId : true)
        )
    }, [localIncentives, activeLocId])

    const activeMixerRateItem = useMemo(() => {
        return (localIncentives || []).find((r) =>
            r.kategori_peran === "SOPIR_MIXER" &&
            r.isActive &&
            (activeLocId ? r.locationId === activeLocId || !r.locationId : true)
        )
    }, [localIncentives, activeLocId])

    const activeOpRate = useMemo(() => {
        if (activeOpRateItem) return Number(activeOpRateItem.tarif_utama) || 0
        if (activeLocRetase && Number(activeLocRetase.operator_rate_per_cubic) > 0) {
            return Number(activeLocRetase.operator_rate_per_cubic)
        }
        return 0
    }, [activeOpRateItem, activeLocRetase])

    const activeMixerRate = useMemo(() => {
        if (activeMixerRateItem) return Number(activeMixerRateItem.tarif_utama) || 0
        if (activeLocRetase && Number(activeLocRetase.price_per_cubic_km) > 0) {
            return Number(activeLocRetase.price_per_cubic_km)
        }
        return 0
    }, [activeMixerRateItem, activeLocRetase])

    // Modals hook
    const shortcutModals = useRateShortcutModals({
        canManageRate,
        activeLocId,
        activeOpRateItem,
        activeOpRate,
        activeMixerRateItem,
        activeMixerRate,
        setLocalIncentives,
    })

    // Auto-select operator jika di cabang BP hanya ada 1 operator aktif
    useEffect(() => {
        if (activeOperators.length === 1) {
            setSelectedOperatorId(activeOperators[0].id)
        } else if (activeOperators.length === 0) {
            setSelectedOperatorId("")
        }
    }, [activeOperators, selectedLocationId])

    // Derive unique customers from active projects
    const uniqueCustomers: ProduksiCustomer[] = useMemo(() => {
        const list: ProduksiCustomer[] = []
        const seenIds = new Set<string>()
        for (const p of activeProjects) {
            if (p.customer && !seenIds.has(p.customer.id)) {
                seenIds.add(p.customer.id)
                list.push(p.customer)
            }
        }
        return list.sort((a, b) => a.customer_name.localeCompare(b.customer_name))
    }, [activeProjects])

    // Projects filtered by selected customer
    const customerProjects: ProduksiProject[] = useMemo(() => {
        return selectedCustomerId
            ? activeProjects.filter((p) => p.customer?.id === selectedCustomerId)
            : []
    }, [selectedCustomerId, activeProjects])

    const selectedProject = useMemo(() => {
        return customerProjects.find((p) => p.id === selectedProjectId)
    }, [customerProjects, selectedProjectId])

    const handleSelectCustomer = (custId: string) => {
        const newId = custId === selectedCustomerId ? "" : custId
        setSelectedCustomerId(newId)
        setSelectedProjectId("") // reset project
        setOpenCustomer(false)
        if (newId) {
            const projs = activeProjects.filter((p) => p.customer?.id === newId)
            if (projs.length === 1) {
                // Auto-select if only 1 project
                setSelectedProjectId(projs[0].id)
            }
        }
    }

    const resetDependentSelections = () => {
        setSelectedCustomerId("")
        setSelectedProjectId("")
        setSelectedVehicleId("")
        setSelectedDriverId("")
        setSelectedQualityId("")
        setSelectedWorkItemId("")
    }

    const handleSubmit = async (formData: FormData) => {
        if (!canCreate) {
            alert("Akses Ditolak: Akun Anda (" + userRole + ") hanya memiliki izin pemantauan (Hanya Lihat).")
            return
        }

        if (userRole === "SuperAdminBP" && !selectedLocationId) {
            alert("Harap pilih Cabang Operasional terlebih dahulu.")
            return
        }
        if (!selectedProjectId || !selectedVehicleId || !selectedDriverId || !selectedQualityId || !selectedWorkItemId) {
            alert("Harap lengkapi semua pilihan Master Data (Proyek, Truk, Sopir, Mutu, dan Item Pekerjaan).")
            return
        }

        // Add locationId manually to formData if superadmin
        if (userRole === "SuperAdminBP" && selectedLocationId) {
            formData.append("locationId", selectedLocationId)
        }

        // Add operatorId if selected
        if (selectedOperatorId) {
            formData.append("operatorId", selectedOperatorId)
        }

        setLoading(true)
        const result = await createProduction(formData)
        setLoading(false)

        if (result?.success) {
            alert("Produksi berhasil diinput dan notifikasi Telegram terkirim!")
            window.location.reload()
        } else {
            alert("Error: " + JSON.stringify(result?.error || "Unknown error"))
        }
    }

    return {
        loading,
        canManageRate,
        // Location
        openLocation,
        setOpenLocation,
        selectedLocationId,
        setSelectedLocationId,
        resetDependentSelections,
        // Master arrays filtered
        activeProjects,
        activeVehicles,
        activeDrivers,
        activeQualities,
        activeWorkItems,
        activeOperators,
        uniqueCustomers,
        customerProjects,
        selectedProject,
        // Rates
        activeOpRateItem,
        activeMixerRateItem,
        // Combobox selection states
        openCustomer,
        setOpenCustomer,
        selectedCustomerId,
        handleSelectCustomer,
        openProject,
        setOpenProject,
        selectedProjectId,
        setSelectedProjectId,
        openVehicle,
        setOpenVehicle,
        selectedVehicleId,
        setSelectedVehicleId,
        openDriver,
        setOpenDriver,
        selectedDriverId,
        setSelectedDriverId,
        openOperator,
        setOpenOperator,
        selectedOperatorId,
        setSelectedOperatorId,
        openQuality,
        setOpenQuality,
        selectedQualityId,
        setSelectedQualityId,
        openWorkItem,
        setOpenWorkItem,
        selectedWorkItemId,
        setSelectedWorkItemId,
        // Modals
        ...shortcutModals,
        // Actions
        handleSubmit,
    }
}
