"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

type DashboardFilter = {
    month?: number
    year?: number
    companyGroupId?: string
    status?: "ALL" | "DRAFT" | "APPROVED" | "CANCELLED"
}

export async function getLogistikDashboardData(filter: DashboardFilter = {}) {
    const session = await auth()
    if (!session?.user) return { error: "Unauthorized" }

    const now = new Date()
    const targetMonth = filter.month ?? now.getMonth() + 1
    const targetYear = filter.year ?? now.getFullYear()

    // Bikin range tanggal awal bulan - akhir bulan
    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999) // Last day of month

    const whereClause: any = {
        tanggal_terbit: {
            gte: startDate,
            lte: endDate
        }
    }

    if (filter.companyGroupId && filter.companyGroupId !== 'all') {
        whereClause.companyGroupId = filter.companyGroupId
    }
    if (filter.status && filter.status !== 'ALL') {
        whereClause.status = filter.status
    }

    // Previous month for MoM comparison
    const prevMonthStart = new Date(targetYear, targetMonth - 2, 1)
    const prevMonthEnd = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59, 999)

    const [pos, companies, categories, prevMonthPos] = await Promise.all([
        prisma.purchaseOrder.findMany({
            where: whereClause,
            include: {
                companyGroup: true,
                category: true,
                items: true
            },
            orderBy: { tanggal_terbit: 'desc' }
        }),
        prisma.poCompanyGroup.findMany({ orderBy: { name: 'asc' } }),
        prisma.poCategory.findMany({ orderBy: { name: 'asc' } }),
        prisma.purchaseOrder.findMany({
            where: {
                tanggal_terbit: { gte: prevMonthStart, lte: prevMonthEnd },
                ...(filter.companyGroupId && filter.companyGroupId !== 'all' ? { companyGroupId: filter.companyGroupId } : {}),
                ...(filter.status && filter.status !== 'ALL' ? { status: filter.status } : {})
            },
            include: { items: true }
        })
    ])

    // Fetch suppliers separately using supplierIds
    const supplierIds = [...new Set(pos.map((p: any) => p.supplierId).filter(Boolean))] as string[]
    const suppliers = supplierIds.length > 0
        ? await prisma.supplier.findMany({ where: { id: { in: supplierIds } } })
        : []
    const supplierMapObj = Object.fromEntries(suppliers.map(s => [s.id, s]))

    let totalPengeluaran = 0
    let totalItems = 0
    let poDraftCount = 0
    let poApprovedCount = 0
    let poCancelledCount = 0
    let maxPoValue = 0

    // Agregasi per kategori
    const expenseByCategory: Record<string, { name: string, total: number }> = {}

    // Agregasi per supplier
    const supplierMap: Record<string, { id: string, name: string, total: number, count: number }> = {}

    // Agregasi per perusahaan -> kategori
    const expenseByCompany: Record<string, {
        id: string,
        name: string,
        kode: string,
        total: number,
        categories: Record<string, { name: string, total: number }>
    }> = {}

    pos.forEach(po => {
        const poTotal = po.items.reduce((acc, item) => acc + item.subtotal, 0)
        totalPengeluaran += poTotal
        totalItems += po.items.length
        if (poTotal > maxPoValue) maxPoValue = poTotal

        if (po.status === 'DRAFT') poDraftCount++
        else if (po.status === 'APPROVED') poApprovedCount++
        else if (po.status === 'CANCELLED') poCancelledCount++

        // Masukin ke agregasi kategori Global
        if (po.category) {
            const catId = po.categoryId
            if (!expenseByCategory[catId]) expenseByCategory[catId] = { name: po.category.name, total: 0 }
            expenseByCategory[catId].total += poTotal
        }

        // Masukin ke agregasi Supplier
        if (po.supplierId && supplierMapObj[po.supplierId]) {
            const sId = po.supplierId
            const sName = supplierMapObj[sId].name
            if (!supplierMap[sId]) {
                supplierMap[sId] = { id: sId, name: sName, total: 0, count: 0 }
            }
            supplierMap[sId].total += poTotal
            supplierMap[sId].count++
        }

        // Masukin ke agregasi Perusahaan
        if (po.companyGroup) {
            const compId = po.companyGroupId
            if (!expenseByCompany[compId]) {
                expenseByCompany[compId] = {
                    id: compId,
                    name: po.companyGroup.name,
                    kode: po.companyGroup.kode_cabang,
                    total: 0,
                    categories: {}
                }
            }
            expenseByCompany[compId].total += poTotal

            if (po.category) {
                const catId = po.categoryId
                if (!expenseByCompany[compId].categories[catId]) {
                    expenseByCompany[compId].categories[catId] = { name: po.category.name, total: 0 }
                }
                expenseByCompany[compId].categories[catId].total += poTotal
            }
        }
    })

    const prevMonthTotal = prevMonthPos.reduce((sum, po) => sum + po.items.reduce((acc, i) => acc + i.subtotal, 0), 0)
    const monthOverMonthChange = prevMonthTotal > 0
        ? Math.round(((totalPengeluaran - prevMonthTotal) / prevMonthTotal) * 100)
        : null

    const avgPoValue = pos.length > 0 ? Math.round(totalPengeluaran / pos.length) : 0
    const topSuppliers = Object.values(supplierMap).sort((a, b) => b.total - a.total).slice(0, 5)

    const chartByCategory = Object.values(expenseByCategory).sort((a, b) => b.total - a.total)
    const companyStats = Object.values(expenseByCompany).map(comp => ({
        ...comp,
        categoriesList: Object.values(comp.categories).sort((a, b) => b.total - a.total)
    })).sort((a, b) => b.total - a.total)

    const enrichedRecentPos = pos.slice(0, 10).map(po => ({
        ...po,
        supplier: po.supplierId ? supplierMapObj[po.supplierId] || null : null
    }))

    return {
        success: true,
        data: {
            summary: {
                totalPengeluaran,
                totalPo: pos.length,
                totalItems,
                poDraftCount,
                poApprovedCount,
                poCancelledCount,
                avgPoValue,
                maxPoValue,
                monthOverMonthChange,
                prevMonthTotal
            },
            topSuppliers,
            chartByCategory,
            companyStats,
            recentPos: enrichedRecentPos,
            filterOptions: {
                companies,
                categories
            }
        }
    }
}
