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
