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
            items: {
                include: {
                    transaction: { include: { concreteQuality: true, vehicle: true } },
                },
                orderBy: { transaction: { date: "asc" } },
            },
            payments: { orderBy: { payment_date: "asc" } },
            location: true,
        },
    })

    if (!invoice) notFound()

    // Serialize all dates for client component
    const data = {
        ...invoice,
        issue_date: invoice.issue_date.toISOString(),
        due_date: invoice.due_date?.toISOString() ?? null,
        createdAt: invoice.createdAt.toISOString(),
        cancelled_at: invoice.cancelled_at?.toISOString() ?? null,
        items: invoice.items.map(item => ({
            ...item,
            transaction: {
                ...item.transaction,
                date: item.transaction.date.toISOString(),
            },
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
