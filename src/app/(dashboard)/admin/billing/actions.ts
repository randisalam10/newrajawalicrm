"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { InvoiceStatus } from "@prisma/client"
import { isCorporateUser } from "@/lib/rbac"

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
        where: {
            OR: [
                { project: { customerId } },
                { customerId },
            ]
        },
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
    limit?: number
} = {}) {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    const isCorp = isCorporateUser(session.user)
    const locationFilter = isCorp
        ? (filters.locationId && filters.locationId !== "all" ? { locationId: filters.locationId } : {})
        : (session.user.locationId ? { locationId: session.user.locationId } : {})

    const startDateObj = filters.startDate ? new Date(filters.startDate.includes("T") ? filters.startDate : `${filters.startDate}T00:00:00.000+07:00`) : undefined
    const endDateObj = filters.endDate ? new Date(filters.endDate.includes("T") ? filters.endDate : `${filters.endDate}T23:59:59.999+07:00`) : undefined

    // Pastikan transaksi yang sempat terkunci di invoice CANCELLED (versi lama) dilepaskan secara otomatis
    await prisma.$executeRawUnsafe(`
        UPDATE "InvoiceItem"
        SET "transactionId" = NULL, "sewaTransactionId" = NULL
        WHERE "invoiceId" IN (
            SELECT id FROM "Invoice" WHERE status = 'CANCELLED'
        ) AND ("transactionId" IS NOT NULL OR "sewaTransactionId" IS NOT NULL);
    `).catch(() => null)

    const [prodTxs, sewaTxs] = await Promise.all([
        prisma.productionTransaction.findMany({
            where: {
                ...locationFilter,
                status: "Confirmed",
                OR: [
                    { invoiceItem: null },
                    { invoiceItem: { invoice: { status: "CANCELLED" } } },
                ],
                ...(filters.projectId ? { projectId: filters.projectId } : {}),
                ...(filters.customerId ? { project: { customerId: filters.customerId } } : {}),
                ...(startDateObj || endDateObj ? {
                    date: {
                        ...(startDateObj ? { gte: startDateObj } : {}),
                        ...(endDateObj ? { lte: endDateObj } : {}),
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
            ...(filters.limit ? { take: filters.limit } : {}),
            orderBy: [{ date: "asc" }, { trip_sequence: "asc" }],
        }),
        prisma.sewaTransaction.findMany({
            where: {
                ...locationFilter,
                status: { not: "Cancelled" },
                OR: [
                    { invoiceItem: null },
                    { invoiceItem: { invoice: { status: "CANCELLED" } } },
                ],
                ...(filters.projectId ? { projectId: filters.projectId } : {}),
                ...(filters.customerId ? { customerId: filters.customerId } : {}),
                ...(startDateObj || endDateObj ? {
                    date: {
                        ...(startDateObj ? { gte: startDateObj } : {}),
                        ...(endDateObj ? { lte: endDateObj } : {}),
                    }
                } : {}),
            },

            include: {
                customer: true,
                project: { include: { customer: true } },
                equipment: true,
                vehicle: { include: { category: true } },
                operator: { include: { driverCategory: true } },
                location: true,
            },
            ...(filters.limit ? { take: filters.limit } : {}),
            orderBy: { date: "asc" },
        })
    ])

    const normalizedProd = prodTxs.map(tx => ({
        ...tx,
        itemType: "READYMIX" as const,
    }))

    const normalizedSewa = sewaTxs.map(tx => {
        const eqName = tx.vehicle ? `${tx.vehicle.category?.name || "Unit"} ${tx.vehicle.code}` : (tx.equipment?.nama_alat || "Alat Sewa")
        return {
            id: tx.id,
            itemType: "SEWA" as const,
            date: tx.date,
            sewaNumber: tx.sewa_number,
            startDate: tx.start_date,
            endDate: tx.end_date,
            rentalDates: tx.rental_dates,
            totalDays: tx.total_days,
            pricePerDay: tx.price_per_day,
            totalPrice: tx.total_price,
            is_ppn: tx.is_ppn,
            ppn_mode: tx.ppn_mode,
            ppn_rate: tx.ppn_rate,
            dpp_amount: tx.dpp_amount,
            ppn_amount: tx.ppn_amount,
            volume_cubic: tx.total_days,
            qualityId: null,
            concreteQuality: { name: `Sewa: ${eqName}` },
            equipment: tx.equipment,
            operator: tx.operator,
            customer: tx.customer,
            project: tx.project || {
                id: `SEWA_${tx.customerId}`,
                name: tx.lokasi_proyek || "Penyewaan Alat & Kendaraan",
                customerId: tx.customerId,
                customer: tx.customer,
                tax_ppn: tx.is_ppn ? (tx.ppn_rate ?? 11) : 0,
                prices: []
            },
            projectId: tx.projectId || `SEWA_${tx.customerId}`,
            location: tx.location,
            locationId: tx.locationId,
            status: tx.status,
        }
    })

    return [...normalizedProd, ...normalizedSewa]
}

export async function getInvoicesGroupedByCustomer(filters: {
    locationId?: string
    status?: string
    showCancelled?: boolean
    startDate?: string
    endDate?: string
    customerId?: string
}) {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    const isCorp = isCorporateUser(session.user)
    const locationFilter = isCorp
        ? (filters.locationId && filters.locationId !== "all" ? { locationId: filters.locationId } : {})
        : (session.user.locationId ? { locationId: session.user.locationId } : {})

    const startDateObj = filters.startDate ? new Date(filters.startDate.includes("T") ? filters.startDate : `${filters.startDate}T00:00:00.000+07:00`) : undefined
    const endDateObj = filters.endDate ? new Date(filters.endDate.includes("T") ? filters.endDate : `${filters.endDate}T23:59:59.999+07:00`) : undefined

    const invoices = await prisma.invoice.findMany({
        where: {
            ...locationFilter,
            // Hide cancelled by default unless showCancelled flag is set or status filter is explicitly CANCELLED
            ...((filters.showCancelled || filters.status === "CANCELLED") ? {} : { NOT: { status: "CANCELLED" } }),
            ...(filters.status && filters.status !== "all" ? { status: filters.status as any } : {}),
            ...(filters.customerId ? {
                OR: [
                    { customerId: filters.customerId },
                    { project: { customerId: filters.customerId } },
                ]
            } : {}),
            ...(startDateObj || endDateObj ? {
                issue_date: {
                    ...(startDateObj ? { gte: startDateObj } : {}),
                    ...(endDateObj ? { lte: endDateObj } : {}),
                }
            } : {}),
        },
        include: {
            project: { include: { customer: true } },
            customer: true,
            items: {
                include: {
                    transaction: { include: { concreteQuality: true } },
                    sewaTransaction: { include: { equipment: true, operator: true } },
                }
            },
            // Include ALL payments so we can show cancelled ones in detail
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
        const cust = inv.customer || inv.project?.customer
        if (!cust) continue
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
        // Exclude cancelled invoices from totals
        if (inv.status !== "CANCELLED") {
            custData.totalAmount += inv.total_amount
            // Only count non-cancelled payments
            const activePaid = inv.payments
                .filter(p => !p.is_cancelled)
                .reduce((s, p) => s + p.amount, 0)
            custData.totalPaid += activePaid
        }

        const prjId = inv.projectId || `SEWA_${cust.id}`
        const prjName = inv.project?.name || "Penyewaan Alat & Kendaraan"
        if (!custData.projects.has(prjId)) {
            custData.projects.set(prjId, {
                projectId: prjId,
                projectName: prjName,
                invoices: [],
            })
        }
        custData.projects.get(prjId)!.invoices.push(inv)
    }

    return Array.from(customerMap.values()).map(c => ({
        ...c,
        projects: Array.from(c.projects.values()),
    }))
}

export async function getInvoiceDetail(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            project: { include: { customer: true } },
            customer: true,
            location: true,
            items: {
                include: {
                    transaction: {
                        include: { concreteQuality: true, vehicle: true, driver: true }
                    },
                    sewaTransaction: {
                        include: { equipment: true, operator: true }
                    }
                },
                orderBy: { id: "asc" }
            },
            // Include all payments including cancelled so UI can show them
            payments: { orderBy: { payment_date: "asc" } },
            billingLogs: { orderBy: { createdAt: "asc" } },
        },
    })

    if (invoice && invoice.items) {
        invoice.items.sort((a, b) => {
            const dateA = a.transaction?.date
                ? new Date(a.transaction.date).getTime()
                : (a.sewaTransaction?.start_date
                    ? new Date(a.sewaTransaction.start_date).getTime()
                    : (a.sewaTransaction?.date ? new Date(a.sewaTransaction.date).getTime() : 0))
            const dateB = b.transaction?.date
                ? new Date(b.transaction.date).getTime()
                : (b.sewaTransaction?.start_date
                    ? new Date(b.sewaTransaction.start_date).getTime()
                    : (b.sewaTransaction?.date ? new Date(b.sewaTransaction.date).getTime() : 0))
            if (dateA !== dateB) return dateA - dateB
            return (a.transaction?.trip_sequence ?? 0) - (b.transaction?.trip_sequence ?? 0)
        })
    }

    return invoice
}

export async function getDepositSummary(filters: { locationId?: string }) {
    const session = await auth()
    if (!session?.user?.employeeId) return []

    const isCorp = isCorporateUser(session.user)
    const custLocFilter = isCorp
        ? (filters.locationId && filters.locationId !== "all" ? { customer: { locationId: filters.locationId } } : {})
        : (session.user.locationId ? { customer: { locationId: session.user.locationId } } : {})

    const projects = await prisma.project.findMany({
        where: custLocFilter,
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
        // Fetch both Sewa and Production transactions (sorted ascending by date)
        const [sewaTransactions, prodTransactions] = await Promise.all([
            prisma.sewaTransaction.findMany({
                where: { id: { in: params.transactionIds }, invoiceItem: null },
                include: { customer: true, project: true, equipment: true, vehicle: { include: { category: true } }, operator: true },
                orderBy: [{ start_date: "asc" }, { date: "asc" }],
            }),
            prisma.productionTransaction.findMany({
                where: { id: { in: params.transactionIds }, invoiceItem: null },
                include: {
                    concreteQuality: true,
                    project: { include: { customer: true, prices: { include: { concreteQuality: true } } } },
                },
                orderBy: [{ date: "asc" }, { trip_sequence: "asc" }],
            }),
        ])

        if (sewaTransactions.length === 0 && prodTransactions.length === 0) {
            return { success: false, error: "Tidak ada transaksi valid yang belum ditagih." }
        }

        const isCombined = sewaTransactions.length > 0 && prodTransactions.length > 0
        const isSewaOnly = sewaTransactions.length > 0 && prodTransactions.length === 0
        const invoice_type = isCombined ? "COMBINED" : (isSewaOnly ? "SEWA" : "READYMIX")

        // Resolve customer and project
        let customerId: string
        let customer: any
        let projectId: string | null = null
        let project: any = null

        if (prodTransactions.length > 0) {
            project = prodTransactions[0].project
            projectId = prodTransactions[0].projectId
            customerId = project.customerId
            customer = project.customer
        } else {
            customer = sewaTransactions[0].customer
            customerId = sewaTransactions[0].customerId
            project = sewaTransactions[0].project
            projectId = params.projectId && !params.projectId.startsWith("SEWA_") ? params.projectId : (sewaTransactions[0].projectId || null)
        }

        const itemsData: any[] = []
        let sewaDppSubtotal = 0   // DPP sewa (basis PPN)
        let rmDppSubtotal = 0     // DPP ReadyMix (basis PPN)

        // 1. Process Sewa items
        // Gunakan DPP (sebelum PPN) sebagai subtotal basis agar PPN tidak double-count
        for (const tx of sewaTransactions) {
            // Ambil DPP yang sudah tersimpan di transaksi, atau hitung dari total_price
            let dpp: number
            if (tx.ppn_mode === "INCLUDE") {
                // total_price sudah include PPN → ambil dpp_amount tersimpan, atau hitung ulang
                dpp = tx.dpp_amount ?? (tx.total_price / (1 + (tx.ppn_rate ?? 11) / 100))
            } else {
                // EXCLUDE atau NON_PPN → total_price = DPP
                dpp = tx.total_price || (tx.price_per_day * tx.total_days)
            }
            sewaDppSubtotal += dpp
            const eqName = tx.vehicle ? `${tx.vehicle.category?.name || "Unit"} ${tx.vehicle.code}` : (tx.equipment?.nama_alat || "Alat Sewa")
            const eqCode = tx.vehicle?.code || tx.equipment?.kode_alat || "-"
            itemsData.push({
                item_type: "SEWA",
                sewaTransactionId: tx.id,
                description: `Sewa ${eqName} (${eqCode}) - ${tx.total_days} Hari [${tx.operator?.name ?? "-"}]`,
                quantity: tx.total_days,
                unit_price: tx.price_per_day,
                subtotal: dpp,
            })
        }

        // 2. Process ReadyMix items
        if (prodTransactions.length > 0) {
            const projPrices = project?.prices || []
            const unpriced = prodTransactions.filter(tx => !projPrices.find((p: any) => 
                p.qualityId === tx.qualityId || 
                (p.concreteQuality?.name && tx.concreteQuality?.name && p.concreteQuality.name.toLowerCase() === tx.concreteQuality.name.toLowerCase())
            ))
            if (unpriced.length > 0) {
                const names = [...new Set(unpriced.map(t => t.concreteQuality?.name || "Mutu"))]
                return { success: false, error: `Harga belum diset untuk mutu beton: ${names.join(", ")}` }
            }

            for (const tx of prodTransactions) {
                const priceEntry = projPrices.find((p: any) => 
                    p.qualityId === tx.qualityId || 
                    (p.concreteQuality?.name && tx.concreteQuality?.name && p.concreteQuality.name.toLowerCase() === tx.concreteQuality.name.toLowerCase())
                )!
                const rawPrice = priceEntry.price
                const rmPpnMode = priceEntry.ppn_mode || "NON_PPN"
                const rmPpnRate = priceEntry.ppn_rate ?? 11
                // Konversi harga ke DPP agar PPN tidak double-count
                let dppPrice: number
                if (rmPpnMode === "INCLUDE") {
                    dppPrice = rawPrice / (1 + rmPpnRate / 100)
                } else {
                    // EXCLUDE atau NON_PPN → price sudah = DPP
                    dppPrice = rawPrice
                }
                const lineTotal = tx.volume_cubic * dppPrice
                rmDppSubtotal += lineTotal
                itemsData.push({
                    item_type: "READYMIX",
                    transactionId: tx.id,
                    quantity: tx.volume_cubic,
                    unit_price: dppPrice,
                    subtotal: lineTotal,
                    description: tx.concreteQuality?.name || "ReadyMix",
                })
            }
        }

        const subtotal = sewaDppSubtotal + rmDppSubtotal

        // Tax: untuk sewa hitung PPN per transaksi sewa, untuk RM dari tarif PPN proyek
        let taxAmount = 0
        if (params.includePpn) {
            for (const tx of sewaTransactions) {
                const sRate = (tx.ppn_rate ?? 11) / 100
                const txDpp = tx.ppn_mode === "INCLUDE"
                    ? (tx.dpp_amount ?? (tx.total_price / (1 + sRate)))
                    : (tx.total_price || (tx.price_per_day * tx.total_days))
                taxAmount += txDpp * sRate
            }
            if (rmDppSubtotal > 0) {
                const rmTaxRate = ((project?.tax_ppn !== undefined && project?.tax_ppn !== null) ? project.tax_ppn : 11) / 100
                taxAmount += rmDppSubtotal * rmTaxRate
            }
        }
        const totalAmount = subtotal + taxAmount

        // Location ID
        const locationId = prodTransactions[0]?.locationId || sewaTransactions[0]?.locationId || session.user.locationId!

        // Generate sequenced number
        const now = new Date()
        const seq = await getNextInvoiceSeq(locationId, now)
        const customerSeq = params.customerSeqOverride ?? await getCustomerInvoiceSeq(customerId)
        const initials = params.initialsOverride?.toUpperCase().trim() || extractInitials(customer.customer_name)
        const invoiceNumber = buildInvoiceNumber(seq, customerSeq, initials, now)

        const invoice = await prisma.invoice.create({
            data: {
                invoice_number: invoiceNumber,
                projectId,
                customerId,
                invoice_type,
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
            description: `Invoice ${invoice_type} ${invoiceNumber} dibuat untuk ${customer.customer_name} — Total Rp ${totalAmount.toLocaleString("id-ID")}`,
            metadata: {
                invoiceNumber,
                customerId,
                total: totalAmount,
                txCount: itemsData.length,
                type: invoice_type,
                sewaCount: sewaTransactions.length,
                rmCount: prodTransactions.length,
            },
        })

        revalidatePath("/admin/billing")
        revalidatePath("/admin/sewa")
        return { success: true, invoiceId: invoice.id }
    } catch (e: any) {
        if (e.code === "P2002") return { success: false, error: "Nomor invoice sudah dipakai, ubah suffix." }
        console.error("Error creating invoice:", e)
        return { success: false, error: e.message || "Gagal membuat invoice" }
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

        let targetPaymentDate: Date
        if (!params.paymentDate) {
            targetPaymentDate = new Date()
        } else if (params.paymentDate.includes("T")) {
            targetPaymentDate = new Date(params.paymentDate)
        } else {
            targetPaymentDate = new Date(`${params.paymentDate}T12:00:00.000Z`)
        }

        const payment = await prisma.payment.create({
            data: {
                invoiceId: params.invoiceId,
                payment_date: targetPaymentDate,
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

        const paymentDateStr = targetPaymentDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
        await writeBillingLog({
            action: "PAYMENT_RECORDED",
            invoiceId: params.invoiceId,
            paymentId: payment.id,
            description: `Pembayaran Rp ${params.amount.toLocaleString("id-ID")} via ${params.method} (Tgl Bayar: ${paymentDateStr}) — status: ${newStatus}`,
            metadata: { 
                amount: params.amount, 
                method: params.method, 
                paymentDate: targetPaymentDate.toISOString(),
                newPaid, 
                status: newStatus 
            },
        })

        revalidatePath("/admin/billing")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function cancelPayment(paymentId: string, reason: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }
    if (!["AdminBP", "SuperAdminBP"].includes(session.user.role ?? ""))
        return { success: false, error: "Akses ditolak" }
    if (!reason.trim()) return { success: false, error: "Alasan cancel wajib diisi" }

    try {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { invoice: true },
        })
        if (!payment) return { success: false, error: "Pembayaran tidak ditemukan" }
        if (payment.is_cancelled) return { success: false, error: "Pembayaran sudah dicancel" }

        // Soft cancel the payment
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                is_cancelled: true,
                cancel_reason: reason.trim(),
                cancelled_at: new Date(),
            },
        })

        // Recalculate invoice paid_amount from remaining active payments
        const activePayments = await prisma.payment.findMany({
            where: { invoiceId: payment.invoiceId, is_cancelled: false },
        })
        const newPaid = activePayments.reduce((s, p) => s + p.amount, 0)
        const inv = payment.invoice
        let newStatus: InvoiceStatus =
            newPaid <= 0 ? "ISSUED"
                : newPaid >= inv.total_amount ? "PAID"
                    : "PARTIAL"
        // Keep CANCELLED status if invoice is cancelled
        if (inv.status === "CANCELLED") newStatus = "CANCELLED"

        await prisma.invoice.update({
            where: { id: payment.invoiceId },
            data: { paid_amount: newPaid, status: newStatus },
        })

        await writeBillingLog({
            action: "PAYMENT_CANCELLED",
            invoiceId: payment.invoiceId,
            paymentId,
            description: `Pembayaran Rp ${payment.amount.toLocaleString("id-ID")} dicancel. Alasan: ${reason.trim()}`,
            metadata: { amount: payment.amount, reason, newPaid, newStatus },
        })

        revalidatePath("/admin/billing")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function cancelInvoice(invoiceId: string, reason: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }
    if (!["AdminBP", "SuperAdminBP"].includes(session.user.role ?? ""))
        return { success: false, error: "Akses ditolak" }
    if (!reason.trim()) return { success: false, error: "Alasan cancel wajib diisi" }

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                project: { include: { customer: true } },
                customer: true,
                items: {
                    include: {
                        transaction: {
                            include: { concreteQuality: true, vehicle: true, driver: true }
                        },
                        sewaTransaction: {
                            include: { equipment: true, operator: true, vehicle: true }
                        }
                    }
                },
                payments: true,
            }
        })
        if (!invoice) return { success: false, error: "Invoice tidak ditemukan" }
        if (invoice.status === "CANCELLED") return { success: false, error: "Invoice sudah dibatalkan sebelumnya" }

        // Validasi pembayaran aktif
        const activePayments = invoice.payments.filter(p => !p.is_cancelled)
        if (activePayments.length > 0) {
            return {
                success: false,
                error: `Invoice memiliki ${activePayments.length} pembayaran aktif. Batalkan pembayaran terlebih dahulu sebelum membatalkan invoice.`
            }
        }

        // Siapkan snapshot item yang akan dilepas ke Unbilled Pool
        const releasedItems: any[] = []
        for (const item of invoice.items) {
            if (item.transaction) {
                releasedItems.push({
                    type: "READYMIX",
                    transactionId: item.transactionId,
                    date: item.transaction.date,
                    tripSequence: item.transaction.trip_sequence,
                    quality: item.transaction.concreteQuality?.name || "ReadyMix",
                    volume: item.quantity,
                    price: item.unit_price,
                    subtotal: item.subtotal,
                    vehicle: item.transaction.vehicle?.code || "-",
                    driver: item.transaction.driver?.name || "-",
                })
            } else if (item.sewaTransaction) {
                releasedItems.push({
                    type: "SEWA",
                    sewaTransactionId: item.sewaTransactionId,
                    sewaNumber: item.sewaTransaction.sewa_number,
                    date: item.sewaTransaction.date,
                    equipment: item.sewaTransaction.equipment?.nama_alat || item.sewaTransaction.vehicle?.code || "Alat Sewa",
                    operator: item.sewaTransaction.operator?.name || "-",
                    days: item.quantity,
                    price: item.unit_price,
                    subtotal: item.subtotal,
                })
            } else {
                releasedItems.push({
                    type: item.item_type,
                    description: item.description,
                    quantity: item.quantity,
                    price: item.unit_price,
                    subtotal: item.subtotal,
                })
            }
        }

        const customerName = invoice.customer?.customer_name || invoice.project?.customer?.customer_name || "-"
        const projectName = invoice.project?.name || "Penyewaan Alat & Kendaraan"
        const actorName = `${session.user.username || "Admin"} (${session.user.role})`

        const logMetadata = {
            invoiceNumber: invoice.invoice_number,
            customerName,
            projectName,
            cancelledBy: actorName,
            cancelledAt: new Date().toISOString(),
            reason: reason.trim(),
            financialSnapshot: {
                subtotal: invoice.subtotal,
                taxAmount: invoice.tax_amount,
                totalAmount: invoice.total_amount,
            },
            releasedItems,
            returnedToUnbilledCount: releasedItems.length,
        }

        // Jalankan transaksi atomik:
        // 1. Simpan snapshot deskripsi pada InvoiceItem dan set transactionId / sewaTransactionId ke null (melepaskan transaksi ke unbilled)
        // 2. Update status invoice menjadi CANCELLED
        await prisma.$transaction(async (tx) => {
            for (const item of invoice.items) {
                let snapshotDesc = item.description
                if (!snapshotDesc) {
                    if (item.transaction) {
                        snapshotDesc = `${item.transaction.concreteQuality?.name || "ReadyMix"} (${item.quantity} m³) - ${item.transaction.vehicle?.code || "TM"} - Trip #${item.transaction.trip_sequence}`
                    } else if (item.sewaTransaction) {
                        snapshotDesc = `${item.sewaTransaction.equipment?.nama_alat || item.sewaTransaction.vehicle?.code || "Sewa"} (${item.quantity} hari) - No. ${item.sewaTransaction.sewa_number}`
                    }
                }

                await tx.invoiceItem.update({
                    where: { id: item.id },
                    data: {
                        transactionId: null,
                        sewaTransactionId: null,
                        description: snapshotDesc,
                    }
                })
            }

            await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    status: "CANCELLED",
                    cancel_reason: reason.trim(),
                    cancelled_at: new Date(),
                },
            })
        })

        // Tulis log audit ke BillingLog
        await writeBillingLog({
            action: "INVOICE_CANCELLED",
            invoiceId,
            description: `Invoice ${invoice.invoice_number} dibatalkan oleh ${actorName}. Alasan: ${reason.trim()}. ${releasedItems.length} transaksi dikembalikan ke Unbilled Pool.`,
            metadata: logMetadata,
        })

        revalidatePath("/admin/billing")
        revalidatePath("/admin/sewa")
        revalidatePath("/admin")
        return { success: true, releasedCount: releasedItems.length }
    } catch (e: any) {
        console.error("Error cancelling invoice:", e)
        return { success: false, error: e.message || "Gagal membatalkan invoice" }
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

export async function updatePaymentProof(paymentId: string, proofUrl: string) {
    const session = await auth()
    if (!session?.user?.employeeId) return { success: false, error: "Unauthorized" }
    if (!["AdminBP", "SuperAdminBP"].includes(session.user.role ?? ""))
        return { success: false, error: "Akses ditolak" }

    try {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { invoice: true },
        })
        if (!payment) return { success: false, error: "Pembayaran tidak ditemukan" }

        await prisma.payment.update({
            where: { id: paymentId },
            data: { proof_url: proofUrl },
        })

        await writeBillingLog({
            action: "PAYMENT_RECORDED",
            invoiceId: payment.invoiceId,
            paymentId: payment.id,
            description: `Lampiran bukti pembayaran diunggah untuk pembayaran Rp ${payment.amount.toLocaleString("id-ID")}`,
            metadata: { proofUrl },
        })

        revalidatePath("/admin/billing")
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function getBillingPageData(filters: { 
    locationId?: string
    startDate?: string
    endDate?: string
    customerId?: string
} = {}) {
    const session = await auth()
    if (!session?.user?.employeeId) return null

    const isCorp = isCorporateUser(session.user)
    const locationId = isCorp
        ? (filters.locationId && filters.locationId !== "all" ? filters.locationId : undefined)
        : (session.user.locationId || undefined)

    const [unbilled, grouped, deposits] = await Promise.all([
        getUnbilledTransactions({ 
            locationId, 
            startDate: filters.startDate, 
            endDate: filters.endDate, 
            customerId: filters.customerId 
        }),
        getInvoicesGroupedByCustomer({ 
            locationId, 
            startDate: filters.startDate, 
            endDate: filters.endDate, 
            customerId: filters.customerId 
        }),
        getDepositSummary({ locationId }),
    ])

    return { unbilled, grouped, deposits, isSuperAdmin: isCorp, userLocationId: session.user.locationId }
}

