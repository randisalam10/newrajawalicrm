"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

// ─── Helpers & Permission Guards ──────────────────────────────────────────────

function getTargetLocationId(session: any, requestedLocationId?: string): string {
    const isSuperAdmin = session.user.role === "SuperAdminBP" && session.user.roleScope !== "OWN_BRANCH"
    if (isSuperAdmin && requestedLocationId && requestedLocationId !== "all") {
        return requestedLocationId
    }
    return session.user.locationId || ""
}

function getLocationCode(name: string): string {
    const clean = name.replace(/^(cabang|bp|batching\s*plant)\s*/i, "").trim()
    return clean.slice(0, 3).toUpperCase() || "CAB"
}

// ─── Read Actions ─────────────────────────────────────────────────────────────

export async function getActiveBudget(locationId?: string) {
    const session = await auth()
    if (!session?.user) return null

    const targetLocId = getTargetLocationId(session, locationId)
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
                    createdBy: { select: { username: true, employee: { select: { name: true } } } }
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

    return {
        ...budget,
        totalExpense,
        remainingBalance,
    }
}

export async function getBudgetHistory(filters: { locationId?: string; year?: number } = {}) {
    const session = await auth()
    if (!session?.user) return []

    const isSuperAdmin = session.user.role === "SuperAdminBP" && session.user.roleScope !== "OWN_BRANCH"
    const targetLocId = isSuperAdmin
        ? (filters.locationId && filters.locationId !== "all" ? filters.locationId : undefined)
        : session.user.locationId!

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
                    createdBy: { select: { username: true, employee: { select: { name: true } } } }
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

    // Enforce branch isolation for non-superadmin
    const isSuperAdmin = session.user.role === "SuperAdminBP" && session.user.roleScope !== "OWN_BRANCH"
    if (!isSuperAdmin && budget.locationId !== session.user.locationId) {
        return null
    }

    const totalExpense = budget.expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const remainingBalance = budget.amount - totalExpense

    return {
        ...budget,
        totalExpense,
        remainingBalance,
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
        const isSuperAdmin = session.user.role === "SuperAdminBP" && session.user.roleScope !== "OWN_BRANCH"
        if (!isSuperAdmin && budget.locationId !== session.user.locationId) {
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

export async function addExpenseBatch(budgetId: string, items: Array<{
    date: string
    itemDescription: string
    category?: string
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
        const isSuperAdmin = session.user.role === "SuperAdminBP" && session.user.roleScope !== "OWN_BRANCH"
        if (!isSuperAdmin && budget.locationId !== session.user.locationId) {
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
                        category: it.category || "Operasional",
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
        const isSuperAdmin = session.user.role === "SuperAdminBP" && session.user.roleScope !== "OWN_BRANCH"
        if (!isSuperAdmin && expense.budget.locationId !== session.user.locationId) {
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
                category: data.category || "Operasional",
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
        const isSuperAdmin = session.user.role === "SuperAdminBP" && session.user.roleScope !== "OWN_BRANCH"
        if (!isSuperAdmin && expense.budget.locationId !== session.user.locationId) {
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

        const isSuperAdmin = session.user.role === "SuperAdminBP" && session.user.roleScope !== "OWN_BRANCH"
        if (!isSuperAdmin && budget.locationId !== session.user.locationId) {
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

        const isSuperAdmin = session.user.role === "SuperAdminBP" && session.user.roleScope !== "OWN_BRANCH"
        if (!isSuperAdmin && attachment.budget.locationId !== session.user.locationId) {
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

    const isSuperAdmin = session.user.role === "SuperAdminBP" && session.user.roleScope !== "OWN_BRANCH"
    const currentYear = filters.year || new Date().getFullYear()

    // Get all locations or single
    const locations = await prisma.location.findMany({
        where: isSuperAdmin && filters.locationId && filters.locationId !== "all"
            ? { id: filters.locationId }
            : !isSuperAdmin
            ? { id: session.user.locationId! }
            : {},
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
        isSuperAdmin,
        currentYear,
        branchSummaries,
        grandTotalBudget,
        grandTotalExpense,
        grandRemaining,
    }
}
