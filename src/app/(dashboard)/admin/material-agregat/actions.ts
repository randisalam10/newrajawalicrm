"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { isCorporateUser, getLocationFilter } from "@/lib/rbac"

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

// ─── AGGREGATE STOCK LEDGER ENGINE ───────────────────────────────────────────
// Maps AggregateType to ConcreteQuality composition field and display label
const AGGREGATE_MAP: Record<string, { label: string; compositionKeys: string[] }> = {
    SplitHalfOne: { label: "Batu Split 1/2", compositionKeys: ["composition_stone_05", "composition_stone_12"] },
    SplitTwoThree: { label: "Batu Split 2/3", compositionKeys: ["composition_stone_23"] },
    Pasir: { label: "Pasir", compositionKeys: ["composition_sand"] },
    Other: { label: "Lainnya", compositionKeys: [] },
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

    const compositionKeys = AGGREGATE_MAP[aggregateType]?.compositionKeys ?? []

    const timeline: any[] = []

    incomings.forEach((inc) => {
        timeline.push({
            id: "in_" + inc.id,
            timestamp: inc.date.getTime(),
            dateObj: inc.date,
            type: "IN",
            description: `${AGGREGATE_MAP[aggregateType]?.label || aggregateType} Masuk`,
            reference: `No Bon: ${inc.no_bon} | ${inc.driver_name} (${inc.plate_number}) | ${inc.source_type === "Internal" ? "🏔️ Internal/Quarry" : "🛒 Eksternal"}`,
            qty_in: inc.volume_cubic,
            qty_out: 0,
            locationName: inc.location.name,
        })
    })

    production.forEach((prod) => {
        const qty: number = compositionKeys.reduce((sum, key) => {
            return sum + (prod.volume_cubic * ((prod.concreteQuality as any)[key] || 0))
        }, 0)
        if (qty > 0) {
            timeline.push({
                id: "out_" + prod.id,
                timestamp: prod.date.getTime(),
                dateObj: prod.date,
                type: "OUT",
                description: `Produksi Mutu ${prod.concreteQuality.name} (${prod.volume_cubic} m³)`,
                reference: `Proyek: ${prod.project?.name || ""} - ${prod.project?.customer?.customer_name || ""}`,
                qty_in: 0,
                qty_out: qty,
                locationName: prod.location.name,
            })
        }
    })

    // 3. Sort chronologically (oldest first) to compute running balance
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
            balance: runningBalance,
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

        revalidatePath("/admin/material-agregat")
        revalidatePath("/admin/reports/retase")
        return { success: true, message: "Pengaturan tarif retase Dump Truck berhasil disimpan." }
    } catch (e: any) {
        console.error(e)
        return { error: e.message || "Gagal menyimpan tarif retase Dump Truck" }
    }
}
