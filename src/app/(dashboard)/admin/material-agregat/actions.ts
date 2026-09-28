"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { isCorporateUser, getLocationFilter } from "@/lib/rbac"
import { getMaterialPriceAtDate, simulatePriceAtDate } from "../master-material/actions"
import { AGGREGATE_TYPE_TO_MATERIAL_CODE } from "./columns"

const aggregateSchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Tanggal tidak valid" }),
    no_bon: z.string().min(1, "No Bon wajib diisi"),
    driver_name: z.string().min(1, "Nama Sopir wajib diisi"),
    plate_number: z.string().min(1, "Plat Kendaraan wajib diisi"),
    volume_cubic: z.coerce.number().min(0.01, "Volume harus lebih dari 0"),
    aggregate_type: z.enum(["SplitHalfOne", "SplitTwoThree", "Pasir", "Other"]),
    source_type: z.enum(["Internal", "External"]),
    supplier: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    locationId: z.string().min(1, "Cabang wajib diisi"),
    vehicleId: z.string().optional().nullable(),
    driverId: z.string().optional().nullable(),
    dump_truck_size: z.preprocess(val => (val === "" ? null : val), z.enum(["BESAR", "KECIL"]).nullable().optional()),
    distance_km: z.preprocess(val => (val === "" || val === undefined || val === null ? null : Number(val)), z.number().nullable().optional()),
    rate_price: z.preprocess(val => (val === "" || val === undefined || val === null ? null : Number(val)), z.number().nullable().optional()),
    retase_amount: z.preprocess(val => (val === "" || val === undefined || val === null ? null : Number(val)), z.number().nullable().optional()),
    unit_price: z.preprocess(val => (val === "" || val === undefined || val === null ? null : Number(val)), z.number().nullable().optional()),
    total_price: z.preprocess(val => (val === "" || val === undefined || val === null ? null : Number(val)), z.number().nullable().optional()),
})

export async function getAggregateIncomings(limit: number = 250) {
    const session = await auth()
    if (!session?.user) return []

    const filter = getLocationFilter(session.user)

    return await prisma.aggregateIncoming.findMany({
        where: filter,
        include: { 
            location: true,
            vehicle: true,
            driver: true
        },
        take: limit,
        orderBy: { date: "desc" },
    })
}

export async function createAggregateIncoming(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error("Unauthorized")

        if (["CEO", "FVP", "Approver"].includes(session.user.role || "")) {
            throw new Error("Akses Ditolak: Anda berada dalam mode pemantauan.")
        }

        const isCorp = isCorporateUser(session.user)
        const targetLocationId = (isCorp || session.user.role === "SuperAdminBP")
            ? (formData.get("locationId") as string)
            : session.user.locationId

        const rawData = {
            date: formData.get("date"),
            no_bon: formData.get("no_bon"),
            driver_name: formData.get("driver_name"),
            plate_number: formData.get("plate_number"),
            volume_cubic: formData.get("volume_cubic"),
            aggregate_type: formData.get("aggregate_type"),
            source_type: formData.get("source_type"),
            supplier: formData.get("supplier") || undefined,
            notes: formData.get("notes") || undefined,
            locationId: targetLocationId,
            vehicleId: formData.get("vehicleId") || undefined,
            driverId: formData.get("driverId") || undefined,
            dump_truck_size: formData.get("dump_truck_size") || undefined,
            distance_km: formData.get("distance_km") || undefined,
            rate_price: formData.get("rate_price") || undefined,
            retase_amount: formData.get("retase_amount") || undefined,
            unit_price: formData.get("unit_price") || undefined,
            total_price: formData.get("total_price") || undefined,
        }

        const data = aggregateSchema.parse(rawData)

        // Internal Quarry Transport Commission (Retase) Calculation
        let resolvedDistance = data.distance_km ?? null
        let resolvedRate = data.rate_price ?? null
        let calculatedRetase = data.retase_amount ?? null

        if (data.source_type === "Internal") {
            const setting = await prisma.aggregateRetaseSetting.findUnique({
                where: { locationId: data.locationId }
            })

            if (setting) {
                // Determine rate strictly by branch setting according to dump_truck_size
                resolvedRate = data.dump_truck_size === "BESAR" 
                    ? setting.price_dt_besar 
                    : (data.dump_truck_size === "KECIL" ? setting.price_dt_kecil : (setting.price_dt_besar || 0))

                if (resolvedDistance == null || resolvedDistance <= 0) {
                    resolvedDistance = setting.default_distance_km
                }
            }

            if (resolvedRate != null && resolvedDistance != null) {
                // Formula: tarif x jarak x kubikasi riil
                calculatedRetase = Math.round(Number(data.volume_cubic) * Number(resolvedDistance) * Number(resolvedRate))
            }
        } else {
            // Eksternal pembelian luar tidak ada retase internal
            resolvedDistance = null
            resolvedRate = null
            calculatedRetase = null
        }

        // Material Expenditure Pricing (Integrated with Master Material Price)
        let resolvedUnitPrice = data.unit_price ?? null
        if (resolvedUnitPrice == null || resolvedUnitPrice === 0) {
            const matCode = AGGREGATE_TYPE_TO_MATERIAL_CODE[data.aggregate_type]
            if (matCode) {
                resolvedUnitPrice = await getMaterialPriceAtDate(matCode, new Date(data.date), data.locationId)
            }
        }
        const calculatedTotalPrice = resolvedUnitPrice != null && resolvedUnitPrice > 0
            ? Math.round(Number(data.volume_cubic) * Number(resolvedUnitPrice))
            : (data.total_price ?? 0)

        await prisma.aggregateIncoming.create({
            data: {
                date: new Date(data.date),
                no_bon: data.no_bon,
                driver_name: data.driver_name,
                plate_number: data.plate_number,
                volume_cubic: data.volume_cubic,
                aggregate_type: data.aggregate_type,
                source_type: data.source_type,
                supplier: data.supplier || null,
                notes: data.notes || null,
                locationId: data.locationId,
                vehicleId: data.vehicleId || null,
                driverId: data.driverId || null,
                dump_truck_size: data.dump_truck_size || null,
                distance_km: resolvedDistance,
                rate_price: resolvedRate,
                retase_amount: calculatedRetase,
                unit_price: resolvedUnitPrice,
                total_price: calculatedTotalPrice,
            },
        })

        revalidatePath("/admin/material-agregat")
        revalidatePath("/admin/retase")
        return { success: true }
    } catch (error: any) {
        if (error?.errors) {
            return { error: error.errors.map((e: any) => e.message).join(", ") }
        }
        return { error: error.message || "Gagal menyimpan data" }
    }
}

export async function updateAggregateIncoming(id: string, formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error("Unauthorized")

        if (["CEO", "FVP", "Approver"].includes(session.user.role || "")) {
            throw new Error("Akses Ditolak: Anda berada dalam mode pemantauan.")
        }

        const isCorp = isCorporateUser(session.user)
        const targetLocationId = (isCorp || session.user.role === "SuperAdminBP")
            ? (formData.get("locationId") as string)
            : session.user.locationId

        const rawData = {
            date: formData.get("date"),
            no_bon: formData.get("no_bon"),
            driver_name: formData.get("driver_name"),
            plate_number: formData.get("plate_number"),
            volume_cubic: formData.get("volume_cubic"),
            aggregate_type: formData.get("aggregate_type"),
            source_type: formData.get("source_type"),
            supplier: formData.get("supplier") || undefined,
            notes: formData.get("notes") || undefined,
            locationId: targetLocationId,
            vehicleId: formData.get("vehicleId") || undefined,
            driverId: formData.get("driverId") || undefined,
            dump_truck_size: formData.get("dump_truck_size") || undefined,
            distance_km: formData.get("distance_km") || undefined,
            rate_price: formData.get("rate_price") || undefined,
            retase_amount: formData.get("retase_amount") || undefined,
            unit_price: formData.get("unit_price") || undefined,
            total_price: formData.get("total_price") || undefined,
        }

        const data = aggregateSchema.parse(rawData)

        let resolvedDistance = data.distance_km ?? null
        let resolvedRate = data.rate_price ?? null
        let calculatedRetase = data.retase_amount ?? null

        if (data.source_type === "Internal") {
            const setting = await prisma.aggregateRetaseSetting.findUnique({
                where: { locationId: data.locationId }
            })

            if (setting) {
                // Determine rate strictly by branch setting according to dump_truck_size
                resolvedRate = data.dump_truck_size === "BESAR" 
                    ? setting.price_dt_besar 
                    : (data.dump_truck_size === "KECIL" ? setting.price_dt_kecil : (setting.price_dt_besar || 0))

                if (resolvedDistance == null || resolvedDistance <= 0) {
                    resolvedDistance = setting.default_distance_km
                }
            }

            if (resolvedRate != null && resolvedDistance != null) {
                // Formula: tarif x jarak x kubikasi riil
                calculatedRetase = Math.round(Number(data.volume_cubic) * Number(resolvedDistance) * Number(resolvedRate))
            }
        } else {
            resolvedDistance = null
            resolvedRate = null
            calculatedRetase = null
        }

        // Material Expenditure Pricing (Integrated with Master Material Price)
        let resolvedUnitPrice = data.unit_price ?? null
        if (resolvedUnitPrice == null || resolvedUnitPrice === 0) {
            const matCode = AGGREGATE_TYPE_TO_MATERIAL_CODE[data.aggregate_type]
            if (matCode) {
                resolvedUnitPrice = await getMaterialPriceAtDate(matCode, new Date(data.date), data.locationId)
            }
        }
        const calculatedTotalPrice = resolvedUnitPrice != null && resolvedUnitPrice > 0
            ? Math.round(Number(data.volume_cubic) * Number(resolvedUnitPrice))
            : (data.total_price ?? 0)

        await prisma.aggregateIncoming.update({
            where: { id },
            data: {
                date: new Date(data.date),
                no_bon: data.no_bon,
                driver_name: data.driver_name,
                plate_number: data.plate_number,
                volume_cubic: data.volume_cubic,
                aggregate_type: data.aggregate_type,
                source_type: data.source_type,
                supplier: data.supplier || null,
                notes: data.notes || null,
                locationId: data.locationId,
                vehicleId: data.vehicleId || null,
                driverId: data.driverId || null,
                dump_truck_size: data.dump_truck_size || null,
                distance_km: resolvedDistance,
                rate_price: resolvedRate,
                retase_amount: calculatedRetase,
                unit_price: resolvedUnitPrice,
                total_price: calculatedTotalPrice,
            },
        })

        revalidatePath("/admin/material-agregat")
        revalidatePath("/admin/retase")
        return { success: true }
    } catch (error: any) {
        if (error?.errors) {
            return { error: error.errors.map((e: any) => e.message).join(", ") }
        }
        return { error: error.message || "Gagal mengupdate data" }
    }
}

/**
 * Get effective unit price per m³ from MasterMaterial for a given aggregate type, date, and location.
 * Fully supports backdating logic (tgl 1 Sept berlaku rate baru, sebelum 1 Sept berlaku rate lama).
 */
export async function getEffectiveAggregatePrice(
    aggregateType: string,
    date: string,
    locationId?: string | null
) {
    try {
        const matCode = AGGREGATE_TYPE_TO_MATERIAL_CODE[aggregateType]
        if (!matCode) {
            return {
                unitPrice: 0,
                effectiveDate: null as string | null,
                materialCode: null as string | null,
                matchedLocationName: "Non-Agregat / Manual",
                notes: null as string | null,
                isHistorical: false
            }
        }

        const sim = await simulatePriceAtDate({
            materialCode: matCode,
            targetDate: date,
            locationId: locationId || undefined,
        })

        return {
            unitPrice: sim.matchedPrice,
            effectiveDate: sim.matchedEffectiveDate ? new Date(sim.matchedEffectiveDate).toISOString() : null,
            materialCode: matCode as string | null,
            matchedLocationName: sim.matchedLocationName,
            notes: sim.notes as string | null,
            isHistorical: true
        }
    } catch (err: any) {
        console.error("Error getEffectiveAggregatePrice:", err)
        return {
            unitPrice: 0,
            effectiveDate: null as string | null,
            materialCode: null as string | null,
            matchedLocationName: "Error",
            notes: null as string | null,
            isHistorical: false
        }
    }
}

export async function deleteAggregateIncoming(id: string) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error("Unauthorized")

        if (["CEO", "FVP", "Approver"].includes(session.user.role || "")) {
            return { error: "Akses Ditolak: Anda berada dalam mode pemantauan." }
        }

        await prisma.aggregateIncoming.delete({ where: { id } })
        revalidatePath("/admin/material-agregat")
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Gagal menghapus data" }
    }
}

// ─── AGGREGATE OUTGOING ACTIONS ───────────────────────────────────────────────

const aggregateOutSchema = z.object({
    id: z.string().optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Tanggal tidak valid" }),
    no_bon: z.string().optional().nullable(),
    aggregate_type: z.enum(["SplitHalfOne", "SplitTwoThree", "Pasir", "Semen", "Other"]),
    volume_cubic: z.coerce.number().min(0.001, "Volume / kuantitas harus lebih dari 0"),
    unit: z.string().default("m³"),
    unit_price: z.coerce.number().min(0).default(0),
    total_price: z.coerce.number().min(0).default(0),
    category: z.string().default("PENJUALAN"),
    recipient: z.string().optional().nullable(),
    transport_mode: z.enum(["INTERNAL_DT", "BUYER"]).default("BUYER"),
    vehicleId: z.string().optional().nullable(),
    driverId: z.string().optional().nullable(),
    dump_truck_size: z.string().optional().nullable(),
    distance_km: z.coerce.number().optional().nullable(),
    rate_price: z.coerce.number().optional().nullable(),
    retase_amount: z.coerce.number().optional().nullable(),
    is_retase_paid: z.coerce.boolean().default(false),
    plate_number: z.string().optional().nullable(),
    driver_name: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    locationId: z.string().min(1, "Cabang wajib dipilih"),
})

export async function createAggregateOutgoing(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error("Unauthorized")

        if (["CEO", "FVP", "Approver"].includes(session.user.role || "")) {
            throw new Error("Akses Ditolak: Anda berada dalam mode pemantauan.")
        }

        const isCorp = isCorporateUser(session.user)
        const targetLocationId = (isCorp || session.user.role === "SuperAdminBP")
            ? (formData.get("locationId") as string)
            : session.user.locationId

        const rawData = {
            date: formData.get("date") as string,
            no_bon: (formData.get("no_bon") as string) || null,
            aggregate_type: formData.get("aggregate_type") as string,
            volume_cubic: formData.get("volume_cubic"),
            unit: (formData.get("unit") as string) || "m³",
            unit_price: formData.get("unit_price") || 0,
            total_price: formData.get("total_price") || 0,
            category: formData.get("category") || "PENJUALAN",
            recipient: (formData.get("recipient") as string) || null,
            transport_mode: (formData.get("transport_mode") as string) || "BUYER",
            vehicleId: (formData.get("vehicleId") as string) || null,
            driverId: (formData.get("driverId") as string) || null,
            dump_truck_size: (formData.get("dump_truck_size") as string) || null,
            distance_km: formData.get("distance_km") || null,
            rate_price: formData.get("rate_price") || null,
            retase_amount: formData.get("retase_amount") || null,
            plate_number: (formData.get("plate_number") as string) || null,
            driver_name: (formData.get("driver_name") as string) || null,
            notes: (formData.get("notes") as string) || null,
            locationId: targetLocationId,
        }

        const parsed = aggregateOutSchema.parse(rawData)

        let resolvedDistance = parsed.distance_km ?? null
        let resolvedRate = parsed.rate_price ?? null
        let calculatedRetase = parsed.retase_amount ?? null
        let finalPlate = parsed.plate_number
        let finalDriver = parsed.driver_name

        if (parsed.transport_mode === "INTERNAL_DT") {
            const setting = await prisma.aggregateRetaseSetting.findUnique({
                where: { locationId: parsed.locationId }
            })

            if (setting) {
                resolvedRate = parsed.dump_truck_size === "BESAR" 
                    ? setting.price_dt_besar 
                    : (parsed.dump_truck_size === "KECIL" ? setting.price_dt_kecil : (setting.price_dt_besar || 0))

                if (resolvedDistance == null || resolvedDistance <= 0) {
                    resolvedDistance = setting.default_distance_km
                }
            }

            if (resolvedRate != null && resolvedDistance != null) {
                calculatedRetase = Math.round(Number(parsed.volume_cubic) * Number(resolvedDistance) * Number(resolvedRate))
            }

            if (parsed.vehicleId) {
                const veh = await prisma.vehicle.findUnique({ where: { id: parsed.vehicleId } })
                if (veh) finalPlate = veh.plate_number
            }
            if (parsed.driverId) {
                const drv = await prisma.employee.findUnique({ where: { id: parsed.driverId } })
                if (drv) finalDriver = drv.name
            }
        } else {
            resolvedDistance = null
            resolvedRate = null
            calculatedRetase = null
        }

        let resolvedUnitPrice = parsed.unit_price ?? 0
        if (resolvedUnitPrice === 0 && parsed.aggregate_type !== "Semen") {
            const matCode = AGGREGATE_TYPE_TO_MATERIAL_CODE[parsed.aggregate_type]
            if (matCode) {
                resolvedUnitPrice = (await getMaterialPriceAtDate(matCode, new Date(parsed.date), parsed.locationId)) ?? 0
            }
        }

        const calculatedTotalPrice = parsed.total_price && parsed.total_price > 0
            ? parsed.total_price
            : (resolvedUnitPrice > 0 ? Math.round(resolvedUnitPrice * parsed.volume_cubic) : 0)

        const newOut = await prisma.aggregateOutgoing.create({
            data: {
                date: new Date(parsed.date),
                no_bon: parsed.no_bon,
                aggregate_type: parsed.aggregate_type,
                volume_cubic: parsed.volume_cubic,
                unit: parsed.unit,
                unit_price: resolvedUnitPrice,
                total_price: calculatedTotalPrice,
                category: parsed.category,
                recipient: parsed.recipient,
                transport_mode: parsed.transport_mode,
                vehicleId: parsed.transport_mode === "INTERNAL_DT" ? parsed.vehicleId : null,
                driverId: parsed.transport_mode === "INTERNAL_DT" ? parsed.driverId : null,
                dump_truck_size: parsed.transport_mode === "INTERNAL_DT" ? parsed.dump_truck_size : null,
                distance_km: resolvedDistance,
                rate_price: resolvedRate,
                retase_amount: calculatedRetase,
                plate_number: finalPlate,
                driver_name: finalDriver,
                notes: parsed.notes,
                locationId: parsed.locationId,
                createdById: session.user.employeeId || null,
            },
            include: { location: true, vehicle: true, driver: true }
        })

        revalidatePath("/admin/material-agregat")
        revalidatePath("/admin/retase")
        return { success: true, data: newOut }
    } catch (error: any) {
        return { error: error.message || "Gagal menyimpan data pengeluaran material" }
    }
}

export async function updateAggregateOutgoing(id: string, formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error("Unauthorized")

        if (["CEO", "FVP", "Approver"].includes(session.user.role || "")) {
            throw new Error("Akses Ditolak: Anda berada dalam mode pemantauan.")
        }

        const isCorp = isCorporateUser(session.user)
        const targetLocationId = (isCorp || session.user.role === "SuperAdminBP")
            ? (formData.get("locationId") as string)
            : session.user.locationId

        const rawData = {
            date: formData.get("date") as string,
            no_bon: (formData.get("no_bon") as string) || null,
            aggregate_type: formData.get("aggregate_type") as string,
            volume_cubic: formData.get("volume_cubic"),
            unit: (formData.get("unit") as string) || "m³",
            unit_price: formData.get("unit_price") || 0,
            total_price: formData.get("total_price") || 0,
            category: formData.get("category") || "PENJUALAN",
            recipient: (formData.get("recipient") as string) || null,
            transport_mode: (formData.get("transport_mode") as string) || "BUYER",
            vehicleId: (formData.get("vehicleId") as string) || null,
            driverId: (formData.get("driverId") as string) || null,
            dump_truck_size: (formData.get("dump_truck_size") as string) || null,
            distance_km: formData.get("distance_km") || null,
            rate_price: formData.get("rate_price") || null,
            retase_amount: formData.get("retase_amount") || null,
            plate_number: (formData.get("plate_number") as string) || null,
            driver_name: (formData.get("driver_name") as string) || null,
            notes: (formData.get("notes") as string) || null,
            locationId: targetLocationId,
        }

        const parsed = aggregateOutSchema.parse(rawData)

        let resolvedDistance = parsed.distance_km ?? null
        let resolvedRate = parsed.rate_price ?? null
        let calculatedRetase = parsed.retase_amount ?? null
        let finalPlate = parsed.plate_number
        let finalDriver = parsed.driver_name

        if (parsed.transport_mode === "INTERNAL_DT") {
            const setting = await prisma.aggregateRetaseSetting.findUnique({
                where: { locationId: parsed.locationId }
            })

            if (setting) {
                resolvedRate = parsed.dump_truck_size === "BESAR" 
                    ? setting.price_dt_besar 
                    : (parsed.dump_truck_size === "KECIL" ? setting.price_dt_kecil : (setting.price_dt_besar || 0))

                if (resolvedDistance == null || resolvedDistance <= 0) {
                    resolvedDistance = setting.default_distance_km
                }
            }

            if (resolvedRate != null && resolvedDistance != null) {
                calculatedRetase = Math.round(Number(parsed.volume_cubic) * Number(resolvedDistance) * Number(resolvedRate))
            }

            if (parsed.vehicleId) {
                const veh = await prisma.vehicle.findUnique({ where: { id: parsed.vehicleId } })
                if (veh) finalPlate = veh.plate_number
            }
            if (parsed.driverId) {
                const drv = await prisma.employee.findUnique({ where: { id: parsed.driverId } })
                if (drv) finalDriver = drv.name
            }
        } else {
            resolvedDistance = null
            resolvedRate = null
            calculatedRetase = null
        }

        let resolvedUnitPrice = parsed.unit_price ?? 0
        if (resolvedUnitPrice === 0 && parsed.aggregate_type !== "Semen") {
            const matCode = AGGREGATE_TYPE_TO_MATERIAL_CODE[parsed.aggregate_type]
            if (matCode) {
                resolvedUnitPrice = (await getMaterialPriceAtDate(matCode, new Date(parsed.date), parsed.locationId)) ?? 0
            }
        }

        const calculatedTotalPrice = parsed.total_price && parsed.total_price > 0
            ? parsed.total_price
            : (resolvedUnitPrice > 0 ? Math.round(resolvedUnitPrice * parsed.volume_cubic) : 0)

        const updated = await prisma.aggregateOutgoing.update({
            where: { id },
            data: {
                date: new Date(parsed.date),
                no_bon: parsed.no_bon,
                aggregate_type: parsed.aggregate_type,
                volume_cubic: parsed.volume_cubic,
                unit: parsed.unit,
                unit_price: resolvedUnitPrice,
                total_price: calculatedTotalPrice,
                category: parsed.category,
                recipient: parsed.recipient,
                transport_mode: parsed.transport_mode,
                vehicleId: parsed.transport_mode === "INTERNAL_DT" ? parsed.vehicleId : null,
                driverId: parsed.transport_mode === "INTERNAL_DT" ? parsed.driverId : null,
                dump_truck_size: parsed.transport_mode === "INTERNAL_DT" ? parsed.dump_truck_size : null,
                distance_km: resolvedDistance,
                rate_price: resolvedRate,
                retase_amount: calculatedRetase,
                plate_number: finalPlate,
                driver_name: finalDriver,
                notes: parsed.notes,
                locationId: parsed.locationId,
            },
            include: { location: true, vehicle: true, driver: true }
        })

        revalidatePath("/admin/material-agregat")
        revalidatePath("/admin/retase")
        return { success: true, data: updated }
    } catch (error: any) {
        return { error: error.message || "Gagal memperbarui data" }
    }
}

export async function deleteAggregateOutgoing(id: string) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error("Unauthorized")

        if (["CEO", "FVP", "Approver"].includes(session.user.role || "")) {
            return { error: "Akses Ditolak: Anda berada dalam mode pemantauan." }
        }

        await prisma.aggregateOutgoing.delete({ where: { id } })
        revalidatePath("/admin/material-agregat")
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Gagal menghapus data" }
    }
}

// ─── AGGREGATE STOCK LEDGER ENGINE ───────────────────────────────────────────
// Maps AggregateType to concrete composition keys and their matching density field in ConcreteQuality
interface AggregateCompConfig {
    key: string
    densityKey: string
    defaultDensity: number
}

const AGGREGATE_COMPOSITION_MAP: Record<string, { label: string; compositions: AggregateCompConfig[] }> = {
    SplitHalfOne: {
        label: "Batu Split 1/2",
        compositions: [
            { key: "composition_stone_05", densityKey: "density_stone_05", defaultDensity: 1400 },
            { key: "composition_stone_12", densityKey: "density_stone_12", defaultDensity: 1450 },
        ],
    },
    SplitTwoThree: {
        label: "Batu Split 2/3",
        compositions: [
            { key: "composition_stone_23", densityKey: "density_stone_23", defaultDensity: 1450 },
        ],
    },
    Pasir: {
        label: "Pasir Cor",
        compositions: [
            { key: "composition_sand", densityKey: "density_sand", defaultDensity: 1400 },
        ],
    },
    Semen: {
        label: "Semen (Zak / Curah)",
        compositions: [
            { key: "composition_cement", densityKey: "density_cement", defaultDensity: 1400 },
        ],
    },
    Other: { label: "Lainnya", compositions: [] },
}

export async function getAggregateStockLedger(aggregateType: string, locationId?: string) {
    const session = await auth()
    if (!session?.user) return []

    const isCorp = isCorporateUser(session.user)
    const locFilter = isCorp
        ? (locationId && locationId !== "all" ? locationId : undefined)
        : session.user.locationId

    const locWhere = locFilter ? { locationId: locFilter } : {}

    // 1. Fetch INCOMING
    const incomings = await prisma.aggregateIncoming.findMany({
        where: { aggregate_type: aggregateType as any, ...locWhere },
        include: { location: true },
        orderBy: { date: "asc" },
    })

    // 2. Fetch OUTGOING from Confirmed production transactions
    const production = await prisma.productionTransaction.findMany({
        where: { status: "Confirmed", ...locWhere },
        include: { concreteQuality: true, location: true, project: { include: { customer: true } } },
        orderBy: { date: "asc" },
    })

    // 3. Fetch OUTGOING manual from AggregateOutgoing
    const outgoings = await prisma.aggregateOutgoing.findMany({
        where: { aggregate_type: aggregateType as any, ...locWhere },
        include: { location: true },
        orderBy: { date: "asc" },
    })

    const compConfigs = AGGREGATE_COMPOSITION_MAP[aggregateType]?.compositions ?? []
    const timeline: any[] = []

    // Map Incomings
    incomings.forEach((inc) => {
        timeline.push({
            id: "in_" + inc.id,
            timestamp: inc.date.getTime(),
            dateObj: inc.date,
            type: "IN",
            category: inc.source_type === "Internal" ? "QUARRY_INTERNAL" : "VENDOR_EKSTERNAL",
            description: `${AGGREGATE_COMPOSITION_MAP[aggregateType]?.label || aggregateType} Masuk`,
            reference: `No Bon: ${inc.no_bon} | ${inc.driver_name} (${inc.plate_number}) | ${inc.source_type === "Internal" ? "🏔️ Internal/Quarry" : "🛒 Eksternal"}`,
            weight_kg: null,
            detail_conversion: null,
            qty_in: inc.volume_cubic,
            qty_out: 0,
            locationName: inc.location.name,
        })
    })

    // Map Production Usage (Convert KG to M3 using Berat Jenis in ConcreteQuality)
    production.forEach((prod) => {
        let totalOutM3 = 0
        let totalWeightKg = 0
        const details: string[] = []

        compConfigs.forEach((comp) => {
            const weightPerM3Beton = Number((prod.concreteQuality as any)?.[comp.key] || 0)
            if (weightPerM3Beton > 0) {
                let density = Number((prod.concreteQuality as any)?.[comp.densityKey] || comp.defaultDensity)
                if (density < 10) density = density * 1000 // Handle if entered as ton/m³ (e.g. 1.4 -> 1400)

                const batchWeightKg = prod.volume_cubic * weightPerM3Beton
                const batchM3 = density > 0 ? (batchWeightKg / density) : 0

                totalWeightKg += batchWeightKg
                totalOutM3 += batchM3
                details.push(`${Math.round(batchWeightKg).toLocaleString("id-ID")} kg @ BJ ${density}`)
            }
        })

        if (totalOutM3 > 0) {
            timeline.push({
                id: "out_prod_" + prod.id,
                timestamp: prod.date.getTime(),
                dateObj: prod.date,
                type: "OUT",
                category: "PRODUKSI",
                description: `Produksi Mutu ${prod.concreteQuality.name} (${prod.volume_cubic} m³ beton)`,
                reference: `Proyek: ${prod.project?.name || ""} - ${prod.project?.customer?.customer_name || ""}`,
                weight_kg: totalWeightKg,
                detail_conversion: details.join(" + "),
                qty_in: 0,
                qty_out: Number(totalOutM3.toFixed(3)),
                locationName: prod.location.name,
            })
        }
    })

    // Map Manual Outgoings (Penjualan / Transfer / Koreksi / Internal Proyek)
    const categoryLabels: Record<string, string> = {
        PENJUALAN: "Penjualan Bebas",
        INTERNAL_PROYEK: "Internal Non-BP (Proyek)",
        TRANSFER: "Transfer Antar Plant",
        KOREKSI_SUSUT: "Koreksi / Opname Susut",
        INTERNAL_PLANT: "Pemakaian Internal Plant",
        INTERNAL: "Pemakaian Internal Plant",
        LAINNYA: "Pengeluaran Lainnya",
    }

    outgoings.forEach((out) => {
        const parts: string[] = []
        if (out.no_bon) parts.push(`No Bon: ${out.no_bon}`)
        if (out.recipient) parts.push(`Tujuan: ${out.recipient}`)
        if (out.total_price && out.total_price > 0) parts.push(`Nilai: Rp ${out.total_price.toLocaleString("id-ID")}`)
        if (out.transport_mode === "INTERNAL_DT") {
            parts.push(`DT Internal: ${out.plate_number || ""} (${out.driver_name || ""})`)
            if (out.retase_amount) parts.push(`Retase: Rp ${out.retase_amount.toLocaleString("id-ID")}`)
        } else if (out.plate_number || out.driver_name) {
            parts.push(`Angkutan Pembeli: ${out.plate_number || ""} ${out.driver_name ? `(${out.driver_name})` : ""}`)
        }
        if (out.notes) parts.push(`Ket: ${out.notes}`)

        timeline.push({
            id: "out_manual_" + out.id,
            timestamp: out.date.getTime(),
            dateObj: out.date,
            type: "OUT",
            category: out.category,
            description: `${AGGREGATE_COMPOSITION_MAP[aggregateType]?.label || aggregateType} Keluar (${categoryLabels[out.category] || out.category})`,
            reference: parts.join(" | "),
            weight_kg: null,
            detail_conversion: out.unit && out.unit !== "m³" ? `Satuan: ${out.unit}` : "Input Manual",
            qty_in: 0,
            qty_out: out.volume_cubic,
            locationName: out.location.name,
        })
    })

    // 4. Sort chronologically (oldest first) to compute running balance
    timeline.sort((a, b) => a.timestamp - b.timestamp)

    let runningBalance = 0
    const ledger = timeline.map((item) => {
        runningBalance = runningBalance + item.qty_in - item.qty_out
        return {
            ...item,
            formattedDate: item.dateObj.toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
            balance: Number(runningBalance.toFixed(3)),
        }
    })

    return ledger.reverse()
}

export async function getLocations() {
    return await prisma.location.findMany({ orderBy: { name: "asc" } })
}

const updateAggregateSettingSchema = z.object({
    locationId: z.string().min(1, "Cabang wajib diisi"),
    price_dt_besar: z.coerce.number().min(0, "Tarif DT Besar tidak boleh negatif"),
    price_dt_kecil: z.coerce.number().min(0, "Tarif DT Kecil tidak boleh negatif"),
    default_distance_km: z.coerce.number().min(0, "Jarak default tidak boleh negatif"),
})

export async function saveAggregateRetaseSetting(formData: FormData) {
    const session = await auth()
    if (!session?.user) return { error: "Unauthorized" }

    const role = session.user.role || ""
    if (!["SuperAdminBP", "AdminBP"].includes(role)) {
        return { error: "Akses ditolak: Anda tidak memiliki izin untuk mengubah tarif retase." }
    }

    try {
        const parsed = updateAggregateSettingSchema.parse(Object.fromEntries(formData.entries()))
        const isSuperAdmin = role === "SuperAdminBP"

        if (!isSuperAdmin && session.user.locationId !== parsed.locationId) {
            return { error: "Permission Denied: Tidak dapat mengubah setting cabang lain." }
        }

        await prisma.aggregateRetaseSetting.upsert({
            where: { locationId: parsed.locationId },
            update: {
                price_dt_besar: parsed.price_dt_besar,
                price_dt_kecil: parsed.price_dt_kecil,
                default_distance_km: parsed.default_distance_km,
            },
            create: {
                locationId: parsed.locationId,
                price_dt_besar: parsed.price_dt_besar,
                price_dt_kecil: parsed.price_dt_kecil,
                default_distance_km: parsed.default_distance_km,
            }
        })

        // Auto-sync to MasterIncentiveRate agar data master selalu up to date
        if ((prisma as any).masterIncentiveRate) {
            const loc = await prisma.location.findUnique({ where: { id: parsed.locationId } })
            const locName = loc?.name || 'Cabang'
            const existingDt = await (prisma as any).masterIncentiveRate.findFirst({
                where: { kategori_peran: "SOPIR_DT", locationId: parsed.locationId }
            })

            if (existingDt) {
                await (prisma as any).masterIncentiveRate.update({
                    where: { id: existingDt.id },
                    data: {
                        tarif_utama: parsed.price_dt_besar,
                        tarif_sekunder: parsed.price_dt_kecil,
                        isActive: true,
                    }
                })
            } else {
                await (prisma as any).masterIncentiveRate.create({
                    data: {
                        nama_insentif: `Retase Sopir Dump Truck (${locName})`,
                        kategori_peran: "SOPIR_DT",
                        formula_type: "DT_TIERED",
                        tarif_utama: parsed.price_dt_besar,
                        tarif_sekunder: parsed.price_dt_kecil,
                        locationId: parsed.locationId,
                        effective_date: new Date(),
                        keterangan: `Sinkronisasi otomatis dari setting Dump Truck cabang ${locName} (Jarak: ${parsed.default_distance_km} km)`,
                        isActive: true,
                    }
                })
            }
        }

        revalidatePath("/admin/material-agregat")
        revalidatePath("/admin/reports/retase")
        revalidatePath("/admin/master-insentif")
        return { success: true, message: "Pengaturan tarif retase Dump Truck berhasil disimpan." }
    } catch (e: any) {
        console.error(e)
        return { error: e.message || "Gagal menyimpan tarif retase Dump Truck" }
    }
}
