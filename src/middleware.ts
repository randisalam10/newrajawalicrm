import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    // 1. CORS Headers for Mobile API
    const isApiRoute = req.nextUrl.pathname.startsWith('/api')

    if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        })
    }

    const res = NextResponse.next()

    // 2. Global Security Headers
    res.headers.set('X-Frame-Options', 'SAMEORIGIN')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set('X-XSS-Protection', '1; mode=block')
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()')
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

    if (isApiRoute) {
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return res
    }

    return res
})

export const config = {
    matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
}
