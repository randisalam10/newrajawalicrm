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

    const [pos, companies, categories] = await Promise.all([
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
        prisma.poCategory.findMany({ orderBy: { name: 'asc' } })
    ])

    let totalPengeluaran = 0
    let totalItems = 0
    let poDraftCount = 0
    let poApprovedCount = 0
    let poCancelledCount = 0

    // Agregasi per kategori
    const expenseByCategory: Record<string, { name: string, total: number }> = {}

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
        totalItems += po.items.reduce((acc, item) => acc + item.quantity, 0)

        if (po.status === 'DRAFT') poDraftCount++
        else if (po.status === 'APPROVED') poApprovedCount++
        else if (po.status === 'CANCELLED') poCancelledCount++

        // Masukin ke agregasi kategori Global
        if (po.category) {
            const catId = po.categoryId
            if (!expenseByCategory[catId]) expenseByCategory[catId] = { name: po.category.name, total: 0 }
            expenseByCategory[catId].total += poTotal
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

    const chartByCategory = Object.values(expenseByCategory).sort((a, b) => b.total - a.total)
    const companyStats = Object.values(expenseByCompany).map(comp => ({
        ...comp,
        categoriesList: Object.values(comp.categories).sort((a, b) => b.total - a.total)
    })).sort((a, b) => b.total - a.total)

    return {
        success: true,
        data: {
            summary: {
                totalPengeluaran,
                totalPo: pos.length,
                totalItems,
                poDraftCount,
                poApprovedCount,
                poCancelledCount
            },
            chartByCategory,
            companyStats,
            recentPos: pos.slice(0, 10), // Ambil 10 terbaru
            filterOptions: {
                companies,
                categories
            }
        }
    }
}
