"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

// ─── Helpers & Permission Checks ─────────────────────────────────────────────

function isCorporate(user: any): boolean {
    if (!user) return false
    return user.role === "SuperAdminBP" ||
        user.roleScope === "ALL_BRANCHES" ||
        ["CEO", "FVP", "Approver"].includes(user.role || "")
}

function canCreateOrEdit(user: any): boolean {
    if (!user) return false
    if (["CEO", "FVP", "Approver"].includes(user.role || "")) return false
    return user.role === "SuperAdminBP" ||
        user.role === "AdminBP" ||
        user.role === "OperatorBP" ||
        (user.permissions && user.permissions.includes("SEWA_CREATE"))
}

// ─── Auto Number Generator ───────────────────────────────────────────────────

export async function generateSewaNumber(dateInput?: Date, locationId?: string) {
    const d = dateInput || new Date()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = String(d.getFullYear())

    let branchCode = "BP"
    if (locationId) {
        const loc = await prisma.location.findUnique({ where: { id: locationId } })
        if (loc?.name) {
            branchCode = loc.name.slice(0, 3).toUpperCase()
        }
    }

    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1)
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

    const countThisMonth = await prisma.sewaTransaction.count({
        where: {
            date: { gte: startOfMonth, lte: endOfMonth }
        }
    })

    const seq = String(countThisMonth + 1).padStart(3, "0")
    return `${seq}/SJ-SWA/${branchCode}/${month}/${year}`
}

// ─── Master Data Queries for Sewa Form ────────────────────────────────────────

export async function getSewaMasters() {
    const session = await auth()
    if (!session?.user) {
        return {
            customers: [],
            projects: [],
            equipments: [],
            operators: [],
            locations: []
        }
    }

    const isCorp = isCorporate(session.user)
    const locFilter = isCorp ? {} : (session.user.locationId ? { locationId: session.user.locationId } : {})

    const [customers, rentableVehicles, legacyMasterSewa, operators, locations] = await Promise.all([
        prisma.customer.findMany({
            where: {
                status: "Active",
                ...(isCorp ? {} : {
                    OR: [
                        { locationId: session.user.locationId || "" },
                        { sharedLocations: { some: { id: session.user.locationId || "" } } }
                    ]
                })
            },
            include: {
                projects: {
                    orderBy: { name: "asc" }
                }
            },
            orderBy: { customer_name: "asc" }
        }),

        // Primary: Vehicles marked as is_for_rent = true from unified Data Master Kendaraan
        prisma.vehicle.findMany({
            where: {
                is_for_rent: true,
                ...(isCorp ? {} : (session.user.locationId ? { locationId: session.user.locationId } : {}))
            },
            include: {
                category: true,
                location: true,
            },
            orderBy: { code: "asc" }
        }),

        // Secondary: Legacy MasterSewaAlat
        prisma.masterSewaAlat.findMany({
            where: {
                ...(isCorp ? {} : {
                    OR: [
                        { locationId: null },
                        { locationId: session.user.locationId }
                    ]
                })
            },
            orderBy: [{ status: "asc" }, { nama_alat: "asc" }]
        }),

        prisma.employee.findMany({
            where: {
                status: "Active",
                position: { in: ["Operator", "Sopir"] },
                ...locFilter
            },
            include: {
                driverCategory: true
            },
            orderBy: { name: "asc" }
        }),

        prisma.location.findMany({
            orderBy: { name: "asc" }
        })
    ])

    // Build unified equipments list
    const legacyByCode = new Map(legacyMasterSewa.map(m => [m.kode_alat, m]))
    const equipments: any[] = rentableVehicles.map(v => {
        const legacy = legacyByCode.get(v.code)
        return {
            id: v.id, // Primary ID is Vehicle ID
            vehicleId: v.id,
            equipmentId: legacy?.id || null,
            kode_alat: v.code,
            nama_alat: `${v.category?.name || "Unit"} ${v.code}${v.merk_model ? ` (${v.merk_model})` : ""}`,
            kategori: v.category?.name || "Alat Berat",
            merk_model: v.merk_model,
            nomor_seri_plat: v.plate_number,
            default_day_rate: v.default_day_rate || legacy?.default_day_rate || 0,
            status: v.rental_status || legacy?.status || "Tersedia",
            meter_type: v.meter_type,
            locationId: v.locationId,
        }
    })

    // Add any legacy master sewa that hasn't been mapped to vehicle yet
    for (const m of legacyMasterSewa) {
        if (!equipments.some(e => e.kode_alat === m.kode_alat)) {
            equipments.push({
                id: m.id,
                vehicleId: null,
                equipmentId: m.id,
                kode_alat: m.kode_alat,
                nama_alat: m.nama_alat,
                kategori: m.kategori,
                merk_model: m.merk_model,
                nomor_seri_plat: m.nomor_seri_plat,
                default_day_rate: m.default_day_rate || 0,
                status: m.status || "Tersedia",
                meter_type: "HM",
                locationId: m.locationId,
            })
        }
    }

    return {
        customers,
        equipments,
        operators,
        locations
    }
}

// ─── Sewa Transactions Queries ───────────────────────────────────────────────

export async function getSewaTransactions(filters?: {
    search?: string
    status?: string
    locationId?: string
    limit?: number
}) {
    const session = await auth()
    if (!session?.user) return []

    const isCorp = isCorporate(session.user)
    const userLocId = session.user.locationId

    const where: any = {}

    if (!isCorp && userLocId) {
        where.locationId = userLocId
    } else if (filters?.locationId && filters.locationId !== "ALL") {
        where.locationId = filters.locationId
    }

    if (filters?.status && filters.status !== "ALL") {
        where.status = filters.status
    }

    if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim()
        where.OR = [
            { sewa_number: { contains: q, mode: "insensitive" } },
            { customer: { customer_name: { contains: q, mode: "insensitive" } } },
            { equipment: { nama_alat: { contains: q, mode: "insensitive" } } },
            { equipment: { kode_alat: { contains: q, mode: "insensitive" } } },
            { vehicle: { code: { contains: q, mode: "insensitive" } } },
            { vehicle: { plate_number: { contains: q, mode: "insensitive" } } },
            { operator: { name: { contains: q, mode: "insensitive" } } },
            { lokasi_proyek: { contains: q, mode: "insensitive" } },
        ]
    }

    return await prisma.sewaTransaction.findMany({
        where,
        take: filters?.limit || 100,
        orderBy: { date: "desc" },
        include: {
            customer: true,
            project: true,
            equipment: true,
            vehicle: {
                include: { category: true }
            },
            operator: {
                include: { driverCategory: true }
            },
            location: true
        }
    })
}

// ─── Create Sewa Transaction ─────────────────────────────────────────────────

const sewaSchema = z.object({
    id: z.string().optional(),
    customerId: z.string().min(1, "Customer wajib dipilih"),
    projectId: z.preprocess(v => (v === "" || v === "NONE" ? null : v), z.string().nullable().optional()),
    lokasi_proyek: z.string().optional().nullable(),
    equipmentId: z.string().min(1, "Alat/Kendaraan wajib dipilih"),
    operatorId: z.string().min(1, "Operator wajib dipilih"),
    date_mode: z.enum(["RANGE", "DATES"]).default("RANGE"),
    start_date: z.string().min(1, "Tanggal mulai sewa wajib diisi"),
    end_date: z.string().min(1, "Tanggal akhir sewa wajib diisi"),
    rental_dates: z.string().min(2, "Daftar tanggal sewa tidak boleh kosong"),
    total_days: z.coerce.number().min(1, "Jumlah hari minimal 1 hari"),
    price_per_day: z.coerce.number().min(0).default(0),
    total_price: z.coerce.number().min(0).default(0),
    is_ppn: z.preprocess(v => v === "true" || v === true, z.boolean()).default(false),
    ppn_mode: z.enum(["NON_PPN", "INCLUDE", "EXCLUDE"]).default("NON_PPN"),
    ppn_rate: z.coerce.number().min(0).default(11),
    dpp_amount: z.coerce.number().min(0).default(0),
    ppn_amount: z.coerce.number().min(0).default(0),
    notes: z.string().optional().nullable(),
    locationId: z.string().optional(),
    status: z.string().default("Active"),
})

export async function createSewaTransaction(formData: FormData) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    if (!canCreateOrEdit(session.user)) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin membuat transaksi sewa" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = sewaSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const isCorp = isCorporate(session.user)
        const finalLocationId = isCorp && parsed.data.locationId
            ? parsed.data.locationId
            : (session.user.locationId || parsed.data.locationId)

        if (!finalLocationId) {
            return { success: false, error: "Cabang (Location) wajib ditentukan" }
        }

        const now = new Date()
        const sewa_number = await generateSewaNumber(now, finalLocationId)

        const startDate = new Date(parsed.data.start_date)
        const endDate = new Date(parsed.data.end_date)

        // Resolve Vehicle and MasterSewaAlat IDs for dual association
        let targetVehicleId: string | null = null
        let targetEquipmentId: string | null = null

        // Check if selected ID is a Vehicle
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: parsed.data.equipmentId },
            include: { category: true }
        })

        if (vehicle) {
            targetVehicleId = vehicle.id
            // Ensure corresponding MasterSewaAlat exists for backward compat
            let m = await prisma.masterSewaAlat.findUnique({ where: { kode_alat: vehicle.code } })
            if (!m) {
                m = await prisma.masterSewaAlat.create({
                    data: {
                        kode_alat: vehicle.code,
                        nama_alat: `${vehicle.category?.name || "Alat"} ${vehicle.code}`,
                        kategori: vehicle.category?.name || "Alat Berat",
                        merk_model: vehicle.merk_model,
                        nomor_seri_plat: vehicle.plate_number,
                        default_day_rate: vehicle.default_day_rate || 0,
                        status: "Disewa",
                        locationId: vehicle.locationId
                    }
                })
            }
            targetEquipmentId = m.id
        } else {
            // Check if selected ID is a MasterSewaAlat
            const m = await prisma.masterSewaAlat.findUnique({ where: { id: parsed.data.equipmentId } })
            if (m) {
                targetEquipmentId = m.id
                const veh = await prisma.vehicle.findFirst({ where: { code: m.kode_alat } })
                if (veh) targetVehicleId = veh.id
            }
        }

        const newSewa = await prisma.sewaTransaction.create({
            data: {
                sewa_number,
                date: now,
                customerId: parsed.data.customerId,
                projectId: parsed.data.projectId || null,
                lokasi_proyek: parsed.data.lokasi_proyek || null,
                equipmentId: targetEquipmentId,
                vehicleId: targetVehicleId,
                operatorId: parsed.data.operatorId,
                date_mode: parsed.data.date_mode,
                start_date: startDate,
                end_date: endDate,
                rental_dates: parsed.data.rental_dates,
                total_days: parsed.data.total_days,
                price_per_day: parsed.data.price_per_day,
                total_price: parsed.data.total_price,
                is_ppn: parsed.data.is_ppn,
                ppn_mode: parsed.data.ppn_mode,
                ppn_rate: parsed.data.ppn_rate,
                dpp_amount: parsed.data.dpp_amount,
                ppn_amount: parsed.data.ppn_amount,
                status: parsed.data.status || "Active",
                notes: parsed.data.notes || null,
                locationId: finalLocationId,
                createdById: session.user.employeeId || null,
            },
            include: {
                customer: true,
                equipment: true,
                vehicle: {
                    include: { category: true }
                },
                operator: true,
                location: true,
            }
        })

        // Update equipment & vehicle status to "Disewa"
        if (targetVehicleId) {
            await prisma.vehicle.update({
                where: { id: targetVehicleId },
                data: { rental_status: "Disewa" }
            }).catch(() => {})
        }
        if (targetEquipmentId) {
            await prisma.masterSewaAlat.update({
                where: { id: targetEquipmentId },
                data: { status: "Disewa" }
            }).catch(() => {})
        }

        revalidatePath("/admin/sewa")
        revalidatePath("/admin/kendaraan")
        return { success: true, sewa: newSewa }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

// ─── Update Sewa Transaction ─────────────────────────────────────────────────

export async function updateSewaTransaction(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !canCreateOrEdit(session.user)) {
        return { success: false, error: "Akses ditolak" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = sewaSchema.safeParse({ ...data, id })

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const existing = await prisma.sewaTransaction.findUnique({ where: { id } })
        if (!existing) return { success: false, error: "Transaksi tidak ditemukan" }

        const startDate = new Date(parsed.data.start_date)
        const endDate = new Date(parsed.data.end_date)

        // Resolve Vehicle and MasterSewaAlat IDs for dual association
        let targetVehicleId: string | null = null
        let targetEquipmentId: string | null = null

        const vehicle = await prisma.vehicle.findUnique({
            where: { id: parsed.data.equipmentId },
            include: { category: true }
        })

        if (vehicle) {
            targetVehicleId = vehicle.id
            const m = await prisma.masterSewaAlat.findUnique({ where: { kode_alat: vehicle.code } })
            targetEquipmentId = m?.id || null
        } else {
            const m = await prisma.masterSewaAlat.findUnique({ where: { id: parsed.data.equipmentId } })
            if (m) {
                targetEquipmentId = m.id
                const veh = await prisma.vehicle.findFirst({ where: { code: m.kode_alat } })
                if (veh) targetVehicleId = veh.id
            }
        }

        const updated = await prisma.sewaTransaction.update({
            where: { id },
            data: {
                customerId: parsed.data.customerId,
                projectId: parsed.data.projectId || null,
                lokasi_proyek: parsed.data.lokasi_proyek || null,
                equipmentId: targetEquipmentId || existing.equipmentId,
                vehicleId: targetVehicleId || existing.vehicleId,
                operatorId: parsed.data.operatorId,
                date_mode: parsed.data.date_mode,
                start_date: startDate,
                end_date: endDate,
                rental_dates: parsed.data.rental_dates,
                total_days: parsed.data.total_days,
                price_per_day: parsed.data.price_per_day,
                total_price: parsed.data.total_price,
                is_ppn: parsed.data.is_ppn,
                ppn_mode: parsed.data.ppn_mode,
                ppn_rate: parsed.data.ppn_rate,
                dpp_amount: parsed.data.dpp_amount,
                ppn_amount: parsed.data.ppn_amount,
                status: parsed.data.status || existing.status,
                notes: parsed.data.notes || null,
            }
        })

        revalidatePath("/admin/sewa")
        revalidatePath("/admin/kendaraan")
        return { success: true, sewa: updated }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

// ─── Update Status & Delete Sewa ──────────────────────────────────────────────

export async function updateSewaStatus(id: string, status: string) {
    const session = await auth()
    if (!session?.user || !canCreateOrEdit(session.user)) {
        return { success: false, error: "Akses ditolak" }
    }

    try {
        const existing = await prisma.sewaTransaction.findUnique({ where: { id } })
        if (!existing) return { success: false, error: "Transaksi tidak ditemukan" }

        await prisma.sewaTransaction.update({
            where: { id },
            data: { status }
        })

        // Free up or engage equipment & vehicle status
        const isFree = ["Completed", "Cancelled"].includes(status)
        const newStatus = isFree ? "Tersedia" : "Disewa"

        if (existing.vehicleId) {
            await prisma.vehicle.update({
                where: { id: existing.vehicleId },
                data: { rental_status: newStatus }
            }).catch(() => {})
        }
        if (existing.equipmentId) {
            await prisma.masterSewaAlat.update({
                where: { id: existing.equipmentId },
                data: { status: newStatus }
            }).catch(() => {})
        }

        revalidatePath("/admin/sewa")
        revalidatePath("/admin/kendaraan")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteSewaTransaction(id: string) {
    const session = await auth()
    if (!session?.user || !canCreateOrEdit(session.user)) {
        return { success: false, error: "Akses ditolak" }
    }

    try {
        const existing = await prisma.sewaTransaction.findUnique({ where: { id } })
        if (!existing) return { success: false, error: "Transaksi tidak ditemukan" }

        await prisma.sewaTransaction.delete({ where: { id } })

        // Free up equipment & vehicle
        if (existing.vehicleId) {
            await prisma.vehicle.update({
                where: { id: existing.vehicleId },
                data: { rental_status: "Tersedia" }
            }).catch(() => {})
        }
        if (existing.equipmentId) {
            await prisma.masterSewaAlat.update({
                where: { id: existing.equipmentId },
                data: { status: "Tersedia" }
            }).catch(() => {})
        }

        revalidatePath("/admin/sewa")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

// ─── Master Sewa Alat Actions ────────────────────────────────────────────────

const masterAlatSchema = z.object({
    id: z.string().optional(),
    kode_alat: z.string().min(1, "Kode alat wajib diisi"),
    nama_alat: z.string().min(1, "Nama alat wajib diisi"),
    kategori: z.string().min(1, "Kategori wajib diisi"),
    merk_model: z.string().optional().nullable(),
    nomor_seri_plat: z.string().optional().nullable(),
    default_day_rate: z.coerce.number().min(0).default(0),
    status: z.enum(["Tersedia", "Disewa", "Maintenance", "Nonaktif"]).default("Tersedia"),
    keterangan: z.string().optional().nullable(),
    locationId: z.preprocess(v => (v === "" || v === "ALL" ? null : v), z.string().nullable().optional()),
})

export async function getMasterSewaAlat() {
    const session = await auth()
    if (!session?.user) return []

    const isCorp = isCorporate(session.user)
    const filter = isCorp ? {} : {
        OR: [
            { locationId: null },
            { locationId: session.user.locationId }
        ]
    }

    return await prisma.masterSewaAlat.findMany({
        where: filter,
        include: {
            location: true,
            _count: { select: { transactions: true } }
        },
        orderBy: [{ status: "asc" }, { nama_alat: "asc" }]
    })
}

export async function createMasterSewaAlat(formData: FormData) {
    const session = await auth()
    if (!session?.user || !canCreateOrEdit(session.user)) {
        return { success: false, error: "Akses ditolak" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = masterAlatSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const cleanCode = parsed.data.kode_alat.trim().toUpperCase()
        const existing = await prisma.masterSewaAlat.findUnique({
            where: { kode_alat: cleanCode }
        })
        if (existing) {
            return { success: false, error: `Kode alat "${cleanCode}" sudah terdaftar.` }
        }

        const isCorp = isCorporate(session.user)
        const finalLocationId = isCorp ? parsed.data.locationId : (session.user.locationId || null)

        const alat = await prisma.masterSewaAlat.create({
            data: {
                kode_alat: cleanCode,
                nama_alat: parsed.data.nama_alat.trim(),
                kategori: parsed.data.kategori.trim(),
                merk_model: parsed.data.merk_model?.trim() || null,
                nomor_seri_plat: parsed.data.nomor_seri_plat?.trim().toUpperCase() || null,
                default_day_rate: parsed.data.default_day_rate,
                status: parsed.data.status,
                keterangan: parsed.data.keterangan?.trim() || null,
                locationId: finalLocationId || null,
            }
        })

        revalidatePath("/admin/sewa")
        return { success: true, alat }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateMasterSewaAlat(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !canCreateOrEdit(session.user)) {
        return { success: false, error: "Akses ditolak" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = masterAlatSchema.safeParse({ ...data, id })

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const cleanCode = parsed.data.kode_alat.trim().toUpperCase()
        const existingCode = await prisma.masterSewaAlat.findFirst({
            where: {
                kode_alat: cleanCode,
                NOT: { id }
            }
        })
        if (existingCode) {
            return { success: false, error: `Kode alat "${cleanCode}" sudah digunakan unit lain.` }
        }

        const isCorp = isCorporate(session.user)
        const finalLocationId = isCorp ? parsed.data.locationId : (session.user.locationId || null)

        const alat = await prisma.masterSewaAlat.update({
            where: { id },
            data: {
                kode_alat: cleanCode,
                nama_alat: parsed.data.nama_alat.trim(),
                kategori: parsed.data.kategori.trim(),
                merk_model: parsed.data.merk_model?.trim() || null,
                nomor_seri_plat: parsed.data.nomor_seri_plat?.trim().toUpperCase() || null,
                default_day_rate: parsed.data.default_day_rate,
                status: parsed.data.status,
                keterangan: parsed.data.keterangan?.trim() || null,
                locationId: finalLocationId || null,
            }
        })

        revalidatePath("/admin/sewa")
        return { success: true, alat }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteMasterSewaAlat(id: string) {
    const session = await auth()
    if (!session?.user || !canCreateOrEdit(session.user)) {
        return { success: false, error: "Akses ditolak" }
    }

    try {
        const count = await prisma.sewaTransaction.count({ where: { equipmentId: id } })
        if (count > 0) {
            return {
                success: false,
                error: `Alat tidak dapat dihapus karena sudah memiliki ${count} riwayat transaksi sewa. Anda dapat mengubah statusnya menjadi "Nonaktif".`
            }
        }

        await prisma.masterSewaAlat.delete({ where: { id } })
        revalidatePath("/admin/sewa")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
