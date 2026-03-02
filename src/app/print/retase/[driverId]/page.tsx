// Print page: Retase Sopir
// Route: /print/retase/[driverId]
// Query params: ?month=1-12&year=2025&locationId=xxx

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { RetasePrintClient } from "./client"

export default async function PrintRetasePage({
    params,
    searchParams,
}: {
    params: Promise<{ driverId: string }>
    searchParams: Promise<{ month?: string; year?: string; locationId?: string }>
}) {
    const { driverId } = await params
    const { month, year, locationId } = await searchParams

    const now = new Date()
    const m = parseInt(month ?? String(now.getMonth() + 1))
    const y = parseInt(year ?? String(now.getFullYear()))

    const startDate = new Date(y, m - 1, 1)
    const endDate = new Date(y, m, 0, 23, 59, 59)

    // Fetch driver info
    const driver = await prisma.employee.findUnique({
        where: { id: driverId },
    })
    if (!driver) return notFound()

    // Fetch transactions with retase
    const transactions = await prisma.productionTransaction.findMany({
        where: {
            driverId,
            status: "Confirmed",
            date: { gte: startDate, lte: endDate },
            ...(locationId ? { locationId } : {}),
            retase: { isNot: null },
        },
        include: {
            retase: true,
            project: { include: { customer: true } },
            concreteQuality: true,
            vehicle: true,
        },
        orderBy: { date: "asc" },
    })

    // Fetch location name
    let locationName = "PT. Rajawali Mix"
    if (locationId) {
        const loc = await prisma.location.findUnique({ where: { id: locationId } })
        if (loc) locationName = `PT. Rajawali Mix — ${loc.name}`
    }

    // Aggregate
    const totalTrip = transactions.length
    const totalVolume = transactions.reduce((s, t) => s + t.volume_cubic, 0)
    const totalKm = transactions.reduce((s, t) => s + (t.retase?.calculated_distance ?? 0), 0)
    const totalIncome = transactions.reduce((s, t) => s + (t.retase?.income_amount ?? 0), 0)

    // Serialize dates
    const records = transactions.map(tx => ({
        id: tx.id,
        date: tx.date.toISOString(),
        volume_cubic: tx.volume_cubic,
        project: {
            name: tx.project.name,
            customer: { customer_name: tx.project.customer.customer_name },
        },
        concreteQuality: { name: tx.concreteQuality.name },
        retase: tx.retase ? {
            calculated_distance: tx.retase.calculated_distance,
            price_per_cubic_km: tx.retase.price_per_cubic_km,
            income_amount: tx.retase.income_amount,
        } : undefined,
    }))

    const driverData = {
        driverId,
        name: driver.name,
        vehicleCode: transactions[0]?.vehicle?.code ?? "-",
        totalTrip,
        totalVolume,
        totalKm,
        totalIncome,
        records,
    }

    return (
        <RetasePrintClient
            driver={driverData}
            year={y}
            month={m}
            locationName={locationName}
        />
    )
}
