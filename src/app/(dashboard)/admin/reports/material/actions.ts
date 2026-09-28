'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { startOfDay, endOfDay, parseISO } from "date-fns"

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

        const [incomings, outgoings, locations, masterMaterials] = await Promise.all([
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
            (prisma as any).masterMaterial?.findMany ? (prisma as any).masterMaterial.findMany() : []
        ])

        // Filter search client-side if given
        const searchLower = filters.search?.toLowerCase().trim() || ""

        const processedIncoming = incomings.map((item: any) => {
            const vol = Number(item.volume_cubic) || 0
            const unitPrice = Number(item.unit_price) || 0
            const matCost = Number(item.total_price) || (vol * unitPrice)
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
            const unitPrice = Number(item.unit_price) || 0
            const totalVal = Number(item.total_price) || (vol * unitPrice)
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
