"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { isCorporateUser } from "@/lib/rbac"
import { CreditFilterState, CreditKPIStats, CreditPaymentMethod, CreditItemDTO } from "./types"
import { CreditStatus, Prisma } from "@prisma/client"

/**
 * Otomatis mendeteksi PO kredit yang APPROVED dan mendaftarkannya ke CreditObligation
 * Bersifat Idempotent: PO yang sudah terdaftar tidak akan diduplikasi.
 */
export async function syncApprovedCreditPurchaseOrders() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        // Ambil ID PO yang sudah terdaftar di CreditObligation
        const existingCredits = await prisma.creditObligation.findMany({
            where: { purchaseOrderId: { not: null } },
            select: { purchaseOrderId: true },
        })
        const linkedPoIds = new Set(existingCredits.map(c => c.purchaseOrderId).filter(Boolean))

        // Query PO bertipe CREDIT dan APPROVED
        const allCreditPos = await prisma.purchaseOrder.findMany({
            where: {
                metode_pembayaran: "CREDIT",
                status: "APPROVED",
            },
            include: {
                companyGroup: true,
                items: true,
            },
            orderBy: { tanggal_terbit: "asc" },
        })

        const unlinkedPos = allCreditPos.filter(po => !linkedPoIds.has(po.id))

        if (unlinkedPos.length === 0) {
            return { success: true, count: 0 }
        }

        // Fetch supplier names in batch
        const supplierIds = [...new Set(unlinkedPos.map(p => p.supplierId).filter(Boolean))]
        const suppliers = supplierIds.length > 0
            ? await prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true } })
            : []
        const supplierMap = new Map(suppliers.map(s => [s.id, s.name]))

        let createdCount = 0

        for (const po of unlinkedPos) {
            const poTotal = po.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
            const supplierName = supplierMap.get(po.supplierId) || "Supplier Rekanan"
            const companyName = po.companyGroup?.name || "PT. Rajawali Group"

            // Default 30 hari jatuh tempo dari tanggal terbit
            const creditDate = new Date(po.tanggal_terbit)
            const dueDate = new Date(creditDate)
            dueDate.setDate(dueDate.getDate() + 30)

            const creditNumber = `CRD-${po.po_number.replace(/\//g, "-")}`

            const credit = await prisma.creditObligation.create({
                data: {
                    credit_number: creditNumber,
                    source_type: "PO_PURCHASE",
                    purchaseOrderId: po.id,
                    supplierId: po.supplierId || null,
                    supplier_name: supplierName,
                    companyGroupId: po.companyGroupId || null,
                    company_name: companyName,
                    locationId: po.locationId || null,
                    total_amount: poTotal,
                    paid_amount: 0,
                    outstanding: poTotal,
                    credit_date: creditDate,
                    due_date: dueDate,
                    term_days: 30,
                    status: "UNPAID",
                    notes: `Kewajiban kredit otomatis dari PO ${po.po_number}`,
                    createdById: session.user.id,
                },
            })

            await prisma.creditAuditLog.create({
                data: {
                    action: "CREDIT_CREATED",
                    creditId: credit.id,
                    actorId: session.user.id,
                    actorName: "System (Otomatis)",
                    description: `Pendaftaran kredit PO ${po.po_number} senilai Rp ${poTotal.toLocaleString("id-ID")}`,
                    metadata: JSON.stringify({ poId: po.id, total: poTotal, dueDate }),
                },
            })

            createdCount++
        }

        revalidatePath("/admin/finance/kredit")
        return { success: true, count: createdCount }
    } catch (error: unknown) {
        console.error("Error syncing credit POs:", error)
        const msg = error instanceof Error ? error.message : "Gagal menyinkronkan PO kredit"
        return { success: false, error: msg }
    }
}

export async function getCreditPageData(filters?: Partial<CreditFilterState>) {
    const session = await auth()
    if (!session?.user?.id) return null

    // Sinkronkan PO yang baru approved jika ada
    await syncApprovedCreditPurchaseOrders()

    const isCorp = isCorporateUser(session.user)
    const userLocationId = session.user.locationId

    const where: Prisma.CreditObligationWhereInput = {}

    // Location filter scoping
    if (!isCorp && userLocationId) {
        where.OR = [
            { locationId: userLocationId },
            { locationId: null },
        ]
    } else if (filters?.locationId && filters.locationId !== "ALL") {
        where.locationId = filters.locationId
    }

    // Status filter
    if (filters?.status && filters.status !== "ALL") {
        if (filters.status === "OVERDUE") {
            where.status = { not: "PAID" }
            where.outstanding = { gt: 0 }
            where.due_date = { lt: new Date() }
        } else if (filters.status === "UNPAID") {
            where.status = "UNPAID"
        } else if (filters.status === "PARTIAL") {
            where.status = "PARTIAL"
        } else if (filters.status === "PAID") {
            where.status = "PAID"
        } else if (filters.status === "CANCELLED") {
            where.status = "CANCELLED"
        }
    }

    // Company filter
    if (filters?.companyGroupId && filters.companyGroupId !== "ALL") {
        where.companyGroupId = filters.companyGroupId
    }

    // Supplier filter
    if (filters?.supplierId && filters.supplierId !== "ALL") {
        where.supplierId = filters.supplierId
    }

    // Date range filter
    if (filters?.startDate && filters?.endDate) {
        const start = new Date(filters.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999)
        where.credit_date = { gte: start, lte: end }
    }

    // Search filter
    if (filters?.search && filters.search.trim()) {
        const term = filters.search.trim()
        where.OR = [
            { credit_number: { contains: term, mode: "insensitive" } },
            { supplier_name: { contains: term, mode: "insensitive" } },
            { company_name: { contains: term, mode: "insensitive" } },
            { purchaseOrder: { po_number: { contains: term, mode: "insensitive" } } },
        ]
    }

    // Ordering
    let orderBy: Prisma.CreditObligationOrderByWithRelationInput = { credit_date: "desc" }
    if (filters?.sortBy === "date_asc") orderBy = { credit_date: "asc" }
    else if (filters?.sortBy === "amount_desc") orderBy = { total_amount: "desc" }
    else if (filters?.sortBy === "outstanding_desc") orderBy = { outstanding: "desc" }
    else if (filters?.sortBy === "due_soon") orderBy = { due_date: "asc" }

    // Fetch credits and all related data in parallel
    const [credits, allActiveCredits, companies, suppliers, locations, activePayments] = await Promise.all([
        prisma.creditObligation.findMany({
            where,
            include: {
                purchaseOrder: {
                    select: {
                        id: true,
                        po_number: true,
                        tanggal_terbit: true,
                        status: true,
                        category: { select: { name: true, kode_kategori: true } },
                    },
                },
                payments: {
                    where: { is_cancelled: false },
                    orderBy: { payment_date: "desc" },
                },
            },
            orderBy,
        }),
        // Fetch all credits for calculating KPI stats (unaffected by search/status filter for consistent overview)
        prisma.creditObligation.findMany({
            where: !isCorp && userLocationId ? { OR: [{ locationId: userLocationId }, { locationId: null }] } : {},
            include: {
                purchaseOrder: {
                    select: {
                        category: { select: { name: true } },
                    },
                },
            },
        }),
        prisma.poCompanyGroup.findMany({ select: { id: true, name: true, kode_cabang: true }, orderBy: { name: "asc" } }),
        prisma.supplier.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
        prisma.location.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
        prisma.creditPayment.findMany({
            where: { is_cancelled: false },
            select: { payment_date: true, amount: true },
            orderBy: { payment_date: "asc" },
        }),
    ])

    // Dynamic KPI Calculation (100% dari Database, NO HARDCODING)
    const now = new Date()
    const nowTimestamp = now.getTime()
    const sevenDaysLaterTimestamp = nowTimestamp + 7 * 24 * 60 * 60 * 1000

    let totalCreditValue = 0
    let totalPaidValue = 0
    let totalOutstandingValue = 0
    let overdueCount = 0
    let overdueValue = 0
    let dueSoonCount = 0
    let dueSoonValue = 0
    let paidCount = 0
    let unpaidCount = 0
    let partialCount = 0

    const companyMap = new Map<string, { totalAmount: number; outstanding: number; count: number }>()
    const categoryMap = new Map<string, { totalAmount: number; outstanding: number; count: number }>()
    const supplierMap = new Map<string, { totalAmount: number; outstanding: number; count: number }>()

    for (const c of allActiveCredits) {
        if (c.status === "CANCELLED") continue

        totalCreditValue += c.total_amount
        totalPaidValue += c.paid_amount
        totalOutstandingValue += c.outstanding

        if (c.status === "PAID") paidCount++
        else if (c.status === "PARTIAL") partialCount++
        else unpaidCount++

        if (c.due_date && c.outstanding > 0) {
            const dueTime = new Date(c.due_date).getTime()
            if (dueTime < nowTimestamp) {
                overdueCount++
                overdueValue += c.outstanding
            } else if (dueTime <= sevenDaysLaterTimestamp) {
                dueSoonCount++
                dueSoonValue += c.outstanding
            }
        }

        // Breakdown by Company
        const compName = c.company_name || "Lainnya"
        const existingComp = companyMap.get(compName) || { totalAmount: 0, outstanding: 0, count: 0 }
        existingComp.totalAmount += c.total_amount
        existingComp.outstanding += c.outstanding
        existingComp.count++
        companyMap.set(compName, existingComp)

        // Breakdown by Category
        const catName = c.purchaseOrder?.category?.name || "Non-PO / Umum"
        const existingCat = categoryMap.get(catName) || { totalAmount: 0, outstanding: 0, count: 0 }
        existingCat.totalAmount += c.total_amount
        existingCat.outstanding += c.outstanding
        existingCat.count++
        categoryMap.set(catName, existingCat)

        // Breakdown by Supplier
        const supName = c.supplier_name || "Supplier Umum"
        const existingSup = supplierMap.get(supName) || { totalAmount: 0, outstanding: 0, count: 0 }
        existingSup.totalAmount += c.total_amount
        existingSup.outstanding += c.outstanding
        existingSup.count++
        supplierMap.set(supName, existingSup)
    }

    const byCompany = Array.from(companyMap.entries()).map(([companyName, data]) => ({
        companyName,
        ...data,
    })).sort((a, b) => b.outstanding - a.outstanding)

    const byCategory = Array.from(categoryMap.entries()).map(([categoryName, data]) => ({
        categoryName,
        ...data,
    })).sort((a, b) => b.outstanding - a.outstanding)

    const topSuppliers = Array.from(supplierMap.entries()).map(([supplierName, data]) => ({
        supplierName,
        ...data,
    })).sort((a, b) => b.outstanding - a.outstanding).slice(0, 5)

    // Dynamic Monthly Payment Realization Trend
    const monthKeyMap = new Map<string, { label: string; amount: number; count: number }>()
    for (const p of activePayments) {
        const d = new Date(p.payment_date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const label = new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(d)
        const current = monthKeyMap.get(key) || { label, amount: 0, count: 0 }
        current.amount += p.amount
        current.count++
        monthKeyMap.set(key, current)
    }
    const monthlyTrend = Array.from(monthKeyMap.entries()).map(([monthKey, val]) => ({
        monthKey,
        monthLabel: val.label,
        paymentAmount: val.amount,
        paymentCount: val.count,
    }))

    const repaymentRatePct = totalCreditValue > 0 ? (totalPaidValue / totalCreditValue) * 100 : 0

    const stats: CreditKPIStats = {
        totalCreditsCount: allActiveCredits.length,
        totalCreditValue,
        totalPaidValue,
        totalOutstandingValue,
        overdueCount,
        overdueValue,
        dueSoonCount,
        dueSoonValue,
        paidCount,
        unpaidCount,
        partialCount,
        repaymentRatePct,
        byCompany,
        byCategory,
        topSuppliers,
        monthlyTrend,
    }

    return {
        credits: credits as unknown as CreditItemDTO[],
        stats,
        companies,
        suppliers,
        locations,
        userRole: session.user.role || "",
        userPermissions: session.user.permissions || [],
        userLocationId,
    }
}

export async function getCreditDetail(creditId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const credit = await prisma.creditObligation.findUnique({
            where: { id: creditId },
            include: {
                purchaseOrder: {
                    include: {
                        category: true,
                        companyGroup: true,
                        items: {
                            include: {
                                masterItem: true,
                            },
                        },
                    },
                },
                payments: {
                    include: {
                        recordedBy: {
                            select: { username: true, employee: { select: { name: true } } },
                        },
                        cancelledBy: {
                            select: { username: true, employee: { select: { name: true } } },
                        },
                    },
                    orderBy: { payment_date: "desc" },
                },
                auditLogs: {
                    orderBy: { createdAt: "desc" },
                },
                createdBy: {
                    select: { id: true, username: true, employee: { select: { name: true } } },
                },
            },
        })

        if (!credit) return { success: false, error: "Data kredit tidak ditemukan" }
        return { success: true, data: credit }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Gagal memuat detail kredit"
        return { success: false, error: msg }
    }
}

export async function recordCreditPayment(params: {
    creditId: string
    amount: number
    paymentDate: string
    method: CreditPaymentMethod
    sourceAccount?: string
    referenceNo?: string
    proofUrl?: string
    notes?: string
}) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const credit = await prisma.creditObligation.findUnique({
            where: { id: params.creditId },
        })
        if (!credit) return { success: false, error: "Kewajiban kredit tidak ditemukan" }
        if (credit.status === "CANCELLED") return { success: false, error: "Kredit telah dibatalkan" }

        if (params.amount <= 0) return { success: false, error: "Nominal pembayaran harus lebih besar dari 0" }
        if (params.amount > credit.outstanding + 10) {
            return {
                success: false,
                error: `Nominal melebihi sisa kewajiban (Maksimal: Rp ${credit.outstanding.toLocaleString("id-ID")})`,
            }
        }

        const payment = await prisma.creditPayment.create({
            data: {
                creditId: params.creditId,
                payment_date: new Date(params.paymentDate),
                amount: params.amount,
                method: params.method,
                source_account: params.sourceAccount || null,
                reference_no: params.referenceNo || null,
                proof_url: params.proofUrl || null,
                notes: params.notes || null,
                recordedById: session.user.id,
            },
        })

        const newPaid = credit.paid_amount + params.amount
        const newOutstanding = Math.max(0, credit.total_amount - newPaid)
        const newStatus: CreditStatus = newOutstanding <= 0 ? "PAID" : "PARTIAL"

        await prisma.creditObligation.update({
            where: { id: params.creditId },
            data: {
                paid_amount: newPaid,
                outstanding: newOutstanding,
                status: newStatus,
            },
        })

        await prisma.creditAuditLog.create({
            data: {
                action: "PAYMENT_RECORDED",
                creditId: params.creditId,
                paymentId: payment.id,
                actorId: session.user.id,
                actorName: session.user.username || "User",
                description: `Pelunasan Rp ${params.amount.toLocaleString("id-ID")} via ${params.method} — Status: ${newStatus}`,
                metadata: JSON.stringify({
                    amount: params.amount,
                    method: params.method,
                    sourceAccount: params.sourceAccount,
                    newPaid,
                    newOutstanding,
                    newStatus,
                }),
            },
        })

        revalidatePath("/admin/finance/kredit")
        return { success: true, paymentId: payment.id }
    } catch (e: unknown) {
        console.error("Error recording credit payment:", e)
        const msg = e instanceof Error ? e.message : "Gagal mencatat pembayaran"
        return { success: false, error: msg }
    }
}

export async function cancelCreditPayment(paymentId: string, reason: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    if (!reason?.trim()) return { success: false, error: "Alasan pembatalan wajib diisi" }

    try {
        const payment = await prisma.creditPayment.findUnique({
            where: { id: paymentId },
            include: { credit: true },
        })
        if (!payment) return { success: false, error: "Pembayaran tidak ditemukan" }
        if (payment.is_cancelled) return { success: false, error: "Pembayaran sudah dibatalkan sebelumnya" }

        // Soft Cancel Payment
        await prisma.creditPayment.update({
            where: { id: paymentId },
            data: {
                is_cancelled: true,
                cancel_reason: reason.trim(),
                cancelled_at: new Date(),
                cancelledById: session.user.id,
            },
        })

        // Recalculate from all active payments for this credit
        const activePayments = await prisma.creditPayment.findMany({
            where: { creditId: payment.creditId, is_cancelled: false },
        })
        const newPaid = activePayments.reduce((sum, p) => sum + p.amount, 0)
        const credit = payment.credit
        const newOutstanding = Math.max(0, credit.total_amount - newPaid)

        let newStatus: CreditStatus = "UNPAID"
        if (newPaid >= credit.total_amount) newStatus = "PAID"
        else if (newPaid > 0) newStatus = "PARTIAL"

        // Check if overdue
        if (newOutstanding > 0 && credit.due_date && new Date(credit.due_date) < new Date()) {
            newStatus = "OVERDUE"
        }

        await prisma.creditObligation.update({
            where: { id: payment.creditId },
            data: {
                paid_amount: newPaid,
                outstanding: newOutstanding,
                status: newStatus,
            },
        })

        await prisma.creditAuditLog.create({
            data: {
                action: "PAYMENT_CANCELLED",
                creditId: payment.creditId,
                paymentId: payment.id,
                actorId: session.user.id,
                actorName: session.user.username || "User",
                description: `Pembayaran Rp ${payment.amount.toLocaleString("id-ID")} dibatalkan. Alasan: ${reason.trim()}`,
                metadata: JSON.stringify({ amount: payment.amount, reason, newPaid, newOutstanding, newStatus }),
            },
        })

        revalidatePath("/admin/finance/kredit")
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Gagal membatalkan pembayaran"
        return { success: false, error: msg }
    }
}

export async function createManualCreditObligation(params: {
    supplierName: string
    companyGroupId: string
    locationId?: string
    totalAmount: number
    creditDate: string
    dueDate?: string
    termDays?: number
    notes?: string
}) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const company = await prisma.poCompanyGroup.findUnique({
            where: { id: params.companyGroupId },
        })
        if (!company) return { success: false, error: "Perusahaan penanggung wajib dipilih" }

        const cDate = new Date(params.creditDate)
        const term = params.termDays !== undefined && params.termDays !== null ? Number(params.termDays) : 30
        const dDate = params.dueDate ? new Date(params.dueDate) : new Date(cDate.getTime() + term * 24 * 60 * 60 * 1000)

        const seq = (await prisma.creditObligation.count()) + 1
        const seqStr = String(seq).padStart(3, "0")
        const creditNumber = `CRD/NONPO/${company.kode_cabang}/${cDate.getFullYear()}/${seqStr}`

        const credit = await prisma.creditObligation.create({
            data: {
                credit_number: creditNumber,
                source_type: "NON_PO",
                supplier_name: params.supplierName.trim(),
                companyGroupId: company.id,
                company_name: company.name,
                locationId: params.locationId || null,
                total_amount: params.totalAmount,
                paid_amount: 0,
                outstanding: params.totalAmount,
                credit_date: cDate,
                due_date: dDate,
                term_days: term,
                status: "UNPAID",
                notes: params.notes || null,
                createdById: session.user.id,
            },
        })

        await prisma.creditAuditLog.create({
            data: {
                action: "CREDIT_CREATED",
                creditId: credit.id,
                actorId: session.user.id,
                actorName: session.user.username || "User",
                description: `Pendaftaran kredit Non-PO ${creditNumber} senilai Rp ${params.totalAmount.toLocaleString("id-ID")} kepada ${params.supplierName}`,
                metadata: JSON.stringify(params),
            },
        })

        revalidatePath("/admin/finance/kredit")
        return { success: true, creditId: credit.id }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Gagal membuat kewajiban kredit"
        return { success: false, error: msg }
    }
}
