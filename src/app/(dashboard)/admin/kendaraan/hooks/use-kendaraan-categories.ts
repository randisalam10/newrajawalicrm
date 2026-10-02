"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createVehicleCategory, deleteVehicleCategory } from "../actions"
import { VehicleCategory } from "../types"

export function useKendaraanCategories(initialCategories: VehicleCategory[] = []) {
    const [categories, setCategories] = useState<VehicleCategory[]>(initialCategories)
    const [isPending, startTransition] = useTransition()

    // Shortcut Modal: Quick Add Vehicle Category
    const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false)
    const [quickCategoryName, setQuickCategoryName] = useState("")
    const [quickCategoryCode, setQuickCategoryCode] = useState("")
    const [quickCategoryDesc, setQuickCategoryDesc] = useState("")
    const [isSavingCategory, setIsSavingCategory] = useState(false)

    // Master Category Management Dialog
    const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false)

    // Quick Category Save (from shortcut)
    const handleSaveQuickCategory = async (
        e: React.FormEvent,
        onCategoryCreated?: (categoryId: string) => void
    ) => {
        e.preventDefault()
        if (!quickCategoryName.trim()) {
            toast.error("Nama kategori kendaraan wajib diisi.")
            return
        }

        setIsSavingCategory(true)
        try {
            const res = await createVehicleCategory({
                name: quickCategoryName.trim(),
                code: quickCategoryCode.trim() || undefined,
                description: quickCategoryDesc.trim() || undefined
            })

            if (res.success && res.category) {
                toast.success(`Kategori "${res.category.name}" berhasil dibuat!`)
                setCategories(prev => {
                    if (prev.some(c => c.id === res.category.id)) return prev
                    return [...prev, res.category]
                })
                if (onCategoryCreated) {
                    onCategoryCreated(res.category.id)
                }
                setQuickCategoryName("")
                setQuickCategoryCode("")
                setQuickCategoryDesc("")
                setIsQuickCategoryOpen(false)
            } else {
                toast.error(res.error || "Gagal membuat kategori kendaraan.")
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal membuat kategori.")
        } finally {
            setIsSavingCategory(false)
        }
    }

    // Delete Category from master list
    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`Hapus kategori "${name}"?`)) return

        startTransition(async () => {
            const res = await deleteVehicleCategory(id)
            if (res.success) {
                toast.success(`Kategori "${name}" berhasil dihapus.`)
                setCategories(prev => prev.filter(c => c.id !== id))
            } else {
                toast.error(res.error || "Gagal menghapus kategori.")
            }
        })
    }

    return {
        categories,
        setCategories,
        isPending,
        isQuickCategoryOpen,
        setIsQuickCategoryOpen,
        quickCategoryName,
        setQuickCategoryName,
        quickCategoryCode,
        setQuickCategoryCode,
        quickCategoryDesc,
        setQuickCategoryDesc,
        isSavingCategory,
        isManageCategoriesOpen,
        setIsManageCategoriesOpen,
        handleSaveQuickCategory,
        handleDeleteCategory
    }
}
