"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

// ─── Helpers & Permission Guards ──────────────────────────────────────────────
function isCorporateOrSuperAdmin(session: any): boolean {
    if (!session?.user) return false
    return session.user.role === "SuperAdminBP" ||
        session.user.roleScope === "ALL_BRANCHES" ||
        ["CEO", "FVP"].includes(session.user.role || "")
}

function getTargetLocationId(session: any, requestedLocationId?: string): string {
    const isCorp = isCorporateOrSuperAdmin(session)
    if (isCorp && requestedLocationId && requestedLocationId !== "all") {
        return requestedLocationId
    }
    return session.user.locationId || ""
}

function getLocationCode(name: string): string {
    const clean = name.replace(/^(cabang|bp|batching\s*plant)\s*/i, "").trim()
    return clean.slice(0, 3).toUpperCase() || "CAB"
}

// ─── Read Actions ─────────────────────────────────────────────────────────────

export async function getRblVehicles() {
    const vehicles = await prisma.vehicle.findMany({
        include: {
            location: true,
            category: true,
            rblExpenses: {
                where: { kmMeter: { not: null, gt: 0 } },
                orderBy: [{ date: "desc" }, { createdAt: "desc" }],
                take: 1,
                select: {
                    kmMeter: true,
                    date: true,
                    itemDescription: true,
                    receiptNo: true
                }
            },
            poItems: {
                where: {
                    km_hm: { not: null },
                    purchaseOrder: { status: { not: "CANCELLED" } }
                },
                orderBy: { purchaseOrder: { tanggal_terbit: "desc" } },
                take: 1,
                select: {
                    km_hm: true,
                    purchaseOrder: {
                        select: {
                            po_number: true,
                            tanggal_terbit: true
                        }
                    },
                    masterItem: {
                        select: { name: true }
                    }
                }
            }
        },
        orderBy: [{ location: { name: "asc" } }, { code: "asc" }]
    })

    return vehicles.map(v => {
        const lastRbl = v.rblExpenses[0]
        const lastPo = v.poItems?.[0]

        let rblKm: number | null = lastRbl?.kmMeter ?? null
        let rblDate: Date | null = lastRbl?.date ?? null
        let rblDesc = lastRbl ? `RBL: ${lastRbl.itemDescription || 'Pengeluaran'}` : null

        let poKm: number | null = null
        let poDate: Date | null = lastPo?.purchaseOrder?.tanggal_terbit ?? null
        let poDesc: string | null = null
        if (lastPo?.km_hm) {
            const parsed = parseFloat(String(lastPo.km_hm).replace(/[^0-9.]/g, ''))
            if (!isNaN(parsed) && parsed > 0) {
                poKm = parsed
                poDesc = `PO ${lastPo.purchaseOrder?.po_number || ''}: ${lastPo.masterItem?.name || 'Sparepart'}`
            }
        }

        let lastKmMeter: number | null = null
        let lastKmDate: Date | null = null
        let lastKmDescription: string | null = null
        let lastKmSource: "RBL" | "PO" | null = null

        if (rblKm !== null && poKm !== null) {
            const rblTime = rblDate ? new Date(rblDate).getTime() : 0
            const poTime = poDate ? new Date(poDate).getTime() : 0
            if (poTime >= rblTime || poKm > rblKm) {
                lastKmMeter = Math.max(poKm, rblKm)
                lastKmDate = poTime >= rblTime ? poDate : rblDate
                lastKmDescription = poTime >= rblTime ? poDesc : rblDesc
                lastKmSource = poKm >= rblKm ? "PO" : "RBL"
            } else {
                lastKmMeter = rblKm
                lastKmDate = rblDate
                lastKmDescription = rblDesc
                lastKmSource = "RBL"
            }
        } else if (poKm !== null) {
            lastKmMeter = poKm
            lastKmDate = poDate
            lastKmDescription = poDesc
            lastKmSource = "PO"
        } else if (rblKm !== null) {
            lastKmMeter = rblKm
            lastKmDate = rblDate
            lastKmDescription = rblDesc
            lastKmSource = "RBL"
        }

        return {
            ...v,
            lastKmMeter,
            lastKmDate,
            lastKmDescription,
            lastKmSource
        }
    })
}

async function fetchBudgetAuditLogs(budgetId: string) {
    try {
        const logs = await prisma.auditLog.findMany({
            where: {
                entity: "RblBudget",
                recordId: budgetId,
            },
            include: {
                user: {
                    select: {
                        username: true,
                        employee: { select: { name: true } }
                    }
                }
            },
            orderBy: { timestamp: "desc" }
        })

        return logs.map(log => {
            let oldVals: any = null
            let newVals: any = null
            try { oldVals = log.old_values ? JSON.parse(log.old_values) : null } catch {}
            try { newVals = log.new_values ? JSON.parse(log.new_values) : null } catch {}
            return {
                id: log.id,
                action: log.action,
                timestamp: log.timestamp,
                userName: log.user?.employee?.name || log.user?.username || "Admin",
                oldValues: oldVals,
                newValues: newVals,
                editReason: newVals?.editReason || null,
            }
        })
    } catch (e) {
        console.error("Failed to fetch audit logs for budget:", budgetId, e)
        return []
    }
}

export async function getActiveBudget(locationId?: string) {
    const session = await auth()
    if (!session?.user) return null

    const isCorp = isCorporateOrSuperAdmin(session)
    let targetLocId = getTargetLocationId(session, locationId)
    if (!targetLocId && isCorp) {
        const firstLoc = await prisma.location.findFirst({ orderBy: { name: "asc" } })
        targetLocId = firstLoc?.id || ""
    }
    if (!targetLocId) return null

    const budget = await prisma.rblBudget.findFirst({
        where: {
            locationId: targetLocId,
            status: "OPEN",
        },
        include: {
            location: true,
            createdBy: {
                select: { username: true, employee: { select: { name: true } } }
            },
            expenses: {
                orderBy: [{ date: "asc" }, { createdAt: "asc" }],
                include: {
                    createdBy: { select: { username: true, employee: { select: { name: true } } } },
                    vehicle: { select: { id: true, code: true, plate_number: true, vehicle_type: true, category: true } },
                    categoryRef: true
                }
            },
            attachments: {
                orderBy: { createdAt: "desc" },
                include: {
                    uploadedBy: { select: { username: true, employee: { select: { name: true } } } }
                }
            }
        }
    })

    if (!budget) return null

    const totalExpense = budget.expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const remainingBalance = budget.amount - totalExpense
    const auditLogs = await fetchBudgetAuditLogs(budget.id)

    return {
        ...budget,
        totalExpense,
        remainingBalance,
        auditLogs,
    }
}

export async function getBudgetHistory(filters: { locationId?: string; year?: number } = {}) {
    const session = await auth()
    if (!session?.user) return []

    const isCorp = isCorporateOrSuperAdmin(session)
    const targetLocId = isCorp
        ? (filters.locationId && filters.locationId !== "all" ? filters.locationId : undefined)
        : (session.user.locationId || undefined)

    const currentYear = filters.year || new Date().getFullYear()

    const budgets = await prisma.rblBudget.findMany({
        where: {
            ...(targetLocId ? { locationId: targetLocId } : {}),
            periodYear: currentYear,
        },
        include: {
            location: true,
            createdBy: { select: { username: true, employee: { select: { name: true } } } },
            closedBy: { select: { username: true, employee: { select: { name: true } } } },
            expenses: {
                select: { id: true, amount: true }
            },
            _count: {
                select: { expenses: true, attachments: true }
            }
        },
        orderBy: [
            { periodYear: "desc" },
            { periodMonth: "desc" },
            { createdAt: "desc" }
        ]
    })

    return budgets.map(b => {
        const totalExpense = b.expenses.reduce((sum, exp) => sum + exp.amount, 0)
        const remainingBalance = b.amount - totalExpense
        return {
            ...b,
            totalExpense,
            remainingBalance,
        }
    })
}

export async function getBudgetDetail(budgetId: string) {
    const session = await auth()
    if (!session?.user) return null

    const budget = await prisma.rblBudget.findUnique({
        where: { id: budgetId },
        include: {
            location: true,
            createdBy: { select: { username: true, employee: { select: { name: true } } } },
            closedBy: { select: { username: true, employee: { select: { name: true } } } },
            expenses: {
                orderBy: [{ date: "asc" }, { createdAt: "asc" }],
                include: {
                    createdBy: { select: { username: true, employee: { select: { name: true } } } },
                    vehicle: { select: { id: true, code: true, plate_number: true, vehicle_type: true, category: true } },
                    categoryRef: true
                }
            },
            attachments: {
                orderBy: { createdAt: "desc" },
                include: {
                    uploadedBy: { select: { username: true, employee: { select: { name: true } } } }
                }
            }
        }
    })

    if (!budget) return null

    // Enforce branch isolation for non-superadmin / non-corporate
    const isCorp = isCorporateOrSuperAdmin(session)
    if (!isCorp && budget.locationId !== session.user.locationId) {
        return null
    }

    const totalExpense = budget.expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const remainingBalance = budget.amount - totalExpense
    const auditLogs = await fetchBudgetAuditLogs(budget.id)

    return {
        ...budget,
        totalExpense,
        remainingBalance,
        auditLogs,
    }
}

// ─── Write Actions ────────────────────────────────────────────────────────────

export async function createBudget(data: {
    locationId?: string
    periodMonth: number
    periodYear: number
    receivedDate: string
    amount: number
    notes?: string
}) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const targetLocId = getTargetLocationId(session, data.locationId)
    if (!targetLocId) {
        return { success: false, error: "Cabang tidak valid atau belum ditentukan." }
    }

    if (!data.amount || data.amount <= 0) {
        return { success: false, error: "Nominal budget harus lebih dari 0." }
    }

    try {
        // 1. Single Active Budget Constraint per Branch
        const existingOpen = await prisma.rblBudget.findFirst({
            where: {
                locationId: targetLocId,
                status: "OPEN",
            },
            include: { location: true }
        })

        if (existingOpen) {
            return {
                success: false,
                error: `Cabang ${existingOpen.location.name} masih memiliki Budget aktif yang belum ditutup (Kode: ${existingOpen.code}, Bulan: ${existingOpen.periodMonth}/${existingOpen.periodYear}). Silakan lakukan Tutup Buku terlebih dahulu sebelum membuka budget periode baru.`
            }
        }

        // 2. Generate unique code
        const loc = await prisma.location.findUnique({ where: { id: targetLocId } })
        const locCode = getLocationCode(loc?.name || "CAB")
        const monthStr = String(data.periodMonth).padStart(2, "0")
        const baseCode = `RBL-${locCode}-${data.periodYear}-${monthStr}`

        let finalCode = baseCode
        const duplicateCount = await prisma.rblBudget.count({
            where: { code: { startsWith: baseCode } }
        })
        if (duplicateCount > 0) {
            finalCode = `${baseCode}-V${duplicateCount + 1}`
        }

        const budget = await prisma.rblBudget.create({
            data: {
                code: finalCode,
                periodMonth: Number(data.periodMonth),
                periodYear: Number(data.periodYear),
                receivedDate: new Date(data.receivedDate),
                amount: Number(data.amount),
                notes: data.notes || null,
                status: "OPEN",
                locationId: targetLocId,
                createdById: session.user.id,
            }
        })

        revalidatePath("/admin/rbl")
        return { success: true, budget }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal membuat budget RBL." }
    }
}

export async function closeBudget(budgetId: string, closeNotes?: string, closedAtDate?: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const budget = await prisma.rblBudget.findUnique({
            where: { id: budgetId },
            include: { expenses: true, location: true }
        })

        if (!budget) return { success: false, error: "Budget RBL tidak ditemukan." }

        // Enforce branch isolation
        const isCorp = isCorporateOrSuperAdmin(session)
        if (!isCorp && budget.locationId !== session.user.locationId) {
            return { success: false, error: "Akses ditolak: Anda tidak dapat menutup budget cabang lain." }
        }

        if (budget.status === "CLOSED") {
            return { success: false, error: "Budget RBL ini sudah ditutup sebelumnya." }
        }

        const totalExpense = budget.expenses.reduce((sum, exp) => sum + exp.amount, 0)
        const balance = budget.amount - totalExpense

        const finalClosedAt = closedAtDate ? new Date(closedAtDate) : new Date()

        await prisma.rblBudget.update({
            where: { id: budgetId },
            data: {
                status: "CLOSED",
                closedAt: finalClosedAt,
                closedById: session.user.id,
                closeNotes: closeNotes || null,
            }
        })

        revalidatePath("/admin/rbl")
        return {
            success: true,
            totalExpense,
            balance,
            statusType: balance > 0 ? "SURPLUS" : balance < 0 ? "DEFICIT" : "BALANCED"
        }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal menutup budget RBL." }
    }
}

export async function updateBudget(
    budgetId: string,
    data: {
        amount: number
        receivedDate: string
        notes?: string
        editReason: string
    }
) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    if (!data.amount || data.amount <= 0) {
        return { success: false, error: "Nominal budget harus lebih dari 0." }
    }
    if (!data.receivedDate) {
        return { success: false, error: "Tanggal penerimaan dana wajib diisi." }
    }
    if (!data.editReason || !data.editReason.trim()) {
        return { success: false, error: "Alasan perubahan budget wajib diisi untuk catatan riwayat audit." }
    }

    try {
        const budget = await prisma.rblBudget.findUnique({
            where: { id: budgetId },
            include: { location: true }
        })

        if (!budget) return { success: false, error: "Budget RBL tidak ditemukan." }

        // Enforce branch isolation
        const isCorp = isCorporateOrSuperAdmin(session)
        if (!isCorp && budget.locationId !== session.user.locationId) {
            return { success: false, error: "Akses ditolak: Anda tidak dapat mengedit budget cabang lain." }
        }

        // Strict rule: CLOSED budget cannot be edited
        if (budget.status === "CLOSED") {
            return {
                success: false,
                error: "Budget RBL ini sudah DITUTUP (CLOSED). Budget yang telah ditutup tidak dapat diedit kembali."
            }
        }

        const oldValues = {
            amount: budget.amount,
            receivedDate: budget.receivedDate ? budget.receivedDate.toISOString() : null,
            notes: budget.notes || "",
        }

        const newReceivedDate = new Date(data.receivedDate)
        const newValues = {
            amount: Number(data.amount),
            receivedDate: newReceivedDate.toISOString(),
            notes: data.notes ? data.notes.trim() : "",
            editReason: data.editReason.trim(),
        }

        // Simpan snapshot perubahan ke AuditLog
        await prisma.auditLog.create({
            data: {
                action: "EDIT",
                entity: "RblBudget",
                recordId: budget.id,
                old_values: JSON.stringify(oldValues),
                new_values: JSON.stringify(newValues),
                userId: session.user.id,
            }
        })

        // Update record budget
        const updated = await prisma.rblBudget.update({
            where: { id: budgetId },
            data: {
                amount: Number(data.amount),
                receivedDate: newReceivedDate,
                notes: data.notes ? data.notes.trim() : null,
            }
        })

        revalidatePath("/admin/rbl")
        return { success: true, budget: updated }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal mengupdate budget RBL." }
    }
}

export async function getBudgetAuditHistory(budgetId: string) {
    const session = await auth()
    if (!session?.user) return []
    return fetchBudgetAuditLogs(budgetId)
}

export async function addExpenseBatch(budgetId: string, items: Array<{
    date: string
    itemDescription: string
    category?: string
    categoryId?: string | null
    vehicleId?: string | null
    kmMeter?: number | null
    quantity: number
    unit?: string
    unitPrice: number
    receiptNo?: string
    notes?: string
}>) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    if (!items || items.length === 0) {
        return { success: false, error: "Tidak ada data pengeluaran yang diinput." }
    }

    try {
        const budget = await prisma.rblBudget.findUnique({ where: { id: budgetId } })
        if (!budget) return { success: false, error: "Budget tidak ditemukan." }

        // Enforce branch isolation
        const isCorp = isCorporateOrSuperAdmin(session)
        if (!isCorp && budget.locationId !== session.user.locationId) {
            return { success: false, error: "Akses ditolak." }
        }

        if (budget.status === "CLOSED") {
            return { success: false, error: "Budget sudah DITUTUP (CLOSED). Tidak dapat menambahkan pengeluaran baru." }
        }

        const validItems = items.filter(it => it.itemDescription.trim().length > 0)
        if (validItems.length === 0) {
            return { success: false, error: "Nama Item / Uraian pengeluaran wajib diisi." }
        }

        await prisma.$transaction(
            validItems.map(it => {
                const qty = Number(it.quantity) || 1
                const price = Number(it.unitPrice) || 0
                const totalAmount = qty * price

                return prisma.rblExpense.create({
                    data: {
                        budgetId,
                        date: new Date(it.date),
                        itemDescription: it.itemDescription.trim(),
                        categoryId: it.categoryId || null,
                        category: it.category || "Operasional Umum",
                        vehicleId: it.vehicleId || null,
                        kmMeter: it.kmMeter !== undefined && it.kmMeter !== null && !isNaN(Number(it.kmMeter)) ? Number(it.kmMeter) : null,
                        quantity: qty,
                        unit: it.unit?.trim() || "Pcs",
                        unitPrice: price,
                        amount: totalAmount,
                        receiptNo: it.receiptNo?.trim() || null,
                        notes: it.notes?.trim() || null,
                        createdById: session.user.id,
                    }
                })
            })
        )

        revalidatePath("/admin/rbl")
        return { success: true, count: validItems.length }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal menyimpan pengeluaran." }
    }
}

export async function updateExpense(id: string, data: {
    date: string
    itemDescription: string
    category?: string
    categoryId?: string | null
    vehicleId?: string | null
    kmMeter?: number | null
    quantity: number
    unit?: string
    unitPrice: number
    receiptNo?: string
    notes?: string
}) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const expense = await prisma.rblExpense.findUnique({
            where: { id },
            include: { budget: true }
        })

        if (!expense) return { success: false, error: "Pengeluaran tidak ditemukan." }

        // Enforce branch isolation
        const isCorp = isCorporateOrSuperAdmin(session)
        if (!isCorp && expense.budget.locationId !== session.user.locationId) {
            return { success: false, error: "Akses ditolak." }
        }

        if (expense.budget.status === "CLOSED") {
            return { success: false, error: "Budget sudah ditutup. Tidak dapat mengubah pengeluaran." }
        }

        const qty = Number(data.quantity) || 1
        const price = Number(data.unitPrice) || 0
        const totalAmount = qty * price

        await prisma.rblExpense.update({
            where: { id },
            data: {
                date: new Date(data.date),
                itemDescription: data.itemDescription.trim(),
                categoryId: data.categoryId || null,
                category: data.category || "Operasional Umum",
                vehicleId: data.vehicleId || null,
                kmMeter: data.kmMeter !== undefined && data.kmMeter !== null && !isNaN(Number(data.kmMeter)) ? Number(data.kmMeter) : null,
                quantity: qty,
                unit: data.unit?.trim() || "Pcs",
                unitPrice: price,
                amount: totalAmount,
                receiptNo: data.receiptNo?.trim() || null,
                notes: data.notes?.trim() || null,
            }
        })

        revalidatePath("/admin/rbl")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal mengubah pengeluaran." }
    }
}

// ─── Master Kategori RBL ──────────────────────────────────────────────────────

export async function getRblCategories() {
    const session = await auth()
    if (!session?.user) return []

    return await prisma.rblCategory.findMany({
        orderBy: [
            { isSystem: "desc" },
            { name: "asc" }
        ]
    })
}

export async function createRblCategory(data: {
    name: string
    description?: string
    requireVehicleKm?: boolean
}) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const name = data.name.trim()
    if (!name) return { success: false, error: "Nama kategori tidak boleh kosong." }

    try {
        const existing = await prisma.rblCategory.findFirst({
            where: { name: { equals: name, mode: "insensitive" } }
        })
        if (existing) {
            return { success: false, error: `Kategori "${existing.name}" sudah terdaftar.` }
        }

        const category = await prisma.rblCategory.create({
            data: {
                name,
                description: data.description?.trim() || null,
                requireVehicleKm: Boolean(data.requireVehicleKm),
                isSystem: false,
            }
        })

        revalidatePath("/admin/rbl")
        return { success: true, category }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal membuat kategori baru." }
    }
}

export async function updateRblCategory(id: string, data: {
    name: string
    description?: string
    requireVehicleKm?: boolean
}) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const name = data.name.trim()
    if (!name) return { success: false, error: "Nama kategori tidak boleh kosong." }

    try {
        const existing = await prisma.rblCategory.findUnique({ where: { id } })
        if (!existing) return { success: false, error: "Kategori tidak ditemukan." }

        const dup = await prisma.rblCategory.findFirst({
            where: {
                id: { not: id },
                name: { equals: name, mode: "insensitive" }
            }
        })
        if (dup) {
            return { success: false, error: `Nama kategori "${dup.name}" sudah digunakan.` }
        }

        const category = await prisma.rblCategory.update({
            where: { id },
            data: {
                name,
                description: data.description?.trim() || null,
                requireVehicleKm: Boolean(data.requireVehicleKm),
            }
        })

        revalidatePath("/admin/rbl")
        return { success: true, category }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal memperbarui kategori." }
    }
}

export async function deleteRblCategory(id: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const category = await prisma.rblCategory.findUnique({
            where: { id },
            include: { _count: { select: { expenses: true } } }
        })

        if (!category) return { success: false, error: "Kategori tidak ditemukan." }

        if (category.isSystem) {
            return { success: false, error: "Kategori bawaan sistem tidak dapat dihapus." }
        }

        if (category._count.expenses > 0) {
            return {
                success: false,
                error: `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan pada ${category._count.expenses} transaksi pengeluaran RBL.`
            }
        }

        await prisma.rblCategory.delete({ where: { id } })

        revalidatePath("/admin/rbl")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal menghapus kategori." }
    }
}

export async function deleteExpense(id: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const expense = await prisma.rblExpense.findUnique({
            where: { id },
            include: { budget: true }
        })

        if (!expense) return { success: false, error: "Pengeluaran tidak ditemukan." }

        // Enforce branch isolation
        const isCorp = isCorporateOrSuperAdmin(session)
        if (!isCorp && expense.budget.locationId !== session.user.locationId) {
            return { success: false, error: "Akses ditolak." }
        }

        if (expense.budget.status === "CLOSED") {
            return { success: false, error: "Budget sudah ditutup. Tidak dapat menghapus pengeluaran." }
        }

        await prisma.rblExpense.delete({ where: { id } })

        revalidatePath("/admin/rbl")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal menghapus pengeluaran." }
    }
}

export async function uploadBulkReceipts(budgetId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    const files = formData.getAll("files") as File[]
    if (!files || files.length === 0) {
        return { success: false, error: "Tidak ada file foto nota yang dipilih." }
    }

    try {
        const budget = await prisma.rblBudget.findUnique({ where: { id: budgetId } })
        if (!budget) return { success: false, error: "Budget tidak ditemukan." }

        const isCorp = isCorporateOrSuperAdmin(session)
        if (!isCorp && budget.locationId !== session.user.locationId) {
            return { success: false, error: "Akses ditolak." }
        }

        if (budget.status === "CLOSED") {
            return { success: false, error: "Budget sudah ditutup. Tidak dapat menambah lampiran nota." }
        }

        const uploadDir = join(process.cwd(), "uploads", "rbl", budgetId)
        await mkdir(uploadDir, { recursive: true })

        const uploadedAttachments = []

        for (const file of files) {
            if (!file.name) continue

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            const ext = file.name.split(".").pop() ?? "jpg"
            const uniqueFilename = `nota_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
            const filePath = join(uploadDir, uniqueFilename)

            await writeFile(filePath, buffer)

            const fileUrl = `/api/files/rbl/${budgetId}/${uniqueFilename}`

            const record = await prisma.rblAttachment.create({
                data: {
                    budgetId,
                    fileUrl,
                    fileName: file.name,
                    fileSize: file.size,
                    uploadedById: session.user.id,
                }
            })
            uploadedAttachments.push(record)
        }

        revalidatePath("/admin/rbl")
        return { success: true, count: uploadedAttachments.length }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal mengunggah foto nota." }
    }
}

export async function deleteAttachment(attachmentId: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const attachment = await prisma.rblAttachment.findUnique({
            where: { id: attachmentId },
            include: { budget: true }
        })

        if (!attachment) return { success: false, error: "Lampiran tidak ditemukan." }

        const isCorp = isCorporateOrSuperAdmin(session)
        if (!isCorp && attachment.budget.locationId !== session.user.locationId) {
            return { success: false, error: "Akses ditolak." }
        }

        if (attachment.budget.status === "CLOSED") {
            return { success: false, error: "Budget sudah ditutup. Tidak dapat menghapus foto nota." }
        }

        await prisma.rblAttachment.delete({ where: { id: attachmentId } })

        revalidatePath("/admin/rbl")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Gagal menghapus foto nota." }
    }
}

export async function getRblSummaryData(filters: { locationId?: string; year?: number } = {}) {
    const session = await auth()
    if (!session?.user) return null

    const isCorp = isCorporateOrSuperAdmin(session)
    const currentYear = filters.year || new Date().getFullYear()

    let locationWhere: any = {}
    if (isCorp) {
        if (filters.locationId && filters.locationId !== "all") {
            locationWhere = { id: filters.locationId }
        }
    } else if (session.user.locationId) {
        locationWhere = { id: session.user.locationId }
    } else {
        locationWhere = { id: "__NONE__" }
    }

    // Get all locations or single
    const locations = await prisma.location.findMany({
        where: locationWhere,
        include: {
            rblBudgets: {
                where: { periodYear: currentYear },
                include: {
                    expenses: { select: { amount: true } }
                }
            }
        },
        orderBy: { name: "asc" }
    })

    const branchSummaries = locations.map(loc => {
        let totalBudget = 0
        let totalExpense = 0
        let openCount = 0
        let closedCount = 0

        for (const b of loc.rblBudgets) {
            totalBudget += b.amount
            const expSum = b.expenses.reduce((s, e) => s + e.amount, 0)
            totalExpense += expSum
            if (b.status === "OPEN") openCount++
            if (b.status === "CLOSED") closedCount++
        }

        const remaining = totalBudget - totalExpense
        const utilizationRate = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0

        return {
            locationId: loc.id,
            locationName: loc.name,
            totalBudget,
            totalExpense,
            remaining,
            utilizationRate,
            openCount,
            closedCount,
            budgetCount: loc.rblBudgets.length,
        }
    })

    const grandTotalBudget = branchSummaries.reduce((s, b) => s + b.totalBudget, 0)
    const grandTotalExpense = branchSummaries.reduce((s, b) => s + b.totalExpense, 0)
    const grandRemaining = grandTotalBudget - grandTotalExpense

    return {
        isSuperAdmin: isCorp,
        currentYear,
        branchSummaries,
        grandTotalBudget,
        grandTotalExpense,
        grandRemaining,
    }
}

// ─── Category Report & Vehicle Analysis Actions ───────────────────────────────

export type RblCategoryReportFilters = {
    categoryId?: string
    locationId?: string
    vehicleId?: string
    startDate?: string
    endDate?: string
    year?: number
    month?: number
    search?: string
}

export async function getRblCategoryReport(filters: RblCategoryReportFilters = {}) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: "Unauthorized", expenses: [], summary: null }
    }

    const isCorp = isCorporateOrSuperAdmin(session)
    const targetLocId = getTargetLocationId(session, filters.locationId)

    const where: any = {}

    // Location filter
    if (filters.locationId && filters.locationId !== "all") {
        where.budget = { locationId: targetLocId }
    } else if (!isCorp) {
        where.budget = { locationId: session.user.locationId }
    }

    // Category filter
    if (filters.categoryId && filters.categoryId !== "all") {
        where.categoryId = filters.categoryId
    }

    // Vehicle filter
    if (filters.vehicleId && filters.vehicleId !== "all") {
        if (filters.vehicleId === "none") {
            where.vehicleId = null
        } else {
            where.vehicleId = filters.vehicleId
        }
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
        where.date = {}
        if (filters.startDate) {
            where.date.gte = new Date(filters.startDate + "T00:00:00.000Z")
        }
        if (filters.endDate) {
            where.date.lte = new Date(filters.endDate + "T23:59:59.999Z")
        }
    } else if (filters.year || filters.month) {
        const year = filters.year || new Date().getFullYear()
        if (filters.month) {
            const start = new Date(year, filters.month - 1, 1)
            const end = new Date(year, filters.month, 0, 23, 59, 59, 999)
            where.date = { gte: start, lte: end }
        } else {
            const start = new Date(year, 0, 1)
            const end = new Date(year, 11, 31, 23, 59, 59, 999)
            where.date = { gte: start, lte: end }
        }
    }

    // Search filter
    if (filters.search && filters.search.trim()) {
        const term = filters.search.trim()
        where.OR = [
            { itemDescription: { contains: term, mode: "insensitive" } },
            { receiptNo: { contains: term, mode: "insensitive" } },
            { notes: { contains: term, mode: "insensitive" } },
            { category: { contains: term, mode: "insensitive" } },
            { vehicle: { code: { contains: term, mode: "insensitive" } } },
            { vehicle: { plate_number: { contains: term, mode: "insensitive" } } },
        ]
    }

    const expenses = await prisma.rblExpense.findMany({
        where,
        include: {
            budget: {
                select: {
                    id: true,
                    code: true,
                    periodMonth: true,
                    periodYear: true,
                    location: { select: { id: true, name: true } }
                }
            },
            categoryRef: true,
            vehicle: {
                select: {
                    id: true,
                    code: true,
                    plate_number: true,
                    vehicle_type: true,
                    location: { select: { id: true, name: true } }
                }
            },
            createdBy: {
                select: {
                    username: true,
                    employee: { select: { name: true } }
                }
            }
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }]
    })

    // Aggregates
    let totalAmount = 0
    let totalQuantity = 0
    const vehicleMap = new Map<string, any>()

    for (const exp of expenses) {
        totalAmount += exp.amount || 0
        totalQuantity += exp.quantity || 0

        const vKey = exp.vehicleId || "none"
        if (!vehicleMap.has(vKey)) {
            vehicleMap.set(vKey, {
                vehicleId: exp.vehicleId,
                code: exp.vehicle?.code || "Umum / Non-Armada",
                plateNumber: exp.vehicle?.plate_number || "-",
                type: exp.vehicle?.vehicle_type || "-",
                locationName: exp.vehicle?.location?.name || exp.budget?.location?.name || "-",
                totalQty: 0,
                totalAmount: 0,
                count: 0,
                minKm: null as number | null,
                maxKm: null as number | null,
            })
        }
        const vData = vehicleMap.get(vKey)
        vData.totalQty += exp.quantity || 0
        vData.totalAmount += exp.amount || 0
        vData.count += 1
        if (exp.kmMeter !== null && exp.kmMeter !== undefined) {
            if (vData.minKm === null || exp.kmMeter < vData.minKm) vData.minKm = exp.kmMeter
            if (vData.maxKm === null || exp.kmMeter > vData.maxKm) vData.maxKm = exp.kmMeter
        }
    }

    const vehicleBreakdown = Array.from(vehicleMap.values()).map(v => ({
        ...v,
        kmDiff: (v.maxKm !== null && v.minKm !== null) ? Math.max(0, v.maxKm - v.minKm) : 0
    })).sort((a, b) => b.totalAmount - a.totalAmount)

    return {
        success: true,
        expenses,
        summary: {
            totalAmount,
            totalQuantity,
            totalItems: expenses.length,
            avgPrice: totalQuantity > 0 ? totalAmount / totalQuantity : 0,
            vehicleBreakdown,
        }
    }
}

export type VehicleReportFilters = {
    locationId?: string
    vehicleId?: string
    categoryId?: string
    startDate?: string
    endDate?: string
    year?: number
    month?: number
}

export async function getVehicleReportData(filters: VehicleReportFilters = {}) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: "Unauthorized", data: null }
    }

    const isCorp = isCorporateOrSuperAdmin(session)
    const targetLocId = getTargetLocationId(session, filters.locationId)

    // 1. Get vehicles
    const vehicleWhere: any = {}
    if (filters.locationId && filters.locationId !== "all") {
        vehicleWhere.locationId = targetLocId
    } else if (!isCorp) {
        vehicleWhere.locationId = session.user.locationId
    }
    if (filters.vehicleId && filters.vehicleId !== "all") {
        vehicleWhere.id = filters.vehicleId
    }
    if (filters.categoryId && filters.categoryId !== "all") {
        vehicleWhere.categoryId = filters.categoryId
    }

    const vehicles = await prisma.vehicle.findMany({
        where: vehicleWhere,
        include: { location: true, category: true },
        orderBy: [{ location: { name: "asc" } }, { code: "asc" }]
    })

    // 2. Date filters for both expenses and transactions
    const dateWhere: any = {}
    if (filters.startDate || filters.endDate) {
        if (filters.startDate) dateWhere.gte = new Date(filters.startDate + "T00:00:00.000Z")
        if (filters.endDate) dateWhere.lte = new Date(filters.endDate + "T23:59:59.999Z")
    } else if (filters.year || filters.month) {
        const year = filters.year || new Date().getFullYear()
        if (filters.month) {
            dateWhere.gte = new Date(year, filters.month - 1, 1)
            dateWhere.lte = new Date(year, filters.month, 0, 23, 59, 59, 999)
        } else {
            dateWhere.gte = new Date(year, 0, 1)
            dateWhere.lte = new Date(year, 11, 31, 23, 59, 59, 999)
        }
    }

    const vehicleIds = vehicles.map(v => v.id)

    // 3. Fetch RblExpenses for these vehicles
    const expenseWhere: any = {
        vehicleId: { in: vehicleIds },
    }
    if (Object.keys(dateWhere).length > 0) {
        expenseWhere.date = dateWhere
    }

    const expenses = await prisma.rblExpense.findMany({
        where: expenseWhere,
        include: {
            budget: {
                select: {
                    id: true,
                    code: true,
                    periodMonth: true,
                    periodYear: true,
                    location: { select: { id: true, name: true } }
                }
            },
            categoryRef: true,
            vehicle: { select: { id: true, code: true, plate_number: true, vehicle_type: true, category: true } },
            createdBy: { select: { username: true, employee: { select: { name: true } } } }
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }]
    })

    // 4. Fetch ProductionTransactions for these vehicles
    const txWhere: any = {
        vehicleId: { in: vehicleIds },
    }
    if (Object.keys(dateWhere).length > 0) {
        txWhere.date = dateWhere
    }

    const transactions = await prisma.productionTransaction.findMany({
        where: txWhere,
        include: {
            vehicle: { select: { id: true, code: true, plate_number: true } },
            driver: { select: { id: true, name: true } },
            project: { select: { id: true, name: true, customer: { select: { id: true, customer_name: true } } } },
            concreteQuality: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } }
        },
        orderBy: [{ date: "desc" }, { trip_sequence: "asc" }]
    })

    // 5. Fetch PO Items (Sparepart & Alat) for these vehicles
    const poItemWhere: any = {
        vehicleId: { in: vehicleIds },
        purchaseOrder: {
            status: { not: "CANCELLED" }
        }
    }
    if (Object.keys(dateWhere).length > 0) {
        poItemWhere.purchaseOrder = {
            status: { not: "CANCELLED" },
            tanggal_terbit: dateWhere
        }
    }

    let poItems: any[] = []
    try {
        const [rawPoItems, allSuppliers] = await Promise.all([
            prisma.poItem.findMany({
                where: poItemWhere,
                include: {
                    purchaseOrder: {
                        select: {
                            id: true,
                            po_number: true,
                            tanggal_terbit: true,
                            status: true,
                            supplierId: true,
                            category: { select: { name: true, kode_kategori: true } },
                        }
                    },
                    masterItem: {
                        include: {
                            supplier: { select: { name: true } }
                        }
                    },
                    vehicle: {
                        select: {
                            id: true,
                            code: true,
                            plate_number: true,
                            meter_type: true
                        }
                    }
                },
                orderBy: { purchaseOrder: { tanggal_terbit: "desc" } }
            }),
            prisma.supplier.findMany({ select: { id: true, name: true } })
        ])

        const supplierMap = new Map(allSuppliers.map(s => [s.id, s.name]))
        poItems = rawPoItems.map(p => ({
            ...p,
            supplierName: (p.purchaseOrder?.supplierId ? supplierMap.get(p.purchaseOrder.supplierId) : null) || p.masterItem?.supplier?.name || "-"
        }))
    } catch (e) {
        console.error("Failed to fetch poItems for vehicle report:", e)
    }

    // 6. Fetch Sewa Transactions for these vehicles
    const sewaWhere: any = {
        vehicleId: { in: vehicleIds },
        status: { not: "Cancelled" }
    }
    if (Object.keys(dateWhere).length > 0) {
        sewaWhere.date = dateWhere
    }

    let sewaTransactions: any[] = []
    try {
        sewaTransactions = await prisma.sewaTransaction.findMany({
            where: sewaWhere,
            include: {
                customer: { select: { id: true, customer_name: true } },
                project: { select: { id: true, name: true } },
                operator: { select: { id: true, name: true } },
                vehicle: { select: { id: true, code: true, plate_number: true } },
                location: { select: { id: true, name: true } }
            },
            orderBy: { date: "desc" }
        })
    } catch (e) {
        console.error("Failed to fetch sewaTransactions for vehicle report:", e)
    }

    // 7. Aggregate per vehicle
    const vehicleAnalytics = vehicles.map(veh => {
        const vehExpenses = expenses.filter(e => e.vehicleId === veh.id)
        const vehTransactions = transactions.filter(t => t.vehicleId === veh.id)
        const vehPoItems = poItems.filter(p => p.vehicleId === veh.id)
        const vehSewaTransactions = sewaTransactions.filter(s => s.vehicleId === veh.id)

        // RBL Costs Breakdown
        let fuelLiters = 0
        let fuelCost = 0
        let lubricantQty = 0
        let lubricantCost = 0
        let otherCost = 0
        let rblTotalCost = 0

        let minKm: number | null = null
        let maxKm: number | null = null

        for (const e of vehExpenses) {
            rblTotalCost += e.amount || 0
            const catName = (e.category || "").toLowerCase()
            if (catName.includes("bbm") || catName.includes("solar") || catName.includes("bakar")) {
                fuelLiters += e.quantity || 0
                fuelCost += e.amount || 0
            } else if (catName.includes("oli") || catName.includes("pelumas")) {
                lubricantQty += e.quantity || 0
                lubricantCost += e.amount || 0
            } else {
                otherCost += e.amount || 0
            }

            if (e.kmMeter !== null && e.kmMeter !== undefined) {
                if (minKm === null || e.kmMeter < minKm) minKm = e.kmMeter
                if (maxKm === null || e.kmMeter > maxKm) maxKm = e.kmMeter
            }
        }

        // PO Sparepart & Equipment Costs Breakdown & Meter Synchronization
        let sparepartCost = 0
        for (const p of vehPoItems) {
            const itemSubtotal = p.subtotal || ((p.harga_satuan || 0) * (p.quantity || 0))
            sparepartCost += itemSubtotal

            const rawMeter = p.km_hm || p.purchaseOrder?.km_hm_kendaraan
            if (rawMeter) {
                const cleaned = String(rawMeter).replace(/[^0-9.]/g, '')
                const parsedMeter = parseFloat(cleaned)
                if (!isNaN(parsedMeter) && parsedMeter > 0) {
                    if (minKm === null || parsedMeter < minKm) minKm = parsedMeter
                    if (maxKm === null || parsedMeter > maxKm) maxKm = parsedMeter
                }
            }
        }

        // Unified Meter & Event Timeline for Vehicle Inspection (Audit Trail KM/HM)
        const meterEvents: Array<{
            id: string
            type: "RBL" | "PO"
            date: Date | string
            meter: number
            description: string
            referenceNo: string
            amount: number
            isBackdateAnomaly?: boolean
        }> = []

        for (const e of vehExpenses) {
            if (e.kmMeter !== null && e.kmMeter !== undefined && e.kmMeter > 0) {
                meterEvents.push({
                    id: `rbl_${e.id}`,
                    type: "RBL",
                    date: e.date,
                    meter: e.kmMeter,
                    description: `${e.categoryRef?.name || e.category || 'BBM/Operasional'}: ${e.itemDescription}`,
                    referenceNo: e.receiptNo || e.budget?.code || "-",
                    amount: e.amount || 0,
                })
            }
        }

        for (const p of vehPoItems) {
            const rawMeter = p.km_hm || p.purchaseOrder?.km_hm_kendaraan
            if (rawMeter) {
                const cleaned = String(rawMeter).replace(/[^0-9.]/g, '')
                const parsedMeter = parseFloat(cleaned)
                if (!isNaN(parsedMeter) && parsedMeter > 0) {
                    const itemSubtotal = p.subtotal || ((p.harga_satuan || 0) * (p.quantity || 0))
                    meterEvents.push({
                        id: `po_${p.id}`,
                        type: "PO",
                        date: p.purchaseOrder?.tanggal_terbit || new Date(),
                        meter: parsedMeter,
                        description: `Suku Cadang: ${p.masterItem?.name || 'Sparepart'} (${p.quantity || 1} ${p.masterItem?.satuan || 'PCS'})`,
                        referenceNo: p.purchaseOrder?.po_number || "-",
                        amount: itemSubtotal,
                    })
                }
            }
        }

        // Sort meter events chronologically (date ascending)
        meterEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Check for backdate anomalies (where a later date has a smaller meter)
        let runningMaxMeter = 0
        for (const evt of meterEvents) {
            if (runningMaxMeter > 0 && evt.meter < runningMaxMeter) {
                evt.isBackdateAnomaly = true
            } else {
                runningMaxMeter = Math.max(runningMaxMeter, evt.meter)
            }
        }

        // Grand Total Cost (Total Cost of Ownership = RBL Operasional + PO Sparepart/Alat)
        const grandTotalCost = rblTotalCost + sparepartCost

        // Sewa & Rental Revenue Breakdown
        let rentalRevenue = 0
        let rentalDays = 0
        for (const s of vehSewaTransactions) {
            rentalRevenue += s.total_price || 0
            rentalDays += s.total_days || 0
        }
        const netProfit = rentalRevenue - grandTotalCost

        // Production / Delivery stats
        const totalTrips = vehTransactions.length
        const totalVolume = vehTransactions.reduce((s, t) => s + (t.volume_cubic || 0), 0)
        const kmDistance = (maxKm !== null && minKm !== null) ? Math.max(0, maxKm - minKm) : 0

        // Efficiency Metrics
        const fuelPerCubic = totalVolume > 0 ? fuelLiters / totalVolume : 0
        const costPerTrip = totalTrips > 0 ? grandTotalCost / totalTrips : 0
        const costPerCubic = totalVolume > 0 ? grandTotalCost / totalVolume : 0

        return {
            vehicle: veh,
            stats: {
                totalCost: rblTotalCost,
                sparepartCost,
                grandTotalCost,
                fuelLiters,
                fuelCost,
                lubricantQty,
                lubricantCost,
                otherCost,
                minKm,
                maxKm,
                kmDistance,
                totalTrips,
                totalVolume,
                fuelPerCubic,
                costPerTrip,
                costPerCubic,
                rentalRevenue,
                rentalDays,
                rentalCount: vehSewaTransactions.length,
                netProfit,
                expenseCount: vehExpenses.length,
                poItemCount: vehPoItems.length,
                meterCount: meterEvents.length,
                hasBackdateAnomaly: meterEvents.some(m => m.isBackdateAnomaly),
            },
            meterEvents,
            recentExpenses: (filters.vehicleId && filters.vehicleId !== "all") ? vehExpenses : vehExpenses.slice(0, 25),
            recentTransactions: (filters.vehicleId && filters.vehicleId !== "all") ? vehTransactions : vehTransactions.slice(0, 25),
            recentPoItems: (filters.vehicleId && filters.vehicleId !== "all") ? vehPoItems : vehPoItems.slice(0, 25),
            recentSewaTransactions: (filters.vehicleId && filters.vehicleId !== "all") ? vehSewaTransactions : vehSewaTransactions.slice(0, 25),
        }
    })

    // Overall Fleet Summary
    const overallSummary = {
        totalVehicles: vehicles.length,
        totalCost: vehicleAnalytics.reduce((s, v) => s + v.stats.totalCost, 0),
        totalSparepartCost: vehicleAnalytics.reduce((s, v) => s + v.stats.sparepartCost, 0),
        grandTotalCost: vehicleAnalytics.reduce((s, v) => s + v.stats.grandTotalCost, 0),
        totalFuelLiters: vehicleAnalytics.reduce((s, v) => s + v.stats.fuelLiters, 0),
        totalFuelCost: vehicleAnalytics.reduce((s, v) => s + v.stats.fuelCost, 0),
        totalTrips: vehicleAnalytics.reduce((s, v) => s + v.stats.totalTrips, 0),
        totalVolume: vehicleAnalytics.reduce((s, v) => s + v.stats.totalVolume, 0),
        totalPoItems: poItems.length,
        totalRentalRevenue: vehicleAnalytics.reduce((s, v) => s + v.stats.rentalRevenue, 0),
        totalRentalDays: vehicleAnalytics.reduce((s, v) => s + v.stats.rentalDays, 0),
        totalSewaCount: sewaTransactions.length,
        netRentalProfit: vehicleAnalytics.reduce((s, v) => s + v.stats.rentalRevenue, 0) - vehicleAnalytics.reduce((s, v) => s + v.stats.grandTotalCost, 0),
    }

    return {
        success: true,
        overallSummary,
        vehicleAnalytics,
        allExpenses: expenses,
        allTransactions: transactions,
        allPoItems: poItems,
        allSewaTransactions: sewaTransactions,
        vehicles,
    }
}

