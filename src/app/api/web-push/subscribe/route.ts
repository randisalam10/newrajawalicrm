import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { subscription, userAgent } = body

        if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
            return NextResponse.json({ error: 'Subscription data tidak lengkap' }, { status: 400 })
        }

        const saved = await prisma.webPushSubscription.upsert({
            where: {
                endpoint: subscription.endpoint
            },
            create: {
                userId: session.user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userAgent: userAgent || req.headers.get('user-agent') || null
            },
            update: {
                userId: session.user.id,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userAgent: userAgent || req.headers.get('user-agent') || null
            }
        })

        return NextResponse.json({ success: true, id: saved.id })
    } catch (error: any) {
        console.error('[WebPush API] Error saving subscription:', error)
        return NextResponse.json({ error: error.message || 'Gagal menyimpan subscription' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { endpoint } = body

        if (endpoint) {
            await prisma.webPushSubscription.deleteMany({
                where: {
                    endpoint,
                    userId: session.user.id
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[WebPush API] Error deleting subscription:', error)
        return NextResponse.json({ error: error.message || 'Gagal menghapus subscription' }, { status: 500 })
    }
}
