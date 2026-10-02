import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getRequestIp } from '@/lib/rate-limiter'

function getJwtSecret(): string {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret || secret === 'fallback_secret') {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL SECURITY CONFIGURATION ERROR: NEXTAUTH_SECRET is not configured or using unsafe fallback.')
        }
        console.warn('⚠️ [SECURITY WARNING]: NEXTAUTH_SECRET is not properly set! Generate a secure 32+ character random string.')
        return secret || 'dev_temporary_fallback_secret_do_not_use_in_prod'
    }
    return secret
}

export async function POST(req: Request) {
    const clientIp = getRequestIp(req)
    const ipKey = `api:login:ip:${clientIp}`

    // 1. Check IP-level rate limiting
    const ipLimit = checkRateLimit(ipKey)
    if (!ipLimit.allowed) {
        return NextResponse.json(
            { error: `Terlalu banyak percobaan dari IP Anda. Coba lagi dalam ${Math.ceil(ipLimit.retryAfterSeconds / 60)} menit.` },
            { 
                status: 429,
                headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) }
            }
        )
    }

    try {
        let body: any
        try {
            body = await req.json()
        } catch {
            return NextResponse.json({ error: 'Format JSON request tidak valid.' }, { status: 400 })
        }

        const { username: rawUsername, password: rawPassword } = body || {}

        if (!rawUsername || !rawPassword || typeof rawUsername !== 'string' || typeof rawPassword !== 'string') {
            return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 })
        }

        const username = rawUsername.trim().toLowerCase()
        const password = String(rawPassword)

        if (username.length > 100 || password.length > 256) {
            return NextResponse.json({ error: 'Input melebihi batas yang diizinkan.' }, { status: 400 })
        }

        const userKey = `api:login:user:${username}`
        const userLimit = checkRateLimit(userKey)
        if (!userLimit.allowed) {
            return NextResponse.json(
                { error: `Akun ini terkunci sementara karena percobaan gagal berulang. Coba lagi dalam ${Math.ceil(userLimit.retryAfterSeconds / 60)} menit.` },
                { 
                    status: 429,
                    headers: { 'Retry-After': String(userLimit.retryAfterSeconds) }
                }
            )
        }

        // Cari user beserta data employee dan location
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                employee: {
                    include: {
                        location: true
                    }
                }
            }
        })

        if (!user) {
            recordFailedAttempt(ipKey)
            recordFailedAttempt(userKey)
            return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 })
        }

        // Cek apakah status employee aktif
        if (user.employee && user.employee.status === 'Inactive') {
            return NextResponse.json({ error: 'Akun pegawai telah dinonaktifkan. Hubungi administrator.' }, { status: 403 })
        }

        // Cek password
        const passwordsMatch = await bcrypt.compare(password, user.password)
        if (!passwordsMatch) {
            const failIp = recordFailedAttempt(ipKey)
            const failUser = recordFailedAttempt(userKey)

            if (failIp.isLocked || failUser.isLocked) {
                return NextResponse.json(
                    { error: 'Terlalu banyak percobaan gagal. Akses dibatasi selama 15 menit demi keamanan sistem.' },
                    { status: 429, headers: { 'Retry-After': '900' } }
                )
            }

            const remaining = Math.min(failIp.remainingAttempts, failUser.remainingAttempts)
            return NextResponse.json(
                { error: `Username atau password salah. (Sisa percobaan: ${remaining})` },
                { status: 401 }
            )
        }

        // Reset rate limit on success
        resetRateLimit(ipKey)
        resetRateLimit(userKey)

        const JWT_SECRET = getJwtSecret()

        // Buat JWT payload
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role,
            employeeId: user.employeeId,
            locationId: user.employee?.locationId || null
        }

        // Generate token
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                employeeName: user.employee?.name,
                position: user.employee?.position,
                location: user.employee?.location?.name || 'Pusat'
            }
        })

    } catch (error: any) {
        console.error("Mobile Login Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

