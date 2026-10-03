"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { fmtDateInput } from "../helpers"
import {
    addMaterialPrice,
    createMasterMaterial,
    editMaterialPriceHistory,
    deleteMaterialPriceHistory
} from "../actions"
import { MasterMaterialItem, MaterialPriceHistoryItem } from "../types"

export function useMasterMaterialDialogs(selectedLocation: string) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // 1. Unified Price Dialog State
    const [showUnifiedPriceDialog, setShowUnifiedPriceDialog] = useState(false)
    const [selectedMaterialForPrice, setSelectedMaterialForPrice] = useState<MasterMaterialItem | null>(null)

    // 2. Material-specific History Modal State
    const [showMaterialHistoryModal, setShowMaterialHistoryModal] = useState(false)
    const [selectedMaterialForHistory, setSelectedMaterialForHistory] = useState<MasterMaterialItem | null>(null)

    // 3. New Material Dialog State
    const [showNewMaterialDialog, setShowNewMaterialDialog] = useState(false)
    const [newMatCode, setNewMatCode] = useState("")
    const [newMatName, setNewMatName] = useState("")
    const [newMatCategory, setNewMatCategory] = useState("AGREGAT")
    const [newMatDensity, setNewMatDensity] = useState<number | string>("")
    const [newMatDescription, setNewMatDescription] = useState("")
    const [newMatInitialPrice, setNewMatInitialPrice] = useState<number | string>("")
    const [newMatEffectiveDate, setNewMatEffectiveDate] = useState(new Date().toISOString().split("T")[0])
    const [newMatLocationId, setNewMatLocationId] = useState("all")
    const [newMatError, setNewMatError] = useState("")

    // 4. Edit Specific History Entry Dialog State
    const [showEditHistoryDialog, setShowEditHistoryDialog] = useState(false)
    const [editHistoryId, setEditHistoryId] = useState("")
    const [editHistoryMaterialName, setEditHistoryMaterialName] = useState("")
    const [editHistoryPrice, setEditHistoryPrice] = useState<number | string>("")
    const [editHistoryDate, setEditHistoryDate] = useState("")
    const [editHistoryLocationId, setEditHistoryLocationId] = useState("all")
    const [editHistoryNotes, setEditHistoryNotes] = useState("")

    // 5. Delete Confirmation Dialog State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState("")
    const [deleteTargetText, setDeleteTargetText] = useState("")

    // --- Actions for Unified Price Dialog ---
    const handleOpenManagePrice = (mat: MasterMaterialItem) => {
        setSelectedMaterialForPrice(mat)
        setShowUnifiedPriceDialog(true)
    }

    const handleSaveNewPrice = async (payload: {
        materialId: string
        price_per_m3: number
        effective_date: string
        locationIds: string[]
        notes?: string
    }) => {
        return new Promise<void>((resolve, reject) => {
            startTransition(async () => {
                try {
                    await addMaterialPrice(payload)
                    toast.success("Tarif baru material berhasil ditetapkan.")
                    setShowUnifiedPriceDialog(false)
                    router.refresh()
                    resolve()
                } catch (err: any) {
                    toast.error(err.message || "Gagal menetapkan tarif baru.")
                    reject(err)
                }
            })
        })
    }

    const handleSaveCorrection = async (payload: {
        id: string
        price_per_m3: number
        effective_date: string
        locationId?: string | null
        notes?: string
    }) => {
        return new Promise<void>((resolve, reject) => {
            startTransition(async () => {
                try {
                    await editMaterialPriceHistory(payload)
                    toast.success("Koreksi data tarif berhasil disimpan.")
                    setShowUnifiedPriceDialog(false)
                    router.refresh()
                    resolve()
                } catch (err: any) {
                    toast.error(err.message || "Gagal menyimpan koreksi.")
                    reject(err)
                }
            })
        })
    }

    // --- Actions for Material History Modal ---
    const handleOpenMaterialHistory = (mat: MasterMaterialItem) => {
        setSelectedMaterialForHistory(mat)
        setShowMaterialHistoryModal(true)
    }

    // --- Actions for New Material Dialog ---
    const handleOpenNewMaterial = () => {
        setNewMatCode("")
        setNewMatName("")
        setNewMatCategory("AGREGAT")
        setNewMatDensity("")
        setNewMatDescription("")
        setNewMatInitialPrice("")
        setNewMatEffectiveDate(new Date().toISOString().split("T")[0])
        setNewMatLocationId(selectedLocation && selectedLocation !== "all" ? selectedLocation : "all")
        setNewMatError("")
        setShowNewMaterialDialog(true)
    }

    const handleCreateMaterial = () => {
        setNewMatError("")
        const numPrice = Number(newMatInitialPrice)
        if (!newMatCode.trim()) {
            setNewMatError("Kode material wajib diisi (misal: ABU_BATU).")
            return
        }
        if (!newMatName.trim()) {
            setNewMatError("Nama material wajib diisi.")
            return
        }
        if (!numPrice || numPrice <= 0) {
            setNewMatError("Harga awal per kubik harus lebih besar dari 0.")
            return
        }
        if (!newMatEffectiveDate) {
            setNewMatError("Tanggal mulai berlaku wajib diisi.")
            return
        }

        startTransition(async () => {
            try {
                await createMasterMaterial({
                    code: newMatCode.trim().toUpperCase(),
                    name: newMatName.trim(),
                    category: newMatCategory,
                    unit: "m³",
                    defaultDensity: newMatDensity ? Number(newMatDensity) : undefined,
                    description: newMatDescription.trim() || undefined,
                    initial_price: numPrice,
                    effective_date: newMatEffectiveDate,
                    locationId: newMatLocationId === "all" ? null : newMatLocationId,
                    notes: "Penetapan harga awal material baru",
                })
                toast.success(`Material baru ${newMatName} berhasil ditambahkan.`)
                setShowNewMaterialDialog(false)
                router.refresh()
            } catch (err: any) {
                setNewMatError(err.message || "Gagal membuat material baru.")
            }
        })
    }

    // --- Actions for Editing History from History List ---
    const handleOpenEditHistory = (h: any) => {
        setEditHistoryId(h.id)
        setEditHistoryMaterialName(h.material_name || h.material?.name || "Material")
        setEditHistoryPrice(h.price_per_m3)
        setEditHistoryDate(fmtDateInput(h.effective_date))
        setEditHistoryLocationId(h.locationId || "all")
        setEditHistoryNotes(h.notes || "")
        setShowEditHistoryDialog(true)
    }

    const handleSaveEditHistory = () => {
        const num = Number(editHistoryPrice)
        if (!num || num <= 0) {
            toast.error("Nominal harga harus lebih besar dari 0.")
            return
        }
        startTransition(async () => {
            try {
                await editMaterialPriceHistory({
                    id: editHistoryId,
                    price_per_m3: num,
                    effective_date: editHistoryDate,
                    locationId: editHistoryLocationId === "all" ? null : editHistoryLocationId,
                    notes: editHistoryNotes.trim() || undefined,
                })
                toast.success("Data riwayat harga berhasil diperbarui.")
                setShowEditHistoryDialog(false)
                router.refresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal mengupdate riwayat.")
            }
        })
    }

    // --- Actions for Deleting History ---
    const handleOpenDeleteConfirm = (id: string, text: string) => {
        setDeleteTargetId(id)
        setDeleteTargetText(text)
        setShowDeleteConfirm(true)
    }

    const handleConfirmDelete = () => {
        if (!deleteTargetId) return
        startTransition(async () => {
            try {
                await deleteMaterialPriceHistory(deleteTargetId)
                toast.success("Catatan riwayat berhasil dihapus.")
                setShowDeleteConfirm(false)
                router.refresh()
            } catch (err: any) {
                toast.error(err.message || "Gagal menghapus riwayat.")
            }
        })
    }

    return {
        isPending,

        // Unified Price Dialog
        showUnifiedPriceDialog,
        setShowUnifiedPriceDialog,
        selectedMaterialForPrice,
        handleOpenManagePrice,
        handleSaveNewPrice,
        handleSaveCorrection,

        // Material History Modal
        showMaterialHistoryModal,
        setShowMaterialHistoryModal,
        selectedMaterialForHistory,
        handleOpenMaterialHistory,

        // New Material Dialog
        showNewMaterialDialog,
        setShowNewMaterialDialog,
        newMatCode,
        setNewMatCode,
        newMatName,
        setNewMatName,
        newMatCategory,
        setNewMatCategory,
        newMatDensity,
        setNewMatDensity,
        newMatDescription,
        setNewMatDescription,
        newMatInitialPrice,
        setNewMatInitialPrice,
        newMatEffectiveDate,
        setNewMatEffectiveDate,
        newMatLocationId,
        setNewMatLocationId,
        newMatError,
        handleOpenNewMaterial,
        handleCreateMaterial,

        // Edit History Entry Dialog
        showEditHistoryDialog,
        setShowEditHistoryDialog,
        editHistoryId,
        editHistoryMaterialName,
        editHistoryPrice,
        setEditHistoryPrice,
        editHistoryDate,
        setEditHistoryDate,
        editHistoryLocationId,
        setEditHistoryLocationId,
        editHistoryNotes,
        setEditHistoryNotes,
        handleOpenEditHistory,
        handleSaveEditHistory,

        // Delete Confirm Dialog
        showDeleteConfirm,
        setShowDeleteConfirm,
        deleteTargetText,
        handleOpenDeleteConfirm,
        handleConfirmDelete,
    }
}
