"use client"

import { useState, useRef, useMemo, useTransition } from "react"
import { toast } from "sonner"
import { compressImage } from "../utils/rbl-helpers"
import { uploadBulkReceipts, deleteAttachment } from "../actions"
import { StagedFile } from "../types"

interface UseBulkReceiptsProps {
    activeBudget: any
    selectedLocation: string
    reloadData: (locId: string) => void
}

export function useBulkReceipts({
    activeBudget,
    selectedLocation,
    reloadData,
}: UseBulkReceiptsProps) {
    const [, startTransition] = useTransition()
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([])
    const [isCompressing, setIsCompressing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const compressionStats = useMemo(() => {
        if (stagedFiles.length === 0) return null
        const totalOriginal = stagedFiles.reduce((s, f) => s + f.originalSize, 0)
        const totalCompressed = stagedFiles.reduce((s, f) => s + f.compressedSize, 0)
        const savedPercent = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0
        return { totalOriginal, totalCompressed, savedPercent }
    }, [stagedFiles])

    const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files)
            setIsCompressing(true)
            toast.info(`Sedang mengompresi ${filesArray.length} foto nota untuk mengoptimalkan ukuran...`)

            try {
                const compressedResults: StagedFile[] = []
                for (const file of filesArray) {
                    const result = await compressImage(file)
                    compressedResults.push(result)
                }
                setStagedFiles(prev => [...prev, ...compressedResults])
                toast.success(`${compressedResults.length} foto nota siap diunggah!`)
            } catch (err) {
                toast.error("Gagal mengompresi beberapa foto.")
            } finally {
                setIsCompressing(false)
            }
        }
    }

    const handleExecuteBulkUpload = async () => {
        if (!activeBudget) {
            toast.error("Tidak ada budget aktif. Upload nota wajib terikat ke budget aktif.")
            return
        }
        if (stagedFiles.length === 0) {
            toast.error("Pilih minimal satu foto nota.")
            return
        }

        setIsUploading(true)
        try {
            const formData = new FormData()
            for (const item of stagedFiles) {
                formData.append("files", item.file)
            }

            const res = await uploadBulkReceipts(activeBudget.id, formData)
            if (res.success) {
                toast.success(`Berhasil mengunggah ${res.count} foto nota ke budget ${activeBudget.code}!`)
                setStagedFiles([])
                if (fileInputRef.current) fileInputRef.current.value = ""
                reloadData(selectedLocation)
            } else {
                toast.error(res.error || "Gagal mengunggah foto nota.")
            }
        } catch (e: any) {
            toast.error(e.message || "Terjadi kesalahan saat upload.")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDeleteAttachment = async (id: string) => {
        if (!confirm("Hapus foto nota ini dari galeri?")) return
        startTransition(async () => {
            const res = await deleteAttachment(id)
            if (res.success) {
                toast.success("Foto nota dihapus.")
                reloadData(selectedLocation)
            } else {
                toast.error(res.error || "Gagal menghapus.")
            }
        })
    }

    return {
        stagedFiles,
        setStagedFiles,
        isCompressing,
        isUploading,
        fileInputRef,
        compressionStats,
        handleFilesSelected,
        handleExecuteBulkUpload,
        handleDeleteAttachment,
    }
}
