import { NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { readFile } from "fs/promises"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> } // In Next.js App Router, params could be a Promise or standard obj depending on version, wait Next 15+ is Promise, Next < 15 is plain object. We can await it to be safe for Next 15.
) {
    const p = await params;
    const { filename } = p;
    if (!filename) return new NextResponse("Not Found", { status: 404 })

    try {
        const filePath = join(process.cwd(), "public", "uploads", "logos", filename)
        const fileBuffer = await readFile(filePath)

        const ext = filename.split(".").pop()?.toLowerCase() || ""
        let contentType = "image/jpeg"
        if (ext === "png") contentType = "image/png"
        else if (ext === "webp") contentType = "image/webp"

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        })
    } catch (error) {
        return new NextResponse("File not found or unreadable", { status: 404 })
    }
}
