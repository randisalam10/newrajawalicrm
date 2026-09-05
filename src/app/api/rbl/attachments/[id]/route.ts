import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    if (!['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const { id } = await params
    const isSuperAdmin = ['SuperAdminBP', 'CEO', 'FVP'].includes(user.role)

    try {
        const attachment = await prisma.rblAttachment.findUnique({
            where: { id },
            include: { budget: true }
        })

        if (!attachment) {
            return NextResponse.json({ error: 'Lampiran tidak ditemukan' }, { status: 404 })
        }

        if (!isSuperAdmin && attachment.budget.locationId !== user.locationId) {
            return NextResponse.json({ error: 'Forbidden: Akses ditolak' }, { status: 403 })
        }

        if (attachment.budget.status === 'CLOSED') {
            return NextResponse.json({
                error: 'Budget sudah ditutup. Tidak dapat menghapus lampiran.'
            }, { status: 400 })
        }

        // Try deleting physical file
        try {
            const relPath = attachment.fileUrl.replace('/api/files/', '')
            const filePath = join(process.cwd(), 'uploads', relPath)
            if (existsSync(filePath)) {
                await unlink(filePath)
            }
        } catch (fileErr) {
            console.warn('Physical file deletion warning:', fileErr)
        }

        await prisma.rblAttachment.delete({ where: { id } })

        return NextResponse.json({
            success: true,
            message: 'Lampiran berhasil dihapus'
        })

    } catch (error: any) {
        console.error('Mobile Delete Attachment Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
