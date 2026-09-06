import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'

export async function GET(req: NextRequest) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('status') || 'pending' // 'pending' | 'history'

    try {
        let where: any = {}

        if (type === 'pending') {
            where.status = 'SUBMITTED'

            // Filter according to approver role
            if (user.role === 'FVP' || user.role === 'Approver') {
                where.fvpApprovedAt = null
                where.OR = [
                    { fvpId: user.id },
                    { fvpId: null }
                ]
            } else if (user.role === 'CEO') {
                where.ceoApprovedAt = null
                where.OR = [
                    { ceoId: user.id },
                    { ceoId: null }
                ]
            } else if (!['SuperAdminBP', 'AdminLogistik'].includes(user.role)) {
                // Other roles cannot approve
                return NextResponse.json({ success: true, data: [] })
            }
        } else {
            // History: POs touched by this user
            if (['SuperAdminBP', 'AdminLogistik'].includes(user.role)) {
                where.status = { in: ['APPROVED', 'REJECTED', 'CANCELLED'] }
            } else {
                where.OR = [
                    { fvpApprovedById: user.id },
                    { ceoApprovedById: user.id },
                    { approvedById: user.id },
                    { rejectedById: user.id }
                ]
            }
        }

        const pos = await prisma.purchaseOrder.findMany({
            where,
            include: {
                companyGroup: true,
                category: true,
                approvedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                ceoApprovedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                fvpApprovedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                rejectedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                submittedBy: { select: { id: true, username: true, role: true, employee: { select: { name: true } } } },
                items: {
                    include: {
                        masterItem: {
                            include: {
                                supplier: true
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 50
        })

        const mapped = pos.map(po => {
            const total = po.items.reduce((acc, it) => acc + (it.harga_satuan * it.quantity), 0)
            return {
                id: po.id,
                po_number: po.po_number,
                tanggal_terbit: po.tanggal_terbit,
                status: po.status,
                pimpinan: po.pimpinan,
                kepala_peralatan: po.kepala_peralatan,
                pembuat_admin: po.pembuat_admin,
                metode_pembayaran: po.metode_pembayaran,
                company: po.companyGroup.name,
                category: po.category.name,
                notes: po.notes,
                pic_name: po.pic_name,
                pic_phone: po.pic_phone,
                total,
                submittedAt: po.submittedAt,
                submittedBy: po.submittedBy?.employee?.name || po.submittedBy?.username,
                fvpApprovedAt: po.fvpApprovedAt,
                fvpApprovedBy: po.fvpApprovedBy?.employee?.name || po.fvpApprovedBy?.username,
                fvpSignatureUrl: po.fvpSignatureUrl,
                fvpNotes: po.fvpNotes,
                ceoApprovedAt: po.ceoApprovedAt,
                ceoApprovedBy: po.ceoApprovedBy?.employee?.name || po.ceoApprovedBy?.username,
                ceoSignatureUrl: po.ceoSignatureUrl,
                ceoNotes: po.ceoNotes,
                rejectionReason: po.rejectionReason,
                rejectedAt: po.rejectedAt,
                rejectedBy: po.rejectedBy?.employee?.name || po.rejectedBy?.username,
                items: po.items.map(i => ({
                    id: i.id,
                    name: i.masterItem.name,
                    satuan: i.masterItem.satuan,
                    part_number: i.masterItem.part_number,
                    merk: i.masterItem.merk,
                    quantity: i.quantity,
                    harga_satuan: i.harga_satuan,
                    subtotal: i.subtotal,
                    keterangan: i.keterangan,
                    supplier: i.masterItem.supplier.name
                }))
            }
        })

        return NextResponse.json({ success: true, count: mapped.length, data: mapped })
    } catch (error: any) {
        console.error("Mobile PO Approvals Error:", error)
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 })
    }
}
