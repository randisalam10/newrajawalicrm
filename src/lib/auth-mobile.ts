import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

function getJwtSecret(): string {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret || secret === 'fallback_secret') {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL SECURITY CONFIGURATION ERROR: NEXTAUTH_SECRET is not configured or using unsafe fallback.')
        }
        return secret || 'dev_temporary_fallback_secret_do_not_use_in_prod'
    }
    return secret
}

export function verifyMobileToken(req: Request) {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 }) }
    }

    const token = authHeader.split(' ')[1]
    try {
        const secret = getJwtSecret()
        const decoded = jwt.verify(token, secret) as any
        return { user: decoded }
    } catch {
        return { error: NextResponse.json({ error: 'Unauthorized: Token expired or invalid' }, { status: 401 }) }
    }
}

