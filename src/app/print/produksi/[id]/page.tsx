// Print page: Surat Jalan
// Route: /print/produksi/[id]
// Replaces the old HTML+CSS inline approach

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { SuratJalanPrintClient } from "./client"

export default async function PrintSuratJalanPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const transaction = await prisma.productionTransaction.findUnique({
        where: { id },
        include: {
            project: { include: { customer: true } },
            vehicle: true,
            driver: true,
            concreteQuality: true,
            workItem: true,
            location: true,
            createdBy: true,
        },
    })

    if (!transaction) return notFound()

    // Serialize dates to strings (can't pass Date objects to client components)
    const tx = {
        ...transaction,
        date: transaction.date.toISOString(),
        project: {
            ...transaction.project,
            customer: transaction.project.customer,
        },
    }

    return <SuratJalanPrintClient tx={tx} />
}
