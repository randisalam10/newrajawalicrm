import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendWebPushToUsers } from '@/lib/web-push'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const res = await sendWebPushToUsers([session.user.id], {
            title: 'Uji Coba Notifikasi Rajawali ERP',
            body: 'Halo! Notifikasi browser Anda telah aktif dan siap menerima pemberitahuan approval.',
            url: '/logistik/approval',
            tag: 'test-notification'
        })

        return NextResponse.json({
            success: true,
            sent: res.sent,
            failed: res.failed,
            message: res.sent > 0 
                ? 'Notifikasi uji coba berhasil dikirim ke perangkat Anda!' 
                : 'Belum ada browser terdaftar untuk akun ini. Pastikan Anda sudah mengizinkan notifikasi.'
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
