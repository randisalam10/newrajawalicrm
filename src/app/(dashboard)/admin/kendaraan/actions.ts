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
    // Pajak STNK & Uji KIR
    annual_tax_cost: z.preprocess(val => (val === "" || val === undefined || val === null ? 0 : Number(val)), z.number().nullable().optional()).default(0),
    tax_expiry_date: z.preprocess(val => (val === "" || val === undefined || val === null ? null : new Date(val as string)), z.date().nullable().optional()),
    kir_cost: z.preprocess(val => (val === "" || val === undefined || val === null ? 0 : Number(val)), z.number().nullable().optional()).default(0),
    kir_expiry_date: z.preprocess(val => (val === "" || val === undefined || val === null ? null : new Date(val as string)), z.date().nullable().optional()),
    kir_period_months: z.preprocess(val => (val === "" || val === undefined || val === null ? 6 : Number(val)), z.number().nullable().optional()).default(6),
})

export async function canManageKendaraan(user: any): Promise<boolean> {
    if (!user) return false
    if (user.role === "SuperAdminBP") return true
    if (["CEO", "FVP", "Approver"].includes(user.role)) return false
    if (user.role === "AdminBP") return true

    const perms: string[] = user.permissions || []
    if (
        perms.includes("VEHICLE_CREATE") ||
        perms.includes("VEHICLE_EDIT") ||
        perms.includes("MASTER_DATA_CREATE") ||
        perms.includes("MASTER_DATA_EDIT")
    ) {
        return true
    }

    // Real-time check from DB in case token is not yet refreshed
    if (user.id) {
        try {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: {
                    role: true,
                    roleRef: {
                        include: {
                            permissions: {
                                include: { permission: true }
                            }
                        }
                    }
                }
            })
            if (dbUser?.role === "SuperAdminBP" || dbUser?.role === "AdminBP") return true
            const dbPerms = dbUser?.roleRef?.permissions.map(rp => rp.permission.code) || []
            return (
                dbPerms.includes("VEHICLE_CREATE") ||
                dbPerms.includes("VEHICLE_EDIT") ||
                dbPerms.includes("MASTER_DATA_CREATE") ||
                dbPerms.includes("MASTER_DATA_EDIT")
            )
        } catch {
            return false
        }
    }

    return false
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
    if (!session?.user || !(await canManageKendaraan(session.user))) {
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
    if (!session?.user || !(await canManageKendaraan(session.user))) {
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
    if (!session?.user || !(await canManageKendaraan(session.user))) {
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

    try {
        return await prisma.vehicle.findMany({
            where: filter,
            include: { 
                location: true,
                category: true,
                complianceRecords: {
                    orderBy: { valid_until: 'desc' }
                }
            },
            orderBy: { code: 'asc' }
        })
    } catch {
        const vehicles = await prisma.vehicle.findMany({
            where: filter,
            include: { 
                location: true,
                category: true
            },
            orderBy: { code: 'asc' }
        })
        try {
            const allRecords: any[] = await prisma.$queryRawUnsafe(`
                SELECT * FROM "VehicleComplianceRecord" ORDER BY "valid_until" DESC
            `)
            return vehicles.map((v: any) => ({
                ...v,
                complianceRecords: allRecords.filter((r: any) => r.vehicleId === v.id)
            }))
        } catch {
            return vehicles.map((v: any) => ({ ...v, complianceRecords: [] }))
        }
    }
}

export async function createKendaraan(formData: FormData) {
    const session = await auth()
    if (!session?.user || !(await canManageKendaraan(session.user))) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data kendaraan" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = kendaraanSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isCorp = isCorporateUser(session.user)
        const finalLocationId = parsed.data.locationId || session.user.locationId

        if (!finalLocationId) return { success: false, error: "Cabang pangkalan wajib dipilih." }

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
    if (!session?.user || !(await canManageKendaraan(session.user))) {
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
        const isCorp = isCorporateUser(session.user)
        const existing = await prisma.vehicle.findUnique({ where: { id } })

        // Verify ownership if not Corporate user
        if (!isCorp && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized: Anda tidak memiliki akses ke kendaraan cabang lain" }
        }

        const finalLocationId = (isCorp && parsed.data.locationId) ? parsed.data.locationId : (existing?.locationId || parsed.data.locationId)

        if (!finalLocationId) return { success: false, error: "Cabang pangkalan wajib dipilih." }

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
    if (!session?.user || !(await canManageKendaraan(session.user))) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data kendaraan" }
    }

    try {
        const isCorp = isCorporateUser(session.user)
        const existing = await prisma.vehicle.findUnique({ where: { id } })

        // Verify ownership if not Corporate user
        if (!isCorp && existing?.locationId !== session.user.locationId) {
            return { success: false, error: "Unauthorized: Anda tidak memiliki akses ke kendaraan cabang lain" }
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

// ─── Vehicle Compliance & Pajak/KIR History Actions ─────────────────────────

const complianceRecordSchema = z.object({
    id: z.string().optional(),
    vehicleId: z.string().min(1, "Kendaraan wajib dipilih"),
    type: z.enum(["PAJAK_STNK", "UJI_KIR", "IZIN_TRAYEK", "LAINNYA"]).default("PAJAK_STNK"),
    cost: z.preprocess(val => (val === "" || val === undefined || val === null ? 0 : Number(val)), z.number().min(0, "Biaya minimal Rp 0")),
    payment_date: z.preprocess(val => (val === "" || val === undefined || val === null ? null : new Date(val as string)), z.date().nullable().optional()),
    valid_from: z.preprocess(val => new Date(val as string), z.date()),
    valid_until: z.preprocess(val => new Date(val as string), z.date()),
    period_months: z.preprocess(val => (val === "" || val === undefined || val === null ? 12 : Number(val)), z.number().min(1, "Periode minimal 1 bulan")).default(12),
    receipt_number: z.preprocess(val => (val === "" || val === undefined ? null : val), z.string().nullable().optional()),
    notes: z.preprocess(val => (val === "" || val === undefined ? null : val), z.string().nullable().optional()),
})

export async function getVehicleComplianceRecords(vehicleId?: string) {
    const session = await auth()
    if (!session?.user) return []

    const isCorp = isCorporateUser(session.user)
    const filter: any = {}

    if (vehicleId) {
        filter.vehicleId = vehicleId
    }

    if (!isCorp && session.user.locationId) {
        filter.vehicle = { locationId: session.user.locationId }
    }

    if ((prisma as any).vehicleComplianceRecord?.findMany) {
        return await (prisma as any).vehicleComplianceRecord.findMany({
            where: filter,
            include: {
                vehicle: {
                    include: { location: true, category: true }
                }
            },
            orderBy: { valid_until: "desc" }
        })
    }

    // Raw SQL fallback
    try {
        let rows: any[] = []
        if (vehicleId) {
            rows = await prisma.$queryRawUnsafe(`
                SELECT r.*, v.code as "vehicle_code", v.plate_number, v."vehicle_type"
                FROM "VehicleComplianceRecord" r
                LEFT JOIN "Vehicle" v ON r."vehicleId" = v.id
                WHERE r."vehicleId" = $1
                ORDER BY r."valid_until" DESC
            `, vehicleId)
        } else {
            rows = await prisma.$queryRawUnsafe(`
                SELECT r.*, v.code as "vehicle_code", v.plate_number, v."vehicle_type"
                FROM "VehicleComplianceRecord" r
                LEFT JOIN "Vehicle" v ON r."vehicleId" = v.id
                ORDER BY r."valid_until" DESC
            `)
        }
        return rows.map((r: any) => ({
            ...r,
            vehicle: {
                id: r.vehicleId,
                code: r.vehicle_code,
                plate_number: r.plate_number,
                vehicle_type: r.vehicle_type
            }
        }))
    } catch (e: any) {
        console.error("Error in getVehicleComplianceRecords fallback:", e)
        return []
    }
}

export async function createVehicleComplianceRecord(formData: FormData) {
    const session = await auth()
    if (!session?.user || !(await canManageKendaraan(session.user))) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mencatat riwayat kepatuhan armada" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = complianceRecordSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const { vehicleId, type, cost, payment_date, valid_from, valid_until, period_months, receipt_number, notes } = parsed.data
        const monthly_amount = Math.round(cost / (period_months || (type === "UJI_KIR" ? 6 : 12)))

        let record: any
        if ((prisma as any).vehicleComplianceRecord?.create) {
            record = await (prisma as any).vehicleComplianceRecord.create({
                data: {
                    vehicleId,
                    type,
                    cost,
                    payment_date: payment_date || new Date(),
                    valid_from,
                    valid_until,
                    period_months,
                    monthly_amount,
                    receipt_number,
                    notes,
                    created_by: session.user.username || (session.user as any)?.name || "System"
                }
            })
        } else {
            const id = require("crypto").randomUUID()
            await prisma.$executeRawUnsafe(`
                INSERT INTO "VehicleComplianceRecord" (
                    "id", "vehicleId", "type", "cost", "payment_date", "valid_from", "valid_until",
                    "period_months", "monthly_amount", "receipt_number", "notes", "created_by",
                    "createdAt", "updatedAt"
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
            `, id, vehicleId, type, cost, payment_date || new Date(), valid_from, valid_until,
               period_months, monthly_amount, receipt_number || null, notes || null,
               session.user.username || (session.user as any)?.name || "System")
            record = { id, vehicleId, type, cost, valid_from, valid_until, period_months, monthly_amount }
        }

        // 2. Synchronize Vehicle master table with the latest active values
        const updateData: any = {}
        if (type === "PAJAK_STNK") {
            updateData.annual_tax_cost = cost
            updateData.tax_expiry_date = valid_until
        } else if (type === "UJI_KIR") {
            updateData.kir_cost = cost
            updateData.kir_period_months = period_months
            updateData.kir_expiry_date = valid_until
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.vehicle.update({
                where: { id: vehicleId },
                data: updateData
            })
        }

        revalidatePath("/admin/kendaraan")
        revalidatePath("/admin/reports/monthly-management")
        return { success: true, data: record }
    } catch (e: any) {
        console.error("Error creating compliance record:", e)
        return { success: false, error: e.message }
    }
}

export async function updateVehicleComplianceRecord(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !(await canManageKendaraan(session.user))) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengubah riwayat kepatuhan armada" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = complianceRecordSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const { vehicleId, type, cost, payment_date, valid_from, valid_until, period_months, receipt_number, notes } = parsed.data
        const monthly_amount = Math.round(cost / (period_months || (type === "UJI_KIR" ? 6 : 12)))

        let record: any
        if ((prisma as any).vehicleComplianceRecord?.update) {
            record = await (prisma as any).vehicleComplianceRecord.update({
                where: { id },
                data: {
                    type,
                    cost,
                    payment_date: payment_date || new Date(),
                    valid_from,
                    valid_until,
                    period_months,
                    monthly_amount,
                    receipt_number,
                    notes
                }
            })
        } else {
            await prisma.$executeRawUnsafe(`
                UPDATE "VehicleComplianceRecord" SET
                    "type" = $1, "cost" = $2, "payment_date" = $3, "valid_from" = $4,
                    "valid_until" = $5, "period_months" = $6, "monthly_amount" = $7,
                    "receipt_number" = $8, "notes" = $9, "updatedAt" = CURRENT_TIMESTAMP
                WHERE "id" = $10
            `, type, cost, payment_date || new Date(), valid_from, valid_until,
               period_months, monthly_amount, receipt_number || null, notes || null, id)
            record = { id, vehicleId, type, cost, valid_from, valid_until, period_months, monthly_amount }
        }

        // Re-sync Vehicle master with latest record
        try {
            const records: any[] = await prisma.$queryRawUnsafe(`
                SELECT * FROM "VehicleComplianceRecord"
                WHERE "vehicleId" = $1 AND "type" = $2
                ORDER BY "valid_until" DESC LIMIT 1
            `, vehicleId, type)

            if (records.length > 0) {
                const latestRecord = records[0]
                const updateData: any = {}
                if (type === "PAJAK_STNK") {
                    updateData.annual_tax_cost = latestRecord.cost
                    updateData.tax_expiry_date = latestRecord.valid_until
                } else if (type === "UJI_KIR") {
                    updateData.kir_cost = latestRecord.cost
                    updateData.kir_period_months = latestRecord.period_months
                    updateData.kir_expiry_date = latestRecord.valid_until
                }
                await prisma.vehicle.update({
                    where: { id: vehicleId },
                    data: updateData
                })
            }
        } catch {}

        revalidatePath("/admin/kendaraan")
        revalidatePath("/admin/reports/monthly-management")
        return { success: true, data: record }
    } catch (e: any) {
        console.error("Error updating compliance record:", e)
        return { success: false, error: e.message }
    }
}

export async function deleteVehicleComplianceRecord(id: string) {
    const session = await auth()
    if (!session?.user || !(await canManageKendaraan(session.user))) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin menghapus riwayat kepatuhan armada" }
    }

    try {
        let vehicleId = ""
        let type = ""

        try {
            const record = await prisma.$queryRawUnsafe<any[]>(`
                SELECT "vehicleId", "type" FROM "VehicleComplianceRecord" WHERE "id" = $1
            `, id)
            if (record && record.length > 0) {
                vehicleId = record[0].vehicleId
                type = record[0].type
            }
        } catch {}

        if ((prisma as any).vehicleComplianceRecord?.delete) {
            await (prisma as any).vehicleComplianceRecord.delete({ where: { id } })
        } else {
            await prisma.$executeRawUnsafe(`DELETE FROM "VehicleComplianceRecord" WHERE "id" = $1`, id)
        }

        // Check if another record exists to restore Vehicle master
        if (vehicleId && type) {
            try {
                const records: any[] = await prisma.$queryRawUnsafe(`
                    SELECT * FROM "VehicleComplianceRecord"
                    WHERE "vehicleId" = $1 AND "type" = $2
                    ORDER BY "valid_until" DESC LIMIT 1
                `, vehicleId, type)

                const nextRecord = records[0]
                const updateData: any = {}
                if (type === "PAJAK_STNK") {
                    updateData.annual_tax_cost = nextRecord ? nextRecord.cost : 0
                    updateData.tax_expiry_date = nextRecord ? nextRecord.valid_until : null
                } else if (type === "UJI_KIR") {
                    updateData.kir_cost = nextRecord ? nextRecord.cost : 0
                    updateData.kir_period_months = nextRecord ? nextRecord.period_months : 6
                    updateData.kir_expiry_date = nextRecord ? nextRecord.valid_until : null
                }

                await prisma.vehicle.update({
                    where: { id: vehicleId },
                    data: updateData
                })
            } catch {}
        }

        revalidatePath("/admin/kendaraan")
        revalidatePath("/admin/reports/monthly-management")
        return { success: true }
    } catch (e: any) {
        console.error("Error deleting compliance record:", e)
        return { success: false, error: e.message }
    }
}
