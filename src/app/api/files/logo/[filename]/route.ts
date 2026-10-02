import { NextRequest, NextResponse } from "next/server"
import { join, resolve, basename } from "path"
import { readFile } from "fs/promises"

const ALLOWED_EXTENSIONS: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const p = await params
    const rawFilename = p?.filename

    if (!rawFilename) return new NextResponse("Not Found", { status: 404 })

    // Security: Extract basename only to prevent directory traversal
    const safeFilename = basename(rawFilename)

    // Security: Reject suspicious characters
    if (safeFilename.includes("..") || /[^a-zA-Z0-9_\-\.]/.test(safeFilename)) {
        return new NextResponse("Forbidden: Invalid filename", { status: 403 })
    }

    const ext = safeFilename.split(".").pop()?.toLowerCase() || ""
    if (!ALLOWED_EXTENSIONS[ext]) {
        return new NextResponse("Forbidden: File type not permitted", { status: 403 })
    }

    try {
        const uploadDir = resolve(process.env.UPLOAD_DIR || join(process.cwd(), "uploads", "logos"))
        let filePath = resolve(uploadDir, safeFilename)

        // Ensure filePath stays strictly inside uploadDir
        if (!filePath.startsWith(uploadDir)) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        // Fallback: check legacy public/uploads/logos if not found in persistent dir
        const { existsSync } = await import("fs")
        if (!existsSync(filePath)) {
            const legacyDir = resolve(process.cwd(), "public", "uploads", "logos")
            const legacyPath = resolve(legacyDir, safeFilename)
            if (legacyPath.startsWith(legacyDir) && existsSync(legacyPath)) {
                filePath = legacyPath
            }
        }

        if (!existsSync(filePath)) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const fileBuffer = await readFile(filePath)
        const contentType = ALLOWED_EXTENSIONS[ext]

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
                "X-Content-Type-Options": "nosniff"
            },
        })
    } catch {
        return new NextResponse("File not found or unreadable", { status: 404 })
    }
}

