"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const incomingSchema = z.object({
    id: z.string().optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Tanggal tidak valid" }),
    name: z.string().min(1, "Nama Semen wajib diisi"),
    supplier: z.string().min(1, "Distributor wajib diisi"),
    tonnage: z.coerce.number().min(1, "Berat (KG) harus lebih dari 0"),
    delivery_note: z.string().min(1, "No Bon/Order wajib diisi"),
    locationId: z.string().min(1, "Cabang wajib diisi")
})

export async function getIncomingMaterials() {
    const session = await auth()
    if (!session?.user) return []

    const filter: any = {}
    if (session.user.role === "AdminBP") {
        filter.locationId = session.user.locationId
    }

    return await prisma.materialIncoming.findMany({
        where: {
            ...filter,
            material_type: "Semen"
        },
        include: { location: true },
        orderBy: { date: 'desc' }
    })
}

export async function createIncomingMaterial(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error("Unauthorized")

        const rawData = {
            date: formData.get("date"),
            name: formData.get("name"),
            supplier: formData.get("supplier"),
            tonnage: formData.get("tonnage"),
            delivery_note: formData.get("delivery_note"),
            locationId: session.user.role === "SuperAdminBP" ? formData.get("locationId") : session.user.locationId
        }

        const data = incomingSchema.parse(rawData)

        await prisma.materialIncoming.create({
            data: {
                date: new Date(data.date),
                material_type: "Semen",
                name: data.name,
                supplier: data.supplier,
                tonnage: data.tonnage,
                delivery_note: data.delivery_note,
                locationId: data.locationId
            }
        })

        revalidatePath("/admin/material-in")
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Gagal menyimpan data Semen Masuk" }
    }
}

export async function updateIncomingMaterial(id: string, formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error("Unauthorized")

        const rawData = {
            date: formData.get("date"),
            name: formData.get("name"),
            supplier: formData.get("supplier"),
            tonnage: formData.get("tonnage"),
            delivery_note: formData.get("delivery_note"),
            locationId: session.user.role === "SuperAdminBP" ? formData.get("locationId") : session.user.locationId
        }

        const data = incomingSchema.parse(rawData)

        await prisma.materialIncoming.update({
            where: { id },
            data: {
                date: new Date(data.date),
                name: data.name,
                supplier: data.supplier,
                tonnage: data.tonnage,
                delivery_note: data.delivery_note,
                locationId: data.locationId
            }
        })

        revalidatePath("/admin/material-in")
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Gagal mengupdate data Semen Masuk" }
    }
}

export async function deleteIncomingMaterial(id: string) {
    try {
        await prisma.materialIncoming.delete({ where: { id } })
        revalidatePath("/admin/material-in")
        return { success: true }
    } catch (error: any) {
        return { error: "Gagal menghapus data" }
    }
}

// THE STOCK LEDGER ENGINE
export async function getStockLedger(locationId?: string) {
    const session = await auth()
    if (!session?.user) return []

    const locFilter = session.user.role === "AdminBP" ? session.user.locationId : locationId

    // 1. Fetch INCOMING (Semen Masuk)
    const incomings = await prisma.materialIncoming.findMany({
        where: {
            material_type: "Semen",
            ...(locFilter !== "all" && locFilter ? { locationId: locFilter } : {})
        },
        include: { location: true }
    })

    // 2. Fetch OUTGOING (Production Transactions - Confirmed Only)
    const production = await prisma.productionTransaction.findMany({
        where: {
            status: "Confirmed",
            ...(locFilter !== "all" && locFilter ? { locationId: locFilter } : {})
        },
        include: {
            concreteQuality: true,
            location: true,
            project: { include: { customer: true } }
        }
    })

    // 3. Format into a unified Timeline Array
    const timeline: any[] = []

    incomings.forEach(inc => {
        timeline.push({
            id: inc.id,
            timestamp: inc.date.getTime(),
            dateObj: inc.date,
            type: "IN",
            description: `Semen Masuk: ${inc.name} (${inc.supplier})`,
            reference: `DO: ${inc.delivery_note}`,
            qty_in: inc.tonnage,
            qty_out: 0,
            locationName: inc.location.name
        })
    })

    production.forEach(prod => {
        const outKg = prod.volume_cubic * prod.concreteQuality.composition_cement
        if (outKg > 0) {
            timeline.push({
                id: prod.id,
                timestamp: prod.date.getTime(),
                dateObj: prod.date,
                type: "OUT",
                description: `Produksi Mutu ${prod.concreteQuality.name} (${prod.volume_cubic} m³)`,
                reference: `Proyek: ${prod.project?.name || ''} - ${prod.project?.customer?.customer_name || ''}`,
                qty_in: 0,
                qty_out: outKg,
                locationName: prod.location.name
            })
        }
    })

    // 4. Sort Chronologically (Oldest to Newest) to calculate running balance
    timeline.sort((a, b) => a.timestamp - b.timestamp)

    let runningBalance = 0
    const ledger = timeline.map(item => {
        runningBalance = runningBalance + item.qty_in - item.qty_out
        return {
            ...item,
            formattedDate: item.dateObj.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            balance: runningBalance
        }
    })

    // Return descending so newest is at the top of the table
    return ledger.reverse()
}
