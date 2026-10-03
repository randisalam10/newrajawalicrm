"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"
import { SupplierItem, SupplierStats } from "./types"

const supplierSchema = z.object({
    name: z.string().trim().min(1, "Nama toko wajib diisi"),
    address: z.string().trim().optional().or(z.literal("")),
    contact: z.string().trim().optional().or(z.literal("")),
})

function canManageSupplier(user: any) {
    if (!user) return false
    if (["CEO", "FVP", "Approver"].includes(user.role)) return false
    return user.role === "SuperAdminBP" || user.role === "AdminBP" || user.role === "AdminLogistik"
}

export async function getSuppliers() {
    return await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
}

export async function getSuppliersData(): Promise<{ suppliers: SupplierItem[]; stats: SupplierStats }> {
    const [rawSuppliers, poCounts] = await Promise.all([
        prisma.supplier.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { masterItems: true }
                }
            }
        }),
        prisma.purchaseOrder.groupBy({
            by: ['supplierId'],
            _count: { id: true }
        })
    ])

    const poMap = new Map<string, number>()
    poCounts.forEach(p => {
        if (p.supplierId) poMap.set(p.supplierId, p._count.id)
    })

    let totalItems = 0
    let withContactCount = 0
    let activeSuppliers = 0

    const suppliers: SupplierItem[] = rawSuppliers.map(s => {
        const itemCount = s._count?.masterItems || 0
        const poCount = poMap.get(s.id) || 0

        totalItems += itemCount
        if (s.contact && s.contact.trim() !== "") withContactCount++
        if (poCount > 0 || itemCount > 0) activeSuppliers++

        return {
            id: s.id,
            name: s.name,
            address: s.address || null,
            contact: s.contact || null,
            itemCount,
            poCount,
            createdAt: s.createdAt.toISOString()
        }
    })

    const stats: SupplierStats = {
        totalSuppliers: suppliers.length,
        totalItems,
        activeSuppliers,
        withContactCount
    }

    return { suppliers, stats }
}

export async function createSupplier(formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageSupplier(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data toko/supplier" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = supplierSchema.safeParse(data)
    if (!parsed.success) {
        const firstError = Object.values(parsed.error.format())[0]
        return { success: false, error: typeof firstError === 'object' && '_errors' in firstError ? (firstError as any)._errors[0] : "Data tidak valid" }
    }

    try {
        await prisma.supplier.create({
            data: {
                name: parsed.data.name,
                address: parsed.data.address || null,
                contact: parsed.data.contact || null,
            }
        })
        revalidatePath("/logistik/supplier")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal menambahkan toko baru" }
    }
}

export async function updateSupplier(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageSupplier(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data toko/supplier" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = supplierSchema.safeParse(data)
    if (!parsed.success) {
        const firstError = Object.values(parsed.error.format())[0]
        return { success: false, error: typeof firstError === 'object' && '_errors' in firstError ? (firstError as any)._errors[0] : "Data tidak valid" }
    }

    try {
        await prisma.supplier.update({
            where: { id },
            data: {
                name: parsed.data.name,
                address: parsed.data.address || null,
                contact: parsed.data.contact || null,
            }
        })
        revalidatePath("/logistik/supplier")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal memperbarui data toko" }
    }
}

export async function deleteSupplier(id: string) {
    const session = await auth()
    if (!session?.user || !canManageSupplier(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data toko/supplier" }
    }

    try {
        const [itemCount, poCount] = await Promise.all([
            prisma.masterItem.count({ where: { supplierId: id } }),
            prisma.purchaseOrder.count({ where: { supplierId: id } })
        ])

        if (itemCount > 0 || poCount > 0) {
            return {
                success: false,
                error: `Tidak dapat menghapus toko ini karena masih terhubung dengan ${itemCount} item katalog barang dan ${poCount} riwayat Purchase Order (PO).`
            }
        }

        await prisma.supplier.delete({ where: { id } })
        revalidatePath("/logistik/supplier")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Gagal menghapus toko. Pastikan tidak ada transaksi terkait." }
    }
}
