import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { auth } from "@/auth"
import { verifyMobileToken } from "@/lib/auth-mobile"

export async function POST(req: NextRequest) {
    // 1. Auth check: Web session or Mobile Bearer token
    let userId: string | null = null
    const session = await auth()
    if (session?.user?.id) {
        userId = session.user.id
    } else {
        const mobileAuth = verifyMobileToken(req)
        if (!mobileAuth.error && mobileAuth.user?.id) {
            userId = mobileAuth.user.id
        }
    }

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if JSON request with base64 (useful for canvas signatures from mobile/web)
    const contentType = req.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
        try {
            const body = await req.json()
            const { imageBase64, folder = "signatures" } = body
            if (!imageBase64) {
                return NextResponse.json({ error: "No imageBase64 provided" }, { status: 400 })
            }

            // Extract base64 data
            const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
            const buffer = matches
                ? Buffer.from(matches[2], "base64")
                : Buffer.from(imageBase64, "base64")

            const ext = matches && matches[1].includes("jpeg") ? "jpg" : "png"
            const filename = `sig_${userId}_${Date.now()}.${ext}`
            const safeFolder = folder === "signatures" ? "signatures" : "payments"
            const uploadDir = join(process.cwd(), "uploads", safeFolder)

            await mkdir(uploadDir, { recursive: true })
            await writeFile(join(uploadDir, filename), buffer)

            const url = `/api/files/${safeFolder}/${filename}`
            return NextResponse.json({ success: true, url })
        } catch (err: any) {
            return NextResponse.json({ error: "Failed to process base64 image: " + err.message }, { status: 500 })
        }
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "payments"
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "Tipe file tidak didukung. Gunakan JPG, PNG, atau PDF." }, { status: 400 })
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Ukuran file maks 5MB." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const safeFolder = folder === "signatures" ? "signatures" : "payments"
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const prefix = safeFolder === "signatures" ? "sig" : "pay"
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const uploadDir = join(process.cwd(), "uploads", safeFolder)
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    const url = `/api/files/${safeFolder}/${filename}`
    return NextResponse.json({ success: true, url })
}
