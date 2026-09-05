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
        const search = url.searchParams.get('search')
        const companyId = url.searchParams.get('companyId')
        const projectId = url.searchParams.get('projectId')
        const categoryId = url.searchParams.get('categoryId')
        const month = url.searchParams.get('month')
        const year = url.searchParams.get('year')
        const startDateParam = url.searchParams.get('startDate')
        const endDateParam = url.searchParams.get('endDate')

        const whereClause: any = {}

        // Status Filter
        if (status && status !== 'ALL') {
            if (status === 'PENDING_APPROVAL') {
                whereClause.status = 'DRAFT'
            } else {
                whereClause.status = status
            }
        }

        // Search Logic
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

        // Date Filtering
        if (startDateParam && endDateParam) {
            whereClause.tanggal_terbit = {
                gte: new Date(startDateParam),
                lte: new Date(endDateParam)
            }
        } else if (month || year) {
            const now = new Date()
            const y = year ? parseInt(year) : now.getFullYear()
            
            if (month) {
                const m = parseInt(month) - 1
                const start = new Date(y, m, 1)
                const end = new Date(y, m + 1, 0, 23, 59, 59, 999)
                whereClause.tanggal_terbit = { gte: start, lte: end }
            } else if (year) {
                const start = new Date(y, 0, 1)
                const end = new Date(y, 11, 31, 23, 59, 59, 999)
                whereClause.tanggal_terbit = { gte: start, lte: end }
            }
        }

        const [totalCount, totalAmountAgg] = await Promise.all([
            prisma.purchaseOrder.count({ where: whereClause }),
            prisma.poItem.aggregate({
                where: { purchaseOrder: whereClause },
                _sum: { subtotal: true }
            })
        ])

        const totalAmount = totalAmountAgg._sum.subtotal || 0

        return NextResponse.json({
            success: true,
            summary: {
                total_records: totalCount,
                total_amount: totalAmount
            }
        })

    } catch (error: any) {
        console.error("PO Summary Aggregate API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
