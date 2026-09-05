import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyMobileToken } from "@/lib/auth-mobile"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(req: NextRequest) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    if (!['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const isSuperAdmin = ['SuperAdminBP', 'CEO', 'FVP'].includes(user.role)

    try {
        const formData = await req.formData()
        const budgetId = formData.get("budgetId") as string | null
        const caption = formData.get("caption") as string | null

        if (!budgetId) {
            return NextResponse.json({ error: "budgetId wajib disertakan" }, { status: 400 })
        }

        const budget = await prisma.rblBudget.findUnique({
            where: { id: budgetId },
            include: { location: true }
        })

        if (!budget) {
            return NextResponse.json({ error: "Budget RBL tidak ditemukan" }, { status: 404 })
        }

        if (!isSuperAdmin && budget.locationId !== user.locationId) {
            return NextResponse.json({ error: "Forbidden: Akses ditolak untuk cabang ini" }, { status: 403 })
        }

        if (budget.status === "CLOSED") {
            return NextResponse.json({
                error: "Budget sudah DITUTUP. Tidak dapat menambah lampiran nota baru."
            }, { status: 400 })
        }

        const files = formData.getAll("files") as File[]
        const singleFile = formData.get("file") as File | null

        const uploadFiles: File[] = []
        if (files && files.length > 0) {
            uploadFiles.push(...files)
        } else if (singleFile) {
            uploadFiles.push(singleFile)
        }

        if (uploadFiles.length === 0) {
            return NextResponse.json({ error: "Tidak ada file foto yang diunggah" }, { status: 400 })
        }

        const uploadDir = join(process.cwd(), "uploads", "rbl", budgetId)
        await mkdir(uploadDir, { recursive: true })

        const createdAttachments = []

        for (const file of uploadFiles) {
            if (!file.name) continue

            // Validasi tipe file
            const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json({
                    error: `Format file ${file.name} tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.`
                }, { status: 400 })
            }

            // Max 10MB per file
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json({
                    error: `Ukuran file ${file.name} melebihi batas 10MB.`
                }, { status: 400 })
            }

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
            const uniqueFilename = `nota_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
            const filePath = join(uploadDir, uniqueFilename)

            await writeFile(filePath, buffer)

            const fileUrl = `/api/files/rbl/${budgetId}/${uniqueFilename}`

            const record = await prisma.rblAttachment.create({
                data: {
                    budgetId,
                    fileUrl,
                    fileName: file.name,
                    fileSize: file.size,
                    caption: caption || null,
                    uploadedById: user.id
                }
            })

            createdAttachments.push(record)
        }

        return NextResponse.json({
            success: true,
            message: `Berhasil mengunggah ${createdAttachments.length} foto nota`,
            data: createdAttachments
        })

    } catch (error: any) {
        console.error("Mobile Upload RBL Attachment Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
