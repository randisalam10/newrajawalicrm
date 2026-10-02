"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createRblCategory, updateRblCategory, deleteRblCategory } from "../actions"

interface UseRblCategoriesProps {
    initialCategories: any[]
    onCategoryCreatedForRow?: (rowId: string, category: any) => void
}

export function useRblCategories({
    initialCategories,
    onCategoryCreatedForRow,
}: UseRblCategoriesProps) {
    const [categories, setCategories] = useState<any[]>(initialCategories)
    const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false)
    const [quickCategoryTargetRowId, setQuickCategoryTargetRowId] = useState<string | null>(null)
    const [quickCategoryForm, setQuickCategoryForm] = useState({ name: "", description: "", requireVehicleKm: false })
    const [isCategorySubmitting, setIsCategorySubmitting] = useState(false)
    const [categoryModalMode, setCategoryModalMode] = useState<"create" | "edit">("create")
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

    const handleOpenQuickCategory = (rowId?: string) => {
        setCategoryModalMode("create")
        setEditingCategoryId(null)
        setQuickCategoryTargetRowId(rowId || null)
        setQuickCategoryForm({ name: "", description: "", requireVehicleKm: false })
        setIsQuickCategoryOpen(true)
    }

    const handleOpenEditCategory = (cat: any) => {
        setCategoryModalMode("edit")
        setEditingCategoryId(cat.id)
        setQuickCategoryForm({
            name: cat.name,
            description: cat.description || "",
            requireVehicleKm: Boolean(cat.requireVehicleKm)
        })
        setIsQuickCategoryOpen(true)
    }

    const handleSaveCategory = async () => {
        if (!quickCategoryForm.name.trim()) {
            toast.error("Nama kategori wajib diisi.")
            return
        }
        setIsCategorySubmitting(true)
        try {
            if (categoryModalMode === "create") {
                const res = await createRblCategory(quickCategoryForm)
                if (res.success && res.category) {
                    toast.success(`Kategori "${res.category.name}" berhasil dibuat!`)
                    setCategories(prev => [...prev, res.category])
                    if (quickCategoryTargetRowId && onCategoryCreatedForRow) {
                        onCategoryCreatedForRow(quickCategoryTargetRowId, res.category)
                    }
                    setIsQuickCategoryOpen(false)
                } else {
                    toast.error(res.error || "Gagal membuat kategori.")
                }
            } else if (categoryModalMode === "edit" && editingCategoryId) {
                const res = await updateRblCategory(editingCategoryId, quickCategoryForm)
                if (res.success && res.category) {
                    toast.success(`Kategori "${res.category.name}" berhasil diperbarui!`)
                    setCategories(prev => prev.map(c => c.id === editingCategoryId ? res.category : c))
                    setIsQuickCategoryOpen(false)
                } else {
                    toast.error(res.error || "Gagal memperbarui kategori.")
                }
            }
        } catch (e: any) {
            toast.error(e.message || "Terjadi kesalahan sistem.")
        } finally {
            setIsCategorySubmitting(false)
        }
    }

    const handleDeleteCategory = async (cat: any) => {
        if (cat.isSystem) {
            toast.error("Kategori bawaan sistem tidak dapat dihapus.")
            return
        }
        if (!confirm(`Hapus kategori "${cat.name}"?`)) return

        try {
            const res = await deleteRblCategory(cat.id)
            if (res.success) {
                toast.success(`Kategori "${cat.name}" berhasil dihapus.`)
                setCategories(prev => prev.filter(c => c.id !== cat.id))
            } else {
                toast.error(res.error || "Gagal menghapus kategori.")
            }
        } catch (e: any) {
            toast.error(e.message || "Gagal menghapus kategori.")
        }
    }

    return {
        categories,
        setCategories,
        isQuickCategoryOpen,
        setIsQuickCategoryOpen,
        quickCategoryForm,
        setQuickCategoryForm,
        isCategorySubmitting,
        categoryModalMode,
        handleOpenQuickCategory,
        handleOpenEditCategory,
        handleSaveCategory,
        handleDeleteCategory,
    }
}
