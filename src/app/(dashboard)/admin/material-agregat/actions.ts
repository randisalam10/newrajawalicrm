"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const aggregateSchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Tanggal tidak valid" }),
    no_bon: z.string().min(1, "No Bon wajib diisi"),
    driver_name: z.string().min(1, "Nama Sopir wajib diisi"),
    plate_number: z.string().min(1, "Plat Kendaraan wajib diisi"),
    volume_cubic: z.coerce.number().min(0.01, "Volume harus lebih dari 0"),
    aggregate_type: z.enum(["SplitHalfOne", "SplitTwoThree", "Pasir", "Other"]),
    source_type: z.enum(["Internal", "External"]),
    supplier: z.string().optional(),
    notes: z.string().optional(),
    locationId: z.string().min(1, "Cabang wajib diisi"),
})

export async function getAggregateIncomings() {
    const session = await auth()
    if (!session?.user) return []

    const filter: any = {}
    if (session.user.role === "AdminBP") {
        filter.locationId = session.user.locationId
    }

    return await prisma.aggregateIncoming.findMany({
        where: filter,
        include: { location: true },
        orderBy: { date: "desc" },
    })
}

export async function createAggregateIncoming(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error("Unauthorized")

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
            locationId:
                session.user.role === "SuperAdminBP"
                    ? formData.get("locationId")
                    : session.user.locationId,
        }

        const data = aggregateSchema.parse(rawData)

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
            },
        })

        revalidatePath("/admin/material-agregat")
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
            locationId:
                session.user.role === "SuperAdminBP"
                    ? formData.get("locationId")
                    : session.user.locationId,
        }

        const data = aggregateSchema.parse(rawData)

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
            },
        })

        revalidatePath("/admin/material-agregat")
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
        await prisma.aggregateIncoming.delete({ where: { id } })
        revalidatePath("/admin/material-agregat")
        return { success: true }
    } catch (error: any) {
        return { error: "Gagal menghapus data" }
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

    const locFilter =
        session.user.role === "AdminBP" ? session.user.locationId : locationId

    const locWhere = locFilter && locFilter !== "all" ? { locationId: locFilter } : {}

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
