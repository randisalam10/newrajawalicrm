"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import {
    CrusherRetaseSettingDTO,
    CrusherRetaseReportData,
    CrusherDriverRetaseSummary,
    CrusherMaterialOutDelivery,
    CrusherLocationOption,
    CrusherTripType,
    CrusherOperatorRetaseSummary,
    CrusherOperatorTransactionItem,
} from "./types"
import { computeOperatorFee } from "@/lib/crusher-calc"
import { resolveCrusherRetaseSetting } from "@/lib/crusher-retase-setting"

function canManageCrusherRetase(user: any) {
    if (!user) return false
    if (["SuperAdminBP", "CEO", "FVP", "Finance"].includes(user.role)) return true
    const perms: string[] = user.permissions || []
    return perms.includes("RETASE_MANAGE") || perms.includes("FINANCE_VIEW") || perms.includes("CRUSHER_MANAGE")
}

export async function getCrusherLocationsForRetase(): Promise<CrusherLocationOption[]> {
    try {
        const locations = await (prisma.location as any).findMany({
            where: { type: "STONE_CRUSHER" },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        })
        return locations
    } catch {
        return []
    }
}

export async function getCrusherRetaseSetting(locationId?: string): Promise<CrusherRetaseSettingDTO | null> {
    // B3: presedensi benar — setting spesifik cabang menang atas universal (hindari NULLS FIRST).
    const setting = await resolveCrusherRetaseSetting(locationId)
    if (!setting) return null

    let locationName = "Semua Crusher (Universal)"
    if (setting.locationId) {
        const loc = await prisma.location.findUnique({
            where: { id: setting.locationId },
            select: { name: true },
        })
        locationName = loc?.name || locationName
    }

    return {
        id: setting.id,
        locationId: setting.locationId,
        locationName,
        formula_type: setting.formula_type as any,
        rate_dt_kecil: setting.rate_dt_kecil,
        rate_dt_besar: setting.rate_dt_besar,
        rate_per_km: setting.rate_per_km,
        rate_per_m3_km: setting.rate_per_m3_km,
        rate_flat_rit: setting.rate_flat_rit,
        effective_date: setting.effective_date ? setting.effective_date.toISOString().split("T")[0] : null,
        isActive: setting.isActive,
        notes: setting.notes,
    }
}

export async function saveCrusherRetaseSetting(data: {
    id?: string
    locationId?: string | null
    formula_type: string
    rate_dt_kecil: number
    rate_dt_besar: number
    rate_per_km: number
    rate_per_m3_km: number
    rate_flat_rit: number
    effective_date?: string | null
    notes?: string | null
}) {
    const session = await auth()
    if (!session?.user || !canManageCrusherRetase(session.user)) {
        throw new Error("Akses ditolak: Hanya SuperAdmin atau Finance yang dapat mengatur tarif retase.")
    }

    const locId = data.locationId && data.locationId !== "all" ? data.locationId : null
    const effectiveDate = data.effective_date ? new Date(`${data.effective_date}T12:00:00.000Z`) : null

    let saved
    if (data.id) {
        saved = await prisma.crusherRetaseSetting.update({
            where: { id: data.id },
            data: {
                locationId: locId,
                formula_type: data.formula_type,
                rate_dt_kecil: Number(data.rate_dt_kecil) || 0,
                rate_dt_besar: Number(data.rate_dt_besar) || 0,
                rate_per_km: Number(data.rate_per_km) || 0,
                rate_per_m3_km: Number(data.rate_per_m3_km) || 0,
                rate_flat_rit: Number(data.rate_flat_rit) || 0,
                effective_date: effectiveDate,
                notes: data.notes || null,
                isActive: true,
            },
        })
    } else {
        saved = await prisma.crusherRetaseSetting.create({
            data: {
                locationId: locId,
                formula_type: data.formula_type,
                rate_dt_kecil: Number(data.rate_dt_kecil) || 0,
                rate_dt_besar: Number(data.rate_dt_besar) || 0,
                rate_per_km: Number(data.rate_per_km) || 0,
                rate_per_m3_km: Number(data.rate_per_m3_km) || 0,
                rate_flat_rit: Number(data.rate_flat_rit) || 0,
                effective_date: effectiveDate,
                notes: data.notes || null,
                isActive: true,
            },
        })
    }

    revalidatePath("/admin/retase-crusher")
    revalidatePath("/crusher")
    return { success: true, settingId: saved.id }
}

export async function getCrusherRetaseReport(params?: {
    month?: string // YYYY-MM
    locationId?: string
    isPaid?: "ALL" | "PAID" | "UNPAID"
    driverId?: string
    tripType?: CrusherTripType
}): Promise<CrusherRetaseReportData> {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const now = new Date()
    const targetMonth = params?.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const [yearStr, monthStr] = targetMonth.split("-")
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

    const locationIdFilter = params?.locationId && params.locationId !== "all" ? params.locationId : undefined
    const selectedTripType = params?.tripType || "ALL"

    // ─── 1. FETCH MATERIAL IN (QUARRY & FEEDING) ─────────────────────────
    const shouldFetchIn = selectedTripType === "ALL" || selectedTripType === "MATERIAL_IN"
    const inRecords = shouldFetchIn
        ? await prisma.crusherMaterialIn.findMany({
            where: {
                report: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    location: { type: "STONE_CRUSHER" },
                    ...(locationIdFilter ? { locationId: locationIdFilter } : {}),
                },
                ...(params?.driverId && params.driverId !== "all"
                    ? {
                        OR: [
                            { driverId: params.driverId },
                            { driver_name: { contains: params.driverId, mode: "insensitive" } },
                        ],
                    }
                    : {}),
                ...(params?.isPaid === "PAID"
                    ? { is_paid: true }
                    : params?.isPaid === "UNPAID"
                        ? { is_paid: false }
                        : {}),
            },
            include: {
                report: {
                    select: {
                        id: true,
                        date: true,
                        locationId: true,
                        location: { select: { name: true } },
                    },
                },
                driver: {
                    select: { id: true, name: true },
                },
                source: {
                    select: { id: true, name: true, default_distance_km: true },
                },
            },
            orderBy: [{ report: { date: "desc" } }, { createdAt: "desc" }],
        })
        : []

    // ─── 2. FETCH MATERIAL OUT (PENJUALAN BEBAS NON-BP UNTUK SOPIR) ─────
    const shouldFetchOut = selectedTripType === "ALL" || selectedTripType === "MATERIAL_OUT"
    const outRecords = shouldFetchOut
        ? await prisma.crusherMaterialOut.findMany({
            where: {
                destination_type: "PENJUALAN_BEBAS",
                report: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    location: { type: "STONE_CRUSHER" },
                    ...(locationIdFilter ? { locationId: locationIdFilter } : {}),
                },
                ...(params?.driverId && params.driverId !== "all"
                    ? {
                        OR: [
                            { driverId: params.driverId },
                            { driver_name: { contains: params.driverId, mode: "insensitive" } },
                        ],
                    }
                    : {}),
                ...(params?.isPaid === "PAID"
                    ? { is_retase_paid: true }
                    : params?.isPaid === "UNPAID"
                        ? { is_retase_paid: false }
                        : {}),
            },
            include: {
                report: {
                    select: {
                        id: true,
                        date: true,
                        locationId: true,
                        location: { select: { name: true } },
                    },
                },
                driver: {
                    select: { id: true, name: true },
                },
            },
            orderBy: [{ report: { date: "desc" } }, { createdAt: "desc" }],
        })
        : []

    // ─── 2B. FETCH OPERATOR OUT RECORDS (ALL MATERIAL OUT) ───────────────
    const opRecords = await prisma.crusherMaterialOut.findMany({
        where: {
            report: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                location: { type: "STONE_CRUSHER" },
                ...(locationIdFilter ? { locationId: locationIdFilter } : {}),
            },
            // B13: terapkan filter pelunasan yang sama dengan inRecords/outRecords agar
            // ringkasan operator sinkron dengan filter. (Filter driver tidak relevan untuk operator.)
            ...(params?.isPaid === "PAID"
                ? { is_operator_paid: true }
                : params?.isPaid === "UNPAID"
                    ? { is_operator_paid: false }
                    : {}),
        },
        include: {
            report: {
                select: {
                    id: true,
                    date: true,
                    locationId: true,
                    location: { select: { name: true } },
                },
            },
            operator: {
                select: { id: true, name: true },
            },
            targetLocation: {
                select: { id: true, name: true },
            },
            destination: {
                select: { id: true, name: true },
            },
        },
        orderBy: [{ report: { date: "desc" } }, { createdAt: "desc" }],
    })

    // Batch load destination master for Material Out
    const destIds = Array.from(
        new Set(
            outRecords
                .map((r: any) => r.destinationId)
                .filter((id): id is string => Boolean(id))
        )
    )
    const destMap = new Map<string, { id: string; name: string; distance_km: number }>()
    if (destIds.length > 0 && (prisma as any).crusherDestination) {
        try {
            const dests = await (prisma as any).crusherDestination.findMany({
                where: { id: { in: destIds } },
                select: { id: true, name: true, distance_km: true },
            })
            for (const d of dests) {
                destMap.set(d.id, d)
            }
        } catch (e) {
            console.warn("[RetaseCrusher] Error fetching destinations:", e)
        }
    }

    // ─── 3. MAP ITEMS TO UNIFIED TRIP LIST ──────────────────────────────
    const inDeliveries: CrusherMaterialOutDelivery[] = inRecords.map((r) => {
        const tripDate = r.report?.date ? r.report.date.toISOString().split("T")[0] : ""
        const locName = r.report?.location?.name || "Stone Crusher"
        const driverName = r.driver_name || r.driver?.name || "Tanpa Sopir"
        const srcName = r.source_name || r.source?.name || "Quarry Kali"
        const dist = r.distance_km ?? r.source?.default_distance_km ?? 0
        const rit = r.ritase ?? 1
        const rate = r.rate_price ?? 4500
        const amount = r.retase_amount > 0 ? r.retase_amount : rit * rate
        const isPaid = r.is_paid ?? false
        const catLabel = r.feed_type === "QUARRY_RAW" ? "Material Masuk (Quarry)" : "Material Masuk (Kolbin)"
        const matName = r.feed_type === "QUARRY_RAW" ? "Batu Kali / Mentah" : "Batu Split Feeding"

        return {
            id: r.id,
            reportId: r.reportId,
            category: "MATERIAL_IN" as const,
            categoryLabel: catLabel,
            feedType: r.feed_type,
            date: tripDate,
            locationId: r.report?.locationId || "",
            locationName: locName,
            plateNumber: r.plate_number || "-",
            dumpTruckSize: "BESAR",
            driverId: r.driverId,
            driverName: driverName,
            materialName: matName,
            volumeM3: r.volume_m3 ?? 0,
            destinationId: r.sourceId,
            destinationName: srcName,
            distanceKm: dist,
            ritase: rit,
            retaseRate: rate,
            retaseAmount: amount,
            isRetasePaid: isPaid,
            paidRetaseDate: r.paid_date ? r.paid_date.toISOString().split("T")[0] : null,
            notes: r.notes,
        }
    })

    const outDeliveries: CrusherMaterialOutDelivery[] = outRecords.map((r) => {
        const tripDate = r.report?.date ? r.report.date.toISOString().split("T")[0] : ""
        const locName = r.report?.location?.name || "Stone Crusher"
        const driverName = r.driver_name || r.driver?.name || "Tanpa Sopir"
        const destObj = r.destinationId ? destMap.get(r.destinationId) : null
        const destName = destObj?.name || (r as any).destination?.name || r.customer_name || "Pelanggan Umum"
        const vol = r.volume_m3 ?? 0
        const dist = r.distance_km ?? 0
        const amount = r.retase_amount ?? 0
        const isPaid = r.is_retase_paid ?? false

        return {
            id: r.id,
            reportId: r.reportId,
            category: "MATERIAL_OUT" as const,
            categoryLabel: "Material Keluar (Non-BP)",
            feedType: null,
            date: tripDate,
            locationId: r.report?.locationId || "",
            locationName: locName,
            plateNumber: r.plate_number || "-",
            dumpTruckSize: r.dump_truck_size || "BESAR",
            driverId: r.driverId,
            driverName: driverName,
            materialName: r.material_name,
            volumeM3: vol,
            destinationId: r.destinationId,
            destinationName: destName,
            distanceKm: dist,
            ritase: r.ritase ?? 1,
            retaseRate: r.retase_rate ?? 0,
            retaseAmount: amount,
            isRetasePaid: isPaid,
            paidRetaseDate: r.paid_retase_date ? r.paid_retase_date.toISOString().split("T")[0] : null,
            notes: r.notes,
        }
    })

    const deliveries = [...inDeliveries, ...outDeliveries].sort((a, b) => {
        const dComp = b.date.localeCompare(a.date)
        if (dComp !== 0) return dComp
        return b.id.localeCompare(a.id)
    })

    // ─── 4. CALCULATE DRIVER SUMMARIES & TOTALS ──────────────────────────
    const driverMap = new Map<string, CrusherDriverRetaseSummary>()
    let totalTrips = 0
    let totalRitMasuk = 0
    let totalRitKeluar = 0
    let totalVolumeM3 = 0
    let totalDistanceKm = 0
    let totalRetaseAmount = 0
    let totalPaidAmount = 0
    let totalUnpaidAmount = 0

    for (const d of deliveries) {
        totalTrips += d.ritase
        if (d.category === "MATERIAL_IN") {
            totalRitMasuk += d.ritase
        } else {
            totalRitKeluar += d.ritase
        }
        totalVolumeM3 += d.volumeM3
        // B14: jarak total = jarak per trip × ritase (bukan hanya per baris).
        totalDistanceKm += d.distanceKm * d.ritase
        totalRetaseAmount += d.retaseAmount
        if (d.isRetasePaid) {
            totalPaidAmount += d.retaseAmount
        } else {
            totalUnpaidAmount += d.retaseAmount
        }

        const dKey = d.driverId || d.driverName
        const cur = driverMap.get(dKey) || {
            driverId: d.driverId || null,
            driverName: d.driverName,
            totalTrips: 0,
            totalRitMasuk: 0,
            totalRitKeluar: 0,
            totalVolumeM3: 0,
            totalDistanceKm: 0,
            totalRetaseAmount: 0,
            totalPaidAmount: 0,
            totalUnpaidAmount: 0,
            unpaidTripCount: 0,
        }

        cur.totalTrips += d.ritase
        if (d.category === "MATERIAL_IN") {
            cur.totalRitMasuk += d.ritase
        } else {
            cur.totalRitKeluar += d.ritase
        }
        cur.totalVolumeM3 += d.volumeM3
        cur.totalDistanceKm += d.distanceKm * d.ritase
        cur.totalRetaseAmount += d.retaseAmount
        if (d.isRetasePaid) {
            cur.totalPaidAmount += d.retaseAmount
        } else {
            cur.totalUnpaidAmount += d.retaseAmount
            cur.unpaidTripCount += 1
        }
        driverMap.set(dKey, cur)
    }

    const driverSummaries = Array.from(driverMap.values()).sort(
        (a, b) => b.totalRetaseAmount - a.totalRetaseAmount
    )

    // ─── 5. ASSEMBLE OPERATOR TRANSACTIONS & SUMMARIES ──────────────────
    const operatorTransactions: CrusherOperatorTransactionItem[] = opRecords.map((r) => {
        const tripDate = r.report?.date ? r.report.date.toISOString().split("T")[0] : ""
        const locName = r.report?.location?.name || "Stone Crusher"
        const opName = r.operator_name || r.operator?.name || "Operator Crusher"
        const vol = r.volume_m3 ?? 0
        const rate = (r.operator_rate && r.operator_rate > 0) ? r.operator_rate : 5000
        // B2: jangan pakai `> 0` sebagai penanda "belum dihitung" — nilai 0 yang sah (material
        // non-pecahan) harus dipertahankan. Fallback memakai aturan insentif terpusat.
        const fee = (r.operator_fee && r.operator_fee > 0)
            ? r.operator_fee
            : computeOperatorFee(r.material_name, vol, rate)
        const isPaid = r.is_operator_paid ?? false
        const destName = r.destination_type === "BATCHING_PLANT"
            ? (r.targetLocation?.name ? `BP ${r.targetLocation.name}` : "Batching Plant")
            : (r.destination?.name || r.customer_name || "Penjualan Bebas")

        return {
            id: r.id,
            reportId: r.reportId,
            date: tripDate,
            locationId: r.report?.locationId || "",
            locationName: locName,
            operatorId: r.operatorId,
            operatorName: opName,
            materialName: r.material_name,
            volumeM3: vol,
            operatorRate: rate,
            operatorFee: fee,
            isOperatorPaid: isPaid,
            destinationType: r.destination_type,
            destinationName: destName,
            plateNumber: r.plate_number || "-",
            driverName: r.driver_name || "-",
            notes: r.notes,
        }
    })

    const operatorMap = new Map<string, CrusherOperatorRetaseSummary>()
    let totalOperatorFee = 0
    let totalOperatorPaid = 0
    let totalOperatorUnpaid = 0
    let totalOperatorVolumeM3 = 0

    for (const t of operatorTransactions) {
        totalOperatorFee += t.operatorFee
        totalOperatorVolumeM3 += t.volumeM3
        if (t.isOperatorPaid) {
            totalOperatorPaid += t.operatorFee
        } else {
            totalOperatorUnpaid += t.operatorFee
        }

        const opKey = t.operatorId || t.operatorName
        const cur = operatorMap.get(opKey) || {
            operatorId: t.operatorId || null,
            operatorName: t.operatorName,
            totalTransactions: 0,
            totalVolumeM3: 0,
            totalOperatorFee: 0,
            totalPaidAmount: 0,
            totalUnpaidAmount: 0,
            unpaidCount: 0,
        }

        cur.totalTransactions += 1
        cur.totalVolumeM3 += t.volumeM3
        cur.totalOperatorFee += t.operatorFee
        if (t.isOperatorPaid) {
            cur.totalPaidAmount += t.operatorFee
        } else {
            cur.totalUnpaidAmount += t.operatorFee
            cur.unpaidCount += 1
        }
        operatorMap.set(opKey, cur)
    }

    const operatorSummaries = Array.from(operatorMap.values()).sort(
        (a, b) => b.totalOperatorFee - a.totalOperatorFee
    )

    return {
        periodMonth: targetMonth,
        locationId: locationIdFilter || null,
        selectedTripType,
        summary: {
            totalTrips,
            totalRitMasuk,
            totalRitKeluar,
            totalVolumeM3,
            totalDistanceKm,
            totalRetaseAmount,
            totalPaidAmount,
            totalUnpaidAmount,
            totalOperatorFee,
            totalOperatorPaid,
            totalOperatorUnpaid,
            totalOperatorVolumeM3,
        },
        driverSummaries,
        deliveries,
        operatorSummaries,
        operatorTransactions,
    }
}

/**
 * Backdate Recalculation Server Action
 * Recalculates retase_rate and retase_amount for all non-BP deliveries
 * within a specified date range using the active CrusherRetaseSetting formula.
 */
export async function recalculateCrusherRetaseBackdate(params: {
    startDate: string // YYYY-MM-DD
    endDate: string // YYYY-MM-DD
    locationId?: string
    onlyUnpaid?: boolean
    overrideFormulaType?: string
    overrideRateDtKecil?: number
    overrideRateDtBesar?: number
    overrideRatePerKm?: number
    overrideRatePerM3Km?: number
    overrideRateFlatRit?: number
}) {
    const session = await auth()
    if (!session?.user || !canManageCrusherRetase(session.user)) {
        throw new Error("Akses ditolak: Hanya SuperAdmin atau Finance yang dapat melakukan hitung ulang backdate.")
    }

    const start = new Date(`${params.startDate}T00:00:00.000Z`)
    const end = new Date(`${params.endDate}T23:59:59.999Z`)

    const locFilter = params.locationId && params.locationId !== "all" ? params.locationId : undefined

    // 1. Fetch matching active setting (B3: spesifik cabang menang atas universal)
    const activeSetting = await resolveCrusherRetaseSetting(locFilter)

    const formulaType = params.overrideFormulaType || activeSetting?.formula_type || "PER_KM_TIERED"
    const rateDtKecil = params.overrideRateDtKecil ?? activeSetting?.rate_dt_kecil ?? 320
    const rateDtBesar = params.overrideRateDtBesar ?? activeSetting?.rate_dt_besar ?? 0
    const ratePerKm = params.overrideRatePerKm ?? activeSetting?.rate_per_km ?? 0
    const ratePerM3Km = params.overrideRatePerM3Km ?? activeSetting?.rate_per_m3_km ?? 0
    const rateFlatRit = params.overrideRateFlatRit ?? activeSetting?.rate_flat_rit ?? 0

    // 2. Fetch deliveries to recalculate
    const records = await prisma.crusherMaterialOut.findMany({
        where: {
            destination_type: "PENJUALAN_BEBAS",
            report: {
                date: {
                    gte: start,
                    lte: end,
                },
                ...(locFilter ? { locationId: locFilter } : {}),
            },
            ...(params.onlyUnpaid !== false ? { is_retase_paid: false } : {}),
        },
        select: {
            id: true,
            dump_truck_size: true,
            distance_km: true,
            ritase: true,
            volume_m3: true,
            destinationId: true,
        },
    })

    if (records.length === 0) {
        return { success: true, count: 0, totalAmount: 0 }
    }

    const destIds = Array.from(
        new Set(
            records
                .map((r: any) => r.destinationId)
                .filter((id): id is string => Boolean(id))
        )
    )
    const destMap = new Map<string, number>()
    if (destIds.length > 0 && (prisma as any).crusherDestination) {
        try {
            const dests = await (prisma as any).crusherDestination.findMany({
                where: { id: { in: destIds } },
                select: { id: true, distance_km: true },
            })
            for (const d of dests) {
                destMap.set(d.id, Number(d.distance_km ?? 0))
            }
        } catch (e) {
            console.warn("[RetaseCrusher] Error fetching destination distance:", e)
        }
    }

    let totalRecalculatedAmount = 0
    const updates = records.map((r) => {
        // If distance_km is 0 but destination has distance, backfill distance
        const fallbackDist = r.destinationId ? (destMap.get(r.destinationId) ?? 0) : 0
        const distance = (r.distance_km && r.distance_km > 0)
            ? r.distance_km
            : fallbackDist
        const rit = r.ritase ?? 1
        const vol = r.volume_m3 ?? 0

        let rate = 0
        let amount = 0

        if (formulaType === "PER_KM_TIERED") {
            rate = r.dump_truck_size === "KECIL" ? rateDtKecil : rateDtBesar
            amount = rate * distance * rit
        } else if (formulaType === "PER_KM_FLAT") {
            rate = ratePerKm
            amount = ratePerKm * distance * rit
        } else if (formulaType === "PER_M3_KM") {
            rate = ratePerM3Km
            amount = ratePerM3Km * vol * distance
        } else if (formulaType === "PER_RIT_FLAT") {
            rate = rateFlatRit
            amount = rateFlatRit * rit
        }

        totalRecalculatedAmount += amount

        return prisma.crusherMaterialOut.update({
            where: { id: r.id },
            data: {
                distance_km: distance,
                retase_rate: rate,
                retase_amount: amount,
            },
        })
    })

    // Execute in transaction chunks of 50
    const chunkSize = 50
    for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize)
        await prisma.$transaction(chunk)
    }

    revalidatePath("/admin/retase-crusher")
    revalidatePath("/crusher")
    revalidatePath("/crusher/material-keluar")

    return {
        success: true,
        count: records.length,
        totalAmount: totalRecalculatedAmount,
        formulaUsed: formulaType,
    }
}

/**
 * Mark Delivery Retase as Paid / Unpaid
 */
export async function markCrusherRetasePaid(tripIds: string[], isPaid: boolean = true) {
    const session = await auth()
    if (!session?.user || !canManageCrusherRetase(session.user)) {
        throw new Error("Akses ditolak: Hanya SuperAdmin atau Finance yang dapat mencatat pelunasan.")
    }

    if (!tripIds || tripIds.length === 0) return { success: true, count: 0 }

    const [resOut, resIn] = await Promise.all([
        prisma.crusherMaterialOut.updateMany({
            where: { id: { in: tripIds } },
            data: {
                is_retase_paid: isPaid,
                paid_retase_date: isPaid ? new Date() : null,
            },
        }),
        prisma.crusherMaterialIn.updateMany({
            where: { id: { in: tripIds } },
            data: {
                is_paid: isPaid,
                paid_date: isPaid ? new Date() : null,
            },
        }),
    ])

    revalidatePath("/admin/retase-crusher")
    revalidatePath("/crusher")
    revalidatePath("/crusher/material-masuk")
    revalidatePath("/crusher/material-keluar")

    return { success: true, count: resOut.count + resIn.count }
}

/**
 * Mark Operator Crusher Incentive as Paid / Unpaid
 */
export async function markCrusherOperatorPaid(deliveryIds: string[], isPaid: boolean = true) {
    const session = await auth()
    if (!session?.user || !canManageCrusherRetase(session.user)) {
        throw new Error("Akses ditolak: Hanya SuperAdmin atau Finance yang dapat mencatat pelunasan insentif operator.")
    }

    if (!deliveryIds || deliveryIds.length === 0) return { success: true, count: 0 }

    const res = await prisma.crusherMaterialOut.updateMany({
        where: { id: { in: deliveryIds } },
        data: {
            is_operator_paid: isPaid,
        },
    })

    revalidatePath("/admin/retase-crusher")
    revalidatePath("/crusher")
    revalidatePath("/crusher/material-keluar")

    return { success: true, count: res.count }
}
