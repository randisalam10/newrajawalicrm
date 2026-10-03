"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format, parse, startOfYear, endOfYear } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
    MonthlyClosingRecord,
    PeriodSummaryStats,
    ClosePeriodPreview,
    PeriodOptionItem,
    ClosingStatusMap,
    ClosePeriodPayload
} from "./types"
import { getMonthlyManagementReportData } from "@/app/(dashboard)/admin/reports/monthly-management/actions"

export async function getTutupBukuPageData(
    selectedYear?: number,
    selectedLocationId?: string
) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") {
        throw new Error("Akses Ditolak: Modul Tutup Buku ini khusus untuk Super Admin.")
    }

    const currentYear = selectedYear ?? new Date().getFullYear()

    // 1. Fetch all locations
    const locations = await prisma.location.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" }
    })

    // 2. Query MonthlyClosing records
    const closingRecords = await (prisma as any).monthlyClosing.findMany({
        where: {
            year: currentYear,
            ...(selectedLocationId && selectedLocationId !== "all"
                ? { locationId: selectedLocationId }
                : {})
        },
        include: {
            location: { select: { id: true, name: true } },
            closedBy: { select: { id: true, username: true, employee: { select: { name: true } } } },
            reopenedBy: { select: { id: true, username: true, employee: { select: { name: true } } } }
        },
        orderBy: [{ period: "desc" }, { createdAt: "desc" }]
    })

    const formattedRecords: MonthlyClosingRecord[] = closingRecords.map((r: any) => ({
        id: r.id,
        closingKey: r.closingKey,
        period: r.period,
        year: r.year,
        month: r.month,
        locationId: r.locationId,
        locationName: r.location?.name ?? "Semua Cabang (Konsolidasi Pusat)",
        status: r.status,
        closedAt: r.closedAt ? r.closedAt.toISOString() : "",
        closedById: r.closedById,
        closedByName: r.closedBy?.employee?.name ?? r.closedBy?.username ?? "Super Admin",
        totalVolume: r.totalVolume ?? 0,
        totalRevenue: r.totalRevenue ?? 0,
        totalCogs: r.totalCogs ?? 0,
        totalGrossProfit: r.totalGrossProfit ?? 0,
        totalOverhead: r.totalOverhead ?? 0,
        totalNetProfit: r.totalNetProfit ?? 0,
        semenCost: r.semenCost ?? 0,
        pasirCost: r.pasirCost ?? 0,
        split12Cost: r.split12Cost ?? 0,
        split23Cost: r.split23Cost ?? 0,
        solarCost: r.solarCost ?? 0,
        retaseCost: r.retaseCost ?? 0,
        maintenanceCost: r.maintenanceCost ?? 0,
        notes: r.notes,
        snapshotData: r.snapshotData,
        reopenedAt: r.reopenedAt ? r.reopenedAt.toISOString() : null,
        reopenedByName: r.reopenedBy?.employee?.name ?? r.reopenedBy?.username ?? null,
        reopenReason: r.reopenReason
    }))

    // 3. Calculate Summary Stats for Closed Periods
    const closedOnly = formattedRecords.filter(r => r.status === "CLOSED")
    const stats: PeriodSummaryStats = {
        totalClosedPeriods: closedOnly.length,
        latestClosedPeriod: closedOnly[0]?.period ?? null,
        totalClosedRevenue: closedOnly.reduce((sum, r) => sum + r.totalRevenue, 0),
        totalClosedNetProfit: closedOnly.reduce((sum, r) => sum + r.totalNetProfit, 0),
        totalClosedVolume: closedOnly.reduce((sum, r) => sum + r.totalVolume, 0)
    }

    // 4. Build closing status map per key: `${period}__${locationId || 'ALL'}`
    const closingMap: ClosingStatusMap = {}
    formattedRecords.forEach(r => {
        const key = r.closingKey || `${r.period}__${r.locationId || "ALL"}`
        closingMap[key] = {
            id: r.id,
            closingKey: key,
            period: r.period,
            locationId: r.locationId,
            status: r.status,
            closedAt: r.closedAt || undefined,
            closedByName: r.closedByName
        }
    })

    // 5. Generate 12 months for closing dropdown in the selected year
    const availablePeriods: PeriodOptionItem[] = []
    for (let m = 12; m >= 1; m--) {
        const monthPad = String(m).padStart(2, "0")
        const periodStr = `${currentYear}-${monthPad}`
        const dateObj = new Date(currentYear, m - 1, 1)
        const label = format(dateObj, "MMMM yyyy", { locale: idLocale })
        const konsolidasiKey = `${periodStr}__ALL`
        availablePeriods.push({
            period: periodStr,
            label,
            status: closingMap[konsolidasiKey]?.status === "CLOSED" ? "CLOSED" : "OPEN",
            hasTransactions: true
        })
    }

    return {
        records: formattedRecords,
        stats,
        locations,
        availablePeriods,
        closingMap,
        currentYear
    }
}

export async function previewClosePeriod(
    period: string,
    locationId?: string | null
): Promise<ClosePeriodPreview> {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") {
        throw new Error("Akses Ditolak: Hanya Super Admin yang berhak melakukan preview tutup buku.")
    }

    const report = await getMonthlyManagementReportData({
        month: period,
        locationId: locationId || "all"
    })

    if (!report.authorized || report.error) {
        throw new Error(report.error || "Gagal memuat data kalkulasi periode.")
    }

    const sc = report.scorecard
    const targetDate = parse(period, "yyyy-MM", new Date())
    const periodLabel = format(targetDate, "MMMM yyyy", { locale: idLocale })

    return {
        period,
        periodLabel,
        locationId: locationId || null,
        locationName: report.activeLocationName || "Semua Cabang (Konsolidasi Pusat)",
        volumeTotal: sc?.productionVolumeM3 ?? 0,
        dppRevenue: sc?.totalDppRevenue ?? 0,
        totalCogs: sc?.totalDirectCost ?? 0,
        grossProfit: sc?.grossProfit ?? 0,
        overheadCost: (sc?.rblOpex ?? 0) + (sc?.totalAmortizationMonthly ?? 0),
        netProfit: sc?.netFieldContribution ?? 0,
        pasirCost: sc?.pasirCost ?? 0,
        splitCost: sc?.splitCost ?? 0,
        semenCost: sc?.semenCost ?? 0,
        solarCost: sc?.fuelCost ?? 0,
        retaseCost: sc?.retaseCost ?? 0,
        maintenanceCost: sc?.maintenanceCost ?? 0
    }
}

async function saveClosingSnapshot(
    period: string,
    locationId: string | null,
    notes: string | undefined,
    userId: string
) {
    const parsedDate = parse(period, "yyyy-MM", new Date())
    const year = parsedDate.getFullYear()
    const month = parsedDate.getMonth() + 1
    const closingKey = `${period}__${locationId || "ALL"}`

    const fullReport = await getMonthlyManagementReportData({
        month: period,
        locationId: locationId || "all"
    })

    if (!fullReport.authorized || fullReport.error) {
        throw new Error(fullReport.error || `Gagal memproses data laporan final untuk ${locationId || "Semua Cabang"}.`)
    }

    const sc = fullReport.scorecard

    return (prisma as any).monthlyClosing.upsert({
        where: { closingKey },
        create: {
            closingKey,
            period,
            year,
            month,
            locationId: locationId || null,
            status: "CLOSED",
            closedAt: new Date(),
            closedById: userId,
            totalVolume: sc?.productionVolumeM3 ?? 0,
            totalRevenue: sc?.totalDppRevenue ?? 0,
            totalCogs: sc?.totalDirectCost ?? 0,
            totalGrossProfit: sc?.grossProfit ?? 0,
            totalOverhead: (sc?.rblOpex ?? 0) + (sc?.totalAmortizationMonthly ?? 0),
            totalNetProfit: sc?.netFieldContribution ?? 0,
            semenCost: sc?.semenCost ?? 0,
            pasirCost: sc?.pasirCost ?? 0,
            split12Cost: sc?.split12Cost ?? 0,
            split23Cost: sc?.split23Cost ?? 0,
            solarCost: sc?.fuelCost ?? 0,
            retaseCost: sc?.retaseCost ?? 0,
            maintenanceCost: sc?.maintenanceCost ?? 0,
            snapshotData: fullReport,
            notes: notes ?? null
        },
        update: {
            status: "CLOSED",
            closedAt: new Date(),
            closedById: userId,
            totalVolume: sc?.productionVolumeM3 ?? 0,
            totalRevenue: sc?.totalDppRevenue ?? 0,
            totalCogs: sc?.totalDirectCost ?? 0,
            totalGrossProfit: sc?.grossProfit ?? 0,
            totalOverhead: (sc?.rblOpex ?? 0) + (sc?.totalAmortizationMonthly ?? 0),
            totalNetProfit: sc?.netFieldContribution ?? 0,
            semenCost: sc?.semenCost ?? 0,
            pasirCost: sc?.pasirCost ?? 0,
            split12Cost: sc?.split12Cost ?? 0,
            split23Cost: sc?.split23Cost ?? 0,
            solarCost: sc?.fuelCost ?? 0,
            retaseCost: sc?.retaseCost ?? 0,
            maintenanceCost: sc?.maintenanceCost ?? 0,
            snapshotData: fullReport,
            notes: notes ?? null,
            reopenedAt: null,
            reopenedById: null,
            reopenReason: null
        }
    })
}

export async function executeClosePeriod(payload: ClosePeriodPayload) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") {
        throw new Error("Akses Ditolak: Hanya Super Admin yang berhak menutup buku.")
    }

    const userId = session.user.id
    const { period, locationId, notes, closeAllBranches } = payload
    const isKonsolidasi = !locationId || locationId === "all"

    if (isKonsolidasi && closeAllBranches) {
        // 1. Eksekusi tutup buku Konsolidasi Pusat (ALL)
        const mainResult = await saveClosingSnapshot(period, null, notes, userId)

        // 2. Eksekusi tutup buku untuk seluruh cabang aktif
        const allLocations = await prisma.location.findMany({ select: { id: true, name: true } })
        let closedCount = 0

        for (const loc of allLocations) {
            try {
                const branchNotes = notes ? `${notes} (Tutup Buku Konsolidasi Sekaligus)` : "Tutup Buku Konsolidasi Sekaligus Seluruh Cabang"
                await saveClosingSnapshot(period, loc.id, branchNotes, userId)
                closedCount++
            } catch (branchErr) {
                console.warn(`Peringatan: Gagal menutup snapshot cabang ${loc.name}:`, branchErr)
            }
        }

        revalidatePath("/admin/finance/tutup-buku")
        revalidatePath("/admin/reports/monthly-management")

        return {
            success: true,
            message: `Periode ${period} berhasil DITUTUP BUKU untuk Konsolidasi Pusat dan ${closedCount} cabang. Seluruh angka resmi telah dikunci.`,
            closingId: mainResult.id
        }
    } else {
        const targetLocId = isKonsolidasi ? null : locationId
        const result = await saveClosingSnapshot(period, targetLocId, notes, userId)

        let targetName = "Semua Cabang (Konsolidasi Pusat)"
        if (targetLocId) {
            const loc = await prisma.location.findUnique({ where: { id: targetLocId }, select: { name: true } })
            if (loc?.name) targetName = `Cabang ${loc.name}`
        }

        revalidatePath("/admin/finance/tutup-buku")
        revalidatePath("/admin/reports/monthly-management")

        return {
            success: true,
            message: `Periode ${period} untuk ${targetName} berhasil DITUTUP BUKU. Angka laporan telah dikunci secara permanen.`,
            closingId: result.id
        }
    }
}

export async function executeReopenPeriod(payload: {
    closingId: string
    reason: string
}) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") {
        throw new Error("Akses Ditolak: Hanya Super Admin yang berhak membuka kembali periode tutup buku.")
    }

    const { closingId, reason } = payload

    if (!reason || reason.trim().length < 20) {
        throw new Error("Alasan pembukaan tutup buku wajib diisi minimal 20 karakter untuk audit trail.")
    }

    const record = await (prisma as any).monthlyClosing.findUnique({
        where: { id: closingId }
    })

    if (!record) {
        throw new Error("Data rekaman tutup buku tidak ditemukan.")
    }

    await (prisma as any).monthlyClosing.update({
        where: { id: closingId },
        data: {
            status: "OPEN",
            reopenedAt: new Date(),
            reopenedById: session.user.id,
            reopenReason: reason.trim()
        }
    })

    revalidatePath("/admin/finance/tutup-buku")
    revalidatePath("/admin/reports/monthly-management")

    return {
        success: true,
        message: `Tutup buku periode ${record.period} berhasil DIBUKA KEMBALI. Transaksi dapat disesuaikan kembali.`
    }
}

export async function getSnapshotDetail(closingId: string) {
    const session = await auth()
    if (session?.user?.role !== "SuperAdminBP") {
        throw new Error("Akses Ditolak.")
    }

    const record = await (prisma as any).monthlyClosing.findUnique({
        where: { id: closingId },
        include: {
            location: { select: { id: true, name: true } },
            closedBy: { select: { id: true, username: true, employee: { select: { name: true } } } }
        }
    })

    if (!record) {
        throw new Error("Record snapshot tidak ditemukan.")
    }

    return record
}
