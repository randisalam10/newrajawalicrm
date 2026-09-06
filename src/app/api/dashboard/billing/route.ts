import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    // Allowed roles for Billing Dashboard
    if (!['AdminBP', 'SuperAdminBP', 'CEO', 'FVP', 'Approver'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const isSuperAdmin = ['SuperAdminBP', 'CEO', 'FVP', 'Approver'].includes(user.role)
    const userLocationId = user.locationId

    try {
        const url = new URL(req.url)
        const locationIdFilter = url.searchParams.get('locationId')
        const search = url.searchParams.get('search')?.trim() || ''
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
        const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10))
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')

        // Base filter for location scoping
        const locationFilter = isSuperAdmin
            ? (locationIdFilter && locationIdFilter !== "all" ? { locationId: locationIdFilter } : {})
            : (userLocationId ? { locationId: userLocationId } : {})

        // Fetch Invoices
        const invoices = await prisma.invoice.findMany({
            where: {
                ...locationFilter,
                NOT: { status: "CANCELLED" },
                ...(search ? {
                    OR: [
                        { invoice_number: { contains: search, mode: 'insensitive' } },
                        { project: { customer: { customer_name: { contains: search, mode: 'insensitive' } } } },
                        { project: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                } : {})
            },
            include: {
                project: { include: { customer: true } },
                payments: true
            },
            orderBy: { issue_date: "desc" }
        })

        let totalTagihan = 0
        let totalDibayar = 0

        // Aging summary tracking (Umur Piutang)
        let currentAging = 0
        let overdue30to60 = 0
        let overdue60plus = 0
        const now = new Date()

        // Group by customer for legacy customerBreakdown
        const customerMap = new Map<string, {
            customerId: string,
            customerName: string,
            totalTagihan: number,
            totalDibayar: number,
            sisaTagihan: number
        }>()

        // Formatted invoices list
        const invoiceList = []

        for (const inv of invoices) {
            totalTagihan += inv.total_amount

            const activePaid = inv.payments
                .filter(p => !p.is_cancelled)
                .reduce((s, p) => s + p.amount, 0)

            totalDibayar += activePaid
            const sisaInvoice = Math.max(0, inv.total_amount - activePaid)

            // Calculate Overdue & Aging
            let daysOverdue = 0
            if (sisaInvoice > 0) {
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

            // Determine status display for invoice list
            let displayStatus = inv.status.toString()
            if (sisaInvoice <= 0) {
                displayStatus = "PAID"
            } else if (inv.due_date && now > new Date(inv.due_date)) {
                displayStatus = "OVERDUE"
            }

            invoiceList.push({
                invoiceNo: inv.invoice_number,
                customerName: inv.project?.customer?.customer_name || '-',
                issueDate: inv.issue_date ? format(new Date(inv.issue_date), 'yyyy-MM-dd') : format(new Date(inv.createdAt), 'yyyy-MM-dd'),
                dueDate: inv.due_date ? format(new Date(inv.due_date), 'yyyy-MM-dd') : null,
                totalAmount: inv.total_amount,
                paidAmount: activePaid,
                remainingAmount: sisaInvoice,
                status: displayStatus
            })

            // Customer Tracking
            const cust = inv.project?.customer
            if (cust) {
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
        }

        const totalSisaTagihan = Math.max(0, totalTagihan - totalDibayar)
        const rasioKolektibilitas = totalTagihan > 0
            ? Number(((totalDibayar / totalTagihan) * 100).toFixed(1))
            : 0

        // Date range filter for unbilled transactions
        const dateFilter: any = {}
        if (startDate) dateFilter.gte = new Date(startDate)
        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            dateFilter.lte = end
        }

        // Fetch Unbilled Production Transactions
        const unbilledTransactions = await prisma.productionTransaction.findMany({
            where: {
                ...locationFilter,
                invoiceItem: null,
                ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
                ...(search ? {
                    OR: [
                        { project: { customer: { customer_name: { contains: search, mode: 'insensitive' } } } },
                        { project: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                } : {})
            },
            include: {
                project: {
                    include: {
                        customer: true,
                        prices: true
                    }
                },
                concreteQuality: true,
                workItem: true,
                vehicle: true,
                driver: true,
                location: true
            },
            orderBy: [{ date: "desc" }, { trip_sequence: "asc" }]
        })

        let unbilledTotalVolume = 0
        let unbilledTotalEstimasi = 0

        // Group unbilled transactions by Customer + Project
        const unbilledGroupMap = new Map<string, {
            customerId: string,
            customerName: string,
            projectName: string,
            status: string,
            totalDeliveryOrders: number,
            totalVolume: number,
            estimasiNilai: number,
            periodMap: Map<string, {
                date: string,
                formattedDate: string,
                jobCount: number,
                volume: number,
                estimasiNilai: number,
                deliveries: Array<{
                    ticketNo: string,
                    location: string,
                    mutu: string,
                    volume: number,
                    mixerTruck: string,
                    time: string,
                    unitPrice: number,
                    totalPrice: number
                }>
            }>
        }>()

        for (const tx of unbilledTransactions) {
            const txDate = new Date(tx.date)
            const dateStr = format(txDate, 'yyyy-MM-dd')
            const formattedDateStr = format(txDate, 'd MMM yyyy', { locale: idLocale })
            const timeStr = `${format(txDate, 'HH:mm')} WIT`

            // Determine unit price from project prices matching qualityId
            const matchedPrice = tx.project?.prices?.find(p => p.qualityId === tx.qualityId)
            const unitPrice = matchedPrice?.price || 0
            const lineTotal = tx.volume_cubic * unitPrice

            unbilledTotalVolume += tx.volume_cubic
            unbilledTotalEstimasi += lineTotal

            // Location / Ticket naming
            const locCode = (tx.location?.name?.replace(/[^a-zA-Z]/g, '').substring(0, 3) || 'RMI').toUpperCase()
            const ticketNo = `DO-${locCode}-${format(txDate, 'yyMMdd')}-${String(tx.trip_sequence).padStart(2, '0')}`
            const deliveryLocation = tx.workItem?.name || tx.project?.address || tx.location?.name || 'Site Proyek'

            const customerId = tx.project?.customer?.id || 'unknown-cust'
            const customerName = tx.project?.customer?.customer_name || 'Pelanggan Umum'
            const projectName = tx.project?.name || 'Proyek Tanpa Nama'
            const groupKey = `${customerId}_${tx.projectId}`

            if (!unbilledGroupMap.has(groupKey)) {
                unbilledGroupMap.set(groupKey, {
                    customerId,
                    customerName,
                    projectName,
                    status: tx.status || 'Confirmed',
                    totalDeliveryOrders: 0,
                    totalVolume: 0,
                    estimasiNilai: 0,
                    periodMap: new Map()
                })
            }

            const group = unbilledGroupMap.get(groupKey)!
            group.totalDeliveryOrders += 1
            group.totalVolume = Number((group.totalVolume + tx.volume_cubic).toFixed(2))
            group.estimasiNilai += lineTotal

            if (!group.periodMap.has(dateStr)) {
                group.periodMap.set(dateStr, {
                    date: dateStr,
                    formattedDate: formattedDateStr,
                    jobCount: 0,
                    volume: 0,
                    estimasiNilai: 0,
                    deliveries: []
                })
            }

            const period = group.periodMap.get(dateStr)!
            period.jobCount += 1
            period.volume = Number((period.volume + tx.volume_cubic).toFixed(2))
            period.estimasiNilai += lineTotal
            period.deliveries.push({
                ticketNo,
                location: deliveryLocation,
                mutu: tx.concreteQuality?.name || '-',
                volume: tx.volume_cubic,
                mixerTruck: tx.vehicle?.plate_number || tx.vehicle?.code || '-',
                time: timeStr,
                unitPrice,
                totalPrice: lineTotal
            })
        }

        // Convert grouped unbilled map to flat array
        const allUnbilledCustomers = Array.from(unbilledGroupMap.values()).map(g => ({
            customerId: g.customerId,
            customerName: g.customerName,
            projectName: g.projectName,
            totalDeliveryOrders: g.totalDeliveryOrders,
            totalVolume: g.totalVolume,
            estimasiNilai: Math.round(g.estimasiNilai),
            status: g.status,
            deliveryPeriods: Array.from(g.periodMap.values()).map(p => ({
                date: p.date,
                formattedDate: p.formattedDate,
                jobCount: p.jobCount,
                volume: p.volume,
                estimasiNilai: Math.round(p.estimasiNilai),
                deliveries: p.deliveries
            }))
        }))

        // Pagination for unbilled customers
        const totalItems = allUnbilledCustomers.length
        const totalPages = Math.max(1, Math.ceil(totalItems / limit))
        const paginatedCustomers = allUnbilledCustomers.slice((page - 1) * limit, page * limit)

        const unbilledPagination = {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit,
            customers: paginatedCustomers
        }

        // Legacy customer breakdown (sorted by remaining debt)
        const customerBreakdown = Array.from(customerMap.values())
            .filter(c => c.sisaTagihan > 0)
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
                    totalTagihan: Math.round(totalTagihan),
                    totalDibayar: Math.round(totalDibayar),
                    totalSisaTagihan: Math.round(totalSisaTagihan),
                    rasioKolektibilitas,
                    unbilledCount: unbilledTransactions.length,
                    unbilledTotalVolume: Number(unbilledTotalVolume.toFixed(2)),
                    unbilledTotalEstimasi: Math.round(unbilledTotalEstimasi),
                    aging_summary
                },
                unbilledPagination,
                invoices: invoiceList,
                aging_summary,
                customerBreakdown
            }
        })

    } catch (error: any) {
        console.error("Mobile Billing Dashboard Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
