"use client"

import { useState, useTransition } from "react"
import { fmtDateInput } from "../helpers"
import {
    addMaterialPrice,
    createMasterMaterial,
    editMaterialPriceHistory,
    deleteMaterialPriceHistory
} from "../actions"
import { MasterMaterialItem } from "../types"

export function useMasterMaterialDialogs(selectedLocation: string) {
    const [isPending, startTransition] = useTransition()

    // Dialog state for setting new price
    const [showPriceDialog, setShowPriceDialog] = useState(false)
    const [priceFormMaterialId, setPriceFormMaterialId] = useState("")
    const [priceFormValue, setPriceFormValue] = useState<number | string>("")
    const [priceFormEffectiveDate, setPriceFormEffectiveDate] = useState(new Date().toISOString().split("T")[0])
    const [priceFormLocationIds, setPriceFormLocationIds] = useState<string[]>(["all"])
    const [priceFormNotes, setPriceFormNotes] = useState("")
    const [priceError, setPriceError] = useState("")

    // Dialog state for creating new material
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

    // Dialog state for editing history
    const [showEditHistoryDialog, setShowEditHistoryDialog] = useState(false)
    const [editHistoryId, setEditHistoryId] = useState("")
    const [editHistoryMaterialName, setEditHistoryMaterialName] = useState("")
    const [editHistoryPrice, setEditHistoryPrice] = useState<number | string>("")
    const [editHistoryDate, setEditHistoryDate] = useState("")
    const [editHistoryLocationId, setEditHistoryLocationId] = useState("all")
    const [editHistoryNotes, setEditHistoryNotes] = useState("")

    // Dialog state for delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState("")
    const [deleteTargetText, setDeleteTargetText] = useState("")

    // Open set price modal for specific material
    const handleOpenSetPrice = (mat: MasterMaterialItem) => {
        setPriceFormMaterialId(mat.id)
        setPriceFormValue(mat.displayPrice || mat.currentPrice || "")
        setPriceFormEffectiveDate(new Date().toISOString().split("T")[0])
        setPriceFormLocationIds(selectedLocation === "all" ? ["all"] : [selectedLocation])
        setPriceFormNotes("")
        setPriceError("")
        setShowPriceDialog(true)
    }

    // Submit Set Price
    const handleSavePrice = () => {
        setPriceError("")
        const numPrice = Number(priceFormValue)
        if (!numPrice || numPrice <= 0) {
            setPriceError("Nominal harga per kubik harus lebih besar dari 0.")
            return
        }
        if (!priceFormEffectiveDate) {
            setPriceError("Tanggal mulai berlaku wajib dipilih.")
            return
        }
        if (!priceFormLocationIds || priceFormLocationIds.length === 0) {
            setPriceError("Pilih minimal satu cabang atau Semua Cabang.")
            return
        }

        startTransition(async () => {
            try {
                await addMaterialPrice({
                    materialId: priceFormMaterialId,
                    price_per_m3: numPrice,
                    effective_date: priceFormEffectiveDate,
                    locationIds: priceFormLocationIds,
                    notes: priceFormNotes,
                })
                setShowPriceDialog(false)
                window.location.reload()
            } catch (err: any) {
                setPriceError(err.message || "Gagal menyimpan harga material.")
            }
        })
    }

    // Open New Material Dialog
    const handleOpenNewMaterial = () => {
        setNewMatCode("")
        setNewMatName("")
        setNewMatCategory("AGREGAT")
        setNewMatDensity("")
        setNewMatDescription("")
        setNewMatInitialPrice("")
        setNewMatEffectiveDate(new Date().toISOString().split("T")[0])
        setNewMatLocationId("all")
        setNewMatError("")
        setShowNewMaterialDialog(true)
    }

    // Submit New Material
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
                    code: newMatCode,
                    name: newMatName,
                    category: newMatCategory,
                    unit: "m³",
                    defaultDensity: newMatDensity ? Number(newMatDensity) : undefined,
                    description: newMatDescription,
                    initial_price: numPrice,
                    effective_date: newMatEffectiveDate,
                    locationId: newMatLocationId === "all" ? null : newMatLocationId,
                    notes: "Penetapan harga awal material baru",
                })
                setShowNewMaterialDialog(false)
                window.location.reload()
            } catch (err: any) {
                setNewMatError(err.message || "Gagal membuat material baru.")
            }
        })
    }

    // Open Edit History Modal
    const handleOpenEditHistory = (h: any) => {
        setEditHistoryId(h.id)
        setEditHistoryMaterialName(h.material_name)
        setEditHistoryPrice(h.price_per_m3)
        setEditHistoryDate(fmtDateInput(h.effective_date))
        setEditHistoryLocationId(h.locationId || "all")
        setEditHistoryNotes(h.notes || "")
        setShowEditHistoryDialog(true)
    }

    // Quick Edit Active Price & Effective Date directly from Tab 1 or Cards
    const handleQuickEditActivePrice = (mat: MasterMaterialItem) => {
        let activeEntry = mat.histories?.find((h: any) => h.id === mat.currentHistoryId)
        if (!activeEntry && mat.histories && mat.histories.length > 0) {
            activeEntry = mat.histories[0]
        }

        if (activeEntry) {
            handleOpenEditHistory(activeEntry)
        } else {
            setEditHistoryId(mat.currentHistoryId || mat.id || "")
            setEditHistoryMaterialName(mat.name)
            setEditHistoryPrice(mat.currentPrice || 0)
            setEditHistoryDate(fmtDateInput(mat.currentEffectiveDate || new Date()))
            setEditHistoryLocationId(mat.currentLocationId || "all")
            setEditHistoryNotes(mat.currentNotes || "")
            setShowEditHistoryDialog(true)
        }
    }

    // Submit Edit History
    const handleSaveEditHistory = () => {
        const num = Number(editHistoryPrice)
        if (!num || num <= 0) return
        startTransition(async () => {
            try {
                await editMaterialPriceHistory({
                    id: editHistoryId,
                    price_per_m3: num,
                    effective_date: editHistoryDate,
                    locationId: editHistoryLocationId === "all" ? null : editHistoryLocationId,
                    notes: editHistoryNotes,
                })
                setShowEditHistoryDialog(false)
                window.location.reload()
            } catch (err: any) {
                alert(err.message || "Gagal mengupdate riwayat.")
            }
        })
    }

    // Open Delete Confirm
    const handleOpenDeleteConfirm = (id: string, text: string) => {
        setDeleteTargetId(id)
        setDeleteTargetText(text)
        setShowDeleteConfirm(true)
    }

    // Execute Delete History
    const handleConfirmDelete = () => {
        if (!deleteTargetId) return
        startTransition(async () => {
            try {
                await deleteMaterialPriceHistory(deleteTargetId)
                setShowDeleteConfirm(false)
                window.location.reload()
            } catch (err: any) {
                alert(err.message || "Gagal menghapus riwayat.")
            }
        })
    }

    return {
        isPending,
        // Price Dialog
        showPriceDialog,
        setShowPriceDialog,
        priceFormMaterialId,
        setPriceFormMaterialId,
        priceFormValue,
        setPriceFormValue,
        priceFormEffectiveDate,
        setPriceFormEffectiveDate,
        priceFormLocationIds,
        setPriceFormLocationIds,
        priceFormNotes,
        setPriceFormNotes,
        priceError,
        handleOpenSetPrice,
        handleSavePrice,
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
        // Edit History Dialog
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
        handleQuickEditActivePrice,
        handleSaveEditHistory,
        // Delete Confirm Dialog
        showDeleteConfirm,
        setShowDeleteConfirm,
        deleteTargetText,
        handleOpenDeleteConfirm,
        handleConfirmDelete,
    }
}
