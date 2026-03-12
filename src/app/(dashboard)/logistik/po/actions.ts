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
    pic_name: z.string().optional(),
    pic_phone: z.string().optional(),
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

    // Count existing POs this year for this company
    // Mengambil hitungan data dari awal TAHUN agar reset tiap tahun, bukan tiap bulan.
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const count = await prisma.purchaseOrder.count({
        where: {
            companyGroupId,
            tanggal_terbit: { gte: startOfYear }
        }
    })

    // Offset khusus tahun 2026 karena data sebelumnya belum dimigrasi (ada 91 PO tertinggal)
    let finalCount = count
    if (now.getFullYear() === 2026) {
        finalCount += 91
    }

    const seq = String(finalCount + 1).padStart(3, '0')
    return `${seq}/${kodePerusahaan}/${kodeKategori}/${month}/${year}`
}

export async function getPurchaseOrders(params?: {
    page?: number
    pageSize?: number
    search?: string
    companyGroupId?: string
    categoryId?: string
    status?: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return { orders: [], totalCount: 0, totalPages: 0 }

    const {
        page = 1,
        pageSize = 10,
        search,
        companyGroupId,
        categoryId,
        status
    } = params || {}

    const skip = (page - 1) * pageSize

    const where: any = {}

    if (search) {
        where.OR = [
            { po_number: { contains: search, mode: 'insensitive' } },
            { companyGroup: { name: { contains: search, mode: 'insensitive' } } },
            { category: { name: { contains: search, mode: 'insensitive' } } },
            { proyek_nama: { contains: search, mode: 'insensitive' } },
        ]
    }

    if (companyGroupId) where.companyGroupId = companyGroupId
    if (categoryId) where.categoryId = categoryId
    if (status) where.status = status

    const [orders, totalCount] = await Promise.all([
        prisma.purchaseOrder.findMany({
            where,
            include: {
                companyGroup: true,
                category: true,
                items: { include: { masterItem: { include: { supplier: true } } } },
                location: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
        }),
        prisma.purchaseOrder.count({ where })
    ])

    // Fetch project names
    const projectIds = [...new Set(orders.map(o => o.companyProjectId).filter(Boolean))] as string[]
    const projects = projectIds.length > 0
        ? await prisma.poCompanyProject.findMany({ where: { id: { in: projectIds } } })
        : []
    const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]))

    const enrichedOrders = orders.map(po => ({
        ...po,
        proyek_nama: po.companyProjectId ? projectMap[po.companyProjectId] || "-" : "-"
    }))

    return {
        orders: enrichedOrders,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
    }
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
    pic_name?: string
    pic_phone?: string
    items: { masterItemId: string; quantity: number; harga_satuan: number; keterangan?: string; subtotal: number }[]
    pembuat_admin: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        const po_number = await generatePoNumber(data.companyGroupId, data.categoryId)

        const { items, jabatan_kepala } = data
        
        const created = await prisma.purchaseOrder.create({
            data: {
                po_number,
                tanggal_terbit: data.tanggal_terbit,
                companyGroupId: data.companyGroupId,
                categoryId: data.categoryId,
                supplierId: data.supplierId,
                pimpinan: data.pimpinan,
                kepala_peralatan: data.kepala_peralatan,
                pembuat_admin: data.pembuat_admin,
                metode_pembayaran: data.metode_pembayaran,
                companyProjectId: data.companyProjectId || null,
                locationId: data.locationId || null,
                km_hm_kendaraan: data.km_hm_kendaraan || null,
                notes: data.notes || null,
                pic_name: data.pic_name || null,
                pic_phone: data.pic_phone || null,
                items: {
                    create: items.map(item => ({
                        masterItemId: item.masterItemId,
                        quantity: item.quantity,
                        harga_satuan: item.harga_satuan,
                        keterangan: item.keterangan || null,
                        subtotal: item.subtotal,
                    }))
                }
            }
        })

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

    const userRole = session.user.role as string
    if (!['SuperAdminBP', 'CEO', 'FVP', 'AdminLogistik'].includes(userRole)) {
        return { success: false, error: "Forbidden: Anda tidak memiliki izin untuk mengubah status PO" }
    }

    try {
        const po = await prisma.purchaseOrder.update({ where: { id }, data: { status } })
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

// For PO Report tab: get filtered & grouped PO data
export async function getPOReport(filters: {
    bulan: number      // 1-12
    tahun: number
    grupBy: "kategori" | "perusahaan" | "metode_pembayaran"
    categoryId?: string
    companyGroupId?: string
    status?: "DRAFT" | "APPROVED" | "CANCELLED" | "ALL"
}) {
    const session = await auth()
    const startDate = new Date(filters.tahun, filters.bulan - 1, 1)
    const endDate = new Date(filters.tahun, filters.bulan, 0, 23, 59, 59)

    const where: any = {
        tanggal_terbit: { gte: startDate, lte: endDate },
    }
    if (filters.categoryId) where.categoryId = filters.categoryId
    if (filters.companyGroupId) where.companyGroupId = filters.companyGroupId
    if (filters.status && filters.status !== "ALL") where.status = filters.status

    const orders = await prisma.purchaseOrder.findMany({
        where,
        include: {
            companyGroup: true,
            category: true,
            items: true,
        },
        orderBy: [{ companyGroupId: 'asc' }, { categoryId: 'asc' }, { tanggal_terbit: 'asc' }]
    })

    // Fetch supplier names
    const supplierIds = [...new Set(orders.map(o => o.supplierId))]
    const suppliers = supplierIds.length > 0
        ? await prisma.supplier.findMany({ where: { id: { in: supplierIds } } })
        : []
    const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]))

    // Fetch project names via raw SQL
    const orderIds = orders.map(o => o.id)
    const rawProjects = orderIds.length > 0
        ? await prisma.$queryRaw<{ id: string; companyProjectId: string | null }[]>`
            SELECT id, "companyProjectId" FROM "PurchaseOrder" WHERE id = ANY(${orderIds}::text[])`
        : []
    const projectIds = [...new Set(rawProjects.map(r => r.companyProjectId).filter(Boolean))] as string[]
    const projects = projectIds.length > 0
        ? await prisma.poCompanyProject.findMany({ where: { id: { in: projectIds } } })
        : []
    const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]))
    const poProjectMap = Object.fromEntries(rawProjects.map(r => [r.id, r.companyProjectId ? projectMap[r.companyProjectId] || null : null]))

    const enriched = orders.map(po => ({
        id: po.id,
        po_number: po.po_number,
        tanggal_terbit: po.tanggal_terbit,
        status: po.status,
        metode_pembayaran: po.metode_pembayaran,
        supplier_nama: supplierMap[po.supplierId] || "-",
        perusahaan_nama: (po as any).companyGroup?.name || "-",
        perusahaan_id: po.companyGroupId,
        kategori_nama: (po as any).category?.name || "-",
        kategori_id: po.categoryId,
        proyek_nama: poProjectMap[po.id] || null,
        total: (po as any).items?.reduce((acc: number, item: any) => acc + item.subtotal, 0) || 0,
    }))

    // Group
    const groups: Record<string, { label: string; items: typeof enriched; subtotal: number }> = {}
    for (const po of enriched) {
        let key: string
        let label: string
        if (filters.grupBy === "kategori") {
            key = po.kategori_id; label = po.kategori_nama
        } else if (filters.grupBy === "perusahaan") {
            key = po.perusahaan_id; label = po.perusahaan_nama
        } else {
            key = po.metode_pembayaran; label = po.metode_pembayaran === "CASH" ? "CASH" : "KREDIT"
        }
        if (!groups[key]) groups[key] = { label, items: [], subtotal: 0 }
        groups[key].items.push(po)
        groups[key].subtotal += po.total
    }

    const grandTotal = enriched.reduce((acc, po) => acc + po.total, 0)
    return {
        groups: Object.values(groups),
        grandTotal,
        totalPO: enriched.length,
        filters,
        pembuat: session?.user?.username || "-",
    }
}

export async function updatePurchaseOrder(poId: string, data: {
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
    pic_name?: string
    pic_phone?: string
    items: { masterItemId: string; quantity: number; harga_satuan: number; keterangan?: string; subtotal: number }[]
    pembuat_admin: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }

    try {
        const existingPO = await prisma.purchaseOrder.findUnique({ where: { id: poId } })
        if (!existingPO) return { success: false, error: "PO tidak ditemukan" }
        if (existingPO.status !== "DRAFT") {
            return { success: false, error: "Hanya PO berstatus Draft yang bisa diubah." }
        }

        const { items, jabatan_kepala, ...poData } = data

        await prisma.$transaction(async (tx) => {
            await tx.poItem.deleteMany({
                where: { purchaseOrderId: poId }
            })

            await tx.purchaseOrder.update({
                where: { id: poId },
                data: {
                    ...poData,
                    companyProjectId: poData.companyProjectId || null,
                    locationId: poData.locationId || null,
                    items: {
                        create: items.map(item => ({
                            masterItemId: item.masterItemId,
                            quantity: item.quantity,
                            harga_satuan: item.harga_satuan,
                            keterangan: item.keterangan || undefined,
                            subtotal: item.subtotal,
                        }))
                    }
                }
            })

            if (jabatan_kepala !== undefined) {
                await tx.$executeRaw`UPDATE "PurchaseOrder" SET "jabatan_kepala" = ${jabatan_kepala} WHERE id = ${poId}`
            }
        })

        revalidatePath("/logistik/po")
        revalidatePath(`/logistik/po/${poId}/edit`)
        return { success: true }
    } catch (e: any) {
        console.error("Update PO Error:", e)
        return { success: false, error: e.message }
    }
}
