'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { startOfDay, endOfDay, parseISO } from "date-fns"
import { revalidatePath } from "next/cache"

export interface MaterialReportFilters {
    startDate?: string
    endDate?: string
    locationId?: string
    aggregateType?: string
    sourceType?: string
    search?: string
}

const MATERIAL_DISPLAY_NAMES: Record<string, string> = {
    Pasir: "Pasir Cor",
    SplitHalfOne: "Batu Split 1/2",
    SplitTwoThree: "Batu Split 2/3",
    Other: "Agregat Lainnya / Sirtu",
    Semen: "Semen",
    PASIR: "Pasir Cor",
    SPLIT_1_2: "Batu Split 1/2",
    SPLIT_2_3: "Batu Split 2/3",
    ABU_BATU: "Abu Batu / Screening",
    OTHER: "Agregat Lainnya / Sirtu",
}

const AGGREGATE_TYPE_TO_MATERIAL_CODE: Record<string, string> = {
    Pasir: "PASIR",
    PASIR: "PASIR",
    SplitHalfOne: "SPLIT_1_2",
    SPLIT_1_2: "SPLIT_1_2",
    SplitTwoThree: "SPLIT_2_3",
    SPLIT_2_3: "SPLIT_2_3",
    Other: "OTHER",
    OTHER: "OTHER",
    AbuBatu: "ABU_BATU",
    ABU_BATU: "ABU_BATU",
    Semen: "SEMEN",
    SEMEN: "SEMEN",
}

function toDateString(d: Date | string): string {
    const dateObj = typeof d === "string" ? new Date(d) : d
    return dateObj.toISOString().slice(0, 10)
}

/**
 * High-performance in-memory resolver:
 * Matches the effective price of a material at any historical transaction date.
 * Prioritizes branch-specific rate on or before txDate, then global rate,
 * and falls back to earliest rate if txDate is older than the first effective date.
 */
function resolveEffectivePrice(
    histories: any[],
    aggregateType: string,
    txDate: Date | string,
    locationId?: string | null
): number {
    const matCode = AGGREGATE_TYPE_TO_MATERIAL_CODE[aggregateType] || aggregateType
    const cleanLocationId = locationId && locationId !== "all" ? locationId : null
    const txDateStr = toDateString(txDate)

    const matEntries = histories.filter((h) => h.material_code === matCode)
    if (!matEntries.length) return 0

    const byDateDesc = (a: any, b: any) =>
        toDateString(b.effective_date).localeCompare(toDateString(a.effective_date))

    const byDateAsc = (a: any, b: any) =>
        toDateString(a.effective_date).localeCompare(toDateString(b.effective_date))

    // 1. Try branch-specific entry active on or before txDate
    if (cleanLocationId) {
        const branchActive = matEntries
            .filter((h) => h.locationId === cleanLocationId && toDateString(h.effective_date) <= txDateStr)
            .sort(byDateDesc)
        if (branchActive.length > 0) {
            return branchActive[0].price_per_m3
        }
    }

    // 2. Try global entry (locationId is null) active on or before txDate
    const globalActive = matEntries
        .filter((h) => !h.locationId && toDateString(h.effective_date) <= txDateStr)
        .sort(byDateDesc)
    if (globalActive.length > 0) {
        return globalActive[0].price_per_m3
    }

    // 3. Fallback: txDate is older than earliest active date.
    // Try earliest branch entry if location specified
    if (cleanLocationId) {
        const branchEarliest = matEntries
            .filter((h) => h.locationId === cleanLocationId)
            .sort(byDateAsc)
        if (branchEarliest.length > 0) {
            return branchEarliest[0].price_per_m3
        }
    }

    // Fallback: earliest global entry
    const globalEarliest = matEntries
        .filter((h) => !h.locationId)
        .sort(byDateAsc)
    if (globalEarliest.length > 0) {
        return globalEarliest[0].price_per_m3
    }

    // Fallback: any earliest entry
    const anyEarliest = [...matEntries].sort(byDateAsc)
    return anyEarliest[0]?.price_per_m3 || 0
}

export async function getMaterialReportData(filters: MaterialReportFilters) {
    const session = await auth()
    if (!session?.user) {
        return {
            success: false,
            error: "Unauthorized",
            kpis: null,
            byMaterial: [],
            bySource: [],
            byDriver: [],
            byLocation: [],
            incomingList: [],
            outgoingList: [],
            locations: []
        }
    }

    try {
        const userRole = session.user.role || ""
        const isSuperAdmin = userRole === "SuperAdminBP" || ["CEO", "FVP"].includes(userRole)

        // Location filtering with role restriction
        let activeLocationId: string | undefined = undefined
        if (!isSuperAdmin && session.user.locationId) {
            activeLocationId = session.user.locationId
        } else if (filters.locationId && filters.locationId !== "all") {
            activeLocationId = filters.locationId
        }

        // Date Range (default: current month)
        const now = new Date()
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const start = filters.startDate ? startOfDay(parseISO(filters.startDate)) : startOfDay(defaultStart)
        const end = filters.endDate ? endOfDay(parseISO(filters.endDate)) : endOfDay(defaultEnd)

        // Where filters for Incoming and Outgoing
        const incomingWhere: any = {
            date: { gte: start, lte: end }
        }
        const outgoingWhere: any = {
            date: { gte: start, lte: end }
        }

        if (activeLocationId) {
            incomingWhere.locationId = activeLocationId
            outgoingWhere.locationId = activeLocationId
        }
        if (filters.aggregateType && filters.aggregateType !== "all") {
            let t = filters.aggregateType
            if (t === "PASIR") t = "Pasir"
            if (t === "SPLIT_1_2") t = "SplitHalfOne"
            if (t === "SPLIT_2_3") t = "SplitTwoThree"
            if (t === "OTHER") t = "Other"
            incomingWhere.aggregate_type = t
            outgoingWhere.aggregate_type = t
        }
        if (filters.sourceType && filters.sourceType !== "all") {
            incomingWhere.source_type = filters.sourceType
        }

        const [incomings, outgoings, locations, priceHistories] = await Promise.all([
            prisma.aggregateIncoming.findMany({
                where: incomingWhere,
                include: {
                    location: { select: { id: true, name: true } },
                    driver: { select: { id: true, name: true } },
                    vehicle: { select: { id: true, plate_number: true } },
                },
                orderBy: { date: "desc" }
            }),
            prisma.aggregateOutgoing.findMany({
                where: outgoingWhere,
                include: {
                    location: { select: { id: true, name: true } },
                    driver: { select: { id: true, name: true } },
                    vehicle: { select: { id: true, plate_number: true } },
                },
                orderBy: { date: "desc" }
            }),
            prisma.location.findMany({
                select: { id: true, name: true },
                orderBy: { name: "asc" }
            }),
            prisma.materialPriceHistory.findMany({
                orderBy: { effective_date: "asc" }
            })
        ])

        // Filter search client-side if given
        const searchLower = filters.search?.toLowerCase().trim() || ""

        const processedIncoming = incomings.map((item: any) => {
            const vol = Number(item.volume_cubic) || 0
            
            // Check stored unit price; if 0 or null, dynamically resolve from Master Material
            const storedUnitPrice = Number(item.unit_price) || 0
            const masterUnitPrice = resolveEffectivePrice(priceHistories, item.aggregate_type, item.date, item.locationId)
            const unitPrice = storedUnitPrice > 0 ? storedUnitPrice : masterUnitPrice

            const storedTotalPrice = Number(item.total_price) || 0
            const matCost = (storedTotalPrice > 0 && storedUnitPrice > 0)
                ? storedTotalPrice
                : Math.round(vol * unitPrice)

            const retaseCost = Number(item.retase_amount) || 0
            const landedCost = matCost + retaseCost
            const landedPerM3 = vol > 0 ? landedCost / vol : 0

            return {
                id: item.id,
                date: item.date,
                no_bon: item.no_bon,
                driver_name: item.driver?.name || item.driver_name || "-",
                plate_number: item.vehicle?.plate_number || item.plate_number || "-",
                dump_truck_size: item.dump_truck_size || "-",
                distance_km: item.distance_km || 0,
                rate_price: item.rate_price || 0,
                aggregate_type: item.aggregate_type,
                material_name: MATERIAL_DISPLAY_NAMES[item.aggregate_type] || item.aggregate_type,
                source_type: item.source_type, // "Internal" | "External"
                supplier: item.supplier || (item.source_type === "Internal" ? "Quarry Sendiri" : "Vendor Luar"),
                locationId: item.locationId,
                locationName: item.location?.name || "-",
                volume_cubic: vol,
                unit_price: unitPrice,
                is_from_master_price: storedUnitPrice <= 0 && masterUnitPrice > 0,
                material_cost: matCost,
                retase_cost: retaseCost,
                landed_cost: landedCost,
                landed_per_m3: landedPerM3,
                is_retase_paid: !!item.is_retase_paid,
                notes: item.notes || "",
            }
        }).filter((item: any) => {
            if (!searchLower) return true
            return (
                item.no_bon.toLowerCase().includes(searchLower) ||
                item.driver_name.toLowerCase().includes(searchLower) ||
                item.plate_number.toLowerCase().includes(searchLower) ||
                item.material_name.toLowerCase().includes(searchLower) ||
                item.supplier.toLowerCase().includes(searchLower) ||
                item.locationName.toLowerCase().includes(searchLower)
            )
        })

        const processedOutgoing = outgoings.map((item: any) => {
            const vol = Number(item.volume_cubic) || 0
            
            const storedUnitPrice = Number(item.unit_price) || 0
            const masterUnitPrice = resolveEffectivePrice(priceHistories, item.aggregate_type, item.date, item.locationId)
            const unitPrice = storedUnitPrice > 0 ? storedUnitPrice : masterUnitPrice

            const storedTotalPrice = Number(item.total_price) || 0
            const totalVal = (storedTotalPrice > 0 && storedUnitPrice > 0)
                ? storedTotalPrice
                : Math.round(vol * unitPrice)

            const retaseCost = Number(item.retase_amount) || 0

            return {
                id: item.id,
                date: item.date,
                no_bon: item.no_bon || "-",
                aggregate_type: item.aggregate_type,
                material_name: MATERIAL_DISPLAY_NAMES[item.aggregate_type] || item.aggregate_type,
                category: item.category || "PENJUALAN",
                recipient: item.recipient || "-",
                volume_cubic: vol,
                unit_price: unitPrice,
                is_from_master_price: storedUnitPrice <= 0 && masterUnitPrice > 0,
                total_price: totalVal,
                transport_mode: item.transport_mode || "BUYER",
                driver_name: item.driver?.name || item.driver_name || "-",
                plate_number: item.vehicle?.plate_number || item.plate_number || "-",
                retase_amount: retaseCost,
                locationId: item.locationId,
                locationName: item.location?.name || "-",
                notes: item.notes || "",
            }
        }).filter((item: any) => {
            if (!searchLower) return true
            return (
                item.no_bon.toLowerCase().includes(searchLower) ||
                item.material_name.toLowerCase().includes(searchLower) ||
                item.recipient.toLowerCase().includes(searchLower) ||
                item.driver_name.toLowerCase().includes(searchLower) ||
                item.locationName.toLowerCase().includes(searchLower)
            )
        })

        // Accumulation Metrics
        const totalIncomingVolume = processedIncoming.reduce((s: number, i: any) => s + i.volume_cubic, 0)
        const totalIncomingMaterialCost = processedIncoming.reduce((s: number, i: any) => s + i.material_cost, 0)
        const totalIncomingRetaseCost = processedIncoming.reduce((s: number, i: any) => s + i.retase_cost, 0)
        const grandTotalLandedCost = totalIncomingMaterialCost + totalIncomingRetaseCost
        const avgLandedCostPerM3 = totalIncomingVolume > 0 ? grandTotalLandedCost / totalIncomingVolume : 0
        const avgMaterialUnitPrice = totalIncomingVolume > 0 ? totalIncomingMaterialCost / totalIncomingVolume : 0

        const totalOutgoingVolume = processedOutgoing.reduce((s: number, i: any) => s + i.volume_cubic, 0)
        const totalOutgoingValue = processedOutgoing.reduce((s: number, i: any) => s + i.total_price, 0)

        // KPI Summary
        const kpis = {
            totalIncomingVolume,
            totalIncomingMaterialCost,
            totalIncomingRetaseCost,
            grandTotalLandedCost,
            avgLandedCostPerM3,
            avgMaterialUnitPrice,
            totalOutgoingVolume,
            totalOutgoingValue,
            netCost: grandTotalLandedCost - totalOutgoingValue,
            incomingCount: processedIncoming.length,
            outgoingCount: processedOutgoing.length,
        }

        // Breakdown by Material Type
        const standardTypes = ["Pasir", "SplitHalfOne", "SplitTwoThree", "Other"]
        const presentIncomingTypes = processedIncoming.map((i: any) => i.aggregate_type)
        const presentOutgoingTypes = processedOutgoing.map((i: any) => i.aggregate_type)
        const materialTypes = Array.from(new Set([...standardTypes, ...presentIncomingTypes, ...presentOutgoingTypes]))
        const byMaterial = materialTypes.map((code) => {
            const items = processedIncoming.filter((i: any) => i.aggregate_type === code)
            const outItems = processedOutgoing.filter((i: any) => i.aggregate_type === code)

            const vol = items.reduce((s: number, i: any) => s + i.volume_cubic, 0)
            const matCost = items.reduce((s: number, i: any) => s + i.material_cost, 0)
            const retaseCost = items.reduce((s: number, i: any) => s + i.retase_cost, 0)
            const landedCost = matCost + retaseCost
            const landedPerM3 = vol > 0 ? landedCost / vol : 0
            const avgUnitPrice = vol > 0 ? matCost / vol : 0
            const pctOfTotal = grandTotalLandedCost > 0 ? (landedCost / grandTotalLandedCost) * 100 : 0

            const outVol = outItems.reduce((s: number, i: any) => s + i.volume_cubic, 0)
            const outVal = outItems.reduce((s: number, i: any) => s + i.total_price, 0)

            return {
                code,
                name: MATERIAL_DISPLAY_NAMES[code] || code,
                volume_cubic: vol,
                material_cost: matCost,
                retase_cost: retaseCost,
                landed_cost: landedCost,
                avg_unit_price: avgUnitPrice,
                avg_landed_per_m3: landedPerM3,
                pct_of_total: pctOfTotal,
                transaction_count: items.length,
                outgoing_volume: outVol,
                outgoing_value: outVal,
                net_volume: vol - outVol,
            }
        })

        // Breakdown by Source (Internal Quarry vs External Vendor)
        const sourceTypes = ["Internal", "External"]
        const bySource = sourceTypes.map((st) => {
            const items = processedIncoming.filter((i: any) => i.source_type === st)
            const vol = items.reduce((s: number, i: any) => s + i.volume_cubic, 0)
            const matCost = items.reduce((s: number, i: any) => s + i.material_cost, 0)
            const retaseCost = items.reduce((s: number, i: any) => s + i.retase_cost, 0)
            const landedCost = matCost + retaseCost

            return {
                source_type: st,
                label: st === "Internal" ? "Quarry Sendiri (Internal)" : "Pembelian Vendor (Eksternal)",
                volume_cubic: vol,
                material_cost: matCost,
                retase_cost: retaseCost,
                landed_cost: landedCost,
                avg_landed_per_m3: vol > 0 ? landedCost / vol : 0,
                pct_of_total: grandTotalLandedCost > 0 ? (landedCost / grandTotalLandedCost) * 100 : 0,
                count: items.length,
            }
        })

        // Breakdown by Driver / Dump Truck (Retase Analysis)
        const driverMap = new Map<string, any>()
        processedIncoming.forEach((item: any) => {
            const key = item.driver_name || "Tanpa Sopir"
            if (!driverMap.has(key)) {
                driverMap.set(key, {
                    driver_name: key,
                    plate_number: item.plate_number,
                    dump_truck_size: item.dump_truck_size,
                    trip_count: 0,
                    volume_cubic: 0,
                    material_cost: 0,
                    retase_cost: 0,
                    paid_retase: 0,
                    unpaid_retase: 0,
                })
            }
            const d = driverMap.get(key)
            d.trip_count += 1
            d.volume_cubic += item.volume_cubic
            d.material_cost += item.material_cost
            d.retase_cost += item.retase_cost
            if (item.is_retase_paid) {
                d.paid_retase += item.retase_cost
            } else {
                d.unpaid_retase += item.retase_cost
            }
        })
        const byDriver = Array.from(driverMap.values()).sort((a, b) => b.retase_cost - a.retase_cost)

        // Breakdown by Location / Branch
        const locationMap = new Map<string, any>()
        processedIncoming.forEach((item: any) => {
            const key = item.locationName || "Cabang Lain"
            if (!locationMap.has(key)) {
                locationMap.set(key, {
                    locationName: key,
                    volume_cubic: 0,
                    material_cost: 0,
                    retase_cost: 0,
                    landed_cost: 0,
                    trip_count: 0,
                })
            }
            const l = locationMap.get(key)
            l.trip_count += 1
            l.volume_cubic += item.volume_cubic
            l.material_cost += item.material_cost
            l.retase_cost += item.retase_cost
            l.landed_cost += item.landed_cost
        })
        const byLocation = Array.from(locationMap.values()).sort((a, b) => b.landed_cost - a.landed_cost)

        return {
            success: true,
            kpis,
            byMaterial,
            bySource,
            byDriver,
            byLocation,
            incomingList: processedIncoming,
            outgoingList: processedOutgoing,
            locations
        }
    } catch (err: any) {
        console.error("getMaterialReportData error:", err)
        return {
            success: false,
            error: err.message || "Gagal memuat data laporan material.",
            kpis: null,
            byMaterial: [],
            bySource: [],
            byDriver: [],
            byLocation: [],
            incomingList: [],
            outgoingList: [],
            locations: []
        }
    }
}

export interface SyncMaterialPricesInput {
    mode?: "missing_only" | "force_all"
    startDate?: string
    endDate?: string
    locationId?: string
}

/**
 * Data Correction Action:
 * Permanently updates unit_price and total_price on historical AggregateIncoming & AggregateOutgoing records
 * based on the effective Master Material price at the exact date of the transaction.
 */
export async function syncHistoricalAggregatePrices(options?: SyncMaterialPricesInput) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const userRole = session.user.role || ""
    const isSuperAdmin = userRole === "SuperAdminBP" || ["CEO", "FVP"].includes(userRole)
    if (!isSuperAdmin && !["AdminLogistik", "Admin"].includes(userRole)) {
        return { success: false, error: "Akses Ditolak: Anda tidak memiliki izin untuk mengoreksi data material." }
    }

    try {
        const mode = options?.mode || "missing_only"
        const cleanLocationId = (!isSuperAdmin && session.user.locationId)
            ? session.user.locationId
            : (options?.locationId && options.locationId !== "all" ? options.locationId : undefined)

        const whereIncoming: any = {}
        const whereOutgoing: any = {}

        if (options?.startDate || options?.endDate) {
            whereIncoming.date = {}
            whereOutgoing.date = {}
            if (options.startDate) {
                whereIncoming.date.gte = startOfDay(parseISO(options.startDate))
                whereOutgoing.date.gte = startOfDay(parseISO(options.startDate))
            }
            if (options.endDate) {
                whereIncoming.date.lte = endOfDay(parseISO(options.endDate))
                whereOutgoing.date.lte = endOfDay(parseISO(options.endDate))
            }
        }

        if (cleanLocationId) {
            whereIncoming.locationId = cleanLocationId
            whereOutgoing.locationId = cleanLocationId
        }

        if (mode === "missing_only") {
            whereIncoming.OR = [
                { unit_price: null },
                { unit_price: 0 },
                { total_price: null },
                { total_price: 0 },
            ]
            whereOutgoing.OR = [
                { unit_price: null },
                { unit_price: 0 },
                { total_price: null },
                { total_price: 0 },
            ]
        }

        // Fetch all price histories ordered by effective_date
        const priceHistories = await prisma.materialPriceHistory.findMany({
            orderBy: { effective_date: "asc" }
        })

        if (!priceHistories.length) {
            return {
                success: false,
                error: "Tidak ada riwayat harga di Master Material. Harap isi data master terlebih dahulu."
            }
        }

        // Fetch matching incomings and outgoings
        const [targetIncomings, targetOutgoings] = await Promise.all([
            prisma.aggregateIncoming.findMany({
                where: whereIncoming,
                select: { id: true, date: true, aggregate_type: true, volume_cubic: true, unit_price: true, locationId: true }
            }),
            prisma.aggregateOutgoing.findMany({
                where: whereOutgoing,
                select: { id: true, date: true, aggregate_type: true, volume_cubic: true, unit_price: true, locationId: true }
            })
        ])

        let updatedIncomingCount = 0
        let updatedOutgoingCount = 0

        // Prepare updates for incomings
        const incomingUpdates = targetIncomings.map((item) => {
            const resolvedPrice = resolveEffectivePrice(priceHistories, item.aggregate_type, item.date, item.locationId)
            if (resolvedPrice > 0) {
                const vol = Number(item.volume_cubic) || 0
                const totalPrice = Math.round(vol * resolvedPrice)
                return prisma.aggregateIncoming.update({
                    where: { id: item.id },
                    data: {
                        unit_price: resolvedPrice,
                        total_price: totalPrice,
                    }
                })
            }
            return null
        }).filter(Boolean)

        // Prepare updates for outgoings
        const outgoingUpdates = targetOutgoings.map((item) => {
            const resolvedPrice = resolveEffectivePrice(priceHistories, item.aggregate_type, item.date, item.locationId)
            if (resolvedPrice > 0) {
                const vol = Number(item.volume_cubic) || 0
                const totalPrice = Math.round(vol * resolvedPrice)
                return prisma.aggregateOutgoing.update({
                    where: { id: item.id },
                    data: {
                        unit_price: resolvedPrice,
                        total_price: totalPrice,
                    }
                })
            }
            return null
        }).filter(Boolean)

        // Execute batch updates in chunks of 50
        for (let i = 0; i < incomingUpdates.length; i += 50) {
            const chunk = incomingUpdates.slice(i, i + 50)
            await prisma.$transaction(chunk as any)
            updatedIncomingCount += chunk.length
        }

        for (let i = 0; i < outgoingUpdates.length; i += 50) {
            const chunk = outgoingUpdates.slice(i, i + 50)
            await prisma.$transaction(chunk as any)
            updatedOutgoingCount += chunk.length
        }

        revalidatePath("/admin/reports/material")
        revalidatePath("/admin/material-agregat")
        revalidatePath("/admin/master-material")

        return {
            success: true,
            message: `Koreksi data berhasil! ${updatedIncomingCount} transaksi masuk dan ${updatedOutgoingCount} transaksi keluar telah disinkronkan dengan harga Master Material.`,
            updatedIncomingCount,
            updatedOutgoingCount,
        }
    } catch (err: any) {
        console.error("syncHistoricalAggregatePrices error:", err)
        return {
            success: false,
            error: err.message || "Gagal melakukan sinkronisasi harga material."
        }
    }
}
