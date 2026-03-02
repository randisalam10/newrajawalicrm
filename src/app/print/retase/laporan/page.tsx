// Print: Laporan Retase & Surat Jalan
// Route: /print/retase/laporan
// Params: dateFrom, dateTo, customerId?, locationId?, pembuat?

import { RetaseLaporanPrintClient } from "./client"
import { getTransactionReport } from "@/app/(dashboard)/admin/reports/retase/actions"
import { prisma } from "@/lib/prisma"

export default async function PrintRetaseLaporanPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>
}) {
    const params = await searchParams
    const dateFrom = params.dateFrom || new Date().toISOString().slice(0, 10)
    const dateTo = params.dateTo || new Date().toISOString().slice(0, 10)
    const customerId = params.customerId || undefined
    const locationId = params.locationId || undefined

    const report = await getTransactionReport({ dateFrom, dateTo, customerId, locationId })

    // Resolve filter labels
    const [customerRecord, locationRecord] = await Promise.all([
        customerId ? (prisma as any).customer.findUnique({ where: { id: customerId }, select: { customer_name: true } }) : null,
        locationId ? (prisma as any).location.findUnique({ where: { id: locationId }, select: { name: true } }) : null,
    ])

    const totalVolume = report.rows.reduce((acc: number, r: any) => acc + (r.volume_cubic || 0), 0)
    const totalRetase = report.rows.reduce((acc: number, r: any) => acc + (r.retase?.income_amount || 0), 0)

    const serialized = {
        dateFrom,
        dateTo,
        filterCustomer: customerRecord?.customer_name,
        filterCabang: locationRecord?.name,
        pembuat: params.pembuat || report.pembuat,
        generatedAt: new Date().toISOString(),
        totalVolume,
        totalRetase,
        rows: report.rows.map((r: any) => ({
            id: r.id,
            date: r.date instanceof Date ? r.date.toISOString() : r.date,
            customer_name: r.project?.customer?.customer_name || "-",
            project_name: r.project?.name || "-",
            mutu: r.concreteQuality?.name || "-",
            volume_cubic: r.volume_cubic || 0,
            sopir: r.driver?.name || "-",
            kendaraan: `${r.vehicle?.code || ""} (${r.vehicle?.plate_number || "-"})`,
            km: r.retase?.calculated_distance ?? null,
            income_amount: r.retase?.income_amount ?? null,
            price_per_cubic_km: r.retase?.price_per_cubic_km ?? null,
            volume_rts: r.retase?.volume ?? null,
            cabang: r.location?.name || "-",
        }))
    }

    return <RetaseLaporanPrintClient data={serialized} />
}
