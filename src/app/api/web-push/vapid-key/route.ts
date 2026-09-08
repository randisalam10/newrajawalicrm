import { NextResponse } from 'next/server'

export async function GET() {
    const rawKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
    const publicKey = rawKey.replace(/^["']|["']$/g, '').trim()
    return NextResponse.json({ publicKey })
}
