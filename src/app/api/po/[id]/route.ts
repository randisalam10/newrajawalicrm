import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'
import { revalidatePath } from 'next/cache'
import { pusherServer, getChannelName } from '@/lib/pusher'

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
        const { status, notes } = body

        if (!['APPROVED', 'CANCELLED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const { id } = await params
        const existingPo = await prisma.purchaseOrder.findUnique({ where: { id } })
        if (!existingPo) return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 })

        let newStatus = existingPo.status
        let updateData: any = {}
        const now = new Date()

        if (status === 'CANCELLED') {
            newStatus = 'CANCELLED'
            updateData = { status: 'CANCELLED', fvpApprovedAt: null, ceoApprovedAt: null }
            if (notes) updateData.notes = notes
        } else if (status === 'APPROVED') {
            if (user.role === 'FVP') {
                updateData.fvpApprovedAt = now
                if (existingPo.ceoApprovedAt) newStatus = 'APPROVED'
            } else if (user.role === 'CEO') {
                updateData.ceoApprovedAt = now
                if (existingPo.fvpApprovedAt) newStatus = 'APPROVED'
            } else if (user.role === 'SuperAdminBP' || user.role === 'AdminLogistik') {
                updateData.fvpApprovedAt = now
                updateData.ceoApprovedAt = now
                newStatus = 'APPROVED'
            }

            if (newStatus === 'APPROVED') {
                updateData.status = 'APPROVED'
            }
            if (notes) updateData.notes = notes
        }

        const po = await prisma.purchaseOrder.update({
            where: { id },
            data: updateData
        })

        // Revalidate web pages so the dashboard updates
        revalidatePath("/logistik/po")
        revalidatePath("/logistik")

        try {
            if (pusherServer) {
                await pusherServer.trigger(getChannelName('logistik-channel'), 'po-updated', {
                    message: `PO ${po.po_number} telah di-${newStatus === 'APPROVED' ? 'setujui' : (status === 'CANCELLED' ? 'batalkan' : 'proses')}`,
                })
            }
        } catch (pusherErr) {
            console.error("Pusher Trigger Error:", pusherErr)
        }

        // --- PUSH NOTIFICATION ---
        try {
            const { sendPushNotification } = await import('@/lib/firebase/admin')
            const targetedIds = [po.ceoId, po.fvpId].filter(Boolean) as string[]
            const admins = await prisma.user.findMany({
                where: {
                    OR: [
                        { id: { in: targetedIds } },
                        { role: 'SuperAdminBP' }
                    ],
                    fcmToken: { not: null }
                },
                select: { fcmToken: true }
            })

            const tokens = admins.map(u => u.fcmToken).filter(Boolean) as string[]
            if (tokens.length > 0) {
                let notifTitle = "Info PO"
                let notifBody = ""

                if (status === 'CANCELLED') {
                    notifTitle = "PO Dibatalkan (Mobile)"
                    notifBody = `PO ${po.po_number} telah dibatalkan oleh ${user.username || 'System'}.`
                } else if (newStatus === 'APPROVED') {
                    notifTitle = "PO Disetujui Penuh"
                    notifBody = `PO ${po.po_number} telah disetujui sepenuhnya dan siap diproses.`
                } else {
                    notifTitle = "PO Disetujui Parsial"
                    notifBody = `PO ${po.po_number} telah disetujui oleh ${user.username || 'System'}. Menunggu persetujuan selanjutnya.`
                }

                await sendPushNotification(tokens, notifTitle, notifBody, { poId: po.id, type: "PO_UPDATE" })
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
