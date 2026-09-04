import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    try {
        const [companies, categories, projects] = await Promise.all([
            prisma.poCompanyGroup.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true, kode_cabang: true }
            }),
            prisma.poCategory.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true, kode_kategori: true }
            }),
            prisma.poCompanyProject.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true, companyGroupId: true }
            })
        ])

        return NextResponse.json({
            success: true,
            data: {
                companies,
                categories,
                projects
            }
        })
    } catch (error) {
        console.error("Fetch PO Filters Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
