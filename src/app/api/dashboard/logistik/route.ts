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
            },
            status: { not: 'CANCELLED' }
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

        const breakdownPerPerusahaan: Record<string, { id: string, name: string, total: number }> = {}
        const breakdownPerKategori: Record<string, { id: string, name: string, total: number }> = {}
        const breakdownPerProyek: Record<string, { id: string, name: string, total: number }> = {}

        pos.forEach((po: any) => {
            const poTotal = po.items.reduce((acc: number, item: any) => acc + item.subtotal, 0)
            totalPengeluaran += poTotal

            if (po.status === 'DRAFT') poDraftCount++
            else if (po.status === 'APPROVED') poApprovedCount++

            // By Company Tracking
            const companyId = po.companyGroupId
            const companyName = po.companyGroup?.name || 'Lainnya'
            if (!breakdownPerPerusahaan[companyId]) {
                breakdownPerPerusahaan[companyId] = { id: companyId, name: companyName, total: 0 }
            }
            breakdownPerPerusahaan[companyId].total += poTotal

            // By Category Tracking
            const categoryId = po.categoryId
            const categoryName = po.category?.name || 'Lainnya'
            if (!breakdownPerKategori[categoryId]) {
                breakdownPerKategori[categoryId] = { id: categoryId, name: categoryName, total: 0 }
            }
            breakdownPerKategori[categoryId].total += poTotal
        })

        // Fetch project names to map companyProjectId to actual names
        const projects = await prisma.poCompanyProject.findMany({
            select: { id: true, name: true }
        })
        const projectMap = new Map(projects.map(p => [p.id, p.name]))

        pos.forEach((po: any) => {
            if (po.companyProjectId) {
                const projectId = po.companyProjectId
                const projectName = projectMap.get(projectId) || 'Proyek Tidak Terdeteksi'
                const poTotal = po.items.reduce((acc: number, item: any) => acc + item.subtotal, 0)
                
                if (!breakdownPerProyek[projectId]) {
                    breakdownPerProyek[projectId] = { id: projectId, name: projectName, total: 0 }
                }
                breakdownPerProyek[projectId].total += poTotal
            }
        })

        const companyBreakdown = Object.values(breakdownPerPerusahaan).sort((a, b) => b.total - a.total)
        const categoryBreakdown = Object.values(breakdownPerKategori).sort((a, b) => b.total - a.total)
        const projectBreakdown = Object.values(breakdownPerProyek).sort((a, b) => b.total - a.total)

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
                    categoryBreakdown,
                    projectBreakdown
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
