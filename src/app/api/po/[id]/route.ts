import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'
import { revalidatePath } from 'next/cache'
import { pusherServer } from '@/lib/pusher'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    try {
        const { id } = await params
        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                companyGroup: true,
                category: true,
                items: {
                    include: {
                        masterItem: {
                            include: {
                                supplier: true
                            }
                        }
                    }
                }
            }
        })

        if (!po) {
            return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 })
        }

        const mappedPo = {
            id: po.id,
            po_number: po.po_number,
            tanggal_terbit: po.tanggal_terbit,
            status: po.status,
            pimpinan: po.pimpinan,
            kepala_peralatan: po.kepala_peralatan,
            metode_pembayaran: po.metode_pembayaran,
            notes: po.notes,
            company: po.companyGroup.name,
            category: po.category.name,
            items: po.items.map(item => ({
                id: item.id,
                name: item.masterItem.name,
                supplier: item.masterItem.supplier.name,
                quantity: item.quantity,
                satuan: item.masterItem.satuan,
                harga_satuan: item.harga_satuan,
                subtotal: item.subtotal,
                keterangan: item.keterangan
            })),
            total: po.items.reduce((acc, item) => acc + item.subtotal, 0)
        }

        return NextResponse.json({ success: true, data: mappedPo })

    } catch (error: any) {
        console.error("Mobile PO Detail Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    // Hanya role tertentu yang bisa approve/cancel
    if (!['SuperAdminBP', 'CEO', 'FVP', 'AdminLogistik'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to change PO status' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { status } = body

        if (!['APPROVED', 'CANCELLED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const { id } = await params
        const po = await prisma.purchaseOrder.update({
            where: { id },
            data: { status }
        })

        // Revalidate web pages so the dashboard updates
        revalidatePath("/logistik/po")
        revalidatePath("/logistik")

        try {
            if (pusherServer) {
                await pusherServer.trigger('logistik-channel', 'po-updated', {
                    message: `PO ${po.po_number} telah di-${status === 'APPROVED' ? 'setujui' : 'batalkan'}`,
                })
            }
        } catch (pusherErr) {
            console.error("Pusher Trigger Error:", pusherErr)
        }

        // --- PUSH NOTIFICATION ---
        try {
            const { sendPushNotification } = await import('@/lib/firebase/admin')
            const admins = await prisma.user.findMany({
                where: {
                    role: { in: ['CEO', 'FVP', 'SuperAdminBP', 'AdminLogistik'] },
                    fcmToken: { not: null }
                },
                select: { fcmToken: true }
            })

            const tokens = admins.map(u => u.fcmToken).filter(Boolean) as string[]
            if (tokens.length > 0) {
                await sendPushNotification(
                    tokens,
                    `PO ${status === 'APPROVED' ? 'Disetujui' : 'Dibatalkan'} (Mobile)`,
                    `PO ${po.po_number} telah di-${status === 'APPROVED' ? 'setujui' : 'batalkan'} oleh ${user.username || 'Admin'}.`,
                    { poId: po.id, type: "PO_UPDATE" }
                )
            }
        } catch (fcmErr) {
            console.error("FCM Status Update Error:", fcmErr)
        }
        // -------------------------

        return NextResponse.json({ success: true, message: `PO successfully ${status}`, data: { status: po.status } })

    } catch (error: any) {
        console.error("Mobile PO Update Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
