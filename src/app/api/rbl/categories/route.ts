import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'

export async function GET(req: Request) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    try {
        const categories = await prisma.rblCategory.findMany({
            orderBy: [
                { isSystem: 'desc' },
                { name: 'asc' }
            ]
        })

        return NextResponse.json({
            success: true,
            data: categories
        })
    } catch (error: any) {
        console.error("Fetch RBL Categories Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
