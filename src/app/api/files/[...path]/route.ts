import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { verifyMobileToken } from "@/lib/auth-mobile"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

const MIME_TYPES: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    pdf: "application/pdf",
}

const ALLOWED_EXTENSIONS = Object.keys(MIME_TYPES)

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    // ── 1. Auth check — support NextAuth session & Mobile Bearer token ──
    const session = await auth()
    let isAuthenticated = !!session?.user

    if (!isAuthenticated) {
        const mobileAuth = verifyMobileToken(req)
        if (!mobileAuth.error) {
            isAuthenticated = true
        }
    }

    if (!isAuthenticated) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    // ── 2. Build safe file path ──
    // params.path is e.g. ["payments", "pay_1234_abc.jpg"]
    const { path } = await params
    const relPath = path.join("/")

    // Security: prevent path traversal attacks
    if (relPath.includes("..") || relPath.includes("~")) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    const ext = relPath.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return new NextResponse("File type not allowed", { status: 403 })
    }

    // Files are stored OUTSIDE of public/ to prevent static serving by Next.js
    const filePath = join(process.cwd(), "uploads", relPath)

    // ── 3. Check file exists ──
    if (!existsSync(filePath)) {
        return new NextResponse("Not Found", { status: 404 })
    }

    // ── 4. Read and serve with correct Content-Type ──
    try {
        const file = await readFile(filePath)
        const mimeType = MIME_TYPES[ext] ?? "application/octet-stream"

        return new NextResponse(file, {
            status: 200,
            headers: {
                "Content-Type": mimeType,
                // Prevent caching of sensitive files
                "Cache-Control": "private, no-store",
                // For PDFs: inline display; for images: inline
                "Content-Disposition": ext === "pdf"
                    ? `inline; filename="${path.at(-1)}"`
                    : "inline",
            },
        })
    } catch {
        return new NextResponse("Error reading file", { status: 500 })
    }
}
