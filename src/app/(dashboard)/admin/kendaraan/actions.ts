"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"
import { isCorporateUser } from "@/lib/rbac"

const kendaraanSchema = z.object({
    id: z.string().optional(),
    plate_number: z.string().min(1, "Plat Nomor / No. Seri required"),
    vehicle_type: z.enum(["Mixer", "Loader"]).optional(),
    categoryId: z.string().optional().nullable(),
    code: z.string().min(1, "Kode Unit required"),
    locationId: z.string().optional(), // For SuperAdmin Branch Assignment
    dump_truck_size: z.preprocess(val => (val === "" || val === "NONE" ? null : val), z.enum(["BESAR", "KECIL"]).nullable().optional()),
    capacity_cubic: z.preprocess(val => (val === "" || val === undefined || val === null ? null : Number(val)), z.number().nullable().optional()),
    meter_type: z.preprocess(val => (val === "HM" ? "HM" : "KM"), z.enum(["KM", "HM"])).default("KM"),
    merk_model: z.preprocess(val => (val === "" || val === undefined ? null : val), z.string().nullable().optional()),
    is_for_rent: z.preprocess(val => val === "true" || val === true || val === "on", z.boolean()).default(false),
    default_day_rate: z.preprocess(val => (val === "" || val === undefined || val === null ? 0 : Number(val)), z.number().nullable().optional()).default(0),
    rental_status: z.string().default("Tersedia"),
    rental_notes: z.preprocess(val => (val === "" || val === undefined ? null : val), z.string().nullable().optional()),
})

function canManageKendaraan(user: any) {
    if (!user) return false
    if (["CEO", "FVP", "Approver"].includes(user.role)) return false
    return user.role === "SuperAdminBP" || user.role === "AdminBP"
}

// ─── Vehicle Category Server Actions ─────────────────────────────────────────

export async function getVehicleCategories() {
    const existing = await prisma.vehicleCategory.findMany({
        orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
        include: {
            _count: { select: { vehicles: true } }
        }
    })

    // Standard categories for Vehicles & Machinery
    const standardCategories = [
        { name: "Truck Mixer", code: "MX", description: "Truk Molen / Pengaduk & Pengangkut Beton Cor" },
        { name: "Wheel Loader", code: "LD", description: "Alat Berat Loader Pengisi Hopper Agregat Plant" },
        { name: "Dump Truck", code: "DT", description: "Truk Jungkit Pengangkut Material Pasir & Batu Pecah" },
        { name: "Concrete Pump", code: "CP", description: "Pompa Beton Cor (Boom Pump / Pompa Kodok)" },
        { name: "Excavator", code: "EXC", description: "Alat Berat Excavator Pengeruk Agregat & Pekerjaan Tanah" },
        { name: "Mobile Crane", code: "CR", description: "Crane Derek Pengangkat Beban & Alat Berat" },
        { name: "Batching Plant", code: "BP", description: "Unit Mesin Batching Plant Pengolah Beton Cor" },
        { name: "Genset & Power Plant", code: "GS", description: "Pembangkit Daya Genset & Mekanikal Kelistrikan" },
        { name: "Mobil Operasional", code: "OPS", description: "Kendaraan Pickup, Double Cabin, & Mobil Dinas Plant" },
        { name: "Sepeda Motor", code: "MTR", description: "Sepeda Motor Operasional Lapangan & Kurir" },
    ]

    let needsRefetch = false
    for (const cat of standardCategories) {
        const found = existing.some(c => c.name.toLowerCase() === cat.name.toLowerCase() || (cat.code && c.code?.toUpperCase() === cat.code))
        if (!found) {
            try {
                await prisma.vehicleCategory.create({
                    data: {
                        name: cat.name,
                        code: cat.code,
                        description: cat.description,
                        isSystem: true
                    }
                })
                needsRefetch = true
            } catch {
                // ignore concurrent insert
            }
        }
    }

    if (needsRefetch) {
        return await prisma.vehicleCategory.findMany({
            orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
            include: {
                _count: { select: { vehicles: true } }
            }
        })
    }

    return existing
}

export async function createVehicleCategory(data: { name: string; code?: string; description?: string }) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola kategori kendaraan" }
    }
    if (!data.name || !data.name.trim()) {
        return { success: false, error: "Nama kategori kendaraan wajib diisi" }
    }

    try {
        const cleanName = data.name.trim()
        const existing = await prisma.vehicleCategory.findUnique({
            where: { name: cleanName }
        })
        if (existing) {
            return { success: true, category: existing }
        }

        const category = await prisma.vehicleCategory.create({
            data: {
                name: cleanName,
                code: data.code?.trim().toUpperCase() || cleanName.slice(0, 3).toUpperCase(),
                description: data.description?.trim() || null,
                isSystem: false
            }
        })
        revalidatePath("/admin/kendaraan")
        return { success: true, category }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateVehicleCategory(id: string, data: { name: string; code?: string; description?: string }) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola kategori kendaraan" }
    }

    try {
        const category = await prisma.vehicleCategory.update({
            where: { id },
            data: {
                name: data.name.trim(),
                code: data.code?.trim().toUpperCase() || null,
                description: data.description?.trim() || null
            }
        })
        revalidatePath("/admin/kendaraan")
        return { success: true, category }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteVehicleCategory(id: string) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola kategori kendaraan" }
    }

    try {
        const count = await prisma.vehicle.count({ where: { categoryId: id } })
        if (count > 0) {
            return { success: false, error: `Kategori ini masih digunakan oleh ${count} kendaraan.` }
        }

        await prisma.vehicleCategory.delete({ where: { id } })
        revalidatePath("/admin/kendaraan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

// ─── Vehicle CRUD Actions ───────────────────────────────────────────────────

export async function getKendaraan() {
    const session = await auth()
    if (!session?.user) return []

    const isCorp = isCorporateUser(session.user)
    const filter = isCorp ? {} : (session.user.locationId ? { locationId: session.user.locationId } : {})

    return await prisma.vehicle.findMany({
        where: filter,
        include: { 
            location: true,
            category: true
        },
        orderBy: { code: 'asc' }
    })
}

export async function createKendaraan(formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data kendaraan" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = kendaraanSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : session.user.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        const { locationId, categoryId, vehicle_type, ...insertData } = parsed.data

        // Auto determine vehicle_type for backward compatibility with Produksi
        let resolvedType = vehicle_type || "Mixer"
        let finalCategoryId = categoryId || null

        if (finalCategoryId) {
            const cat = await prisma.vehicleCategory.findUnique({ where: { id: finalCategoryId } })
            if (cat) {
                resolvedType = cat.name.toLowerCase().includes("mixer") ? "Mixer" : "Loader"
            }
        }

        const createdVeh = await prisma.vehicle.create({
            data: {
                ...insertData,
                vehicle_type: resolvedType,
                categoryId: finalCategoryId,
                locationId: finalLocationId
            },
            include: { category: true }
        })

        if (createdVeh.is_for_rent) {
            try {
                await prisma.masterSewaAlat.upsert({
                    where: { kode_alat: createdVeh.code },
                    update: {
                        nama_alat: `${createdVeh.category?.name || "Alat"} ${createdVeh.code}`,
                        kategori: createdVeh.category?.name || "Lainnya",
                        merk_model: createdVeh.merk_model,
                        nomor_seri_plat: createdVeh.plate_number,
                        default_day_rate: createdVeh.default_day_rate || 0,
                        status: createdVeh.rental_status || "Tersedia",
                        keterangan: createdVeh.rental_notes,
                        locationId: createdVeh.locationId
                    },
                    create: {
                        kode_alat: createdVeh.code,
                        nama_alat: `${createdVeh.category?.name || "Alat"} ${createdVeh.code}`,
                        kategori: createdVeh.category?.name || "Lainnya",
                        merk_model: createdVeh.merk_model,
                        nomor_seri_plat: createdVeh.plate_number,
                        default_day_rate: createdVeh.default_day_rate || 0,
                        status: createdVeh.rental_status || "Tersedia",
                        keterangan: createdVeh.rental_notes,
                        locationId: createdVeh.locationId
                    }
                })
            } catch (e) {
                console.error("Failed to sync MasterSewaAlat:", e)
            }
        }

        revalidatePath("/admin/kendaraan")
        revalidatePath("/admin/sewa")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateKendaraan(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data kendaraan" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = kendaraanSchema.safeParse({
        ...data,
        id
    })

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.vehicle.findUnique({ where: { id } })

        // Verify ownership if not SuperAdmin
        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        const finalLocationId = isSuperAdmin && parsed.data.locationId ? parsed.data.locationId : existing?.locationId

        if (!finalLocationId) return { success: false, error: "Location is required" }

        const { locationId, categoryId, vehicle_type, ...updateData } = parsed.data

        let resolvedType = vehicle_type || existing?.vehicle_type || "Mixer"
        let finalCategoryId = categoryId !== undefined ? categoryId : existing?.categoryId

        if (finalCategoryId) {
            const cat = await prisma.vehicleCategory.findUnique({ where: { id: finalCategoryId } })
            if (cat) {
                resolvedType = cat.name.toLowerCase().includes("mixer") ? "Mixer" : "Loader"
            }
        }

        const updatedVeh = await prisma.vehicle.update({
            where: { id },
            data: {
                ...updateData,
                vehicle_type: resolvedType,
                categoryId: finalCategoryId,
                locationId: finalLocationId
            },
            include: { category: true }
        })

        if (updatedVeh.is_for_rent) {
            try {
                await prisma.masterSewaAlat.upsert({
                    where: { kode_alat: updatedVeh.code },
                    update: {
                        nama_alat: `${updatedVeh.category?.name || "Alat"} ${updatedVeh.code}`,
                        kategori: updatedVeh.category?.name || "Lainnya",
                        merk_model: updatedVeh.merk_model,
                        nomor_seri_plat: updatedVeh.plate_number,
                        default_day_rate: updatedVeh.default_day_rate || 0,
                        status: updatedVeh.rental_status || "Tersedia",
                        keterangan: updatedVeh.rental_notes,
                        locationId: updatedVeh.locationId
                    },
                    create: {
                        kode_alat: updatedVeh.code,
                        nama_alat: `${updatedVeh.category?.name || "Alat"} ${updatedVeh.code}`,
                        kategori: updatedVeh.category?.name || "Lainnya",
                        merk_model: updatedVeh.merk_model,
                        nomor_seri_plat: updatedVeh.plate_number,
                        default_day_rate: updatedVeh.default_day_rate || 0,
                        status: updatedVeh.rental_status || "Tersedia",
                        keterangan: updatedVeh.rental_notes,
                        locationId: updatedVeh.locationId
                    }
                })
            } catch (e) {
                console.error("Failed to sync MasterSewaAlat on update:", e)
            }
        }

        revalidatePath("/admin/kendaraan")
        revalidatePath("/admin/sewa")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteKendaraan(id: string) {
    const session = await auth()
    if (!session?.user || !canManageKendaraan(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data kendaraan" }
    }

    try {
        const isSuperAdmin = session.user.role === 'SuperAdminBP'
        const existing = await prisma.vehicle.findUnique({ where: { id } })

        // Verify ownership if not SuperAdmin
        if (!isSuperAdmin && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized" }
        }

        await prisma.vehicle.delete({
            where: { id }
        })
        revalidatePath("/admin/kendaraan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: "Failed to delete kendaraan" }
    }
}
