import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileToken } from '@/lib/auth-mobile'
import { startOfDay, endOfDay, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const authResult = verifyMobileToken(req)
    if (authResult.error) return authResult.error

    const user = authResult.user

    if (!['AdminBP', 'SuperAdminBP', 'AdminLogistik', 'CEO', 'FVP'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    try {
        const url = new URL(req.url)

        // Allowed Filters
        const startDateParam = url.searchParams.get('startDate')
        const endDateParam = url.searchParams.get('endDate')
        const companyGroupId = url.searchParams.get('companyGroupId')
        const categoryId = url.searchParams.get('categoryId')

        // Default to current month if no dates provided
        const now = new Date()
        let startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

        if (startDateParam && endDateParam) {
            startDate = startOfDay(new Date(startDateParam))
            endDate = endOfDay(new Date(endDateParam))
        }

        const whereClause: any = {
            tanggal_terbit: {
                gte: startDate,
                lte: endDate
            }
        }

        if (companyGroupId && companyGroupId !== 'all') {
            whereClause.companyGroupId = companyGroupId
        }
        if (categoryId && categoryId !== 'all') {
            whereClause.categoryId = categoryId
        }

        const [pos, companies, categories] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where: whereClause,
                include: {
                    companyGroup: { select: { name: true, kode_cabang: true } },
                    category: { select: { name: true } },
                    items: { select: { subtotal: true } }
                },
                orderBy: { tanggal_terbit: 'desc' }
            }),
            prisma.poCompanyGroup.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
            prisma.poCategory.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
        ])

        let totalPengeluaran = 0
        let poDraftCount = 0
        let poApprovedCount = 0
        let poCancelledCount = 0

        const pengeluaranPerPerusahaan: Record<string, number> = {}
        const pengeluaranPerKategori: Record<string, number> = {}

        pos.forEach((po: any) => {
            const poTotal = po.items.reduce((acc: number, item: any) => acc + item.subtotal, 0)
            totalPengeluaran += poTotal

            if (po.status === 'DRAFT') poDraftCount++
            else if (po.status === 'APPROVED') poApprovedCount++
            else if (po.status === 'CANCELLED') poCancelledCount++

            // By Company Tracking
            const companyName = po.companyGroup?.name || 'Lainnya'
            if (!pengeluaranPerPerusahaan[companyName]) {
                pengeluaranPerPerusahaan[companyName] = 0
            }
            pengeluaranPerPerusahaan[companyName] += poTotal

            // By Category Tracking
            const categoryName = po.category?.name || 'Lainnya'
            if (!pengeluaranPerKategori[categoryName]) {
                pengeluaranPerKategori[categoryName] = 0
            }
            pengeluaranPerKategori[categoryName] += poTotal
        })

        const companyBreakdown = Object.entries(pengeluaranPerPerusahaan)
            .map(([name, total]) => ({ name, total: total as number }))
            .sort((a, b) => b.total - a.total)

        const categoryBreakdown = Object.entries(pengeluaranPerKategori)
            .map(([name, total]) => ({ name, total: total as number }))
            .sort((a, b) => b.total - a.total)

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalPengeluaran,
                    totalPo: pos.length,
                    poDraftCount,
                    poApprovedCount,
                    poCancelledCount,
                    companyBreakdown,
                    categoryBreakdown
                },
                filterOptions: {
                    companies,
                    categories
                },
                recentPos: pos.slice(0, 10).map((po: any) => ({
                    id: po.id,
                    po_number: po.po_number,
                    tanggal_terbit: format(new Date(po.tanggal_terbit), 'dd MMM yyyy'),
                    company: po.companyGroup?.name || 'N/A',
                    projectName: null,
                    category: po.category?.name || 'N/A',
                    status: po.status,
                    total: po.items.reduce((acc: number, item: any) => acc + item.subtotal, 0)
                }))
            }
        })

    } catch (error: any) {
        console.error("Mobile Logistik Dashboard Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
