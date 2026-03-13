import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(req: Request) {
    const session = await auth()

    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { fcmToken } = body

        if (!fcmToken) {
            return NextResponse.json({ success: false, error: "fcmToken is required" }, { status: 400 })
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { fcmToken }
        })

        return NextResponse.json({ success: true, message: "FCM token updated successfully" })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
