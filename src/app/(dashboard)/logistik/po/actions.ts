"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { PoPaymentMethod } from "@prisma/client"

const poItemSchema = z.object({
    masterItemId: z.string(),
    quantity: z.coerce.number().min(0.01),
    harga_satuan: z.coerce.number().min(0),
    keterangan: z.string().optional(),
    subtotal: z.coerce.number().min(0),
})

const poSchema = z.object({
    companyGroupId: z.string().min(1, "Perusahaan wajib dipilih"),
    companyProjectId: z.string().optional(),
    categoryId: z.string().min(1, "Kategori wajib dipilih"),
    supplierId: z.string().min(1, "Supplier wajib dipilih"),
    pimpinan: z.string().min(1, "Pimpinan wajib diisi"),
    kepala_peralatan: z.string().min(1, "Kepala Peralatan wajib diisi"),
    jabatan_kepala: z.string().optional(),
    metode_pembayaran: z.nativeEnum(PoPaymentMethod).default("CREDIT"),
    km_hm_kendaraan: z.string().optional(),
    tanggal_terbit: z.string().transform(v => new Date(v)),
    locationId: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(poItemSchema).min(1, "Minimal 1 item barang"),
})

async function generatePoNumber(companyGroupId: string, categoryId: string): Promise<string> {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = String(now.getFullYear())

    const [company, category] = await Promise.all([
        prisma.poCompanyGroup.findUnique({ where: { id: companyGroupId } }),
        prisma.poCategory.findUnique({ where: { id: categoryId } })
    ])

    const kodePerusahaan = company?.kode_cabang ?? 'XX'
    const kodeKategori = category?.kode_kategori ?? 'XX'

    // Count existing POs this month for this company+category
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const count = await prisma.purchaseOrder.count({
        where: {
            companyGroupId,
            categoryId,
            tanggal_terbit: { gte: startOfMonth }
        }
    })

    const seq = String(count + 1).padStart(3, '0')
    return `${seq}/${kodePerusahaan}/${kodeKategori}/${month}/${year}`
}

export async function getPurchaseOrders() {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    return await prisma.purchaseOrder.findMany({
        include: {
            companyGroup: true,
            category: true,
            items: { include: { masterItem: { include: { supplier: true } } } },
            location: true,
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function createPurchaseOrder(data: {
    companyGroupId: string
    companyProjectId?: string
    categoryId: string
    supplierId: string
    pimpinan: string
    kepala_peralatan: string
    jabatan_kepala?: string
    metode_pembayaran: PoPaymentMethod
    km_hm_kendaraan?: string
    tanggal_terbit: Date
    locationId?: string
    notes?: string
    items: { masterItemId: string; quantity: number; harga_satuan: number; keterangan?: string; subtotal: number }[]
    pembuat_admin: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        const po_number = await generatePoNumber(data.companyGroupId, data.categoryId)

        const { items, jabatan_kepala, ...poData } = data

        const created = await prisma.purchaseOrder.create({
            data: {
                ...poData,
                po_number,
                companyProjectId: poData.companyProjectId || null,
                locationId: poData.locationId || null,
                items: {
                    create: items.map(item => ({
                        masterItemId: item.masterItemId,
                        quantity: item.quantity,
                        harga_satuan: item.harga_satuan,
                        keterangan: item.keterangan,
                        subtotal: item.subtotal,
                    }))
                }
            }
        })

        // Simpan jabatan_kepala via raw SQL karena Prisma client belum di-regenerate
        if (jabatan_kepala) {
            await prisma.$executeRaw`UPDATE "PurchaseOrder" SET "jabatan_kepala" = ${jabatan_kepala} WHERE id = ${created.id}`
        }

        revalidatePath("/logistik/po")
        revalidatePath("/logistik/po/create")
        return { success: true, po_number }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updatePoStatus(id: string, status: "APPROVED" | "CANCELLED") {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        await prisma.purchaseOrder.update({ where: { id }, data: { status } })
        revalidatePath("/logistik/po")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deletePurchaseOrder(id: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        await prisma.purchaseOrder.delete({ where: { id } })
        revalidatePath("/logistik/po")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus PO." }
    }
}

// For PO Create form: load master data
export async function getPoFormData() {
    const [companies, categories, suppliers, items] = await Promise.all([
        prisma.poCompanyGroup.findMany({ include: { projects: true }, orderBy: { name: 'asc' } }),
        prisma.poCategory.findMany({ orderBy: { name: 'asc' } }),
        prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
        prisma.masterItem.findMany({ include: { supplier: true }, orderBy: { name: 'asc' } }),
    ])
    return { companies, categories, suppliers, items }
}
