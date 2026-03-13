import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { verifyMobileToken } from "@/lib/auth-mobile"

export async function PATCH(req: Request) {
    let userId: string | undefined

    // 1. Cek Autentikasi Web (NextAuth)
    const session = await auth()
    if (session?.user?.id) {
        userId = session.user.id
    }

    // 2. Cek Autentikasi Mobile (JWT kustom) jika web session gagal
    if (!userId) {
        const { user, error } = verifyMobileToken(req)
        if (user?.id) {
            userId = user.id
        }
    }

    if (!userId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { fcmToken } = body

        if (!fcmToken) {
            return NextResponse.json({ success: false, error: "fcmToken is required" }, { status: 400 })
        }

        await prisma.user.update({
            where: { id: userId },
            data: { fcmToken }
        })

        return NextResponse.json({ success: true, message: "FCM token updated successfully" })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
