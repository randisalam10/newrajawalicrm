import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'
import { startOfDay, endOfDay, startOfMonth, subDays, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    // Ensure only executive/managerial roles can access this summary
    if (!['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    try {
        const now = new Date()
        const todayStart = startOfDay(now)
        const todayEnd = endOfDay(now)
        const monthStart = startOfMonth(now)
        const sevenDaysAgo = startOfDay(subDays(now, 6))

        // Run all independent queries CONCURRENTLY using Promise.all for speed
        const [
            // 1. LOGISTIK: Pengeluaran bulan ini
            poBulanIni,
            // 2. LOGISTIK: Pending Approvals
            pendingPos,
            // 3. BETON: Produksi bulan ini (volume)
            betonBulanIni,
            // 4. BETON: Produksi hari ini (opsional untuk trend)
            betonTrend7Hari,
            // 5. FINANCE/INVOICE: Total Piutang Belum Dibayar (UNPAID/PARTIAL)
            outstandingInvoices
        ] = await Promise.all([
            // 1. Logistik: Month Spend
            prisma.purchaseOrder.findMany({
                where: {
                    tanggal_terbit: { gte: monthStart, lte: todayEnd },
                    status: { not: 'CANCELLED' } // Include DRAFT, PENDING, APPROVED for total projection
                },
                select: { items: { select: { subtotal: true } } }
            }),

            // 2. Logistik: Pending Approvals (Urgent actionable item)
            prisma.purchaseOrder.count({
                where: { status: 'DRAFT' }
            }),

            // 3. Beton: Produksi Bulan Ini
            prisma.productionTransaction.aggregate({
                where: { date: { gte: monthStart, lte: todayEnd } },
                _sum: { volume_cubic: true }
            }),

            // 4. Beton: Trend Produksi 7 Hari Terakhir
            prisma.productionTransaction.findMany({
                where: { date: { gte: sevenDaysAgo, lte: todayEnd } },
                select: { date: true, volume_cubic: true }
            }),

            // 5. Finance: Outstanding Invoices (Piutang Berjalan)
            prisma.invoice.findMany({
                where: { status: { in: ['ISSUED', 'PARTIAL'] } },
                select: { total_amount: true, paid_amount: true }
            }).catch(() => []) // Catch in case Invoice table isn't fully set up yet
        ])

        // --- CALCULATION PHASE ---

        // A. PENGELUARAN LOGISTIK
        const totalPengeluaranBulanIni = poBulanIni.reduce((total, po) => {
            const poSubtotal = po.items.reduce((sum, item) => sum + item.subtotal, 0)
            return total + poSubtotal
        }, 0)

        // B. PRODUKSI BETON
        const totalVolumeBulanIni = betonBulanIni._sum.volume_cubic || 0

        // Process 7 Days Trend (Sparkline Data)
        const trendMap: Record<string, number> = {}
        for (let i = 6; i >= 0; i--) {
            const d = subDays(now, i)
            trendMap[format(d, 'yyyy-MM-dd')] = 0
        }
        betonTrend7Hari.forEach((t) => {
            const key = format(new Date(t.date), 'yyyy-MM-dd')
            if (trendMap[key] !== undefined) {
                trendMap[key] += t.volume_cubic
            }
        })
        const betonTrendArray = Object.values(trendMap)

        // C. PIUTANG FINANCE
        const outstandingReceivable = outstandingInvoices.reduce((total, inv) => {
            return total + (inv.total_amount - (inv.paid_amount || 0))
        }, 0)

        // --- ASSEMBLE PAYLOAD FOR MOBILE ---
        const responseData = {
            finance_beton: {
                receivable: {
                    value: outstandingReceivable,
                    status: outstandingReceivable > 200000000 ? "warning" : "positive"
                }
            },
            finance_logistik: {
                po_spend: {
                    value: totalPengeluaranBulanIni,
                    status: "neutral"
                }
            },
            operations: {
                pending_po: pendingPos,
                concrete_volume_this_month: totalVolumeBulanIni,
                concrete_trend_7_days: betonTrendArray
            }
        }

        return NextResponse.json({
            success: true,
            data: responseData
        })

    } catch (error: any) {
        console.error("Executive Dashboard API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
