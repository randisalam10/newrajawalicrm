// Print page: Invoice
// Route: /print/invoice/[id]
// Replaces old HTML inline + inline style approach

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { InvoicePrintClient } from "./client"

export default async function PrintInvoicePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            project: { include: { customer: true } },
            customer: true,
            items: {
                include: {
                    transaction: { include: { concreteQuality: true, vehicle: true } },
                    sewaTransaction: { include: { equipment: true, operator: true } },
                },
                orderBy: { id: "asc" },
            },
            payments: { orderBy: { payment_date: "asc" } },
            location: true,
        },
    })

    if (!invoice) notFound()

    // Urutkan item invoice ascending berdasarkan tanggal transaksi
    const sortedItems = [...invoice.items].sort((a, b) => {
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

    // Serialize all dates for client component
    const data = {
        ...invoice,
        issue_date: invoice.issue_date.toISOString(),
        due_date: invoice.due_date?.toISOString() ?? null,
        createdAt: invoice.createdAt.toISOString(),
        cancelled_at: invoice.cancelled_at?.toISOString() ?? null,
        items: sortedItems.map(item => ({
            ...item,
            transaction: item.transaction ? {
                ...item.transaction,
                date: item.transaction.date.toISOString(),
            } : null,
            sewaTransaction: item.sewaTransaction ? {
                ...item.sewaTransaction,
                date: item.sewaTransaction.date.toISOString(),
                start_date: item.sewaTransaction.start_date.toISOString(),
                end_date: item.sewaTransaction.end_date.toISOString(),
            } : null,
        })),
        payments: invoice.payments.map(p => ({
            ...p,
            payment_date: p.payment_date.toISOString(),
            createdAt: p.createdAt.toISOString(),
            cancelled_at: p.cancelled_at?.toISOString() ?? null,
        })),
    }

    return <InvoicePrintClient invoice={data} />
}
