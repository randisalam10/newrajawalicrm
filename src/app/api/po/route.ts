import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'

export async function GET(req: Request) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    if (!['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    try {
        const url = new URL(req.url)
        const status = url.searchParams.get('status')
        const limit = parseInt(url.searchParams.get('limit') || '15')
        const page = parseInt(url.searchParams.get('page') || '1')
        const offset = (page - 1) * limit

        // New Filters
        const search = url.searchParams.get('search')
        const companyId = url.searchParams.get('companyId')
        const projectId = url.searchParams.get('projectId')
        const categoryId = url.searchParams.get('categoryId')
        const month = url.searchParams.get('month')
        const year = url.searchParams.get('year')

        const whereClause: any = {}

        // Status Filter
        if (status && status !== 'ALL') {
            if (status === 'PENDING_APPROVAL') {
                whereClause.status = 'DRAFT'
            } else {
                whereClause.status = status
            }
        }

        // Search Logic (PO Number or Company Name)
        if (search) {
            whereClause.OR = [
                { po_number: { contains: search, mode: 'insensitive' } },
                { companyGroup: { name: { contains: search, mode: 'insensitive' } } }
            ]
        }

        // Relational Filters
        if (companyId && companyId !== 'null') whereClause.companyGroupId = companyId
        if (projectId && projectId !== 'null') whereClause.companyProjectId = projectId
        if (categoryId && categoryId !== 'null') whereClause.categoryId = categoryId

        // Date Filtering (Month/Year)
        if (month || year) {
            const now = new Date()
            const y = year ? parseInt(year) : now.getFullYear()
            const m = month ? parseInt(month) - 1 : 0 // 0-based in JS
            
            if (month && year) {
                // Specific month
                const start = new Date(y, m, 1)
                const end = new Date(y, m + 1, 0, 23, 59, 59, 999)
                whereClause.tanggal_terbit = { gte: start, lte: end }
            } else if (year) {
                // Entire year
                const start = new Date(y, 0, 1)
                const end = new Date(y, 11, 31, 23, 59, 59, 999)
                whereClause.tanggal_terbit = { gte: start, lte: end }
            }
        }

        const [pos, totalCount] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where: whereClause,
                include: {
                    companyGroup: { select: { name: true } },
                    category: { select: { name: true } },
                    items: { select: { subtotal: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.purchaseOrder.count({ where: whereClause })
        ])

        const mappedPos = pos.map(po => ({
            id: po.id,
            po_number: po.po_number,
            tanggal_terbit: po.tanggal_terbit,
            company: po.companyGroup.name,
            category: po.category.name,
            status: po.status,
            total: po.items.reduce((acc, item) => acc + item.subtotal, 0)
        }))

        return NextResponse.json({
            success: true,
            data: mappedPos,
            meta: {
                totalCount,
                limit,
                page,
                totalPages: Math.ceil(totalCount / limit)
            }
        })

    } catch (error: any) {
        console.error("Mobile PO List Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
