import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { SewaPrintClient } from "./client"

export default async function PrintSewaPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const transaction = await prisma.sewaTransaction.findUnique({
        where: { id },
        include: {
            customer: true,
            project: true,
            equipment: true,
            operator: {
                include: { driverCategory: true }
            },
            location: true,
        },
    })

    if (!transaction) return notFound()

    // Serialize Date objects to strings for Client Component
    const tx = {
        ...transaction,
        date: transaction.date.toISOString(),
        start_date: transaction.start_date.toISOString(),
        end_date: transaction.end_date.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
    }

    return <SewaPrintClient tx={tx as any} />
}
