// Print page: Laporan Bulanan PO
// Route: /print/po/laporan
// Params: bulan, tahun, grupBy, categoryId?, companyGroupId?, status?

import { LaporanPOClient } from "./client"
import { getPOReport } from "@/app/(dashboard)/logistik/po/actions"
import { prisma } from "@/lib/prisma"

export default async function PrintLaporanPOPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>
}) {
    const params = await searchParams
    const bulan = Number(params.bulan) || new Date().getMonth() + 1
    const tahun = Number(params.tahun) || new Date().getFullYear()
    const grupBy = (params.grupBy === "perusahaan" ? "perusahaan" : "kategori") as "kategori" | "perusahaan"
    const categoryId = params.categoryId || undefined
    const companyGroupId = params.companyGroupId || undefined
    const status = (params.status || "ALL") as any

    const report = await getPOReport({ bulan, tahun, grupBy, categoryId, companyGroupId, status })

    // Get names for filter labels
    const [companyName, categoryName] = await Promise.all([
        companyGroupId ? prisma.poCompanyGroup.findUnique({ where: { id: companyGroupId }, select: { name: true } }) : null,
        categoryId ? prisma.poCategory.findUnique({ where: { id: categoryId }, select: { name: true } }) : null,
    ])

    // Convert Date objects to strings for PDF serialization
    const serialized = {
        ...report,
        bulan,
        tahun,
        grupBy,
        filterPerusahaan: companyName?.name,
        filterKategori: categoryName?.name,
        filterStatus: status !== "ALL" ? status : undefined,
        generatedAt: new Date().toISOString(),
        groups: report.groups.map(group => ({
            ...group,
            items: group.items.map(item => ({
                ...item,
                tanggal_terbit: item.tanggal_terbit instanceof Date
                    ? item.tanggal_terbit.toISOString()
                    : item.tanggal_terbit,
            }))
        }))
    }

    return <LaporanPOClient data={serialized} />
}
