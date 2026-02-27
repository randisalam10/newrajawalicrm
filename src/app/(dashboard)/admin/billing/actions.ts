"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { InvoiceStatus } from "@prisma/client"

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildInvoiceNumber(seq: number, customerSeq: number, initials: string, date: Date): string {
    const seqStr = String(seq).padStart(3, "0")
    const month = date.getMonth() + 1   // no zero-pad per spec: "2/2026"
    const year = date.getFullYear()
    return `${seqStr}/INV-${customerSeq}/${initials}/${month}/${year}`
}

function extractInitials(customerName: string): string {
    // Strip common prefixes: PT., PT, CV., CV, Pak, Bu (case-insensitive)
    const stripped = customerName
        .replace(/^(pt\.|pt|cv\.|cv|pak|bu)\s*/i, "")
        .trim()
    return stripped
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 4)
}

/** Returns next global sequence number for a given location+month+year */
export async function getNextInvoiceSeq(locationId?: string, date?: Date): Promise<number> {
    const d = date ?? new Date()
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1)
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const count = await prisma.invoice.count({
        where: {
            issue_date: { gte: startOfMonth, lte: endOfMonth },
            ...(locationId ? { locationId } : {}),
        },
    })
    return count + 1
}

/** Returns next per-customer invoice sequence (total invoices ever issued for this customer + 1) */
export async function getCustomerInvoiceSeq(customerId: string): Promise<number> {
    const count = await prisma.invoice.count({
        where: { project: { customerId } },
    })
    return count + 1
}

async function writeBillingLog(params: {
    action: any
    invoiceId?: string
    paymentId?: string
    description: string
    metadata?: object
}) {
    const session = await auth()
    const actorId = session?.user?.id ?? "system"
    await prisma.billingLog.create({
        data: {
            action: params.action,
            invoiceId: params.invoiceId,
            paymentId: params.paymentId,
            actorId,
            description: params.description,
            metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        },
    })
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getUnbilledTransactions(filters: {
    locationId?: string
    projectId?: string
    customerId?: string
    startDate?: string
    endDate?: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    const isSuperAdmin = session.user.role === "SuperAdminBP"
    const locationFilter = isSuperAdmin
        ? filters.locationId ? { locationId: filters.locationId } : {}
        : { locationId: session.user.locationId! }

    return prisma.productionTransaction.findMany({
        where: {
            ...locationFilter,
            invoiceItem: null, // no InvoiceItem = unbilled
            ...(filters.projectId ? { projectId: filters.projectId } : {}),
            ...(filters.startDate || filters.endDate ? {
                date: {
                    ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                    ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
                }
            } : {}),
        },
        include: {
            project: { include: { customer: true, prices: { include: { concreteQuality: true } } } },
            concreteQuality: true,
            driver: true,
            vehicle: true,
            location: true,
        },
        orderBy: [{ date: "asc" }, { trip_sequence: "asc" }],
    })
}

export async function getInvoicesGroupedByCustomer(filters: {
    locationId?: string
    status?: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    const isSuperAdmin = session.user.role === "SuperAdminBP"
    const locationFilter = isSuperAdmin
        ? filters.locationId ? { locationId: filters.locationId } : {}
        : { locationId: session.user.locationId! }

    const invoices = await prisma.invoice.findMany({
        where: {
            ...locationFilter,
            ...(filters.status && filters.status !== "all" ? { status: filters.status as InvoiceStatus } : {}),
        },
        include: {
            project: { include: { customer: true } },
            items: { include: { transaction: { include: { concreteQuality: true } } } },
            payments: true,
        },
        orderBy: { issue_date: "desc" },
    })

    // Group by customer
    const customerMap = new Map<string, {
        customerId: string
        customerName: string
        totalAmount: number
        totalPaid: number
        projects: Map<string, {
            projectId: string
            projectName: string
            invoices: typeof invoices
        }>
    }>()

    for (const inv of invoices) {
        const cust = inv.project.customer
        if (!customerMap.has(cust.id)) {
            customerMap.set(cust.id, {
                customerId: cust.id,
                customerName: cust.customer_name,
                totalAmount: 0,
                totalPaid: 0,
                projects: new Map(),
            })
        }
        const custData = customerMap.get(cust.id)!
        custData.totalAmount += inv.total_amount
        custData.totalPaid += inv.paid_amount

        if (!custData.projects.has(inv.projectId)) {
            custData.projects.set(inv.projectId, {
                projectId: inv.projectId,
                projectName: inv.project.name,
                invoices: [],
            })
        }
        custData.projects.get(inv.projectId)!.invoices.push(inv)
    }

    return Array.from(customerMap.values()).map(c => ({
        ...c,
        projects: Array.from(c.projects.values()),
    }))
}

export async function getInvoiceDetail(invoiceId: string) {
    return prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            project: { include: { customer: true } },
            items: {
                include: {
                    transaction: {
                        include: { concreteQuality: true, vehicle: true, driver: true }
                    }
                },
                orderBy: { transaction: { date: "asc" } }
            },
            payments: { orderBy: { payment_date: "asc" } },
            billingLogs: { orderBy: { createdAt: "asc" } },
        },
    })
}

export async function getDepositSummary(filters: { locationId?: string }) {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    const isSuperAdmin = session.user.role === "SuperAdminBP"

    const projects = await prisma.project.findMany({
        where: isSuperAdmin
            ? filters.locationId ? { customer: { locationId: filters.locationId } } : {}
            : { customer: { locationId: session.user.locationId! } },
        include: {
            customer: true,
            deposits: { orderBy: { date: "asc" } },
        },
    })

    return projects
        .filter(p => p.deposits.length > 0)
        .map(p => ({
            projectId: p.id,
            projectName: p.name,
            customerId: p.customerId,
            customerName: p.customer.customer_name,
            totalDeposited: p.deposits.reduce((s, d) => s + d.amount, 0),
            entries: p.deposits,
        }))
}

// ─── Write ───────────────────────────────────────────────────────────────────

export async function createInvoice(params: {
    projectId: string
    transactionIds: string[]
    initialsOverride?: string    // user-editable initials
    customerSeqOverride?: number // user can reset/override the per-customer counter
    includePpn: boolean
    dueDate?: string
    periodStart?: string
    periodEnd?: string
    notes?: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }
    if (!["AdminBP", "SuperAdminBP"].includes(session.user.role))
        return { success: false, error: "Akses ditolak" }

    try {
        const project = await prisma.project.findUnique({
            where: { id: params.projectId },
            include: { customer: true, prices: true },
        })
        if (!project) return { success: false, error: "Proyek tidak ditemukan" }

        const transactions = await prisma.productionTransaction.findMany({
            where: { id: { in: params.transactionIds }, invoiceItem: null },
            include: { concreteQuality: true },
        })
        if (transactions.length === 0) return { success: false, error: "Tidak ada transaksi yang valid" }

        // Check all mutu have prices
        const unpriced = transactions.filter(tx => {
            return !project.prices.find(p => p.qualityId === tx.qualityId)
        })
        if (unpriced.length > 0) {
            const names = [...new Set(unpriced.map(t => t.concreteQuality.name))]
            return { success: false, error: `Harga belum diset untuk mutu: ${names.join(", ")}` }
        }

        let subtotal = 0
        const itemsData = transactions.map(tx => {
            const price = project.prices.find(p => p.qualityId === tx.qualityId)!.price
            const lineTotal = tx.volume_cubic * price
            subtotal += lineTotal
            return {
                transactionId: tx.id,
                quantity: tx.volume_cubic,
                unit_price: price,
                subtotal: lineTotal,
            }
        })

        const taxRate = params.includePpn ? project.tax_ppn / 100 : 0
        const taxAmount = subtotal * taxRate
        const totalAmount = subtotal + taxAmount

        // Get locationId from first transaction
        const firstTx = await prisma.productionTransaction.findUnique({
            where: { id: params.transactionIds[0] },
            select: { locationId: true }
        })
        const locationId = firstTx?.locationId ?? session.user.locationId!

        // Generate sequenced number
        const now = new Date()
        const seq = await getNextInvoiceSeq(locationId, now)
        const customerSeq = params.customerSeqOverride ?? await getCustomerInvoiceSeq(project.customerId)
        const initials = params.initialsOverride?.toUpperCase().trim() || extractInitials(project.customer.customer_name)
        const invoiceNumber = buildInvoiceNumber(seq, customerSeq, initials, now)

        const invoice = await prisma.invoice.create({
            data: {
                invoice_number: invoiceNumber,
                projectId: params.projectId,
                status: "ISSUED",
                include_ppn: params.includePpn,
                subtotal,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                paid_amount: 0,
                due_date: params.dueDate ? new Date(params.dueDate) : null,
                period_start: params.periodStart ? new Date(params.periodStart) : null,
                period_end: params.periodEnd ? new Date(params.periodEnd) : null,
                notes: params.notes,
                locationId,
                items: { create: itemsData },
            },
        })

        await writeBillingLog({
            action: "INVOICE_CREATED",
            invoiceId: invoice.id,
            description: `Invoice ${invoiceNumber} dibuat untuk ${project.name} — Total Rp ${totalAmount.toLocaleString("id-ID")}`,
            metadata: { invoiceNumber, projectId: params.projectId, total: totalAmount, txCount: transactions.length },
        })

        revalidatePath("/admin/billing")
        return { success: true, invoiceId: invoice.id }
    } catch (e: any) {
        if (e.code === "P2002") return { success: false, error: "Nomor invoice sudah dipakai, ubah suffix." }
        return { success: false, error: e.message }
    }
}

export async function recordPayment(params: {
    invoiceId: string
    amount: number
    method: string
    referenceNo?: string
    proofUrl?: string
    notes?: string
    paymentDate: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }
    if (!["AdminBP", "SuperAdminBP"].includes(session.user.role))
        return { success: false, error: "Akses ditolak" }

    try {
        const invoice = await prisma.invoice.findUnique({ where: { id: params.invoiceId } })
        if (!invoice) return { success: false, error: "Invoice tidak ditemukan" }

        const payment = await prisma.payment.create({
            data: {
                invoiceId: params.invoiceId,
                payment_date: new Date(params.paymentDate),
                amount: params.amount,
                method: params.method as any,
                reference_no: params.referenceNo,
                proof_url: params.proofUrl,
                notes: params.notes,
            },
        })

        const newPaid = invoice.paid_amount + params.amount
        const newStatus: InvoiceStatus = newPaid >= invoice.total_amount ? "PAID" : "PARTIAL"

        await prisma.invoice.update({
            where: { id: params.invoiceId },
            data: { paid_amount: newPaid, status: newStatus },
        })

        await writeBillingLog({
            action: "PAYMENT_RECORDED",
            invoiceId: params.invoiceId,
            paymentId: payment.id,
            description: `Pembayaran Rp ${params.amount.toLocaleString("id-ID")} via ${params.method} — status: ${newStatus}`,
            metadata: { amount: params.amount, method: params.method, newPaid, status: newStatus },
        })

        revalidatePath("/admin/billing")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function cancelInvoice(invoiceId: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }
    if (!["AdminBP", "SuperAdminBP"].includes(session.user.role ?? ""))
        return { success: false, error: "Akses ditolak" }

    try {
        const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
        if (!invoice) return { success: false, error: "Invoice tidak ditemukan" }
        if (invoice.paid_amount > 0) return { success: false, error: "Invoice yang sudah ada pembayaran tidak bisa dibatalkan" }

        await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "CANCELLED" } })

        await writeBillingLog({
            action: "INVOICE_CANCELLED",
            invoiceId,
            description: `Invoice ${invoice.invoice_number} dibatalkan`,
        })

        revalidatePath("/admin/billing")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function addDeposit(params: {
    projectId: string
    amount: number
    description: string
    reference?: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }
    if (!["AdminBP", "SuperAdminBP"].includes(session.user.role ?? ""))
        return { success: false, error: "Akses ditolak" }

    try {
        await prisma.deposit.create({
            data: {
                projectId: params.projectId,
                amount: params.amount,
                description: params.description,
                reference: params.reference,
            },
        })

        await writeBillingLog({
            action: "DEPOSIT_ADDED",
            description: `Deposito Rp ${params.amount.toLocaleString("id-ID")} ditambahkan untuk proyek ${params.projectId}`,
            metadata: { projectId: params.projectId, amount: params.amount },
        })

        revalidatePath("/admin/billing")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function getBillingPageData(filters: { locationId?: string } = {}) {
    const session = await auth()
    if (!session?.user?.employeeId) return null

    const isSuperAdmin = session.user.role === "SuperAdminBP"
    const locationId = isSuperAdmin ? filters.locationId : session.user.locationId!

    const [unbilled, grouped, deposits] = await Promise.all([
        getUnbilledTransactions({ locationId }),
        getInvoicesGroupedByCustomer({ locationId }),
        getDepositSummary({ locationId }),
    ])

    return { unbilled, grouped, deposits, isSuperAdmin, userLocationId: session.user.locationId }
}
