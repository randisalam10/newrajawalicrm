import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

const cleanStr = (val?: string) => {
    if (!val) return undefined
    let s = val.trim()
    while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1).trim()
    }
    return s
}
const publicKey = cleanStr(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
const privateKey = cleanStr(process.env.VAPID_PRIVATE_KEY)
const subject = cleanStr(process.env.VAPID_SUBJECT) || 'mailto:rsi.rajawali@gmail.com'

if (publicKey && privateKey) {
    try {
        webpush.setVapidDetails(subject, publicKey, privateKey)
        console.log('[WebPush] VAPID details configured successfully.')
    } catch (err: any) {
        console.error('[WebPush] Failed to set VAPID details:', err.message)
    }
} else {
    console.warn('Web Push VAPID keys not configured in environment variables.')
}

export interface WebPushPayload {
    title: string
    body: string
    url?: string
    tag?: string
    icon?: string
}

/**
 * Mengirim Web Push Notification ke daftar user ID tertentu.
 * Otomatis membersihkan subscription yang sudah kadaluarsa (HTTP 410 / 404).
 */
export async function sendWebPushToUsers(userIds: string[], payload: WebPushPayload) {
    if (!publicKey || !privateKey || userIds.length === 0) {
        return { sent: 0, failed: 0 }
    }

    try {
        const subscriptions = await prisma.webPushSubscription.findMany({
            where: {
                userId: { in: userIds }
            }
        })

        if (subscriptions.length === 0) {
            console.log(`[WebPush] Tidak ada subscription browser aktif untuk users:`, userIds)
            return { sent: 0, failed: 0 }
        }

        const notificationData = JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/logistik/approval',
            tag: payload.tag || ('po-' + Date.now()),
            icon: payload.icon || '/favicon.ico'
        })

        let sent = 0
        let failed = 0
        const staleEndpoints: string[] = []

        await Promise.all(
            subscriptions.map(async (sub) => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }

                try {
                    await webpush.sendNotification(pushSubscription, notificationData)
                    sent++
                } catch (err: any) {
                    failed++
                    // Status 410 (Gone) atau 404 (Not Found) menandakan subscription sudah tidak valid/dihapus oleh browser
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        staleEndpoints.push(sub.endpoint)
                    } else {
                        console.error('[WebPush] Gagal mengirim push ke endpoint:', sub.endpoint, err.message)
                    }
                }
            })
        )

        // Hapus subscription kadaluarsa
        if (staleEndpoints.length > 0) {
            await prisma.webPushSubscription.deleteMany({
                where: {
                    endpoint: { in: staleEndpoints }
                }
            })
            console.log(`[WebPush] Menghapus ${staleEndpoints.length} subscription kadaluarsa.`)
        }

        console.log(`[WebPush] Terkirim: ${sent}, Gagal: ${failed}`)
        return { sent, failed }
    } catch (error) {
        console.error('[WebPush] Error saat memproses push notification:', error)
        return { sent: 0, failed: 0 }
    }
}

/**
 * Mengirim Web Push Notification ke seluruh user dengan role tertentu (misal: CEO, FVP, Approver).
 */
export async function sendWebPushToRoles(roles: string[], payload: WebPushPayload) {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: { in: roles }
            },
            select: { id: true }
        })

        const userIds = users.map(u => u.id)
        return await sendWebPushToUsers(userIds, payload)
    } catch (error) {
        console.error('[WebPush] Error querying users by role:', error)
        return { sent: 0, failed: 0 }
    }
}
