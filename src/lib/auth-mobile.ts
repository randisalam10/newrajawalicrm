import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback_secret'

export function verifyMobileToken(req: Request) {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 }) }
    }

    const token = authHeader.split(' ')[1]
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        return { user: decoded }
    } catch (error) {
        return { error: NextResponse.json({ error: 'Unauthorized: Token expired or invalid' }, { status: 401 }) }
    }
}
