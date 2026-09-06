import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { verifyMobileToken } from "@/lib/auth-mobile"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
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

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, signatureUrl: true, role: true }
    })

    return NextResponse.json({ success: true, data: user })
}

export async function POST(req: NextRequest) {
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

    try {
        const body = await req.json()
        const { signatureUrl } = body

        if (!signatureUrl) {
            return NextResponse.json({ error: "signatureUrl is required" }, { status: 400 })
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { signatureUrl },
            select: { id: true, username: true, signatureUrl: true }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
