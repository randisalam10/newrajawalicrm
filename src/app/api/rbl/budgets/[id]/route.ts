import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    if (!['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const { id } = await params
    const isSuperAdmin = ['SuperAdminBP', 'CEO', 'FVP'].includes(user.role)

    try {
        const budget = await prisma.rblBudget.findUnique({
            where: { id },
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
                expenses: {
                    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                username: true,
                                employee: { select: { name: true } }
                            }
                        }
                    }
                },
                attachments: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        uploadedBy: {
                            select: {
                                id: true,
                                username: true,
                                employee: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        })

        if (!budget) {
            return NextResponse.json({ error: 'Budget RBL tidak ditemukan' }, { status: 404 })
        }

        // Branch isolation check
        if (!isSuperAdmin && budget.locationId !== user.locationId) {
            return NextResponse.json({ error: 'Forbidden: Akses ditolak untuk cabang ini' }, { status: 403 })
        }

        const totalExpense = budget.expenses.reduce((sum, e) => sum + e.amount, 0)
        const remainingBalance = budget.amount - totalExpense
        const absorptionPercentage = budget.amount > 0
            ? Math.round((totalExpense / budget.amount) * 1000) / 10
            : 0

        // Category breakdown
        const categoryMap: Record<string, number> = {}
        budget.expenses.forEach(e => {
            const cat = e.category || 'Operasional'
            categoryMap[cat] = (categoryMap[cat] || 0) + e.amount
        })

        const mappedExpenses = budget.expenses.map(e => ({
            id: e.id,
            date: e.date,
            itemDescription: e.itemDescription,
            category: e.category || 'Operasional',
            quantity: e.quantity,
            unit: e.unit,
            unitPrice: e.unitPrice,
            amount: e.amount,
            receiptNo: e.receiptNo,
            notes: e.notes,
            createdByName: e.createdBy?.employee?.name || e.createdBy?.username || 'User'
        }))

        const mappedAttachments = budget.attachments.map(a => ({
            id: a.id,
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            fileSize: a.fileSize,
            caption: a.caption,
            date: a.date || a.createdAt,
            uploadedByName: a.uploadedBy?.employee?.name || a.uploadedBy?.username || 'User'
        }))

        return NextResponse.json({
            success: true,
            data: {
                id: budget.id,
                code: budget.code,
                periodMonth: budget.periodMonth,
                periodYear: budget.periodYear,
                receivedDate: budget.receivedDate,
                amount: budget.amount,
                notes: budget.notes,
                status: budget.status,
                totalExpense,
                remainingBalance,
                absorptionPercentage,
                closedAt: budget.closedAt,
                closeNotes: budget.closeNotes,
                location: budget.location,
                createdByName: budget.createdBy?.employee?.name || budget.createdBy?.username || 'User',
                closedByName: budget.closedBy?.employee?.name || budget.closedBy?.username || null,
                expensesCount: budget.expenses.length,
                attachmentsCount: budget.attachments.length,
                categoryBreakdown: categoryMap,
                expenses: mappedExpenses,
                attachments: mappedAttachments
            }
        })

    } catch (error: any) {
        console.error("Mobile RBL Detail Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
