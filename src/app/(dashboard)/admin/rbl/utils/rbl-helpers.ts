import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { StagedFile } from "../types"

export const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n || 0))
export const fmtDate = (d: any) => d ? format(new Date(d), "dd MMMM yyyy", { locale: idLocale }) : "-"
export const fmtShortDate = (d: any) => d ? format(new Date(d), "dd/MM/yyyy") : "-"

export const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export async function compressImage(file: File, maxDim = 1920, quality = 0.82): Promise<StagedFile> {
    const originalSize = file.size
    const previewUrl = URL.createObjectURL(file)

    if (!file.type.startsWith("image/")) {
        return { file, name: file.name, originalSize, compressedSize: originalSize, previewUrl }
    }

    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string
            img.onload = () => {
                let { width, height } = img
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width)
                        width = maxDim
                    } else {
                        width = Math.round((width * maxDim) / height)
                        height = maxDim
                    }
                }
                const canvas = document.createElement("canvas")
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    return resolve({ file, name: file.name, originalSize, compressedSize: originalSize, previewUrl })
                }
                ctx.drawImage(img, 0, 0, width, height)
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return resolve({ file, name: file.name, originalSize, compressedSize: originalSize, previewUrl })
                        }
                        const newName = file.name.replace(/\.[^/.]+$/, ".jpg")
                        const compressedFile = new File([blob], newName, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        })
                        const compressedPreview = URL.createObjectURL(compressedFile)
                        resolve({
                            file: compressedFile,
                            name: newName,
                            originalSize,
                            compressedSize: compressedFile.size,
                            previewUrl: compressedPreview
                        })
                    },
                    "image/jpeg",
                    quality
                )
            }
            img.onerror = () => resolve({ file, name: file.name, originalSize, compressedSize: originalSize, previewUrl })
        }
        reader.onerror = () => resolve({ file, name: file.name, originalSize, compressedSize: originalSize, previewUrl })
    })
}
