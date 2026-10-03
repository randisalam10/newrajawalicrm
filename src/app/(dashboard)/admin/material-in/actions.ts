"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { isCorporateUser, getLocationFilter } from "@/lib/rbac"

const incomingSchema = z.object({
    id: z.string().optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Tanggal tidak valid" }),
    name: z.string().min(1, "Nama Semen wajib diisi"),
    supplier: z.string().min(1, "Distributor wajib diisi"),
    tonnage: z.coerce.number().min(1, "Berat (KG) harus lebih dari 0"),
    delivery_note: z.string().min(1, "No Bon/Order wajib diisi"),
    locationId: z.string().min(1, "Cabang wajib diisi"),
    unit_price: z.coerce.number().min(0).optional().default(0),
    total_price: z.coerce.number().min(0).optional().default(0),
    purchase_unit: z.string().optional().default("KG"),
    purchase_qty: z.coerce.number().min(0).optional().nullable(),
    purchaseOrderId: z.string().optional().nullable(),
    poItemId: z.string().optional().nullable(),
})

export async function getIncomingMaterials(limit: number = 250) {
    const session = await auth()
    if (!session?.user) return []

    const filter = getLocationFilter(session.user)

    return await prisma.materialIncoming.findMany({
        where: {
            ...filter,
            material_type: "Semen"
        },
        include: {
            location: true,
            purchaseOrder: {
                select: {
                    id: true,
                    po_number: true,
                    status: true,
                    tanggal_terbit: true,
                    companyGroup: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            },
            poItem: {
                select: {
                    id: true,
                    harga_satuan: true,
                    quantity: true,
                    masterItem: { select: { name: true, satuan: true } }
                }
            }
        },
        take: limit,
        orderBy: { date: 'desc' }
    })
}

export async function createIncomingMaterial(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error("Unauthorized")

        if (["CEO", "FVP", "Approver"].includes(session.user.role || "")) {
            throw new Error("Akses Ditolak: Anda berada dalam mode pemantauan.")
        }

        const isCorp = isCorporateUser(session.user)
        let targetLocationId = (isCorp || session.user.role === "SuperAdminBP")
            ? (formData.get("locationId") as string)
            : session.user.locationId

        let purchaseOrderId = (formData.get("purchaseOrderId") as string) || null
        let poItemId = (formData.get("poItemId") as string) || null

        // PROTEKSI CABANG & ENFORCE PO: Pastikan lokasi selalu terkunci ke cabang PO asli
        if (purchaseOrderId) {
            const linkedPo = await prisma.purchaseOrder.findUnique({
                where: { id: purchaseOrderId },
                select: { id: true, locationId: true, items: { select: { id: true } } }
            })
            if (linkedPo) {
                targetLocationId = linkedPo.locationId
                if (!poItemId && linkedPo.items.length === 1) {
                    poItemId = linkedPo.items[0].id
                }
            }
        }

        const rawData = {
            date: formData.get("date"),
            name: formData.get("name"),
            supplier: formData.get("supplier"),
            tonnage: formData.get("tonnage"),
            delivery_note: formData.get("delivery_note"),
            locationId: targetLocationId,
            unit_price: formData.get("unit_price") || 0,
            total_price: formData.get("total_price") || 0,
            purchase_unit: formData.get("purchase_unit") || "KG",
            purchase_qty: formData.get("purchase_qty") || null,
            purchaseOrderId: purchaseOrderId,
            poItemId: poItemId,
        }

        const data = incomingSchema.parse(rawData)

        await prisma.$transaction(async (tx) => {
            await tx.materialIncoming.create({
                data: {
                    date: new Date(data.date),
                    material_type: "Semen",
                    name: data.name,
                    supplier: data.supplier,
                    tonnage: data.tonnage,
                    delivery_note: data.delivery_note,
                    locationId: data.locationId,
                    unit_price: data.unit_price,
                    total_price: data.total_price,
                    purchase_unit: data.purchase_unit,
                    purchase_qty: data.purchase_qty,
                    purchaseOrderId: data.purchaseOrderId || null,
                    poItemId: data.poItemId || null,
                }
            })
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

        if (["CEO", "FVP", "Approver"].includes(session.user.role || "")) {
            throw new Error("Akses Ditolak: Anda berada dalam mode pemantauan.")
        }

        const isCorp = isCorporateUser(session.user)
        let targetLocationId = (isCorp || session.user.role === "SuperAdminBP")
            ? (formData.get("locationId") as string)
            : session.user.locationId

        let purchaseOrderId = (formData.get("purchaseOrderId") as string) || null
        let poItemId = (formData.get("poItemId") as string) || null

        // PROTEKSI CABANG & ENFORCE PO: Pastikan lokasi selalu terkunci ke cabang PO asli
        if (purchaseOrderId) {
            const linkedPo = await prisma.purchaseOrder.findUnique({
                where: { id: purchaseOrderId },
                select: { id: true, locationId: true, items: { select: { id: true } } }
            })
            if (linkedPo) {
                targetLocationId = linkedPo.locationId
                if (!poItemId && linkedPo.items.length === 1) {
                    poItemId = linkedPo.items[0].id
                }
            }
        }

        const rawData = {
            date: formData.get("date"),
            name: formData.get("name"),
            supplier: formData.get("supplier"),
            tonnage: formData.get("tonnage"),
            delivery_note: formData.get("delivery_note"),
            locationId: targetLocationId,
            unit_price: formData.get("unit_price") || 0,
            total_price: formData.get("total_price") || 0,
            purchase_unit: formData.get("purchase_unit") || "KG",
            purchase_qty: formData.get("purchase_qty") || null,
            purchaseOrderId: purchaseOrderId,
            poItemId: poItemId,
        }

        const data = incomingSchema.parse(rawData)

        await prisma.$transaction(async (tx) => {
            await tx.materialIncoming.update({
                where: { id },
                data: {
                    date: new Date(data.date),
                    name: data.name,
                    supplier: data.supplier,
                    tonnage: data.tonnage,
                    delivery_note: data.delivery_note,
                    locationId: data.locationId,
                    unit_price: data.unit_price,
                    total_price: data.total_price,
                    purchase_unit: data.purchase_unit,
                    purchase_qty: data.purchase_qty,
                    purchaseOrderId: data.purchaseOrderId || null,
                    poItemId: data.poItemId || null,
                }
            })
        })

        revalidatePath("/admin/material-in")
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Gagal mengupdate data Semen Masuk" }
    }
}

export async function deleteIncomingMaterial(id: string) {
    try {
        const session = await auth()
        if (!session?.user) throw new Error("Unauthorized")

        if (["CEO", "FVP", "Approver"].includes(session.user.role || "")) {
            return { error: "Akses Ditolak: Anda berada dalam mode pemantauan." }
        }

        await prisma.materialIncoming.delete({ where: { id } })
        revalidatePath("/admin/material-in")
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Gagal menghapus data" }
    }
}

// Fetch approved BP cement purchase orders ready to be received
export async function getApprovedBpCementPOs(targetLocationId?: string) {
    const session = await auth()
    if (!session?.user) return []

    const isCorp = isCorporateUser(session.user)
    const locId = (!isCorp && session.user.locationId)
        ? session.user.locationId
        : (targetLocationId && targetLocationId !== "all" ? targetLocationId : undefined)

    const where: any = {
        status: "APPROVED",
        is_for_bp: true,
        ...(locId ? { locationId: locId } : {}),
    }

    const pos = await prisma.purchaseOrder.findMany({
        where,
        include: {
            companyGroup: true,
            category: true,
            location: true,
            materialIncomings: {
                select: {
                    id: true,
                    tonnage: true,
                    purchase_qty: true,
                    poItemId: true,
                }
            },
            items: {
                include: {
                    masterItem: {
                        include: { supplier: true }
                    },
                    materialIncomings: {
                        select: {
                            id: true,
                            tonnage: true,
                            purchase_qty: true,
                        }
                    }
                }
            }
        },
        orderBy: { tanggal_terbit: 'desc' },
        take: 50,
    })

    const cementFiltered = pos.filter(po => {
        const catName = (po.category?.name || "").toLowerCase()
        const catCode = (po.category?.kode_kategori || "").toLowerCase()
        const isSemenCategory = catName.includes("semen") || catCode === "smn"
        const hasCementItem = po.items.some(i => (i.masterItem?.name || "").toLowerCase().includes("semen"))
        return isSemenCategory || hasCementItem
    })

    return cementFiltered.map(po => {
        const supplierName = po.items[0]?.masterItem?.supplier?.name || "Distributor"
        const unfulfilledItems = po.items.map(i => {
            const itemIncomings = i.materialIncomings || []
            const poIncomings = (po.materialIncomings || []).filter(inc => 
                inc.poItemId === i.id || (!inc.poItemId && po.items.length === 1)
            )

            const allMap = new Map<string, any>()
            itemIncomings.forEach(inc => allMap.set(inc.id, inc))
            poIncomings.forEach(inc => allMap.set(inc.id, inc))
            const uniqueIncomings = Array.from(allMap.values())

            const totalReceivedKg = uniqueIncomings.reduce((sum, inc) => sum + (inc.tonnage || 0), 0)
            const totalReceivedQty = uniqueIncomings.reduce((sum, inc) => sum + (inc.purchase_qty || 0), 0)
            const remainingQty = Math.max(0, i.quantity - totalReceivedQty)

            return {
                id: i.id,
                masterItemId: i.masterItemId,
                itemName: i.masterItem?.name || "Semen",
                satuan: i.masterItem?.satuan || "zak",
                quantity: i.quantity,
                harga_satuan: i.harga_satuan,
                subtotal: i.subtotal,
                supplierName: i.masterItem?.supplier?.name || supplierName,
                totalReceivedKg,
                totalReceivedQty,
                remainingQty,
            }
        }).filter(i => i.remainingQty > 0)

        return {
            id: po.id,
            po_number: po.po_number,
            tanggal_terbit: po.tanggal_terbit.toISOString().split('T')[0],
            companyName: po.companyGroup?.name || "-",
            supplierName,
            locationId: po.locationId,
            locationName: po.location?.name || "-",
            items: unfulfilledItems,
        }
    }).filter(po => po.items.length > 0)
}

// THE STOCK LEDGER ENGINE
export async function getStockLedger(locationId?: string) {
    const session = await auth()
    if (!session?.user) return []

    const isCorp = isCorporateUser(session.user)
    const locFilter = isCorp
        ? (locationId && locationId !== "all" ? locationId : undefined)
        : session.user.locationId

    const locWhere = locFilter ? { locationId: locFilter } : {}

    // 1. Fetch INCOMING (Semen Masuk)
    const incomings = await prisma.materialIncoming.findMany({
        where: {
            material_type: "Semen",
            ...locWhere
        },
        include: { location: true }
    })

    // 2. Fetch OUTGOING (Production Transactions - Confirmed Only)
    const production = await prisma.productionTransaction.findMany({
        where: {
            status: "Confirmed",
            ...locWhere
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
