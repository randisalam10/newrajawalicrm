import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "Hanya JPG, PNG, atau WebP yang diizinkan." }, { status: 400 })
    }

    if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "Ukuran logo maks 2MB." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png"
    const filename = `logo_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    // Store in public/ so react-pdf can access it via URL
    const uploadDir = join(process.cwd(), "public", "uploads", "logos")

    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    const url = `/uploads/logos/${filename}`
    return NextResponse.json({ url })
}
