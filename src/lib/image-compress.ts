/**
 * Utility for client-side image compression before upload
 * Resizes large smartphone/camera photos (e.g. 5-15MB) down to crisp, web-optimized JPEGs (150-350KB)
 * Preserves text readability for receipts, payment slips, and invoices.
 */

export interface CompressionOptions {
    maxWidth?: number
    maxHeight?: number
    quality?: number
}

export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    // If not an image (e.g. PDF), return original
    if (!file.type.startsWith("image/")) {
        return file
    }

    const {
        maxWidth = 1600,
        maxHeight = 1600,
        quality = 0.8,
    } = options

    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)

        reader.onload = (e) => {
            const img = new Image()
            img.src = e.target?.result as string

            img.onload = () => {
                let width = img.width
                let height = img.height

                // Calculate scaling while preserving aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width)
                        width = maxWidth
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height)
                        height = maxHeight
                    }
                }

                const canvas = document.createElement("canvas")
                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    resolve(file)
                    return
                }

                // Smooth resizing
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = "high"
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (!blob || blob.size >= file.size) {
                            // If compression didn't save space, keep original
                            resolve(file)
                            return
                        }

                        const compressedName = file.name.replace(/\.[^/.]+$/, "") + ".jpg"
                        const compressedFile = new File([blob], compressedName, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        })

                        resolve(compressedFile)
                    },
                    "image/jpeg",
                    quality
                )
            }

            img.onerror = () => resolve(file)
        }

        reader.onerror = () => resolve(file)
    })
}
