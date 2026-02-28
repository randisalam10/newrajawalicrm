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

    // Generate unique filename
    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `pay_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    // Store OUTSIDE of public/ so Next.js does NOT serve it statically
    // Files are only accessible via the authenticated /api/files/ route
    const uploadDir = join(process.cwd(), "uploads", "payments")

    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    const url = `/api/files/payments/${filename}`
    return NextResponse.json({ url })
}
