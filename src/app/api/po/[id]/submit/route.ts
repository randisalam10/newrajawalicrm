import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'
import { revalidatePath } from 'next/cache'
import { pusherServer, getChannelName } from '@/lib/pusher'
import { sendPushNotification } from '@/lib/firebase/admin'
import { sendWebPushToUsers } from '@/lib/web-push'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user
    const { id } = await params

    try {
        const existingPo = await prisma.purchaseOrder.findUnique({ where: { id } })
        if (!existingPo) {
            return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 })
        }

        if (existingPo.status !== 'DRAFT' && existingPo.status !== 'REJECTED') {
            return NextResponse.json({ error: 'Hanya PO berstatus Draft atau Ditolak yang dapat diajukan.' }, { status: 400 })
        }

        const updated = await prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: 'SUBMITTED',
                submittedAt: new Date(),
                submittedById: user.id,
                rejectionReason: null,
                rejectedAt: null,
                rejectedById: null,
            }
        })

        // Send Push Notification to assigned approvers
        try {
            const targetedIds = [updated.ceoId, updated.fvpId].filter(Boolean) as string[]
            const approverUsers = await prisma.user.findMany({
                where: {
                    OR: [
                        { id: { in: targetedIds } },
                        { role: { in: ['SuperAdminBP', 'CEO', 'FVP', 'Approver'] } }
                    ]
                },
                select: { id: true, fcmToken: true }
            })

            // 1. Mobile Push
            const tokens = approverUsers.map(u => u.fcmToken).filter(Boolean) as string[]
            if (tokens.length > 0) {
                await sendPushNotification(
                    tokens,
                    "PO Baru Diajukan untuk Persetujuan",
                    `PO ${updated.po_number} telah diajukan dan membutuhkan persetujuan Anda.`,
                    { poId: updated.id, type: "PO_APPROVAL" }
                )
            }

            // 2. Browser Web Push
            const approverUserIds = approverUsers.map(u => u.id)
            if (approverUserIds.length > 0) {
                await sendWebPushToUsers(approverUserIds, {
                    title: "PO Baru Memerlukan Persetujuan",
                    body: `PO ${updated.po_number} telah diajukan oleh ${user.username || 'Admin'} dan membutuhkan persetujuan Anda.`,
                    url: "/logistik/approval",
                    tag: `po-submit-${updated.id}`
                })
            }
        } catch (fcmErr) {
            console.error("Push Notification Error on PO Submit:", fcmErr)
        }

        // Trigger Pusher
        try {
            if (pusherServer) {
                await pusherServer.trigger(getChannelName('logistik-channel'), 'po-updated', {
                    message: `PO ${updated.po_number} telah diajukan untuk persetujuan.`,
                    poId: updated.id,
                    status: 'SUBMITTED'
                })
            }
        } catch (pusherErr) {
            console.error("Pusher error on PO Submit:", pusherErr)
        }

        revalidatePath('/logistik/po')
        revalidatePath('/logistik/approval')

        return NextResponse.json({
            success: true,
            message: `PO ${updated.po_number} berhasil diajukan untuk persetujuan.`,
            data: { id: updated.id, status: updated.status }
        })
    } catch (e: any) {
        console.error("Submit PO Error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
