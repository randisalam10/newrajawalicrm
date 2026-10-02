"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"
import { isCorporateUser } from "@/lib/rbac"

const fixedCostSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama kontrak / biaya wajib diisi"),
    category: z.string().min(1, "Kategori biaya wajib dipilih").default("SEWA_TANAH"),
    vendor_name: z.preprocess(val => (val === "" || val === undefined ? null : val), z.string().nullable().optional()),
    contract_number: z.preprocess(val => (val === "" || val === undefined ? null : val), z.string().nullable().optional()),
    total_amount: z.preprocess(val => Number(val || 0), z.number().min(0, "Total nilai kontrak harus >= 0")),
    start_date: z.string().min(1, "Tanggal mulai periode wajib diisi"),
    end_date: z.string().min(1, "Tanggal berakhir periode wajib diisi"),
    duration_months: z.preprocess(val => (val ? Number(val) : null), z.number().nullable().optional()),
    monthly_amount: z.preprocess(val => (val ? Number(val) : null), z.number().nullable().optional()),
    payment_status: z.string().default("LUNAS"),
    notes: z.preprocess(val => (val === "" || val === undefined ? null : val), z.string().nullable().optional()),
    locationId: z.preprocess(val => (val === "" || val === "all" || val === undefined ? null : val), z.string().nullable().optional()),
    isActive: z.preprocess(val => val === "true" || val === true || val === "on", z.boolean()).default(true)
})

export async function canManageFixedCosts(user: any): Promise<boolean> {
    if (!user) return false
    if (user.role === "SuperAdminBP") return true
    if (user.role === "AdminBP") return true
    if (["CEO", "FVP", "Approver"].includes(user.role)) return false

    const perms: string[] = user.permissions || []
    return (
        perms.includes("MASTER_DATA_CREATE") ||
        perms.includes("MASTER_DATA_EDIT") ||
        perms.includes("RBL_CREATE") ||
        perms.includes("RBL_EDIT")
    )
}

function calculateDurationAndMonthly(startDateStr: string, endDateStr: string, totalAmount: number, overrideMonths?: number | null) {
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)

    let months = overrideMonths && overrideMonths > 0 ? overrideMonths : 0
    if (!months && !isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        months = Math.max(1, Math.round(diffDays / 30.4375))
    } else if (!months) {
        months = 12
    }

    const monthly = months > 0 ? Math.round(totalAmount / months) : totalAmount
    return { months, monthly }
}

export async function getFixedCostContracts(filterLocationId?: string) {
    const session = await auth()
    if (!session?.user) return []

    const isCorp = isCorporateUser(session.user)
    const activeLocId = isCorp ? filterLocationId : session.user.locationId

    const whereClause: any = {}
    if (activeLocId && activeLocId !== "all") {
        whereClause.OR = [
            { locationId: activeLocId },
            { locationId: null } // Include HO / shared corporate items
        ]
    }

    if ((prisma as any).fixedCostContract?.findMany) {
        return await (prisma as any).fixedCostContract.findMany({
            where: whereClause,
            include: { location: true },
            orderBy: [{ isActive: "desc" }, { start_date: "desc" }]
        })
    }

    // Fallback via raw SQL if running instance hasn't reloaded PrismaClient
    try {
        let rows: any[] = []
        if (activeLocId && activeLocId !== "all") {
            rows = await prisma.$queryRawUnsafe(`
                SELECT f.*, l.name as "location_name"
                FROM "FixedCostContract" f
                LEFT JOIN "Location" l ON f."locationId" = l.id
                WHERE f."locationId" = $1 OR f."locationId" IS NULL
                ORDER BY f."isActive" DESC, f."start_date" DESC
            `, activeLocId)
        } else {
            rows = await prisma.$queryRawUnsafe(`
                SELECT f.*, l.name as "location_name"
                FROM "FixedCostContract" f
                LEFT JOIN "Location" l ON f."locationId" = l.id
                ORDER BY f."isActive" DESC, f."start_date" DESC
            `)
        }

        return rows.map((r: any) => ({
            ...r,
            location: r.location_name ? { id: r.locationId, name: r.location_name } : null
        }))
    } catch (e: any) {
        console.error("Error in getFixedCostContracts fallback:", e)
        return []
    }
}

export async function createFixedCostContract(formData: FormData) {
    const session = await auth()
    if (!session?.user || !(await canManageFixedCosts(session.user))) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data beban tetap & kontrak" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = fixedCostSchema.safeParse(data)

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const { start_date, end_date, total_amount, duration_months, monthly_amount, ...rest } = parsed.data
        const { months, monthly } = calculateDurationAndMonthly(start_date, end_date, total_amount, duration_months)
        const finalMonthly = monthly_amount && monthly_amount > 0 ? monthly_amount : monthly

        if ((prisma as any).fixedCostContract?.create) {
            const created = await (prisma as any).fixedCostContract.create({
                data: {
                    ...rest,
                    total_amount,
                    start_date: new Date(start_date),
                    end_date: new Date(end_date),
                    duration_months: months,
                    monthly_amount: finalMonthly
                }
            })
            revalidatePath("/admin/fixed-costs")
            revalidatePath("/admin/reports/monthly-management")
            return { success: true, data: created }
        }

        // Fallback raw SQL
        const id = require("crypto").randomUUID()
        await prisma.$executeRawUnsafe(`
            INSERT INTO "FixedCostContract" (
                "id", "name", "category", "vendor_name", "contract_number", "total_amount",
                "start_date", "end_date", "duration_months", "monthly_amount", "payment_status",
                "notes", "isActive", "locationId", "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
        `, id, rest.name, rest.category, rest.vendor_name || null, rest.contract_number || null,
           total_amount, new Date(start_date), new Date(end_date), months, finalMonthly,
           rest.payment_status || "LUNAS", rest.notes || null, rest.locationId || null)

        revalidatePath("/admin/fixed-costs")
        revalidatePath("/admin/reports/monthly-management")
        return {
            success: true,
            data: {
                id,
                name: rest.name,
                category: rest.category,
                vendor_name: rest.vendor_name || null,
                contract_number: rest.contract_number || null,
                total_amount,
                start_date: new Date(start_date).toISOString(),
                end_date: new Date(end_date).toISOString(),
                duration_months: months,
                monthly_amount: finalMonthly,
                payment_status: rest.payment_status || "LUNAS",
                notes: rest.notes || null,
                locationId: rest.locationId || null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateFixedCostContract(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user || !(await canManageFixedCosts(session.user))) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengelola data beban tetap & kontrak" }
    }

    const data = Object.fromEntries(formData.entries())
    const parsed = fixedCostSchema.safeParse({ ...data, id })

    if (!parsed.success) {
        return { success: false, error: parsed.error.format() }
    }

    try {
        const { start_date, end_date, total_amount, duration_months, monthly_amount, ...rest } = parsed.data
        const { months, monthly } = calculateDurationAndMonthly(start_date, end_date, total_amount, duration_months)
        const finalMonthly = monthly_amount && monthly_amount > 0 ? monthly_amount : monthly

        if ((prisma as any).fixedCostContract?.update) {
            const updated = await (prisma as any).fixedCostContract.update({
                where: { id },
                data: {
                    ...rest,
                    total_amount,
                    start_date: new Date(start_date),
                    end_date: new Date(end_date),
                    duration_months: months,
                    monthly_amount: finalMonthly
                }
            })
            revalidatePath("/admin/fixed-costs")
            revalidatePath("/admin/reports/monthly-management")
            return { success: true, data: updated }
        }

        // Fallback raw SQL
        await prisma.$executeRawUnsafe(`
            UPDATE "FixedCostContract" SET
                "name" = $1, "category" = $2, "vendor_name" = $3, "contract_number" = $4,
                "total_amount" = $5, "start_date" = $6, "end_date" = $7, "duration_months" = $8,
                "monthly_amount" = $9, "payment_status" = $10, "notes" = $11, "locationId" = $12,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "id" = $13
        `, rest.name, rest.category, rest.vendor_name || null, rest.contract_number || null,
           total_amount, new Date(start_date), new Date(end_date), months, finalMonthly,
           rest.payment_status || "LUNAS", rest.notes || null, rest.locationId || null, id)

        revalidatePath("/admin/fixed-costs")
        revalidatePath("/admin/reports/monthly-management")
        return {
            success: true,
            data: {
                id,
                name: rest.name,
                category: rest.category,
                vendor_name: rest.vendor_name || null,
                contract_number: rest.contract_number || null,
                total_amount,
                start_date: new Date(start_date).toISOString(),
                end_date: new Date(end_date).toISOString(),
                duration_months: months,
                monthly_amount: finalMonthly,
                payment_status: rest.payment_status || "LUNAS",
                notes: rest.notes || null,
                locationId: rest.locationId || null,
                isActive: true,
                updatedAt: new Date().toISOString()
            }
        }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteFixedCostContract(id: string) {
    const session = await auth()
    if (!session?.user || !(await canManageFixedCosts(session.user))) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin menghapus kontrak ini" }
    }

    try {
        if ((prisma as any).fixedCostContract?.delete) {
            await (prisma as any).fixedCostContract.delete({ where: { id } })
        } else {
            await prisma.$executeRawUnsafe(`DELETE FROM "FixedCostContract" WHERE "id" = $1`, id)
        }
        revalidatePath("/admin/fixed-costs")
        revalidatePath("/admin/reports/monthly-management")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function toggleFixedCostContractStatus(id: string) {
    const session = await auth()
    if (!session?.user || !(await canManageFixedCosts(session.user))) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengubah status kontrak" }
    }

    try {
        if ((prisma as any).fixedCostContract?.findUnique) {
            const existing = await (prisma as any).fixedCostContract.findUnique({ where: { id } })
            if (!existing) return { success: false, error: "Kontrak tidak ditemukan" }

            await (prisma as any).fixedCostContract.update({
                where: { id },
                data: { isActive: !existing.isActive }
            })
        } else {
            await prisma.$executeRawUnsafe(`
                UPDATE "FixedCostContract" SET "isActive" = NOT "isActive", "updatedAt" = CURRENT_TIMESTAMP
                WHERE "id" = $1
            `, id)
        }

        revalidatePath("/admin/fixed-costs")
        revalidatePath("/admin/reports/monthly-management")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function getOperationalTargetSetting(filterLocationId?: string | null) {
    const targetLoc = (!filterLocationId || filterLocationId === "all") ? null : filterLocationId

    // Try finding specific branch target first if targetLoc is specified
    if (targetLoc) {
        try {
            if ((prisma as any).operationalTargetSetting?.findFirst) {
                const branchTarget = await (prisma as any).operationalTargetSetting.findFirst({
                    where: { locationId: targetLoc }
                })
                if (branchTarget) return branchTarget
            } else {
                const rows: any[] = await prisma.$queryRawUnsafe(`
                    SELECT * FROM "OperationalTargetSetting" WHERE "locationId" = $1 LIMIT 1
                `, targetLoc)
                if (rows.length > 0) return rows[0]
            }
        } catch (e) {
            console.error("Error fetching branch operational target setting:", e)
        }
    }

    // Try finding global/HQ target (locationId IS NULL)
    try {
        if ((prisma as any).operationalTargetSetting?.findFirst) {
            const globalTarget = await (prisma as any).operationalTargetSetting.findFirst({
                where: { locationId: null }
            })
            if (globalTarget) return globalTarget
        } else {
            const rows: any[] = await prisma.$queryRawUnsafe(`
                SELECT * FROM "OperationalTargetSetting" WHERE "locationId" IS NULL LIMIT 1
            `)
            if (rows.length > 0) return rows[0]
        }
    } catch (e) {
        console.error("Error fetching global operational target setting:", e)
    }

    // Sesuai Aturan Zero Guesswork: Tidak ada target fiktif/asumsi jika belum diatur manajemen
    return {
        id: undefined,
        name: "Target Belum Ditetapkan",
        target_monthly_volume: null,
        target_branch_volume: null,
        target_asp: null,
        target_semen_cost: null,
        target_pasir_cost: null,
        target_split_cost: null,
        target_solar_cost: null,
        target_retase_cost: null,
        target_maintenance_cost: null,
        target_other_cogs: null,
        target_cogs: null,
        target_gross_profit: null,
        label_asp: null,
        label_semen: null,
        label_pasir: null,
        label_split: null,
        label_solar: null,
        label_retase: null,
        label_maintenance: null,
        label_other: null,
        label_cogs: null,
        label_gross_profit: null,
        locationId: targetLoc,
        isConfigured: false
    }
}

export async function saveOperationalTargetSetting(payload: any) {
    const session = await auth()
    if (!session?.user || !(await canManageFixedCosts(session.user))) {
        return { success: false, error: "Akses ditolak: Anda tidak memiliki izin mengatur standar target" }
    }

    try {
        const locationId = (!payload.locationId || payload.locationId === "all") ? null : payload.locationId
        const target_monthly_volume = Number(payload.target_monthly_volume || 5000)
        const target_branch_volume = Number(payload.target_branch_volume || 2000)
        const target_asp = Number(payload.target_asp || 835000)
        const target_semen_cost = Number(payload.target_semen_cost || 0)
        const target_pasir_cost = Number(payload.target_pasir_cost || 0)
        const target_split_cost = Number(payload.target_split_cost || 0)
        const target_solar_cost = Number(payload.target_solar_cost || 0)
        const target_retase_cost = Number(payload.target_retase_cost || 0)
        const target_maintenance_cost = Number(payload.target_maintenance_cost || 0)
        const target_other_cogs = Number(payload.target_other_cogs || 0)

        // Rumus COGS & Gross Profit
        const target_cogs = target_semen_cost + target_pasir_cost + target_split_cost + target_solar_cost + target_retase_cost + target_maintenance_cost + target_other_cogs
        const target_gross_profit = target_asp - target_cogs

        const dataToSave = {
            name: payload.name || "Standar Target Operasional",
            target_monthly_volume,
            target_branch_volume,
            target_asp,
            target_semen_cost,
            target_pasir_cost,
            target_split_cost,
            target_solar_cost,
            target_retase_cost,
            target_maintenance_cost,
            target_other_cogs,
            target_cogs,
            target_gross_profit,
            label_asp: payload.label_asp || "Harga Jual Pasar",
            label_semen: payload.label_semen || "Standar SNI",
            label_pasir: payload.label_pasir || "On Target",
            label_split: payload.label_split || "Efisiensi Crushing Quarry",
            label_solar: payload.label_solar || "Tergantung radius jobsite",
            label_retase: payload.label_retase || "On Target Sesuai KM",
            label_maintenance: payload.label_maintenance || "Maintenance Rutin",
            label_other: payload.label_other || "Input Manual COGS",
            label_cogs: payload.label_cogs || "Biaya Standar Operasional",
            label_gross_profit: payload.label_gross_profit || "Margin Bersih Sehat",
            locationId,
            updatedAt: new Date()
        }

        // Check existing record by ID or locationId
        let existingId = payload.id

        if (!existingId) {
            try {
                if ((prisma as any).operationalTargetSetting?.findFirst) {
                    const found = await (prisma as any).operationalTargetSetting.findFirst({
                        where: locationId ? { locationId } : { locationId: null }
                    })
                    if (found) existingId = found.id
                } else {
                    const rows: any[] = locationId
                        ? await prisma.$queryRawUnsafe(`SELECT id FROM "OperationalTargetSetting" WHERE "locationId" = $1 LIMIT 1`, locationId)
                        : await prisma.$queryRawUnsafe(`SELECT id FROM "OperationalTargetSetting" WHERE "locationId" IS NULL LIMIT 1`)
                    if (rows.length > 0) existingId = rows[0].id
                }
            } catch (err) {
                console.error("Error looking up existing target:", err)
            }
        }

        if (existingId) {
            if ((prisma as any).operationalTargetSetting?.update) {
                await (prisma as any).operationalTargetSetting.update({
                    where: { id: existingId },
                    data: dataToSave
                })
            } else {
                await prisma.$executeRawUnsafe(`
                    UPDATE "OperationalTargetSetting" SET
                        "name" = $1,
                        "target_monthly_volume" = $2,
                        "target_branch_volume" = $3,
                        "target_asp" = $4,
                        "target_semen_cost" = $5,
                        "target_pasir_cost" = $6,
                        "target_split_cost" = $7,
                        "target_solar_cost" = $8,
                        "target_retase_cost" = $9,
                        "target_maintenance_cost" = $10,
                        "target_other_cogs" = $11,
                        "target_cogs" = $12,
                        "target_gross_profit" = $13,
                        "label_asp" = $14,
                        "label_semen" = $15,
                        "label_pasir" = $16,
                        "label_split" = $17,
                        "label_solar" = $18,
                        "label_retase" = $19,
                        "label_maintenance" = $20,
                        "label_other" = $21,
                        "label_cogs" = $22,
                        "label_gross_profit" = $23,
                        "locationId" = $24,
                        "updatedAt" = CURRENT_TIMESTAMP
                    WHERE "id" = $25
                `,
                    dataToSave.name,
                    dataToSave.target_monthly_volume,
                    dataToSave.target_branch_volume,
                    dataToSave.target_asp,
                    dataToSave.target_semen_cost,
                    dataToSave.target_pasir_cost,
                    dataToSave.target_split_cost,
                    dataToSave.target_solar_cost,
                    dataToSave.target_retase_cost,
                    dataToSave.target_maintenance_cost,
                    dataToSave.target_other_cogs,
                    dataToSave.target_cogs,
                    dataToSave.target_gross_profit,
                    dataToSave.label_asp,
                    dataToSave.label_semen,
                    dataToSave.label_pasir,
                    dataToSave.label_split,
                    dataToSave.label_solar,
                    dataToSave.label_retase,
                    dataToSave.label_maintenance,
                    dataToSave.label_other,
                    dataToSave.label_cogs,
                    dataToSave.label_gross_profit,
                    dataToSave.locationId,
                    existingId
                )
            }
        } else {
            const newId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2)
            if ((prisma as any).operationalTargetSetting?.create) {
                await (prisma as any).operationalTargetSetting.create({
                    data: { ...dataToSave, id: newId }
                })
            } else {
                await prisma.$executeRawUnsafe(`
                    INSERT INTO "OperationalTargetSetting" (
                        "id", "name", "target_monthly_volume", "target_branch_volume",
                        "target_asp", "target_semen_cost", "target_pasir_cost", "target_split_cost",
                        "target_solar_cost", "target_retase_cost", "target_maintenance_cost",
                        "target_other_cogs", "target_cogs", "target_gross_profit",
                        "label_asp", "label_semen", "label_pasir", "label_split",
                        "label_solar", "label_retase", "label_maintenance", "label_other",
                        "label_cogs", "label_gross_profit", "locationId", "createdAt", "updatedAt"
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    )
                `,
                    newId,
                    dataToSave.name,
                    dataToSave.target_monthly_volume,
                    dataToSave.target_branch_volume,
                    dataToSave.target_asp,
                    dataToSave.target_semen_cost,
                    dataToSave.target_pasir_cost,
                    dataToSave.target_split_cost,
                    dataToSave.target_solar_cost,
                    dataToSave.target_retase_cost,
                    dataToSave.target_maintenance_cost,
                    dataToSave.target_other_cogs,
                    dataToSave.target_cogs,
                    dataToSave.target_gross_profit,
                    dataToSave.label_asp,
                    dataToSave.label_semen,
                    dataToSave.label_pasir,
                    dataToSave.label_split,
                    dataToSave.label_solar,
                    dataToSave.label_retase,
                    dataToSave.label_maintenance,
                    dataToSave.label_other,
                    dataToSave.label_cogs,
                    dataToSave.label_gross_profit,
                    dataToSave.locationId
                )
            }
        }

        revalidatePath("/admin/fixed-costs")
        revalidatePath("/admin/reports/monthly-management")
        revalidatePath("/admin")
        return { success: true }
    } catch (e: any) {
        console.error("saveOperationalTargetSetting error:", e)
        return { success: false, error: e.message }
    }
}

