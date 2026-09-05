import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    if (!['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const isSuperAdmin = ['SuperAdminBP', 'CEO', 'FVP'].includes(user.role)

    try {
        const url = new URL(req.url)
        const locationIdParam = url.searchParams.get('locationId')
        const status = url.searchParams.get('status')
        const yearParam = url.searchParams.get('year')
        const monthParam = url.searchParams.get('month')
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '15')
        const offset = (page - 1) * limit

        const whereClause: any = {}

        if (isSuperAdmin) {
            if (locationIdParam && locationIdParam !== 'all') {
                whereClause.locationId = locationIdParam
            }
        } else {
            whereClause.locationId = user.locationId!
        }

        if (status && status !== 'ALL') {
            whereClause.status = status
        }

        if (yearParam) {
            whereClause.periodYear = parseInt(yearParam)
        }

        if (monthParam) {
            whereClause.periodMonth = parseInt(monthParam)
        }

        const [budgets, totalCount] = await Promise.all([
            prisma.rblBudget.findMany({
                where: whereClause,
                include: {
                    location: { select: { id: true, name: true } },
                    createdBy: {
                        select: {
                            id: true,
                            username: true,
                            employee: { select: { name: true } }
                        }
                    },
                    closedBy: {
                        select: {
                            id: true,
                            username: true,
                            employee: { select: { name: true } }
                        }
                    },
                    expenses: { select: { id: true, amount: true } },
                    _count: { select: { expenses: true, attachments: true } }
                },
                orderBy: [
                    { periodYear: 'desc' },
                    { periodMonth: 'desc' },
                    { createdAt: 'desc' }
                ],
                take: limit,
                skip: offset
            }),
            prisma.rblBudget.count({ where: whereClause })
        ])

        const mapped = budgets.map(b => {
            const totalExpense = b.expenses.reduce((s, e) => s + e.amount, 0)
            const remainingBalance = b.amount - totalExpense
            const absorptionPercentage = b.amount > 0
                ? Math.round((totalExpense / b.amount) * 1000) / 10
                : 0

            return {
                id: b.id,
                code: b.code,
                periodMonth: b.periodMonth,
                periodYear: b.periodYear,
                receivedDate: b.receivedDate,
                amount: b.amount,
                notes: b.notes,
                status: b.status,
                totalExpense,
                remainingBalance,
                absorptionPercentage,
                closedAt: b.closedAt,
                closeNotes: b.closeNotes,
                location: b.location,
                createdByName: b.createdBy?.employee?.name || b.createdBy?.username || 'User',
                closedByName: b.closedBy?.employee?.name || b.closedBy?.username || null,
                expensesCount: b._count.expenses,
                attachmentsCount: b._count.attachments
            }
        })

        return NextResponse.json({
            success: true,
            data: mapped,
            meta: {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        })

    } catch (error: any) {
        console.error("Mobile RBL Budgets List Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
