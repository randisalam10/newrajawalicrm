import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    // Allowed roles for Billing Dashboard
    if (!['AdminBP', 'SuperAdminBP', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const isSuperAdmin = ['SuperAdminBP', 'CEO', 'FVP'].includes(user.role)
    const userLocationId = user.locationId

    try {
        const url = new URL(req.url)
        const locationIdFilter = url.searchParams.get('locationId')

        // Base filter for location scoping
        const locationFilter = isSuperAdmin
            ? (locationIdFilter ? { locationId: locationIdFilter } : {})
            : { locationId: userLocationId! }

        // Fetch Invoices
        const invoices = await prisma.invoice.findMany({
            where: {
                ...locationFilter,
                NOT: { status: "CANCELLED" }
            },
            include: {
                project: { include: { customer: true } },
                payments: true
            }
        })

        let totalTagihan = 0
        let totalDibayar = 0

        // Aging summary tracking (Umur Piutang)
        let currentAging = 0
        let overdue30to60 = 0
        let overdue60plus = 0
        const now = new Date()

        // Group by customer
        const customerMap = new Map<string, {
            customerId: string,
            customerName: string,
            totalTagihan: number,
            totalDibayar: number,
            sisaTagihan: number
        }>()

        for (const inv of invoices) {
            totalTagihan += inv.total_amount

            const activePaid = inv.payments
                .filter(p => !p.is_cancelled)
                .reduce((s, p) => s + p.amount, 0)

            totalDibayar += activePaid

            const sisaInvoice = Math.max(0, inv.total_amount - activePaid)

            // Hitung Umur Piutang (Aging Schedule)
            if (sisaInvoice > 0) {
                let daysOverdue = 0
                if (inv.due_date) {
                    const dueDate = new Date(inv.due_date)
                    if (now > dueDate) {
                        daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                    } else {
                        daysOverdue = 0
                    }
                } else {
                    const issueDate = new Date(inv.issue_date || inv.createdAt)
                    const daysSinceIssue = Math.floor((now.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
                    daysOverdue = Math.max(0, daysSinceIssue - 30)
                }

                if (daysOverdue < 30) {
                    currentAging += sisaInvoice
                } else if (daysOverdue <= 60) {
                    overdue30to60 += sisaInvoice
                } else {
                    overdue60plus += sisaInvoice
                }
            }

            // Per Customer Tracking
            const cust = inv.project.customer
            if (!customerMap.has(cust.id)) {
                customerMap.set(cust.id, {
                    customerId: cust.id,
                    customerName: cust.customer_name,
                    totalTagihan: 0,
                    totalDibayar: 0,
                    sisaTagihan: 0
                })
            }

            const custData = customerMap.get(cust.id)!
            custData.totalTagihan += inv.total_amount
            custData.totalDibayar += activePaid
            custData.sisaTagihan = custData.totalTagihan - custData.totalDibayar
        }

        const totalSisaTagihan = totalTagihan - totalDibayar

        // Unbilled transactions summary
        const unbilledCount = await prisma.productionTransaction.count({
            where: {
                ...locationFilter,
                invoiceItem: null
            }
        })

        // Sort customers by remaining debt (sisaTagihan), descending
        const customerBreakdown = Array.from(customerMap.values())
            .filter(c => c.sisaTagihan > 0) // Only show customers who still owe money
            .sort((a, b) => b.sisaTagihan - a.sisaTagihan)

        const aging_summary = {
            current: Math.round(currentAging),
            overdue_30_60: Math.round(overdue30to60),
            overdue_60_plus: Math.round(overdue60plus)
        }

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalTagihan,
                    totalDibayar,
                    totalSisaTagihan,
                    unbilledCount,
                    aging_summary
                },
                aging_summary,
                customerBreakdown
            }
        })

    } catch (error: any) {
        console.error("Mobile Billing Dashboard Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
