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
                approvedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                ceoApprovedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                fvpApprovedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                submittedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                rejectedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
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
            pembuat_admin: po.pembuat_admin,
            metode_pembayaran: po.metode_pembayaran,
            notes: po.notes,
            company: po.companyGroup.name,
            category: po.category.name,
            isBypassed: po.isBypassed,
            approvalChannel: po.approvalChannel,
            submittedAt: po.submittedAt,
            submittedBy: po.submittedBy ? {
                id: po.submittedBy.id,
                name: po.submittedBy.employee?.name || po.submittedBy.username
            } : null,
            approvedBy: po.approvedBy ? {
                id: po.approvedBy.id,
                name: po.approvedBy.employee?.name || po.approvedBy.username,
                role: po.approvedBy.role
            } : null,
            ceoApprovedBy: po.ceoApprovedBy ? {
                id: po.ceoApprovedBy.id,
                name: po.ceoApprovedBy.employee?.name || po.ceoApprovedBy.username,
                channel: po.ceoApprovalChannel
            } : null,
            fvpApprovedBy: po.fvpApprovedBy ? {
                id: po.fvpApprovedBy.id,
                name: po.fvpApprovedBy.employee?.name || po.fvpApprovedBy.username,
                channel: po.fvpApprovalChannel
            } : null,
            fvpSignatureUrl: po.fvpSignatureUrl,
            fvpNotes: po.fvpNotes,
            ceoSignatureUrl: po.ceoSignatureUrl,
            ceoNotes: po.ceoNotes,
            rejectionReason: po.rejectionReason,
            rejectedAt: po.rejectedAt,
            rejectedBy: po.rejectedBy ? {
                id: po.rejectedBy.id,
                name: po.rejectedBy.employee?.name || po.rejectedBy.username
            } : null,
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

    // Hanya role tertentu yang bisa approve/cancel/reject
    if (!['SuperAdminBP', 'CEO', 'FVP', 'Approver', 'AdminLogistik'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki izin untuk mengubah status PO' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { status, notes, signatureUrl, useSavedSignature } = body

        if (!['APPROVED', 'CANCELLED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Status tidak valid. Gunakan APPROVED, CANCELLED, atau REJECTED' }, { status: 400 })
        }

        const { id } = await params
        const existingPo = await prisma.purchaseOrder.findUnique({ where: { id } })
        if (!existingPo) return NextResponse.json({ error: 'Purchase Order tidak ditemukan' }, { status: 404 })

        if (status === 'APPROVED' && existingPo.status === 'DRAFT') {
            return NextResponse.json({ error: 'PO masih berstatus Draft. Ajukan (submit) terlebih dahulu sebelum dapat disetujui.' }, { status: 400 })
        }

        // Tentukan TTD yang akan digunakan
        let signatureToApply = signatureUrl || null
        if (!signatureToApply && useSavedSignature) {
            const u = await prisma.user.findUnique({ where: { id: user.id }, select: { signatureUrl: true } })
            signatureToApply = u?.signatureUrl || null
        }

        let newStatus = existingPo.status
        let updateData: any = {}
        const now = new Date()

        if (status === 'CANCELLED') {
            newStatus = 'CANCELLED'
            updateData = { 
                status: 'CANCELLED', 
                fvpApprovedAt: null, 
                ceoApprovedAt: null,
                approvedById: null,
                approvalChannel: null,
                ceoApprovedById: null,
                ceoApprovalChannel: null,
                fvpApprovedById: null,
                fvpApprovalChannel: null,
                isBypassed: false
            }
            if (notes) updateData.notes = notes
        } else if (status === 'REJECTED') {
            newStatus = 'REJECTED'
            updateData = {
                status: 'REJECTED',
                rejectionReason: notes || 'Ditolak oleh approver',
                rejectedAt: now,
                rejectedById: user.id
            }
        } else if (status === 'APPROVED') {
            if (user.role === 'FVP' || user.role === 'Approver') {
                updateData.fvpApprovedAt = now
                updateData.fvpApprovedById = user.id
                updateData.fvpApprovalChannel = 'MOBILE'
                if (signatureToApply) updateData.fvpSignatureUrl = signatureToApply
                if (notes) updateData.fvpNotes = notes

                if (existingPo.ceoApprovedAt || !existingPo.ceoId) {
                    newStatus = 'APPROVED'
                    updateData.approvedById = user.id
                    updateData.approvalChannel = 'MOBILE'
                    updateData.isBypassed = false
                }
            } else if (user.role === 'CEO') {
                updateData.ceoApprovedAt = now
                updateData.ceoApprovedById = user.id
                updateData.ceoApprovalChannel = 'MOBILE'
                if (signatureToApply) updateData.ceoSignatureUrl = signatureToApply
                if (notes) updateData.ceoNotes = notes

                if (existingPo.fvpApprovedAt || !existingPo.fvpId) {
                    newStatus = 'APPROVED'
                    updateData.approvedById = user.id
                    updateData.approvalChannel = 'MOBILE'
                    updateData.isBypassed = false
                }
            } else if (user.role === 'SuperAdminBP' || user.role === 'AdminLogistik') {
                // Admin bypass: Sesuai aturan, admin yg approve TIDAK menambahkan TTD
                updateData.fvpApprovedAt = now
                updateData.ceoApprovedAt = now
                updateData.ceoApprovedById = user.id
                updateData.fvpApprovedById = user.id
                updateData.ceoApprovalChannel = 'MOBILE'
                updateData.fvpApprovalChannel = 'MOBILE'
                updateData.approvedById = user.id
                updateData.approvalChannel = 'MOBILE'
                updateData.isBypassed = true
                newStatus = 'APPROVED'
            }

            if (newStatus === 'APPROVED') {
                updateData.status = 'APPROVED'
                if (!updateData.approvedById) {
                    updateData.approvedById = user.id
                    updateData.approvalChannel = 'MOBILE'
                    updateData.isBypassed = false
                }
            }
            if (notes) updateData.notes = notes
        }

        const po = await prisma.purchaseOrder.update({
            where: { id },
            data: updateData
        })

        // Revalidate web pages so the dashboard updates
        revalidatePath("/logistik/po")
        revalidatePath("/logistik/approval")
        revalidatePath("/logistik")

        try {
            if (pusherServer) {
                await pusherServer.trigger(getChannelName('logistik-channel'), 'po-updated', {
                    message: `PO ${po.po_number} telah di-${newStatus === 'APPROVED' ? 'setujui' : (status === 'CANCELLED' ? 'batalkan' : 'proses')}`,
                    poId: po.id,
                    status: newStatus
                })
            }
        } catch (pusherErr) {
            console.error("Pusher Trigger Error:", pusherErr)
        }

        // Push Notification
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
                } else if (status === 'REJECTED') {
                    notifTitle = "PO Ditolak"
                    notifBody = `PO ${po.po_number} ditolak oleh ${user.username || 'Approver'}: ${notes || '-'}`
                } else if (newStatus === 'APPROVED') {
                    notifTitle = "PO Disetujui Penuh"
                    notifBody = `PO ${po.po_number} telah disetujui sepenuhnya dan siap diproses.`
                } else {
                    notifTitle = "PO Disetujui Parsial"
                    notifBody = `PO ${po.po_number} telah disetujui oleh ${user.username || 'Approver'}. Menunggu persetujuan selanjutnya.`
                }

                await sendPushNotification(tokens, notifTitle, notifBody, { poId: po.id, type: "PO_UPDATE" })
            }
        } catch (fcmErr) {
            console.error("FCM Status Update Error:", fcmErr)
        }

        return NextResponse.json({ success: true, message: `PO successfully ${status}`, data: { status: po.status } })

    } catch (error: any) {
        console.error("Mobile PO Update Error:", error)
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 })
    }
}
