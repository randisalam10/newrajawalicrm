import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    // Allowed roles
    if (!['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const isSuperAdmin = ['SuperAdminBP', 'CEO', 'FVP'].includes(user.role)

    try {
        const url = new URL(req.url)
        const locationIdParam = url.searchParams.get('locationId')
        const yearParam = url.searchParams.get('year')
        const monthParam = url.searchParams.get('month')

        const now = new Date()
        const targetYear = yearParam ? parseInt(yearParam) : now.getFullYear()
        const targetMonth = monthParam ? parseInt(monthParam) : null

        // Determine location filter
        let targetLocationId: string | undefined = undefined
        if (isSuperAdmin) {
            if (locationIdParam && locationIdParam !== 'all') {
                targetLocationId = locationIdParam
            }
        } else {
            targetLocationId = user.locationId || undefined
        }

        const whereBudget: any = {
            periodYear: targetYear
        }

        if (targetMonth) {
            whereBudget.periodMonth = targetMonth
        }

        if (targetLocationId) {
            whereBudget.locationId = targetLocationId
        }

        // Fetch all budgets matching filter
        const [budgets, locations] = await Promise.all([
            prisma.rblBudget.findMany({
                where: whereBudget,
                include: {
                    location: { select: { id: true, name: true } },
                    expenses: { select: { id: true, amount: true, category: true } },
                    _count: { select: { expenses: true, attachments: true } }
                },
                orderBy: [
                    { periodYear: 'desc' },
                    { periodMonth: 'desc' },
                    { createdAt: 'desc' }
                ]
            }),
            prisma.location.findMany({
                where: targetLocationId ? { id: targetLocationId } : {},
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            })
        ])

        let totalBudgetAllocated = 0
        let totalExpense = 0
        let openBudgetsCount = 0
        let closedBudgetsCount = 0

        budgets.forEach(b => {
            totalBudgetAllocated += b.amount
            const expenseSum = b.expenses.reduce((s, e) => s + e.amount, 0)
            totalExpense += expenseSum
            if (b.status === 'OPEN') openBudgetsCount++
            else if (b.status === 'CLOSED') closedBudgetsCount++
        })

        const remainingBalance = totalBudgetAllocated - totalExpense
        const absorptionPercentage = totalBudgetAllocated > 0
            ? Math.round((totalExpense / totalBudgetAllocated) * 1000) / 10
            : 0

        // Per-branch breakdown
        const branchMap = new Map<string, {
            locationId: string
            locationName: string
            activeBudgetId: string | null
            activeBudgetCode: string | null
            status: string
            allocatedAmount: number
            totalExpense: number
            remainingBalance: number
            absorptionPercentage: number
            periodMonth: number | null
            periodYear: number | null
            expensesCount: number
            attachmentsCount: number
        }>()

        // Initialize with known locations
        locations.forEach(loc => {
            branchMap.set(loc.id, {
                locationId: loc.id,
                locationName: loc.name,
                activeBudgetId: null,
                activeBudgetCode: null,
                status: 'NO_BUDGET',
                allocatedAmount: 0,
                totalExpense: 0,
                remainingBalance: 0,
                absorptionPercentage: 0,
                periodMonth: null,
                periodYear: null,
                expensesCount: 0,
                attachmentsCount: 0
            })
        })

        // Map budgets onto branch breakdown (prioritize OPEN budget or latest budget)
        budgets.forEach(b => {
            const locId = b.locationId
            let entry = branchMap.get(locId)
            if (!entry) {
                entry = {
                    locationId: locId,
                    locationName: b.location.name,
                    activeBudgetId: null,
                    activeBudgetCode: null,
                    status: 'NO_BUDGET',
                    allocatedAmount: 0,
                    totalExpense: 0,
                    remainingBalance: 0,
                    absorptionPercentage: 0,
                    periodMonth: null,
                    periodYear: null,
                    expensesCount: 0,
                    attachmentsCount: 0
                }
                branchMap.set(locId, entry)
            }

            const bExpense = b.expenses.reduce((s, e) => s + e.amount, 0)
            const bRemaining = b.amount - bExpense
            const bPct = b.amount > 0 ? Math.round((bExpense / b.amount) * 1000) / 10 : 0

            // If we don't have a budget assigned or the current one is OPEN, update
            if (!entry.activeBudgetId || b.status === 'OPEN') {
                entry.activeBudgetId = b.id
                entry.activeBudgetCode = b.code
                entry.status = b.status
                entry.allocatedAmount = b.amount
                entry.totalExpense = bExpense
                entry.remainingBalance = bRemaining
                entry.absorptionPercentage = bPct
                entry.periodMonth = b.periodMonth
                entry.periodYear = b.periodYear
                entry.expensesCount = b._count.expenses
                entry.attachmentsCount = b._count.attachments
            }
        })

        const branchBreakdown = Array.from(branchMap.values())

        return NextResponse.json({
            success: true,
            data: {
                period: {
                    year: targetYear,
                    month: targetMonth
                },
                overall: {
                    totalBudgetAllocated,
                    totalExpense,
                    remainingBalance,
                    absorptionPercentage,
                    openBudgetsCount,
                    closedBudgetsCount
                },
                branchBreakdown
            }
        })

    } catch (error: any) {
        console.error("Mobile RBL Summary API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
